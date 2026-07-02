// ==UserScript==
// @name         theCrag - Ascent list - Cleanup
// @namespace    https://github.com/killakalle/userscripts
// @author       killakalle
// @version      0.5.0
// @description  Hides the search facet and pagination on the ascent list, removes certain rows from the search results table, adds the ascent date per row, and adds a button to toggle beta ascents.
// @match        *://www.thecrag.com/*/ascents*
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @grant        none
// @license      MIT
// @downloadURL  https://update.greasyfork.org/scripts/569076/theCrag%20-%20Ascent%20list%20-%20Cleanup.user.js
// @updateURL    https://update.greasyfork.org/scripts/569076/theCrag%20-%20Ascent%20list%20-%20Cleanup.meta.js
// ==/UserScript==

/*
  TODO SECTION:
  - Remove theCrag's automatic key word highlighting such as "crux", "good", etc. which can be misleading and is not user-configurable
*/

;(function () {
  'use strict'

  const currentUrl = window.location.href
  const isRouteView = currentUrl.includes('/route/')

  // 1. EXTRA ROBUST CLUTTER HIDING
  const directSelectors = [
    'form#facets',
    '.page-chooser',
    '.filter-group',
    '.regions__table > .regions__inner > div:first-child'
  ]
  directSelectors.forEach(s => {
    const el = document.querySelectorAll(s)
    el.forEach(e => (e.style.display = 'none'))
  })

  const allDivs = document.querySelectorAll('.regions__inner div')
  allDivs.forEach(div => {
    if (div.textContent.includes('Buscando en:')) {
      div.style.display = 'none'
    }
  })

  // 2. Process the table
  const table = document.querySelector(
    'table.routetable.facet-results[data-actiontype="ascent"]'
  )

  if (table) {
    const theadRow = table.querySelector('thead tr')

    // A. Add "Comentarios" and "Fecha" Headers
    if (theadRow && !document.getElementById('added-comment-header')) {
      const commentHeader = document.createElement('th')
      commentHeader.id = 'added-comment-header'
      commentHeader.textContent = 'Comentarios'
      theadRow.insertBefore(commentHeader, theadRow.cells[4])
    }

    if (theadRow && !document.getElementById('added-date-header')) {
      const dateHeader = document.createElement('th')
      dateHeader.id = 'added-date-header'
      dateHeader.textContent = 'Fecha'
      dateHeader.style.width = '100px'
      theadRow.appendChild(dateHeader)
    }

    // B. Force Layout and Widths
    if (theadRow) {
      table.style.tableLayout = 'fixed'
      table.style.width = '100%'

      if (theadRow.cells[3]) theadRow.cells[3].style.display = 'none'

      if (theadRow.cells[0]) theadRow.cells[0].style.width = '45px'
      if (theadRow.cells[1]) theadRow.cells[1].style.width = '55px'
      if (theadRow.cells[5]) theadRow.cells[5].style.width = '125px'
      if (theadRow.cells[6]) theadRow.cells[6].style.width = '120px'

      const viaHeader = theadRow.cells[2]
      const commentHeader = document.getElementById('added-comment-header')

      if (isRouteView) {
        if (viaHeader) viaHeader.style.display = 'none'
        if (commentHeader) commentHeader.style.width = 'auto'
      } else {
        if (viaHeader) viaHeader.style.width = '22%'
        if (commentHeader) commentHeader.style.width = '44%'
      }
    }

    // C. Process body rows
    const bodyRows = Array.from(table.querySelectorAll('tbody tr'))
    let currentDate = ''

    bodyRows.forEach(row => {
      // Group/Date header rows: capture the date, then remove the row
      const groupCell = row.querySelector('.group')
      if (groupCell) {
        const groupB = groupCell.querySelector('b')
        if (groupB) {
          const clone = groupB.cloneNode(true)
          const crumb = clone.querySelector('.crumbtrail-partial')
          if (crumb) crumb.remove()
          currentDate = clone.textContent.replace(/-\s*$/, '').trim()
        }
        row.remove()
        return
      }

      // Comment rows: move their content into the preceding ascent row, then remove
      if (row.classList.contains('comment-row')) {
        const prevRow = row.previousElementSibling
        const targetCell = prevRow
          ? prevRow.querySelector('.comment-cell')
          : null
        if (targetCell) {
          const commentBlocks = row.querySelectorAll('.event-item')
          commentBlocks.forEach(block => {
            const markdownDiv = block.querySelector('.markdown')
            if (markdownDiv) {
              const styleAttr = markdownDiv.getAttribute('style') || ''
              const isPrivate =
                /#f4f4f4/i.test(styleAttr) ||
                /rgb\(\s*244\s*,\s*244\s*,\s*244\s*\)/i.test(styleAttr)
              const wrapper = document.createElement('div')
              wrapper.style.marginBottom = '6px'
              if (isPrivate) {
                Object.assign(wrapper.style, {
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px dashed #666',
                  padding: '5px',
                  borderRadius: '4px',
                  fontSize: '11px'
                })
                wrapper.innerHTML = `<strong style="font-size:9px; color:#999; display:block;">PRIVATE</strong>${markdownDiv.innerHTML}`
              } else {
                wrapper.innerHTML = markdownDiv.innerHTML
              }
              targetCell.appendChild(wrapper)
            }
          })
        }
        row.remove()
        return
      }

      // Real ascent row
      if (row.cells[3]) row.cells[3].style.display = 'none'
      if (isRouteView && row.cells[2]) row.cells[2].style.display = 'none'

      // Ensure vertical alignment for all existing cells to fix misalignment
      Array.from(row.cells).forEach(cell => {
        cell.style.verticalAlign = 'top'
        cell.style.paddingTop = '8px'
      })

      // Create comment cell
      if (!row.querySelector('.comment-cell')) {
        const commentCell = row.insertCell(4)
        commentCell.className = 'comment-cell'
        Object.assign(commentCell.style, {
          fontSize: '12px',
          padding: '8px',
          paddingTop: '8px',
          verticalAlign: 'top',
          lineHeight: '1.4',
          overflow: 'hidden',
          wordWrap: 'break-word'
        })
      }

      // Add the ascent date, carried forward from the last .group row seen
      if (!row.querySelector('.date-cell')) {
        const dateCell = row.insertCell(-1)
        dateCell.className = 'date-cell'
        dateCell.textContent = currentDate
        Object.assign(dateCell.style, {
          fontSize: '12px',
          padding: '8px',
          verticalAlign: 'top',
          whiteSpace: 'nowrap'
        })
      }
    })
  }

  // 3. Beta Toggle Button
  const titleElement = document.querySelector('.headline .heading__t')
  if (titleElement && !document.getElementById('beta-toggle-btn')) {
    const toggleButton = document.createElement('button')
    toggleButton.id = 'beta-toggle-btn'
    const showingBeta = currentUrl.includes('/has/beta/')
    toggleButton.textContent = showingBeta
      ? 'Show All Ascents'
      : 'Show Beta Ascents'
    Object.assign(toggleButton.style, {
      marginLeft: '20px',
      padding: '3px 8px',
      cursor: 'pointer',
      fontSize: '14px',
      border: '1px solid #ccc',
      borderRadius: '3px',
      backgroundColor: '#f0f0f0',
      color: '#333'
    })
    toggleButton.onclick = function () {
      const baseUrl = currentUrl.split('/ascents')[0] + '/ascents'
      window.location.href = showingBeta
        ? baseUrl
        : baseUrl + '/has/beta/?sortby=when-climbed,desc'
    }
    titleElement.appendChild(toggleButton)
  }
})()
