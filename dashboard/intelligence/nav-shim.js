/**
 * nav-shim.js — Phase 826 / C14 / D-26-44
 *
 * Injects the "Intelligence" nav link into the existing GSD dashboard nav.
 * IIFE pattern. Defensive: exits gracefully if nav not found.
 * ONE-LINE addition to index.html: <script src="intelligence/nav-shim.js" defer></script>
 */
(function () {
  'use strict';

  function inject() {
    // Find existing nav using documented selectors (D-26-44)
    var nav = document.querySelector('nav') ||
              document.querySelector('.nav') ||
              document.querySelector('header [role="navigation"]');

    if (!nav) {
      if (typeof console !== 'undefined') {
        console.warn('[nav-shim] Could not find nav element — Intelligence tab not injected.');
      }
      return;
    }

    // Find the nav list (ul.nav-list) within the nav
    var navList = nav.querySelector('ul.nav-list') || nav.querySelector('ul') || nav;

    // Find the last existing nav link to clone
    var existingLinks = navList.querySelectorAll('a[href]');
    if (!existingLinks || existingLinks.length === 0) {
      if (typeof console !== 'undefined') {
        console.warn('[nav-shim] No existing nav links found — Intelligence tab not injected.');
      }
      return;
    }

    // Check if Intelligence tab is already present (idempotent)
    for (var i = 0; i < existingLinks.length; i++) {
      if (existingLinks[i].href && existingLinks[i].href.indexOf('intelligence.html') !== -1) {
        return; // Already injected
      }
    }

    // Clone the last existing link's parent <li> (or the link itself)
    var lastLink = existingLinks[existingLinks.length - 1];
    var template = lastLink.closest('li') || lastLink;
    var newItem = template.cloneNode(true);

    // Update the cloned item
    var newLink = newItem.tagName === 'A' ? newItem : newItem.querySelector('a');
    if (!newLink) {
      if (typeof console !== 'undefined') {
        console.warn('[nav-shim] Clone does not contain an <a> element — Intelligence tab not injected.');
      }
      return;
    }

    newLink.href = 'intelligence.html';
    newLink.textContent = 'Intelligence';
    newLink.dataset.navItem = 'intelligence';
    if (newLink.classList.contains('nav-link--active')) {
      newLink.classList.remove('nav-link--active');
    }

    // Insert after the last item
    var parent = template.parentNode;
    parent.insertBefore(newItem, template.nextSibling);
  }

  // Run on DOMContentLoaded or immediately if already ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
