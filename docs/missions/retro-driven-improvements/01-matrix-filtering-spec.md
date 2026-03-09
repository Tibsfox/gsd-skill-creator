# Cross-Reference Matrix Filtering — Component Specification

**Date:** 2026-03-09
**Milestone:** Retro-Driven Improvements
**Model Assignment:** Sonnet
**Dependencies:** None
**Target File:** `www/PNW/index.html`

---

## Problem

The PNW master index cross-reference matrix has 15 topic rows and 9 project columns (10 with BRC). At 9 columns it already requires horizontal scrolling on screens narrower than ~1200px. This was flagged in v1.49.24, v1.49.25, and v1.49.26 — the most persistent unresolved issue in the retrospectives. The stated threshold is "needs grouping or filtering at 10+ projects."

## Current State

**File:** `www/PNW/index.html`

The matrix is a standard HTML `<table>` with:
- 15 rows (Flora, Fauna, Fungi, Aquatic, Climate, Networks, Heritage, Materials, Seismic, Building Codes, Electronics, IoT/Smart Home, Sensing/Physics, Verification, Mission PDF)
- 9 columns (COL, CAS, ECO, GDN, BCM, SHE, AVI, MAM, BPS)
- Each cell contains a direct link to the relevant document
- No filtering, no grouping, no responsive behavior beyond basic CSS

## Solution

Add two complementary features:

### 1. Category Group Toggles

Group the 15 topic rows into 4 collapsible categories:

| Category | Topics | Color Accent |
|----------|--------|-------------|
| **Living Systems** | Flora, Fauna, Fungi, Aquatic, Climate, Networks | `--meadow` (green) |
| **Built Environment** | Materials, Seismic, Building Codes | `--bark` (brown) |
| **Technology** | Electronics, IoT/Smart Home, Sensing/Physics | `--river` (blue) |
| **Meta** | Heritage, Verification, Mission PDF | `--rock` (gray) |

Each category header is a clickable row that toggles visibility of its child rows. Default state: all expanded. Categories use the existing CSS variable palette.

Implementation:
- Add `data-category="living-systems"` (etc.) attributes to each `<tr>`
- Add category header rows with `class="category-toggle"` and a chevron indicator
- JavaScript toggle: click header → show/hide rows with matching `data-category`
- Store toggle state in `localStorage` so it persists across page loads
- Chevron rotates on toggle (CSS transform, no images)

### 2. Column Filter Chips

Add a row of filter chips above the table, one per project:

```html
<div class="matrix-filters">
  <button class="filter-chip active" data-col="col">COL</button>
  <button class="filter-chip active" data-col="cas">CAS</button>
  <!-- ... one per project ... -->
</div>
```

- Each chip toggles a column's visibility
- Active chips use the project's tag color (`.tag-col`, `.tag-cas`, etc.)
- Inactive chips are grayed out
- "All" and "None" convenience buttons
- Column visibility stored in `localStorage`
- Implementation: toggle `display: none` on `<th>` and `<td>` by column index

### 3. Responsive Fallback

At viewport widths below 768px, the matrix automatically switches to a card layout:

```
[COL] Flora | Fauna | Fungi | ...
[CAS] Flora | Fauna | Aquatic | ...
```

Each project becomes a card showing only its non-empty cells as tag links. This eliminates horizontal scrolling entirely on mobile.

Implementation:
- CSS `@media (max-width: 768px)` hides the table
- JavaScript generates card view from same data
- Cards use the existing project card grid (`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`)

## Acceptance Criteria

1. Matrix is fully usable (no horizontal scroll) at 12 columns on a 1920px-wide viewport
2. Category toggles expand/collapse row groups with smooth animation
3. Column filter chips show/hide columns independently
4. Toggle and filter state persists across page loads via localStorage
5. Mobile card view activates at viewport < 768px with no horizontal scroll
6. All existing links remain functional (no broken hrefs)
7. Zero external dependencies (no libraries, no CDN)
8. Works offline (file:// protocol)

## Technical Notes

- The existing CSS uses `--canopy`, `--forest`, `--meadow`, `--river`, `--rock`, `--bark` variables — reuse these for category accents
- The existing `.tag-*` classes provide per-project colors — reuse for filter chips
- Keep all JavaScript inline in the HTML file (matches existing architecture)
- The `series.js` shared nav bar must not be affected

---

*Component spec for Retro-Driven Improvements milestone. Self-contained — no external references needed for implementation.*
