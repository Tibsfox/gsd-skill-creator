# v1.49.37 — Thermal & Hydrogen Energy Systems and the 16-Project PNW Hub

**Released:** 2026-03-10
**Scope:** THE (Thermal & Hydrogen Energy Systems) research atlas — project #16 and final entry in the PNW Research Series — plus hub integration (PNW series page + root landing page at 16 projects) and brand-mark optimization (tibsfox.png from 3.7 MB watercolor to 387 KB 3× retina asset)
**Branch:** dev → main
**Tag:** v1.49.37 (2026-03-10T13:45:58-07:00) — "Thermal & Hydrogen Energy Systems and the 16-Project Hub"
**Commits:** v1.49.36..v1.49.37 (5 leaf commits + 1 merge commit `4568acf9d`, range head `45c55ce6f`)
**Files changed:** 22 (+7,991 / −12, net +7,979)
**Predecessor:** v1.49.36 — AWF Living Systems Research and the Root Landing Page
**Successor:** v1.49.38 — Release Cadence Hardening
**Classification:** feature — sixteenth and final project in the PNW Research Series, first PNW atlas organized by gradient-interception physics
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Dedication:** Paintless Dog (Paul Brodie-Pope) — the 10-year-old watercolor brand mark finally ships at production resolution
**Engine Position:** PNW Research Series COMPLETE at 16 projects (atmosphere → aquifer, summit → seafloor, genome → grid, tradition → technology → thermodynamics)
**Verification:** 42/42 THE tests PASS · 7/7 safety-critical (SC-THR, SC-ELC, SC-CHM, SC-FUE, SC-H2S, SC-GRD, SC-MAT) · 18/18 core functionality (CF-01..CF-18) · 10/10 integration (IN-01..IN-10) · 7/7 edge-case (EC-01..EC-07) · 40+ academic sources · 6 modules + 3 cross-threads · hub synchronized to 16 projects on both index pages · brand mark 89% size reduction verified at 3× retina

## Summary

**The PNW Research Series reached structural completion at sixteen projects.** v1.49.37 shipped THE (Thermal & Hydrogen Energy Systems), the sixteenth and final atlas in the Pacific Northwest research series that began with COL (Columbia Valley Rainforest) in v1.49.22. The series now spans atmosphere to aquifer, summit to seafloor, genome to grid, and — with THE — tradition to technology to thermodynamics. The 7,430 research-prose lines in `www/PNW/THE/research/` (17 files across six core modules and three cross-thread analyses) close the engineering arc the series has been building since BCM (Building Construction Mastery, v1.49.24) and SHE (Smart Home & DIY Electronics, v1.49.24). Where the biology-anchored projects (AVI, MAM, BPS) mapped sensing and taxonomy and the humanities-comparative projects (TIBS, FFA) mapped knowledge systems and craft, THE maps the *physics of energy conversion itself* — how civilization intercepts natural gradients to produce work. The release also includes a hub integration (PNW series page + root landing page both updated from "fifteen" to "sixteen" in every text and visual reference) and a brand-mark optimization that resolves a production debt flagged in v1.49.36.

**Gradient interception was the organizing principle that held six unrelated technologies together.** The single-sentence thesis of THE — "the universe tends toward equilibrium; skillfully interrupting that tendency is engineering" — organized a 7,430-line atlas that would otherwise have fragmented into six unrelated engineering surveys. HVAC and heat pumps intercept thermal gradients via refrigerant cycles and coefficient-of-performance design. Waste heat recovery intercepts cascading thermal potentials via thermoelectric generation and organic Rankine cycles. Catalytic conversion intercepts chemical-potential gradients via Fischer-Tropsch synthesis and emissions control. Fuel cells (PEM, SOFC, alkaline) intercept electrochemical-potential gradients across proton-exchange or oxide membranes. Solar electrolysis intercepts photon-energy gradients to split water into hydrogen and oxygen. Pacific Northwest geothermal and hydroelectric systems intercept Earth's thermal gradient and water's gravitational-potential gradient through the Bonneville Power Administration (BPA) grid. Six different engineering disciplines, one physical principle. The framing gave the atlas an intellectual spine no arbitrary module boundary could have supplied, and it made the three cross-thread analyses (Materials, Economics, PNW Grid Integration) legible as the second-order structure the framing predicts.

