import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { CompactVerdict, Meter, TtlSource } from '../types'
import type { Account, AgentModel, Effort, PlanName, PlanSource, Profile, ProfileOverrides } from './meter'
import {
  HANDOFF_PROMPT,
  coldCostUsd,
  compactLimits,
  contextLevel,
  decideAgent,
  decideCompact,
  detectPlan,
  formatRemaining,
  formatTokens,
  inferTtl,
  isAheadOfWeeklyPace,
  isBelowTarget,
  modelFamily,
  parseThreshold,
  remainingMs,
  resolveProfile,
  ttlForVerdict,
  warnLeadMs,
} from './meter'

const TICK_MS = 30_000
const COMPACT_DELAY_MS = 2_000
// The engine's own auto-compaction at this share of the model window means the prompt may not fit: never veto it.
const NEVER_VETO_PERCENT = 80
const EDIT_TOOLS = ['Edit', 'Write', 'NotebookEdit'] as const
// The theme's orange: `warning` is amber, and a theme key follows light and dark themes.
const ORANGE = 'claude'
const EMPTY: Meter = {
  lastResponseAt: null,
  contextTokens: null,
  contextPercent: null,
  fiveHour: null,
  sevenDay: null,
  sevenDayResetsAt: null,
  costUsd: null,
}

const meter = atom({ plugin: 'cache-keeper', key: 'meter' } as const, EMPTY)
const tick = atom({ plugin: 'cache-keeper', key: 'tick' } as const, 0)
const isBusy = atom({ plugin: 'cache-keeper', key: 'isBusy' } as const, false)
const floor = atom({ plugin: 'cache-keeper', key: 'floor' } as const, null as number | null)
const fableUsed = atom({ plugin: 'cache-keeper', key: 'fableUsed' } as const, 0)
const liveEffort = atom({ plugin: 'cache-keeper', key: 'liveEffort' } as const, null as string | null)
const verdict = atom({ plugin: 'cache-keeper', key: 'verdict' } as const, { action: 'none' } as CompactVerdict)

type Usage = Awaited<ReturnType<EngineInterface['session']['usage']>>

function fromUsage(m: Meter, u: Pick<Usage, 'context' | 'rateLimits' | 'cost'>): Meter {
  const limit = (kind: string) => u.rateLimits.find(r => r.kind === kind)?.percentUsed ?? null
  const weekReset = u.rateLimits.find(r => r.kind === 'seven_day')?.resetsAt
  return {
    ...m,
    contextTokens: u.context.tokens ?? m.contextTokens,
    contextPercent: u.context.percent ?? m.contextPercent,
    fiveHour: limit('five_hour'),
    sevenDay: limit('seven_day'),
    sevenDayResetsAt: weekReset === undefined ? null : Date.parse(weekReset),
    costUsd: u.cost?.usd ?? m.costUsd,
  }
}

type Config = {
  ttlMinutes: number
  warnTokens: number
  inputUsdPerMtok: number
  profile: PlanName | 'auto'
  isEnforced: boolean
  isAutoCompact: boolean
  isProfileShown: boolean
  overrides: ProfileOverrides
}

let cfg: Config = {
  ttlMinutes: 60,
  warnTokens: 50_000,
  inputUsdPerMtok: 5,
  profile: 'auto',
  isEnforced: false,
  isAutoCompact: false,
  isProfileShown: true,
  overrides: {},
}
let turnStartedAt = 0
let turnEdits = 0
let isWarned = false
let actedStage: 'none' | 'target' | 'ceiling' = 'none'
let account: Promise<Account | null> | null = null

function readOverrides(options: Record<string, unknown>): ProfileOverrides {
  const pick = <T extends string>(v: unknown) => (v === undefined || v === 'profile' ? undefined : (v as T))
  const fable = Number(options.fablePerSession ?? -1)
  const room = Number(options.compactRoomTokens ?? 0)
  const cap = Number(options.compactCapTokens ?? 0)
  const grace = Number(options.compactGraceTokens ?? -1)
  return {
    agentModel: pick<AgentModel>(options.agentModel),
    agentEffort: pick<Effort>(options.agentEffort),
    mainEffort: pick<Effort>(options.mainEffort),
    fablePerSession: fable >= 0 ? fable : undefined,
    roomTokens: room > 0 ? room : undefined,
    capTokens: cap > 0 ? cap : undefined,
    graceTokens: grace >= 0 ? grace : undefined,
  }
}

