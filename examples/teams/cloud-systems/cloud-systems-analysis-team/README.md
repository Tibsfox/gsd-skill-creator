---
name: cloud-systems-analysis-team
type: team
category: cloud-systems
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/cloud-systems/cloud-systems-analysis-team/README.md
description: Full Cloud Systems Department investigation team for cross-domain problems spanning consensus, storage, networking, identity, service architecture, and reliability. Lamport classifies the query along four dimensions and activates relevant specialists (Dean, Ghemawat, Hamilton-cloud, Vogels, DeCandia) in parallel, then synthesizes their independent findings into a unified, level-appropriate response with a pedagogical pass from Gray. Use for design-level reviews, multi-domain incidents, or questions whose domain is unclear from the outset. Not for routine operational questions or single-specialty design work.
superseded_by: null
---
# Cloud Systems Analysis Team

Full-department cross-domain analysis team for cloud-systems problems that span multiple disciplines or resist easy classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response, analogous to `math-investigation-team` and `rca-deep-team`.

## When to use this team

- **Multi-domain problems** spanning consensus, storage, networking, identity, service architecture, and reliability — where no single specialist covers the full scope.
- **Design-level decisions** that will shape the architecture for years and benefit from independent review by multiple specialists.
- **Cross-cutting incidents** where the root cause may lie in any of several domains, and parallel hypotheses speed up triage.
- **Novel problems** where the user does not know which specialist to invoke, and Lamport's classification is the right entry point.
- **Architecture reviews** for new services, new regions, or major migrations — where the goal is to catch issues early before they become expensive.
- **Post-incident analysis** for complex outages that crossed service and infrastructure boundaries.

## When NOT to use this team

- **Routine operational questions** — use the relevant specialist directly via `lamport` in single-agent mode.
- **Single-domain design work** where the domain is clear — use the focused workshop team or a direct specialist.
- **Day-to-day incident response** — use the practice team's pipeline structure, not the full analysis team.
- **Beginner-level explanations** with no investigation component — route to `gray` directly.
- **Pure consensus theory or formal verification** — `lamport` handles these as a specialist, not as a team investigation.

## Composition

The team runs all seven Cloud Systems Department agents:

| Role | Agent | Method | Model |
|---|---|---|---|
| **Chair / Router** | `lamport` | Classification, orchestration, synthesis, consensus theory | Opus |
| **Scale specialist** | `dean` | Tail latency, capacity, production Paxos | Opus |
| **Storage specialist** | `ghemawat` | Storage architecture, replication, durability | Opus |
| **Economics specialist** | `hamilton-cloud` | Cost modeling, hardware selection, IAM economics | Sonnet |
| **Service architecture** | `vogels` | SOA, API contracts, eventual consistency | Sonnet |
| **Quorum specialist** | `decandia` | Dynamo-style KV, quorum tuning, conflict resolution | Sonnet |
| **Pedagogy specialist** | `gray` | Level-appropriate explanation, runbook discipline | Sonnet |

Three agents run on Opus (Lamport, Dean, Ghemawat) because their tasks require deep reasoning about correctness, scale, or architecture. Four run on Sonnet because their tasks are well-defined and more throughput-oriented.

## Orchestration flow

```
Input: user query + optional user level + optional prior CloudSystemsSession hash
        |
        v
+---------------------------+
| Lamport (Opus)            |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity (routine/challenging/design-level)
        |                              - type (analyze/design/review/explain/operate)
        |                              - user level (beginner/intermediate/advanced/expert)
        |                              - recommended agents (subset)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Dean  Ghemawat Hamilton Vogels DeCandia  (Gray
   (scale) (storage) (cost) (svc)  (quorum)  waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             problem but producing independent findings in
             their own framework. Each produces a Grove record.
             Lamport activates only the relevant subset —
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Lamport (Opus)            |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by confidence
                         |                           - produce unified response
                         v
              +---------------------------+
              | Gray (Sonnet)             |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning context
                         |                           - suggest follow-up
                         v
              +---------------------------+
              | Lamport (Opus)            |  Phase 5: Record
              | Produce CloudSystemsSession|         - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + CloudSystemsSession Grove record
```

## Synthesis rules

### Rule 1 — Converging findings are strengthened

When two or more specialists arrive at the same recommendation independently, mark it high-confidence. When Dean's scale analysis and Hamilton-cloud's cost analysis both say "use fewer, larger nodes," the joint recommendation is stronger than either alone.

