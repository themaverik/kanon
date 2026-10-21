import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { UndoText } from '../types'
import {
  AREA_LABELS,
  DEFAULT_TEMPLATE,
  DEFAULT_AGENTS,
  DEFAULT_TEMPLATE_NAME,
  REWRITE_SYSTEM,
  agentsFrom,
  applyTemplate,
  isEnhanced,
  reviewerFor,
  stripProcessWording,
  templateName,
} from './enhance'

const MAX_REWRITE_TOKENS = 2_000
const REWRITE_TIMEOUT_MS = 30_000

const isBusy = atom({ plugin: 'prompt-enhancer', key: 'isBusy' } as const, false)
const undoText = atom({ plugin: 'prompt-enhancer', key: 'undoText' } as const, null as UndoText)

let model = 'haiku'
let agents = DEFAULT_AGENTS

async function templatesDir($: EngineInterface): Promise<string | null> {
  const home = await $.env.get('HOME')
  return home === undefined ? null : `${home}/.claude/prompt-templates`
}

async function seedDefault($: EngineInterface): Promise<void> {
  const dir = await templatesDir($)
  if (dir === null) return
  const path = `${dir}/${DEFAULT_TEMPLATE_NAME}.md`
  if (!(await $.fs.exists(path))) await $.fs.write(path, `${DEFAULT_TEMPLATE}\n`)
}

async function loadTemplate($: EngineInterface, name: string): Promise<string | null> {
  const dir = await templatesDir($)
  const text = dir === null ? undefined : await $.fs.read(`${dir}/${name}.md`).catch(() => undefined)
  if (typeof text === 'string' && text.trim()) return text.trim()
  return name === DEFAULT_TEMPLATE_NAME ? DEFAULT_TEMPLATE : null
}

async function enhance($: EngineInterface, name: string): Promise<void> {
  if (await read($, isBusy)) return
  const draft = (await $.prompt.read()).text.trim()
  if (!draft) {
    $.ui.toast('Type a draft first, then Enhance.')
    return
  }
  const template = await loadTemplate($, name)
  if (template === null) {
    $.ui.toast(`No template "${name}" in ~/.claude/prompt-templates.`)
    return
  }
  if (isEnhanced(draft, template)) {
    $.ui.toast('Draft already carries the template. Undo first to re-enhance.')
    return
  }

  await update($, isBusy, () => true)
  try {
    const [area, reply] = await Promise.all([
      $.model.classify(draft, AREA_LABELS, { model }).catch(() => undefined),
      $.model.complete({ model, system: REWRITE_SYSTEM, prompt: draft, maxTokens: MAX_REWRITE_TOKENS, timeoutMs: REWRITE_TIMEOUT_MS }),
    ])
    if (!reply.isAnswered) {
      $.ui.toast(`Enhance failed: ${reply.reason}. Draft left as is.`)
      return
    }
    const filled = await $.prompt.fill({ text: applyTemplate(template, reviewerFor(area, agents), stripProcessWording(reply.text.trim()), agents.implementer) })
    if (!filled.isFilled) {
      $.ui.toast('Could not fill the prompt box. Draft left as is.')
      return
    }
    await update($, undoText, () => draft)
  } finally {
    await update($, isBusy, () => false)
  }
}

async function undo($: EngineInterface): Promise<void> {
  const original = await read($, undoText)
  if (original === null) return
  await $.prompt.fill({ text: original })
  await update($, undoText, () => null)
}

async function listTemplates($: EngineInterface): Promise<string> {
  const dir = await templatesDir($)
  const entries = dir === null ? [] : await $.fs.list(dir).catch(() => [])
  const names = entries.filter(f => f.kind === 'file' && f.name.endsWith('.md')).map(f => f.name.slice(0, -3))
  return names.length ? `Templates: ${names.join(', ')}. Use /enhance <name>.` : `No templates yet. Add *.md files to ${dir ?? '~/.claude/prompt-templates'}.`
}

export const register: Register = (on, options) => {
  model = String(options.model ?? 'haiku')
  agents = agentsFrom(options)

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'enhance', description: 'Rewrite the draft and wrap it in a prompt template', argumentHint: '[template]' })
    await $.command.register({ name: 'templates', description: 'List prompt templates in ~/.claude/prompt-templates' })
    await seedDefault($).catch(() => undefined)
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    await update($, undoText, () => null).catch(() => undefined)
    return next(e)
  })

  on('command.run', { command: 'enhance' }, async ($, e) => {
    const name = templateName(e.args)
    if (name === null) return { text: 'Template names are letters, digits, - and _ only.' }
    void enhance($, name)
    return { text: `Enhancing with "${name}"...` }
  })

  on('command.run', { command: 'templates' }, async $ => ({ text: await listTemplates($) }))

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    if (e.props.hasSurvey || e.props.isWorking) return below
    const busy = await read($, isBusy)
    const original = await read($, undoText)
    const { Box, Button, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Box>
          <Text dimColor>Prompt </Text>
          <Button key="enhance" label={busy ? 'Enhancing...' : 'Enhance'} hotkey="e" onPress={() => enhance($, DEFAULT_TEMPLATE_NAME)} />
          {original !== null ? <Button key="undo" label="Undo" hotkey="u" onPress={() => undo($)} /> : null}
        </Box>
        {below}
      </Box>
    )
  })
}