async function readAccount($: EngineInterface): Promise<Account | null> {
  const dir = (await $.env.get('CLAUDE_CONFIG_DIR')) ?? (await $.env.get('HOME'))
  if (dir === undefined) return null
  try {
    const parsed = JSON.parse(await $.fs.read(`${dir}/.claude.json`)) as { oauthAccount?: Account }
    return parsed.oauthAccount ?? null
  } catch {
    return null
  }
}

type Active = { plan: PlanName; source: PlanSource; profile: Profile }

async function activeProfile($: EngineInterface): Promise<Active> {
  if (cfg.profile !== 'auto') return { plan: cfg.profile, source: 'set', profile: resolveProfile(cfg.profile, cfg.overrides) }
  const m = await read($, meter)
  const hasRateLimits = m.lastResponseAt === null ? null : m.fiveHour !== null || m.sevenDay !== null
  account ??= readAccount($)
  const { plan, source } = detectPlan(hasRateLimits, await account)
  return { plan, source, profile: resolveProfile(plan, cfg.overrides) }
}

async function resetSession($: EngineInterface): Promise<void> {
  await update($, floor, () => null)
  await update($, fableUsed, () => 0)
  await afterCompaction($)
}

async function afterCompaction($: EngineInterface): Promise<void> {
  await update($, floor, () => null)
  await update($, verdict, () => ({ action: 'none' }) as CompactVerdict)
  actedStage = 'none'
}

async function compactNow($: EngineInterface): Promise<void> {
  try {
    const r = await $.session.compact()
    if (r.skip === undefined) await afterCompaction($)
  } catch {
    // A turn started first: the next turn.complete decides again.
    actedStage = 'none'
  }
}

async function askToCompact($: EngineInterface, tokens: number, v: Extract<CompactVerdict, { action: 'compact' }>): Promise<void> {
  const why = v.reason === 'ceiling' ? `reached the ${formatTokens(v.limits.ceiling)} ceiling` : `passed ${formatTokens(v.limits.target)} with work in flight`
  try {
    const answer = await $.ui.ask(`Context ${formatTokens(tokens)} ${why}. Compact now?`, ['Compact', 'Handoff & Clear', 'Keep going'])
    if (answer === 'Compact') await compactNow($)
    if (answer === 'Handoff & Clear') await handoff($)
  } catch {
    // Dismissed: the band's Handoff button stays.
  }
}

/** Acts once per stage: a heavy turn past target, then again at the ceiling. */
async function actOnVerdict($: EngineInterface, tokens: number, v: CompactVerdict): Promise<void> {
  if (v.action !== 'compact') return
  const stage = v.reason === 'ceiling' ? 'ceiling' : 'target'
  if (actedStage === 'ceiling' || actedStage === stage) return
  actedStage = stage
  if (cfg.isAutoCompact) $.clock.after(COMPACT_DELAY_MS, () => void compactNow($))
  else void askToCompact($, tokens, v)
}

async function ttl($: EngineInterface): Promise<{ minutes: number; source: TtlSource }> {
  const stored = (await $.store.get('ttl')) as { minutes: number; source: TtlSource } | undefined
  return stored ?? { minutes: cfg.ttlMinutes, source: 'config' }
}

async function coldUsd($: EngineInterface, tokens: number, ttlMin: number): Promise<number> {
  const rate = (await $.store.get('writeUsdPerTok')) as number | undefined
  return coldCostUsd(tokens, ttlMin, cfg.inputUsdPerMtok, rate)
}

