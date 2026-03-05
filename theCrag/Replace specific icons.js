// ==UserScript==
// @name        theCrag - Replace ascent icons
// @namespace   http://tampermonkey.net/
// @version     0.2
// @description Replace ascent icons because they are hard to distinguish
// @author      killakalle
// @match       *://www.thecrag.com/*/escalar/*
// @icon        https://www.google.com/s2/favicons?domain=thecrag.com
// @license     MIT
// @grant       none
// ==/UserScript==

;(function () {
  'use strict'

  // Define the mapping of selectors to their replacement text and classes
  const ICON_MAP = [
    { selector: '.gear-style-top-rope', text: 'T', className: 'tags toprope' },
    { selector: '.gear-style-second', text: 'S', className: 'tags second' },
    { selector: '.gear-style-sport', text: 'L', className: 'tags sport' }
  ]

  function replaceElements () {
    ICON_MAP.forEach(({ selector, text, className }) => {
      // Find the specific gear-style spans
      const elements = document.querySelectorAll(
        `span.gear-style-with-tick${selector}`
      )

      elements.forEach(element => {
        const newElement = document.createElement('span')
        newElement.className = className

        // RESTORED ORIGINAL STYLING
        newElement.style.position = 'relative'
        newElement.style.left = '20px'

        newElement.textContent = text

        // Replace old element with new one
        element.parentNode.replaceChild(newElement, element)
      })
    })
  }

  // Run on page load
  if (window.location.href.indexOf('/escalar/') !== -1) {
    replaceElements()
  }
})()
