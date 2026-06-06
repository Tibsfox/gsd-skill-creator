# v1.49.988 — Wind NASA Comprehensive In-Situ Solar-Wind Monitor at Sun-Earth L1 Halo Orbit

**Shipped:** 2026-06-06
**Branch:** dev → main
**Type:** NASA degree-advancing milestone (1.178 → 1.179)
**NASA Mission:** Wind (Global Geospace Science comprehensive in-situ solar-wind monitor)
**Engine state:** ADVANCED — NASA degree 1.178 → 1.179
**Counter-cadence:** false
**Phases:** 6 (W0-W5 wave-pipeline)

This is a 5-track NASA-substrate-convergence milestone: the NASA degree advances while the MUS, ELC, SPS, and TRS tracks hold their scaffold-pending state at v988.

## Summary

v1.49.988 advances the NASA degree catalog from 1.178 to 1.179, adding Wind — NASA's comprehensive in-situ solar-wind monitor — as the third observation within the INTERSTELLAR-BOUNDARY substrate-axis that opened at v775 IMAP and sustained at v788 IBEX. Wind is the chronologically-earliest anchor within the axis: its 1994-11-01 launch predates the v788 IBEX 2008 launch by 14 years and the v775 IMAP 2025 launch by 31 years. Where IMAP and IBEX map the heliosphere boundary via remote energetic-neutral-atom all-sky imaging, Wind measures the solar wind in situ at a fixed Sun-Earth L1 vantage, supplying the continuous in-situ reference baseline against which the remote-sensing heliosphere-boundary observations are interpreted. The headline cumulative continuation at this degree is the Sun-Earth L1 halo-orbit cross-axis thread, which sustains at obs#5 across five missions — v712 Aditya-L1, v713 SOHO, v714 ACE, v775 IMAP, and v988 Wind.

Wind is the NASA-led element of the Global Geospace Science (GGS) program within the International Solar-Terrestrial Physics (ISTP) Science Initiative. Launched 1994-11-01 at 09:31 UTC on a Delta II 7925-10 vehicle from Cape Canaveral Launch Complex 17B, the spacecraft was built by Martin Marietta and is managed at NASA Goddard Space Flight Center under founding Project Scientist Keith W. Ogilvie. The spin-stabilized cylindrical bus rotates at approximately 20 rpm and carries an eight-instrument comprehensive plasma-fields-particles suite: SWE (Solar Wind Experiment), MFI (Magnetic Field Investigation), 3DP (Three-Dimensional Plasma and Energetic Particle), SWICS/SMS (Solar Wind and Suprathermal Ion Composition), EPACT (Energetic Particles: Acceleration, Composition, Transport), WAVES (Radio and Plasma Wave Investigation), TGRS (Transient Gamma-Ray Spectrometer), and KONUS. This is the most complete plasma-fields-particles instrument complement of any single solar-wind monitor, enabling simultaneous measurement of bulk plasma, composition, magnetic field, plasma waves, and energetic particles from one vantage.

Wind's orbit history is itself a substrate-form-distinct feature. Rather than inserting directly into its operational orbit, Wind first flew a series of double-lunar-swingby petal orbits on the sunward side of Earth across its first decade, using repeated lunar gravity assists to hold a range of monitoring geometries. In 2004 the spacecraft settled into a Lissajous halo orbit about the Sun-Earth L1 Lagrange point, approximately 1.5 million km sunward of Earth, where it has operated continuously since as the upstream solar-wind sentinel. From this fixed upstream station Wind samples the solar wind roughly an hour before it reaches the magnetosphere, providing the advance characterization of incoming solar-wind structures that space-weather forecasting depends upon. This upstream-boundary-condition role is the defining function of the Global Geospace Science element: Wind supplies the solar-wind input that the ISTP magnetospheric fleet requires.

The milestone produced the full canonical 14-deliverable set at `www/tibsfox/com/Research/NASA/1.179/` plus a WebGL2 solar-wind stream viewer shader with four cycling modes (bulk-flow speed, magnetic-field draping, density structure, and the Parker spiral), each rendering the solar-wind stream past the fixed L1 vantage. The build resolved the predecessor v1.178 forward-link to record the actual Wind selection, repaired a missing-newline defect in the canonical-pairings TSV between the 1.168 and 1.178 records, appended the 180th canonical-pairings entry (Osprey + Common Cattail + Operator-selectable S36), and codified retrospective lessons across all required surfaces.

