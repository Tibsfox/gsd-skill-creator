---
name: business-workshop-team
type: team
category: business
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/business/business-workshop-team/README.md
description: Focused Business Department team for deep-dive on a single strategic question. Pairs Drucker (chair and purpose framing) with Christensen (disruption and market entry), Follett (stakeholder integration), and Mintzberg (pedagogy and strategy-as-practice critique) to produce a thorough analysis of a specific strategic decision rather than a multi-domain scan. Use when the question is clearly strategic (pivot, entry, response to a threat, organizational redesign) and needs depth rather than breadth. Not for routine operational fixes, financial computations, or teaching a single concept.
superseded_by: null
---
# Business Workshop Team

Focused strategic workshop team for deep-dive on a single strategic question, analogous to `proof-workshop-team` in the math department. This team does not span the full business department — instead, it pairs the chair, the disruption lens, the stakeholder lens, and the pedagogy lens to produce a thorough treatment of one question.

## When to use this team

- **A specific strategic question** where breadth is less valuable than depth. Examples: "should we pivot?", "is this really a threat?", "how should we respond to this entrant?", "is our current strategy actually what we are doing?"
- **Pre-decision analysis** for a significant decision that will be made by an executive or board. The workshop produces the analysis that informs the decision.
- **Strategy review** of an existing plan — checking whether the plan makes sense, whether it is being executed, and whether the stakeholder analysis is adequate.
- **Market-entry or market-exit decisions** where the primary questions are about the customer job, the competitive response, and the stakeholder impact.
- **Response to a disruption threat** — where the primary work is characterizing the threat correctly and designing the structural response.

## When NOT to use this team

- **Multi-domain business problems** that touch operations, finance, platforms, and strategy — use `business-analysis-team` for the full treatment.
- **Operational fixes** where the question is about process waste or throughput — use `business-practice-team` or `ohno` directly.
- **Pure teaching** of a single concept — use `mintzberg` directly.
- **Financial computations** (NPV, IRR, break-even) — the workshop team is not the right tool.
- **Ethics diagnoses** without a strategic decision attached — use `drucker` + `follett` directly.

## Composition

The team runs four agents — the chair plus three specialists whose lenses are the core of strategic decision-making:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair** | `drucker` | Classification, purpose framing, synthesis | Opus |
| **Disruption specialist** | `christensen` | Jobs-to-be-done, disruption diagnosis, incumbent/entrant advice | Sonnet |
| **Integration specialist** | `follett` | Stakeholder analysis, conflict integration | Opus |
| **Pedagogy / critique specialist** | `mintzberg` | Strategy-as-practice critique, level-appropriate explanation | Sonnet |

Two agents run on Opus (Drucker, Follett) because their tasks require judgment under ambiguity. Two run on Sonnet because their tasks are framework-driven.

## Why this subset

The workshop team is the strategic core. Three questions are almost always on the table for a strategic decision:

1. **Is our reading of the market correct?** (Christensen — disruption test, jobs-to-be-done)
2. **Have we understood the stakeholder implications?** (Follett — integration analysis)
3. **Is this plan actually what we will do, and does it fit observed managerial reality?** (Mintzberg — strategy-as-practice critique)

The chair (Drucker) holds the purpose question — "what is this firm trying to become?" — which is the frame for the other three. Operations, finance, platforms, and vertical integration are not part of the workshop because they are about execution rather than strategic framing; they enter through the analysis team when breadth is needed.

## Orchestration flow

```
Input: user query + user level + strategic question
        |
        v
+---------------------------+
| Drucker (Opus)            |  Phase 1: Purpose framing
| Chair                     |          - Surface the purpose question
+---------------------------+          - Classify the specific strategic question
        |                              - Set the context for specialists
        |
        +-----------+-----------+
        |           |           |
        v           v           v
   Christensen   Follett    (Mintzberg
   (JTBD,        (stake-    waits for
   disruption)   holder     specialist
                 integr.)   output)
        |           |
    Phase 2: Parallel deep-dive
             on the same question from
             two complementary lenses.
             Christensen characterizes the
             market and competitive situation.
             Follett characterizes the
             stakeholder situation.
        |           |
        +-----------+
                |
                v
    +---------------------------+
    | Drucker (Opus)            |  Phase 3: Synthesize
    | Merge specialist outputs  |          - Reconcile market and stakeholder views
    +---------------------------+          - Surface trade-offs
                |                          - Return to purpose
                v
    +---------------------------+
    | Mintzberg (Sonnet)        |  Phase 4: Critique + pedagogy
    | Strategy-as-practice      |          - Is this plan actually executable?
    +---------------------------+          - Level-appropriate wrap
                |                          - Ground in observed practice
                v
    +---------------------------+
    | Drucker (Opus)            |  Phase 5: Record
    | BusinessSession           |          - Link work products
    +---------------------------+          - Emit Grove record
                |
                v
         Final response to user
         + BusinessSession Grove record
```

