// ==UserScript==
// @name         theCrag - Icon Replacer
// @namespace    http://tampermonkey.net/
// @version      1.3.3
// @description  Replace icons on theCrag dashboard stream with other elements
// @author       You
// @match        https://www.thecrag.com/
// @match        https://www.thecrag.com/dashboard
// @match        https://www.thecrag.com/*/escalar/*
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @license      MIT
// @grant        none
// ==/UserScript==

;(function () {
  'use strict'

  const replacements = [
    {
      originalClass: 'gear-style-with-tick.gear-style-second',
      html: '<span class="tags toprope" style="position: relative; left: 23px;">SD</span>'
    },
    {
      originalClass: 'gear-style-with-tick.gear-style-top-rope',
      html: '<span class="tags toprope" style="position: relative; left: 23px;">TR</span>'
    },
    {
      originalClass: 'gear-style-with-tick.gear-style-boulder',
      html: '<span class="tags boulder" style="position: relative; left: 23px;">BD</span>'
    },
    {
      originalClass: 'gear-style-with-tick.gear-style-dws',
      html: '<span class="tags dws" style="position: relative; left: 23px;">DW</span>'
    }
  ]

  function process (root) {
    replacements.forEach(({ originalClass, html }) => {
      // Use querySelectorAll on the specific node added to save performance
      const targets = root.querySelectorAll
        ? root.querySelectorAll(`span.${originalClass}`)
        : []
      targets.forEach(el => {
        el.outerHTML = html // Faster and more reliable than DOMParser on mobile
      })
    })
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) process(node)
      }
    }
  })

  function start () {
    process(document.body) // Catch existing
    observer.observe(document.body, { childList: true, subtree: true })
  }

  // Mobile-friendly entry point
  if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
  ) {
    start()
  } else {
    window.addEventListener('DOMContentLoaded', start)
  }
})()
