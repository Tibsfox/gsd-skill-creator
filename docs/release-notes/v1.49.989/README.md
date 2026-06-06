# v1.49.989 — Voyager 1 NASA Grand-Tour Outer-Planets and Interstellar Mission

**Shipped:** 2026-06-06
**Branch:** dev → main
**Type:** NASA degree-advancing milestone (1.179 → 1.180)
**NASA Mission:** Voyager 1 (Grand-Tour outer-planets and interstellar mission)
**Engine state:** ADVANCED — NASA degree 1.179 → 1.180
**Counter-cadence:** false
**Phases:** 6 (W0-W5 wave-pipeline)

This is a 5-track NASA-substrate-convergence milestone: the NASA degree advances while the MUS, ELC, SPS, and TRS tracks hold their scaffold-pending state at v989.

## Summary

v1.49.989 advances the NASA degree catalog from 1.179 to 1.180, adding Voyager 1 — NASA's Grand-Tour outer-planets and interstellar spacecraft — as the fourth observation within the INTERSTELLAR-BOUNDARY substrate-axis that opened at v775 IMAP, sustained at v788 IBEX, and continued at v988 Wind. Voyager 1 is the chronologically-earliest anchor within the axis: its 1977-09-05 launch predates the v988 Wind 1994 launch by 17 years and the v788 IBEX 2008 launch by 31 years. Where IMAP and IBEX map the heliosphere boundary via remote energetic-neutral-atom all-sky imaging and Wind monitors the solar wind in situ at the upstream Sun-Earth L1 vantage, Voyager 1 sampled the heliosphere boundary directly while passing through it and beyond, supplying the only direct in-situ measurement of the boundary the other missions characterize from within the heliosphere. The headline cumulative continuation at this degree is the heliosphere-boundary cross-method thread, which sustains at obs#4 across four missions spanning two measurement methods — remote ENA imaging at v775 IMAP and v788 IBEX, in-situ solar-wind monitoring at v988 Wind, and in-situ boundary-crossing at v989 Voyager 1.

Voyager 1 was conceived at the NASA Jet Propulsion Laboratory as the Mariner Jupiter-Saturn 1977 mission, later renamed Voyager, to exploit a rare alignment of the outer planets that allowed a single spacecraft to reach the giant planets in sequence using their gravity. Edward C. Stone led the science program from 1972, shaping an instrument complement that served both the planetary encounters and the long journey beyond. The spacecraft launched 1977-09-05 at 12:56 UTC on a Titan IIIE-Centaur vehicle from Cape Canaveral Launch Complex 41. It is three-axis-stabilized, built around a ten-sided bus with a 3.7-meter high-gain dish antenna, a science boom carrying the fields-and-particles instruments, a scan platform for imaging and remote sensing, and a separate boom supporting three multi-hundred-watt radioisotope thermoelectric generators that supply power independent of sunlight. Voyager 1 launched after its twin Voyager 2 yet followed a faster trajectory that reached Jupiter first.

The trajectory is the defining feature of the mission architecture. Voyager 1 used a Jupiter gravity assist with closest approach on 1979-03-05 to gain speed and bend its path toward Saturn, then a Saturn gravity assist with closest approach on 1980-11-12, where a deliberately close flyby of the moon Titan turned the path northward out of the ecliptic plane and onto an escape trajectory toward the outer heliosphere. The planetary phase returned a detailed record of the Jovian and Saturnian systems, their ring structures, and their families of moons, while the gravity assists raised the spacecraft to the speed required to leave the Sun's gravitational reach. The choice to make the close Titan flyby committed Voyager 1 to leaving the plane of the planets, which is why the Uranus and Neptune survey was left to Voyager 2.

Beyond Saturn the mission became the Voyager Interstellar Mission, a long outward cruise through the heliosphere toward its boundary with interstellar space. In December 2004, near 94 AU, Voyager 1 crossed the termination shock — the surface where the supersonic solar wind abruptly slows as it meets the pressure of the surrounding interstellar medium — and entered the heliosheath beyond. For nearly eight more years the spacecraft traveled through this turbulent outer region, its instruments tracking the gradual change in the particle and field environment. Then, on 2012-08-25 near 121 AU, the character of the surroundings changed decisively. The Cosmic Ray Subsystem recorded a sharp rise in galactic cosmic-ray intensity while the Low-Energy Charged Particle detector recorded the disappearance of heliospheric ions, and the Magnetometer tracked the field through the transition. The Plasma Wave Subsystem, led by Donald Gurnett at the University of Iowa, supplied the definitive confirmation: a rise in electron plasma density to the value expected for the interstellar medium, recorded after the spacecraft's own plasma instrument had been offline since 1980. With that measurement Voyager 1 became the first human-made object to enter the local interstellar medium.

