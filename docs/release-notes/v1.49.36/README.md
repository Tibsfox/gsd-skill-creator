# v1.49.36 — AWF Living Systems Research and the Root Landing Page

### For Paintless Dog — who painted the fox that became the brand. The painting defines the visual language: warm parchment, fox orange, ink structure. Ten years later, it still sets the palette.

**Shipped:** 2026-03-10
**Commits:** 5 (+ merge commit)
**Files:** 75 | **Lines:** +6,362 / -2,308 (net +4,054) | **New assets:** brand.css, tibsfox.png
**Branch:** dev → main

## Summary

Three interlocking pieces ship together. A brand design system derived from a 2016 watercolor fox painting, cascaded across all 15 PNW research projects. The 15th PNW project itself — AWF (Clean Air, Water & Food), mapping purification systems and ecological restoration as one interconnected living filter network. And a root landing page that finally gives the entire research library a proper front door.

This release also completes the VAV dark-mode migration, bringing all 15 projects onto the shared brand foundation and eliminating ~2,300 lines of duplicated CSS.

## Key Features

### 1. Brand Design System — Paintless Dog Palette (`www/brand.css`, 480 lines)

A comprehensive CSS design system derived from the 2016 Paintless Dog watercolor fox painting. The painting defines four color tiers that become the brand foundation:

