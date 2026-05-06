/**
 * nav-shim.js — Phase 826 / C14 / D-26-44 (Atlas tab added v1.49.607 W4a)
 *
 * Injects the "Intelligence" and "Atlas" nav links into the existing GSD
 * dashboard nav.  IIFE pattern. Defensive: exits gracefully if nav not found.
 * ONE-LINE addition to index.html: <script src="intelligence/nav-shim.js" defer></script>
 */
(function () {
  'use strict';

  var NAV_ITEMS = [
    { href: 'intelligence.html', label: 'Intelligence', key: 'intelligence' },
    { href: 'atlas.html',        label: 'Atlas',        key: 'atlas'        },
  ];

  function injectItem(navList, afterHref, item) {
    var existingLinks = navList.querySelectorAll('a[href]');
    if (!existingLinks || existingLinks.length === 0) return;

    // Idempotency check
    for (var i = 0; i < existingLinks.length; i++) {
      if (existingLinks[i].getAttribute('href') === item.href) return;
    }

    // Find the reference anchor (insert after this one)
    var refLink = null;
    for (var j = 0; j < existingLinks.length; j++) {
      if (existingLinks[j].getAttribute('href') === afterHref) {
        refLink = existingLinks[j];
        break;
      }
    }
    // Fall back to last link
    if (!refLink) refLink = existingLinks[existingLinks.length - 1];

    var template = refLink.closest('li') || refLink;
    var newItem = template.cloneNode(true);
    var newLink = newItem.tagName === 'A' ? newItem : newItem.querySelector('a');
    if (!newLink) return;

    newLink.setAttribute('href', item.href);
    newLink.textContent = item.label;
    newLink.dataset.navItem = item.key;
    newLink.classList.remove('active', 'nav-link--active');

    template.parentNode.insertBefore(newItem, template.nextSibling);
  }

  function inject() {
    var nav = document.querySelector('nav') ||
              document.querySelector('.nav') ||
              document.querySelector('header [role="navigation"]');

    if (!nav) {
      if (typeof console !== 'undefined') {
        console.warn('[nav-shim] Could not find nav element — Intelligence/Atlas tabs not injected.');
      }
      return;
    }

    var navList = nav.querySelector('ul.nav-list') || nav.querySelector('ul') || nav;

    // Inject Intelligence (after console.html), then Atlas (after intelligence.html)
    injectItem(navList, 'console.html',      NAV_ITEMS[0]);
    injectItem(navList, 'intelligence.html', NAV_ITEMS[1]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