The milestone produced the full canonical 14-deliverable set at `www/tibsfox/com/Research/NASA/1.180/` plus a WebGL2 Grand-Tour trajectory viewer shader with four cycling modes (gravity-assist trajectory, heliosphere structure, boundary crossing, and interstellar field), rendering the Jupiter-Saturn gravity-assist path and the layered heliosphere boundary. The build resolved the predecessor v1.179 forward-link to record the actual Voyager 1 selection, updated both nav-card "next" cells on the v1.179 index to point to Voyager 1, appended the 181st canonical-pairings entry (Sooty Shearwater + Fireweed + Operator-selectable S36) to both the TSV and JSON files, and codified retrospective lessons across all required surfaces.

The organism pairing for Voyager 1 is the Sooty Shearwater (Ardenna grisea) and the Fireweed (Chamerion angustifolium). The Sooty Shearwater is a transequatorial migratory seabird that passes through Pacific Northwest waters on one of the longest annual journeys recorded for any animal, a figure-eight loop across the entire Pacific basin — a record-distance outward journey that mirrors Voyager 1's record-distance outward journey across the heliosphere boundary as the most distant human-made object. Fireweed is a Pacific Northwest pioneer whose seeds are each tipped with a tuft of fine hairs that catch the wind, carrying the seed far from origin to colonize distant new ground — a far dispersal that mirrors Voyager 1's outward dispersal beyond the heliosphere as the first object to reach the local interstellar medium. Both organisms share four alignments with Voyager 1: record-distance outward reach, borrowed momentum from a moving medium, carrying their own reserves far from a renewing source, and long-duration persistence at the farthest reach.

Several substrate-form distinctions separate Voyager 1 from the prior axis entries. First, measurement architecture: Voyager 1 makes an in-situ direct measurement of the heliosphere boundary while crossing it, distinct from the remote energetic-neutral-atom all-sky imaging at v775 IMAP and v788 IBEX and the in-situ solar-wind monitoring at the L1 vantage at v988 Wind. Second, trajectory: Voyager 1 reached an escape trajectory through Jupiter and Saturn gravity assists, distinct from the fixed observing stations of the prior axis entries. Third, power architecture: Voyager 1 carries radioisotope thermoelectric generators for multi-decade deep-space operation, distinct from the solar power of the inner-heliosphere vantages. Voyager 1 also introduces the first human-made object to enter interstellar space, the Edward C. Stone project-scientist lineage, the Golden Record cultural artifact assembled under Carl Sagan, the plasma-wave density confirmation, the most-distant-object operational record, and the Titan IIIE-Centaur launch vehicle.

Voyager 1 sustains and opens three cumulative threads beyond the headline cross-method thread. The direct in-situ heliosphere-boundary thread opens at obs#1 within the in-situ-direct method and stands cumulative-anticipatory toward the paired interstellar architecture at the Voyager 2 crossing in 2018. The deep-space radioisotope-powered-operations thread opens at obs#1 and anticipates the radioisotope-powered Cassini and New Horizons missions forward. Together these threads place Voyager 1 at the outermost point of the heliosphere-boundary dataset, completing the cross-method comparison across remote and in-situ measurement and opening the direct in-situ and radioisotope-power threads that future missions will continue. The engine state otherwise holds steady: the counter-cadence count is unchanged at 5, and MUS, ELC, SPS, and TRS all remain SCAFFOLD-PENDING at obs#63 cumulative.

## Mission Overview

Voyager 1 is NASA's Grand-Tour outer-planets and interstellar spacecraft, built and operated at the NASA Jet Propulsion Laboratory and the first human-made object to enter interstellar space.

