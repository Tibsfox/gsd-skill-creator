---
name: composition-workshop-team
type: team
category: music
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/music/composition-workshop-team/README.md
description: Focused composition and arrangement team. Messiaen leads with creative framework and compositional technique, Rameau ensures harmonic viability and voice-leading quality, Coltrane adds improvisatory elements and cross-genre pattern vocabulary when jazz or hybrid idioms are involved, and Kodaly translates the compositional choices into a level-appropriate explanation with exercises. Use for original composition, arrangement, creative problem-solving, style exercises, and compositional pedagogy. Not for pure analysis, performance preparation, or ear training.
superseded_by: null
---
# Composition Workshop Team

A focused four-agent team for original composition, arrangement, and creative problem-solving. Messiaen leads with compositional technique; Rameau ensures harmonic viability; Coltrane contributes improvisatory and cross-genre elements; Kodaly explains the choices. This team mirrors the `proof-workshop-team` pattern: a focused expertise team optimized for a specific class of creative work rather than broad analysis.

## When to use this team

- **Original composition from a prompt** -- "write a 16-bar chorale in the style of late Brahms," "compose a 12-bar blues head with tritone substitutions."
- **Arrangement and orchestration** -- "arrange this folk melody for string quartet," "reharmonize this standard for a jazz combo."
- **Creative problem-solving** -- "I'm stuck on the development section -- how do I develop this motive without it becoming repetitive?"
- **Style exercises** -- "write a two-part invention in the manner of Bach," "compose a passage using Messiaen's modes of limited transposition."
- **Compositional pedagogy** -- teaching compositional techniques through worked examples with Kodaly's scaffolding.
- **Cross-genre composition** -- when the work bridges tonal, jazz, and modal idioms and benefits from both Rameau's and Coltrane's harmonic frameworks.

## When NOT to use this team

- **Pure analysis** of existing works -- use `music-analysis-team`. The composition workshop creates; it does not analyze.
- **Performance preparation** where the piece already exists -- use `performance-prep-team`.
- **Ear training exercises** with no compositional component -- use `kodaly` directly.
- **Multi-domain research questions** requiring the full department's perspectives -- use `music-analysis-team`.
- **Simple chord progressions or scale identification** -- use `rameau` directly.

## Composition

Four agents, run mostly sequentially with one parallel step:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Composer** | `messiaen` | Creative framework, compositional technique, rhythm, mode, structural design | Opus |
| **Harmonic advisor** | `rameau` | Voice leading, harmonic function, tonal viability, counterpoint | Opus |
| **Improvisatory elements** | `coltrane` | Jazz harmony, substitution chains, improvisatory pattern vocabulary, cross-genre idiom | Sonnet |
| **Pedagogy / Readability** | `kodaly` | Level-appropriate explanation, compositional exercises, learning pathway | Sonnet |

Two Opus agents (Messiaen, Rameau) because compositional design and deep harmonic analysis require sustained reasoning. Two Sonnet agents (Coltrane, Kodaly) because their contributions are well-bounded: Coltrane provides pattern vocabulary within an established framework, and Kodaly adapts the output for the learner.

## Orchestration flow

```
Input: composition brief + constraints + style + mode (compose/arrange/strategize)
        |
        v
+---------------------------+
| Messiaen (Opus)           |  Phase 1: Establish creative framework
| Lead / Composer           |          - parse the brief
+---------------------------+          - select compositional technique
        |                              - determine form and proportions
        |                              - identify rhythmic and modal palette
        |                              - set structural boundaries
        v
+---------------------------+
| Rameau (Opus)             |  Phase 2: Harmonic viability
| Harmonic advisor          |          - review Messiaen's framework for
+---------------------------+            voice-leading quality
        |                              - verify tonal/modal coherence
        |                              - suggest harmonic refinements
        |                              - flag parallel fifths, unresolved
        |                                tendency tones, spacing issues
        |                              - may propose reharmonization
        v
+---------------------------+
| Messiaen (Opus)           |  Phase 3: Compose / Arrange
| Compositional execution   |          - produce the music
+---------------------------+          - incorporate Rameau's refinements
        |                              - notate with performance indications
        |                              - run compositional quality checklist
        |
        +------- parallel --------+
        |                         |
        v                         v
+------------------+   +------------------+
| Coltrane (Snnt)  |   | Messiaen (Opus)  |  Phase 4: Review
| Cross-genre      |   | Self-review      |          (parallel)
| review           |   | - re-read for    |
| - jazz/improv    |   |   coherence      |
|   idiom check    |   | - check form     |
| - substitution   |   |   proportions    |
|   opportunities  |   | - verify         |
| - if jazz/cross- |   |   technique      |
|   genre: add     |   |   consistency    |
|   improv layer   |   |                  |
+------------------+   +------------------+
        |                         |
        +------------+------------+
                     |
                     v
+---------------------------+
| Messiaen (Opus)           |  Phase 5: Finalize
| Incorporate review        |          - integrate Coltrane's suggestions
+---------------------------+          - polish notation and markings
                     |                 - produce final MusicComposition record
                     v
+---------------------------+
| Kodaly (Sonnet)           |  Phase 6: Explain
| Level-appropriate output  |          - walk through compositional choices
+---------------------------+          - explain techniques used
                     |                 - suggest practice exercises
                     v
              MusicComposition + MusicAnalysis
              Grove records
```

