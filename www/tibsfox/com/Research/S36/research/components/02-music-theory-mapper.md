# Music Theory Mapper — Component Specification

**Milestone:** Seattle 360 Continuous Artist Release Engine
**Wave:** 1A | **Track:** A (parallel with 1B)
**Model Assignment:** Sonnet
**Estimated Tokens:** ~8K per artist
**Dependencies:**
  - `ArtistProfile[N]` from component 01
  - `ActiveContext[N]` (KnowledgeState summary) from Wave 0
  - `TheoryGenealogy[N]` from Wave 0
  - `02-research-reference.md` §3 (Genre Theory Maps) and §4 (Era Vocabulary) — loaded as context
**Produces:** `TheoryNodeList[N]` — minimum 3, maximum 8 theory concepts for this artist

---

## Objective

Map the current artist's genre, era, energy level, and neighborhood to a `TheoryNodeList`
— a structured set of music theory concepts directly audible in that artist's work, each
connected to College of Knowledge curriculum nodes and the running theory genealogy.
"Done" = a schema-valid `TheoryNodeList` with at least 3 nodes, each with an audible
evidence reference and a College node target path.

---

## Context

**Genre → Theory Domain Mapping (from Research Reference §3):**

| Genre Signal | Theory Domains |
|-------------|---------------|
| Jazz | Chord extensions, ii-V-I, tritone substitution, modal jazz, swing rhythm, call-and-response, blue notes |
| Blues | 12-bar form, blues scale, bent notes, shuffle rhythm, dominant 7th as tonic |
| Soul/R&B | Gospel harmony (IV-I), pentatonic major, syncopation, melisma, call-and-response |
| Folk/Singer-Songwriter | Diatonic harmony (I-IV-V-vi), fingerpicking, voice leading, modal scales, open tunings |
| Indie Folk | Same as folk + counterpoint, layered harmonics |
| Electronic/Indie Electronic | Synthesis (subtractive), sequencing, four-on-the-floor, sampling theory |
| Grunge | Drop-D tuning, power chords, modal minor, riff construction |
| Hard Rock/Metal | Drop-D, Lydian (Soundgarden), Phrygian dominant (Alice in Chains), riff construction |
| Hardcore Punk | Power chords, minimalism-as-theory, rhythmic drive, riot grrrl deconstruction |
| Sludge/Drone Metal | Sustained tones, Helmholtz resonance, drone theory |
| Mathcore | Odd time signatures (7/8, 11/8), polyrhythm, metric modulation |
| Post-Hardcore | Dynamic range theory, tension-release structure |
| Jazz/Funk | Groove theory, syncopation, polyrhythm, funk rhythm (sixteenth-note subdivision) |
| Post-Grunge | Alternative chord voicings, dynamic contrast, verse-chorus architecture |

**Era → Vocabulary (from Research Reference §4):**
- 1940s–1950s: bebop extensions, Tin Pan Alley, 32-bar AABA form
- 1960s: modal jazz, soul/gospel inflection, British Invasion I-IV-V-I
- 1970s: fusion, funk syncopation, progressive rock odd time
- 1980s: new wave synthesis, hair metal harmony, punk minimalism
- 1990s: grunge power, riot grrrl deconstruction, alt-country modal
- 2000s–present: fully contemporary; post-rock dynamics, neo-soul complexity

**Curriculum Depth Mapping (from ArtistProfile.curriculumDepth):**
- foundational (energy 1–3): basic definitions, primary examples, entry-level application
- intermediate (energy 4–6): secondary techniques, cross-concept connections, application exercises
- advanced (energy 7–10): edge cases, historical context, performance/composition application

**Theory Genealogy (from KnowledgeState):**
When a concept appears in the genealogy, the new TheoryNode's `genealogyLinks` must
reference the prior artists. This is the carry-forward chain that makes later releases richer.

