# v1.49.788 — IBEX NASA Interstellar Boundary Explorer SMEX-Class Earth-Orbit Energetic-Neutral-Atom All-Sky Imaging Mission

**Shipped:** 2026-05-26
**Branch:** dev → main
**Type:** NASA degree-advancing milestone (1.177 → 1.178)
**Counter-cadence:** false

## Summary

v1.49.788 advances the NASA degree catalog from 1.177 to 1.178, adding IBEX (Interstellar Boundary Explorer) as the second observation within the INTERSTELLAR-BOUNDARY substrate-axis that opened at v775 IMAP. IBEX is the chronologically-earliest anchor within the axis — its 2008-10-19 launch predates the v775 IMAP 2025 launch by 17 years — and substrate-form-distinct via SMEX program-class, Pegasus-XL air-launch substrate, elliptical Earth-orbit vantage, two-ENA-imager suite, and ~107 kg small-spacecraft form.

The milestone produced the full canonical 14-deliverable set at `www/tibsfox/com/Research/NASA/1.178/` plus a WebGL2 IBEX Ribbon all-sky ENA viewer shader, updated the predecessor v1.177 forward-link to resolve the TBD reference, appended the 179th canonical-pairings entry (Anna's Hummingbird + Western Wood Sorrel + Operator-selectable S36), and codified retrospective lessons across all five required surfaces.

## Mission Overview

IBEX (Interstellar Boundary Explorer) is NASA's Small Explorer (SMEX) class single-spacecraft heliophysics mission for mapping the boundary of the heliosphere via two-band coordinated energetic-neutral-atom imaging.

| Fact | Value |
|---|---|
| Launch | 2008-10-19T17:47Z from a Stargazer L-1011 carrier aircraft via Pegasus-XL |
| Program class | NASA Small Explorer (SMEX) — tenth mission |
| Orbit (initial) | Highly-elliptical Earth orbit (~7,000 km perigee × ~320,000 km apogee) |
| Orbit (extended) | 3:1 lunar-synchronous after 2011 orbit-raising maneuver |
| Spacecraft prime | Orbital Sciences Corporation (Dulles, Virginia) |
| Lead institution | Southwest Research Institute (San Antonio, Texas) |
| Principal Investigator | David J. McComas (SwRI at launch, subsequently Princeton) |
| Total launch mass | ~107 kg |
| Designed lifetime | 2 years (extended operations sustained more than a decade) |
| Instruments | 2 ENA imagers (IBEX-Lo at 10 eV-2 keV + IBEX-Hi at 0.3-6 keV) |
| All-sky map cadence | 6 months via slow spin (~4 rpm) + orbital motion |

## Substrate Primary Axes

### NEW LOCKED at v788 (11 anchors)

- **IBEX-FIRST-INSTANCE** obs#1 NEW LOCKED — IBEX NASA SMEX heliophysics mission first INSTANCE in the catalog
- **INTERSTELLAR-BOUNDARY-INTRA-AXIS-CONTINUATION** obs#2 NEW LOCKED — axis sustains at second observation (opened at v775 IMAP obs#1)
- **IBEX-RIBBON-DISCOVERY-FIRST-INSTANCE** obs#1 NEW LOCKED — October 2009 first all-sky ENA maps revealed the Ribbon, a structure unanticipated by every pre-launch heliosphere model
- **SMEX-CLASS-MISSION-FIRST-INSTANCE-IN-AXIS** obs#1 NEW LOCKED — NASA Small Explorer program class, distinct from LWS flagship at v775
- **PEGASUS-XL-AIR-LAUNCH-FIRST-INSTANCE-IN-AXIS** obs#1 NEW LOCKED — air-launch substrate distinct from every prior ground-launch
- **ELLIPTICAL-EARTH-ORBIT-VANTAGE-FIRST-INSTANCE-IN-AXIS** obs#1 NEW LOCKED — initial highly-elliptical Earth orbit, distinct from L1 vantage at v775
- **2-ENA-IMAGER-SUITE-FIRST-INSTANCE-IN-AXIS** obs#1 NEW LOCKED — two coordinated imagers, distinct from three-imager suite at v775
- **ALL-SKY-ENA-MAP-OBSERVATIONAL-CADENCE-FIRST-INSTANCE** obs#1 NEW LOCKED — full-sky map every six months via spin + orbital motion
- **ORBITAL-SCIENCES-PRIME-FIRST-INSTANCE** obs#1 NEW LOCKED — Orbital Sciences Corporation spacecraft prime
- **SWRI-LEAD-INSTITUTION-FIRST-INSTANCE** obs#1 NEW LOCKED — Southwest Research Institute lead institution
- **LUNAR-SYNCHRONOUS-ORBIT-RAISE-2011** obs#1 NEW LOCKED — 2011 maneuver to 3:1 lunar-synchronous orbit for extended-mission operations

### CUMULATIVE at v788 (4 threads)

- **DAVID-J-MCCOMAS-PI** obs#2 cross-mission cumulative — v775 IMAP (Princeton) + v788 IBEX (SwRI at launch); McComas continued from IBEX leadership at SwRI through to IMAP leadership at Princeton, sustaining a leadership thread across more than 17 years
- **ENA-IMAGING-CROSS-AXIS** obs#3 cumulative — v774 IMAGE (magnetosphere) + v775 IMAP (heliosphere from L1) + v788 IBEX (heliosphere from Earth elliptical orbit); the ENA-imaging substrate thread now spans three missions across two substrate-axes
- **HELIOSPHERE-IMAGING-VIA-ENA** obs#2 axis-internal cumulative — v775 IMAP + v788 IBEX; heliosphere-specific ENA-imaging substrate complementing the broader cross-axis ENA thread
- **INNER-HELIOSPHERE-PARTICLE-ACCELERATION-MEASUREMENT** obs#2 cumulative — v775 IMAP + v788 IBEX; IBEX-Hi at energies up to 6 keV contributes to inner-heliosphere energetic particle characterization

### ESTABLISHED disciplines applied (cumulative)

- SUBSTRATE-AXIS-ROTATION-DISCIPLINE obs#50 cumulative (axis sustains; no rotation this milestone)
- POSITIVE-FRAMING-DISCIPLINE obs#64 cumulative
- DISPATCH-PROMPT-DENSITY-DISCIPLINE obs#13 cumulative
- IDENTIFIER-NOT-PROSE-DISCIPLINE obs#20 cumulative
- NAV-CARD-PAIR-DELIVERABLE-DISCIPLINE obs#9 cumulative
- PATH-A-FRESH-BUILD-PRECEDENT obs#10 cumulative
- W3.5-CHAPTER-GEN-BAKE-IN obs#17 cumulative
- README-RETROSPECTIVE-SECTIONS-REQUIREMENT obs#16 cumulative
- STORY-MD-NEWLINE-SEPARATOR-DISCIPLINE obs#24 cumulative
- DEDICATION-WORD-COUNT-DISCIPLINE obs#2 cumulative (≤200 words)

## Substrate-Form-Distinctness from v1.177

v788 IBEX sustains the INTERSTELLAR-BOUNDARY axis at obs#2 INTRA-AXIS continuation. The axis opened at v775 IMAP first INSTANCE obs#1. IBEX is substrate-form-distinct from IMAP across nine independent dimensions:

| Dimension | v775 IMAP | v788 IBEX |
|---|---|---|
| Program class | NASA LWS flagship | NASA SMEX (Small Explorer) — tenth mission |
| Mission destination | Sun-Earth L1 Lissajous halo orbit (~1.5M km sunward) | Elliptical Earth orbit raised to 3:1 lunar-synchronous in 2011 |
| Spacecraft prime | Johns Hopkins APL | Orbital Sciences Corporation |
| Lead institution | Princeton University | Southwest Research Institute |
| Launch site + vehicle | Kennedy Space Center on SpaceX Falcon 9 | Stargazer L-1011 carrier aircraft over central Pacific on Pegasus-XL |
| ENA imager count | 3 imagers covering 10 eV-300 keV | 2 imagers covering 10 eV-6 keV |
| Other instruments | MAG + SWAPI + SWE + CoDICE + HIT + GLOWS + IDEX | None (ENA-only) |
| Total spacecraft mass | ~750 kg launch | ~107 kg launch |
| Chronological anchor | 2025 launch | 2008 launch (17 years earlier) |

The chronologically-earliest-anchor selection at v788 is load-bearing: IBEX establishes the foundational ENA-imaging-of-heliosphere observational cadence that IMAP extends with three-band coverage at higher angular and energy resolution. Selecting IBEX after IMAP in the catalog (rather than before) is a deliberate choice to anchor the substrate-axis at IMAP's opening obs#1 and then sustain backward to the chronologically-earliest entry.

## IBEX Ribbon Discovery Section

First all-sky ENA maps from IBEX-Hi released October 2009 revealed a narrow bright band of enhanced ENA emission encircling the sky — the IBEX Ribbon.

- **Angular extent:** approximately 300 degrees of arc at heliographic latitudes near the ecliptic
- **Angular width:** approximately 20 degrees
- **Brightness contrast:** 2-3 times higher than the globally-distributed background
- **Pre-launch model prediction:** none — every pre-launch heliosphere boundary model failed to predict the Ribbon
- **Leading origin model:** secondary ENA from charge-exchange of heliosheath protons along magnetic field lines locally perpendicular to the line of sight (Schwadron 2009; Heerikhuisen 2010)
- **Local interstellar magnetic field direction (inferred from Ribbon geometry):** approximately (l=210 deg, b=-60 deg) in galactic coordinates
- **Scientific impact:** the discovery established IBEX as one of the most scientifically productive small-explorer missions in NASA history

The Ribbon's origin remains an active research question; the v775 IMAP-Hi instrument is positioned to refine the Ribbon characterization with higher angular resolution (a few degrees) and improved energy resolution, enabling discrimination among competing origin models.

## Mission Lifetime Section

IBEX launched 2008-10-19 with a 2-year primary design lifetime. The spacecraft sustained operations across more than a decade through two enabling factors:

1. **2011 lunar-synchronous orbit raise.** In June 2011 IBEX executed an orbit-raising maneuver to enter a 3:1 lunar-synchronous orbit (period commensurate with the lunar synodic month divided by 3, approximately 9.84 days). The new orbit places IBEX in a gravity-stable resonance with the Moon, reducing perturbations and extending the operational lifetime by reducing station-keeping fuel consumption. LUNAR-SYNCHRONOUS-ORBIT-RAISE-2011 obs#1 NEW LOCKED at v788.

2. **Six-month all-sky map cadence accumulation.** IBEX produced time-resolved all-sky ENA maps every six months across the full mission lifetime, building a multi-year baseline that traces the heliosphere boundary evolution across a complete solar cycle. The Reisenfeld 2021 three-dimensional heliosphere reconstruction synthesized maps across multiple six-month cadences to produce the first three-dimensional shape model.

## Decisions Made

- **IBEX selected at v1.178** from the v1.177 to-1.178.md forward list. Operator selected IBEX as the chronologically-earliest-anchor within the newly-opened INTERSTELLAR-BOUNDARY axis (2008 launch predates the 2025 IMAP launch by 17 years) plus cross-mission cumulative threads via DAVID-J-MCCOMAS-PI + HELIOSPHERE-IMAGING-VIA-ENA + ENA-IMAGING-CROSS-AXIS.
- **Anna's Hummingbird + Western Wood Sorrel operator-default pairing.** Compact small-form year-round resident bird with iridescent all-direction gorget signaling mirrors IBEX SMEX-class small-spacecraft all-sky ENA mapping geometry; photonastic understory ground-cover with leaflet all-incidence-angle light sampling mirrors IBEX spin-stabilized all-direction sampling cadence and extended-mission operations beyond design lifetime.
- **Path A fresh-build sub-agent dispatch authorized.** Eight consecutive Path A fresh-builds were followed by Path C escalation at v775; subsequent ships re-established Path A precedent; v788 sustains the Path A pattern at obs#10 cumulative.
- **Single comprehensive build dispatch.** Per NASA streamlined T14 ship sequence pattern (memory: nasa-ship-sequence-streamlined), v788 used a single comprehensive sub-agent dispatch for all 14 www/ deliverables + shader artifacts + retrospective surfaces, with W3.5 chapter-gen embedded in the dispatch deliverable list.
- **Forward-anticipation candidates at v1.179.** Wind, Voyager 1+2 interstellar mission extensions, Pioneer 10+11, Cassini INCA from Saturn orbit, and New Horizons heliopause anticipation observations enumerated in to-1.179.md.

## Lessons Learned

- **Chronologically-earliest-anchor selection is load-bearing for newly-opened substrate-axes.** When a substrate-axis opens at obs#1 with a contemporary mission (v775 IMAP 2025), the obs#2 selection of a chronologically-earlier mission (v788 IBEX 2008) anchors the axis backward to its foundational entry. The forward-shadow first-instance convention is preserved: the axis-open obs#1 remains at v775 IMAP, with v788 IBEX sustaining obs#2 as the chronologically-earliest anchor rather than first INSTANCE.
- **Substrate-form-distinctness across nine dimensions sustains the axis without rotation.** v788 IBEX is substrate-form-distinct from v775 IMAP across program class, destination, prime, lead institution, launch vehicle and substrate, instrument count, mass, year, and observational geometry. The nine-dimension distinctness sustains the axis at obs#2 INTRA-AXIS continuation without triggering axis-rotation.
- **Cross-mission PI threads extend substrate-cumulative observations naturally.** David J. McComas led IBEX from SwRI in 2008 and IMAP from Princeton in 2025; the DAVID-J-MCCOMAS-PI thread sustains at obs#2 cross-mission cumulative across two institutions and two mission-class scales.
- **SMEX small-explorer architectures reach high scientific productivity per dollar.** IBEX's two-imager suite and ~107 kg mass produced the Ribbon discovery — a fundamental discovery unanticipated by every pre-launch model — at a fraction of the flagship-class mission cost. The SMEX program substrate-form is operationally distinct from the LWS flagship substrate-form at v775 IMAP and complements rather than competes with it.
- **Air-launch substrate enables small-mission flexibility.** The Pegasus-XL air-launch from the Stargazer L-1011 over the central Pacific is substrate-form-distinct from every prior NASA-axis ground-launch vehicle. The carrier-aircraft architecture provides a fly-anywhere capability that ground-launch substrates do not match.

## Surprises

- **The 2008 IBEX launch chronologically predates not only the v775 IMAP 2025 launch but also several missions that appear later in the substrate-axis ordering.** This is consistent with the catalog's substrate-axis ordering by axis-opening date rather than chronological launch date, but the 17-year gap between IMAP and IBEX is the largest within-axis chronological gap in the catalog to date.
- **The IBEX Ribbon was unanticipated by every pre-launch heliosphere boundary model.** No 2007 model published before the October 2009 IBEX-Hi map release predicted a bright narrow great-circle arc; the discovery was a genuine surprise to the heliophysics community.
- **The 2011 orbit-raise to 3:1 lunar-synchronous resonance extended IBEX's operational lifetime by an order of magnitude beyond the 2-year design.** The orbit-raise maneuver was not part of the original mission design; the extended-mission substrate emerged as an operational optimization during the primary mission.

## What Worked

- **Single comprehensive sub-agent dispatch.** Per the established NASA T14 streamlined ship sequence pattern, the v788 build was scoped to a single sub-agent dispatch covering all www/ deliverables, the canonical-pairings update, the predecessor forward-link update, the retrospective surfaces, and the W3.5 chapter-gen step. The pattern reduced wall-clock to single-digit ship-minutes for the build phase.
- **Brief authorship with positive framing throughout.** The mission brief (.planning/missions/v1-49-788-nasa-1-178-ibex/MISSION-BRIEF.md) uses positive framing for all substrate-anchor descriptions and avoids forbidden-token enumeration (per Lesson #10406). Title-line trip-vocab count is zero; secondary trip-vocab classes are absent from the brief body.
- **Identifier-in-lists discipline preserved.** All substrate-anchor identifiers appear in bulleted lists, table cells, or anchor-pill spans rather than embedded in narrative paragraphs (per IDENTIFIER-NOT-PROSE-DISCIPLINE obs#20 cumulative).
- **Dedication word-count discipline preserved.** Both the index.html dedication and the organism.html dedication are within the 200-word cap (per DEDICATION-WORD-COUNT-DISCIPLINE obs#2 cumulative).
- **Reference template recognition.** The v1.177 IMAP template files were used as the immediate reference for v788 layout — same CSS structure, same nav-card pattern (top + bottom), same sidebar pattern, same track-grid pattern. Palette tokens were renamed for IBEX (--ibex-violet, --hummingbird-magenta, --sorrel-green, --ribbon-amber) but the structural template was preserved exactly.

## What Could Be Better

- **Shader artifact is functional but minimal.** The IBEX Ribbon WebGL2 shader at artifacts/shaders/ibex-ribbon-viewer.frag renders a procedural Ribbon arc based on a synthetic B_LISM direction rather than loading actual IBEX archive ENA brightness maps. A future revision could load PNG-encoded maps from the IBEX Data Center at SwRI for a higher-fidelity rendering.
- **Cross-axis cumulative thread reconciliation across v775 and v788 should be audited.** The DAVID-J-MCCOMAS-PI thread is obs#2 cross-mission cumulative at v788; the catalog convention is that the obs#1 NEW LOCKED at v775 implicitly assumed the cumulative thread would emerge if a future McComas-led mission entered the catalog. The v788 ship validates the thread; a retrospective audit should confirm no other catalog entries reference McComas as PI that would inflate the cumulative count.
- **Anna's Hummingbird + Western Wood Sorrel pairing rationale is somewhat indirect.** The compact small-form alignment is direct; the all-direction sampling alignment is direct for both organisms; the extended-tenure alignment is direct. The cultural-significance alignment is present but less direct than the equivalent v775 Sooty Shearwater + Pacific Yew Indigenous-traditions alignment. Operator may revisit the pairing if a closer-fitting substrate emerges.
- **The forward-anticipation list at to-1.179.md does not yet include any Cassini extended-mission INCA observations from the late-Cassini Saturn orbit.** Cassini INCA is currently listed as candidate (f); the full Cassini Saturn-orbit ENA observation campaign spanned multiple years and provided cross-vantage Ribbon confirmation from a non-L1 non-Earth-orbit geometry. The forward-anticipation may strengthen at v1.179 if Cassini is selected.

## Related Artifacts

- `.planning/missions/v1-49-788-nasa-1-178-ibex/MISSION-BRIEF.md` — mission brief authored at v788
- `www/tibsfox/com/Research/NASA/1.178/` — 14-file canonical mission directory plus artifacts/shaders/
- `www/tibsfox/com/Research/NASA/1.177/to-1.178.md` — predecessor forward-link updated to resolve TBD reference
- `.planning/sps-s36-mapping/canonical-pairings.tsv` + `.json` — 179th entry appended
- `.planning/roadmap/STORY.md` — v1.49.788 entry appended; header version updated
- `docs/release-notes/v1.49.788/chapter/` — chapter files for the chapter-gen pipeline
- `tools/release-history/run-with-pg.mjs` — chapter-gen pipeline (W3.5 step)
