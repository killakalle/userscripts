// ==UserScript==
// @name          theCrag - Dashboard - Cleanup
// @author        killakalle
// @namespace     https://github.com/killakalle/userscripts
// @version       1.2.2
// @description   Removes unneccessary stuff from the dashboard, cleans up tick items, and highlights classic routes.
// @match         https://www.thecrag.com/
// @match         https://www.thecrag.com/dashboard
// @match         https://www.thecrag.com/es/escalar/*
// @match         https://www.thecrag.com/climbing/*
// @exclude       https://www.thecrag.com/es/escalar/*route*
// @license       MIT
// @icon          https://www.google.com/s2/favicons?domain=thecrag.com
// @downloadURL   https://update.greasyfork.org/scripts/569070/theCrag%20-%20Dashboard%20Cleanup.user.js
// @updateURL     https://update.greasyfork.org/scripts/569070/theCrag%20-%20Dashboard%20Cleanup.meta.js
// ==/UserScript==

;(function () {
  'use strict'

  /* ==================== CONFIG ==================== */
  const CONFIG = {
    hideStaticElements: true,
    cleanTickItems: true,
    highlightClassicTags: true
  }

  /* ==================== 1. STATIC UI ELEMENTS ==================== */
  const hideStatic = () => {
    if (!CONFIG.hideStaticElements) return

    const staticSelectors = [
      '.regions__prominent',
      //'.btn-success',             // side effect: removes Save button from topo editing pages
      '.sponsor-media-container',
      "a[href='#sponsors']"
    ]
    staticSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => (el.style.display = 'none'))
    })

    // Target the specific grade-convert header text only
    const gc = document.querySelector('.grade-convert')
    if (gc) {
      if (gc.querySelector('h3')) gc.querySelector('h3').style.display = 'none'
      if (gc.querySelector('p')) gc.querySelector('p').style.display = 'none'
    }
  }

  /* ==================== 2. TICK ITEM CLEANUP ==================== */
  const cleanTickItems = () => {
    if (!CONFIG.cleanTickItems) return

    const tickItems = document.querySelectorAll('.tick-item')

    tickItems.forEach(item => {
      // Hide Sport/Deportiva tags
      item.querySelectorAll('span[class*="sport"]').forEach(tag => {
        tag.style.setProperty('display', 'none', 'important')
      })

      // Hide Bolts/Chapas
      item.querySelectorAll('span.bolts').forEach(bolt => {
        bolt.style.setProperty('display', 'none', 'important')
      })

      // Ensure main paragraph visibility
      const mainP = item.querySelector('p')
      if (mainP && mainP.style.display === 'none') {
        mainP.style.display = 'block'
      }
    })

    // Ensure the event tagline isn't accidentally hidden
    document.querySelectorAll('.event-tagline').forEach(tagline => {
      if (tagline.style.display === 'none') {
        tagline.style.display = 'block'
      }
    })
  }

  /* ==================== 3. TAG HIGHLIGHTING ==================== */
  const highlightTags = node => {
    if (!CONFIG.highlightClassicTags) return

    // If the node itself is a tick-item, or contains tick-items
    const targets = node.classList?.contains('tick-item')
      ? [node]
      : node.querySelectorAll('.tick-item')

    targets.forEach(item => {
      const spans = item.querySelectorAll('.iblock span')
      spans.forEach(span => {
        const text = span.textContent.trim()

        if (text === 'Clásico' || text === 'Megaclásica') {
          if (span.dataset.clasicoProcessed) return
          span.dataset.clasicoProcessed = 'true'

          // Apply styling
          Object.assign(span.style, {
            padding: '1px 6px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '0.85em',
            display: 'inline-block',
            lineHeight: '1.2',
            color: '#155724',
            backgroundColor: text === 'Clásico' ? '#d4edda' : '#c3e6cb'
          })
        }
      })
    })
  }

  /* ==================== RUN & OBSERVE ==================== */

  const runAll = (root = document) => {
    hideStatic()
    cleanTickItems()
    highlightTags(root)
  }

  // Initial run
  runAll()

  // Single observer for all dynamic changes
  const observer = new MutationObserver(mutations => {
    let shouldRunCleaners = false

    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          shouldRunCleaners = true
          highlightTags(node) // Target new nodes specifically for speed
        }
      })
    })

    if (shouldRunCleaners) {
      hideStatic()
      cleanTickItems()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
})()
