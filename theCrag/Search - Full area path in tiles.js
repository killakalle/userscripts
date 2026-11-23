// ==UserScript==
// @name         theCrag - Search - Full area path in tiles
// @namespace    https://github.com/killakalle/userscripts
// @version      0.1.0
// @description  Makes the breadcrumb in area tiles show the nearest ancestors (e.g. "ES › Comunidad Valenciana › Valencia › Chiva") instead of being clipped after the province
// @author       killakalle
// @match        https://www.thecrag.com/search*
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @grant        none
// @license      MIT
// @run-at       document-idle
// ==/UserScript==

const SEP = ' › '
const ELLIPSIS = '…'

// theCrag renders the complete trail but clips it to a single line (14px high),
// so deep areas lose their most useful part: the direct parent.
const style = document.createElement('style')
style.textContent = `
  .node-summary__crumb.fullcrumb { white-space: nowrap; text-overflow: ellipsis; }
  .node-summary__crumb.fullcrumb b { font-weight: 700; }
`
document.head.appendChild(style)

function getCrumbs (el) {
  if (!el.dataset.crumbs) {
    const crumbs = [...el.querySelectorAll('.crumbtrail-partial__crumb')]
      .map(c => c.textContent.replace(/ /g, ' ').trim())
      .filter(Boolean)
    // Continent is redundant when it is followed by a 2-char country code
    if (crumbs.length > 2 && /^[A-Z]{2}$/.test(crumbs[1])) crumbs.shift()
    el.dataset.crumbs = JSON.stringify(crumbs)
  }
  return JSON.parse(el.dataset.crumbs)
}

function render (el, parts) {
  el.textContent = ''
  parts.forEach((text, i) => {
    if (i) el.append(SEP)
    if (i === parts.length - 1) {
      const b = document.createElement('b')
      b.textContent = text // direct parent: emphasised
      el.append(b)
    } else {
      el.append(text)
    }
  })
}

const fits = el => el.scrollWidth <= el.clientWidth

function processCrumb (el) {
  const crumbs = getCrumbs(el)
  if (!crumbs.length) return
  el.classList.add('fullcrumb')
  el.title = crumbs.join(SEP)

  // 1) full trail, 2) keep country + "…" + the last n crumbs, n shrinking to 1
  render(el, crumbs)
  if (fits(el) || crumbs.length < 3) return
  for (let n = crumbs.length - 2; n >= 1; n--) {
    render(el, [crumbs[0], ELLIPSIS, ...crumbs.slice(-n)])
    if (fits(el)) return
  }
}

function processAll (root = document) {
  root.querySelectorAll?.('.node-summary__crumb').forEach(processCrumb)
}

processAll()

new MutationObserver(mutations => {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (node.nodeType !== 1) continue
      if (node.matches?.('.node-summary__crumb')) processCrumb(node)
      else processAll(node)
    }
  }
}).observe(document.body, { childList: true, subtree: true })

let t
window.addEventListener('resize', () => {
  clearTimeout(t)
  t = setTimeout(processAll, 150)
})
