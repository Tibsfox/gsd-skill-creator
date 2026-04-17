# v1.49.26 — Bio-Physics Sensing Systems

**Released:** 2026-03-09
**Scope:** Bio-Physics Sensing Systems (BPS) research atlas — 17 physics phenomena mapped onto biological implementations, 6 PNW species documented with full signal processing chains, GPU/ML pipeline module for real-time bioacoustic detection, PNW master index refreshed from 8 to 9 projects
**Branch:** dev → main
**Tag:** v1.49.26 (2026-03-09, commit `7fed30864`)
**Commits:** v1.49.25..v1.49.26 (1 commit, head `7fed30864`)
**Files changed:** 29 (+18,371 / −0)
**Predecessor:** v1.49.25 — Wings of the Pacific Northwest & Fur, Fin & Fang (AVI + MAM compendiums)
**Successor:** v1.49.27
**Classification:** feature — ninth research project in the PNW series, first physics-first atlas bridging equations and ecology
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Verification:** 12/12 success criteria PASS · 4/4 safety-critical tests PASS · 80+ peer-reviewed and government agency sources cited across Tier 1 (NOAA NWFSC, USGS Geomagnetism), Tier 2 (Lohmann Lab UNC, Orca Behavior Institute, Center for Whale Research), Tier 3 (Encyclopedia of Puget Sound, navigation-only use), with PNW-specific sourcing via PTAGIS, Puget Sound Institute, NOAA NWFSC, and USGS · LaTeX mission pack compiled to 191 KB PDF · series.js navigation bar, index.html card layout, and cross-reference matrix refreshed without engineering changes

## Summary

**Physics-first organization produced a research atlas that equations can anchor.** Bio-Physics Sensing Systems (BPS) is the ninth project in the PNW Research Series and the first to be organized by the governing physics of sensing rather than by species or habitat. Seventeen phenomena — sonar and time-delta ranging, Doppler shift, refraction and the dolphin melon GRIN lens, phase and comb filtering with ITD/ILD localization, signal processing analogues from cochlea to Fourier analyzer, magnetic inclination and magnetoreception, the fox magnetic rangefinder, the cryptochrome quantum compass, ampullae-of-Lorenzini electroreception, radio telemetry and PTAGIS salmon tracking, and seven more — each open with the governing equation in SI units, then document the biological implementation that evolved to compute against it. The reader can verify every biological claim against the physics, and every physics derivation against the biology. The result is 22 research files, 16,655 lines, 1.2 MB of content, all landed in a single atomic commit (`7fed30864`).

**Acoustic and electromagnetic split the phenomenon inventory cleanly.** Five acoustic modules cover the pressure-wave half of biological sensing: the sonar equation with time-delta ranging (`01-sonar-echo-delay.md`, 756 lines), the Doppler effect with CF/FM echolocation in bats (`02-doppler-effect.md`, 666 lines), refraction/reflection/compression with the dolphin melon as a graded-index lens (`03-refraction-reflection-compression.md`, 673 lines), phase and comb-filter mathematics with interaural time and level difference localization (`04-phase-comb-filter.md`, 751 lines), and signal processing analogues mapping the cochlea onto a biological Fourier analyzer (`05-signal-processing-analogues.md`, 792 lines). Five electromagnetic modules cover the field half: magnetic fields and magnetoreception with magnetite biomineralization (`10-magnetic-fields-magnetoreception.md`, 852 lines), the fox magnetic rangefinder citing Cerveny et al. (2011) for 74% northeast-aligned pounce success (`11-fox-magnetic-rangefinder.md`, 945 lines), the cryptochrome quantum compass with a radical-pair spin Hamiltonian (`12-cryptochrome-quantum-compass.md`, 1128 lines), electroreception via the ampullae of Lorenzini with 5 nV/cm sensitivity in Pacific elasmobranchs (`13-electroreception-lorenzini.md`, 1240 lines), and radio telemetry and inductive coils with PTAGIS salmon tracking through Columbia River dams (`14-radio-telemetry-coils.md`, 1240 lines). The split is not decorative: acoustic and electromagnetic modules share only the `06-interrelationships-atlas.md` cross-reference map and the `07-gpu-ml-pipeline.md` compute integration, which keeps each physical domain self-contained while exposing the points where they meet.

