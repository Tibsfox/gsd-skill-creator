---
name: learning-analysis-team
type: team
category: learning
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/learning/learning-analysis-team/README.md
description: Full Learning Department investigation team for multi-lens learning-design problems spanning developmental readiness, scaffolding, deliberate practice, mindset, experiential design, and prepared environment. Bloom classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified response calibrated to the user's role (teacher, parent, curriculum designer, self-learner). Use for curriculum reviews, one-learner diagnoses that resist a single-lens reading, or any learning-design question where the right intervention is not obvious and different traditions may yield different recommendations. Not for routine objective writing, pure drill design, or pure motivation framing.
superseded_by: null
---
# Learning Analysis Team

Full-department multi-method investigation team for learning-design problems that span traditions or resist single-lens classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response, analogous to how math-investigation-team runs multiple analysis methods on a single mathematical question.

## When to use this team

- **Multi-lens problems** where developmental fit, scaffolding, drill design, motivation, and environment all plausibly matter — and no single specialist covers the full scope.
- **Curriculum reviews** of whole units or courses, where objectives, assessments, materials, and classroom arrangement must all be examined together.
- **One-learner diagnoses** where a student is stuck and it is not clear whether the bottleneck is developmental, procedural, motivational, or environmental.
- **New-to-learning-design questions** where the user is a teacher or parent who does not yet know which specialist to ask.
- **Cross-tradition synthesis** — when a problem benefits from seeing it through constructivist, sociocultural, deliberate-practice, and experiential lenses at once.
- **Verification of complex lesson plans** — when a unit needs both developmental-fit checking, scaffolding review, motivational audit, and PBL critique simultaneously.

## When NOT to use this team

- **Routine objective writing** — use `bloom` directly. The team's token cost is substantial.
- **Pure drill design** for an already-diagnosed procedural gap — use `ericsson` directly via the learning-practice-team.
- **Pure motivation framing** for a clearly-diagnosed attribution issue — use `dweck` directly.
- **Beginner-level one-activity help** where the classification is obvious — route to the specialist via `bloom` in single-agent mode.
- **Questions outside the learning-design scope** — broader developmental psychology questions belong to `examples/agents/psychology/piaget` or `examples/agents/psychology/vygotsky`; broader philosophy-of-education questions belong to `examples/agents/philosophy/dewey`.

## Composition

The team runs all seven Learning Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `bloom` | Classification, orchestration, synthesis, objective design | Opus |
| **Practice specialist** | `ericsson` | Deliberate-practice diagnosis, drill design, plateau escape | Opus |
| **Motivation specialist** | `dweck` | Mindset diagnosis, attribution audit, intervention scripts | Opus |
| **Developmental specialist** | `piaget-learn` | Developmental readiness, schema diagnosis, disequilibrium design | Sonnet |
| **Scaffolding specialist** | `vygotsky-learn` | ZPD diagnosis, scaffold design, fading schedules | Sonnet |
| **Experiential specialist** | `dewey-learn` | Continuity-interaction evaluation, PBL audit, reflective-cycle design | Sonnet |
| **Environment specialist** | `montessori-learn` | Prepared-environment design, materials recommendation | Sonnet |

Three agents run on Opus (Bloom, Ericsson, Dweck) because their tasks require judgment under ambiguity and across research traditions. Four run on Sonnet because their tasks are well-defined and framework-driven.

## Orchestration flow

```
Input: user query + optional learner context + optional user role + optional prior LearningSession hash
        |
        v
+---------------------------+
| Bloom (Opus)              |  Phase 1: Classify the query
| Chair / Router            |          - learner target (age band)
+---------------------------+          - cognitive level (Bloom matrix)
        |                              - problem type (design/diagnosis/motivation/environment/review)
        |                              - intervention scope (activity/unit/course/curriculum/learner)
        |                              - recommended agents (subset of 6)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Piaget-    Vygotsky-  Ericsson  Dweck   Dewey-  Montessori-
    learn      learn      (drill)   (motiv) learn   learn
    (develop)  (scaffold)                   (xp)    (env)
        |        |          |        |        |        |
    Phase 2: Specialists work in parallel, each reading the
             same query but producing an independent finding
             in their own framework. Each produces a Grove
             record. Bloom activates only the relevant
             subset — not all 6 are invoked on every query.
        |        |          |        |        |        |
        +--------+----------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Bloom (Opus)              |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank by confidence and fit
                         |                           - calibrate to user role
                         v
              +---------------------------+
              | Bloom (Opus)              |  Phase 4: Produce LearningSession
              | Emit Grove record         |          - link all work products
              +---------------------------+          - classification metadata
                         |
                         v
                  Final response to user
                  + LearningSession Grove record
```

## Synthesis rules

Bloom synthesizes the specialist outputs using these rules, directly analogous to the math-investigation-team's synthesis protocol.

### Rule 1 — Converging findings are strengthened

When two or more specialists independently reach the same diagnosis (e.g., Piaget-learn identifies a schema gap and Ericsson identifies a procedural gap that fits that schema), the combined finding is high-confidence and drives the intervention plan.

### Rule 2 — Diverging findings are preserved and investigated

When specialists disagree about the right lever (e.g., Dweck says "motivation" and Ericsson says "the practice design itself is broken"), Bloom does not force reconciliation. Instead:

