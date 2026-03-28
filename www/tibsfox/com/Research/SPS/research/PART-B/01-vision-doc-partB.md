# PNW 360 Species — Vision Guide (Part B)

**Date:** 2026-03-28  
**Status:** Initial Vision / Pre-Research  
**Part:** B of A–B–C–D–E  
**Depends on:** `seattle-360-mission/01-vision-doc.md` (Part A — parallel structure),
               `04-salish-sea-expansion-vision.md`, `gsd-foxfire-heritage-skills-vision.md`,
               *The Space Between* (bioacoustics mathematics), OCAP®/CARE/UNDRIP
**Context:** The Part B mirror of Seattle 360 — 360 PNW species and soundscapes mapped
             to the same unit circle as the 360 bands, processed through the same Fleet
             release engine, producing parallel educational content that Part C will weave
             together into a unified ecology-music curriculum.

---

## Vision

Before there were amplifiers, there was the Salish Sea. Before there were drum machines,
there was the Roosevelt elk bugling at dawn in the Hoh River valley. Before there was
a music theory textbook, there was the orca pod's greeting ceremony — a multi-voice
harmonic convergence that has been formally analyzed by bioacousticians and found to
follow principles identical to those in human polyphonic music. The Pacific Northwest
is not a backdrop to human culture. It is a teacher.

The PNW 360 Species engine treats the same unit circle as Part A, but populates it with
wild voices instead of human ones. Degree 0 (Great Blue Heron, energy=1, estuarine
silence) to degree 359 (Puget Sound in silence before the next wave, energy=10). The
energy axis maps not to musical intensity but to acoustic complexity, ecological
intensity, and the sheer volume of biological sound. A heron at energy=1 is not less
significant than an orca at energy=9; they occupy different positions on the circle,
different depths of listening.

Every species in `pnw_360_species.csv` receives the same treatment as a band in
`seattle_360_geo.csv`: a full Fleet research mission, music-theory-adjacent acoustic
analysis, College of Knowledge cross-links, and a retrospective that feeds the next
release. The bioacoustics of a Pacific Wren's song — its precise frequency modulation,
its rhythmic structure, its use of silence — maps directly to the same music theory
curriculum as any jazz musician. The stonefly hatch's polyrhythmic wing-buzz is Botch
before there was math rock. The orca's greeting ceremony is polyphony before there was
a choir director. Part B makes this explicit, sourced, and teachable.

When Part C weaves A and B together — Quincy Jones's ii–V–I next to the herons' call-
and-response, Bikini Kill's matriarchal punk energy next to the orca female-led hunt
sequence — the College of Knowledge gains something neither dataset had alone: the proof
that music theory is not a human invention. It is a description of how sound works.
And the Pacific Northwest has been demonstrating that for ten thousand years.

---

## Problem Statement

1. **Bioacoustics is taught in isolation from music theory.** University courses in
   animal behavior discuss whale song as biology; music theory courses never mention
   it. The structural parallels — harmonic series, call-and-response, polyrhythm,
   silence as compositional element — remain unmapped across the disciplines.

2. **PNW ecological sound has no educational canon.** Unlike the music scene, the
   soundscapes of the Salish Sea, the Hoh Rainforest, the Cascade ridgelines have
   never been systematically documented as educational material — sourced, theory-
   mapped, curriculum-linked. They exist as field recordings and science papers,
   not as teachable lessons.

3. **Indigenous knowledge of PNW soundscapes is improperly attributed.** Coast Salish,
   Duwamish, Muckleshoot, Suquamish, Lummi, Makah, and other nations have generations
   of relationship with these species and their sounds. That knowledge is often
   extracted without attribution. OCAP®/CARE/UNDRIP compliance is not optional.

4. **The ecological crisis is invisible in educational content.** Southern Resident
   Killer Whales are critically endangered. The salmon runs that feed the entire
   ecosystem are in collapse. Many of the degree-270–359 "apex intensity" sounds in
   this dataset may not exist for future generations. The curriculum must acknowledge
   this without becoming a grief exercise.

5. **DIY art and maker communities lack a bridge to PNW ecology.** Sound artists,
   field recordists, instrument builders, and visual artists working in the PNW
   tradition have no structured resource connecting their practice to the bioacoustic
   theory underlying the sounds they work with. Part C will build this bridge; Part B
   provides the raw material.

---

## Core Concept

**Observe → Identify → Map → Teach → Connect → Carry Forward.**