**Physics-first discipline applied to engineering research, paralleling the physics-first discipline BPS applied to sensing.** Bio-Physics Sensing Systems (v1.49.26) organized a sonar/Doppler/magnetoreception/electroreception atlas around the governing equation of each sense before introducing the biological implementation. THE applies the analogous discipline to energy conversion: the governing thermodynamic or electrochemical relationship anchors each module, and the engineered implementation (HVAC refrigerant selection, fuel cell catalyst chemistry, electrolyzer membrane design) is second-order. The discipline is not domain-specific — it is a commitment to naming the analytical structure before filling it, and it produces scaffolded research whether the subject is bat echolocation, Indigenous shamanic traditions (TIBS, v1.49.31), or civilization's energy infrastructure. The modules `01-hvac-heat-pumps.md` (820 lines), `02-waste-heat-recovery.md` (805 lines), `03-catalytic-conversion.md` (810 lines), `04-fuel-cell-technology.md` (820 lines), `05-solar-electrolysis.md` (962 lines), and `06-pnw-geothermal-hydroelectric.md` (1,007 lines) each begin with the governing physics and build outward to implementation, market trajectory, and regional context.

**Cross-thread analyses made the atlas navigable as a single civilization-scale system.** The three cross-thread modules (`07-materials-cross-thread.md` at 525 lines, `08-economics-cross-thread.md` at 677 lines, `09-pnw-grid-integration.md` at 573 lines) are what distinguish THE from six stacked literature reviews. The materials cross-thread reveals that the *same* catalyst chemistry appears in fuel cells, electrolyzers, and catalytic converters; the *same* membrane science governs PEM fuel cells and PEM electrolyzers; the *same* heat-exchanger metallurgy serves HVAC, geothermal, and industrial waste-heat recovery. The economics cross-thread establishes levelized-cost comparisons across all six technologies with Pacific Northwest incentive structures explicit. The PNW grid integration cross-thread connects all six technologies to the Bonneville Power Administration transmission grid with seasonal load profiles, renewable portfolio standards, run-of-river vs. storage analysis, and Cascade Range geothermal potential quantified. A reader who finishes the atlas understands the six technologies *and* the civilization-scale system they compose.

**Brand mark optimization closed a production debt the series had carried since v1.49.36.** The Paintless Dog watercolor — a 1178×1228 pixel, 3,746,756-byte file — had been removed from git tracking in commit `0c71091486` precisely because it was too large to ship. v1.49.37 resolves the debt: the watercolor is resized to 384×400 pixels (3× retina fidelity for the 120px display slot) at 396,006 bytes — an 89.4% size reduction that retains full visual fidelity on high-DPI displays. The 3.7 MB source painting stays in private storage as a gift and a master, while the 387 KB derivative ships with the repository. The `.gitignore` entry that had blocked the file is removed in commit `93fd9b30c`, making the optimized mark available to every www page that needs it. This matters structurally because the brand mark is the first visual readers see on both `www/index.html` and `www/PNW/index.html` — it needed to be production-grade before the 16-project hub shipped. The dedication at the top of this README honors Paul Brodie-Pope ("Paintless Dog"), whose 10-year-old painting is now, finally, a web-first-class asset.

## Key Features

