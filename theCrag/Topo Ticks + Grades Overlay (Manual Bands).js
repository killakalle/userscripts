// ==UserScript==
// @name         theCrag - Topo Ticks + Grades Overlay (Manual Bands)
// @namespace    https://thecrag.com/
// @version      2.6
// @description  Show compact grade boxes with user-defined color bands + tick icons
// @match        https://www.thecrag.com/es/escalar/*
// @match        https://www.thecrag.com/en/climbing/*
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @run-at       document-end
// @grant        none
// @license MIT
// @downloadURL  https://update.greasyfork.org/scripts/555663/theCrag%20Topo%20Ticks%20%2B%20Grades%20Overlay%20%28Manual%20Bands%29.user.js
// @updateURL    https://update.greasyfork.org/scripts/555663/theCrag%20Topo%20Ticks%20%2B%20Grades%20Overlay%20%28Manual%20Bands%29.meta.js

// ==/UserScript==

;(function () {
  'use strict'

  /* ===== CONFIGURATION ===== */
  const SHOW_LIST_ICON = true
  const SHOW_GRADES = true
  const SHOW_TICKS = true
  const PURPLE_HIGHLIGHT = '#bb44ff'
  const FALLBACK_BG = '#ccc'

  const GRADE_BANDS = {
    beginner: { min: 0, max: 302, color: '#53b41c', textColor: '#000' },
    intermediate: { min: 303, max: 602, color: '#ffe100', textColor: '#000' },
    experienced: { min: 603, max: 902, color: '#e58329', textColor: '#000' },
    expert: { min: 903, max: 1202, color: '#c90909', textColor: '#fff' },
    elite: { min: 1203, max: 2000, color: '#b21882', textColor: '#fff' }
  }

  /* ===== UNIVERSAL GRADE PARSER ===== */
  const GradeParser = {
    frenchMilestones: {
      '3a': 204,
      '3a+': 219,
      '3b': 237,
      '3b+': 252,
      '3c': 270,
      '3c+': 285,
      '4a': 303,
      '4a+': 327,
      '4b': 348,
      '4b+': 372,
      '4c': 396,
      '4c+': 417,
      '5a': 441,
      '5a+': 465,
      '5b': 489,
      '5b+': 510,
      '5c': 534,
      '5c+': 558,
      '6a': 579,
      '6a+': 603,
      '6b': 645,
      '6b+': 690,
      '6c': 732,
      '6c+': 774,
      '7a': 816,
      '7a+': 861,
      '7b': 903,
      '7b+': 942,
      '7c': 978,
      '7c+': 1017,
      '8a': 1053,
      '8a+': 1092,
      '8b': 1128,
      '8b+': 1167,
      '8c': 1203,
      '8c+': 1245,
      '9a': 1290,
      '9a+': 1332,
      '9b': 1374,
      '9b+': 1416,
      '9c': 1461,
      '10a': 1650
    },

    ydsMilestones: {
      5.5: 264,
      5.6: 303,
      5.7: 363,
      5.8: 423,
      5.9: 483,
      '5.10a': 543,
      '5.10b': 603,
      '5.10c': 642,
      '5.10d': 678,
      '5.11a': 717,
      '5.11b': 753,
      '5.11c': 792,
      '5.11d': 828,
      '5.12a': 867,
      '5.12b': 903,
      '5.13a': 1017,
      '5.14a': 1167,
      '5.15a': 1332
    },

    ewbankMilestones: {
      12: 279,
      13: 303,
      14: 354,
      15: 402,
      16: 453,
      17: 504,
      18: 552,
      19: 603,
      20: 654,
      21: 702,
      22: 753,
      23: 804,
      24: 852,
      25: 903,
      27: 978,
      30: 1092,
      33: 1203
    },

    // theCrag uses Arabic UIAA (1, 2, 3... 9-)
    uiaaMilestones: {
      3: 195,
      '3+': 222,
      '4-': 249,
      4: 276,
      '4+': 303,
      '5-': 345,
      5: 390,
      '5+': 432,
      '6-': 474,
      6: 516,
      '6+': 561,
      '7-': 603,
      7: 657,
      '7+': 711,
      '8-': 765,
      8: 819,
      '8+': 873,
      '9-': 927,
      9: 972,
      '9+': 1020,
      '10-': 1065,
      10: 1110,
      '10+': 1158,
      '11-': 1203,
      11: 1254,
      '11+': 1302
    },

    getScore: function (str) {
      if (!str) return -1
      let clean = str.toString().trim().toLowerCase().replace(/\s+/g, '')

      // Heuristic detection
      if (clean.startsWith('5.')) return this.ydsMilestones[clean] || -1

      // If it's a number followed by - or + (UIAA / Ewbank)
      if (/^\d+[+-]?$/.test(clean)) {
        // theCrag UIAA milestones (10-, 9+, etc.) take priority for these strings
        if (this.uiaaMilestones[clean]) return this.uiaaMilestones[clean]
        return this.ewbankMilestones[clean] || -1
      }

      // Default to French milestones
      if (this.frenchMilestones[clean]) return this.frenchMilestones[clean]

      // Slash/Interpolation logic
      if (clean.includes('/')) {
        let parts = clean.split('/')
        let s1 = this.getScore(parts[0])
        // French shorthand fix
        if (
          parts[1].length <= 2 &&
          !/\d/.test(parts[1]) &&
          this.frenchMilestones[parts[0]]
        ) {
          parts[1] = parts[0].slice(0, -1) + parts[1]
        }
        let s2 = this.getScore(parts[1])
        return s1 > 0 && s2 > 0 ? (s1 + s2) / 2 : s1 || s2 || -1
      }

      return -1
    },

    getLabel: function (str) {
      return str
        .toString()
        .trim()
        .replace(/(\d[abc])\/([abc])\+/, '$1/+')
    }
  }

  /* ===== CORE RENDERING LOGIC ===== */
  let styleMap = {},
    tickMap = {},
    gradeMap = {},
    listMap = {},
    hasRendered = false

  const style = document.createElement('style')
  style.textContent = `
    .topo-tick { position: absolute; width: 11px; height: 11px; background-size: contain; background-repeat: no-repeat; transform: translate(-50%, 0); pointer-events: none; z-index: 5; }
    .topo-tick.is-non-lead { box-shadow: 0 0 0 1.2px ${PURPLE_HIGHLIGHT}, 0 0 2px ${PURPLE_HIGHLIGHT} !important; border-radius: 2px; background-color: rgba(255,255,255,0.8); }
    .topo-grade { position: absolute; font-size: 8px; line-height: 9px; border-radius: 2px; text-align: center; transform: translate(-50%, 0); pointer-events: none; z-index: 5; white-space: nowrap; border: 1.1px solid #000 !important; font-weight: 800; padding: 0 1px; }
    .topo-listicon { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: #419496; border: 1px solid #000; transform: translate(-50%, 0); pointer-events: none; z-index: 6; }
    .phototopo { margin-bottom: 20px !important; position: relative; }
    .phototopo svg.topooverlay[style*="display: none"] ~ .topo-grade,
    .phototopo svg.topooverlay.hide ~ .topo-grade { display: none !important; }
  `
  document.head.appendChild(style)

  function collectData () {
    listMap = {}
    tickMap = {}
    gradeMap = {}
    styleMap = {}
    document.querySelectorAll('.route[data-nid]').forEach(route => {
      const nid = route.dataset.nid
      styleMap[nid] = route.querySelector('.tags.boulder') ? 'boulder' : 'sport'
      if (SHOW_LIST_ICON && route.querySelector('.title i.icon-circle'))
        listMap[nid] = true
    })

    if (SHOW_TICKS) {
      document.querySelectorAll('.route .tick').forEach(tickContainer => {
        const nid = tickContainer.closest('.route')?.dataset.nid
        const tickIcon = tickContainer.querySelector('[class^="tick_"]')
        if (!nid || !tickIcon || tickIcon.classList.contains('tick_unticked'))
          return
        const isNonLead = !!tickIcon.querySelector(
          '.tag-tr, .tag-sd, .tags.second, .tags.toprope'
        )
        const computed = window.getComputedStyle(tickIcon)
        const typeMatch = tickIcon.className.match(/tick_[a-z]+/)
        if (typeMatch)
          tickMap[nid] = {
            className: typeMatch[0],
            isNonLead,
            bgImage: computed.backgroundImage
          }
      })
    }

    if (SHOW_GRADES) {
      document.querySelectorAll('.sticky-header').forEach(header => {
        const nid = header
          .querySelector('input[name="D:AscentNodeID"]')
          ?.value?.trim()
        const gradeSpan =
          header.querySelector('.grade-base-sys') ||
          header.querySelector('.r-grade span[class*="gb"]')
        if (nid && gradeSpan) gradeMap[nid] = gradeSpan.textContent.trim()
      })
    }
  }

  function renderOverlays () {
    document.querySelectorAll('.phototopo svg').forEach(svg => {
      const img = svg
        .closest('.phototopo')
        ?.querySelector('img.fixedheightmedium')
      if (!img) return
      const vb = svg.viewBox.baseVal
      svg.parentElement
        .querySelectorAll('rect.routelabel[data-nid]')
        .forEach(rect => {
          const nid = rect.dataset.nid
          const rx = parseFloat(rect.getAttribute('x')),
            ry = parseFloat(rect.getAttribute('y'))
          const rw = parseFloat(rect.getAttribute('width')),
            rh = parseFloat(rect.getAttribute('height'))
          const baseLeftPx = ((rx + rw / 2) / vb.width) * img.clientWidth
          let currentTopPx = ((ry + rh) / vb.height) * img.clientHeight

          if (SHOW_LIST_ICON && listMap[nid]) {
            const el = document.createElement('span')
            el.className = 'topo-listicon'
            el.style.left = `${baseLeftPx}px`
            el.style.top = `${(ry / vb.height) * img.clientHeight - 2}px`
            svg.parentElement.appendChild(el)
          }

          if (SHOW_GRADES && gradeMap[nid]) {
            const raw = gradeMap[nid]
            const score = GradeParser.getScore(raw)
            let band = {
              color: FALLBACK_BG,
              textColor: '#000',
              name: 'undefined'
            }
            for (const key in GRADE_BANDS) {
              if (
                score >= GRADE_BANDS[key].min &&
                score <= GRADE_BANDS[key].max
              ) {
                band = GRADE_BANDS[key]
                band.name = key
                break
              }
            }
            const el = document.createElement('span')
            el.className = 'topo-grade'
            el.dataset.band = band.name
            el.textContent = GradeParser.getLabel(raw)
            el.style.backgroundColor = band.color
            el.style.color = band.textColor
            el.style.left = `${baseLeftPx}px`
            el.style.top = `${currentTopPx - 5}px`
            svg.parentElement.appendChild(el)
            currentTopPx += 11
          }

          if (SHOW_TICKS && tickMap[nid]) {
            const data = tickMap[nid]
            const el = document.createElement('span')
            el.className = `topo-tick ${data.className}${
              data.isNonLead ? ' is-non-lead' : ''
            }`
            el.style.backgroundImage = data.bgImage
            el.style.left = `${baseLeftPx}px`
            el.style.top = `${currentTopPx - 5}px`
            svg.parentElement.appendChild(el)
          }
        })
    })
    hasRendered = true
  }

  function safeRender () {
    if (!hasRendered) {
      collectData()
      renderOverlays()
    }
  }
  setTimeout(safeRender, 1200)
  let t = null
  const observer = new MutationObserver(() => {
    if (t) clearTimeout(t)
    t = setTimeout(() => {
      hasRendered = false
      safeRender()
    }, 500)
  })
  observer.observe(document.body, { childList: true, subtree: true })
})()
