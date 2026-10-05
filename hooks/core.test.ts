import { expect, test } from 'claude-code/testing'

import {
  cells,
  fileUrl,
  findDiagrams,
  fit,
  hash,
  imagePage,
  kindOf,
  listing,
  needsWholeMarkdown,
  pageSize,
  parseCommand,
  pick,
  rewrite,
  scaleFor,
  viewerHtml,
} from './core.ts'

const F = '```'

test('fences are found at top level, in blockquotes and in list items', () => {
  const text = [
    `${F}mermaid`,
    'graph TD',
    `${F}`,
    '> quoted:',
    `> ${F}mermaid`,
    '> sequenceDiagram',
    '>   A->>B: hi',
    `> ${F}`,
    '- item',
    '',
    `  ${F}mermaid`,
    '  stateDiagram-v2',
    `  ${F}`,
  ].join('\n')
  const found = findDiagrams(text)
  expect(found.map(d => [d.kind, d.prefix, d.closed])).toEqual([
    ['flowchart', '', true],
    ['sequence', '> ', true],
    ['stateDiagram-v2', '  ', true],
  ])
  expect(found[1]!.source).toBe('sequenceDiagram\n  A->>B: hi')
})

test('a fence on a list item\'s own line is found and rewritten in place', () => {
  const text = `- ${F}mermaid\n  graph TD\n  ${F}\n- next`
  const found = findDiagrams(text)
  expect(found.map(d => [d.lead, d.prefix, d.source, d.closed])).toEqual([['- ', '  ', 'graph TD', true]])
  expect(rewrite(text, found, () => 'one\ntwo')).toBe('- one\n  two\n- next')
})

test('nested containers: a quote inside a list item, and an indented fence inside a quote', () => {
  const nested = `- > ${F}mermaid\n  > graph TD\n  > ${F}`
  const [a] = findDiagrams(nested)
  expect([a!.lead, a!.prefix, a!.source, a!.closed]).toEqual(['- > ', '  > ', 'graph TD', true])
  expect(rewrite(nested, [a!], () => 'one\ntwo')).toBe('- > one\n  > two')
  const indented = `>   ${F}mermaid\n>   graph TD\n>   ${F}`
  expect(findDiagrams(indented).map(d => [d.source, d.closed])).toEqual([['graph TD', true]])
})

test('four spaces before a fence make indented code inside a quote too', () => {
  expect(findDiagrams(`>     ${F}mermaid\n>     graph TD\n>     ${F}`)).toEqual([])
})

test('a quote under a list item keeps its indentation when rewritten', () => {
  const text = `- item\n\n  > ${F}mermaid\n  > graph TD\n  > ${F}`
  const found = findDiagrams(text)
  expect(found.map(d => [d.lead, d.prefix])).toEqual([['  > ', '  > ']])
  expect(rewrite(text, found, () => 'one\ntwo')).toBe('- item\n\n  > one\n  > two')
})

test('a list item\'s fence ends where the item ends', () => {
  const text = `- ${F}mermaid\n  graph TD\nafter\n\n${F}mermaid\npie\n${F}`
  expect(findDiagrams(text).map(d => [d.source, d.closed])).toEqual([
    ['graph TD', true],
    ['pie', true],
  ])
})

test('a quoted fence ends where the quote ends instead of swallowing what follows', () => {
  const text = `> ${F}mermaid\n> graph TD\n\nafter\n\n${F}mermaid\npie\n${F}`
  const found = findDiagrams(text)
  expect(found.map(d => [d.source, d.closed])).toEqual([
    ['graph TD', true],
    ['pie', true],
  ])
  expect(text.slice(found[0]!.end)).toBe(`\n\nafter\n\n${F}mermaid\npie\n${F}`)
})

test('examples are left alone: inside code fences, HTML comments, pre blocks and indented code', () => {
  const text = [
    `${F}${F}md`,
    `${F}mermaid`,
    'graph TD',
    `${F}`,
    `${F}${F}`,
    '<!--',
    `${F}mermaid`,
    'graph TD',
    `${F}`,
    '-->',
    '> <!--',
    `> ${F}mermaid`,
    '> -->',
    '- <!--',
    `  ${F}mermaid`,
    '  -->',
    '<pre>',
    `${F}mermaid`,
    `${F}`,
    '</pre>',
    '',
    `    ${F}mermaid`,
    '    graph TD',
    `    ${F}`,
  ].join('\n')
  expect(findDiagrams(text)).toEqual([])
})

test('CRLF sources are normalised; an unclosed fence is reported open', () => {
  const [closed] = findDiagrams(`x\r\n${F}mermaid\r\ngraph TD\r\n A-->B\r\n${F}\r\ny`)
  expect(closed!.source).toBe('graph TD\n A-->B')
  const [open] = findDiagrams(`${F}mermaid\ngraph TD\n A-->`)
  expect(open!.closed).toBe(false)
})

test('rewrite keeps everything outside the fences and re-adds container prefixes', () => {
  const text = `before\n> ${F}mermaid\n> graph TD\n> ${F}\nafter`
  const out = rewrite(text, findDiagrams(text), () => 'one\ntwo')
  expect(out).toBe('before\n> one\n> two\nafter')
})

test('frontmatter does not hide the diagram kind', () => {
  expect(kindOf('---\ntitle: x\n---\nflowchart LR\n A-->B')).toBe('flowchart')
})

