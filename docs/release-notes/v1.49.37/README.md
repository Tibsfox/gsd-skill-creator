# v1.49.37 — Thermal & Hydrogen Energy Systems and the 16-Project Hub

**Shipped:** 2026-03-10
**Commits:** 5 (+ merge commit)
**Files:** 22 | **Lines:** +7,991 / -12 (net +7,979)
**Branch:** dev → main

## Summary

The 16th and final PNW research project ships — THE (Thermal & Hydrogen Energy Systems), mapping every energy conversion technology as a boundary condition problem. From heat pump refrigerant cycles to PEM fuel cell proton exchange membranes, from solar electrolysis to PNW geothermal and hydroelectric grid integration — six modules trace how intercepting natural gradients becomes civilization's energy infrastructure.

This release also completes the hub integration, bringing the PNW series page and root landing page to 16 projects with updated stats. The Paintless Dog brand mark is optimized from 3.7 MB to 387 KB (384×400, 3× retina) while the original watercolor is preserved as a private source file.

## Key Features

### 1. THE — Thermal & Hydrogen Energy Systems (`www/PNW/THE/`, 17 files, 7,430 lines)

Project #16 in the PNW Research Series. Every technology studied through the lens of gradient interception — the universe tends toward equilibrium; skillfully interrupting that tendency is engineering.

**6 Core Modules:**
- **HVAC & Heat Pumps:** Refrigerant cycles, coefficient of performance, ground-source and air-source systems. PNW maritime climate optimization.
- **Waste Heat Recovery:** Industrial heat cascading, thermoelectric generation, organic Rankine cycles. Waste-to-energy pathway mapping.
- **Catalytic Conversion:** Catalyst chemistry, emissions control, Fischer-Tropsch synthesis. Green chemistry applications.
- **Fuel Cell Technology:** PEM, SOFC, alkaline fuel cells. Hydrogen storage, distribution infrastructure, mobile and stationary applications.
- **Solar Electrolysis:** PV-powered water splitting, electrolyzer types (PEM, alkaline, solid oxide). Green hydrogen production pathways.
- **PNW Geothermal & Hydroelectric:** Cascade Range geothermal potential, Columbia Basin hydroelectric system, BPA grid structure, run-of-river vs. storage.

**3 Cross-Thread Analyses:**
- **Materials Cross-Thread:** Shared materials science across all modules — catalysts, membranes, heat exchangers, electrode materials.
- **Economics Cross-Thread:** Levelized cost comparisons, market trajectories, policy frameworks, PNW-specific incentives.
- **PNW Grid Integration:** How all six technologies connect to the BPA transmission grid, seasonal load profiles, renewable portfolio standards.

**Bibliography:** 40+ sources. **Verification:** 42/42 tests PASS, 7/7 safety-critical PASS.

### 2. Hub Integration — 16 Projects on One Page

- **PNW hub** (`www/PNW/index.html`): THE card added as 16th entry. Stats updated — 16 projects, 354 files, 16 MB, 1,070+ sources, 15 mission packs. All text references updated from "fifteen" to "sixteen."
- **Root landing page** (`www/index.html`): THE card added with energy gradient (red→orange→gold). All count references updated.

### 3. Brand Mark Optimization

The Paintless Dog watercolor brand mark resized from 1178×1228 (3.6 MB) to 384×400 (387 KB) — 89% reduction. Retains full visual fidelity at 3× retina for the 120px display size. The original painting is preserved privately as source art. The gitignore entry removed so the optimized version ships with the repo.

### 4. Release Note Corrections (v1.49.36)

- Paintless Dog painting age corrected to 10 years (2016→2026).
- Dedication moved to sub-header position matching series convention.

## Verification

### THE — Thermal & Hydrogen Energy Systems

| Category | Count | Pass |
|----------|-------|------|
| Safety-Critical | 7 | 7 |
| Core Functionality | 18 | 18 |
| Integration | 10 | 10 |
| Edge Cases | 7 | 7 |
| **Total** | **42** | **42** |

## File Inventory

### New Files (17)

