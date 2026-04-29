// ==UserScript==
// @name          theCrag - Mobile Photo Upload - Cleanup
// @author        killakalle
// @namespace     https://github.com/killakalle/userscripts
// @version       0.0.4
// @description   Forces giant buttons and a "Clean Mode" for mobile photo uploads on theCrag.
// @match         https://www.thecrag.com/CIDS/cgi-bin/cids.cgi*
// @match         https://www.thecrag.com/es/escalar/*/photos/upload*
// @match         https://www.thecrag.com/climbing/*/photos/upload*
// @icon          https://www.google.com/s2/favicons?domain=thecrag.com
// @grant         none
// @license       MIT
// ==/UserScript==

;(function () {
  'use strict'

  const cleanupUI = () => {
    // 1. Auto-check copyright
    const check = document.querySelector('#mustowncopyrightcheck')
    if (check) {
      check.checked = true
      // Hide the parent div of the checkbox to clean up the UI
      check.parentElement.style.setProperty('display', 'none', 'important')
    }

    // 2. Hide specific distracting elements
    const selectorsToHide = [
      '#footer', // Site footer
      '.regions__footer', // Site footer area
      '.plupload_header', // "Select files" box
      '.plupload_droptext', // "Drag files here"
      '.breadcrumb', // Navigation path
      '.bust', // The entire top header/logo/nav area
      '.regions__headline', // The "Select photos to upload" H1 area
      '#uploadform > div:nth-of-type(1) p' // Target the specific disclaimer text only
    ]

    selectorsToHide.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.setProperty('display', 'none', 'important')
      })
    })
  }

  const injectExtremeStyles = () => {
    if (document.getElementById('tc-extreme-upload-styles')) return

    const style = document.createElement('style')
    style.id = 'tc-extreme-upload-styles'
    style.textContent = `
      @media (max-width: 767px) {
        body, html, .regions__wide, .regions__inner, #wrapper { 
          background: #121212 !important; 
          color: white !important;
        }

        #uploader {
          padding-top: 10px !important;
        }

        /* Large Green Add Button */
        #uploader_browse, .plupload_button.plupload_add {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          height: 120px !important; 
          font-size: 32px !important;
          font-weight: 900 !important;
          background: #28a745 !important;
          color: white !important;
          border-radius: 20px !important;
          margin: 10px 0 20px 0 !important;
          border: none !important;
          box-shadow: 0 8px 20px rgba(0,0,0,0.5) !important;
        }

        /* Large Blue Submit Button */
        .standardButton input[type="submit"] {
          display: block !important;
          width: 100% !important;
          height: 120px !important;
          font-size: 32px !important;
          font-weight: 900 !important;
          background: #007bff !important;
          color: white !important;
          border-radius: 20px !important;
          border: none !important;
          margin-top: 20px !important;
          box-shadow: 0 8px 20px rgba(0,0,0,0.5) !important;
        }

        /* Make file list visible against dark background */
        .plupload_filelist {
          background: #1e1e1e !important;
          color: #eee !important;
        }

        /* Ensure the click shim covers the giant button */
        .moxie-shim {
          width: 100% !important;
          height: 120px !important;
        }
      }
    `
    document.head.appendChild(style)
  }

  const init = () => {
    cleanupUI()
    injectExtremeStyles()
  }

  // Initial run
  init()
  // Re-run to handle Plupload's dynamic DOM injections
  setInterval(init, 500)
})()
