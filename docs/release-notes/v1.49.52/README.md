# v1.49.52 — "Everett"

**Released:** 2026-03-26
**Scope:** PNW Research Series — SYN (Synsor Corp), the 50th project and the first industrial-AI sensing study in the Research line; eight modules covering a Snohomish County visual-inspection company from founding (Munich origins, Everett relocation) through product architecture, patent landscape, a ten-company competitive matrix on seven dimensions, a $2.9–4.3B market deep dive, a vision-pipeline technology study (compressed feature retention, Shannon mutual information, edge inference), and the PNW-corridor connections that place Synsor adjacent to Boeing and inside the GSD chipset mental model
**Branch:** dev → main
**Tag:** v1.49.52 (2026-03-26T05:35:01-07:00) — merge commit `04c215ffc`
**Commits:** v1.49.51..v1.49.52 (3 commits: content `1ba6ff5e7` + docs `4218fe436` + merge `04c215ffc`)
**Files changed:** 27 (+4,312 / −37, net +4,275) — 20 new SYN tree files, 1 new research sidecar (`docs/research/synsor-corp.md`), 1 new release-notes README, 2 modified hub/nav files (`Research/index.html`, `series.js`), 1 top-hub touch (`www/tibsfox/com/index.html`), 6 neighbor release-notes READMEs touched by a parallel verbosity-expansion commit (`46716a26b`) that ships in the same merge window
**Predecessor:** v1.49.51 — "Daydream Nation" (prior Research cadence entry)
**Successor:** v1.49.53 — next Research project in the PNW cadence
**Classification:** content — Research project addition; zero tooling change, zero schema change, zero build-system change; pure new-surface module slotting into the multi-domain docroot `www/tibsfox/com/Research/` that v1.49.38 reserved
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Dedicated to:** the PNW manufacturing corridor — where the things that see get built
**Epigraph:** *"The same river that carries Boeing's test flight data carries the signal from the sensor on the factory floor."*

---

## Summary

**Project 50 closes the first half-century of the Research library.** SYN (Synsor Corp) is the 50th Research project, and its subject — an industrial visual-inspection company building sensors for the factory floor — is a fitting capstone for a series whose entire premise is *sensing, documenting, and verifying a bioregion*. The Research series began at v1.49.22 with 16 PNW ecology projects. Fifty releases later, the library spans ecology, infrastructure, energy, music, literature, conventions, cybersecurity, timber, business law, and now industrial AI. The bioregion keeps revealing new layers. What started as a single cluster of salmon, cedar, and watershed studies is now a 462-module, ~205,000-line research grove covering every practical domain in which the PNW touches the rest of the world. Project 50 lands without a forced milestone — Synsor Corp is a real Snohomish County company in a real Everett office building, making real sensors for real factories, and its story genuinely belongs in the series on the merits. The milestone timing is incidental; the fit is not.

**The Everett corridor is the load-bearing geographic claim.** The release is named *Everett* because that is what the module is actually about at the structural level. Everett is Boeing's hometown, thirty miles north of Seattle on the Snohomish River, and it is the industrial anchor of the PNW manufacturing corridor. Synsor Corp is located in Snohomish County — not incidentally, but by design: their sensors inspect the factories whose proximity is their market. Module 07 "PNW Connections" maps this geography and makes the claim explicit: the Research series has now documented the same corridor through timber (WYR/Weyerhaeuser at v1.49.43), aerospace adjacency (mentioned throughout), and now industrial AI (Synsor). The line Seattle → Bellevue → Redmond → Everett is a tech corridor running on different substrates in different eras, and the series maps the same geography through each one. Naming the release *Everett* (rather than *Synsor* or *SYN*) commits to that geographic framing up front.

