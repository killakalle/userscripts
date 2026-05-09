// ==UserScript==
// @name         theCrag – Route - Cleanup
// @namespace    https://github.com/killakalle/userscripts
// @version      1.7.0
// @description  Hide unneeded sections on route detail pages
// @author       killakalle
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
    addRouteNavigationArrows: true,
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
    removeKeywordCloud: true
  }

  /* ==================== HELPERS ==================== */

  function $ (sel, root) {
    return (root || document).querySelector(sel)
  }

  function $all (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel))
  }

  function removeAggregateRatingDiv () {
    const statsUl = document.querySelector('.headline__guts ul.stats')
    if (!statsUl) return

    const div = statsUl.querySelector('div[itemprop="aggregateRating"]')
    if (div) div.remove()
  }

  /* ==================== REMOVE CONTEXTO DE GRADO ==================== */

  function removeContextoDeGrado () {
    const statsUl = document.querySelector('.headline__guts ul.stats')
    if (!statsUl) return

    const items = Array.from(statsUl.querySelectorAll('li'))

    items.forEach(li => {
      const strong = li.querySelector('strong')
      if (!strong) return

      const label = strong.textContent.trim().toLowerCase()

      if (
        label.includes('contexto de grado') ||
        label.includes('grade context')
      ) {
        li.remove()
      }
    })
  }

  /* ==================== ROUTE PREV/NEXT ARROWS ==================== */

  function addRouteNavigationArrows () {
    if (!CONFIG.addRouteNavigationArrows) return

    // prevent duplicates
    if (document.querySelector('.tc-route-nav-li')) return

    const prevLink = document.querySelector("a[rel='prev']")
    const nextLink = document.querySelector("a[rel='next']")
    if (!prevLink && !nextLink) return

    const statsUl = document.querySelector('.headline__guts ul.stats')
    if (!statsUl) return

    const li = document.createElement('li')
    li.className = 'tc-route-nav-li'

    function createArrow (href, symbol, title, className) {
      const a = document.createElement('a')
      a.href = href
      a.textContent = symbol
      a.title = title
      a.className = className // Added class for CSS targeting

      // Inline styles for base desktop look
      Object.assign(a.style, {
        fontWeight: 'bold',
        fontSize: '20px', // Increased base size
        textDecoration: 'none',
        padding: '10px', // Added padding to increase touch target area
        opacity: '0.75',
        color: 'inherit',
        transition: 'opacity 0.15s ease',
        display: 'inline-block'
      })

      a.addEventListener('mouseenter', () => {
        a.style.opacity = '1'
      })
      a.addEventListener('mouseleave', () => {
        a.style.opacity = '0.75'
      })

      return a
    }

    if (prevLink) {
      li.appendChild(
        createArrow(prevLink.href, '←', 'Previous route', 'tc-nav-prev')
      )
    }

    if (nextLink) {
      li.appendChild(
        createArrow(nextLink.href, '→', 'Next route', 'tc-nav-next')
      )
    }

    statsUl.insertBefore(li, statsUl.firstElementChild)
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
      '5a': 'gb2',
      '5a+': 'gb2',
      '5b': 'gb2',
      '5b+': 'gb2',
      '5c': 'gb2',
      '5c+': 'gb2',
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

    // 1. Get the "Official" grade from the header
    // The snippet shows it's inside .heading__t .grade
    const officialGradeEl = document.querySelector('.heading__t .grade')
    const officialGrade = officialGradeEl
      ? officialGradeEl.textContent.trim()
      : null

    // 2. Extract first AI grade (e.g. 6c from "6c [6b+ - 6c]")
    const match = graidValue.match(/^([0-9][abc]?\+?)/i)
    if (!match) return
    const aiGrade = match[1]

    // 3. Comparison Logic
    const getGradeRank = g => {
      if (!g) return -1
      const ranks = [
        '1',
        '2',
        '3',
        '4',
        '5',
        '5a',
        '5a+',
        '5b',
        '5b+',
        '5c',
        '5c+',
        '6a',
        '6a+',
        '6b',
        '6b+',
        '6c',
        '6c+',
        '7a',
        '7a+',
        '7b',
        '7b+',
        '7c',
        '7c+',
        '8a',
        '8a+',
        '8b',
        '8b+',
        '8c',
        '8c+',
        '9a'
      ]
      return ranks.indexOf(g.toLowerCase())
    }

    let tagHtml = ''
    const aiRank = getGradeRank(aiGrade)
    const offRank = getGradeRank(officialGrade)

    if (aiRank !== -1 && offRank !== -1) {
      const diff = aiRank - offRank
      if (diff <= -2)
        tagHtml = '<span class="ai-tag tag-gift">Giveaway ⏬</span>'
      else if (diff === -1)
        tagHtml = '<span class="ai-tag tag-soft">Easy 🔽</span>'
      else if (diff === 0)
        tagHtml = '<span class="ai-tag tag-solid">Alright ✅</span>'
      else if (diff === 1)
        tagHtml = '<span class="ai-tag tag-stiff">Sandbag 🔼</span>'
      else if (diff >= 2)
        tagHtml = '<span class="ai-tag tag-sandbag">Total Sandbag ⏫</span>'
    }

    // 4. Create LI
    const li = document.createElement('li')
    li.className = 'graid-stat-item' // Good for debugging

    // Create colored grade span
    const gradeSpan = document.createElement('span')
    gradeSpan.textContent = aiGrade
    gradeSpan.className = getGbClass(aiGrade)

    li.innerHTML = `<strong>grAId:</strong> `
    li.appendChild(gradeSpan)

    // Append remaining text (e.g. " [6b+ - 6c]")
    const remainder = graidValue.slice(aiGrade.length)
    if (remainder.trim()) {
      li.appendChild(document.createTextNode(remainder))
    }

    // Append the calculated tag
    if (tagHtml) {
      li.insertAdjacentHTML('beforeend', tagHtml)
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

  /* ==================== STYLES ==================== */

  function injectMobileStyles () {
    if (document.getElementById('tc-mobile-nav-styles')) return
    const style = document.createElement('style')
    style.id = 'tc-mobile-nav-styles'
    style.textContent = `
      /* Desktop: keep them inline with the list */
      .tc-route-nav-li { display: inline-flex; align-items: center; }
      
      /* Mobile: Overlay them on the edges */
      @media (max-width: 767px) {
        .headline__guts {
          position: relative; /* Create a boundary for the arrows */
        }

        .tc-route-nav-li {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%; /* Center vertically relative to the header guts */
          transform: translateY(-50%);
          display: flex !important;
          justify-content: space-between;
          width: 100%;
          pointer-events: none; /* Let clicks pass through the invisible middle bar */
          z-index: 10;
        }

        .tc-nav-prev, .tc-nav-next {
          pointer-events: auto; /* Re-enable clicks for the arrows themselves */
          font-size: 32px !important;
          padding: 15px 10px !important;
          background: rgba(255, 255, 255, 0.1); /* Subtle visibility */
          border-radius: 4px;
          line-height: 1;
        }

        /* Adjust the actual list so it doesn't overlap text if possible */
        .headline__guts ul.stats {
          padding: 0 40px !important; /* Give the text some breathing room from the arrows */
          text-align: center;
        }
      }

      /* Grade Comparison Tags */
      .ai-tag {
          display: inline-block;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          margin-left: 6px;
          vertical-align: middle;
          line-height: 1.4;
      }
      .tag-gift    { background-color: #34D399; color: #fff; }
      .tag-soft    { background-color: #A7F3D0; color: #064e3b; }
      .tag-solid   { background-color: #E5E7EB; color: #374151; }
      .tag-stiff   { background-color: #FDBA74; color: #7c2d12; }
      .tag-sandbag { background-color: #EF4444; color: #fff; }
    `
    document.head.appendChild(style)
  }

  /* ==================== RUN ==================== */

  function init () {
    injectMobileStyles() // Now this works because the function is defined
    removeContextoDeGrado()
    removeAggregateRatingDiv()
    addRouteNavigationArrows()
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
    removeKeywordCloudSection()
  }

  init()
  setTimeout(init, 1000)
})()
