# v1.49.997 — IMAGE Imager for Magnetopause-to-Aurora Global Exploration First Global Magnetosphere Imaging Mission

**Shipped:** 2026-06-06
**Branch:** dev → main
**Type:** NASA degree-advancing milestone (1.187 → 1.188)
**NASA Mission:** IMAGE (Imager for Magnetopause-to-Aurora Global Exploration first global magnetosphere imaging mission)
**Engine state:** ADVANCED — NASA degree 1.187 → 1.188
**Counter-cadence:** false
**Phases:** 6 (W0-W5 wave-pipeline)

This is a 5-track NASA-substrate-convergence milestone: the NASA degree advances while the MUS, ELC, SPS, and TRS tracks hold their scaffold-pending state at v997.

## Summary

v1.49.997 advances the NASA degree catalog from 1.187 to 1.188, adding IMAGE — the Imager for Magnetopause-to-Aurora Global Exploration — as the obs#3 INTRA-AXIS continuation of the reopened near-Earth magnetosphere substrate-axis. The magnetosphere axis reopened at v995 FAST (obs#1, the in-situ high-cadence auroral-acceleration-region snapshot science) and was carried at v996 DE-1 (obs#2, the first global imaging of the complete auroral oval from a high-altitude polar orbit), and at v997 IMAGE continues the axis at obs#3 with the first mission dedicated to imaging the entire inner magnetosphere on a global scale. Where DE-1 imaged the auroral oval as a whole from above, IMAGE rendered the ring current and the plasmasphere as whole structures through neutral-atom and extreme-ultraviolet imaging, carrying the whole-system imaging idea from the auroral oval to the full magnetosphere. IMAGE realizes the global-magnetosphere-imaging lineage that DE-1 anchored, the substrate-era global magnetosphere imager the catalog had been pointing toward across the two earlier observations.

IMAGE was the first Medium-class Explorer (MIDEX) mission of the NASA Explorers Program, managed by NASA Goddard Space Flight Center, with James L. Burch of the Southwest Research Institute as principal investigator and Lockheed Martin as spacecraft prime. The science idea was new: rather than sampling the magnetosphere point by point as a spacecraft flies through it, IMAGE would render the whole inner magnetosphere as a set of global images, the ring current and the plasmasphere seen as connected structures. The trouble such a mission solves is that the plasma populations of the inner magnetosphere are largely invisible to a conventional camera, so IMAGE was built to image the faint signals these populations do emit. IMAGE launched 2000-03-25 at 20:34 UTC on a Delta II 7326 vehicle from Vandenberg Air Force Base into a highly elliptical polar orbit with apogee near 7 Earth radii positioned over the northern polar region, the high vantage from which the imagers could view the entire inner magnetosphere at once.

The signature of the mission is the first dedicated global imaging of the inner magnetosphere. The neutral-atom imagers rendered the ring current: when ring-current ions exchange charge with the neutral hydrogen of the geocorona, each ion becomes a fast neutral atom that travels in a straight line out of the magnetosphere, carrying information about where it came from. The High, Medium, and Low Energy Neutral Atom imagers collected these atoms and reconstructed the global picture of the ring current from them, making the invisible charged-particle population visible without sampling it in situ. During geomagnetic storms the neutral-atom images showed the ring current building, drifting, and decaying as a whole structure, the first time the ring current could be watched as a connected global image rather than inferred from local crossings.

The Extreme Ultraviolet imager rendered the plasmasphere, the inner region of cold, dense plasma that co-rotates with Earth. Its singly-ionized helium scatters solar ultraviolet light at the 30.4 nm wavelength, and the imager collected that faint resonantly-scattered glow to produce the first global images of the plasmasphere, revealing its structure: the plasmaspheric plumes that stretch outward, the sharp shoulders at the boundary, and the notches carved into the cold-plasma region. Seeing the plasmasphere whole, rather than as a density profile sampled along an orbit, established a new view of the cold-plasma region around Earth and how it evolves. The Far Ultraviolet imager rendered the aurora and the proton aurora that maps ring-current ion precipitation into the ionosphere, and the Radio Plasma Imager sounded the magnetospheric electron densities by transmitting radio pulses and timing their echoes.

The science return established the global imaging of the inner magnetosphere as a whole-system view. For the first time the ring current and the plasmasphere could be seen as connected structures and watched as they responded to the changing conditions, the ring current building and decaying through a storm and the plasmasphere forming its plumes and notches. IMAGE operated from 2000 through 2005, returning a continuous record of global magnetosphere images across the solar-maximum interval; routine operations concluded at the end of 2005, and in 2018 the spacecraft was confirmed to be still transmitting when an amateur observer detected its signal and NASA verified its identity, underscoring the spacecraft's durability years after routine operations concluded.