**Eight modules, 1,574 research lines — this is a business-analysis project at full rigor.** The Research series has done ecology, culture, and infrastructure deeply; Project 50 demonstrates it can do business and technology analysis at the same depth. Module 01 (Company Profile, 149 lines) traces founding from Munich origins through the APX product line to the Everett relocation. Module 02 (Product Architecture, 183 lines) documents the turnkey kit, the edge-first computation model, and the five industry verticals Synsor serves. Module 03 (Patent Landscape, 175 lines) centers on the German patent covering compressed feature retention — the defensible technical core. Module 04 (Competitive Landscape, 222 lines, the longest non-technical module in the release) maps ten companies — Scortex, Landing AI, Cognex, Keyence, Omron, KLA-Tencor, and four others — across seven dimensions, with moats and vulnerabilities documented for each. Module 05 (Market Dynamics, 198 lines) sizes the addressable subsegment at $2.9–4.3 billion and ties growth to Industry 4.0 trajectories. Module 06 (Technology Deep Dive, 257 lines — the deepest technical module in the Research library to date) walks the vision pipeline from pixel through compressed feature retention to prediction, with a Shannon mutual-information treatment of the retention trade-off and an edge-inference cost model. Module 07 (PNW Connections, 204 lines) maps the corridor, the Boeing proximity, and the GSD chipset mental-model bindings (Paula, Denise, Event Dispatcher, Silicon Manifest). Module 08 (Verification Matrix, 186 lines) audits 30 sources, 5-of-5 safety-critical confirmations, and 17 cross-project links. The result is a module arc that treats a private German-American industrial company with the same analytical rigor the series applies to a salmon stream or a Norwescon panel.

**Dual-source (TeX + web research) produced the deepest output yet.** The content commit carries a 1,087-line LaTeX mission source (`mission-pack/synsor-mission.tex`) that the research pipeline augmented with targeted web search rather than replacing. The TeX source was already rich — founding history, product architecture, patent claims, competitive positioning, market projections — and the research agent layered contemporary web-sourced confirmation on top rather than regenerating the substrate. That dual-source pattern, which has been developing across the recent Research cadence, produces measurably deeper output than either single path: the TeX source provides structure and specificity; web search provides currency and cross-verification. Future Research projects on companies, technologies, or institutions where a primary source exists (founder interviews, whitepapers, patent filings, annual reports) should follow the same pattern. The 1,087-line TeX source is the longest mission substrate in the series to date, and it is directly responsible for Module 06's 257-line technical depth.

**The "sensor" theme pair does editorial work.** The two-color palette — electric blue `#0277BD` for the primary surface and signal cyan `#00BCD4` for accents — reads as *sensor* at a glance: the blue of a cooled silicon die and the cyan of an indicator LED on a live inspection line. The Research series palette rules continue to hold: pick two colors that do the editorial work, stop there. The SYN theme will not be confused with the SMF teal+amber, the WYR bark+evergreen, or the NWC/WCN pairings even at thumbnail size on the Research hub. The palette choice is not decoration — it is metadata encoded as color, and the reader's recognition that *this one is the sensors one* happens before they read the card title.

SYN ships inside the multi-domain docroot that v1.49.38 built (`www/tibsfox/com/Research/SYN/`) with the now-standard per-project structure: `index.html` (card landing, 108 lines), `page.html` (full-site read, 205 lines), `mission.html` (mission-pack bridge, 56 lines), `style.css` (73 lines, the sensor palette), a `research/` subtree of eight module markdown files totaling 1,574 lines, and a `mission-pack/` triad of HTML (116 lines), markdown (329 lines), LaTeX (1,087 lines), and a pre-rendered PDF (172,198 bytes, `synsor-mission.pdf`). The Research hub index gained fourteen lines to add the SYN card and bump visible counts; `series.js` gained one entry extending the Prev/Next flow; the top-level hub at `www/tibsfox/com/index.html` shifted by two lines to reflect the project-50 count. The structural affordances of the docroot refactor continue to pay dividends — adding the 50th project is a mechanical operation because the shape of a Research project is stable at this depth of the series.