**Six Pacific Northwest species carry the full signal processing chain end to end.** `pnw-01-southern-resident-orca.md` (650 lines) documents Salish Sea biosonar with click trains at 10–100 kHz, 500-foot Chinook detection range, and the melon GRIN lens that focuses the outgoing click; `pnw-02-pacific-salmon-magnetic.md` (705 lines) cites Putman et al. (2020) for the magnetic map navigation that guides 28 ESA-listed evolutionarily significant units, and documents PTAGIS PIT-tag integration; `pnw-03-bat-echolocation.md` (843 lines) covers Big Brown and Little Brown bats using 20–80 kHz FM sweeps for forest-clutter navigation in the PNW understory; `pnw-04-elasmobranchs-electroreception.md` (886 lines) covers spiny dogfish and big skate in Puget Sound using ampullae of Lorenzini for prey detection at nanovolt field strengths; `pnw-05-fox-magnetic-hunting.md` (880 lines) documents the red fox snow-pounce geometry that combines cryptochrome magnetic sensing with triangulation to produce the observed northeast bias; `pnw-06-migratory-birds-compass.md` (860 lines) covers Pacific Flyway navigation with the quantum compass and documents the light-pollution degradation path that threatens it. Each species file carries the same four-part structure — physics equation, biological implementation, PNW-specific evidence, conservation stakes — so a reader moving between files finds the same analytical grain each time.

**The GPU/ML pipeline is where physics becomes conservation technology.** Module `07-gpu-ml-pipeline.md` (960 lines) is the longest non-species file in the atlas and documents the full path from acoustic sensor to species classification: ORCA-SPOT's 11,509 labelled vocalizations feeding a convolutional classifier, OrcaHello's real-time detection network streaming from hydrophone arrays, short-time Fourier transform (STFT) spectrograms as the common feature representation, CNN architectures for vocalization classification, Kalman filtering for track estimation across multi-hydrophone geometries, and biologging sensor fusion for tagged-animal studies. The module is the connective tissue between the theoretical physics and the SHE project's sensor curriculum and ECO's species monitoring — a cross-project resonance that was not planned but emerged from the content, and one that increases BPS's standing as a hub in the series rather than a terminal leaf.

**The interrelationships atlas is the single file that makes the other 21 legible.** `06-interrelationships-atlas.md` (933 lines) carries the full cross-reference table connecting all 17 phenomena — which sensing modality feeds which biological strategy in which species — plus an ASCII signal-flow diagram that shows how the acoustic and electromagnetic streams converge through the GPU/ML pipeline into ecosystem-scale monitoring. Without the atlas the reader would have to reconstruct the topology from the individual files; with it, the whole collection can be entered from any single phenomenon and traced outward. The atlas is also where the ten mathematical derivations — sonar equation, Doppler shift, magnetic inclination, Faraday induction, Snell's law, impedance matching, spin Hamiltonian, LC resonance, STFT, Kalman filter — are cross-indexed back to the phenomenon files that use them, so a reader hunting for a specific derivation can land in the right module by following a single hop.

**Safety-critical checks were binary, auditable, and caught at landing.** Four safety tests closed the commit: SC-01 (no classified military sonar specifications referenced, verified against the bibliography and the Navy LFA Sonar exclusion policy applied in `02-doppler-effect.md`), SC-02 (no specific GPS coordinates or real-time orca locations disclosed, verified against the species files which reference Salish Sea and Columbia River regions but not tagged-animal telemetry), SC-03 (all quantitative claims attributed to named peer-reviewed or government sources, cross-verified against `08-bibliography.md`), and SC-04 (Indigenous knowledge handled with appropriate respect and attribution, with Lummi Nation references credited directly and traditional ecological knowledge framed as context rather than claim). The tests are simple enough to run by eye on a single pass of the atlas, which is the point: safety-critical content deserves checks that cannot slip past a hurried review. All four passed before the commit landed.

