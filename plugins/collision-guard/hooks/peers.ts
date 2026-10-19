import type { EditMark, PeerRecord } from '../types'

const MINUTE = 60_000
const LIVE_MS = 2 * MINUTE
const TASK_CHARS = 70

export type Conflict = { peer: PeerRecord; edit: EditMark }

/** One directory per working folder, so sessions in a worktree never see each other. */
export function folderKey(root: string): string {
  return root.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function isLive(peer: PeerRecord, now: number): boolean {
  return peer.state !== 'ended' && now - peer.heartbeat < LIVE_MS
}

/** The most recent edit of `path` by another session inside the window, if any. */
export function findConflict(peers: readonly PeerRecord[], selfId: string, path: string, now: number, windowMs: number): Conflict | null {
  let best: Conflict | null = null
  for (const peer of peers) {
    if (peer.id === selfId) continue
    for (const edit of peer.edits) {
      if (edit.path !== path || now - edit.at > windowMs) continue
      if (best === null || edit.at > best.edit.at) best = { peer, edit }
    }
  }
  return best
}

export function pruneEdits(edits: readonly EditMark[], now: number, windowMs: number): EditMark[] {
  return edits.filter(e => now - e.at <= windowMs)
}

export function addEdit(edits: readonly EditMark[], path: string, now: number): EditMark[] {
  return [...edits.filter(e => e.path !== path), { path, at: now }]
}

export function summarizeTask(prompt: string): string {
  const line = prompt.trim().split('\n')[0] ?? ''
  return line.length > TASK_CHARS ? `${line.slice(0, TASK_CHARS - 1)}…` : line
}

export function ago(ms: number): string {
  const min = Math.floor(ms / MINUTE)
  return min < 1 ? 'just now' : `${min} min ago`
}

export function baseName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1)
}

export function shortId(id: string): string {
  return id.slice(0, 8)
}

export function parsePeer(text: string): PeerRecord | null {
  try {
    const p = JSON.parse(text) as PeerRecord
    return typeof p.id === 'string' && Array.isArray(p.edits) ? p : null
  } catch {
    return null
  }
}

const SINKS = /^\/dev\//
const QUOTES = /^['"]|['"]$/g

/**
 * Best-effort guess at the files a shell command writes, before it runs:
 * redirections, tee, and in-place sed/perl. Misses anything subtler; the
 * engine's own after-the-fact diff still records those edits.
 */
export function bashWriteTargets(command: string, cwd: string): string[] {
  const found = new Set<string>()
  const add = (raw: string | undefined) => {
    const t = raw?.replace(QUOTES, '')
    if (!t || t.startsWith('&') || t.startsWith('$') || SINKS.test(t)) return
    found.add(t.startsWith('/') ? t : `${cwd}/${t.replace(/^\.\//, '')}`)
  }
  for (const m of command.matchAll(/(?:^|[^0-9&<>])\d?>>?\s*([^\s;|&<>]+)/g)) add(m[1])
  for (const segment of command.split(/&&|\|\||[;|\n]/)) {
    const words = segment.trim().split(/\s+/)
    const cmd = words[0]
    const args = words.slice(1).filter(w => !w.startsWith('-'))
    if (cmd === 'tee') args.forEach(add)
    const isInPlace = (cmd === 'sed' || cmd === 'perl') && words.some(w => /^-[a-zA-Z]*i/.test(w))
    if (isInPlace && args.length > 1) add(args[args.length - 1])
  }
  return [...found]
}
