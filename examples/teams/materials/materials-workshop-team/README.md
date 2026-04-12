---
name: materials-workshop-team
type: team
category: materials
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/materials/materials-workshop-team/README.md
description: Focused materials workshop team for a single design or selection question that needs deep treatment from the selection lens, the fracture lens, and the pedagogy lens. Pairs the chair (Bessemer) with Ashby (selection), Gordon (failure and toughness), and Cottrell (pedagogy) to produce a defensible selection report backed by failure-mode screening and level-appropriate explanation. Use for design reviews, grade decisions for a new project, or when a single selection question deserves a full workshop rather than a quick ranking.
superseded_by: null
---
# Materials Workshop Team

Focused strategic workshop for a single materials question that deserves deeper treatment than a solo specialist can provide. Runs four agents with the goal of producing a selection or diagnosis that the user can defend in a design review.

## When to use this team

- **Design reviews** where a selection needs to be supported by failure-mode screening and a clear explanation of the trade-offs.
- **Grade decisions for a new project** — the class-level winner is obvious but the specific grade matters, and the decision needs to be defensible.
- **Selection under a dominant constraint** — weight-limited, cost-limited, temperature-limited, or corrosion-limited problems where one axis dominates.
- **Teaching-grade selection work** — when the user wants to learn the Ashby method on their actual problem.
- **Focused failure analysis** where the failure mechanism is largely understood and the work is to pick the replacement material correctly.

## When NOT to use this team

- **Multi-subdomain problems** spanning selection, process history, nanomaterials, and characterization simultaneously — use `materials-analysis-team`.
- **Pure failure analysis** where no selection change is under consideration — use `gordon` directly.
- **Routine computations** — use the specialist directly.
- **Pure process-history questions** — use `cort` directly.

## Composition

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `bessemer` | Classification, orchestration, synthesis | Opus |
| **Selection specialist** | `ashby` | Ashby method, performance indices, Pareto trade-offs | Opus |
| **Failure analyst** | `gordon` | Fracture mechanics, fatigue, failure-mode screening | Sonnet |
| **Pedagogy specialist** | `cottrell` | Level adaptation, scaffolding, textbook-quality explanation | Sonnet |

Two agents run on Opus (Bessemer and Ashby) because their work in this team carries the most decision weight. Two run on Sonnet (Gordon and Cottrell) because their contributions are framework-driven.

## Orchestration flow

```
Input: user query + optional user level
        |
        v
+---------------------------+
| Bessemer (Opus)           |  Phase 1: Classify
| Chair / Router            |          - subdomain
+---------------------------+          - decision type
        |                              - complexity
        |                              - user level
        |
        v
+---------------------------+
| Ashby (Opus)              |  Phase 2: Selection
| Derive indices, filter,   |          - produce MaterialsSelection
| rank, shortlist           |            record with class + grades
+---------------------------+
        |
        v
+---------------------------+
| Gordon (Sonnet)           |  Phase 3: Failure-mode screening
| Check each shortlisted    |          - flag failure modes and caveats
| candidate                 |            that would disqualify or qualify
+---------------------------+            the candidate
        |
        v
+---------------------------+
| Bessemer (Opus)           |  Phase 4: Synthesize
| Integrate selection and   |          - reconcile any Ashby-vs-Gordon
| failure screening         |            disagreements
+---------------------------+          - produce final recommendation
        |
        v
+---------------------------+
| Cottrell (Sonnet)         |  Phase 5: Pedagogy wrap
| Adapt to user level       |          - explain the method as applied
+---------------------------+          - explain the trade-offs
        |
        v
+---------------------------+
| Bessemer (Opus)           |  Phase 6: Record
| Emit MaterialsSession     |          - link work products
+---------------------------+          - emit Grove record
        |
        v
   Final response
```

## Synthesis rules

### Rule 1 — Selection proposes, failure screening disposes

Ashby's selection is the starting point. Gordon's failure-mode screening is the filter. A candidate that wins on Ashby indices but fails Gordon's screening on a critical mode (e.g., SCC in the specified environment) is either disqualified or qualified with an explicit mitigation.

### Rule 2 — Grade-level work is always included

A class-level answer ("use aluminum 7xxx") is not enough. The team delivers a specific grade shortlist and names the temper, and Gordon's screening is applied at the grade level, not just the class level.

### Rule 3 — The method is part of the output

A workshop deliverable includes not just the recommendation but the reasoning trail — the function, the objective, the constraints, the free variables, the index derivation, the filter steps, the ranked candidates, and the failure-mode screening. A user who does not see the trail cannot defend the recommendation.

### Rule 4 — User level governs presentation, not content

Cottrell adapts the presentation to the user level. A graduate-level design-review audience gets the index derivation in full; a beginner audience gets the same conclusion scaffolded with analogies and the key equations explicitly named.

## Input contract

The team accepts:

1. **Function** (required). What the component does.
2. **Objective** (required). What is to be minimized or maximized.
3. **Constraints** (required). Mechanical, thermal, chemical, regulatory, cost.
4. **Free variables** (required). What the designer can adjust.
5. **User level** (optional). Determines the pedagogy wrap.
6. **Prior MaterialsSession hash** (optional). For follow-ups.

## Output contract

### Primary output: synthesized response

A design-review-quality response containing:

- The Ashby five-step translation (function, objective, constraints, free variables, index)
- The derivation of the performance index
- The filter steps and eliminated candidates
- The class-level winner and grade-level shortlist
- The failure-mode screening for each shortlisted candidate
- The final recommendation with trade-offs made explicit
- A level-appropriate explanation of the reasoning

### Grove record: MaterialsSession

```yaml
type: MaterialsSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  subdomain: selection
  decision_type: select
  complexity: challenging
  user_level: <user_level>
agents_invoked:
  - bessemer
  - ashby
  - gordon
  - cottrell
work_products:
  - <grove hash of MaterialsSelection>
  - <grove hash of MaterialsAnalysis (failure screening)>
  - <grove hash of MaterialsExplanation (pedagogy wrap)>
user_level: <user_level>
```

## Escalation paths

- **Ashby and Gordon disagree on whether a candidate qualifies:** Bessemer mediates. If the disagreement is about a property value, a characterization step is recommended. If it is about a mechanism, the more conservative view controls.
- **The selection resists the Ashby method** (e.g., the objective is not reducible to a scalar index): Bessemer widens the team to `materials-analysis-team` and notes the escalation in the session record.
- **The failure-mode screening surfaces a known problem with no clean mitigation:** report this to the user as a constraint that rules out the candidate and suggest alternatives.

## Token / time cost

- **Bessemer** — 2 Opus invocations, ~30K tokens total
- **Ashby** — 1 Opus invocation, ~40K tokens
- **Gordon** — 1 Sonnet invocation, ~25K tokens
- **Cottrell** — 1 Sonnet invocation, ~20K tokens
- **Total** — 100-200K tokens, 3-10 minutes wall-clock

Cheaper than the full analysis team, expensive enough to be justified only when the selection matters.

## Invocation

```
# Design-review workshop
> materials-workshop-team: I need to select a material for the drive shaft of a
  high-performance electric motorcycle. Function: torque transmission. Objective:
  minimum rotational inertia at a specified stiffness. Constraints: fatigue life
  1e7 cycles at 250 MPa, corrosion in humid air, machinable. Level: advanced.

# Grade decision
> materials-workshop-team: I have narrowed a bracket to aluminum 6061-T6 vs 7075-T6.
  The part is welded and the environment includes marine salt spray. Which one and
  why? Level: intermediate.
```