- **Ink & Structure** — linework, ear tips, dark marks (#2a2a2a → #8a8884)
- **Parchment** — paper ground, tea stains, washes (#c8b890 → #f5f0e6)
- **Fox** — fur spectrum, rust to bright (#9e4425 → #f8e4c0)
- **Cool** — ear interior, ink washes, charcoal (#2a3a3a → #b0b4b0)

**16 project accent palettes** defined as CSS variables, each with accent/light/dark/gradient variants. **Semantic tokens** for page-bg, card-bg, link, border that projects override to keep their identity while sharing the foundation. **18 tag color classes** for per-project visual identity.

**Brand mark:** `www/images/tibsfox.png` — the original watercolor (3.7 MB).

### 2. Brand Cascade — 15 Projects on One Foundation (56 files, -2,308 lines net)

All 15 PNW projects migrated from standalone CSS (150-225 lines each) to brand.css overrides (60-80 lines each). Each project's `style.css` now contains only project-specific colors, header gradients, tag definitions, and custom components.

**Pattern:** `<link rel="stylesheet" href="../../brand.css">` loads first, then `<link rel="stylesheet" href="style.css">` provides overrides. Body gets `class="project-{code}"` for accent variable activation.

**13 projects** cascaded in commit `200c3c49`. **VAV** migrated from dark mode (#0d1117 background, IBM Plex Sans, Ceph teal/amber) to the warm brand foundation in commit `cda53c18`, completing the set. VAV retains its indigo/teal identity through color overrides on the shared layout.

**Series navigation** (`series.js`) updated to use brand palette variables.

### 3. AWF — Clean Air, Water & Food (`www/PNW/AWF/`, 14 files, 4,964 lines)

Project #15 in the PNW Research Series. The living filter network — how intact ecosystems purify air, water, and food, and what happens when those systems break.

**Track A — Purification Systems (3 modules):**
- **Air Purification:** 8+ technologies (HEPA, UV-C, plasma, photocatalytic oxidation). NIST 2025 byproduct testing. $15.5B→$28.5B market. PNW: wildfire smoke PM2.5, Puget Sound maritime inversions.
- **Water Filtration:** 8+ technologies (RO, GAC, UV, nanofiltration, electrochemical). EPA 2024 PFAS standards (4 ppt PFOA/PFOS). U of Michigan boron breakthrough. PNW: PFAS at military bases, agricultural nitrate runoff.
- **Food Safety:** Pesticide MRL frameworks (EPA, EU, FAO/WHO). USDA PDP 2024 vs EWG 2025. Legacy contaminants. PNW: tree fruit orchard IPM, maritime climate pest management.

**Track B — Ecology Systems (3 modules):**
- **Pollinator Health:** 2025 colony collapse crisis — 1.7M colonies lost, 62% average loss. Varroa/amitraz resistance mechanism. PNAS 2025: 1-in-5 pollinator species at elevated extinction risk.
- **Wildlife Habitat:** 5+ landscape types with restoration methodology. Wildlife nutritional ecology. Corridor connectivity, urban rewilding.
- **Forest Conservation:** 8.1M hectares lost in 2024, 63% above 2030 trajectory. Amazon tipping point science. Maya Biosphere Reserve: near-zero deforestation. EUDR, AI remote sensing.

**Synthesis:** 4 causal pathways traced across all modules — pesticides→pollinators→food, deforestation→rainfall→agriculture, air quality→plant health→ecosystems, water contamination→crops→wildlife.

**Bibliography:** 51 sources (GOV 12, PEER 19, WHO 1, PRO 19). Zero entertainment media.

### 4. Root Landing Page (`www/index.html`, 313 lines)

Entry point for the entire Tibsfox research library. Card grid linking all 15 PNW projects, ART (visual art science), UNI (Unison language research), and the full release history. Stats display, responsive design, brand header with the Paintless Dog watercolor.

## Verification

### AWF — Clean Air, Water & Food

| Category | Count | Pass |
|----------|-------|------|
| Safety-Critical | 7 | 7 |
| Core Functionality | 18 | 18 |
| Integration | 6 | 6 |
| Edge Cases | 5 | 5 |
| **Total** | **36** | **36** |

**Safety-critical tests:** SC-SRC (source traceability), SC-NUM (numerical attribution), SC-ADV (no policy advocacy), SC-END (no endangered species GPS), SC-MED (peer-reviewed health claims), SC-CLI (IPCC-sourced climate projections), SC-COL (pre-review paper flagged).

### Brand Cascade

| Metric | Before | After |
|--------|--------|-------|
| Projects on brand.css | 0 | 15 |
| Average project CSS | ~175 lines | ~68 lines |
| Total CSS eliminated | — | ~2,300 lines |
| Accent palettes | — | 16 (+ 18 tag classes) |

## File Inventory

### New Files (18)

| File | Lines | Role |
|------|-------|------|
| www/brand.css | 480 | Shared brand design system |
| www/index.html | 313 | Root landing page |
| www/images/tibsfox.png | (binary) | Brand mark watercolor |
| www/PNW/AWF/index.html | 198 | AWF project overview |
| www/PNW/AWF/page.html | 279 | AWF markdown renderer |
| www/PNW/AWF/style.css | 70 | AWF overrides |
| www/PNW/AWF/research/00-sensitivity-protocol.md | 83 | Safety-critical test defs |
| www/PNW/AWF/research/00-source-index.md | 84 | Citation schema |
| www/PNW/AWF/research/01-air-purification.md | 367 | Air purification tech |
| www/PNW/AWF/research/02-water-filtration.md | 341 | Water filtration tech |
| www/PNW/AWF/research/03-food-safety.md | 398 | Pesticide MRL frameworks |
| www/PNW/AWF/research/04-pollinator-health.md | 802 | Pollinator crisis |
| www/PNW/AWF/research/05-wildlife-habitat.md | 821 | Habitat restoration |
| www/PNW/AWF/research/06-forest-conservation.md | 803 | Forest loss + EUDR |
| www/PNW/AWF/research/07-cross-domain-nexus.md | 313 | Causal pathways |
| www/PNW/AWF/research/08-bibliography.md | 181 | 51 consolidated sources |
| www/PNW/AWF/research/09-verification-matrix.md | 199 | Test evidence |

### Modified Files (57)

All 15 PNW project HTML files (index, page, mission) updated with brand.css link and project class. All 15 project style.css files reduced to overrides. PNW hub (index.html, style.css, series.js) updated.

## PNW Research Series — 15 Projects Complete

| # | Code | Subject | Status |
|---|------|---------|--------|
| 1 | COL | Columbia Valley Rainforest | v1.49.22 |
| 2 | CAS | Cascade Range Biodiversity | v1.49.23 |
| 3 | ECO | Living Systems Taxonomy | v1.49.35 |
| 4 | GDN | PNW Gardening | v1.49.24 |
| 5 | BCM | Building Construction Mastery | v1.49.24 |
| 6 | SHE | Smart Home & DIY Electronics | v1.49.24 |
| 7 | AVI | Wings of the Pacific Northwest | v1.49.25 |
| 8 | MAM | Fur, Fin & Fang | v1.49.25 |
| 9 | BPS | Bio-Physics Sensing Systems | v1.49.26 |
| 10 | FFA | Furry Fandom Arts | v1.49.29 |
| 11 | TIBS | Traditions & Indigenous Knowledge | v1.49.31 |
| 12 | LED | LED Lighting & Controllers | v1.49.33 |
| 13 | SYS | Systems Administration | v1.49.33 |
| 14 | VAV | Voxel Architecture & Visualization | v1.49.35 |
| 15 | AWF | Clean Air, Water & Food | **v1.49.36** |

**Series totals:** 15 projects, 340+ files, 15+ MB, 1,080+ sources.

## Retrospective

### What Worked

- **Brand-first, then cascade.** Building the design system as a standalone artifact (brand.css) before touching any project file meant every migration was mechanical: add the link, add the class, strip the duplicates. No design decisions during the migration pass — they were all made upfront.
- **Paintless Dog as source of truth.** Deriving the entire palette from a single painting gave the brand visual coherence that arbitrary color picks could not. The fox orange, parchment, and ink tiers are not branding choices — they are what the painting already is. Eight years of distance confirmed the palette still works.
- **AWF three-pass editorial.** Content → review → improvement. The review found 3 systemic issues (PNW specificity gaps in Track A, citation gaps in Module 05, hub not updated). The improvement run closed them in one focused pass before commit. Ship quality was materially higher than first-draft quality.
- **VAV migration last.** Saving the dark-mode outlier for a separate commit after the 13-project cascade proved cleaner. The pattern was established and proven before applying it to the edge case.
- **Root landing page as integration test.** Building the root index.html forced a review of every project card, gradient, and tag — effectively a visual integration test for the brand system.

### What Could Be Better

- **tibsfox.png is 3.7 MB.** The brand mark watercolor is shipped at original resolution. A production deployment should serve a resized version (200-300 KB). The full resolution should be preserved as source but not served to browsers.
- **Review caught the AWF card gap.** The root landing page was committed with 14 project cards despite AWF being the 15th project in the same release. The review pass caught this — if it hadn't, the root page would have shipped inconsistent. Checklist item: always verify root page project count matches PNW hub project count.
- **Model assignment creates consistency gaps.** AWF Track A (Sonnet-generated) was competent but generic. Track B (Opus-generated) had PNW depth and specificity. The improvement pass fixed this, but planning for model-specific review passes from the start would be more efficient.

## Lessons Learned

1. **A painting is a design system.** Paintless Dog's fox watercolor from 2016 contained every color decision the brand needed. The palette wasn't designed — it was extracted. When the source is right, the system writes itself.
2. **DRY applies to CSS too.** 15 projects × ~175 lines of near-identical CSS = ~2,300 lines of pure duplication. The cascade eliminated all of it while giving each project more visual identity through focused overrides, not less.
3. **Dark mode is a design choice, not a requirement.** VAV's dark mode was intentional but created a maintenance island. Migrating it to the shared foundation with indigo/teal overrides preserved the identity while eliminating the isolation. The project looks different but belongs to the same family.
4. **Living systems research is one system.** AWF's causal pathways (pesticides→pollinators→food, deforestation→rainfall→agriculture) proved what the blockquote claims: each PNW project maps a different layer of the same place. The modules are not parallel — they are interconnected.
5. **The front door matters.** 15 projects, 340+ files, 15+ MB of research content — and until this release, no root landing page. The index.html is not decoration. It is the map that makes the territory navigable.
