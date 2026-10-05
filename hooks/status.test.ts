import { expect, test } from 'claude-code/testing'

import type { StatusData, StatusSettings } from '../types'
import {
  accountFrom,
  bandGroups,
  countdown,
  DEFAULT_SETTINGS,
  duration,
  forecast,
  gauge,
  gaugeColor,
  COLOR,
  layout,
  parseGitStatus,
  parseNumstat,
  placeLabel,
  rowWidth,
  segmentBackground,
  segmentWidth,
  settingsFrom,
  shortModel,
  short,
  sparkline,
  statusCommand,
  trend,
} from './status.ts'
import type { Segment } from './status.ts'

const text = (row: readonly Segment[]) => row.map(seg => seg.runs.map(r => r.text).join('')).join(' | ')

const DATA: StatusData = {
  cwd: '/work/app/src',
  root: '/work/app',
  home: '/Users/me',
  git: { branch: 'main', ahead: 1, behind: 0, changes: { added: 12, deleted: 3, untracked: 2 } },
  model: 'Opus',
  effort: 'xhigh',
  elapsedMs: 12 * 60_000,
  context: { tokens: 84_000, window: 200_000, percent: 42 },
  costUsd: 1.234,
  limits: [
    { label: '5h', percent: 12, resetsAt: 3 * 3600_000 },
    { label: '7d', percent: 67, resetsAt: (2 * 24 + 5) * 3600_000 },
  ],
  account: 'me@example.com',
  now: 0,
}

test('the place is project-relative on a path boundary, else abbreviated under home', () => {
  expect(placeLabel('/work/app/src', '/work/app')).toBe('app/src')
  expect(placeLabel('/work/app', '/work/app/')).toBe('app')
  // A shared prefix is not inside the project.
  expect(placeLabel('/work/application', '/work/app', '/Users/me')).toBe('/work/application')
  expect(placeLabel('/Users/me/notes', '/work/app', '/Users/me')).toBe('~/notes')
  expect(placeLabel('/Users/me', '/work/app', '/Users/me')).toBe('~')
  expect(placeLabel('/work/a\u001b[31mb', '/elsewhere')).toBe('/work/a[31mb')
})

test('model names shorten to their family, whatever form they come in', () => {
  expect(shortModel('claude-opus-5-5')).toBe('Opus')
  expect(shortModel('Claude Sonnet 5.5')).toBe('Sonnet')
  expect(shortModel('opus[1m]')).toBe('Opus')
  expect(shortModel('claude-fable-5-1')).toBe('Fable')
  expect(shortModel('gpt-oss')).toBe('gpt-oss')
  expect(shortModel('')).toBe('Claude')
})

test('git status porcelain v2 gives the branch, ahead/behind and untracked files', () => {
  const status = ['# branch.oid 1234567890abcdef', '# branch.head main', '# branch.upstream origin/main', '# branch.ab +2 -1', '1 .M N... 100644 100644 100644 a b f', '? new.txt', '? dir/other.txt'].join('\n')
  expect(parseGitStatus(status)).toEqual({ branch: 'main', ahead: 2, behind: 1, untracked: 2, isInitial: false })
  expect(parseGitStatus('# branch.oid 1234567890abcdef\n# branch.head (detached)')?.branch).toBe('1234567')
  expect(parseGitStatus('# branch.oid (initial)\n# branch.head main')?.isInitial).toBe(true)
  expect(parseGitStatus('')).toBe(undefined)
  expect(parseNumstat('3\t1\ta.ts\n-\t-\timage.png\n10\t0\tb.ts\n')).toEqual({ added: 13, deleted: 1 })
})

test('the account is the email, else the display name, and never an escape', () => {
  expect(accountFrom(JSON.stringify({ oauthAccount: { emailAddress: 'me@example.com', displayName: 'Me' } }))).toBe('me@example.com')
  expect(accountFrom(JSON.stringify({ oauthAccount: { displayName: 'Me' } }))).toBe('Me')
  expect(accountFrom(JSON.stringify({ oauthAccount: { emailAddress: '\u001b]0;x\u0007' } }))).toBe(']0;x')
  expect(accountFrom('{}')).toBe(undefined)
  expect(accountFrom('not json')).toBe(undefined)
})