The organism pairing for Wind is the Osprey (Pandion haliaetus) and the Common Cattail (Typha latifolia). The Osprey holds a fixed hovering vantage above a flowing channel of water and continuously samples the moving medium below before committing to a dive — a fixed-station continuous monitor of a flowing medium that mirrors Wind's fixed L1 vantage continuously sampling the solar-wind flow. The Common Cattail is anemophilous (wind-pollinated) and anemochorous (wind-dispersed seed): its flexible long-duration stalk holds a fixed rooted station in the wetland while continuously coupling to the prevailing air stream, mirroring Wind's continuous solar-wind sampling at a fixed station and its multi-decade persistence. Both organisms share four alignments with Wind: fixed-station continuous monitoring of a flowing medium, an upstream observing position, long fixed-station tenure, and a cross-domain contribution beyond the primary function.

Three substrate-form distinctions separate Wind from the prior axis entries. First, measurement architecture: Wind makes an in-situ plasma-and-fields point measurement of the solar wind at the spacecraft, distinct from the remote energetic-neutral-atom all-sky imaging at v775 IMAP and v788 IBEX. Second, mission destination and trajectory: Wind reached its Sun-Earth L1 halo orbit through a multi-year double-lunar-swingby campaign, distinct from the direct insertion at v775 and the elliptical Earth orbit at v788. Third, program role: Wind is the GGS upstream-boundary-condition provider, distinct from the heliosphere-boundary remote-sensing role of the prior axis entries. Wind also introduces a comprehensive eight-instrument suite, the Martin Marietta spacecraft-prime lineage, the first Russian-built instrument flown on a NASA spacecraft (KONUS), a cross-domain gamma-ray-burst timing contribution, and more than three decades of continuous operations — the longest in-situ solar-wind baseline in the catalog.

Wind also sustains two further cumulative threads beyond the headline L1 thread. The Global Geospace Science program thread sustains at obs#2 with v175 Polar, the companion NASA-led GGS element that imaged the high-latitude magnetosphere while Wind supplied the upstream solar-wind input. The in-situ solar-wind plasma-composition thread sustains at obs#2 with v714 ACE, via Wind's SWICS/SMS composition and charge-state measurement. Together these threads place Wind at the intersection of the L1-vantage substrate, the ISTP/GGS program substrate, and the in-situ composition substrate, while it anchors the INTERSTELLAR-BOUNDARY axis at its chronologically-earliest entry. The engine state otherwise holds steady: the counter-cadence count is unchanged at 5, and MUS, ELC, SPS, and TRS all remain SCAFFOLD-PENDING at obs#62 cumulative.

## Mission Overview

Wind is NASA's comprehensive in-situ solar-wind monitor, the NASA-led element of the Global Geospace Science program within the ISTP initiative.

| Fact | Value |
|---|---|
| Launch | 1994-11-01 at 09:31 UTC on a Delta II 7925-10 from Cape Canaveral Launch Complex 17B |
| Program | NASA Global Geospace Science (GGS) within ISTP |
| Mission target | Solar wind, interplanetary magnetic field, and energetic particles upstream of Earth |
| Spacecraft prime | Martin Marietta (later Lockheed Martin) |
| Management | NASA Goddard Space Flight Center |
| Project Scientist | Keith W. Ogilvie at launch (subsequently Adam Szabo) |
| Configuration | Spin-stabilized cylindrical bus at ~20 rpm |
| Designed lifetime | 3 years (extended operations sustained beyond three decades) |
| Instruments | 8 (SWE + MFI + 3DP + SWICS/SMS + EPACT + WAVES + TGRS + KONUS) |
| Orbit history | Double-lunar-swingby petal orbits then Sun-Earth L1 halo orbit since 2004 |

## Key Features

