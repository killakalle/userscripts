// ==UserScript==
// @name         theCrag Topo Ticks + Grades Overlay (Manual Bands)
// @namespace    https://thecrag.com/
// @version      2.5.2
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
  // self-executing anonymous function keeps variables scoped locally

  /* ===== CONFIG ===== */
  // ------------------------------------------------------------------
  // User-editable flags: toggle which overlay elements should appear.
  // * SHOW_LIST_ICON - a tiny dot above the topo number when the route
  //   is on one of your lists.
  // * SHOW_GRADES    - a coloured box showing the route grade.
  // * SHOW_TICKS     - the climbing tick icon (flash/redpoint/onsight etc).
  // You can disable any of the three without affecting the others.
  // ------------------------------------------------------------------
  const SHOW_LIST_ICON = true // show a small dot when route is in your list
  const SHOW_GRADES = true // draw grade boxes
  const SHOW_TICKS = true // draw tick icons
  // Highlight colour applied around ticks that indicate the ascent was
  // done on top-rope / second rather than lead.  Useful for spotting
  // climbs that still require a lead.
  const PURPLE_HIGHLIGHT = '#bb44ff' // used by .is-non-lead CSS rule

  // Grade colour bands for sport routes.  Each band object contains
  // a CSS colour plus an array of grade strings that belong to that band.
  // The helper functions below will normalise input and pick the right
  // colour based on this mapping.
  const GRADE_BANDS_SPORT = {
    beginner: {
      color: '#53b41c',
      grades: ['3', '3+', '3b', '3b+', '3c', '3c+']
    },
    intermediate: {
      color: '#ffe201',
      grades: [
        '4',
        '4+',
        '4a',
        '4a+',
        '4b',
        '4b+',
        '4c',
        '4c+',
        '5',
        '5+',
        '5a',
        '5a+',
        '5b',
        '5b+',
        '5c',
        '5c/c+',
        '5c+',
        '5c+/6a',
        '6a'
      ]
    },
    experienced: {
      color: '#e6842a',
      grades: [
        '6a+',
        '6a+/b',
        '6b',
        '6b/b+',
        '6b+',
        '6b+/c',
        '6c',
        '6c/c+',
        '6c+',
        '6c+/7a',
        '7a',
        '7a/a+',
        '7a+'
      ]
    },
    expert: {
      color: '#db2424',
      grades: [
        '7a+/b',
        '7b',
        '7b/b+',
        '7b+',
        '7b+/c',
        '7c',
        '7c/c+',
        '7c+',
        '7c+/8a',
        '8a',
        '8a/a+',
        '8a+',
        '8a+/b',
        '8b',
        '8b/b+',
        '8b+'
      ]
    },
    elite: {
      color: '#aa1d7b',
      grades: [
        '8c',
        '8c/c+',
        '8c+',
        '8c+/9a',
        '9a',
        '9a/a+',
        '9a+',
        '9a+/b',
        '9b',
        '9b/b+',
        '9b+',
        '9b+/c',
        '9c'
      ]
    }
  }

  // Grade colour bands for boulder problems.  The structure mirrors the
  // sport bands but uses the bouldering grade progression.
  const GRADE_BANDS_BOULDER = {
    beginner: {
      color: '#53b41c',
      grades: ['3', '3+', '3b', '3b+', '3c', '3c+']
    },
    intermediate: {
      color: '#ffe201',
      grades: ['4', '4+', '4a', '4a+', '4b', '4b+', '4c', '4c+']
    },
    experienced: {
      color: '#e6842a',
      grades: [
        '5',
        '5+',
        '5a',
        '5a+',
        '5b',
        '5b+',
        '5c',
        '5c/c+',
        '5c+',
        '5c+/6a',
        '6a',
        '6a+',
        '6a+/b',
        '6b',
        '6b/b+',
        '6b+',
        '6b+/c'
      ]
    },
    expert: {
      color: '#db2424',
      grades: [
        '6c',
        '6c/c+',
        '6c+',
        '6c+/7a',
        '7a',
        '7a/a+',
        '7a+',
        '7a+/b',
        '7b',
        '7b/b+',
        '7b+',
        '7b+/c',
        '7c',
        '7c/c+',
        '7c+',
        '7c+/8a'
      ]
    },
    elite: {
      color: '#aa1d7b',
      grades: [
        '8a',
        '8a/a+',
        '8a+',
        '8a+/b',
        '8b',
        '8b/b+',
        '8b+',
        '8c',
        '8c/c+',
        '8c+',
        '8c+/9a',
        '9a',
        '9a/a+',
        '9a+',
        '9a+/b',
        '9b',
        '9b/b+',
        '9b+',
        '9b+/c',
        '9c'
      ]
    }
  }

  // layout configuration (px); adjust if you want bigger/smaller overlays.
  const GAP_PX = 1
  const FONT_SIZE = 8
  const PADDING_PX = 1
  const GRADE_H_PX = 10
  const TICK_H_PX = 11
  const FALLBACK_BG = '#ccc' // used if a grade doesn't fit any band
  /* ================== */

  // cached data extracted from the page; keys are route NIDs
  // styleMap: climbing style ('sport' or 'boulder') so we know which
  //           grade band table to use for that route.
  let styleMap = {} // { nid: 'sport' | 'boulder' }

  // create and inject CSS rules for our overlay elements; using a
  // <style> node avoids editing external stylesheets.
  const style = document.createElement('style')
  style.textContent = /* css */ `
    .topo-tick {
      position: absolute;
      width: 11px; height: 11px;
      background-size: contain; background-repeat: no-repeat;
      transform: translate(-50%, 0);
      pointer-events: none; z-index: 5;
    }
    /* purple glow around ticks done on TR/second */
    .topo-tick.is-non-lead {
      box-shadow: 0 0 0 1.2px ${PURPLE_HIGHLIGHT}, 0 0 2px ${PURPLE_HIGHLIGHT} !important;
      border-radius: 2px;
      background-color: rgba(255,255,255,0.8);
    }
    .topo-tick.tick_dog {
      background-color: #c09b7a;
      border: 1px solid rgba(0,0,0,0.25);
      border-radius: 50%;
      padding: 1px;
      box-shadow: 0 0 2px rgba(0,0,0,0.25);
      box-sizing: content-box;
      transform: translate(-50%, 0) scale(0.75);
      transform-origin: center top;
    }
    .topo-grade {
      position: absolute;
      font-size: ${FONT_SIZE}px;
      line-height: ${FONT_SIZE + 1}px;
      border-radius: 2px;
      padding: 0 0px;
      /* padding: 0 ${PADDING_PX}px; */
      text-align: center;
      transform: translate(-50%, 0);
      pointer-events: none;
      z-index: 5;
      white-space: nowrap;
      border: 1.2px solid #000 !important;   /* darker, crisper edge */
      box-shadow: none !important;           /* cleaner flat look */
      color: #000;
      font-weight: 600;
    }
    /* Force readable text colors for specific grade bands */
    .topo-grade[data-band="beginner"],
    .topo-grade[data-band="experienced"] {
      color: #000 !important;
    }
    /* Hide our overlays whenever the topo SVG is hidden */
    .phototopo svg.topooverlay[style*="display: none"] ~ .topo-grade,
    .phototopo svg.topooverlay[style*="display: none"] ~ .topo-tick,
    .phototopo svg.topooverlay[style*="display: none"] ~ .topo-listicon,
    .phototopo svg.topooverlay.hide ~ .topo-grade,
    .phototopo svg.topooverlay.hide ~ .topo-tick,
    .phototopo svg.topooverlay.hide ~ .topo-listicon,
    .phototopo svg.topooverlay.is-hidden ~ .topo-grade,
    .phototopo svg.topooverlay.is-hidden ~ .topo-tick,
    .phototopo svg.topooverlay.is-hidden ~ .topo-listicon,
    .phototopo svg.topooverlay[style*="visibility: hidden"] ~ .topo-grade,
    .phototopo svg.topooverlay[style*="visibility: hidden"] ~ .topo-tick,
    .phototopo svg.topooverlay[style*="visibility: hidden"] ~ .topo-listicon,
    .phototopo svg.topooverlay[style*="opacity: 0"] ~ .topo-grade,
    .phototopo svg.topooverlay[style*="opacity: 0"] ~ .topo-tick,
    .phototopo svg.topooverlay[style*="opacity: 0"] ~ .topo-listicon {
      display: none !important;
    }

    .phototopo {
      margin-bottom: 20px !important;
    }

    .topo-listicon {
      position: absolute;
      width: 5px;     /* smaller */
      height: 5px;    /* smaller */
      border-radius: 50%;
      background: #419496;
      border: 1px solid #000;   /* thin border */
      transform: translate(-50%, 0);
      pointer-events: none;
      z-index: 6;
      box-shadow: 0 0 1px rgba(0,0,0,0.35); /* subtle due to reduced size */
    }
  `

  document.head.appendChild(style)

  // tickMap now stores an object with className, isNonLead flag and
  // the backgroundImage string; this supports the purple highlight and
  // prevents 'ghost' ticks by ensuring we only record actual icons.
  let tickMap = {} // { nid: {className, isNonLead, bgImage} }
  let gradeMap = {} // { nid: '6b+' }
  let listMap = {} // { nid: true }
  let hasRendered = false

  // --- helper utilities ------------------------------------------------
  // normalise grade strings / text so comparisons are easier
  const norm = s =>
    (s || '')
      .toString()
      .trim()
      .replace(/\u00A0/g, ' ') // NBSP -> space
      .replace(/[·•]/g, '+') // odd separators -> plus
      .replace(/\s+/g, '') // remove spaces inside (e.g., '6a +')
      .toLowerCase()

  // return the hex background colour for a given grade text and route nid
  // (nid is used to choose sport vs boulder band list via styleMap).
  const pickBandColor = (gradeText, nid) => {
    const g = norm(gradeText)

    const bands =
      styleMap[nid] === 'boulder' ? GRADE_BANDS_BOULDER : GRADE_BANDS_SPORT

    for (const key of Object.keys(bands)) {
      const band = bands[key]
      if (band.grades.map(norm).includes(g)) {
        return band.color
      }
    }

    return FALLBACK_BG
  }

  // compute readable black/white text colour based on background luminance
  function textColorFor (bg) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(bg)
    if (!m) return '#000'
    const r = parseInt(m[1], 16),
      g = parseInt(m[2], 16),
      b = parseInt(m[3], 16)
    const L =
      0.2126 * (r / 255) ** 2.2 +
      0.7152 * (g / 255) ** 2.2 +
      0.0722 * (b / 255) ** 2.2
    return L < 0.5 ? '#fff' : '#000'
  }

  // gather all the information we need from the current DOM.  This runs
  // before any overlays are rendered and whenever the page mutates.
  function collectData () {
    // reset caches
    listMap = {}
    tickMap = {}
    gradeMap = {}
    styleMap = {}

    // first pass: determine whether each route is sport or boulder.  we
    // try to read the tag element on the route; if that's not present we
    // fall back to a JSON blob stored on the element.
    document.querySelectorAll('.route[data-nid]').forEach(route => {
      const nid = route.dataset.nid
      if (!nid) return

      // 1. Prefer tag detection (cleanest)
      if (route.querySelector('.tags.boulder')) {
        styleMap[nid] = 'boulder'
        return
      }

      if (route.querySelector('.tags.sport')) {
        styleMap[nid] = 'sport'
        return
      }

      // 2. Fallback: data-route-tick JSON
      const tickData = route.dataset.routeTick
      if (tickData) {
        try {
          const parsed = JSON.parse(tickData)
          if (parsed.styleStub) {
            styleMap[nid] = parsed.styleStub
          }
        } catch (e) {}
      }
    })

    if (SHOW_TICKS) {
      document.querySelectorAll('.route .tick').forEach(tickContainer => {
        const route = tickContainer.closest('.route')
        const nid = route?.dataset.nid
        if (!nid) return

        // 1. Find the icon element first
        const tickIcon = tickContainer.querySelector('[class^="tick_"]')
        if (!tickIcon) return

        // 2. Check for Non-Lead status using your modern tags + original classes
        const isNonLead = !!tickIcon.querySelector(
          '.tag-tr, .tag-sd, .tags.second, .tags.toprope'
        )

        // 3. Skip unticked routes
        if (tickIcon.classList.contains('tick_unticked')) return

        // 4. Validate background or special 'dog' status
        const computed = window.getComputedStyle(tickIcon)
        if (
          computed.backgroundImage === 'none' &&
          !tickIcon.classList.contains('tick_dog')
        )
          return

        const typeMatch = tickIcon.className.match(/tick_[a-z]+/)
        if (typeMatch) {
          tickMap[nid] = {
            className: typeMatch[0],
            isNonLead: isNonLead, // Use the check we performed in step 2
            bgImage: computed.backgroundImage
          }
        }
      })
    }

    if (SHOW_GRADES) {
      document.querySelectorAll('.sticky-header').forEach(header => {
        const checkbox = header.querySelector('input[name="D:AscentNodeID"]')
        // Look specifically for the base system span first
        let gradeSpan = header.querySelector('.grade-base-sys')

        // Fallback to the generic gb2 span if the specific one isn't found
        if (!gradeSpan) {
          gradeSpan = header.querySelector('.r-grade span[class*="gb"]')
        }

        if (!checkbox || !gradeSpan) return
        const nid = checkbox.value?.trim()
        if (!nid) return

        // Use textContent on the specific span found
        gradeMap[nid] = gradeSpan.textContent.trim()
      })
    }

    // List membership
    if (SHOW_LIST_ICON) {
      document.querySelectorAll('.route[data-nid]').forEach(route => {
        const nid = route.dataset.nid
        const inList = !!route.querySelector('.title i.icon-circle')
        if (nid && inList) listMap[nid] = true
      })
    }

    if (SHOW_GRADES && Object.keys(gradeMap).length === 0) {
      document.querySelectorAll('.phototopo[data-topodata]').forEach(pt => {
        try {
          const data = JSON.parse(pt.dataset.topodata)
          data.forEach(item => {
            if (item.type === 'route' && item.id && item.grade) {
              gradeMap[item.id.toString()] = item.grade
            }
          })
        } catch (e) {}
      })
    }
  }

  // walk every topo SVG and append our overlay elements at the proper
  // pixel coordinates.  Uses cached maps built by collectData().
  function renderOverlays () {
    const svgs = document.querySelectorAll('.phototopo svg')
    if (!svgs.length) return

    svgs.forEach(svg => {
      const img = svg
        .closest('.phototopo')
        ?.querySelector('img.fixedheightmedium')
      if (!img) return
      const container = svg.parentElement
      const vb = svg.viewBox.baseVal
      container.style.position = 'relative'

      svg.querySelectorAll('rect.routelabel[data-nid]').forEach(rect => {
        const nid = rect.dataset.nid
        // rectangle bounding box of the route number inside the SVG
        const rectX = parseFloat(rect.getAttribute('x'))
        const rectY = parseFloat(rect.getAttribute('y'))
        const rectW = parseFloat(rect.getAttribute('width'))
        const rectH = parseFloat(rect.getAttribute('height'))
        const x = rectX + rectW / 2

        // convert SVG coordinates to pixel offsets relative to the
        // rendered image dimensions.  baseTopPx aligns with the bottom
        // of the number box; subsequent overlays stack downward from
        // that point.
        const baseLeftPx = (x / vb.width) * img.clientWidth
        const baseTopPx = ((rectY + rectH) / vb.height) * img.clientHeight
        let currentTopPx = baseTopPx

        // List icon (touching the number box from above)
        if (
          SHOW_LIST_ICON &&
          listMap[nid] &&
          !container.querySelector(`.topo-listicon[data-nid="${nid}"]`)
        ) {
          const el = document.createElement('span')
          el.className = 'topo-listicon'
          el.dataset.nid = nid

          const iconLeft = baseLeftPx

          const numberTop = (rectY / vb.height) * img.clientHeight
          const iconTop = numberTop - 2

          el.style.left = `${iconLeft}px`
          el.style.top = `${iconTop}px`
          container.appendChild(el)
        }

        // Grade box (just below number)
        if (
          SHOW_GRADES &&
          gradeMap[nid] &&
          !container.querySelector(`.topo-grade[data-nid="${nid}"]`)
        ) {
          const grade = gradeMap[nid]
          const bg = pickBandColor(grade, nid)

          const bands =
            styleMap[nid] === 'boulder'
              ? GRADE_BANDS_BOULDER
              : GRADE_BANDS_SPORT

          const el = document.createElement('span')
          el.className = 'topo-grade'
          el.dataset.nid = nid
          el.dataset.band = Object.keys(bands).find(key =>
            bands[key].grades.map(norm).includes(norm(grade))
          )
          el.textContent = grade
          el.style.background = bg
          el.style.color = textColorFor(bg)
          el.style.left = `${baseLeftPx}px`
          el.style.top = `${currentTopPx + GAP_PX - 6}px`

          container.appendChild(el)
          currentTopPx += GAP_PX + GRADE_H_PX
        }

        // Tick icon (flush below grade)
        if (
          SHOW_TICKS &&
          tickMap[nid] &&
          !container.querySelector(`.topo-tick[data-nid="${nid}"]`)
        ) {
          const data = tickMap[nid]
          const el = document.createElement('span')
          // append isNonLead class if necessary to trigger purple glow
          el.className = `topo-tick ${data.className}${
            data.isNonLead ? ' is-non-lead' : ''
          }`
          el.dataset.nid = nid
          el.style.backgroundImage = data.bgImage
          el.style.left = `${baseLeftPx}px`
          el.style.top = `${currentTopPx + GAP_PX - 6}px`
          container.appendChild(el)
          currentTopPx += GAP_PX + TICK_H_PX
        }
      })
    })

    hasRendered = true
  }

  // wrapper ensuring we only render once per mutation cycle
  function safeRender () {
    if (hasRendered) return
    collectData()
    renderOverlays()
  }

  // initial delayed render to give the page time to load
  setTimeout(safeRender, 1200)

  // watch the DOM for additions/changes so we can re-run when new
  // routes or popups appear.  Debounce so we don't thrash on rapid
  // mutations.
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
