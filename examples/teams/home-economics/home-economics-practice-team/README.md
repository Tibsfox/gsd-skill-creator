---
name: home-economics-practice-team
type: team
category: home-economics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/home-economics/home-economics-practice-team/README.md
description: Pipeline-oriented operational practice team — diagnose, design, embed. Pairs Gilbreth (motion diagnosis) with Waters (plan design) and Liebhardt (habit embedding) for ongoing household improvement. Lower token cost than the analysis team and sequential rather than parallel, appropriate for ongoing practice rather than one-off design. Use for recurring improvement cycles, iterative routine refinement, or continuous-improvement-style household work. Not for first-time setup (use workshop team) or overhauls (use analysis team).
superseded_by: null
---
# Home Economics Practice Team

Pipeline-oriented operational practice team for ongoing household improvement. Modeled on the business department's `business-practice-team` (Ohno -> Ford -> Ma -> Mintzberg pipeline) and on the continuous-improvement discipline of lean manufacturing — but adapted for the household as a production unit, with Gilbreth as the motion-study diagnostician, Waters as the seasonal plan designer, and Liebhardt as the habit embedder.

## When to use this team

- **Iterative improvement of an existing practice** — the household already has routines; the routines need refinement, not replacement.
- **Monthly or quarterly cycle** — the practice team runs at a regular cadence as part of a continuous-improvement program, not as a one-time intervention.
- **Specific pain point with a clear signal** — "the morning routine is too stressful," "we waste too much produce," "the laundry is always behind." Each is a discrete pain point suited to a focused pipeline.
- **Post-workshop follow-up** — the workshop team produced a plan; the practice team operationalizes it and iterates monthly.
- **Seasonal rotation** — at the start of each new season, the practice team reviews the meal plan, the routine chart, and the teaching sequence and updates them for the new season's realities.

## When NOT to use this team

- **First-time household setup** — use `home-economics-workshop-team`.
- **Multi-subsystem overhaul** — use `home-economics-analysis-team`.
- **Habitability crisis** — route directly to Richards.
- **Pure cooking technique question** — use Child directly.
- **Pure sensory critique** — use Fisher-he directly.
- **Pure historical grounding** — use Beecher directly.

## Composition

The team runs three of the seven Home Economics Department agents in a sequential pipeline:

| Stage | Agent | Method | Model |
|------|-------|--------|-------|
| **Diagnose** | `gilbreth` | Task decomposition, motion study, waste-therblig identification | Opus |
| **Design** | `waters` | Seasonal plan, ingredient-first design, weekly rotation | Sonnet |
| **Embed** | `liebhardt` | Habit formation, retro design, documentation | Sonnet |

One Opus (Gilbreth) plus two Sonnet specialists. The pipeline is sequential — each stage's output feeds the next — rather than parallel.

## The diagnose-design-embed pipeline

The practice team's shape is the lean pipeline adapted for the household:

1. **Diagnose** — Gilbreth decomposes the current practice, measures time and motion, identifies waste therbligs, names the specific friction points.
2. **Design** — Waters (or another specialist depending on the pain point) takes the diagnosis and designs a revised practice. Seasonal planning is the default; other lenses are used when the pain point is not a planning problem.
3. **Embed** — Liebhardt takes the revised practice and designs the habit-formation plan, the retro schedule, and the documentation so the new practice becomes durable.

The pipeline is sequential because each stage requires the output of the previous. You cannot design a revised plan before diagnosing the current one. You cannot embed a habit before the habit has been designed. Parallel execution would break the dependency chain.

Richards does not chair this team directly — it is a specialist pipeline that operates under Richards's background supervision but does not require orchestration from the chair on every cycle. Richards is consulted at the start (to frame the pain point and audit habitability) and at the end (to produce the Session record).

## Orchestration flow

```
Input: pain point + household context + current practice state
        |
        v
+---------------------------+
| Richards (Opus)           |  Phase 0: Frame
| Framing + habitability    |          - audit habitability (does the pain point
+---------------------------+            reflect a habitability issue?)
        |                              - clarify the pain point
        |                              - confirm this is a practice-level question
        v
+---------------------------+
| Gilbreth (Opus)           |  Phase 1: Diagnose
| Motion study + waste      |          - decompose the current practice
+---------------------------+          - measure time and motion
        |                              - identify waste therbligs
        |                              - produce HomeEconomicsAnalysis
        v
+---------------------------+
| Waters (Sonnet)           |  Phase 2: Design
| Revised plan              |          - take the diagnosis as input
+---------------------------+          - design a revised practice
        |                              - address the identified waste
        |                              - produce HomeEconomicsPractice
        v
+---------------------------+
| Liebhardt (Sonnet)        |  Phase 3: Embed
| Habit formation + retro   |          - design habit-formation plan
+---------------------------+          - schedule retros
        |                              - produce documentation
        |                              - produce HomeEconomicsExplanation
        v
+---------------------------+
| Richards (Opus)           |  Phase 4: Close
| Session record            |          - link all three work products
+---------------------------+          - produce HomeEconomicsSession
        |
        v
  Final response to user
  + HomeEconomicsSession with 3 linked work products
```

Note that the pipeline is sequential, not parallel. This is the defining difference between the practice team and the analysis team.

## When to substitute specialists

The default pipeline is Gilbreth -> Waters -> Liebhardt, but the pain point sometimes calls for substitution:

