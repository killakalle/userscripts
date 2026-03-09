// ==UserScript==
// @name         theCrag – Remove route creation clutter
// @namespace    https://github.com/killakalle/userscripts
// @author       killakalle
// @version      1.2.1
// @description  Minimal view: Name + Registered Grade + Visual Grade Output, hides Context field and label, global toggle, autofocus first input only once
// @match        https://www.thecrag.com/*
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @grant        none
// @license      MIT
// @downloadURL  https://update.greasyfork.org/scripts/569074/theCrag%20%E2%80%93%20Remove%20route%20creation%20clutter.user.js
// @updateURL    https://update.greasyfork.org/scripts/569074/theCrag%20%E2%80%93%20Remove%20route%20creation%20clutter.meta.js
// ==/UserScript==

;(function () {
  'use strict'

  const params = new URLSearchParams(window.location.search)
  if (params.get('C:State') !== '2059') return

  let minimal = true
  let firstFocusDone = false // <-- NEW: track initial focus

  function show (el) {
    if (el) el.style.display = ''
  }
  function hide (el) {
    if (el) el.style.display = 'none'
  }
  function showUp (el, stop) {
    while (el && el !== stop && el.nodeType === 1) {
      el.style.display = ''
      el = el.parentElement
    }
  }

  function apply () {
    document.querySelectorAll('.update-element').forEach(route => {
      // hide everything first
      route.querySelectorAll('*').forEach(hide)

      if (!minimal) {
        route.querySelectorAll('*').forEach(show)
        return
      }

      // NAME
      const nameInput = route.querySelector('input[name^="D:Name-"]')
      if (nameInput) {
        show(nameInput)
        showUp(nameInput, route)
        const nameLabel = route.querySelector('.label-name')
        if (nameLabel) {
          show(nameLabel)
          showUp(nameLabel, route)
        }
      }

      // REGISTERED GRADE INPUT + LABEL
      const gradeInput = route.querySelector(
        'input[name^="D:RegisteredGradeText-"]'
      )
      if (gradeInput) {
        show(gradeInput)
        showUp(gradeInput, route)
        const gradeLabel = gradeInput
          .closest('.bulkedit-control')
          ?.querySelector('.label-general')
        if (gradeLabel) {
          show(gradeLabel)
          showUp(gradeLabel, route)
        }
      }

      // VISUAL GRADE OUTPUT
      route.querySelectorAll('.route-grade-output').forEach(el => {
        show(el)
        showUp(el, route)
        el.querySelectorAll('.grade').forEach(inner => {
          show(inner)
          showUp(inner, route)
        })
      })

      // HIDE CONTEXT COMPLETELY
      route.querySelectorAll('select[name^="D:Context-"]').forEach(select => {
        const bulkControl = select.closest('.bulkedit-control')
        if (bulkControl) hide(bulkControl)
      })
    })

    // Auto-focus first Name input only once
    if (!firstFocusDone) {
      const firstNameInput = document.querySelector('input[name^="D:Name-"]')
      if (firstNameInput) {
        firstNameInput.focus()
        firstFocusDone = true // <-- never focus again
      }
    }

    // Keep save / action buttons visible
    document.querySelectorAll('.standardButton').forEach(show)
  }

  function addToggle () {
    if (document.getElementById('crag-minimal-toggle')) return

    const saveBtn = document.querySelector('.standardButton')
    if (!saveBtn) return

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.id = 'crag-minimal-toggle'
    btn.textContent = 'Show all fields'
    btn.style.marginLeft = '10px'
    btn.style.cursor = 'pointer'

    btn.onclick = () => {
      minimal = !minimal
      btn.textContent = minimal ? 'Show all fields' : 'Minimal fields'
      apply()
    }

    saveBtn.appendChild(btn)
  }

  const observer = new MutationObserver(() => {
    addToggle()
    apply()
  })
  observer.observe(document.body, { childList: true, subtree: true })

  addToggle()
  apply()
})()
