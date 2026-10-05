// The status band: what it shows and how it is laid out, with no engine in it.

import type { StatusAccount, StatusData, StatusLines, StatusLook, StatusSettings, TokenReading } from '../types'

import { cells } from './core.ts'

export const LOOKS: readonly StatusLook[] = ['plain', 'gray', 'aurora', 'sunset', 'forest']
export const LINES: readonly StatusLines[] = ['auto', '1', '2', '3']
export const ACCOUNTS: readonly StatusAccount[] = ['name', 'email', 'off']

export const DEFAULT_SETTINGS: StatusSettings = {
  visible: true,
  look: 'plain',
  lines: 'auto',
  bar: false,
  account: 'name',
  resets: false,
  weather: true,
}

/** Settings from stored JSON: each field that is not one of its allowed values keeps its default. */
export function settingsFrom(value: unknown): StatusSettings {
  const v = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  const one = <T>(allowed: readonly T[], x: unknown, fallback: T): T => (allowed.includes(x as T) ? (x as T) : fallback)
  const flag = (x: unknown, fallback: boolean) => (typeof x === 'boolean' ? x : fallback)
  const d = DEFAULT_SETTINGS
  return {
    visible: flag(v.visible, d.visible),
    look: one(LOOKS, v.look, d.look),
    lines: one(LINES, v.lines, d.lines),
    bar: flag(v.bar, d.bar),
    account: one(ACCOUNTS, v.account, d.account),
    resets: flag(v.resets, d.resets),
    weather: flag(v.weather, d.weather),
  }
}

export function describeSettings(s: StatusSettings): string {
  const onOff = (b: boolean) => (b ? 'on' : 'off')
  return `status band ${onOff(s.visible)} · look ${s.look} · lines ${s.lines} · bar ${onOff(s.bar)} · account ${s.account} · resets ${onOff(s.resets)} · weather ${onOff(s.weather)}`
}

export const STATUS_HELP = [
  '/rich status                 show the status band settings',
  '/rich status on | off        show or hide the band above the prompt',
  '/rich status look [name]     plain, gray, aurora, sunset or forest; none cycles',
  '/rich status lines [n]       auto, 1, 2 or 3 rows; none cycles',
  '/rich status account [show]  name, email or off; none cycles',
  '/rich status bar | resets | weather [on|off]   the context gauge, reset countdowns, Token Weather',
].join('\n')

export type StatusCommand = { kind: 'show' } | { kind: 'set'; settings: StatusSettings } | { kind: 'invalid'; reason: string }

/**
 * `/rich status` and its settings: no value cycles or toggles, a value sets.
 * `look`, `lines` and `account` cycle through their values in the order listed.
 */
export function statusCommand(words: readonly string[], current: StatusSettings): StatusCommand {
  const [what, value, ...rest] = words
  if (what === undefined) return { kind: 'show' }
  if (rest.length > 0) return { kind: 'invalid', reason: 'too many arguments' }
  const set = (patch: Partial<StatusSettings>): StatusCommand => ({ kind: 'set', settings: { ...current, ...patch } })
  if (what === 'on' || what === 'off') return value === undefined ? set({ visible: what === 'on' }) : { kind: 'invalid', reason: 'too many arguments' }
  const choose = <T extends string>(allowed: readonly T[], now: T): T | { reason: string } => {
    if (value === undefined) return allowed[(allowed.indexOf(now) + 1) % allowed.length]!
    return allowed.includes(value as T) ? (value as T) : { reason: `${what} takes ${allowed.join(', ')}` }
  }
  const toggle = (now: boolean): boolean | { reason: string } => {
    if (value === undefined) return !now
    return value === 'on' ? true : value === 'off' ? false : { reason: `${what} takes on or off` }
  }
  const apply = <T>(picked: T | { reason: string }, patch: (x: T) => Partial<StatusSettings>): StatusCommand =>
    typeof picked === 'object' && picked !== null && 'reason' in picked ? { kind: 'invalid', reason: picked.reason } : set(patch(picked as T))
  switch (what) {
    case 'look':
      return apply(choose(LOOKS, current.look), look => ({ look }))
    case 'lines':
      return apply(choose(LINES, current.lines), lines => ({ lines }))
    case 'account':
      return apply(choose(ACCOUNTS, current.account), account => ({ account }))
    case 'bar':
      return apply(toggle(current.bar), bar => ({ bar }))
    case 'resets':
      return apply(toggle(current.resets), resets => ({ resets }))
    case 'weather':
      return apply(toggle(current.weather), weather => ({ weather }))
    default:
      return { kind: 'invalid', reason: `unknown status setting "${what}"` }
  }
}

