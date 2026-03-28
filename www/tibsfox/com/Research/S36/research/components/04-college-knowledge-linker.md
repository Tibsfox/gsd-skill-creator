# College Knowledge Linker — Component Specification

**Milestone:** Seattle 360 Continuous Artist Release Engine
**Wave:** 1B | **Track:** B (parallel with 1A)
**Model Assignment:** Sonnet
**Estimated Tokens:** ~6K per artist
**Dependencies:**
  - `ArtistProfile[N]` from component 01
  - `CollegeIndex[N]` (existing node inventory) from Wave 0
  - `TheoryGenealogy[N]` from Wave 0
  - `02-research-reference.md` §5 (College Dept Mapping) and §6 (Cross-Dept Mathematics)
**Produces:** `CollegeLinkList[N]` — minimum 3, maximum 12 deep links to `.college/` paths

---

## Objective

For the current artist, generate a `CollegeLinkList` — a set of structured deep links
into the GSD College of Knowledge hierarchy. Each link specifies an exact `.college/`
path, whether this artist's release CREATEs a new node or ENRICHes an existing one, and
what specific content this artist contributes. "Done" = a schema-valid `CollegeLinkList`
with ≥3 links, zero duplicates against `CollegeIndex`, and at least one mathematics bridge.

---

## Context

**The College of Knowledge (`.college/` directory) structure:**

```
.college/
├── mathematics/
│   ├── number-theory/ratios/
│   ├── trigonometry/unit-circle/     ← The Space Between connection
│   ├── calculus/fourier/             ← Timbre = sine wave decomposition
│   ├── sequences/                    ← Rhythm as integer sequences
│   └── l-systems/                    ← Musical phrase generation
├── music/
│   ├── theory/
│   │   ├── harmony/                  ← Chord structures, progressions
│   │   ├── rhythm/                   ← Meter, subdivision, polyrhythm
│   │   ├── scales/                   ← Scales, modes, inflections
│   │   ├── form/                     ← Song forms (12-bar, AABA, etc.)
│   │   ├── counterpoint/             ← Voice leading, independent lines
│   │   └── modal/                    ← Modal jazz, modal folk
│   ├── history/
│   │   ├── jazz/                     ← Jazz lineage
│   │   ├── seattle/                  ← Seattle-specific history
│   │   ├── punk-grunge/              ← Punk → grunge evolution
│   │   ├── riot-grrrl/               ← Feminist punk history
│   │   └── olympia-krecords/         ← K Records ecosystem
│   ├── performance/
│   │   └── guitar/                   ← Technique (fingerpicking, bends, tunings)
│   └── technology/
│       ├── synthesis/                ← Subtractive synthesis
│       └── sampling/                 ← Sampling theory, Nyquist
├── history/
│   └── pacific-northwest/            ← PNW cultural history
├── mind-body/
│   ├── listening/                    ← Active listening practice
│   ├── performance/                  ← Stage presence, practice psychology
│   └── music-therapy/               ← Emotional processing
└── rosetta/                         ← 7-language code panels (not primary here)
```

**CREATE vs ENRICH decision logic:**
- If the target path does NOT exist in `CollegeIndex` → CREATE
- If the target path DOES exist in `CollegeIndex` → ENRICH
- Prefer ENRICH over CREATE (the goal is a dense, cross-referenced College, not a sparse one)
- When ENRICHing, specify which section the artist's content goes into

**Mathematics Bridge rules (from Research Reference §6):**
- ANY harmonic theory node → link to `.college/mathematics/number-theory/ratios/`
- Synthesis/timbre → link to `.college/mathematics/calculus/fourier/`
- Polyrhythm/odd time → link to `.college/mathematics/sequences/`
- Modal theory → link to `.college/mathematics/trigonometry/unit-circle/` (The Space Between!)
- Rhythm patterns → link to `.college/mathematics/sequences/`

**The Unit Circle Bridge (MANDATORY for any modal/harmonic artist):**
The 360° CSV structure maps directly to the unit circle from *The Space Between*. Every
artist at degree N is at radian position (N × π/180). Modal theory uses the same circular
structure. This bridge MUST be made explicit for any artist with modal or harmonic theory.