test('figures format as the status line drew them', () => {
  expect(duration(45_000)).toBe('45s')
  expect(duration(12 * 60_000)).toBe('12m')
  expect(duration(65 * 60_000)).toBe('1h5m')
  expect(countdown(3 * 3600_000)).toBe('3h')
  expect(countdown((2 * 24 + 5) * 3600_000)).toBe('2d5h')
  expect(countdown(-5)).toBe('0h')
  expect(gauge(42)).toBe('███░░░░░')
  expect(gauge(150)).toBe('████████')
  expect(short(134_400)).toBe('134.4k')
  expect(short(1_000_000)).toBe('1M')
  expect(gaugeColor(59)).toBe(COLOR.low)
  expect(gaugeColor(60)).toBe(COLOR.mid)
  expect(gaugeColor(85)).toBe(COLOR.high)
})

test('stored settings are taken field by field; a bad value keeps its default', () => {
  expect(settingsFrom(undefined)).toEqual(DEFAULT_SETTINGS)
  expect(settingsFrom({ rows: 'all', look: 'aurora', lines: '2', bar: 'yes', account: 'nobody', weather: false })).toEqual({
    ...DEFAULT_SETTINGS,
    rows: 'all',
    look: 'aurora',
    lines: '2',
    weather: false,
  })
})

test('status commands show, cycle, toggle and set; anything else is refused', () => {
  const s = DEFAULT_SETTINGS
  const set = (words: string[], from: StatusSettings = s) => {
    const command = statusCommand(words, from)
    if (command.kind !== 'set') throw new Error(`not a set: ${JSON.stringify(command)}`)
    return command.settings
  }
  expect(statusCommand([], s)).toEqual({ kind: 'show' })
  expect(set(['off']).visible).toBe(false)
  expect(set(['rows']).rows).toBe('all')
  expect(set(['rows', 'weather'], { ...s, rows: 'all' }).rows).toBe('weather')
  expect(statusCommand(['rows', 'some'], s)).toEqual({ kind: 'invalid', reason: 'rows takes weather, all' })
  expect(set(['look']).look).toBe('gray')
  expect(set(['look'], { ...s, look: 'forest' }).look).toBe('plain')
  expect(set(['look', 'sunset']).look).toBe('sunset')
  expect(set(['lines']).lines).toBe('1')
  expect(set(['lines', '3']).lines).toBe('3')
  expect(set(['account']).account).toBe('email')
  expect(set(['account', 'off']).account).toBe('off')
  expect(set(['bar']).bar).toBe(true)
  expect(set(['resets', 'on']).resets).toBe(true)
  expect(set(['weather', 'off']).weather).toBe(false)
  expect(statusCommand(['look', 'neon'], s)).toEqual({ kind: 'invalid', reason: 'look takes plain, gray, aurora, sunset, forest' })
  expect(statusCommand(['bar', 'maybe'], s).kind).toBe('invalid')
  expect(statusCommand(['off', 'now'], s).kind).toBe('invalid')
  expect(statusCommand(['look', 'gray', 'extra'], s).kind).toBe('invalid')
  expect(statusCommand(['colour'], s)).toEqual({ kind: 'invalid', reason: 'unknown status setting "colour"' })
})

test('the groups carry every figure there is, and Token Weather replaces the context gauge', () => {
  const history = [
    { tokens: 36_100, window: 200_000, percent: 18 },
    { tokens: 84_000, window: 200_000, percent: 42 },
  ]
  const g = bandGroups(DATA, history, { ...DEFAULT_SETTINGS, resets: true }, 120)
  expect(text(g.a)).toBe('app/src | main ↑1 | +12 -3 ?2')
  expect(text(g.b)).toBe('Opus · xhigh | 12m · $1.23')
  expect(text(g.c)).toBe('me | 5h 12% (3h) · 7d 67% (2d5h)')
  expect(text(g.weather)).toBe('☁  Cloudy | 42% of context  84k / 200k | last turns ▄█  ▲ +47.9k last turn')

  const lean = bandGroups(DATA, history, { ...DEFAULT_SETTINGS, weather: false, account: 'email' }, 120)
  expect(text(lean.b)).toBe('Opus · xhigh | ctx 42% | 12m · $1.23')
  expect(text(lean.c)).toBe('me@example.com | 5h 12% · 7d 67%')
  expect(lean.weather).toEqual([])
  expect(text(bandGroups(DATA, history, { ...DEFAULT_SETTINGS, weather: false, bar: true }, 120).b)).toContain('███░░░░░ 42%')
  // Narrow: no sparkline.
  expect(text(bandGroups(DATA, history, DEFAULT_SETTINGS, 59).weather)).toBe('☁  Cloudy | 42% of context  84k / 200k')
})

