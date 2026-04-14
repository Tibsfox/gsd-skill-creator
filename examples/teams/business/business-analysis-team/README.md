---
name: business-analysis-team
type: team
category: business
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/business/business-analysis-team/README.md
description: Full Business Department investigation team for multi-domain business questions spanning strategy, operations, entrepreneurship, finance, law, and ethics. Drucker classifies the query along domain, decision-type, stakeholder-scope, and user-level dimensions and activates the relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with a learning pathway from Mintzberg. Use for research-level questions, executive-level decisions requiring coordinated specialist input, or any business problem where the domain is not obvious and different lenses may yield different insights. Not for routine computation, single-domain operational fixes, or pure teaching of a single concept.
superseded_by: null
---
# Business Analysis Team

Full-department multi-method investigation team for business problems that span domains or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response, analogous to how `math-investigation-team` runs multiple methods on a complex mathematical question and how `rca-deep-team` runs multiple methods on an incident.

## When to use this team

- **Multi-domain problems** spanning strategy, operations, finance, entrepreneurship, law, and ethics — where no single specialist covers the full scope.
- **Executive-level decisions** where the domain is not obvious and the problem may yield different insights from different business perspectives.
- **Research-level questions** that require coordinated input from multiple specialists (e.g., "should we pivot our platform strategy, and if so, what are the operational, financial, and stakeholder implications?").
- **Novel problems** where the user does not know which specialist to invoke, and Drucker's classification is the right entry point.
- **Cross-domain synthesis** — when understanding a business situation requires seeing it through multiple lenses (disruption framing via Christensen, operational reality via Ohno, stakeholder integration via Follett, platform dynamics via Ma).
- **Strategy review** — when a plan needs operational cross-checks, financial validation, ethical scrutiny, and pedagogical review simultaneously.

## When NOT to use this team

- **Single-concept questions** — use `mintzberg` directly for teaching, or the appropriate specialist for diagnosis.
- **Pure operational fixes** where the domain is clear — use `business-practice-team` or `ohno` directly.
- **Pure strategic workshop on one question** — use `business-workshop-team`.
- **Routine computations** (NPV, break-even, payback) — the investigation team's token cost is substantial.
- **Decisions where purpose is already settled and only execution remains** — route to execution specialists directly.

## Composition

The team runs all seven Business Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `drucker` | Classification, orchestration, synthesis, purpose framing | Opus |
| **Integration specialist** | `follett` | Stakeholder conflict integration, cross-functional coordination | Opus |
| **Operations specialist** | `ohno` | Waste diagnosis, pull-based flow design, root-cause analysis | Opus |
| **Scale specialist** | `ford` | High-volume production, economies of scale, vertical integration | Sonnet |
| **Platform specialist** | `ma` | Two-sided platforms, cold starts, network effects | Sonnet |
| **Disruption specialist** | `christensen` | Disruption theory, jobs-to-be-done, incumbent/entrant strategy | Sonnet |
| **Pedagogy specialist** | `mintzberg` | Level-appropriate explanation, strategy-as-practice, critique | Sonnet |

Three agents run on Opus (Drucker, Follett, Ohno) because their tasks require judgment under ambiguity. Four run on Sonnet because their tasks are well-defined and framework-driven.

## Orchestration flow

```
Input: user query + optional user level + optional prior BusinessSession hash
        |
        v
+---------------------------+
| Drucker (Opus)            |  Phase 1: Classify the query
| Chair / Router            |          - domain (strategy/ops/entr/fin/law/ethics)
+---------------------------+          - decision_type (diagnose/decide/design/review/explain)
        |                              - stakeholder_scope (narrow/standard/broad)
        |                              - user_level (beginner/intermediate/advanced/executive)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Follett   Ohno    Ford      Ma     Christensen (Mintzberg
    (integr)  (ops)   (scale) (platform) (disrupt)    waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             question but producing independent findings in
             their own framework. Each produces a Grove record.
             Drucker activates only the relevant subset —
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Drucker (Opus)            |  Phase 3: Synthesize
              | Merge specialist outputs  |          - surface the purpose question
              +---------------------------+          - reconcile contradictions
                         |                           - produce unified response
                         v
              +---------------------------+
              | Mintzberg (Sonnet)        |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - ground in observed practice
                         |                           - suggest follow-up explorations
                         v
              +---------------------------+
              | Drucker (Opus)            |  Phase 5: Record
              | Produce BusinessSession   |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + BusinessSession Grove record
```

## Synthesis rules

Drucker synthesizes specialist outputs using these rules, directly analogous to the `math-investigation-team` protocol:

### Rule 1 — Purpose before analysis

Before any specialist's recommendation is surfaced, Drucker asks "what is the firm's purpose here?" A recommendation that is technically correct but incompatible with stated purpose is flagged rather than endorsed. If the user did not state a purpose, Drucker infers the most probable one and names the inference.