The commit pattern is also stable. Content commit `1ba6ff5e7` lands the SYN project in a single atomic diff (20 files, +3,890 / −4). Documentation commit `4218fe436` lands the release-notes stub (75 lines at release time; rewritten by this uplift). A neighbor commit in the same window, `46716a26b`, expands v1.49.46–v1.49.51 release notes to the verbosity standard and touches six README files without crossing into the SYN surface. The merge commit `04c215ffc` pulls dev into main and carries the v1.49.52 tag. A bisect through the v1.49.51..v1.49.52 window finds exactly one meaningful content commit where SYN existed or did not exist, plus one orthogonal docs commit and the merge. The release-notes chapter artifacts (`00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md`) remain as parser-generated output at confidence 0.95 for DB-driven navigation while this README rewrite takes the narrative surface to A-grade depth.

The reader can recover the work from this README alone. What shipped: eight research modules totaling 1,574 lines, the mission-pack triad (HTML + markdown + LaTeX + PDF), the full page shell, the standalone sidecar `docs/research/synsor-corp.md`, and the hub/navigation wiring to surface the project at count #50. Why it shipped: to document a real Everett-based industrial-AI sensing company on the merits, to close the first fifty projects of the PNW Research Series with a subject whose work mirrors the series' own (measure, document, verify), and to demonstrate that the library can handle business analysis at the same rigor it applies to ecology or music. How it was verified: the verification matrix in Module 08 documents 30 sources with 5-of-5 safety-critical confirmations and 17 cross-links to prior Research projects. What to read next: Module 04 for the competitive matrix, Module 06 for the technical depth, and Module 07 for the PNW corridor mapping that justifies the Everett naming.

---

## Key Features

| Area | What Shipped |
|------|--------------|
| SYN project tree | New directory `www/tibsfox/com/Research/SYN/` with `index.html` (108 lines), `page.html` (205 lines), `mission.html` (56 lines), and `style.css` (73 lines) wired into the multi-domain docroot |
| Research module 01 — Company Profile | `www/tibsfox/com/Research/SYN/research/01-company-profile.md` (149 lines) — Munich origins, APX product line, Everett relocation, founder-operator structure |
| Research module 02 — Product Architecture | `research/02-product-architecture.md` (183 lines) — turnkey inspection kit, edge-first compute, five industry verticals |
| Research module 03 — Patent Landscape | `research/03-patent-landscape.md` (175 lines) — German patent on compressed feature retention, claims analysis, enforceability surface |
| Research module 04 — Competitive Landscape | `research/04-competitive-landscape.md` (222 lines) — ten companies (Scortex, Landing AI, Cognex, Keyence, Omron, KLA-Tencor, and four others) mapped across seven dimensions with moats and vulnerabilities |
| Research module 05 — Market Dynamics | `research/05-market-dynamics.md` (198 lines) — $2.9–4.3B addressable subsegment, five analyst projections, Industry 4.0 growth coupling |
| Research module 06 — Technology Deep Dive | `research/06-technology-deep-dive.md` (257 lines) — vision pipeline, compressed feature retention, Shannon mutual information, temporal signal chain, edge inference, detection-to-prediction shift |
| Research module 07 — PNW Connections | `research/07-pnw-connections.md` (204 lines) — Everett corridor, Boeing proximity, GSD chipset mapping (Paula, Denise, Event Dispatcher, Silicon Manifest), the Amiga Principle |
| Research module 08 — Verification Matrix | `research/08-verification-matrix.md` (186 lines) — 30-source audit with 17 cross-links and 5-of-5 safety-critical confirmations |
| Mission-pack triad | `mission-pack/index.html` (116 lines) + `mission-pack/mission.md` (329 lines) + `mission-pack/synsor-mission.tex` (1,087 lines, the longest mission substrate in the series) + pre-rendered `mission-pack/synsor-mission.pdf` (172,198 bytes) |
| Research sidecar | `docs/research/synsor-corp.md` (329 lines) — standalone markdown companion readable outside the www tree |
| Sensor theme | `style.css` pairs `#0277BD` (electric blue, silicon die) with `#00BCD4` (signal cyan, live-line indicator) — 73 lines total |
| Research hub integration | `www/tibsfox/com/Research/index.html` updated (+14 lines net across the file) to add the SYN card and bump visible counts to the 50-project state |
| Series navigation | `www/tibsfox/com/Research/series.js` updated (+1 line) to extend the Prev/Next flow to 49 entries; `www/tibsfox/com/index.html` updated (2 lines) to bump hub count to 50 projects |
| Atomic content commit | `1ba6ff5e7` lands all 20 SYN tree files, the sidecar, and the navigation updates in a single diff (+3,890 / −4); bisect through v1.49.51..v1.49.52 finds one meaningful content state transition |
| Release-notes chapter artifacts | `00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md` parser-generated at confidence 0.95, retained for DB-driven navigation after this README uplift rewrites the narrative surface |