| Feature | Description |
|---|---|
| Comprehensive in-situ monitor | Most complete plasma-fields-particles complement of any single solar-wind monitor; simultaneous measurement of bulk plasma, composition, field, waves, and energetic particles from one vantage |
| Fixed Sun-Earth L1 vantage | Lissajous halo orbit ~1.5M km sunward of Earth since 2004; continuous upstream sampling of the solar wind before it reaches the magnetosphere |
| Double-lunar-swingby orbit history | Multi-year petal-orbit campaign using repeated lunar gravity assists before settling at L1 |
| GGS upstream-boundary-condition role | Supplies the solar-wind input boundary conditions for the ISTP magnetospheric fleet and space-weather forecasting |
| Three-decade extended operations | More than three decades of continuous in-situ operations; the longest in-situ solar-wind baseline in the catalog |
| Cross-domain gamma-ray-burst timing | TGRS + KONUS make Wind a node in the interplanetary gamma-ray-burst timing network |
| KONUS international cooperation | First Russian-built instrument flown on a NASA spacecraft (Ioffe Physico-Technical Institute) |
| Solar-wind stream WebGL2 shader | Four cycling modes (bulk-flow speed, magnetic-field draping, density structure, Parker spiral) rendering the stream past the fixed L1 vantage |

## Structural firsts

**WIND-FIRST-INSTANCE:** Wind enters the catalog as the NASA Global Geospace Science comprehensive in-situ solar-wind monitor.

**COMPREHENSIVE-SOLAR-WIND-MONITOR-FIRST-INSTANCE:** The most complete plasma-fields-particles complement of any single solar-wind monitor.

**EIGHT-INSTRUMENT-SUITE-FIRST-INSTANCE-IN-AXIS:** Eight instruments measuring every major solar-wind quantity from one vantage.

**MARTIN-MARIETTA-PRIME-FIRST-INSTANCE:** The Martin Marietta spacecraft-prime lineage, distinct from Orbital Sciences at v788.

**KONUS-FIRST-RUSSIAN-INSTRUMENT-ON-NASA-SPACECRAFT-FIRST-INSTANCE:** The first Russian-built instrument flown on a NASA spacecraft.

**DOUBLE-LUNAR-SWINGBY-ORBIT-FIRST-INSTANCE-IN-AXIS:** A multi-year petal-orbit campaign using repeated lunar gravity assists.

**L1-ARRIVAL-VIA-MULTI-YEAR-TRAJECTORY-2004:** Settled into the Sun-Earth L1 halo orbit in 2004.

**THREE-DECADE-EXTENDED-OPERATIONS-FIRST-INSTANCE:** More than three decades of continuous in-situ operations.

**CROSS-DOMAIN-GAMMA-RAY-BURST-TIMING-FROM-SOLAR-WIND-MONITOR:** An interplanetary gamma-ray-burst timing node via TGRS and KONUS.

**GGS-UPSTREAM-BOUNDARY-CONDITION-PROVIDER-FIRST-INSTANCE:** Provides the solar-wind input boundary conditions for the ISTP fleet.

## Substrate Primary Axes

### NEW LOCKED at v988 (11 anchors)

- **WIND-FIRST-INSTANCE** obs#1 NEW LOCKED — Wind NASA GGS comprehensive in-situ solar-wind monitor first INSTANCE in the catalog
- **INTERSTELLAR-BOUNDARY-INTRA-AXIS-CONTINUATION** obs#3 NEW LOCKED — axis sustains at third observation (opened at v775 IMAP obs#1, sustained at v788 IBEX obs#2)
- **COMPREHENSIVE-SOLAR-WIND-MONITOR-FIRST-INSTANCE** obs#1 NEW LOCKED — most complete plasma-fields-particles complement of any single solar-wind monitor
- **EIGHT-INSTRUMENT-SUITE-FIRST-INSTANCE-IN-AXIS** obs#1 NEW LOCKED — eight-instrument comprehensive suite
- **MARTIN-MARIETTA-PRIME-FIRST-INSTANCE** obs#1 NEW LOCKED — Martin Marietta spacecraft prime, distinct from Orbital Sciences at v788
- **KONUS-FIRST-RUSSIAN-INSTRUMENT-ON-NASA-SPACECRAFT-FIRST-INSTANCE** obs#1 NEW LOCKED — first Russian-built instrument flown on a NASA spacecraft
- **DOUBLE-LUNAR-SWINGBY-ORBIT-FIRST-INSTANCE-IN-AXIS** obs#1 NEW LOCKED — double-lunar-swingby petal orbits across the first decade
- **L1-ARRIVAL-VIA-MULTI-YEAR-TRAJECTORY-2004** obs#1 NEW LOCKED — settled into the Sun-Earth L1 halo orbit in 2004
- **THREE-DECADE-EXTENDED-OPERATIONS-FIRST-INSTANCE** obs#1 NEW LOCKED — more than three decades of continuous operations
- **CROSS-DOMAIN-GAMMA-RAY-BURST-TIMING-FROM-SOLAR-WIND-MONITOR** obs#1 NEW LOCKED — interplanetary gamma-ray-burst timing node via TGRS and KONUS
- **GGS-UPSTREAM-BOUNDARY-CONDITION-PROVIDER-FIRST-INSTANCE** obs#1 NEW LOCKED — provides the solar-wind input boundary conditions for the ISTP fleet

