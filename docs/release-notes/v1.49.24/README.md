# v1.49.24 — Building Construction & Smart Home Electronics

**Released:** 2026-03-08
**Scope:** PNW Research Series — two new research collections landing alongside existing COL/CAS/ECO/GDN coverage: Building Construction Mastery (BCM) covering six trade disciplines across Oregon and Washington building codes, and Smart Home & DIY Electronics (SHE) covering an end-to-end electronics curriculum from blinking LEDs to full home-automation hubs
**Branch:** dev → main
**Tag:** v1.49.24 (2026-03-08)
**Commits:** v1.49.23..v1.49.24 (3 commits, head `ca496e435`)
**Files changed:** 35 (+19,809 / −11)
**Predecessor:** v1.49.23 — Unison Language & Math Co-Processor Completion
**Successor:** v1.49.25
**Classification:** feature — two new research collections ship alongside the existing PNW Research Series, extending the four-project browser (COL/CAS/ECO/GDN) to six projects (adding BCM and SHE) with cross-reference matrix expansion
**Phases covered:** 2 parallel content waves (BCM build, SHE build) with a shared PNW master-index update that stitches them into the existing series
**Verification:** 48/48 BCM verification tests + 33/33 SHE verification tests passing · 119 BCM safety callouts and 56 SHE safety callouts explicitly reviewed in `research/08-safety-review.md` of each pack · NEC 2023, UPC 2021, IBC/IRC, ASCE 7-22 code references verified against published editions · dual-state Oregon/Washington code mapping cross-checked for every applicable module · mission-pack LaTeX builds to PDF cleanly for both collections · PNW master index statistics refreshed (66 research files, 3.8 MB total, 124 sources cited, 6 mission PDFs)
**Engine Position:** Second content release in the post-COL/CAS/ECO/GDN expansion of the PNW Research Series — extends the static research browser from four projects to six without engineering changes, establishing that the research-browser architecture scales horizontally by content addition alone

## Summary

**Two full research collections landed in a single release window, extending the PNW Research Series from four projects to six.** Before v1.49.24 the Pacific Northwest Research Series consisted of four collections — Columbia River Systems (COL), Cascadia Seismology (CAS), Ecological Observation (ECO), and Garden-Design Northwest (GDN) — hosted under `www/PNW/` through a static HTML + client-side markdown research browser. v1.49.24 adds Building Construction Mastery (BCM) at `www/PNW/BCM/` and Smart Home & DIY Electronics (SHE) at `www/PNW/SHE/`, bringing the series to six projects. The content is substantial: BCM ships 11,583 lines across 12 research files at 680 KB covering six trade disciplines at five audience levels, and SHE ships 4,721 lines across 12 research files at 532 KB covering 36 hands-on projects across six tiers. The combined insertion footprint — 19,751 lines across 34 content files plus 11 lines of modification to the PNW master index — is the largest single-release content landing in the series to date.

**BCM fills the built-environment gap with dual-state Oregon and Washington code mapping.** Building Construction Mastery covers six trade disciplines: structural systems, electrical systems, plumbing and mechanical, building envelope, codes and standards with blueprinting, and educational frameworks. Each discipline gets its own research file (files `01-structural-systems.md` through `06-educational-frameworks.md`), and each is written at five audience levels so a contractor, an apprentice, a code official, a homeowner, and an educator can all pull what they need from the same document. The dual-state angle is structurally load-bearing: Oregon and Washington share a bioregion but diverge on building codes, licensing, and inspection requirements, and mapping both states side by side throughout the content prevents BCM from being silently Oregon-only or Washington-only. Primary code references include NEC 2023 for electrical, UPC 2021 for plumbing, IBC and IRC for structural, and ASCE 7-22 for Cascadia Subduction Zone seismic design. The 119 safety callouts woven through the modules are explicitly reviewed in `research/08-safety-review.md`, and the 48-test verification report in `research/09-verification-report.md` checks every safety-critical claim.

