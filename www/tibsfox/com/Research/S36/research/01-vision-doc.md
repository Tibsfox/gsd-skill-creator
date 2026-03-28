# Seattle 360 — Continuous Artist Release Engine
## Vision Guide

**Date:** 2026-03-28
**Status:** Initial Vision / Pre-Research
**Depends on:** `gsd-skill-creator-analysis.md`, `unit-circle-skill-creator-synthesis.md`,
              `.college/` (Rosetta Core), `gsd-chipset-architecture-vision.md`,
              *The Space Between* (mathematical foundations)
**Context:** An autonomous, continuous-release educational engine that processes 360
             Seattle-area artists — arranged as a unit circle — and produces a full Fleet
             research mission pack per artist, with deep College of Knowledge integration,
             music theory curriculum mapping, and retrospec tive-driven learning across all
             360 releases.

---

## Vision

There is a moment every music teacher knows: a student finally *hears* the ii–V–I in a
Bill Evans chord, or feels the tritone substitution drop in a Quincy Jones arrangement,
and something irreversible happens. Theory stops being notation on a page and becomes a
living thing — audible, tactile, *theirs*. The Seattle music scene, spanning jazz
institutions on the Central District's Jackson Street corridor to the grunge detonation of
1991 Capitol Hill, is one of the richest classrooms on the continent. Every artist in
this dataset is a lesson hiding inside a discography.

The problem is that these lessons have never been taught at scale with the depth they
deserve. Existing resources treat artists as cultural artifacts — biographical, historical,
anecdotal. They do not say: *here is why Jimi Hendrix's use of the Lydian mode in* "Bold
as Love" *maps directly to the unit circle's fourth-quadrant harmonic series*; they do not
say: *here is how Bill Frisell's chromaticism is a direct descendant of the tritone
substitutions Quincy Jones was writing in the Central District forty years earlier*. The
connections — the spaces between — remain invisible.

The Seattle 360 Continuous Release Engine changes that. It treats the 360-artist CSV as
what it structurally is: a unit circle. Degree 0 (Quincy Jones, jazz, low energy, 1950s)
to degree 359 (Unwound, post-hardcore, peak intensity, 2001). Each degree is a release.
Each release is a full Fleet research mission — sourced, theorized, cross-referenced,
curriculum-mapped — that links outward to the College of Knowledge's music theory
departments, mathematics foundations from *The Space Between*, and the deep tissue of
Seattle cultural history. Retrospectives after each release accumulate into a living
`knowledge-state.json` that seeds the next mission, making the 360th release richer than
the first by the accumulated wisdom of 359 prior lessons.

This is the Amiga Principle as pedagogy: not a brute-force encyclopedia of 360 artist
bios, but an architectural system that generates insight through intelligent traversal —
each release connected to every other by the theory that runs underneath them all.

---

## Problem Statement

1. **Music education is disconnected from actual artists.** Theory curricula teach
   abstract concepts; artist studies teach biography. The bridge — *show me the theory
   in the music I love* — is almost never built at scale.

2. **Seattle's musical lineage is pedagogically unmapped.** The direct lineage from
   Ray Charles's Central District residency → Jimi Hendrix's blues roots → grunge's
   power-chord minimalism → Bikini Kill's riot grrrl deconstruction is one of music
   history's richest theory progressions. It has never been traced as a curriculum.

3. **Research missions are one-and-done.** Each mission is produced in isolation. The
   200th release has no memory of what the 50th release taught. Lessons decay rather
   than compound.

4. **Cross-referencing between College departments is manual.** A music theory node in
   `.college/music/` and a frequency-ratio proof in `.college/mathematics/` are not
   automatically linked even when they share deep structure. Semantic connections require
   explicit architecture.

5. **Cultural attribution is uneven.** Indigenous and Black American musical foundations
   are sources, not subjects, in most curricula. The Central District's jazz lineage and
   the Coast Salish musical traditions that predate every artist in this dataset require
   OCAP®-compliant handling and nation-specific attribution — not generic acknowledgment.

---

## Core Concept

**Research → Map → Link → Release → Retrospect → Carry Forward → Repeat.**

