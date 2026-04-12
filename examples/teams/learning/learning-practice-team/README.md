---
name: learning-practice-team
type: team
category: learning
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/learning/learning-practice-team/README.md
description: Pipeline-oriented practice team for procedural-fluency work — diagnose the current practice, design drills at the edge of ability, build scaffolds for the practice sessions, and embed the work in a prepared environment. Ericsson leads the pipeline with Vygotsky-learn supplying scaffolds and Montessori-learn supplying materials or environment; Bloom handles routing and synthesis. Use for mastery-loop inner work, plateau escapes, skill-drill design, and maintenance-phase procedural fluency. Not for developmental diagnosis, motivation work, or project-based experiential design.
superseded_by: null
---
# Learning Practice Team

Pipeline-oriented practice team for procedural-fluency work. Analogous to `business-practice-team` or `math-practice-team` — takes a diagnosed skill gap and produces a running drill pipeline that actually closes it.

## When to use this team

- **Mastery-loop inner work** — you've identified the objective and the gap; now you need the drill that will close it.
- **Plateau escape** — a student has plateaued on a procedural skill and the practice design needs rebuilding.
- **Skill-drill pipeline** — you need to run the same drill architecture across a class or across a sequence of skills.
- **Maintenance phase** — a previously mastered skill is fading and needs a light-touch practice pipeline to preserve it.
- **Procedural fluency gap** — the student understands conceptually but cannot execute at the required speed or accuracy.

## When NOT to use this team

- **Developmental diagnosis** — use `piaget-learn` directly or `learning-analysis-team`.
- **Motivation work** — use `dweck` directly or `learning-workshop-team`.
- **Experiential or PBL design** — use `dewey-learn` directly.
- **New objective writing** — use `bloom` directly.
- **Conceptual-understanding gap** where the student does not yet have the schema — route to `piaget-learn` first, then come back to this team once the schema is established.

## Composition

Four agents form the practice team:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair** | `bloom` | Routing, mastery-loop integration, synthesis | Opus |
| **Practice architect** | `ericsson` | Diagnose practice, design drill sets, calibrate edge | Opus |
| **Scaffold designer** | `vygotsky-learn` | Support structures for early practice sessions | Sonnet |
| **Environment / materials** | `montessori-learn` | Physical materials and uninterrupted-time structure | Sonnet |

Ericsson leads the pipeline because the core work is drill design. Vygotsky-learn supplies the scaffolds that get the learner started in the ZPD, which then fade as the deliberate-practice loop takes over. Montessori-learn supplies the physical conditions (materials, workspace, uninterrupted time) that let the practice actually happen. Bloom routes and synthesizes.

This is the only team configuration where Ericsson is the primary specialist rather than a support role. The practice team is the place where Ericsson's framework takes the lead.

## Pipeline flow

```
Input: user query (a diagnosed procedural gap or plateau) + learner context
        |
        v
+---------------------------+
| Bloom (Opus)              |  Phase 1: Verify the diagnosis
| Chair                     |          - is this really procedural, not conceptual?
+---------------------------+          - is the gap clearly defined?
        |                              - if not, re-route
        v
+---------------------------+
| Ericsson (Opus)           |  Phase 2: Design the drill pipeline
| Practice architect        |          - specify the goal per session
+---------------------------+          - design the problem set progression
        |                              - calibrate the edge
        |                              - set the feedback loop
        v
+---------------------------+
| Vygotsky-learn (Sonnet)   |  Phase 3: Entry scaffolds
| Scaffold designer         |          - scaffolds for the first 2-3 sessions
+---------------------------+          - fading schedule aligned with drill progression
        v
+---------------------------+
| Montessori-learn (Sonnet) |  Phase 4: Physical setup
| Environment / materials   |          - materials list
+---------------------------+          - workspace layout
        |                              - uninterrupted-time structure
        v
+---------------------------+
| Bloom (Opus)              |  Phase 5: Synthesize
| Chair                     |          - integrate the four pieces
+---------------------------+          - produce the LearningDesign record
        |                              - write the user-facing response
        v
                Final response to user
                + LearningDesign Grove record
```