| Fact | Value |
|---|---|
| Launch | 1977-09-05 at 12:56 UTC on a Titan IIIE-Centaur from Cape Canaveral Launch Complex 41 |
| Program | NASA Voyager program (originally Mariner Jupiter-Saturn 1977), continued as the Voyager Interstellar Mission |
| Mission target | Jovian and Saturnian systems (planetary phase); heliosphere boundary and local interstellar medium (interstellar mission) |
| Build and management | NASA Jet Propulsion Laboratory (California Institute of Technology) |
| Project Scientist | Edward C. Stone (led the science program from 1972) |
| Configuration | Three-axis-stabilized, 3.7-meter high-gain dish antenna, science boom |
| Power | Three multi-hundred-watt radioisotope thermoelectric generators |
| Designed lifetime | 5 years (extended operations sustained beyond four decades) |
| Boundary milestones | Termination shock near 94 AU (2004-12); heliopause near 121 AU (2012-08-25) |
| Distinction | First human-made object in interstellar space; most distant human-made object |

## Key Features

| Feature | Description |
|---|---|
| First object in interstellar space | Crossed the heliopause near 121 AU on 2012-08-25; the first human-made object to enter the local interstellar medium |
| In-situ direct boundary crossing | Sampled the heliosphere boundary directly while passing through it, the only direct in-situ measurement of the boundary |
| Grand-Tour gravity-assist architecture | Jupiter (1979) and Saturn (1980) gravity assists onto an escape trajectory out of the ecliptic plane |
| Radioisotope deep-space power | Three radioisotope thermoelectric generators for multi-decade operation far beyond the reach of solar power |
| Plasma-wave density confirmation | The PWS density rise (Donald Gurnett, University of Iowa) became the definitive marker for the boundary crossing |
| Most distant human-made object | More than four decades of operation; the outermost point of the multi-vantage heliosphere-boundary dataset |
| The Golden Record | A gold-plated phonograph record of sounds and images of Earth, assembled under Carl Sagan |
| Grand-Tour trajectory WebGL2 shader | Four cycling modes (gravity-assist trajectory, heliosphere structure, boundary crossing, interstellar field) |

## Structural firsts

**VOYAGER-1-FIRST-INSTANCE:** Voyager 1 enters the catalog as the NASA Grand-Tour outer-planets and interstellar mission.

**FIRST-HUMAN-MADE-OBJECT-IN-INTERSTELLAR-SPACE-FIRST-INSTANCE:** The first human-made object to enter the local interstellar medium.

**IN-SITU-HELIOPAUSE-CROSSING-FIRST-INSTANCE:** The first direct in-situ measurement of the heliosphere boundary.

**TERMINATION-SHOCK-CROSSING-2004:** Crossed the termination shock near 94 AU in 2004.

**GRAND-TOUR-GRAVITY-ASSIST-ARCHITECTURE-FIRST-INSTANCE:** Jupiter and Saturn gravity assists onto an escape trajectory.

**RTG-RADIOISOTOPE-POWER-DEEP-SPACE-FIRST-INSTANCE-IN-AXIS:** Three radioisotope thermoelectric generators for multi-decade deep-space operation.

**EDWARD-STONE-PROJECT-SCIENTIST-FIRST-INSTANCE:** Edward C. Stone led the science program from 1972.

**GOLDEN-RECORD-INTERSTELLAR-MESSAGE-FIRST-INSTANCE:** The gold-plated phonograph record assembled under Carl Sagan.

**PLASMA-WAVE-DENSITY-MEASUREMENT-HELIOPAUSE-CONFIRMATION:** The plasma-density rise that confirmed the crossing.

**FARTHEST-HUMAN-MADE-OBJECT-FIRST-INSTANCE:** The most distant human-made object.

**TITAN-IIIE-CENTAUR-LAUNCH-FIRST-INSTANCE-IN-AXIS:** The Titan IIIE-Centaur launch vehicle.

## Substrate Primary Axes

### NEW LOCKED at v989 (12 anchors)

