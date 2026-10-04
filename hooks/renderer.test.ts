import { expect, test } from 'claude-code/testing'

import { renderMermaidAscii } from './vendor/mermaid-ascii.js'

function draw(source: string): string[] {
  return renderMermaidAscii(source, { colorMode: 'none', hyperlinks: false }).split('\n').map(line => line.replace(/\s+$/, ''))
}

/** Row and column of the first whole-word `name`. */
function find(lines: string[], name: string): { row: number; col: number } {
  const word = new RegExp(`(?<![\\w])${name}(?![\\w])`)
  for (let row = 0; row < lines.length; row++) {
    const match = word.exec(lines[row] ?? '')
    if (match) return { row, col: match.index }
  }
  throw new Error(`"${name}" is not in the drawing:\n${lines.join('\n')}`)
}

test('a state outside a composite state is drawn outside it, and the composite keeps its title', () => {
  const lines = draw(`stateDiagram-v2
    [*] --> Streaming
    Streaming --> Placeholder: fence still open
    Placeholder --> Streaming: more text
    Streaming --> Drawn: fence closed
    state Drawn {
        [*] --> LeftToRight
        LeftToRight --> TopToBottom: too wide
    }`)
  const at = (row: number, col: number) => lines[row]?.[col]
  // The composite's title row: its borders are the nearest │ on each side.
  const title = find(lines, 'Drawn')
  const left = (lines[title.row] ?? '').lastIndexOf('│', title.col)
  const right = (lines[title.row] ?? '').indexOf('│', title.col)
  let top = title.row
  while (top > 0 && at(top, left) !== '┌') top--
  let bottom = title.row
  while (bottom < lines.length - 1 && at(bottom, left) !== '└') bottom++
  expect(at(top, left)).toBe('┌')
  expect(at(bottom, left)).toBe('└')

  const outside = find(lines, 'Placeholder')
  const inside = outside.row > top && outside.row < bottom && outside.col > left && outside.col < right
  expect(inside).toBe(false)
  expect(find(lines, 'LeftToRight').row).toBeGreaterThan(top)
})

test('an ER edge beside a shorter entity reaches that entity', () => {
  const lines = draw(`erDiagram
    INSTALL }o--|| PROJECT : scopes
    INSTALL {
        string scope
        string installPath
    }`)
  const row = lines[find(lines, 'PROJECT').row] ?? ''
  // The cell left of PROJECT's border carries the edge, not a gap.
  expect(row).toMatch(/[─│╢○]│ PROJECT │/)
})

test('class attributes are shown as written, in either Mermaid form', () => {
  const lines = draw(`classDiagram
    class Picture {
        +string file
        +width: number
    }`)
  expect(lines.some(line => line.includes('+ string file'))).toBe(true)
  expect(lines.some(line => line.includes('+ width: number'))).toBe(true)
})
