---
name: performance-prep-team
type: team
category: music
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/music/performance-prep-team/README.md
description: Sequential performance preparation pipeline for interpretation, practice planning, and repertoire decisions. Clara Schumann leads with interpretation and phrasing, Rameau provides the harmonic context that informs expressive choices, Bartok maps the formal structure to guide large-scale pacing, and Kodaly designs the practice strategy and learning pathway. Use for preparing a piece for performance, making interpretation decisions, planning efficient practice, and selecting repertoire. Not for original composition, improvisation, or multi-domain analytical research.
superseded_by: null
---
# Performance Prep Team

A sequential four-agent pipeline for performance preparation, interpretation, and practice planning. Clara Schumann leads with interpretation; Rameau provides harmonic context; Bartok maps formal structure; Kodaly designs the practice strategy. This team mirrors the `discovery-team` pattern: a sequential pipeline where each stage builds on the previous one's output.

## When to use this team

- **Preparing a piece for performance** -- "I'm performing the Schumann Fantasy Op. 17 next month. Help me prepare."
- **Interpretation decisions** -- "how should I handle the rubato in the second theme of Chopin's Ballade No. 1?"
- **Practice planning** -- "I have 6 weeks to learn this piece. Design a practice schedule."
- **Repertoire selection** -- "I'm an advanced pianist preparing for a competition. What pieces showcase my strengths?"
- **Phrasing and articulation questions** -- "where should I breathe in this flute passage?" "what bowings work for this cello line?"
- **Historical performance practice** -- "how would this Baroque suite have been performed in the 1720s versus today?"
- **Recital programming** -- building a coherent program arc across multiple works.

## When NOT to use this team

- **Original composition** -- use `composition-workshop-team`. Performance prep assumes the music already exists.
- **Improvisation** or jazz performance preparation -- use `coltrane` directly or `composition-workshop-team` for comping/arranging. This team focuses on notated repertoire.
- **Multi-domain analytical research** where performance is one component among many -- use `music-analysis-team`.
- **Ear training** with no performance component -- use `kodaly` directly.
- **Simple identification tasks** (key, time signature, chord names) -- use `rameau` directly.

## Composition

Four agents, run sequentially:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Interpreter** | `clara-schumann` | Interpretation, phrasing, articulation, pedaling, historical performance practice | Sonnet |
| **Harmonic context** | `rameau` | Harmonic analysis informing expressive choices, tension/release mapping, cadential weight | Opus |
| **Formal context** | `bartok` | Formal analysis, proportional structure, large-scale pacing, golden-section pivots | Sonnet |
| **Practice designer** | `kodaly` | Practice strategy, learning pathway, technical exercises, memorization plan | Sonnet |

One Opus agent (Rameau) because harmonic analysis that informs interpretation requires deep reasoning about voice-leading implications and expressive function. Clara Schumann, Bartok, and Kodaly run on Sonnet because their tasks are well-defined: interpretation within a known framework, formal mapping, and practice planning.

## Orchestration flow

```
Input: piece + context (instrument, level, timeline, performance date, goals)
        |
        v
+---------------------------+
| Clara Schumann (Sonnet)   |  Stage 1: Interpretation framework
| Lead / Interpreter        |          - identify interpretive challenges
+---------------------------+          - establish phrasing structure
        |                              - articulation and dynamics plan
        |                              - pedaling / bowing / breathing plan
        |                              - historical performance context
        |                              - emotional arc of the piece
        |                              - identify technically demanding passages
        |                              Output: MusicPerformance (interpretation)
        v
+---------------------------+
| Rameau (Opus)             |  Stage 2: Harmonic context
| Harmonic advisor          |          - map harmonic rhythm
+---------------------------+          - identify structural cadences
        |                              - tension/release arcs
        |                              - modulation points that demand
        |                                expressive shaping
        |                              - chromatic vs diatonic passages
        |                              - harmonic surprises the performer
        |                                must voice carefully
        |                              Output: MusicAnalysis (harmonic map)
        v
+---------------------------+
| Bartok (Sonnet)           |  Stage 3: Formal context
| Form / Structure          |          - macro-form (sonata, rondo, etc.)
+---------------------------+          - section boundaries and transitions
        |                              - proportional analysis
        |                              - climax placement
        |                              - golden-section pivot (if applicable)
        |                              - thematic return and variation map
        |                              - pacing recommendations for
        |                                large-scale shape
        |                              Output: MusicAnalysis (formal map)
        v
+---------------------------+
| Kodaly (Sonnet)           |  Stage 4: Practice strategy
| Practice designer         |          - prioritized passage list
+---------------------------+          - daily/weekly practice schedule
        |                              - technical exercises for
        |                                demanding passages
        |                              - memorization strategy
        |                              - performance simulation plan
        |                              - listening recommendations
        |                              - milestone checkpoints
        |                              Output: MusicSession (practice plan)
        v
  Grove records:
  MusicPerformance + MusicAnalysis (x2) + MusicSession
```