- **VOYAGER-1-FIRST-INSTANCE** obs#1 NEW LOCKED — Voyager 1 NASA Grand-Tour outer-planets and interstellar mission first INSTANCE in the catalog
- **INTERSTELLAR-BOUNDARY-INTRA-AXIS-CONTINUATION** obs#4 NEW LOCKED — axis sustains at fourth observation (opened at v775 IMAP obs#1, sustained at v788 IBEX obs#2 and v988 Wind obs#3)
- **FIRST-HUMAN-MADE-OBJECT-IN-INTERSTELLAR-SPACE-FIRST-INSTANCE** obs#1 NEW LOCKED — first human-made object to enter the local interstellar medium
- **IN-SITU-HELIOPAUSE-CROSSING-FIRST-INSTANCE** obs#1 NEW LOCKED — first direct in-situ measurement of the heliosphere boundary
- **TERMINATION-SHOCK-CROSSING-2004** obs#1 NEW LOCKED — crossed the termination shock near 94 AU in 2004
- **GRAND-TOUR-GRAVITY-ASSIST-ARCHITECTURE-FIRST-INSTANCE** obs#1 NEW LOCKED — Jupiter and Saturn gravity assists onto an escape trajectory
- **RTG-RADIOISOTOPE-POWER-DEEP-SPACE-FIRST-INSTANCE-IN-AXIS** obs#1 NEW LOCKED — three radioisotope thermoelectric generators
- **EDWARD-STONE-PROJECT-SCIENTIST-FIRST-INSTANCE** obs#1 NEW LOCKED — Edward C. Stone led the science program from 1972
- **GOLDEN-RECORD-INTERSTELLAR-MESSAGE-FIRST-INSTANCE** obs#1 NEW LOCKED — the gold-plated phonograph record assembled under Carl Sagan
- **PLASMA-WAVE-DENSITY-MEASUREMENT-HELIOPAUSE-CONFIRMATION** obs#1 NEW LOCKED — the plasma-density rise that confirmed the crossing
- **FARTHEST-HUMAN-MADE-OBJECT-FIRST-INSTANCE** obs#1 NEW LOCKED — the most distant human-made object
- **TITAN-IIIE-CENTAUR-LAUNCH-FIRST-INSTANCE-IN-AXIS** obs#1 NEW LOCKED — Titan IIIE-Centaur launch vehicle

### CUMULATIVE at v989 (3 threads)

- **ENA-IMAGING-VERSUS-IN-SITU-CROSS-METHOD** obs#4 cumulative — v775 IMAP + v788 IBEX + v988 Wind + v989 Voyager 1; the heliosphere-boundary characterization substrate now spans four missions across two measurement methods; the headline cumulative continuation at this degree
- **HELIOSPHERE-BOUNDARY-DIRECT-IN-SITU-CUMULATIVE** obs#2 — opens at obs#1 within the in-situ-direct method and stands cumulative-anticipatory toward the paired Voyager 2 crossing
- **DEEP-SPACE-RADIOISOTOPE-POWERED-OPERATIONS** obs#1 — opens at Voyager 1 and anticipates Cassini and New Horizons forward

### ESTABLISHED disciplines applied (cumulative)

- SUBSTRATE-AXIS-ROTATION-DISCIPLINE obs#52 cumulative (axis sustains; no rotation this milestone)
- POSITIVE-FRAMING-DISCIPLINE obs#66 cumulative
- DISPATCH-PROMPT-DENSITY-DISCIPLINE obs#15 cumulative
- IDENTIFIER-NOT-PROSE-DISCIPLINE obs#22 cumulative
- NAV-CARD-PAIR-DELIVERABLE-DISCIPLINE obs#11 cumulative
- PATH-A-FRESH-BUILD-PRECEDENT obs#12 cumulative
- W3.5-CHAPTER-GEN-BAKE-IN obs#19 cumulative
- README-RETROSPECTIVE-SECTIONS-REQUIREMENT obs#18 cumulative
- STORY-MD-NEWLINE-SEPARATOR-DISCIPLINE obs#26 cumulative
- DEDICATION-WORD-COUNT-DISCIPLINE obs#4 cumulative (≤200 words)

## Part A — Mission Deliverables (depth)