The engine reads one artist from the CSV, runs a full Fleet research mission (sourced,
theorized, structured), maps the artist's musical DNA to College of Knowledge curriculum
nodes, creates deep cross-reference links, produces the release artifacts, runs a
retrospective, extracts lessons learned, and seeds the next artist's mission with that
accumulated context. The loop repeats 360 times.

### Release Cycle Architecture

```
 CSV Row [N]
     │
     ▼
┌─────────────────────────────────────────────────┐
│  WAVE 0: FOUNDATION                              │
│  ┌──────────────────┐  ┌─────────────────────┐  │
│  │  ArtistProfile   │  │  KnowledgeState[N]  │  │
│  │  (from CSV row)  │  │  (from retro N-1)   │  │
│  └──────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────┘
     │                           │
     ▼                           ▼
┌─────────────────┐   ┌─────────────────────────┐
│  WAVE 1A        │   │  WAVE 1B                │
│  Music Theory   │   │  College Knowledge      │
│  Mapper         │   │  Linker                 │
│  (Sonnet)       │   │  (Sonnet)               │
└────────┬────────┘   └────────────┬────────────┘
         └──────────┬──────────────┘
                    ▼
     ┌──────────────────────────────┐
     │  WAVE 2: FLEET RESEARCH GEN  │
     │  Full research mission PDF   │
     │  .tex source + index.html    │
     │  (Opus — synthesis)          │
     └──────────────┬───────────────┘
                    ▼
     ┌──────────────────────────────┐
     │  WAVE 3: RELEASE + RETRO     │
     │  Release artifacts           │
     │  Retrospective.md            │
     │  KnowledgeState[N+1]         │
     │  (Sonnet + Safety Warden)    │
     └──────────────┬───────────────┘
                    ▼
              CSV Row [N+1]
```

---

## Architecture

### Component Map

```
seattle-360-engine/
│
├── 00-shared-types ──────────────────────── Wave 0 foundation
│     ArtistProfile, MissionPack,
│     RetrospectiveRecord, KnowledgeState,
│     CollegeLink, TheoryNode schemas
│
├── 01-csv-intake-engine ──────────────────── Wave 0
│     Reads CSV → emits ArtistProfile[360]
│     Enriches with genre → theory domain mapping
│
├── 02-music-theory-mapper ────────────────── Wave 1A
│     ArtistProfile → TheoryNodeList
│     Maps genre, era, energy → curriculum path
│     Sources: College mathematics + music depts
│
├── 03-fleet-research-generator ───────────── Wave 2
│     TheoryNodeList + ArtistProfile → MissionPack
│     Full LaTeX PDF, .tex, index.html
│     Chipset YAML, wave plan, test plan per artist
│
├── 04-college-knowledge-linker ───────────── Wave 1B
│     ArtistProfile → CollegeLinkList
│     Deep links to .college/ departments
│     Cross-reference injection into release
│
├── 05-release-pipeline ───────────────────── Wave 3
│     MissionPack + CollegeLinkList → Release artifacts
│     Sequential state management across 360 runs
│
├── 06-retrospective-engine ───────────────── Wave 3
│     Release artifacts → RetrospectiveRecord
│     Lessons learned extraction (Opus)
│
├── 07-carry-forward-controller ───────────── Wave 3 → Wave 0[N+1]
│     RetrospectiveRecord → KnowledgeState[N+1]
│     Seeds next artist's mission context
│
└── 08-safety-warden ──────────────────────── Wave 3 (critical path)
      Attribution audit (OCAP®, CARE, UNDRIP)
      Factual accuracy gates
      Cultural sensitivity review
```

**Cross-component connections:**
- `01-csv-intake-engine` → `02-music-theory-mapper` — ArtistProfile with genre/era/energy
- `01-csv-intake-engine` → `04-college-knowledge-linker` — ArtistProfile with neighborhood/label
- `02-music-theory-mapper` + `04-college-knowledge-linker` → `03-fleet-research-generator` — Full context bundle
- `03-fleet-research-generator` → `05-release-pipeline` — MissionPack artifacts
- `05-release-pipeline` → `06-retrospective-engine` — Published release record
- `06-retrospective-engine` → `07-carry-forward-controller` — RetrospectiveRecord
- `07-carry-forward-controller` → next Wave 0 — KnowledgeState[N+1]
- `08-safety-warden` ↔ `05-release-pipeline` — BLOCK/ANNOTATE/GATE signals

---