---

## Retrospective

### What Worked

- **The TeX source was the richest in the series to date.** 1,087 lines of LaTeX substrate — detailed product architecture, patent analysis, competitive mapping, market projections — became the spine the research agent augmented rather than replaced. Dual-source (TeX + web research) continues to produce the deepest output available to the pipeline. Module 06's 257-line technical depth is directly attributable to the TeX source, and the 30-source verification matrix in Module 08 is a direct byproduct of cross-checking a rich substrate against current web evidence rather than regenerating both from thin prompts.
- **Module 04's ten-by-seven competitive matrix is genuine market analysis.** Mapping Scortex, Landing AI, Cognex, Keyence, Omron, KLA-Tencor, and four others across seven dimensions — with moats and vulnerabilities documented for each entry — is more analytical depth than most of the creative or cultural Research projects have carried. The series has proven it can handle business analysis at the same rigor it applies to ecology (AVI+MAM) or music (DDN). The matrix is also reusable: future projects covering adjacent industrial-AI vendors can cite Module 04 as canonical competitor baseline rather than rebuilding it.
- **Project 50 landed without a forced milestone.** Synsor Corp is a real Snohomish County company in a real Everett office building making real sensor products. There was no manufactured narrative about *why this subject at #50*. The 50th project happens to be about sensing and measurement, which happens to be what the entire Research series does, which means the milestone reinforces the project's identity rather than compromising it. Future decade-boundary projects (60, 70, 80, 100) should follow the same rule: pick a subject whose merit makes the milestone, not a milestone whose pressure shapes the subject.

### What Could Be Better

- **Module 04 has no visual taxonomy yet.** The ten-company, seven-dimension competitive matrix is present as prose and a table, but a visual dimension-by-dimension diagram (positioning map, heatmap, or radar chart) would let a reader see the competitive shape at a glance. Future business-analysis Research projects should consider a companion SVG or HTML diagram embedded in the page shell; the Research hub already has the affordance for inline SVG, and the sensor theme colors lend themselves to a signal-map rendering.
- **The Boeing adjacency is stated but not documented.** Module 07 names the Boeing proximity as foundational context — Synsor is in Everett because the factories they inspect are in Everett, because Boeing anchors the corridor — but the research substrate does not spend a separate module on the aerospace adjacency. A future Research project (Boeing, aerospace supply chain, or Paine Field industrial ecology) would let the current Synsor module cite a dedicated source rather than gesturing toward adjacency. The gap is deliberate for the first pass; the follow-on is queued.
- **The mission-pack PDF is a pre-render, not a build artifact.** `synsor-mission.pdf` (172,198 bytes) is committed directly rather than produced by a reproducible build. The current Research release cadence tolerates this because the LaTeX source is also committed and the PDF is a convenience artifact, but a proper release pipeline would build the PDF from `synsor-mission.tex` in CI and verify byte equivalence. The publish-pipeline skill has the affordances; the Research release path does not invoke them yet.