**The mission pack ships both source and compiled artifact.** `www/PNW/BPS/mission-pack/mission.tex` (750 lines) is the LaTeX source for the BPS mission pack, `mission.pdf` (191 KB) is the compiled artifact, and `mission-pack/index.html` (422 lines) is the browser-facing landing page. Landing source alongside the compiled PDF means a downstream consumer can regenerate the artifact against a fresh LaTeX engine or port the content into a different typesetting system without reverse-engineering the compiled output. The mission pack is BPS's entry point for readers who want a condensed tour rather than the full atlas, and the LaTeX source is the durable artifact — PDFs carry compilation-specific rendering quirks, source carries intent.

**PNW master index updates closed the documentation debt that AVI/MAM had accumulated.** The previous v1.49.25 release added AVI (birds) and MAM (mammals) to the project grid but left the cross-reference matrix, geographic coverage, and reading order tables pointing at the pre-AVI/MAM series layout. v1.49.26 caught up the index: AVI and MAM joined the cross-reference matrix as first-class entries, geographic coverage tables picked up both projects, reading order was recomputed across all nine projects, a new "Bio-Physics Sensing" thread was added connecting BPS to ECO (ecosystems), AVI (birds), MAM (mammals), and SHE (sensors), and the BPS card was inserted with a deep-indigo / electric-violet tag color chosen for the electromagnetic spectrum motif. The lesson is explicit in the retrospective — master index updates belong in the atomic commit that ships the project, not a follow-up pass — and was applied retroactively here so the debt does not compound into the v1.49.27 window.

**Single-session full-mission execution held for the third time in a row.** BPS landed in one session from research-plan to verification matrix to browser pages to mission pack to commit, without intermediate checkpoints, confirming the P-20 pattern first seen in BRC and then in AVI+MAM. The session produced 22 research files, 29 total files, 18,371 insertions, and zero deletions, all in a single atomic commit. The session-length practicality — that a full PNW project can fit in one context window when the type system, browser pattern, and source-tier discipline are already in place — is the operational finding of this release. It is also the finding the v1.49.27+ window will have to test against larger or more intricate subjects.

## Key Features

