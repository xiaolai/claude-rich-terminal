import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

const CONFIG = '/Users/me/.claude'
const NAMES = ['rich-status.sh', 'rich-status-ctl.sh', 'rich-status-lib.sh'] as const
const OLD = ['statusline-command.sh', 'statusline-ctl.sh', 'statusline-lib.sh'] as const
const RENDERER = `${CONFIG}/rich-status.sh`
const OLD_RENDERER = `${CONFIG}/statusline-command.sh`

type Disk = {
  files: Map<string, string>
  runs: string[][]
  kept: Map<string, unknown>
  settings: Record<string, unknown>
}

/** A home folder, the plugin's bundled scripts and its store, in memory; `rm` removes from it. */
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
    const bundled = /\/statusline\/scripts\/(rich-status[a-z-]*\.sh)$/.exec(e.path)
    if (bundled !== null && !e.path.startsWith(CONFIG)) return { value: `new ${bundled[1]}` }
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
    if (e.argv[0] === 'rm') for (const path of e.argv.slice(e.argv.indexOf('--') + 1)) d.files.delete(path)
    const stdout = e.argv[0] === 'bash' ? `status line → ${e.argv[2]}\n` : ''
    return { value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  return d
}

const rich = ($: Engine, args: string) =>
  $.command.run({ command: 'rich', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })

const start = ($: Engine, isInteractive = true) => $.session.start({ cwd: '/work', surface: 'terminal', isInteractive } as never)

/** An old-named setup as 0.6.x left it: copies, their record, and the settings file. */
function oldSetup(d: Disk, ctl = 'old statusline-ctl.sh'): void {
  for (const name of OLD) d.files.set(`${CONFIG}/${name}`, name === 'statusline-ctl.sh' ? ctl : `old ${name}`)
  d.kept.set('statuslineInstalled', Object.fromEntries(OLD.map(name => [name, `old ${name}`])))
  d.files.set(`${CONFIG}/statusline.state`, 'LINES=3\nICONS=nerd\n')
  d.files.set(`${CONFIG}/.statusline-account`, 'me\n')
  d.files.set(`${CONFIG}/settings.json`, JSON.stringify({ model: 'opus', statusLine: { type: 'command', command: `bash ${OLD_RENDERER}` } }))
}

test('/rich status actions run the bundled controller and answer its line', { timeoutMs: 60_000 }, async ($, on) => {
  const d = disk(on)
  expect((await rich($, 'status')).text).toBe('status line → status')
  expect((await rich($, 'status theme')).text).toBe('status line → theme')
  expect(d.runs.every(argv => argv[0] === 'bash' && argv[1]!.endsWith('/statusline/scripts/rich-status-ctl.sh'))).toBe(true)
  expect((await rich($, 'status bogus')).text).toContain('unknown status action "bogus"')
  expect(d.runs.length).toBe(2)
})

test('/rich status setup copies the scripts, makes them executable and wires statusLine', { timeoutMs: 60_000 }, async ($, on) => {
  const d = disk(on)
  d.files.set(`${CONFIG}/settings.json`, JSON.stringify({ model: 'opus', permissions: { allow: ['Bash(ls)'] } }))
  const answer = (await rich($, 'status setup')).text
  expect(answer).toContain(`statusLine runs ${RENDERER}`)
  for (const name of NAMES) expect(d.files.get(`${CONFIG}/${name}`)).toBe(`new ${name}`)
  expect(d.runs).toContainEqual(['chmod', '755', RENDERER, `${CONFIG}/rich-status-ctl.sh`])
  const settings = JSON.parse(d.files.get(`${CONFIG}/settings.json`)!)
  expect(settings.model).toBe('opus')
  expect(settings.permissions).toEqual({ allow: ['Bash(ls)'] })
  expect(settings.statusLine).toEqual({ type: 'command', command: `bash "${RENDERER}"` })
  expect(d.kept.get('statuslineInstalled')).toEqual(Object.fromEntries(NAMES.map(n => [n, `new ${n}`])))
})

test('a broken settings.json stops setup before anything is written', { timeoutMs: 60_000 }, async ($, on) => {
  const d = disk(on)
  d.files.set(`${CONFIG}/settings.json`, '{ "model": ')
  expect((await rich($, 'status setup')).text).toContain('could not be read as JSON, so it was left alone')
  expect(d.files.get(`${CONFIG}/settings.json`)).toBe('{ "model": ')
  expect(NAMES.some(n => d.files.has(`${CONFIG}/${n}`))).toBe(false)
  expect(d.runs).toEqual([])
})