---

## Lessons Learned

- **The PNW tech corridor extends north, and the Research series maps the same geography through different eras.** Seattle → Bellevue → Redmond → Everett. Synsor in Everett, Boeing in Everett, Weyerhaeuser historically in Federal Way and Tacoma. The manufacturing corridor that timber built in the 20th century is now building with sensors in the 21st. The Research series documents the same physical geography under different industrial substrates — timber, aerospace, industrial AI — and the modules cross-reference each other on those geographic grounds. A reader who comes to SYN after WYR sees the corridor evolve; a reader who comes to SYN fresh sees a single company; both readings are coherent because the corridor is real, not a narrative device.
- **Fifty projects is a library.** What started at v1.49.22 as sixteen PNW ecology studies is now a 50-project research library covering ecology, music, literature, conventions, cybersecurity, business law, timber, infrastructure, energy, and industrial AI. The Rosetta Stone framework holds at 50 because the projects genuinely connect — not through forced metaphor but through shared geography, shared principles, shared patterns, and shared structural affordances. The library is now dense enough that new projects can cite prior projects as precedent rather than re-establishing context, and the verification matrices (17 cross-links in SYN Module 08, similar counts elsewhere) are load-bearing on that density.
- **Dual-source substrates beat single-source substrates at depth.** The TeX + web-research pattern that produced Module 06's 257 lines of vision-pipeline and mutual-information content would not have emerged from either source alone. TeX provides structure, claim-level specificity, and technical vocabulary; web research provides currency, cross-verification, and contemporary confirmation. The research agent's role is not to generate from scratch but to weave — and weaving requires two threads. Future Research projects on subjects with primary sources (whitepapers, patent filings, founder interviews, annual reports) should default to the dual-source pattern.
- **A competitive matrix is reusable infrastructure.** Module 04 maps ten companies across seven dimensions. That matrix is now citable as baseline for any future Research project on adjacent industrial-AI vendors — a Scortex deep dive, a Cognex company study, a Landing AI history — without rebuilding the comparison from scratch. The Research series is accumulating reusable analytical infrastructure, not just individual essays, and Module 04 is an example of prose that compounds across releases.
- **Two specific colors outperform three generic ones.** Electric blue `#0277BD` and signal cyan `#00BCD4` do the editorial work for SYN at a glance. A third accent color would dilute signal; a generic blue would lose the sensor association. The Research series palette rule — two colors, both specific, both doing editorial work — continues to compound across fifty releases. The SYN palette will not be confused with SMF's teal+amber or WYR's bark+evergreen even at thumbnail size on the Research hub.
- **Proximity is a claim, and claims about proximity earn their geographic detail.** Module 07 does not merely say *Synsor is near Boeing*. It names the Everett corridor, the Snohomish River alignment, the factory geography that makes Snohomish County a sensor market, and the historical substrate (timber → aerospace → industrial AI) that makes the corridor persistent across industries. Research projects that make geographic claims should earn the geography at the street-and-river level, not the state level.
- **GSD chipset mapping works as a shared mental model.** Module 07 cross-binds Synsor's vision pipeline to GSD chipsets — Paula, Denise, Event Dispatcher, Silicon Manifest — and the mapping reads as genuine rather than forced because the functional shapes match (audio co-processor → signal front-end, display chip → feature extractor, etc.). The Rosetta Stone framework earns its keep when two unrelated domains (industrial AI and Amiga-era chipset architecture) turn out to rhyme at the component level. Future Research projects that touch any pipeline architecture (media, networking, sensing) can borrow the chipset-mapping move.
- **Project milestones should reinforce subject identity, not substitute for it.** Project 50 is about sensing. The Research series is about sensing. The milestone compounds the project's identity rather than distorting it. The discipline — pick the subject first on the merits, let the milestone number land where it lands — applies equally to future milestones (100, 200, 360) and should continue to govern the series.
- **The atomic content commit pattern is worth protecting.** Landing all 20 SYN tree files, the sidecar, and the navigation updates in one diff (`1ba6ff5e7`) keeps the intermediate state valid. A reviewer or bisect walker sees the project either present or absent, never half-built. The pattern is cheap to maintain (one `git add` of the whole tree, one commit message) and expensive to restore if broken. Every Research release so far has honored it, and the SYN release is the fiftieth consecutive demonstration.

