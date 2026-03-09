# Research Browser TOC & Navigation — Component Specification

**Date:** 2026-03-09
**Milestone:** Retro-Driven Improvements
**Model Assignment:** Sonnet
**Dependencies:** None
**Target Files:** `www/PNW/*/page.html` (9 files: COL, CAS, ECO, GDN, BCM, SHE, AVI, MAM, BPS)

---

## Problem

Research files run 800-1800+ lines with no persistent navigation aid. The existing page.html template auto-generates a TOC from h2/h3 headings, but it's a static `<div class="toc">` that scrolls away with the content. Users reading a 1,200-line flora document have no way to jump between sections without scrolling to the top. This was flagged in v1.49.22 ("search/filter mechanism within browsers would help navigation") and v1.49.24 ("table of contents or section navigation within the browser").

## Current State

Each project's `page.html` has an inline JavaScript markdown parser (~164 lines) that:
1. Fetches `research/{docname}.md` via the Fetch API
2. Parses markdown line-by-line into HTML
3. Auto-generates heading IDs from text content
4. Builds a `<div class="toc">` with links to h2/h3 headings (if 3+ headings found)
5. Inserts the TOC at the top of the rendered content

The TOC exists but is **not sticky, not collapsible, and not searchable.**

## Solution

Enhance the existing TOC into a proper navigation sidebar with three features:

### 1. Sticky Sidebar TOC

Convert the existing inline TOC into a fixed sidebar on screens wide enough to support it:

```
+-------------------+------------------------------------+
| TOC (sticky)      | Document content                   |
| > Flora Overview  | (scrolls normally)                 |
|   > Taxonomy      |                                    |
|   > Habitats      |                                    |
| > Fauna Overview  |                                    |
|   > Species List  |                                    |
+-------------------+------------------------------------+
```

**Implementation:**
- On viewport >= 1024px: TOC becomes `position: sticky; top: 0; max-height: 100vh; overflow-y: auto` in a left column
- Layout: CSS grid `grid-template-columns: 240px 1fr` wrapping the TOC + content
- On viewport < 1024px: TOC remains inline at the top (current behavior, no regression)
- Active heading highlighted as user scrolls (IntersectionObserver on heading elements)
- Clicking a TOC entry smooth-scrolls to the heading

**Active heading tracking:**
```javascript
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.toc a').forEach(a => a.classList.remove('active'));
      const link = document.querySelector(`.toc a[href="#${entry.target.id}"]`);
      if (link) link.classList.add('active');
    }
  });
}, { rootMargin: '-20% 0px -80% 0px' });

document.querySelectorAll('h2, h3').forEach(h => observer.observe(h));
```

### 2. Section Anchor Links

Add a hover-visible anchor icon to every h2 and h3 heading:

```css
h2:hover .anchor, h3:hover .anchor {
  opacity: 1;
}
.anchor {
  opacity: 0;
  margin-left: 0.3em;
  text-decoration: none;
  color: var(--rock);
  transition: opacity 0.2s;
}
```

Implementation: the markdown parser already generates heading IDs. After rendering, inject `<a class="anchor" href="#id">#</a>` into each h2/h3 element.

### 3. Quick-Filter Search

Add a search input at the top of the TOC that filters TOC entries by text:

```html
<input type="text" class="toc-search" placeholder="Filter sections...">
```

- Filters TOC entries as the user types (case-insensitive substring match)
- Non-matching entries get `display: none`
- Clearing the input restores all entries
- No debounce needed (TOC entries are typically < 30)
- This is TOC filtering, not full-text document search (keeps it lightweight)

## Consistency Across Projects

All 9 `page.html` files must be updated identically. The current implementations are already identical across projects (same markdown parser, same TOC generation). The enhancement is applied as the same code block to each file.

**Projects to update:**
1. `www/PNW/COL/page.html`
2. `www/PNW/CAS/page.html`
3. `www/PNW/ECO/page.html`
4. `www/PNW/GDN/page.html`
5. `www/PNW/BCM/page.html`
6. `www/PNW/SHE/page.html`
7. `www/PNW/AVI/page.html`
8. `www/PNW/MAM/page.html`
9. `www/PNW/BPS/page.html`

## Acceptance Criteria

1. TOC is sticky sidebar on viewport >= 1024px, inline on smaller screens
2. Active heading is highlighted in TOC as user scrolls through document
3. Clicking TOC entry smooth-scrolls to the heading
4. Anchor links appear on hover for every h2/h3 heading
5. TOC search input filters entries by substring match
6. All 9 project page.html files have identical navigation behavior
7. Documents with < 3 headings show no TOC (existing behavior preserved)
8. Zero external dependencies
9. Works on file:// protocol (offline)
10. Existing CSS theme variables used for all colors (no hardcoded values)

## Technical Notes

- Use `scroll-behavior: smooth` on the content container
- The `series.js` nav bar sits at the top — the sticky TOC starts below it
- Each project's `style.css` defines its color palette — the TOC inherits via CSS variables
- IntersectionObserver is supported in all modern browsers (no polyfill needed)
- Keep all JavaScript inline in each page.html (matches existing architecture)

---

*Component spec for Retro-Driven Improvements milestone. Self-contained — no external references needed for implementation.*