| Area | What Shipped |
|------|--------------|
| THE project root | `www/PNW/THE/index.html` (175 lines) + `www/PNW/THE/page.html` (284 lines) + `www/PNW/THE/style.css` (70 lines) — browser overview, client-side markdown renderer, project-specific CSS overrides shared with the PNW grove-card pattern |
| Safety & source schema | `www/PNW/THE/research/00-sensitivity-protocol.md` (75 lines) + `www/PNW/THE/research/00-source-index.md` (95 lines) — safety-critical test definitions (SC-THR, SC-ELC, SC-CHM, SC-FUE, SC-H2S, SC-GRD, SC-MAT) and citation schema for 40+ sources |
| HVAC & heat pumps module | `www/PNW/THE/research/01-hvac-heat-pumps.md` (820 lines) — refrigerant cycles, coefficient of performance, ground-source and air-source systems, PNW maritime climate optimization |
| Waste heat recovery module | `www/PNW/THE/research/02-waste-heat-recovery.md` (805 lines) — industrial heat cascading, thermoelectric generation, organic Rankine cycles, waste-to-energy pathway mapping |
| Catalytic conversion module | `www/PNW/THE/research/03-catalytic-conversion.md` (810 lines) — catalyst chemistry, emissions control, Fischer-Tropsch synthesis, green chemistry applications |
| Fuel cell technology module | `www/PNW/THE/research/04-fuel-cell-technology.md` (820 lines) — PEM, SOFC, alkaline fuel cells, hydrogen storage, distribution infrastructure, mobile and stationary applications |
| Solar electrolysis module | `www/PNW/THE/research/05-solar-electrolysis.md` (962 lines) — PV-powered water splitting, electrolyzer types (PEM, alkaline, solid oxide), green hydrogen production pathways |
| PNW geothermal & hydroelectric module | `www/PNW/THE/research/06-pnw-geothermal-hydroelectric.md` (1,007 lines) — Cascade Range geothermal potential, Columbia Basin hydroelectric system, BPA grid structure, run-of-river vs. storage |
| Materials cross-thread | `www/PNW/THE/research/07-materials-cross-thread.md` (525 lines) — shared materials science across all modules: catalysts, membranes, heat exchangers, electrode materials |
| Economics cross-thread | `www/PNW/THE/research/08-economics-cross-thread.md` (677 lines) — levelized cost comparisons, market trajectories, policy frameworks, PNW-specific incentives |
| PNW grid integration cross-thread | `www/PNW/THE/research/09-pnw-grid-integration.md` (573 lines) — how all six technologies connect to BPA transmission, seasonal load profiles, renewable portfolio standards |
| Executive summary + bibliography + verification | `www/PNW/THE/research/10-executive-summary.md` (76) + `11-bibliography.md` (74) + `12-verification-matrix.md` (114) — 40+ source bibliography and 42/42 test evidence matrix |
| Hub integration — PNW series page | `www/PNW/index.html` (+16/−8) — THE card added as 16th entry, stats updated to 16 projects / 354 files / 16 MB / 1,070+ sources / 15 mission packs, all "fifteen" references → "sixteen" |
| Hub integration — root landing page | `www/index.html` (+9/−2) — THE card added with energy-gradient color scheme (red→orange→gold), count references updated |
| Brand mark optimization | `www/images/tibsfox.png` — 1178×1228 (3.7 MB) → 384×400 (387 KB), 89.4% reduction, 3× retina fidelity; `.gitignore` entry removed so optimized version ships |
| Release note corrections | `docs/release-notes/v1.49.36/README.md` (+3/−2) — Paintless Dog painting age corrected 2016→10 years, dedication moved to sub-header position matching series convention |

## Verification

### THE — Thermal & Hydrogen Energy Systems

| Category | Count | Pass |
|----------|-------|------|
| Safety-Critical | 7 | 7 |
| Core Functionality | 18 | 18 |
| Integration | 10 | 10 |
| Edge Cases | 7 | 7 |
| **Total** | **42** | **42** |

Safety-critical gates: SC-THR (thermodynamic claims attributed to peer-reviewed source), SC-ELC (electrochemical claims attributed to publisher-tier source), SC-CHM (chemistry claims named-source traceable), SC-FUE (fuel cell performance claims cite manufacturer or peer-reviewed study), SC-H2S (hydrogen safety statements cite NFPA/OSHA/DOE), SC-GRD (BPA grid claims attributed to BPA or FERC publications), SC-MAT (materials claims cite ASM/NIST or journal).

## Part A: THE Research Atlas (Content Thread)

