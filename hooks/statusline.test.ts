import { expect, test } from 'claude-code/testing'

import { describeCheck, legacyIsPristine, runsScript, scriptState, statusCommand, statusLineCommand, wiring, withStatusLine } from './statusline.ts'

test('status actions parse strictly', () => {
  expect(statusCommand([])).toEqual({ kind: 'controller', action: 'status' })
  expect(statusCommand(['theme'])).toEqual({ kind: 'controller', action: 'theme' })
  expect(statusCommand(['icons'])).toEqual({ kind: 'controller', action: 'icons' })
  expect(statusCommand(['setup'])).toEqual({ kind: 'setup' })
  expect(statusCommand(['check'])).toEqual({ kind: 'check' })
  // `status` is the bare command's action, never one passed in.
  expect(statusCommand(['status']).kind).toBe('invalid')
  expect(statusCommand(['rm', '-rf']).kind).toBe('invalid')
  expect(statusCommand(['--help']).kind).toBe('invalid')
})

test('setup sets statusLine and keeps every other key, its own extras included', () => {
  const before = JSON.stringify({ model: 'opus', statusLine: { type: 'command', command: 'old', padding: 1, refreshInterval: 5 } })
  const after = JSON.parse(withStatusLine(before, '/Users/me/.claude'))
  expect(after.model).toBe('opus')
  expect(after.statusLine).toEqual({ type: 'command', command: 'bash "/Users/me/.claude/rich-status.sh"', padding: 1, refreshInterval: 5 })
  expect(JSON.parse(withStatusLine('', '/d')).statusLine.command).toBe(statusLineCommand('/d'))
  expect(withStatusLine('{}', '/d').endsWith('}\n')).toBe(true)
})

test('a settings file that is not a JSON object is refused, never overwritten', () => {
  expect(() => withStatusLine('{ "a": ', '/d')).toThrow()
  expect(() => withStatusLine('[1, 2]', '/d')).toThrow('does not hold a JSON object')
  expect(() => withStatusLine('null', '/d')).toThrow('does not hold a JSON object')
})

test('the statusLine setting runs a script only when its path is a whole argument', () => {
  const path = '/Users/me/.claude/rich-status.sh'
  expect(runsScript({ command: `bash ${path}` }, path)).toBe(true)
  expect(runsScript({ command: statusLineCommand('/Users/me/.claude') }, path)).toBe(true)
  expect(runsScript({ command: `bash '${path}'` }, path)).toBe(true)
  expect(runsScript({ command: `GIT_BUDGET=1 bash ${path}` }, path)).toBe(true)
  expect(runsScript({ command: 'bash /elsewhere/rich-status.sh' }, path)).toBe(false)
  expect(runsScript({ command: `bash ${path}.old` }, path)).toBe(false)
  expect(runsScript({ command: `bash /x${path}` }, path)).toBe(false)
  expect(runsScript(undefined, path)).toBe(false)
  expect(runsScript({ command: 3 }, path)).toBe(false)
})

test('the setting runs this plugin\'s renderer, an old-named copy, or something else', () => {
  expect(wiring({ command: 'bash "/d/rich-status.sh"' }, '/d')).toBe('ours')
  expect(wiring({ command: 'bash /d/statusline-command.sh' }, '/d')).toBe('legacy')
  expect(wiring({ command: 'bash /d/other.sh' }, '/d')).toBe('other')
  expect(wiring(undefined, '/d')).toBe('other')
})

test('old-named copies move by themselves only when each is exactly what was installed', () => {
  const record = { 'statusline-command.sh': 'a', 'statusline-ctl.sh': 'b', 'statusline-lib.sh': 'c' }
  expect(legacyIsPristine({ 'statusline-command.sh': 'a', 'statusline-ctl.sh': 'b', 'statusline-lib.sh': 'c' }, record)).toBe(true)
  expect(legacyIsPristine({ 'statusline-command.sh': 'a', 'statusline-ctl.sh': undefined, 'statusline-lib.sh': 'c' }, record)).toBe(true)
  expect(legacyIsPristine({ 'statusline-command.sh': 'a', 'statusline-ctl.sh': 'edited', 'statusline-lib.sh': 'c' }, record)).toBe(false)
  expect(legacyIsPristine({ 'statusline-command.sh': undefined, 'statusline-ctl.sh': 'b', 'statusline-lib.sh': 'c' }, record)).toBe(false)
  expect(legacyIsPristine({ 'statusline-command.sh': 'a', 'statusline-ctl.sh': 'b', 'statusline-lib.sh': 'c' }, {})).toBe(false)
})

test('a copy is replaced only while it is still what the plugin installed', () => {
  expect(scriptState('new', undefined, undefined)).toBe('missing')
  expect(scriptState('new', 'new', undefined)).toBe('current')
  expect(scriptState('new', 'old', 'old')).toBe('outdated')
  expect(scriptState('new', 'edited', 'old')).toBe('customized')
  expect(scriptState('new', 'old', undefined)).toBe('customized')
})

test('the check names each script and whether the setting runs them', () => {
  const text = describeCheck({ 'rich-status.sh': 'current', 'rich-status-ctl.sh': 'customized', 'rich-status-lib.sh': 'missing' }, 'other', '/d')
  expect(text.split('\n')).toEqual([
    'Status line scripts copied into /d:',
    '  rich-status.sh      up to date',
    '  rich-status-ctl.sh  edited since it was copied; left alone (/rich status setup replaces it)',
    '  rich-status-lib.sh  missing (/rich status setup copies it)',
    "Claude Code's statusLine setting runs something else; /rich status setup points it at these copies.",
  ])
  const current = { 'rich-status.sh': 'outdated', 'rich-status-ctl.sh': 'current', 'rich-status-lib.sh': 'current' } as const
  expect(describeCheck(current, 'ours', '/d')).toContain(
    "  rich-status.sh      older than this plugin; replaced at the next session start\n  rich-status-ctl.sh  up to date\n  rich-status-lib.sh  up to date\nClaude Code's statusLine setting runs these copies.",
  )
  expect(describeCheck(current, 'legacy', '/d')).toContain('runs the older statusline-*.sh copies; /rich status setup moves them to these names.')
})