## Stage details

### Stage 1 -- Interpretation framework (Clara Schumann)

Clara Schumann examines the piece from the performer's perspective and produces the interpretive framework:

1. **Phrasing structure.** Where do the musical sentences begin and end? Where are the phrase peaks? How do phrases group into periods and sections?
2. **Articulation and dynamics plan.** Detailed markings beyond what the score provides -- implied articulations from the style period, dynamic shaping within hairpins, subito contrasts.
3. **Pedaling / bowing / breathing.** Instrument-specific technical guidance for sustain, legato, and phrase separation.
4. **Historical performance context.** How the piece was performed in its own era versus modern convention. Tempo flexibility, ornament realization, continuo practice (for Baroque), rubato convention (for Romantic).
5. **Emotional arc.** The narrative shape of the piece -- not programmatic description, but the trajectory of tension, release, intensity, and repose that the performer communicates.
6. **Technical challenges.** Passages that require special preparation -- rapid passages, wide leaps, sustained passages, coordination challenges.

**Stage 1 output:**
```yaml
type: MusicPerformance
piece: <title, composer, movement>
instrument: <target instrument>
phrasing:
  - measures: 1-8
    phrase_type: antecedent
    peak: measure 6
    articulation: legato with slight separation at bar 4
  - ...
dynamics_plan: <detailed dynamics beyond score markings>
pedaling: <or bowing/breathing as applicable>
historical_context: <period performance practice notes>
emotional_arc: <narrative trajectory>
technical_challenges:
  - measures: 23-28
    challenge: rapid octave passage in left hand
    priority: high
  - ...
agent: clara-schumann
```

### Stage 2 -- Harmonic context (Rameau)

Rameau takes Clara Schumann's interpretation and adds the harmonic layer that informs expressive choices:

- **Harmonic rhythm map.** How fast chords change, where the rhythm accelerates (building tension) or decelerates (arrival, repose).
- **Structural cadences.** Which cadences are structural boundaries (perfect authentic at section ends) versus decorative (half cadences, deceptive cadences that propel forward).
- **Tension/release arcs.** Where dissonance accumulates and where it resolves. These arcs directly inform dynamic shaping and rubato.
- **Modulation points.** Key changes that the performer must voice carefully -- the pivot chord, the moment of tonal ambiguity, the arrival in the new key.
- **Harmonic surprises.** Unexpected chords that demand special voicing or timing: Neapolitan chords, augmented sixths, enharmonic reinterpretations, modal mixture.
- **Voice-leading highlights.** Inner-voice motion that should be brought out, bass lines that carry structural weight, soprano lines that the audience follows.

**Stage 2 output:**
```yaml
type: MusicAnalysis
analysis_type: harmonic_context_for_performance
piece: <title, composer, movement>
harmonic_rhythm: <map of chord-change density per section>
structural_cadences:
  - measure: 16
    type: PAC
    key: I
    weight: structural
  - ...
tension_arcs:
  - measures: 9-16
    trajectory: building (chromatic bass descent, increasing dissonance)
  - ...
modulation_points:
  - measure: 33
    from: I
    to: vi
    pivot: <chord>
  - ...
harmonic_surprises:
  - measure: 47
    chord: Neapolitan
    performance_note: "Lean into the flat-second color. Slight rubato."
  - ...
voice_leading_highlights: [...]
agent: rameau
```