## Module Descriptions

### Module 1: CSV Intake Engine
**Purpose:** Transform each row of `seattle_360_geo.csv` into a structured ArtistProfile
that downstream components can consume without ever touching the raw CSV again.

**Key concepts:**
- Degree (0–359) as unit-circle coordinate — the artist's position in Seattle's musical
  rotation. Degree = arc minute = educational sequence position.
- Energy (1–10) as pedagogical intensity signal — low-energy artists get foundational
  theory treatment; high-energy artists get advanced harmonic/rhythmic analysis.
- Neighborhood as cultural context anchor — Central District, Capitol Hill, Olympia each
  have distinct musical lineages requiring distinct attribution frameworks.

**Entry point:** `gsd run component 01-csv-intake-engine --input seattle_360_geo.csv`

**Safety considerations:** Deceased artists (Gary Peacock, Ernestine Anderson, etc.) require
past-tense treatment. Artists with Indigenous heritage (Quincy Jones's connections, etc.)
require OCAP®-aware handling. See `08-safety-warden`.

**Cross-references:** Feeds `02-music-theory-mapper`, `04-college-knowledge-linker`

---

### Module 2: Music Theory Mapper
**Purpose:** For every artist, produce a `TheoryNodeList` — a structured set of music
theory concepts that are directly audible in that artist's work, mapped to College of
Knowledge curriculum nodes.

**Key concepts:**
- Genre → theory domain mapping (Jazz → chord extensions, modal theory, voice leading;
  Blues → pentatonic scale, 12-bar form, bent notes; Grunge → power chords, drop-D,
  modal minor; Punk → minimalism, energy transfer, rhythmic drive)
- Era → theory vocabulary (1950s jazz uses different harmonic language than 1980s fusion)
- Energy level → curriculum depth (energy 1–3 = foundational; 4–6 = intermediate; 7–10 = advanced)
- Cross-era connections — the theory lineage *between* artists (how Quincy Jones's
  arrangements echo in Polyrhythmics' rhythmic layering 60 years later)

**Entry point:** Consumes ArtistProfile from component 01; runs concurrently with component 04

**Safety considerations:** Do not generate theory claims without auditory evidence
from the artist's work. Theory attributions must be verifiable.

**Cross-references:** College of Knowledge `.college/music/theory/`, `.college/mathematics/`
(frequency ratios, Fourier), *The Space Between* Chapter refs

---

### Module 3: Fleet Research Generator
**Purpose:** Produce the full publication-quality research mission artifact set for each
artist: LaTeX PDF, .tex source, index.html — following the three-stage Vision → Research
→ Mission pipeline of the research-mission-generator skill.

**Key concepts:**
- Each artist gets a **Fleet-profile mission** (full crew, Opus synthesis)
- The research section covers: biography (sourced), musical DNA (theory-mapped),
  cultural context (attributed), College links (deep), lessons-forward (carry items)
- The mission section covers: how to build this artist's theory module into `.college/`
- NASA SE verbosity standard: every claim sourced, every number attributed

**Entry point:** Consumes TheoryNodeList + CollegeLinkList + KnowledgeState from prior artist

**Safety considerations:** All biographical claims require professional source attribution.
Indigenous heritage connections require nation-specific language (never "Native American"
as monolith). Central District jazz history requires Black American cultural attribution.

**Cross-references:** `02-music-theory-mapper` (theory), `04-college-knowledge-linker` (college)

---

### Module 4: College Knowledge Linker
**Purpose:** For each artist, generate a `CollegeLinkList` — structured deep-links into
the `.college/` directory hierarchy, identifying which existing modules the artist
enriches and which new modules the artist's release should create.

**Key concepts:**
- `.college/` departments: mathematics, music, culinary arts, mind-body, history/culture,
  technology, language (Rosetta panels: Python, C++, Java, Perl, Lisp, Pascal, Fortran)
- Deep linking: not just "this artist → music department" but "this artist's use of
  the tritone substitution → `.college/music/theory/harmony/tritone-sub.md`"
- Creation vs. enrichment: some releases create new nodes; others add cross-reference
  examples to existing nodes (e.g., every grunge artist enriches the power-chord node)
- Mathematics bridge: frequency ratios, beat subdivision, polyrhythm → `.college/mathematics/`
  seeded from *The Space Between*'s unit circle and L-system chapters

**Entry point:** Runs concurrently with component 02 in Wave 1B

**Safety considerations:** College nodes must not duplicate existing content; they must
link to it. Duplication detection runs before any new node creation.

**Cross-references:** `.college/` directory tree, `gsd-bbs-educational-pack-vision.md`

---

### Module 5: Release Pipeline
**Purpose:** The sequential coordinator that ensures exactly one artist is processed
at a time, state is persisted across all 360 releases, and the release artifacts land
in the correct output paths with correct naming.

**Key concepts:**
- Sequential guarantee: artist N+1's Wave 0 cannot begin until artist N's Wave 3 is
  complete and `knowledge-state.json` has been written
- Resumability: if the engine is interrupted at artist #147, it resumes at #147 (not #0)
  using the last committed `knowledge-state.json`
- Naming convention: `releases/seattle-360/NNN-[artist-slug]/` (zero-padded to 3 digits)
- Progress ledger: `releases/seattle-360/progress.json` tracks completed/failed/pending

**Entry point:** Receives MissionPack from component 03; orchestrates all Wave 3 components

**Safety considerations:** Atomic writes only — partial releases must be rolled back.
Completed releases are write-protected after retrospective commit.

**Cross-references:** `07-carry-forward-controller`, `06-retrospective-engine`

---

### Module 6: Retrospective Engine
**Purpose:** After each artist release, produce a structured `retrospective.md` that
captures: what the research revealed (surprises, theory connections not anticipated),
what the College links produced (new nodes, enrichments), and explicit "carry items"
for the next mission.

**Key concepts:**
- NASA SE "lessons learned" format: situation → root cause → recommendation → carry item
- Three retrospective tiers: IMMEDIATE (affects next 1–5 artists), PATTERN (affects
  entire genre quadrant), ARCHITECTURAL (affects the engine design itself)
- Theory genealogy tracking: "this artist is the third to exhibit tritone substitution —
  College node now has three examples, ready to be promoted to a full lesson"
- Accumulation signal: when a theory concept appears in 5+ retrospectives, it triggers
  a College department module promotion

**Entry point:** Receives published release record from component 05

**Safety considerations:** Retrospectives must not contain speculative claims about
living artists. Carry items must be tagged as CONFIRMED or INFERRED.

**Cross-references:** `07-carry-forward-controller`, `03-fleet-research-generator`

---

### Module 7: Carry-Forward Controller
**Purpose:** Transform the `RetrospectiveRecord` from artist N into the `KnowledgeState`
that seeds artist N+1's Wave 0. The carry-forward is the mechanism that makes the 360th
release richer than the 1st.

**Key concepts:**
- `KnowledgeState` is cumulative: it grows with each release, summarized at each step
  to stay within token budget (~10K tokens for the state document)
- Theory genealogy map: tracks which concepts have been seen, how many times, and which
  artists exemplify each concept best
- College node inventory: running list of all nodes created/enriched, to prevent duplication
- Surprise register: things the engine didn't predict that turned out to be significant —
  these get elevated weighting in subsequent missions
- Compression strategy: full state is maintained; a 2K "active context" summary is
  extracted per mission to keep Wave 0 fast

**Entry point:** Receives RetrospectiveRecord from component 06; writes KnowledgeState[N+1]

**Safety considerations:** KnowledgeState must not carry forward unverified claims.
Only CONFIRMED carry items are written to the persistent state.

**Cross-references:** `06-retrospective-engine`, `01-csv-intake-engine` (next iteration)

---

### Module 8: Safety Warden
**Purpose:** Enforce attribution, accuracy, and cultural sensitivity gates before any
release is published. Cannot be bypassed. Operates in three modes: ANNOTATE (flag for
awareness), GATE (confirm before proceeding), BLOCK (halt release, require correction).

**Key concepts:**
- Attribution audit: every biographical claim traced to a professional source
- Cultural sensitivity: Indigenous heritage (OCAP®, CARE, UNDRIP), Black American
  musical foundations (explicit attribution, not "roots" language), gender and identity
  (Riot Grrrl artists, trans/queer histories in Seattle's music scene)
- Living vs. deceased: different treatment protocols (privacy for living, legacy for deceased)
- Central District jazz lineage: Black American cultural institution requiring explicit,
  respectful framing — not as "influence" but as authorship and origin
- Nation-specific language: Duwamish, Muckleshoot, Suquamish (not "local tribes")

**Entry point:** Runs during Wave 3, on the critical path — release cannot publish without
a PASS signal from the Safety Warden

**Safety considerations:** The Safety Warden is itself a safety system. It has no
"always approve" path. BLOCK-level findings escalate to CAPCOM (human review).

**Cross-references:** All components — the Safety Warden reads every artifact

---

## Skill-Creator Integration

### Chipset Configuration (Meta-Engine)

```yaml
name: seattle-360-release-engine
version: 1.0.0
description: >
  Autonomous continuous-release engine for 360 Seattle artist education packs.
  Processes one artist per cycle, accumulates knowledge state, terminates at degree 359.

skills:
  csv-intake:
    domain: data-ingestion
    description: "Parse seattle_360_geo.csv → ArtistProfile[]. Trigger: new release cycle."
  theory-mapper:
    domain: music-education
    description: "Map ArtistProfile → TheoryNodeList. Trigger: ArtistProfile available."
  fleet-research-gen:
    domain: research-mission
    description: "Synthesize full Fleet research PDF per artist. Trigger: theory + college links ready."
  college-linker:
    domain: college-knowledge
    description: "Map ArtistProfile → CollegeLinkList. Trigger: ArtistProfile available."
  release-pipeline:
    domain: release-management
    description: "Coordinate sequential release. Trigger: MissionPack complete."
  retrospective-engine:
    domain: lessons-learned
    description: "Extract RetrospectiveRecord. Trigger: release published."
  carry-forward:
    domain: state-management
    description: "KnowledgeState[N+1] from RetrospectiveRecord. Trigger: retrospective complete."
  safety-warden:
    domain: safety
    description: "Attribution + sensitivity audit. Trigger: pre-publish. BLOCK/GATE/ANNOTATE."

agents:
  topology: "pipeline"
  agents:
    - name: "RAVEN"        # orchestrator
      role: "Flight director — coordinates all waves, holds go/no-go authority"
    - name: "SALMON"       # csv-intake
      role: "CSV ingestion and ArtistProfile generation"
    - name: "CEDAR"        # theory-mapper
      role: "Music theory curriculum mapping"
    - name: "ORCA"         # college-linker
      role: "College of Knowledge deep-link generation"
    - name: "HAWK"         # fleet-research-gen
      role: "Fleet research mission synthesis (Opus)"
    - name: "HERON"        # release-pipeline
      role: "Sequential release coordination"
    - name: "OWL"          # retrospective-engine
      role: "Lessons learned extraction (Opus)"
    - name: "DOUGLAS-FIR"  # carry-forward
      role: "Knowledge state management and next-mission seeding"
    - name: "WARDEN"       # safety-warden
      role: "Attribution, accuracy, and cultural sensitivity enforcement"

evaluation:
  gates:
    pre_release:
      - check: "safety-warden-pass"
        action: "block"
      - check: "attribution-complete"
        action: "block"
      - check: "college-links-resolved"
        action: "block"
      - check: "theory-nodes-sourced"
        action: "warn"
    post_release:
      - check: "retrospective-written"
        action: "block"
      - check: "knowledge-state-committed"
        action: "block"
      - check: "progress-ledger-updated"
        action: "warn"
```

---

## Scope Boundaries

### In Scope (v1.0)
- All 360 artists in `seattle_360_geo.csv` (degrees 0–359)
- Full Fleet research mission PDF per artist (LaTeX + .tex + index.html)
- Music theory curriculum mapping for each artist (genre-specific)
- Deep College of Knowledge links (minimum 3 departments per release)
- Sequential release with carry-forward retrospectives
- Safety Warden enforcement on every release
- Progress resumability (interrupt and resume at any artist)
- `knowledge-state.json` accumulation across all 360 releases

### Out of Scope (Future Considerations)
- Audio analysis / MIDI representation of theory concepts (v2.0)
- Interactive College module rendering in GSD-OS (v2.0)
- Live performance event cross-referencing (v2.0)
- International artist comparison (e.g., Seattle → Chicago → New Orleans lineage) (v2.0)
- Minecraft server integration for Foxy's Playground music-world nodes (v3.0)
- Vera Rubin / Global Shutter telescope mesh integration for Yuri's Night events (v3.0)

---

## Success Criteria

1. All 360 artists produce a complete release artifact set (PDF + .tex + index.html +
   knowledge-nodes.json + retrospective.md) in `releases/seattle-360/NNN-[slug]/`

2. Every release PDF contains: sourced biography, music theory section with ≥3 theory
   concepts directly tied to the artist's audible work, College of Knowledge cross-reference
   section with ≥3 department links, and a carry-forward section.

3. The Safety Warden passes (no BLOCK-level findings) on every release before publication.
   BLOCK-level findings trigger CAPCOM escalation and halt the pipeline.

4. `knowledge-state.json` is updated atomically after every retrospective; the engine
   can be interrupted and resumed at any artist without state loss.

5. Every theory concept taught references at minimum one *audible* example (track + timestamp
   or structural description) from the artist's discography.

6. Central District jazz artists (degrees 0–11, 25–34, etc.) carry explicit attribution
   to Black American musical foundations with professional citation.

7. Indigenous cultural connections (Duwamish, Muckleshoot, Suquamish territories where
   relevant) are attributed with nation-specific language, never generic.

8. College of Knowledge nodes created/enriched per release are tracked in the
   `knowledge-nodes.json` manifest; no duplicate node creation occurs across the 360 runs.

9. By degree 359 (Unwound), the `theory-genealogy.json` tracks the complete theoretical
   lineage from jazz foundations to post-hardcore — a connected graph across all 360 artists.

10. The engine processes artists sequentially with the carry-forward controller demonstrably
    enriching later missions — theory genealogy entries from early releases appear as
    cross-references in later releases.

11. Every retrospective contains at least one IMMEDIATE carry item, and the carry-forward
    controller verifiably includes it in the next artist's mission seed.

12. The full 360-release run completes within estimated token budget (±20%), with per-artist
    token consumption logged to `releases/seattle-360/token-ledger.json`.

---

## Relationship to Other Vision Documents

| Document | Relationship |
|----------|-------------|
| `gsd-skill-creator-analysis.md` | Execution engine — skill-creator runs every fleet mission |
| `unit-circle-skill-creator-synthesis.md` | Mathematical metaphor — 360° CSV IS the unit circle |
| `gsd-bbs-educational-pack-vision.md` | Output format — releases are BBS-compatible packs |
| `gsd-chipset-architecture-vision.md` | Chipset YAML patterns for each artist mission |
| `gsd-amiga-vision-architectural-leverage.md` | Amiga Principle governs engine architecture |
| `gsd-foxfire-heritage-skills-vision.md` | Cultural heritage framing for attribution standards |
| *The Space Between* | Mathematical spine — frequency, rhythm, L-systems seeded in theory nodes |
| `gsd-os-desktop-vision.md` | GSD-OS delivers the College of Knowledge content the engine produces |

---

## The Through-Line

Jackson Street in Seattle's Central District was once called the "Harlem of the West" —
a corridor where Ray Charles, Quincy Jones, Ernestine Anderson, and dozens more learned
their craft before any of them were famous. That corridor produced a theory of music
that flowed forward through decades: into the ECM jazz of Bill Frisell and Gary Peacock,
into the soul-inflected grunge that made Sub Pop a household name, into the riot grrrl
deconstructions of Olympia, into the mathcore precision of Botch. The thread never broke.
It just changed key.

This engine is built to trace that thread. The College of Knowledge is the destination;
*The Space Between*'s mathematics are the scaffold; the Amiga Principle is the guide.
Remarkable educational depth not through brute-force biography, but through architectural
intelligence — each artist a node in a graph where the edges carry the real lessons.
The 360° rotation is complete when the knowledge state has closed the loop: when the
engine can show, in verifiable connected steps, how Quincy Jones at 0° and Unwound at
359° are teaching the same mathematics in different languages.

---
*This vision guide is intended as input for GSD's `new-project` workflow.
Prioritize ALLMUSIC, Grove Music Online (via university library access), Discogs (for
label/release data), and KEXP's archive for source material. Black Music Research Journal
and the Seattle Civil Rights & Labor History Project are authoritative for Central District
attribution. Do not use Wikipedia as a primary source; use it only to locate citable sources.*