The axis-relevant substrate of IMAGE at this degree is its continuation of the reopened near-Earth magnetosphere axis at obs#3 with the first dedicated global imaging of the whole inner magnetosphere. IMAGE sustains the MAGNETOSPHERE-AXIS-INTRA-CONTINUATION thread at obs#3 cumulative (v995 FAST + v996 DE-1 + v997 IMAGE), it realizes the GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE thread at obs#3 cumulative with DE-1 (the global imaging-from-space substrate now spans the DE-1 auroral-oval imaging and the IMAGE global magnetosphere imaging, the lineage DE-1 anchored and IMAGE realizes), and it sustains the MAGNETOSPHERE-IONOSPHERE-COUPLING thread at obs#2 cumulative through the proton-aurora imaging that maps the ring-current ion precipitation into the ionosphere. As the obs#3 entry on the reopened axis, IMAGE deepens the imaging lineage from the auroral oval to the full magnetosphere, and it sets the global-magnetosphere-imaging anchor from which the reopened magnetosphere axis will grow. The forward continuation favors further inner-magnetosphere, ring-current, polar-imaging, and ionosphere-coupling missions that build on the in-situ and global-imaging foundations now established.

The milestone produced the full canonical 14-deliverable set at `www/tibsfox/com/Research/NASA/1.188/` plus a WebGL2 global-magnetosphere-imaging viewer shader with four cycling modes (ring-current neutral atoms, plasmasphere extreme-ultraviolet glow, proton aurora, and radio sounding), rendering the ring current as a neutral-atom torus around Earth, the plasmasphere as a glowing cold-plasma region with its plumes and notches, the proton aurora as an oval, and the radio-sounding echo fronts along the field lines. The build resolved the predecessor v1.187 forward-link to record the actual IMAGE selection, updated both nav-card "next" cells on the v1.187 DE-1 index to point to IMAGE, appended the 189th canonical-pairings entry (Ghost Pipe + Great Gray Owl + Operator-selectable S36) to both the TSV and JSON files, and codified retrospective lessons across all required surfaces.

The organism pairing for IMAGE is the Great Gray Owl (Strix nebulosa) and the Ghost Pipe (Monotropa uniflora). The Great Gray Owl is a large Pacific Northwest owl whose broad facial disc focuses faint sounds to locate prey moving unseen beneath snow, so it enters as the remote-sensing mirror to IMAGE rendering the otherwise-invisible magnetospheric plasma visible: as the Great Gray Owl gathers a faint sound to find what is hidden beneath the snow, IMAGE gathered a faint signal to render the hidden plasma of the inner magnetosphere. The Ghost Pipe is a chlorophyll-free Pacific Northwest forest plant that draws its sustenance through the hidden mycorrhizal network beneath the soil, mirroring IMAGE making the invisible plasma populations of the inner magnetosphere visible: as the Ghost Pipe reaches into the hidden network for what it cannot see, IMAGE reached for the faint signals of the hidden plasma populations to render them whole. Both organisms share four alignments with IMAGE: making an invisible population perceptible by a faint signal, sensing a population through a signal that escapes it, rendering a whole field or structure from the gathered signal, and a faint presence that brings the hidden into view. The pairing brings a faint-signal sensing owl and a hidden-network forest plant to the catalog.

Several substrate-form distinctions separate IMAGE from the DE-1 obs#2 entry on the same reopened axis. First, its mission role: the first dedicated global imaging of the entire inner magnetosphere rather than the first global imaging of the auroral oval alone. Second, its imaging target: the ring current and the plasmasphere rendered as whole structures rather than the auroral oval. Third, its measurement style: neutral-atom, extreme-ultraviolet, far-ultraviolet, and radio-sounding imaging rather than spin-scan visible and ultraviolet auroral imaging. Fourth, its program line: the NASA Explorers Program first MIDEX mission rather than the paired Dynamics Explorer program. Fifth, its era: 2000, the realization of the imaging lineage that the 1981 DE-1 anchored. IMAGE also brings the neutral-atom imaging of the ring current, the extreme-ultraviolet imaging of the plasmasphere, the radio sounding of magnetospheric densities, and the first MIDEX Explorer, all new first-instance distinctions, and it sustains the reopened magnetosphere axis at obs#3. The engine state otherwise advances: the counter-cadence count is unchanged at 5, and MUS, ELC, SPS, and TRS all remain SCAFFOLD-PENDING at obs#71 cumulative.

## Mission Overview

