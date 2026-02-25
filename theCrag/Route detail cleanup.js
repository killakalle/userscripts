// ==UserScript==
// @name         theCrag – Route detail page cleanup
// @namespace    https://thecrag.com/
// @version      1.5.1
// @description  Hide unneeded sections on route detail pages
// @match        https://www.thecrag.com/es/escalar/*/route/*
// @match        https://www.thecrag.com/en/climbing/*/route/*
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @run-at       document-end
// @grant        none
// @license      MIT
// @downloadURL  https://update.greasyfork.org/scripts/566463/theCrag%20%E2%80%93%20Route%20detail%20page%20cleanup.user.js
// @updateURL    https://update.greasyfork.org/scripts/566463/theCrag%20%E2%80%93%20Route%20detail%20page%20cleanup.meta.js
// ==/UserScript==

;(function () {
  'use strict'

  /* ==================== CONFIG ==================== */

  const CONFIG = {
    removeBetaSection: true,
    hideEmptyRouteHistory: true,
    removeWarningsSection: true,
    hideLocation: true,
    handleGradesAndMoveGraidToHeader: true,
    removeShareSection: true,
    moveRightColumnToAside: true,
    removeSeasonalitySection: true,
    removeChartSummarySentences: true,
    removeTicktypesSection: true,
    removeKeywordCloud: true // <--- NEW
  }

  /* ==================== HELPERS ==================== */

  function $ (sel, root) {
    return (root || document).querySelector(sel)
  }

  function $all (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel))
  }

  /* ==================== BETA (Ethics) SECTION ==================== */

  function removeBetaSection () {
    if (!CONFIG.removeBetaSection) return

    const blocks = document.querySelectorAll('.description.node-beta')

    blocks.forEach(block => {
      const h = block.querySelector('h3 .offset > a[id]')
      if (!h) return

      const id = h.id.trim().toLowerCase()

      // keep only description
      if (id === 'descripción' || id === 'descripcion') {
        // remove any tags inside description
        block.querySelectorAll('a[rel="tag"]').forEach(a => a.remove())

        // also remove empty wrappers that held the tags
        block.querySelectorAll('div:empty').forEach(d => d.remove())
        return
      }

      // remove ethics, tags section, or any other node-beta blocks
      block.remove()
    })
  }

  /* ==================== ROUTE HISTORY ==================== */

  function hideEmptyRouteHistory () {
    if (!CONFIG.hideEmptyRouteHistory) return

    const anchor = $('#history')
    if (!anchor) return
    const heading = anchor.closest('h3')
    if (!heading) return

    const next = heading.nextElementSibling
    if (!next) {
      heading.remove()
      return
    }

    const text = (next.textContent || '').trim()
    const isEmptyHistory =
      next.tagName === 'P' &&
      (text.includes('No hay un histórico conocido de la vía') ||
        text.includes('No route history known'))

    if (isEmptyHistory) {
      next.remove()
      heading.remove()
    }
  }

  /* ==================== ADVERTENCIAS SECTION ==================== */

  function removeWarningsSection () {
    if (!CONFIG.removeWarningsSection) return

    const anchor = $('#warnings')
    if (!anchor) return
    const heading = anchor.closest('h3')
    if (!heading) return

    let el = heading.nextElementSibling
    while (el && !/^H[1-6]$/.test(el.tagName)) {
      const nxt = el.nextElementSibling
      el.remove()
      el = nxt
    }
    heading.remove()
  }

  /* ==================== UBICACIÓN SECTION ==================== */

  function hideLocationSection () {
    if (!CONFIG.hideLocation) return

    const anchor = $('#location')
    if (!anchor) return
    const heading = anchor.closest('h3')
    if (!heading) return

    const next = heading.nextElementSibling
    if (next && next.matches('dl.areaInfo')) next.remove()
    heading.remove()
  }

  /* ==================== GRADES / grAId HANDLING ==================== */

  function getGbClass (grade) {
    const map = {
      3: 'gb1',
      4: 'gb2',
      5: 'gb2',
      '6a': 'gb2',
      '6a+': 'gb3',
      '6b': 'gb3',
      '6b+': 'gb3',
      '6c': 'gb3',
      '6c+': 'gb3',
      '7a': 'gb3',
      '7a+': 'gb3',
      '7b': 'gb4',
      '7b+': 'gb4',
      '7c': 'gb4',
      '7c+': 'gb4',
      '8a': 'gb4',
      '8a+': 'gb4',
      '8b': 'gb4',
      '8b+': 'gb4',
      '8c': 'gb5',
      '8c+': 'gb5',
      '9a': 'gb5'
    }

    return map[grade.toLowerCase()] || 'gb3'
  }

  function insertGraidStat (graidValue) {
    if (!graidValue) return

    const statsUl = document.querySelector('.headline__guts ul.stats')
    if (!statsUl) return

    // Extract first grade (e.g. 6c from "6c [6b+ - 6c]")
    const match = graidValue.match(/^([0-9][abc]?\+?)/i)
    if (!match) return

    const firstGrade = match[1]

    const li = document.createElement('li')

    // Create colored grade span
    const gradeSpan = document.createElement('span')
    gradeSpan.textContent = firstGrade
    gradeSpan.className = getGbClass(firstGrade)

    li.innerHTML = `<strong>grAId:</strong> `
    li.appendChild(gradeSpan)

    // Append remaining text (e.g. " [6b+ - 6c]")
    const remainder = graidValue.slice(firstGrade.length)
    if (remainder.trim()) {
      li.appendChild(document.createTextNode(remainder))
    }

    statsUl.appendChild(li)
  }

  function handleGradesSection () {
    if (!CONFIG.handleGradesAndMoveGraidToHeader) return

    const anchor = $('#grades')
    if (!anchor) return
    const heading = anchor.closest('h3')
    if (!heading) return

    let table = heading.nextElementSibling
    let graidValue = null

    if (table && table.matches('table.compacttable')) {
      const rows = Array.from(table.querySelectorAll('tr'))
      for (const row of rows) {
        const txt = (row.textContent || '').toLowerCase()
        const hasGraidText = txt.includes('graid')
        const hasGraidLink = !!row.querySelector('a[href*="/articulo/graid"]')
        if (hasGraidText || hasGraidLink) {
          const firstCell = row.querySelector('td')
          if (firstCell) graidValue = firstCell.textContent.trim()
          break
        }
      }
    }

    if (table && table.matches('table.compacttable')) {
      table.remove()
    }

    let el = heading.nextElementSibling
    while (el && !/^H[1-6]$/.test(el.tagName)) {
      const nxt = el.nextElementSibling
      el.remove()
      el = nxt
    }

    heading.remove()

    if (graidValue) {
      insertGraidStat(graidValue)
    }
  }

  /* ==================== SHARE / SOCIAL SECTION ==================== */

  function removeShareSection () {
    if (!CONFIG.removeShareSection) return

    const asideInner = $('.regions__aside .regions__inner')
    if (!asideInner) return

    $all(
      '.sponsor-slot--side-panel, .sponsor-slot--advocacy',
      asideInner
    ).forEach(el => el.remove())

    const shareAnchor = asideInner.querySelector('#share')
    if (shareAnchor) {
      const shareHeading = shareAnchor.closest('h4')
      if (shareHeading) shareHeading.remove()
    }

    $all('.social-share', asideInner).forEach(el => el.remove())

    $all('script', asideInner).forEach(script => {
      const txt = script.textContent || ''
      if (txt.includes('share_content') || txt.includes('social_share_')) {
        script.remove()
      }
    })
  }

  /* ==================== MOVE RIGHT COLUMN TO ASIDE ==================== */

  function moveRightColumnToAside () {
    if (!CONFIG.moveRightColumnToAside) return

    const rightCol = $('.row-fluid .span4')
    const asideInner = $('.regions__aside .regions__inner')
    if (!rightCol || !asideInner) return

    const photosAnchor = asideInner.querySelector('#photos')
    const photosBox = photosAnchor ? photosAnchor.closest('.box') : null

    if (photosBox) {
      asideInner.insertBefore(rightCol, photosBox)
    } else {
      asideInner.appendChild(rightCol)
    }

    if (!document.getElementById('tc-rightcol-style')) {
      const style = document.createElement('style')
      style.id = 'tc-rightcol-style'
      style.textContent = `
        .regions__aside .span4 {
          width: 100% !important;
          max-width: 100% !important;
          float: none !important;
          margin: 0 0 16px 0 !important;
        }
        .regions__aside .span4 .barchart-h table,
        .regions__aside .span4 .barchart-v table {
          width: 100% !important;
          max-width: 100% !important;
        }
      `
      document.head.appendChild(style)
    }
  }

  /* ==================== SEASONALITY SECTION ==================== */

  function removeSeasonalitySection () {
    if (!CONFIG.removeSeasonalitySection) return

    const anchor = $('#seasonality')
    if (!anchor) return
    const heading = anchor.closest('h3')
    if (!heading) return

    let el = heading.nextElementSibling
    while (el && !/^H[1-6]$/.test(el.tagName)) {
      const nxt = el.nextElementSibling
      el.remove()
      el = nxt
    }
    heading.remove()
  }

  /* ==================== CHART SUMMARY SENTENCES ==================== */

  function removeChartSummarySentences () {
    if (!CONFIG.removeChartSummarySentences) return

    $all('.span4 p').forEach(p => {
      const t = p.textContent.trim()
      if (/calidad general/i.test(t) || /basado en valoraciones/i.test(t)) {
        p.remove()
      }
    })
  }

  /* ==================== TICK TYPES SECTION ==================== */

  function removeTicktypesSection () {
    if (!CONFIG.removeTicktypesSection) return

    const anchor = $('#ticktypes')
    if (!anchor) return
    const heading = anchor.closest('h3')
    if (!heading) return

    let el = heading.nextElementSibling
    while (el && !/^H[1-6]$/.test(el.tagName)) {
      const nxt = el.nextElementSibling
      el.remove()
      el = nxt
    }
    heading.remove()
  }

  /* ==================== KEYWORD CLOUD SECTION ==================== */

  function removeKeywordCloudSection () {
    if (!CONFIG.removeKeywordCloud) return

    const anchor = $('#tagcloud')
    if (!anchor) return

    const heading = anchor.closest('h3')
    if (!heading) return

    // Remove everything after the heading until the next heading
    let el = heading.nextElementSibling
    while (el && !/^H[1-6]$/.test(el.tagName)) {
      const nxt = el.nextElementSibling
      el.remove()
      el = nxt
    }

    // Finally remove the heading itself
    heading.remove()
  }

  /* ==================== RUN ==================== */

  function init () {
    removeBetaSection()
    hideEmptyRouteHistory()
    removeWarningsSection()
    hideLocationSection()
    handleGradesSection()
    removeShareSection()
    moveRightColumnToAside()
    removeSeasonalitySection()
    removeChartSummarySentences()
    removeTicktypesSection()
    removeKeywordCloudSection() // <--- NEW
  }

  init()
  setTimeout(init, 1000) // in case parts load slightly later
})()
