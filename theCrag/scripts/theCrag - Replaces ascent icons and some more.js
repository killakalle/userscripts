// ==UserScript==
// @name         theCrag - Replace Icon with Local Image
// @namespace    your.namespace
// @version      1.6
// @description  Replaces ascent icons and some more
// @match        https://www.thecrag.com/
// @match        https://www.thecrag.com/dashboard
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Define an object with class names as keys and corresponding custom spans as values
    var customSpans = {
        "gear-style-sport": '<span class="tags sport">LD</span>',
        "gear-style-second": '<span class="tags second">2D</span>',
        "gear-style-trad": '<span class="tags trad">TD</span>',
        "gear-style-boulder": '<span class="tags boulder">BD</span>',
        "gear-style-top-rope": '<span class="tags toprope">TR</span>'
        // Add more class names and custom spans as needed
    };

    // Function to replace the icons with custom spans and remove specific elements
    function replaceIcons() {
        for (var className in customSpans) {
            var icons = Array.from(document.getElementsByClassName(className));
            var customSpan = customSpans[className];

            for (var i = 0; i < icons.length; i++) {
                var icon = icons[i];
                icon.outerHTML = customSpan;
            }
        }

        // Remove specific elements by content
        var contentsToRemove = [
            'Deportiva',
            'Búlder'
        ];

        for (var i = 0; i < contentsToRemove.length; i++) {
            var contentToRemove = contentsToRemove[i];
            var elements = Array.from(document.querySelectorAll('.tags'));

            for (var j = 0; j < elements.length; j++) {
                var element = elements[j];
                if (element.innerText === contentToRemove) {
                    element.remove();
                }
            }
        }

        // Remove elements with class name "bolts iblock"
        var boltsElements = Array.from(document.querySelectorAll('.bolts.iblock'));
        for (var k = 0; k < boltsElements.length; k++) {
            var boltsElement = boltsElements[k];
            boltsElement.remove();
        }

        // Remove comma from route length elements
        var lengthElements = Array.from(document.querySelectorAll('.attr'));
        for (var l = 0; l < lengthElements.length; l++) {
            var lengthElement = lengthElements[l];
            lengthElement.textContent = lengthElement.textContent.replace(/,/g, '');
        }
    }

    // Function to observe changes in the DOM and trigger replacements
    function observeDOM() {
        var targetNode = document.body;
        var config = { childList: true, subtree: true };

        var observer = new MutationObserver(function(mutationsList) {
            for (var mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    replaceIcons();
                }
            }
        });

        observer.observe(targetNode, config);
    }

    // Start observing DOM changes
    observeDOM();
})();