- **If the pain point is a technique failure** — substitute Child for Waters in the Design stage. The design is "a better technique for this dish" rather than "a better plan for this week."
- **If the pain point is a sensory dissatisfaction** — substitute Fisher-he for Waters in the Design stage. The design is a sensory re-framing, not a new plan.
- **If the pain point is historical-frame confusion** — substitute Beecher for Waters in the Design stage. This is rare but appears when a household is trying to connect their practice to the discipline's lineage.

The diagnose (Gilbreth) and embed (Liebhardt) stages are constant. The design stage is the substitutable one.

## Input contract

The team accepts:

1. **Pain point** (required). One concrete description of what is not working.
2. **Household context** (required). Composition, current practice, budget, time budget.
3. **Current practice state** (required). What does the household currently do? How long does it take? What fails?
4. **Cadence** (optional). How often will this team be run? If monthly or quarterly, the pipeline is scheduled rather than one-off.

## Output contract

### Primary output: A revised practice + an implementation plan

The team produces three linked Grove records:

- **HomeEconomicsAnalysis** (from Gilbreth) — the diagnosis
- **HomeEconomicsPractice** (from Waters or substitute) — the revised practice
- **HomeEconomicsExplanation** (from Liebhardt) — the habit-formation and retro plan

Plus a **HomeEconomicsSession** (from Richards) that links them.

The output is an implementable improvement, not a general explainer. The household should be able to start the revised practice the next morning.

## Token and time cost

- **Richards** — 2 Opus invocations (frame + close), ~25K tokens
- **Gilbreth** — 1 Opus invocation, ~30K tokens
- **Waters, Liebhardt** — 2 Sonnet invocations, ~25K tokens each
- **Total** — 90-120K tokens, 3-6 minutes wall-clock

This is the cheapest of the three home-economics teams. It is designed to be run repeatedly as part of a continuous-improvement cadence.

## Cadence

The practice team is designed to be run on a regular cadence:

- **Monthly** for rapid iteration on a specific pain point
- **Quarterly** for seasonal rotation and routine review
- **Ad-hoc** when a specific pain point warrants intervention

A household that runs the practice team every month for a year has twelve cycles of diagnose-design-embed on twelve different pain points. Over time, this produces a household whose practices are measurably better than when the cycles began — the continuous-improvement premise applied to home economics.

## Synthesis rules

The practice team's synthesis is simpler than either the analysis team or the workshop team because the pipeline is sequential and each stage has a single downstream consumer:

### Rule 1 — Diagnosis drives design

Waters (or substitute) cannot produce a design that does not address the waste Gilbreth identified. The design is evaluated against the diagnosis.

### Rule 2 — Design drives embed

Liebhardt cannot produce a habit-formation plan for a practice that was not designed. The embed is evaluated against the design.

### Rule 3 — Each stage is verifiable

At each stage boundary, the output is checked for completeness before the next stage begins. An incomplete diagnosis triggers a re-run of Gilbreth; an infeasible design triggers a re-run of Waters; an unsustainable embed plan triggers a re-run of Liebhardt.

### Rule 4 — Habitability remains precondition

Richards still audits habitability at Phase 0. The practice team does not bypass the habitability-first discipline.

## Escalation paths

### Internal escalations

- **Diagnosis identifies a habitability issue** — Gilbreth escalates to Richards; the pipeline halts.
- **Design cannot address the diagnosis within constraints** — Waters escalates; user is told the constraints are insufficient.
- **Embed plan cannot make the practice sustainable** — Liebhardt escalates; the design is revised.

### External escalations

- **Multi-subsystem problem revealed during diagnosis** — escalate to `home-economics-analysis-team`.
- **First-time setup required** — escalate to `home-economics-workshop-team`.
- **Habitability crisis** — escalate to Richards + professional.

## Configuration

```yaml
name: home-economics-practice-team
chair: richards  # background supervision only
pipeline:
  - stage: diagnose
    agent: gilbreth
  - stage: design
    agent: waters  # or child, fisher-he, beecher by substitution
  - stage: embed
    agent: liebhardt

parallel: false  # sequential pipeline
timeout_minutes: 6

# Scheduled cadence supported
cadence: monthly | quarterly | ad-hoc
```

## Invocation

```
# Monthly practice cycle
> home-economics-practice-team: Monthly cycle. This month's pain point: the morning routine is too stressful and we keep forgetting things. Household: 2 parents, 2 kids (ages 7, 10), weekday mornings 6:30-8:00.

# Seasonal rotation
> home-economics-practice-team: Start of early summer. Last season's plan: soups and braises. Update for the season. Household: same as before. Market now has peas, asparagus, strawberries.

# Specific pain point
> home-economics-practice-team: Pain point: we waste a lot of produce each week because we can't keep up with the plan. Budget $85/week for produce, 2 adults. Design a revised plan and a habit to match.
```

## Limitations

- Three-agent pipeline does not cover technique-heavy or sensory questions by default; substitution extends the coverage but one substitution at a time.
- Sequential execution means the total wall-clock time is longer than parallel execution of the same number of agents.
- The team assumes the household already has a practice to iterate on. A household starting from scratch should use the workshop team first.
- Continuous-improvement cadence requires commitment from the household; a one-off run of the practice team produces one improvement but does not build the habit of improving.
