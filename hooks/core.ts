// Pure logic: no host API in this file, so it runs under plain Node in tests.

export type Diagram = {
  /** 64-bit digest of `source` as 16 hex characters: the same diagram keeps it across redraws and reloads. */
  id: string
  /** `flowchart`, `sequence`, or the diagram's own first keyword. */
  kind: string
  /**
   * The text between the fence lines, with any blockquote or list prefix
   * removed, line endings normalised to LF and the final newline dropped.
   */
  source: string
  /** Offsets of the whole fenced block, prefixes included, in the text it was found in. */
  start: number
  end: number
  /** False while the closing fence has not arrived and its container has not ended. */
  closed: boolean
  /** What the block's first line starts with: blockquote markers, a list marker, indentation; '' at top level. */
  lead: string
  /** What each later line of the block starts with. */
  prefix: string
}

const FENCE = /^([ ]*)(`{3,}|~{3,})(.*)$/
const QUOTE = /^[ ]{0,3}>[ ]?/
const LIST_MARK = /^([ ]{0,3})([-*+]|\d{1,9}[.)])([ ]+|$)/
const HTML_BLOCK = /^[ ]{0,3}<(pre|script|style|textarea)(?:[\s>]|$)/i

/** Two independent 32-bit streams (cyrb53-style mixing), 16 hex characters. */
export function hash(text: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0')
}

export function kindOf(source: string): string {
  const lines = source.split('\n')
  let i = 0
  // YAML frontmatter (`---` … `---`) comes before the diagram's header.
  if (lines[0]?.trim() === '---') {
    const close = lines.findIndex((line, n) => n > 0 && line.trim() === '---')
    if (close > 0) i = close + 1
  }
  for (; i < lines.length; i++) {
    const line = lines[i]!.trim()
    if (line === '' || line.startsWith('%%')) continue
    const word = line.split(/[\s;]/, 1)[0] ?? ''
    if (word === 'flowchart' || word === 'graph') return 'flowchart'
    if (word === 'sequenceDiagram') return 'sequence'
    return word.replace(/[^A-Za-z0-9-]/g, '') || 'diagram'
  }
  return 'diagram'
}

/** One container a line sits in: a blockquote, or a list item of a given content width. */
type Container = { kind: 'quote' } | { kind: 'list'; width: number }

type Open = {
  marker: string
  containers: Container[]
  indent: number
  lead: string
  prefix: string
  isMermaid: boolean
  start: number
  lines: string[]
}

/** Reads the container markers at the start of a line: `> `, `- `, `1. `, in any nesting. */
function readContainers(line: string): { containers: Container[]; lead: string; rest: string } {
  const containers: Container[] = []
  let rest = line
  for (;;) {
    const quote = QUOTE.exec(rest)
    if (quote) {
      containers.push({ kind: 'quote' })
      rest = rest.slice(quote[0].length)
      continue
    }
    const item = LIST_MARK.exec(rest)
    if (item && item[3] !== '') {
      containers.push({ kind: 'list', width: item[0].length })
      rest = rest.slice(item[0].length)
      continue
    }
    break
  }
  return { containers, lead: line.slice(0, line.length - rest.length), rest }
}

/**
 * Strips the continuation prefix of `containers` from a later line: `>` for
 * a quote, the item's width in spaces for a list. Undefined when the line
 * does not continue them, i.e. a container has ended.
 */
function continuation(line: string, containers: readonly Container[]): string | undefined {
  let rest = line
  for (const c of containers) {
    if (c.kind === 'quote') {
      const quote = QUOTE.exec(rest)
      if (!quote) return undefined
      rest = rest.slice(quote[0].length)
    } else if (rest.trim() === '') {
      return ''
    } else if (rest.startsWith(' '.repeat(c.width))) {
      rest = rest.slice(c.width)
    } else {
      return undefined
    }
  }
  return rest
}

function skipSpaces(text: string, most: number): string {
  let n = 0
  while (n < most && text[n] === ' ') n++
  return text.slice(n)
}

function finish(open: Open, end: number, closed: boolean): Diagram {
  const source = open.lines.join('\n')
  return { id: hash(source), kind: kindOf(source), source, start: open.start, end, closed, lead: open.lead, prefix: open.prefix }
}

/**
 * Finds every Mermaid fence in a reply: at top level, and inside any nesting
 * of blockquotes and list items. A fence quoted inside another code fence, an
 * HTML comment or a `<pre>`-like block is an example, not a diagram, and is
 * left alone. A fence inside a container ends where the container does.
 */
export function findDiagrams(text: string): Diagram[] {
  const found: Diagram[] = []
  let open: Open | undefined
  let skipUntil: RegExp | undefined
  /** Content column of the latest list item, for a fence on its own line under it. */
  let listContent = -1
  let previousEnd = 0

  const outside = (line: string, here: number): Open | undefined => {
    const { containers, lead, rest } = readContainers(line)
    if (skipUntil !== undefined) {
      if (skipUntil.test(rest)) skipUntil = undefined
      return undefined
    }
    if (/^[ ]{0,3}<!--/.test(rest)) {
      if (!rest.includes('-->')) skipUntil = /-->/
      return undefined
    }
    const html = HTML_BLOCK.exec(rest)
    if (html) {
      const close = new RegExp(`</${html[1]}>`, 'i')
      if (!close.test(rest)) skipUntil = close
      return undefined
    }

    const list = containers.findLast(c => c.kind === 'list')
    if (list !== undefined) listContent = lead.length
    else if (line.trim() !== '' && line.length - line.trimStart().length < listContent) listContent = -1

    const match = FENCE.exec(rest)
    if (!match) return undefined
    let own = match[1]!.length
    let effective = containers
    // Four spaces make indented code, unless the fence sits under the list item above it.
    if (containers.length > 0 && own > 3) return undefined
    if (containers.length === 0 && own > 3) {
      if (!(listContent >= 0 && own <= listContent + 3)) return undefined
      effective = [{ kind: 'list', width: listContent }]
      own -= listContent
    }
    const info = (match[3] ?? '').trim()
    // A backtick fence cannot carry a backtick in its info string.
    if (match[2]!.startsWith('`') && info.includes('`')) return undefined
    const prefix =
      effective === containers
        ? lead.replace(/([-*+]|\d{1,9}[.)])(?=[ ])/g, m => ' '.repeat(m.length)) + ' '.repeat(own)
        : ' '.repeat(listContent) + ' '.repeat(own)
    return {
      marker: match[2]!,
      containers: effective,
      indent: own,
      lead: lead + match[1]!,
      prefix,
      isMermaid: /^mermaid$/i.test(info.split(/\s+/, 1)[0] ?? ''),
      start: here,
      lines: [],
    }
  }

  let offset = 0
  for (const lineWithEnd of text.split(/(?<=\n)/)) {
    const line = lineWithEnd.replace(/\r?\n$/, '')
    const here = offset
    offset += lineWithEnd.length

    if (open !== undefined) {
      const rest = continuation(line, open.containers)
      if (rest === undefined) {
        // The container ended, and the fence with it.
        if (open.isMermaid) found.push(finish(open, previousEnd, true))
        open = outside(line, here)
      } else {
        const match = FENCE.exec(skipSpaces(rest, open.indent))
        if (
          match &&
          match[1]!.length <= 3 &&
          match[2]![0] === open.marker[0] &&
          match[2]!.length >= open.marker.length &&
          (match[3] ?? '').trim() === ''
        ) {
          if (open.isMermaid) found.push(finish(open, here + line.length, true))
          open = undefined
        } else {
          open.lines.push(skipSpaces(rest, open.indent))
        }
      }
    } else {
      open = outside(line, here)
    }
    previousEnd = here + line.replace(/\r$/, '').length
  }

  if (open?.isMermaid) found.push(finish(open, text.length, false))
  return found
}

/**
 * Replaces each Mermaid fence with what `replace` gives, re-adding the
 * fence's container prefixes to its lines; everything else is untouched.
 */
export function rewrite(text: string, diagrams: readonly Diagram[], replace: (d: Diagram) => string): string {
  let out = ''
  let at = 0
  for (const d of diagrams) {
    const block = replace(d)
    const original = text.slice(d.start, d.end)
    out += text.slice(at, d.start)
    out += block === original ? block : block.split('\n').map((line, i) => (i === 0 ? d.lead : d.prefix) + line).join('\n')
    at = d.end
  }
  return out + text.slice(at)
}

const WIDE =
  /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦\u{20000}-\u{3fffd}]/u
const ZERO = /^[\p{M}\p{Cf}\p{Cc}]+$/u

let segmenter: Intl.Segmenter | undefined | null = null

function graphemes(text: string): Iterable<string> {
  if (segmenter === null) {
    const Segmenter = (globalThis as { Intl?: { Segmenter?: typeof Intl.Segmenter } }).Intl?.Segmenter
    segmenter = Segmenter === undefined ? undefined : new Segmenter(undefined, { granularity: 'grapheme' })
  }
  if (segmenter === undefined) return Array.from(text)
  return Array.from(segmenter.segment(text), s => s.segment)
}

/**
 * Display cells a line takes on a terminal: wide East Asian characters and
 * emoji count 2, marks and format characters 0, a tab runs to the next stop of 8.
 */
export function cells(text: string): number {
  // Plain printable ASCII is one cell a character: most lines take this path.
  if (/^[\x20-\x7e]*$/.test(text)) return text.length
  let n = 0
  for (const g of graphemes(text)) {
    if (g === '\t') {
      n += 8 - (n % 8)
      continue
    }
    if (ZERO.test(g)) continue
    n += WIDE.test(g) || /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F|\u20E3/u.test(g) ? 2 : 1
  }
  return n
}

export type Fit = { fits: true; lines: string[] } | { fits: false; needColumns: number; needRows: number }

/** Whether rendered art fits a region; never crops. */
export function fit(art: string, columns: number, rows: number): Fit {
  const lines = art.replace(/\s+$/, '').split('\n').map(line => line.replace(/\s+$/, ''))
  let needColumns = 0
  for (const line of lines) needColumns = Math.max(needColumns, cells(line))
  if (needColumns <= columns && lines.length <= rows) return { fits: true, lines }
  return { fits: false, needColumns, needRows: lines.length }
}

/**
 * The diagram as a fenced text block that fits `columns`, trying the
 * diagram's own layout first and then top-to-bottom; undefined when neither
 * fits or the renderer cannot draw it.
 */
export function inlineArt(diagram: Diagram, columns: number, draw: (direction?: 'TD') => string | undefined): string | undefined {
  if (columns < 1) return undefined
  for (const direction of [undefined, 'TD'] as const) {
    if (direction === 'TD' && diagram.kind !== 'flowchart') break
    const art = draw(direction)
    if (art === undefined) return undefined
    const fitted = fit(art, columns, Number.POSITIVE_INFINITY)
    if (fitted.fits) return ['```text', ...fitted.lines, '```'].join('\n')
  }
  return undefined
}

export type Command =
  | { kind: 'help' }
  | { kind: 'on' }
  | { kind: 'off' }
  | { kind: 'open'; id?: string }
  | { kind: 'list' }
  | { kind: 'invalid'; reason: string }

export function parseCommand(args: string): Command {
  const words = args.trim().split(/\s+/).filter(Boolean)
  const [verb, id, ...rest] = words
  if (verb === undefined || verb === 'help' || verb === 'status') return { kind: 'help' }
  if (rest.length > 0) return { kind: 'invalid', reason: 'too many arguments' }
  if (verb === 'list') return id === undefined ? { kind: 'list' } : { kind: 'invalid', reason: 'too many arguments' }
  if (verb === 'on' || verb === 'off') return id === undefined ? { kind: verb } : { kind: 'invalid', reason: 'too many arguments' }
  if (verb === 'open') return id === undefined ? { kind: verb } : { kind: verb, id }
  return { kind: 'invalid', reason: `unknown command "${verb}"` }
}

/**
 * The diagram a command names: by its number in the conversation (1 is the
 * first), by its id or an unambiguous id prefix, or the latest one.
 */
export function pick(diagrams: readonly Diagram[], which: string | undefined): { diagram: Diagram } | { error: string } {
  const closed = diagrams.filter(d => d.closed)
  if (closed.length === 0) return { error: 'No diagram in this conversation yet.' }
  if (which === undefined) return { diagram: closed.at(-1)! }
  if (/^[1-9]\d{0,4}$/.test(which)) {
    const diagram = closed[Number(which) - 1]
    return diagram === undefined ? { error: `No diagram ${which}; there are ${closed.length}.` } : { diagram }
  }
  const exact = closed.findLast(d => d.id === which)
  if (exact !== undefined) return { diagram: exact }
  const ids = new Set(closed.filter(d => d.id.startsWith(which)).map(d => d.id))
  if (ids.size === 1) return { diagram: closed.findLast(d => ids.has(d.id))! }
  return { error: ids.size === 0 ? `No diagram "${which}".` : `"${which}" matches ${ids.size} diagrams; give more of the id.` }
}

/** One line per diagram, numbered as `pick` counts them, with its id. */
export function listing(diagrams: readonly Diagram[]): string {
  const closed = diagrams.filter(d => d.closed)
  if (closed.length === 0) return 'No diagram in this conversation yet.'
  return closed
    .map((d, i) => {
      const first = d.source.split('\n').find((line, n) => n > 0 && line.trim() !== '')?.trim() ?? ''
      return `${String(i + 1).padStart(3)}  ${d.id}  ${d.kind.padEnd(10)} ${first.slice(0, 40)}`
    })
    .join('\n')
}

export type Segment = { kind: 'text'; text: string } | { kind: 'diagram'; diagram: Diagram }

/** The reply cut into prose and diagrams, in order; empty prose is dropped. */
export function segments(text: string, diagrams: readonly Diagram[]): Segment[] {
  const out: Segment[] = []
  let at = 0
  const prose = (chunk: string) => {
    const trimmed = chunk.replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '')
    if (trimmed.trim() !== '') out.push({ kind: 'text', text: trimmed })
  }
  for (const d of diagrams) {
    prose(text.slice(at, d.start))
    out.push({ kind: 'diagram', diagram: d })
    at = d.end
  }
  prose(text.slice(at))
  return out
}

/**
 * True when cutting the reply into separate Markdown blocks could change its
 * meaning: link reference or footnote definitions resolve across the whole
 * document, and a diagram inside a quote or list cannot be lifted out of it.
 */
export function needsWholeMarkdown(text: string, diagrams: readonly Diagram[]): boolean {
  return diagrams.some(d => d.lead !== '') || /^(?:[ ]{0,3}(?:>[ ]?|(?:[-*+]|\d{1,9}[.)])[ ]+))*[ ]{0,3}\[[^\]]{1,999}\]:/m.test(text)
}

/** True when `Markdown` can draw the text: short enough, no control character but tab and newline. */
export function markdownSafe(text: string): boolean {
  // eslint-disable-next-line no-control-regex
  return text.length <= 10000 && !/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/.test(text)
}

/**
 * Terminal cells for a picture `width` by `height` CSS pixels: about as wide
 * as it would be on a page, never wider than `maxColumns`. A cell is roughly
 * twice as tall as it is wide.
 */
export function imageBox(width: number, height: number, maxColumns: number): { columns: number; rows: number } {
  let columns = Math.max(1, Math.min(maxColumns, 255, Math.ceil(width / 8)))
  let rows = Math.max(1, Math.round((columns * height * 0.47) / width))
  if (rows > 255) {
    columns = Math.max(1, Math.floor((columns * 255) / rows))
    rows = 255
  }
  return { columns, rows }
}

/** The largest picture drawn, in CSS pixels per side and in total. */
export const MAX_SIDE = 4096
export const MAX_AREA = 8_000_000

/** Reads the size the image page reports in its title: `SIZE 547x450`, within bounds. */
export function pageSize(dom: string): { width: number; height: number } | { error: string } {
  const title = /<title>([^<]*)<\/title>/.exec(dom)?.[1] ?? ''
  const size = /^SIZE (\d{1,5})x(\d{1,5})$/.exec(title)
  if (!size) return { error: title.replace(/^ERROR /, '') || 'the page did not finish' }
  const width = Number(size[1])
  const height = Number(size[2])
  if (width < 1 || height < 1) return { error: 'the diagram is empty' }
  if (width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_AREA) {
    return { error: `the diagram is too large for a picture (${width}×${height})` }
  }
  return { width, height }
}

/** Device pixels per CSS pixel for a screenshot of this size: 2 when it stays within the pixel budget. */
export function scaleFor(width: number, height: number): 1 | 2 {
  return width * height * 4 <= MAX_AREA ? 2 : 1
}

/** A `file:` URL for an absolute path, every segment encoded. */
export function fileUrl(path: string): string {
  return `file://${path.split('/').map(encodeURIComponent).join('/')}`
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** JSON safe inside a `<script>` element. */
function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

/**
 * Pages load only the plugin's own scripts and draw only inline styles and
 * data images: nothing a diagram's source names can reach the network.
 */
const CSP = "default-src 'none'; script-src file:; style-src 'unsafe-inline'; img-src data:; font-src data:"

export type PageScripts = { mermaid: string; page: string }

/** The browser view: one diagram, fitted to the window, with zoom, pan and source. */
export function viewerHtml(diagram: Diagram, scripts: PageScripts): string {
  const title = escapeHtml(`Mermaid ${diagram.kind} · ${diagram.id}`)
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#1f2328;--line:#d0d7de}
@media(prefers-color-scheme:dark){:root{--bg:#0d1117;--fg:#e6edf3;--line:#30363d}}
html,body{margin:0;height:100%;background:var(--bg);color:var(--fg);font:14px system-ui,sans-serif}
header{display:flex;gap:8px;align-items:center;padding:8px 12px;border-bottom:1px solid var(--line)}
header b{margin-right:auto}
button{font:inherit;padding:4px 10px;border:1px solid var(--line);border-radius:6px;background:transparent;color:inherit;cursor:pointer}
button:disabled{opacity:.4;cursor:default}
#stage{height:calc(100% - 46px);overflow:hidden;cursor:grab;touch-action:none}
#stage svg{transform-origin:0 0;max-width:none}
pre{margin:0;padding:16px;height:calc(100% - 78px);overflow:auto;font:13px ui-monospace,monospace;white-space:pre-wrap}
[hidden]{display:none}
</style></head><body>
<header><b>${title}</b>
<button id="fit">Fit</button><button id="in">+</button><button id="out">−</button><button id="src">Source</button></header>
<div id="stage"></div><pre id="code" hidden></pre>
<script type="application/json" id="diagram">${scriptJson({ source: diagram.source })}</script>
<script src="${escapeHtml(scripts.mermaid)}"></script>
<script src="${escapeHtml(scripts.page)}"></script>
</body></html>
`
}

/** A page that draws one diagram on a transparent background and reports its size in its title. */
export function imagePage(diagram: Diagram, theme: string, scripts: PageScripts): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<title>LOADING</title>
<style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>
<script type="application/json" id="diagram">${scriptJson({ source: diagram.source, theme })}</script>
<script src="${escapeHtml(scripts.mermaid)}"></script>
<script src="${escapeHtml(scripts.page)}"></script>
</body></html>
`
}