**Special Cases:**
- Jimi Hendrix (degree=36): Include Lydian mode explicitly (audible in "Bold as Love")
- Botch (degrees 289, 332, 344, 352): Include odd time signatures and metric modulation
- Soundgarden (degrees 312, 335, 346): Include Lydian mode (Kim Thayil's known usage)
- Alice in Chains (degrees 313, 336, 347): Include Phrygian dominant ("Down in a Hole")
- Bikini Kill (degrees 276, 357): Include riot grrrl deconstruction as a theory concept
- Fleet Foxes (degree 53): Include counterpoint explicitly (audible in harmonized vocals)
- Melvins (degrees 308, 334, 345): Include drone theory and Helmholtz resonance
- Polyrhythmics (degree 21): Include polyrhythm and groove theory explicitly

---

## Technical Specification

### Interfaces
Input: `ArtistProfile`, `ActiveContext`, `TheoryGenealogy`
Output: `TheoryNodeList` (see `00-shared-types.md`)

### Behavioral Requirements

**MUST:**
- Generate minimum 3, maximum 8 TheoryNodes
- Each node MUST have an `audibleEvidence` field with a specific, verifiable reference
  to the artist's work (track name, or structural description if track unknown)
- Each node MUST have a `collegeNodePath` targeting a specific `.college/` path
- Nodes must be appropriate to the artist's genre AND era (do not project anachronistic theory)
- `genealogyLinks` must be populated when the concept appears in `TheoryGenealogy`
- For Jazz artists: always include at least one harmonic node (chord extensions, ii-V-I, or modal)
- For grunge/metal: always include at least one rhythmic/structural node (drop-D, power chord, riff)
- Mathematics bridge populated when concept has direct mathematical analog

**MUST NOT:**
- Assert theory concepts not supported by audible evidence
- Use era-inappropriate vocabulary (no "drop-D tuning" for 1950s jazz artists)
- Create duplicate conceptIds within a single TheoryNodeList
- Claim a theory concept for an artist without an audible evidence reference

### Primary Theory Concept Library (conceptId → details)

```
ii-v-i-progression      → ".college/music/theory/harmony/ii-v-i.md"        → math: interval ratios
tritone-substitution    → ".college/music/theory/harmony/tritone-sub.md"    → math: tritone = augmented 4th
modal-jazz-dorian       → ".college/music/theory/scales/modes.md"           → math: diatonic scale rotations
chord-extensions        → ".college/music/theory/harmony/extensions.md"     → math: tertian stacking
swing-rhythm            → ".college/music/theory/rhythm/swing.md"           → math: triplet subdivision
call-and-response       → ".college/music/theory/form/call-response.md"    → (no math bridge)
blue-notes              → ".college/music/theory/scales/blue-notes.md"      → (no math bridge)
12-bar-blues-form       → ".college/music/theory/form/12-bar-blues.md"      → (no math bridge)
blues-scale             → ".college/music/theory/scales/blues-scale.md"     → math: pentatonic + tritone
bent-notes-vibrato      → ".college/music/performance/guitar/bends.md"      → (no math bridge)
gospel-harmony          → ".college/music/theory/harmony/gospel.md"         → (no math bridge)
syncopation             → ".college/music/theory/rhythm/syncopation.md"     → math: beat displacement
diatonic-harmony        → ".college/music/theory/harmony/diatonic.md"       → math: scale degree ratios
fingerpicking-travis    → ".college/music/performance/guitar/fingerpicking.md" → (no math bridge)
voice-leading           → ".college/music/theory/counterpoint/voice-leading.md" → math: minimal motion
counterpoint            → ".college/music/theory/counterpoint/two-voice.md" → math: independent lines
open-tunings            → ".college/music/performance/guitar/tunings.md"    → math: frequency ratios
subtractive-synthesis   → ".college/music/technology/synthesis.md"          → math: Fourier/harmonics
sampling-nyquist        → ".college/music/technology/sampling.md"           → math: Nyquist theorem
power-chord             → ".college/music/theory/harmony/power-chords.md"   → math: perfect 5th ratio
drop-d-tuning           → ".college/music/performance/guitar/drop-d.md"     → math: octave transposition
riff-construction       → ".college/music/composition/riff.md"              → (no math bridge)
lydian-mode             → ".college/music/theory/scales/modes.md"           → math: raised 4th interval
phrygian-dominant       → ".college/music/theory/scales/modes.md"           → math: ♭2 interval
modal-minor             → ".college/music/theory/scales/modes.md"           → math: scale rotations
polyrhythm              → ".college/music/theory/rhythm/polyrhythm.md"      → math: integer ratios
odd-time-signatures     → ".college/music/theory/rhythm/odd-time.md"        → math: prime-number meters
metric-modulation       → ".college/music/theory/rhythm/metric-mod.md"      → math: tempo ratios
groove-theory           → ".college/music/theory/rhythm/groove.md"          → math: sixteenth subdivision
drone-theory            → ".college/music/theory/harmony/drone.md"          → math: Helmholtz resonance
dynamic-range-theory    → ".college/music/composition/dynamics.md"          → (no math bridge)
minimalism-as-theory    → ".college/music/composition/minimalism.md"        → (no math bridge)
riot-grrrl-deconstruct  → ".college/music/history/riot-grrrl.md"            → (no math bridge)
tension-release         → ".college/music/composition/tension-release.md"   → math: harmonic series
```

---

## Implementation Steps

1. Load Research Reference §3 and §4 as system context (read from `02-research-reference.md`).
2. Read `ArtistProfile`, `ActiveContext`, `TheoryGenealogy` from Wave 0 bundle.
3. Identify primary genre domain from genre string (fuzzy match to genre table).
4. Get era vocabulary from era string (parse year range; map to era bucket).
5. Get curriculumDepth from `ArtistProfile.curriculumDepth`.
6. Select 3–8 theory concepts from the library appropriate to genre + era + depth.
7. For each concept: look up concept in `TheoryGenealogy`; if found, populate `genealogyLinks`.
8. For each concept: write a specific `audibleEvidence` string referencing this artist's work.
9. For each concept: set `collegeNodePath` from the library mapping.
10. For each concept: set `mathematicsBridge` if applicable.
11. Assemble `TheoryNodeList` and validate against schema.
12. Apply special-case overrides (Hendrix → Lydian, Botch → odd time, etc.).
13. Return `TheoryNodeList`.

---

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| TM-01 | degree=0 (Quincy Jones, Jazz, energy=3) | TheoryNodeList with ii-V-I, chord-extensions, swing-rhythm | All 3 concepts present; audibleEvidence populated |
| TM-02 | degree=36 (Jimi Hendrix, Blues Rock, energy=6) | lydian-mode present in nodes | Lydian override applied |
| TM-03 | degree=276 (Bikini Kill, Riot Grrrl, energy=8) | riot-grrrl-deconstruct + power-chord present | Feminist context nodes present |
| TM-04 | degree=344 (Botch, Mathcore, energy=10) | odd-time-signatures + metric-modulation present | Advanced mathcore nodes |
| TM-05 | degree=53 (Fleet Foxes, Indie Folk, energy=3) | counterpoint + voice-leading present | Harmonic nodes; audibleEvidence refs harmonized vocals |
| TM-06 | Any artist whose concept is in TheoryGenealogy | genealogyLinks populated | Prior artists listed |
| TM-07 | Any artist | TheoryNodeList.nodes.length >= 3 | Minimum met |
| TM-08 | degree=8 (Gary Peacock, Jazz, energy=1) | All nodes at curriculumLevel="foundational" | Depth matches energy |

## Verification Gate

- [ ] TM-01 through TM-08 pass
- [ ] Schema validation passes for all generated TheoryNodeLists
- [ ] No TheoryNode has empty `audibleEvidence`
- [ ] No era-inappropriate concepts (e.g., no "drop-D" for 1950s artists)
- [ ] Genealogy links populated for any concept with prior occurrences

## Safety Boundaries

| Constraint | Boundary Type |
|-----------|---------------|
| All theory claims require audible evidence from the artist's work | GATE — prompt for evidence if none found |
| Do not assert Indigenous or Black American cultural origins of musical concepts without citation | BLOCK — defer to Research Generator which handles sourcing |
| Do not claim "invented by" language — use "exemplified by" or "as heard in" | ANNOTATE |
