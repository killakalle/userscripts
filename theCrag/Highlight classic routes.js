// ==UserScript==
// @name         theCrag - Highlight Clasico Tags
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Highlights routes tagged as Clásico or Megaclásica
// @author       killakalle
// @match        https://www.thecrag.com/*
// @icon    	 https://www.google.com/s2/favicons?domain=thecrag.com
// @grant        none
// @license      MIT
// @downloadURL  https://greasyfork.org/en/scripts/567285-thecrag-highlight-clasico-tags
// @updateURL    https://greasyfork.org/en/scripts/567285-thecrag-highlight-clasico-tags
// ==/UserScript==

function highlightTags (node) {
  const spans = node.querySelectorAll('.iblock span')

  spans.forEach(span => {
    const text = span.textContent.trim()

    if (text === 'Clásico' || text === 'Megaclásica') {
      if (span.dataset.clasicoProcessed) return
      span.dataset.clasicoProcessed = 'true'

      span.style.padding = '1px 6px'
      span.style.borderRadius = '8px'
      span.style.fontWeight = '600'
      span.style.fontSize = '0.85em'
      span.style.display = 'inline-block'
      span.style.lineHeight = '1.2'
      span.style.color = '#155724'

      if (text === 'Clásico') {
        span.style.backgroundColor = '#d4edda' // soft green
      }

      if (text === 'Megaclásica') {
        span.style.backgroundColor = '#c3e6cb' // slightly stronger soft green
      }
    }
  })
}

function init () {
  document.querySelectorAll('.tick-item').forEach(highlightTags)

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return
        highlightTags(node)
        node.querySelectorAll?.('.tick-item').forEach(highlightTags)
      })
    })
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

window.addEventListener('load', init)
