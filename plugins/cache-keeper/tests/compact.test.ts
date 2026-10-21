import type { Engine, On } from 'claude-code/testing'
import { expect, mock, test } from 'claude-code/testing'

// The test's hooks stand for the engine: usage reports `tokens`, compaction counts the call and skips.
const harness = (on: On) => {
  mock.store(on)
  const clock = mock.clock(on)
  const state = { tokens: 0, compacts: 0 }
  on('session.usage', () => ({ value: { startedAt: 0, context: { tokens: state.tokens, percent: Math.round(state.tokens / 10_000) }, rateLimits: [] } }) as never)
  on('session.compact', () => {
    state.compacts += 1
    return { skip: 'probe' }
  })
  on('tool.call', { tool: 'Edit' }, () => ({ deny: 'probe' }))
  on('turn.complete', () => ({ text: '' }))
  const turn = async ($: Engine, tokens: number, edits = 0) => {
    for (let i = 0; i < edits; i++) await $.tool.call({ tool: 'Edit', file_path: '/x', old_string: 'a', new_string: 'b' } as never)
    state.tokens = tokens
    await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: `t${tokens}` } as never)
    await clock.advance(3_000)
  }
  return { state, turn }
}

test('auto-compact: a light turn past the target holds, a heavy one compacts', { options: { profile: 'max5', enforce: true, autoCompact: true } }, async ($, on) => {
  const { state, turn } = harness(on)
  await turn($, 60_000)
  await turn($, 187_000)
  await turn($, 192_000)
  expect(state.compacts).toBe(0)
  await turn($, 200_000)
  expect(state.compacts).toBe(1)
})

test('auto-compact: several edits in one turn count as heavy', { options: { profile: 'max5', enforce: true, autoCompact: true } }, async ($, on) => {
  const { state, turn } = harness(on)
  await turn($, 60_000)
  await turn($, 189_000)
  await turn($, 191_000, 3)
  expect(state.compacts).toBe(1)
})

test('auto-compact: the ceiling compacts a light turn', { options: { profile: 'max5', enforce: true, autoCompact: true } }, async ($, on) => {
  const { state, turn } = harness(on)
  await turn($, 60_000)
  await turn($, 200_000)
  await turn($, 202_000)
  expect(state.compacts).toBe(1)
  await turn($, 206_000)
  expect(state.compacts).toBe(2)
})

test('display only: never compacts', { options: { profile: 'max5', autoCompact: true } }, async ($, on) => {
  const { state, turn } = harness(on)
  await turn($, 60_000)
  await turn($, 240_000)
  expect(state.compacts).toBe(0)
})