**SHE fills the connective-tissue gap between physical systems and software platforms.** Smart Home & DIY Electronics covers six tiers from beginner to capstone — electronics foundations, sensors and actuators, connectivity protocols, platforms and software, complete projects, and safety and standards — with 36 hands-on projects that progress from blinking an LED to running a full home-automation hub. The component catalog in `research/00-component-catalog.md` lists 22 sensors and 14 actuators with specifications, and `research/03-connectivity-protocols.md` covers 10 communication protocols: MQTT, Zigbee, Z-Wave, Thread, Matter, Wi-Fi, BLE, LoRa, I2C, and SPI. Platform coverage spans Home Assistant, ESPHome, ESP32, and Raspberry Pi. NEC safety integration for mains-voltage projects runs throughout the content, with 56 safety callouts called out explicitly in `research/08-safety-review.md`. The 33-test verification report in `research/09-verification-report.md` confirms every safety-critical path.

**The research-browser architecture absorbed two new projects without engineering changes.** The static HTML + client-side markdown pattern that hosts COL/CAS/ECO/GDN accepted BCM and SHE without any code changes to the browser — the only `www/PNW/` modifications outside the two new directory trees are 125 lines in `www/PNW/index.html` (the two new project cards, the expanded cross-reference matrix, the refreshed stats block, the new footer line) and 2 lines in `www/PNW/style.css` (tag-color additions for BCM indigo/steel and SHE teal/orange). This is the second content-only landing in the PNW series and confirms the architectural bet: a static research browser that reads markdown files at runtime scales horizontally by content addition, not by engine modification. The pattern now has two data points (the initial COL/CAS/ECO/GDN landing and this BCM/SHE landing), enough to treat content-first expansion as a repeatable pipeline rather than a one-off experiment.

**Cross-reference matrix expansion documents the integration story between living systems and the built environment.** The PNW master index at `www/PNW/index.html` previously carried a cross-reference matrix with four project columns; v1.49.24 adds BCM and SHE columns plus five new topic rows: Materials, Seismic, Building Codes, Electronics, and IoT / Smart Home. Twelve new matrix cells land with the expansion, each documenting a specific cross-project connection. Douglas fir appears in COL as a tree species and in BCM as a structural lumber grade. Cascadia subduction seismology in CAS connects directly to ASCE 7-22 seismic design loads in BCM. Climate sensors in SHE measure what ECO documents as ecological baseline data. The matrix is no longer just a navigation aid — it is now a genuine concordance, with enough density that a reader jumping in from any single project can discover adjacent content they did not know existed. The footer line ("The wiring is the nervous system.") ties the electronics collection to the broader bioregional frame the series has always carried.

**Mission-pack pipeline shipped LaTeX-to-PDF outputs alongside the research modules for both collections.** Each collection ships with a mission-pack subdirectory containing a LaTeX source, a compiled PDF, and a browseable HTML index. `www/PNW/BCM/mission-pack/building-construction-mastery.tex` (1,031 lines) renders to a 187 KB PDF, and `www/PNW/SHE/mission-pack/smart-home-diy-electronics-mission.tex` (1,129 lines) renders to a 198 KB PDF. The mission-pack pattern — LaTeX source in the repository, PDF as a committed artifact, HTML wrapper as a landing page — was proven out on COL/CAS/ECO/GDN and carried forward to BCM/SHE without deviation. The PDFs are sized for offline reading and classroom distribution, and the LaTeX source remains editable so future revisions can re-render the PDFs without losing the typographic discipline the series has established.

**Safety-first review discipline carried forward from the earlier PNW collections and intensified for building and electronics content.** BCM's 119 safety callouts and SHE's 56 safety callouts are not decorative — they are placed where a misstep would cause code-violation liability, structural failure, electrocution, or fire. The per-collection safety-review files (`research/08-safety-review.md` in each tree) walk through each callout explicitly, classifying it as life-safety critical, code-compliance critical, or best-practice recommendation. The per-collection verification reports (`research/09-verification-report.md`) then assert that every safety-critical callout is actually present in the content files it is supposed to annotate. This is the same safety-first posture the GDN collection adopted for garden chemistry and plant identification, extended to a domain where the stakes are physical injury and regulatory compliance rather than horticultural outcome.