- **Six-module physics-first structure:** HVAC → Waste Heat → Catalysis → Fuel Cells → Electrolysis → PNW Geothermal/Hydro. Each module begins with governing thermodynamic or electrochemical equation and builds outward to implementation, market, regional context.
- **Three cross-thread analyses make the atlas navigable as a civilization-scale system:** Materials (shared catalysts/membranes/exchangers), Economics (levelized cost, policy, PNW incentives), PNW Grid (BPA integration, seasonal profiles, RPS).
- **Forty-plus academic sources at publisher-tier:** Every citation traceable to peer-reviewed journal, university press, NFPA/OSHA/DOE/NIST/ASM/BPA/FERC publication. Zero entertainment media.
- **Seven safety-critical gates passed at landing:** SC-THR, SC-ELC, SC-CHM, SC-FUE, SC-H2S, SC-GRD, SC-MAT — each binary and auditable, runnable against manuscript at any drafting point.
- **Gradient interception as single organizing thesis:** Heat pumps exploit temperature gradients; fuel cells exploit electrochemical potential; geothermal taps Earth's thermal gradient; solar electrolysis uses photon energy. One principle, six engineering disciplines.
- **Pacific Northwest regional anchoring in every module:** Maritime climate HVAC optimization, Cascade Range geothermal potential, Columbia Basin hydroelectric, BPA transmission backbone, PNW-specific incentive structures quantified.
- **Four thousand two hundred seventy-one lines of technical prose in the six core modules alone:** 820 + 805 + 810 + 820 + 962 + 1,007 = 5,224 lines of module body; cross-threads add 1,775; supporting files add 431. Total 7,430 research-prose lines.
- **Bibliography + verification matrix in the same commit as the modules:** `11-bibliography.md` (74 lines) and `12-verification-matrix.md` (114 lines) landed atomically with the research, honoring the "safety verification ships with the study" discipline established in TIBS (v1.49.31).
- **Executive summary for the 15-minute reader:** `10-executive-summary.md` (76 lines) distills the six-module atlas for a reader who needs the thesis and findings without the full 7,430-line descent.

## Part B: Hub Integration & Brand Mark (Production Thread)