| File | Lines | Role |
|------|-------|------|
| www/PNW/THE/index.html | 175 | THE project overview |
| www/PNW/THE/page.html | 284 | THE markdown renderer |
| www/PNW/THE/style.css | 70 | THE project overrides |
| www/PNW/THE/research/00-sensitivity-protocol.md | 75 | Safety-critical test defs |
| www/PNW/THE/research/00-source-index.md | 95 | Citation schema |
| www/PNW/THE/research/01-hvac-heat-pumps.md | 820 | HVAC & heat pump systems |
| www/PNW/THE/research/02-waste-heat-recovery.md | 805 | Waste heat recovery |
| www/PNW/THE/research/03-catalytic-conversion.md | 810 | Catalytic conversion |
| www/PNW/THE/research/04-fuel-cell-technology.md | 820 | Fuel cell technology |
| www/PNW/THE/research/05-solar-electrolysis.md | 962 | Solar electrolysis |
| www/PNW/THE/research/06-pnw-geothermal-hydroelectric.md | 1,007 | PNW geothermal & hydro |
| www/PNW/THE/research/07-materials-cross-thread.md | 525 | Materials cross-thread |
| www/PNW/THE/research/08-economics-cross-thread.md | 677 | Economics cross-thread |
| www/PNW/THE/research/09-pnw-grid-integration.md | 573 | PNW grid integration |
| www/PNW/THE/research/10-executive-summary.md | 76 | Executive summary |
| www/PNW/THE/research/11-bibliography.md | 74 | Source bibliography |
| www/PNW/THE/research/12-verification-matrix.md | 114 | Test evidence matrix |

### Modified Files (5)

| File | Change | Role |
|------|--------|------|
| .gitignore | -1 line | Remove tibsfox.png ignore |
| docs/release-notes/v1.49.36/README.md | +3/-2 | Painting age + dedication fixes |
| www/PNW/index.html | +16/-8 | THE card + stat updates |
| www/images/tibsfox.png | resize | 3.6 MB → 387 KB brand mark |
| www/index.html | +9/-2 | THE card + count updates |

## PNW Research Series — 16 Projects Complete

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
| 15 | AWF | Clean Air, Water & Food | v1.49.36 |
| 16 | THE | Thermal & Hydrogen Energy | **v1.49.37** |

**Series totals:** 16 projects, 354 files, 16 MB, 1,070+ sources.

## Retrospective

### What Worked

- **Gradient interception as organizing principle.** Framing every energy technology as "intercepting a natural gradient" gave THE a coherent intellectual spine that connects heat pumps to fuel cells to geothermal. The blockquote writes itself when the framing is right.
- **Fleet execution for research modules.** Parallel agent execution across 6 modules delivered 7,430 lines of research in a single session. The sc-dev-team pattern continues to prove reliable for research-scale document generation.
- **Brand mark optimization.** Reducing tibsfox.png from 3.6 MB to 387 KB while keeping 3× retina fidelity closes the production concern flagged in v1.49.36's retrospective. The original stays safe as private source art.

### What Could Be Better

- **Hub update was a separate session.** THE shipped in one commit but the hub integration (card + stats) required a follow-up session. Adding "update hub page" as a standard checklist item for every new PNW project would prevent this gap.
- **Cross-reference matrix needs THE.** The PNW hub's cross-reference table at the bottom of index.html may not include THE columns/rows yet. Future work should audit that table.

## Lessons Learned

1. **Every energy technology is the same physics.** Heat pumps exploit temperature gradients. Fuel cells exploit electrochemical potential gradients. Geothermal taps Earth's thermal gradient. Solar electrolysis uses photon energy gradients. The differences are engineering; the principle is universal.
2. **16 is a good number.** The PNW series now covers atmosphere to aquifer, summit to seafloor, genome to grid, tradition to technology. Each project maps one layer; together they map the bioregion. The series feels complete.
3. **Source art is personal, optimized art is public.** The 3.6 MB watercolor from Paintless Dog is a gift — it lives in private storage. The 387 KB web version serves the brand. Knowing the difference matters.
