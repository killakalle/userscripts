// ==UserScript==
// @name         theCrag - List - Sort by area and grade
// @namespace    https://github.com/killakalle/userscripts
// @author       killakalle
// @version      0.1.0
// @description  Adds a "Ordenar por zona y grado" button to your own route lists. It sorts all routes by area path (crag, sector, A-Z) and then by grade (hard to easy, slash grades like 7a+/b sit between their neighbours) and saves the new order to theCrag in one go.
// @match        *://www.thecrag.com/*/lista/*
// @match        *://www.thecrag.com/*/list/*
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @grant        none
// @license      MIT
// ==/UserScript==

;(function () {
  'use strict'

  const container = document.querySelector('.node-listview')
  if (!container || !container.querySelector('.list-item')) return

  // theCrag only prints these in an inline script, and only for list owners/editors.
  const pageSource = [...document.scripts].map(s => s.textContent).join('\n')
  const acctMatch = pageSource.match(/var\s+acctid\s*=\s*(\d+)/)
  const listMatch =
    pageSource.match(/var\s+listId\s*=\s*(\d+)/) ||
    location.pathname.match(/\/(?:lista|list)\/(\d+)/)
  if (!acctMatch || !listMatch || typeof window.postAPI !== 'function') return
  const acctId = Number(acctMatch[1])
  const listId = Number(listMatch[1])

  // ---------- Grade parsing (French sport grades) ----------
  // Scale index: 6 steps per number: a, a+, b, b+, c, c+
  const gradeIndex = (num, letter, plus) =>
    Number(num) * 6 + 'abc'.indexOf(letter) * 2 + (plus ? 1 : 0)

  function parseGrade(text) {
    const parts = text.trim().toLowerCase().split('/')
    let num = null
    const values = []
    for (const part of parts) {
      let m = part.match(/^(\d+)([abc])(\+?)$/)
      if (m) {
        num = m[1]
        values.push(gradeIndex(m[1], m[2], m[3]))
        continue
      }
      m = part.match(/^([abc])(\+?)$/) // "7a+/b": inherit the number
      if (m && num !== null) {
        values.push(gradeIndex(num, m[1], m[2]))
        continue
      }
      return Infinity
    }
    if (!values.length) return Infinity
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  // ---------- Collect items with their area path ----------
  // theCrag only prints the breadcrumb when the area changes, so carry it forward.
  function collect() {
    const items = []
    let path = ''
    container.querySelectorAll('.crumbtrail_group, .list-item').forEach(el => {
      if (el.classList.contains('crumbtrail_group')) {
        path = [...el.querySelectorAll('a')]
          .map(a => a.textContent.trim())
          .join(' > ')
        return
      }
      const gradeEl = el.querySelector('.r-grade [class*="gb"]')
      items.push({
        id: Number(el.dataset.iid),
        path,
        grade: gradeEl ? parseGrade(gradeEl.textContent) : Infinity,
        name: (el.querySelector('.primary-node-name') || {}).textContent || ''
      })
    })
    return items
  }

  const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true })

  // Hardest first; unparsable grades (Infinity) go last.
  const gradeOrder = (a, b) => {
    if (a === b) return 0
    if (a === Infinity) return 1
    if (b === Infinity) return -1
    return b - a
  }

  function sortedItems() {
    return collect().sort(
      (a, b) =>
        collator.compare(a.path, b.path) ||
        gradeOrder(a.grade, b.grade) ||
        collator.compare(a.name, b.name)
    )
  }

  // ---------- Save ----------
  function save(button) {
    const sorted = sortedItems()
    const items = sorted.map((it, i) => ({ id: it.id, sequence: i + 1 }))
    if (!confirm(`Sort ${items.length} routes by area, then grade?`)) return

    button.textContent = 'Saving… (can take a minute or two)'
    button.disabled = true
    // The bulk save is slow server-side; reload even if the callback never fires.
    setTimeout(() => location.reload(), 150000)

    const payload = JSON.stringify({
      data: { submittor: acctId, list: listId, items }
    })
    window.postAPI(
      '/api/list/update?markupType=html',
      payload,
      () => location.reload(),
      (jqXHR, status, err) => {
        button.textContent = 'Ordenar por zona y grado'
        button.disabled = false
        alert(`Sorting failed: ${err} ${status}\n${jqXHR.responseText || ''}`)
      }
    )
  }

  // ---------- Button ----------
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'btn btn-mini'
  button.textContent = 'Ordenar por zona y grado'
  button.style.margin = '0 0 8px 0'
  button.addEventListener('click', () => save(button))
  container.parentNode.insertBefore(button, container)

  // Handy for checking the planned order without saving.
  window.__listSortPreview = () =>
    sortedItems().map(
      (it, i) => `${i + 1}\t${it.path}\t${it.grade}\t${it.name}`
    )
})()
