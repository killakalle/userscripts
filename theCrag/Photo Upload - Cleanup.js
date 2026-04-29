// ==UserScript==
// @name          theCrag - Mobile Photo Upload - Cleanup
// @author        killakalle
// @namespace     https://github.com/killakalle/userscripts
// @version       0.0.9
// @description   Advanced mobile detection to force big buttons on phones while keeping desktop clean.
// @match         https://www.thecrag.com/CIDS/cgi-bin/cids.cgi*
// @match         https://www.thecrag.com/es/escalar/*/photos/upload*
// @match         https://www.thecrag.com/climbing/*/photos/upload*
// @icon          https://www.google.com/s2/favicons?domain=thecrag.com
// @grant         none
// ==/UserScript==

;(function () {
  'use strict'

  const isMobile = () => {
    const widthMatch = window.matchMedia('(max-width: 1024px)').matches
    const uaMatch =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    return widthMatch || uaMatch
  }

  const cleanupUI = () => {
    // 1. Always auto-check copyright (useful on both)
    const check = document.querySelector('#mustowncopyrightcheck')
    if (check) check.checked = true

    // 2. Only hide elements if mobile is detected
    if (isMobile()) {
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

      if (check && check.parentElement) {
        check.parentElement.style.setProperty('display', 'none', 'important')
      }

      selectorsToHide.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          el.style.setProperty('display', 'none', 'important')
        })
      })
    }
  }

  const injectMobileStyles = () => {
    if (document.getElementById('tc-mobile-ux-styles')) return

    const style = document.createElement('style')
    style.id = 'tc-mobile-ux-styles'
    style.textContent = `
      /* Apply to screens up to 1024px or devices identified as mobile */
      @media screen and (max-width: 1024px) {
        
        html, body, #wrapper, .regions__content, .regions__wide, .regions__inner, #uploadform {
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #000 !important; 
          overflow-x: hidden;
        }

        #uploader_browse, .plupload_button.plupload_add {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 92vw !important;
          height: 120px !important;
          margin: 20px auto !important;
          background: #28a745 !important;
          color: #fff !important;
          font-size: 32px !important;
          font-weight: 900 !important;
          border-radius: 20px !important;
          box-shadow: 0 10px 20px rgba(0,0,0,0.5) !important;
          text-transform: uppercase;
          border: none !important;
        }

        .standardButton {
          margin: 30px 0 !important;
          padding: 0 4vw !important;
        }
        
        .standardButton input[type="submit"] {
          width: 100% !important;
          height: 100px !important;
          background: #007bff !important;
          color: white !important;
          font-size: 30px !important;
          font-weight: 900 !important;
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 10px 20px rgba(0,0,0,0.5) !important;
        }

        .plupload_filelist {
          background: #1a1a1a !important;
          border: 1px solid #444 !important;
          color: #fff !important;
          margin: 0 4vw !important;
          width: 92vw !important;
        }

        .plupload_file_name {
          font-size: 20px !important;
          padding: 15px !important;
        }

        .moxie-shim, .moxie-shim input {
          width: 100% !important;
          height: 120px !important;
        }
      }
    `
    document.head.appendChild(style)
  }

  const init = () => {
    cleanupUI()
    injectMobileStyles()
  }

  init()
  setInterval(init, 500)
})()