- **Canonical 14-deliverable set at `www/tibsfox/com/Research/NASA/1.180/`.** The full canonical mission directory: degree-sync.json, knowledge-nodes.json, data-sources.json, from-1.179.md, to-1.181.md, index.html, organism.md, organism.html, research.md, research.html, papers.html, mathematics.html, simulation.html, and curriculum.html, plus the artifacts/shaders subdirectory.
- **index.html with the canonical 12-card layout plus enrichment.** The index carries the v1.0 canonical card floor (Mission Summary, Mission Tracks, Resonance Axes, What to Build, TRY Sessions, DIY Projects, Creative Artifacts, Runnable Simulations, Interactive Lab, Forest Contribution, Data Files, Dedication), plus a Mission Journey narrative card, a Structural Firsts card, and a Governance & Chain Declarations card, plus six numbered resonance axes each with a mission paragraph and an organism pairing, plus a seven-card sidebar including the Voyager/Mariner-Jupiter-Saturn program-lineage table and a haiku card.
- **Six resonance axes.** In-situ direct boundary sampling; the Grand-Tour gravity-assist trajectory; radioisotope deep-space power; the heliosphere-boundary cross-method thread at obs#4; record-distance operational longevity; and the plasma-wave density confirmation with the Golden Record cultural artifact.
- **Mission Journey narrative card.** A multi-paragraph narrative (over 500 words) on the Grand-Tour gravity assists, the termination-shock and heliopause crossings, and the plasma-wave confirmation, framing the spacecraft's journey from the inner solar system to the local interstellar medium.
- **organism.html at ≥3500 words.** The Sooty Shearwater + Fireweed pairing with the long-distance-journey and far-dispersal mirrors drawn from observable behavior, with four explicit alignments, a behavioral-observation-notes section, and behavioral-description-only framing.
- **research.html / research.md deep research.** The Grand-Tour gravity-assist trajectory, the planetary phase, the heliosphere structure and boundary crossings, the fields-and-particles instrument suite, radioisotope power and four-decade operations, the Golden Record, the Mariner heritage, the Deep Space Network, and the cumulative substrate threads with a four-mission cross-method comparison table.
- **mathematics.html threads.** The gravity-assist velocity geometry and turn angle, the electron plasma-frequency to plasma-density relation, the radioisotope power-decay curve, the hyperbolic escape-trajectory and specific-orbital-energy bookkeeping, the round-trip light-time scaling, and the heliosphere boundary-distance pressure balance.
- **Two shader artifacts.** `grand-tour-trajectory-viewer.frag` (GLSL 3.30 core fragment shader, four cycling modes on the Grand-Tour and heliosphere-boundary-crossing theme) plus a standalone WebGL2 `viewer.html` with a four-mode toggle, journey-progress slider, animated motion, and scene rotation; the viewer rewrites `#version 330 core` to `#version 300 es` at load.

## Part B — Catalog & Chain Deliverables (depth)

- **Predecessor forward-link resolved.** `www/tibsfox/com/Research/NASA/1.179/to-1.180.md` updated to record the actual Voyager 1 selection (candidate (a), the in-situ heliopause-crossing selection) in place of the prior "TBD per operator selection" lines.
- **Predecessor nav-card pair updated.** Both the top and bottom nav-card "next" cells in `www/tibsfox/com/Research/NASA/1.179/index.html` now point to `../1.180/index.html` with the label "Voyager 1 →" in place of the prior Series-Hub fallback.
- **Canonical-pairings TSV 181st record appended.** The 181st record for degree 1.180 (Fireweed / Sooty Shearwater / Operator-selectable S36) was appended with a proper trailing newline, preserving the 15-column tab-delimited layout.
- **Canonical-pairings JSON 181st entry appended.** The corresponding 181st array entry for degree 1.180 was appended with the same pairing, preserving valid JSON and mirroring the existing entry structure (plant, animal, s36, sps_species_page, csv_refs).
- **STORY.md ground-truth entry appended.** A single v1.49.989 entry was appended to `.planning/roadmap/STORY.md` with a leading newline separator so the downstream append regex matches; the header "current version" line was advanced to v1.49.989.
- **Catalog indexes refreshed.** `node tools/update-catalog-indexes.mjs --write` was run to add 1.180 to the NASA landing-page completedMissions set so the pre-tag-gate catalog-index step passes on first try.
- **Release-notes README + chapter generation.** This README was authored to the 10-dimension rubric and the W3.5 chapter-generation pipeline was run to produce the chapter files for v1.49.989.
- **Nav-card pair on the new index.** The 1.180 index carries identical nav-card pairs at both the top and bottom of the body, with the previous cell pointing to v1.179 Wind and the next cell pointing to the Series Hub (Voyager 1 is the new last mission).

## Decisions Made

