// ==UserScript==
// @name          theCrag - Mobile Photo Upload - Extreme Mobile
// @author        killakalle
// @namespace     https://github.com/killakalle/userscripts
// @version       0.0.5
// @description   Transforms theCrag upload into a full-screen, big-button mobile interface.
// @match         https://www.thecrag.com/CIDS/cgi-bin/cids.cgi*
// @match         https://www.thecrag.com/es/escalar/*/photos/upload*
// @match         https://www.thecrag.com/climbing/*/photos/upload*
// @grant         none
// ==/UserScript==

;(function () {
  'use strict'

  const cleanupUI = () => {
    // 1. Auto-check and hide copyright
    const check = document.querySelector('#mustowncopyrightcheck')
    if (check) {
      check.checked = true
      check.parentElement.style.display = 'none'
    }

    // 2. Remove all desktop scaffolding
    const selectorsToHide = [
      '#footer',
      '.regions__footer',
      '.breadcrumb',
      '.bust',
      '.regions__headline',
      '.plupload_header',
      '.plupload_droptext',
      '#uploadform > div p',
      '.plupload_file_size',
      '.plupload_file_status'
    ]

    selectorsToHide.forEach(sel => {
      document
        .querySelectorAll(sel)
        .forEach(el => el.style.setProperty('display', 'none', 'important'))
    })
  }

  const injectMobileStyles = () => {
    if (document.getElementById('tc-mobile-ux-styles')) return

    const style = document.createElement('style')
    style.id = 'tc-mobile-ux-styles'
    style.textContent = `
      /* Reset containers to be full screen width */
      html, body, #wrapper, .regions__content, .regions__wide, .regions__inner, #uploadform {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #000 !important; /* Deep black for focus */
        overflow-x: hidden;
      }

      /* Giant "ADD FILES" Button */
      #uploader_browse, .plupload_button.plupload_add {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 94vw !important;
        height: 120px !important;
        margin: 20px auto !important;
        background: #28a745 !important;
        color: #fff !important;
        font-size: 30px !important;
        font-weight: bold !important;
        border-radius: 15px !important;
        box-shadow: 0 4px 15px rgba(0,255,0,0.2) !important;
        text-transform: uppercase;
      }

      /* Giant "SUBMIT / UPLOAD" Button */
      .standardButton {
        margin: 40px 0 !important;
        padding: 0 3vw !important;
      }
      
      .standardButton input[type="submit"] {
        width: 100% !important;
        height: 100px !important;
        background: #007bff !important;
        color: white !important;
        font-size: 28px !important;
        font-weight: 800 !important;
        border-radius: 15px !important;
        border: none !important;
        box-shadow: 0 4px 15px rgba(0,123,255,0.3) !important;
      }

      /* Make the file list take up more space and be readable */
      .plupload_wrapper {
        width: 100% !important;
        min-height: 200px !important;
      }
      
      .plupload_filelist {
        background: #1a1a1a !important;
        border: 1px solid #333 !important;
        color: #fff !important;
        margin: 0 3vw !important;
        width: 94vw !important;
      }

      .plupload_file_name {
        font-size: 18px !important;
        padding: 15px !important;
        color: #ccc !important;
      }

      /* Fix the invisible Plupload overlay that catches clicks */
      .moxie-shim, .moxie-shim input {
        width: 100% !important;
        height: 120px !important;
      }

      /* Visual feedback for taps */
      #uploader_browse:active, input[type="submit"]:active {
        transform: scale(0.98);
        filter: brightness(1.1);
      }
    `
    document.head.appendChild(style)
  }

  const init = () => {
    cleanupUI()
    injectMobileStyles()
  }

  // Plupload dynamically re-injects the "Add Files" button logic,
  // so we stay persistent with a short interval.
  init()
  setInterval(init, 500)
})()
