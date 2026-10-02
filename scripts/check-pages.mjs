// Checks the generated browser pages in real headless Chrome: they draw, keep
// no links, and make no network request even when a diagram names URLs.
// Run: node scripts/check-pages.mjs   (needs Chrome, Chromium, Edge or Brave)
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fileUrl, findDiagrams, imagePage, viewerHtml } from '../hooks/core.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const browser = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find(p => p && fs.existsSync(p))
if (!browser) {
  console.error('No Chromium-based browser found; set CHROME to one.')
  process.exit(2)
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'rich-terminal-check-'))
const hits = []
const server = http.createServer((q, s) => {
  hits.push(q.url)
  s.end('x')
})
await new Promise(ready => server.listen(0, '127.0.0.1', ready))
const origin = `http://127.0.0.1:${server.address().port}`

/** Loads a page in headless Chrome and answers its DOM; kills the whole process group after. */
function load(page) {
  return new Promise(done => {
    const out = path.join(work, `${path.basename(page)}.out`)
    const fd = fs.openSync(out, 'w')
    const child = spawn(
      browser,
      ['--headless', '--disable-gpu', '--no-first-run', `--user-data-dir=${path.join(work, 'profile')}`, '--virtual-time-budget=6000', '--dump-dom', fileUrl(page)],
      { detached: true, stdio: ['ignore', fd, 'ignore'] },
    )
    const started = Date.now()
    const poll = setInterval(() => {
      const dom = fs.readFileSync(out, 'utf8')
      if (dom.includes('</html>') || Date.now() - started > 60_000) {
        clearInterval(poll)
        try {
          process.kill(-child.pid, 'SIGKILL')
        } catch {}
        fs.closeSync(fd)
        done(dom)
      }
    }, 250)
  })
}

const F = '```'
const scripts = page => ({ mermaid: fileUrl(`${root}/viewer/mermaid.min.js`), page: fileUrl(`${root}/viewer/${page}`) })
const cases = {
  'plain diagram': `flowchart LR\n  A["<img src=${origin}/html-label.png> x"] --> B\n  click B "${origin}/click"`,
  'blocked image': `flowchart LR\n  A@{ img: "${origin}/image-shape.png", label: "pic", w: 60, h: 60 }\n  A --> B\n  click B "${origin}/click"`,
}

let failed = false
const check = (name, ok, detail) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`)
  if (!ok) failed = true
}

for (const [name, body] of Object.entries(cases)) {
  const [diagram] = findDiagrams(`${F}mermaid\n${body}\n${F}`)
  const viewer = path.join(work, 'viewer.html')
  const image = path.join(work, 'image.html')
  fs.writeFileSync(viewer, viewerHtml(diagram, scripts('viewer.js')))
  fs.writeFileSync(image, imagePage(diagram, 'dark', scripts('image.js')))

  let before = hits.length
  const dom = await load(viewer)
  check(`${name}: viewer makes no request`, hits.length === before, hits.slice(before).join(' '))
  check(`${name}: viewer keeps no link`, !/<a[\s>]/.test(dom))
  const drawn = /<svg[\s>]/.test(dom)
  const source = /<pre id="code">/.test(dom)
  check(`${name}: viewer shows the drawing or the source`, drawn !== source)
  if (name === 'plain diagram') check(`${name}: viewer draws a valid diagram`, drawn)
  if (drawn) {
    // Fitted: scaled so the drawing's box lies inside the 800×600 headless window.
    const k = Number(/scale\(([\d.]+)\)/.exec(dom)?.[1] ?? 0)
    const box = /viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/.exec(dom)
    const [w, h] = box ? [Number(box[1]), Number(box[2])] : [0, 0]
    check(`${name}: viewer fits the drawing`, k > 0 && w > 0 && w * k <= 800 && h * k <= 600, `scale ${k}, box ${w}×${h}`)
  }

  before = hits.length
  const shot = await load(image)
  check(`${name}: image page makes no request`, hits.length === before, hits.slice(before).join(' '))
  check(`${name}: image page reports a size or an error`, /<title>(SIZE \d+x\d+|ERROR [^<]*)<\/title>/.test(shot))
  if (name === 'plain diagram') check(`${name}: image page draws a valid diagram`, /<title>SIZE \d+x\d+<\/title>/.test(shot))
}

// The control: without the pages' policy the same URL is fetched, so the checks above can see a request.
const control = path.join(work, 'control.html')
fs.writeFileSync(control, `<html><body><img src="${origin}/control.png"></body></html>`)
await load(control)
check('control page without the policy does make a request', hits.includes('/control.png'))

server.close()
fs.rmSync(work, { recursive: true, force: true })
process.exit(failed ? 1 : 0)
