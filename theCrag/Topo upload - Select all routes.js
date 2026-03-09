// ==UserScript==
// @name         theCrag - Topo upload - Select all routes
// @namespace    https://github.com/killakalle/userscripts
// @version      0.2
// @description  Checkbox to conveniently de-/select all routes when adding topos
// @author       killakalle
// @match        https://www.thecrag.com/CIDS/cgi-bin/cids.cgi*AState=17515*
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @grant        none
// @license      MIT
// @run-at       document-idle
// ==/UserScript==

;(function () {
  'use strict'

  function init () {
    const table = document.querySelector('.process-table')
    if (!table || document.getElementById('selectAll')) return

    // 1. Add checkbox to the Header
    const headerRow = table.querySelector('thead tr')
    if (headerRow) {
      const th = document.createElement('th')
      th.innerHTML =
        '<input type="checkbox" id="selectAll" title="Select/Deselect All">'
      headerRow.prepend(th)
    }

    // 2. Add empty cells to Body rows to maintain table alignment
    const bodyRows = table.querySelectorAll('tbody tr')
    bodyRows.forEach(row => {
      const td = document.createElement('td')
      // If the row already has a checkbox in the first column, we might not need to prepend.
      // But usually, these tables need the extra cell for the "Select All" column.
      td.style.textAlign = 'center'
      row.prepend(td)
    })

    // 3. Logic to toggle all checkboxes
    document
      .getElementById('selectAll')
      .addEventListener('change', function (e) {
        const checkboxes = table.querySelectorAll(
          'tbody input[type="checkbox"]'
        )
        checkboxes.forEach(cb => {
          cb.checked = e.target.checked
        })
      })
  }

  // Run immediately and again after a short delay for dynamic content
  init()
  setTimeout(init, 1000)
})()