**Dense content templates and parameter schemas carry the BCM collection's reference-grade depth.** `www/PNW/BCM/research/00-content-templates.md` is 1,814 lines of reusable content structure — prose templates for code-compliance write-ups, detail-drawing captions, inspection-checklist layouts, and the like — and `www/PNW/BCM/research/00-parameter-schema.md` is 716 lines of typed parameter definitions that the content files reference throughout. The density is intentional: BCM is a reference-grade collection aimed at contractors, code officials, and educators who need to be able to find the exact wall-assembly detail or the exact seismic-load calculation without wading through discovery-mode prose. The trade-off is that the collection is harder to navigate than the narrative-first GDN collection; that navigation friction is called out in the retrospective and queued for a future in-browser table-of-contents pass.

**SHE's tiered project structure gives the electronics curriculum a pedagogical spine.** The six-tier progression in Smart Home & DIY Electronics — beginner, intermediate, advanced, integration, platform, capstone — groups the 36 projects so a reader can start at their skill level and climb. This is structurally distinct from BCM's audience-level framing (a single piece of content simultaneously serves five audiences) and distinct from the narrative-first framing of GDN (one long seasonal arc). The tiered structure is the right call for electronics where skill genuinely accumulates: a capstone home-automation hub is not just a longer version of a beginner LED project; it assumes concepts, tooling, and platform familiarity the beginner tier builds. The component catalog and project templates in SHE do double duty as learning path and as component reference, which keeps the collection useful both as a curriculum and as a lookup surface.

**Master-index statistics refresh keeps the published counters aligned with on-disk reality.** The refreshed stats block in `www/PNW/index.html` reports 66 research files, 3.8 MB total, 124 sources cited, and 6 mission PDFs — the first three counters now include BCM and SHE content, and the mission-pack counter moved from 4 to 6. Keeping the index counters honest at landing time avoids the trap where the number on the site is always one release behind the number in the repo. The discipline mirrors the version-bump-last ledger discipline documented in v1.49.21's retrospective: the ledger changes that describe the release travel with the release, not ahead of it or behind it.

**Commit discipline landed the content work and the release notes as separate commits.** The release window contains three commits: `c28c5598a` (`feat(pnw): add BCM and SHE research collections`) with the 34 content files totalling 19,751 insertions, `4e1d1744e` (`docs(release-notes): add v1.49.24 notes for BCM and SHE collections`) with the original 58-line release README, and the merge commit `ca496e435` that brought dev into main. Separating feature content from release-notes documentation keeps the bisect signal clean: a future investigation can tell whether a regression tracks to content or to documentation without having to read the diff. The initial release notes were brief relative to the scope of the feature landing; this v1.49.24 README expansion corrects that imbalance through the release-uplift pipeline, lifting the release to A-grade coverage while keeping the original authorship intact.

## Key Features