### Stage 3 -- Formal context (Bartok)

Bartok provides the large-scale structural map that guides pacing:

- **Macro-form identification.** Sonata, rondo, ternary, theme-and-variations, or non-standard form with annotated section boundaries.
- **Section boundaries and transitions.** Exact measure numbers where sections begin, end, and transition. Character of each transition (elision, bridge, caesura).
- **Proportional analysis.** Section durations relative to the whole. Golden-section analysis where the style supports it (common in Bartok, Debussy, some Beethoven).
- **Climax placement.** Where the structural climax falls and how far into the piece it occurs. This directly affects the performer's energy pacing.
- **Thematic return and variation.** How themes recur and what changes -- the performer must signal both familiarity and novelty when a theme returns transformed.
- **Pacing recommendations.** Tempo relationships between sections, ritardando/accelerando at structural boundaries, macro-level rubato.

**Stage 3 output:**
```yaml
type: MusicAnalysis
analysis_type: formal_context_for_performance
piece: <title, composer, movement>
form: sonata
sections:
  - label: Exposition
    measures: 1-67
    subsections:
      - label: P-theme
        measures: 1-20
        character: assertive
      - ...
  - ...
proportions:
  exposition: 0.38
  development: 0.31
  recapitulation: 0.31
golden_section_pivot: measure 112  # if applicable
climax:
  measure: 98
  position: 0.62  # fraction of total duration
thematic_map: [...]
pacing_recommendations:
  - boundary: exposition -> development
    recommendation: "Brief caesura. Development begins sotto voce."
  - ...
agent: bartok
```

### Stage 4 -- Practice strategy (Kodaly)

Kodaly synthesizes all three prior stages and designs a practice plan:

1. **Prioritized passage list.** Ranked by difficulty and importance, drawing from Clara Schumann's technical challenges, Rameau's harmonic surprises, and Bartok's structural pivots.
2. **Daily/weekly practice schedule.** Concrete time allocation given the user's timeline and available practice hours. Follows the principle of interleaved practice (not grinding one passage endlessly).
3. **Technical exercises.** Targeted exercises for the specific challenges identified -- scales, arpeggios, rhythmic variants, slow practice patterns.
4. **Memorization strategy.** If memorization is required: harmonic landmarks (from Rameau), formal sections (from Bartok), and physical/muscular checkpoints (from Clara Schumann).
5. **Performance simulation plan.** When to start run-throughs, when to record oneself, how to simulate performance anxiety, mock performance schedule.
6. **Listening recommendations.** Recordings to study for interpretive ideas, including historically informed performances and contrasting modern interpretations.
7. **Milestone checkpoints.** Weekly goals that track whether preparation is on schedule. Early warning indicators if the timeline is at risk.

**Stage 4 output:**
```yaml
type: MusicSession
session_type: practice_plan
piece: <title, composer, movement>
instrument: <target instrument>
timeline: <weeks until performance>
prioritized_passages:
  - measures: 23-28
    priority: 1
    source: clara-schumann (technical challenge)
    exercises: [slow octaves, rhythmic variants, hands separate]
  - measures: 47-52
    priority: 2
    source: rameau (harmonic surprise at N6)
    exercises: [harmonic reduction, voicing practice]
  - ...
weekly_schedule:
  week_1:
    focus: "Hands separate. Priority passages 1-3."
    daily_minutes: 60
    breakdown:
      technical_exercises: 15
      passage_work: 30
      slow_run_through: 15
  - ...
memorization_strategy: <if applicable>
performance_simulation:
  start_week: 4
  mock_performances: 3
  recording_sessions: 2
listening_recommendations:
  - artist: <name>
    recording: <label, year>
    reason: <what to listen for>
  - ...
milestones:
  - week: 2
    checkpoint: "All priority-1 passages secure at tempo."
  - ...
concept_ids: [...]
agents_contributing: [clara-schumann, rameau, bartok, kodaly]
agent: kodaly
```