async function handoff($: EngineInterface): Promise<void> {
  if (await read($, isBusy)) return
  await update($, isBusy, () => true)
  try {
    $.ui.toast('Writing handoff brief...')
    const reply = await $.model.fork({ prompt: HANDOFF_PROMPT })
    if (!reply.isAnswered) {
      $.ui.toast(`Handoff failed: ${reply.reason}. Session left as is.`)
      return
    }
    await $.store.set('lastBrief', reply.text)
    await $.command.run({ command: 'clear' })
    await update($, meter, () => EMPTY)
    await resetSession($)
    isWarned = false
    await $.prompt.fill({ text: reply.text })
    $.ui.toast('Fresh session. Handoff brief is in the prompt: review, then Enter.')
  } finally {
    await update($, isBusy, () => false)
  }
}

async function fresh($: EngineInterface): Promise<void> {
  await $.command.run({ command: 'clear' })
  await update($, meter, () => EMPTY)
  await resetSession($)
  isWarned = false
}

async function checkCold($: EngineInterface): Promise<void> {
  const m = await read($, meter)
  if (isWarned || m.lastResponseAt === null) return
  const { minutes } = await ttl($)
  const left = remainingMs(m.lastResponseAt, minutes, await $.clock.now())
  if (left <= 0 || left > warnLeadMs(minutes)) return
  isWarned = true
  const usd = await coldUsd($, m.contextTokens ?? 0, minutes)
  $.ui.toast(`Prompt cache goes cold in ${formatRemaining(left)}. After that the next message re-caches ~$${usd.toFixed(2)}.`, { timeoutMs: 15_000 })
}

async function tickAndCheck($: EngineInterface): Promise<void> {
  await update($, tick, n => n + 1)
  await checkCold($)
}

async function profileLine($: EngineInterface, m: Meter, now: number): Promise<{ text: string; isWarned: boolean }> {
  const { plan, source, profile } = await activeProfile($)
  const used = await read($, fableUsed)
  const measured = await read($, floor)
  const effort = (await read($, liveEffort)) ?? '?'
  const model = modelFamily(await $.session.model())
  const limits = compactLimits(measured, profile)
  const v = await read($, verdict)
  const compact =
    limits === null
      ? `compact @floor+${formatTokens(profile.roomTokens)} cap ${formatTokens(profile.capTokens)}`
      : `compact @${formatTokens(limits.target)}-${formatTokens(limits.ceiling)} floor ${formatTokens(measured!)}${verdictTag(v)}`
  const tag = source === 'set' ? '' : ` (${source})`
  const isFableSpent = profile.fablePerSession > 0 && used >= profile.fablePerSession
  return {
    text: [
      `Profile ${plan}${tag}`,
      `main ${model}/${effort}`,
      `agents ${profile.agentModel}/${profile.agentEffort}`,
      `fable ${used}/${profile.fablePerSession}`,
      compact,
      cfg.isEnforced ? 'enforced' : 'display only',
    ].join(' · '),
    isWarned: isFableSpent || v.action === 'compact' || isAheadOfWeeklyPace(m.sevenDay, m.sevenDayResetsAt, now),
  }
}

function verdictTag(v: CompactVerdict): string {
  if (v.action === 'hold') return ' (holding: light turn)'
  if (v.action === 'compact') return v.reason === 'ceiling' ? ' (due: ceiling)' : ' (due: heavy work)'
  return ''
}