### Rule 2 — Converging findings are strengthened

When two or more specialists arrive at the same recommendation independently (e.g., Christensen diagnoses a disruption threat AND Ohno confirms the operational cost structure that enables it), mark the finding as high-confidence. Cross-specialist convergence is the strongest signal available.

### Rule 3 — Diverging findings are preserved, not forced

When specialists disagree, Drucker does not force a reconciliation. Instead:

1. State both findings with attribution ("Christensen advises structural separation; Ford advises doubling down on the core scale advantage").
2. Expose the underlying assumption the disagreement turns on.
3. Return the decision to the user with both options visible and honestly weighted.

### Rule 4 — Stakeholder scope governs ethics weight

When stakeholder scope is broad, Follett's integration analysis is required regardless of domain. A strategy that ignores broad stakeholder impact is flagged as incomplete.

### Rule 5 — User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Mintzberg adapts the presentation — simpler language and scaffolding for lower levels, compressed decision-grade output for higher levels. The substance does not change; only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language business question, problem, or decision.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `executive`. If omitted, Drucker infers.
3. **Prior BusinessSession hash** (optional). Grove hash for follow-up queries.
4. **Constraints** (optional). Explicit constraints the response must respect.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Surfaces the purpose dimension before the analysis
- Shows work at the appropriate level of detail
- Credits specialists by name
- States trade-offs honestly, including stakeholder trade-offs
- Notes any unresolved disagreements or open questions
- Suggests follow-up explorations

### Grove record: BusinessSession

```yaml
type: BusinessSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  decision_type: decide
  stakeholder_scope: broad
  user_level: executive
agents_invoked:
  - drucker
  - follett
  - ohno
  - christensen
  - ma
  - mintzberg
work_products:
  - <grove hash of BusinessAnalysis>
  - <grove hash of BusinessConstruct>
  - <grove hash of BusinessReview>
  - <grove hash of BusinessExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: executive
```

Each specialist's output is also a standalone Grove record linked from the BusinessSession.

## Escalation paths

### Internal escalations

- **Follett finds integration impossible, Drucker needs a decision:** Report honestly. Integration failure does not stop the team — Drucker returns the decision to the user with the structural options named.
- **Christensen diagnoses disruption, Ford insists the scale advantage is still dominant:** The disagreement is itself the answer. Surface both.
- **Ohno finds root cause in organizational policy, not physics:** Re-route the policy question to the appropriate path (Drucker for purpose, Mintzberg for development).

### External escalations

- **From business-workshop-team:** When a focused workshop reveals the problem is actually multi-domain, escalate to business-analysis-team for the full treatment.
- **From business-practice-team:** When an operational problem turns out to have strategic or ethical dimensions, escalate.

### Escalation to the user

- **Decision without a right answer:** If the situation genuinely has no dominant option, report all viable options with their trade-offs and let the user choose. Do not invent a preferred answer to seem decisive.
- **Purpose ambiguity:** If the user has not stated a purpose and the decision is purpose-dependent, ask for purpose clarification before proceeding.
- **Outside business:** If the problem requires domain expertise outside business (technical architecture, legal drafting specifics, medical judgment), acknowledge the boundary and suggest appropriate resources.

## Token / time cost

Approximate cost per investigation:

- **Drucker** — 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** — 2 Opus (Follett, Ohno) + 3 Sonnet (Ford, Ma, Christensen), ~30-60K tokens each
- **Mintzberg** — 1 Sonnet invocation, ~20K tokens
- **Total** — 200-400K tokens, 5-15 minutes wall-clock

Justified for multi-domain and executive-level decisions. For single-domain or routine problems, use the specialist directly or a focused team.

## Configuration

```yaml
name: business-analysis-team
chair: drucker
specialists:
  - integration: follett
  - operations: ohno
  - scale: ford
  - platform: ma
  - disruption: christensen
pedagogy: mintzberg

parallel: true
timeout_minutes: 15

auto_skip: true  # Drucker may skip specialists whose domain is not relevant
min_specialists: 2  # Prevents trivial routing
```

## Invocation

```
# Full investigation
> business-analysis-team: We are a mid-sized manufacturer considering a
  platform pivot. We would move from selling equipment to selling equipment-
  as-a-service. Analyze the operational, financial, strategic, and
  stakeholder implications. Level: executive.

# Multi-domain decision
> business-analysis-team: Our competitor just announced a 30 percent price
  cut in our core segment. Is this disruption, and what should we do?

# Follow-up
> business-analysis-team: (session: grove:abc123) Now apply that analysis
  to our European subsidiary, which has different labor constraints.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (international tax, securities law specifics, industry-specific regulation) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 — convergence is measured only at the synthesis level. This preserves independence but prevents real-time collaboration.
- The team does not access external computational resources beyond what each agent's tools provide.
- Executive-level open questions may exhaust all specialists without resolution. The team reports this honestly rather than speculating.
