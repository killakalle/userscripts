// ==UserScript==
// @name         theCrag – Area - Cleanup
// @namespace    https://github.com/killakalle/userscripts
// @version      1.2.11
// @description  Hide unneeded sections, internal tags, auto-expand descriptions on crag/area overview pages, and definitively fix mobile overflow
// @author       killakalle
// @match        https://www.thecrag.com/es/escalar/*
// @match        https://www.thecrag.com/en/climbing/*
// @exclude      https://www.thecrag.com/es/escalar/*/route/*
// @exclude      https://www.thecrag.com/en/climbing/*/route/*
// @run-at       document-end
// @grant        none
// @license      MIT
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @downloadURL  https://greasyfork.org/en/scripts/568094-thecrag-area-crag-page-cleanup
// @updateURL    https://greasyfork.org/en/scripts/568094-thecrag-area-crag-page-cleanup
// ==/UserScript==

;(function () {
  'use strict'

  /* ==================== CONFIG ==================== */

  const CONFIG = {
    removePlanYourTrip: true,
    removeShareSection: true,
    removeSponsors: true,
    autoExpandDescription: true,
    hideInternalTags: true,
    hideUntickedIcons: true,
    hideSportTag: true,
    addHtmlGuideLink: true,
    fixMobileOverflow: true
  }

  /* ==================== HELPERS ==================== */

  function $ (sel, root) {
    return (root || document).querySelector(sel)
  }

  function $all (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel))
  }

  /* ==================== FIX MOBILE OVERFLOW ==================== */

  function fixMobileOverflow () {
    if (!CONFIG.fixMobileOverflow) return

    if ($('#custom-overflow-fix')) return

    const style = document.createElement('style')
    style.id = 'custom-overflow-fix'
    style.textContent = `
      /* 1. Prevent root level horizontal scrolling */
      html, body {
        max-width: 100vw !important;
        overflow-x: hidden !important;
      }

      /* 2. Constrain the route containers */
      .route, .topo-row {
        max-width: 100vw !important;
        box-sizing: border-box !important;
      }

      /* 3. Convert margin to padding on the description container so
            it doesn't push its 100% width out of bounds */
      .route .markdown.desc {
        margin-left: 0 !important;
        margin-right: 0 !important;
        padding-left: 20px !important; /* Keeps the visual indent */
        padding-right: 8px !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      /* 4. Aggressive wrap on the text elements inside */
      .route .markdown.desc p,
      .route .markdown.desc div {
        width: 100% !important;
        max-width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        box-sizing: border-box !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        word-break: break-word !important;
      }

      /* 5. Keep the equip/bolter info constrained */
      .route .text-right,
      .route [style*="float: right"],
      .route [style*="text-align: right"] {
        float: none !important;
        display: block !important;
        text-align: right !important;
        width: 100% !important;
        padding-right: 15px !important;
        box-sizing: border-box !important;
      }
    `
    document.head.appendChild(style)
  }

  /* ==================== ADD HTML GUIDE LINK ==================== */

  function addHtmlGuideLink () {
    if (!CONFIG.addHtmlGuideLink) return

    if ($('.custom-html-guide-link')) return

    const elements = $all('.info.iblock')
    elements.forEach(el => {
      const a = document.createElement('a')
      a.textContent = 'HTML Guide'
      a.href = window.location.href.replace(/\/$/, '') + '/guide'
      a.className = 'custom-html-guide-link'
      a.style.marginLeft = '10px'
      el.appendChild(a)
    })
  }

  /* ==================== HIDE INTERNAL ROUTE TAGS ==================== */

  function hideInternalTags () {
    if (!CONFIG.hideInternalTags) return

    const TAGS_TO_HIDE = [
      '#double_anchors',
      '#bolt_diameter_10mm',
      '#bolt_diameter_12mm',
      '#bolt_type_expansion',
      '#bolt_type_glue_in',
      '#bolt_material_bi_chrome',
      '#bolt_material_inox'
    ]

    $all('a.tags').forEach(tag => {
      const text = tag.textContent.trim()
      if (TAGS_TO_HIDE.includes(text)) {
        tag.remove()
      }
    })
  }

  /* ==================== HIDE SPECIFIC SPORT TAGS ==================== */

  function hideSportTags () {
    const sportTags = $all('span.tags.sport')

    sportTags.forEach(tag => {
      const text = tag.textContent.trim()
      if (text === 'Deportiva' || text === 'Sport') {
        tag.remove()
      }
    })
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

    const expandableDiv = $('.node-info.description.expandable')

    if (expandableDiv) {
      expandableDiv.classList.remove('expandable')

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

  /* ==================== HIDE UNTICKED ICONS ==================== */

  function hideUntickedIcons () {
    const untickedIcons = $all('.tick .tick_unticked')
    untickedIcons.forEach(icon => {
      icon.closest('.tick').innerHTML = ''
    })
  }

  /* ==================== RUN ==================== */

  function init () {
    fixMobileOverflow()
    hideInternalTags()
    hideSportTags()
    removePlanYourTrip()
    autoExpandDescription()
    removeShareSection()
    removeSponsors()
    hideUntickedIcons()
    addHtmlGuideLink()
  }

  init()
  // Re-run after 1s for elements loaded via AJAX
  setTimeout(init, 1000)
})()