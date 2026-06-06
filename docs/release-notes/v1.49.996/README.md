# v1.49.996 — DE-1 Dynamics Explorer 1 Global Auroral Imaging and Magnetosphere-Ionosphere Coupling Mission

**Shipped:** 2026-06-06
**Branch:** dev → main
**Type:** NASA degree-advancing milestone (1.186 → 1.187)
**NASA Mission:** DE-1 (Dynamics Explorer 1 global auroral imaging and magnetosphere-ionosphere coupling mission)
**Engine state:** ADVANCED — NASA degree 1.186 → 1.187
**Counter-cadence:** false
**Phases:** 6 (W0-W5 wave-pipeline)

This is a 5-track NASA-substrate-convergence milestone: the NASA degree advances while the MUS, ELC, SPS, and TRS tracks hold their scaffold-pending state at v996.

## Summary

v1.49.996 advances the NASA degree catalog from 1.186 to 1.187, adding DE-1 — Dynamics Explorer 1 — as the obs#2 INTRA-AXIS continuation of the reopened near-Earth magnetosphere substrate-axis. The magnetosphere axis reopened at v995 FAST (obs#1, the in-situ high-cadence auroral-acceleration-region snapshot science), and at v996 DE-1 continues the axis at obs#2 with the first global imaging of the complete auroral oval from a high-altitude polar orbit. Where FAST sampled the auroral acceleration region in situ at high cadence from within the region, DE-1 imaged the whole auroral oval from above at a high altitude, a substrate-form-distinct and chronologically-earlier whole-system view that complements the FAST in-situ snapshot science. DE-1's 1981 anchor predates the substrate-era global-imaging missions by nearly two decades, and it supplies the first whole-system view of the aurora that the substrate-era IMAGE mission later carried to the full magnetosphere.

DE-1 was the high-altitude member of the NASA Dynamics Explorer program, a paired-spacecraft mission designed to study the coupling between the magnetosphere and the ionosphere by sampling the near-Earth space environment at two heights at once. NASA Goddard Space Flight Center managed the Dynamics Explorer program, and the science question was the coupling between the two regions: how energy and particles flow between the high-altitude magnetosphere and the low-altitude ionosphere along the magnetic field lines that connect them. To answer that question, the program built two spacecraft rather than one, DE-1 for the high-altitude side and DE-2 for the low-altitude side, so the two regions could be sampled together along the same field lines rather than one region at a time. The two spacecraft launched 1981-08-03 at 01:17 UTC on a single Delta 3914 vehicle from Vandenberg, deployed together to establish the two-height architecture from the first day of the mission.

The signature of the mission is its global auroral imaging. The Spin-Scan Auroral Imager aboard DE-1 used the spacecraft spin to sweep its imaging field of view across the auroral region line by line, building up a global image of the complete auroral oval as the spacecraft viewed the poles from a high altitude. The result was the first images of the complete auroral oval from space, showing the global form of the aurora as a single connected ring for the first time. The whole-oval view was a new way of seeing the aurora: where earlier observations had recorded the local aurora overhead from the ground or the patch a single spacecraft flew through, DE-1 recorded the entire oval at once, the global ring of light that circles the high-latitude region, and it could watch the whole oval brighten, expand, and contract as the magnetosphere responded to the solar wind. The global auroral images transformed auroral studies from local snapshots to a global perspective, the whole-system view of the aurora that single-point observations could not reach.

The high-altitude vantage is what made the global imaging possible. DE-1 flew a high-altitude polar elliptical orbit chosen so the spacecraft would carry the Spin-Scan Auroral Imager over the poles to a great height from which it could view the entire auroral region from above. The auroral oval is the ring of aurora that circles the high-latitude region, and to image the whole oval at once a spacecraft must be high enough to look down on the entire ring from above rather than fly through a local patch of it. DE-1's high apogee carried the spacecraft far enough out that the imager could see the complete oval as a single connected form, and the polar inclination carried it over the high latitudes where the oval lies. The high-altitude orbit is a substrate-form distinction from the FAST entry at obs#1: where FAST flew a high-inclination orbit that threaded the auroral acceleration region in situ, DE-1 flew a high-altitude orbit that viewed the entire auroral region from above, the two complementary vantages on the same reopened axis.

