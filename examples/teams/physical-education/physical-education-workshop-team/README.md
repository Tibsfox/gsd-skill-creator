---
name: physical-education-workshop-team
type: team
category: physical-education
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/physical-education/physical-education-workshop-team/README.md
description: Focused pedagogy and curriculum workshop team for designing a single unit, season, or assessment rubric. Pairs the chair (Naismith) with the two pedagogy specialists (Siedentop, Jesse Feiring Williams) and the inclusion specialist (Berenson) for thorough treatment of one curriculum question. Use when producing a Sport Education unit, transforming a single unit from traditional to educationally coherent form, or aligning an assessment rubric with whole-child educational intent.
superseded_by: null
---
# Physical Education Workshop Team

Focused curriculum and pedagogy workshop team for a single deep-dive PE design question. Smaller and more targeted than the analysis team, built for unit-level and assessment-level work rather than program-level or multi-domain work.

## When to use this team

- **Design a single Sport Education unit** with full rigor — from preseason through culminating event, with assessment and role assignment.
- **Transform one unit** from traditional activity-week format to educationally coherent form.
- **Develop an assessment rubric** that aligns with whole-child educational intent and captures skill, tactical, role, and fitness dimensions.
- **Workshop a curriculum decision** — should this unit exist? Should this assessment instrument be used? Does this lesson structure serve educational purpose?
- **Mentor a PE teacher** through a curriculum design decision they are making for their own classroom.
- **Apply Williams's whole-child philosophy** to a specific unit or assessment.

## When NOT to use this team

- **Full program transformation** across multiple units — use the analysis team.
- **Practice design for a sports team** — use `wooden` directly.
- **Cardiovascular or strength prescription** — use `kenneth-cooper` or `wooden` directly.
- **Individual lesson plan without curriculum context** — use `siedentop` directly.
- **Lifetime fitness class design** — use `sorensen` directly.
- **Cross-domain program analysis** — use the analysis team.

## Composition

Four agents form the workshop team:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Facilitator** | `naismith` | Classification, facilitation, synthesis | Opus |
| **Curriculum philosophy** | `jesse-feiring-williams` | Whole-child framing, purpose articulation, principle-based critique | Opus |
| **Pedagogy specialist** | `siedentop` | Sport Education model, unit structure, assessment rubric design | Sonnet |
| **Inclusion specialist** | `berenson` | Equity audit, adaptation, UDL principles | Sonnet |

Two agents on Opus (Naismith, Williams) because their tasks require synthesis and philosophical adjudication. Two on Sonnet (Siedentop, Berenson) because their tasks are framework-driven and well-defined.

## Orchestration flow

```
Input: curriculum question + context
        |
        v
+---------------------------+
| Naismith (Opus)           |  Phase 1: Facilitate entry
| Classify, confirm context |          - what is being designed
+---------------------------+          - what is the educational intent
        |                              - what constraints apply
        |
        v
+---------------------------+
| Williams (Opus)           |  Phase 2a: Articulate purpose
| Whole-child purpose frame |          - which of the 4 purposes does the unit serve
+---------------------------+          - is the whole-child test passed
        |
        v
+---------------------------+
| Siedentop (Sonnet)        |  Phase 2b: Design structure
| Sport Education design    |          - preseason / regular / postseason
+---------------------------+          - features and roles
        |                              - assessment rubric
        |
        v
+---------------------------+
| Berenson (Sonnet)         |  Phase 2c: Inclusion review
| Equity and adaptation     |          - equity audit of proposed design
+---------------------------+          - UDL principles applied
        |                              - adaptations for known learners
        |
        v
+---------------------------+
| Naismith (Opus)           |  Phase 3: Synthesize and deliver
| Merge and finalize        |          - resolve any tensions
+---------------------------+          - present unified design
        |
        v
   Final unit / rubric / workshop output
   + PhysicalEducationSession Grove record
```

The workshop flow is sequential rather than parallel because each stage builds on the previous: Williams frames purpose, Siedentop builds the structure that serves that purpose, Berenson ensures the structure is inclusive, Naismith synthesizes and delivers. Each stage can revise the previous stage if a gap is identified.

## Workshop rules

### Rule 1 — Purpose before structure

Williams's purpose statement is the first output. Structure that is not grounded in stated educational purpose is rejected and returned for revision.

### Rule 2 — Full Sport Education or honest approximation

If the unit claims Sport Education, Siedentop verifies all six defining features are present. If any feature is missing, the unit is labeled as "inspired by Sport Education" and the compromise is named explicitly.

### Rule 3 — Inclusion is a precondition

