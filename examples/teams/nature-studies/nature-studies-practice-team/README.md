---
name: nature-studies-practice-team
type: team
category: nature-studies
status: stable
origin: tibsfox
first_seen: 2026-04-12
description: Four-agent field-practice pipeline team for sustained naturalist work. Merian models the sketch-first journal loop, Goodall models longitudinal ethology, von Humboldt supplies habitat and biogeographic context, and Louv scaffolds the session as a learning experience rather than a one-shot answer. Use for ongoing sit-spot, nature-journaling, phenology monitoring, and multi-week behavioral tracking. Not for single-shot identification, pure taxonomy, or research-level analysis that does not require sustained observation.
---
# Nature Studies Practice Team

A four-agent pipeline team for the sustained field practice that makes nature studies a discipline rather than a hobby. The practice team models the daily and weekly rhythms of a working naturalist: sit spot, journal entry, sketch, interpret, return tomorrow. This team mirrors the `discovery-team` pattern: a pipeline for iterative, time-extended work rather than for one-shot analysis.

## When to use this team

- **Sit-spot practice** -- a user wants to establish or sustain regular visits to a single location and needs structure that will hold for months.
- **Nature journaling** -- a user wants to keep a journal that accumulates into useful data over time, not just a scrapbook.
- **Phenology monitoring** -- tracking seasonal events at a specific location across one or more years.
- **Longitudinal behavioral tracking** -- following a particular species or individual over days, weeks, or seasons.
- **Multi-week observations** where the question cannot be answered by a single visit but requires accumulated entries to resolve.
- **Contribution to citizen-science platforms** (iNaturalist, eBird, Nature's Notebook) where the user wants to submit well-structured long-term records.

## When NOT to use this team

- **Single-shot identification** -- use `nature-studies-workshop-team` or a specialist directly.
- **Pure taxonomy** -- use `linnaeus` directly.
- **Research-level analysis** of a one-time question -- use `nature-studies-analysis-team`.
- **Pure pedagogy** without an observation practice -- use `louv` directly.
- **Behavioral interpretation** of a single observation without follow-up -- use `goodall-nat` directly.

## Composition

Four agents form the practice pipeline, with Merian and Goodall as the sustained-observation leads:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Journal lead** | `merian` | Sketch-first journaling, paired observation, life-cycle tracking | Opus |
| **Ethology lead** | `goodall-nat` | Longitudinal observation, individual recognition, Tinbergen framework | Opus |
| **Biogeographic context** | `von-humboldt-nat` | Habitat assemblages, regional expectations, phenology baselines | Sonnet |
| **Pedagogy and sustainability** | `louv` | Practice scaffolding, sustained-attention training, session structure | Sonnet |

Two Opus agents (Merian, Goodall) because the lead observational work is judgment-heavy. Two Sonnet agents (Humboldt, Louv) because context lookup and practice scaffolding are throughput-oriented. Note that this team does not include Linnaeus as chair -- practice team invocations arrive through Linnaeus but the internal pipeline runs on its own, with Linnaeus taking the role of dispatcher rather than lead synthesizer. For practice sessions that require synthesis across wings, the user should escalate to `nature-studies-analysis-team`.

## Orchestration flow

```
Input: ongoing practice goal + optional prior session hashes
        |
        v
+---------------------------+
| Louv (Sonnet)             |  Phase 1: Scaffold the session
| Practice design            |          - what is the user's target practice?
+---------------------------+          - what level of experience?
        |                              - what schedule is sustainable?
        v
+---------------------------+
| Von Humboldt (Sonnet)     |  Phase 2: Regional context
| Biogeographic baseline    |          - what species assemblage to expect
+---------------------------+          - what phenology events are imminent
        |                              - what habitat features to notice
        |
        +--------- parallel ---------+
        |                              |
        v                              v
+---------------------------+   +---------------------------+
| Merian (Opus)             |   | Goodall (Opus)            |  Phase 3: Pipe into practice
| Journal and sketch        |   | Longitudinal ethology     |          - journal workflow
| workflow                  |   | workflow                  |          - behavioral protocol
+---------------------------+   +---------------------------+
        |                              |
        +----------------+-------------+
                         |
                         v
              +---------------------------+
              | Louv (Sonnet)             |  Phase 4: Sustainability check
              | Final scaffolding          |          - is this achievable?
              +---------------------------+          - what backup rhythms exist?
                         |
                         v
              +---------------------------+
              | Merian (Opus)             |  Phase 5: Record session
              | Produce NatureStudies-    |          - practice scaffold
              | FieldRecord + Explanation |          - journal template
              +---------------------------+          - first entries (if applicable)
                         |
                         v
                  Practice artifact
                  + NatureStudiesFieldRecord
                  + NatureStudiesExplanation
```

## Practice protocol

### Phase 1 -- Scaffolding (Louv)

Louv asks the critical sustainability questions:

1. **What is the user's target practice?** Sit-spot visits, journal entries, phenology records, or behavioral observation.
2. **What schedule is achievable?** Daily visits are ideal but weekly is realistic for most people. A schedule that cannot be kept is worse than no schedule at all.
3. **What does the user already have?** A backyard bird feeder, a park bench nearby, a commute that passes a wetland. Existing infrastructure matters more than picturesque alternatives.
4. **What does the user want to notice?** Birds, plants, weather, behavior. The focus should be specific enough to direct attention but broad enough to tolerate change.

### Phase 2 -- Regional context (Von Humboldt)

Humboldt supplies the biogeographic baseline:

1. **What species assemblage should the user expect** at the chosen site?
2. **What phenology events are imminent** for the current season?
3. **What habitat features are worth noting** as the practice proceeds?

This baseline lets the user's future observations be interpreted against what "typical" looks like for the location.

### Phase 3 -- Practice design (Merian and Goodall, parallel)

Merian designs the journal and sketch workflow:

- Entry structure (words, pictures, numbers, metadata)
- Sketch-first discipline before any field-guide lookup
- Paired observation when life-cycle stages are relevant
- Archival practices (paper, digital, hybrid)

Goodall designs the behavioral observation protocol:

- Sampling method (focal animal, scan, event, ad libitum)
- Session structure (warm-up, observation, recording, review)
- Recognition protocols (for sustained observation of specific individuals)
- Pattern-detection thresholds (when does accumulated observation cross from anecdote to pattern?)

Both work from the same user goal and context but produce independent outputs covering complementary aspects of the practice.

### Phase 4 -- Sustainability check (Louv)

Louv reviews the combined design:

- Is the total time commitment realistic?
- Are there backup rhythms for weeks when the primary schedule fails?
- Does the design have low-threshold entry points for the first few sessions?
- What review cadence will let the user notice progress without demanding excessive reflection time?

### Phase 5 -- Recording (Merian)

Merian produces the practice artifacts:

- A practice scaffold (NatureStudiesExplanation) that the user can follow
- A journal template (NatureStudiesFieldRecord with structured fields)
- The first few sample entries (if the user is ready to start immediately)

## Input contract

The team accepts:

1. **Practice goal** (required). What ongoing practice the user wants to establish.
2. **Location** (required). Where the practice will happen. Urban, suburban, rural; indoor-adjacent or remote.
3. **Current experience level** (required). One of: `beginner`, `intermediate`, `advanced`.
4. **Schedule constraints** (optional). What days or times are available.
5. **Prior practice sessions** (optional). Grove hashes of earlier practice artifacts.

## Output contract

### Primary output: Practice scaffold

A structured practice artifact with:

- Goal statement
- Location, frequency, and duration
- Session structure (what to do in each visit)
- Recording format (journal template, behavior protocol, or both)
- Baseline species assemblage and phenology context
- Review cadence (weekly, monthly, seasonally)
- Success indicators

### Grove records

- **NatureStudiesExplanation:** The practice scaffold as a teaching artifact.
- **NatureStudiesFieldRecord:** A template for the user's actual entries, plus the first sample entries if appropriate.
- **NatureStudiesSession:** The session log linking both records.

## Escalation paths

- **User wants to interpret an accumulated run of entries:** Escalate to `nature-studies-analysis-team` once the entries are substantial enough.
- **User hits an unknown species they cannot ID:** Escalate to `nature-studies-workshop-team` or a specialist directly.
- **User reports that the practice is not sustainable:** Revise the scaffold with Louv leading, possibly simplifying the schedule or changing the location.
- **User wants to contribute to research-grade citizen science:** Add Peterson for documentation discipline, or escalate to the analysis team.

## Token / time cost

- **Louv** -- 2 Sonnet invocations (scaffold + sustainability check), ~25K tokens
- **Humboldt** -- 1 Sonnet invocation, ~15K tokens
- **Merian** -- 2 Opus invocations (design + record), ~40K tokens
- **Goodall** -- 1 Opus invocation, ~25K tokens
- **Total** -- 90-130K tokens, 3-6 minutes wall-clock

The practice team is designed to be invoked repeatedly over time rather than as a single large analysis. Subsequent sessions cost less because the prior session's context is reused.

## Configuration

```yaml
name: nature-studies-practice-team
journal_lead: merian
ethology_lead: goodall-nat
context: von-humboldt-nat
pedagogy: louv

parallel: true
timeout_minutes: 8
session_continuity: true
```

## Invocation

```
# Establish a new sit-spot practice
> nature-studies-practice-team: I want to start a daily sit-spot practice
  at a corner of my backyard. I'm a complete beginner and I have about
  20 minutes each morning before work. Design the first month for me.

# Longitudinal behavioral tracking
> nature-studies-practice-team: A pair of pileated woodpeckers has been
  using a dead tree in my woodlot. I want to track them for the breeding
  season. Help me structure observations that will actually be useful.

# Phenology monitoring
> nature-studies-practice-team: I want to track first-flowering dates for
  10 plant species in my yard across multiple years. How do I set this up?

# Ongoing practice tune-up
> nature-studies-practice-team: (session: grove:prac123) I've been
  journaling weekly for three months and it feels stale. What should I
  adjust?
```

## Limitations

- The team optimizes for sustained practice, not for single-session questions. A user with a one-shot question should use another team.
- The team is scaffolded toward beginner and intermediate practitioners. Research-level observers may find the scaffolding too prescriptive and should use specialists directly.
- The team does not supply identification expertise. A practice session that turns up an unknown species needs to be escalated to the workshop team or a specialist.
- The team does not include Linnaeus as chair, so cross-wing synthesis must be requested separately by escalating to the analysis team.
