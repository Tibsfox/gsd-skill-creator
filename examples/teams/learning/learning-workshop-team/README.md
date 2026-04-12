---
name: learning-workshop-team
type: team
category: learning
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/learning/learning-workshop-team/README.md
description: Focused design workshop team for a single learning-design question — a new unit, a stuck learner, or a curriculum section needing rework. Bloom pairs with developmental, scaffolding, and motivation specialists to produce a deep, actionable response without pulling in the full department. Use for unit design, single-learner intervention plans, or focused-lesson redesigns where the bottleneck is clear but multi-dimensional. Not for multi-domain curriculum reviews, pure drill pipelines, or routine objective writing.
superseded_by: null
---
# Learning Workshop Team

Focused design-workshop team for a single learning-design question that is clear in scope but requires more than one specialist lens. Analogous to `business-workshop-team` or `proof-workshop-team` — smaller than the full department, deeper than a single specialist.

## When to use this team

- **Unit or lesson design** where the unit is new or being redesigned, and you need developmental fit, scaffolding, and motivation framing worked out together.
- **One-learner intervention plans** where the learner's difficulty has been partially diagnosed and you need a concrete multi-week plan that addresses developmental readiness, scaffolding, and motivation.
- **Focused curriculum section rework** where one section (not the whole curriculum) is not working and the team can identify the problem without surveying the full department.
- **Teaching-strategy workshops** for a teacher who wants to improve a specific class or subject area and is willing to work through a multi-lens plan.
- **Design reviews** of a drafted unit plan that needs critical review from multiple lenses before deployment.

## When NOT to use this team

- **Multi-domain or curriculum-wide reviews** — use `learning-analysis-team`.
- **Pure drill design pipelines** — use `learning-practice-team`.
- **Routine objective writing** — use `bloom` directly.
- **Environment audits** — route to `montessori-learn` and `dewey-learn` directly; the workshop team does not include `montessori-learn` by default.
- **Pure motivation-language audits** — use `dweck` directly.

## Composition

Four agents form the workshop team:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair** | `bloom` | Classification, objective design, synthesis | Opus |
| **Developmental** | `piaget-learn` | Developmental readiness, schema diagnosis | Sonnet |
| **Scaffolding** | `vygotsky-learn` | ZPD calibration, scaffold plan, fading schedule | Sonnet |
| **Motivation** | `dweck` | Attribution audit, intervention script, framing | Opus |

This composition is chosen because the four most common levers in a learning-design workshop are: what objective the student can reach (Bloom), whether they're developmentally ready (Piaget-learn), how to support them (Vygotsky-learn), and how to frame feedback so they persist (Dweck). Ericsson and the environment specialists are available on demand via the workshop's escalation path but are not included in the default team to keep token cost manageable.

## Workshop flow

```
Input: user query (a single learning-design question) + optional learner/class context
        |
        v
+---------------------------+
| Bloom (Opus)              |  Phase 1: Frame the question
| Chair                     |          - restate the design challenge in Bloom-matrix terms
+---------------------------+          - identify which levers are in scope
        |
        v
+---------------------------+
| Piaget-learn (Sonnet)     |  Phase 2a: Developmental check
| Developmental             |          - is the learner ready for this material?
+---------------------------+          - what prior schemas are in play?
        |                              - what bottleneck, if any?
        v
+---------------------------+
| Vygotsky-learn (Sonnet)   |  Phase 2b: Scaffold plan
| Scaffolding               |          - what scaffolds are needed?
+---------------------------+          - what fading schedule?
        |                              - any peer/group structure?
        v
+---------------------------+
| Dweck (Opus)              |  Phase 2c: Motivation framing
| Motivation                |          - attribution risks in the current framing
+---------------------------+          - feedback language recommendations
        |                              - mindset-aware communication script
        v
+---------------------------+
| Bloom (Opus)              |  Phase 3: Synthesize
| Chair                     |          - integrate the three specialist outputs
+---------------------------+          - produce a single, actionable plan
        |                              - write the LearningDesign record
        v
                Final response to user
                + LearningDesign Grove record
```

The workshop runs as a **pipeline** rather than fully in parallel. Each specialist's output feeds into the next: Piaget-learn establishes the developmental target, Vygotsky-learn builds the scaffold to reach it, and Dweck frames the feedback. The pipeline order is intentional — scaffold design depends on developmental diagnosis, and motivation framing depends on what the plan is asking the learner to do.

## Workshop protocol

### Phase 1 — Framing (Bloom, ~5 minutes)

- Restate the user's question in Bloom-matrix terms.
- Confirm the learner target and cognitive level.
- Identify whether the question is about a new design or a redesign.
- Decide whether to skip any phase (e.g., if the learner has already been diagnosed, Phase 2a is brief).

### Phase 2a — Developmental check (Piaget-learn, ~10 minutes)