**Neighborhood → History node mapping:**
- Central District (47.608, -122.2976) → `.college/music/history/seattle/central-district.md`
- Capitol Hill (47.623, -122.3155) → `.college/music/history/seattle/capitol-hill.md`
- Olympia (47.0379, -122.9007) → `.college/music/history/olympia-krecords/`
- Aberdeen area (~47.0, ~-123.8) → `.college/music/history/seattle/aberdeen-grunge.md`
- Sub Pop label → `.college/music/history/punk-grunge/sub-pop.md`
- K Records label → `.college/music/history/olympia-krecords/k-records.md`

---

## Technical Specification

### Interfaces
Input: `ArtistProfile`, `CollegeIndex`, `TheoryGenealogy`
Output: `CollegeLinkList` (see `00-shared-types.md`)

### Behavioral Requirements

**MUST:**
- Generate minimum 3, maximum 12 links
- At least 1 link to `.college/mathematics/` (mathematics bridge)
- At least 1 link to `.college/music/history/` (cultural/historical context)
- At least 1 link to `.college/music/theory/` (theory content)
- For high-energy artists (energy ≥7): include `.college/mind-body/performance/`
- For Olympia-based artists: always include `.college/music/history/olympia-krecords/`
- For Central District artists: always include `.college/music/history/seattle/central-district.md`
- Check `CollegeIndex` before every CREATE — if path exists, switch to ENRICH
- For ENRICH links: specify the `section` field (which part of the existing node gets enriched)
- The unit circle bridge MUST appear for any artist with modal theory nodes

**MUST NOT:**
- Create a node that already exists (check CollegeIndex strictly)
- Create more than 5 new nodes per release (prefer enrichment over proliferation)
- Link to Rosetta (`.college/rosetta/`) — that's for language panel content, not music theory
- Leave `description` field vague — each link must say what THIS artist specifically contributes

---

## Implementation Steps

1. Load `02-research-reference.md` §5 and §6 as context.
2. Read `ArtistProfile`, `CollegeIndex`, `TheoryGenealogy` from Wave 0 bundle.
3. Identify primary department targets from genre/neighborhood/label.
4. For each target path: check against `CollegeIndex`; set CREATE or ENRICH.
5. Generate description for each link (what this artist contributes).
6. Add mathematics bridge links (one per applicable math domain).
7. Add neighborhood/history link.
8. Add mind-body link if energy ≥7.
9. Enforce minimum 3, maximum 12 constraint (trim if over, add math bridge if under).
10. Validate against `college-link-list.schema.json`.
11. Return `CollegeLinkList`.

---

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| CL-01 | Any artist | CollegeLinkList.links.length >= 3 | Minimum met |
| CL-02 | Any artist | At least 1 mathematics bridge | isMathBridge=true on ≥1 link |
| CL-03 | degree=0 (Quincy Jones, Central District) | `.college/music/history/seattle/central-district.md` present | History link present |
| CL-04 | degree=276 (Bikini Kill, Olympia) | `.college/music/history/olympia-krecords/` present | Olympia link present |
| CL-05 | degree=53 (Fleet Foxes, modal theory) | `.college/mathematics/trigonometry/unit-circle/` present | Unit circle bridge |
| CL-06 | Artist 2 in same genre as Artist 1 | Second artist's target → ENRICH not CREATE | linkType="ENRICH" |
| CL-07 | energy=10 (Botch, degree=344) | `.college/mind-body/performance/` present | High-energy link |
| CL-08 | Any artist with synthesis/electronic | `.college/mathematics/calculus/fourier/` present | Fourier bridge |

## Verification Gate

- [ ] Schema validation passes
- [ ] Minimum 3 links present
- [ ] At least 1 mathematics bridge
- [ ] No paths that exist in CollegeIndex with linkType=CREATE
- [ ] All `description` fields non-empty and artist-specific
- [ ] CL-01 through CL-08 pass

## Safety Boundaries

| Constraint | Boundary Type |
|-----------|---------------|
| No duplicate CREATE of existing College nodes | ABSOLUTE |
| Central District artists MUST have history link | GATE |
| Olympia artists MUST have K Records link | GATE |
