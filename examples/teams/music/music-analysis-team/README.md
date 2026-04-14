---
name: music-analysis-team
type: team
category: music
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/music/music-analysis-team/README.md
description: Full Music Department analysis team for multi-domain problems spanning harmony, form, rhythm, composition, and performance practice. Bach classifies the query along musical dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with a learning pathway from Kodaly. Use for research-level questions, comprehensive piece analysis requiring coordinated specialist input, or any problem where the musical domain is not obvious and different perspectives may yield different insights. Not for simple chord identification, ear training exercises, or straightforward composition tasks.
superseded_by: null
---
# Music Analysis Team

Full-department multi-method analysis team for musical problems that span domains or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response, analogous to how `math-investigation-team` runs multiple analysis methods on a mathematical problem.

## When to use this team

- **Multi-domain analysis** spanning harmony, form, rhythm, composition technique, and performance practice -- where no single specialist covers the full scope.
- **Research-level questions** where the analytical domain is not obvious and the problem may yield different insights from different musical perspectives.
- **Comprehensive piece analysis** requiring coordinated input from multiple specialists (e.g., a late Beethoven quartet that needs Rameau's harmonic analysis, Bartok's formal mapping, Messiaen's rhythmic deconstruction, and Clara Schumann's performance context).
- **Novel or ambiguous works** where the user does not know which specialist to invoke, and Bach's classification is the right entry point.
- **Cross-tradition synthesis** -- when understanding a musical work requires seeing it through multiple lenses (tonal function via Rameau, rhythmic and modal color via Messiaen, ethnomusicological context via Bartok, improvisatory structure via Coltrane).
- **Comparative analysis across traditions** -- when a question bridges Western classical, jazz, folk, and non-Western repertoires and no single specialist's framework is sufficient.

## When NOT to use this team

- **Simple chord identification** or scale labeling -- use `rameau` directly. The analysis team's token cost is substantial.
- **Straightforward composition tasks** where the genre and constraints are clear -- use `composition-workshop-team`.
- **Performance preparation** where the piece is already chosen and the goal is interpretation -- use `performance-prep-team`.
- **Ear training exercises** with no analytical component -- use `kodaly` directly.
- **Single-domain problems** where the classification is obvious -- route to the specialist via `bach` in single-agent mode.

## Composition

The team runs all seven Music Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `bach` | Classification, orchestration, synthesis | Opus |
| **Harmony specialist** | `rameau` | Harmonic analysis, voice leading, tonal function | Opus |
| **Performance specialist** | `clara-schumann` | Interpretation, phrasing, articulation, historical performance practice | Sonnet |
| **Composition specialist** | `messiaen` | Compositional technique, rhythm, mode, color, structural innovation | Opus |
| **Improvisation specialist** | `coltrane` | Improvisatory structure, jazz harmony, cross-genre pattern analysis | Sonnet |
| **Form / Ethno specialist** | `bartok` | Formal analysis, proportional structure, ethnomusicological context | Sonnet |
| **Pedagogy specialist** | `kodaly` | Level-appropriate explanation, listening pathways, ear training | Sonnet |

Three agents run on Opus (Bach, Rameau, Messiaen) because their tasks require deep reasoning -- classification/synthesis, multi-layer harmonic analysis, and compositional deconstruction. Four run on Sonnet because their tasks are well-defined and analytically bounded.

## Orchestration flow

```
Input: user query + optional user level + optional prior MusicSession hash
        |
        v
+---------------------------+
| Bach (Opus)               |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity (routine/challenging/research-level)
        |                              - type (analyze/compare/contextualize/identify)
        |                              - user level (beginner/intermediate/advanced/graduate)
        |                              - tradition (Western classical/jazz/folk/
        |                                non-Western/cross-tradition)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Rameau    Clara    Messiaen Coltrane  Bartok  (Kodaly
    (harm)  Schumann  (comp)   (improv)  (form)   waits)
              (perf)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             query but producing independent findings in
             their own framework. Each produces a Grove record.
             Bach activates only the relevant subset --
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Bach (Opus)               |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by confidence
                         |                           - produce unified response
                         v
              +---------------------------+
              | Kodaly (Sonnet)           |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add listening pathway
                         |                           - suggest follow-up explorations
                         v
              +---------------------------+
              | Bach (Opus)               |  Phase 5: Record
              | Produce MusicSession     |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + MusicSession Grove record
```

## Synthesis rules

Bach synthesizes the specialist outputs using these rules, directly analogous to the `math-investigation-team` synthesis protocol:

### Rule 1 -- Converging findings are strengthened

When two or more specialists arrive at the same analytical conclusion independently (e.g., Rameau identifies a deceptive cadence at the same structural boundary Bartok identifies as the golden-section pivot), mark the finding as high-confidence. Cross-specialist convergence is the strongest signal available.

### Rule 2 -- Diverging findings are preserved and investigated

When specialists disagree, Bach does not force a reconciliation. Instead:

1. State both findings with attribution ("Rameau reads the chord as a French augmented sixth; Coltrane reads it as a tritone substitution of V7").
2. Check for framework difference: the same sonority may be analytically correct under multiple theoretical systems.
3. If the disagreement is substantive (not just terminological), re-delegate to the specialist whose reading is less expected.
4. Report the disagreement honestly to the user with context on why both readings may be valid.

### Rule 3 -- Historical context over abstraction

