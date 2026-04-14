---
name: cloud-systems-workshop-team
type: team
category: cloud-systems
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/cloud-systems/cloud-systems-workshop-team/README.md
description: Focused four-agent architecture-review team for cloud systems design work. Pairs the chair (Lamport) with the storage architect (Ghemawat), the scale evaluator (Dean), and the pedagogy agent (Gray) for depth on a single design without the cost of the full analysis team. Use for storage architecture reviews, consensus protocol design, and capacity-sensitive systems where the cross-domain aspects are bounded. Not for pure operations or routine incidents.
superseded_by: null
---
# Cloud Systems Workshop Team

Focused four-agent team for depth on a single cloud-systems design problem. The workshop team pairs the chair with the storage architect, the scale evaluator, and the pedagogy agent — giving comprehensive review of architecture and scale without the overhead of the full analysis team. Analogous to `proof-workshop-team` in the math department.

## When to use this team

- **Storage architecture reviews** — when the design is primarily about data layout, replication, durability, and the scale-related trade-offs.
- **Consensus protocol work** — when a proposal touches Paxos/Raft selection, TLA+ specification, or replicated-log architecture.
- **Capacity-sensitive design** — when Dean's scale-first discipline is needed but Hamilton-cloud's economics and Vogels' service-architecture are not the primary concerns.
- **Formal specification review** — TLA+ or pseudocode that needs correctness and scale sanity-checking.
- **Post-incident architectural review** — after the practice team has triaged, when the incident reveals a design-level question that needs architectural reflection.

## When NOT to use this team

- **Multi-domain problems** spanning identity, networking, service architecture, or economics — use the full analysis team.
- **Routine operational questions** — use the practice team or a direct specialist.
- **Service boundary and API contract work** — Vogels is not on this team; use the analysis team or direct Vogels invocation.
- **Cost estimation** — Hamilton-cloud is not on this team; use the analysis team or direct invocation.
- **Pure pedagogy** — route to Gray directly.

## Composition

| Role | Agent | Method | Model |
|---|---|---|---|
| **Chair / Router** | `lamport` | Classification, orchestration, synthesis, consensus theory | Opus |
| **Storage architect** | `ghemawat` | Storage architecture, replication, durability | Opus |
| **Scale evaluator** | `dean` | Tail latency, capacity sizing, production patterns | Opus |
| **Pedagogy** | `gray` | Level-appropriate explanation, runbook discipline | Sonnet |

Three Opus agents (Lamport, Ghemawat, Dean) because the workshop is judgment-heavy: the whole point is to get deep, careful review of architecture and scale. One Sonnet agent (Gray) for the pedagogy wrap-up.

## Orchestration flow

```
Input: design document or specific question + optional user level
        |
        v
+---------------------------+
| Lamport (Opus)            |  Phase 1: Classify
| Scope the question        |          - which architectural questions are in scope?
+---------------------------+          - which parts are design review vs scale review?
        |
        +---------+---------+
        |         |         |
        v         v         v
    Ghemawat    Dean      (Gray
   (storage)   (scale)    waits)
        |         |
    Phase 2: Ghemawat produces or reviews the design; Dean evaluates
             it for scale. These can run in parallel or sequentially
             depending on dependency — typically parallel if Ghemawat
             has a complete design, sequential if Dean's scale
             parameters drive design choices.
        |         |
        +----+----+
             |
             v
  +---------------------------+
  | Lamport (Opus)            |  Phase 3: Synthesize
  | Integrate both views      |          - reconcile any tension
  +---------------------------+          - produce unified design/review
             |
             v
  +---------------------------+
  | Gray (Sonnet)             |  Phase 4: Pedagogy
  | Adapt to audience level   |          - level-appropriate framing
  +---------------------------+          - runbook extract if applicable
             |
             v
  +---------------------------+
  | Lamport (Opus)            |  Phase 5: Record
  | CloudSystemsReview record |          - Grove-addressable artifact
  +---------------------------+
             |
             v
       Final response
```

## Synthesis rules

### Rule 1 — Scale trumps elegance

When Dean identifies a scale-related issue (tail latency amplification, fan-out pathology, quadratic growth), that issue wins over an aesthetically cleaner design. Fix the scale issue first, then look for elegance.

