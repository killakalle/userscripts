// ==UserScript==
// @name         theCrag - Dashboard - Add areas to route tick items
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Adds a route's area to tick items in the stream
// @author       killakalle
// @match        https://www.thecrag.com/
// @match        https://www.thecrag.com/dashboard*
// @require      https://greasyfork.org/scripts/31940-waitforkeyelements/code/waitForKeyElements.js?version=209282
// @grant        none
// @license      MIT
// @downloadURL  https://greasyfork.org/en/scripts/429706-thecrag-dashboard-add-areas-to-route-tick-items
// @updateURL    https://greasyfork.org/en/scripts/429706-thecrag-dashboard-add-areas-to-route-tick-items
// ==/UserScript==

waitForKeyElements('.tick-item', addAreaToRoute)

function getLastArea (title) {
  if (!title) return ''
  const parts = title.split('›')
  const last = parts[parts.length - 1]
  return last.replace(/\u00a0/g, ' ').trim()
}

function addAreaToRoute (jNode) {
  let route = jNode.find('.route')
  let routeLink = route.find('a')

  if (!routeLink.length) return

  const routeLinkTitle = routeLink.attr('title')
  const routeLinkText = routeLink.text()
  const lastArea = getLastArea(routeLinkTitle)

  let stars = routeLink.find('.star').length

  routeLink.empty()

  routeLink.append(document.createTextNode(lastArea + ' › '))

  for (let i = 0; i < stars; i++) {
    let starSpan = document.createElement('span')
    starSpan.classList.add('star')
    starSpan.textContent = '★'
    routeLink.append(starSpan)
  }

  routeLink.append(
    document.createTextNode(' ' + routeLinkText.replace(/★/g, '').trim())
  )
}
