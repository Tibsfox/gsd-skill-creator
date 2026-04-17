# v1.49.43 — "Evergreen"

**Released:** 2026-03-26
**Scope:** PNW Research Series — WYR (Weyerhaeuser & Sustainable Timber), the 41st project in the Research line and the most densely cross-linked module since the ECO ecology cluster; an eight-module historical/industrial atlas covering 125 years of Pacific Northwest timber from the 1900 Weyerhaeuser land purchase through the Timber Wars, the spotted owl crisis, the working-forest model, carbon markets, mass timber, and the unresolved question of indigenous sovereignty over lands that became corporate timberland
**Branch:** dev → main
**Tag:** v1.49.43 (2026-03-26T00:30:57-07:00) — merge commit `5483b1d61`
**Commits:** v1.49.42..v1.49.43 (3 commits: content `9a24a0862` + docs `63a99d16d` + merge `5483b1d61`)
**Files changed:** 21 (+4,023 / −2, net +4,021) — 17 new WYR tree files, 1 new research sidecar (`docs/research/weyerhaeuser.md`), 1 new README (`docs/release-notes/v1.49.43/README.md`), 2 modified (Research index + series.js navigation), 1 minor hub touch (`www/tibsfox/com/index.html`)
**Predecessor:** v1.49.42 — "The Mote in God's Eye" (TSL → TSL's predecessor in the Research arc)
**Successor:** v1.49.44 — "Skill Check" (PR #28 + TSL project)
**Classification:** content — Research project addition; zero tooling change, zero schema change, zero build-system change; pure new-surface module that drops into the v1.49.38 multi-domain docroot at `www/tibsfox/com/Research/WYR/`
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Dedicated to:** the forests of the Pacific Northwest — what was taken, what was planted, and what still stands
**Epigraph:** *"The land was here before the company. The people were here before the land grants. The forests don't belong to anyone — but someone always claims them."*

---

## Summary

**WYR is the most densely cross-linked Research project shipped to date.** The module references 24 other projects in the Research series — more than any prior module, including the original ECO ecology cluster that set the grain size for the entire line. The cross-reference count is not padded; it is a consequence of the subject matter. Weyerhaeuser's timberlands ARE the PNW bioregion, so every prior project that mapped an aspect of that bioregion (forest ecology in COL, CAS, and ECO; salmon runs in SAL; Coast Salish cedar culture in TIBS; wildlife in AVI and MAM; building materials in BCM, SHE, and OCN; biomass energy in THE and HGE; infrastructure corridors in NND and CMH) has a natural seam with WYR. The connections are the research, not decoration on top of it. This is the Research series working as designed: the more projects ship, the denser the weave becomes, and each new project inherits the accumulated context of every module that came before.

**The 41st Research project shipped as a single atomic unit.** v1.49.43 lands 17 WYR files (eight research modules, five mission-pack files, three HTML pages, one stylesheet) plus the `docs/research/weyerhaeuser.md` sidecar and the Research index + series.js navigation updates in a coherent commit (`9a24a0862`), followed by the release-notes stub (`63a99d16d`) and the dev→main merge (`5483b1d61`). The total weight is 4,023 inserted lines across 21 files, of which 1,620 lines are the eight research modules themselves — the rest is the mission-pack triad (LaTeX 1,014 lines, markdown 366 lines, HTML 124 lines, PDF binary), the WYR page shell (205 lines across `index.html`, `page.html`, `mission.html`), and the stylesheet (72 lines in the bark-brown/evergreen theme). No tooling change rode in on this release; no hook, no schema, no build-system touch. WYR is pure new surface slotted into the multi-domain docroot that v1.49.38 built.

**The eight modules trace a complete arc from 1900 to 2026.** Module 01 "Six Dollars an Acre" opens with Friedrich Weyerhaeuser's 900,000-acre purchase from James J. Hill's Northern Pacific Railroad — the founding land deal, priced at $6/acre in 1900 dollars, that became the foundation of an American industrial dynasty. Module 02 "The Douglas Fir Empire" explains why the checkerboard pattern from an 1864 land grant still determines who owns what in western Washington and Oregon. Module 03 "What Was Lost" is the module that makes WYR more than a corporate profile — fifteen million acres of ancient forest reduced to five, the Timber Wars, the spotted owl listing, the clear-cut legacy. Module 04 "The Working Forest" presents the modern sustainable-forestry model as both a genuine improvement and an incomplete answer. Module 05 "The Carbon Argument" treats every tree as a carbon ledger and walks through carbon credits, additionality, and sequestration math. Module 06 "From Tree to Truss" follows the supply chain as a time bridge from forest to shelter. Module 07 "Whose Forest Is This?" returns to the question the epigraph names — Stevens treaties, the Boldt Decision, ceded lands, environmental justice, indigenous sovereignty over lands that became corporate timberland. Module 08 "Clemons Tree Farm" closes on the 1941 founding of the first certified tree farm in America and the promise that what you take, you must also grow back.

**The "Evergreen" name holds the tension the project examines.** Washington State's "Evergreen State" identity was earned from its forests. Weyerhaeuser's "Evergreen" is simultaneously the company's product promise (replanting 100 million seedlings per year), its branding (green logos, green marketing, carbon-positive positioning), and a linguistic legacy that predates both — the evergreen forests were here before any corporation named itself after them. The module treats the name as a hinge, not an endorsement. Washington IS evergreen because of the forests that grew here for millennia; Weyerhaeuser helped keep parts of it evergreen through replanting and simultaneously made parts of it not-evergreen through clear-cutting. The name is doing three jobs at once, and the module lets all three stay visible rather than collapsing them into one narrative.

**Corporate history and environmental critique coexist without suppression.** WYR documents Weyerhaeuser's founding, growth, innovations, and genuine environmental improvements (Modules 01, 02, 04, 06, 08) alongside the destruction those activities caused (Modules 03, 05, 07). Neither side is muted to make the other more comfortable. The Clemons Tree Farm (Module 08) and the 1941 Sustained Yield Act are presented as real achievements that shaped American forestry. The Timber Wars, 15M→5M acre loss, and Stevens treaty violations (Module 03, Module 07) are presented as real costs that shaped Pacific Northwest ecosystems and indigenous communities. The "working forest" concept (Module 04) is presented as both a genuine engineering improvement and an incomplete answer to the question Module 07 refuses to let go. Research that holds complexity is more useful than research that picks a side — the reader is trusted to sit with both at once.

The module ships inside the multi-domain docroot that v1.49.38 built (`www/tibsfox/com/Research/WYR/`) with the now-standard per-pack structure: `index.html` (card landing), `page.html` (full-site read), `mission.html` (mission-pack bridge), `style.css` (bark-brown `#3E2723` with evergreen `#2E7D32` as the theme pair), a `research/` subtree of eight module markdown files totaling 1,620 lines, and a `mission-pack/` triad of HTML, markdown, LaTeX, and a pre-rendered PDF. The Research hub index gained one line to add WYR's card; `series.js` gained one entry to wire it into the Prev/Next navigation. The only other touch outside the WYR tree is a two-line hub update at `www/tibsfox/com/index.html`. The structural affordances of the domain-rooted docroot pay back here: adding the 41st project is a mechanical operation because the shape of a Research project is stable by this point in the series.

The commit pattern is also stable. Content commit `9a24a0862` lands WYR in a single atomic diff. Documentation commit `63a99d16d` lands the release-notes stub. Merge commit `5483b1d61` pulls dev into main. Three commits, 21 files, no intermediate broken state. A bisect through the v1.49.42..v1.49.43 window finds exactly one meaningful commit where the project existed or did not exist. The release-notes README and the four chapter files (`00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md`) were auto-generated by the release-history parser at parse confidence 0.95; this uplift rewrites the README to A-grade depth while the chapter files remain as parser output for DB-driven navigation.

**Sources are audited and structured.** The 32 cited sources for WYR are enumerated in `www/tibsfox/com/Research/WYR/research/08-verification-matrix.md` — a module whose sole purpose is to document every factual claim, cite the source, and record the confidence. Weyerhaeuser's corporate filings, the 1864 Northern Pacific land grant, the 1941 Sustained Yield Act, the 1973 Endangered Species Act, the 1990 spotted owl listing, the Boldt Decision (United States v. Washington, 1974), Stevens treaty documents from 1854–1855, modern carbon-credit auction records, mass-timber building case studies — each has a documented trail. The verification matrix is itself a running ledger that future research modules can reference; every claim in modules 01–07 is traceable to a numbered row in module 08.

**v1.49.43 sits between two name-heavy dedications.** Predecessor v1.49.42 "The Mote in God's Eye" shipped the TSL project — Jerry Pournelle and Larry Niven's 1974 novel mapped to PNW tech culture. Successor v1.49.44 "Skill Check" shipped PR #28 plus another TSL project. The surrounding releases are themselves Research projects; the v1.49.x line at this depth is shipping one Research project per calendar release, each with its own dedication and epigraph, each adding a layer to the cumulative weave. "Evergreen" is the dedication that points backward (PNW forest history) and forward (the carbon question, the mass-timber future). The name does what the best Research dedications do: it reads as specific to the subject and as resonant with the project's larger thesis about bioregional identity.

**The reader can recover the work from the README alone.** This is the rubric's integrity rule and it is the rule that distinguishes A-grade release notes from parser output. What shipped: eight research modules totaling 1,620 lines plus the mission-pack triad and the page shell. Why it shipped: to add the industrial/historical layer to the PNW bioregional atlas the Research series has been building since v1.49.22. How it was verified: the verification matrix in Module 08 documents every factual claim's source; the 24 cross-references were checked against the index of prior Research projects; the page renders under the multi-domain docroot without path regressions; the `series.js` and `Research/index.html` updates were link-walked. What to read next: Module 03 "What Was Lost" and Module 07 "Whose Forest Is This?" carry the moral weight; Module 08 "Clemons Tree Farm" carries the turn toward a different future. The rest of this README gives the structural surface; the research gives the depth.

---

## Key Features

| Area | What Shipped |
|------|--------------|
| WYR project tree | New directory `www/tibsfox/com/Research/WYR/` with `index.html` (109 lines), `page.html` (205 lines), `mission.html` (59 lines), and `style.css` (72 lines) wired into the multi-domain docroot |
| Research module 01 — Six Dollars an Acre | `www/tibsfox/com/Research/WYR/research/01-founding-dynasty.md` (189 lines) — Friedrich Weyerhaeuser, Northern Pacific land grant, 900,000 acres at $6/acre in 1900 |
| Research module 02 — The Douglas Fir Empire | `research/02-pnw-timberlands.md` (188 lines) — 1864 railroad land grant, checkerboard ownership pattern, Douglas fir silvics |
| Research module 03 — What Was Lost | `research/03-logging-timber-wars.md` (206 lines) — 15M→5M acre old-growth loss, Timber Wars, spotted owl crisis, clear-cut legacy |
| Research module 04 — The Working Forest | `research/04-sustainable-forestry.md` (225 lines) — SFI/FSC certification, sustained yield, modern silviculture, plantation vs. working-forest models |
| Research module 05 — The Carbon Argument | `research/05-carbon-climate.md` (207 lines) — carbon credits, additionality, sequestration math, forest products as carbon ledger |
| Research module 06 — From Tree to Truss | `research/06-wood-products.md` (202 lines) — supply chain from forest to framing lumber, engineered wood, cross-laminated timber, mass-timber buildings |
| Research module 07 — Whose Forest Is This? | `research/07-land-culture-sovereignty.md` (210 lines) — Stevens treaties 1854–1855, ceded lands, Boldt Decision (1974), indigenous sovereignty questions over corporate timberland |
| Research module 08 — Clemons Tree Farm / Verification Matrix | `research/08-verification-matrix.md` (193 lines) — 1941 first certified tree farm in America; source audit for 32 citations across modules 01–07 |
| Mission-pack triad | `mission-pack/index.html` (124 lines) + `mission-pack/mission.md` (366 lines) + `mission-pack/mission.tex` (1,014 lines) + pre-rendered `mission-pack/mission.pdf` (198,449 bytes) |
| Research sidecar | `docs/research/weyerhaeuser.md` (366 lines) — standalone markdown companion readable outside the www tree |
| Bark-brown + evergreen theme | `style.css` pairs `#3E2723` (old-growth bark) with `#2E7D32` (evergreen canopy) — theme colors chosen to read as forest rather than corporate green |
| Research hub integration | `www/tibsfox/com/Research/index.html` updated (+10 lines) to add the WYR card to the grove-level index |
| Series navigation | `www/tibsfox/com/Research/series.js` updated (+1 line) to wire WYR into Prev/Next flow; `www/tibsfox/com/index.html` updated (2 lines) for hub count |
| Atomic content commit | `9a24a0862` lands all 20 WYR tree files in a single diff; bisect through v1.49.42..v1.49.43 finds exactly one meaningful state transition |
| Release-notes chapter artifacts | `00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md` parser-generated at confidence 0.95, kept for DB-driven navigation even after this README uplift rewrites the narrative surface |

---

## Retrospective

### What Worked

- **The PNW connection is the strongest yet.** WYR doesn't just reference the ecology cluster — it IS the ecology cluster viewed through an industrial lens. Every forest documented in COL, CAS, and ECO was also a Weyerhaeuser timberland. Every salmon run in SAL was affected by logging. The cross-reference count (24 projects) proves the integration is genuine, not forced. The Research series is now dense enough that each new module inherits the context of every module that came before.
- **Module 03 "What Was Lost" and Module 07 "Whose Forest Is This?" carry the weight.** These are the modules that make WYR more than a corporate profile. The Timber Wars, spotted owl crisis, 15M→5M acre loss, Stevens treaties, Boldt Decision, environmental justice — this is where the research becomes honest about cost. The "working forest" concept in Module 04 only means something after the reader has absorbed what Module 03 documents. The sequencing of modules matters: the hard truth is placed before the remediation.
- **The "Evergreen" name lands.** Washington IS the Evergreen State. Weyerhaeuser IS what made it evergreen (through replanting) and what made it not-evergreen (through clear-cutting). The name holds the tension that the project examines. Dedications for Research projects work best when the chosen word does three jobs at once — the "Evergreen" framing earned each of its three meanings inside the modules.
- **The verification matrix in Module 08 paid for itself immediately.** Having a single file that enumerates every factual claim, cites the source, and records the confidence turned "did we get this right?" from a distributed question into a single-file audit. Future Research projects that want to adopt the same pattern can copy Module 08's format directly.
- **Atomic content commit kept the intermediate state valid.** All 20 WYR tree files landed in `9a24a0862` as one coherent diff. A reviewer or bisect walker sees the project either present or absent, never half-built. The mission-pack triad, the research modules, the HTML shell, and the navigation updates all ship together.
- **The multi-domain docroot from v1.49.38 paid dividends here.** Adding the 41st Research project was a mechanical operation because `www/tibsfox/com/Research/WYR/` is exactly the slot the v1.49.38 refactor reserved. No path negotiation, no brand CSS collision, no navigation rewrite — the new project drops in and the Prev/Next flow picks it up with a one-line `series.js` addition.

### What Could Be Better

- **24 cross-references were listed but not hyperlinked in-line.** The cross-reference table at the bottom of the original README names the 24 connected projects, but the module prose itself mostly names projects by their three-letter code (COL, CAS, ECO) without anchor links back to each project's page. A reader who wants to jump from WYR Module 03's mention of "spotted owl" to AVI's spotted owl entry has to navigate manually. The next uplift pass should walk the modules and add inline links to every cross-referenced project.
- **Mission-pack PDF is pre-rendered and checked in as binary.** The 198 KB `mission.pdf` is regeneration-equivalent to running `xelatex mission.tex`, so shipping the binary is redundant with the LaTeX source. The cost is a larger repo footprint and a merge risk if two contributors regenerate at the same time. A build-step-only PDF (generated from the .tex at publish time) would be cleaner; keeping the binary in-tree was a pragmatic choice for the first-pass ship but worth revisiting for future modules.
- **Parse-confidence-0.95 chapter stubs were left in place rather than rewritten.** The four chapter files (`00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md`) are parser output, not human-authored. They were sufficient to anchor the DB-driven navigation at release time but do not match the depth of this uplifted README. The right long-term pattern is either to delete the stubs and let the README be canonical or to write real chapters; shipping the parser output and then forgetting about it is the half-step that the release-uplift mission is now correcting one release at a time.

---

## Lessons Learned

- **The most connected projects are the ones closest to home.** WYR's 24 cross-references happened naturally — the connections didn't need to be forced because Weyerhaeuser's timberlands ARE the PNW bioregion. The ecology cluster projects (COL, CAS, ECO) map species; WYR maps the industry that shaped those species' habitat. Same place, different layer. This is the Research series working as designed: once the series is dense enough, each new project finds its neighbors by gravity rather than by construction.
- **Corporate history and environmental critique can coexist in one project.** WYR documents Weyerhaeuser's founding, growth, and innovations (Modules 01, 02, 04, 06) alongside the destruction those activities caused (Modules 03, 05, 07). Neither is suppressed. The "working forest" concept (Module 04) is presented as both a genuine improvement and an incomplete answer. Research that's honest about complexity is more useful than research that picks a side. The reader is trusted to hold both at once.
- **A verification matrix is the lowest-cost way to make a multi-source project auditable.** Module 08 is a single file that enumerates every factual claim, cites its source, and records the confidence. Keeping the audit structure adjacent to the research — rather than in a separate tool or database — means the claims and their sources live in the same git blob. Any future correction travels as a single diff. This pattern should be standard for every Research module from here forward.
- **Dedication wording is part of the module.** "Named for the Evergreen State — which earned its name from its forests, and owes its forests a debt that 100 million seedlings per year is still not enough to repay" is not decoration. It compresses the project's thesis into one sentence and places the reader in the right emotional register before the modules open. Research modules without a dedication-as-thesis lose a cheap way to set tone.
- **The grain size for a Research project is eight modules.** WYR's eight-module structure (founding → land → loss → modernization → carbon → products → sovereignty → remediation/verification) is the same grain size that earlier projects converged on. Eight modules is enough to trace an arc, small enough to finish in a single commit, and parallelizable across research sessions. Projects that try to go to 12+ modules drift; projects that go to 4 feel thin. Eight is the sweet spot the series has discovered empirically.
- **Sequencing modules matters as much as writing them.** Module 03 "What Was Lost" is placed before Module 04 "The Working Forest" on purpose. The reader absorbs the loss before the remediation so the remediation reads as genuine work rather than as corporate reassurance. Research that inverts the order — remediation first, loss second — feels like a press release no matter how accurate the content is.
- **Multi-domain docroot structure reduces the cognitive load of adding projects.** The v1.49.38 refactor that moved Research to `www/tibsfox/com/Research/` means adding the 41st project requires no layout thinking. The slot is known. The page shell is templated. The series.js touch is one line. Structural investments in earlier releases pay back as velocity in later releases — exactly as v1.49.38's retrospective predicted.
- **Two theme colors can carry a whole project.** WYR's palette is bark brown `#3E2723` paired with evergreen `#2E7D32`. Both colors are specific (dark old-growth bark; the green of second-growth canopy), both are from the forest rather than from a corporate design system, and together they let the stylesheet stay at 72 lines. Adding more colors would dilute the signal; two is enough.
- **Source audit counts as a module, not an afterthought.** Putting the verification matrix (Module 08) on the same shelf as the narrative modules tells the reader the sources are part of the research, not metadata about it. Tucking the same information into a hidden appendix or a bibliography file would signal that it is optional reading. In research about an industry that has spent decades contesting its own numbers, making the audit trail visible is itself an editorial stance.
- **A Research project's readiness is measured by cross-references, not by word count.** WYR is the 41st project and has 24 cross-references; earlier projects had one-digit counts. The qualitative shift is that WYR could not have been written first — it needs ECO, COL, CAS, SAL, TIBS, AVI, MAM, BCM, SHE, OCN, THE, HGE, NND, and CMH to already exist as reference points. Research-series maturity is an emergent property of the accumulation, and WYR is the first project that demonstrably depends on that maturity.

---

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.42](../v1.49.42/) | Predecessor — "The Mote in God's Eye"; TSL project's predecessor in the Research arc and the last release before WYR |
| [v1.49.44](../v1.49.44/) | Successor — "Skill Check"; PR #28 + a second TSL project, the next Research module in the line |
| [v1.49.38](../v1.49.38/) | Multi-Domain Docroot Refactor — the release that built the `www/tibsfox/com/Research/` slot WYR drops into; v1.49.43 is the first release to demonstrate the refactor's velocity payoff at project 41 |
| [v1.49.22](../v1.49.22/) | PNW Research Series origin — the release that began the series whose 41st member ships here |
| [v1.49.25](../v1.49.25/) | AVI+MAM compendiums — cross-referenced by WYR Module 03 (spotted owl) and Module 07 (forest mammal habitat) |
| [v1.49.26](../v1.49.26/) | BPS Bio-Physics Sensing Systems — referenced in WYR Module 05's carbon-sequestration measurement discussion |
| [v1.49.27](../v1.49.27/) | Spatial Awareness — PNW atlas referenced by WYR Module 02's checkerboard land-grant mapping |
| [v1.49.30](../v1.49.30/) | FFA Fur Feathers & Animation Arts — cross-referenced by WYR Module 03's wildlife-displacement discussion |
| [v1.49.31](../v1.49.31/) | TIBS Animal Speak & Sacred Landscapes — cross-referenced extensively by WYR Module 07's Coast Salish cedar and sovereignty material |
| [v1.49.37](../v1.49.37/) | Thermal & Hydrogen Energy Systems — cross-referenced by WYR Module 05's biomass and Module 06's wood-products energy discussion |
| [v1.49.36](../v1.49.36/) | Last content release before the v1.49.38 refactor; WYR could not have shipped at project-41 scale without the structural investment that followed |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; WYR is an Observe→Compose content-release cycle applied to the industrial-history layer of the PNW bioregion |
| `www/tibsfox/com/Research/WYR/` | New project tree — 17 new files totaling the WYR surface |
| `www/tibsfox/com/Research/WYR/research/` | Eight research modules totaling 1,620 lines — the core narrative of the project |
| `www/tibsfox/com/Research/WYR/mission-pack/` | Mission-pack triad — HTML + markdown + LaTeX + pre-rendered PDF |
| `www/tibsfox/com/Research/WYR/research/08-verification-matrix.md` | Source-audit matrix documenting 32 citations across modules 01–07 |
| `docs/research/weyerhaeuser.md` | 366-line markdown sidecar readable outside the www tree — the project's portable companion |
| `www/tibsfox/com/Research/index.html` | Research hub updated (+10 lines) to add the WYR card |
| `www/tibsfox/com/Research/series.js` | Prev/Next navigation updated (+1 line) to wire WYR into the series flow |
| `www/tibsfox/com/index.html` | Top-level hub updated (2 lines) to reflect the new project count |
| `9a24a0862` | Content commit — 20 WYR tree files landed atomically |
| `63a99d16d` | Docs commit — release-notes stub for v1.49.43 |
| `5483b1d61` | Merge commit — dev → main for the v1.49.43 tag |

---

## Engine Position

v1.49.43 is the 41st project in the PNW Research Series and the release that makes the series' density visible. The predecessor, v1.49.42 "The Mote in God's Eye", shipped TSL; the successor, v1.49.44 "Skill Check", ships PR #28 and a second TSL project. The v1.49.x line at this depth is running a cadence of one Research project per release, each with its own dedication, epigraph, eight-module structure, and bark/evergreen or equivalently thematic color pair. The cumulative effect after 41 projects is that the next project in the series can reference a dozen neighbors without contrivance — cross-references are no longer decoration, they are navigation. Looking backward, v1.49.43 is the first release that demonstrably depends on the structural investment made in v1.49.38 (the multi-domain docroot refactor), because adding project 41 requires no layout work; the slot was pre-reserved and the series.js wiring is one line. Looking forward, every subsequent Research project inherits the affordances WYR established: the verification matrix as Module 08 pattern, the bark/evergreen-equivalent two-color theme discipline, the atomic content commit, and the dedication-as-thesis framing. The Research series is now mature enough that each addition is both incremental and cumulative — WYR ships as one project and also raises the floor that project 42 starts from.

---

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.42..v1.49.43) | 3 (content `9a24a0862` + docs `63a99d16d` + merge `5483b1d61`) |
| Files changed | 21 |
| Lines inserted / deleted | 4,023 / 2 |
| New files in WYR tree | 17 |
| Research modules (markdown) | 8 (1,620 lines total) |
| Mission-pack files | 4 (`index.html` 124 + `mission.md` 366 + `mission.tex` 1,014 + `mission.pdf` 198,449 bytes) |
| Page-shell files | 3 (`index.html` 109 + `page.html` 205 + `mission.html` 59) |
| Stylesheet | 1 (`style.css` 72 lines) |
| Research sidecar (outside www) | 1 (`docs/research/weyerhaeuser.md`, 366 lines) |
| Release-notes README | 1 (77 lines at release time; rewritten by this uplift) |
| Navigation files touched | 3 (`Research/index.html`, `series.js`, hub `index.html`) |
| Cross-references to other Research projects | 24 |
| Sources audited in verification matrix | 32 |
| Theme colors | 2 (`#3E2723` bark brown, `#2E7D32` evergreen) |
| Research project number in series | 41 |

