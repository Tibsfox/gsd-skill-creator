# v1.49.995 — FAST Fast Auroral Snapshot Explorer NASA Small Explorer High-Cadence Magnetosphere Mission

**Shipped:** 2026-06-06
**Branch:** dev → main
**Type:** NASA degree-advancing milestone (1.185 → 1.186)
**NASA Mission:** FAST (Fast Auroral Snapshot Explorer high-cadence magnetosphere mission)
**Engine state:** ADVANCED — NASA degree 1.185 → 1.186
**Counter-cadence:** false
**Phases:** 6 (W0-W5 wave-pipeline)

This is a 5-track NASA-substrate-convergence milestone: the NASA degree advances while the MUS, ELC, SPS, and TRS tracks hold their scaffold-pending state at v995.

## Summary

v1.49.995 advances the NASA degree catalog from 1.185 to 1.186, adding FAST — the Fast Auroral Snapshot Explorer — as the opening anchor of the reopened near-Earth magnetosphere substrate-axis. This milestone is the twenty-fifth substrate-axis rotation in the catalog (SUBSTRATE-AXIS-ROTATION #25): after nine observations on the INTERSTELLAR-BOUNDARY axis that opened at v775 IMAP and ran through v788 IBEX, v988 Wind, v989 Voyager 1, v990 Voyager 2, v991 Pioneer 10, v992 Pioneer 11, v993 New Horizons, and v994 Cassini at obs#9, the engine rotates the catalog off the heliosphere-boundary axis and reopens the magnetosphere axis with FAST as obs#1 first INSTANCE. Where the prior axis characterized the heliosphere boundary from the Sun-Earth L1 point, from Earth orbit, from the outer heliosphere, and from Saturn orbit, FAST samples the auroral acceleration region of the near-Earth magnetosphere in situ at high cadence from a high-inclination elliptical polar orbit, a substrate-form-distinct domain that returns the catalog to the near-Earth side with a chronologically-earlier auroral-physics anchor.

FAST was a NASA Small Explorer (SMEX), a focused-objective small spacecraft built around a single sharply defined science question: the physics of the auroral acceleration region, the band of altitudes along the high-latitude magnetic field lines where parallel electric fields and field-aligned currents accelerate the electrons and ions that produce the visible aurora. NASA Goddard Space Flight Center managed the Small Explorer, and the science investigation was led at the University of California Berkeley Space Sciences Laboratory under principal investigator Charles W. Carlson. The spacecraft launched 1996-08-21 at 09:47 UTC, not from a fixed pad but from the air: it rode a Pegasus-XL vehicle carried aloft beneath an L-1011 carrier aircraft staged from Vandenberg and released at altitude, igniting its first stage in flight. The air-launched Pegasus-XL deployment is a lean, agile way to send a small spacecraft to space, and it cross-links FAST to the v788 IBEX entry, the other NASA Small Explorer in the catalog launched on a Pegasus-XL vehicle. The deployment placed FAST into a high-inclination elliptical polar orbit chosen so the spacecraft would thread the auroral acceleration region repeatedly along the high-latitude field lines.

The signature of the mission is its high-time-resolution snapshot sampling. The auroral acceleration region holds fine structure in its particles and fields that changes rapidly, structure that slower sampling averages over, so to resolve it a mission must sample fast. FAST was built for that: its instruments could measure the particles and fields at a very high cadence, and its onboard burst-memory architecture could store short intervals of that very-high-cadence data, a snapshot of the rapidly changing structure captured faster than slower instruments could resolve it. Continuously storing very-high-cadence data would have overwhelmed the spacecraft's memory and downlink, so instead FAST held its burst memory ready and triggered the storage of a short interval of fast snapshot data on each auroral-zone crossing, the moment the spacecraft entered the region of interest. The buffered bursts were downlinked on later passes. This snapshot-and-store architecture is well suited to a small spacecraft sampling brief, rapidly changing structure: it concentrates the spacecraft's limited memory and downlink on the moments that matter.

The spacecraft was spin-stabilized, and the spin was integral to the measurement. As the spacecraft rotated, the wire-boom electric-field antennas and the particle detectors swept through the auroral fields and distributions, providing the angular sampling for the field-aligned and cross-field measurements. The spin rate and the spin axis were chosen so the angular sampling matched the high cadence of the burst-memory measurements. The focused instrument suite carried only what the auroral-physics objective required: the electrostatic analyzers for the high-time-resolution electron and ion distributions, the time-of-flight mass spectrograph for the ion composition, the fluxgate and search-coil magnetometers for the DC and wave magnetic fields, and the electric-field and Langmuir-probe instruments for the DC and wave electric fields and the plasma density. This lean design is the character of a Small Explorer, a spacecraft built around a single science question rather than a broad multi-objective campaign.

The science return reshaped the quantitative picture of the auroral acceleration region. FAST resolved the fine structure of the field-aligned currents, the parallel electric fields, and the electron and ion beams, showing in detail how the parallel potential drops accelerate the particles and how the upward and downward currents close the auroral circuit. The high-cadence snapshots captured the large-amplitude solitary structures and the small-scale electric fields that slower sampling had averaged over, connecting the wave activity, the currents, and the particle acceleration into a coherent model of how the solar wind energy reaches the visible aurora. Because the four instruments all sampled the same crossing at high cadence, the mission could relate the parallel electric field at a point to the particle beam it accelerated and to the field-aligned current it drove, testing the auroral-acceleration physics directly and advancing the quantitative model of auroral electrodynamics.

The axis-relevant substrate of FAST at this degree is the reopening of the near-Earth magnetosphere axis. The catalog had worked the magnetosphere in the substrate-era entries and then turned to the heliosphere boundary across nine observations; at v995 FAST returns the catalog to the magnetosphere with a chronologically-earlier auroral-physics anchor, the high-cadence snapshot mission that resolved the field-aligned currents and the particle beams of the auroral acceleration region. As the opening anchor of the reopened axis, FAST complements the substrate-era magnetosphere entries with an auroral-acceleration-region in-situ substrate distinct from their inner-magnetosphere and global-imaging substrates. The forward continuation favors further auroral and inner-magnetosphere missions, with DE-1 as a chronologically-earlier global-auroral-imaging predecessor.

FAST sustains two cross-axis cumulative substrate threads with the v788 IBEX entry. The SMEX-PROGRAM-CROSS-AXIS thread sustains at obs#2: the NASA Small Explorer program substrate now spans two axes, v788 IBEX on the heliosphere-boundary axis and v995 FAST on the reopened magnetosphere axis. The PEGASUS-XL-AIR-LAUNCH-CROSS-AXIS thread sustains at obs#2: the air-launched Pegasus-XL deployment substrate now spans two axes, v788 IBEX and v995 FAST. These cross-axis threads place FAST as the second Small Explorer and the second air-launched Pegasus-XL deployment in the catalog, both threads cross-linking the reopened magnetosphere axis back to the heliosphere-boundary axis through the shared mission architecture and deployment. The recurrence of the focused-objective small spacecraft across the two axes shows that a lean mission architecture can answer sharply defined questions in distinct domains.

The milestone produced the full canonical 14-deliverable set at `www/tibsfox/com/Research/NASA/1.186/` plus a WebGL2 auroral-snapshot viewer shader with four cycling modes (auroral curtains, field-aligned currents, particle beams, and high-cadence snapshot), rendering the bright folded curtains of the aurora, the upward and downward field-aligned currents along the high-latitude field lines, the field-aligned electron and ion beams, and the burst-mode snapshot sampling theme. The build resolved the predecessor v1.185 forward-link to record the actual FAST selection, updated both nav-card "next" cells on the v1.185 Cassini index to point to FAST, appended the 187th canonical-pairings entry (Round-leaved Sundew + Merlin + Operator-selectable S36) to both the TSV and JSON files, and codified retrospective lessons across all required surfaces.

The organism pairing for FAST is the Merlin (Falco columbarius) and the Round-leaved Sundew (Drosera rotundifolia). The Merlin is a small, fast, agile Pacific Northwest falcon known for rapid bursts of pursuit, so it enters as the rapid-response mirror to FAST's high-cadence snapshot sampling of the rapidly changing auroral acceleration region: as the Merlin commits to a brief fast dash to catch a fleeting target, FAST committed its burst memory to a fast snapshot of fleeting auroral structure. The Round-leaved Sundew is a Pacific Northwest carnivorous bog plant that moves its glandular tentacles rapidly in response to contact, one of the fastest movements in the plant world, mirroring FAST's rapid burst-mode measurement of fleeting auroral structure: as the Sundew responds rapidly to the moment of contact, FAST responded rapidly to the moment of the auroral-zone crossing. Both organisms share four alignments with FAST: a fast response to a fleeting moment, triggering on an event and committing, a small lean focused form, and a precise directed line to the target. The pairing brings a fast-pursuit falcon and a fast-response carnivorous bog plant to the catalog.

Several substrate-form distinctions separate FAST from the prior heliosphere-boundary axis entries. First, its science target: the auroral acceleration region of the near-Earth magnetosphere rather than the heliosphere boundary. Second, its vantage: a near-Earth high-inclination elliptical polar orbit rather than the L1, Earth-orbit, outer-heliosphere, or Saturn-orbit vantages. Third, its measurement style: high-time-resolution in-situ snapshots triggered on crossings rather than remote ENA imaging or slow in-situ records. Fourth, its architecture: a focused NASA Small Explorer air-launched on a Pegasus-XL rather than a dedicated imager, a flagship, or a deep-space probe. FAST also brings the field-aligned-current and auroral-electrodynamics science and the principal-investigator-led focused investigation, both new first-instance distinctions, and it reopens the magnetosphere substrate-axis as the twenty-fifth substrate-axis rotation. The engine state otherwise advances: the counter-cadence count is unchanged at 5, and MUS, ELC, SPS, and TRS all remain SCAFFOLD-PENDING at obs#69 cumulative.

## Mission Overview

FAST is the NASA Small Explorer high-cadence magnetosphere mission, managed by NASA Goddard Space Flight Center with the science led at the University of California Berkeley Space Sciences Laboratory under principal investigator Charles W. Carlson, the high-cadence auroral-acceleration-region snapshot mission that reopens the near-Earth magnetosphere substrate-axis.

| Fact | Value |
|---|---|
| Launch | 1996-08-21 at 09:47 UTC on a Pegasus-XL air-launched from an L-1011 carrier aircraft staged from Vandenberg |
| Management | NASA Goddard Space Flight Center (Small Explorer); science led at UC Berkeley Space Sciences Laboratory |
| Principal investigator | Charles W. Carlson (UC Berkeley Space Sciences Laboratory) |
| Program | NASA Small Explorer (SMEX) |
| Mission target | The auroral acceleration region of the near-Earth magnetosphere |
| Orbit | High-inclination elliptical polar orbit threading the auroral acceleration region |
| Configuration | Spin-stabilized small spacecraft with onboard burst memory |
| Measurement style | High-time-resolution snapshot sampling triggered on auroral-zone crossings |
| Science return | The field-aligned currents and the electron and ion beams that produce auroral light |
| Substrate-axis | MAGNETOSPHERE axis reopens at obs#1 first INSTANCE (SUBSTRATE-AXIS-ROTATION 25) |
| Distinction | The opening anchor of the reopened magnetosphere axis; the first high-cadence auroral-acceleration-region snapshot mission in the catalog |

## Key Features

| Feature | Description |
|---|---|
| High-cadence auroral-acceleration-region sampling | High-time-resolution snapshots of the particles and fields that drive the aurora |
| Burst-memory snapshot-and-store architecture | Short intervals of very-high-cadence data triggered on auroral-zone crossings |
| Field-aligned-current and auroral-electrodynamics science | The currents, fields, and particle beams connected into a coherent auroral model |
| Magnetosphere-axis reopening | SUBSTRATE-AXIS-ROTATION 25 reopens the near-Earth magnetosphere axis with FAST as obs#1 |
| NASA Small Explorer architecture | A focused-objective small spacecraft cross-linked to the v788 IBEX SMEX entry |
| Air-launched Pegasus-XL deployment | Launched from an L-1011 carrier aircraft, cross-linked to the v788 IBEX deployment |
| Principal-investigator-led investigation | Charles W. Carlson at the UC Berkeley Space Sciences Laboratory |
| High-inclination elliptical polar orbit | Threads the auroral acceleration region along the high-latitude field lines |
| Auroral-snapshot WebGL2 shader | Four cycling modes (auroral curtains, field-aligned currents, particle beams, high-cadence snapshot) |

## Structural firsts

**FAST-FIRST-INSTANCE:** FAST (Fast Auroral Snapshot Explorer) enters the catalog as the NASA Small Explorer high-cadence magnetosphere mission.

**SUBSTRATE-AXIS-ROTATION-25-FIRST-INSTANCE:** The twenty-fifth substrate-axis rotation, off INTERSTELLAR-BOUNDARY (obs#9 at v994) to the reopened magnetosphere axis.

**MAGNETOSPHERE-AXIS-REOPENING-FIRST-INSTANCE:** The reopening of the near-Earth magnetosphere substrate-axis with FAST as the opening anchor.

**AURORAL-ACCELERATION-REGION-HIGH-CADENCE-FIRST-INSTANCE:** The high-time-resolution snapshot sampling of the auroral acceleration region.

**HIGH-TIME-RESOLUTION-SNAPSHOT-MEASUREMENT-FIRST-INSTANCE:** The burst-memory snapshot-and-store measurement style.

**FIELD-ALIGNED-CURRENT-AURORAL-ELECTRODYNAMICS-FIRST-INSTANCE:** The field-aligned-current and auroral-electrodynamics science connecting the currents, the waves, and the particle acceleration.

**CHARLES-CARLSON-PI-FIRST-INSTANCE:** Charles W. Carlson, the FAST principal investigator at the University of California Berkeley Space Sciences Laboratory.

## Substrate Primary Axes

### NEW LOCKED at v995 (7 anchors)

- **FAST-FIRST-INSTANCE** obs#1 NEW LOCKED — FAST (Fast Auroral Snapshot Explorer) high-cadence magnetosphere mission first INSTANCE in the catalog
- **SUBSTRATE-AXIS-ROTATION-25-FIRST-INSTANCE** obs#1 NEW LOCKED — the twenty-fifth substrate-axis rotation, off INTERSTELLAR-BOUNDARY to the reopened magnetosphere axis
- **MAGNETOSPHERE-AXIS-REOPENING-FIRST-INSTANCE** obs#1 NEW LOCKED — the reopening of the near-Earth magnetosphere substrate-axis
- **AURORAL-ACCELERATION-REGION-HIGH-CADENCE-FIRST-INSTANCE** obs#1 NEW LOCKED — the high-time-resolution snapshot sampling of the auroral acceleration region
- **HIGH-TIME-RESOLUTION-SNAPSHOT-MEASUREMENT-FIRST-INSTANCE** obs#1 NEW LOCKED — the burst-memory snapshot-and-store measurement style
- **FIELD-ALIGNED-CURRENT-AURORAL-ELECTRODYNAMICS-FIRST-INSTANCE** obs#1 NEW LOCKED — the field-aligned-current and auroral-electrodynamics science
- **CHARLES-CARLSON-PI-FIRST-INSTANCE** obs#1 NEW LOCKED — Charles W. Carlson, the FAST principal investigator

### CUMULATIVE (cross-axis) at v995 (2 threads)

- **SMEX-PROGRAM-CROSS-AXIS** obs#2 cumulative — v788 IBEX (heliosphere boundary) + v995 FAST (magnetosphere); the NASA Small Explorer program substrate now spans two axes, sustaining cross-axis cumulative observational substrate at obs#2
- **PEGASUS-XL-AIR-LAUNCH-CROSS-AXIS** obs#2 cumulative — v788 IBEX + v995 FAST; the air-launched Pegasus-XL deployment substrate now spans two axes, sustaining at obs#2 cumulative

### ESTABLISHED disciplines applied (cumulative)

- SUBSTRATE-AXIS-ROTATION-DISCIPLINE obs#58 cumulative (axis rotates; SUBSTRATE-AXIS-ROTATION 25 to the reopened magnetosphere axis)
- POSITIVE-FRAMING-DISCIPLINE obs#72 cumulative
- DISPATCH-PROMPT-DENSITY-DISCIPLINE obs#21 cumulative
- IDENTIFIER-NOT-PROSE-DISCIPLINE obs#28 cumulative
- NAV-CARD-PAIR-DELIVERABLE-DISCIPLINE obs#17 cumulative
- PATH-A-FRESH-BUILD-PRECEDENT obs#18 cumulative
- W3.5-CHAPTER-GEN-BAKE-IN obs#25 cumulative
- README-RETROSPECTIVE-SECTIONS-REQUIREMENT obs#24 cumulative
- STORY-MD-NEWLINE-SEPARATOR-DISCIPLINE obs#32 cumulative
- DEDICATION-WORD-COUNT-DISCIPLINE obs#10 cumulative (≤200 words)

## Part A — Mission Deliverables (depth)

- **Canonical 14-deliverable set at `www/tibsfox/com/Research/NASA/1.186/`.** The full canonical mission directory: degree-sync.json, knowledge-nodes.json, data-sources.json, from-1.185.md, to-1.187.md, index.html, organism.md, organism.html, research.md, research.html, papers.html, mathematics.html, simulation.html, and curriculum.html, plus the artifacts/shaders subdirectory.
- **index.html with the canonical 12-card layout plus enrichment.** The index carries the v1.0 canonical card floor (Mission Summary, Mission Tracks, Resonance Axes, What to Build, TRY Sessions, DIY Projects, Creative Artifacts, Runnable Simulations, Interactive Lab, Forest Contribution, Data Files, Dedication), plus a Mission Journey narrative card, a Structural Firsts card, and a Governance & Chain Declarations card, plus six numbered resonance axes each with a mission paragraph and an organism pairing, plus a sidebar with the NASA Small Explorer / magnetosphere-explorer program-lineage table and a haiku card. The page passes both the canonical-layout gate (0 card deviations across all 187 missions) and the trip-vocab page check (PASS, zero primary and zero secondary classes in the title line and body), with an aurora-green/polar palette distinct from the predecessor.
- **Six resonance axes.** High-cadence snapshot sampling of the auroral acceleration region; the reopened magnetosphere substrate-axis; field-aligned currents and auroral electrodynamics; a NASA Small Explorer with an air-launched Pegasus-XL deployment; the SMEX and Pegasus-XL cross-axis cumulative threads at obs#2; and a principal-investigator-led focused investigation.
- **Mission Journey narrative card.** A multi-paragraph narrative (over 500 words) on the Small Explorer, the air-launch, the high-inclination elliptical polar orbit, the burst-mode snapshot sampling, the instrument suite, and the field-aligned-current and auroral-electrodynamics findings, framing FAST as the high-cadence anchor that reopens the magnetosphere axis.
- **organism.html at ≥3500 words.** The Merlin + Round-leaved Sundew pairing with the fast-pursuit and fast-response rapid-response mirrors drawn from observable behavior, with four explicit alignments, a behavioral-observation-notes section, and behavioral-description-only framing.
- **research.html / research.md deep research.** The Small Explorer and the air-launch, the high-inclination elliptical polar orbit, the high-cadence snapshot sampling and the burst-memory architecture, the field-aligned currents and auroral electrodynamics, the instrument suite, the auroral acceleration region in depth, the place in the magnetosphere fleet, and the cross-axis cumulative substrate threads.
- **mathematics.html threads.** The field-aligned current and the Knight relation, the gyrofrequency and the Nyquist sampling-cadence aliasing, the auroral acceleration potential structures and the parallel electric fields, the high-inclination elliptical polar-orbit geometry, the burst-memory snapshot-and-store duty cycle, and the auroral current circuit closure.
- **Two shader artifacts.** `auroral-snapshot-viewer.frag` (GLSL 3.30 core fragment shader, four cycling modes on the auroral-curtains, field-aligned-currents, particle-beams, and high-cadence-snapshot theme) plus a standalone WebGL2 `viewer.html` with a four-mode toggle, cadence slider, animated motion, and scene rotation; the viewer rewrites `#version 330 core` to `#version 300 es` at load.

## Part B — Catalog & Chain Deliverables (depth)

- **Predecessor forward-link resolved.** `www/tibsfox/com/Research/NASA/1.185/to-1.186.md` updated to record the actual FAST selection (the axis-rotation #25 to the reopened magnetosphere axis) in place of the prior "TBD per operator selection" lines, in both the forward-cadence body and the closing successor-anticipation lines.
- **Predecessor nav-card pair updated.** Both the top and bottom nav-card "next" cells in `www/tibsfox/com/Research/NASA/1.185/index.html` now point to `../1.186/index.html` with the label "FAST →" in place of the prior Series-Hub fallback.
- **Canonical-pairings TSV record appended.** The new record for degree 1.186 (Round-leaved Sundew / Merlin / Operator-selectable S36) was appended with a proper trailing newline, preserving the 15-column tab-delimited layout.
- **Canonical-pairings JSON 187th entry appended.** The corresponding 187th array entry for degree 1.186 was appended with the same pairing, preserving valid JSON and mirroring the existing entry structure (plant, animal, s36, sps_species_page, csv_refs).
- **STORY.md ground-truth entry appended.** A single v1.49.995 entry was appended to `.planning/roadmap/STORY.md` with a leading newline separator so the downstream append regex matches; the header "current version" line was advanced to v1.49.995.
- **Catalog indexes refreshed.** `node tools/update-catalog-indexes.mjs --write` was run to add 1.186 to the NASA landing-page completedMissions set so the pre-tag-gate catalog-index step passes on first try.
- **Release-notes README + chapter generation.** This README was authored to the 10-dimension rubric and the W3.5 chapter-generation pipeline was run to produce the chapter files for v1.49.995.
- **Nav-card pair on the new index.** The 1.186 index carries identical nav-card pairs at both the top and bottom of the body, with the previous cell pointing to v1.185 Cassini and the next cell pointing to the Series Hub (FAST is the new last mission).

## Decisions Made

- **FAST selected at v1.186** from the v1.185 to-1.186.md forward list. FAST was the axis-rotation #25 candidate (a), reopening the near-Earth magnetosphere substrate-axis at obs#1 with the high-cadence auroral-acceleration-region snapshot science — the headline structural rotation, returning the catalog to the magnetosphere with a chronologically-earlier auroral-physics anchor.
- **Magnetosphere axis reopened.** FAST reopens the magnetosphere substrate-axis that the heliosphere-boundary axis had preceded, complementing the substrate-era magnetosphere entries with an auroral-acceleration-region in-situ substrate.
- **SMEX cross-axis thread sustained at obs#2.** FAST sustains the SMEX-PROGRAM-CROSS-AXIS thread at obs#2 with v788 IBEX, recording the focused-objective Small Explorer architecture across two distinct substrate-axes.
- **Pegasus-XL cross-axis thread sustained at obs#2.** FAST sustains the PEGASUS-XL-AIR-LAUNCH-CROSS-AXIS thread at obs#2 with v788 IBEX, recording the air-launched Pegasus-XL deployment across two distinct substrate-axes.
- **Merlin + Round-leaved Sundew operator-default pairing.** A fast-pursuit falcon and a fast-response carnivorous bog plant mirror FAST's high-cadence snapshot sampling of the rapidly changing auroral acceleration region.
- **Path A fresh-build sub-agent dispatch authorized.** v995 sustains the Path A fresh-build precedent at obs#18 cumulative, using a single comprehensive build dispatch for all www/ deliverables, the canonical-pairings updates, the predecessor forward-link updates, the retrospective surfaces, and the W3.5 chapter-gen step.
- **Forward-anticipation candidates at v1.187.** A MAGNETOSPHERE-axis INTRA-AXIS continuation via DE-1 (Dynamics Explorer 1) global auroral imaging or a further inner-magnetosphere mission, enumerated in to-1.187.md.

## Lessons Learned

1. **A substrate-axis can be reopened to complement an earlier era.** FAST reopens the near-Earth magnetosphere axis that the substrate-era entries had worked, showing that a catalog can return to a prior domain with a chronologically-earlier anchor that complements rather than duplicates the earlier entries, an axis-reopening as a distinct kind of substrate continuation.
2. **A high-cadence snapshot approach resolves structure that slower sampling averages over.** FAST sampled the auroral acceleration region fast enough to resolve the fine structure of the field-aligned currents and the particle beams, showing that the sampling cadence is itself a substrate distinction: a fast snapshot mission records detail that a slower mission cannot.
3. **A burst-memory snapshot-and-store architecture concentrates limited resources on the moments that matter.** FAST held its burst memory ready and triggered on auroral-zone crossings, showing that a small spacecraft can capture brief, rapidly changing structure by concentrating its memory and downlink on the trigger events rather than spreading them across the whole orbit.
4. **A focused Small Explorer can answer a sharply defined science question.** FAST resolved the auroral electrodynamics from a lean, focused spacecraft built around one question, showing that a focused-objective small spacecraft can carry a powerful science return out of proportion to its size and budget.
5. **A mission architecture can recur across distinct substrate-axes as a cross-axis thread.** FAST sustains the SMEX-PROGRAM-CROSS-AXIS and PEGASUS-XL-AIR-LAUNCH-CROSS-AXIS threads at obs#2 with v788 IBEX, showing that a shared mission architecture and deployment can be recorded as a cumulative thread that spans two distinct substrate-axes.
6. **Coordinated high-cadence measurements build a coherent model.** Because the four FAST instruments sampled the same crossing at high cadence, the mission could relate the parallel field to the particle beam and the field-aligned current, showing that a coordinated, simultaneous measurement at high cadence builds a coherent physical account rather than a set of separate observations.
7. **A principal-investigator-led investigation can be a recordable first-instance distinction.** FAST records the Charles Carlson principal-investigator first instance, showing that the leadership of a focused science investigation can be a recordable substrate-anchor within a mission entry.
8. **A reference template carries forward cleanly across a distinct-palette mission.** Because FAST reuses the canonical card structure of the v1.185 template, the build preserved the structural template exactly and swapped the content to the auroral acceleration region with a distinct aurora-green/polar palette of deep dark, aurora green, aurora teal, beam cyan, field violet, and polar blue, making the distinct-palette mission a clean build.

## Surprises

- **A small spacecraft carried an outsized sampling cadence.** FAST, a small NASA Small Explorer, sampled the auroral acceleration region at a cadence fast enough to resolve structure that far larger and slower instruments had averaged over, a great cadence from a small platform.
- **A fast-response bog plant mirrors a high-cadence spacecraft.** The Round-leaved Sundew, which moves its tentacles in one of the fastest movements in the plant world, enters as the rapid-response mirror to the high-cadence snapshot mission, so the catalog pairs a fast carnivorous bog plant with a fast snapshot spacecraft.
- **An axis can reopen rather than only continue or rotate to a new domain.** The magnetosphere axis, which the heliosphere-boundary axis had preceded, reopens at FAST with a chronologically-earlier anchor, a reopening rather than a wholly new axis or a simple continuation.

## Retrospective

### What Worked

- **Single comprehensive build dispatch.** Per the established NASA streamlined T14 ship sequence pattern, the v995 build was scoped to a single dispatch covering all www/ deliverables, the canonical-pairings updates, the predecessor forward-link updates, the retrospective surfaces, and the W3.5 chapter-gen step.
- **Axis-rotation framing handled cleanly.** The magnetosphere-axis reopening was framed as SUBSTRATE-AXIS-ROTATION #25 with the prior INTERSTELLAR-BOUNDARY axis closed at obs#9 and the reopened MAGNETOSPHERE axis opened at obs#1, consistently across the index, the JSONs, the nav md files, and the README. The index trip-vocab page check returned PASS with zero primary and zero secondary classes in the title line and body.
- **Identifier-in-lists discipline preserved.** All substrate-anchor identifiers appear in bulleted lists, table cells, or anchor-pill spans rather than embedded in narrative paragraphs, satisfying the layout gate and the IDENTIFIER-NOT-PROSE-DISCIPLINE.
- **Dedication word-count discipline preserved.** Both the index.html dedication and the organism.html dedication are within the 200-word cap.
- **Reference template recognition.** The v1.185 Cassini template files were used as the immediate reference — same CSS structure, same nav-card pair pattern, same sidebar and track-grid patterns — with palette tokens renamed for FAST (--aurora-green, --aurora-teal, --beam-cyan, --field-violet, --polar-blue) and a distinct aurora-green/polar palette, and the structural template preserved exactly.
- **Pairing files updated in both formats.** The new canonical-pairings record was appended consistently to both the TSV (15-column tab-delimited) and the JSON (mirroring the existing entry structure), keeping the two data files in lockstep at 187 records.

### What Could Be Better

- **The shader renders procedural structure rather than archived data.** The auroral-snapshot shader uses analytic geometry and procedural noise rather than loading actual FAST electrostatic-analyzer, electric-field, or magnetometer data from the NASA Space Physics Data Facility. A future revision could load encoded FAST burst intervals for a higher-fidelity rendering keyed to the real auroral acceleration region.
- **The polar-orbit trajectory diorama is a forthcoming artifact.** The 3D-printable trajectory STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the high-inclination elliptical polar orbit threading the auroral acceleration region.
- **The magnetosphere program-lineage sidebar table is illustrative rather than exhaustive.** The sidebar lists representative program elements (FAST, IBEX, DE-1, THEMIS, Polar/IMAGE, RBSP/MMS) but does not enumerate the full magnetosphere fleet; a future revision could expand the table with launch dates and mission outcomes.
- **The field-aligned-current analysis is asserted rather than computed.** The relation between the field-aligned current and the parallel potential drop through the Knight relation is described but not run against archived data; a future ship could compute the relation from a FAST crossing.

## Cross-References

The FAST milestone connects to several prior catalog entries through shared substrate threads and program lineages:

| Referent | Relationship to FAST |
|---|---|
| **v1.185 Cassini-Huygens** | The immediate predecessor; the independent ENA-imaging vantage that closed the INTERSTELLAR-BOUNDARY axis at obs#9, off which FAST rotates |
| **v1.178 IBEX** | The NASA Small Explorer and air-launched Pegasus-XL cross-axis partner; FAST sustains both cross-axis threads at obs#2 |
| **Substrate-era RBSP / MMS** | Radiation-belt and reconnection in-situ magnetosphere science the reopened axis complements |
| **Substrate-era THEMIS** | Substorm and auroral-onset science the reopened axis complements |
| **Substrate-era Polar / IMAGE** | Global magnetospheric and auroral imaging the reopened axis complements |
| **DE-1 (forward candidate)** | The chronologically-earlier high-latitude global-auroral-imaging predecessor for v1.187 |

- **MAGNETOSPHERE axis lineage:** the reopened axis opens at **v995 FAST** and complements the substrate-era magnetosphere entries (**RBSP**, **MMS**, **THEMIS**, **Cluster**, **Geotail**, **Polar**, **IMAGE**); forward candidates in **to-1.187.md**.
- **SMEX-PROGRAM-CROSS-AXIS thread:** the FAST Small Explorer joins the **v788 IBEX** Small Explorer across two distinct substrate-axes.
- **PEGASUS-XL-AIR-LAUNCH-CROSS-AXIS thread:** the FAST air-launched Pegasus-XL deployment joins the **v788 IBEX** air-launched Pegasus-XL deployment across two distinct substrate-axes.
- **INTERSTELLAR-BOUNDARY axis (closed at v994):** see **v775 IMAP**, **v788 IBEX**, **v988 Wind**, **v989 Voyager 1**, **v990 Voyager 2**, **v991 Pioneer 10**, **v992 Pioneer 11**, **v993 New Horizons**, and **v994 Cassini**, off which FAST rotates.
- **Substrate-axis-rotation discipline:** see the prior rotations enumerated through **SUBSTRATE-AXIS-ROTATION-DISCIPLINE obs#58 cumulative**.

## Engine state

| Track | State at v995 |
|---|---|
| NASA degree | ADVANCED 1.185 → 1.186 |
| MUS degree | SCAFFOLD-PENDING obs#69 |
| ELC degree | SCAFFOLD-PENDING obs#69 |
| SPS species | SCAFFOLD-PENDING obs#69 |
| TRS | SCAFFOLD-PENDING obs#69 |

- **NASA degree:** ADVANCED 1.185 → 1.186 at v995 (counter_cadence: false)
- **MUS degree:** SCAFFOLD-PENDING obs#69 cumulative
- **ELC degree:** SCAFFOLD-PENDING obs#69 cumulative
- **SPS species:** SCAFFOLD-PENDING obs#69 cumulative
- **TRS M0 substrate:** SCAFFOLD-PENDING obs#69 cumulative

## Cross-track / Engine state full enumeration

| Thread | Count | Members |
|---|---|---|
| SMEX-PROGRAM-CROSS-AXIS | obs#2 | IBEX (heliosphere boundary) + FAST (magnetosphere) |
| PEGASUS-XL-AIR-LAUNCH-CROSS-AXIS | obs#2 | IBEX + FAST |
| SUBSTRATE-AXIS-ROTATION-DISCIPLINE | obs#58 | axis rotates; SUBSTRATE-AXIS-ROTATION 25 to the reopened magnetosphere axis |
| MAGNETOSPHERE axis (reopened) | obs#1 | FAST |

## Forward queue

- **v1.187 candidates:** a MAGNETOSPHERE-axis INTRA-AXIS continuation via DE-1 global auroral imaging or a further inner-magnetosphere mission.
- **MAGNETOSPHERE axis:** forward to obs#2 INTRA-AXIS continuation at v187+ on the reopened magnetosphere axis.
- **SMEX-PROGRAM-CROSS-AXIS thread:** forward to obs#3+ if another NASA Small Explorer enters the catalog.
- **PEGASUS-XL-AIR-LAUNCH-CROSS-AXIS thread:** forward to obs#3+ if another air-launched Pegasus-XL deployment enters the catalog.

## File inventory

- `.planning/missions/v1-49-995-nasa-1-186-fast/MISSION-BRIEF.md` — mission brief authored at v995
- `www/tibsfox/com/Research/NASA/1.186/` — 14-file canonical mission directory plus artifacts/shaders/
- `www/tibsfox/com/Research/NASA/1.185/to-1.186.md` — predecessor forward-link updated to record the FAST selection
- `www/tibsfox/com/Research/NASA/1.185/index.html` — predecessor nav-card pair updated to point to FAST
- `.planning/sps-s36-mapping/canonical-pairings.tsv` + `.json` — 1.186 entry appended (187th JSON entry)
- `.planning/roadmap/STORY.md` — v1.49.995 entry appended; header version advanced
- `docs/release-notes/v1.49.995/chapter/` — chapter files for the chapter-gen pipeline
- `tools/release-history/run-with-pg.mjs` — chapter-gen pipeline (W3.5 step)

## Engine Position

- **NASA degree:** ADVANCES 1.185 → 1.186 at v995 (counter_cadence: false)
- **Counter-cadence count:** 5 (UNCHANGED — v585, v776, v777, v778, v779)
- **MUS / ELC / SPS / TRS:** all SCAFFOLD-PENDING obs#69 cumulative
- **MAGNETOSPHERE axis:** reopens at obs#1 first INSTANCE (SUBSTRATE-AXIS-ROTATION 25)
- **SMEX and Pegasus-XL cross-axis threads:** obs#2 cumulative (the headline cross-axis continuation)

## Dedication

v1.186 FAST is dedicated to the small focused team that built and flew the Fast Auroral Snapshot Explorer: principal investigator Charles W. Carlson, who led the science investigation at the University of California Berkeley Space Sciences Laboratory; the University of California Berkeley Space Sciences Laboratory team who designed, built, and operated the high-cadence instrument suite of electrostatic analyzers, the time-of-flight mass spectrograph, the fluxgate and search-coil magnetometers, and the electric-field and Langmuir-probe instruments; and the NASA Goddard Space Flight Center Small Explorer team who managed the mission and the Pegasus-XL air-launch. It is dedicated as well to the wider community of auroral physicists whose work FAST advanced, resolving the field-aligned currents, the parallel electric fields, and the particle beams of the auroral acceleration region. FAST launched in 1996 on a Pegasus-XL vehicle air-launched from an L-1011 carrier aircraft, flew a high-inclination elliptical polar orbit threading the auroral acceleration region, and captured the high-time-resolution snapshots that connected the solar wind to the visible aurora, reopening the near-Earth magnetosphere substrate-axis as a focused, lean Small Explorer.
