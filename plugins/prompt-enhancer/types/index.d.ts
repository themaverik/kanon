/** The draft as typed before Enhance replaced it; null once undone or sent. */
export type UndoText = string | null

declare module 'claude-code' {
  interface PluginState {
    'prompt-enhancer': {
      isBusy: boolean
      undoText: UndoText
    }
  }
}
