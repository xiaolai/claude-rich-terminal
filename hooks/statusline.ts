// The status line under the prompt: Claude Code's statusLine setting runs the
// bundled bash renderer from a stable copy. This file decides; register.tsx acts.

/** The bundled scripts, copied beside each other: the renderer and controller source the lib. */
export const SCRIPTS = ['rich-status.sh', 'rich-status-ctl.sh', 'rich-status-lib.sh'] as const
export type ScriptName = (typeof SCRIPTS)[number]
export const EXECUTABLE: readonly ScriptName[] = ['rich-status.sh', 'rich-status-ctl.sh']
export const RENDERER: ScriptName = 'rich-status.sh'
/** The settings the controller writes and the renderer reads, in `$HOME/.claude`. */
export const STATE_FILE = 'rich-status.state'

/**
 * The names before 1.0.0, when the scripts kept the names of the standalone
 * plugin they came from. A setup under these names is moved to the new ones.
 */
export const LEGACY_SCRIPTS = ['statusline-command.sh', 'statusline-ctl.sh', 'statusline-lib.sh'] as const
export type LegacyScriptName = (typeof LEGACY_SCRIPTS)[number]
export const LEGACY_RENDERER: LegacyScriptName = 'statusline-command.sh'
export const LEGACY_STATE_FILE = 'statusline.state'
export const LEGACY_ACCOUNT_CACHE = '.statusline-account'

/** Controller actions `/rich status <action>` passes straight through; none is `status`. */
export const CONTROLLER_ACTIONS = ['theme', 'style', 'lines', 'toggle', 'hide', 'show', 'bar', 'account', 'reset', 'weather', 'icons'] as const
type ControllerAction = (typeof CONTROLLER_ACTIONS)[number] | 'status'

export type StatusCommand = { kind: 'controller'; action: ControllerAction } | { kind: 'setup' } | { kind: 'check' } | { kind: 'invalid'; reason: string }

export const STATUS_HELP = [
  '/rich status                 show the status line settings',
  '/rich status setup           copy the status line scripts and point the statusLine setting at them',
  '/rich status check           compare the copied scripts with this plugin',
  '/rich status theme | style | lines | toggle | hide | show | bar | account | reset | weather | icons',
  '                             change one setting (see the README); takes effect on the next status update',
].join('\n')

export function statusCommand(words: readonly string[]): StatusCommand {
  const [action, ...rest] = words
  if (rest.length > 0) return { kind: 'invalid', reason: 'too many arguments' }
  if (action === undefined) return { kind: 'controller', action: 'status' }
  if (action === 'setup' || action === 'check') return { kind: action }
  if ((CONTROLLER_ACTIONS as readonly string[]).includes(action)) return { kind: 'controller', action: action as ControllerAction }
  return { kind: 'invalid', reason: `unknown status action "${action}"` }
}

/** The statusLine command for a renderer copied into `dir`; quoted, so a path with a space stays one argument. */
export function statusLineCommand(dir: string): string {
  return `bash "${dir}/${RENDERER}"`
}

/**
 * Whether a statusLine setting runs the script at `path`, quoted or not: the
 * path must be a whole argument, so `rich-status.sh.old` or a longer folder
 * name ending in the same path does not count.
 */
export function runsScript(statusLine: unknown, path: string): boolean {
  if (typeof statusLine !== 'object' || statusLine === null) return false
  const command = (statusLine as { command?: unknown }).command
  if (typeof command !== 'string') return false
  const quoted = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[\\s"'])${quoted}(["'\\s]|$)`).test(command)
}

/** Which renderer the statusLine setting runs: this plugin's, an old-named copy of it, or something else. */
export type Wiring = 'ours' | 'legacy' | 'other'
export function wiring(statusLine: unknown, dir: string): Wiring {
  if (runsScript(statusLine, `${dir}/${RENDERER}`)) return 'ours'
  return runsScript(statusLine, `${dir}/${LEGACY_RENDERER}`) ? 'legacy' : 'other'
}

/**
 * Whether old-named copies are exactly what this plugin installed: the
 * renderer is there and recorded, and every copy present equals its record.
 * Only then may they be moved to the new names without asking.
 */
export function legacyIsPristine(copies: Readonly<Record<LegacyScriptName, string | undefined>>, record: Readonly<Record<string, string>>): boolean {
  if (copies[LEGACY_RENDERER] === undefined) return false
  return LEGACY_SCRIPTS.every(name => copies[name] === undefined || copies[name] === record[name])
}

/**
 * settings.json text with statusLine pointing at the renderer in `dir`, every
 * other key kept, and the statusLine's own other keys (padding,
 * refreshInterval) kept too. Throws on text that is not a JSON object, so a
 * broken settings file is reported, never overwritten.
 */
export function withStatusLine(text: string, dir: string): string {
  const settings: unknown = text.trim() === '' ? {} : JSON.parse(text)
  if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) throw new Error('settings.json does not hold a JSON object')
  const old = (settings as { statusLine?: unknown }).statusLine
  const kept = typeof old === 'object' && old !== null && !Array.isArray(old) ? old : {}
  const statusLine = { ...kept, type: 'command', command: statusLineCommand(dir) }
  return `${JSON.stringify({ ...settings, statusLine }, null, 2)}\n`
}

/**
 * What to do with one copied script, from the bundled text, the copy's text
 * (undefined when missing) and what this plugin last installed there.
 *
 * A copy is replaced only when this plugin put it there and nobody has edited
 * it since; an edited copy is the person's and is left alone.
 */
export type ScriptState = 'current' | 'missing' | 'outdated' | 'customized'
export function scriptState(bundled: string, copy: string | undefined, installed: string | undefined): ScriptState {
  if (copy === undefined) return 'missing'
  if (copy === bundled) return 'current'
  return copy === installed ? 'outdated' : 'customized'
}

const STATE_TEXT: Record<ScriptState, string> = {
  current: 'up to date',
  outdated: 'older than this plugin; replaced at the next session start',
  customized: 'edited since it was copied; left alone (/rich status setup replaces it)',
  missing: 'missing (/rich status setup copies it)',
}

const WIRING_TEXT: Record<Wiring, string> = {
  ours: "Claude Code's statusLine setting runs these copies.",
  legacy: "Claude Code's statusLine setting runs the older statusline-*.sh copies; /rich status setup moves them to these names.",
  other: "Claude Code's statusLine setting runs something else; /rich status setup points it at these copies.",
}

/** Two answers: are the copies this plugin's current scripts, and does Claude Code's statusLine setting run them. */
export function describeCheck(states: Readonly<Record<ScriptName, ScriptState>>, wired: Wiring, dir: string): string {
  return [
    `Status line scripts copied into ${dir}:`,
    ...SCRIPTS.map(name => `  ${name.padEnd(19)} ${STATE_TEXT[states[name]]}`),
    WIRING_TEXT[wired],
  ].join('\n')
}
