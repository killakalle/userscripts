// ==UserScript==
// @name         theCrag - Highlight Clasico Tags
// @namespace    http://tampermonkey.net/
// @version      0.1
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

      span.style.padding = '2px 8px'
      span.style.borderRadius = '12px'
      span.style.fontWeight = 'bold'
      span.style.color = '#fff'
      span.style.display = 'inline-block'
      span.style.boxShadow = '0 0 6px rgba(0, 150, 0, 0.6)'

      if (text === 'Clásico') {
        span.style.backgroundColor = '#2ecc71' // fresh green
      }

      if (text === 'Megaclásica') {
        span.style.backgroundColor = '#16a085' // deeper premium green
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