| Area | What Shipped |
|------|--------------|
| Data schema & source index | `www/PNW/BPS/research/00-data-schema.md` (56 lines) + `00-source-index.md` (47 lines) — schema for the atlas entries and the working source-tier index |
| Sonar & time-delta ranging | `01-sonar-echo-delay.md` (756 lines) — sonar equation in SI units, time-delta ranging math, biological implementations from orca biosonar to bat FM pulses |
| Doppler effect | `02-doppler-effect.md` (666 lines) — CF/FM echolocation, Doppler shift derivation, bat echo processing with compensation behavior |
| Refraction / reflection / compression | `03-refraction-reflection-compression.md` (673 lines) — Snell's law, impedance matching, dolphin melon as a graded-index acoustic lens |
| Phase & comb filter | `04-phase-comb-filter.md` (751 lines) — interaural time and level difference (ITD/ILD) localization with phase-based spatial math |
| Signal processing analogues | `05-signal-processing-analogues.md` (792 lines) — cochlea as a Fourier analyzer, cross-mapping biological auditory processing onto DSP primitives |
| Interrelationships atlas | `06-interrelationships-atlas.md` (933 lines) — cross-reference table for all 17 phenomena plus ASCII signal-flow diagram |
| GPU/ML pipeline | `07-gpu-ml-pipeline.md` (960 lines) — ORCA-SPOT (11,509 vocalizations), OrcaHello real-time detection, STFT, CNN classification, Kalman filtering, biologging fusion |
| Bibliography | `08-bibliography.md` (701 lines) — 80+ sources in Tier 1 (NOAA NWFSC, USGS, peer-reviewed journals), Tier 2 (Lohmann Lab UNC, Orca Behavior Institute, Center for Whale Research), Tier 3 (Encyclopedia of Puget Sound, navigation only) |
| Verification matrix | `09-verification-matrix.md` (91 lines) — 12/12 success criteria plus 4/4 safety-critical tests (SC-01..SC-04) with binary pass/fail entries |
| Magnetic fields & magnetoreception | `10-magnetic-fields-magnetoreception.md` (852 lines) — magnetic inclination, Faraday induction, magnetite biomineralization in migratory species |
| Fox magnetic rangefinder | `11-fox-magnetic-rangefinder.md` (945 lines) — Cerveny et al. 2011 (74% NE pounce success), snow-pounce geometry, cryptochrome fusion |
| Cryptochrome quantum compass | `12-cryptochrome-quantum-compass.md` (1128 lines) — radical-pair spin Hamiltonian, quantum coherence in avian retina, light-pollution impact |
| Electroreception & Ampullae of Lorenzini | `13-electroreception-lorenzini.md` (1240 lines) — 5 nV/cm sensitivity, Pacific elasmobranchs, prey-field reconstruction |
| Radio telemetry & PTAGIS | `14-radio-telemetry-coils.md` (1240 lines) — LC resonance, inductive coils, PTAGIS salmon tracking through Columbia River dams |
| Southern Resident orca | `pnw-01-southern-resident-orca.md` (650 lines) — Salish Sea biosonar, 10–100 kHz click trains, 500-ft Chinook detection range, melon GRIN lens |
| Pacific salmon | `pnw-02-pacific-salmon-magnetic.md` (705 lines) — Putman et al. 2020 magnetic map navigation, 28 ESA-listed ESUs, PTAGIS PIT-tag integration |
| PNW bats | `pnw-03-bat-echolocation.md` (843 lines) — Big Brown and Little Brown bats, 20–80 kHz FM sweeps, forest-clutter navigation |
| Pacific elasmobranchs | `pnw-04-elasmobranchs-electroreception.md` (886 lines) — spiny dogfish, big skate, Puget Sound prey detection at nanovolt field strengths |
| Red fox | `pnw-05-fox-magnetic-hunting.md` (880 lines) — cryptochrome + triangulation snow-pounce, Cerveny NE bias evidence |
| Migratory birds | `pnw-06-migratory-birds-compass.md` (860 lines) — Pacific Flyway quantum compass, light-pollution degradation path |
| Browser pages | `www/PNW/BPS/index.html` (165 lines) + `page.html` (143 lines) + `mission.html` (34 lines) + `style.css` (202 lines) — static HTML + client-side markdown pattern shared with COL through MAM |
| Mission pack | `www/PNW/BPS/mission-pack/mission.tex` (750 lines) + `mission.pdf` (191 KB) + `index.html` (422 lines) — LaTeX source plus compiled PDF plus browser-facing landing page |

## Retrospective

### What Worked

- **Single-session execution at full autonomy.** The entire BPS mission — 22 research files, verification matrix, browser pages, and mission pack — completed in one session without checkpoints. This confirms the P-20 pattern (single-session full-mission execution) first demonstrated in BRC.
- **Physics-first organization creates natural modularity.** Structuring by physics phenomenon (sonar, Doppler, magnetoreception) rather than by species produced orthogonal modules. Each module is self-contained with its own equations and biological examples, making cross-referencing straightforward.
- **Signal processing as connective tissue.** The GPU/ML pipeline module bridges theoretical physics and practical conservation technology, connecting to the SHE project's sensor curriculum and ECO's species monitoring. This cross-project resonance emerged from the content, not from planning.
- **Research browser architecture scales to 9 projects.** Zero engineering changes needed. Same static HTML + client-side markdown pattern as COL through MAM. The series.js navigation and index.html card layout accommodate new projects without modification.
- **Source tiering held under pressure.** The three-tier Gold/Silver/Bronze source framework carried the 80+ citations without ambiguity — every quantitative claim in the atlas resolves to a named source at a declared reliability tier, and the tier assignment was made per-source at citation time rather than reconciled after the fact.
- **Safety-critical checks ran at landing, not after.** SC-01 through SC-04 passed before the commit was authored, so the atomic commit that shipped the atlas is also the commit that shipped the safety verification.