IMAGE is the NASA first global magnetosphere imaging mission, the first Medium-class Explorer (MIDEX) mission of the NASA Explorers Program managed by NASA Goddard Space Flight Center, the first mission dedicated to imaging Earth's magnetosphere on a global scale that sustains the reopened near-Earth magnetosphere substrate-axis at obs#3.

| Fact | Value |
|---|---|
| Launch | 2000-03-25 at 20:34 UTC on a Delta II 7326 vehicle from Vandenberg Air Force Base (Space Launch Complex 2W) |
| Management | NASA Goddard Space Flight Center, within the NASA Explorers Program |
| Program | NASA Explorers Program — the first Medium-class Explorer (MIDEX) mission |
| Principal investigator | James L. Burch, Southwest Research Institute; spacecraft prime Lockheed Martin |
| Mission target | The inner magnetosphere — the ring current, the plasmasphere, and the aurora rendered as whole structures |
| Orbit | A highly elliptical polar orbit with apogee near 7 Earth radii over the northern polar region |
| Configuration | A spin-stabilized spacecraft with neutral-atom, extreme-ultraviolet, far-ultraviolet, and radio-sounding imagers |
| Measurement style | Global imaging of the entire inner magnetosphere from a high-altitude polar vantage |
| Science return | The first global images of the ring current, the plasmasphere, and the inner magnetosphere as whole structures |
| Substrate-axis | MAGNETOSPHERE axis obs#3 INTRA-AXIS continuation (the reopened axis sustains at obs#3) |
| Distinction | The first mission dedicated to global imaging of the entire inner magnetosphere; realizes the global-imaging lineage DE-1 anchored |

## Key Features

| Feature | Description |
|---|---|
| First dedicated global magnetosphere imaging | IMAGE was the first mission designed to image Earth's whole magnetosphere on a global scale |
| Neutral-atom imaging of the ring current | The HENA, MENA, and LENA imagers rendered the ring current as a global image from energetic neutral atoms |
| First global plasmasphere imaging | The Extreme Ultraviolet imager produced the first global images of the plasmasphere at 30.4 nm |
| Radio sounding of magnetospheric densities | The Radio Plasma Imager measured electron densities along field lines from the echo delay |
| First MIDEX Explorer | IMAGE was the first Medium-class Explorer mission of the NASA Explorers Program |
| Magnetosphere-axis continuation | MAGNETOSPHERE-AXIS-INTRA-CONTINUATION obs#3 sustains the reopened axis with IMAGE as obs#3 |
| Global-magnetosphere-imaging lineage | GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE obs#3 with DE-1 + IMAGE, the lineage IMAGE realizes |
| Highly elliptical polar orbit | Apogee near 7 Earth radii over the northern pole, the vantage for viewing the whole inner magnetosphere |
| Global-magnetosphere-imaging WebGL2 shader | Four cycling modes (ring-current neutral atoms, plasmasphere EUV, proton aurora, radio sounding) |

## Structural firsts

**IMAGE-FIRST-INSTANCE:** IMAGE (Imager for Magnetopause-to-Aurora Global Exploration) enters the catalog as the NASA first global magnetosphere imaging mission.

**FIRST-DEDICATED-GLOBAL-MAGNETOSPHERE-IMAGING-FIRST-INSTANCE:** The first mission dedicated to imaging Earth's magnetosphere on a global scale.

**GLOBAL-PLASMASPHERE-EUV-IMAGING-FIRST-INSTANCE:** The first global images of the plasmasphere through helium-ion resonance scattering of sunlight at 30.4 nm.

**ENA-RING-CURRENT-IMAGING-FIRST-INSTANCE:** The neutral-atom imaging of the ring current via energetic neutral atoms produced by charge exchange with the geocorona.

**FIRST-MIDEX-MISSION-FIRST-INSTANCE:** The first Medium-class Explorer (MIDEX) mission of the NASA Explorers Program.

**RADIO-PLASMA-SOUNDING-FIRST-INSTANCE:** The active radio sounding of magnetospheric electron densities along field lines.

## Substrate Primary Axes

### NEW LOCKED at v997 (6 anchors)

- **IMAGE-FIRST-INSTANCE** obs#1 NEW LOCKED — IMAGE (Imager for Magnetopause-to-Aurora Global Exploration) first INSTANCE in the catalog
- **FIRST-DEDICATED-GLOBAL-MAGNETOSPHERE-IMAGING-FIRST-INSTANCE** obs#1 NEW LOCKED — the first mission dedicated to imaging Earth's magnetosphere on a global scale
- **GLOBAL-PLASMASPHERE-EUV-IMAGING-FIRST-INSTANCE** obs#1 NEW LOCKED — the first global images of the plasmasphere at 30.4 nm
- **ENA-RING-CURRENT-IMAGING-FIRST-INSTANCE** obs#1 NEW LOCKED — the neutral-atom imaging of the ring current
- **FIRST-MIDEX-MISSION-FIRST-INSTANCE** obs#1 NEW LOCKED — the first Medium-class Explorer (MIDEX) mission
- **RADIO-PLASMA-SOUNDING-FIRST-INSTANCE** obs#1 NEW LOCKED — the active radio sounding of magnetospheric electron densities

