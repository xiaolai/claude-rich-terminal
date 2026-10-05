import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

const CONFIG = '/Users/me/.claude'
const NAMES = ['statusline-command.sh', 'statusline-ctl.sh', 'statusline-lib.sh'] as const

type Disk = {
  files: Map<string, string>
  runs: string[][]
  kept: Map<string, unknown>
  settings: Record<string, unknown>
}

/** A home folder, the plugin's bundled scripts and its store, in memory. */
function disk(on: On, settings: Record<string, unknown> = {}): Disk {
  const d: Disk = { files: new Map(), runs: [], kept: new Map(), settings }
  mock.env(on, { HOME: '/Users/me' })
  on('ui.log', () => ({ value: undefined }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('session.start', (_$, e) => ({ cwd: e.cwd }) as never)
  on('settings.read', () => ({ value: d.settings }) as never)
  on('store.get', (_$, e) => ({ value: d.kept.get(e.key) }))
  on('store.set', (_$, e) => {
    d.kept.set(e.key, e.value)
    return { value: undefined }
  })
  on('fs.read', (_$, e) => {
    const bundled = /\/statusline\/scripts\/(statusline-[a-z]+\.sh)$/.exec(e.path)
    if (bundled !== null && !e.path.startsWith(CONFIG)) {
      return { value: `new ${bundled[1]}` }
    }
    const text = d.files.get(e.path)
    if (text === undefined) throw new Error('ENOENT')
    return { value: text }
  })
  on('fs.write', (_$, e) => {
    d.files.set(e.path, e.text)
    return { value: undefined }
  })
  on('process.run', (_$, e) => {
    d.runs.push([...e.argv])
    const stdout = e.argv[0] === 'bash' ? `status line → ${e.argv[2]}\n` : ''
    return { value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  return d
}

const rich = ($: Engine, args: string) =>
  $.command.run({ command: 'rich', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })

const start = ($: Engine, isInteractive = true) => $.session.start({ cwd: '/work', surface: 'terminal', isInteractive } as never)

test('/rich status actions run the bundled controller and answer its line', { timeoutMs: 60_000 }, async ($, on) => {
  const d = disk(on)
  expect((await rich($, 'status')).text).toBe('status line → status')
  expect((await rich($, 'status theme')).text).toBe('status line → theme')
  expect(d.runs.every(argv => argv[0] === 'bash' && argv[1]!.endsWith('/statusline/scripts/statusline-ctl.sh'))).toBe(true)
  expect((await rich($, 'status bogus')).text).toContain('unknown status action "bogus"')
  expect(d.runs.length).toBe(2)
})

test('/rich status setup copies the scripts, makes them executable and wires statusLine', { timeoutMs: 60_000 }, async ($, on) => {
  const d = disk(on)
  d.files.set(`${CONFIG}/settings.json`, JSON.stringify({ model: 'opus', permissions: { allow: ['Bash(ls)'] } }))
  const answer = (await rich($, 'status setup')).text
  expect(answer).toContain('statusLine runs /Users/me/.claude/statusline-command.sh')
  for (const name of NAMES) expect(d.files.get(`${CONFIG}/${name}`)).toBe(`new ${name}`)
  expect(d.runs).toContainEqual(['chmod', '755', `${CONFIG}/statusline-command.sh`, `${CONFIG}/statusline-ctl.sh`])
  const settings = JSON.parse(d.files.get(`${CONFIG}/settings.json`)!)
  expect(settings.model).toBe('opus')
  expect(settings.permissions).toEqual({ allow: ['Bash(ls)'] })
  expect(settings.statusLine).toEqual({ type: 'command', command: 'bash "/Users/me/.claude/statusline-command.sh"' })
  expect(d.kept.get('statuslineInstalled')).toEqual(Object.fromEntries(NAMES.map(n => [n, `new ${n}`])))
})

test('a broken settings.json stops setup before anything is written', { timeoutMs: 60_000 }, async ($, on) => {
  const d = disk(on)
  d.files.set(`${CONFIG}/settings.json`, '{ "model": ')
  expect((await rich($, 'status setup')).text).toContain('could not be read as JSON, so it was left alone')
  expect(d.files.get(`${CONFIG}/settings.json`)).toBe('{ "model": ')
  expect(NAMES.some(n => d.files.has(`${CONFIG}/${n}`))).toBe(false)
})

test('a session start replaces outdated and missing copies, and never a customized one', { timeoutMs: 60_000 }, async ($, on) => {
  const d = disk(on, { statusLine: { type: 'command', command: `bash ${CONFIG}/statusline-command.sh` } })
  d.kept.set('statuslineInstalled', { 'statusline-command.sh': 'old', 'statusline-ctl.sh': 'old' })
  d.files.set(`${CONFIG}/statusline-command.sh`, 'old')
  d.files.set(`${CONFIG}/statusline-ctl.sh`, 'old, then edited')
  await start($)
  expect(d.files.get(`${CONFIG}/statusline-command.sh`)).toBe('new statusline-command.sh')
  expect(d.files.get(`${CONFIG}/statusline-ctl.sh`)).toBe('old, then edited')
  expect(d.files.get(`${CONFIG}/statusline-lib.sh`)).toBe('new statusline-lib.sh')
  expect((await rich($, 'status check')).text).toContain('statusline-ctl.sh      customized')
})

test('a current copy is adopted, so the next update can replace it', { timeoutMs: 60_000 }, async ($, on) => {
  const d = disk(on, { statusLine: { command: `bash ${CONFIG}/statusline-command.sh` } })
  for (const name of NAMES) d.files.set(`${CONFIG}/${name}`, `new ${name}`)
  await start($)
  expect(d.kept.get('statuslineInstalled')).toEqual(Object.fromEntries(NAMES.map(n => [n, `new ${n}`])))
  expect(d.runs.filter(argv => argv[0] === 'chmod').length).toBe(1)
})

test('nothing is copied when statusLine runs something else, or outside an interactive session', { timeoutMs: 60_000 }, async ($, on) => {
  const d = disk(on, { statusLine: { command: 'bash /elsewhere/line.sh' } })
  d.files.set(`${CONFIG}/statusline-command.sh`, 'old')
  d.kept.set('statuslineInstalled', { 'statusline-command.sh': 'old' })
  await start($)
  d.settings = { statusLine: { command: `bash ${CONFIG}/statusline-command.sh` } }
  await start($, false)
  expect(d.files.get(`${CONFIG}/statusline-command.sh`)).toBe('old')
  expect(d.runs).toEqual([])
})
