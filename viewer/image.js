// @ts-check
// Draws one diagram for a screenshot and reports its size in the title:
// `SIZE <width>x<height>`, or `ERROR <message>`. Loaded after mermaid.min.js.

;(async () => {
  /** @type {{ source: string, theme: string }} */
  const data = JSON.parse(/** @type {HTMLElement} */ (document.getElementById('diagram')).textContent ?? '{}')
  // @ts-ignore: mermaid is the global the bundled script defines.
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: data.theme })
  // @ts-ignore
  const { svg } = await mermaid.render('diagram-svg', data.source)
  document.body.innerHTML = svg
  const el = /** @type {SVGSVGElement} */ (document.querySelector('svg'))
  const box = el.viewBox.baseVal
  el.setAttribute('width', String(box.width))
  el.setAttribute('height', String(box.height))
  el.style.maxWidth = 'none'
  const b = el.getBoundingClientRect()
  document.title = `SIZE ${Math.ceil(b.width)}x${Math.ceil(b.height)}`
})().catch(error => {
  document.title = `ERROR ${error instanceof Error ? error.message : error}`
})