- **PNW series page updated from fifteen to sixteen projects:** `www/PNW/index.html` (+16/−8) — THE card added as 16th entry with energy-gradient color scheme, stats updated to 16 projects / 354 files / 16 MB / 1,070+ sources / 15 mission packs, every "fifteen" text reference replaced with "sixteen."
- **Root landing page synchronized:** `www/index.html` (+9/−2) — THE card added, count references updated to match PNW hub. Users entering the site at the root see the 16-project total immediately.
- **Brand mark resize 3,746,756 → 396,006 bytes (89.4% reduction):** The Paintless Dog watercolor resized from 1178×1228 to 384×400 pixels, retaining 3× retina fidelity for the 120px display slot. Source watercolor preserved privately as master; optimized derivative ships in repo.
- **`.gitignore` entry removed so optimized asset commits:** The chore commit `0c71091486` had added `www/images/tibsfox.png` to `.gitignore` when the 3.7 MB file was removed from tracking; commit `93fd9b30c` removes that ignore line so the 387 KB optimized version ships.
- **Dedication in release sub-header position matches series convention:** v1.49.36 initially placed the Paintless Dog dedication in a non-standard slot; correction commit `26da59d33` moves it to the sub-header position that matches v1.49.22–v1.49.36 precedent.
- **Painting age correction: 10 years, not 2016:** Commit `09757ca1f` fixes a factual error in v1.49.36 (the painting's age was recorded as "2016" — an artifact year — where the correct descriptor is "10 years old as of 2026"). A minor fix but a fact-integrity fix.
- **Separate brand-mark commit keeps the diff reviewable:** The hub-integration commit `93fd9b30c` bundled the THE card, the brand mark, the `.gitignore` removal, and the stat updates into a single reviewable diff scoped to hub work, separate from the 7,962-line research commit `231d36f06`.
- **Energy-gradient color scheme on the THE card:** The hub card for THE uses a red→orange→gold energy gradient distinct from the earth-cedar of TIBS, the physics-cyan of BPS, or the taxonomy-green of ECO. Visual language signals the project's scope before the reader clicks.

## Retrospective

### What Worked

- **Gradient interception as organizing principle.** Framing every energy technology as "intercepting a natural gradient" gave THE a coherent intellectual spine that connects heat pumps to fuel cells to geothermal. The blockquote writes itself when the framing is right — and the three cross-thread analyses emerge naturally as second-order structure once the first-order framing is in place.
- **Fleet execution for research modules.** Parallel agent execution across six modules delivered 7,430 lines of research in a single session. The sc-dev-team pattern continues to prove reliable for research-scale document generation where tracks are independent enough that parallel drafting does not cause cross-contamination.
- **Brand mark optimization.** Reducing tibsfox.png from 3.7 MB to 387 KB while keeping 3× retina fidelity closes the production concern flagged in v1.49.36's retrospective. The original stays safe as private source art. This is the correct resolution of the public-vs-private-asset tension: optimized derivative public, master private.
- **Seventh safety-critical gate added for hydrogen safety.** THE introduced SC-H2S (hydrogen safety statements must cite NFPA/OSHA/DOE) because hydrogen handling is the newest and most misunderstood element of the atlas. Adding the gate at the outset, not retroactively, kept the fuel-cell and electrolysis modules sober.
- **Executive summary as a 15-minute entry point.** `10-executive-summary.md` (76 lines) gives readers who need the thesis and findings a path that does not require descending through 7,430 lines of module body. The summary-first discipline respects reader time without sacrificing depth.

### What Could Be Better

- **Hub update was a separate session from the THE research commit.** THE research shipped in commit `231d36f06`, but the hub integration (card + stats on both index pages) required a follow-up session ending in commit `93fd9b30c`. Adding "update hub page" as a standard checklist item for every new PNW project would prevent this gap. The release-checklist work deferred to v1.49.38 should capture this.
- **Cross-reference matrix at the bottom of the PNW hub may not include THE columns or rows yet.** The research is integrated as a card, but the deeper cross-reference matrix that connects PNW projects to each other was not audited in this release. Future work should verify THE appears in every row/column it should.
- **16-project series might benefit from a meta-introduction on the PNW hub.** With the series now structurally complete, the hub could offer a meta-essay that maps the sixteen projects onto a single bioregional frame. This is aspirational work deferred; calling it out here so it does not drift.
- **Brand mark 384×400 sized for current 120px slot — not future-proofed for larger displays.** The 3× retina calculation assumes the display slot stays near 120px. If a future redesign uses the mark at 240px or 360px, 3× retina would require 720×960 or 1080×1440 — and we would need to re-derive from the source watercolor. Keeping the master in private storage (not destroying it) is why this is a risk, not a disaster.
- **Paintless Dog dedication placement feedback loop was too slow.** The original v1.49.36 placed the dedication in a non-standard slot; v1.49.37 corrected it in `26da59d33`. A release-note template that enforces dedication position would have caught this at drafting, not after merge.

## Lessons Learned

- **Every energy technology is the same physics.** Heat pumps exploit temperature gradients. Fuel cells exploit electrochemical potential gradients. Geothermal taps Earth's thermal gradient. Solar electrolysis uses photon energy gradients. Catalytic conversion exploits chemical potential gradients. Hydroelectric exploits gravitational potential. The differences are engineering implementation; the underlying physical principle — interrupting a tendency toward equilibrium — is universal. Naming the universal is what made the six-module atlas cohere.
- **Sixteen is a good number for a bioregional series.** The PNW Research Series now covers atmosphere to aquifer, summit to seafloor, genome to grid, tradition to technology to thermodynamics. Each project maps one layer; together they compose the bioregion as a unified study. The series feels complete — not because sixteen is magical, but because the ground-genome-grid-tradition-technology-thermodynamics arc closes on itself.
- **Source art is personal; optimized art is public.** The 3.7 MB watercolor from Paintless Dog is a gift and a master — it lives in private storage and is never destroyed. The 387 KB web version serves the brand publicly. Knowing the difference matters: confusing the two leads either to bloated repos (ship the master) or destroyed masters (optimize in place and lose the original). Keep both; publish the right one.
- **Physics-first discipline generalizes across research domains.** BPS (v1.49.26) organized sensing by governing equation. TIBS (v1.49.31) organized humanities-comparative research by epistemological axis. THE (this release) organizes energy engineering by gradient-interception physics. The common discipline is naming the analytical structure before filling it — and that discipline works whether the subject is sonar, shamanism, or solar electrolysis.
- **Cross-thread analyses are what distinguish an atlas from a literature review.** Six modules of disconnected research would have been a survey. The three cross-threads (Materials, Economics, PNW Grid) made THE a map of a civilization-scale system. Future multi-module research atlases should budget one cross-thread for every three-to-five modules — it is the structural commitment that turns breadth into coherence.
- **Safety-critical gates should be domain-specific, not just discipline-generic.** SC-SRC / SC-NUM-style gates apply everywhere; SC-H2S (hydrogen safety cites NFPA/OSHA/DOE) applied only because THE covers hydrogen. Identifying the domain-specific safety gate *at project start* — not when the draft is finished — keeps the most sensitive sub-domain sober from the first paragraph onward.
- **Atomic commits for research + verification are non-negotiable.** THE's bibliography (`11-bibliography.md`) and verification matrix (`12-verification-matrix.md`) shipped in the same commit as the six modules and three cross-threads. A research commit without its verification is a research commit that can be partially rolled back into a deceptive state. Ship them together or do not ship.
- **Hub updates belong in the same release as the project they integrate.** THE research shipped in `231d36f06`, hub integration in `93fd9b30c` — two commits, but in the *same* release window so no user ever saw a 15-project hub alongside a 16-project repo. A stricter release-checklist that treats "hub updated" as a prerequisite for tagging would remove even the intra-window gap.
- **Dedication position is part of the release-note template, not a matter of taste.** The v1.49.36 dedication placement drift (corrected in `26da59d33`) shows that without a template-enforced slot, dedications can land in whatever position the current drafter thinks looks nice. Enforcing position in the template is cheap; letting it drift costs a correction commit per slip.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.36](../v1.49.36/) | Predecessor — AWF Living Systems Research; v1.49.37 fixes dedication placement and painting age in v1.49.36 as release-integrity carry-forward |
| [v1.49.38](../v1.49.38/) | Successor — Release Cadence Hardening; takes up hub-update-as-checklist-item deferred here |
| [v1.49.22](../v1.49.22/) | First PNW project (COL, Columbia Valley Rainforest) — THE closes the series that COL opened |
| [v1.49.24](../v1.49.24/) | BCM + SHE — engineering foundation THE's physics modules build atop |
| [v1.49.26](../v1.49.26/) | BPS — physics-first discipline precedent that THE inherits and extends to energy conversion |
| [v1.49.29](../v1.49.29/) | FFA process-hardening (wave commit marker hook, LOC tracking, typedoc pipeline, speculative infra inventory) — process discipline THE's 5-commit release inherits |
| [v1.49.31](../v1.49.31/) | TIBS — scholarly discipline sibling; TIBS organized by epistemological axis, THE by gradient interception physics — same physics-first discipline, different domain |
| [v1.49.33](../v1.49.33/) | LED + SYS — electrical engineering siblings whose domain THE completes at the energy-infrastructure scale |
| [v1.49.35](../v1.49.35/) | ECO + VAV — taxonomy and visualization siblings; THE completes the engineering-end of the atmosphere-aquifer-summit-seafloor-genome-grid-tradition-technology-thermodynamics arc |
| [v1.49.36](../v1.49.36/) | AWF — clean air/water/food; THE extends into the energy layer that AWF's food-production systems depend on |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; THE is an Observe-step output (research capture) at civilization scale |
| [v1.49.0](../v1.49.0/) | Parent mega-release for the v1.49.x line that the PNW Research Series populates |
| `www/PNW/THE/research/00-source-index.md` | 40+ source citation schema, publisher-tier gating |
| `www/PNW/THE/research/12-verification-matrix.md` | 42/42 test PASS matrix, safety-critical gate evidence |
| `www/PNW/THE/research/09-pnw-grid-integration.md` | BPA transmission grid integration — the regional anchor |
| `www/PNW/index.html` | PNW series hub, now synchronized to 16 projects |
| `www/index.html` | Root landing page, now synchronized to 16 projects |
| `www/images/tibsfox.png` | Optimized brand mark, 384×400, 3× retina |
| NFPA 2 / OSHA / DOE | Hydrogen safety standards cited per SC-H2S gate |
| BPA / FERC | Grid claims traceable to these authoritative regional publications |

