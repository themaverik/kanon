const MINUTE = 60_000
const SHORT_TTL_MIN = 5
const LONG_TTL_MIN = 60
const COLD_WRITE_SHARE = 0.8

export type CacheVerdict = 'short' | 'long' | null

/**
 * Infers the cache TTL from the first turn after an idle gap.
 * Only a gap between 5 and 60 minutes tells the two TTLs apart.
 */
export function inferTtl(gapMs: number, priorTokens: number, cacheWriteTokens: number): CacheVerdict {
  const gapMin = gapMs / MINUTE
  if (gapMin <= SHORT_TTL_MIN || gapMin >= LONG_TTL_MIN || priorTokens <= 0) return null
  return cacheWriteTokens >= priorTokens * COLD_WRITE_SHARE ? 'short' : 'long'
}

export function ttlForVerdict(verdict: Exclude<CacheVerdict, null>): number {
  return verdict === 'short' ? SHORT_TTL_MIN : LONG_TTL_MIN
}

/** Lead time for the cold warning: 5 minutes, or a fifth of a shorter TTL. */
export function warnLeadMs(ttlMin: number): number {
  return Math.min(5, ttlMin / 5) * MINUTE
}

export function remainingMs(lastResponseAt: number, ttlMin: number, now: number): number {
  return lastResponseAt + ttlMin * MINUTE - now
}

/** Cache-write multiplier on base input price: 2x for the 1h TTL, 1.25x for 5m. */
export function coldCostUsd(tokens: number, ttlMin: number, inputUsdPerMtok: number, writeUsdPerTok?: number): number {
  const rate = writeUsdPerTok ?? (inputUsdPerMtok / 1_000_000) * (ttlMin > SHORT_TTL_MIN ? 2 : 1.25)
  return tokens * rate
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(n)
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'cold'
  const min = Math.ceil(ms / MINUTE)
  return min >= 60 ? `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}` : `${min}m`
}

export type Level = 'ok' | 'warn' | 'high'

export function contextLevel(tokens: number, warnTokens: number): Level {
  if (tokens >= warnTokens * 2) return 'high'
  return tokens >= warnTokens ? 'warn' : 'ok'
}

/** Parses `/autohandoff` args: a token count (`80000`, `80k`) or `off`. */
export function parseThreshold(args: string): number | 'off' | null {
  const s = args.trim().toLowerCase()
  if (s === 'off') return 'off'
  const m = /^(\d+(?:\.\d+)?)(k|m)?$/.exec(s)
  if (!m) return null
  const scale = m[2] === 'm' ? 1_000_000 : m[2] === 'k' ? 1_000 : 1
  return Math.round(Number(m[1]) * scale)
}

export const HANDOFF_PROMPT = [
  'Write a handoff brief so a fresh session can continue this work without the transcript.',
  'Plain markdown, short enough to read before pressing Enter: only what the next session needs, in these sections:',
  '- Goal: what the user is trying to achieve.',
  '- Done: what is finished and verified, with file paths and commit SHAs.',
  '- In progress: the exact next step and any half-applied change.',
  '- Decisions and constraints: rulings the user made that must not be re-asked.',
  '- Open questions.',
  'Start with the line "Continue from this handoff:". Output only the brief.',
].join('\n')

export type PlanName = 'pro' | 'max5' | 'max20' | 'team' | 'api'
export type AgentModel = 'haiku' | 'sonnet' | 'opus' | 'fable'
export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

export type Profile = {
  mainModel: AgentModel
  mainEffort: Effort
  agentModel: AgentModel
  agentEffort: Effort
  fablePerSession: number
  roomTokens: number
}

const MAX5: Profile = { mainModel: 'opus', mainEffort: 'medium', agentModel: 'sonnet', agentEffort: 'medium', fablePerSession: 1, roomTokens: 100_000 }

