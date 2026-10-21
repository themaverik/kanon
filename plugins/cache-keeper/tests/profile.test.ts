import { describe, expect, test } from 'claude-code/testing'

import { PROFILES, compactLimits, contextLevel, decideAgent, decideCompact, detectPlan, isAheadOfWeeklyPace, isBelowTarget, resolveProfile } from '../hooks/meter'

const DAY = 24 * 60 * 60_000

describe('resolveProfile', () => {
  test('team takes the max5 defaults', () => {
    expect(resolveProfile('team', {})).toEqual(PROFILES.max5)
  })
  test('overrides replace only the fields they set', () => {
    const p = resolveProfile('max5', { agentModel: 'haiku', fablePerSession: 0, agentEffort: undefined })
    expect(p.agentModel).toBe('haiku')
    expect(p.fablePerSession).toBe(0)
    expect(p.agentEffort).toBe('medium')
    expect(p.roomTokens).toBe(130_000)
  })
})

describe('detectPlan', () => {
  test('a response with no rate limits means api', () => {
    expect(detectPlan(false, { organizationRateLimitTier: 'default_claude_max_5x' })).toEqual({ plan: 'api', source: 'auto' })
  })
  test('maps the account tier', () => {
    expect(detectPlan(true, { organizationRateLimitTier: 'default_claude_max_5x' }).plan).toBe('max5')
    expect(detectPlan(true, { organizationRateLimitTier: 'default_claude_max_20x' }).plan).toBe('max20')
    expect(detectPlan(true, { organizationRateLimitTier: 'default_claude_pro' }).plan).toBe('pro')
    expect(detectPlan(null, { userRateLimitTier: 'default_claude_max_20x' }).plan).toBe('max20')
  })
  test('team and enterprise organizations are team', () => {
    expect(detectPlan(true, { organizationType: 'claude_team', organizationRateLimitTier: 'default_claude_max_5x' }).plan).toBe('team')
    expect(detectPlan(true, { organizationType: 'claude_enterprise' }).plan).toBe('team')
  })
  test('no readable tier falls back to max5, assumed', () => {
    expect(detectPlan(true, null)).toEqual({ plan: 'max5', source: 'assumed' })
    expect(detectPlan(null, { organizationRateLimitTier: 'something_new' })).toEqual({ plan: 'max5', source: 'assumed' })
  })
})

describe('compaction limits', () => {
  const max5 = PROFILES.max5
  test('target is floor plus room and ceiling adds grace, unknown until the floor is measured', () => {
    expect(compactLimits(60_000, max5)).toEqual({ target: 190_000, ceiling: 205_000 })
    expect(compactLimits(null, max5)).toBe(null)
  })
  test('a high floor is held under the cap', () => {
    expect(compactLimits(101_000, max5)).toEqual({ target: 231_000, ceiling: 246_000 })
    expect(compactLimits(150_000, max5)).toEqual({ target: 235_000, ceiling: 250_000 })
  })
  test('every plan keeps its ceiling at or under its cap', () => {
    for (const p of Object.values(PROFILES)) expect(compactLimits(200_000, p)!.ceiling).toBeLessThanOrEqual(p.capTokens)
  })
  test('grace keeps the plan ratio Pro 1 : Max 5x 3 : Max 20x 8', () => {
    expect([PROFILES.pro.graceTokens, PROFILES.max5.graceTokens, PROFILES.max20.graceTokens]).toEqual([5_000, 15_000, 40_000])
  })
  test('context level is warn past the target and high past the ceiling', () => {
    const limits = { target: 190_000, ceiling: 205_000 }
    expect(contextLevel(150_000, 50_000, limits)).toBe('ok')
    expect(contextLevel(190_000, 50_000, limits)).toBe('warn')
    expect(contextLevel(205_000, 50_000, limits)).toBe('high')
    expect(contextLevel(120_000, 50_000, null)).toBe('high')
  })
  test('below the target only once a floor is known', () => {
    expect(isBelowTarget(150_000, 60_000, max5)).toBe(true)
    expect(isBelowTarget(190_000, 60_000, max5)).toBe(false)
    expect(isBelowTarget(150_000, null, max5)).toBe(false)
  })
})

describe('decideCompact', () => {
  const max5 = PROFILES.max5
  const light = { growthTokens: 1_200, edits: 0 }
  test('nothing below the target or before a floor', () => {
    expect(decideCompact(150_000, 60_000, max5, light)).toEqual({ action: 'none' })
    expect(decideCompact(400_000, null, max5, light)).toEqual({ action: 'none' })
  })
  test('a light turn past the target holds inside the grace', () => {
    expect(decideCompact(200_000, 60_000, max5, light)).toMatchObject({ action: 'hold' })
  })
  test('a turn that grew the context a lot compacts at the target', () => {
    expect(decideCompact(200_000, 60_000, max5, { growthTokens: 12_000, edits: 0 })).toMatchObject({ action: 'compact', reason: 'heavy' })
  })
  test('a turn with several file edits compacts at the target', () => {
    expect(decideCompact(200_000, 60_000, max5, { growthTokens: 2_000, edits: 3 })).toMatchObject({ action: 'compact', reason: 'heavy' })
  })
  test('the ceiling compacts even a light turn', () => {
    expect(decideCompact(205_000, 60_000, max5, light)).toMatchObject({ action: 'compact', reason: 'ceiling' })
  })
})

describe('weekly pace', () => {
  test('weekly pace compares use with time elapsed in the window', () => {
    const now = 0
    expect(isAheadOfWeeklyPace(60, now + 3.5 * DAY, now)).toBe(true)
    expect(isAheadOfWeeklyPace(40, now + 3.5 * DAY, now)).toBe(false)
    expect(isAheadOfWeeklyPace(60, null, now)).toBe(false)
  })
})

describe('decideAgent', () => {
  const max5 = PROFILES.max5
  test('no model is rewritten to the profile agent model and effort', () => {
    expect(decideAgent({}, max5, 0)).toEqual({ action: 'rewrite', model: 'sonnet', effort: 'medium', isFableRefused: false })
  })
  test('a model above the profile is rewritten', () => {
    expect(decideAgent({ model: 'opus' }, max5, 0)).toMatchObject({ action: 'rewrite', model: 'sonnet' })
  })
  test('effort above the profile is rewritten', () => {
    expect(decideAgent({ model: 'sonnet', effort: 'xhigh' }, max5, 0)).toMatchObject({ action: 'rewrite', effort: 'medium' })
  })
  test('a model at or below the profile passes', () => {
    expect(decideAgent({ model: 'sonnet', effort: 'low' }, max5, 0)).toEqual({ action: 'pass', isFable: false })
    expect(decideAgent({ model: 'haiku' }, max5, 0)).toEqual({ action: 'pass', isFable: false })
  })
  test('fable passes within the allowance and is downgraded past it', () => {
    expect(decideAgent({ model: 'fable' }, max5, 0)).toEqual({ action: 'pass', isFable: true })
    expect(decideAgent({ model: 'fable' }, max5, 1)).toEqual({ action: 'rewrite', model: 'sonnet', effort: 'medium', isFableRefused: true })
    expect(decideAgent({ model: 'fable' }, PROFILES.pro, 0)).toMatchObject({ isFableRefused: true })
  })
  test('a fork is never rewritten', () => {
    expect(decideAgent({ subagentType: 'fork' }, max5, 0)).toEqual({ action: 'pass', isFable: false })
  })
})