test('a session start replaces outdated and missing copies, and never an edited one', { timeoutMs: 60_000 }, async ($, on) => {
  const d = disk(on, { statusLine: { type: 'command', command: `bash ${RENDERER}` } })
  d.kept.set('statuslineInstalled', { 'rich-status.sh': 'old', 'rich-status-ctl.sh': 'old' })
  d.files.set(RENDERER, 'old')
  d.files.set(`${CONFIG}/rich-status-ctl.sh`, 'old, then edited')
  await start($)
  expect(d.files.get(RENDERER)).toBe('new rich-status.sh')
  expect(d.files.get(`${CONFIG}/rich-status-ctl.sh`)).toBe('old, then edited')
  expect(d.files.get(`${CONFIG}/rich-status-lib.sh`)).toBe('new rich-status-lib.sh')
  expect((await rich($, 'status check')).text).toContain('rich-status-ctl.sh  edited since it was copied')
})

test('a current copy is adopted, so the next update can replace it', { timeoutMs: 60_000 }, async ($, on) => {
  const d = disk(on, { statusLine: { command: `bash ${RENDERER}` } })
  for (const name of NAMES) d.files.set(`${CONFIG}/${name}`, `new ${name}`)
  await start($)
  expect(d.kept.get('statuslineInstalled')).toEqual(Object.fromEntries(NAMES.map(n => [n, `new ${n}`])))
  expect(d.runs.filter(argv => argv[0] === 'chmod').length).toBe(1)
})

test('nothing is copied when statusLine runs something else, or outside an interactive session', { timeoutMs: 60_000 }, async ($, on) => {
  const d = disk(on, { statusLine: { command: 'bash /elsewhere/line.sh' } })
  d.files.set(RENDERER, 'old')
  d.kept.set('statuslineInstalled', { 'rich-status.sh': 'old' })
  await start($)
  d.settings = { statusLine: { command: `bash ${RENDERER}` } }
  await start($, false)
  expect(d.files.get(RENDERER)).toBe('old')
  expect(d.runs).toEqual([])
})

test('an old-named setup exactly as the plugin installed it moves to the new names at a session start', { timeoutMs: 60_000 }, async ($, on) => {
  const d = disk(on, { statusLine: { type: 'command', command: `bash ${OLD_RENDERER}` } })
  oldSetup(d)
  await start($)
  for (const name of NAMES) expect(d.files.get(`${CONFIG}/${name}`)).toBe(`new ${name}`)
  // The settings carry over, and the statusLine setting follows, every other key kept.
  expect(d.files.get(`${CONFIG}/rich-status.state`)).toBe('LINES=3\nICONS=nerd\n')
  const settings = JSON.parse(d.files.get(`${CONFIG}/settings.json`)!)
  expect(settings).toEqual({ model: 'opus', statusLine: { type: 'command', command: `bash "${RENDERER}"` } })
  // The old files are gone, and so are their records.
  for (const name of [...OLD, 'statusline.state', '.statusline-account']) expect(d.files.has(`${CONFIG}/${name}`)).toBe(false)
  expect(Object.keys(d.kept.get('statuslineInstalled') as object).sort()).toEqual([...NAMES].sort())
})

test('an edited old-named setup waits for /rich status setup, which keeps the edited file', { timeoutMs: 60_000 }, async ($, on) => {
  const d = disk(on, { statusLine: { type: 'command', command: `bash ${OLD_RENDERER}` } })
  oldSetup(d, 'old statusline-ctl.sh, then edited')
  await start($)
  expect(d.files.has(RENDERER)).toBe(false)
  expect(d.runs).toEqual([])
  expect((await rich($, 'status check')).text).toContain('runs the older statusline-*.sh copies; /rich status setup moves them')

  await rich($, 'status setup')
  expect(d.files.get(RENDERER)).toBe('new rich-status.sh')
  expect(JSON.parse(d.files.get(`${CONFIG}/settings.json`)!).statusLine.command).toBe(`bash "${RENDERER}"`)
  // Only the edited copy stays; the untouched old copies and the old settings file go.
  expect(d.files.get(`${CONFIG}/statusline-ctl.sh`)).toBe('old statusline-ctl.sh, then edited')
  expect(d.files.has(OLD_RENDERER)).toBe(false)
  expect(d.files.has(`${CONFIG}/statusline.state`)).toBe(false)
})

test('an existing rich-status.state is kept over an old statusline.state', { timeoutMs: 60_000 }, async ($, on) => {
  const d = disk(on)
  oldSetup(d)
  d.files.set(`${CONFIG}/rich-status.state`, 'LINES=1\n')
  await rich($, 'status setup')
  expect(d.files.get(`${CONFIG}/rich-status.state`)).toBe('LINES=1\n')
  expect(d.files.has(`${CONFIG}/statusline.state`)).toBe(false)
})
