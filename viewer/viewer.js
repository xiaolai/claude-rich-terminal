// @ts-check
// The browser view's behaviour: fit, zoom, pan and source. Loaded by the page
// `viewerHtml` writes, after mermaid.min.js; reads its diagram from #diagram.

/** @type {{ source: string }} */
const data = JSON.parse(/** @type {HTMLElement} */ (document.getElementById('diagram')).textContent ?? '{}')
const stage = /** @type {HTMLElement} */ (document.getElementById('stage'))
const code = /** @type {HTMLElement} */ (document.getElementById('code'))
const toggle = /** @type {HTMLButtonElement} */ (document.getElementById('src'))
code.textContent = data.source

let k = 1
let x = 0
let y = 0
/** @type {SVGSVGElement | undefined} */
let svg
/** @type {{ id: number, dx: number, dy: number } | undefined} */
let drag

const apply = () => {
  if (svg) svg.style.transform = `translate(${x}px,${y}px) scale(${k})`
}

const fitView = () => {
  // A hidden stage measures 0×0; fitting then would scale the drawing to nothing.
  if (!svg || stage.hidden || stage.clientWidth === 0 || stage.clientHeight === 0) return
  const box = svg.viewBox.baseVal
  const w = box.width || svg.getBBox().width
  const h = box.height || svg.getBBox().height
  if (w === 0 || h === 0) return
  k = Math.min(stage.clientWidth / w, stage.clientHeight / h, 4) * 0.95
  x = (stage.clientWidth - w * k) / 2
  y = (stage.clientHeight - h * k) / 2
  apply()
}

/** @param {number} f @param {number} cx @param {number} cy */
const zoom = (f, cx, cy) => {
  x = cx - (cx - x) * f
  y = cy - (cy - y) * f
  k *= f
  apply()
}

/** Strict mode still leaves https links; a diagram's source must not navigate. */
const unlink = () => {
  for (const a of document.querySelectorAll('svg a')) a.replaceWith(...a.childNodes)
}

const showSource = (/** @type {boolean} */ on) => {
  code.hidden = !on
  stage.hidden = on
  if (!on) fitView()
}

;(async () => {
  try {
    const dark = matchMedia('(prefers-color-scheme: dark)').matches
    // @ts-ignore: mermaid is the global the bundled script defines.
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: dark ? 'dark' : 'default' })
    // @ts-ignore
    const out = await mermaid.render('diagram-svg', data.source)
    // Mermaid sanitizes its SVG in strict mode, and the page's CSP blocks inline handlers.
    stage.innerHTML = out.svg
    svg = /** @type {SVGSVGElement} */ (stage.querySelector('svg'))
    unlink()
    const box = svg.viewBox.baseVal
    svg.setAttribute('width', String(box.width))
    svg.setAttribute('height', String(box.height))
    svg.style.maxWidth = 'none'
    fitView()
  } catch (error) {
    // A failed render can leave Mermaid's scratch drawing in the page; remove it.
    for (const node of document.querySelectorAll('[id^="ddiagram-svg"], #diagram-svg')) node.remove()
    unlink()
    code.textContent = `Mermaid could not draw this diagram:\n${error instanceof Error ? error.message : error}\n\n${data.source}`
    showSource(true)
    toggle.disabled = true
  }
})()

const button = (/** @type {string} */ id) => /** @type {HTMLButtonElement} */ (document.getElementById(id))
button('fit').onclick = fitView
button('in').onclick = () => zoom(1.25, stage.clientWidth / 2, stage.clientHeight / 2)
button('out').onclick = () => zoom(0.8, stage.clientWidth / 2, stage.clientHeight / 2)
toggle.onclick = () => showSource(code.hidden)

stage.addEventListener(
  'wheel',
  e => {
    e.preventDefault()
    const rect = stage.getBoundingClientRect()
    zoom(e.deltaY < 0 ? 1.1 : 0.9, e.clientX - rect.left, e.clientY - rect.top)
  },
  { passive: false },
)
stage.addEventListener('pointerdown', e => {
  drag = { id: e.pointerId, dx: e.clientX - x, dy: e.clientY - y }
  stage.setPointerCapture(e.pointerId)
})
stage.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return
  x = e.clientX - drag.dx
  y = e.clientY - drag.dy
  apply()
})
for (const end of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  stage.addEventListener(end, () => {
    drag = undefined
  })
}
addEventListener('resize', fitView)