Berenson reviews every unit design before delivery. Equity gaps are closed before the design is delivered to the user. Inclusion is not a post-hoc patch.

### Rule 4 — Assessment aligns with intent

If Williams names "character and social development" as a purpose, and the assessment rubric does not measure it, the rubric is incomplete. Every stated purpose must be matched to an assessment dimension.

### Rule 5 — Contextual feasibility

The team recommends what is feasible in the actual school context, not what the textbook ideal would demand. When compromising, the trade-offs are named.

## Input contract

1. **Curriculum question** (required). Unit design, assessment rubric, transformation of one unit, or curriculum decision.
2. **Context** (required). Grade, class size, sport or activity, calendar available.
3. **Current state** (optional). What the learners have encountered, what the existing unit looks like.
4. **Constraints** (optional). Facility, equipment, assessment policy.

## Output contract

### Primary output

A complete curriculum artifact — unit plan, assessment rubric, or workshop report — that:

- States the unit's purpose using Williams's four-purpose framework
- Specifies the structure using the Sport Education model (or names the compromise)
- Includes an inclusion review and any required adaptations
- Includes an assessment rubric aligned with stated purposes
- Identifies any contextual compromises with rationale

### Grove record: PhysicalEducationSession

```yaml
type: PhysicalEducationSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: pedagogy
  learner_age: <age>
  activity_type: lesson_design
  educational_intent: <intent>
agents_invoked:
  - naismith
  - jesse-feiring-williams
  - siedentop
  - berenson
work_products:
  - <grove hash of PhysicalEducationExplanation> # purpose statement
  - <grove hash of PhysicalEducationPractice>    # unit design
  - <grove hash of PhysicalEducationReview>      # inclusion review
concept_ids:
  - pe-sport-education-model
  - pe-unit-design
  - pe-universal-design
```

## Escalation paths

### Internal

- **Williams vs. Siedentop on model integrity:** If Williams argues a Sport Education unit is missing a whole-child dimension and Siedentop argues the structure is complete, Naismith adjudicates by asking which dimension is missing and whether it can be added without breaking the structure.
- **Berenson identifies a fundamental inclusion gap:** If the gap cannot be closed by adaptation (e.g., the sport itself is contraindicated for a specific learner), the unit is redesigned or the learner is given an alternative role with rigor equal to the player role.

### External

- **To analysis team:** If the question is larger than a single unit (program-wide, multi-unit, cross-sport), escalate.
- **To practice team:** If the question is about ongoing delivery rather than one-time design, escalate.
- **To kenneth-cooper or wooden:** If the question turns out to be primarily physiological or primarily about practice-level coaching, re-route.

### To the user

- **Contextual infeasibility:** If the workshop concludes the intended unit cannot be done well in the actual context, report honestly and recommend the closest feasible alternative.

## Token / time cost

- **Naismith** — 2 Opus invocations (facilitate + synthesize), ~25K tokens
- **Williams** — 1 Opus invocation (purpose + critique), ~30K tokens
- **Siedentop** — 1 Sonnet invocation (structure design), ~30K tokens
- **Berenson** — 1 Sonnet invocation (inclusion review), ~20K tokens
- **Total** — 100--180K tokens, 3--8 minutes wall-clock

Substantially less than the analysis team. Justified whenever a curriculum artifact needs rigorous design.

## Configuration

```yaml
name: physical-education-workshop-team
chair: naismith
specialists:
  - philosophy: jesse-feiring-williams
  - pedagogy: siedentop
  - inclusion: berenson

parallel: false
sequential_order: [williams, siedentop, berenson, naismith]
timeout_minutes: 10
```

## Invocation

```
# Sport Education unit design
> physical-education-workshop-team: Design a 20-lesson Sport Education volleyball unit
  for 32 8th-graders, mixed skill level.

# Assessment rubric
> physical-education-workshop-team: Develop a multi-dimensional assessment rubric
  for a high school soccer season that captures skill, tactical, role, and fitness dimensions.

# Unit transformation
> physical-education-workshop-team: Transform our traditional 8-lesson basketball unit
  into a 20-lesson Sport Education season with full inclusion design for our class
  of 30, which includes two learners with physical disabilities.
```

## Limitations

- The team handles one curriculum artifact at a time. Multi-unit or program-level work requires the analysis team.
- The sequential workflow is deliberately slower than parallel; trade-off is deeper coherence at each stage.
- The team does not produce practice plans or daily lesson plans — those come from Siedentop or Wooden in single-agent mode after the unit is designed.
- If the curriculum question is actually a coaching question, the workshop team re-routes to Wooden.