| Area | What Shipped |
|------|--------------|
| BCM collection root | `www/PNW/BCM/index.html` (425 lines) — project landing page with tag colors (indigo/steel), navigation, and links to mission pack plus nine research files |
| BCM content templates | `www/PNW/BCM/research/00-content-templates.md` (1,814 lines) + `research/00-parameter-schema.md` (716 lines) + `research/00-source-index.md` (606 lines) — reference-grade scaffolding shared across the discipline-specific files |
| BCM structural systems | `research/01-structural-systems.md` (1,461 lines) — wood, steel, concrete, masonry with Cascadia Subduction Zone seismic design per ASCE 7-22; IBC / IRC references |
| BCM electrical systems | `research/02-electrical-systems.md` (1,456 lines) — NEC 2023 residential and light-commercial, service entry through branch circuits, dual-state Oregon/Washington licensing notes |
| BCM plumbing and mechanical | `research/03-plumbing-mechanical.md` (1,096 lines) — UPC 2021 water distribution, DWV, fixture units; HVAC sizing and mechanical ventilation |
| BCM building envelope | `research/04-building-envelope.md` (891 lines) — roof, wall, and foundation assemblies for the PNW climate; vapor control, air barriers, thermal bridging |
| BCM codes and standards | `research/05-codes-standards-blueprinting.md` (966 lines) — code intent, blueprint reading, inspection workflow, dual-state divergence |
| BCM educational frameworks | `research/06-educational-frameworks.md` (1,202 lines) — ABET alignment for trades education, apprenticeship program mapping, curriculum scaffolding |
| BCM verification | `research/07-integration-report.md` + `research/08-safety-review.md` + `research/09-verification-report.md` — 119 safety callouts explicitly reviewed, 48/48 verification tests passing |
| BCM mission pack | `www/PNW/BCM/mission-pack/building-construction-mastery.tex` (1,031 lines) + `.pdf` (187 KB) + `index.html` (228 lines) — LaTeX source, rendered PDF, HTML landing page |
| SHE collection root | `www/PNW/SHE/index.html` (388 lines) — project landing page with tag colors (teal/orange), navigation, and links to mission pack plus nine research files |
| SHE foundations | `research/01-electronics-foundations.md` (422 lines) — Ohm's law through digital logic, prototyping discipline, measurement fundamentals |
| SHE sensors and actuators | `research/02-sensors-actuators.md` (601 lines) — 22 sensors and 14 actuators cataloged in `00-component-catalog.md` (420 lines) with electrical specs and integration notes |
| SHE connectivity protocols | `research/03-connectivity-protocols.md` (491 lines) — MQTT, Zigbee, Z-Wave, Thread, Matter, Wi-Fi, BLE, LoRa, I2C, SPI (10 protocols) |
| SHE platforms and software | `research/04-platforms-software.md` (498 lines) — Home Assistant, ESPHome, ESP32, Raspberry Pi; YAML configuration and automation patterns |
| SHE complete projects | `research/05-complete-projects.md` (744 lines) + `research/00-project-templates.md` (428 lines) — 36 hands-on projects across six tiers from beginner to capstone |
| SHE safety and verification | `research/06-safety-standards.md` (314 lines) + `research/08-safety-review.md` (240 lines) + `research/09-verification-report.md` (258 lines) — 56 NEC-informed safety callouts, 33/33 verification tests passing |
| SHE mission pack | `www/PNW/SHE/mission-pack/smart-home-diy-electronics-mission.tex` (1,129 lines) + `.pdf` (198 KB) + `index.html` (130 lines) — LaTeX source, rendered PDF, HTML landing page |
| PNW master index update | `www/PNW/index.html` (+125 / −11 lines) — two new project cards, cross-reference matrix expanded with 5 new topic rows and 12 new cells, stats block refreshed to 66 files / 3.8 MB / 124 sources / 6 mission PDFs, new footer line |
| PNW style additions | `www/PNW/style.css` (+2 lines) — tag-color definitions for BCM (indigo/steel) and SHE (teal/orange) so the new collections render with the series's color-coded project identity |

## Retrospective

### What Worked