Each species release follows the same pipeline as Part A: intake, acoustic theory
mapping, College cross-linking, Fleet research generation, safety audit, retrospective.
The key difference is the domain: instead of music theory, the primary lens is
**bioacoustics** — the scientific study of how animals produce, receive, and process
sound — with direct bridges to music theory at every point where the structures align
(which is often).

### Acoustic Theory Nodes (the bioacoustic parallel to TheoryNodeList)

Every species produces an `AcousticTheoryNodeList` containing:
- **Frequency structure** — fundamental frequency, harmonic content, bandwidth
- **Temporal structure** — duration, repetition rate, rhythm, silence intervals
- **Communication function** — territorial, mate attraction, alarm, social bonding
- **Music theory parallel** — the closest human musical concept (call-and-response,
  polyphony, polyrhythm, drone, minimalism, improvisation)
- **College path** — the `.college/` node this concept enriches or creates

### Ecosystem Layers (parallel to genre quadrants)

```
UNIT CIRCLE — PNW SPECIES EDITION

         0°: Great Blue Heron (estuarine silence → sound)
         ↑
Marine/  |  Freshwater/
Coastal  |  Riparian
(0-89°)  |  (90-179°)
         |
270° ←───┼───→ 90°
         |
Forest/  |  Alpine/
Terrestrial  Storm
(180-269°) (270-359°)
         ↓
       180°: Pacific Salmon spawning run

Energy 1 (innermost, quietest) → Energy 10 (outermost, most intense)
Radius = acoustic intensity / ecological drama
```

### Release Cycle Architecture

```
SpeciesProfile[N]  +  KnowledgeState[N]
        │
        ▼
WAVE 0: Foundation
  ├── Species CSV intake
  └── Accumulated bioacoustic context
        │
   ┌────┴────┐
   ▼         ▼
WAVE 1A:    WAVE 1B:
Acoustic    College
Mapper      Linker
(Sonnet)    (Sonnet)
   └────┬────┘
        ▼
WAVE 2: Fleet Research Generator
  Full bioacoustics mission PDF
  (Opus — synthesis)
        ▼
WAVE 3: Safety + Release + Retro + Carry
  OCAP®/CARE/UNDRIP compliance gate (BLOCK)
  Species protection sensitivity gate (BLOCK)
  Ecological crisis framing gate (ANNOTATE)
```

---

## Architecture

### Component Map

```
pnw-360-engine/
│
├── B00-shared-types ──────── SpeciesProfile, AcousticNode, SoundscapeLayer,
│                              EcologicalContext, IndigenousContext schemas
│
├── B01-species-intake ─────── CSV → SpeciesProfile[360]
│                               Energy mapping, ecosystem classification
│
├── B02-acoustic-mapper ────── SpeciesProfile → AcousticTheoryNodeList
│    (Wave 1A, Sonnet)         Frequency, rhythm, function, music-theory parallel
│
├── B03-fleet-research-gen ─── Full LaTeX PDF per species (Opus)
│    (Wave 2, Opus)            Three-stage: Vision + Research + Mission
│
├── B04-college-linker ─────── SpeciesProfile → CollegeLinkList
│    (Wave 1B, Sonnet)         Bioacoustics → .college/ deep links
│
├── B05-release-pipeline ───── Sequential atomic release management
│    (Wave 3b, Sonnet)         Same pattern as Part A
│
├── B06-retrospective ──────── NASA SE lessons learned
│    (Wave 3c, Opus)
│
├── B07-carry-forward ──────── KnowledgeState[N+1] management
│    (Wave 3d, Sonnet)
│
└── B08-safety-warden ──────── OCAP®, species protection, ecological sensitivity
     (Wave 3a, Opus)           BLOCK/GATE/ANNOTATE — cannot be bypassed
```

**Key cross-component connections:**
- `B01→B02`: SpeciesProfile flows to Acoustic Mapper
- `B01→B04`: SpeciesProfile flows to College Linker
- `B02+B04→B03`: Both Wave 1 outputs synthesized in Wave 2
- `B03→B08`: PDF reviewed by Safety Warden before release
- `B08→B05`: PASS signal gates publication
- `B05→B06→B07`: Retrospective → Carry Forward → next Wave 0

---

## Research Modules