While DE-1 imaged the oval from above, the paired DE-1 and DE-2 spacecraft sampled the magnetosphere and the ionosphere at their two heights along the same field lines. DE-1, at high altitude, sampled the magnetosphere side: the hot plasma distributions through the High Altitude Plasma Instrument, the thermal ions rising from below through the Retarding Ion Mass Spectrometer, the electric and magnetic wave fields through the Plasma Wave Instrument, and the magnetic field through the Magnetometer. DE-2, at low altitude, sampled the ionosphere side. Because the two spacecraft sampled the same field lines at the two altitudes, the program could relate what happened high in the magnetosphere to what happened low in the ionosphere, quantifying how the energy and the particles flow between the two regions and establishing a coupled-system view of the near-Earth space environment that single-spacecraft missions could not reach.

The science return reshaped the way the aurora and the magnetosphere-ionosphere system were studied. The global auroral images transformed auroral studies from local snapshots to a global perspective: for the first time the complete oval could be seen whole, its global form and its response to the solar wind tracked as a single connected ring rather than reconstructed from scattered local observations. The paired two-height measurements established the coupling between the magnetosphere and the ionosphere as a system to be sampled directly, with the high-altitude and low-altitude spacecraft providing the two ends of the field-line connection. The aurora is the meeting point of the two regions, where the energy comes down from the magnetosphere along the field lines and the particles deposit it in the ionosphere where the aurora glows, and the paired sampling let the program study that coupling directly rather than studying each region alone.

The axis-relevant substrate of DE-1 at this degree is its continuation of the reopened near-Earth magnetosphere axis at obs#2 with a chronologically-earlier global-imaging anchor. DE-1 sustains the MAGNETOSPHERE-AXIS-INTRA-CONTINUATION thread at obs#2 cumulative (v995 FAST + v996 DE-1), and it anchors the GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE thread at obs#2 cumulative with the substrate-era IMAGE mission: the global imaging-from-space substrate now spans the chronologically-earlier DE-1 auroral-oval imaging and the substrate-era global magnetosphere imaging, the lineage that IMAGE later carried from the auroral oval to the full magnetosphere. As the obs#2 entry on the reopened axis, DE-1 complements the FAST in-situ snapshot science with a global-imaging vantage and a coupled-system sampling, and it sets the global-imaging and coupling anchor from which the reopened magnetosphere axis will grow. The forward continuation favors further inner-magnetosphere, ring-current, and ionosphere-coupling missions that build on the in-situ and global-imaging foundations now established.

The milestone produced the full canonical 14-deliverable set at `www/tibsfox/com/Research/NASA/1.187/` plus a WebGL2 global-auroral-oval viewer shader with four cycling modes (whole auroral oval from above, polar cap, conjugate imaging, and magnetosphere-ionosphere coupling), rendering the complete auroral oval as a connected ring seen from above, the dark polar cap within it, the two hemispheres seen together along the same field lines, and the energy and particle flow between the magnetosphere and the ionosphere. The build resolved the predecessor v1.186 forward-link to record the actual DE-1 selection, updated both nav-card "next" cells on the v1.186 FAST index to point to DE-1, appended the 188th canonical-pairings entry (Mountain Hemlock + Golden Eagle + Operator-selectable S36) to both the TSV and JSON files, and codified retrospective lessons across all required surfaces.

The organism pairing for DE-1 is the Golden Eagle (Aquila chrysaetos) and the Mountain Hemlock (Tsuga mertensiana). The Golden Eagle is a large high-soaring Pacific Northwest raptor that surveys the entire landscape from a high vantage, so it enters as the whole-overview mirror to DE-1's first whole-oval view of the aurora from a high-altitude polar orbit: as the Golden Eagle takes in the full sweep of the landscape from a high vantage, DE-1 took in the full sweep of the auroral oval from a high orbit. The Mountain Hemlock is a high-elevation Pacific Northwest conifer of the alpine overview zone, rooted near treeline where the whole valley below comes into view, mirroring DE-1's high-altitude global perspective: as the Mountain Hemlock holds its place where the whole valley is visible, DE-1 held its high orbit where the whole auroral oval was visible. Both organisms share four alignments with DE-1: a wide whole seen from a high vantage, rising to a high vantage to gain the wide view, joining a high view to a low one, and an early-established and enduring form of the high vantage. The pairing brings a high-soaring overview raptor and a high-elevation overview-zone conifer to the catalog.

