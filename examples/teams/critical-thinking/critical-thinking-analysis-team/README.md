---
name: critical-thinking-analysis-team
type: team
category: critical-thinking
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/critical-thinking/critical-thinking-analysis-team/README.md
description: Full Critical Thinking Department investigation team for multi-domain reasoning problems spanning argument analysis, bias detection, creative reframing, and decision support. Paul classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified response with a learning pathway from Lipman. Use for complex reasoning audits, ill-structured problems where the right frame is not yet clear, and high-stakes judgments benefiting from multiple evaluation lenses. Not for single-concept lookups, routine bias checks, or pure teaching requests.
superseded_by: null
---
# Critical Thinking Analysis Team

Full-department multi-method analysis team for reasoning problems that span argument structure, evidence quality, bias, creative framing, and decision support. Runs specialists in parallel and synthesizes their independent findings into a coherent response, analogous to how `math-investigation-team` and `rca-deep-team` run multiple analysis methods on their respective problems.

## When to use this team

- **Multi-lens reasoning audits** where a claim must be checked for structural validity, evidence quality, bias, and framing all at once.
- **Ill-structured problems** where the question itself is unclear and the domain is not obvious.
- **High-stakes judgments** (policy, hiring, investment, medical) where multiple independent lenses reduce error risk.
- **Complex editorials, position papers, or argumentative texts** that use a mix of logical, evidentiary, and rhetorical moves.
- **Teaching demonstrations** where students benefit from seeing multiple specialists apply different tools to the same material.
- **Full-department engagement** when the user does not know which specialist to invoke and Paul's classification is the right entry point.

## When NOT to use this team

- **Single-concept lookups** ("what is confirmation bias?") — use `lipman` directly.
- **Routine bias checks** on a simple judgment — use `tversky` directly.
- **Pure argument reconstruction** — use `critical-thinking-workshop-team` for depth on a single argument.
- **Pure creative generation** with no evaluation component — use `de-bono` directly.
- **Practice drills** on foundational techniques — use `critical-thinking-practice-team`.
- **Routine decisions** with no analysis need — the full team's token cost is substantial.

## Composition

The team runs all seven Critical Thinking Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `paul` | Classification, orchestration, synthesis, universal standards | Opus |
| **Structural analyst** | `elder` | Argument reconstruction, elements of reasoning, structural diagnosis | Opus |
| **Bias specialist** | `tversky` | Heuristics and biases detection, base rates, probability correction | Opus |
| **Dual-process diagnostician** | `kahneman-ct` | System 1 / System 2 diagnosis, mode-shift support | Sonnet |
| **Creative generator** | `de-bono` | Lateral thinking, reframings, option generation | Sonnet |
| **Reflective inquirer** | `dewey-ct` | Ill-structured problem framing, five-phase inquiry | Sonnet |
| **Pedagogy specialist** | `lipman` | Level-appropriate explanation, Socratic dialogue | Sonnet |

Three agents run on Opus (Paul, Elder, Tversky) because their tasks require deep reasoning: classification with universal standards, structural reconstruction of ambiguous text, and bias diagnosis requiring precise judgment. Four run on Sonnet because their tasks are well-bounded: mode diagnosis, option generation, inquiry framing, and pedagogical translation.

## Orchestration flow

```
Input: user query + optional user level + optional prior CriticalThinkingSession hash
        |
        v
+---------------------------+
| Paul (Opus)               |  Phase 1: Classify the query
| Chair / Router            |          - domain (argument/evidence/bias/creative/decision/multi)
+---------------------------+          - complexity (routine/challenging/ill-structured)
        |                              - type (evaluate/reconstruct/generate/diagnose/teach)
        |                              - user level (novice/developing/proficient/advanced)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Elder    Tversky  Kahneman-ct De-bono Dewey-ct  (Lipman
    (struct) (bias)   (mode)      (creat) (inquiry)  waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, each producing
             an independent Grove record in their own frame.
             Paul activates only the relevant subset, not
             all five on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Paul (Opus)               |  Phase 3: Synthesize
              | Merge specialist outputs  |          - apply universal standards
              +---------------------------+          - reconcile contradictions
                         |                           - rank by relevance
                         v
              +---------------------------+
              | Lipman (Sonnet)           |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest follow-up
                         v
              +---------------------------+
              | Paul (Opus)               |  Phase 5: Record
              | Produce session record    |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + CriticalThinkingSession Grove record
```

## Synthesis rules

Paul synthesizes the specialist outputs using these rules, analogous to the math-investigation-team synthesis protocol:

### Rule 1 — Converging findings are strengthened

When two or more specialists arrive at the same conclusion independently (e.g., Elder flags a hidden premise and Tversky flags confirmation bias in the same passage), mark the finding as high-confidence. Cross-specialist convergence is the strongest signal available.