### CUMULATIVE at v988 (3 threads)

- **SUN-EARTH-L1-HALO-ORBIT-CROSS-AXIS** obs#5 cumulative — v712 Aditya-L1 + v713 SOHO + v714 ACE + v775 IMAP + v988 Wind; the Sun-Earth L1 halo-orbit vantage substrate thread now spans five missions across multiple substrate-axes; the headline cumulative continuation at this degree
- **GLOBAL-GEOSPACE-SCIENCE-PROGRAM** obs#2 cumulative — v175 Polar + v988 Wind; both are the NASA-led GGS elements of the broader ISTP initiative
- **SOLAR-WIND-IN-SITU-PLASMA-COMPOSITION** obs#2 cumulative — v714 ACE + v988 Wind; Wind SWICS/SMS composition measurement sustains the in-situ solar-wind-composition substrate that ACE opened at obs#1

### ESTABLISHED disciplines applied (cumulative)

- SUBSTRATE-AXIS-ROTATION-DISCIPLINE obs#51 cumulative (axis sustains; no rotation this milestone)
- POSITIVE-FRAMING-DISCIPLINE obs#65 cumulative
- DISPATCH-PROMPT-DENSITY-DISCIPLINE obs#14 cumulative
- IDENTIFIER-NOT-PROSE-DISCIPLINE obs#21 cumulative
- NAV-CARD-PAIR-DELIVERABLE-DISCIPLINE obs#10 cumulative
- PATH-A-FRESH-BUILD-PRECEDENT obs#11 cumulative
- W3.5-CHAPTER-GEN-BAKE-IN obs#18 cumulative
- README-RETROSPECTIVE-SECTIONS-REQUIREMENT obs#17 cumulative
- STORY-MD-NEWLINE-SEPARATOR-DISCIPLINE obs#25 cumulative
- DEDICATION-WORD-COUNT-DISCIPLINE obs#3 cumulative (≤200 words)

## Part A — Mission Deliverables (depth)