### CUMULATIVE at v997 (3 threads)

- **MAGNETOSPHERE-AXIS-INTRA-CONTINUATION** obs#3 cumulative — v995 FAST (in-situ auroral acceleration region) + v996 DE-1 (global auroral imaging) + v997 IMAGE (global magnetosphere imaging); the reopened magnetosphere axis now spans three observations, sustaining at obs#3 cumulative
- **GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE** obs#3 cumulative — v996 DE-1 (the chronologically-earlier global auroral-oval imaging) + v997 IMAGE (the global magnetosphere imaging that realizes the lineage); the global imaging-from-space substrate now spans the DE-1 auroral-oval imaging and the IMAGE global magnetosphere imaging, sustaining at obs#3 cumulative within the magnetosphere axis
- **MAGNETOSPHERE-IONOSPHERE-COUPLING** obs#2 cumulative — v996 DE-1 (paired two-height coupling measurements) + v997 IMAGE (the Far Ultraviolet imager rendering the proton aurora that maps ring-current ion precipitation into the ionosphere); the coupling substrate now spans two observations, sustaining at obs#2 cumulative

### ESTABLISHED disciplines applied (cumulative)

- SUBSTRATE-AXIS-ROTATION-DISCIPLINE obs#60 cumulative (axis sustains; the reopened MAGNETOSPHERE axis continues at obs#3)
- POSITIVE-FRAMING-DISCIPLINE obs#74 cumulative
- DISPATCH-PROMPT-DENSITY-DISCIPLINE obs#23 cumulative
- IDENTIFIER-NOT-PROSE-DISCIPLINE obs#30 cumulative
- NAV-CARD-PAIR-DELIVERABLE-DISCIPLINE obs#19 cumulative
- PATH-A-FRESH-BUILD-PRECEDENT obs#20 cumulative
- W3.5-CHAPTER-GEN-BAKE-IN obs#27 cumulative
- README-RETROSPECTIVE-SECTIONS-REQUIREMENT obs#26 cumulative
- STORY-MD-NEWLINE-SEPARATOR-DISCIPLINE obs#34 cumulative
- DEDICATION-WORD-COUNT-DISCIPLINE obs#12 cumulative (≤200 words)

## Part A — Mission Deliverables (depth)

- **Canonical 14-deliverable set at `www/tibsfox/com/Research/NASA/1.188/`.** The full canonical mission directory: degree-sync.json, knowledge-nodes.json, data-sources.json, from-1.187.md, to-1.189.md, index.html, organism.md, organism.html, research.md, research.html, papers.html, mathematics.html, simulation.html, and curriculum.html, plus the artifacts/shaders subdirectory.
- **index.html with the canonical 12-card layout plus enrichment.** The index carries the v1.0 canonical card floor (Mission Summary, Mission Tracks, Resonance Axes, What to Build, TRY Sessions, DIY Projects, Creative Artifacts, Runnable Simulations, Interactive Lab, Forest Contribution, Data Files, Dedication), plus a Mission Journey narrative card, a Structural Firsts card, and a Governance & Chain Declarations card, plus six numbered resonance axes each with a mission paragraph and an organism pairing, plus a sidebar with the Explorers / magnetosphere-imaging program-lineage table and a haiku card. The page passes both the canonical-layout gate (0 card deviations across all 189 missions) and the trip-vocab page check (PASS, zero primary and zero secondary classes in the title line and body), with a plasmasphere-cyan/EUV-teal/ENA-amber palette distinct from the DE-1 magenta/violet palette.
- **Six resonance axes.** The first dedicated global imaging of the entire inner magnetosphere; the reopened magnetosphere axis continuing at obs#3; the neutral-atom imaging of the ring current; the first global imaging of the plasmasphere in the extreme ultraviolet; the global-magnetosphere-imaging lineage cumulative thread at obs#3; and the highly elliptical polar orbit and the first MIDEX Explorer.
- **Mission Journey narrative card.** A multi-paragraph narrative (over 500 words) on the Delta II launch, the highly elliptical polar orbit, the neutral-atom imaging of the ring current, the extreme-ultraviolet imaging of the plasmasphere, and the global-imaging lineage, framing IMAGE as the first dedicated global magnetosphere imager that sustains the magnetosphere axis at obs#3.
- **organism.html at ≥3500 words.** The Great Gray Owl + Ghost Pipe pairing with the faint-signal-sensing and invisible-population mirrors drawn from observable behavior and traits, with four explicit alignments, a behavioral-observation-notes section, and behavioral-description-only framing.
- **research.html / research.md deep research.** The NASA Explorers Program and the first MIDEX mission, the highly elliptical polar orbit, the neutral-atom imaging of the ring current, the extreme-ultraviolet imaging of the plasmasphere, the far-ultraviolet imaging and radio sounding, the instrument suite, the inner magnetosphere as a system in depth, the place in the magnetosphere fleet, the obs#3 continuation, and the global-imaging lineage thread.
- **mathematics.html threads.** The neutral-atom imaging geometry from charge exchange, the extreme-ultraviolet resonance-scattering radiance of the plasmasphere, the highly elliptical polar-orbit geometry, the radio-sounding density profile from the echo delay, the ring-current dipole drift, and the plasmasphere structure and the plasmapause.
- **Two shader artifacts.** `global-magnetosphere-imaging-viewer.frag` (GLSL 3.30 core fragment shader, four cycling modes on the ring-current-neutral-atom, plasmasphere-EUV, proton-aurora, and radio-sounding theme) plus a standalone WebGL2 `viewer.html` with a four-mode toggle, sweep slider, animated motion, and scene rotation; the viewer rewrites `#version 330 core` to `#version 300 es` at load.