### What Could Be Better

- **Cross-reference matrix growing wide.** At 9 columns (COL through BPS), the HTML table requires horizontal scrolling on narrow screens. A grouped or filterable view may be needed at 10+ projects.
- **Thread section needed catch-up work.** AVI and MAM were shipped without updating the cross-reference matrix, geographic coverage, or reading order tables in the PNW index. This session caught up the gap, but future missions should include master index updates as part of the atomic commit.
- **No LLM-tiebreaker review on the lessons yet.** Five of the seven lessons landed with `⚙ rule-based` classification; two were subsequently reclassified by the LLM tiebreaker (`applied` in v1.49.35, v1.49.37, v1.49.57) and flagged for human review. A landing-time tiebreaker pass would have reduced follow-up churn.
- **Mission pack PDF is not source-controlled as diffable content.** `mission.pdf` shipped as a 191 KB binary; any regeneration against a future LaTeX engine produces a new binary without semantic-diff visibility. Pairing the PDF with a deterministic build recipe (engine version, font paths, compile flags) would make regeneration verifiable.

## Lessons Learned

- **Physics equations ground biological claims.** Starting each module with the governing equation (sonar equation, Doppler formula, Snell's law) ensures that biological implementations are documented as applications of physics, not just natural history descriptions. The reader can verify every claim against the mathematics. (Lesson #388, applied in v1.49.57 "Ground Truth".)
- **Source tiering reduces citation anxiety.** The three-tier system (Gold/Silver/Bronze) with PNW-specific government sources makes it explicit which claims rest on the strongest evidence. Future missions should adopt this pattern for any research with mixed source quality. (Lesson #389, applied in v1.49.35 "Data Source Registry".)
- **Safety-critical tests for sensitive content work well.** The four safety tests (no classified specs, no real-time locations, all claims attributed, respectful Indigenous knowledge handling) are simple, binary, and auditable. They catch the highest-risk content without slowing down the main verification matrix. (Lesson #390.)
- **The PNW series has reached sensory completeness.** With ECO (full taxonomy), AVI (birds), MAM (mammals), and now BPS (how they all sense their world), the living systems of the Pacific Northwest are documented from species identity through sensory physics. The remaining frontier is behavioral ecology — how these sensing capabilities shape behavior, migration, and social structure. (Lesson #391.)
- **Master index should be updated atomically with each new project.** The AVI/MAM release updated the project grid but left the cross-reference matrix, geographic coverage, and reading order tables stale. This creates a documentation debt that compounds. Future releases should treat the master index as a first-class deliverable. (Lesson #392, applied in v1.49.37 "16-Project Hub".)
- **Cross-reference matrix growing wide.** At 9 columns (COL through BPS), the HTML table requires horizontal scrolling on narrow screens. A grouped or filterable view may be needed at 10+ projects. (Lesson #393.)
- **Thread section needed catch-up work.** AVI and MAM were shipped without updating the cross-reference matrix, geographic coverage, or reading order tables in the PNW index. Future missions should include master index updates as part of the atomic commit. (Lesson #394.)
- **Signal processing is the connective tissue between sensing and conservation.** The GPU/ML pipeline module was not originally planned as a separate atlas chapter — it emerged during writing as the node that every species file pointed at when describing how humans actually measure bioacoustic signals. Promoting it to a first-class chapter (`07-gpu-ml-pipeline.md`, 960 lines) let the species files delegate their "how do we measure this?" paragraphs into a shared module instead of duplicating the same STFT-CNN-Kalman pipeline description six times.
- **Interrelationships atlas is the file that makes the collection legible.** A 22-file research atlas without an interrelationships chapter reads as 22 independent essays. `06-interrelationships-atlas.md` is what turns it into a collection — the cross-reference table is the shortest path between any two phenomena, and the ASCII signal-flow diagram is the single image a reader can carry back to the individual files. A collection of research documents without this connective chapter is one read-through away from feeling disconnected; with it, the atlas is navigable from any entry point.
- **Binary PDFs deserve a deterministic build recipe.** `mission.pdf` shipped as a 191 KB artifact alongside its `mission.tex` source. The source is diffable, the PDF is not; pairing the source with a pinned LaTeX engine version and font path manifest would make regeneration verifiable across environments instead of "compiled on my machine."

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.25](../v1.49.25/chapter/00-summary.md) | Predecessor — AVI (birds) + MAM (mammals) compendiums; v1.49.26 closes the cross-reference matrix and thread catch-up work those releases deferred |
| [v1.49.27](../v1.49.27/chapter/00-summary.md) | Successor — first post-BPS release in the v1.49.x line |
| [v1.49.21](../v1.49.21/README.md) | Sibling uplift exemplar — same v1.49.x feature-release shape; ITM pipeline's types-first discipline parallels BPS's physics-first discipline |
| [v1.49.35](../v1.49.35/) | Lesson #389 application — "Data Source Registry" operationalized the Gold/Silver/Bronze tiering pattern introduced in BPS |
| [v1.49.37](../v1.49.37/) | Lesson #392 application — "16-Project Hub" refreshed the master index as a first-class deliverable per the BPS catch-up retrospective |
| [v1.49.57](../v1.49.57/) | Lesson #388 application — "Ground Truth" release reflected the physics-first grounding pattern BPS prescribed |
| [v1.49.17](../v1.49.17/) | Types-first discipline antecedent — same landing pattern (contracts before content) applied to cartridge format instead of physics modules |
| [v1.49.12](../v1.49.12/) | Heritage-skills-pack pattern — pack-shape content analogous to the BPS mission pack's LaTeX + PDF + browser-index triad |
| [v1.49.10](../v1.49.10/) | Flat-atoms architecture — upstream pattern for the one-module-per-phenomenon BPS layout |
| [v1.49.0](../v1.49.0/) | Parent mega-release — v1.49.x line and GSD-OS desktop surface where BPS lives |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — pack template the BPS mission pack inherits |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; BPS extends the Perceive step with biological sensing physics |
| `www/PNW/BPS/research/06-interrelationships-atlas.md` | Cross-reference table and ASCII signal-flow diagram connecting all 17 phenomena |
| `www/PNW/BPS/research/07-gpu-ml-pipeline.md` | GPU/ML pipeline documenting ORCA-SPOT and OrcaHello real-time bioacoustic detection |
| `www/PNW/BPS/research/08-bibliography.md` | 80+ citations organized by Gold/Silver/Bronze source tiers |
| `www/PNW/BPS/research/09-verification-matrix.md` | 12/12 success criteria + 4/4 safety-critical tests (SC-01..SC-04) |
| `www/PNW/BPS/mission-pack/mission.tex` | 750-line LaTeX source for the BPS mission pack |
| `www/PNW/BPS/mission-pack/mission.pdf` | 191 KB compiled mission pack |
| Cerveny, J. et al. (2011) | 74% northeast-aligned fox pounce success — empirical basis for the magnetic rangefinder module |
| Putman, N. et al. (2020) | Magnetic map navigation in Pacific salmon — empirical basis for `pnw-02-pacific-salmon-magnetic.md` |

## Engine Position

v1.49.26 is the ninth project in the PNW Research Series and the first physics-first atlas in that series. It sits between v1.49.25 (AVI + MAM species compendiums) and the v1.49.27+ window, and it closes the sensory completeness arc — ECO (full taxonomy) → AVI (birds) → MAM (mammals) → BPS (how they all sense their world). In the broader v1.49.x line it is a mid-size feature release: 29 files and 18,371 insertions place it larger than v1.49.21's 33 files / 5,122 insertions by volume but tighter in scope, because every line lands under `www/PNW/BPS/`. The architectural footprint is disproportionately large relative to the commit count — a single atomic commit ships a complete research collection, verification matrix, browser pattern participation, mission pack, and a master-index refresh pass that catches up accumulated debt from the previous release. Looking forward, BPS becomes the reference implementation for physics-first research atlases in the series: any future atlas that organizes by governing equation rather than by subject taxonomy will inherit the module shape (equation-first, biology-second, PNW-specific-third), the Gold/Silver/Bronze source tiering, and the SC-01..SC-04 safety checklist that BPS put into practice.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.25..v1.49.26) | 1 |
| Files changed | 29 |
| Lines inserted / deleted | 18,371 / 0 |
| Research files | 22 |
| Research prose lines | 16,655 |
| Physics phenomena documented | 17 |
| Acoustic modules | 5 (sonar, Doppler, refraction, phase/comb, signal-processing) |
| Electromagnetic modules | 5 (magnetic/magnetoreception, fox rangefinder, cryptochrome, electroreception, radio telemetry) |
| PNW species with full signal chain | 6 (Southern Resident orca, Pacific salmon, PNW bats, Pacific elasmobranchs, red fox, migratory birds) |
| Mathematical derivations | 10 (sonar, Doppler, magnetic inclination, Faraday, Snell, impedance, spin Hamiltonian, LC resonance, STFT, Kalman) |
| Sources cited | 80+ across Gold / Silver / Bronze tiers |
| Verification criteria | 12/12 PASS |
| Safety-critical tests | 4/4 PASS (SC-01 classified specs, SC-02 GPS/real-time, SC-03 attribution, SC-04 Indigenous knowledge) |
| Mission pack | 1 (LaTeX 750 lines + PDF 191 KB + browser index 422 lines) |
| PNW series projects (before → after) | 8 → 9 |
| PNW series total research files (before → after) | ~99 → 121 |
| PNW series total content (before → after) | ~7.0 MB → 8.2 MB |

## Files

- `www/PNW/BPS/research/` — 22 research files totalling 16,655 lines: `00-data-schema.md` (56), `00-source-index.md` (47), `01-sonar-echo-delay.md` (756), `02-doppler-effect.md` (666), `03-refraction-reflection-compression.md` (673), `04-phase-comb-filter.md` (751), `05-signal-processing-analogues.md` (792), `06-interrelationships-atlas.md` (933), `07-gpu-ml-pipeline.md` (960), `08-bibliography.md` (701), `09-verification-matrix.md` (91), `10-magnetic-fields-magnetoreception.md` (852), `11-fox-magnetic-rangefinder.md` (945), `12-cryptochrome-quantum-compass.md` (1128), `13-electroreception-lorenzini.md` (1240), `14-radio-telemetry-coils.md` (1240), `pnw-01-southern-resident-orca.md` (650), `pnw-02-pacific-salmon-magnetic.md` (705), `pnw-03-bat-echolocation.md` (843), `pnw-04-elasmobranchs-electroreception.md` (886), `pnw-05-fox-magnetic-hunting.md` (880), `pnw-06-migratory-birds-compass.md` (860)
- `www/PNW/BPS/index.html` (165 lines) + `page.html` (143 lines) + `mission.html` (34 lines) + `style.css` (202 lines) — static HTML + client-side markdown pattern shared with COL through MAM
- `www/PNW/BPS/mission-pack/mission.tex` (750 lines) — LaTeX source for the mission pack
- `www/PNW/BPS/mission-pack/mission.pdf` (191 KB) — compiled mission pack binary
- `www/PNW/BPS/mission-pack/index.html` (422 lines) — browser-facing mission pack landing page
- `docs/release-notes/v1.49.26/chapter/00-summary.md` — auto-generated parse of this README (Prev/Next navigation to v1.49.25 / v1.49.27)
- `docs/release-notes/v1.49.26/chapter/03-retrospective.md` — retrospective chapter with What Worked / What Could Be Better
- `docs/release-notes/v1.49.26/chapter/04-lessons.md` — 7 lessons extracted with tracker status (applied / investigate / needs review)
- `docs/release-notes/v1.49.26/chapter/99-context.md` — release context chapter

Aggregate: 29 files changed, 18,371 insertions, 0 deletions, 1 commit (`7fed30864`), v1.49.25..v1.49.26 window.
