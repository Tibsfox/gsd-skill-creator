---
name: materials-analysis-team
type: team
category: materials
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/materials/materials-analysis-team/README.md
description: Full Materials Department investigation team for multi-subdomain problems spanning selection, process history, failure analysis, nonferrous alloys, nanomaterials, and characterization. Bessemer classifies the query along four dimensions and activates the relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with pedagogy wrap from Cottrell. Use for research-level questions, executive-level materials reviews, or any problem where the subdomain is not obvious and different specialist perspectives may yield different insights. Not for routine selection, pure failure analysis, or pure process questions.
superseded_by: null
---
# Materials Analysis Team

Full-department investigation team for materials-engineering problems that span subdomains or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response.

## When to use this team

- **Multi-subdomain problems** that touch selection, failure analysis, process history, nonferrous alloys, nanomaterials, or characterization simultaneously, where no single specialist covers the full scope.
- **Research-level questions** where the subdomain is not obvious and the problem may yield different insights from different specialist perspectives.
- **Executive-level materials reviews** of a design or a failure, requiring coordinated input from all the relevant specialists.
- **Novel problems** where the user does not know which specialist to invoke, and Bessemer's classification is the right entry point.
- **Cross-subdomain synthesis** — understanding a materials question through multiple lenses (selection via Ashby, fracture via Gordon, microstructure via Cottrell, process via Cort, nonferrous alternative via Merica).
- **Verification of complex results** — when a selection, diagnosis, or recommendation needs cross-checks from multiple independent angles.

## When NOT to use this team

- **Simple selection** — use `ashby` directly. The analysis team's token cost is substantial.
- **Pure failure analysis** where the subdomain is clear — use `materials-workshop-team` or `gordon` directly.
- **Pure process-history questions** — use `cort` directly.
- **Beginner-level teaching** with no research component — use `cottrell` directly.
- **Single-subdomain problems** where the classification is obvious — route to the specialist via `bessemer` in single-agent mode.

## Composition

The team runs all seven Materials Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `bessemer` | Classification, orchestration, synthesis | Opus |
| **Selection specialist** | `ashby` | Ashby method, performance indices, Pareto trade-offs | Opus |
| **Nanomaterials specialist** | `smalley` | Fullerenes, nanotubes, graphene, 2D materials | Opus |
| **Ferrous process historian** | `cort` | Puddling, Bessemer, open-hearth, BOF, EAF history | Sonnet |
| **Light-metals specialist** | `merica` | Aluminum, nickel superalloys, age hardening | Sonnet |
| **Failure analyst** | `gordon` | Fracture mechanics, fatigue, SCC, diagnosis | Sonnet |
| **Pedagogy specialist** | `cottrell` | Dislocation theory, level adaptation, textbook explanations | Sonnet |

Three agents run on Opus (Bessemer, Ashby, Smalley) because their tasks require deep reasoning under ambiguity. Four run on Sonnet because their tasks are framework-driven and computationally bounded.

## Orchestration flow

```
Input: user query + optional user level + optional prior MaterialsSession hash
        |
        v
+---------------------------+
| Bessemer (Opus)           |  Phase 1: Classify the query
| Chair / Router            |          - subdomain (may be multi-subdomain)
+---------------------------+          - decision type (select/explain/analyze/compare/verify)
        |                              - complexity (routine/challenging/research-level)
        |                              - user level
        |                              - recommended agents
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
     Ashby    Smalley   Cort    Merica   Gordon   (Cottrell
     (select) (nano)    (fer)   (nonfer) (fail)    waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             problem but producing independent findings in
             their own framework. Each produces a Grove record.
             Bessemer activates only the relevant subset --
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Bessemer (Opus)           |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by confidence
                         |                           - produce unified response
                         v
              +---------------------------+
              | Cottrell (Sonnet)         |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - flag oversimplifications
                         v
              +---------------------------+
              | Bessemer (Opus)           |  Phase 5: Record
              | Produce MaterialsSession  |          - link work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + MaterialsSession Grove record
```

