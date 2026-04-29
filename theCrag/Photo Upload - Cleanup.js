// ==UserScript==
// @name          theCrag - Mobile Photo Upload - Cleanup
// @author        killakalle
// @namespace     https://github.com/killakalle/userscripts
// @version       0.0.3
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
    if (check) check.checked = true

    // 2. Hide everything that isn't the uploader
    const selectorsToHide = [
      '#mustowncopyrightcheck',
      '.standardButton input[type="hidden"]',
      '#footer', // Site footer
      '.regions__footer', // Site footer area
      '.plupload_header', // "Select files" box
      '.plupload_droptext', // "Drag files here"
      'p', // Any lingering disclaimer paragraphs
      '.breadcrumb', // Navigation path
      'h2' // Page titles
    ]

    selectorsToHide.forEach(sel => {
      document
        .querySelectorAll(sel)
        .forEach(el => el.style.setProperty('display', 'none', 'important'))
    })

    // Hide the copyright label specifically
    const labels = document.querySelectorAll('div')
    labels.forEach(div => {
      if (div.textContent.includes('I own image copyright')) {
        div.style.setProperty('display', 'none', 'important')
      }
    })
  }

  const injectExtremeStyles = () => {
    if (document.getElementById('tc-extreme-upload-styles')) return

    const style = document.createElement('style')
    style.id = 'tc-extreme-upload-styles'
    style.textContent = `
      @media (max-width: 767px) {
        /* Force dark background for high contrast */
        body, html, .regions__wide, .regions__inner { 
          background: #121212 !important; 
          color: white !important;
        }

        /* The main uploader wrapper */
        #uploader {
          padding-top: 20px !important;
        }

        /* 1. THE ADD FILES BUTTON (The Green One) */
        #uploader_browse, .plupload_button.plupload_add {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          height: 100px !important; /* Extremely large for thumbs */
          font-size: 28px !important;
          font-weight: 900 !important;
          background: #28a745 !important;
          color: white !important;
          border-radius: 20px !important;
          margin: 10px 0 30px 0 !important;
          text-decoration: none !important;
          border: none !important;
          box-shadow: 0 8px 20px rgba(0,0,0,0.5) !important;
        }

        /* Fix Plupload click catcher shim */
        .moxie-shim {
          width: 100% !important;
          height: 100px !important;
          top: 0 !important;
          left: 0 !important;
        }

        /* 2. THE SUBMIT BUTTON (The Blue One) */
        .standardButton {
          display: block !important;
          margin-top: 50px !important;
        }
        
        .standardButton input[type="submit"] {
          display: block !important;
          width: 100% !important;
          height: 100px !important;
          font-size: 28px !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          background: #007bff !important;
          color: white !important;
          border-radius: 20px !important;
          border: 4px solid #0056b3 !important;
          box-shadow: 0 8px 20px rgba(0,0,0,0.5) !important;
        }

        /* Adjusting the list of files to be more readable */
        .plupload_filelist {
          background: #222 !important;
          border: 1px solid #444 !important;
          height: auto !important;
          max-height: none !important;
        }
        
        .plupload_file_name { font-size: 16px !important; padding: 10px !important; }
        .plupload_file_size, .plupload_file_status { font-size: 14px !important; }

        /* Animation for tap feedback */
        #uploader_browse:active, .standardButton input:active {
          transform: scale(0.95) !important;
          filter: brightness(1.2) !important;
        }
      }
    `
    document.head.appendChild(style)
  }

  const init = () => {
    cleanupUI()
    injectExtremeStyles()
  }

  // Run immediately and often to fight the Plupload JS
  init()
  setInterval(init, 500)
})()
