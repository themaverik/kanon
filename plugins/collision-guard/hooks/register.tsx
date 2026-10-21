import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { PeerRecord, SessionState } from '../types'
import { addEdit, ago, bashWriteTargets, baseName, findConflict, folderKey, isLive, parsePeer, pruneEdits, shortId, summarizeTask } from './peers'

const HEARTBEAT_MS = 30_000
const PROCEED = 'Proceed'
const WORKTREE = 'Move to a worktree'
const CANCEL = 'Cancel'

const peers = atom({ plugin: 'collision-guard', key: 'peers' } as const, [] as PeerRecord[])

let windowMs = 30 * 60_000
let dir = ''
let self: PeerRecord = { id: '', task: '', state: 'idle', heartbeat: 0, edits: [] }
let acknowledged: Record<string, number> = {}

async function save($: EngineInterface, patch: Partial<PeerRecord>): Promise<void> {
  const now = await $.clock.now()
  self = { ...self, ...patch, heartbeat: now, edits: pruneEdits(patch.edits ?? self.edits, now, windowMs) }
  await $.fs.write(`${dir}/${self.id}.json`, JSON.stringify(self))
}

async function loadPeers($: EngineInterface): Promise<PeerRecord[]> {
  const entries = await $.fs.list(dir).catch(() => [])
  const records = await Promise.all(
    entries
      .filter(f => f.kind === 'file' && f.name.endsWith('.json') && f.name !== `${self.id}.json`)
      .map(f => $.fs.read(`${dir}/${f.name}`).then(parsePeer, () => null)),
  )
  return records.filter((r): r is PeerRecord => r !== null)
}

async function heartbeat($: EngineInterface): Promise<void> {
  await save($, {})
  const now = await $.clock.now()
  const found = await loadPeers($)
  await update($, peers, () => found.filter(p => isLive(p, now) || p.edits.some(e => now - e.at <= windowMs)))
}

async function setState($: EngineInterface, state: SessionState, task?: string): Promise<void> {
  await save($, task === undefined ? { state } : { state, task })
}

async function guard($: EngineInterface, path: string): Promise<string | null> {
  const now = await $.clock.now()
  const conflict = findConflict(await loadPeers($), self.id, path, now, windowMs)
  if (conflict === null || (acknowledged[path] ?? 0) >= conflict.edit.at) return null

  const who = `Session ${shortId(conflict.peer.id)}${conflict.peer.task ? ` ("${conflict.peer.task}")` : ''}`
  const when = ago(now - conflict.edit.at)
  const answer = await $.ui
    .ask(`${who} edited ${baseName(path)} ${when}. Edit it here anyway?`, { header: 'Collision', options: [PROCEED, WORKTREE, CANCEL] })
    .catch(() => CANCEL)

  if (answer === PROCEED) {
    acknowledged = { ...acknowledged, [path]: conflict.edit.at }
    return null
  }
  const context = `another Claude Code session (${shortId(conflict.peer.id)}) edited ${path} ${when}`
  if (answer === WORKTREE) return `The user chose to move this work to a git worktree because ${context}. Call EnterWorktree, then redo this change there.`
  if (answer === CANCEL) return `The user cancelled this edit because ${context}. Stop and ask the user how to proceed.`
  return `The user did not approve this edit as is (${context}). Their instruction: "${answer}". Follow it.`
}

async function guarded<R extends { deny?: string; isError?: boolean }>($: EngineInterface, path: string, run: () => Promise<R>): Promise<R | { deny: string }> {
  const deny = await guard($, path)
  if (deny !== null) return { deny }
  const ran = await run()
  if (ran.deny === undefined && ran.isError !== true) await save($, { edits: addEdit(self.edits, path, await $.clock.now()) })
  return ran
}

async function recordEdits($: EngineInterface, paths: readonly string[]): Promise<void> {
  if (paths.length === 0) return
  const now = await $.clock.now()
  await save($, { edits: paths.reduce((edits, p) => addEdit(edits, p, now), self.edits) })
}

export const register: Register = (on, options) => {
  windowMs = Number(options.windowMinutes ?? 30) * 60_000

  on('session.start', async ($, e, next) => {
    const home = (await $.env.get('HOME')) ?? ''
    dir = `${home}/.claude/collision-guard/${folderKey(await $.session.root())}`
    self = { ...self, id: await $.session.id() }
    await heartbeat($)
    $.clock.every(HEARTBEAT_MS, () => heartbeat($))
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    await setState($, 'working', summarizeTask(e.text))
    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) await setState($, 'idle')
    return next(e)
  })

  on('session.end', async ($, e, next) => {
    await setState($, 'ended')
    return next(e)
  })

  // Fail open: a broken guard must not block editing.
  on('tool.call', { tool: 'Edit' }, ($, e, next) => guarded($, e.file_path, () => next(e))).catch(($, e, next) => next(e))
  on('tool.call', { tool: 'Write' }, ($, e, next) => guarded($, e.file_path, () => next(e))).catch(($, e, next) => next(e))
  on('tool.call', { tool: 'NotebookEdit' }, ($, e, next) => guarded($, e.notebook_path, () => next(e))).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const targets = bashWriteTargets(e.command, await $.session.cwd())
    for (const path of targets) {
      const deny = await guard($, path)
      if (deny !== null) return { deny }
    }
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError === true) return ran
    const diff = ran.result?.bashEditDiff
    const changed = diff?.changedFiles ?? diff?.files.map(f => f.filePath)
    await recordEdits($, changed ?? targets)
    return ran
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    if (e.props.hasSurvey) return below
    const now = await $.clock.now()
    const live = (await read($, peers)).filter(p => isLive(p, now))
    if (live.length === 0) return below
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {live.map(p => {
          const last = [...p.edits].sort((a, b) => b.at - a.at)[0]
          const status = p.state === 'working' ? 'working on' : 'done'
          return (
            <Text key={p.id} color={p.state === 'working' ? 'warning' : undefined} dimColor={p.state !== 'working'}>
              Other session {shortId(p.id)} · {status}: {p.task || '(no prompt since it loaded)'}
              {p.edits.length > 0 && last ? ` · ${p.edits.length} file(s), last ${baseName(last.path)} ${ago(now - last.at)}` : ''}
            </Text>
          )
        })}
        {below}
      </Box>
    )
  })
}