### Rule 2 — Diverging findings are preserved and investigated

When specialists disagree, Paul does not force a reconciliation. Instead:

1. State both findings with attribution ("Elder reconstructs the argument as valid; Tversky flags the inference as bias-driven").
2. Check which finding operates at which level (structure vs. psychology can both be right).
3. If genuinely contradictory, escalate to Elder for structural adjudication.
4. Report the disagreement honestly to the user.

### Rule 3 — Structure before content

Before evaluating content claims, Elder's reconstruction must be in place. An argument cannot be checked for bias or evidence quality until its structure is explicit. Paul enforces this ordering in synthesis.

### Rule 4 — Creative reframings are offered, not forced

De Bono's reframings are additions to the option space, not replacements for the user's framing. Paul presents them as alternatives the user may consider, never as corrections.

### Rule 5 — User level governs presentation, not content

All specialist findings are included regardless of user level. Lipman adapts the presentation — simpler language, more scaffolding, worked examples for lower levels; concise technical writing for higher levels.

## Input contract

The team accepts:

1. **User query** (required). Natural language question, claim to analyze, reasoning task.
2. **User level** (optional). One of: `novice`, `developing`, `proficient`, `advanced`.
3. **Prior CriticalThinkingSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Shows the reasoning at appropriate depth
- Credits the specialists involved by name
- Passes the universal intellectual standards
- Notes any unresolved disagreements
- Suggests follow-up explorations

### Grove record: CriticalThinkingSession

```yaml
type: CriticalThinkingSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: ill-structured
  type: evaluate
  user_level: proficient
agents_invoked:
  - paul
  - elder
  - tversky
  - kahneman-ct
  - de-bono
  - dewey-ct
  - lipman
work_products:
  - <grove hash of CriticalThinkingAnalysis>
  - <grove hash of CriticalThinkingReview>
  - <grove hash of CriticalThinkingConstruct>
  - <grove hash of CriticalThinkingExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: proficient
```

## Escalation paths

### Internal escalations

- **Elder cannot reconstruct argument:** Report honestly, hand to Dewey-CT for problem framing.
- **Tversky finds bias Elder's structure does not explain:** Revisit the structure; bias may have shaped the framing itself.
- **Kahneman-CT diagnoses System 1 dominance:** Hand to Tversky for specific bias identification.
- **Dewey-CT inquiry surfaces new question:** Loop back to Paul for re-classification.

### External escalations (from other teams)

- **From workshop-team:** When a focused analysis reveals the problem is multi-domain, escalate to analysis-team.
- **From practice-team:** When a drill encounters a genuinely complex example that exceeds practice scope, escalate.

### Escalation to the user

- **Unresolvable disagreement:** When specialists genuinely disagree after cross-checking, report the disagreement honestly with all lenses visible.
- **Outside critical thinking:** Factual questions, normative ethics, domain expertise questions. Paul acknowledges the boundary and suggests appropriate resources.

## Token / time cost

Approximate cost per full analysis:

- **Paul** — 2 Opus invocations (classify + synthesize), ~35K tokens
- **Specialists in parallel** — 2 Opus (Elder, Tversky) + 3 Sonnet (Kahneman-ct, De-bono, Dewey-ct), ~25-55K tokens each
- **Lipman** — 1 Sonnet invocation, ~20K tokens
- **Total** — 180-350K tokens, 5-15 minutes wall-clock

This cost is justified for multi-lens audits and ill-structured problems. For single-concept or routine questions, use the specialist directly or a focused team.

## Configuration

```yaml
name: critical-thinking-analysis-team
chair: paul
specialists:
  - structure: elder
  - bias: tversky
  - mode: kahneman-ct
  - creative: de-bono
  - inquiry: dewey-ct
pedagogy: lipman

parallel: true
timeout_minutes: 15

# Paul may skip specialists whose domain is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full multi-lens audit
> critical-thinking-analysis-team: Audit this op-ed on education policy for
  argument structure, evidence quality, bias, and framing. Level: proficient.

# Ill-structured problem
> critical-thinking-analysis-team: I can't decide whether we should reorganize
  the team. I keep going back and forth. Help me think through it clearly.

# Follow-up
> critical-thinking-analysis-team: (session: grove:abc123) Now apply the same
  analysis to the opposing position.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (formal logic proof theory, mathematical decision theory, deep philosophical analysis) are handled at the closest available level.
- Parallel specialists do not communicate during Phase 2 — convergence is measured only at the synthesis level. This preserves independence but prevents real-time collaboration.
- The team does not have access to domain facts beyond what specialists' tools provide. Claims requiring external verification must be flagged for the user to resolve.
- Genuinely open philosophical questions may exhaust all specialists without resolution. The team reports this honestly rather than speculating.