// api: the design's fixed 200k auto window, expressed as room over a ~60k floor.
export const PROFILES: Record<PlanName, Profile> = {
  pro: { mainModel: 'sonnet', mainEffort: 'medium', agentModel: 'sonnet', agentEffort: 'low', fablePerSession: 0, roomTokens: 80_000 },
  max5: MAX5,
  max20: { mainModel: 'opus', mainEffort: 'high', agentModel: 'sonnet', agentEffort: 'medium', fablePerSession: 2, roomTokens: 150_000 },
  team: MAX5,
  api: { mainModel: 'opus', mainEffort: 'medium', agentModel: 'sonnet', agentEffort: 'medium', fablePerSession: 1, roomTokens: 140_000 },
}

export type ProfileOverrides = Partial<Pick<Profile, 'mainEffort' | 'agentModel' | 'agentEffort' | 'fablePerSession' | 'roomTokens'>>

export function resolveProfile(plan: PlanName, overrides: ProfileOverrides): Profile {
  const defined = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== undefined))
  return { ...PROFILES[plan], ...defined }
}

export type Account = { organizationRateLimitTier?: string; organizationType?: string; userRateLimitTier?: string }
export type PlanSource = 'set' | 'auto' | 'assumed'

function planFromTier(tier: string | undefined): PlanName | null {
  if (tier === undefined) return null
  if (tier.endsWith('_max_20x')) return 'max20'
  if (tier.endsWith('_max_5x')) return 'max5'
  if (tier.endsWith('_pro')) return 'pro'
  return null
}

/**
 * `hasRateLimits` is null before the first response reports any: subscriptions
 * read as empty then too, so only the account file can tell.
 */
export function detectPlan(hasRateLimits: boolean | null, account: Account | null): { plan: PlanName; source: PlanSource } {
  if (hasRateLimits === false) return { plan: 'api', source: 'auto' }
  if (account !== null && /team|enterprise/.test(account.organizationType ?? '')) return { plan: 'team', source: 'auto' }
  const plan = planFromTier(account?.organizationRateLimitTier) ?? planFromTier(account?.userRateLimitTier)
  return plan === null ? { plan: 'max5', source: 'assumed' } : { plan, source: 'auto' }
}

export function windowTokens(floor: number | null, roomTokens: number): number | null {
  return floor === null ? null : floor + roomTokens
}

export function isBelowWindow(tokens: number, floor: number | null, roomTokens: number): boolean {
  const w = windowTokens(floor, roomTokens)
  return w !== null && tokens < w
}

const MODEL_RANK: Record<AgentModel, number> = { haiku: 0, sonnet: 1, opus: 2, fable: 3 }
const EFFORT_RANK: Record<Effort, number> = { low: 0, medium: 1, high: 2, xhigh: 3, max: 4 }

export type AgentCall = { model?: AgentModel; effort?: Effort; subagentType?: string }
export type AgentVerdict =
  | { action: 'pass'; isFable: boolean }
  | { action: 'rewrite'; model: AgentModel; effort: Effort; isFableRefused: boolean }

/** A fork always inherits the parent's model, so it is never rewritten. */
export function decideAgent(call: AgentCall, profile: Profile, fableUsed: number): AgentVerdict {
  if (call.subagentType === 'fork') return { action: 'pass', isFable: false }
  const rewrite = (isFableRefused: boolean): AgentVerdict => ({ action: 'rewrite', model: profile.agentModel, effort: profile.agentEffort, isFableRefused })
  if (call.model === 'fable') return fableUsed < profile.fablePerSession ? { action: 'pass', isFable: true } : rewrite(true)
  if (call.model === undefined || MODEL_RANK[call.model] > MODEL_RANK[profile.agentModel]) return rewrite(false)
  if (call.effort !== undefined && EFFORT_RANK[call.effort] > EFFORT_RANK[profile.agentEffort]) return rewrite(false)
  return { action: 'pass', isFable: false }
}

export function modelFamily(model: string): string {
  return /fable|opus|sonnet|haiku/.exec(model)?.[0] ?? model
}

const WEEK_MS = 7 * 24 * 60 * MINUTE

export function isAheadOfWeeklyPace(percentUsed: number | null, resetsAt: number | null, now: number): boolean {
  if (percentUsed === null || resetsAt === null) return false
  const elapsed = 1 - (resetsAt - now) / WEEK_MS
  return percentUsed > Math.min(Math.max(elapsed, 0), 1) * 100
}