## Input contract

The team accepts:

1. **Piece** (required). Title, composer, movement or section. The more specific, the better.
2. **Context** (required). One or more of:
   - Instrument
   - Player level (beginner/intermediate/advanced/graduate)
   - Timeline (weeks until performance, or open-ended study)
   - Performance context (recital, competition, audition, lesson, personal study)
   - Specific concerns ("I struggle with the coda," "the tempo feels too fast")
3. **Mode** (optional). One of:
   - `prepare` (default) -- full pipeline from interpretation through practice plan
   - `interpret` -- interpretation and context only (Stages 1-3), no practice plan
   - `practice` -- practice plan only (Stage 4), given prior analytical context
   - `repertoire` -- repertoire selection and program building (modified pipeline)

### Mode: repertoire

In repertoire mode, the orchestration changes:

```
Input: player profile + performance context + constraints
        |
        v
Clara Schumann -- recommend repertoire based on technical level, strengths,
                   and performance context
        |
Bartok -- evaluate formal variety and program arc across selected pieces
        |
Kodaly -- design preparation timeline and explain the programming choices
```

No harmonic analysis is performed. The output is a repertoire recommendation with program order, preparation timeline, and rationale.

### Mode: interpret

In interpret mode, Stages 1-3 run normally but Stage 4 (Kodaly) is skipped. Useful when the performer wants analytical depth but manages their own practice schedule.

### Mode: practice

In practice mode, Stages 1-3 are assumed to have already occurred (provide a prior MusicSession hash or describe the analytical context). Only Kodaly runs, producing a practice plan based on the provided context.

## Output contract

### Mode: prepare (default)

Four Grove records:

1. **MusicPerformance** (Clara Schumann) -- interpretation framework with phrasing, dynamics, articulation, historical context.
2. **MusicAnalysis** (Rameau) -- harmonic map with tension arcs, cadential weight, modulation points.
3. **MusicAnalysis** (Bartok) -- formal map with proportions, climax, pacing recommendations.
4. **MusicSession** (Kodaly) -- practice plan with schedule, exercises, milestones, listening recommendations.

All four are linked:

```yaml
type: MusicSession
session_type: performance_preparation
piece: <title, composer, movement>
instrument: <target instrument>
performance_date: <if known>
classification:
  level: advanced
  context: recital
  timeline_weeks: 6
agents_invoked:
  - clara-schumann
  - rameau
  - bartok
  - kodaly
work_products:
  - <grove hash of MusicPerformance>
  - <grove hash of MusicAnalysis -- harmonic>
  - <grove hash of MusicAnalysis -- formal>
  - <grove hash of MusicSession -- practice plan>
concept_ids: [...]
```

### Mode: repertoire

A repertoire recommendation from Clara Schumann, program-arc analysis from Bartok, and a MusicSession from Kodaly with the preparation timeline.

### Mode: interpret

The first three Grove records (MusicPerformance, two MusicAnalysis) without the practice plan.

### Mode: practice

A MusicSession from Kodaly referencing the prior analytical work.

## Escalation paths

### Piece requires multi-domain analysis