When Clara Schumann identifies a performance practice or historical context that changes the meaning of an analytical finding (e.g., "this passage was notated in scordatura and sounds a whole step lower than written"), the historical context takes priority in the synthesis. The abstract analysis becomes evidence interpreted through performance reality.

### Rule 4 -- Improvisation is not composition

Coltrane's output is always labeled as improvisatory analysis. When Coltrane identifies a pattern as a substitution chain or motivic development in an improvisatory context, the finding is reported alongside but not conflated with Messiaen's compositional analysis. A passage may be both a composed structure and an idiomatic improvisation pattern -- both observations are valid, neither subsumes the other.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Kodaly adapts the presentation -- simpler language, audio examples, solfege-based scaffolding for lower levels; concise technical writing with analytical notation for higher levels. The musical content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language musical question, piece reference, score excerpt, or analytical request.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Bach infers from the query.
3. **Prior MusicSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Shows analytical reasoning at the appropriate level of detail
- Credits the specialists involved
- Notes any unresolved disagreements or framework-dependent readings
- Suggests follow-up listening and explorations

### Grove record: MusicSession

```yaml
type: MusicSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: research-level
  type: analyze
  tradition: Western classical
  user_level: graduate
agents_invoked:
  - bach
  - rameau
  - clara-schumann
  - messiaen
  - coltrane
  - bartok
  - kodaly
work_products:
  - <grove hash of MusicAnalysis>
  - <grove hash of MusicComposition>
  - <grove hash of MusicPerformance>
  - <grove hash of MusicTranscription>
concept_ids:
  - <relevant college concept IDs>
user_level: graduate
```

Each specialist's output is also a standalone Grove record (MusicAnalysis, MusicComposition, MusicPerformance, or MusicTranscription) linked from the MusicSession.

## Escalation paths

### Internal escalations (within the team)

- **Rameau and Coltrane disagree on harmonic function:** This is expected and productive. Tonal-functional analysis (Rameau) and jazz-harmonic analysis (Coltrane) use different frameworks for the same sonorities. Bach reports both readings and notes the framework difference. If the piece is jazz, Coltrane's reading takes contextual priority; if classical, Rameau's. Cross-genre works get both readings side by side.
- **Bartok identifies ethnomusicological source material that reframes the analysis:** Re-route the revised context to the appropriate specialist. A passage that looked like free chromaticism but turns out to be a folk-mode quotation should be re-analyzed by Rameau and Messiaen with the folk source as context.
- **Messiaen identifies compositional technique that contradicts surface-level hearing:** Bach synthesizes both the compositional intent (Messiaen) and the perceptual result (Kodaly's pedagogical framing). Compositions can be experienced differently than they are constructed -- both perspectives matter.

### External escalations (from other teams)

- **From composition-workshop-team:** When a composition task reveals the work requires multi-domain analysis first (e.g., writing a variation on a theme that spans tonal and post-tonal idioms), escalate to music-analysis-team for comprehensive analysis before composing.
- **From performance-prep-team:** When performance preparation reveals the piece is analytically ambiguous or spans multiple traditions in ways that require the full department's expertise, escalate to music-analysis-team.

### Escalation to the user

- **Outside music:** If the query requires domain expertise outside music (acoustics, psychoacoustics, music technology, neuroscience of music perception), Bach acknowledges the boundary and suggests appropriate resources.
- **Score or recording needed:** If the query references a specific piece but the team lacks access to the score or recording, report what analysis is possible from knowledge alone and note what would improve with primary source access.

## Token / time cost

Approximate cost per investigation:

- **Bach** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Rameau, Messiaen) + 3 Sonnet (Clara Schumann, Coltrane, Bartok), ~30-60K tokens each
- **Kodaly** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

This cost is justified for multi-domain and research-level analysis. For single-domain or routine questions, use the specialist directly or a focused team.

## Configuration

```yaml
name: music-analysis-team
chair: bach
specialists:
  - harmony: rameau
  - performance: clara-schumann
  - composition: messiaen
  - improvisation: coltrane
  - form_ethno: bartok
pedagogy: kodaly

parallel: true
timeout_minutes: 15

# Bach may skip specialists whose domain is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full multi-domain analysis
> music-analysis-team: Analyze the first movement of Bartok's Music for Strings,
  Percussion, and Celesta. I want harmony, form, rhythmic structure, and
  performance context. Level: graduate.

# Comparative cross-tradition analysis
> music-analysis-team: Compare Coltrane's "Giant Steps" substitution cycle with
  the chromatic mediants in late Schubert. Are these the same harmonic
  phenomenon in different idioms?

# Follow-up
> music-analysis-team: (session: grove:abc123) Now extend that analysis to the
  second movement. How does the fugue subject inversion relate to the formal
  arch?
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (e.g., electroacoustic analysis, computational musicology, non-Western tuning systems beyond Bartok's ethnomusicological scope) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at the synthesis level. This preserves independence but prevents real-time collaboration.
- The team does not access external resources (audio playback, MIDI rendering, score engraving) beyond what each agent's tools provide (Bash for computation, Read/Grep for reference).
- Research-level analytical questions may produce multiple valid but irreconcilable readings. The team reports this honestly rather than forcing a single interpretation.
- The team analyzes music conceptually. It cannot listen to audio files or read scanned scores -- analysis is based on verbal description, symbolic notation, or the agents' training knowledge of standard repertoire.
