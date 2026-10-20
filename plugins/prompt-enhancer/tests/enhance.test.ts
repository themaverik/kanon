import type { On } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { describe, expect, test } from 'claude-code/testing'

import { DEFAULT_TEMPLATE, agentsFrom, applyTemplate, isEnhanced, reviewerFor, stripProcessWording, templateName } from '../hooks/enhance'

const run = async ($: Engine, command: string, args: string) =>
  // The engine stamps origin and presentation; the test kit's type still names them.
  (await $.command.run({ command, args } as Parameters<Engine['command']['run']>[0])).text

// The test runtime has timers; the es2023 lib the mod type-checks against does not.
declare function setTimeout(fn: () => void, ms: number): unknown

const USAGE = { input_tokens: 10, output_tokens: 10 }

function stubEngine(on: On, draft: string, reply: { isAnswered: true; text: string } | { isAnswered: false; reason: 'empty-reply' }) {
  const filled: string[] = []
  const toasts: string[] = []
  let settle = () => {}
  const settled = new Promise<void>(resolve => { settle = resolve })
  on('env.get', async () => ({ value: '/fake-home' }))
  on('fs.exists', async () => ({ value: true }))
  on('fs.read', async () => { throw new Error('missing') })
  on('prompt.read', async () => ({ value: { text: draft, cursor: draft.length } }))
  on('model.classify', async () => ({ value: 'frontend' }))
  on('model.complete', async () => ({ value: (reply.isAnswered ? { ...reply, usage: USAGE } : reply) as never }))
  on('prompt.fill', async (_$, e) => {
    filled.push(e.text)
    settle()
    return { isFilled: true } as never
  })
  on('ui.toast', async (_$, e) => {
    toasts.push(e.text)
    settle()
    return { value: undefined as never }
  })
  // enhance() is fire-and-forget; let its finally block land before the test tears down.
  return { filled, toasts, settled: settled.then(() => new Promise<void>(r => setTimeout(r, 10))) }
}

describe('template', () => {
  test('fills reviewer and task into the default template', () => {
    expect(applyTemplate(DEFAULT_TEMPLATE, reviewerFor('frontend'), 'Implement feature X in UI')).toBe(
      'Use the discipline implementer + frontend-developer + karpathy skills + "Implement feature X in UI"',
    )
  })

  test('appends the task when a template has no task slot', () => {
    expect(applyTemplate('Point-wise, 2-3 liners.', 'x', 'Do Y')).toBe('Point-wise, 2-3 liners. Do Y')
  })

  test('falls back to the general reviewer when the area is unknown', () => {
    expect(reviewerFor(undefined)).toBe('architect-review')
    expect(reviewerFor('fullstack')).toBe('architect-review + frontend-developer')
    expect(reviewerFor('security')).toBe('architect-review')
  })

  test('uses configured agent names and keeps defaults for blank ones', () => {
    const agents = agentsFrom({ implementerAgent: 'implementer', backendAgent: ' ', frontendAgent: 'web-reviewer' })
    expect(applyTemplate(DEFAULT_TEMPLATE, reviewerFor('fullstack', agents), 'Do Y', agents.implementer)).toBe(
      'Use the discipline implementer + architect-review + web-reviewer + karpathy skills + "Do Y"',
    )
  })

  test('spots a draft that already carries the template prefix', () => {
    expect(isEnhanced('Use the discipline staff-engineer + x', DEFAULT_TEMPLATE)).toBe(true)
    expect(isEnhanced('fix the login bug', DEFAULT_TEMPLATE)).toBe(false)
  })

  test('refuses template names that could leave the templates folder', () => {
    expect(templateName('')).toBe('discipline')
    expect(templateName('review-pass')).toBe('review-pass')
    expect(templateName('../secrets')).toBe(null)
  })
})

describe('stripProcessWording', () => {
  test('drops agent and discipline phrases the template already carries', () => {
    expect(stripProcessWording('Review the kanon plugin using the discipline and frontend engineer approach.')).toBe('Review the kanon plugin.')
    expect(stripProcessWording('Fix the login bug with staff-engineer + karpathy skills')).toBe('Fix the login bug')
  })
  test('leaves ordinary task wording alone', () => {
    expect(stripProcessWording('Add retries using exponential backoff to the SMTP adapter.')).toBe('Add retries using exponential backoff to the SMTP adapter.')
    expect(stripProcessWording('Hire a frontend developer page for the careers site.')).toBe('Hire a frontend developer page for the careers site.')
  })
})

describe('/enhance', () => {
  test('rewrites the draft and wraps it in the template, unsent', async ($, on) => {
    const { filled, settled } = stubEngine(on, 'make the button blue', { isAnswered: true, text: 'Change the primary button colour to blue using the frontend-developer approach.\n' })
    await run($, 'enhance', '')
    await settled
    expect(filled[0]).toBe('Use the discipline implementer + frontend-developer + karpathy skills + "Change the primary button colour to blue."')
  })

  test('leaves the draft alone when the model gives no reply', async ($, on) => {
    const { filled, toasts, settled } = stubEngine(on, 'make the button blue', { isAnswered: false, reason: 'empty-reply' })
    await run($, 'enhance', '')
    await settled
    expect(toasts[0]).toContain('Enhance failed: empty-reply')
    expect(filled).toEqual([])
  })

  test('does not wrap a draft twice', async ($, on) => {
    const { filled, toasts, settled } = stubEngine(on, 'Use the discipline staff-engineer + x + karpathy skills + "y"', { isAnswered: true, text: 'z' })
    await run($, 'enhance', '')
    await settled
    expect(toasts[0]).toContain('already carries the template')
    expect(filled).toEqual([])
  })
})
