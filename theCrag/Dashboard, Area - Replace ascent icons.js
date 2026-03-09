// ==UserScript==
// @name        theCrag - Dashboard, Area - Replace ascent icons
// @namespace   https://github.com/killakalle/userscripts
// @version     0.2.8
// @description Replace ascent icons because they are hard to distinguish
// @author      killakalle
// @match       https://www.thecrag.com/
// @match       https://www.thecrag.com/dashboard
// @match       https://www.thecrag.com/*/escalar/*
// @icon        https://www.google.com/s2/favicons?domain=thecrag.com
// @downloadURL https://update.greasyfork.org/scripts/568554/theCrag%20-%20Replace%20ascent%20icons.user.js
// @updateURL   https://update.greasyfork.org/scripts/568554/theCrag%20-%20Replace%20ascent%20icons.meta.js
// @license     MIT
// @grant       none
// ==/UserScript==

;(function () {
  'use strict'

  // 1. Inject the Slim Modern CSS
  const style = document.createElement('style')
  style.textContent = `
    .modern-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 16px;
        border-radius: 2px;

        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 10px;
        font-weight: 500;
        color: #fff !important;
        line-height: 1;

        /* APPLYING YOUR REQUESTED POSITIONING */
        position: relative;
        left: 21px;
    }

    /* T - Top Rope: Using a deep purple-blue that fits the 'tide' vibe */
    .tag-tr { background-color: #cc44cc; }

    /* S - Second: A mid-tone blue from your theme's spectrum */
    .tag-sd { background-color: #cc44cc; }

    /* L - Lead: Your theme's primary accent color (Teal) */
    .tag-ld { background-color: #409496; }
  `
  document.head.appendChild(style)

  const ICON_MAP = [
    {
      selector: '.gear-style-top-rope',
      text: 'T',
      className: 'modern-tag tag-tr'
    },
    {
      selector: '.gear-style-second',
      text: 'S',
      className: 'modern-tag tag-sd'
    },
    { selector: '.gear-style-sport', text: 'L', className: 'modern-tag tag-ld' }
  ]

  function replaceElements () {
    ICON_MAP.forEach(({ selector, text, className }) => {
      // Look for the gear-style spans
      const elements = document.querySelectorAll(
        `span.gear-style-with-tick${selector}`
      )

      elements.forEach(element => {
        // Only replace if it's the original site element (prevents infinite loops with observer)
        if (element.classList.contains('gear-style-with-tick')) {
          const newElement = document.createElement('span')
          newElement.className = className
          newElement.textContent = text

          // Replace old element with new one
          element.parentNode.replaceChild(newElement, element)
        }
      })
    })
  }

  // Initial Run
  replaceElements()

  // Watch for new elements (Dashboard/Infinite Scroll)
  const observer = new MutationObserver(() => replaceElements())
  observer.observe(document.body, { childList: true, subtree: true })
})()
