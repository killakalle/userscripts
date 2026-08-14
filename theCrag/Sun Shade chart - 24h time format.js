// ==UserScript==
// @name          theCrag - Sun Shade chart - 24h time format
// @author        killakalle
// @namespace     https://github.com/killakalle/userscripts
// @version       0.1.0
// @description   Rewrites the Sun Shade Estimation modal's 12-hour "HH:MM AM/PM" times to 24-hour "HH:MM", dropping the AM/PM suffix entirely. The modal's slider output, summary list and detail table are all re-rendered by the site's own JS on every interaction, so this keeps a MutationObserver on the modal and re-applies the conversion after each change.
// @match         *://www.thecrag.com/*
// @icon          https://www.google.com/s2/favicons?domain=thecrag.com
// @grant         none
// @run-at        document-idle
// @license       MIT
// ==/UserScript==

;(function () {
  'use strict'

  const TIME_RE = /\b(\d{1,2}):(\d{2})\s*(AM|PM)\b/gi

  const to24h = (_match, h, m, ampm) => {
    let hour = parseInt(h, 10) % 12
    if (ampm.toUpperCase() === 'PM') hour += 12
    return `${String(hour).padStart(2, '0')}:${m}`
  }

  const rewriteText = (root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walker.nextNode())) {
      const next = node.nodeValue.replace(TIME_RE, to24h)
      if (next !== node.nodeValue) node.nodeValue = next
    }
  }

  const watchModal = (modal) => {
    if (modal.dataset.tc24hWatched) return
    modal.dataset.tc24hWatched = '1'
    rewriteText(modal)
    new MutationObserver(() => rewriteText(modal)).observe(modal, {
      childList: true,
      subtree: true,
      characterData: true,
    })
  }

  const existingModal = document.getElementById('sun-shade-chart_modal')
  if (existingModal) watchModal(existingModal)

  // The modal markup is injected into the page lazily the first time it's
  // opened, so keep watching until it shows up.
  new MutationObserver(() => {
    const modal = document.getElementById('sun-shade-chart_modal')
    if (modal) watchModal(modal)
  }).observe(document.body, { childList: true, subtree: true })
})()
