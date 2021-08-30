// ==UserScript==
// @name     theCrag - DashboardCleaner
// @author   anderlnought
// @version  1
// @description removes unneccessary stuff from the dashboard, stream starts right away at the top
// @match    https://www.thecrag.com/
// @match    https://www.thecrag.com/dashboard
// @match    https://www.thecrag.com/es/escalar/*
// @match    https://www.thecrag.com/climbing/*
// @exclude  https://www.thecrag.com/es/escalar/*route*
// @icon     https://www.google.com/s2/favicons?domain=thecrag.com
// @namespace https://greasyfork.org/users/797340
// ==/UserScript==

console.log('theCrag - Dashboard Cleaner')

// remove start discussion
var elements = document.getElementsByClassName('regions__prominent')
if (elements !== null) {
	for (var i = 0; i < elements.length; i++) {
		elements[i].style.display = 'none'
	}
}

// remove activity header & stuff
var elements = document.getElementsByClassName('grade-convert')
if (elements !== null) {
	var subs1 = elements[0].getElementsByTagName('h3')
	var subs2 = elements[0].getElementsByTagName('p')
	subs1[0].style.display = 'none'
	subs2[0].style.display = 'none'
}

// remove benefits
var elements = document.getElementsByClassName('btn btn-success')
if (elements !== null) {
	for (var i = 0; i < elements.length; i++) {
		elements[i].style.display = 'none'
	}
}

// remove sponsors box
var elements = document.getElementsByClassName('sponsor-media-container')
if (elements !== null) {
	for (var i = 0; i < elements.length; i++) {
		elements[i].style.display = 'none'
	}
}

var elements = document.querySelectorAll("a[href='#sponsors']")
if (elements !== null) {
	for (var i = 0; i < elements.length; i++) {
		elements[i].style.display = 'none'
	}
}
