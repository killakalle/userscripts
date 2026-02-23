// ==UserScript==
// @name         theCrag - Dashboard - Add areas to route tick items
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Adds a route's area to tick items in the stream
// @author       killakalle
// @match        https://www.thecrag.com/
// @match        https://www.thecrag.com/dashboard*
// @icon    	 https://www.google.com/s2/favicons?domain=thecrag.com
// @run-at 		 document-idle
// @grant        none
// @license      MIT
// @downloadURL  https://greasyfork.org/en/scripts/429706-thecrag-dashboard-add-areas-to-route-tick-items
// @updateURL    https://greasyfork.org/en/scripts/429706-thecrag-dashboard-add-areas-to-route-tick-items
// ==/UserScript==

function getLastArea (title) {
  if (!title) return ''
  const parts = title.split('›')
  const last = parts[parts.length - 1]
  return last.replace(/\u00a0/g, ' ').trim()
}

function processTickItem (tickItem) {
  if (tickItem.dataset.areaProcessed) return
  tickItem.dataset.areaProcessed = 'true'

  const routeLink = tickItem.querySelector('.route a')
  if (!routeLink) return

  const title = routeLink.getAttribute('title')
  const originalText = routeLink.textContent
  const stars = routeLink.querySelectorAll('.star').length
  const lastArea = getLastArea(title)

  routeLink.innerHTML = ''

  routeLink.append(document.createTextNode(lastArea + ' › '))

  for (let i = 0; i < stars; i++) {
    const star = document.createElement('span')
    star.className = 'star'
    star.textContent = '★'
    routeLink.appendChild(star)
  }

  routeLink.append(
    document.createTextNode(' ' + originalText.replace(/★/g, '').trim())
  )
}

function init () {
  document.querySelectorAll('.tick-item').forEach(processTickItem)

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return

        if (node.matches?.('.tick-item')) {
          processTickItem(node)
        }

        node.querySelectorAll?.('.tick-item').forEach(processTickItem)
      })
    })
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

init()