---

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.51](../v1.49.51/) | Predecessor — "Daydream Nation"; Research cadence entry immediately before the SYN release |
| [v1.49.53](../v1.49.53/) | Successor — next Research project in the PNW cadence after project 50 |
| [v1.49.48](../v1.49.48/) | "Secret Masters of Fandom" — SMF; prior-sibling demonstration of the eight-module Research project structure on a cultural subject; the seven-module variant SYN extends to eight |
| [v1.49.47](../v1.49.47/) | "West of the Rockies" — WCN; prior demonstration of the sub-cluster trilogy pattern; SYN stands alone rather than joining a trilogy, a deliberate variant |
| [v1.49.46](../v1.49.46/) | "Room 101" — NWC; the server layer of the conventions sub-cluster; precedent for this release's emphasis on geographic anchoring |
| [v1.49.45](../v1.49.45/) | "Ten" — Research entry that established the one-per-release cadence SYN continues |
| [v1.49.44](../v1.49.44/) | "Skill Check" — Research cadence entry between WYR and the conventions sub-cluster |
| [v1.49.43](../v1.49.43/) | WYR (Weyerhaeuser) — the 41st Research project, prior PNW industrial study whose verification-matrix pattern SYN Module 08 adapts for business-analysis sources; cross-referenced by SYN on the timber-to-sensors corridor thesis |
| [v1.49.38](../v1.49.38/) | Multi-Domain Docroot Refactor — the release that built the `www/tibsfox/com/Research/` slot SYN drops into; v1.49.52 is a continuing demonstration of the refactor's velocity payoff at project 50 |
| [v1.49.37](../v1.49.37/) | Thermal & Hydrogen Energy Systems — adjacent infrastructure project whose vertical-integration framing rhymes with SYN's turnkey-kit architecture |
| [v1.49.31](../v1.49.31/) | TIBS Animal Speak & Sacred Landscapes — precedent for cross-project connections across domain boundaries; SYN Module 07 extends the cross-binding practice to industrial AI |
| [v1.49.27](../v1.49.27/) | Spatial Awareness — PNW atlas that the Everett corridor mapping in SYN Module 07 draws on |
| [v1.49.26](../v1.49.26/) | BPS Bio-Physics Sensing Systems — the closest methodological sibling; both projects document sensing systems, SYN in industrial AI and BPS in bio-physics |
| [v1.49.25](../v1.49.25/) | AVI+MAM compendiums — precedent for the 8-module Research project structure with a verification matrix at the end |
| [v1.49.22](../v1.49.22/) | PNW Research Series origin — the release that began the series whose 50th member ships here |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; SYN is an Observe→Compose cycle applied to the industrial-AI layer of the PNW corridor |
| `www/tibsfox/com/Research/SYN/` | New project tree — 20 new files totaling the SYN surface |
| `www/tibsfox/com/Research/SYN/research/` | Eight research modules totaling 1,574 lines — the core narrative of the project |
| `www/tibsfox/com/Research/SYN/mission-pack/` | Mission-pack triad — HTML + markdown + LaTeX (1,087 lines) + pre-rendered PDF (172,198 bytes) |
| `www/tibsfox/com/Research/SYN/research/08-verification-matrix.md` | Source-audit matrix documenting 30 citations, 5-of-5 safety-critical confirmations, and 17 cross-links |
| `docs/research/synsor-corp.md` | 329-line markdown sidecar readable outside the www tree — the project's portable companion |
| `www/tibsfox/com/Research/index.html` | Research hub updated (+14 lines) to add the SYN card and bump visible counts to 50 |
| `www/tibsfox/com/Research/series.js` | Prev/Next navigation updated (+1 line) to 49 entries |
| `www/tibsfox/com/index.html` | Top-level hub updated (2 lines) for the project-50 count |
| `1ba6ff5e7` | Content commit — 20 SYN tree files + sidecar + nav landed atomically |
| `4218fe436` | Docs commit — release-notes stub for v1.49.52 |
| `04c215ffc` | Merge commit — dev → main for the v1.49.52 tag |