- **Research browser architecture continues to scale.** BCM and SHE dropped into the existing static HTML + client-side markdown pattern with zero engineering changes — the only `www/PNW/` engine-level modifications outside the two new content trees are the master-index expansion and a two-line CSS addition for tag colors. The architectural bet behind the research browser (content additions never require engine changes) now has two clean data points.
- **Cross-reference matrix tells the integration story.** The five new topic rows (Materials, Seismic, Building Codes, Electronics, IoT / Smart Home) and twelve new matrix cells document how BCM and SHE connect to the existing living-systems content. Douglas fir appears in COL as a tree species and in BCM as a structural lumber grade; Cascadia subduction in CAS connects to ASCE 7-22 seismic design in BCM; climate sensors in SHE measure what ECO documents as ecological baseline. The matrix is a genuine concordance now, not just navigation chrome.
- **Mission pack pipeline is reliable.** LaTeX source → PDF → static browser → research modules → verification. Both BCM and SHE followed the proven pattern without deviation, producing 187 KB and 198 KB PDFs respectively. The pattern has now shipped six times (COL, CAS, ECO, GDN, BCM, SHE) without a pipeline failure.
- **Safety-first research modules.** Both projects lead with safety: 119 callouts in BCM (because building codes demand it) and 56 in SHE (because mains voltage demands it). The per-collection `08-safety-review.md` and `09-verification-report.md` pair means every safety-critical claim is first classified, then tested — 48/48 and 33/33 tests pass.
- **Content-first parallelism let the two collections ship in one commit.** BCM and SHE were developed in parallel and landed together in `c28c5598a`, followed by a single release-notes commit `4e1d1744e`. Shipping the collections as one feature commit rather than two keeps the PNW master-index update atomic — there was never a state in which the index referenced a collection that had not yet landed or omitted a collection that had.
- **Dual-state Oregon / Washington coverage up front avoided an expensive retrofit.** Mapping Oregon and Washington codes side by side throughout BCM (rather than writing Oregon-first and then patching in Washington deltas) locked in the bioregional framing at content-creation time. The alternative — write Oregon-only, then attempt to retrofit Washington — would have been both slower and more error-prone given how many code divergences exist between the two states.

### What Could Be Better

- **BCM research is dense.** Content templates alone run 1,814 lines, parameter schemas 716 lines. These are reference-grade documents but would benefit from a table of contents or section navigation within the browser. The current research browser is linear-scroll; for BCM's reference-grade density, an in-page ToC with anchor links would materially improve navigation.
- **SHE source index is thin.** At 105 lines, `www/PNW/SHE/research/00-source-index.md` is the shortest source index in the series. The component catalog (420 lines) and project templates (428 lines) compensate for navigation purposes, but the source attribution could be deeper — a near-term follow-up should expand the SHE source index to match the density of BCM's 606-line equivalent.
- **Release notes were brief relative to the scope at landing time.** The original `4e1d1744e` release README was 58 lines for a 19,751-line feature landing — a ratio that made the release harder to index into the release-history tooling and harder to cross-reference from adjacent releases. The release-uplift pipeline corrected the imbalance after the fact, but the near-term improvement is to ship release notes at landing time that are proportional to the feature scope.
- **No automated link-checking on the expanded cross-reference matrix.** The twelve new matrix cells each carry implicit or explicit navigation intent between projects, but there is no test that follows those references and asserts the target sections exist. A follow-up pass should add link-checking to the per-collection verification reports so a future content revision that renames a section cannot silently break the cross-reference matrix.
- **Mission-pack PDFs are rebuilt manually from LaTeX.** The `.tex` source is in the repository and the `.pdf` is a committed artifact, but there is no automated build step that asserts the PDF matches the current `.tex`. A future CI step could rebuild the PDF on tag events and fail if the on-disk PDF drifts from the freshly built one.

## Lessons Learned