## Part B — Catalog & Chain Deliverables (depth)

- **Predecessor forward-link resolved.** `www/tibsfox/com/Research/NASA/1.187/to-1.188.md` updated to record the actual IMAGE selection (the obs#3 INTRA-AXIS continuation with the first dedicated global magnetosphere imaging) in place of the prior "TBD per operator selection" lines, in both the forward-cadence body and the closing successor-anticipation lines.
- **Predecessor nav-card pair updated.** Both the top and bottom nav-card "next" cells in `www/tibsfox/com/Research/NASA/1.187/index.html` now point to `../1.188/index.html` with the label "IMAGE →" in place of the prior Series-Hub fallback.
- **Canonical-pairings TSV record appended.** The new record for degree 1.188 (Ghost Pipe / Great Gray Owl / Operator-selectable S36) was appended with a proper trailing newline, preserving the 15-column tab-delimited layout.
- **Canonical-pairings JSON 189th entry appended.** The corresponding 189th array entry for degree 1.188 was appended with the same pairing, preserving valid JSON and mirroring the existing entry structure (plant, animal, s36, sps_species_page, csv_refs).
- **STORY.md ground-truth entry appended.** A single v1.49.997 entry was appended to `.planning/roadmap/STORY.md` with a leading newline separator so the downstream append regex matches; the header "current version" line was advanced to v1.49.997.
- **Catalog indexes refreshed.** `node tools/update-catalog-indexes.mjs --write` was run to add 1.188 to the NASA landing-page completedMissions set so the pre-tag-gate catalog-index step passes on first try.
- **Release-notes README + chapter generation.** This README was authored to the 10-dimension rubric and the W3.5 chapter-generation pipeline was run to produce the chapter files for v1.49.997.
- **Nav-card pair on the new index.** The 1.188 index carries identical nav-card pairs at both the top and bottom of the body, with the previous cell pointing to v1.187 DE-1 and the next cell pointing to the v1.189 successor.

## Decisions Made

- **IMAGE selected at v1.188** from the v1.187 to-1.188.md forward list. IMAGE was the further global-imaging candidate (c), sustaining the reopened near-Earth magnetosphere substrate-axis at obs#3 with the first dedicated global imaging of the entire inner magnetosphere — the headline structural continuation, realizing the global-magnetosphere-imaging lineage that DE-1 anchored.
- **Magnetosphere axis continued at obs#3.** IMAGE sustains the reopened magnetosphere substrate-axis at obs#3 INTRA-AXIS continuation, deepening the imaging lineage from the auroral oval to the full inner magnetosphere.
- **Global-magnetosphere-imaging lineage realized at obs#3.** IMAGE realizes the GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE thread at obs#3 with DE-1, recording the global imaging-from-space substrate across the DE-1 auroral-oval imaging and the IMAGE global magnetosphere imaging.
- **Great Gray Owl + Ghost Pipe operator-default pairing.** A faint-signal sensing owl and a hidden-network forest plant mirror IMAGE rendering the otherwise-invisible plasma of the inner magnetosphere visible.
- **Path A fresh-build sub-agent dispatch authorized.** v997 sustains the Path A fresh-build precedent at obs#20 cumulative, using a single comprehensive build dispatch for all www/ deliverables, the canonical-pairings updates, the predecessor forward-link updates, the retrospective surfaces, and the W3.5 chapter-gen step.
- **Forward-anticipation candidates at v1.189.** A MAGNETOSPHERE-axis INTRA-AXIS continuation toward further inner-magnetosphere, ring-current, polar-imaging, and ionosphere-coupling missions, enumerated in to-1.189.md.

## Lessons Learned

1. **An anticipated lineage anchor can be realized by a later observation on the same axis.** DE-1 anchored the global-magnetosphere-imaging lineage at obs#2 by pointing toward a later whole-magnetosphere imager, and IMAGE realizes that lineage at obs#3, showing that an axis can name an anticipated substrate and then fulfil it with a later entry, an obs#3 continuation that realizes what an earlier observation foresaw.
2. **A faint emitted signal can render an invisible population as a whole image.** IMAGE imaged the ring current from the neutral atoms it emits and the plasmasphere from its faint helium-ion glow, showing that a population invisible to a conventional camera can be rendered whole by collecting the faint signal it gives off, a remote-sensing substrate distinct from in-situ sampling.
3. **Charge exchange turns a charged population into an imageable one.** The ring-current ions cannot be seen directly, but their charge exchange with the geocorona produces neutral atoms that fly straight out and can be imaged, showing that a physical conversion can make a hidden population observable, the principle behind neutral-atom imaging.
4. **A whole-structure view reveals features that local sampling cannot show whole.** The extreme-ultraviolet plasmasphere images revealed plumes, shoulders, and notches as connected features, showing that imaging a region whole, rather than sampling a density profile along an orbit, can reveal global structure that local measurements fragment.
5. **A dedicated imaging mission realizes a substrate the catalog had been pointing toward.** IMAGE was the first mission dedicated to global magnetosphere imaging, the substrate-era imager that DE-1 anticipated, showing that the catalog's anticipated substrates can be fulfilled by a mission designed for exactly that purpose.
6. **A three-observation axis can hold an in-situ, a partial-imaging, and a full-imaging vantage together.** The reopened magnetosphere axis now holds the FAST in-situ acceleration-region view, the DE-1 global auroral-oval imaging, and the IMAGE global inner-magnetosphere imaging, showing that an axis can build complementary vantages from local sampling through partial imaging to full whole-system imaging across its observations.
7. **A spacecraft can outlast its routine operations by years.** IMAGE operated through 2005 and was confirmed still transmitting in 2018, showing that a well-built spacecraft can endure long beyond its routine operational interval, a durability that underscores the robustness of the design.
8. **A reference template carries forward cleanly across a distinct-palette mission.** Because IMAGE reuses the canonical card structure of the v1.187 template, the build preserved the structural template exactly and swapped the content to the global magnetosphere imaging with a distinct plasmasphere-cyan/EUV-teal/ENA-amber palette of deep space blue, plasma cyan, EUV teal, ring aqua, ENA amber, and halo blue, making the distinct-palette mission a clean build.

## Surprises

- **The first global plasmasphere images came from a faint ultraviolet glow.** The plasmasphere is invisible to a conventional camera, but its singly-ionized helium scatters sunlight at 30.4 nm, and IMAGE rendered the whole plasmasphere from that faint resonant glow, so the catalog's first whole-plasmasphere view came from collecting a faint emission rather than from direct imaging.
- **A faint-signal-sensing owl mirrors a faint-signal-imaging spacecraft.** The Great Gray Owl, which gathers faint sounds through its broad facial disc to find prey beneath the snow, enters as the remote-sensing mirror to the faint-signal-imaging mission, so the catalog pairs a listening owl with a magnetosphere imager.
- **A spacecraft confirmed transmitting more than a decade after operations concluded.** IMAGE's routine operations concluded at the end of 2005, but in 2018 the spacecraft was confirmed to be still transmitting when an amateur observer detected its signal, so the durability of the spacecraft outlasted its operational interval by well over a decade.

## Retrospective

### What Worked

- **Single comprehensive build dispatch.** Per the established NASA streamlined T14 ship sequence pattern, the v997 build was scoped to a single dispatch covering all www/ deliverables, the canonical-pairings updates, the predecessor forward-link updates, the retrospective surfaces, and the W3.5 chapter-gen step.
- **Axis-continuation framing handled cleanly.** The magnetosphere-axis continuation was framed as MAGNETOSPHERE-AXIS-INTRA-CONTINUATION obs#3 with the reopened axis spanning v995 FAST (obs#1), v996 DE-1 (obs#2), and v997 IMAGE (obs#3), consistently across the index, the JSONs, the nav md files, and the README. The index trip-vocab page check returned PASS with zero primary and zero secondary classes in the title line and body.
- **Identifier-in-lists discipline preserved.** All substrate-anchor identifiers appear in bulleted lists, table cells, or anchor-pill spans rather than embedded in narrative paragraphs, satisfying the layout gate and the IDENTIFIER-NOT-PROSE-DISCIPLINE.
- **Dedication word-count discipline preserved.** Both the index.html dedication and the organism.html dedication are within the 200-word cap.
- **Reference template recognition.** The v1.187 DE-1 template files were used as the immediate reference — same CSS structure, same nav-card pair pattern, same sidebar and track-grid patterns — with palette tokens renamed for IMAGE (--plasma-cyan, --euv-teal, --ena-amber, --ring-aqua, --halo-blue) and a distinct plasmasphere/ring-current palette, and the structural template preserved exactly.
- **Pairing files updated in both formats.** The new canonical-pairings record was appended consistently to both the TSV (15-column tab-delimited) and the JSON (mirroring the existing entry structure), keeping the two data files in lockstep at 189 records.

### What Could Be Better

- **The shader renders procedural structure rather than archived data.** The global-magnetosphere-imaging shader uses analytic geometry and procedural noise rather than loading actual IMAGE neutral-atom or extreme-ultraviolet frames from the NASA Space Physics Data Facility. A future revision could load encoded IMAGE ring-current and plasmasphere frames for a higher-fidelity rendering keyed to the real data.
- **The highly-elliptical-orbit diorama is a forthcoming artifact.** The 3D-printable diorama STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the highly elliptical polar orbit and the inner-magnetosphere structures.
- **The magnetosphere program-lineage sidebar table is illustrative rather than exhaustive.** The sidebar lists representative program elements (IMAGE, DE-1, FAST, Polar, TWINS, THEMIS/RBSP/MMS) but does not enumerate the full magnetosphere fleet; a future revision could expand the table with launch dates and mission outcomes.
- **The neutral-atom inversion is described rather than computed.** The line-of-sight inversion that recovers the ring-current ion flux from the neutral atoms is described but not run against archived data; a future ship could perform the inversion from a real IMAGE neutral-atom image.

## Cross-References

The IMAGE milestone connects to several prior catalog entries through shared substrate threads and program lineages:

| Referent | Relationship to IMAGE |
|---|---|
| **v1.187 DE-1** | The immediate predecessor; the obs#2 global-auroral-imaging entry whose imaging lineage IMAGE realizes at obs#3 with the first dedicated global magnetosphere imaging |
| **v1.186 FAST** | The obs#1 reopening anchor on the magnetosphere axis with the in-situ high-cadence acceleration-region science that IMAGE complements at obs#3 |
| **Substrate-era Polar** | Polar-cap and auroral imaging the reopened axis complements |
| **Substrate-era TWINS** | The later stereo neutral-atom imaging that continued the neutral-atom imaging approach IMAGE pioneered for the ring current |
| **Substrate-era THEMIS / RBSP / MMS** | Substorm, radiation-belt, and reconnection in-situ science the reopened axis complements |
| **v1.185 Cassini-Huygens** | The closing INTERSTELLAR-BOUNDARY axis entry off which FAST rotated to reopen the magnetosphere axis that IMAGE now continues |

- **MAGNETOSPHERE axis lineage:** the reopened axis spans **v995 FAST** (obs#1, in-situ), **v996 DE-1** (obs#2, global auroral imaging), and **v997 IMAGE** (obs#3, global magnetosphere imaging) and complements the substrate-era magnetosphere entries (**RBSP**, **MMS**, **THEMIS**, **Cluster**, **Geotail**, **Polar**, **TWINS**); forward candidates in **to-1.189.md**.
- **MAGNETOSPHERE-AXIS-INTRA-CONTINUATION thread:** the IMAGE global-magnetosphere-imaging entry joins the **v995 FAST** in-situ entry and the **v996 DE-1** global-auroral-imaging entry on the reopened axis at obs#3.
- **GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE thread:** the IMAGE global magnetosphere imaging joins the **v996 DE-1** auroral-oval imaging across the imaging lineage at obs#3.
- **Substrate-axis-rotation discipline:** see the prior rotations enumerated through **SUBSTRATE-AXIS-ROTATION-DISCIPLINE obs#60 cumulative** (the reopened magnetosphere axis sustains at obs#3).

## Engine state

| Track | State at v997 |
|---|---|
| NASA degree | ADVANCED 1.187 → 1.188 |
| MUS degree | SCAFFOLD-PENDING obs#71 |
| ELC degree | SCAFFOLD-PENDING obs#71 |
| SPS species | SCAFFOLD-PENDING obs#71 |
| TRS | SCAFFOLD-PENDING obs#71 |

- **NASA degree:** ADVANCED 1.187 → 1.188 at v997 (counter_cadence: false)
- **MUS degree:** SCAFFOLD-PENDING obs#71 cumulative
- **ELC degree:** SCAFFOLD-PENDING obs#71 cumulative
- **SPS species:** SCAFFOLD-PENDING obs#71 cumulative
- **TRS M0 substrate:** SCAFFOLD-PENDING obs#71 cumulative

## Cross-track / Engine state full enumeration

| Thread | Count | Members |
|---|---|---|
| MAGNETOSPHERE-AXIS-INTRA-CONTINUATION | obs#3 | FAST (in-situ) + DE-1 (global auroral imaging) + IMAGE (global magnetosphere imaging) |
| GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE | obs#3 | DE-1 (auroral-oval imaging) + IMAGE (global magnetosphere imaging) |
| MAGNETOSPHERE-IONOSPHERE-COUPLING | obs#2 | DE-1 (paired two-height sampling) + IMAGE (proton-aurora mapping) |
| SUBSTRATE-AXIS-ROTATION-DISCIPLINE | obs#60 | axis sustains; the reopened MAGNETOSPHERE axis continues at obs#3 |
| MAGNETOSPHERE axis (reopened) | obs#3 | FAST + DE-1 + IMAGE |

## Forward queue

- **v1.189 candidates:** a MAGNETOSPHERE-axis INTRA-AXIS continuation toward further inner-magnetosphere, ring-current, polar-imaging, and ionosphere-coupling science.
- **MAGNETOSPHERE axis:** forward to obs#4 INTRA-AXIS continuation at v189+ on the reopened magnetosphere axis.
- **GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE thread:** forward to obs#4+ if another global-imaging mission enters the catalog.
- **MAGNETOSPHERE-IONOSPHERE-COUPLING thread:** forward to obs#3+ if another magnetosphere-ionosphere coupling mission enters the catalog.

## File inventory

- `.planning/missions/v1-49-997-nasa-1-188-image/MISSION-BRIEF.md` — mission brief authored at v997
- `www/tibsfox/com/Research/NASA/1.188/` — 14-file canonical mission directory plus artifacts/shaders/
- `www/tibsfox/com/Research/NASA/1.187/to-1.188.md` — predecessor forward-link updated to record the IMAGE selection
- `www/tibsfox/com/Research/NASA/1.187/index.html` — predecessor nav-card pair updated to point to IMAGE
- `.planning/sps-s36-mapping/canonical-pairings.tsv` + `.json` — 1.188 entry appended (189th JSON entry)
- `.planning/roadmap/STORY.md` — v1.49.997 entry appended; header version advanced
- `docs/release-notes/v1.49.997/chapter/` — chapter files for the chapter-gen pipeline
- `tools/release-history/run-with-pg.mjs` — chapter-gen pipeline (W3.5 step)

## Engine Position

- **NASA degree:** ADVANCES 1.187 → 1.188 at v997 (counter_cadence: false)
- **Counter-cadence count:** 5 (UNCHANGED — v585, v776, v777, v778, v779)
- **MUS / ELC / SPS / TRS:** all SCAFFOLD-PENDING obs#71 cumulative
- **MAGNETOSPHERE axis:** continues at obs#3 INTRA-AXIS continuation (the reopened axis sustains at obs#3)
- **MAGNETOSPHERE-AXIS-INTRA-CONTINUATION and GLOBAL-MAGNETOSPHERE-IMAGING-LINEAGE threads:** obs#3 cumulative (the headline continuation and the imaging lineage)

## Dedication

v1.188 IMAGE is dedicated to the team that built and flew the Imager for Magnetopause-to-Aurora Global Exploration: the IMAGE science team who conceived the first mission devoted to rendering Earth's magnetosphere on a global scale; the Southwest Research Institute team led by principal investigator James Burch who guided the mission and developed the medium-energy neutral-atom imager; the instrument teams who built the high-energy neutral-atom imager, the extreme-ultraviolet imager, the far-ultraviolet imager, and the radio-plasma imager that collected the faint signals of the inner magnetosphere; and the NASA Goddard Space Flight Center and Lockheed Martin teams who managed the program and built the spacecraft. It is dedicated as well to the wider community of magnetospheric physicists whose work IMAGE advanced, the global imaging that made the invisible plasma populations of the ring current and the plasmasphere visible as whole structures. IMAGE launched in 2000, flew a highly elliptical polar orbit over the northern pole, operated through 2005, and in 2018 was confirmed still transmitting, realizing the global-imaging lineage that earlier auroral imaging anchored.
