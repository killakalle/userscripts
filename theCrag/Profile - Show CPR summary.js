// ==UserScript==
// @name         theCrag - Profile - Show CPR summary
// @namespace    https://github.com/killakalle/userscripts
// @version      0.2.2
// @description  Shows current Sport CPR (grade, points and trend) as a prominent badge below the avatar on a climber's profile page
// @author       killakalle
// @match        https://www.thecrag.com/climber/*
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @grant        none
// @license      MIT
// @run-at       document-idle
// ==/UserScript==

;(function () {
  'use strict'

  const DISCIPLINE = { key: 'sport', label: 'CPR Deportiva' }

  function parseLatestCpr (doc) {
    const titles = doc.querySelectorAll('.xaxis a.slice title')
    const entries = []

    titles.forEach(title => {
      const match = title.textContent.match(/CPR:\s*(\S*)\s*\((\d+)\)/)
      if (!match) return

      const grade = match[1]
      const points = parseInt(match[2], 10)
      if (!grade || !points) return

      entries.push({ grade, points })
    })

    if (!entries.length) return null

    const current = entries[entries.length - 1]
    const previous = entries.length > 1 ? entries[entries.length - 2] : null
    const delta = previous ? current.points - previous.points : 0

    let trend = 'stable'
    if (delta > 0) trend = 'up'
    else if (delta < 0) trend = 'down'

    return { grade: current.grade, points: current.points, delta, trend }
  }

  function trendArrow (trend) {
    if (trend === 'up') return '▲'
    if (trend === 'down') return '▼'
    return '–'
  }

  function trendTitle (trend) {
    if (trend === 'up') return 'Subiendo respecto al periodo anterior'
    if (trend === 'down') return 'Bajando respecto al periodo anterior (probablemente por caducidad, sin ascensiones recientes cerca de tu grado CPR)'
    return 'Estable respecto al periodo anterior'
  }

  function injectStyles () {
    if (document.getElementById('cpr-badge-style')) return

    const style = document.createElement('style')
    style.id = 'cpr-badge-style'
    style.textContent = `
      .cpr-badge {
        box-sizing: border-box;
        text-align: center;
        border-radius: 8px;
        padding: 3px 4px 4px;
        color: #fff;
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.25);
        line-height: 1.15;
        font-family: inherit;
        z-index: 5;
      }
      .cpr-badge--overlay {
        position: absolute;
      }
      .cpr-badge--inline {
        position: static;
        display: inline-block;
        margin: 10px 0;
      }
      .cpr-badge__grade {
        font-size: 15px;
        font-weight: 700;
        white-space: nowrap;
      }
      .cpr-badge__meta {
        font-size: 9px;
        opacity: .9;
        white-space: nowrap;
      }
      .cpr-badge--up .cpr-badge__delta { color: #6fd66f; }
      .cpr-badge--down .cpr-badge__delta { color: #ff6b6b; }
      .cpr-badge--stable .cpr-badge__delta { color: #ccc; }
    `
    document.head.appendChild(style)
  }

  function buildBadge (data) {
    const badge = document.createElement('div')
    badge.className = `cpr-badge cpr-badge--${data.trend}`
    badge.title = `${DISCIPLINE.label}: ${trendTitle(data.trend)}`

    const grade = document.createElement('div')
    grade.className = 'cpr-badge__grade'
    grade.textContent = `CPR ${data.grade}`
    badge.appendChild(grade)

    const meta = document.createElement('div')
    meta.className = 'cpr-badge__meta'
    const sign = data.delta > 0 ? '+' : ''
    meta.textContent = `${data.points} pts `
    const delta = document.createElement('span')
    delta.className = 'cpr-badge__delta'
    delta.textContent = `${trendArrow(data.trend)} ${sign}${data.delta}`
    meta.appendChild(delta)
    badge.appendChild(meta)

    return badge
  }

  // Layout wrappers on this page reserve a left "gutter" for the absolutely
  // positioned avatar via padding, so their own bounding boxes span the full
  // row width even where nothing is actually painted. A plain rect-overlap
  // check against those boxes would therefore always report a collision, so
  // instead we probe actual painted content at sample points with
  // elementFromPoint and only treat a real content element as an obstacle.
  const WRAPPER_SELECTOR = '.headline__avatar, .headline--avatar, .headline__stats, .headline__guts, ul.stats, .profile__summary, .clearfix'

  function spaceBelowAvatarIsEmpty (avatar, left, top, width, height) {
    const cols = 3
    const rows = 3

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = left + (width * (c + 0.5)) / cols
        const py = top + (height * (r + 0.5)) / rows
        const hit = document.elementFromPoint(px, py)

        if (!hit || hit === document.body) continue
        if (hit === avatar || avatar.contains(hit)) continue
        if (hit.matches(WRAPPER_SELECTOR)) continue

        return false
      }
    }

    return true
  }

  function placeBadge (badge) {
    const avatar = document.querySelector('.headline__avatar')
    const container = avatar ? avatar.offsetParent : null

    if (avatar && container) {
      badge.classList.add('cpr-badge--overlay')
      badge.style.top = (avatar.offsetTop + avatar.offsetHeight + 8) + 'px'
      badge.style.left = avatar.offsetLeft + 'px'
      badge.style.width = avatar.offsetWidth + 'px'
      badge.style.visibility = 'hidden'
      container.appendChild(badge)

      // Measure the badge's real rendered height (font rendering varies by
      // OS/browser) instead of guessing, then probe with that exact size.
      const badgeRect = badge.getBoundingClientRect()
      const fits = spaceBelowAvatarIsEmpty(avatar, badgeRect.left, badgeRect.top, badgeRect.width, badgeRect.height)

      if (fits) {
        badge.style.visibility = ''
        return
      }

      container.removeChild(badge)
      badge.classList.remove('cpr-badge--overlay')
      badge.style.top = ''
      badge.style.left = ''
      badge.style.width = ''
      badge.style.visibility = ''
    }

    badge.classList.add('cpr-badge--inline')
    const guts = document.querySelector('.headline__guts')
    const heading = document.querySelector('.heading.h1')
    if (guts) {
      guts.insertBefore(badge, guts.firstChild)
    } else if (heading) {
      heading.insertAdjacentElement('afterend', badge)
    }
  }

  function processIframe (iframe) {
    if (iframe.dataset.cprProcessed) return

    const extract = () => {
      iframe.dataset.cprProcessed = 'true'

      let doc
      try {
        doc = iframe.contentDocument
      } catch (e) {
        return
      }
      if (!doc) return

      const data = parseLatestCpr(doc)
      if (!data) return

      injectStyles()
      placeBadge(buildBadge(data))
    }

    const hasRealContent = () => {
      try {
        const doc = iframe.contentDocument
        return !!doc && doc.readyState === 'complete' && doc.location.href !== 'about:blank'
      } catch (e) {
        return false
      }
    }

    if (hasRealContent()) {
      extract()
    } else {
      iframe.addEventListener('load', extract, { once: true })
    }
  }

  function init () {
    const iframe = document.querySelector(`iframe[src*="graph-${DISCIPLINE.key}-cpr"]`)
    if (iframe) processIframe(iframe)
  }

  init()
})()