## Phase details

### Phase 1 -- Creative framework (Messiaen)

Messiaen parses the composition brief and establishes the creative parameters. The output of this phase is:

```yaml
brief: <formal restatement of the request>
form: <chosen form (binary, ternary, rondo, through-composed, etc.)>
proportions: <section lengths and golden-section pivots if applicable>
mode_palette: <modes, scales, or pitch collections>
rhythmic_framework: <meter, tempo, rhythmic devices>
primary_technique: <compositional technique>
secondary_technique: <compositional technique>
constraints: <user-specified and self-imposed>
style_reference: <closest stylistic model>
```

### Phase 2 -- Harmonic viability (Rameau)

Rameau examines Messiaen's framework for harmonic soundness. This phase may:

- **Refine voice leading.** "The inner voices create hidden parallel octaves at the cadence. Revoice the alto."
- **Adjust harmonic rhythm.** "The rate of chord change in the B section is too fast for the style -- slow the harmonic rhythm to match the A section's pacing."
- **Suggest reharmonization.** "A Neapolitan substitution at the climax would strengthen the structural tension Messiaen's form requires."
- **No-op.** If the framework is harmonically sound (common in modal or post-tonal idioms where traditional voice-leading rules do not apply), Rameau reports "framework is harmonically viable" and Messiaen proceeds.

Rameau's output is advisory. Messiaen decides whether to adopt the harmonic refinements based on the creative intent.

### Phase 3 -- Compositional execution (Messiaen)

Messiaen composes or arranges the music following the framework from Phase 1 (possibly modified by Phase 2). The output includes:

- Note-level content (pitch, rhythm, dynamics)
- Performance indications (tempo, articulation, phrasing)
- Structural annotations (section labels, rehearsal marks)
- Compositional technique annotations (which technique governs each passage)

The composition passes Messiaen's internal quality checklist before leaving this phase.

### Phase 4 -- Review (Coltrane + Messiaen, parallel)

Two independent reviews run in parallel:

**Coltrane (cross-genre review):**
- Evaluates the composition for improvisatory potential and cross-genre resonance
- If the style involves jazz or hybrid idioms: adds substitution suggestions, improvisation-friendly voicings, and rhythmic variations
- If the style is purely classical: evaluates whether any passages inadvertently invoke jazz idiom (this may be desired or not -- reports the finding)
- Reports: `reviewed`, `suggestions at measure N`, or `improv layer added`

**Messiaen (self-review):**
- Re-reads the composition for formal coherence and proportional balance
- Checks that the compositional technique is applied consistently
- Verifies the piece achieves the stated creative intent
- Flags any passages that feel forced or mechanical

### Phase 5 -- Finalization (Messiaen)

Messiaen incorporates findings from Phase 4:

- If Coltrane suggested cross-genre elements and the style supports them, integrate selectively
- If self-review found coherence issues, revise the passages
- Polish notation, dynamics, and performance markings
- Produce the final MusicComposition Grove record

### Phase 6 -- Explanation (Kodaly)

Kodaly takes the finalized MusicComposition and produces a MusicAnalysis:

- Adapted to the user's level (beginner through graduate)
- Walks through the compositional choices: why this form, why this harmonic language, why this rhythmic framework
- Explains the techniques used with reference to the repertoire that inspired them
- Suggests compositional exercises for the student to practice the same techniques
- Notes which compositional approaches are transferable to other styles and projects

## Input contract

The team accepts:

1. **Brief** (required). The composition request -- what to compose, arrange, or solve.
2. **Constraints** (required). Style, instrumentation, duration, technical level, and any rules to follow or break.
3. **Mode** (required). One of:
   - `compose` -- create original music from scratch
   - `arrange` -- transform existing material for new forces or style
   - `strategize` -- recommend compositional approaches without writing the music
4. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`.

### Mode: arrange

In arrange mode, the orchestration changes:

```
Input: source material + target instrumentation/style
        |
        v
Messiaen (arrange mode) -- analyze source, plan arrangement
        |
Rameau -- voice-leading review for target forces
        |
Messiaen -- produce arrangement
        |
Kodaly -- explain the arrangement choices
```

### Mode: strategize

In strategize mode:

```
Input: composition brief + constraints
        |
        v
Messiaen -- analyze the brief, recommend techniques
        |
Rameau -- harmonic options and voice-leading considerations
        |
Coltrane -- cross-genre possibilities if applicable
        |
Kodaly -- explain the strategies at the user's level
```

No music is composed. The output is a compositional strategy recommendation with rationale.

## Output contract

### Mode: compose

Two Grove records:

**MusicComposition:**
```yaml
type: MusicComposition
brief: <formal restatement>
form: <form used>
technique: <primary compositional technique>
mode_palette: <modes/scales used>
constraints: [...]
sections:
  - label: A
    measures: 1-16
    description: <what happens>
    technique: <technique governing this section>
  - ...
