// ==UserScript==
// @name         theCrag – Area/Crag page cleanup
// @namespace    https://thecrag.com/
// @version      1.1
// @description  Hide unneeded sections and auto-expand descriptions on crag/area overview pages
// @match        https://www.thecrag.com/es/escalar/*
// @match        https://www.thecrag.com/en/climbing/*
// @exclude      https://www.thecrag.com/es/escalar/*/route/*
// @exclude      https://www.thecrag.com/en/climbing/*/route/*
// @run-at       document-end
// @grant        none
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// ==/UserScript==

;(function () {
  'use strict'

  /* ==================== CONFIG ==================== */

  const CONFIG = {
    removePlanYourTrip: true,
    removeShareSection: true,
    removeSponsors: true,
    autoExpandDescription: true // <--- NEW
  }

  /* ==================== HELPERS ==================== */

  function $ (sel, root) {
    return (root || document).querySelector(sel)
  }

  function $all (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel))
  }

  /* ==================== PLANIFICA TU VIAJE SECTION ==================== */

  function removePlanYourTrip () {
    if (!CONFIG.removePlanYourTrip) return

    const nodeInfos = $all('.node-info')

    nodeInfos.forEach(div => {
      const h2 = div.querySelector('h2')
      if (!h2) return

      const text = h2.textContent.trim().toLowerCase()

      if (
        text.includes('planifica tu viaje') ||
        text.includes('plan your trip')
      ) {
        div.remove()
      }
    })
  }

  /* ==================== EXPAND DESCRIPTION ==================== */

  function autoExpandDescription () {
    if (!CONFIG.autoExpandDescription) return

    // Target the description container that has the 'expandable' class
    const expandableDiv = $('.node-info.description.expandable')

    if (expandableDiv) {
      // 1. Remove the 'expandable' class to show full height
      expandableDiv.classList.remove('expandable')

      // 2. Remove the "Show more" (Mostrar más) button container
      const moreBtn = expandableDiv.querySelector('.comment-more')
      if (moreBtn) {
        moreBtn.remove()
      }
    }
  }

  /* ==================== SHARE / SOCIAL SECTION ==================== */

  function removeShareSection () {
    if (!CONFIG.removeShareSection) return

    const shareAnchor = $('#share')
    if (shareAnchor) {
      const heading = shareAnchor.closest('h1, h2, h3, h4, h5, h6')
      if (heading) {
        let next = heading.nextElementSibling
        while (
          next &&
          (next.classList.contains('social-share') || next.tagName === 'DIV')
        ) {
          if (
            next.querySelector('.btn-social') ||
            next.classList.contains('social-share')
          ) {
            const toRemove = next
            next = next.nextElementSibling
            toRemove.remove()
          } else {
            break
          }
        }
        heading.remove()
      }
    }

    const aside = $('.regions__aside')
    if (aside) {
      $all('.social-share', aside).forEach(el => el.remove())
    }

    $all('h4, h3').forEach(h => {
      if (h.textContent.trim().toLowerCase() === 'compartir contenido') {
        h.remove()
      }
    })
  }

  /* ==================== SPONSORS ==================== */

  function removeSponsors () {
    if (!CONFIG.removeSponsors) return

    const aside = $('.regions__aside')
    if (!aside) return

    $all('.sponsor-slot, .sponsor-slot--side-panel', aside).forEach(el =>
      el.remove()
    )
  }

  /* ==================== RUN ==================== */

  function init () {
    removePlanYourTrip()
    autoExpandDescription() // <--- NEW
    removeShareSection()
    removeSponsors()
  }

  init()
  setTimeout(init, 1000)
})()