---

## Engine Position

v1.49.52 is the 50th project in the PNW Research Series and the first industrial-AI sensing study in the line. It is the 12th consecutive Research project to demonstrably benefit from the structural investment made in v1.49.38 (the multi-domain docroot refactor). Looking backward, the series arc runs from 16 PNW ecology studies at the v1.49.22 origin through conventions (NWC/WCN/SMF sub-cluster at v1.49.46–48), industrial timber (WYR at v1.49.43), and cadence entries (v1.49.44 "Skill Check", v1.49.45 "Ten", v1.49.49–51 continuing Research projects) to this 50th release. Looking forward, every subsequent Research project inherits three new affordances SYN established: the dual-source (TeX + web research) substrate pattern for subjects with rich primary sources, the business-analysis rigor template (ten-by-seven competitive matrix, five-analyst market projection, patent-centered technical core) for company-focused projects, and the 8-module structure with a verification matrix at the end as a reusable shape for subjects that need a final audit section. The Research series at project 50 is dense enough that new projects can cite prior projects as precedent rather than re-establishing context; the library is compounding. The v1.49.x line continues its cadence of one Research project per calendar release, each with its own dedication, epigraph, multi-module structure, and two-color theme pair.

---

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.51..v1.49.52) | 3 (content `1ba6ff5e7` + docs `4218fe436` + merge `04c215ffc`) |
| Files changed | 27 (20 SYN tree + 1 sidecar + 1 new README + 2 nav + 1 top-hub + 6 neighbor README verbosity expansions from `46716a26b`) |
| Lines inserted / deleted | 4,312 / 37 (SYN content alone: 3,890 / 4) |
| New files in SYN tree | 20 |
| Research modules (markdown) | 8 (1,574 lines total) |
| Mission-pack files | 4 (`index.html` 116 + `mission.md` 329 + `synsor-mission.tex` 1,087 + `synsor-mission.pdf` 172,198 bytes) |
| Page-shell files | 3 (`index.html` 108 + `page.html` 205 + `mission.html` 56) |
| Stylesheet | 1 (`style.css` 73 lines) |
| Research sidecar (outside www) | 1 (`docs/research/synsor-corp.md`, 329 lines) |
| Release-notes README | 1 (75 lines at release time; rewritten by this uplift) |
| Navigation files touched | 3 (`Research/index.html`, `series.js`, hub `index.html`) |
| Sources audited in verification matrix | 30 |
| Safety-critical confirmations | 5 of 5 |
| Cross-references to other Research projects | 17 |
| Theme colors | 2 (`#0277BD` electric blue, `#00BCD4` signal cyan) |
| Research project number in series | 50 |
| Cumulative Research series weight | 462 research modules, ~205,000 lines across 50 projects |

---

## Taxonomic State

After v1.49.52 the PNW Research Series taxonomy stands at 50 published projects across the core clusters. The ecology cluster (COL, CAS, ECO, AVI, MAM, SAL, TIBS, FFA, plus the original 16 PNW ecology studies) remains the densest neighborhood for cross-references at 16+ projects. The infrastructure cluster (SYS, CMH, BCM, SHE, OCN, BPS, THE, HGE, NND) spans 9+ projects. The culture-and-conventions cluster (NWC, WCN, SMF plus cadence entries) is anchored by a closed three-convention sub-cluster. The industrial layer (WYR for timber, now SYN for industrial AI) is anchored by two flagship projects, and SYN formally opens the industrial-AI subcluster for follow-ons (Scortex, Landing AI, Cognex, and other adjacents are natural future subjects). Taxonomic state: 50 projects, 462 research modules, ~205,000 cumulative research lines, 7+ clusters, 1 closed sub-cluster (conventions), 1 opened sub-cluster (industrial AI).