## Engine Position

v1.49.37 is the sixteenth and final atlas in the PNW Research Series and the release that closes the atmosphere-aquifer-summit-seafloor-genome-grid-tradition-technology-thermodynamics arc the series has been composing since v1.49.22. It sits between v1.49.36 (AWF — Clean Air, Water & Food) and v1.49.38 (Release Cadence Hardening) in the v1.49.x line. Within the PNW series, THE completes the engineering half of the bioregional survey: where COL/CAS/ECO mapped the living world, AVI/MAM/BPS mapped sensing biology, TIBS/FFA/GDN mapped human cultural and craft practices, and BCM/SHE/LED/SYS/VAV mapped specific engineering disciplines, THE provides the civilization-scale energy-infrastructure layer on which all other engineering rests. The series is now structurally complete at sixteen projects / 354 files / ~16 MB / 1,070+ sources. Looking forward, the PNW series stops growing here; future PNW work will be revision, cross-reference deepening, and mission-pack production rather than new top-level projects. The next release (v1.49.38) turns toward release-pipeline hardening — specifically the hub-update-as-checklist discipline this release identified. In the broader v1.49.x line, v1.49.37 is a mid-size feature release (22 files, +7,979 net lines, 5 leaf commits + merge) whose architectural weight is disproportionate to its commit count because it both completes a 16-project series and resolves a cross-release production debt (the brand mark). The release is a pivot point: the PNW content arc closes here, and the release-engineering arc resumes in v1.49.38.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.36..v1.49.37) | 5 leaf + 1 merge (`4568acf9d`) |
| Files changed | 22 |
| Lines inserted / deleted | +7,991 / −12 (net +7,979) |
| Research files | 17 (under `www/PNW/THE/`) |
| Research prose lines (modules + cross-threads) | 7,430 |
| Core modules | 6 (HVAC, Waste Heat, Catalysis, Fuel Cells, Electrolysis, PNW Geothermal/Hydro) |
| Cross-thread analyses | 3 (Materials, Economics, PNW Grid Integration) |
| Academic sources | 40+ (all publisher-tier) |
| Safety-critical gates | 7 (SC-THR, SC-ELC, SC-CHM, SC-FUE, SC-H2S, SC-GRD, SC-MAT) |
| Core functionality tests | 18/18 PASS (CF-01..CF-18) |
| Integration tests | 10/10 PASS (IN-01..IN-10) |
| Edge-case tests | 7/7 PASS (EC-01..EC-07) |
| Total tests | 42/42 PASS |
| PNW series projects (before → after) | 15 → 16 (series COMPLETE) |
| Brand mark size reduction | 3,746,756 → 396,006 bytes (89.4%) |
| Brand mark dimensions | 1178×1228 → 384×400 (3× retina for 120px slot) |
| Hub stat changes | "fifteen" → "sixteen" in all text and visual references on two index pages |
| Release-integrity corrections for v1.49.36 | 2 (painting age fix, dedication sub-header move) |

