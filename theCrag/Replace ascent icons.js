// ==UserScript==
// @name         theCrag - Icon Replacer
// @namespace    http://tampermonkey.net/
// @version      1.3.1
// @description  Replace icons on theCrag dashboard stream with other elements
// @author       You
// @match        https://www.thecrag.com/
// @match        https://www.thecrag.com/dashboard
// @match        https://www.thecrag.com/*/escalar/*
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @grant        none
// ==/UserScript==

;(function () {
  'use strict'

  // Configuration for class pairs to be replaced
  const replacements = [
    //        {
    //            originalClass: 'gear-style-with-tick.gear-style-sport',
    //            replacementHTML: '<span class="tags sport" style="position: relative; left: 23px;">LD</span>'
    //        },
    {
      originalClass: 'gear-style-with-tick.gear-style-second',
      replacementHTML:
        '<span class="tags toprope" style="position: relative; left: 23px;">SD</span>'
    },
    {
      originalClass: 'gear-style-with-tick.gear-style-top-rope',
      replacementHTML:
        '<span class="tags toprope" style="position: relative; left: 23px;">TR</span>'
    },
    {
      originalClass: 'gear-style-with-tick.gear-style-boulder',
      replacementHTML:
        '<span class="tags boulder" style="position: relative; left: 23px;">BD</span>'
    },
    {
      originalClass: 'gear-style-with-tick.gear-style-dws',
      replacementHTML:
        '<span class="tags dws" style="position: relative; left: 23px;">DW</span>'
    }
    // Add more class pairs as needed
    // {
    //     originalClass: 'another-original-class',
    //     replacementHTML: '<span style="margin-left: 20px;" class="another-replacement-class">SomeText</span>'
    // },
  ]

  function replaceIcons (element) {
    replacements.forEach(({ originalClass, replacementHTML }) => {
      const elements = element.querySelectorAll(`span.${originalClass}`)
      elements.forEach(element => {
        const replacementElement = new DOMParser().parseFromString(
          replacementHTML,
          'text/html'
        ).body.firstChild
        element.replaceWith(replacementElement)
      })
    })
  }

  // Function to observe changes to the DOM and trigger replacement
  function observeDOM () {
    const observerOptions = { childList: true, subtree: true }
    const observer = new MutationObserver(mutationsList => {
      mutationsList.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(addedNode => {
            if (addedNode.nodeType === 1) {
              replaceIcons(addedNode)
            }
          })
        }
      })
    })

    // Observe changes in both the dashboard and climbing routes
    observer.observe(document.body, observerOptions)
  }

  // Run the replacement when the page is ready
  window.addEventListener('load', observeDOM)
})()