## Pipeline protocol

### Phase 1 — Verify (Bloom)

Bloom confirms that the query really is a procedural-fluency problem and not a disguised conceptual, developmental, or motivational issue. If in doubt, Bloom re-routes. This gate exists because the practice team's tools are not the right ones for other kinds of problems, and running them anyway produces drill sets that do not close the gap.

### Phase 2 — Drill design (Ericsson)

Ericsson specifies:

- **Goal per session.** A single observable outcome the learner will try to achieve.
- **Problem-set progression.** Day-by-day difficulty curve, aiming for 70-85% success at the edge.
- **Feedback mechanism.** Per-attempt feedback via answer key, automated check, or peer.
- **Session length.** Typically 15-45 minutes depending on learner age and task.
- **Mastery criterion.** What level of performance signals that the drill has done its work.
- **Plateau check.** When and how to detect stalls and escalate.

### Phase 3 — Entry scaffolds (Vygotsky-learn)

The first few sessions of any new drill set are in the learner's ZPD, not yet fully independent. Vygotsky-learn designs:

- **Starter scaffolds.** Worked examples, templates, hint ladders for the first 2-3 sessions.
- **Fading schedule.** Aligned with the drill progression so that by session 4-5 the scaffolds are withdrawn and the learner is in self-directed deliberate practice.
- **Fallback.** What to do if the fade fails — return to a heavier scaffold for a session, then retry.

### Phase 4 — Physical setup (Montessori-learn)

For learners where the physical environment matters (especially younger learners, home-school contexts, or tutoring setups), Montessori-learn specifies:

- **Materials list.** Specific drill materials — flashcards, manipulatives, workbooks, software.
- **Workspace.** Where the practice happens, how the materials are laid out, how the learner accesses and returns them.
- **Time structure.** Block length, frequency, placement in the day.

For older learners or classroom contexts where the environment is fixed, Phase 4 is brief — just a "what materials does the student need?" list.

### Phase 5 — Synthesis (Bloom)

Bloom integrates the four outputs into a single pipeline document that the user can run day by day. The document includes:

- The diagnosed gap (from Phase 1)
- Drill pipeline (from Phase 2)
- Scaffolds and fade schedule (from Phase 3)
- Materials and workspace (from Phase 4)
- A 1-week checklist for running the pipeline
- A 2-week checkpoint for plateau check and escalation

## Synthesis rules

### Rule 1 — Ericsson's drill is the spine

The scaffolds and environment support the drill, not the other way around. If Vygotsky-learn's scaffold plan or Montessori-learn's materials suggestion would alter the drill structure, Ericsson's drill wins and the supporting work adapts.

### Rule 2 — Scaffold fade aligns with edge calibration

The scaffold fade schedule from Vygotsky-learn must match the drill-difficulty progression from Ericsson. Both converge on "independent deliberate practice at the edge" by roughly the same session.

### Rule 3 — Environment is minimum-sufficient

Montessori-learn does not redesign the whole classroom for a single drill pipeline. The environment contribution is the minimum set of materials and time structure needed to let the drill run. Broader environment work goes to the analysis team.

### Rule 4 — Plateau check is built in

The pipeline includes an explicit plateau-detection point (typically 2 weeks). If the learner stalls, Ericsson's plateau-escape diagnostic runs automatically and the pipeline is adjusted. Plateaus are expected, not failures.

### Rule 5 — Honest about the scope

The practice team handles procedural fluency. When the plateau diagnostic reveals the real problem is developmental, motivational, or conceptual, Bloom escalates out of the practice team to the appropriate specialist.

## Input contract

