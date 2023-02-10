// ==UserScript==
// @name         theCrag - Select all routes
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Checkbox to conveniently de-/select all routes when adding topos
// @author       You
// @match        https://www.thecrag.com/CIDS/cgi-bin/cids.cgi*AState=17515*
// @icon         https://www.google.com/s2/favicons?domain=thecrag.com
// @grant        none
// ==/UserScript==

// Check if the page has jQuery library
if (typeof jQuery == 'undefined') {
	var script = document.createElement('script')
	script.src = 'https://code.jquery.com/jquery-3.5.1.min.js'
	document.getElementsByTagName('head')[0].appendChild(script)
}

// Wait for jQuery to load
var checkJquery = setInterval(function () {
	if (typeof jQuery != 'undefined') {
		clearInterval(checkJquery)

		// Find the table by its class name
		var table = $('.process-table')

		// Add a checkbox to the header of the table
		table
			.find('thead tr')
			.prepend('<th><input type="checkbox" id="selectAll"></th>')

		// Select/Deselect all checkboxes on header checkbox change
		$('#selectAll').change(function () {
			$(table)
				.find('tbody input[type="checkbox"]')
				.prop('checked', this.checked)
		})
	}
}, 100)