- Diagnose the learner's developmental tools for the target material.
- Identify likely prior schemas.
- Flag any disequilibrium needed.
- Report whether the target is in-scope or needs scope adjustment.

### Phase 2b — Scaffold plan (Vygotsky-learn, ~15 minutes)

- Given the developmental diagnosis, design scaffolds.
- Plan the fading schedule.
- Recommend any peer/group structure.
- Report the fade-evidence criteria.

### Phase 2c — Motivation framing (Dweck, ~10 minutes)

- Review the planned feedback language for attribution risks.
- Draft process-praise replacements if needed.
- Build a short communication script for the teacher or parent to use.

### Phase 3 — Synthesis (Bloom, ~10 minutes)

- Integrate the three outputs into a single plan.
- Reconcile any tensions (e.g., Vygotsky-learn recommends heavy scaffolding but Dweck warns against making the student feel dependent).
- Produce the LearningDesign Grove record.
- Write the user-facing response calibrated to user role.

## Synthesis rules

### Rule 1 — Developmental fit gates the plan

If Piaget-learn reports that the target is not developmentally in scope, the plan is revised before Vygotsky-learn and Dweck weigh in. Scaffolding cannot overcome a missing prerequisite, and motivation framing cannot persuade a student to hold five variables in mind when they can only hold three.

### Rule 2 — Scaffold and fade, not scaffold alone

The plan must include not only the initial scaffold but the fade schedule. Plans that hand the student permanent support fail in the long run; Vygotsky-learn's contribution is not complete without the withdrawal plan.

### Rule 3 — Language is part of the design

Dweck's contribution is embedded in the plan, not added as an afterthought. The scaffold's tone, the feedback language, and the framing of difficulty are all design decisions that affect whether the plan actually runs.

### Rule 4 — Bloom writes the user-facing voice

All three specialists produce Grove records. Bloom translates them into a single voice for the user. The user never sees four voices at once; they see one coherent plan that credits the specialists by name.

## Input contract

1. **User query** (required). A single focused design question.
2. **Learner or class context** (required for anything but generic design). Age, grade, subject, prior difficulties.
3. **User role** (optional). Teacher, parent, curriculum designer, self-learner.

## Output contract

### Primary output: Unit or intervention plan

A single plan document containing:

- The stated design challenge
- Developmental diagnosis and scope adjustment
- Scaffold plan with fading schedule
- Feedback-language recommendations
- Next-step checklist for the user

### Grove record: LearningDesign

```yaml
type: LearningDesign
chair: bloom
specialists_invoked:
  - piaget-learn
  - vygotsky-learn
  - dweck
design:
  target_outcome: <restated in Bloom-matrix terms>
  developmental_diagnosis: <from piaget-learn>
  scaffold_plan: <from vygotsky-learn>
  feedback_framing: <from dweck>
  integrated_plan: <synthesis>
concept_ids: [...]
```

## Escalation paths

- **If the workshop reveals a multi-domain problem** — escalate to learning-analysis-team.
- **If the workshop reveals a pure drill issue** — hand off to learning-practice-team.
- **If the workshop reveals an environment issue** — consult montessori-learn or dewey-learn on demand, even though they are not part of the default team.
- **If the workshop reveals the learner is not developmentally in scope at all** — Bloom reports this honestly and suggests a lower-scope target.

## Token and time cost

- **Bloom** — 2 Opus invocations (framing + synthesis), ~30K tokens
- **Piaget-learn** — 1 Sonnet invocation, ~15K tokens
- **Vygotsky-learn** — 1 Sonnet invocation, ~20K tokens
- **Dweck** — 1 Opus invocation, ~15K tokens
- **Total** — 80-130K tokens, 5-10 minutes wall-clock

Cheaper than learning-analysis-team, deeper than a single specialist. The sweet spot for focused design work.

## Configuration

```yaml
name: learning-workshop-team
chair: bloom
pipeline:
  - developmental: piaget-learn
  - scaffolding: vygotsky-learn
  - motivation: dweck

parallel: false
timeout_minutes: 10
```

## Invocation

```
# New unit design
> learning-workshop-team: Design a 4-week unit on the water cycle for 4th grade. Target cognitive levels: understand and apply. Role: teacher.

# One-learner intervention
> learning-workshop-team: 11-year-old, stuck on long division, says "I'm bad at math." Build an intervention plan. Role: parent.

# Redesign
> learning-workshop-team: Our 7th grade writing unit isn't working. Students produce the required outputs but don't show growth. Rework it. Role: curriculum-designer.
```

## Limitations

- The workshop does not include Ericsson or the environment specialists by default. Queries that really need drill design or environment audit should use the practice team or the analysis team instead.
- The pipeline structure makes the workshop slower than a fully parallel team but produces more integrated output. For extremely time-sensitive design, the single-specialist route via Bloom is faster.
- The workshop assumes the question is focused. Diffuse "help me with teaching in general" queries should go to the analysis team.
