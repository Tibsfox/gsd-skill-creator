---
name: business-practice-team
type: team
category: business
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/business/business-practice-team/README.md
description: Pipeline-oriented Business Department team for ongoing operational work — waste diagnosis, scale decisions, platform operations, and the pedagogy needed to embed the improvements in the organization. Pairs Ohno (operations and waste), Ford (scale and vertical integration), Ma (platform operations), and Mintzberg (pedagogy) in a sequential pipeline rather than a parallel analysis. Use for repeated operational improvement work, process redesign programs, or any ongoing practice where the question is "how do we actually run this day-to-day." Not for one-off strategic decisions or multi-domain strategy investigations.
superseded_by: null
---
# Business Practice Team

Pipeline-oriented operational-practice team for ongoing business work, analogous to `discovery-team` in the math department. Where `business-analysis-team` handles one-off multi-domain questions and `business-workshop-team` handles deep-dive strategic decisions, this team handles the day-to-day practice of running a business: diagnosing waste, designing flows, evaluating scale, running platforms, and embedding the improvements via pedagogy.

## When to use this team

- **Ongoing operational improvement programs** where the work is continuous rather than one-shot.
- **Process redesign** for a specific function (fulfillment, onboarding, customer support, manufacturing line).
- **Platform operations** where the question is how to run the platform, not whether to build one.
- **Scale decisions** where the question is about capacity, vertical integration, or production flow design.
- **Embedding improvements in the organization** — pairing operational work with the pedagogy needed to make the change stick.
- **Combined operations + training** programs for first-line supervisors or operational managers.

## When NOT to use this team

- **One-off strategic decisions** — use `business-workshop-team`.
- **Multi-domain analysis** spanning strategy, finance, law, and ethics — use `business-analysis-team`.
- **Pure disruption diagnosis** — use `christensen` directly.
- **Pure stakeholder conflict resolution** — use `follett` directly.
- **Ethics-heavy questions** — these need the chair and Follett, not this team.

## Composition

The team runs four agents — the operational-practice core plus pedagogy:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Operations lead** | `ohno` | Waste diagnosis, pull flow, root-cause investigation | Opus |
| **Scale specialist** | `ford` | High-volume production, economies of scale, vertical integration | Sonnet |
| **Platform specialist** | `ma` | Two-sided platforms, operations at platform scale | Sonnet |
| **Pedagogy / development specialist** | `mintzberg` | Management development, embedding change in practice | Sonnet |

One agent runs on Opus (Ohno) because operational diagnosis with root-cause discipline requires judgment. Three run on Sonnet because their tasks are framework-driven and throughput-oriented.

## Why this subset

The practice team is the operational core. Business improvement programs routinely fail not because the techniques are wrong but because the techniques are not embedded in daily practice. Ohno diagnoses and designs; Ford and Ma provide the scale and platform context respectively when the operation in question involves either; Mintzberg ensures the changes fit observed managerial work and provides the development pathway that turns one-shot improvements into durable capability.

The chair (Drucker) is not part of the workshop by default. This team runs on a standing delegation from the chair for operational work — Drucker sets the purpose, the practice team executes. For work where purpose needs to be actively framed or contested, route through the chair or use `business-analysis-team`.

## Orchestration flow

Unlike the analysis and workshop teams (parallel orchestration), the practice team runs as a sequential pipeline that mirrors how operational work actually unfolds.

```
Input: operational question or improvement program
        |
        v
+---------------------------+
| Ohno (Opus)               |  Phase 1: Diagnose
| Operations lead           |          - Go to the gemba (or the closest proxy)
+---------------------------+          - Identify wastes and root causes
        |                              - Produce BusinessAnalysis
        |
        v
+---------------------------+
| Ford or Ma (Sonnet)       |  Phase 2: Scale/platform context
| Scale or platform lens    |          - If scale or vertical integration
+---------------------------+            is a factor, Ford weighs in
        |                              - If platform dynamics are a factor,
        |                                Ma weighs in
        |                              - Often skipped if neither applies
        |
        v
+---------------------------+
| Ohno (Opus)               |  Phase 3: Design
| Construct the fix         |          - Pull-based flow, kanban, SMED, jidoka
+---------------------------+          - Produce BusinessConstruct
        |
        v
+---------------------------+
| Mintzberg (Sonnet)        |  Phase 4: Embed
| Development + pedagogy    |          - Will the change be executable given
+---------------------------+            observed managerial reality?
        |                              - What training, routines, and metrics
        |                                are needed to sustain it?
        |                              - Produce BusinessExplanation
        v
         Final response to user
         + BusinessSession Grove record
```

## Pipeline rules

The practice team follows strict pipeline rules because sequential operational work has different failure modes than parallel analysis.

### Rule 1 — Diagnosis before design

No design begins until the diagnosis is complete. A solution without a diagnosis is a symptom-level fix that will fail again. Ohno enforces this: if the diagnosis identifies root causes outside operational scope, the team halts and returns the finding rather than designing around the symptom.

### Rule 2 — Scale and platform lenses only when relevant

Ford and Ma are not invoked on every query. Ford is invoked when volume is high enough that scale economics dominate, or when vertical integration is a live question. Ma is invoked when the operation is a platform (marketplace, multi-sided, network-effects). For most operational queries, neither is invoked and the pipeline skips Phase 2.