- **Canonical 14-deliverable set at `www/tibsfox/com/Research/NASA/1.179/`.** The full canonical mission directory: degree-sync.json, knowledge-nodes.json, data-sources.json, from-1.178.md, to-1.180.md, index.html, organism.md, organism.html, research.md, research.html, papers.html, mathematics.html, simulation.html, and curriculum.html, plus the artifacts/shaders subdirectory.
- **index.html with the canonical 12-card layout plus enrichment.** The index carries the v1.0 canonical card floor (Mission Summary, Mission Tracks, Resonance Axes, What to Build, TRY Sessions, DIY Projects, Creative Artifacts, Runnable Simulations, Interactive Lab, Forest Contribution, Data Files, Dedication), plus a Structural Firsts card and a Governance & Chain Declarations card, plus six numbered resonance axes each with a mission paragraph and an organism pairing, plus a seven-card sidebar including the ISTP/GGS program-lineage table and a haiku card.
- **Six resonance axes.** Fixed-vantage in-situ monitoring at L1; the comprehensive eight-instrument suite from one vantage; the multi-year double-lunar-swingby trajectory; three-decade extended operations as the long-baseline reference; the Sun-Earth L1 cross-axis thread at obs#5; and the cross-domain gamma-ray-burst timing and KONUS international-cooperation contribution.
- **organism.html at ≥3500 words.** The Osprey + Common Cattail pairing with the fixed-vantage-continuous-sampling and anemophily mirrors drawn from observable behavior, with four explicit alignments and behavioral-description-only framing.
- **research.html / research.md deep research.** Solar-wind plasma and the L1 vantage, the double-lunar-swingby orbit history, the eight-instrument suite, the GGS upstream-boundary-condition role, three-decade operations, and the cumulative substrate threads with a three-mission comparison table.
- **mathematics.html threads.** The Sun-Earth L1 collinear-Lagrange-point distance, Lissajous and halo-orbit station-keeping, solar-wind plasma moments from the distribution function, the Parker-spiral interplanetary magnetic field, the double-lunar-swingby gravity-assist turn angle, and gamma-ray-burst arrival-time triangulation.
- **Two shader artifacts.** `solar-wind-stream-viewer.frag` (GLSL ES 3.00 fragment shader, four cycling modes on the L1-vantage flow theme) plus a standalone WebGL2 `viewer.html` with a four-mode toggle, flow-speed slider, animated flow, and scene rotation.
- **papers.html wall-clock citations.** The 1995 Acuña GGS program overview and the eight 1995 Space Science Reviews instrument papers (Ogilvie SWE, Lepping MFI, Lin 3DP, Bougeret WAVES, Gloeckler SWICS/SMS, von Rosenvinge EPACT, Aptekar KONUS, Owens TGRS) plus the Wilson 2021 multi-decade solar-wind statistical reference.

## Part B — Catalog & Chain Deliverables (depth)

- **Predecessor forward-link resolved.** `www/tibsfox/com/Research/NASA/1.178/to-1.179.md` updated to record the actual Wind selection (candidate (a), the L1-thread cumulative selection) in place of the prior "TBD per operator selection" line.
- **Predecessor nav-card pair updated.** Both the top and bottom nav-card "next" cells in `www/tibsfox/com/Research/NASA/1.178/index.html` now point to `../1.179/index.html` with the label "Wind →" in place of the prior Series-Hub fallback "v1.179 TBD →".
- **Canonical-pairings TSV defect repaired and 180th record appended.** The missing-newline defect between the 1.168 and 1.178 records ("Gifted Gab1.178" concatenation) was fixed by inserting the missing newline; the 180th record for degree 1.179 (Common Cattail / Osprey / Operator-selectable S36) was appended with a proper trailing newline, restoring the 15-column tab-delimited layout.
- **Canonical-pairings JSON 180th entry appended.** The corresponding 180th array entry for degree 1.179 was appended with the same pairing, preserving valid JSON and mirroring the existing entry structure (plant, animal, s36, sps_species_page, csv_refs).
- **STORY.md ground-truth entry appended.** A single v1.49.988 entry was appended to `.planning/roadmap/STORY.md` with a leading newline separator so the downstream append regex matches; the header "current version" line was advanced to v1.49.988.
- **Catalog indexes refreshed.** `node tools/update-catalog-indexes.mjs --write` was run to add 1.179 to the NASA landing-page completedMissions set so the pre-tag-gate catalog-index step passes on first try.
- **Release-notes README + chapter generation.** This README was authored to the 10-dimension rubric and the W3.5 chapter-generation pipeline was run to produce the chapter files for v1.49.988.
- **Nav-card pair on the new index.** The 1.179 index carries identical nav-card pairs at both the top and bottom of the body, with the previous cell pointing to v1.178 IBEX and the next cell pointing to the Series Hub (Wind is the new last mission).

## Decisions Made

