export type SessionState = 'working' | 'idle' | 'ended'

export type EditMark = { path: string; at: number }

export type PeerRecord = {
  id: string
  task: string
  state: SessionState
  heartbeat: number
  edits: EditMark[]
}

declare module 'claude-code' {
  interface PluginState {
    'collision-guard': { peers: PeerRecord[] }
  }
}
