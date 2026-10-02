import type { On, RenderElement, RenderViewport } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { hash } from './core.ts'
import { renderMermaidAscii } from './vendor/mermaid-ascii.js'

const F = '```'
const FLOW = 'flowchart LR\n  A[Start] --> B{OK?}\n  B -->|yes| C(Done)'
const REPLY = `Here it is:\n\n${F}mermaid\n${FLOW}\n${F}\n\nAfter.`

type Seen = { text: string; props: Record<string, unknown>; viewport: RenderViewport | undefined; surface: string }

/** Stands for the engine beneath the plugin: records what reaches it and draws a stub. */
function observe(on: On): Seen[] {
  const seen: Seen[] = []
  on('ui.render', { component: 'AssistantMessage' }, ($, e) => {
    seen.push({ text: e.props.text, props: { ...e.props }, viewport: e.viewport, surface: e.surface })
    const { Text } = $.ui.resolve(e)
    return h(Text, null, 'engine') as RenderElement
  })
  return seen
}

function art(source: string, direction?: 'TD'): string {
  const lines = renderMermaidAscii(source, { colorMode: 'none', hyperlinks: false, direction })
    .replace(/\s+$/, '')
    .split('\n')
    .map(line => line.replace(/\s+$/, ''))
  return [`${F}text`, ...lines, F].join('\n')
}

function width(block: string): number {
  return Math.max(...block.split('\n').map(line => [...line].length))
}

const mountReply = ($: Engine, text: string, columns = 120, extra: Record<string, unknown> = {}) =>
  $.ui.mount({
    plugin: 'rich-terminal',
    surface: 'terminal',
    component: 'AssistantMessage',
    props: { text, isFirstOfReply: true, ...extra },
    viewport: { columns, rows: 40 },
  })

test('a Mermaid fence is drawn in place, exactly, and the rest of the reply is untouched', { timeoutMs: 90_000 }, async ($, on) => {
  const seen = observe(on)
  await mountReply($, REPLY)
  expect(seen.at(-1)!.text).toBe(`Here it is:\n\n${art(FLOW)}\n\nAfter.`)
})

test('a reply with no diagram reaches the engine unchanged, props and envelope included', { timeoutMs: 90_000 }, async ($, on) => {
  const seen = observe(on)
  const text = `| a | b |\n|---|---|\n| 1 | 2 |\n\n${F}js\nconst mermaid = 1\n${F}`
  await mountReply($, text, 100, { isFirstOfReply: false, onScreen: null })
  expect(seen.at(-1)!.text).toBe(text)
  expect(seen.at(-1)!.props.isFirstOfReply).toBe(false)
  expect(seen.at(-1)!.props.onScreen).toBe(null)
  expect(seen.at(-1)!.viewport).toEqual({ columns: 100, rows: 40 })
})

test('a rewritten reply keeps its other props and envelope', { timeoutMs: 90_000 }, async ($, on) => {
  const seen = observe(on)
  await mountReply($, REPLY, 120, { isFirstOfReply: false, onScreen: null })
  expect(seen.at(-1)!.props.isFirstOfReply).toBe(false)
  expect(seen.at(-1)!.props.onScreen).toBe(null)
  expect(seen.at(-1)!.surface).toBe('terminal')
})

test('a flowchart too wide left to right is drawn top to bottom', { timeoutMs: 90_000 }, async ($, on) => {
  const seen = observe(on)
  const wide = 'flowchart LR\n  A[Reply with Mermaid] --> B{Plugin on?}\n  B -->|yes| C(Drawn in place)\n  C --> E[Pane preview]'
  const lr = art(wide)
  const td = art(wide, 'TD')
  expect(width(td) < width(lr)).toBe(true)
  // Exactly as wide as the top-to-bottom drawing, too narrow for left to right.
  await mountReply($, `${F}mermaid\n${wide}\n${F}`, width(td) + 6)
  expect(seen.at(-1)!.text).toBe(td)
  // One column narrower: neither fits, the source stays.
  await mountReply($, `${F}mermaid\n${wide}\n${F}`, width(td) + 5)
  expect(seen.at(-1)!.text).toBe(`${F}mermaid\n${wide}\n${F}`)
})

test('a diagram too wide for the terminal keeps its source', { timeoutMs: 90_000 }, async ($, on) => {
  const seen = observe(on)
  const text = `${F}mermaid\nsequenceDiagram\n  participant A as A participant with a long name\n  participant B as Another long participant name\n  A->>B: hello\n${F}`
  await mountReply($, text, 40)
  expect(seen.at(-1)!.text).toBe(text)
})

