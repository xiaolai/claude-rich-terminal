import type { On, RenderElement } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine, MockClock } from 'claude-code/testing'

const STATUS = ['# branch.oid 1234567890abcdef', '# branch.head main', '# branch.ab +1 -0', '? new.txt', '? two.txt'].join('\n')
const HOUR = 3600_000
const START = Date.parse('2026-10-05T10:00:00Z')

type World = {
  tokens: number | undefined
  /** How each git call answers: its stdout, a failure, or a timeout. */
  git: (args: string[]) => { stdout: string } | 'fail' | 'timeout'
  gitCalls: string[][]
}

/** The session, git and the account beneath the plugin. */
function world(on: On, store: Record<string, unknown> = {}): { w: World; clock: MockClock; kept: Map<string, unknown> } {
  const clock = mock.clock(on, { now: START })
  const w: World = {
    tokens: 84_000,
    git: args => (args.includes('status') ? { stdout: STATUS } : { stdout: '12\t3\ta.ts\n' }),
    gitCalls: [],
  }
  mock.env(on, { HOME: '/Users/me' })
  // The plugin's store in memory, open to the test.
  const kept = new Map(Object.entries(store))
  on('store.get', (_$, e) => ({ value: kept.get(e.key) }))
  on('store.set', (_$, e) => {
    kept.set(e.key, e.value)
    return { value: undefined }
  })
  on('ui.log', () => ({ value: undefined }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('session.start', (_$, e) => ({ cwd: e.cwd }) as never)
  on('session.cwd', () => ({ value: '/work/app/src' }))
  on('session.root', () => ({ value: '/work/app' }))
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('session.usage', () => ({
    value: {
      startedAt: START - 12 * 60_000,
      context: w.tokens === undefined ? { window: 200_000 } : { tokens: w.tokens, window: 200_000, percent: Math.round(w.tokens / 2_000) },
      rateLimits: [
        { kind: 'five_hour', percentUsed: 12, resetsAt: new Date(START + 3 * HOUR).toISOString() },
        { kind: 'seven_day', percentUsed: 67, resetsAt: new Date(START + 53 * HOUR).toISOString() },
      ],
      cost: { usd: 1.234 },
    },
  }))
  on('fs.read', (_$, e) => {
    if (e.path !== '/Users/me/.claude.json') throw new Error('ENOENT')
    return { value: JSON.stringify({ oauthAccount: { emailAddress: 'me@example.com' } }) }
  })
  on('process.run', (_$, e) => {
    if (e.argv[0] !== 'git') throw new Error(`unexpected command ${e.argv[0]}`)
    const args = e.argv.slice(1)
    w.gitCalls.push(args)
    const answer = w.git(args)
    if (answer === 'timeout') return { deny: 'timed out' }
    const ok = answer !== 'fail'
    return { value: { exitCode: ok ? 0 : 128, stdout: ok ? answer.stdout : '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  return { w, clock, kept }
}

/** Stands for the engine's own band: drawn when the plugin passes. */
function engineBand(on: On): void {
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return h(Text, null, 'engine') as RenderElement
  })
}

async function start($: Engine, clock: MockClock): Promise<void> {
  await $.session.start({ cwd: '/work/app/src', surface: 'terminal', isInteractive: true } as never)
  await clock.settle()
}

const band = ($: Engine, extra: Record<string, unknown> = {}) =>
  $.ui.mount({
    plugin: 'rich-terminal',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 200, ...extra },
  } as never)

const rich = ($: Engine, args: string) =>
  $.command.run({ command: 'rich', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })

/** The band's rows as text, one string per row. */
async function rows(ui: Awaited<ReturnType<typeof band>>): Promise<string[]> {
  const found = await ui.findAll({ type: 'Text' })
  return found.filter(t => t.props.wrap === 'truncate-end').map(t => t.text)
}

test('the band shows place, git, model, time, cost, account and limits, then the weather', { timeoutMs: 60_000 }, async ($, on) => {
  const { clock } = world(on)
  engineBand(on)
  await start($, clock)
  const ui = await band($)
  expect(await rows(ui)).toEqual([
    'app/src > main ↑1 > +12 -3 ?2 > Opus > 12m · $1.23 > me > 5h 12% · 7d 67%',
    '☁  Cloudy > 42% of context  84k / 200k > last turns █',
  ])
  await ui.unmount()
})

test('Token Weather follows the context window turn by turn', { timeoutMs: 60_000 }, async ($, on) => {
  const { w, clock } = world(on)
  on('turn.complete', () => ({ text: '' }) as never)
  w.tokens = 36_100
  await start($, clock)
  const ui = await band($)
  expect(await ui.find({ type: 'Text', text: /☀  Clear/ })).toBeDefined()

  w.tokens = 134_400
  await $.turn.complete({ reason: 'answer', answer: 'ok', durationMs: 1, isAborted: false, turnId: 't1' } as never)
  await clock.settle()
  expect(await ui.find({ type: 'Text', text: /☂  Showers/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /67% of context/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /▲ \+98\.3k last turn/ })).toBeDefined()

  // A subagent's turn takes no reading.
  w.tokens = 190_000
  await $.turn.complete({ reason: 'answer', answer: 'ok', durationMs: 1, isAborted: false, turnId: 't2', agentId: 'a1' } as never)
  await clock.settle()
  expect(await ui.find({ type: 'Text', text: /▲ \+98\.3k last turn/ })).toBeDefined()
  await ui.unmount()
})

test('the main loop\'s model and effort are shown; a subagent\'s are not', { timeoutMs: 60_000 }, async ($, on) => {
  const { clock } = world(on)
  on('turn.step', async function* (_$, e) {
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [] } as never
  })
  await start($, clock)
  const drain = async (e: Record<string, unknown>) => {
    for await (const _ of $.turn.step({ turnId: 't1', index: 0, messageCount: 1, ...e } as never)) {
      // the step's chunks are not looked at
    }
  }
  await drain({ model: 'claude-sonnet-5-5', effort: 'xhigh' })
  await drain({ model: 'claude-haiku-4-5', effort: 'low', agentId: 'a1' })
  await clock.settle()
  const ui = await band($)
  expect((await rows(ui))[0]).toContain('Sonnet · xhigh')
  await ui.unmount()
})

test('/rich status changes the band at once and keeps the change', { timeoutMs: 60_000 }, async ($, on) => {
  const { clock, kept } = world(on)
  engineBand(on)
  await start($, clock)
  const ui = await band($)

  expect((await rich($, 'status look aurora')).text).toContain('look aurora')
  const painted = await ui.findAll({ type: 'Text' })
  expect(painted.some(t => t.props.backgroundColor === '#1e2a4a')).toBe(true)
  expect(kept.get('statusSettings')).toEqual(expect.objectContaining({ look: 'aurora' }))

  await rich($, 'status weather off')
  await rich($, 'status lines 3')
  await clock.settle()
  const arrow = '\ue0b0'
  expect(await rows(ui)).toEqual([
    ` app/src ${arrow} main ↑1 ${arrow} +12 -3 ?2 ${arrow}`,
    ` Opus ${arrow} ctx 42% ${arrow} 12m · $1.23 ${arrow}`,
    ` me ${arrow} 5h 12% · 7d 67% ${arrow}`,
  ])

  await rich($, 'status off')
  expect(await ui.find({ type: 'Text', text: 'engine' })).toBeDefined()
  expect((await rich($, 'status')).text).toBe('status band off · look aurora · lines 3 · bar off · account name · resets off · weather off')
  expect((await rich($, 'status look neon')).text).toContain('look takes plain, gray, aurora, sunset, forest')
  await ui.unmount()
})

test('kept settings apply from the session start', { timeoutMs: 60_000 }, async ($, on) => {
  const { clock } = world(on, { statusSettings: { look: 'plain', account: 'email', resets: true, weather: false } })
  await start($, clock)
  const ui = await band($)
  expect((await rows(ui))[0]).toContain('me@example.com > 5h 12% (3h) · 7d 67% (2d5h)')
  await ui.unmount()
})

test('a survey has the band; a narrow band takes more rows', { timeoutMs: 60_000 }, async ($, on) => {
  const { clock } = world(on)
  engineBand(on)
  await start($, clock)
  const survey = await band($, { hasSurvey: true })
  expect(await survey.find({ type: 'Text', text: 'engine' })).toBeDefined()
  await survey.unmount()
  const narrow = await band($, { bodyColumns: 40 })
  expect((await rows(narrow)).length).toBe(4)
  await narrow.unmount()
})

test('git that fails or times out loses its segment, never the band', { timeoutMs: 60_000 }, async ($, on) => {
  const { w, clock } = world(on)
  w.git = () => 'fail'
  await start($, clock)
  const outside = await band($)
  expect((await rows(outside))[0]).toBe('app/src > Opus > 12m · $1.23 > me > 5h 12% · 7d 67%')
  await outside.unmount()

  // The branch is known but the diff timed out: the branch shows, no diff is claimed.
  w.git = args => (args.includes('status') ? { stdout: STATUS } : 'timeout')
  await clock.advance(5000)
  const slow = await band($)
  expect((await rows(slow))[0]).toBe('app/src > main ↑1 > Opus > 12m · $1.23 > me > 5h 12% · 7d 67%')
  await slow.unmount()
  // Every call takes no locks and runs nothing the repository's config names.
  for (const args of w.gitCalls) expect(args.slice(0, 3)).toEqual(['--no-optional-locks', '-c', 'core.fsmonitor=false'])
  const diffs = w.gitCalls.filter(args => args.includes('diff'))
  expect(diffs.length > 0).toBe(true)
  for (const args of diffs) expect(args).toEqual(expect.arrayContaining(['--no-ext-diff', '--no-textconv']))
})

test('nothing is drawn before the first reading, and a fresh session has no weather yet', { timeoutMs: 60_000 }, async ($, on) => {
  const { w, clock } = world(on)
  engineBand(on)
  const early = await band($)
  expect(await early.find({ type: 'Text', text: 'engine' })).toBeDefined()
  await early.unmount()
  w.tokens = undefined
  await start($, clock)
  const ui = await band($)
  expect(await rows(ui)).toEqual(['app/src > main ↑1 > +12 -3 ?2 > Opus > 12m · $1.23 > me > 5h 12% · 7d 67%'])
  await ui.unmount()
})

test('a non-interactive session reads nothing for a band no one sees', { timeoutMs: 60_000 }, async ($, on) => {
  const { w, clock } = world(on)
  engineBand(on)
  on('turn.complete', () => ({ text: '' }) as never)
  await $.session.start({ cwd: '/work/app/src', surface: 'terminal', isInteractive: false } as never)
  await $.turn.complete({ reason: 'answer', answer: 'ok', durationMs: 1, isAborted: false, turnId: 't1' } as never)
  await clock.advance(30_000)
  expect(w.gitCalls).toEqual([])
  const ui = await band($)
  expect(await ui.find({ type: 'Text', text: 'engine' })).toBeDefined()
  await ui.unmount()
})