If during Stage 1 Clara Schumann determines the piece is analytically ambiguous or requires expertise beyond the four-agent team (e.g., a piece combining notated and improvisatory sections, a piece quoting folk sources that Bartok needs Messiaen's rhythmic analysis to decode, a cross-tradition work), escalate to `music-analysis-team`. The full department can bring Messiaen (composition), Coltrane (improvisation), and additional perspectives.

### Piece needs new arrangement or cadenza

If Clara Schumann identifies that the piece requires a new cadenza, new ornamentation, or a modified arrangement (e.g., an operatic aria that needs a custom cadenza for the performer's voice), escalate to `composition-workshop-team` with Clara Schumann's interpretive context as input.

### Technical demands exceed player level

If during Stage 1 Clara Schumann determines the piece is significantly beyond the player's current technical level, Kodaly's practice plan may be insufficient. The team:

1. Reports the mismatch honestly with specific passages that exceed the player's level.
2. Suggests simplified alternatives or arrangements if they exist.
3. If the performance date is immovable, designs the most efficient triage-based practice plan (prioritize passages the audience will notice most).
4. If the timeline is flexible, recommends prerequisite repertoire to build the necessary technique.

### From other teams

- **From music-analysis-team:** When Bach classifies a query as primarily a performance question ("how should I play..."), the analysis team may delegate to performance-prep-team rather than running all seven agents.
- **From composition-workshop-team:** When a new composition or arrangement is complete and the user wants to prepare it for performance, composition-workshop-team hands the MusicComposition to performance-prep-team with Messiaen's compositional intent as context.

### Escalation to the user

- **Score access.** If the team lacks access to the specific score and the analysis depends on exact notation (uncommon editions, manuscripts, contemporary works), report what is possible from knowledge alone and note what would improve with primary source access.
- **Physical/medical concerns.** If the player describes pain, tension, or injury risk, the team is not qualified to give medical advice. Recommend consultation with a music medicine specialist or Alexander Technique / Body Mapping instructor. Design practice plans that respect the stated limitation.

## Token / time cost

Approximate cost per preparation:

- **Clara Schumann** -- 1 Sonnet invocation (interpretation), ~20-35K tokens
- **Rameau** -- 1 Opus invocation (harmonic context), ~30-50K tokens
- **Bartok** -- 1 Sonnet invocation (formal context), ~20-35K tokens
- **Kodaly** -- 1 Sonnet invocation (practice plan), ~20-35K tokens
- **Total** -- 90-155K tokens, 3-8 minutes wall-clock

Lighter than both `music-analysis-team` and `composition-workshop-team` because only four agents are involved and the pipeline is strictly sequential with only one Opus invocation.

## Configuration

```yaml
name: performance-prep-team
lead: clara-schumann
harmonic_context: rameau
formal_context: bartok
practice_designer: kodaly

# Default mode
mode: prepare

# Rameau analysis depth (full/structural-only)
harmonic_depth: full

# Bartok proportional analysis (on/off -- skip for short pieces)
proportional_analysis: true

# Kodaly output level (auto-detected if not set)
user_level: auto

# Default timeline (weeks) if not specified
default_timeline_weeks: 8
```

## Invocation

```
# Full performance preparation
> performance-prep-team: I'm performing Schumann's Fantasy Op. 17 in 6 weeks
  for a faculty recital. Advanced pianist. Help me prepare all three movements.

# Interpretation only
> performance-prep-team: How should I interpret the rubato in Chopin's
  Nocturne Op. 27 No. 2? I've heard very different approaches. Mode: interpret.
  Level: graduate.

# Practice plan only
> performance-prep-team: I already understand the piece analytically (see
  grove:xyz789). Design a 4-week practice plan for a competition. Advanced
  level. Mode: practice.

# Repertoire selection
> performance-prep-team: I'm a late-intermediate cellist preparing for a
  30-minute studio recital in 3 months. I like Romantic music but want some
  variety. Mode: repertoire.

# Historical performance practice
> performance-prep-team: I'm performing Bach's Partita No. 2 in D minor on
  modern violin. How do I balance historical informed practice with modern
  instrument capabilities? Level: advanced.
```

## Limitations

- The team prepares performers conceptually. It cannot demonstrate -- no audio, no video, no real-time feedback on the performer's playing.
- The pipeline is sequential. Each stage depends on the previous one's output. This means the team cannot parallelize, but it also means each stage has full context from all prior stages.
- The team is strongest on Western classical repertoire from Baroque through early 20th century. Contemporary art music, non-Western repertoire, and popular music are handled at the closest available level of generality.
- Practice plans are templates, not adaptive coaching. A real practice session may reveal that the plan's priorities are wrong. The team recommends periodic reassessment but cannot monitor progress between sessions.
- Repertoire recommendations draw from the agents' training knowledge. Very recent publications (last 1-2 years) may not be known.
- The team does not replace a private teacher. It provides analytical depth and structured planning that complements -- not substitutes for -- in-person instruction.