// ── What the band shows ────────────────────────────────────────────────

/** Drops control characters and backslashes, so a branch, path or label cannot reach the terminal as an escape. */
export function clean(text: string): string {
  return text.replace(/[\u0000-\u001f\u007f-\u009f\\]/g, '')
}

/** The project-relative path when inside the project, else the `~`-abbreviated absolute one. */
export function placeLabel(cwd: string, root: string, home?: string): string {
  const base = root.replace(/\/+$/, '')
  let label: string
  if (base !== '' && (cwd === base || cwd.startsWith(`${base}/`))) {
    label = `${base.slice(base.lastIndexOf('/') + 1)}${cwd.slice(base.length)}`
  } else if (home !== undefined && home !== '' && cwd === home) {
    label = '~'
  } else if (home !== undefined && home !== '' && cwd.startsWith(`${home}/`)) {
    label = `~${cwd.slice(home.length)}`
  } else {
    label = cwd
  }
  return clean(label) || '~'
}

/** `Opus` from `claude-opus-5-5`, `Claude Opus 5.5` or `opus[1m]`; else the name's first word. */
export function shortModel(model: string): string {
  const family = /(opus|sonnet|haiku|fable|mythos)/i.exec(model)?.[1]
  if (family !== undefined) return family[0]!.toUpperCase() + family.slice(1).toLowerCase()
  return clean(model.replace(/^claude[\s-]+/i, '').split(/[\s[]/)[0] ?? '') || 'Claude'
}

/** Branch, ahead/behind and untracked count from `git status --porcelain=v2 --branch`. */
export function parseGitStatus(text: string): { branch: string; ahead: number; behind: number; untracked: number; isInitial: boolean } | undefined {
  let oid = ''
  let head = ''
  let ahead = 0
  let behind = 0
  let untracked = 0
  for (const line of text.split('\n')) {
    if (line.startsWith('# branch.oid ')) oid = line.slice(13).trim()
    else if (line.startsWith('# branch.head ')) head = line.slice(14).trim()
    else if (line.startsWith('# branch.ab ')) {
      const m = /^\+(\d+) -(\d+)$/.exec(line.slice(12).trim())
      if (m) [ahead, behind] = [Number(m[1]), Number(m[2])]
    } else if (line.startsWith('? ')) untracked++
  }
  if (head === '') return undefined
  const branch = clean(head === '(detached)' ? oid.slice(0, 7) : head)
  if (branch === '') return undefined
  return { branch, ahead, behind, untracked, isInitial: oid === '(initial)' }
}

/** Lines added and deleted from `git diff --numstat`; a binary file's `-` counts nothing. */
export function parseNumstat(text: string): { added: number; deleted: number } {
  let added = 0
  let deleted = 0
  for (const line of text.split('\n')) {
    const [a, d] = line.split('\t')
    if (a !== undefined && /^\d+$/.test(a)) added += Number(a)
    if (d !== undefined && /^\d+$/.test(d)) deleted += Number(d)
  }
  return { added, deleted }
}

/** `~/.claude.json`'s account: its email, or its display name when it has none. */
export function accountFrom(json: string): string | undefined {
  try {
    const account = (JSON.parse(json) as { oauthAccount?: { emailAddress?: unknown; displayName?: unknown } }).oauthAccount
    const label = [account?.emailAddress, account?.displayName].find((x): x is string => typeof x === 'string' && x !== '')
    return label === undefined ? undefined : clean(label) || undefined
  } catch {
    return undefined
  }
}

export function limitLabel(kind: string): string {
  return kind === 'five_hour' ? '5h' : kind === 'seven_day' ? '7d' : kind === 'spend_limit' ? 'spend' : clean(kind)
}

export const clampPercent = (n: number) => Math.min(100, Math.max(0, Math.round(n)))

export function duration(ms: number): string {
  const s = Math.floor(Math.max(0, ms) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  return `${Math.floor(s / 3600)}h${Math.floor((s % 3600) / 60)}m`
}

export function countdown(ms: number): string {
  const s = Math.floor(Math.max(0, ms) / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  return d > 0 ? `${d}d${h}h` : `${h}h`
}

export function gauge(percent: number): string {
  const filled = Math.round((clampPercent(percent) * 8) / 100)
  return '█'.repeat(filled) + '░'.repeat(8 - filled)
}

export function short(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}k`
  return String(n)
}

// ── Colors, tuned for a dark terminal ──────────────────────────────────

export const COLOR = {
  fg: '#e5e9f0',
  dir: '#88c0d0',
  model: '#c5a8d8',
  effort: '#968cb9',
  clean: '#a3be8c',
  dirty: '#ecc487',
  untracked: '#9aa5c4',
  low: '#a3be8c',
  mid: '#ecc487',
  high: '#e06c75',
  cost: '#ebcb8b',
  time: '#9aa5c4',
  account: '#d08770',
  separator: '#60687a',
} as const

/** Green below 60 %, amber from 60 %, red from 85 %: one scale for the context and the rate limits. */
export function gaugeColor(percent: number): string {
  return percent >= 85 ? COLOR.high : percent >= 60 ? COLOR.mid : COLOR.low
}

const GRADIENTS: Record<Exclude<StatusLook, 'plain'>, [number[], number[]]> = {
  gray: [[74, 74, 74], [30, 30, 30]],
  aurora: [[30, 42, 74], [82, 48, 79]],
  sunset: [[36, 31, 66], [94, 48, 64]],
  forest: [[22, 58, 52], [44, 58, 85]],
}

const hex = (rgb: number[]) => `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`

/** The background of segment `i` of `m` on a powerline row: an even blend from the look's first color to its last. */
export function segmentBackground(look: Exclude<StatusLook, 'plain'>, i: number, m: number): string {
  const [from, to] = GRADIENTS[look]
  const t = m <= 1 ? 0.5 : i / (m - 1)
  return hex(from.map((c, k) => Math.round(c * (1 - t) + to[k]! * t)))
}

// ── Token Weather: a forecast of the context window ──────────────────

export const HISTORY = 12
const BARS = '▁▂▃▄▅▆▇█'
export const FORECAST = [
  { upTo: 25, icon: '☀', word: 'Clear', color: '#ebcb8b' },
  { upTo: 50, icon: '☁', word: 'Cloudy', color: '#88c0d0' },
  { upTo: 75, icon: '☂', word: 'Showers', color: '#81a1c1' },
  { upTo: 90, icon: '☇', word: 'Storm', color: '#b48ead' },
  { upTo: Infinity, icon: '↯', word: 'Compact soon', color: '#e06c75' },
] as const

export function forecast(percent: number): (typeof FORECAST)[number] {
  return FORECAST.find(f => percent < f.upTo)!
}

export function sparkline(history: readonly TokenReading[]): string {
  const top = Math.max(...history.map(r => r.tokens), 1)
  return history.map(r => BARS[Math.floor((r.tokens / top) * (BARS.length - 1))]).join('')
}

export function trend(history: readonly TokenReading[]): string | undefined {
  if (history.length < 2) return undefined
  const delta = history.at(-1)!.tokens - history.at(-2)!.tokens
  if (delta === 0) return 'steady'
  return delta > 0 ? `▲ +${short(delta)} last turn` : `▼ ${short(-delta)} last turn`
}

// ── Segments and layout ───────────────────────────────────────────────

export type Run = { text: string; color?: string; bold?: boolean }
export type Segment = { runs: Run[] }
type Groups = { a: Segment[]; b: Segment[]; c: Segment[]; weather: Segment[] }

const dot: Run = { text: ' · ', color: COLOR.time }

/** Every segment that has data, in its group; a figure the engine does not have hides its segment. */
export function bandGroups(data: StatusData, history: readonly TokenReading[], s: StatusSettings, columns: number): Groups {
  const a: Segment[] = [{ runs: [{ text: placeLabel(data.cwd, data.root, data.home), color: COLOR.dir }] }]
  if (data.git !== undefined) {
    const g = data.git
    const ch = g.changes
    const branchColor = ch === undefined ? COLOR.fg : ch.added + ch.deleted + ch.untracked > 0 ? COLOR.dirty : COLOR.clean
    const runs: Run[] = [{ text: g.branch, color: branchColor }]
    if (g.ahead > 0) runs.push({ text: ` ↑${g.ahead}`, color: COLOR.clean })
    if (g.behind > 0) runs.push({ text: ` ↓${g.behind}`, color: COLOR.dirty })
    a.push({ runs })
    const diff: Run[] = []
    if (ch !== undefined && (ch.added > 0 || ch.deleted > 0)) diff.push({ text: `+${ch.added}`, color: COLOR.low }, { text: ' ' }, { text: `-${ch.deleted}`, color: COLOR.high })
    if (ch !== undefined && ch.untracked > 0) diff.push(...(diff.length > 0 ? [{ text: ' ' }] : []), { text: `?${ch.untracked}`, color: COLOR.untracked })
    if (diff.length > 0) a.push({ runs: diff })
  }

  const b: Segment[] = []
  if (data.model !== undefined) {
    const runs: Run[] = [{ text: data.model, color: COLOR.model }]
    if (data.effort !== undefined) runs.push(dot, { text: data.effort, color: COLOR.effort })
    b.push({ runs })
  }
  const weather: Segment[] = []
  const ctx = data.context
  if (ctx !== undefined) {
    const p = clampPercent(ctx.percent)
    if (s.weather) {
      const f = forecast(p)
      weather.push({ runs: [{ text: `${f.icon}  ${f.word}`, color: f.color, bold: true }] })
      weather.push({ runs: [{ text: `${p}% of context` }, { text: `  ${short(ctx.tokens)} / ${short(ctx.window)}`, color: COLOR.time }] })
      if (columns >= 60 && history.length > 0) {
        const runs: Run[] = [{ text: 'last turns ', color: COLOR.time }, { text: sparkline(history), color: f.color }]
        const t = trend(history)
        if (t !== undefined) runs.push({ text: `  ${t}`, color: COLOR.time })
        weather.push({ runs })
      }
    } else {
      b.push({ runs: [{ text: s.bar ? `${gauge(p)} ${p}%` : `ctx ${p}%`, color: gaugeColor(p) }] })
    }
  }
  const timeCost: Run[] = []
  if (data.elapsedMs !== undefined) timeCost.push({ text: duration(data.elapsedMs), color: COLOR.time })
  if (data.costUsd !== undefined) timeCost.push(...(timeCost.length > 0 ? [dot] : []), { text: `$${data.costUsd.toFixed(2)}`, color: COLOR.cost })
  if (timeCost.length > 0) b.push({ runs: timeCost })

  const c: Segment[] = []
  if (s.account !== 'off' && data.account !== undefined) {
    const label = s.account === 'name' ? data.account.split('@')[0]! : data.account
    if (label !== '') c.push({ runs: [{ text: label, color: COLOR.account }] })
  }
  const limits: Run[] = []
  for (const limit of data.limits) {
    const p = clampPercent(limit.percent)
    if (limits.length > 0) limits.push(dot)
    limits.push({ text: `${limit.label} `, color: COLOR.time }, { text: `${p}%`, color: gaugeColor(p) })
    if (s.resets && limit.resetsAt !== undefined) limits.push({ text: ` (${countdown(limit.resetsAt - data.now)})`, color: COLOR.time })
  }
  if (limits.length > 0) c.push({ runs: limits })
  return { a, b, c, weather }
}

export const segmentWidth = (seg: Segment) => seg.runs.reduce((n, r) => n + cells(r.text), 0)

/** A row's width as drawn: plain joins with ` > ` (3 cells a gap), powerline wraps each as ` text ` and an arrow (3 each). */
export function rowWidth(row: readonly Segment[], look: StatusLook): number {
  if (row.length === 0) return 0
  const text = row.reduce((n, seg) => n + segmentWidth(seg), 0)
  return text + (look === 'plain' ? (row.length - 1) * 3 : row.length * 3)
}

/** The rows to draw: A, B and C on one, two or three lines (auto picks the fewest that fit), then the weather. */
export function layout(groups: Groups, s: StatusSettings, columns: number): Segment[][] {
  const { a, b, c } = groups
  let lines = s.lines
  if (lines === 'auto') {
    const fits = (row: Segment[]) => rowWidth(row, s.look) <= columns
    lines = fits([...a, ...b, ...c]) ? '1' : fits([...a, ...b]) && fits(c) ? '2' : '3'
  }
  const rows = lines === '1' ? [[...a, ...b, ...c]] : lines === '2' ? [[...a, ...b], c] : [a, b, c]
  return [...rows, groups.weather].filter(row => row.length > 0)
}