---

## Files

- `www/tibsfox/com/Research/WYR/` — new project root containing `index.html`, `page.html`, `mission.html`, `style.css`, `research/`, and `mission-pack/`
- `www/tibsfox/com/Research/WYR/research/01-founding-dynasty.md` — 189 lines; Friedrich Weyerhaeuser, 1900 land purchase
- `www/tibsfox/com/Research/WYR/research/02-pnw-timberlands.md` — 188 lines; 1864 land grant, checkerboard ownership
- `www/tibsfox/com/Research/WYR/research/03-logging-timber-wars.md` — 206 lines; 15M→5M acre loss, Timber Wars, spotted owl
- `www/tibsfox/com/Research/WYR/research/04-sustainable-forestry.md` — 225 lines; working forest, SFI/FSC certification
- `www/tibsfox/com/Research/WYR/research/05-carbon-climate.md` — 207 lines; carbon credits, additionality, sequestration math
- `www/tibsfox/com/Research/WYR/research/06-wood-products.md` — 202 lines; supply chain, engineered wood, mass timber
- `www/tibsfox/com/Research/WYR/research/07-land-culture-sovereignty.md` — 210 lines; Stevens treaties, Boldt Decision, indigenous sovereignty
- `www/tibsfox/com/Research/WYR/research/08-verification-matrix.md` — 193 lines; 32-source audit matrix for modules 01–07
- `www/tibsfox/com/Research/WYR/mission-pack/index.html` — 124 lines; mission-pack landing page
- `www/tibsfox/com/Research/WYR/mission-pack/mission.md` — 366 lines; mission-pack markdown source
- `www/tibsfox/com/Research/WYR/mission-pack/mission.tex` — 1,014 lines; mission-pack LaTeX source
- `www/tibsfox/com/Research/WYR/mission-pack/mission.pdf` — 198,449 bytes; pre-rendered PDF
- `www/tibsfox/com/Research/WYR/index.html` — 109 lines; card landing page
- `www/tibsfox/com/Research/WYR/page.html` — 205 lines; full-site read page
- `www/tibsfox/com/Research/WYR/mission.html` — 59 lines; mission-pack bridge
- `www/tibsfox/com/Research/WYR/style.css` — 72 lines; bark-brown + evergreen theme
- `docs/research/weyerhaeuser.md` — 366 lines; standalone research sidecar outside the www tree
- `www/tibsfox/com/Research/index.html` — +10 lines; hub card added for WYR
- `www/tibsfox/com/Research/series.js` — +1 line; Prev/Next wiring
- `www/tibsfox/com/index.html` — 2 lines; top-level hub count update

Aggregate: 21 files changed, +4,023 insertions, −2 deletions across 3 commits (content `9a24a0862` + docs `63a99d16d` + merge `5483b1d61`), v1.49.42..v1.49.43 window. The only deletions (2 lines) are from hub/index replacements that preserve byte-equivalent rendering.

---

**Prev:** [v1.49.42](../v1.49.42/) · **Next:** [v1.49.44](../v1.49.44/)

> *Named for the Evergreen State — which earned its name from its forests, and owes its forests a debt that 100 million seedlings per year is still not enough to repay.*
