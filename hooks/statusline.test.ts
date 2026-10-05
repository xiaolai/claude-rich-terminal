import { expect, test } from 'claude-code/testing'

import { describeCheck, runsOurRenderer, scriptState, statusCommand, statusLineCommand, withStatusLine } from './statusline.ts'

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
  expect(after.statusLine).toEqual({ type: 'command', command: 'bash "/Users/me/.claude/statusline-command.sh"', padding: 1, refreshInterval: 5 })
  expect(JSON.parse(withStatusLine('', '/d')).statusLine.command).toBe(statusLineCommand('/d'))
  expect(withStatusLine('{}', '/d').endsWith('}\n')).toBe(true)
})

test('a settings file that is not a JSON object is refused, never overwritten', () => {
  expect(() => withStatusLine('{ "a": ', '/d')).toThrow()
  expect(() => withStatusLine('[1, 2]', '/d')).toThrow('does not hold a JSON object')
  expect(() => withStatusLine('null', '/d')).toThrow('does not hold a JSON object')
})

test('the statusLine setting runs our renderer, quoted or not', () => {
  expect(runsOurRenderer({ command: 'bash /Users/me/.claude/statusline-command.sh' }, '/Users/me/.claude')).toBe(true)
  expect(runsOurRenderer({ command: statusLineCommand('/Users/me/.claude') }, '/Users/me/.claude')).toBe(true)
  expect(runsOurRenderer({ command: 'bash /elsewhere/statusline-command.sh' }, '/Users/me/.claude')).toBe(false)
  expect(runsOurRenderer(undefined, '/d')).toBe(false)
  expect(runsOurRenderer({ command: 3 }, '/d')).toBe(false)
})

test('a copy is replaced only while it is still what the plugin installed', () => {
  expect(scriptState('new', undefined, undefined)).toBe('missing')
  expect(scriptState('new', 'new', undefined)).toBe('current')
  expect(scriptState('new', 'old', 'old')).toBe('outdated')
  expect(scriptState('new', 'edited', 'old')).toBe('customized')
  expect(scriptState('new', 'old', undefined)).toBe('customized')
})

test('the check names each script and whether the setting runs them', () => {
  const text = describeCheck({ 'statusline-command.sh': 'current', 'statusline-ctl.sh': 'customized', 'statusline-lib.sh': 'missing' }, false, '/d')
  expect(text).toContain('statusline-ctl.sh      customized')
  expect(text).toContain('does not run these scripts')
  expect(text).toContain('never replaced')
})