### Rule 2 — Ghemawat's correctness is non-negotiable

If Ghemawat identifies a correctness issue (divergent replicas, missing recovery case, silent data loss), the design must address it before the team proceeds. Dean does not evaluate scale of an incorrect design.

### Rule 3 — Disagreements are explicit

When Ghemawat and Dean prefer different designs, Lamport preserves both positions and asks for refinement rather than picking. Usually the disagreement points to a missing constraint that needs to be made explicit.

### Rule 4 — Gray's pedagogy is always applied

Even for expert audiences, the Gray pass catches unclear framing, missing context, and unstated assumptions. The expert-audience version of the pedagogy pass is terse and highlights the trade-offs; it is not the same as "no pedagogy."

## Input contract

The team accepts:

1. **Design document or specific question** (required). Typically a design doc, an architectural diagram, or a specific question like "should we use Raft or Paxos for our metadata store."
2. **User level** (optional). Default: `advanced` for workshop-level work.
3. **Scale parameters** (recommended). QPS, node count, data volume, SLO — Dean will ask if missing.
4. **Prior CloudSystemsSession hash** (optional). For continuation.

## Output contract

### Primary output: CloudSystemsReview

```yaml
type: CloudSystemsReview
subject: <what was reviewed>
verdict: approve | approve_with_changes | reject | defer
strengths:
  - <architectural strengths from Ghemawat>
  - <scale strengths from Dean>
issues:
  - severity: critical | medium | minor
    source: ghemawat | dean | joint
    category: correctness | scale | durability | latency | operability
    description: <what is wrong>
    fix: <what to do>
recommendations:
  - <prioritized action items>
operational_notes:
  - <runbook-style notes from Gray>
pedagogy_notes:
  - <explanation of key trade-offs for the audience>
agents_involved:
  - lamport
  - ghemawat
  - dean
  - gray
agent: lamport (synthesis)
```

### Grove record: CloudSystemsSession

Same schema as the analysis team, with `agents_invoked` limited to the four workshop agents.

## Escalation paths

### Internal escalations (within the team)

- **Ghemawat vs Dean deadlock:** Lamport asks each to produce a minimal refinement that would make the other agree. Usually one pass suffices.
- **Missing scale data:** Dean halts and asks for numbers before continuing. The workshop does not produce output based on vibes.

### External escalations

- **Economics question emerges:** Escalate to the analysis team or direct Hamilton-cloud for cost evaluation.
- **Service architecture question emerges:** Escalate to the analysis team or direct Vogels.
- **Quorum-specific detail needed:** Escalate to direct DeCandia.
- **Operational issue uncovered:** Escalate to the practice team.

## Token / time cost

- **Lamport** — 2 Opus invocations, ~30K tokens
- **Ghemawat** — 1-2 Opus invocations (initial + refinement), ~40K tokens
- **Dean** — 1-2 Opus invocations, ~40K tokens
- **Gray** — 1 Sonnet pass, ~15K tokens
- **Total** — 125-175K tokens, 4-8 minutes wall-clock

About half the cost of the analysis team. Appropriate when the bounded focus matches the problem.

## Configuration

```yaml
name: cloud-systems-workshop-team
chair: lamport
specialists:
  - storage: ghemawat
  - scale: dean
pedagogy: gray

parallel: true  # typically Ghemawat and Dean in parallel
timeout_minutes: 10
```

## Invocation

```
# Review a storage design
> cloud-systems-workshop-team: Review this proposed object-store design.
  5x replication, consistent-hash ring, 3 DCs, 10 PB. [attached doc]

# Consensus protocol selection
> cloud-systems-workshop-team: Paxos vs Raft for our new metadata store.
  7 nodes, 3 DCs, 5K writes/sec. Give me a recommendation with rationale.

# Post-incident architectural review
> cloud-systems-workshop-team: This incident happened because of a replication
  edge case. Review the architecture and recommend design changes. [attached postmortem]
```

## Limitations

- No service-architecture (Vogels) input — questions about boundaries, contracts, or saga patterns are out of scope.
- No economics (Hamilton-cloud) input — cost implications are not analyzed.
- No quorum-specific (DeCandia) mechanics beyond what Ghemawat covers at the architectural level.
- Not appropriate for cross-domain incident analysis — use the analysis or practice teams.
