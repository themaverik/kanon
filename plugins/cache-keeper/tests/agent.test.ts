import type { On } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { expect, test } from 'claude-code/testing'

type Sent = { model: string | null; effort: string | null }

// The test's own hook stands for the engine: its deny carries what reached it.
const probe = (on: On) => {
  on('tool.call', { tool: 'Agent' }, (_$, e) => ({ deny: JSON.stringify({ model: e.model ?? null, effort: e.effort ?? null }) }))
  return async ($: Engine, args: Record<string, unknown>): Promise<Sent> => {
    const r = await $.tool.call({ tool: 'Agent', description: 'probe', prompt: 'probe', ...args } as Parameters<Engine['tool']['call']>[0])
    return JSON.parse(r.deny ?? '{}') as Sent
  }
}

test('enforced: an Agent call with no model gets the profile agent model and effort', { options: { profile: 'max5', enforce: true } }, async ($, on) => {
  const spawn = probe(on)
  expect(await spawn($, {})).toEqual({ model: 'sonnet', effort: 'medium' })
})

test('enforced: a second Fable escalation on max5 is downgraded', { options: { profile: 'max5', enforce: true } }, async ($, on) => {
  const spawn = probe(on)
  expect(await spawn($, { model: 'fable' })).toEqual({ model: 'fable', effort: null })
  expect(await spawn($, { model: 'fable' })).toEqual({ model: 'sonnet', effort: 'medium' })
})

test('display only: the call passes unchanged', { options: { profile: 'max5' } }, async ($, on) => {
  const spawn = probe(on)
  expect(await spawn($, { model: 'opus', effort: 'high' })).toEqual({ model: 'opus', effort: 'high' })
})
