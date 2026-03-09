// ==UserScript==
// @name         theCrag - Add HTML guide link
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds a direct link to the HTML guide on the area page
// @author       You
// @match        https://www.thecrag.com/es/escalar/*
// @sandbox      JavaScript
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

console.log('theCrag - Adding HTML guide link')

//
var elements = document.getElementsByClassName('info iblock')
if (elements !== null) {
	for (var i = 0; i < elements.length; i++) {
        const a = document.createElement('a')
        const aText = document.createTextNode('HTML Guide')
        a.appendChild(aText)
		a.href = window.location.href + '/guide'
        elements[i].appendChild(a)
	}
}