## Synthesis rules

### Rule 1 — Converging findings are strengthened

When two or more specialists arrive at the same result independently (e.g., Ashby's selection and Gordon's fracture check both endorse the same grade), mark the result as high-confidence. Cross-specialist convergence is the strongest signal available.

### Rule 2 — Diverging findings are preserved and investigated

When specialists disagree, Bessemer does not force a reconciliation. State both findings with attribution, re-delegate to the specialist whose view is less expected, and escalate to Gordon or Ashby for adjudication if the disagreement persists.

### Rule 3 — Failure trumps selection

When a candidate winning on selection grounds has a known failure mode that Gordon flags (7075 aluminum for a hydrogen-exposed fastener, for example), the failure-mode concern takes priority. The selection is revised or qualified, not overridden by optimism.

### Rule 4 — Intrinsic properties are not deployed properties

When Smalley reports a nanomaterial intrinsic property and the application requires deployed performance, the deployed number controls. A graphene thermal conductivity of 5000 W/m*K does not translate to a composite thermal conductivity of 5000 W/m*K.

### Rule 5 — User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Cottrell adapts the presentation — simpler language, more scaffolding, worked examples for lower levels; concise technical writing for higher levels. The mathematical content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language materials question, problem, or request.
2. **User level** (optional). `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Bessemer infers.
3. **Prior MaterialsSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: synthesized response

A unified response that directly answers the query, shows work at the appropriate level of detail, credits the specialists involved, notes any unresolved disagreements, and suggests follow-up explorations.

### Grove record: MaterialsSession

```yaml
type: MaterialsSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  subdomain: multi-subdomain
  complexity: research-level
  decision_type: analyze
  user_level: graduate
agents_invoked:
  - bessemer
  - ashby
  - smalley
  - cort
  - merica
  - gordon
  - cottrell
work_products:
  - <grove hash of MaterialsSelection>
  - <grove hash of MaterialsAnalysis>
  - <grove hash of MaterialsExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: graduate
```

Each specialist's output is also a standalone Grove record linked from the MaterialsSession.

## Escalation paths

### Internal escalations

- **Ashby finds a winner, Gordon flags a failure mode:** revise the selection; the failure-mode concern controls.
- **Merica and Ashby disagree on grade-level preference:** re-check both; if the disagreement persists, escalate to Bessemer for the final call and surface both views to the user.
- **Smalley reports a promising nanomaterial, Ashby cannot rank it:** include the nanomaterial as a flagged candidate outside the main ranking, with honest feasibility notes.

### External escalations

- **From materials-workshop-team:** when a workshop focused on failure or selection uncovers a multi-subdomain problem.
- **From materials-practice-team:** when an ongoing process or characterization program hits an anomaly that needs broader analysis.

### Escalation to the user

- **Insufficient evidence:** when the team cannot complete a diagnosis or selection from the information provided, report what is missing and what the partial finding would be.
- **Outside materials:** when the problem requires expertise outside materials engineering, acknowledge the boundary and suggest resources.

## Token / time cost

- **Bessemer** — 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** — 2 Opus (Ashby, Smalley) + 3 Sonnet (Cort, Merica, Gordon), ~30-60K tokens each
- **Cottrell** — 1 Sonnet invocation, ~20K tokens
- **Total** — 200-400K tokens, 5-15 minutes wall-clock

## Invocation

```
# Full investigation
> materials-analysis-team: I am designing a lightweight autonomous undersea vehicle
  pressure hull. Rate steel, titanium, and a CFRP-syntactic foam sandwich against
  each other on mass, fatigue life in seawater, and inspectability. Level: advanced.

# Multi-subdomain failure
> materials-analysis-team: A welded Inconel 625 tube in a recovery boiler cracked
  after eighteen months. The failure surface looks intergranular. I need the
  mechanism, a grade recommendation, and a characterization plan for the next batch.
```
