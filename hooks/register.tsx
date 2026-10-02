import { atom, read, update } from 'claude-code'
import type { FsStat } from 'claude-code'
import type { EngineInterface, Register, RenderNode } from 'claude-code'

import {
  cells,
  fileUrl,
  findDiagrams,
  imageBox,
  imagePage,
  inlineArt,
  listing,
  MAX_AREA,
  MAX_SIDE,
  markdownSafe,
  needsWholeMarkdown,
  pageSize,
  parseCommand,
  pick,
  rewrite,
  scaleFor,
  segments,
  viewerHtml,
} from './core.ts'
import type { Diagram, PageScripts } from './core.ts'
import { renderMermaidAscii } from './vendor/mermaid-ascii.js'

const COMMAND = 'rich'
const enabled = atom({ plugin: 'rich-terminal', key: 'enabled' } as const, true)
/** One counter per diagram, bumped when its picture attempt ends: reading it subscribes just that diagram's replies. */
const attempts = { plugin: 'rich-terminal', key: 'pictureAttempts' } as const
/** Main-loop turns running now; while one runs, an unclosed fence is still streaming. */
const running = atom({ plugin: 'rich-terminal', key: 'running' } as const, [] as string[])

const HELP = [
  '/rich open [n|id]    open a diagram in the browser (n counts from the first diagram)',
  '/rich list           number the diagrams of this conversation, with their ids',
  '/rich on | off       draw diagrams in replies, or leave them as source',
  'With no number, the latest diagram is used.',
  'Diagram images (Ghostty, kitty): turn on "images" for this plugin in /config.',
].join('\n')

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]

/** Retries for a picture that failed, and the wait between them. */
const RETRIES = 3
const RETRY_AFTER_MS = 30_000
const ASCII_CACHE = 200

type Picture = { file: string; width: number; height: number; source: string }
type Failure = { attempts: number; at: number }

// Module memory: lost on a reload and rebuilt from the cache on disk.
const pages = new Map<string, { path: string; source: string }>()
const pictures = new Map<string, Picture | Failure>()
const rendering = new Set<string>()
const ascii = new Map<string, { source: string; art: string | undefined }>()
let queue: Promise<unknown> = Promise.resolve()
let cacheDir: string | undefined | null = null

/**
 * The plugin's cache: under the person's own home, never a shared temporary
 * folder, and refused when it resolves anywhere else (a planted symlink).
 */
async function workDir($: EngineInterface): Promise<string | undefined> {
  if (cacheDir !== null) return cacheDir
  cacheDir = undefined
  const home = await $.env.get('HOME')
  if (home === undefined || !home.startsWith('/')) return undefined
  const configured = await $.env.get('CLAUDE_PLUGIN_DATA')
  // Only a folder under the person's home is used; anything else is ignored before a byte is written.
  const dir = configured !== undefined && configured.startsWith(`${home}/`) && !configured.includes('/../') ? configured : `${home}/.claude/plugins/data/rich-terminal`
  try {
    const base = (await $.fs.stat(home, { resolve: true })).realPath
    if (base === undefined) return undefined
    const inside = (stat: FsStat) => stat.kind === 'dir' && stat.realPath !== undefined && stat.realPath.startsWith(`${base}/`)
    // Check every existing folder on the way before writing anything: a planted link is never written through.
    for (let at = dir; at.length > home.length && at.startsWith(`${home}/`); at = at.slice(0, at.lastIndexOf('/'))) {
      if ((await $.fs.exists(at)) && !inside(await $.fs.stat(at, { resolve: true }))) return undefined
    }
    await $.fs.write(`${dir}/.keep`, '')
    const where = await $.fs.stat(dir, { resolve: true })
    if (!inside(where)) return undefined
    // Owner-only, and owned by this user: `$.fs` has neither, so ask the system.
    const chmod = await $.process.run(['chmod', '700', where.realPath!], { timeoutMs: 5000 })
    const me = await $.process.run(['id', '-u'], { timeoutMs: 5000 })
    let owner = await $.process.run(['stat', '-f', '%u', where.realPath!], { timeoutMs: 5000 }).catch(() => undefined)
    if (owner === undefined || owner.exitCode !== 0) owner = await $.process.run(['stat', '-c', '%u', where.realPath!], { timeoutMs: 5000 })
    if (chmod.exitCode !== 0 || me.exitCode !== 0 || owner.exitCode !== 0 || owner.stdout.trim() !== me.stdout.trim()) return undefined
    cacheDir = where.realPath
  } catch {
    // no cache: pictures and browser pages are unavailable
  }
  return cacheDir
}