- **Voyager 1 selected at v1.180** from the v1.179 to-1.180.md forward list. Operator selected Voyager 1 as candidate (a), the in-situ heliopause-crossing selection, which sustains the INTERSTELLAR-BOUNDARY axis at obs#4 and extends the heliosphere-boundary cross-method thread to obs#4 — the headline cumulative continuation.
- **Chronologically-earliest-anchor selection sustained.** Voyager 1's 1977 launch is the new chronologically-earliest anchor within the axis, extending the forward-shadow first-instance convention. The axis-open obs#1 remains at v775 IMAP; Voyager 1 sustains obs#4 as the chronologically-earliest entry.
- **Sooty Shearwater + Fireweed operator-default pairing.** A record-distance traveler and a far-dispersed wind-borne pioneer (Sooty Shearwater basin-spanning journey; Fireweed wind-borne seed) mirror Voyager 1's record-distance outward journey across the heliosphere boundary.
- **Path A fresh-build sub-agent dispatch authorized.** v989 sustains the Path A fresh-build precedent at obs#12 cumulative, using a single comprehensive build dispatch for all www/ deliverables, the canonical-pairings updates, the predecessor forward-link updates, the retrospective surfaces, and the W3.5 chapter-gen step.
- **Forward-anticipation candidates at v1.181.** The Voyager 2 paired in-situ heliopause crossing (2018), Pioneer 10 and Pioneer 11 outer-heliosphere precursors, Cassini INCA from Saturn orbit, New Horizons heliopause anticipation, and an axis-rotation #25 to FAST or DE-1, enumerated in to-1.181.md.

## Lessons Learned

1. **In-situ direct boundary measurement completes a cross-method axis.** The INTERSTELLAR-BOUNDARY axis opened with two remote ENA-imaging missions and an in-situ upstream monitor; Voyager 1 sustains it at obs#4 with the one direct in-situ boundary crossing. The axis now spans the full method space — remote imaging, upstream in-situ, and direct boundary in-situ — without rotation, showing a single substrate-axis can hold all three measurement methods.
2. **A chronologically-earliest anchor can recede across multiple continuations.** v788 IBEX anchored the axis at 2008, v988 Wind receded it to 1994, and v989 Voyager 1 recedes it to 1977. The forward-shadow first-instance convention permits the earliest entry to move earlier repeatedly while the axis-open obs#1 stays fixed.
3. **A gravity-assist trajectory is a substrate-form-distinct mission architecture within a fixed-station axis.** Voyager 1's Grand-Tour gravity-assist escape contrasts cleanly with the fixed observing stations of IMAP, IBEX, and Wind, adding a mobile-spacecraft dimension to the axis.
4. **The headline cumulative thread can be a method comparison rather than a vantage thread.** Where v988 Wind's headline was the L1-vantage cross-axis thread, v989 Voyager 1's headline is the cross-method heliosphere-boundary thread at obs#4 — the recurrence is the boundary-characterization form across remote and in-situ methods.
5. **Radioisotope power is the enabling substrate for deep-space longevity.** Voyager 1's radioisotope thermoelectric generators are what make a four-decade outer-heliosphere mission possible, opening a DEEP-SPACE-RADIOISOTOPE-POWERED-OPERATIONS thread that anticipates Cassini and New Horizons.
6. **A single definitive measurement can settle a contested boundary crossing.** With the plasma instrument offline, the plasma-wave density measurement supplied the conclusive marker for the 2012-08-25 crossing, demonstrating that one well-chosen measurement can resolve what multiple ambiguous signatures could not.
7. **Cultural artifacts broaden a mission's substrate beyond its science.** The Golden Record, assembled under Carl Sagan, is an inseparable part of the Voyager identity and a public touchstone, broadening the mission's anchor set beyond the heliophysics objective.
8. **A paired-architecture thread can open in anticipation of its second observation.** The direct in-situ heliosphere-boundary thread opens at obs#1 and stands cumulative-anticipatory toward the Voyager 2 crossing, recording the forward intent before the paired observation is realized.

## Surprises

- **The within-axis chronological span now reaches 48 years.** Voyager 1's 1977 launch and IMAP's 2025 launch bracket a 48-year span within a single substrate-axis, far exceeding the 31-year span that was the prior record at v988 Wind.
- **A spacecraft launched for a planetary flyby became the first object in interstellar space.** Voyager 1 was conceived as the Mariner Jupiter-Saturn 1977 mission, yet the gravity assists that completed its planetary tour also gave it the escape velocity to reach the local interstellar medium decades later.
- **A 5-year-design mission has run for more than four decades.** Voyager 1's operational arc exceeds its design lifetime by nearly an order of magnitude, making it the most distant human-made object and the outermost point of the heliosphere-boundary dataset.