test('ids are 16 hex characters and tell apart sources that collided under the old 32-bit id', () => {
  const a = hash('flowchart LR\nA["label c7740b5d"]')
  const b = hash('flowchart LR\nA["label b517208c"]')
  expect(a).toMatch(/^[0-9a-f]{16}$/)
  expect(a).not.toBe(b)
})

test('cells counts wide, emoji, combining, ZWJ and tabs', () => {
  expect(cells('重试 ab')).toBe(7)
  expect(cells('☕☕☕')).toBe(6)
  expect(cells('é')).toBe(1)
  expect(cells('👨‍👩‍👧')).toBe(2)
  expect(cells('x\ty')).toBe(9)
  expect(cells('🇺🇸')).toBe(2)
  expect(cells('1️⃣')).toBe(2)
  expect(cells('👍🏽')).toBe(2)
  expect(cells('┌──┐')).toBe(4)
})

test('fit handles very large art without overflowing the call stack', { timeoutMs: 60_000 }, () => {
  const result = fit('x\n'.repeat(200_000), 80, Number.POSITIVE_INFINITY)
  expect(result.fits).toBe(true)
  expect(fit('abc', 2, 5).fits).toBe(false)
})

test('picture sizes must be positive, bounded and within the pixel budget', () => {
  expect(pageSize('<title>SIZE 547x450</title>')).toEqual({ width: 547, height: 450 })
  expect('error' in pageSize('<title>SIZE 0x0</title>')).toBe(true)
  expect('error' in pageSize('<title>SIZE 5000x10</title>')).toBe(true)
  expect('error' in pageSize('<title>SIZE 4000x4000</title>')).toBe(true)
  expect('error' in pageSize('<title>SIZE 99999999999999999999x1</title>')).toBe(true)
  expect('error' in pageSize('<title>ERROR boom</title>')).toBe(true)
  expect(scaleFor(500, 500)).toBe(2)
  expect(scaleFor(3000, 2000)).toBe(1)
})

test('pick: by number, by exact id, by unique prefix; ambiguity is reported', () => {
  const ds = [
    { id: 'abcd1234aaaaaaaa', kind: 'flowchart', source: 'graph TD', start: 0, end: 1, closed: true, lead: '', prefix: '' },
    { id: 'abcd5678bbbbbbbb', kind: 'pie', source: 'pie', start: 2, end: 3, closed: true, lead: '', prefix: '' },
  ]
  expect(pick(ds, '1')).toEqual({ diagram: ds[0] })
  expect(pick(ds, undefined)).toEqual({ diagram: ds[1] })
  expect(pick(ds, 'abcd5')).toEqual({ diagram: ds[1] })
  expect('error' in pick(ds, 'abcd')).toBe(true)
  expect('error' in pick(ds, '3')).toBe(true)
  expect(listing(ds)).toContain('abcd5678bbbbbbbb')
})

test('commands parse strictly', () => {
  expect(parseCommand('open 2')).toEqual({ kind: 'open', id: '2' })
  expect(parseCommand('list').kind).toBe('list')
  expect(parseCommand('open a b').kind).toBe('invalid')
  expect(parseCommand('preview').kind).toBe('invalid')
  expect(parseCommand('').kind).toBe('help')
})

test('whole-message Markdown is kept when reference definitions or containers are involved', () => {
  const text = `see [doc][d]\n\n${F}mermaid\ngraph TD\n${F}\n\n[d]: https://example.com`
  expect(needsWholeMarkdown(text, findDiagrams(text))).toBe(true)
  const multi = `see [doc][d]\n\n${F}mermaid\ngraph TD\n${F}\n\n[d]:\n  https://example.com`
  expect(needsWholeMarkdown(multi, findDiagrams(multi))).toBe(true)
  const label = `see [my\ndoc]\n\n${F}mermaid\ngraph TD\n${F}\n\n[my\ndoc]: https://example.com`
  expect(needsWholeMarkdown(label, findDiagrams(label))).toBe(true)
  const quoted = `see [d]\n\n${F}mermaid\ngraph TD\n${F}\n\n> [d]: https://example.com`
  expect(needsWholeMarkdown(quoted, findDiagrams(quoted))).toBe(true)
  const listed = `see [d]\n\n${F}mermaid\ngraph TD\n${F}\n\n- [d]: https://example.com`
  expect(needsWholeMarkdown(listed, findDiagrams(listed))).toBe(true)
  const plain = `hi\n\n${F}mermaid\ngraph TD\n${F}`
  expect(needsWholeMarkdown(plain, findDiagrams(plain))).toBe(false)
})

test('pages carry a CSP that blocks the network, and escape their script URLs', () => {
  const [d] = findDiagrams(`${F}mermaid\nflowchart LR\n  A["</script><img src=https://evil.invalid>"]-->B\n${F}`)
  const scripts = { mermaid: 'file:///a&copy;/mermaid.min.js', page: fileUrl('/x #y/viewer.js') }
  for (const page of [viewerHtml(d!, scripts), imagePage(d!, 'dark', scripts)]) {
    expect(page).toContain("default-src 'none'")
    expect(page).toContain('src="file:///a&amp;copy;/mermaid.min.js"')
    expect(page).toContain('file:///x%20%23y/viewer.js')
    expect(page).not.toContain('</script><img')
  }
})
