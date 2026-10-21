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

export type CompactLimits = { target: number; ceiling: number }

export type CompactVerdict =
  | { action: 'none' }
  | { action: 'hold'; limits: CompactLimits }
  | { action: 'compact'; limits: CompactLimits; reason: 'heavy' | 'ceiling' }

declare module 'claude-code' {
  interface PluginState {
    'cache-keeper': {
      meter: Meter
      tick: number
      isBusy: boolean
      floor: number | null
      fableUsed: number
      liveEffort: string | null
      verdict: CompactVerdict
    }
  }
}