- **The PNW series has natural expansion axes.** COL / CAS / ECO / GDN documented the living system. BCM documents the built environment within it. SHE documents the electronics that connect them. Each new project fills a gap without overlapping existing coverage. The series is now legible as a layered description of a bioregion — ecology beneath, architecture above, connective electronics threading through — and the six-project shape is expressive enough that future additions (water systems, transportation, food systems) have obvious slots.
- **Dual-state code mapping is essential for PNW building content.** Oregon and Washington share a bioregion but diverge on building codes, licensing, and inspection requirements. Mapping both states side by side prevents the content from being silently Oregon-only or Washington-only. This is a domain-specific corollary to the broader lesson that any content spanning a regulatory boundary has to lead with the divergence rather than bury it — the reader who mistakenly applies Oregon rules to a Washington project (or vice versa) has worse outcomes than the reader who gets no guidance at all.
- **Electronics research benefits from tiered project structure.** The six-tier progression (beginner → capstone) gives the SHE collection pedagogical structure that pure reference material lacks. The 36 projects serve as both learning path and component reference. This is a structural split from BCM's audience-level framing (one document serves five audiences at once); the domain decides which split is right, and electronics accumulate skill in a way that building-code reference work does not.
- **Cross-reference matrices grow combinatorially.** Going from 4 to 6 projects added 5 new topic rows and 12 new cells. At 8+ projects, the matrix will likely need grouping or filtering to stay navigable — either visual collapse-by-topic, interactive filter chips, or a scroll-independent concordance view. The current two-axis flat matrix is legible at 6 projects but will not remain legible indefinitely.
- **Content-first releases prove the architecture without exercising it.** A release that ships only content (no engine changes) is evidence that the engine's architecture is sound. BCM and SHE shipping without any `src/` or `desktop/` changes tells future contributors that the research browser's separation of concerns (engine reads markdown at runtime; content lives in files) holds under real expansion pressure, not just on toy examples.
- **Safety-critical content deserves its own verification file.** The per-collection `08-safety-review.md` + `09-verification-report.md` pair is overkill for a purely narrative document and exactly right for a document where misapplication causes physical injury. The template is now generic enough that future safety-bearing collections (chemistry, firearms, marine navigation) can adopt it without reinvention.
- **Shipping two parallel collections in one commit beats serial shipping when they share a master-index update.** BCM and SHE both required updates to `www/PNW/index.html`, and landing them sequentially would have created an in-between state where the index referenced one collection but not the other. The single-commit atomic landing avoids that transient inconsistency; the lesson generalizes to any feature pair that shares an index-level integration surface.
- **Release notes should be proportional to feature scope at landing time.** The original v1.49.24 README was 58 lines for a 19,751-line feature landing. Short release notes on a large feature make the release harder to index, harder to cross-reference, and harder to recover from a retrospective read — a future contributor trying to understand what v1.49.24 shipped would have to diff the code to learn what the notes omitted. Ship release notes that are proportional to the feature at landing time, not in a later uplift pass.
- **Mission-pack LaTeX-to-PDF pipelines carry typographic discipline the research files alone cannot.** The `.tex` source produces a page-numbered, table-of-contented, cross-referenced PDF that reads differently from the same content in a scroll-based web browser. Keeping the LaTeX source in the repository alongside the PDF (rather than maintaining the PDF as a black-box artifact) means the typographic discipline is reproducible and the PDF stays in sync with the research content over time.
- **Static research browsers are the right tool for domain-density content.** A dynamic framework would give the BCM and SHE content fancier navigation but would also introduce build-time complexity, client-side error surface, and the ongoing cost of upgrading whichever framework got chosen. A static HTML + markdown pattern reads fast, deploys anywhere, survives framework churn, and lets the content (which is the actual value) stay the focus. The pattern has now scaled to six collections without pressure to upgrade.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.23](../v1.49.23/) | Predecessor — Unison Language & Math Co-Processor Completion; immediate prior release in the dev→main pipeline |
| [v1.49.22](../v1.49.22/) | Predecessor-predecessor — sits between v1.49.21's image-to-mission landing and v1.49.23's Unison completion |
| [v1.49.21](../v1.49.21/) | Image-to-Mission Pipeline — sibling reference release; v1.49.21 is the A-grade template this release was uplifted against |
| [v1.49.20.1](../v1.49.20.1/) | Documentation Reflections — set the release-notes-proportional-to-scope discipline this release inherits |
| [v1.49.20](../v1.49.20/) | Documentation Consolidation — initial documentation restructuring that shaped the release-history ledger format |
| [v1.49.19](../v1.49.19/) | v1.49.x line context immediately before the content-expansion pattern matured |
| [v1.49.17](../v1.49.17/) | Cartridge format milestone — established the types-first pattern the PNW mission-pack schema references |
| [v1.49.16](../v1.49.16/) | Muse integration and MCP pipeline — upstream for the creative-input surfaces the PNW browser reuses |
| [v1.49.15](../v1.49.15/) | Three-release README catch-up precedent — justification for this release's post-hoc uplift |
| [v1.49.12](../v1.49.12/) | Heritage-skills-pack pattern — pack-shape content that BCM and SHE mirror at larger scale |
| [v1.49.10](../v1.49.10/) | Flat-atoms architecture — the scaling pattern the static research browser inherits |
| [v1.49.9](../v1.49.9/) | "Teaching reference IS the research" pattern — directly underpins BCM's reference-grade density |
| [v1.49.8](../v1.49.8/) | Earlier instance of absorbing source documents directly into pack content — template BCM's source-index pattern follows |
| [v1.49.7](../v1.49.7/) | Optional-dependency contract — discipline the PNW browser's zero-runtime-dep posture follows |
| [v1.49.0](../v1.49.0/) | Parent mega-release where the v1.49.x line first shipped |
| [v1.49](../v1.49/) | Consolidated mega-release notes for the v1.49 line |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — pack-shape template BCM and SHE extend |
| [v1.25](../v1.25/) | Ecosystem Integration — dependency DAG pattern the cross-reference matrix mirrors |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop the PNW series extends at the Research step |
| `www/PNW/BCM/research/09-verification-report.md` | 48/48 BCM verification tests with explicit safety-callout coverage |
| `www/PNW/SHE/research/09-verification-report.md` | 33/33 SHE verification tests with explicit safety-callout coverage |
| `www/PNW/index.html` | PNW master index — cross-reference matrix expanded from 4 to 6 projects; 5 new topic rows and 12 new cells |
| `docs/release-notes/v1.49.24/chapter/03-retrospective.md` | Short-form retrospective entries captured at landing time |
| `docs/release-notes/v1.49.24/chapter/04-lessons.md` | Six lessons extracted at landing (classification: rule-based / LLM-tiebreaker mixed) |