test('a figure the engine does not have hides its segment instead of showing a blank', () => {
  const bare: StatusData = { cwd: '/tmp', root: '/work/app', limits: [], now: 0 }
  const g = bandGroups(bare, [], DEFAULT_SETTINGS, 120)
  expect(text(g.a)).toBe('/tmp')
  expect(g.b).toEqual([])
  expect(g.c).toEqual([])
  expect(g.weather).toEqual([])
  // An unmeasured working tree: the branch is neither clean nor dirty, and no diff is claimed.
  const unmeasured = bandGroups({ ...bare, git: { branch: 'main', ahead: 0, behind: 0 } }, [], DEFAULT_SETTINGS, 120)
  expect(unmeasured.a.length).toBe(2)
  expect(unmeasured.a[1]!.runs[0]!.color).toBe(COLOR.fg)
  const clean = bandGroups({ ...bare, git: { branch: 'main', ahead: 0, behind: 0, changes: { added: 0, deleted: 0, untracked: 0 } } }, [], DEFAULT_SETTINGS, 120)
  expect(clean.a[1]!.runs[0]!.color).toBe(COLOR.clean)
})

test('auto lines takes the fewest rows that fit, measured as drawn', () => {
  const s: StatusSettings = { ...DEFAULT_SETTINGS, rows: 'all' }
  const g = bandGroups(DATA, [], { ...s, weather: false }, 200)
  const one = rowWidth([...g.a, ...g.b, ...g.c], 'plain')
  expect(layout(g, s, one).length).toBe(1)
  expect(layout(g, s, one - 1).length).toBe(2)
  expect(layout(g, s, rowWidth([...g.a, ...g.b], 'plain') - 1).length).toBe(3)
  expect(layout(g, { ...s, lines: '3' }, 500).length).toBe(3)
  expect(layout(g, { ...s, lines: '2' }, 10).length).toBe(2)
  // Powerline spends three cells a segment, plain three a gap.
  expect(rowWidth(g.a, 'aurora') - rowWidth(g.a, 'plain')).toBe(3)
  // Wide characters count two cells.
  expect(segmentWidth({ runs: [{ text: '文档' }] })).toBe(4)
  // The weather is always its own last row.
  const w = bandGroups(DATA, [], s, 500)
  expect(layout(w, s, 500).at(-1)).toBe(w.weather)
  // Weather alone by default.
  expect(layout(w, DEFAULT_SETTINGS, 500)).toEqual([w.weather])
  expect(layout({ ...w, weather: [] }, DEFAULT_SETTINGS, 500)).toEqual([])
})

test('the weather follows the forecast bands, and the sparkline scales to the fullest turn', () => {
  expect(forecast(0).word).toBe('Clear')
  expect(forecast(25).word).toBe('Cloudy')
  expect(forecast(67).word).toBe('Showers')
  expect(forecast(89).word).toBe('Storm')
  expect(forecast(100).word).toBe('Compact soon')
  const h = (tokens: number) => ({ tokens, window: 200_000, percent: 0 })
  expect(sparkline([h(0), h(50), h(100)])).toBe('▁▄█')
  expect(trend([h(1)])).toBe(undefined)
  expect(trend([h(5), h(5)])).toBe('steady')
  expect(trend([h(134_400), h(36_100)])).toBe('▼ 98.3k last turn')
})

test('powerline backgrounds run from the look\'s first color to its last', () => {
  expect(segmentBackground('aurora', 0, 3)).toBe('#1e2a4a')
  expect(segmentBackground('aurora', 2, 3)).toBe('#52304f')
  expect(segmentBackground('gray', 0, 1)).toBe('#343434')
})