1. State both findings with attribution ("Dweck reads this as attribution protection; Ericsson reads it as insufficient feedback-loop tightness").
2. Check: is there evidence that would distinguish the two readings? Ask for more data from the user if needed.
3. If the disagreement persists, report it honestly and let the user choose which lens to apply first.

### Rule 3 — Environment before technique

When Montessori-learn identifies a broken environment, environment fixes come first. Drill design and mindset work inside a chaotic classroom produce small, unstable effects. Stabilize the environment, then work on the technique layer.

### Rule 4 — Developmental fit is a gate

When Piaget-learn identifies a developmental mismatch, the lesson's ambition is adjusted before any other specialist's work is applied. There is no point in designing an elegant scaffold for material the learner lacks the prerequisites to handle.

### Rule 5 — Motivation as context, not content

Dweck's framing affects how the response is delivered and what feedback language is used, but the underlying design work comes from the other specialists. A motivation-only intervention rarely works; a technical intervention delivered with good motivation framing usually does.

### Rule 6 — User role governs presentation

A teacher receives classroom-actionable steps, a parent receives home-actionable framing, a curriculum designer receives structural advice, a self-learner receives self-directed guidance. The mathematical or technical content is the same; the framing adapts.

## Input contract

The team accepts:

1. **User query** (required). Natural language learning-design request.
2. **Learner context** (optional). Age, grade, subject, prior exposure, known difficulties.
3. **User role** (optional). One of: `teacher`, `parent`, `curriculum-designer`, `self-learner`, `researcher`.
4. **Prior LearningSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Offers concrete, actionable next steps
- Credits the specialists involved
- Notes any genuine uncertainties or research caveats (particularly around mindset-replication)
- Suggests follow-up work when appropriate

### Grove record: LearningSession

```yaml
type: LearningSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  learner_target: <level>
  cognitive_level: <level>
  problem_type: <type>
  intervention_scope: <scope>
agents_invoked:
  - bloom
  - piaget-learn
  - vygotsky-learn
  - ericsson
  - dweck
  - dewey-learn
  - montessori-learn
work_products:
  - <grove hash of LearningAnalysis>
  - <grove hash of LearningDesign>
  - <grove hash of LearningReview>
concept_ids:
  - <relevant learning concept IDs>
user_role: <role>
```

Each specialist's output is also a standalone Grove record linked from the LearningSession.

## Escalation paths

### Internal escalations

- **Piaget-learn identifies misalignment, Vygotsky-learn scaffold plan is based on the mismatch:** Re-route. Vygotsky-learn adjusts the scaffold to the corrected developmental target.
- **Dweck intervention stalls:** When a motivation intervention has been applied correctly and is still not working, route to Vygotsky-learn (environment), Piaget-learn (developmental), or Montessori-learn (prepared environment) in turn to find the underlying lever.
- **Dewey-learn fails a PBL unit and Ericsson flags weak procedural fluency:** This is the common case where students cannot do the project because the prerequisites are not drilled. Add a drill phase before the project.

### External escalations (from other teams)

- **From learning-workshop-team:** When a workshop reveals the problem is broader than the single focus question, escalate to learning-analysis-team.
- **From learning-practice-team:** When drill work exposes a developmental or motivational bottleneck, escalate to learning-analysis-team for a full scan.

### Escalation to the user

- **Beyond learning-design scope:** If the problem requires clinical psychology, special-education evaluation, or medical assessment, Bloom acknowledges the boundary and suggests appropriate resources.
- **Research unsettled:** When a specialist's recommendation rests on a finding that has been contested (most commonly mindset replication), Bloom reports honestly and recommends how to read the evidence.

## Token and time cost

Approximate cost per investigation:

- **Bloom** — 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** — up to 6 agents, mix of Opus and Sonnet, ~20-40K tokens each
- **Total** — 150-350K tokens, 5-15 minutes wall-clock

This cost is justified for curriculum reviews and multi-lens diagnoses. For single-lens questions, use the specialist directly or a focused team.

## Configuration

```yaml
name: learning-analysis-team
chair: bloom
specialists:
  - developmental: piaget-learn
  - scaffolding: vygotsky-learn
  - practice: ericsson
  - motivation: dweck
  - experiential: dewey-learn
  - environment: montessori-learn

parallel: true
timeout_minutes: 15

auto_skip: true

min_specialists: 2
```

## Invocation

```
# Full curriculum review
> learning-analysis-team: Review our 5th grade math curriculum for Bloom-level distribution, developmental fit, scaffold discipline, and motivation framing. Role: curriculum-designer.

# Multi-lens one-learner diagnosis
> learning-analysis-team: My 11-year-old struggles with reading comprehension. He decodes fine, but nothing seems to stick. Help me figure out what is going on. Role: parent.

# Follow-up
> learning-analysis-team: (session: grove:abc123) After two weeks on the drill plan, she still says "I'm not a math person." What now?
```

## Limitations

- The team is limited to the seven agents' combined expertise. Questions requiring clinical assessment, neurological testing, or special-education evaluation are referred out.
- Parallel specialists do not communicate during Phase 2 — convergence is measured only at the synthesis level. This preserves independence but prevents real-time collaboration.
- The team does not replace the teacher's direct knowledge of the learner. Diagnoses are hypotheses to be verified, not final judgments.
- When research evidence is thin or contested (most notably for mindset-intervention effect sizes), the team reports honestly rather than pretending to certainty.