### Rule 3 — Design must fit diagnosed reality

The BusinessConstruct produced in Phase 3 must address the root causes found in Phase 1. A construct that targets a different problem than the diagnosis is a sign that Phase 1 is incomplete and the pipeline should restart.

### Rule 4 — Embedding is not optional

A fix that is not embedded via training, routines, and metrics will not survive. Mintzberg's Phase 4 is required even for small changes. A team that skips embedding produces a temporary improvement that reverts to baseline within a quarter.

### Rule 5 — The pipeline is iterative

Unlike the analysis team, the practice team expects to be invoked repeatedly on the same operation over time. Each cycle improves the standard; each standard becomes the baseline for the next cycle. Kaizen is a pipeline, not a one-shot.

## Input contract

1. **Operational context** (required). The system, process, or operation to be improved.
2. **Observed symptom or goal** (optional). What the user wants to fix or achieve.
3. **Constraints** (optional). Budget, timeline, workforce, equipment.
4. **Prior BusinessSession hash** (optional). For continuing improvement programs.

## Output contract

### Primary output: Operational plan

A practice-oriented response that:

- States the diagnosis clearly, including root causes
- Describes the designed fix or flow
- Includes scale/platform context where relevant
- Specifies the training, routines, and metrics needed to embed the change
- Suggests the next cycle of improvement

### Grove record: BusinessSession (practice variant)

```yaml
type: BusinessSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original operational question>
session_kind: practice
classification:
  domain: operations
  decision_type: design
  stakeholder_scope: standard
  user_level: intermediate_or_advanced
agents_invoked:
  - ohno
  - ford          # if relevant
  - ma            # if relevant
  - mintzberg
work_products:
  - <grove hash of BusinessAnalysis — diagnosis>
  - <grove hash of BusinessConstruct — design>
  - <grove hash of BusinessExplanation — embedding>
concept_ids:
  - bus-business-structures
  - bus-business-planning
  - bus-cost-benefit-analysis
iteration: <integer, 1 if first cycle>
user_level: intermediate
```

## Escalation paths

### Internal escalations

- **Ohno finds root cause is organizational policy, not physics:** Hand off to Drucker (for purpose questions) or Mintzberg (for development questions). The practice team does not design around policy issues.
- **Ford finds the scale is wrong for the proposed flow:** Revise the flow to fit the scale, or revise the volume assumptions. Ford's scale veto overrides Ohno's flow design when they conflict.
- **Ma finds the platform operation has a cold-start problem that operational redesign cannot fix:** Hand off to Ma's bootstrap mode or escalate to the workshop team for strategic reframing.
- **Mintzberg finds the change is not executable by this organization:** Report honestly. Redesign toward something executable or hand off to the development work that would make it executable.

### External escalations

- **To business-workshop-team:** If the operational question turns out to have strategic dimensions the practice team cannot handle (pivot, market entry, disruption response), escalate.
- **To business-analysis-team:** If the operational question touches multiple domains (ethics, finance, legal) in addition to operations, escalate.
- **To Drucker alone:** If the operational question reveals a purpose ambiguity, escalate.

## Token / time cost

- **Ohno** — 2 Opus invocations (diagnose + design), ~40K tokens
- **Ford or Ma** — 1 Sonnet invocation when relevant, ~25K tokens (often skipped)
- **Mintzberg** — 1 Sonnet invocation, ~25K tokens
- **Total** — 80-120K tokens, 3-8 minutes wall-clock

The cheapest of the three teams, because the scope is narrow and parallelism is not used. Cost per cycle is low enough to justify repeated invocation as part of an ongoing improvement program.

## Configuration

```yaml
name: business-practice-team
lead: ohno
specialists:
  - scale: ford
  - platform: ma
pedagogy: mintzberg

parallel: false  # Sequential pipeline
timeout_minutes: 8

# Ford and Ma are only invoked when their domain is relevant
auto_skip_scale: true
auto_skip_platform: true
```

## Invocation

```
# Operational diagnosis
> business-practice-team: Our order-to-ship process has a 12 percent late
  delivery rate. Diagnose and design a fix.

# Flow redesign
> business-practice-team: We are launching a new product line. Design the
  assembly flow and the training plan for the operators.

# Platform operations
> business-practice-team: Our marketplace is losing suppliers. Diagnose the
  churn and design a retention program.

# Scale decision
> business-practice-team: We are hitting capacity in our main plant. Should
  we add a second shift, add a second line, or contract out the overflow?

# Ongoing improvement
> business-practice-team: (session: grove:abc123) Next cycle on the
  fulfillment-center pilot. Review progress and design the next
  improvement.
```

## Limitations

- The team does not handle strategic questions. Use the workshop or analysis teams for those.
- The team assumes a purpose has been set. If purpose is ambiguous, the team will produce a technically correct fix that may not serve the right goal.
- Ford and Ma are only invoked when their domain is live; for purely mid-scale non-platform operations, only Ohno and Mintzberg run.
- The sequential pipeline means this team is slower per invocation than an ad-hoc specialist call, but produces more durable results because of the embedding step.
- Practice team recommendations assume repeated invocation. A single cycle is rarely enough; the value accumulates over cycles.
