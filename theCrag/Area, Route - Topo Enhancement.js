// ==UserScript==
// @name         theCrag - Topo Enhancement
// @namespace    https://github.com/killakalle/userscripts
// @version      2.8.0
// @description  Show grades, tick icons and list indicators directly on topo. Draws topo lines, anchors and labels thinner/smaller.
// @author       killakalle
// @match        https://www.thecrag.com/es/escalar/*
// @match        https://www.thecrag.com/en/climbing/*
// @exclude      https://www.thecrag.com/es/escalar/*/topo*
// @exclude      https://www.thecrag.com/en/climbing/*/topo*
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @run-at       document-end
// @grant        none
// @license MIT
// @downloadURL  https://update.greasyfork.org/scripts/555663/theCrag%20Topo%20Ticks%20%2B%20Grades%20Overlay%20%28Manual%20Bands%29.user.js
// @updateURL    https://update.greasyfork.org/scripts/555663/theCrag%20Topo%20Ticks%20%2B%20Grades%20Overlay%20%28Manual%20Bands%29.meta.js

// ==/UserScript==

;(function () {
  'use strict'

  const SHOW_LIST_ICON = true,
    SHOW_GRADES = true,
    SHOW_TICKS = true
  const PURPLE_HIGHLIGHT = '#bb44ff',
    FALLBACK_BG = '#ccc'

  /*
   * Thin topos
   * theCrag draws each topo in an SVG whose coordinate system is the topo's
   * data-width x data-height, then stretches it to the shown size. Lines,
   * anchors and number boxes have fixed sizes in that coordinate system, so
   * a topo with a small data-width (typical on area pages) looks much thicker
   * than the same topo on a route page. We re-render every topo with a larger
   * coordinate system (via theCrag's own PhotoTopo renderer), which shrinks
   * everything uniformly while keeping it aligned to the photo.
   *
   * THIN_TOPO = false restores theCrag's original drawing.
   * TOPO_DISPLAY_SCALE: screen px per topo unit. theCrag route pages are
   *   typically ~0.6, area pages ~1.0. Lower = thinner/smaller. Topos that are
   *   already at or below this are left untouched (never drawn thicker).
   * OVERLAY_MIN_SCALE: grade/tick/list badges shrink with the topo, but never
   *   below this factor of their original size, so they stay readable.
   */
  const THIN_TOPO = true,
    TOPO_DISPLAY_SCALE = 0.6,
    OVERLAY_MIN_SCALE = 0.75

  /*
   * Grade box placement
   * On densely bolted walls the grade boxes under neighbouring route numbers
   * overlap. Each box (with its tick icon) is placed left to right: it tries
   * its normal spot under the route number first, then nudges sideways and
   * drops into lower rows until it overlaps little enough. A box that had to
   * drop is joined to its route number by a thin leader line.
   *
   * AVOID_OVERLAP = false keeps every box directly under its number.
   * OVERLAP_TOLERANCE: share of a box that may be covered without moving it.
   * MAX_ROWS: how many rows a box may drop below its normal spot.
   */
  const AVOID_OVERLAP = true,
    OVERLAP_TOLERANCE = 0.15,
    MAX_ROWS = 3

  /* Adjusted thresholds to ensure 4c (396) through 6a (579) are Yellow */
  const GRADE_BANDS = {
    beginner: { min: 0, max: 302, color: '#53b41c', textColor: '#000' },
    intermediate: { min: 303, max: 602, color: '#ffe100', textColor: '#000' }, // Ends before 6a+ (603)
    experienced: { min: 603, max: 902, color: '#e58329', textColor: '#000' }, // Starts at 6a+
    expert: { min: 903, max: 1202, color: '#c90909', textColor: '#fff' },
    elite: { min: 1203, max: 2000, color: '#b21882', textColor: '#fff' }
  }

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
      '5.14b': 1203,
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
      if (clean.startsWith('5.')) return this.ydsMilestones[clean] || -1
      if (/^\d+[+-]?$/.test(clean)) {
        if (this.uiaaMilestones[clean]) return this.uiaaMilestones[clean]
        return this.ewbankMilestones[clean] || -1
      }
      if (this.frenchMilestones[clean]) return this.frenchMilestones[clean]
      if (clean.includes('/')) {
        let parts = clean.split('/')
        let s1 = this.getScore(parts[0])
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

  const style = document.createElement('style')
  style.textContent = `
    .topo-tick { position: absolute; width: calc(11px * var(--tm-s, 1)); height: calc(11px * var(--tm-s, 1)); background-size: contain; background-repeat: no-repeat; transform: translate(-50%, 0); pointer-events: none; z-index: 5; }
    .topo-tick.is-non-lead { box-shadow: 0 0 0 1.2px ${PURPLE_HIGHLIGHT}, 0 0 2px ${PURPLE_HIGHLIGHT} !important; border-radius: 2px; background-color: rgba(255,255,255,0.8); }
    .topo-tick.tick_dog { background-color: #c09b7a; border: 1px solid rgba(0,0,0,0.25); border-radius: 50%; padding: 1px; box-shadow: 0 0 2px rgba(0,0,0,0.25); box-sizing: content-box; transform: translate(-50%, 0) scale(0.75); transform-origin: center top; }
    .topo-grade { position: absolute; font-size: calc(8px * var(--tm-s, 1)); line-height: calc(9px * var(--tm-s, 1)); border-radius: 2px; text-align: center; transform: translate(-50%, 0); pointer-events: none; z-index: 5; white-space: nowrap; border: calc(1px * var(--tm-p, 1)) solid #000 !important; font-weight: 700; padding: 0 calc(1px * var(--tm-s, 1)); }
    .topo-listicon { position: absolute; width: calc(5px * var(--tm-s, 1)); height: calc(5px * var(--tm-s, 1)); border-radius: 50%; background: #419496; border: 1px solid #000; transform: translate(-50%, 0); pointer-events: none; z-index: 6; }
    .phototopo { margin-bottom: 20px !important; position: relative; }
    .topo-leaders { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: 4; }
    .topo-leaders line { stroke-linecap: round; }
    .topo-leaders line.halo { stroke: #fff; stroke-opacity: 0.7; }
    .topo-leaders line.core { stroke: #000; }
    /* follow theCrag's route highlight: hovered / selected route */
    .topo-grade.tm-hover, .topo-grade.tm-selected,
    .topo-tick.tm-hover, .topo-tick.tm-selected { z-index: 8; }
    .topo-grade.tm-selected { box-shadow: 0 0 0 1px #fff, 0 0 0 2.5px #0a7fd0; }
    .topo-grade.tm-hover { box-shadow: 0 0 0 1px #fff, 0 0 0 2.5px #4cb8ff, 0 0 6px 2px rgba(76,184,255,0.8); transform: translate(-50%, 0) scale(1.15); transform-origin: center top; }
    .topo-leaders line.core.tm-selected { stroke: #0a7fd0; }
    .topo-leaders line.core.tm-hover { stroke: #4cb8ff; }
    .phototopo svg.topooverlay[style*="display: none"] ~ .topo-grade,
    .phototopo svg.topooverlay[style*="display: none"] ~ .topo-leaders,
    .phototopo svg.topooverlay.hide ~ .topo-grade,
    .phototopo svg.topooverlay.hide ~ .topo-leaders { display: none !important; }
  `
  document.head.appendChild(style)

  let styleMap = {},
    tickMap = {},
    gradeMap = {},
    listMap = {}

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
        if (
          computed.backgroundImage === 'none' &&
          !tickIcon.classList.contains('tick_dog')
        )
          return
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

    document.querySelectorAll('.phototopo[data-topodata]').forEach(topoDiv => {
      try {
        const data = JSON.parse(topoDiv.dataset.topodata)
        data.forEach(item => {
          if (item.type === 'route' && item.id && item.grade) {
            const nid = item.id.toString()
            if (!gradeMap[nid]) gradeMap[nid] = item.grade
            if (!styleMap[nid])
              styleMap[nid] =
                item.style && item.style.toLowerCase() === 'boulder'
                  ? 'boulder'
                  : 'sport'
          }
        })
      } catch (e) {}
    })
  }

  /* Re-render every theCrag topo with a coordinate system large enough that
     it is shown at TOPO_DISPLAY_SCALE screen px per unit. Idempotent: the
     original size is remembered on the PhotoTopo instance and only changed
     when the shown size changes (e.g. window resize). */
  function thinTopos () {
    const PT = window.PhotoTopo
    if (!THIN_TOPO || !PT?.prototype?.shared?.topos) return
    PT.prototype.shared.topos.forEach(topo => {
      try {
        const o = topo.options,
          el = topo.$element?.[0],
          svg = topo.$svg?.[0]
        if (!o || !el || !svg || o.editable || !el.isConnected) return
        // leave overview photos that only outline sub-areas alone, so the
        // area names stay readable
        if (!Object.keys(topo.cache?.routes || {}).length) return
        if (!topo.tmBase)
          topo.tmBase = {
            width: +o.width,
            height: +o.height,
            viewScale: +o.viewScale
          }
        const base = topo.tmBase
        const shownWidth = el.getBoundingClientRect().width
        if (!shownWidth || !base.width) return // hidden/not laid out yet
        const k = Math.max(1, shownWidth / base.width / TOPO_DISPLAY_SCALE)
        if (Math.abs(k - (topo.tmK || 1)) < 0.02) return
        o.width = base.width * k
        o.height = base.height * k
        o.viewScale = base.viewScale * k
        svg.setAttribute('viewBox', `0 0 ${o.width} ${o.height}`)
        topo.calcPaths()
        topo.render(true)
        topo.tmK = k
      } catch (e) {
        console.warn('[Topo Enhancement] thinTopos failed', e)
      }
    })
  }

  const overlapArea = (a, b) =>
    Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) *
    Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t))

  // does the segment (x1,y1)-(x2,y2) pass through rectangle r?
  function segmentHitsRect (x1, y1, x2, y2, r) {
    let t0 = 0,
      t1 = 1
    const dx = x2 - x1,
      dy = y2 - y1
    const clip = (p, q) => {
      if (p === 0) return q >= 0
      const u = q / p
      if (p < 0) {
        if (u > t1) return false
        if (u > t0) t0 = u
      } else {
        if (u < t0) return false
        if (u < t1) t1 = u
      }
      return true
    }
    return (
      clip(-dx, x1 - r.l) &&
      clip(dx, r.r - x1) &&
      clip(-dy, y1 - r.t) &&
      clip(dy, r.b - y1) &&
      t1 - t0 > 1e-6
    )
  }

  function segmentsCross (a, b) {
    const side = (p, q, r) =>
      Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x))
    const p1 = { x: a.x1, y: a.y1 },
      p2 = { x: a.x2, y: a.y2 },
      q1 = { x: b.x1, y: b.y1 },
      q2 = { x: b.x2, y: b.y2 }
    return (
      side(p1, p2, q1) * side(p1, p2, q2) < 0 &&
      side(q1, q2, p1) * side(q1, q2, p2) < 0
    )
  }

  /* Choose a spot for every item (grade box + tick).
     Every item gets a list of candidate spots: its normal spot under the
     route number, small sideways nudges, and spots in lower rows that are
     connected by a leader line. Each spot has a cost:
       - overlapping other boxes or other routes' numbers (beyond tolerance)
       - being ambiguous: a box without leader that sits closer to another
         route's number than to its own, or a leader line hidden behind
         another box or number, or crossing another leader
       - distance from the normal spot
     Starting from the normal spots, every item is repeatedly moved to its
     cheapest spot given where all the others currently are, until nothing
     changes (a few passes). */
  function placeItems (items, labels, bounds) {
    const shrink = (r, d) => ({
      l: r.l + d,
      r: r.r - d,
      t: r.t + d,
      b: r.b - d
    })
    items.forEach(it => {
      const area = it.w * it.h || 1
      const gap = Math.max(1, it.h * 0.15)
      it.cands = []
      const rows = AVOID_OVERLAP ? MAX_ROWS : 0
      for (let row = 0; row <= rows; row++) {
        const shifts = !AVOID_OVERLAP
          ? [0]
          : row === 0
          ? [0, -0.5, 0.5]
          : [0, -0.5, 0.5, -1, 1, -1.5, 1.5]
        for (const f of shifts) {
          const cx = it.cx + f * it.w
          const t = it.label.b + row * (it.h + gap)
          const box = { l: cx - it.w / 2, r: cx + it.w / 2, t, b: t + it.h }
          const leader =
            row > 0 ? { x1: it.cx, y1: it.label.b, x2: cx, y2: t } : null
          let cost = 0.35 * row + 0.25 * Math.abs(f)
          if (box.l < 0 || box.r > bounds.w || box.b > bounds.h) cost += 1
          for (const L of labels) {
            if (L.nid === it.nid) continue
            cost +=
              2.5 * Math.max(0, overlapArea(box, L) / area - OVERLAP_TOLERANCE)
            if (leader && segmentHitsRect(leader.x1, leader.y1, leader.x2, leader.y2, shrink(L, 0.5)))
              cost += 1.5
          }
          if (!leader) {
            // without a leader the box must clearly be nearest to its own
            // number among the numbers just above it
            const boxCx = cx
            const own = Math.abs(it.cx - boxCx)
            for (const L of labels) {
              if (L.nid === it.nid) continue
              if (L.b < box.t - it.h * 1.5 || L.b > box.t + it.h * 0.5) continue
              if (Math.abs((L.l + L.r) / 2 - boxCx) < own - 0.5) {
                cost += 1
                break
              }
            }
          }
          it.cands.push({ box, row, leader, cost, area })
        }
      }
      it.cur = it.cands[0]
    })

    const pairCost = (a, b) => {
      let c = 0
      const ov = overlapArea(a.box, b.box)
      if (ov > 0)
        c += 4 * Math.max(0, ov / Math.min(a.area, b.area) - OVERLAP_TOLERANCE)
      if (a.leader && segmentHitsRect(a.leader.x1, a.leader.y1, a.leader.x2, a.leader.y2, shrink(b.box, 0.5)))
        c += 1.5
      if (b.leader && segmentHitsRect(b.leader.x1, b.leader.y1, b.leader.x2, b.leader.y2, shrink(a.box, 0.5)))
        c += 1.5
      if (a.leader && b.leader && segmentsCross(a.leader, b.leader)) c += 0.75
      return c
    }

    if (!AVOID_OVERLAP) return finish()
    const order = [...items].sort((a, b) => a.cx - b.cx)
    for (let pass = 0; pass < 10; pass++) {
      let changed = false
      for (const it of order) {
        // only items close by can interact
        const near = order.filter(
          o =>
            o !== it &&
            Math.abs(o.cx - it.cx) < (o.w + it.w) * 2.5 &&
            Math.abs(o.label.b - it.label.b) < (o.h + it.h) * (MAX_ROWS + 2)
        )
        let best = it.cur,
          bestCost = Infinity
        for (const c of it.cands) {
          let cost = c.cost
          for (const o of near) cost += pairCost(c, o.cur)
          if (cost < bestCost - 1e-9) {
            bestCost = cost
            best = c
          }
        }
        if (best !== it.cur) {
          it.cur = best
          changed = true
        }
      }
      if (!changed) break
    }
    return finish()

    function finish () {
      items.forEach(it => {
        it.box = it.cur.box
        it.row = it.cur.row
      })
    }
  }

  function renderOverlays () {
    document
      .querySelectorAll(
        '.topo-grade, .topo-tick, .topo-listicon, .topo-leaders'
      )
      .forEach(el => el.remove())
    document.querySelectorAll('.phototopo svg.topooverlay').forEach(svg => {
      const img = svg
        .closest('.phototopo')
        ?.querySelector('img.fixedheightmedium')
      if (!img) return
      const vb = svg.viewBox.baseVal
      if (!vb.width || !img.clientWidth) return
      const canvas = svg.parentElement
      const sx = img.clientWidth / vb.width,
        sy = img.clientHeight / vb.height
      // screen px per topo unit, and the badge scale derived from it
      const pxPerUnit = sx
      const os = Math.min(1, Math.max(OVERLAY_MIN_SCALE, pxPerUnit))
      const lineW = Math.min(1, pxPerUnit)

      const add = (el, nid) => {
        el.dataset.nid = nid
        el.style.setProperty('--tm-s', os)
        // border follows the topo's own line width (1 topo unit), like
        // theCrag's number boxes
        el.style.setProperty('--tm-p', lineW)
        canvas.appendChild(el)
      }

      const items = [],
        labels = []
      canvas.querySelectorAll('rect.routelabel[data-nid]').forEach(rect => {
        const nid = rect.dataset.nid
        const rx = parseFloat(rect.getAttribute('x')),
          ry = parseFloat(rect.getAttribute('y'))
        const rw = parseFloat(rect.getAttribute('width')),
          rh = parseFloat(rect.getAttribute('height'))
        // rect.routelabel is the click area: the visible number box padded
        // by 5 units on every side
        const label = {
          nid,
          l: (rx + 5) * sx,
          t: (ry + 5) * sy,
          r: (rx + rw - 5) * sx,
          b: (ry + rh - 5) * sy
        }
        labels.push(label)
        const item = { nid, cx: (rx + rw / 2) * sx, label }

        if (SHOW_LIST_ICON && listMap[nid]) {
          const el = document.createElement('span')
          el.className = 'topo-listicon'
          el.style.left = `${item.cx}px`
          el.style.top = `${label.t - 7 * os}px`
          add(el, nid)
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
          add(el, nid)
          item.grade = el
        }

        if (SHOW_TICKS && tickMap[nid]) {
          const data = tickMap[nid]
          const el = document.createElement('span')
          el.className = `topo-tick ${data.className}${
            data.isNonLead ? ' is-non-lead' : ''
          }`
          el.style.backgroundImage = data.bgImage
          add(el, nid)
          item.tick = el
        }

        if (item.grade || item.tick) items.push(item)
      })
      if (!items.length) return

      // measure all badges in one layout pass
      items.forEach(it => {
        it.gh = it.grade ? it.grade.offsetHeight : 0
        const gw = it.grade ? it.grade.offsetWidth : 0
        const th = it.tick ? it.tick.offsetHeight : 0
        const tw = it.tick ? it.tick.offsetWidth : 0
        it.w = Math.max(gw, tw)
        it.h = it.gh + th
      })

      placeItems(items, labels, {
        w: img.clientWidth,
        h: img.clientHeight
      })

      let halos = '',
        cores = ''
      items.forEach(it => {
        const cx = (it.box.l + it.box.r) / 2
        if (it.grade) {
          it.grade.style.left = `${cx}px`
          it.grade.style.top = `${it.box.t}px`
        }
        if (it.tick) {
          it.tick.style.left = `${cx}px`
          it.tick.style.top = `${it.box.t + it.gh}px`
        }
        if (it.row > 0) {
          const xy = `x1="${it.cx}" y1="${it.label.b}" x2="${cx}" y2="${it.box.t}" data-nid="${it.nid}"`
          halos += `<line class="halo" ${xy} stroke-width="${lineW * 3}" />`
          cores += `<line class="core" ${xy} stroke-width="${lineW}" />`
        }
      })
      if (cores) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        g.setAttribute('class', 'topo-leaders')
        g.innerHTML = halos + cores
        canvas.insertBefore(g, canvas.querySelector('.topo-grade, .topo-tick'))
      }
      const topo = window.jQuery?.(svg.closest('.phototopo')).data('phototopo')
      if (topo) syncHighlight(topo)
    })
  }

  /* Mirror theCrag's hover/selected state of a route onto its grade box,
     tick and leader line. theCrag re-renders the topo on every hover and
     selection change, so hooking PhotoTopo.render catches all of them
     (hovering the topo as well as the route list). */
  function syncHighlight (topo) {
    const canvas = topo.$svg?.[0]?.parentElement
    if (!canvas) return
    canvas
      .querySelectorAll(
        '.topo-grade[data-nid], .topo-tick[data-nid], .topo-leaders line[data-nid]'
      )
      .forEach(el => {
        const nid = el.getAttribute('data-nid')
        el.classList.toggle('tm-hover', topo.hasClass(nid, 'hover'))
        el.classList.toggle('tm-selected', topo.hasClass(nid, 'selected'))
      })
  }

  function hookHighlight () {
    const proto = window.PhotoTopo?.prototype
    if (!proto || proto.tmHooked) return
    const origRender = proto.render
    proto.render = function () {
      const result = origRender.apply(this, arguments)
      try {
        syncHighlight(this)
      } catch (e) {}
      return result
    }
    proto.tmHooked = true
  }

  function render () {
    thinTopos()
    collectData()
    renderOverlays()
  }

  const isOwnNode = n =>
    n.nodeType === 1 &&
    (n.matches('.topo-grade, .topo-tick, .topo-listicon, .topo-leaders') ||
      n.closest?.('svg.topooverlay') ||
      n.matches('svg.topooverlay'))

  hookHighlight()
  thinTopos() // topos are already built at document-end; thin them right away
  setTimeout(render, 1200)
  let t = null
  const schedule = () => {
    if (t) clearTimeout(t)
    t = setTimeout(render, 500)
  }
  // Ignore mutations caused by our own badges or by re-rendering the topo SVG,
  // otherwise every render would trigger the next one.
  const observer = new MutationObserver(mutations => {
    const relevant = mutations.some(m =>
      [...m.addedNodes, ...m.removedNodes].some(n => !isOwnNode(n)) &&
      !(m.target.nodeType === 1 && m.target.closest?.('svg.topooverlay'))
    )
    if (relevant) schedule()
  })
  observer.observe(document.body, { childList: true, subtree: true })
  window.addEventListener('resize', schedule)
})()