export const register: Register = (on, options) => {
  cfg = {
    ttlMinutes: Number(options.ttlMinutes ?? 60),
    warnTokens: Number(options.warnTokens ?? 50_000),
    inputUsdPerMtok: Number(options.inputUsdPerMtok ?? 5),
    profile: (options.profile ?? 'auto') as Config['profile'],
    isEnforced: options.enforce === true,
    isAutoCompact: options.autoCompact === true,
    isProfileShown: options.showProfile !== false,
    overrides: readOverrides(options),
  }
  const configTtl = cfg.ttlMinutes
  const warnTokens = cfg.warnTokens

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'handoff', description: 'Write a handoff brief, clear, and paste it into the fresh session', argumentHint: '[now]' })
    await $.command.register({ name: 'autohandoff', description: 'Hand off automatically once context reaches N tokens', argumentHint: '<tokens|80k|off>' })
    await $.command.register({ name: 'cache-ttl', description: 'Set the prompt-cache TTL in minutes, or auto to detect', argumentHint: '<minutes|auto>' })
    const u = await $.session.usage()
    await update($, meter, m => fromUsage(m, u))
    await resetSession($)
    $.clock.every(TICK_MS, () => tickAndCheck($))
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await update($, meter, m => fromUsage(m, e))
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    turnStartedAt = await $.clock.now()
    return next(e)
  })

  for (const tool of EDIT_TOOLS) {
    on('tool.call', { tool }, async ($, e, next) => {
      if (e.agentId === undefined) turnEdits += 1
      return next(e)
    })
  }

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    const now = await $.clock.now()
    const prior = await read($, meter)
    const current = await ttl($)
    if (e.usage && prior.lastResponseAt !== null && current.source !== 'manual') {
      const verdict = inferTtl(turnStartedAt - prior.lastResponseAt, prior.contextTokens ?? 0, e.usage.cache_creation_input_tokens)
      if (verdict !== null) await $.store.set('ttl', { minutes: ttlForVerdict(verdict), source: 'detected' })
    }
    const u = await $.session.usage()
    const m = fromUsage({ ...prior, lastResponseAt: now }, u)
    await update($, meter, () => m)
    isWarned = false

    const tokens = m.contextTokens ?? 0
    const measured = await read($, floor)
    if (measured === null && tokens > 0) await update($, floor, () => tokens)
    const { profile } = await activeProfile($)
    const work = { growthTokens: tokens - (prior.contextTokens ?? tokens), edits: turnEdits }
    turnEdits = 0
    const v = decideCompact(tokens, measured, profile, work)
    await update($, verdict, () => v)
    if (cfg.isEnforced && !e.isAborted) await actOnVerdict($, tokens, v)

    const threshold = (await $.store.get('autohandoff')) as number | undefined
    if (threshold !== undefined && (m.contextTokens ?? 0) >= threshold && !e.isAborted) {
      $.ui.toast(`Context ${formatTokens(m.contextTokens ?? 0)} passed /autohandoff ${formatTokens(threshold)}.`)
      void handoff($)
    }
    return next(e)
  })

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') await resetSession($)
    return next(e)
  })

  on('session.compact', async ($, e, next) => {
    if (e.agentId !== undefined || e.trigger === 'precompute') return next(e)
    const m = await read($, meter)
    const tokens = m.contextTokens ?? 0
    const measured = await read($, floor)
    const { profile } = await activeProfile($)
    const isNearModelLimit = (m.contextPercent ?? 0) >= NEVER_VETO_PERCENT
    if (cfg.isEnforced && e.trigger === 'auto' && !isNearModelLimit && isBelowTarget(tokens, measured, profile)) {
      return { skip: `cache-keeper: ${formatTokens(tokens)} is under the ${formatTokens(compactLimits(measured, profile)!.target)} target (floor + room).` }
    }
    const r = await next(e)
    if (r.skip === undefined) await afterCompaction($)
    return r
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId !== undefined) return yield* next(e)
    const target = cfg.isEnforced && e.effort !== undefined ? (await activeProfile($)).profile.mainEffort : e.effort
    const sent = target === undefined ? null : String(target)
    if ((await read($, liveEffort)) !== sent) await update($, liveEffort, () => sent)
    return yield* next(target === e.effort ? e : { ...e, effort: target })
  })

  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    const { profile } = await activeProfile($)
    const used = await read($, fableUsed)
    const verdict = decideAgent({ model: e.model, effort: e.effort, subagentType: e.subagent_type }, profile, used)
    if (verdict.action === 'pass') {
      if (verdict.isFable) await update($, fableUsed, n => n + 1)
      return next(e)
    }
    if (!cfg.isEnforced) {
      if (e.model === 'fable') await update($, fableUsed, n => n + 1)
      return next(e)
    }
    if (verdict.isFableRefused) $.ui.toast(`Fable allowance spent (${used}/${profile.fablePerSession}). Agent "${e.description}" runs on ${verdict.model}/${verdict.effort}.`)
    return next({ ...e, model: verdict.model, effort: verdict.effort })
  })

  on('classic.SessionStart', async ($, e, next) => {
    if (e.estimated_cache_write_usd && e.context_tokens) {
      await $.store.set('writeUsdPerTok', e.estimated_cache_write_usd / e.context_tokens)
    }
    return next(e)
  })

  on('classic.PostModelSwitch', async ($, e, next) => {
    if (e.estimated_cache_write_usd && e.context_tokens) {
      await $.store.set('writeUsdPerTok', e.estimated_cache_write_usd / e.context_tokens)
    }
    return next(e)
  })

  on('command.run', { command: 'handoff' }, async $ => {
    void handoff($)
    return { text: 'Handoff started.' }
  })

  on('command.run', { command: 'autohandoff' }, async ($, e) => {
    const parsed = parseThreshold(e.args)
    if (parsed === null) {
      const current = (await $.store.get('autohandoff')) as number | undefined
      return { text: current === undefined ? 'Autohandoff is off. Usage: /autohandoff 80k' : `Autohandoff at ${formatTokens(current)} tokens.` }
    }
    if (parsed === 'off') {
      await $.store.delete('autohandoff')
      return { text: 'Autohandoff off.' }
    }
    await $.store.set('autohandoff', parsed)
    return { text: `Autohandoff at ${formatTokens(parsed)} tokens.` }
  })

  on('command.run', { command: 'cache-ttl' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'auto') {
      await $.store.delete('ttl')
      return { text: `Cache TTL back to ${configTtl}m until detected.` }
    }
    const minutes = Number(arg)
    if (!Number.isFinite(minutes) || minutes <= 0) {
      const t = await ttl($)
      return { text: `Cache TTL ${t.minutes}m (${t.source}). Usage: /cache-ttl <minutes|auto>` }
    }
    await $.store.set('ttl', { minutes, source: 'manual' })
    return { text: `Cache TTL set to ${minutes}m.` }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    if (e.props.hasSurvey) return below
    await read($, tick)
    const m = await read($, meter)
    const busy = await read($, isBusy)
    const { minutes, source } = await ttl($)
    const now = await $.clock.now()
    const { Box, Button, Text } = $.ui.resolve(e)

    const left = m.lastResponseAt === null ? null : remainingMs(m.lastResponseAt, minutes, now)
    const cacheColor = left === null ? undefined : left <= 0 ? 'error' : left <= warnLeadMs(minutes) ? 'warning' : undefined
    const tokens = m.contextTokens ?? 0
    const limits = compactLimits(await read($, floor), (await activeProfile($)).profile)
    const level = contextLevel(tokens, warnTokens, limits)
    const ctxColor = level === 'high' ? 'error' : level === 'warn' ? ORANGE : undefined
    const cold = await coldUsd($, tokens, minutes)
    const ttlTag = source === 'detected' ? '' : '?'
    const band = cfg.isProfileShown ? await profileLine($, m, now) : null

    return (
      <Box flexDirection="column">
        <Box>
          <Text color={cacheColor} dimColor={cacheColor === undefined}>
            Cache {left === null ? '--' : formatRemaining(left)}/{minutes}m{ttlTag}
          </Text>
          <Text dimColor> · </Text>
          <Text color={ctxColor} dimColor={ctxColor === undefined}>
            ctx {formatTokens(tokens)}{m.contextPercent !== null ? ` (${m.contextPercent}%)` : ''}{level === 'high' ? ' quality risk' : ''}
          </Text>
          <Text dimColor>
            {m.fiveHour !== null ? ` · 5h ${m.fiveHour}%` : ''}
            {m.sevenDay !== null ? ` · wk ${m.sevenDay}%` : ''}
            {m.costUsd !== null ? ` · $${m.costUsd.toFixed(2)}` : ''}
            {tokens > 0 ? ` · cold ~$${cold.toFixed(2)} ` : ' '}
          </Text>
          <Button key="handoff" label={busy ? 'Handing off...' : 'Handoff & Clear'} hotkey="h" onPress={() => handoff($)} />
          <Button key="fresh" label="Fresh" hotkey="f" onPress={() => fresh($)} />
        </Box>
        {band !== null && (
          <Text color={band.isWarned ? 'warning' : undefined} dimColor={!band.isWarned}>
            {band.text}
          </Text>
        )}
        {below}
      </Box>
    )
  })
}