## Files

- `www/PNW/THE/` — 17 files, 7,430 research-prose lines: `index.html` (175), `page.html` (284), `style.css` (70), `research/00-sensitivity-protocol.md` (75), `research/00-source-index.md` (95), `research/01-hvac-heat-pumps.md` (820), `research/02-waste-heat-recovery.md` (805), `research/03-catalytic-conversion.md` (810), `research/04-fuel-cell-technology.md` (820), `research/05-solar-electrolysis.md` (962), `research/06-pnw-geothermal-hydroelectric.md` (1,007), `research/07-materials-cross-thread.md` (525), `research/08-economics-cross-thread.md` (677), `research/09-pnw-grid-integration.md` (573), `research/10-executive-summary.md` (76), `research/11-bibliography.md` (74), `research/12-verification-matrix.md` (114)
- `www/PNW/index.html` — PNW series hub, +16/−8, THE card added, stats updated to 16 projects / 354 files / 16 MB / 1,070+ sources / 15 mission packs
- `www/index.html` — root landing page, +9/−2, THE card added with red→orange→gold energy gradient, count references updated
- `www/images/tibsfox.png` — brand mark, 3.7 MB → 387 KB (89.4% reduction), 384×400 at 3× retina for 120px display slot
- `.gitignore` — −1 line (removes `www/images/tibsfox.png` ignore so optimized asset commits)
- `docs/release-notes/v1.49.36/README.md` — +3/−2, painting age 2016 → 10 years, dedication relocated to sub-header
- `docs/release-notes/v1.49.37/README.md` — this file (A-grade uplift)
- `docs/release-notes/v1.49.37/chapter/00-summary.md` — parse of this README (Prev/Next navigation to v1.49.36 / v1.49.38)
- `docs/release-notes/v1.49.37/chapter/03-retrospective.md` — retrospective chapter with What Worked / What Could Be Better
- `docs/release-notes/v1.49.37/chapter/04-lessons.md` — 5 lessons extracted with tracker status
- `docs/release-notes/v1.49.37/chapter/99-context.md` — release context chapter

Aggregate: 22 files changed in the release window, +7,991 insertions, −12 deletions, net +7,979 lines, 5 leaf commits (`26da59d33`, `09757ca1f`, `0c71091486`, `231d36f06`, `93fd9b30c`, `45c55ce6f`) + 1 merge commit (`4568acf9d`) across v1.49.36..v1.49.37. PNW Research Series reaches structural completion at 16 projects.