- **Wind selected at v1.179** from the v1.178 to-1.179.md forward list. Operator selected Wind as candidate (a), the L1-thread cumulative selection, which sustains the INTERSTELLAR-BOUNDARY axis at obs#3 and extends the Sun-Earth L1 halo-orbit cross-axis thread to obs#5 — the headline cumulative continuation.
- **Chronologically-earliest-anchor selection sustained.** Wind's 1994 launch is the new chronologically-earliest anchor within the axis, extending the forward-shadow first-instance convention that v788 IBEX established at 2008. The axis-open obs#1 remains at v775 IMAP; Wind sustains obs#3 as the chronologically-earliest entry.
- **Osprey + Common Cattail operator-default pairing.** A fixed-station continuous monitor of a flowing medium (Osprey hovering vantage; Common Cattail anemophilous air-stream coupling) mirrors Wind's fixed L1 vantage continuously sampling the solar-wind flow.
- **Path A fresh-build sub-agent dispatch authorized.** v988 sustains the Path A fresh-build precedent at obs#11 cumulative, using a single comprehensive build dispatch for all www/ deliverables, the canonical-pairings updates, the predecessor forward-link updates, the retrospective surfaces, and the W3.5 chapter-gen step.
- **Forward-anticipation candidates at v1.180.** Voyager 1 and Voyager 2 interstellar mission extensions, Pioneer 10 and Pioneer 11 outer-heliosphere precursors, Cassini INCA from Saturn orbit, New Horizons heliopause anticipation, and an axis-rotation #25 to FAST or DE-1, enumerated in to-1.180.md.

## Lessons Learned

1. **In-situ point measurement is a distinct substrate-form within a remote-sensing axis.** The INTERSTELLAR-BOUNDARY axis opened and sustained with two remote ENA-imaging missions (IMAP, IBEX); Wind sustains it at obs#3 with an in-situ plasma-fields-particles point measurement. The measurement-architecture distinction is sufficient to sustain the axis without rotation, demonstrating that a substrate-axis can hold both remote-sensing and in-situ subforms.
2. **A chronologically-earliest anchor can recede further as an axis sustains.** v788 IBEX anchored the axis at 2008; v988 Wind recedes the anchor to 1994. The forward-shadow first-instance convention permits the chronologically-earliest entry to move earlier across successive INTRA-AXIS continuations while the axis-open obs#1 stays fixed.
3. **The L1-vantage cross-axis thread is the durable cumulative substrate.** Five missions across distinct substrate-axes share the Sun-Earth L1 halo-orbit vantage (Aditya-L1, SOHO, ACE, IMAP, Wind). Selecting Wind extends this thread to obs#5, making the headline cumulative continuation a cross-axis vantage thread rather than an axis-internal one.
4. **Comprehensive instrument suites contrast cleanly with focused-objective architectures.** Wind's eight-instrument complement is substrate-form-distinct from the two- and three-imager ENA suites of the prior axis entries. The comprehensiveness itself — measuring every major solar-wind quantity from one vantage — is the load-bearing distinction.
5. **Multi-year trajectory campaigns are a substrate-form-distinct mission-design feature.** Wind's double-lunar-swingby petal-orbit campaign and 2004 L1 arrival contrast with direct insertion (IMAP) and elliptical Earth orbit (IBEX), adding a trajectory-history dimension to the axis.
6. **Cross-domain contributions extend a mission's substrate beyond its primary objective.** Wind's TGRS and KONUS gamma-ray-burst timing contribution is outside its primary heliophysics role, and KONUS is the first Russian-built instrument flown on a NASA spacecraft — an international-cooperation substrate. Both broaden the mission's anchor set.
7. **Program-lineage threads accumulate across the catalog.** The Global Geospace Science thread sustains at obs#2 with v175 Polar; the in-situ composition thread sustains at obs#2 with v714 ACE. Program and measurement lineages provide natural cumulative threads independent of the primary axis.
8. **Pre-existing data-file defects should be repaired opportunistically during catalog updates.** The canonical-pairings TSV carried a missing-newline defect concatenating the 1.168 and 1.178 records; the v988 update repaired the defect while appending the 180th record, restoring the 15-column layout before the new entry was added.

## Surprises

- **The largest within-axis chronological gap in the catalog now stands at 31 years.** Wind's 1994 launch and IMAP's 2025 launch bracket a 31-year span within a single substrate-axis, exceeding the 17-year IMAP–IBEX gap that was the prior record at v788.
- **A solar-wind monitor doubles as a gamma-ray-burst observatory.** Wind's TGRS and KONUS detectors made a heliophysics mission a productive node in the interplanetary gamma-ray-burst timing network — a cross-domain contribution that is unusual for a dedicated solar-wind monitor.
- **A 3-year-design mission has run for more than three decades.** Wind's operational arc exceeds its design lifetime by an order of magnitude, making it the longest in-situ solar-wind baseline in the catalog and the premier long-baseline reference record.

