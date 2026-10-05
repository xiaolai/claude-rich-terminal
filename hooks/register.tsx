import { atom, read, update } from 'claude-code'
import type { FsStat } from 'claude-code'
import type { EngineInterface, Register, RenderNode, Timer } from 'claude-code'

import type { StatusData, StatusGit, StatusSettings, StatusTurnModel, TokenReading } from '../types'

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
import {
  accountFrom,
  bandGroups,
  COLOR,
  clean,
  DEFAULT_SETTINGS,
  describeSettings,
  HISTORY,
  layout,
  limitLabel,
  parseGitStatus,
  parseNumstat,
  segmentBackground,
  settingsFrom,
  shortModel,
  STATUS_HELP,
  statusCommand,
} from './status.ts'
import type { Segment } from './status.ts'
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
  '',
  STATUS_HELP,
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
let cacheDir: string | undefined
/** Why the cache folder was last refused, and when: a refusal is retried after `CACHE_RETRY_MS`. */
let cacheError: { reason: string; at: number } | undefined
const CACHE_RETRY_MS = 30_000
const SYSTEM_TIMEOUT_MS = 20_000

/**
 * The plugin's cache: under the person's own home, never a shared temporary
 * folder, and refused when it resolves anywhere else (a planted symlink).
 */
async function workDir($: EngineInterface): Promise<string | undefined> {
  if (cacheDir !== undefined) return cacheDir
  if (cacheError !== undefined && (await $.clock.now()) - cacheError.at < CACHE_RETRY_MS) return undefined
  const refuse = async (reason: string) => {
    cacheError = { reason, at: await $.clock.now() }
    $.ui.log(`rich-terminal: cache folder refused: ${reason}`, { to: 'debug' })
    return undefined
  }
  const home = await $.env.get('HOME')
  if (home === undefined || !home.startsWith('/')) return await refuse('HOME is not set')
  const dir = `${home}/.claude/plugins/data/rich-terminal`
  try {
    const base = (await $.fs.stat(home, { resolve: true })).realPath
    if (base === undefined) return await refuse('the home folder could not be resolved')
    const inside = (stat: FsStat) => stat.kind === 'dir' && stat.realPath !== undefined && stat.realPath.startsWith(`${base}/`)
    // Check every existing folder on the way before writing anything: a planted link is never written through.
    for (let at = dir; at.length > home.length && at.startsWith(`${home}/`); at = at.slice(0, at.lastIndexOf('/'))) {
      if ((await $.fs.exists(at)) && !inside(await $.fs.stat(at, { resolve: true }))) return await refuse(`${at} leads outside the home folder`)
    }
    await $.fs.write(`${dir}/.keep`, '')
    const where = await $.fs.stat(dir, { resolve: true })
    if (!inside(where)) return await refuse(`${dir} leads outside the home folder`)
    // Owner-only, and owned by this user: `$.fs` has neither, so ask the system.
    const run = (argv: string[]) => $.process.run(argv, { timeoutMs: SYSTEM_TIMEOUT_MS })
    const chmod = await run(['chmod', '700', where.realPath!])
    if (chmod.exitCode !== 0) return await refuse(`chmod failed: ${chmod.stderr.trim()}`)
    const me = await run(['id', '-u'])
    let owner = await run(['stat', '-f', '%u', where.realPath!]).catch(() => undefined)
    if (owner === undefined || owner.exitCode !== 0 || !/^\d+$/.test(owner.stdout.trim())) owner = await run(['stat', '-c', '%u', where.realPath!])
    if (me.exitCode !== 0 || owner.stdout.trim() !== me.stdout.trim()) {
      return await refuse(`the folder is owned by user ${owner.stdout.trim() || '?'}, not ${me.stdout.trim() || '?'}`)
    }
    cacheDir = where.realPath
    cacheError = undefined
    return cacheDir
  } catch (error) {
    return await refuse(String(error))
  }
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

// ── The status band above the prompt ──────────────────────────────────

const settings = atom({ plugin: 'rich-terminal', key: 'statusSettings' } as const, DEFAULT_SETTINGS)
const figures = atom({ plugin: 'rich-terminal', key: 'status' } as const, null as StatusData | null)
const readings = atom({ plugin: 'rich-terminal', key: 'readings' } as const, [] as TokenReading[])
const turnModel = atom({ plugin: 'rich-terminal', key: 'turnModel' } as const, null as StatusTurnModel | null)
const STORE_KEY = 'statusSettings'

const REFRESH_MS = 5000
/** Git gets 3 s in all and 2 s a call: a slow repository loses its segment, never the band. */
const GIT_TOTAL_MS = 3000
const GIT_CALL_MS = 2000
const ACCOUNT_TTL_MS = 180_000
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

// Module memory: lost on a reload, and rebuilt by the next refresh.
let refreshing = false
let again = false
let account: { label: string | undefined; at: number } | undefined
/** Set once the band has started: its absence means no session here draws it, so nothing is read. */
let timer: Timer | undefined

/** Branch, ahead/behind and working-tree changes, within the git budget; undefined outside a repository. */
async function gitState($: EngineInterface, cwd: string): Promise<StatusGit | undefined> {
  const deadline = (await $.clock.now()) + GIT_TOTAL_MS
  const git = async (args: string[]): Promise<{ stdout: string; isWhole: boolean } | undefined> => {
    const left = deadline - (await $.clock.now())
    if (left <= 0) return undefined
    try {
      // No fsmonitor command from the repository's config: a status read must run nothing but git.
      const ran = await $.process.run(['git', '--no-optional-locks', '-c', 'core.fsmonitor=false', ...args], { cwd, timeoutMs: Math.min(GIT_CALL_MS, left) })
      return ran.exitCode === 0 ? { stdout: ran.stdout, isWhole: !ran.isStdoutTruncated } : undefined
    } catch {
      return undefined
    }
  }
  const status = await git(['status', '--porcelain=v2', '--branch', '--untracked-files=all'])
  const parsed = status === undefined ? undefined : parseGitStatus(status.stdout)
  if (status === undefined || parsed === undefined) return undefined
  const { branch, ahead, behind } = parsed
  // A cut-off listing undercounts the untracked files: the tree is then unmeasured, not clean.
  const diff = status.isWhole ? await git(['diff', '--no-ext-diff', '--no-textconv', '--numstat', parsed.isInitial ? EMPTY_TREE : 'HEAD']) : undefined
  if (diff === undefined || !diff.isWhole) return { branch, ahead, behind }
  return { branch, ahead, behind, changes: { ...parseNumstat(diff.stdout), untracked: parsed.untracked } }
}

/** The signed-in account, read from Claude Code's own config and kept for three minutes. */
async function accountLabel($: EngineInterface, home: string | undefined, now: number): Promise<string | undefined> {
  if (account !== undefined && now - account.at < ACCOUNT_TTL_MS) return account.label
  const dir = (await $.env.get('CLAUDE_CONFIG_DIR')) ?? home
  let label: string | undefined
  try {
    if (dir !== undefined) label = accountFrom(await $.fs.read(`${dir}/.claude.json`))
  } catch {
    // no config file, or not readable: no account segment
  }
  account = { label, at: now }
  return label
}

async function collect($: EngineInterface, s: StatusSettings): Promise<StatusData> {
  const [usage, cwd, root, home, turn] = await Promise.all([$.session.usage(), $.session.cwd(), $.session.root(), $.env.get('HOME'), read($, turnModel)])
  const now = await $.clock.now()
  const model = turn?.model ?? (await $.session.model().then(shortModel, () => undefined))
  const [git, label] = await Promise.all([gitState($, cwd), s.account === 'off' ? undefined : accountLabel($, home, now)])
  const { tokens, window, percent } = usage.context
  return {
    cwd,
    root,
    ...(home !== undefined && { home }),
    ...(git !== undefined && { git }),
    ...(model !== undefined && { model }),
    ...(turn?.effort !== undefined && { effort: turn.effort }),
    elapsedMs: Math.max(0, now - usage.startedAt),
    ...(tokens !== undefined && window > 0 && { context: { tokens, window, percent: percent ?? Math.round((tokens / window) * 100) } }),
    ...(usage.cost !== undefined && { costUsd: usage.cost.usd }),
    limits: usage.rateLimits.map(limit => {
      const resetsAt = limit.resetsAt === undefined ? NaN : Date.parse(limit.resetsAt)
      return { label: limitLabel(limit.kind), percent: limit.percentUsed, ...(Number.isFinite(resetsAt) && { resetsAt }) }
    }),
    ...(label !== undefined && { account: label }),
    now,
  }
}

/** Reads the figures again, one reading at a time: a call made meanwhile runs once more after it. */
async function refresh($: EngineInterface): Promise<void> {
  if (refreshing) {
    again = true
    return
  }
  refreshing = true
  try {
    do {
      again = false
      const s = await read($, settings)
      if (!s.visible) return
      const data = await collect($, s)
      await update($, figures, old => (JSON.stringify(old) === JSON.stringify(data) ? old : data))
    } while (again)
  } catch (error) {
    $.ui.log(`rich-terminal: status band not refreshed: ${String(error)}`, { to: 'debug' })
  } finally {
    refreshing = false
  }
}

/** Token Weather's reading of the context window, once the session has one. */
async function takeReading($: EngineInterface): Promise<void> {
  try {
    const { tokens, window, percent } = (await $.session.usage()).context
    if (tokens === undefined || window <= 0) return
    const reading = { tokens, window, percent: percent ?? Math.round((tokens / window) * 100) }
    await update($, readings, history => [...history, reading].slice(-HISTORY))
  } catch (error) {
    $.ui.log(`rich-terminal: no context reading: ${String(error)}`, { to: 'debug' })
  }
}

/** Answers `/rich status …`: shows, or changes and keeps, the band's settings. */
async function runStatusCommand($: EngineInterface, words: readonly string[]): Promise<string> {
  const current = await read($, settings)
  const command = statusCommand(words, current)
  if (command.kind === 'invalid') return `${command.reason}\n${STATUS_HELP}`
  if (command.kind === 'show') return describeSettings(current)
  await update($, settings, () => command.settings)
  await $.store.set(STORE_KEY, command.settings)
  if (command.settings.visible) void refresh($)
  return describeSettings(command.settings)
}

/** Loads the kept settings, takes the first reading and starts the refresh timer; after the session has started. */
async function startStatusBand($: EngineInterface): Promise<void> {
  let stored: unknown
  try {
    stored = await $.store.get(STORE_KEY)
  } catch (error) {
    $.ui.log(`rich-terminal: status settings unreadable, defaults used: ${String(error)}`, { to: 'debug' })
  }
  await update($, settings, () => settingsFrom(stored))
  await takeReading($)
  void refresh($)
  timer?.cancel()
  timer = $.clock.every(REFRESH_MS, () => void refresh($))
}

/** A main-loop turn ended: Token Weather takes its reading and the figures are read again. */
async function statusTurnEnded($: EngineInterface): Promise<void> {
  await takeReading($)
  void refresh($)
}

export const register: Register = (on, options) => {
  const images = options.images === true
  const theme = options.imageTheme === 'default' ? 'default' : 'dark'
  const browserPath = typeof options.browser === 'string' ? options.browser.trim() : ''
  let browser: string | undefined

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: COMMAND,
      description: 'Mermaid diagrams drawn in replies, and the status band above the prompt',
      argumentHint: 'open [n] | list | on | off | status [setting]',
    })
    if (images && (await showsPictures($))) browser = await findBrowser($, browserPath)
    const result = await next(e)
    // The band is drawn only in an interactive terminal: elsewhere nothing would show the figures read.
    if (e.isInteractive && e.surface === 'terminal') await startStatusBand($)
    return result
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
      if (e.agentId === undefined && timer !== undefined) await statusTurnEnded($)
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
    if (command.kind === 'status') return { text: await runStatusCommand($, command.words) }
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
    if (page === undefined) return { text: `Could not write the browser page: no private cache folder (${cacheError?.reason ?? 'unknown reason'}). It is retried in 30 s.` }
    const failed = await openInBrowser($, page)
    return { text: failed === undefined ? `Opened ${diagram.kind} ${diagram.id} in the browser.` : `Could not open the browser: ${failed}` }
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined) {
      const effort = e.effort === undefined ? undefined : clean(String(e.effort))
      await update($, turnModel, () => ({ model: shortModel(e.model), ...(effort && { effort }) }))
    }
    const result = yield* next(e)
    if (e.agentId === undefined && timer !== undefined) void refresh($)
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.hasSurvey) return next(e)
    const s = await read($, settings)
    const data = await read($, figures)
    if (!s.visible || data === null) return next(e)
    const columns = e.props.bodyColumns
    const rows = layout(bandGroups(data, await read($, readings), s, columns), s, columns)
    if (rows.length === 0) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const runs = (seg: Segment, bg?: string): RenderNode[] =>
      seg.runs.map(r => (
        <Text color={r.color ?? COLOR.fg} {...(bg !== undefined && { backgroundColor: bg })} {...(r.bold === true && { bold: true })}>
          {r.text}
        </Text>
      ))
    const row = (segs: Segment[]): RenderNode[] => {
      const look = s.look
      if (look === 'plain') return segs.flatMap((seg, i) => [...(i > 0 ? [<Text color={COLOR.separator}>{' > '}</Text>] : []), ...runs(seg)])
      return segs.flatMap((seg, i) => {
        const bg = segmentBackground(look, i, segs.length)
        const after = i + 1 < segs.length ? segmentBackground(look, i + 1, segs.length) : undefined
        return [
          <Text backgroundColor={bg}> </Text>,
          ...runs(seg, bg),
          <Text backgroundColor={bg}> </Text>,
          <Text color={bg} {...(after !== undefined && { backgroundColor: after })}>
            {'\ue0b0'}
          </Text>,
        ]
      })
    }
    return (
      <Box flexDirection="column">
        {rows.map(segs => (
          <Text wrap="truncate-end">{row(segs)}</Text>
        ))}
      </Box>
    )
  })
}
