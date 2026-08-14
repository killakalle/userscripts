// ==UserScript==
// @name         Archive.is Auto-Submitter
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Adds a banner to send paywalled article URLs to archive.is and automatically submits them.
// @author       You
// @match        *://*.sueddeutsche.de/*
// @match        *://*.elpais.com/*
// @match        *://archive.is/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const currentUrl = window.location.href;
    const currentHost = window.location.hostname;

    // ==========================================
    // Helper: Inject the banner
    // ==========================================
    function injectBanner(message) {
        // Prevent duplicate banners
        if (document.getElementById('archive-banner-xyz')) return;

        // Create the banner container
        const banner = document.createElement('div');
        banner.id = 'archive-banner-xyz';
        banner.style.width = '100%';
        banner.style.backgroundColor = '#B40010'; // Matching archive.is red
        banner.style.color = '#FFFFFF';
        banner.style.padding = '10px';
        banner.style.textAlign = 'center';
        banner.style.fontFamily = 'Arial, sans-serif';
        banner.style.fontSize = '16px';
        banner.style.zIndex = '99999999';
        banner.style.position = 'relative'; // Keeps it above all content in the flow

        // Create the button
        const btn = document.createElement('button');
        btn.innerText = 'Go to archive.is';
        btn.style.marginLeft = '15px';
        btn.style.padding = '5px 15px';
        btn.style.fontSize = '14px';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#f0f0f0';
        btn.style.border = '1px solid #ccc';
        btn.style.color = '#000';

        // Add the click event to redirect to archive.is with the URL payload
        btn.addEventListener('click', function() {
            const targetUrl = 'https://archive.is/?auto_archive=' + encodeURIComponent(currentUrl);
            window.location.href = targetUrl;
        });

        // Assemble the banner and inject it at the very top of the body
        banner.appendChild(document.createTextNode(message));
        banner.appendChild(btn);

        // Ensure the body exists before inserting
        if (document.body) {
            document.body.insertBefore(banner, document.body.firstChild);
        }
    }

    // ==========================================
    // 1. Logic for sueddeutsche.de
    // ==========================================
    if (currentHost.includes('sueddeutsche.de')) {
        const urlParams = new URLSearchParams(window.location.search);

        // ONLY show the banner if the parameter ?reduced=true is present
        if (urlParams.get('reduced') === 'true') {
            injectBanner('Archive this paywalled article?');
        }
    }

    // ==========================================
    // 2. Logic for elpais.com
    // ==========================================
    if (currentHost.includes('elpais.com')) {
        // Function to check for the paywall ID
        const checkForElPaisPaywall = () => {
            if (document.getElementById('ctn_freemium_article')) {
                injectBanner('Archive this paywalled El País article?');
                return true; // Found it
            }
            return false;
        };

        // Check immediately in case the paywall rendered server-side
        if (!checkForElPaisPaywall()) {
            // If not found yet, observe the DOM in case it is loaded via JS
            const observer = new MutationObserver((mutations, obs) => {
                if (checkForElPaisPaywall()) {
                    obs.disconnect(); // Stop observing once found to save memory
                }
            });

            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            }
        }
    }

    // ==========================================
    // 3. Logic for archive.is
    // ==========================================
    if (currentHost.includes('archive.is')) {
        
        // --- Extension: Auto-close "Already Archived" Modal ---
        const closeAlreadyArchivedModal = () => {
            const closeBtn = document.getElementById('ALREADY_CLOSEBTN');
            if (closeBtn) {
                closeBtn.click();
                return true;
            }
            return false;
        };

        // Check immediately and also observe the DOM in case it pops up asynchronously
        if (!closeAlreadyArchivedModal()) {
            const modalObserver = new MutationObserver((mutations, obs) => {
                if (closeAlreadyArchivedModal()) {
                    obs.disconnect(); // Stop observing once closed
                }
            });

            if (document.body) {
                modalObserver.observe(document.body, { childList: true, subtree: true });
            }
        }
        // ------------------------------------------------------

        // Check if we arrived here via our custom redirect button
        const urlParams = new URLSearchParams(window.location.search);
        const urlToArchive = urlParams.get('auto_archive');

        if (urlToArchive) {
            // Find the form and input fields using the HTML structure
            const form = document.getElementById('submiturl');
            const urlInput = document.getElementById('url');

            if (form && urlInput) {
                // Paste the URL into the input field
                urlInput.value = urlToArchive;

                // Find and click the 'save' submit button
                const submitBtn = form.querySelector('input[type="submit"]');
                if (submitBtn) {
                    submitBtn.click();
                } else {
                    // Fallback just in case the button structure changes
                    form.submit();
                }
            }
        }
    }
})();