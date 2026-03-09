// ==UserScript==
// @name          theCrag - Dashboard Cleanup
// @author        killakalle
// @namespace     https://github.com/killakalle/userscripts
// @version       1.1.1
// @description   Removes unneccessary stuff from the dashboard, stream starts right away at the top. Base on original script by anderlnought
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

  // 1. Static UI elements
  const hideStatic = () => {
    const staticSelectors = [
      '.regions__prominent',
      '.btn-success',
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

  // 2. Precise Tick Item Cleanup
  const cleanTickItems = () => {
    // Find only the specific spans inside tick-items
    const tickItems = document.querySelectorAll('.tick-item')

    tickItems.forEach(item => {
      // Find Deportiva tags by checking the class string precisely
      item.querySelectorAll('span[class*="sport"]').forEach(tag => {
        tag.style.setProperty('display', 'none', 'important')
      })

      // Find Bolts/Chapas by checking the class name specifically
      item.querySelectorAll('span.bolts').forEach(bolt => {
        bolt.style.setProperty('display', 'none', 'important')
      })

      // Safety: Ensure the main paragraph is visible if something else hid it
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

  // Initial run
  hideStatic()
  cleanTickItems()

  // 3. Observer for scrolling
  const observer = new MutationObserver(() => {
    hideStatic()
    cleanTickItems()
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
})()
