// ==UserScript==
// @name          theCrag - Locate - Satellite layer dark mode fix
// @author        killakalle
// @namespace     https://github.com/killakalle/userscripts
// @version       0.1.0
// @description   Companion to the Cerulean Tide dark userstyle: the /locate boundary+POI editor renders its map on a single OpenLayers <canvas>, so the CSS invert filter used to dark-mode the OSM tiles has no way to exclude the Satellite (MapTiler) base layer on its own. This toggles a class on #map reflecting which base layer is active so the userstyle can skip the invert for satellite imagery.
// @match         https://www.thecrag.com/*/locate*
// @icon          https://www.google.com/s2/favicons?domain=thecrag.com
// @grant         none
// @run-at        document-idle
// @license       MIT
// @downloadURL   https://update.greasyfork.org/scripts/585405/theCrag%20-%20Locate%20-%20Satellite%20layer%20dark%20mode%20fix.user.js
// @updateURL     https://update.greasyfork.org/scripts/585405/theCrag%20-%20Locate%20-%20Satellite%20layer%20dark%20mode%20fix.meta.js
// ==/UserScript==

;(function () {
  'use strict'

  const SATELLITE_CLASS = 'tc-satellite-active'

  const syncSatelliteClass = () => {
    const mapEl = document.getElementById('map')
    const baseGroup = document.querySelector('.layer-switcher-base-group')
    if (!mapEl || !baseGroup) return

    const satelliteInput = Array.from(baseGroup.querySelectorAll('label'))
      .filter((label) => /satellite/i.test(label.textContent))
      .map((label) => document.getElementById(label.getAttribute('for')))
      .find(Boolean)

    mapEl.classList.toggle(SATELLITE_CLASS, !!satelliteInput?.checked)
  }

  document.addEventListener('change', (event) => {
    if (event.target.closest?.('.layer-switcher-base-group')) {
      syncSatelliteClass()
    }
  })

  // The OpenLayers map (and its layer-switcher control) is built asynchronously
  // after page load, so keep watching the DOM until it shows up.
  const observer = new MutationObserver(() => {
    if (document.querySelector('.layer-switcher-base-group')) {
      syncSatelliteClass()
      observer.disconnect()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })

  syncSatelliteClass()
})()