/** True when `path` is a regular file, not a link, inside the cache folder. */
async function cachedFile($: EngineInterface, dir: string, path: string): Promise<boolean> {
  try {
    const stat = await $.fs.stat(path, { resolve: true })
    return stat.kind === 'file' && !stat.isLink && stat.realPath !== undefined && stat.realPath.startsWith(`${dir}/`)
  } catch {
    return false
  }
}

function scripts($: EngineInterface, page: 'viewer.js' | 'image.js'): PageScripts {
  return { mermaid: fileUrl(`${$.plugin.root}/viewer/mermaid.min.js`), page: fileUrl(`${$.plugin.root}/viewer/${page}`) }
}

/** Writes the diagram's browser page when it is missing and answers its path. */
async function viewPage($: EngineInterface, diagram: Diagram): Promise<string | undefined> {
  const dir = await workDir($)
  if (dir === undefined) return undefined
  const path = `${dir}/${diagram.id}.html`
  const known = pages.get(diagram.id)
  if (known?.path === path && known.source === diagram.source && (await cachedFile($, dir, path))) return path
  await $.fs.write(path, viewerHtml(diagram, scripts($, 'viewer.js')))
  if (!(await cachedFile($, dir, path))) return undefined
  pages.set(diagram.id, { path, source: diagram.source })
  return path
}

/** Every diagram in the conversation so far, oldest first. */
async function diagramsInSession($: EngineInterface): Promise<Diagram[]> {
  const messages = await $.session.messages()
  return messages.filter(m => m.role === 'assistant').flatMap(m => findDiagrams(m.text))
}

function draw(diagram: Diagram, direction?: 'TD'): string | undefined {
  try {
    return renderMermaidAscii(diagram.source, { colorMode: 'none', hyperlinks: false, direction })
  } catch {
    return undefined
  }
}

/** The text drawing for a width, remembered: redraws repeat it often. */
function textArt(diagram: Diagram, columns: number): string | undefined {
  const key = `${diagram.id}:${columns}`
  const known = ascii.get(key)
  if (known !== undefined && known.source === diagram.source) return known.art
  const art = inlineArt(diagram, columns, direction => draw(diagram, direction))
  if (ascii.size >= ASCII_CACHE) ascii.delete(ascii.keys().next().value!)
  ascii.set(key, { source: diagram.source, art })
  return art
}

/**
 * Whether this terminal draws pictures (the kitty graphics protocol) with
 * nothing in between that would drop them; elsewhere diagrams stay text.
 */
async function showsPictures($: EngineInterface): Promise<boolean> {
  if ((await $.env.get('TMUX')) !== undefined) return false
  const program = ((await $.env.get('TERM_PROGRAM')) ?? '').toLowerCase()
  const term = (await $.env.get('TERM')) ?? ''
  return (
    program === 'ghostty' ||
    term === 'xterm-ghostty' ||
    term === 'xterm-kitty' ||
    (await $.env.get('KITTY_WINDOW_ID')) !== undefined
  )
}

async function findBrowser($: EngineInterface, configured: string): Promise<string | undefined> {
  for (const path of configured === '' ? CHROME_PATHS : [configured]) {
    if (await $.fs.exists(path)) return path
  }
  return undefined
}

/**
 * Runs headless Chrome until `done` holds for its output, then stops it:
 * Chrome finishes its work at once but may not exit by itself. Fails when
 * Chrome ends, or 30 s pass, before `done` holds.
 */
async function chrome($: EngineInterface, argv: string[], done: (out: { stdout: string; stderr: string }) => boolean): Promise<string> {
  const child = $.process.spawn({ argv })
  const out = { stdout: '', stderr: '' }
  let finished = false
  const work = (async () => {
    for await (const chunk of child) {
      out[chunk.stream] += chunk.text
      if (done(out)) {
        finished = true
        break
      }
    }
  })()
  const limit = $.clock.sleep(30_000).then(() => {
    throw new Error('Chrome did not finish within 30 s')
  })
  try {
    await Promise.race([work, limit])
  } finally {
    await child.return?.({ code: null, signal: 'SIGTERM' })
  }
  if (!finished) throw new Error(`Chrome stopped early: ${out.stderr.trim().split('\n').at(-1) ?? 'no output'}`)
  return out.stdout
}