Several substrate-form distinctions separate DE-1 from the FAST obs#1 entry on the same reopened axis. First, its mission role: the first global imaging of the complete auroral oval rather than the in-situ high-cadence acceleration-region science. Second, its vantage: a high-altitude polar orbit viewing the region from above rather than a high-inclination orbit threading it in situ. Third, its architecture: a paired DE-1 / DE-2 two-spacecraft architecture rather than a single Small Explorer spacecraft. Fourth, its science focus: the magnetosphere-ionosphere coupling and the global imaging rather than the auroral-acceleration-region electrodynamics. Fifth, its era: 1981, chronologically earlier than the 1996 FAST entry. DE-1 also brings the dual-spacecraft architecture, the magnetosphere-ionosphere coupling, and the chronologically-earlier global-imaging anchor, all new first-instance distinctions, and it sustains the reopened magnetosphere axis at obs#2. The engine state otherwise advances: the counter-cadence count is unchanged at 5, and MUS, ELC, SPS, and TRS all remain SCAFFOLD-PENDING at obs#70 cumulative.

## Mission Overview

DE-1 is the NASA global auroral imaging and magnetosphere-ionosphere coupling mission, the high-altitude member of the paired NASA Dynamics Explorer program managed by NASA Goddard Space Flight Center, the first global-imaging mission of the complete auroral oval that sustains the reopened near-Earth magnetosphere substrate-axis at obs#2.

| Fact | Value |
|---|---|
| Launch | 1981-08-03 at 01:17 UTC on a Delta 3914 vehicle from Vandenberg, deployed with DE-2 on a single launch |
| Management | NASA Goddard Space Flight Center, within the NASA Dynamics Explorer program |
| Program | NASA Dynamics Explorer (paired DE-1 high-altitude and DE-2 low-altitude) |
| Mission target | The complete auroral oval and the magnetosphere-ionosphere system of the near-Earth space environment |
| Orbit | High-altitude polar elliptical orbit viewing the entire auroral region from above |
| Configuration | Spin-stabilized spacecraft with the Spin-Scan Auroral Imager and a plasma, particle, wave, and field suite |
| Measurement style | Global imaging of the complete auroral oval plus paired two-height sampling |
| Science return | The first global images of the complete auroral oval and the quantification of the magnetosphere-ionosphere coupling |
| Substrate-axis | MAGNETOSPHERE axis obs#2 INTRA-AXIS continuation (the reopened axis sustains at obs#2) |
| Distinction | The first global imaging of the complete auroral oval from a high-altitude vantage; the chronologically-earlier global-imaging anchor |

## Key Features

| Feature | Description |
|---|---|
| First global auroral-oval imaging from space | The Spin-Scan Auroral Imager produced the first images of the complete auroral oval as a single connected ring |
| Global auroral-oval imaging | The whole-oval view from a high-altitude vantage that transformed auroral studies to a global perspective |
| Magnetosphere-ionosphere coupling | Paired two-height sampling of the magnetosphere and the ionosphere along the same field lines |
| Paired DE-1 / DE-2 two-spacecraft architecture | Two spacecraft deployed together to sample two regions at two heights simultaneously |
| Chronologically-earlier global-imaging anchor | The 1981 global auroral images that predate the substrate-era global-imaging missions |
| Magnetosphere-axis continuation | MAGNETOSPHERE-AXIS-INTRA-CONTINUATION obs#2 sustains the reopened axis with DE-1 as obs#2 |
| Global-magnetosphere-imaging lineage | GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE obs#2 with DE-1 + the substrate-era IMAGE |
| High-altitude polar elliptical orbit | Carried DE-1 over the poles to view the entire auroral region from above |
| Global-auroral-oval WebGL2 shader | Four cycling modes (whole oval from above, polar cap, conjugate imaging, magnetosphere-ionosphere coupling) |

## Structural firsts

**DE-1-FIRST-INSTANCE:** DE-1 (Dynamics Explorer 1) enters the catalog as the NASA global auroral imaging and magnetosphere-ionosphere coupling mission.

**FIRST-GLOBAL-AURORAL-IMAGING-FROM-SPACE-FIRST-INSTANCE:** The first images of the complete auroral oval from space, produced by the Spin-Scan Auroral Imager.

**GLOBAL-AURORAL-OVAL-IMAGING-FIRST-INSTANCE:** The global imaging of the complete auroral oval as a single connected ring.

**MAGNETOSPHERE-IONOSPHERE-COUPLING-FIRST-INSTANCE:** The paired two-height sampling of the magnetosphere and the ionosphere along the same field lines.

**DUAL-SPACECRAFT-DE-1-DE-2-ARCHITECTURE-FIRST-INSTANCE:** The paired DE-1 / DE-2 two-spacecraft architecture deployed together on a single launch.

**CHRONOLOGICALLY-EARLIER-GLOBAL-IMAGING-ANCHOR-FIRST-INSTANCE:** The 1981 global auroral images that predate the substrate-era global-imaging missions.

## Substrate Primary Axes

### NEW LOCKED at v996 (6 anchors)