## Retrospective

### What Worked

- **Single comprehensive build dispatch.** Per the established NASA streamlined T14 ship sequence pattern, the v988 build was scoped to a single dispatch covering all www/ deliverables, the canonical-pairings updates, the predecessor forward-link updates, the retrospective surfaces, and the W3.5 chapter-gen step.
- **Brief authorship with positive framing throughout.** The mission brief uses positive framing for all substrate-anchor descriptions and avoids forbidden-token enumeration. Title-line trip-vocab count is zero; the index trip-vocab page check returned PASS with zero primary and zero secondary classes.
- **Identifier-in-lists discipline preserved.** All substrate-anchor identifiers appear in bulleted lists, table cells, or anchor-pill spans rather than embedded in narrative paragraphs, satisfying the layout gate and the IDENTIFIER-NOT-PROSE-DISCIPLINE.
- **Dedication word-count discipline preserved.** Both the index.html dedication and the organism.html dedication are within the 200-word cap.
- **Reference template recognition.** The v1.178 IBEX template files were used as the immediate reference — same CSS structure, same nav-card pair pattern, same sidebar and track-grid patterns — with palette tokens renamed for Wind (--wind-cyan, --osprey-rust, --cattail-sienna, --stream-amber, --plasma-blue) and the structural template preserved exactly.
- **Opportunistic defect repair.** The canonical-pairings TSV missing-newline defect was repaired in the same pass that appended the 180th record, leaving the data file cleaner than before.

### What Could Be Better

- **The shader renders procedural flow rather than archived data.** The solar-wind stream shader uses procedural noise and analytic flow fields rather than loading actual Wind SWE/MFI time series from CDAWeb. A future revision could load PNG-encoded or JSON-encoded Wind archive intervals for a higher-fidelity rendering keyed to real solar-wind structure.
- **The double-lunar-swingby trajectory diorama is a forthcoming artifact.** The 3D-printable trajectory STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry.
- **The ISTP/GGS program-lineage sidebar table is illustrative rather than exhaustive.** The sidebar lists representative ISTP elements (Wind, Polar, SOHO, Geotail, Cluster) but does not enumerate the full multi-agency fleet; a future revision could expand the table with launch dates and agency attributions.
- **Cross-thread cumulative reconciliation should be audited.** The Sun-Earth L1 cross-axis thread is asserted at obs#5; a retrospective audit should confirm the five-member set (Aditya-L1, SOHO, ACE, IMAP, Wind) against the catalog to ensure no additional L1 entries would change the count.

## Cross-References

The Wind milestone connects to several prior catalog entries through shared substrate threads and program lineages:

