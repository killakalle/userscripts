// ==UserScript==
// @name         theCrag - Route search - Quick text search
// @namespace    https://github.com/killakalle/userscripts
// @author       killakalle
// @version      0.1.0
// @description  Adds an always-visible route name search box with its own submit button right below the page title on route lists (…/routes), so you no longer need to open the "Text search" filter first or scroll down to "Apply filters" on mobile.
// @match        https://www.thecrag.com/*/routes*
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @grant        none
// @license      MIT
// ==/UserScript==

;(function () {
  'use strict'

  const form = document.querySelector('form#facets')
  const facet = form && form.querySelector('.facet[data-comp="search"]')
  const realInput = facet && facet.querySelector('.details input[type="text"]')
  const applyBtn = form && form.querySelector('button.go')
  const headline = document.querySelector('.headline')
  if (!facet || !realInput || !applyBtn || !headline) return
  if (document.getElementById('qs-bar')) return

  const lang = document.documentElement.lang || 'en'
  const t =
    lang.startsWith('es')
      ? { placeholder: 'Nombre de vía', button: 'Buscar' }
      : { placeholder: 'Route name', button: 'Search' }

  const style = document.createElement('style')
  style.textContent = `
    #qs-bar {
      display: flex;
      gap: 8px;
      align-items: stretch;
      margin: 10px 0 14px;
      max-width: 520px;
    }
    #qs-bar input {
      flex: 1 1 auto;
      min-width: 0;
      height: auto;
      margin: 0;
      padding: 8px 10px;
      font-size: 16px; /* >=16px prevents iOS zoom-on-focus */
      line-height: 1.3;
      box-sizing: border-box;
    }
    #qs-bar button {
      flex: 0 0 auto;
      margin: 0;
      padding: 8px 16px;
      font-size: 16px;
    }
    /* Our bar replaces the original text-search facet */
    form#facets .facet[data-comp="search"] { display: none !important; }
    @media (max-width: 767px) {
      #qs-bar { max-width: none; margin: 8px 8px 12px; }
    }
  `
  document.head.appendChild(style)

  const bar = document.createElement('form')
  bar.id = 'qs-bar'
  bar.setAttribute('role', 'search')

  const input = document.createElement('input')
  input.type = 'search'
  input.placeholder = t.placeholder
  input.value = realInput.value
  input.setAttribute('enterkeyhint', 'search')
  input.setAttribute('autocomplete', 'off')
  input.setAttribute('autocapitalize', 'off')
  input.setAttribute('autocorrect', 'off')
  input.setAttribute('spellcheck', 'false')
  input.setAttribute('aria-label', t.placeholder)

  const button = document.createElement('button')
  button.type = 'submit'
  button.className = 'btn btn-primary'
  button.textContent = t.button

  bar.append(input, button)
  headline.insertAdjacentElement('afterend', bar)

  // theCrag's facets.js builds the result URL in the global getFacetUrl(),
  // reading only facets that are `.open` and whose input is `:visible`.
  // The original text facet is hidden, so take it out of that loop and add
  // the `search/<text>/` segment from our box instead. Wrapping the global
  // also keeps the search text when "Aplicar filtros" is used directly.
  const base = '/' + form.dataset.base + '/'
  const wrapFacetUrl = () => {
    const orig = window.getFacetUrl
    if (typeof orig !== 'function' || orig.__qsWrapped) return
    const wrapped = function () {
      facet.classList.remove('open')
      const url = orig.apply(this, arguments)
      const q = input.value.trim()
      if (!q || !url.startsWith(base)) return url
      return base + 'search/' + encodeURIComponent(q) + '/' + url.slice(base.length)
    }
    wrapped.__qsWrapped = true
    window.getFacetUrl = wrapped
  }
  wrapFacetUrl()
  window.addEventListener('load', wrapFacetUrl)

  bar.addEventListener('submit', e => {
    e.preventDefault()
    wrapFacetUrl()
    applyBtn.click()
  })

  // Focus on desktop only: on phones this would pop up the keyboard on every page load
  if (window.matchMedia('(pointer: fine)').matches) {
    input.focus()
    input.setSelectionRange(input.value.length, input.value.length)
  }
})()