- **DE-1-FIRST-INSTANCE** obs#1 NEW LOCKED — DE-1 (Dynamics Explorer 1) global auroral imaging and magnetosphere-ionosphere coupling mission first INSTANCE in the catalog
- **FIRST-GLOBAL-AURORAL-IMAGING-FROM-SPACE-FIRST-INSTANCE** obs#1 NEW LOCKED — the first images of the complete auroral oval from space
- **GLOBAL-AURORAL-OVAL-IMAGING-FIRST-INSTANCE** obs#1 NEW LOCKED — the global imaging of the complete auroral oval as a single connected ring
- **MAGNETOSPHERE-IONOSPHERE-COUPLING-FIRST-INSTANCE** obs#1 NEW LOCKED — the paired two-height sampling of the magnetosphere and the ionosphere
- **DUAL-SPACECRAFT-DE-1-DE-2-ARCHITECTURE-FIRST-INSTANCE** obs#1 NEW LOCKED — the paired DE-1 / DE-2 two-spacecraft architecture
- **CHRONOLOGICALLY-EARLIER-GLOBAL-IMAGING-ANCHOR-FIRST-INSTANCE** obs#1 NEW LOCKED — the 1981 global auroral images that predate the substrate-era global-imaging missions

### CUMULATIVE at v996 (2 threads)

- **MAGNETOSPHERE-AXIS-INTRA-CONTINUATION** obs#2 cumulative — v995 FAST (in-situ auroral acceleration region) + v996 DE-1 (global auroral imaging); the reopened magnetosphere axis now spans two observations, sustaining at obs#2 cumulative
- **GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE** obs#2 cumulative — v996 DE-1 (the chronologically-earlier global auroral-oval imaging) + the substrate-era IMAGE (the later global magnetosphere imaging); the global imaging-from-space substrate now spans two entries, sustaining at obs#2 cumulative within the magnetosphere axis

### ESTABLISHED disciplines applied (cumulative)

- SUBSTRATE-AXIS-ROTATION-DISCIPLINE obs#59 cumulative (axis sustains; the reopened MAGNETOSPHERE axis continues at obs#2)
- POSITIVE-FRAMING-DISCIPLINE obs#73 cumulative
- DISPATCH-PROMPT-DENSITY-DISCIPLINE obs#22 cumulative
- IDENTIFIER-NOT-PROSE-DISCIPLINE obs#29 cumulative
- NAV-CARD-PAIR-DELIVERABLE-DISCIPLINE obs#18 cumulative
- PATH-A-FRESH-BUILD-PRECEDENT obs#19 cumulative
- W3.5-CHAPTER-GEN-BAKE-IN obs#26 cumulative
- README-RETROSPECTIVE-SECTIONS-REQUIREMENT obs#25 cumulative
- STORY-MD-NEWLINE-SEPARATOR-DISCIPLINE obs#33 cumulative
- DEDICATION-WORD-COUNT-DISCIPLINE obs#11 cumulative (≤200 words)

## Part A — Mission Deliverables (depth)