## Engine Position

v1.49.24 is the second content-only release in the PNW Research Series and the largest content landing to date — 34 new content files, 19,751 insertions, zero `src/` or `desktop/` engine changes. Its position in the v1.49.x line puts it between the Unison language / math co-processor completion work in v1.49.23 and the subsequent v1.49.25 release, and the content nature of the landing means that downstream releases that touch the engine do so against an unchanged research-browser surface. The release proves the research-browser architecture holds under 2x content expansion (4 projects to 6) without engine modification, establishing content-first expansion as a repeatable pipeline rather than a one-off experiment. Looking forward, the series has obvious additional slots — water systems, transportation, food systems, marine / Puget Sound — and the demonstrated zero-engine-change landing pattern means future additions can proceed at content pace without engineering overhead. The release also closes a release-notes proportionality gap: the original 58-line README was undersized for a 19,751-line feature landing, and this uplift pass brings v1.49.24's documentation coverage up to the v1.49.21 image-to-mission sibling standard.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.23..v1.49.24) | 3 (content feat + release-notes docs + dev→main merge) |
| Files changed | 35 (34 content + 1 master-index modification) |
| Lines inserted / deleted | 19,809 / 11 |
| New content files (BCM) | 12 research files + 3 mission-pack files = 15 |
| New content files (SHE) | 12 research files + 3 mission-pack files = 15 |
| BCM total lines | 11,583 (research); 1,031 (mission-pack LaTeX); 228 (mission-pack HTML); 425 (project index) |
| SHE total lines | 4,721 (research); 1,129 (mission-pack LaTeX); 130 (mission-pack HTML); 388 (project index) |
| BCM mission-pack PDF size | 187,842 bytes (≈ 187 KB) |
| SHE mission-pack PDF size | 198,552 bytes (≈ 198 KB) |
| Verification tests (BCM) | 48/48 passing |
| Verification tests (SHE) | 33/33 passing |
| BCM safety callouts | 119 |
| SHE safety callouts | 56 |
| Combined safety callouts | 175 |
| BCM trade disciplines covered | 6 (structural, electrical, plumbing/mechanical, envelope, codes, education) |
| BCM audience levels | 5 (contractor, apprentice, code official, homeowner, educator) |
| SHE project tiers | 6 (beginner through capstone) |
| SHE hands-on projects | 36 |
| SHE sensors cataloged | 22 |
| SHE actuators cataloged | 14 |
| SHE connectivity protocols | 10 (MQTT, Zigbee, Z-Wave, Thread, Matter, Wi-Fi, BLE, LoRa, I2C, SPI) |
| Cross-reference matrix rows added | 5 (Materials, Seismic, Building Codes, Electronics, IoT / Smart Home) |
| Cross-reference matrix cells added | 12 |
| PNW master index — projects | 4 → 6 |
| PNW master index — research files total | 66 |
| PNW master index — total size | 3.8 MB |
| PNW master index — sources cited | 124 |
| PNW master index — mission PDFs | 6 |
| Engine (src / desktop) changes | 0 |