---

## Files

- `www/tibsfox/com/Research/SYN/` — new project root containing `index.html`, `page.html`, `mission.html`, `style.css`, `research/`, and `mission-pack/`
- `www/tibsfox/com/Research/SYN/research/01-company-profile.md` — 149 lines; Munich origins, Everett relocation, founder-operator structure
- `www/tibsfox/com/Research/SYN/research/02-product-architecture.md` — 183 lines; turnkey kit, edge-first compute, five verticals
- `www/tibsfox/com/Research/SYN/research/03-patent-landscape.md` — 175 lines; German patent on compressed feature retention
- `www/tibsfox/com/Research/SYN/research/04-competitive-landscape.md` — 222 lines; ten companies across seven dimensions
- `www/tibsfox/com/Research/SYN/research/05-market-dynamics.md` — 198 lines; $2.9–4.3B subsegment, five analyst projections
- `www/tibsfox/com/Research/SYN/research/06-technology-deep-dive.md` — 257 lines; vision pipeline, Shannon mutual information, edge inference
- `www/tibsfox/com/Research/SYN/research/07-pnw-connections.md` — 204 lines; Everett corridor, Boeing proximity, GSD chipset mapping
- `www/tibsfox/com/Research/SYN/research/08-verification-matrix.md` — 186 lines; 30-source audit, 5/5 safety-critical, 17 cross-links
- `www/tibsfox/com/Research/SYN/mission-pack/index.html` — 116 lines; mission-pack landing page
- `www/tibsfox/com/Research/SYN/mission-pack/mission.md` — 329 lines; mission-pack markdown source
- `www/tibsfox/com/Research/SYN/mission-pack/synsor-mission.tex` — 1,087 lines; mission-pack LaTeX source (longest in series to date)
- `www/tibsfox/com/Research/SYN/mission-pack/synsor-mission.pdf` — 172,198 bytes; pre-rendered PDF
- `www/tibsfox/com/Research/SYN/index.html` — 108 lines; card landing page
- `www/tibsfox/com/Research/SYN/page.html` — 205 lines; full-site read page
- `www/tibsfox/com/Research/SYN/mission.html` — 56 lines; mission-pack bridge
- `www/tibsfox/com/Research/SYN/style.css` — 73 lines; electric-blue + signal-cyan sensor theme
- `docs/research/synsor-corp.md` — 329 lines; standalone research sidecar outside the www tree
- `www/tibsfox/com/Research/index.html` — +14 lines; hub card added for SYN and counts bumped to 50
- `www/tibsfox/com/Research/series.js` — +1 line; Prev/Next wiring to 49 entries
- `www/tibsfox/com/index.html` — 2 lines; top-level hub count update to 50 projects

Aggregate: 27 files changed, +4,312 insertions, −37 deletions across 3 commits in the v1.49.51..v1.49.52 window (content `1ba6ff5e7` + docs `4218fe436` + merge `04c215ffc`), with SYN content alone accounting for 20 files and +3,890 / −4. The remaining deltas belong to the orthogonal verbosity-expansion commit (`46716a26b`) that touches six neighbor release-notes READMEs in the same merge window without crossing into the SYN surface.

---

**Prev:** [v1.49.51](../v1.49.51/) · **Next:** [v1.49.53](../v1.49.53/)

> *Fifty projects. Four hundred sixty-two modules. Two hundred five thousand lines. One bioregion. The same place, mapped through every lens we can find.*