- **Canonical 14-deliverable set at `www/tibsfox/com/Research/NASA/1.187/`.** The full canonical mission directory: degree-sync.json, knowledge-nodes.json, data-sources.json, from-1.186.md, to-1.188.md, index.html, organism.md, organism.html, research.md, research.html, papers.html, mathematics.html, simulation.html, and curriculum.html, plus the artifacts/shaders subdirectory.
- **index.html with the canonical 12-card layout plus enrichment.** The index carries the v1.0 canonical card floor (Mission Summary, Mission Tracks, Resonance Axes, What to Build, TRY Sessions, DIY Projects, Creative Artifacts, Runnable Simulations, Interactive Lab, Forest Contribution, Data Files, Dedication), plus a Mission Journey narrative card, a Structural Firsts card, and a Governance & Chain Declarations card, plus six numbered resonance axes each with a mission paragraph and an organism pairing, plus a sidebar with the Dynamics Explorer / magnetosphere-imaging program-lineage table and a haiku card. The page passes both the canonical-layout gate (0 card deviations across all 188 missions) and the trip-vocab page check (PASS, zero primary and zero secondary classes in the title line and body), with an early-1980s auroral-imaging magenta/violet palette distinct from the FAST aurora-green palette.
- **Six resonance axes.** The first global imaging of the complete auroral oval from above; the reopened magnetosphere axis continuing at obs#2; the paired two-spacecraft magnetosphere-ionosphere coupling; the chronologically-earlier global-imaging anchor; the global-magnetosphere-imaging lineage cumulative thread at obs#2; and the high-altitude polar elliptical orbit viewing the region from above.
- **Mission Journey narrative card.** A multi-paragraph narrative (over 500 words) on the paired Delta 3914 launch, the high-altitude polar orbit, the spin-scan global imaging of the complete auroral oval, the paired two-height magnetosphere-ionosphere coupling, and the imaging lineage, framing DE-1 as the global-imaging anchor that sustains the magnetosphere axis at obs#2.
- **organism.html at ≥3500 words.** The Golden Eagle + Mountain Hemlock pairing with the high-vantage and whole-overview mirrors drawn from observable behavior and traits, with four explicit alignments, a behavioral-observation-notes section, and behavioral-description-only framing.
- **research.html / research.md deep research.** The Dynamics Explorer program and the paired architecture, the high-altitude polar orbit, the Spin-Scan Auroral Imager and the first global auroral images, the magnetosphere-ionosphere coupling, the instrument suite, the aurora and the coupling system in depth, the place in the magnetosphere fleet, the obs#2 continuation, and the global-imaging lineage thread.
- **mathematics.html threads.** The spin-scan imaging geometry from a high elliptical orbit, the field-line mapping between conjugate altitudes, the auroral-oval coordinate systems, the high-altitude polar elliptical-orbit geometry, the magnetosphere-ionosphere coupling current closure, and the global auroral-oval brightness and energy flux.
- **Two shader artifacts.** `global-auroral-oval-viewer.frag` (GLSL 3.30 core fragment shader, four cycling modes on the whole-auroral-oval-from-above, polar-cap, conjugate-imaging, and magnetosphere-ionosphere-coupling theme) plus a standalone WebGL2 `viewer.html` with a four-mode toggle, sweep slider, animated motion, and scene rotation; the viewer rewrites `#version 330 core` to `#version 300 es` at load.

## Part B — Catalog & Chain Deliverables (depth)

