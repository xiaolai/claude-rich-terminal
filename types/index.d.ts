export type RichTerminalEnabled = boolean

declare module 'claude-code' {
  interface PluginState {
    'rich-terminal': {
      /** False after `/rich off`: replies are drawn as the host draws them. */
      enabled: RichTerminalEnabled
      /** Per diagram id: increments whenever that diagram's picture attempt ends, success or failure, so only the replies holding it redraw. */
      pictureAttempts: StateFamily<number>
      /** Ids of the main-loop turns running now: an unclosed fence is still streaming only while one runs. */
      running: string[]
    }
  }
}