## Retrospective

### What Worked

- **Single comprehensive build dispatch.** Per the established NASA streamlined T14 ship sequence pattern, the v989 build was scoped to a single dispatch covering all www/ deliverables, the canonical-pairings updates, the predecessor forward-link updates, the retrospective surfaces, and the W3.5 chapter-gen step.
- **Brief authorship with positive framing throughout.** The mission brief uses positive framing for all substrate-anchor descriptions and avoids forbidden-token enumeration. Title-line trip-vocab count is zero; the index trip-vocab page check returned PASS with zero primary and zero secondary classes.
- **Identifier-in-lists discipline preserved.** All substrate-anchor identifiers appear in bulleted lists, table cells, or anchor-pill spans rather than embedded in narrative paragraphs, satisfying the layout gate and the IDENTIFIER-NOT-PROSE-DISCIPLINE.
- **Dedication word-count discipline preserved.** Both the index.html dedication and the organism.html dedication are within the 200-word cap.
- **Reference template recognition.** The v1.179 Wind template files were used as the immediate reference — same CSS structure, same nav-card pair pattern, same sidebar and track-grid patterns — with palette tokens renamed for Voyager 1 (--voyager-cyan, --shearwater-slate, --fireweed-magenta, --interstellar-violet) and the structural template preserved exactly.
- **Pairing files updated in both formats.** The 181st canonical-pairings record was appended consistently to both the TSV (15-column tab-delimited) and the JSON (mirroring the existing entry structure), keeping the two data files in lockstep.

### What Could Be Better

- **The shader renders procedural structure rather than archived data.** The Grand-Tour trajectory shader uses analytic geometry and procedural noise rather than loading actual Voyager 1 CRS/LECP/PWS time series from NASA SPDF. A future revision could load PNG-encoded or JSON-encoded Voyager archive intervals for a higher-fidelity rendering keyed to the real boundary signatures.
- **The Grand-Tour trajectory diorama is a forthcoming artifact.** The 3D-printable trajectory STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the gravity-assist path.
- **The Voyager/Mariner program-lineage sidebar table is illustrative rather than exhaustive.** The sidebar lists representative program elements (Voyager 1, Voyager 2, Mariner JS 1977, Pioneer 10, Pioneer 11) but does not enumerate the full outer-solar-system fleet; a future revision could expand the table with launch dates and mission outcomes.
- **Cross-thread cumulative reconciliation should be audited.** The heliosphere-boundary cross-method thread is asserted at obs#4; a retrospective audit should confirm the four-member set (IMAP, IBEX, Wind, Voyager 1) against the catalog to ensure no additional boundary missions would change the count.

## Cross-References

The Voyager 1 milestone connects to several prior catalog entries through shared substrate threads and program lineages:

| Referent | Relationship to Voyager 1 |
|---|---|
| **v775 IMAP** | Opened the INTERSTELLAR-BOUNDARY axis at obs#1; Voyager 1 sustains obs#4 |
| **v788 IBEX** | Sustained the axis at obs#2; remote ENA-imaging boundary predecessor |
| **v988 Wind** | Sustained the axis at obs#3; the immediate predecessor degree; in-situ upstream solar-wind reference |
| **v712 Aditya-L1** | Member of the broader heliophysics fleet contextualizing the boundary |
| **v713 SOHO** | Solar-observatory member of the inner-heliosphere context |
| **v714 ACE** | In-situ L1 particle-composition reference within the heliosphere |

- **INTERSTELLAR-BOUNDARY axis lineage:** see also **v775 IMAP**, **v788 IBEX**, **v988 Wind**, and the forward candidates in **to-1.181.md**.
- **Heliosphere-boundary cross-method thread:** see also **v775 IMAP** and **v788 IBEX** (remote ENA imaging) and **v988 Wind** (in-situ upstream monitoring).
- **Direct in-situ boundary thread:** anticipates **Voyager 2** (2018 paired crossing).
- **Deep-space radioisotope-power thread:** anticipates **Cassini** and **New Horizons** forward.

## Engine state

