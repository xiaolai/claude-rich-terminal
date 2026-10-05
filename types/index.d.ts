export type RichTerminalEnabled = boolean

/** The status band's look: `plain` draws dim `>` separators, the others a powerline gradient. */
export type StatusLook = 'plain' | 'gray' | 'aurora' | 'sunset' | 'forest'
/** How the band's three groups share rows: `auto` takes the fewest that fit. */
export type StatusLines = 'auto' | '1' | '2' | '3'
/** What the band draws: only the Token Weather row (a statusLine command can show the rest under the prompt), or every group. */
export type StatusRows = 'weather' | 'all'
/** The account segment: the email's local part, the whole email, or hidden. */
export type StatusAccount = 'name' | 'email' | 'off'

export type StatusSettings = {
  visible: boolean
  rows: StatusRows
  look: StatusLook
  lines: StatusLines
  bar: boolean
  account: StatusAccount
  resets: boolean
  weather: boolean
}

export type StatusGit = {
  branch: string
  ahead: number
  behind: number
  /** Absent when the working tree could not be measured: the branch is then drawn neither clean nor dirty. */
  changes?: { added: number; deleted: number; untracked: number }
}

export type StatusLimit = { label: string; percent: number; resetsAt?: number }

/** The figures the band draws, as last read; a figure the engine does not have is left out. */
export type StatusData = {
  cwd: string
  root: string
  home?: string
  git?: StatusGit
  model?: string
  effort?: string
  elapsedMs?: number
  context?: { tokens: number; window: number; percent: number }
  costUsd?: number
  limits: StatusLimit[]
  account?: string
  /** When these figures were read, in epoch milliseconds: reset countdowns count from it. */
  now: number
}

/** One Token Weather reading of the context window, taken as a main-loop turn ends. */
export type TokenReading = { tokens: number; window: number; percent: number }

/** The main loop's model and effort as its latest request named them. */
export type StatusTurnModel = { model: string; effort?: string }

declare module 'claude-code' {
  interface PluginState {
    'rich-terminal': {
      /** False after `/rich off`: replies are drawn as the host draws them. */
      enabled: RichTerminalEnabled
      /** Per diagram id: increments whenever that diagram's picture attempt ends, success or failure, so only the replies holding it redraw. */
      pictureAttempts: StateFamily<number>
      /** Ids of the main-loop turns running now: an unclosed fence is still streaming only while one runs. */
      running: string[]
      /** The status band's settings, mirrored from the plugin's store so a change redraws the band. */
      statusSettings: StatusSettings
      /** The status band's figures; null until the first reading. */
      status: StatusData | null
      /** Token Weather's last readings, oldest first. */
      readings: TokenReading[]
      /** The main loop's model and effort; null until its first request. */
      turnModel: StatusTurnModel | null
    }
  }
}