### Module 1: Species Intake
**Purpose:** Parse `pnw_360_species.csv` → validated `SpeciesProfile[N]`. Derives
`acousticIntensityLevel` from energy (1–3=subtle, 4–6=moderate, 7–10=intense).
Classifies ecosystem zone (marine/freshwater/forest/alpine/multi-species/geological).
**Special handling:** Degrees 308–359 include "equivalent" entries (e.g., "Melvins-
equivalence: Marten scream") — these are explicitly labeled conceptual soundscape
compositions, not single-species records. The intake engine must flag these as
`type: 'SOUNDSCAPE_COMPOSITION'` vs `type: 'SPECIES'`.
**College cross-ref:** None (infrastructure)

### Module 2: Acoustic Theory Mapper
**Purpose:** Map each species' sonic characteristics to `AcousticTheoryNodeList` —
structured concepts with direct bridges to music theory.
**Key bioacoustic domains:**
- **Frequency analysis:** Fundamental pitch, overtone structure, bandwidth → maps to
  music theory's intervals, timbre, spectral color
- **Temporal pattern:** Duration, repetition rate, rhythm → maps to meter, syncopation,
  polyrhythm, minimalism
- **Call structure:** Solo/duet/chorus → maps to monophony, counterpoint, polyphony
- **Silence function:** How the species uses silence → maps to rest, space, dynamics
- **Ecological function:** Why the sound exists → teaches compositional intention
**College cross-ref:** `.college/music/theory/`, `.college/mathematics/`, `.college/science/bioacoustics/`

### Module 3: Fleet Research Generator
**Purpose:** Synthesize all Wave 1 outputs into a full three-stage bioacoustics
research mission document. NASA SE verbosity: every claim sourced from peer-reviewed
bioacoustics literature, NOAA, USGS, university research programs.
**Bioacoustics color scheme:**
- Primary: `#004D40` (deep teal — Puget Sound depth)
- Secondary: `#1A237E` (deep navy — night forest)
- Tertiary: `#33691E` (fern green — old-growth)
**College cross-ref:** All departments

### Module 4: College Knowledge Linker
**Purpose:** Generate deep links from each species to `.college/` departments.
**New departments required (Part B creates these):**
- `.college/science/bioacoustics/` — new department, seeded by Part B
- `.college/science/ecology/pnw/` — PNW ecosystem science
- `.college/science/conservation/` — species status, ecological crisis
- `.college/diy-art/field-recording/` — DIY art bridge (feeds Part C)
**Mathematics bridge:** Acoustic physics IS mathematics:
- Frequency → `.college/mathematics/calculus/fourier/` (sine wave decomposition)
- Rhythm → `.college/mathematics/sequences/` (temporal integer patterns)
- Echolocation → `.college/mathematics/calculus/fourier/` + `.college/physics/waves/`
- Infrasound → `.college/mathematics/physics/acoustics/`
**College cross-ref:** Science, mathematics, music, DIY art, mind-body

### Module 5–8: Release + Safety + Retrospective + Carry-Forward
**Purpose:** Identical pipeline to Part A, with enhanced Safety Warden protocols for:
- Species endangerment sensitivity (SRKW — Southern Resident Killer Whales — are
  critically endangered; release must not trivialize)
- Indigenous knowledge attribution (species knowledge held by Coast Salish nations)
- Precise location protection (do not publish exact coordinates of sensitive species)
- Ecological crisis framing (acknowledge without despair)

---

## Skill-Creator Integration

### Chipset Configuration (Part B Engine)

```yaml
name: pnw-360-species-engine
version: 1.0.0
description: >
  Autonomous continuous-release engine. 360 PNW species/soundscapes.
  Parallel to seattle-360 Part A. Bioacoustic theory mapping.
  Fleet activation. OCAP-compliant Indigenous attribution.

agents:
  topology: "pipeline"
  agents:
    - name: "RAVEN"          # Orchestrator (same as Part A — Ravens know both worlds)
    - name: "SALMON"         # Species intake (named for the species it processes)
    - name: "EAGLE"          # Acoustic mapper — sees frequency landscape (Wave 1A)
    - name: "ORCA"           # College linker (same as Part A — bridges worlds)
    - name: "HAWK"           # Fleet research generator (Opus)
    - name: "WARDEN"         # Safety warden (OCAP + species protection)
    - name: "HERON"          # Release pipeline (same as Part A)
    - name: "OWL"            # Retrospective engine (Opus)
    - name: "CEDAR"          # Carry-forward controller (cedars remember everything)
    - name: "CAPCOM"         # Human-in-loop (BLOCK escalations)

evaluation:
  gates:
    pre_release:
      - check: "safety-warden-pass"
        action: "block"
      - check: "ocap-compliance"
        action: "block"
      - check: "species-endangerment-sensitivity"
        action: "block"
      - check: "xelatex-compile-success"
        action: "block"
      - check: "no-precise-sensitive-locations"
        action: "block"
    post_release:
      - check: "knowledge-state-committed"
        action: "block"
      - check: "retrospective-written"
        action: "block"
```

---

## Scope Boundaries

### In Scope (Part B v1.0)
- All 360 entries in `pnw_360_species.csv` (degrees 0–359)
- Full Fleet research mission PDF per species/soundscape
- Acoustic theory mapping (frequency, rhythm, call structure, music parallel)
- College of Knowledge deep links (bioacoustics + mathematics + music + DIY art)
- Sequential release with carry-forward retrospectives
- OCAP®/CARE/UNDRIP-compliant attribution
- Species endangerment sensitivity handling
- New College departments: `.college/science/bioacoustics/`, `.college/diy-art/field-recording/`

### Out of Scope (Future)
- Actual audio recordings embedded in PDFs (Part D refinement)
- Interactive spectrogram visualizations (v2.0)
- Real-time NOAA/USGS data feeds for endangered species status (v2.0)
- Minecraft/GSD-OS acoustic environment integration (v3.0)

---

## Success Criteria

1. All 360 species/soundscapes produce a complete release artifact set
2. Every release PDF contains sourced bioacoustic analysis, music theory parallel
   section (≥3 nodes), College cross-references (≥3 departments), carry-forward
3. Safety Warden PASSES every release; SRKW/endangered species handled with full
   conservation context; no precise sensitive locations published
4. Indigenous attribution uses nation-specific language for all Coast Salish knowledge
5. New College departments `.college/science/bioacoustics/` and `.college/diy-art/`
   are seeded with at least 50 nodes each by degree 359
6. Every acoustic theory node has a direct music theory parallel with sourced evidence
7. `knowledge-state.json` accumulated correctly; bioacoustic genealogy tracks concept
   frequency across all 360 releases
8. Degrees 308–359 (soundscape compositions) are clearly flagged as `SOUNDSCAPE_COMPOSITION`
   and receive appropriate compositional analysis framing
9. The mathematics bridge (Fourier, sequences, physics) is present in every release
   with a frequency or rhythm component (estimated ≥280 releases)
10. By degree 359, the bioacoustic theory genealogy can show the full sonic continuum
    from a heron's silence to Puget Sound's final breath

---

## Relationship to Other Vision Documents

| Document | Relationship |
|----------|-------------|
| `seattle-360-mission/01-vision-doc.md` | Part A — parallel structure, same loop |
| `04-salish-sea-expansion-vision.md` | Geographic foundation for species distribution |
| `gsd-foxfire-heritage-skills-vision.md` | Cultural heritage + OCAP® framework |
| `gsd-silicon-layer-spec.md` | RTX 4060 Ti for audio processing (Part D) |
| *The Space Between* | Mathematical spine — frequency IS trigonometry |
| `gsd-os-desktop-vision.md` | GSD-OS bioacoustic display layer (Part C+) |

---

## The Through-Line

The Pacific Wren holds the record for the most complex song relative to body size of
any bird in North America. Its intricate cascade — a waterfall of precise frequency
modulation, micro-rhythmic variation, and silence — lasts approximately ten seconds and
contains more distinct musical phrases than a typical verse in a pop song. It has been
singing this way, in the old-growth understory of the Pacific Northwest, since before
humans arrived. It will continue doing so, if we leave enough old-growth standing.

This engine is the Amiga Principle applied to ecology: not a brute-force species
database, but an architectural intelligence that finds the theory in the biology, the
mathematics in the sound, the lesson in the life. The 360° rotation is complete when
a student can hear the Pacific Wren, understand the interval ratios in its song, trace
those ratios to *The Space Between*'s unit circle, find the parallel in Quincy Jones's
chord voicings, and feel the full circle close. At that moment, the PNW has given
back what it always had: the sound of everything, teaching everything, to anyone
willing to listen.

---
*Research priorities: NOAA Fisheries (SRKW, salmon), USGS (geology/hydrology), University
of Washington bioacoustics research, Cornell Lab of Ornithology (Macaulay Library),
Washington Department of Fish & Wildlife, Coast Salish cultural consultation protocols
(Duwamish Tribe, Muckleshoot Indian Tribe, Suquamish Tribe, Lummi Nation, Makah Tribe).*