| Track | State at v989 |
|---|---|
| NASA degree | ADVANCED 1.179 → 1.180 |
| MUS degree | SCAFFOLD-PENDING obs#63 |
| ELC degree | SCAFFOLD-PENDING obs#63 |
| SPS species | SCAFFOLD-PENDING obs#63 |
| TRS | SCAFFOLD-PENDING obs#63 |

- **NASA degree:** ADVANCED 1.179 → 1.180 at v989 (counter_cadence: false)
- **MUS degree:** SCAFFOLD-PENDING obs#63 cumulative
- **ELC degree:** SCAFFOLD-PENDING obs#63 cumulative
- **SPS species:** SCAFFOLD-PENDING obs#63 cumulative
- **TRS M0 substrate:** SCAFFOLD-PENDING obs#63 cumulative

## Cross-track / Engine state full enumeration

| Thread | Count | Members |
|---|---|---|
| ENA-IMAGING-VERSUS-IN-SITU-CROSS-METHOD | obs#4 | IMAP + IBEX + Wind + Voyager 1 |
| HELIOSPHERE-BOUNDARY-DIRECT-IN-SITU-CUMULATIVE | obs#2 | Voyager 1 (anticipates Voyager 2) |
| DEEP-SPACE-RADIOISOTOPE-POWERED-OPERATIONS | obs#1 | Voyager 1 (anticipates Cassini + New Horizons) |
| INTERSTELLAR-BOUNDARY axis | obs#4 | IMAP + IBEX + Wind + Voyager 1 |

## Forward queue

- **v1.181 candidates:** the Voyager 2 paired in-situ heliopause crossing (2018), Pioneer 10 and Pioneer 11 outer-heliosphere precursors, Cassini INCA from Saturn orbit, New Horizons heliopause anticipation, and an axis-rotation #25 to FAST or DE-1.
- **INTERSTELLAR-BOUNDARY axis:** forward to obs#5 INTRA-AXIS continuation at v181+.
- **Direct in-situ boundary thread:** forward to the paired-architecture realization at the Voyager 2 crossing.

## File inventory

- `.planning/missions/v1-49-989-nasa-1-180-voyager-1/MISSION-BRIEF.md` — mission brief authored at v989
- `www/tibsfox/com/Research/NASA/1.180/` — 14-file canonical mission directory plus artifacts/shaders/
- `www/tibsfox/com/Research/NASA/1.179/to-1.180.md` — predecessor forward-link updated to record the Voyager 1 selection
- `www/tibsfox/com/Research/NASA/1.179/index.html` — predecessor nav-card pair updated to point to Voyager 1
- `.planning/sps-s36-mapping/canonical-pairings.tsv` + `.json` — 181st entry appended
- `.planning/roadmap/STORY.md` — v1.49.989 entry appended; header version advanced
- `docs/release-notes/v1.49.989/chapter/` — chapter files for the chapter-gen pipeline
- `tools/release-history/run-with-pg.mjs` — chapter-gen pipeline (W3.5 step)

## Engine Position

- **NASA degree:** ADVANCES 1.179 → 1.180 at v989 (counter_cadence: false)
- **Counter-cadence count:** 5 (UNCHANGED — v585, v776, v777, v778, v779)
- **MUS / ELC / SPS / TRS:** all SCAFFOLD-PENDING obs#63 cumulative
- **INTERSTELLAR-BOUNDARY axis:** sustains at obs#4 INTRA-AXIS continuation
- **Heliosphere-boundary cross-method thread:** obs#4 cumulative (headline continuation)

## Dedication

v1.180 Voyager 1 is dedicated to Edward C. Stone, who led the Voyager science program from 1972, to Donald Gurnett and the University of Iowa Plasma Wave Subsystem team whose density measurement confirmed the heliopause crossing, to Carl Sagan and the committee who assembled the Golden Record, and to the NASA Jet Propulsion Laboratory teams who built and have operated the spacecraft for more than four decades. Voyager 1 launched 1977-09-05 on a Titan IIIE-Centaur, used Jupiter and Saturn gravity assists to reach an escape trajectory, and on 2012-08-25 became the first human-made object to enter the local interstellar medium. From the farthest place any made thing has reached, Voyager 1 continues to return fields-and-particles data, supplying the only direct in-situ measurement of the heliosphere boundary that the remote-sensing and upstream missions contextualize.