function isPicture(value: unknown, base: string, source: string): value is Picture {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  const side = (n: unknown) => Number.isSafeInteger(n) && (n as number) >= 1 && (n as number) <= MAX_SIDE
  return (
    typeof p.file === 'string' &&
    p.file.startsWith(`${base}.`) &&
    p.file.endsWith('.png') &&
    !p.file.slice(base.length).includes('/') &&
    side(p.width) &&
    side(p.height) &&
    (p.width as number) * (p.height as number) <= MAX_AREA &&
    p.source === source
  )
}

/** Draws the diagram to a PNG with headless Chrome, once per diagram and theme. */
async function renderPicture($: EngineInterface, diagram: Diagram, browser: string, theme: string): Promise<Picture> {
  const dir = await workDir($)
  if (dir === undefined) throw new Error('no private cache folder')
  const base = `${dir}/${diagram.id}-${theme}`
  try {
    const meta: unknown = JSON.parse(await $.fs.read(`${base}.json`))
    if (isPicture(meta, base, diagram.source) && (await cachedFile($, dir, meta.file))) return meta
  } catch {
    // not drawn yet, or the record is unreadable: draw again
  }

  const page = `${base}.page.html`
  await $.fs.write(page, imagePage(diagram, theme, scripts($, 'image.js')))
  const common = [
    browser,
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-component-update',
    // One profile per session: two sessions drawing at once would contend for its lock.
    `--user-data-dir=${dir}/chrome-${await $.session.id()}`,
    '--virtual-time-budget=10000',
  ]
  const dom = await chrome($, [...common, '--dump-dom', fileUrl(page)], out => out.stdout.includes('</html>'))
  const size = pageSize(dom)
  if ('error' in size) throw new Error(`Mermaid could not draw it: ${size.error}`)

  // A fresh name each time, so a failed screenshot can never pass off an old file.
  const file = `${base}.${crypto.randomUUID()}.png`
  await chrome(
    $,
    [
      ...common,
      '--hide-scrollbars',
      `--force-device-scale-factor=${scaleFor(size.width, size.height)}`,
      '--default-background-color=00000000',
      `--window-size=${size.width},${size.height}`,
      `--screenshot=${file}`,
      fileUrl(page),
    ],
    out => out.stderr.includes('written to file') || out.stdout.includes('written to file'),
  )
  if (!(await cachedFile($, dir, file))) throw new Error('Chrome wrote no picture')
  const picture = { file, width: size.width, height: size.height, source: diagram.source }
  await $.fs.write(`${base}.json`, JSON.stringify(picture))
  return picture
}

/** Starts drawing a picture in the background; the replies holding it redraw when the attempt ends. */
function requestPicture($: EngineInterface, diagram: Diagram, browser: string, theme: string, now: number): void {
  const key = `${diagram.id}-${theme}`
  const known = pictures.get(key)
  if (rendering.has(key) || (known !== undefined && 'file' in known)) return
  if (known !== undefined && (known.attempts >= RETRIES || now - known.at < RETRY_AFTER_MS)) return
  rendering.add(key)
  // One Chrome at a time.
  queue = queue
    .then(() => renderPicture($, diagram, browser, theme))
    .then(
      picture => pictures.set(key, picture),
      async (error: unknown) => {
        pictures.set(key, { attempts: (known && 'attempts' in known ? known.attempts : 0) + 1, at: await $.clock.now() })
        $.ui.log(`rich-terminal: no image for ${diagram.id}: ${String(error)}`, { to: 'debug' })
      },
    )
    .finally(() => {
      rendering.delete(key)
      return update($, { ...attempts, id: diagram.id }, n => (n ?? 0) + 1)
    })
}

/** Opens a file in the default browser with the platform's own opener. */
async function openInBrowser($: EngineInterface, path: string): Promise<string | undefined> {
  const argv = (await $.fs.exists('/usr/bin/open')) ? ['/usr/bin/open', path] : ['xdg-open', path]
  try {
    const ran = await $.process.run(argv, { timeoutMs: 5000 })
    return ran.exitCode === 0 ? undefined : ran.stderr.trim() || `${argv[0]} exited with ${ran.exitCode}`
  } catch (error) {
    return `could not run ${argv[0]}: ${String(error)}`
  }
}

