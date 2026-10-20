export type Meter = {
  lastResponseAt: number | null
  contextTokens: number | null
  contextPercent: number | null
  fiveHour: number | null
  sevenDay: number | null
  sevenDayResetsAt: number | null
  costUsd: number | null
}

export type TtlSource = 'config' | 'detected' | 'manual'

declare module 'claude-code' {
  interface PluginState {
    'cache-keeper': {
      meter: Meter
      tick: number
      isBusy: boolean
      floor: number | null
      fableUsed: number
      liveEffort: string | null
    }
  }
}