1. **Target skill** (required). Observable, decomposable, procedural.
2. **Current performance** (required when available). Success rate, error types, time per attempt.
3. **Learner context** (required). Age, grade, available time budget, tools available.
4. **User role** (optional). Teacher, parent, tutor, self-learner.

## Output contract

### Primary output: Drill pipeline plan

A plan document containing:

- Target gap and mastery criterion
- Day-by-day drill progression
- Scaffolds for early sessions, with fade schedule
- Materials list and workspace setup
- 1-week run checklist and 2-week plateau check

### Grove record: LearningDesign

```yaml
type: LearningDesign
chair: bloom
specialists_invoked:
  - ericsson
  - vygotsky-learn
  - montessori-learn
design:
  target_skill: <skill>
  mastery_criterion: <criterion>
  drill_pipeline: <from ericsson>
  scaffold_plan: <from vygotsky-learn>
  environment: <from montessori-learn>
  integrated_pipeline: <synthesis>
plateau_check_scheduled: day 14
concept_ids:
  - deliberate-practice
  - scaffolding
  - prepared-environment
```

## Escalation paths

- **Phase 1 verification fails:** The gap is not procedural. Route to piaget-learn (conceptual/developmental), dweck (motivation), or dewey-learn (experiential) via Bloom.
- **Plateau check triggers:** Ericsson runs the plateau-escape diagnostic. If the problem is still procedural, revise the drill. If the problem is conceptual, motivational, or environmental, escalate to the analysis team.
- **Scaffold fade repeatedly fails:** The developmental readiness was misdiagnosed. Route back to piaget-learn for a re-check.
- **User reports the environment cannot support the pipeline** (e.g., no uninterrupted time possible): adjust the pipeline to the available conditions or escalate to the analysis team for a broader fix.

## Token and time cost

- **Bloom** — 2 Opus invocations (verify + synthesize), ~25K tokens
- **Ericsson** — 1 Opus invocation, ~25K tokens (the largest specialist role)
- **Vygotsky-learn** — 1 Sonnet invocation, ~15K tokens
- **Montessori-learn** — 1 Sonnet invocation, ~10K tokens
- **Total** — 70-100K tokens, 5-10 minutes wall-clock

The practice team is the most cost-efficient of the three teams for its specific use case. It is meant to run **repeatedly** over the course of a school year, producing pipeline after pipeline as gaps are identified.

## Configuration

```yaml
name: learning-practice-team
chair: bloom
pipeline:
  - practice: ericsson
  - scaffold: vygotsky-learn
  - environment: montessori-learn

parallel: false
timeout_minutes: 10

plateau_check_days: 14
```

## Invocation

```
# Drill design for identified gap
> learning-practice-team: Long division gap for a 4th grader. Current success ~40% on 3-digit divided by 1-digit. Design a 2-week drill pipeline. Role: parent.

# Plateau escape
> learning-practice-team: 7th grade pre-algebra student, success plateau at 70% on multi-step equations for 2 weeks. Diagnose and rebuild. Role: teacher.

# Class-wide pipeline
> learning-practice-team: Design a drill pipeline for multiplication table fluency in a 3rd grade class. Target: 85% accuracy and 3 seconds per fact by end of month. Role: teacher.

# Maintenance
> learning-practice-team: High school student is forgetting basic algebra during a long gap in coursework. Design a maintenance pipeline. Role: self-learner.
```

## Limitations

- The team handles procedural fluency only. Concept-before-fluency and fluency-before-concept are both outside its core competence and get re-routed.
- The team assumes the gap has been diagnosed. If the user brings an undiagnosed problem, Phase 1 verification may have to re-route.
- The team does not handle the "what should I learn next?" question. That is a curriculum-level decision for Bloom directly or the analysis team.
- Ericsson's drill designs rely on the user being able to supply tight per-attempt feedback. If that is impossible in the user's context, the pipeline's effectiveness drops significantly and the team reports this honestly.
