// ==UserScript==
// @name         theCrag - Log ascent - Modern form
// @namespace    https://github.com/killakalle/userscripts
// @author       killakalle
// @version      0.1.0
// @description  Replaces the clunky "Registrar ascensión" modal with a compact two-column layout (one column on phones): colour-coded tick tiles, theCrag's own icons, auto-growing comment boxes, attempts 1–4, tag chips (Cintas puestas only for Deportiva A vista/Flash), and Avanzado (name/grade/length overrides) behind an expander. Only sport, second and boulder styles are offered. It rearranges and restyles theCrag's own controls instead of re-implementing them, so saving works exactly as before. A "Formulario original" link switches back to theCrag's form and the choice is remembered.
// @match        https://www.thecrag.com/*
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

;(function () {
  'use strict'

  // With @grant, Tampermonkey runs us in a sandbox: theCrag's jQuery (and the
  // select2 / bootstrap plugins hanging off it) live on the page's window.
  const W = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window
  const modal = document.getElementById('log-ascent-modal')
  const $ = W.jQuery
  if (!modal || !$) return
  if (modal.dataset.tclInit) return
  modal.dataset.tclInit = '1'

  const PREF_KEY = 'useOriginalForm'
  const getUseOriginal = () => {
    try { return !!GM_getValue(PREF_KEY, false) } catch (e) { return false }
  }
  const setUseOriginal = v => {
    try { GM_setValue(PREF_KEY, v) } catch (e) {}
  }

  const es = (document.documentElement.lang || 'es').startsWith('es')
  const t = es
    ? { original: 'Formulario original', originalShort: 'Original', modern: 'Diseño nuevo', attempts: 'Intentos', tags: 'Tags', hasText: 'con texto', empty: 'vacío', advHint: 'nombre, grado, longitud', duplicate: 'Duplicar' }
    : { original: 'Original form', originalShort: 'Original', modern: 'New design', attempts: 'Attempts', tags: 'Tags', hasText: 'has text', empty: 'empty', advHint: 'name, grade, length', duplicate: 'Duplicate' }

  // Tick types and climbing styles I never use. They stay visible when an
  // existing ascent already uses them, so editing never changes them silently.
  const HIDDEN_TICKS = ['allfreewithrest', 'groundupredpoint', 'leadsolo', 'working', 'repeat']
  const SHOWN_STYLES = ['sport', 'second', 'boulder']
  // Tag chips: select2 option value → shown only when `when` is true (or already set)
  const CHIPS = [
    { tag: 'Gear on', when: () => gearOnApplies() },
    { tag: 'Kneepad' },
    { tag: 'Crack glove' }
  ]
  const TICK_COLORS = {
    onsight: '#60a5fa', flash: '#fbbf24', redpoint: '#f43f5e', pinkpoint: '#f472b6',
    clean: '#2dd4bf', send: '#4ade80', dab: '#c4b5fd', dog: '#d39a6a',
    attempt: '#94a3b8', retreat: '#7b8ba1', tick: '#a5b4fc', repeat: '#4ade80', working: '#94a3b8'
  }
  const DIFF_SHORT = es
    ? { soft: 'Bajar', easy: 'Fácil', average: 'Justo', hard: 'Duro', sand: 'Subir' }
    : { soft: 'Lower', easy: 'Easy', average: 'Spot on', hard: 'Hard', sand: 'Raise' }

  // ---------------------------------------------------------------- styles
  const P = '#log-ascent-modal.tcl-on'
  const style = document.createElement('style')
  style.id = 'tcl-style'
  style.textContent = `
    ${P} {
      --tcl-surface: #002137; --tcl-raised: #002e4e; --tcl-raised2: #003a61; --tcl-line: #0d4a73;
      --tcl-text: #dce8f0; --tcl-muted: #86a2b6; --tcl-faint: #55748a;
      --tcl-primary: #22c3b0; --tcl-primary-ink: #00231f; --tcl-focus: #7dd3fc;
      --tcl-amber: #f59e0b; --tcl-amber-ink: #241500;
      background: var(--tcl-surface) !important; color: var(--tcl-text);
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-size: 15px;
      border: 1px solid var(--tcl-line); border-radius: 12px; box-shadow: 0 24px 60px rgba(0,0,0,.5);
      flex-direction: column; overflow: hidden;
      width: min(1060px, calc(100vw - 32px)); left: 50%; margin: 0; transform: translateX(-50%);
      max-height: calc(100vh - 48px);
    }
    /* Flex layout only while open: a closed modal must keep Bootstrap's
       display:none, or the invisible modal sits on top of the page and
       swallows clicks (e.g. on "Registrar ascensión"). */
    ${P}.in { display: flex !important; top: 24px !important; }
    ${P}.fade { transition: opacity .2s linear; top: 24px; }
    ${P} *, ${P} *::before, ${P} *::after { box-sizing: border-box; }

    /* header */
    ${P} .modal-header { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-bottom: 1px solid var(--tcl-line); background: transparent; }
    ${P} .modal-header .modal-title { order: 0; flex: 1; min-width: 0; margin: 0; text-align: left; font-size: 19px; line-height: 1.3; color: var(--tcl-text); }
    ${P} .modal-header .modal-pagination { order: 1; color: var(--tcl-muted); font-size: 13px; }
    ${P} .modal-header .tcl-orig-head { order: 2; display: none; }
    ${P} .modal-header .close { order: 3; float: none; margin: 0; width: 40px; height: 40px; font-size: 24px; line-height: 1; border-radius: 8px; color: var(--tcl-muted) !important; opacity: 1 !important; }
    ${P} .modal-header .close:hover { background: var(--tcl-raised); color: var(--tcl-text) !important; }

    /* body + two columns */
    ${P} .modal-body { flex: 1 1 auto; max-height: none !important; overflow-y: auto; padding: 16px 18px; }
    ${P} .log-ascent-main-area { display: none !important; }
    ${P} .tcl-panel { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 16px 28px; }
    ${P} .tcl-col { display: grid; gap: 14px; align-content: start; min-width: 0; }
    ${P} .tcl-row { display: flex; gap: 10px; min-width: 0; }
    ${P} .tcl-row > :last-child { flex: 1; min-width: 0; }
    ${P} .tcl-pair { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 20px; align-items: start; }
    ${P} .tcl-panel .tc-modal__form-group { display: grid; gap: 6px; margin: 0; padding: 0; min-width: 0; align-content: start; }
    ${P} .tcl-panel .tc-modal__form-controls { margin: 0; padding: 0; min-width: 0; }
    ${P} .tc-modal__form-label, ${P} .tcl-lbl {
      margin: 0; padding: 0; font-size: 12px; font-weight: 600; line-height: 18px; color: var(--tcl-muted);
      letter-spacing: .04em; text-transform: uppercase; background: none;
    }
    ${P} .log-ascent-warning:empty, ${P} .log-ascent-previous-ascents:empty { display: none; }
    ${P} .log-ascent-warning, ${P} .log-ascent-previous-ascents { margin: 0 0 12px; }

    /* text inputs */
    ${P} .tcl-panel input[type=text], ${P} .tcl-panel input[type=date], ${P} .tcl-panel textarea {
      width: 100%; min-height: 44px; height: auto; margin: 0; background: var(--tcl-raised) !important; color: var(--tcl-text) !important;
      border: 1px solid var(--tcl-line) !important; border-radius: 8px; padding: 10px 12px; font: inherit; font-size: 16px; line-height: 1.45; box-shadow: none;
    }
    ${P} .tcl-panel textarea { resize: none; overflow: hidden; font-family: inherit !important; }
    ${P} .tcl-panel textarea::placeholder, ${P} .tcl-panel input::placeholder { color: var(--tcl-faint); font-family: inherit; }
    ${P} #ascent-input-public-comment { min-height: 140px !important; }
    ${P} #ascent-input-private-comment { min-height: 104px !important; }
    ${P} .markdown-preview .markedup { display: none !important; }
    ${P} .markdown-preview { display: block; width: 100%; }
    ${P} .markdown-preview textarea { display: block; width: 100% !important; }
    ${P} .tcl-panel input:focus, ${P} .tcl-panel textarea:focus, ${P} button:focus-visible, ${P} [tabindex]:focus-visible { outline: 2px solid var(--tcl-focus); outline-offset: 1px; }

    /* date */
    ${P} .date-wrapper { display: flex; gap: 6px; align-items: center; }
    ${P} .date-wrapper input.date-today { width: auto; min-width: 0; cursor: pointer; }
    ${P} .date-wrapper input.date-select { width: auto; color-scheme: dark; }
    ${P} .date-wrapper .fn-unlock-date-for-partial { min-height: 44px; min-width: 40px; }

    /* select2 (Con quién) */
    ${P} .select2-container-multi .select2-choices {
      min-height: 44px; padding: 4px 6px; background: var(--tcl-raised) !important; background-image: none !important;
      border: 1px solid var(--tcl-line) !important; border-radius: 8px; box-shadow: none;
    }
    ${P} .select2-container-multi .select2-choices .select2-search-field input { min-height: 34px; padding: 4px 6px; font-size: 16px; color: var(--tcl-text); background: transparent !important; border: 0 !important; }
    ${P} .select2-container-multi .select2-choices .select2-search-choice { margin: 4px 4px 0 0; padding: 5px 8px 5px 20px; border-radius: 999px; background: var(--tcl-raised2); background-image: none; color: var(--tcl-text); border: 1px solid var(--tcl-line); box-shadow: none; }
    ${P} .select2-container-multi.select2-container-active .select2-choices { border-color: var(--tcl-focus) !important; }

    /* tick type: label + style switch on one row */
    ${P} .tcl-g-tick { grid-template-columns: minmax(0, 1fr) auto; align-items: center; column-gap: 8px; }
    ${P} .tcl-g-tick > .tc-modal__form-controls, ${P} .tcl-g-tick .ascent-tick-wrapper { display: contents; }
    ${P} .tcl-g-tick > .tc-modal__form-label { grid-row: 1; grid-column: 1; }
    ${P} .tcl-g-tick .climbed-gear-style-wrapper { grid-row: 1; grid-column: 2; }
    ${P} .tcl-g-tick .tick-type-wrapper { grid-column: 1 / -1; }
    ${P} .tick-description-wrapper, ${P} .tick-selected-arrow, ${P} .log-ascent-ecopoint { display: none !important; }
    ${P} .gear-style-selector { display: inline-flex; gap: 2px; padding: 3px; background: var(--tcl-raised); border: 1px solid var(--tcl-line); border-radius: 8px; }
    ${P} .gear-style-selection {
      display: inline-flex; align-items: center; min-height: 32px; margin: 0; padding: 6px 12px; border: 0 !important; border-radius: 6px;
      font-size: 13.5px; font-weight: 500; color: var(--tcl-muted) !important; background: transparent; cursor: pointer; text-transform: none; letter-spacing: 0;
    }
    ${P} .gear-style-selection > span { display: none; }
    ${P} .gear-style-selection.gear-style-selected { background: var(--tcl-raised2); color: var(--tcl-text) !important; box-shadow: inset 0 0 0 1px var(--tcl-line); }
    ${P} .gear-style-selector.tcl-single { pointer-events: none; }
    ${SHOWN_STYLES.map(s => `${P} .gear-style-selection[data-gear-style="${s}"]`).join(',')} { display: inline-flex; }
    ${P} .gear-style-selection:not(.gear-style-selected):not(${SHOWN_STYLES.map(s => `[data-gear-style="${s}"]`).join('):not(')}) { display: none; }

    /* tick tiles */
    ${P} .tick-selector { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 0; }
    ${P} .tick-selector[data-count="6"] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    ${P} .tick-selector[data-count="5"] { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    ${P} .tick-selector[data-count="5"] .tick-selection { flex-direction: column; justify-content: center; text-align: center; gap: 6px; padding: 6px 2px; }
    ${P} .tick-selection {
      --c: #a5b4fc; display: flex; align-items: center; gap: 7px; width: auto; min-height: 48px; margin: 0; padding: 8px;
      border: 1px solid var(--tcl-line); border-radius: 8px; background: var(--tcl-raised) !important; color: var(--tcl-text);
      cursor: pointer; text-align: left; line-height: 1.15; vertical-align: top;
    }
    ${P} .tick-selection:hover { border-color: var(--c); }
    /* .tick-selected variant outranks Cerulean Tide's !important glow on the selected icon */
    ${P} .tick-selection .tick-icon-container, ${P} .tick-selection.tick-selected .tick-icon-container, ${P} .tick-selection .tick-icon {
      display: flex; align-items: center; justify-content: center; position: static; margin: 0; padding: 0;
      border: 0 !important; box-shadow: none !important; background: none !important; flex: none;
    }
    ${P} .tick-selection .tick-icon-container { width: 22px; height: 20px; }
    ${P} .tick-selection .tick-icon { width: auto; height: auto; }
    ${P} .tick-selection .tick-text { margin: 0; padding: 0; font-size: 14px; font-weight: 500; color: var(--tcl-text) !important; white-space: normal; overflow-wrap: anywhere; }
    ${P} .tick-selection.tick-selected {
      background: color-mix(in srgb, var(--c) 24%, var(--tcl-raised)) !important; border-color: var(--c);
      box-shadow: inset 0 0 0 1px var(--c);
    }
    ${P} .tick-selection.tick-selected .tick-text { font-weight: 700 !important; }
    /* "Colgándose" wraps on a tile; show the shorter climbing term instead */
    ${P} .tick-selection[data-tick="dog"] .tick-text { font-size: 0 !important; }
    ${P} .tick-selection[data-tick="dog"] .tick-text::after { content: "Hangdog"; font-size: 14px; }
    ${HIDDEN_TICKS.map(k => `${P} .tick-selection[data-tick="${k}"]:not(.tick-selected)`).join(',')} { display: none; }
    ${Object.entries(TICK_COLORS).map(([k, c]) => `${P} .tick-selection[data-tick="${k}"] { --c: ${c}; }`).join('\n    ')}

    /* quality: label + selected name on one row */
    ${P} .tcl-g-quality { grid-template-columns: auto minmax(0, 1fr); align-items: center; column-gap: 8px; }
    ${P} .tcl-g-quality > .tc-modal__form-controls, ${P} .tcl-g-quality .quality-wrapper { display: contents; }
    ${P} .tcl-g-quality > .tc-modal__form-label { grid-row: 1; grid-column: 1; }
    ${P} .tcl-g-quality .quality-description-wrapper {
      grid-row: 1; grid-column: 2; margin: 0; padding: 0; background: none !important; color: var(--tcl-text) !important;
      font-size: 13px; font-weight: 500; line-height: 18px; min-height: 0; text-align: left;
    }
    ${P} .tcl-g-quality .quality-select-wrapper { grid-column: 1 / -1; }
    ${P} div.quality-selector { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; width: 100%; }
    ${P} .quality-selection { display: grid; place-items: center; min-height: 44px; margin: 0; padding: 0; border: 1px solid var(--tcl-line); border-radius: 8px; background: var(--tcl-raised); cursor: pointer; }
    ${P} .quality-selection .quality-icon-container, ${P} .quality-selection .quality-icon { position: static; margin: 0; padding: 0; border: 0 !important; background: none !important; box-shadow: none !important; width: auto; height: auto; }
    ${P} .quality-selection .quality-selector { display: block; width: 28px; height: 28px; background-size: contain; background-repeat: no-repeat; filter: grayscale(.9) opacity(.7); }
    ${P} .quality-selection:hover .quality-selector, ${P} .quality-selection.quality-selected .quality-selector { filter: none; }
    ${P} .quality-selection.quality-selected { background: var(--tcl-raised2); border-color: #f5c451; box-shadow: inset 0 0 0 1px #f5c451; }

    /* difficulty feedback */
    ${P} .difficulties-wrapper { display: grid; gap: 8px; }
    ${P} .difficulty-wrapper { margin: 0; padding: 0; border: 0; background: none; }
    ${P} .difficulty-controls-wrapper { display: grid; grid-template-columns: 30px minmax(0, 1fr) 30px; gap: 6px; align-items: stretch; }
    ${P} .difficulty-adjustor { display: grid; place-items: center; margin: 0; padding: 0; border: 0 !important; border-radius: 6px; background: none; cursor: pointer; }
    ${P} .difficulty-adjustor:hover { background: var(--tcl-raised); }
    ${P} .difficulty-adjustor img { width: 18px; height: 18px; }
    ${P} .difficulty-select-wrapper { min-width: 0; margin: 0; }
    ${P} .difficulty-rating-selector { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
    ${P} .difficulty-rating-selection { display: block; height: auto; margin: 0; padding: 0; min-width: 0; border: 1px solid var(--tcl-line) !important; border-radius: 8px; background: var(--tcl-raised); cursor: pointer; box-shadow: none !important; }
    ${P} .difficulty-rating-item { display: grid; gap: 1px; justify-items: center; align-content: center; min-height: 52px; padding: 6px 4px; margin: 0; border: 0; background: none; }
    ${P} .difficulty-rating-item-grade { font-size: 16px; font-weight: 600; color: var(--tcl-text); line-height: 1.2; }
    ${P} .difficulty-rating-item-grade .grade { background: none !important; color: inherit !important; padding: 0; font: inherit; border: 0; box-shadow: none; }
    ${P} .difficulty-rating-item-text { display: block !important; height: auto; max-height: none; overflow: visible; font-size: 11px; font-weight: 400; color: var(--tcl-muted); line-height: 1.15; text-align: center; }
    ${P} .difficulty-rating-selection.difficulty-rating-selected { background: var(--tcl-amber); border-color: var(--tcl-amber) !important; }
    ${P} .difficulty-rating-selection.difficulty-rating-selected .difficulty-rating-item-grade,
    ${P} .difficulty-rating-selection.difficulty-rating-selected .difficulty-rating-item-text { color: var(--tcl-amber-ink); }
    ${P} .difficulty-description-wrapper { display: none !important; }

    /* attempts: 1-4 only (a higher saved value still shows) */
    ${P} .attempts-wrapper { display: flex; gap: 6px; align-items: stretch; }
    ${P} .attempts-buttons { display: grid; grid-auto-flow: column; grid-auto-columns: 48px; gap: 6px; }
    ${P} .attempt-button {
      display: grid; place-items: center; min-height: 44px; margin: 0; padding: 0; border: 1px solid var(--tcl-line) !important; border-radius: 8px;
      background: var(--tcl-raised); color: var(--tcl-text); font-size: 16px; cursor: pointer; float: none; width: auto;
    }
    ${P} .attempt-button.selected { background: var(--tcl-text); color: var(--tcl-surface); font-weight: 700; border-color: var(--tcl-text) !important; }
    ${P} .attempt-button:nth-child(n+5):not(.selected) { display: none; }
    ${P} .attempts-wrapper .number-attempts { display: none; }
    ${P} .attempts-wrapper.tcl-big .number-attempts { display: block; width: 64px; text-align: center; }

    /* tag chips */
    ${P} .tcl-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    ${P} .tcl-chip {
      display: inline-flex; align-items: center; gap: 6px; min-height: 44px; margin: 0; padding: 0 12px; border-radius: 999px;
      border: 1px solid var(--tcl-line); background: var(--tcl-raised); color: var(--tcl-muted); font: inherit; font-size: 14px; cursor: pointer;
    }
    ${P} .tcl-chip::before { content: "+"; font-weight: 600; color: var(--tcl-faint); }
    ${P} .tcl-chip[aria-pressed="true"] { background: var(--tcl-raised2); border-color: var(--tcl-primary); color: var(--tcl-text); }
    ${P} .tcl-chip[aria-pressed="true"]::before { content: "✓"; color: var(--tcl-primary); }
    ${P} .tcl-chip.tcl-ctx { border-style: dashed; }
    ${P} .tcl-chip.tcl-ctx[aria-pressed="true"] { border-style: solid; }
    ${P} .tcl-chip[hidden] { display: none; }

    /* disclosures: private comment (phone only) and Avanzado */
    ${P} .tcl-toggles { display: grid; gap: 8px; }
    ${P} .tcl-disc { border: 1px dashed var(--tcl-line); border-radius: 8px; min-width: 0; }
    ${P} .tcl-disc-btn {
      width: 100%; display: flex; align-items: center; gap: 8px; min-height: 42px; margin: 0; padding: 0 12px;
      background: transparent; border: 0; color: var(--tcl-muted); font: inherit; font-size: 14px; cursor: pointer; text-align: left;
    }
    ${P} .tcl-disc-btn .tcl-car { display: inline-block; transition: transform .15s; }
    ${P} .tcl-disc[data-open="true"] .tcl-disc-btn .tcl-car { transform: rotate(90deg); }
    ${P} .tcl-disc-btn .tcl-hint { margin-left: auto; font-size: 12px; color: var(--tcl-faint); }
    ${P} .tcl-disc-panel { padding: 0 12px 12px; display: grid; gap: 12px; }
    ${P} .tcl-disc[data-open="false"] .tcl-disc-panel { display: none; }
    ${P} .tcl-adv .tc-modal__form-group { display: grid !important; }
    ${P}.tcl-gym .tcl-adv .hide-if-gym { display: none !important; }
    ${P} .tcl-adv label:not(.tc-modal__form-label) { display: flex; align-items: center; gap: 10px; min-height: 36px; margin: 0; font-size: 14px; color: var(--tcl-text); }
    ${P} .tcl-adv input[type=checkbox] { width: 20px; height: 20px; margin: 0; accent-color: var(--tcl-primary); flex: none; }
    ${P} .tcl-adv .route-grade-output { display: block; margin-top: 4px; color: var(--tcl-muted); font-size: 13px; }
    ${P} .tcl-adv .tc-modal__form-controls { display: grid; gap: 6px; }
    /* on a laptop the private comment is simply open */
    ${P} .tcl-priv { border: 0; }
    ${P} .tcl-priv > .tcl-disc-btn { display: none; }
    ${P} .tcl-priv .tc-modal__form-group { display: grid !important; }

    /* footer */
    ${P} .modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 12px 18px; margin: 0; border-top: 1px solid var(--tcl-line); background: var(--tcl-surface) !important; box-shadow: none; border-radius: 0; }
    ${P} .modal-footer > .btn { float: none !important; margin: 0 !important; }
    ${P} .modal-footer::before, ${P} .modal-footer::after, ${P} .modal-header::before, ${P} .modal-header::after { display: none !important; content: none; }
    ${P} .modal-footer > .btn:not(.action-btn) { display: none; }
    ${P} .modal-footer .tcl-orig-foot { margin-right: auto !important; }
    ${P} .modal-footer .action-btn {
      min-height: 46px; width: auto; flex: none; white-space: nowrap; padding: 0 18px; border-radius: 9px; font-size: 15px; font-weight: 600; text-shadow: none;
      background: var(--tcl-raised) !important; background-image: none !important; color: var(--tcl-text) !important; border: 1px solid var(--tcl-line) !important; box-shadow: none;
    }
    ${P} .modal-footer .fn-complete-log-ascent { background: var(--tcl-primary) !important; border-color: var(--tcl-primary) !important; color: var(--tcl-primary-ink) !important; }
    ${P} .modal-footer .fn-complete-log-ascent:hover { filter: brightness(1.08); }
    ${P} .modal-footer .action-btn.disabled { opacity: .5; }
    ${P} .modal-footer .fn-log-ascent-nav-back, ${P} .modal-footer .fn-log-ascent-nav-forward { min-width: 46px; padding: 0 12px; }

    /* "Formulario original" / "Diseño nuevo" links */
    .tcl-switch {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 4px; margin: 0; background: none; border: 0; cursor: pointer;
      font: inherit; font-size: 13px; white-space: nowrap; color: #55748a; text-decoration: underline; text-decoration-color: #0d4a73; text-underline-offset: 3px;
    }
    .tcl-switch:hover { color: #86a2b6; }
    #log-ascent-modal:not(.tcl-on) .tcl-orig-head, #log-ascent-modal:not(.tcl-on) .tcl-orig-foot { display: none; }
    ${P} .tcl-new-foot { display: none; }
    #log-ascent-modal:not(.tcl-on) .tcl-new-foot { float: left; margin-right: 8px; }

    /* ---------- tablets and phones: one column, full screen ---------- */
    @media (max-width: 760px) {
      ${P}, ${P}.in { top: 0 !important; }
      ${P} { left: 0; right: 0; bottom: 0; width: 100%; max-width: none; height: 100%; height: 100dvh; max-height: none; margin: 0; transform: none; border: 0; border-radius: 0; }
      ${P} .modal-body { padding: 12px 14px; }
      ${P} .tcl-panel { grid-template-columns: minmax(0, 1fr); gap: 10px; }
      ${P} .tcl-col { gap: 10px; }
      ${P} .modal-header { padding: 8px 10px 8px 14px; gap: 6px; }
      ${P} .modal-header .modal-title { font-size: 16px; }
      ${P} .modal-header .tcl-orig-head { display: inline-flex; text-decoration: none; }
      ${P} .modal-footer { padding: 10px 14px calc(10px + env(safe-area-inset-bottom, 0px)); gap: 8px; }
      ${P} .modal-footer .tcl-orig-foot { display: none; }
      ${P} .modal-footer .fn-complete-log-ascent { flex: 1; }
      ${P} .modal-footer .fn-clone-log-ascent { font-size: 0 !important; }
      ${P} .modal-footer .fn-clone-log-ascent::after { content: "${t.duplicate}"; font-size: 15px; }
      ${P} #ascent-input-public-comment { min-height: 84px !important; }
      ${P} #ascent-input-private-comment { min-height: 96px !important; }
      ${P} .tcl-pair { grid-template-columns: minmax(0, 1fr); gap: 10px; }
      ${P} .attempts-buttons { grid-auto-columns: minmax(0, 1fr); flex: 1; }
      ${P} .tcl-toggles { grid-template-columns: 1fr 1fr; align-items: start; }
      ${P} .tcl-disc[data-open="true"] { grid-column: 1 / -1; }
      ${P} .tcl-disc-btn .tcl-hint { display: none; }
      ${P} .tcl-priv { border: 1px dashed var(--tcl-line); }
      ${P} .tcl-priv > .tcl-disc-btn { display: flex; }
      ${P} .tcl-priv[data-open="false"] .tc-modal__form-group { display: none !important; }
      ${P} .tcl-priv .tc-modal__form-label { display: none; }
      ${P} .tick-selector .tick-selection { flex-direction: column; justify-content: center; text-align: center; gap: 5px; min-height: 54px; padding: 6px 2px; }
      ${P} .tick-selection .tick-text { font-size: 12.5px; }
      ${P} .tick-selection[data-tick="dog"] .tick-text::after { font-size: 12.5px; }
      ${Object.entries(DIFF_SHORT).map(([k, s]) => `${P} .difficulty-rating-selection[data-difficulty-rating="${k}"] .difficulty-rating-item-text { font-size: 0; } ${P} .difficulty-rating-selection[data-difficulty-rating="${k}"] .difficulty-rating-item-text::after { content: "${s}"; font-size: 11px; }`).join('\n      ')}
    }
  `
  document.head.appendChild(style)

  // ------------------------------------------------------------ helpers
  const q = sel => modal.querySelector(sel)
  const groupOf = sel => {
    const el = q(sel)
    return el && el.closest('.tc-modal__form-group')
  }
  const el = (tag, props = {}, kids = []) => {
    const e = document.createElement(tag)
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') e.className = v
      else if (k === 'text') e.textContent = v
      else if (k.startsWith('data-') || k.startsWith('aria-') || k === 'type' || k === 'hidden') e.setAttribute(k, v)
      else e[k] = v
    }
    for (const kid of kids) if (kid) e.append(kid)
    return e
  }

  // Moved elements keep a comment node at their original spot so the
  // "Formulario original" switch can put everything back.
  const moved = []
  const moveInto = (node, parent) => {
    if (!node || node.parentNode === parent) return
    if (!moved.some(m => m.node === node)) {
      const ph = document.createComment('tcl-placeholder')
      node.parentNode.insertBefore(ph, node)
      moved.push({ node, ph })
    }
    parent.appendChild(node)
  }
  const restoreMoved = () => {
    for (const { node, ph } of moved.splice(0)) {
      if (ph.parentNode) {
        ph.parentNode.insertBefore(node, ph)
        ph.remove()
      }
    }
  }

  const relabel = (group, text) => {
    const lbl = group && group.querySelector('.tc-modal__form-label')
    if (!lbl) return
    if (lbl.dataset.tclOrig === undefined) lbl.dataset.tclOrig = lbl.textContent
    lbl.textContent = text
  }
  const unlabel = () => {
    modal.querySelectorAll('.tc-modal__form-label[data-tcl-orig]').forEach(lbl => {
      lbl.textContent = lbl.dataset.tclOrig
      delete lbl.dataset.tclOrig
    })
  }

  const tagsSelect = () => $(modal).find('select.ascent-tags')
  const getTags = () => {
    const $s = tagsSelect()
    if (!$s.length || !$s.data('select2')) return []
    return ($s.select2('data') || []).map(d => d.id)
  }
  const setTag = (tag, on) => {
    const $s = tagsSelect()
    if (!$s.length || !$s.data('select2')) return
    const vals = getTags().filter(v => v !== tag)
    if (on) vals.push(tag)
    $s.select2('val', vals)
    $s.trigger('change') // theCrag's handler enables the save buttons
  }
  const currentStyle = () => {
    const s = q('.ascent-tick-wrapper .gear-style-selected')
    return s ? s.getAttribute('data-gear-style') : ''
  }
  const currentTick = () => {
    const s = q('.ascent-tick-wrapper .tick-selected')
    return s ? s.getAttribute('data-tick') : ''
  }
  function gearOnApplies () {
    return currentStyle() === 'sport' && ['onsight', 'flash'].includes(currentTick())
  }

  const grow = ta => {
    if (!ta || !ta.offsetParent) return // collapsed: measure when it opens
    ta.style.height = 'auto'
    ta.style.height = ta.scrollHeight + 2 + 'px'
  }

  // ------------------------------------------------------------ build
  let ui = null // our own nodes while the modern form is on
  let lastLoadId = null
  let advTouched = false // user opened/closed Avanzado for this ascent

  function build () {
    const gDate = groupOf('.date-wrapper')
    const gWho = groupOf('.who-with-wrapper')
    const gTick = groupOf('.ascent-tick-wrapper')
    const gQual = groupOf('.quality-wrapper')
    const gDiff = q('.hide-unless-difficulty-feedback')
    const gComment = groupOf('#ascent-input-public-comment')
    const gPriv = groupOf('#ascent-input-private-comment')
    const gAtt = groupOf('.attempts-wrapper')
    const gPitch = q('.hide-unless-multi-pitch')
    const gName = groupOf('.label-override-wrapper')
    const gGrade = groupOf('.grade-wrapper')
    const gLen = groupOf('.length-override-wrapper')
    const gAdvToggle = groupOf('input[name=show-advanced-fields]')
    const body = q('.modal-body')
    const main = q('.log-ascent-main-area')
    if (!gDate || !gTick || !gComment || !body || !main) return false

    const left = el('div', { class: 'tcl-col tcl-left' })
    const right = el('div', { class: 'tcl-col tcl-right' })
    const panel = el('div', { class: 'tcl-panel' }, [left, right])
    main.parentNode.insertBefore(panel, main)

    const row = el('div', { class: 'tcl-row' })
    left.append(row)
    moveInto(gDate, row)
    moveInto(gWho, row)
    gTick.classList.add('tcl-g-tick')
    moveInto(gTick, left)
    gQual.classList.add('tcl-g-quality')
    moveInto(gQual, left)
    moveInto(gDiff, left)

    moveInto(gComment, right)

    const privLabel = gPriv ? gPriv.querySelector('.tc-modal__form-label').textContent.trim() : ''
    const privHint = el('span', { class: 'tcl-hint' })
    const priv = el('div', { class: 'tcl-disc tcl-priv', 'data-open': 'false' }, [
      el('button', { type: 'button', class: 'tcl-disc-btn' }, [el('span', { class: 'tcl-car', text: '▸' }), privLabel, privHint])
    ])
    if (gPriv) moveInto(gPriv, priv)
    right.append(priv)

    relabel(gAtt, t.attempts)
    const chips = el('div', { class: 'tcl-chips' })
    const options = [...modal.querySelectorAll('select.ascent-tags option')]
    for (const c of CHIPS) {
      const opt = options.find(o => o.value === c.tag)
      if (!opt) continue
      chips.append(el('button', {
        type: 'button', class: 'tcl-chip' + (c.when ? ' tcl-ctx' : ''), 'data-tag': c.tag, 'aria-pressed': 'false', text: opt.textContent.trim()
      }))
    }
    const tagsLabel = (groupOf('.ascent-tags-wrapper') || {}).querySelector?.('.tc-modal__form-label')
    const tagsField = el('div', { class: 'tc-modal__form-group tcl-tags' }, [
      el('span', { class: 'tcl-lbl', text: tagsLabel ? tagsLabel.textContent.trim() : t.tags }), chips
    ])
    const pair = el('div', { class: 'tcl-pair' })
    moveInto(gAtt, pair)
    pair.append(tagsField)
    right.append(pair)

    if (gPitch) moveInto(gPitch, right)

    const advLabel = gAdvToggle ? gAdvToggle.querySelector('.tc-modal__form-label').textContent.trim() : 'Avanzado'
    const advPanel = el('div', { class: 'tcl-disc-panel' })
    const adv = el('div', { class: 'tcl-disc tcl-adv', 'data-open': 'false' }, [
      el('button', { type: 'button', class: 'tcl-disc-btn' }, [el('span', { class: 'tcl-car', text: '▸' }), advLabel, el('span', { class: 'tcl-hint', text: t.advHint })]),
      advPanel
    ])
    for (const g of [gName, gGrade, gLen]) if (g) moveInto(g, advPanel)
    const toggles = el('div', { class: 'tcl-toggles' }, [priv, adv])
    right.append(toggles)

    priv.querySelector('.tcl-disc-btn').addEventListener('click', () => {
      const open = priv.dataset.open !== 'true'
      priv.dataset.open = String(open)
      if (open) {
        const ta = q('#ascent-input-private-comment')
        grow(ta)
        ta && ta.focus()
      }
    })
    adv.querySelector('.tcl-disc-btn').addEventListener('click', () => {
      advTouched = true
      adv.dataset.open = String(adv.dataset.open !== 'true')
    })
    chips.addEventListener('click', e => {
      const chip = e.target.closest('.tcl-chip')
      if (!chip) return
      setTag(chip.dataset.tag, chip.getAttribute('aria-pressed') !== 'true')
      refresh()
    })

    ui = { panel, priv, privHint, adv, chips }
    return true
  }

  // Keeps the parts that theCrag rebuilds on every open (tick tiles,
  // attempts, tags…) in sync with the layout. Safe to call often.
  function refresh () {
    if (!ui) return
    modal.classList.toggle('tcl-gym', !!(q('#log-ascent-modal__is-gym') || {}).value)

    const sel = q('.tick-selector')
    if (sel) {
      const count = [...sel.querySelectorAll('.tick-selection')].filter(n => n.offsetParent !== null || getComputedStyle(n).display !== 'none').length
      if (sel.dataset.count !== String(count)) sel.dataset.count = String(count)
    }
    const styles = q('.gear-style-selector')
    if (styles) {
      const visible = [...styles.querySelectorAll('.gear-style-selection')].filter(n => getComputedStyle(n).display !== 'none').length
      styles.classList.toggle('tcl-single', visible <= 1)
    }

    const att = q('.attempts-wrapper')
    if (att) {
      const n = parseInt((q('.number-attempts') || {}).value, 10)
      att.classList.toggle('tcl-big', n > 9)
    }

    const tags = getTags()
    for (const chip of ui.chips.querySelectorAll('.tcl-chip')) {
      const on = tags.includes(chip.dataset.tag)
      const c = CHIPS.find(x => x.tag === chip.dataset.tag)
      const show = !c.when || c.when() || on
      if (chip.getAttribute('aria-pressed') !== String(on)) chip.setAttribute('aria-pressed', String(on))
      if (chip.hidden === show) chip.hidden = !show
    }

    const pc = q('#ascent-input-private-comment')
    const hint = pc && pc.value.trim() ? t.hasText : t.empty
    if (ui.privHint.textContent !== hint) ui.privHint.textContent = hint

    // New ascent or next page: reset the disclosures. Avanzado opens by
    // itself when an override (name, grade, length) is in use; theCrag sets
    // those checkboxes after loading the ascent, so keep checking.
    const loadId = $(modal).data('load-id')
    if (loadId !== lastLoadId) {
      lastLoadId = loadId
      advTouched = false
      ui.priv.dataset.open = 'false'
      ui.adv.dataset.open = 'false'
    }
    const overrides = [...modal.querySelectorAll('input[name=use-route-name], input[name=use-route-grade], input[name=use-route-length]')]
    if (!advTouched && ui.adv.dataset.open !== 'true' && overrides.some(cb => !cb.checked)) ui.adv.dataset.open = 'true'
    // theCrag fills the comment boxes with .val(), which fires no event
    modal.querySelectorAll('.tcl-panel textarea').forEach(grow)
  }

  // ------------------------------------------------------------ on / off
  const switchBtn = (cls, text) => el('button', { type: 'button', class: 'tcl-switch ' + cls, text })
  const origHead = switchBtn('tcl-orig-head', '↺ ' + t.originalShort)
  const origFoot = switchBtn('tcl-orig-foot', '↺ ' + t.original)
  const newFoot = switchBtn('tcl-new-foot', '✦ ' + t.modern)
  const header = q('.modal-header')
  const footer = q('.modal-footer')
  if (header) header.insertBefore(origHead, header.querySelector('.close'))
  if (footer) footer.prepend(origFoot, newFoot)

  function enable () {
    if (ui) return
    if (!build()) return
    modal.classList.add('tcl-on')
    lastLoadId = null
    refresh()
  }
  function disable () {
    if (!ui) return
    modal.classList.remove('tcl-on', 'tcl-gym')
    restoreMoved()
    unlabel()
    ui.panel.remove()
    q('.tcl-g-tick') && q('.tcl-g-tick').classList.remove('tcl-g-tick')
    q('.tcl-g-quality') && q('.tcl-g-quality').classList.remove('tcl-g-quality')
    modal.querySelectorAll('textarea').forEach(ta => { ta.style.height = '' })
    ui = null
  }
  const choose = useOriginal => {
    setUseOriginal(useOriginal)
    useOriginal ? disable() : enable()
  }
  origHead.addEventListener('click', () => choose(true))
  origFoot.addEventListener('click', () => choose(true))
  newFoot.addEventListener('click', () => choose(false))

  // ------------------------------------------------------------ events
  modal.addEventListener('input', e => {
    if (ui && e.target.matches('.tcl-panel textarea')) grow(e.target)
  })
  window.addEventListener('resize', () => {
    if (ui) modal.querySelectorAll('.tcl-panel textarea').forEach(grow)
  })
  // After theCrag has handled a tick / style click: drop "Cintas puestas"
  // when it no longer applies (only for Deportiva A vista / Flash).
  modal.addEventListener('click', e => {
    if (!ui || !e.target.closest('.tick-selection, .gear-style-selection')) return
    setTimeout(() => {
      if (!gearOnApplies() && getTags().includes('Gear on')) setTag('Gear on', false)
      refresh()
    }, 0)
  })

  let scheduled = false
  const schedule = () => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      refresh()
    })
  }
  new MutationObserver(records => {
    if (!ui) return
    if (records.every(r => r.target.closest && r.target.closest('.tcl-chips'))) return
    schedule()
  }).observe(modal, { childList: true, subtree: true })
  $(modal).on('shown', () => {
    if (!ui && !getUseOriginal()) enable()
    refresh()
    modal.querySelectorAll('.tcl-panel textarea').forEach(grow)
  })

  if (!getUseOriginal()) enable()
})()