### Rule 2 — Diverging findings are preserved and investigated

When specialists disagree (e.g., Ghemawat recommends replication but Hamilton-cloud says the cost is unacceptable), Lamport does not force reconciliation. Instead:

1. State both findings with attribution.
2. Re-delegate to the specialist whose position is less expected, for refinement.
3. If the disagreement persists, report honestly and surface the trade-off for the user to decide.

### Rule 3 — Correctness over economics

When Ghemawat or DeCandia identifies a correctness issue (data loss, split-brain, invariant violation) and Hamilton-cloud objects on cost grounds, correctness wins. A cheaper wrong answer is not an answer.

### Rule 4 — Operational fit is a veto

When Vogels identifies that the team cannot operate the proposed design ("no team owns this service"), the design is reject-with-changes regardless of its technical merit. Fix ownership first, then evaluate correctness.

### Rule 5 — User level governs presentation, not content

All specialist findings are included regardless of user level. Gray adapts the presentation — metaphors and scaffolding for lower levels, precision and edge cases for higher levels. The content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language problem or question.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `expert`. If omitted, Lamport infers.
3. **Prior CloudSystemsSession hash** (optional). Grove hash for follow-up continuity.
4. **Environment hints** (optional). Cloud platform, scale, team size, constraints.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Shows reasoning at the appropriate level of detail
- Credits the specialists involved by name
- Notes unresolved trade-offs, open questions, or disagreements
- Suggests follow-up explorations

### Grove record: CloudSystemsSession

```yaml
type: CloudSystemsSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: design-level
  type: design
  user_level: advanced
agents_invoked:
  - lamport
  - dean
  - ghemawat
  - hamilton-cloud
  - vogels
  - decandia
  - gray
work_products:
  - <grove hash of CloudSystemsAnalysis>
  - <grove hash of CloudSystemsDesign>
  - <grove hash of CloudSystemsExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: advanced
```

## Escalation paths

### Internal escalations

- **Ghemawat correctness vs Hamilton-cloud cost:** Correctness wins. Re-plan cost around the correct design.
- **Dean scale vs Vogels simplicity:** If Dean's scale concern is real, simplify the design in a different way. Do not ship a simple design that won't scale.
- **DeCandia quorum vs Ghemawat replication:** Coordinate on a unified storage model. Usually one is right about what the system actually needs; the other agrees after refinement.
- **Vogels ownership veto:** Hard stop. Resolve ownership before continuing.

### External escalations

- **From practice team:** When an operational incident reveals a design-level bug, escalate to analysis team for root cause review.
- **From workshop team:** When a focused design review uncovers cross-domain issues, escalate.

## Token / time cost

Approximate cost per investigation:

- **Lamport** — 2 Opus invocations (classify + synthesize), ~40K tokens
- **Specialists in parallel** — 2-3 Opus + 2-3 Sonnet, ~30-60K tokens each
- **Gray** — 1 Sonnet pedagogy pass, ~20K tokens
- **Total** — 200-400K tokens, 5-15 minutes wall-clock

This cost is justified for multi-domain and design-level problems. For routine or single-domain work, use a focused team or direct specialist.

## Configuration

```yaml
name: cloud-systems-analysis-team
chair: lamport
specialists:
  - scale: dean
  - storage: ghemawat
  - economics: hamilton-cloud
  - service-architecture: vogels
  - quorum: decandia
pedagogy: gray

parallel: true
timeout_minutes: 15
auto_skip: true
min_specialists: 2
```

## Invocation

```
# Full design review
> cloud-systems-analysis-team: Review our proposed multi-region metadata store.
  Requirements: 5 regions, 10K writes/sec, strong consistency, SLO 99.99%.

# Cross-domain incident analysis
> cloud-systems-analysis-team: We had a 4-hour outage yesterday that involved
  storage, networking, and auth. Here's the timeline. What happened structurally?

# Follow-up
> cloud-systems-analysis-team: (session: grove:abc123) Now adapt that design
  for a cost-constrained version at half the node count.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring hardware-level debugging, compiler analysis, or ML-model-specific tuning are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 — convergence is measured only at synthesis. This preserves independence but prevents real-time collaboration.
- The team does not have direct access to production systems. Analysis is based on descriptions and artifacts provided in the query.
- Design-level open problems may exhaust all specialists without resolution. The team reports this honestly rather than forcing a recommendation.