- **Predecessor forward-link resolved.** `www/tibsfox/com/Research/NASA/1.186/to-1.187.md` updated to record the actual DE-1 selection (the obs#2 INTRA-AXIS continuation with the global auroral imaging) in place of the prior "TBD per operator selection" lines, in both the forward-cadence body and the closing successor-anticipation lines.
- **Predecessor nav-card pair updated.** Both the top and bottom nav-card "next" cells in `www/tibsfox/com/Research/NASA/1.186/index.html` now point to `../1.187/index.html` with the label "DE-1 →" in place of the prior Series-Hub fallback.
- **Canonical-pairings TSV record appended.** The new record for degree 1.187 (Mountain Hemlock / Golden Eagle / Operator-selectable S36) was appended with a proper trailing newline, preserving the 15-column tab-delimited layout.
- **Canonical-pairings JSON 188th entry appended.** The corresponding 188th array entry for degree 1.187 was appended with the same pairing, preserving valid JSON and mirroring the existing entry structure (plant, animal, s36, sps_species_page, csv_refs).
- **STORY.md ground-truth entry appended.** A single v1.49.996 entry was appended to `.planning/roadmap/STORY.md` with a leading newline separator so the downstream append regex matches; the header "current version" line was advanced to v1.49.996.
- **Catalog indexes refreshed.** `node tools/update-catalog-indexes.mjs --write` was run to add 1.187 to the NASA landing-page completedMissions set so the pre-tag-gate catalog-index step passes on first try.
- **Release-notes README + chapter generation.** This README was authored to the 10-dimension rubric and the W3.5 chapter-generation pipeline was run to produce the chapter files for v1.49.996.
- **Nav-card pair on the new index.** The 1.187 index carries identical nav-card pairs at both the top and bottom of the body, with the previous cell pointing to v1.186 FAST and the next cell pointing to the Series Hub (DE-1 is the new last mission).

## Decisions Made

- **DE-1 selected at v1.187** from the v1.186 to-1.187.md forward list. DE-1 was the global-auroral-imaging candidate (a), sustaining the reopened near-Earth magnetosphere substrate-axis at obs#2 with the first global imaging of the complete auroral oval — the headline structural continuation, complementing the FAST in-situ snapshot science with a chronologically-earlier whole-system imaging anchor.
- **Magnetosphere axis continued at obs#2.** DE-1 sustains the reopened magnetosphere substrate-axis at obs#2 INTRA-AXIS continuation, complementing the FAST in-situ snapshot science with a global-imaging vantage and a coupled-system sampling.
- **Global-magnetosphere-imaging lineage thread sustained at obs#2.** DE-1 anchors the GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE thread at obs#2 with the substrate-era IMAGE, recording the global imaging-from-space substrate across the chronologically-earlier DE-1 auroral-oval imaging and the later global magnetosphere imaging.
- **Golden Eagle + Mountain Hemlock operator-default pairing.** A high-soaring overview raptor and a high-elevation overview-zone conifer mirror DE-1's first whole-oval view of the aurora from a high-altitude polar orbit.
- **Path A fresh-build sub-agent dispatch authorized.** v996 sustains the Path A fresh-build precedent at obs#19 cumulative, using a single comprehensive build dispatch for all www/ deliverables, the canonical-pairings updates, the predecessor forward-link updates, the retrospective surfaces, and the W3.5 chapter-gen step.
- **Forward-anticipation candidates at v1.188.** A MAGNETOSPHERE-axis INTRA-AXIS continuation toward further inner-magnetosphere, ring-current, and ionosphere-coupling missions, enumerated in to-1.188.md.

## Lessons Learned

1. **A reopened substrate-axis can be sustained by a chronologically-earlier complementary entry.** DE-1 continues the reopened magnetosphere axis at obs#2 with a 1981 global-imaging anchor that complements the 1996 FAST in-situ science, showing that an axis can be sustained by an earlier entry that supplies a distinct vantage rather than only by a later one, an obs#2 continuation that adds a complementary substrate.
2. **A high-altitude vantage opens a whole-system view that a low vantage cannot reach.** DE-1's high-altitude orbit let the Spin-Scan Auroral Imager view the entire auroral region from above and capture the complete oval at once, showing that the altitude of the vantage is itself a substrate distinction: a high-altitude mission records the global form that an in-situ mission cannot see whole.
3. **A paired two-spacecraft architecture samples the coupling between two regions directly.** DE-1 high-altitude and DE-2 low-altitude sampled the same field lines at two heights, showing that a paired architecture can study the coupling between two regions as a system, sampling both ends of the connection together rather than reconstructing the coupling from single-region measurements.
4. **A global-imaging approach can recur across the catalog as a cumulative lineage.** DE-1 anchors the GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE thread at obs#2 with the substrate-era IMAGE, showing that the whole-system imaging substrate recurs across the catalog, from the early DE-1 auroral-oval imaging to the later global magnetosphere imaging that DE-1 anchors.
5. **A spin-stabilized spacecraft can build a global image from its spin.** DE-1's Spin-Scan Auroral Imager used the spacecraft spin to sweep its field of view and build a whole-oval image line by line, showing that a spin-stabilized platform can carry a global imager by turning the spin into the imaging scan rather than carrying a large staring camera.
6. **A two-vantage axis pairs an in-situ local view with a global whole-system view.** The reopened magnetosphere axis now holds the FAST in-situ acceleration-region view and the DE-1 global-imaging whole-oval view together, showing that an axis can build complementary local and global vantages on the same phenomenon across its observations.
7. **An early anchor can predate and found the later missions it complements.** DE-1's 1981 global auroral images predate the substrate-era global imagers by nearly two decades, showing that a chronologically-earlier anchor can be the foundational baseline from which the later high-resolution missions built, an early entry that founds a lineage rather than merely joining it.
8. **A reference template carries forward cleanly across a distinct-palette mission.** Because DE-1 reuses the canonical card structure of the v1.186 template, the build preserved the structural template exactly and swapped the content to the global auroral imaging with a distinct early-1980s magenta/violet auroral-imaging palette of deep indigo, aurora magenta, aurora violet, oval rose, halo amber, and polar indigo, making the distinct-palette mission a clean build.

## Surprises

- **The first whole-oval view came from a 1981 mission.** DE-1, a 1981 Dynamics Explorer spacecraft, produced the first images of the complete auroral oval from space, so the catalog's whole-system auroral-imaging anchor is chronologically earlier than the in-situ FAST entry that reopened the axis a milestone before it.
- **A high-elevation overview conifer mirrors a high-altitude imaging spacecraft.** The Mountain Hemlock, rooted in the high-elevation overview zone where the whole valley is visible, enters as the whole-overview mirror to the high-altitude global-imaging mission, so the catalog pairs a high-mountain tree with a high-orbit imager.
- **A paired mission sampled two regions at once from the first day.** DE-1 and DE-2 launched together on a single Delta 3914 and entered their two orbits together, so the two-height architecture for the coupling study was established from the moment of deployment rather than built up over time.

## Retrospective

### What Worked

- **Single comprehensive build dispatch.** Per the established NASA streamlined T14 ship sequence pattern, the v996 build was scoped to a single dispatch covering all www/ deliverables, the canonical-pairings updates, the predecessor forward-link updates, the retrospective surfaces, and the W3.5 chapter-gen step.
- **Axis-continuation framing handled cleanly.** The magnetosphere-axis continuation was framed as MAGNETOSPHERE-AXIS-INTRA-CONTINUATION obs#2 with the reopened axis spanning v995 FAST (obs#1) and v996 DE-1 (obs#2), consistently across the index, the JSONs, the nav md files, and the README. The index trip-vocab page check returned PASS with zero primary and zero secondary classes in the title line and body.
- **Identifier-in-lists discipline preserved.** All substrate-anchor identifiers appear in bulleted lists, table cells, or anchor-pill spans rather than embedded in narrative paragraphs, satisfying the layout gate and the IDENTIFIER-NOT-PROSE-DISCIPLINE.
- **Dedication word-count discipline preserved.** Both the index.html dedication and the organism.html dedication are within the 200-word cap.
- **Reference template recognition.** The v1.186 FAST template files were used as the immediate reference — same CSS structure, same nav-card pair pattern, same sidebar and track-grid patterns — with palette tokens renamed for DE-1 (--aurora-magenta, --aurora-violet, --oval-rose, --halo-amber, --polar-indigo) and a distinct early-1980s auroral-imaging magenta/violet palette, and the structural template preserved exactly.
- **Pairing files updated in both formats.** The new canonical-pairings record was appended consistently to both the TSV (15-column tab-delimited) and the JSON (mirroring the existing entry structure), keeping the two data files in lockstep at 188 records.

### What Could Be Better

- **The shader renders procedural structure rather than archived data.** The global-auroral-oval shader uses analytic geometry and procedural noise rather than loading actual DE-1 Spin-Scan Auroral Imager frames from the NASA Space Physics Data Facility. A future revision could load encoded DE-1 auroral-oval frames for a higher-fidelity rendering keyed to the real auroral oval.
- **The high-altitude polar-orbit diorama is a forthcoming artifact.** The 3D-printable diorama STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the high-altitude polar elliptical orbit and the auroral-oval ring.
- **The magnetosphere program-lineage sidebar table is illustrative rather than exhaustive.** The sidebar lists representative program elements (DE-1, DE-2, FAST, IMAGE, Polar, THEMIS/RBSP/MMS) but does not enumerate the full magnetosphere fleet; a future revision could expand the table with launch dates and mission outcomes.
- **The magnetosphere-ionosphere coupling analysis is asserted rather than computed.** The field-line mapping between the conjugate DE-1 and DE-2 altitudes is described but not run against archived data; a future ship could compute the conjugate mapping from a real DE-1 / DE-2 crossing.

## Cross-References

The DE-1 milestone connects to several prior catalog entries through shared substrate threads and program lineages:

| Referent | Relationship to DE-1 |
|---|---|
| **v1.186 FAST** | The immediate predecessor; the obs#1 reopening anchor on the magnetosphere axis with the in-situ high-cadence acceleration-region science that DE-1 complements at obs#2 |
| **Substrate-era IMAGE** | The later global magnetosphere imager whose lineage DE-1 anchors; DE-1 sustains the GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE thread at obs#2 with IMAGE |
| **Substrate-era Polar** | Polar-cap and auroral imaging the reopened axis complements |
| **Substrate-era THEMIS** | Substorm and auroral-onset science the reopened axis complements |
| **Substrate-era RBSP / MMS** | Radiation-belt and reconnection in-situ magnetosphere science the reopened axis complements |
| **v1.185 Cassini-Huygens** | The closing INTERSTELLAR-BOUNDARY axis entry off which FAST rotated to reopen the magnetosphere axis that DE-1 now continues |

- **MAGNETOSPHERE axis lineage:** the reopened axis spans **v995 FAST** (obs#1, in-situ) and **v996 DE-1** (obs#2, global imaging) and complements the substrate-era magnetosphere entries (**RBSP**, **MMS**, **THEMIS**, **Cluster**, **Geotail**, **Polar**, **IMAGE**); forward candidates in **to-1.188.md**.
- **MAGNETOSPHERE-AXIS-INTRA-CONTINUATION thread:** the DE-1 global-imaging entry joins the **v995 FAST** in-situ entry on the reopened axis at obs#2.
- **GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE thread:** the DE-1 auroral-oval imaging joins the substrate-era **IMAGE** global magnetosphere imaging across the imaging lineage at obs#2.
- **Substrate-axis-rotation discipline:** see the prior rotations enumerated through **SUBSTRATE-AXIS-ROTATION-DISCIPLINE obs#59 cumulative** (the reopened magnetosphere axis sustains at obs#2).

## Engine state

| Track | State at v996 |
|---|---|
| NASA degree | ADVANCED 1.186 → 1.187 |
| MUS degree | SCAFFOLD-PENDING obs#70 |
| ELC degree | SCAFFOLD-PENDING obs#70 |
| SPS species | SCAFFOLD-PENDING obs#70 |
| TRS | SCAFFOLD-PENDING obs#70 |

- **NASA degree:** ADVANCED 1.186 → 1.187 at v996 (counter_cadence: false)
- **MUS degree:** SCAFFOLD-PENDING obs#70 cumulative
- **ELC degree:** SCAFFOLD-PENDING obs#70 cumulative
- **SPS species:** SCAFFOLD-PENDING obs#70 cumulative
- **TRS M0 substrate:** SCAFFOLD-PENDING obs#70 cumulative

## Cross-track / Engine state full enumeration

| Thread | Count | Members |
|---|---|---|
| MAGNETOSPHERE-AXIS-INTRA-CONTINUATION | obs#2 | FAST (in-situ) + DE-1 (global imaging) |
| GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE | obs#2 | DE-1 (auroral-oval imaging) + IMAGE (global magnetosphere imaging) |
| SUBSTRATE-AXIS-ROTATION-DISCIPLINE | obs#59 | axis sustains; the reopened MAGNETOSPHERE axis continues at obs#2 |
| MAGNETOSPHERE axis (reopened) | obs#2 | FAST + DE-1 |

## Forward queue

- **v1.188 candidates:** a MAGNETOSPHERE-axis INTRA-AXIS continuation toward further inner-magnetosphere, ring-current, and ionosphere-coupling science.
- **MAGNETOSPHERE axis:** forward to obs#3 INTRA-AXIS continuation at v188+ on the reopened magnetosphere axis.
- **GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE thread:** forward to obs#3+ if another global-imaging mission enters the catalog.
- **MAGNETOSPHERE-IONOSPHERE-COUPLING-FIRST-INSTANCE:** forward if another magnetosphere-ionosphere coupling mission enters the catalog.

## File inventory

- `.planning/missions/v1-49-996-nasa-1-187-de-1/MISSION-BRIEF.md` — mission brief authored at v996
- `www/tibsfox/com/Research/NASA/1.187/` — 14-file canonical mission directory plus artifacts/shaders/
- `www/tibsfox/com/Research/NASA/1.186/to-1.187.md` — predecessor forward-link updated to record the DE-1 selection
- `www/tibsfox/com/Research/NASA/1.186/index.html` — predecessor nav-card pair updated to point to DE-1
- `.planning/sps-s36-mapping/canonical-pairings.tsv` + `.json` — 1.187 entry appended (188th JSON entry)
- `.planning/roadmap/STORY.md` — v1.49.996 entry appended; header version advanced
- `docs/release-notes/v1.49.996/chapter/` — chapter files for the chapter-gen pipeline
- `tools/release-history/run-with-pg.mjs` — chapter-gen pipeline (W3.5 step)

## Engine Position

- **NASA degree:** ADVANCES 1.186 → 1.187 at v996 (counter_cadence: false)
- **Counter-cadence count:** 5 (UNCHANGED — v585, v776, v777, v778, v779)
- **MUS / ELC / SPS / TRS:** all SCAFFOLD-PENDING obs#70 cumulative
- **MAGNETOSPHERE axis:** continues at obs#2 INTRA-AXIS continuation (the reopened axis sustains at obs#2)
- **MAGNETOSPHERE-AXIS-INTRA-CONTINUATION and GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE threads:** obs#2 cumulative (the headline continuation and the imaging lineage)

## Dedication

v1.187 DE-1 is dedicated to the team that built and flew Dynamics Explorer 1: the Dynamics Explorer program team who designed the paired two-spacecraft architecture and the high-altitude and low-altitude orbits that sampled the magnetosphere and the ionosphere at two heights along the same field lines; the Spin-Scan Auroral Imager team who built the imaging instrument that produced the first images of the complete auroral oval from space, showing the global form of the aurora as a single connected ring; and the NASA Goddard Space Flight Center team who managed the Dynamics Explorer program and the paired Delta 3914 launch. It is dedicated as well to the wider community of magnetospheric and auroral physicists whose work DE-1 advanced, the global auroral imaging that transformed auroral studies from local snapshots to a whole-system view and the coupled-system measurements that joined the magnetosphere to the ionosphere. DE-1 launched in 1981, flew a high-altitude polar elliptical orbit over the poles, imaged the entire auroral oval from above, and anchored the global-imaging lineage that later missions carried to the full magnetosphere.
