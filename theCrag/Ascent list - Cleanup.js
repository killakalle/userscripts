// ==UserScript==
// @name         theCrag - Ascent list - Cleanup
// @namespace    https://github.com/killakalle/userscripts
// @author       killakalle
// @version      0.4.2
// @description  Hides the search facet and pagination on the ascent list, removes certain rows from the search results table, and adds a button to toggle beta ascents.
// @match        *://www.thecrag.com/*/ascents*
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @grant        none
// @license      MIT
// @downloadURL  https://update.greasyfork.org/scripts/569076/theCrag%20-%20Ascent%20list%20-%20Cleanup.user.js
// @updateURL    https://update.greasyfork.org/scripts/569076/theCrag%20-%20Ascent%20list%20-%20Cleanup.meta.js
// ==/UserScript==

;(function () {
  'use strict'

  // Hide the search facet and the first occurrence of pagination
  var facets = document.getElementById('facets')
  if (facets) {
    facets.style.display = 'none'
  }

  var firstPagination = document.querySelector('.page-chooser.center')
  if (firstPagination) {
    firstPagination.style.display = 'none'
  }

  // Remove Type 1 (date rows) and Type 2 (area title rows) from the search results table
  var table = document.querySelector(
    'table.routetable.facet-results[data-actiontype="ascent"]'
  )
  if (table) {
    var rows = table.getElementsByTagName('tr')
    for (var i = rows.length - 1; i >= 0; i--) {
      var row = rows[i]
      if (row.querySelector('.group')) {
        row.parentNode.removeChild(row)
      }
    }
  }

  // Add a button to toggle between all ascents and ascents with beta information
  var titleElement = document.querySelector('.headline .heading__t')
  if (titleElement) {
    var toggleButton = document.createElement('button')
    toggleButton.textContent = 'Show Beta Ascents'
    toggleButton.style.marginLeft = '20px'
    toggleButton.style.padding = '3px 8px'
    toggleButton.style.cursor = 'pointer'
    toggleButton.style.fontSize = '14px'
    toggleButton.style.lineHeight = 'normal'
    toggleButton.style.border = '1px solid #ccc'
    toggleButton.style.borderRadius = '3px'
    toggleButton.style.backgroundColor = '#f0f0f0'

    // Determine the current state and set the initial button text
    var currentUrl = window.location.href
    var showingBeta = currentUrl.includes('/has/beta/')
    toggleButton.textContent = showingBeta
      ? 'Show All Ascents'
      : 'Show Beta Ascents'

    toggleButton.onclick = function () {
      var baseUrl = currentUrl.split('/ascents')[0] + '/ascents'
      if (showingBeta) {
        // Show all ascents
        window.location.href = baseUrl
      } else {
        // Show only ascents with beta
        window.location.href = baseUrl + '/has/beta/?sortby=when-climbed,desc'
      }
    }

    titleElement.appendChild(toggleButton)
  }
})()