notation: <symbolic or descriptive notation of the music>
performance_indications: <tempo, dynamics, articulation>
reviewed_by: [coltrane, messiaen]
confidence: 1.0
concept_ids: [...]
agent: messiaen
```

**MusicAnalysis:**
```yaml
type: MusicAnalysis
target_level: intermediate
composition_hash: <grove hash of MusicComposition>
explanation: <level-appropriate walkthrough of compositional choices>
techniques_demonstrated:
  - name: <technique>
    measures: <where it appears>
    explanation: <why it was used>
exercises: [...]
concept_ids: [...]
agent: kodaly
```

### Mode: arrange

An arrangement MusicComposition record from Messiaen plus a MusicAnalysis from Kodaly describing the arrangement decisions.

### Mode: strategize

A strategy recommendation from Messiaen, harmonic commentary from Rameau, cross-genre input from Coltrane if applicable, and a MusicAnalysis from Kodaly.

## Escalation paths

### Creative block (Messiaen exhausts approaches)

If Messiaen exhausts the primary, secondary, and tertiary techniques without producing satisfying results:

1. Messiaen produces a creative block report documenting what was tried and what felt forced.
2. Rameau re-examines for harmonic angles that might unlock a new approach.
3. Coltrane offers improvisatory or cross-genre reframing that might break the block.
4. If still stuck, report honestly and recommend escalation to `music-analysis-team` for multi-perspective input (Bartok may find a folk-source angle, Clara Schumann may identify a performance-practice insight that reframes the problem).

### Brief requires analysis first

If during Phase 1 Messiaen determines the brief requires comprehensive analysis of an existing work before composition can begin (e.g., "write a set of variations on the second theme of Brahms Op. 118 No. 2"), escalate to `music-analysis-team` for the analysis phase, then return to composition-workshop-team with the analytical output as context.

### Problem is multi-domain

If during Phase 2 Rameau determines the composition requires performance-practice expertise (Clara Schumann), formal modeling (Bartok), or other capabilities beyond the four-agent team, escalate to `music-analysis-team`. Do not attempt to compose outside the team's competence.

### From other teams

- **From music-analysis-team:** When Bach classifies a query as primarily a composition problem, the analysis team may delegate to composition-workshop-team rather than running all seven agents.
- **From performance-prep-team:** When performance preparation reveals the need for a new arrangement, cadenza, or ornamentation, performance-prep-team hands the request to composition-workshop-team with Clara Schumann's interpretive context.

## Token / time cost

Approximate cost per composition:

- **Messiaen** -- 3 Opus invocations (framework, compose, finalize), ~60-90K tokens total
- **Rameau** -- 1 Opus invocation (harmonic viability), ~20-30K tokens
- **Coltrane** -- 1 Sonnet invocation (cross-genre review), ~15-25K tokens
- **Kodaly** -- 1 Sonnet invocation (explanation), ~15-25K tokens
- **Total** -- 110-170K tokens, 3-8 minutes wall-clock

Lighter than `music-analysis-team` because only four agents are involved and the workflow is more sequential.

## Configuration

```yaml
name: composition-workshop-team
lead: messiaen
harmonic_advisor: rameau
cross_genre: coltrane
pedagogy: kodaly

# Coltrane may be skipped for purely classical composition
skip_cross_genre: false

# Rameau voice-leading strictness (strict/moderate/free)
voice_leading_mode: moderate

# Kodaly output level (auto-detected if not set)
user_level: auto
```

## Invocation

```
# Compose from scratch
> composition-workshop-team: Compose a 32-bar ABA form piano piece using
  Messiaen's second mode of limited transposition. Target: intermediate
  pianist. Mode: compose. Level: advanced.

# Arrange existing material
> composition-workshop-team: Arrange "Autumn Leaves" for string quartet with
  jazz voicings. The first violin should carry the melody. Mode: arrange.
  Level: graduate.

# Strategy advice
> composition-workshop-team: I'm writing a brass quintet and the development
  section feels static. The theme is a rising fourth followed by stepwise
  descent. What compositional techniques would create momentum?
  Mode: strategize. Level: intermediate.

# Cross-genre composition
> composition-workshop-team: Write a 12-bar passage that transitions from
  a Baroque-style sequence into a jazz ii-V-I turnaround. The seam should
  sound natural, not like a style collision. Mode: compose. Level: graduate.
```

## Limitations

- The team does not produce audio or MIDI output. Compositions are described symbolically (pitch names, rhythmic values, chord symbols) or in descriptive notation. Engraving requires external tools (LilyPond, MuseScore, Sibelius).
- Coltrane's improvisatory suggestions are idiomatic to jazz and related traditions. Non-Western improvisatory idioms (Indian raga, Arabic maqam) are outside Coltrane's primary expertise -- Bartok (via music-analysis-team) may provide better ethnomusicological grounding.
- Rameau's harmonic review applies tonal voice-leading principles. For post-tonal, spectral, or aleatoric composition, Rameau's review may be a no-op -- this is expected and correct.
- The team does not replace human musical judgment. Compositions are technically sound but may lack the ineffable quality that distinguishes craft from art. The output is a strong draft, not a finished masterwork.