test('several diagrams are each drawn; undrawable ones and quoted examples keep their source', { timeoutMs: 90_000 }, async ($, on) => {
  const seen = observe(on)
  const bad = `${F}mermaid\ngantt\n  title Not drawable as text\n${F}`
  const quoted = `${F}${F}md\n${F}mermaid\ngraph TD\n${F}\n${F}${F}`
  const text = `one\n\n${F}mermaid\n${FLOW}\n${F}\n\ntwo\n\n${bad}\n\n${quoted}\n\n${F}mermaid\nsequenceDiagram\n  A->>B: hi\n${F}`
  await mountReply($, text)
  const out = seen.at(-1)!.text
  expect(out.startsWith(`one\n\n${art(FLOW)}\n\ntwo\n\n${bad}\n\n${quoted}\n\n`)).toBe(true)
  expect(out.endsWith(art('sequenceDiagram\n  A->>B: hi'))).toBe(true)
})

test('an unclosed fence keeps its source when no turn is running', { timeoutMs: 90_000 }, async ($, on) => {
  const seen = observe(on)
  const text = `${F}mermaid\nflowchart LR\n  A --> B`
  await mountReply($, text)
  expect(seen.at(-1)!.text).toBe(text)
})

test('a diagram inside a blockquote is drawn inside the blockquote', { timeoutMs: 90_000 }, async ($, on) => {
  const seen = observe(on)
  await mountReply($, `> ${F}mermaid\n> ${FLOW.replace(/\n/g, '\n> ')}\n> ${F}`)
  expect(seen.at(-1)!.text).toBe(
    art(FLOW)
      .split('\n')
      .map(line => `> ${line}`)
      .join('\n'),
  )
})

test('a narrow terminal keeps the source rather than overflowing', { timeoutMs: 90_000 }, async ($, on) => {
  const seen = observe(on)
  await mountReply($, REPLY, 12)
  expect(seen.at(-1)!.text).toBe(REPLY)
})

test('other surfaces receive the reply unchanged', { timeoutMs: 90_000 }, async ($, on) => {
  const seen = observe(on)
  for (const surface of ['desktop', 'vscode', 'mobile'] as const) {
    await $.ui.mount({ plugin: 'rich-terminal', surface, component: 'AssistantMessage', props: { text: REPLY, isFirstOfReply: true } })
    expect(seen.at(-1)!.text).toBe(REPLY)
    expect(seen.at(-1)!.surface).toBe(surface)
  }
})

const rich = ($: Engine, args: string) =>
  $.command.run({ command: 'rich', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })

function session(on: On, texts: string[]): void {
  on('session.messages', () => ({ value: texts.map(text => ({ role: 'assistant' as const, text, toolUses: [] })) }))
}

test('/rich list numbers the diagrams with their ids; /rich off and on switch drawing', { timeoutMs: 90_000 }, async ($, on) => {
  session(on, [REPLY, `${F}mermaid\npie title P\n  "a" : 1\n${F}`])
  const seen = observe(on)
  const listed = await rich($, 'list')
  expect(listed.text).toMatch(/^ {2}1 {2}[0-9a-f]{16} {2}flowchart/)
  expect(listed.text).toMatch(/\n {2}2 {2}[0-9a-f]{16} {2}pie/)

  expect((await rich($, 'off')).text).toBe('Rich terminal is off.')
  await mountReply($, REPLY)
  expect(seen.at(-1)!.text).toBe(REPLY)
  await rich($, 'on')
  await mountReply($, REPLY)
  expect(seen.at(-1)!.text).not.toBe(REPLY)

  expect((await rich($, 'open 9')).text).toContain('No diagram 9; there are 2.')
  expect((await rich($, 'bogus')).text).toContain('unknown command "bogus"')
})

/** Raises session.start through the plugin, the engine beneath it stubbed. */
async function startSession($: Engine, on: On): Promise<void> {
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('session.start', (_$, e) => ({ cwd: e.cwd }) as never)
  await $.session.start({ cwd: '/Users/me', surface: 'terminal', isInteractive: true } as never)
}

