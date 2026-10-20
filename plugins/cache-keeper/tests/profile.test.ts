import { describe, expect, test } from 'claude-code/testing'

import { PROFILES, decideAgent, detectPlan, isAheadOfWeeklyPace, isBelowWindow, resolveProfile, windowTokens } from '../hooks/meter'

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
    expect(p.roomTokens).toBe(100_000)
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

describe('window math', () => {
  test('window is floor plus room, unknown until the floor is measured', () => {
    expect(windowTokens(62_000, 100_000)).toBe(162_000)
    expect(windowTokens(null, 100_000)).toBe(null)
  })
  test('below the window only once a floor is known', () => {
    expect(isBelowWindow(120_000, 62_000, 100_000)).toBe(true)
    expect(isBelowWindow(162_000, 62_000, 100_000)).toBe(false)
    expect(isBelowWindow(120_000, null, 100_000)).toBe(false)
  })
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
