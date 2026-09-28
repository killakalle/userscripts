// ==UserScript==
// @name         theCrag - Profile - Show CPR summary
// @namespace    https://github.com/killakalle/userscripts
// @version      0.3.0
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

  function placeBadge (badge) {
    const avatar = document.querySelector('.headline__avatar')
    const container = avatar ? avatar.offsetParent : null

    if (!avatar || !container || container === document.body || container === document.documentElement) {
      badge.classList.add('cpr-badge--inline')
      const guts = document.querySelector('.headline__guts')
      const heading = document.querySelector('.heading.h1')
      if (guts) {
        guts.insertBefore(badge, guts.firstChild)
      } else if (heading) {
        heading.insertAdjacentElement('afterend', badge)
      }
      return
    }

    // The avatar is positioned absolutely, so it (and profiles without a
    // webcover in particular) can leave little or no real space below it in
    // the container's own flow height. Rather than only placing the badge
    // there when space already happens to exist, grow the container to
    // guarantee room, pushing whatever comes after it (the discipline band)
    // down instead of letting the badge overlap it.
    const gap = 8
    const bottomPadding = 8
    const naturalHeight = container.offsetHeight

    const top = avatar.offsetTop + avatar.offsetHeight + gap
    badge.style.top = top + 'px'
    badge.style.left = avatar.offsetLeft + 'px'
    badge.style.width = avatar.offsetWidth + 'px'
    container.appendChild(badge)

    const neededHeight = top + badge.offsetHeight + bottomPadding
    if (neededHeight > naturalHeight) {
      container.style.minHeight = neededHeight + 'px'
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
