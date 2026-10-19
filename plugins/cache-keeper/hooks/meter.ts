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
  'Plain markdown, under 300 words, these sections:',
  '- Goal: what the user is trying to achieve.',
  '- Done: what is finished and verified, with file paths and commit SHAs.',
  '- In progress: the exact next step and any half-applied change.',
  '- Decisions and constraints: rulings the user made that must not be re-asked.',
  '- Open questions.',
  'Start with the line "Continue from this handoff:". Output only the brief.',
].join('\n')
