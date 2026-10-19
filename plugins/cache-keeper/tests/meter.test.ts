import { describe, expect, test } from 'claude-code/testing'

import { coldCostUsd, contextLevel, formatRemaining, inferTtl, parseThreshold, warnLeadMs } from '../hooks/meter'

const MIN = 60_000

describe('inferTtl', () => {
  test('a warm turn after a 20 minute gap means the 1h TTL', () => {
    expect(inferTtl(20 * MIN, 100_000, 3_000)).toBe('long')
  })
  test('a full re-cache after a 20 minute gap means the 5m TTL', () => {
    expect(inferTtl(20 * MIN, 100_000, 98_000)).toBe('short')
  })
  test('gaps under 5 or over 60 minutes tell nothing', () => {
    expect(inferTtl(3 * MIN, 100_000, 98_000)).toBe(null)
    expect(inferTtl(70 * MIN, 100_000, 3_000)).toBe(null)
  })
})

describe('warning and cost', () => {
  test('warns 5 minutes ahead on 1h and 1 minute ahead on 5m', () => {
    expect(warnLeadMs(60)).toBe(5 * MIN)
    expect(warnLeadMs(5)).toBe(1 * MIN)
  })
  test('cold cost uses 2x input on 1h, 1.25x on 5m, or the engine rate', () => {
    expect(coldCostUsd(1_000_000, 60, 5)).toBe(10)
    expect(coldCostUsd(1_000_000, 5, 5)).toBe(6.25)
    expect(coldCostUsd(1_000_000, 60, 5, 0.000_004)).toBe(4)
  })
  test('formats remaining time and cold', () => {
    expect(formatRemaining(0)).toBe('cold')
    expect(formatRemaining(41.5 * MIN)).toBe('42m')
    expect(formatRemaining(75 * MIN)).toBe('1h15')
  })
  test('context level escalates at warn and twice warn', () => {
    expect(contextLevel(10_000, 50_000)).toBe('ok')
    expect(contextLevel(50_000, 50_000)).toBe('warn')
    expect(contextLevel(100_000, 50_000)).toBe('high')
  })
})

describe('parseThreshold', () => {
  test('reads plain, k and m forms and off', () => {
    expect(parseThreshold('80000')).toBe(80_000)
    expect(parseThreshold('80k')).toBe(80_000)
    expect(parseThreshold('1.5m')).toBe(1_500_000)
    expect(parseThreshold(' OFF ')).toBe('off')
    expect(parseThreshold('lots')).toBe(null)
  })
})
