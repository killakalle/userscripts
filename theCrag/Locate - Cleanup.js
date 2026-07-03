// ==UserScript==
// @name          theCrag - Locate - Cleanup
// @author        killakalle
// @namespace     https://github.com/killakalle/userscripts
// @version       0.1.0
// @description   Collapses the route list accordion section (Vías/Routes) by default on the /locate boundary+POI editor, since it's rarely needed and otherwise takes up most of the page on load.
// @match         *://www.thecrag.com/*/locate*
// @icon          https://www.google.com/s2/favicons?domain=thecrag.com
// @grant         none
// @run-at        document-end
// @license       MIT
// @downloadURL   https://update.greasyfork.org/scripts/585406/theCrag%20-%20Locate%20-%20Cleanup.user.js
// @updateURL     https://update.greasyfork.org/scripts/585406/theCrag%20-%20Locate%20-%20Cleanup.meta.js
// ==/UserScript==

;(function () {
  'use strict'

  const routesToggle = document.querySelector('.accordion > .accordion-item:first-child input.accordion-toggle')
  if (routesToggle) {
    routesToggle.checked = false
  }
})()
