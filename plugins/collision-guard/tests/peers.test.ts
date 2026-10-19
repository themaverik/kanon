import { describe, expect, test } from 'claude-code/testing'

import type { PeerRecord } from '../types'
import { addEdit, bashWriteTargets, findConflict, folderKey, isLive, parsePeer, pruneEdits, summarizeTask } from '../hooks/peers'

const MIN = 60_000
const NOW = 100 * MIN
const WINDOW = 30 * MIN

const peer = (id: string, edits: PeerRecord['edits'], over: Partial<PeerRecord> = {}): PeerRecord =>
  ({ id, task: 'fix login', state: 'working', heartbeat: NOW, edits, ...over })

describe('findConflict', () => {
  test('finds another session editing the same file inside the window', () => {
    const found = findConflict([peer('b', [{ path: '/p/a.ts', at: NOW - 10 * MIN }])], 'a', '/p/a.ts', NOW, WINDOW)
    expect(found?.peer.id).toBe('b')
  })
  test('ignores own edits, other files and edits older than the window', () => {
    const peers = [
      peer('a', [{ path: '/p/a.ts', at: NOW - MIN }]),
      peer('b', [{ path: '/p/other.ts', at: NOW - MIN }]),
      peer('c', [{ path: '/p/a.ts', at: NOW - 31 * MIN }]),
    ]
    expect(findConflict(peers, 'a', '/p/a.ts', NOW, WINDOW)).toBe(null)
  })
  test('picks the most recent edit across sessions', () => {
    const peers = [peer('b', [{ path: '/p/a.ts', at: NOW - 20 * MIN }]), peer('c', [{ path: '/p/a.ts', at: NOW - 2 * MIN }])]
    expect(findConflict(peers, 'a', '/p/a.ts', NOW, WINDOW)?.peer.id).toBe('c')
  })
})

describe('records', () => {
  test('a session is live until it ends or stops beating for 2 minutes', () => {
    expect(isLive(peer('b', []), NOW)).toBe(true)
    expect(isLive(peer('b', [], { state: 'ended' }), NOW)).toBe(false)
    expect(isLive(peer('b', [], { heartbeat: NOW - 3 * MIN }), NOW)).toBe(false)
  })
  test('addEdit keeps one mark per file and pruneEdits drops old ones', () => {
    const edits = addEdit([{ path: '/x', at: 1 }], '/x', NOW)
    expect(edits).toEqual([{ path: '/x', at: NOW }])
    expect(pruneEdits([{ path: '/y', at: NOW - 40 * MIN }, ...edits], NOW, WINDOW)).toEqual(edits)
  })
  test('folderKey, summarizeTask and parsePeer', () => {
    expect(folderKey('/Users/me/Projects/werkflow-platform')).toBe('Users-me-Projects-werkflow-platform')
    expect(summarizeTask('  add a band\nmore detail')).toBe('add a band')
    expect(summarizeTask('x'.repeat(100)).length).toBe(70)
    expect(parsePeer('not json')).toBe(null)
    expect(parsePeer(JSON.stringify(peer('b', [])))?.id).toBe('b')
  })
})

describe('bashWriteTargets', () => {
  test('finds redirections, tee and in-place sed', () => {
    expect(bashWriteTargets('echo "test" >> scratch.txt && cat scratch.txt', '/p')).toEqual(['/p/scratch.txt'])
    expect(bashWriteTargets('date > /tmp/a.log 2>&1', '/p')).toEqual(['/tmp/a.log'])
    expect(bashWriteTargets('ls | tee -a out.txt', '/p')).toEqual(['/p/out.txt'])
    expect(bashWriteTargets("sed -i '' 's/a/b/' ./src/x.ts", '/p')).toEqual(['/p/src/x.ts'])
  })
  test('ignores reads, /dev sinks and fd duplication', () => {
    expect(bashWriteTargets('cat a.txt 2>/dev/null', '/p')).toEqual([])
    expect(bashWriteTargets('make 2>&1 | grep err', '/p')).toEqual([])
    expect(bashWriteTargets('sed -n 1,5p file.txt', '/p')).toEqual([])
  })
})
