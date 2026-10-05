// The status line under the prompt: Claude Code's statusLine setting runs the
// bundled bash renderer from a stable copy. This file decides; register.tsx acts.

/** The bundled scripts, copied beside each other: the renderer and controller source the lib. */
export const SCRIPTS = ['statusline-command.sh', 'statusline-ctl.sh', 'statusline-lib.sh'] as const
export type ScriptName = (typeof SCRIPTS)[number]
export const EXECUTABLE: readonly ScriptName[] = ['statusline-command.sh', 'statusline-ctl.sh']

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
  return `bash "${dir}/statusline-command.sh"`
}

/** Whether a statusLine setting runs the renderer copied into `dir`, quoted or not. */
export function runsOurRenderer(statusLine: unknown, dir: string): boolean {
  if (typeof statusLine !== 'object' || statusLine === null) return false
  const command = (statusLine as { command?: unknown }).command
  return typeof command === 'string' && command.includes(`${dir}/statusline-command.sh`)
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

export function describeCheck(states: Readonly<Record<ScriptName, ScriptState>>, wired: boolean, dir: string): string {
  const lines = SCRIPTS.map(name => `${name.padEnd(22)} ${states[name]}`)
  lines.push(wired ? `statusLine setting runs ${dir}/statusline-command.sh` : 'statusLine setting does not run these scripts: /rich status setup wires it')
  if (SCRIPTS.some(name => states[name] === 'customized')) lines.push('A customized copy is yours and is never replaced; /rich status setup replaces it.')
  return lines.join('\n')
}