/** A home folder and plugin cache in memory. */
function disk(on: On, files: Map<string, string>, extra: Set<string> = new Set(), env: Record<string, string> = {}, opener?: (argv: string[]) => void): void {
  mock.env(on, { HOME: '/Users/me', ...env })
  on('process.run', (_$, e) => {
    const [cmd] = e.argv
    const stdout = cmd === 'id' || cmd === 'stat' ? '501\n' : ''
    if (cmd !== 'chmod' && cmd !== 'id' && cmd !== 'stat') {
      if (opener === undefined) throw new Error(`not found: ${cmd}`)
      opener([...e.argv])
    }
    return { value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('fs.write', (_$, e) => {
    files.set(e.path, e.text)
    return { value: undefined }
  })
  on('fs.exists', (_$, e) => ({ value: files.has(e.path) || extra.has(e.path) }))
  on('fs.read', (_$, e) => {
    const text = files.get(e.path)
    if (text === undefined) throw new Error('ENOENT')
    return { value: text }
  })
  on('fs.stat', (_$, e) => ({ value: { kind: files.has(e.path) ? ('file' as const) : ('dir' as const), size: 0, mtimeMs: 0, isLink: false, realPath: e.path } }))
}

test('/rich open writes a private page and opens it with the platform opener', { timeoutMs: 90_000 }, async ($, on) => {
  session(on, [REPLY])
  const files = new Map<string, string>()
  const runs: string[][] = []
  disk(on, files, new Set(['/usr/bin/open']), {}, argv => runs.push(argv))
  const opened = await rich($, 'open 1')
  expect(opened.text).toMatch(/^Opened flowchart [0-9a-f]{16} in the browser\.$/)
  const page = [...files.keys()].find(path => path.endsWith('.html'))!
  expect(page.startsWith('/Users/me/.claude/plugins/data/rich-terminal/')).toBe(true)
  expect(files.get(page)).toContain("default-src 'none'")
  expect(runs.at(-1)).toEqual(['/usr/bin/open', page])
})

test('/rich open reports a failed opener instead of throwing', { timeoutMs: 90_000 }, async ($, on) => {
  session(on, [REPLY])
  disk(on, new Map())
  const opened = await rich($, 'open')
  expect(opened.text).toContain('Could not open the browser: could not run xdg-open')
})

test('/rich open refuses a cache folder that resolves outside the home folder', { timeoutMs: 90_000 }, async ($, on) => {
  session(on, [REPLY])
  mock.env(on, { HOME: '/Users/me' })
  on('fs.write', () => ({ value: undefined }))
  on('fs.stat', (_$, e) => ({
    value: { kind: 'dir' as const, size: 0, mtimeMs: 0, isLink: true, realPath: e.path.startsWith('/Users/me/') ? '/tmp/planted' : e.path },
  }))
  const opened = await rich($, 'open')
  expect(opened.text).toContain('no private cache folder')
})

test('with images on outside a picture terminal, diagrams stay text', { options: { images: true }, timeoutMs: 90_000 }, async ($, on) => {
  mock.env(on, { HOME: '/Users/me', TERM_PROGRAM: 'Apple_Terminal' })
  const seen = observe(on)
  await startSession($, on)
  await mountReply($, REPLY)
  expect(seen.at(-1)!.text).toBe(`Here it is:\n\n${art(FLOW)}\n\nAfter.`)
})

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

/** A fake headless Chrome: the DOM dump reports `title`, a screenshot writes its file unless `failShots`. */
function fakeChrome(on: On, files: Map<string, string>, title: string, failShots = false): string[][] {
  const launches: string[][] = []
  on('process.spawn', async function* (_$, e) {
    launches.push([...e.argv])
    const shot = e.argv.find(arg => arg.startsWith('--screenshot='))
    if (shot === undefined) {
      yield { stream: 'stdout' as const, text: `<html><head><title>${title}</title></head></html>` }
    } else if (!failShots) {
      files.set(shot.slice('--screenshot='.length), 'PNG')
      yield { stream: 'stderr' as const, text: `1234 bytes written to file ${shot.slice(13)}` }
    } else {
      yield { stream: 'stderr' as const, text: 'GPU process crashed' }
    }
    return { value: { code: failShots ? 1 : 0, signal: null } }
  })
  return launches
}

test('in a picture terminal with images on, a diagram becomes an Image once Chrome has drawn it', { options: { images: true }, timeoutMs: 90_000 }, async ($, on) => {
  const files = new Map<string, string>()
  disk(on, files, new Set([CHROME]), { TERM_PROGRAM: 'ghostty' })
  mock.clock(on)
  on('session.id', () => ({ value: 'test-session' }))
  const launches = fakeChrome(on, files, 'SIZE 400x300')
  const seen = observe(on)
  await startSession($, on)

  const drawing = await mountReply($, REPLY)
  // Until the picture lands, the reply shows the text drawing.
  if (seen.length > 0) expect(seen[0]!.text).toBe(`Here it is:\n\n${art(FLOW)}\n\nAfter.`)
  let image = await drawing.find({ type: 'Image' })
  for (let i = 0; i < 500 && image === undefined; i++) image = await drawing.find({ type: 'Image' })
  expect(image?.props.columns).toBe(50)
  expect(String((image?.props.source as { file: string }).file)).toMatch(/^\/Users\/me\/\.claude\/plugins\/data\/rich-terminal\/[0-9a-f]{16}-dark\.[0-9a-f-]+\.png$/)
  expect((await drawing.findAll({ type: 'Markdown' })).map(m => m.props.text)).toEqual(['Here it is:', 'After.'])
  expect(launches).toHaveLength(2)
  expect(launches[0]).toContain('--user-data-dir=/Users/me/.claude/plugins/data/rich-terminal/chrome-test-session')
  const page = [...files.entries()].find(([path]) => path.endsWith('.page.html'))![1]
  expect(page).toContain("default-src 'none'")
})

test('a failed picture keeps the text drawing, retries only after its cooldown, and a corrupt cache record is ignored', { options: { images: true }, timeoutMs: 90_000 }, async ($, on) => {
  const files = new Map<string, string>()
  disk(on, files, new Set([CHROME]), { TERM_PROGRAM: 'ghostty' })
  const clock = mock.clock(on)
  on('session.id', () => ({ value: 'test-session' }))
  const launches = fakeChrome(on, files, 'SIZE 400x300', true)
  on('ui.log', () => ({ value: undefined }))
  await startSession($, on)
  const markdown = async () => (await drawing.findAll({ type: 'Markdown' })).map(m => m.props.text)

  const drawing = await mountReply($, REPLY)
  for (let i = 0; i < 200 && launches.length < 2; i++) await drawing.drawn()
  expect(launches).toHaveLength(2)
  for (let i = 0; i < 50; i++) await drawing.drawn()
  expect(await drawing.find({ type: 'Image' })).toBe(undefined)
  // The plugin draws its own tree in picture mode; the diagram stays the text drawing.
  expect(await markdown()).toEqual(['Here it is:', art(FLOW), 'After.'])

  // Within the cooldown: no new attempt on a redraw.
  await mountReply($, REPLY)
  for (let i = 0; i < 50; i++) await drawing.drawn()
  expect(launches).toHaveLength(2)

  // After it: one more attempt.
  await clock.advance(31_000)
  await mountReply($, REPLY)
  for (let i = 0; i < 200 && launches.length < 4; i++) await drawing.drawn()
  expect(launches).toHaveLength(4)
})

test('a cached picture record that points outside the cache is not trusted', { options: { images: true }, timeoutMs: 90_000 }, async ($, on) => {
  const files = new Map<string, string>()
  // The record is on disk before this load has drawn anything, so it is read, not remembered.
  const id = hash(FLOW)
  const base = `/Users/me/.claude/plugins/data/rich-terminal/${id}-dark`
  files.set('/etc/passwd', 'root')
  files.set(`${base}.json`, JSON.stringify({ file: '/etc/passwd', width: 400, height: 300, source: FLOW }))
  disk(on, files, new Set([CHROME]), { TERM_PROGRAM: 'ghostty' })
  mock.clock(on)
  on('session.id', () => ({ value: 'test-session' }))
  const launches = fakeChrome(on, files, 'SIZE 400x300')
  await startSession($, on)
  const drawing = await mountReply($, `${F}mermaid\n${FLOW}\n${F}`)
  let image = await drawing.find({ type: 'Image' })
  for (let i = 0; i < 500 && image === undefined; i++) image = await drawing.find({ type: 'Image' })
  // Chrome ran again, and the picture shown is the fresh one.
  expect(launches).toHaveLength(2)
  expect(String((image?.props.source as { file: string }).file).startsWith(`${base}.`)).toBe(true)
})

test('an unclosed fence shows a placeholder while a turn runs, and its source once the turn ends', { timeoutMs: 90_000 }, async ($, on) => {
  const seen = observe(on)
  on('turn.start', (_$, e) => ({ turnId: e.turnId }) as never)
  on('turn.complete', () => ({ text: '' }) as never)
  const text = `${F}mermaid\nflowchart LR\n  A --> B`
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await mountReply($, text)
  expect(seen.at(-1)!.text).toBe('*Drawing Mermaid diagram…*')
  await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' } as never)
  await mountReply($, text)
  expect(seen.at(-1)!.text).toBe(text)
})