## Files

- `docs/release-notes/v1.49.24/README.md` — this release-notes README (uplifted from 58-line original to A-grade coverage)
- `www/PNW/BCM/index.html` (425 lines) — BCM project landing page with tag colors indigo/steel
- `www/PNW/BCM/research/00-content-templates.md` (1,814 lines) + `00-parameter-schema.md` (716 lines) + `00-source-index.md` (606 lines) — reference-grade scaffolding
- `www/PNW/BCM/research/01-structural-systems.md` (1,461 lines) + `02-electrical-systems.md` (1,456 lines) + `03-plumbing-mechanical.md` (1,096 lines) + `04-building-envelope.md` (891 lines) + `05-codes-standards-blueprinting.md` (966 lines) + `06-educational-frameworks.md` (1,202 lines) — six discipline-specific research files
- `www/PNW/BCM/research/07-integration-report.md` (540 lines) + `08-safety-review.md` (407 lines) + `09-verification-report.md` (428 lines) — integration, safety, and verification pass for BCM
- `www/PNW/BCM/mission-pack/building-construction-mastery.tex` (1,031 lines) + `building-construction-mastery.pdf` (187 KB) + `index.html` (228 lines) — BCM mission pack
- `www/PNW/SHE/index.html` (388 lines) — SHE project landing page with tag colors teal/orange
- `www/PNW/SHE/research/00-component-catalog.md` (420 lines) + `00-project-templates.md` (428 lines) + `00-source-index.md` (105 lines) — catalog, template, and source index
- `www/PNW/SHE/research/01-electronics-foundations.md` (422 lines) + `02-sensors-actuators.md` (601 lines) + `03-connectivity-protocols.md` (491 lines) + `04-platforms-software.md` (498 lines) + `05-complete-projects.md` (744 lines) + `06-safety-standards.md` (314 lines) — six tier-structured research files
- `www/PNW/SHE/research/07-integration-report.md` (200 lines) + `08-safety-review.md` (240 lines) + `09-verification-report.md` (258 lines) — integration, safety, and verification pass for SHE
- `www/PNW/SHE/mission-pack/smart-home-diy-electronics-mission.tex` (1,129 lines) + `smart-home-diy-electronics-mission.pdf` (198 KB) + `index.html` (130 lines) — SHE mission pack
- `www/PNW/index.html` (+125 / −11 lines) — PNW master index with two new project cards, expanded cross-reference matrix, refreshed stats block, new footer
- `www/PNW/style.css` (+2 lines) — tag-color definitions for BCM (indigo/steel) and SHE (teal/orange)

Aggregate: 35 files changed, 19,809 insertions, 11 deletions, 3 commits spanning v1.49.23..v1.49.24.