export const register: Register = (on, options) => {
  const images = options.images === true
  const theme = options.imageTheme === 'default' ? 'default' : 'dark'
  const browserPath = typeof options.browser === 'string' ? options.browser.trim() : ''
  let browser: string | undefined

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: COMMAND,
      description: 'Mermaid diagrams drawn in replies; open one in the browser',
      argumentHint: 'open [n] | list | on | off',
    })
    if (images && (await showsPictures($))) browser = await findBrowser($, browserPath)
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    await update($, running, ids => [...ids.filter(id => id !== e.turnId), e.turnId].slice(-16))
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    try {
      return await next(e)
    } finally {
      await update($, running, ids => ids.filter(id => id !== e.turnId))
    }
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.surface !== 'terminal' || !(await read($, enabled))) return next(e)
    const diagrams = findDiagrams(e.props.text)
    if (diagrams.length === 0) return next(e)

    const streaming = (await read($, running)).length > 0
    // Room for a drawing: the terminal's width less the transcript's margin
    // and whatever quote or list prefix the diagram sits behind.
    const columns = (e.viewport?.columns ?? 80) - 6
    const original = (d: Diagram) => e.props.text.slice(d.start, d.end)
    const asText = (d: Diagram): string => {
      // An unclosed fence is a drawing still arriving only while a turn runs.
      if (!d.closed) return streaming ? '*Drawing Mermaid diagram…*' : original(d)
      // Too wide even top-to-bottom, or not drawable: leave the source.
      return textArt(d, columns - Math.max(cells(d.lead), cells(d.prefix))) ?? original(d)
    }

    if (images && browser !== undefined && !needsWholeMarkdown(e.props.text, diagrams)) {
      const now = await $.clock.now()
      const dir = await workDir($)
      type Part = { text: string } | { diagram: Diagram; picture: Picture }
      const parts: Part[] = []
      for (const part of segments(e.props.text, diagrams)) parts.push(await (async (): Promise<Part> => {
        if (part.kind === 'text') return { text: part.text }
        if (part.diagram.closed) await $.state.get({ ...attempts, id: part.diagram.id })
        const picture = part.diagram.closed ? pictures.get(`${part.diagram.id}-${theme}`) : undefined
        if (picture !== undefined && 'file' in picture) {
          // Revalidated each draw: the file may have been cleared away since.
          if (picture.source === part.diagram.source && dir !== undefined && (await cachedFile($, dir, picture.file))) {
            return { diagram: part.diagram, picture }
          }
          pictures.delete(`${part.diagram.id}-${theme}`)
        }
        if (part.diagram.closed) requestPicture($, part.diagram, browser!, theme, now)
        return { text: asText(part.diagram) }
      })())
      if (parts.every(part => !('text' in part) || markdownSafe(part.text))) {
        const { Box, Image, Markdown, Text } = $.ui.resolve(e)
        const children: RenderNode[] = parts.map((part, i) => {
          if ('text' in part) return <Markdown text={part.text} />
          const box = imageBox(part.picture.width, part.picture.height, Math.max(1, columns))
          return (
            <Image
              key={`d${i}`}
              source={{ file: part.picture.file, format: 'png' }}
              columns={box.columns}
              rows={box.rows}
              alt={`Mermaid ${part.diagram.kind} diagram`}
            />
          )
        })
        // A tree replaces the engine's drawing whole, bullet and indent included.
        return (
          <Box flexDirection="row">
            <Box width={2} flexShrink={0}>
              <Text>{e.props.isFirstOfReply ? '⏺' : ' '}</Text>
            </Box>
            <Box flexDirection="column" gap={1} flexGrow={1}>
              {children}
            </Box>
          </Box>
        )
      }
    }

    const text = rewrite(e.props.text, diagrams, asText)
    return text === e.props.text ? next(e) : next({ ...e, props: { ...e.props, text } })
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const command = parseCommand(e.args)
    if (command.kind === 'help') return { text: HELP }
    if (command.kind === 'invalid') return { text: `${command.reason}\n${HELP}` }
    if (command.kind === 'on' || command.kind === 'off') {
      await update($, enabled, () => command.kind === 'on')
      return { text: `Rich terminal is ${command.kind}.` }
    }
    const diagrams = await diagramsInSession($)
    if (command.kind === 'list') return { text: listing(diagrams) }

    const picked = pick(diagrams, command.id)
    if ('error' in picked) return { text: `${picked.error} Run /${COMMAND} list.` }
    const { diagram } = picked
    const page = await viewPage($, diagram)
    if (page === undefined) return { text: 'Could not write the browser page: no private cache folder.' }
    const failed = await openInBrowser($, page)
    return { text: failed === undefined ? `Opened ${diagram.kind} ${diagram.id} in the browser.` : `Could not open the browser: ${failed}` }
  })
}