## Synthesis rules

The workshop team uses a simpler synthesis than the full analysis team because the scope is narrower and convergence is easier to check.

### Rule 1 — Purpose first

Drucker names the purpose before either specialist's output is surfaced. If the purpose is ambiguous, Drucker asks the user rather than guessing.

### Rule 2 — Market and stakeholder are both required

A strategic recommendation that is correct on market grounds but ignores stakeholder reality (or vice versa) is incomplete. The workshop always presents both.

### Rule 3 — Mintzberg's critique is not optional

Every strategic recommendation is run through the strategy-as-practice filter: will this actually be executed, given what we know about how this organization actually works? A plan that is right on the whiteboard and impossible in practice is worse than a plan that is less ambitious but achievable.

### Rule 4 — Honest trade-offs over false syntheses

If Christensen and Follett disagree (e.g., disruption theory says "separate the unit" and stakeholder analysis says "the separation will trigger a political crisis"), the workshop surfaces both and lets the user decide. False synthesis is worse than honest disagreement.

## Input contract

1. **Strategic question** (required). The specific decision or analysis the workshop will focus on.
2. **Context** (optional). Prior analysis, relevant documents, market intelligence.
3. **User level** (optional). Default: `executive`.
4. **Constraints** (optional). Non-negotiables the response must respect.

## Output contract

### Primary output: Strategic analysis

A focused response that:

- Names the purpose frame Drucker is operating in
- Characterizes the market situation via jobs-to-be-done and disruption tests
- Characterizes the stakeholder situation via integration analysis
- Surfaces the key trade-offs
- Includes Mintzberg's practice critique of whether the recommendation is executable
- Provides a recommendation with honest uncertainty

### Grove record: BusinessSession (workshop variant)

```yaml
type: BusinessSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original strategic question>
session_kind: workshop
classification:
  domain: strategy
  decision_type: decide
  stakeholder_scope: standard_or_broad
  user_level: executive
agents_invoked:
  - drucker
  - christensen
  - follett
  - mintzberg
work_products:
  - <grove hash of BusinessAnalysis — Christensen>
  - <grove hash of BusinessAnalysis — Follett>
  - <grove hash of BusinessReview — Mintzberg>
concept_ids:
  - bus-business-planning
  - bus-stakeholder-theory
user_level: executive
```

## Escalation paths

### Internal escalations

- **Christensen finds the threat is not disruption but a genuine head-to-head competitive threat:** Workshop continues, but the recommendation type changes from "structural separation" to "competitive response." Drucker notes the change explicitly.
- **Follett finds integration impossible:** Workshop surfaces the structural options (decision by authority, separation, arbitration) rather than manufacturing an integrative answer.
- **Mintzberg's critique reveals the recommendation is not executable by this organization:** Drucker returns this finding to the user as the top-line result — the recommendation may be correct in the abstract but wrong for this firm.

### External escalations

- **To business-analysis-team:** If the workshop reveals that the question is actually multi-domain (operational, financial, or platform dimensions that the workshop cannot handle), escalate to the full analysis team.
- **To business-practice-team:** If the workshop reveals that the "strategic" question is actually an operational one that does not need strategic analysis, hand off.
- **To Drucker alone:** If the workshop reveals that the question is really about purpose and needs one-on-one conversation rather than team output, hand back to the chair.

## Token / time cost

- **Drucker** — 2 Opus invocations (frame + synthesize), ~30K tokens
- **Christensen + Follett in parallel** — 1 Sonnet + 1 Opus, ~40-60K tokens each
- **Mintzberg** — 1 Sonnet invocation, ~20K tokens
- **Total** — 130-200K tokens, 4-10 minutes wall-clock

Roughly half the cost of the full analysis team, because the scope is narrower and fewer specialists are invoked.

## Configuration

```yaml
name: business-workshop-team
chair: drucker
specialists:
  - disruption: christensen
  - integration: follett
pedagogy: mintzberg

parallel: true
timeout_minutes: 10
min_specialists: 2  # Disruption and integration are both required
```

## Invocation

```
# Pivot question
> business-workshop-team: Should we pivot from a feature-seller model to a
  platform model? Our product has traction but growth is stalling.

# Response to a threat
> business-workshop-team: A new competitor is taking our small-business
  segment at 30 percent of our price. What should we do?

# Strategy review
> business-workshop-team: Review our Q1 strategic plan against what we are
  actually doing and the market situation.

# Market entry
> business-workshop-team: Evaluate whether to enter the European market with
  our current product or build a localized variant.
```

## Limitations

- The workshop team does not handle operational, financial, or platform-specific questions. If the strategic question depends on those dimensions, escalate to the full analysis team.
- The team's recommendation is analysis, not implementation. The executive still has to decide and the organization still has to execute.
- Parallel specialists do not communicate during Phase 2 — convergence is measured at the synthesis level.
- A strategic question whose answer is "it depends on purpose" cannot be resolved without user input on purpose.