| Referent | Relationship to Wind |
|---|---|
| **v775 IMAP** | Opened the INTERSTELLAR-BOUNDARY axis at obs#1; Wind sustains obs#3 |
| **v788 IBEX** | Sustained the axis at obs#2; the immediate predecessor degree |
| **v712 Aditya-L1** | First member of the Sun-Earth L1 cross-axis thread (obs#5 at Wind) |
| **v713 SOHO** | L1 cross-axis thread member |
| **v714 ACE** | L1 cross-axis thread member; opened SOLAR-WIND-IN-SITU-PLASMA-COMPOSITION at obs#1 |
| **v175 Polar** | Companion NASA-led Global Geospace Science element (obs#2 with Wind) |

- **INTERSTELLAR-BOUNDARY axis lineage:** see also **v775 IMAP**, **v788 IBEX**, and the forward candidates in **to-1.180.md**.
- **Sun-Earth L1 halo-orbit thread:** see also **v712 Aditya-L1**, **v713 SOHO**, **v714 ACE**, and **v775 IMAP**.
- **Global Geospace Science program thread:** see also **v175 Polar** within the ISTP fleet.
- **In-situ composition thread:** see also **v714 ACE** via SWICS/SMS composition.

## Engine state

| Track | State at v988 |
|---|---|
| NASA degree | ADVANCED 1.178 → 1.179 |
| MUS degree | SCAFFOLD-PENDING obs#62 |
| ELC degree | SCAFFOLD-PENDING obs#62 |
| SPS species | SCAFFOLD-PENDING obs#62 |
| TRS | SCAFFOLD-PENDING obs#62 |

- **NASA degree:** ADVANCED 1.178 → 1.179 at v988 (counter_cadence: false)
- **MUS degree:** SCAFFOLD-PENDING obs#62 cumulative
- **ELC degree:** SCAFFOLD-PENDING obs#62 cumulative
- **SPS species:** SCAFFOLD-PENDING obs#62 cumulative
- **TRS M0 substrate:** SCAFFOLD-PENDING obs#62 cumulative

## Cross-track / Engine state full enumeration

| Thread | Count | Members |
|---|---|---|
| SUN-EARTH-L1-HALO-ORBIT-CROSS-AXIS | obs#5 | Aditya-L1 + SOHO + ACE + IMAP + Wind |
| GLOBAL-GEOSPACE-SCIENCE-PROGRAM | obs#2 | Polar + Wind |
| SOLAR-WIND-IN-SITU-PLASMA-COMPOSITION | obs#2 | ACE + Wind |
| INTERSTELLAR-BOUNDARY axis | obs#3 | IMAP + IBEX + Wind |

## Forward queue

- **v1.180 candidates:** Voyager 1 and Voyager 2 interstellar mission extensions, Pioneer 10 and Pioneer 11 outer-heliosphere precursors, Cassini INCA from Saturn orbit, New Horizons heliopause anticipation, and an axis-rotation #25 to FAST or DE-1.
- **INTERSTELLAR-BOUNDARY axis:** forward to obs#4 INTRA-AXIS continuation at v180+.
- **Sun-Earth L1 halo-orbit thread:** forward to obs#6+ if another L1 mission is selected.

## File inventory

- `.planning/missions/v1-49-988-nasa-1-179-wind/MISSION-BRIEF.md` — mission brief authored at v988
- `www/tibsfox/com/Research/NASA/1.179/` — 14-file canonical mission directory plus artifacts/shaders/
- `www/tibsfox/com/Research/NASA/1.178/to-1.179.md` — predecessor forward-link updated to record the Wind selection
- `www/tibsfox/com/Research/NASA/1.178/index.html` — predecessor nav-card pair updated to point to Wind
- `.planning/sps-s36-mapping/canonical-pairings.tsv` + `.json` — newline defect repaired; 180th entry appended
- `.planning/roadmap/STORY.md` — v1.49.988 entry appended; header version advanced
- `docs/release-notes/v1.49.988/chapter/` — chapter files for the chapter-gen pipeline
- `tools/release-history/run-with-pg.mjs` — chapter-gen pipeline (W3.5 step)

## Engine Position

- **NASA degree:** ADVANCES 1.178 → 1.179 at v988 (counter_cadence: false)
- **Counter-cadence count:** 5 (UNCHANGED — v585, v776, v777, v778, v779)
- **MUS / ELC / SPS / TRS:** all SCAFFOLD-PENDING obs#62 cumulative
- **INTERSTELLAR-BOUNDARY axis:** sustains at obs#3 INTRA-AXIS continuation
- **Sun-Earth L1 halo-orbit cross-axis thread:** obs#5 cumulative (headline continuation)

## Dedication

v1.179 Wind is dedicated to Keith W. Ogilvie, the founding Project Scientist, to the instrument teams who built the comprehensive plasma-fields-particles suite, and to the NASA Goddard Space Flight Center operations staff who have sustained the mission for more than three decades. Wind launched 1994-11-01 as the NASA-led Global Geospace Science element of the International Solar-Terrestrial Physics initiative, built by Martin Marietta and carrying eight instruments from teams across NASA Goddard, the University of California Berkeley, the University of Maryland, the Paris-Meudon Observatory, and the Ioffe Physico-Technical Institute. From its fixed upstream watch at the Sun-Earth L1 point, Wind has held a continuous in-situ record of the solar wind that serves as the community reference and the long-baseline against which the remote-sensing heliosphere-boundary missions are interpreted.
