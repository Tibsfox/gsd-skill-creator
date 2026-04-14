---
name: economics-analysis-team
type: team
category: economics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/economics/economics-analysis-team/README.md
description: Full Economics Department investigation team for multi-domain problems spanning microeconomics, macroeconomics, trade, policy, behavioral economics, and development. Smith classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with balanced presentation of competing schools of thought. Use for research-level questions, graduate-level work requiring coordinated specialist input, policy evaluation requiring multiple perspectives, or any problem where the domain is not obvious and different economic frameworks may yield different insights. Not for routine computation, single-domain analysis, or introductory-level explanation.
superseded_by: null
---
# Economics Analysis Team

Full-department multi-perspective investigation team for economic problems that span domains or require the views of multiple schools of thought. Runs specialists in parallel and synthesizes their independent findings into a coherent response, preserving genuine disagreements rather than forcing false consensus.

## When to use this team

- **Multi-domain problems** spanning micro, macro, trade, policy, behavioral, and development -- where no single specialist covers the full scope.
- **Research-level questions** where the domain is not obvious and the problem may yield different insights from different economic frameworks.
- **Graduate-level work** requiring coordinated input from multiple specialists (e.g., a globalization question that needs trade theory from Smith, labor market analysis from Robinson, institutional perspective from Ostrom, and welfare analysis from Sen).
- **Policy evaluation** where balanced presentation of competing perspectives is essential (e.g., "should we adopt universal basic income?" requires Keynesian, Hayekian, and Ostromian analyses).
- **Novel problems** where the user does not know which specialist to invoke, and Smith's classification is the right entry point.
- **Cross-school synthesis** -- when understanding an economic issue requires seeing it through Keynesian, Austrian, institutionalist, and behavioral lenses simultaneously.

## When NOT to use this team

- **Simple computations** -- calculating elasticity, multipliers, or surplus. Use the appropriate specialist directly.
- **Single-domain questions** where the classification is obvious -- route to the specialist via Smith in single-agent mode.
- **Pure policy debate** with clear sides -- use policy-team instead.
- **Pure market analysis** -- use markets-team instead.
- **Beginner-level teaching** with no research component -- use varian directly.

## Composition

The team runs all seven Economics Department agents:

| Role | Agent | Domain | Model |
|------|-------|--------|-------|
| **Chair / Router** | `smith` | Classification, orchestration, synthesis | Opus |
| **Macro specialist** | `keynes` | Aggregate demand, fiscal policy, business cycle | Opus |
| **Institutional specialist** | `ostrom` | Commons governance, polycentric systems, collective action | Opus |
| **Development specialist** | `sen` | Capability approach, poverty, inequality, welfare | Sonnet |
| **Competition specialist** | `robinson` | Market structures, monopsony, imperfect competition | Sonnet |
| **Policy critic** | `hayek` | Knowledge problem, spontaneous order, limits of intervention | Sonnet |
| **Pedagogy specialist** | `varian` | Level-appropriate explanation, applied micro, technology markets | Sonnet |

Three agents run on Opus (Smith, Keynes, Ostrom) because their tasks require deep reasoning -- routing and synthesis, macroeconomic analysis across competing frameworks, and institutional analysis drawing on extensive fieldwork. Four run on Sonnet because their tasks are well-scoped within their domains.

## Orchestration flow

```
Input: user query + optional user level + optional prior EconomicsSession hash
        |
        v
+---------------------------+
| Smith (Opus)              |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity (routine/challenging/research-level)
        |                              - type (compute/analyze/explain/evaluate/debate)
        |                              - user level (beginner/intermediate/advanced/graduate)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Keynes   Ostrom    Sen     Robinson  Hayek   (Varian
    (macro)  (inst)   (dev)   (markets) (policy)  waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             problem but producing independent findings in
             their own framework. Each produces a Grove record.
             Smith activates only the relevant subset --
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Smith (Opus)              |  Phase 3: Synthesize
              | Merge specialist outputs  |          - preserve disagreements
              +---------------------------+          - rank by evidence quality
                         |                           - produce unified response
                         v
              +---------------------------+
              | Varian (Sonnet)           |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add real-world examples
                         |                           - suggest follow-up explorations
                         v
              +---------------------------+
              | Smith (Opus)              |  Phase 5: Record
              | Produce EconomicsSession |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + EconomicsSession Grove record
```

## Synthesis rules

Smith synthesizes the specialist outputs using these rules:

### Rule 1 -- Converging findings are strengthened

When two or more specialists arrive at the same conclusion from different frameworks (e.g., both Keynes and Ostrom agree that a public investment is needed, though for different reasons), mark the conclusion as high-confidence. Cross-framework convergence is the strongest signal available in economics.

### Rule 2 -- Genuine disagreements are preserved, not resolved

Economics has real schools of thought with incompatible premises. When Keynes and Hayek reach different conclusions about fiscal policy, Smith does not declare a winner. Instead:

1. State both conclusions with attribution and reasoning.
2. Identify the key assumption that drives the disagreement (e.g., whether the economy is at the zero lower bound, whether the government has relevant information).
3. Present the empirical evidence that bears on the disputed assumption.
4. Let the user evaluate the arguments.

This is fundamentally different from mathematical disagreement (where one side is wrong). In economics, both sides may be internally consistent; the disagreement is about which model better describes reality.

### Rule 3 -- Institutional context matters

When Ostrom identifies institutional factors that standard models ignore (community governance structures, local knowledge, social norms), these findings are elevated in the synthesis. Standard models that assume atomistic agents and complete markets often miss the institutional layer that determines whether a policy works in practice.

### Rule 4 -- Distribution is always reported

Sen's capability and distributional analysis is always included alongside efficiency analysis. A policy that maximizes total surplus but concentrates losses on vulnerable populations is presented with both the efficiency gain and the distributional cost. Economics analysis without distribution is incomplete.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Varian adapts the presentation -- simpler language, more examples, more scaffolding for lower levels; concise technical writing with mathematical notation for higher levels. The economic content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language economic question, problem, or request.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Smith infers from the query.
3. **Prior EconomicsSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Shows reasoning at the appropriate level of detail
- Credits the specialists involved
- Preserves genuine disagreements with clear labeling
- Reports distributional effects alongside efficiency effects
- Suggests follow-up explorations

### Grove record: EconomicsSession

```yaml
type: EconomicsSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: research-level
  type: evaluate
  user_level: graduate
agents_invoked:
  - smith
  - keynes
  - ostrom
  - sen
  - robinson
  - hayek
  - varian
work_products:
  - <grove hash of EconomicAnalysis>
  - <grove hash of PolicyBrief>
  - <grove hash of EconomicExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: graduate
```

Each specialist's output is also a standalone Grove record (EconomicAnalysis, EconomicModel, PolicyBrief, or EconomicExplanation) linked from the EconomicsSession.

## Escalation paths

### Internal escalations (within the team)

- **Keynes-Hayek disagreement on macro policy:** This is expected and productive. Smith presents both perspectives with their reasoning and the empirical evidence that bears on the dispute. Neither is escalated or overridden.
- **Robinson identifies market power that changes the policy analysis:** Re-route the revised analysis to the appropriate specialist. A problem that assumed competition but involves monopoly needs different policy recommendations.
- **Ostrom identifies institutional factors that standard models miss:** Elevate the institutional analysis. Models that ignore institutions often produce policies that fail in practice.
- **Sen identifies capability deprivation that efficiency analysis misses:** Ensure the distributional and capability analysis is included in the final synthesis.

### External escalations (from other teams)

- **From policy-team:** When a policy debate reveals multi-domain complexity beyond the policy team's scope, escalate to economics-analysis-team.
- **From markets-team:** When a market analysis reveals macro, institutional, or behavioral dimensions, escalate to economics-analysis-team.

### Escalation to the user

- **Genuinely contested empirical question:** When the specialists disagree and the evidence is genuinely ambiguous, report this honestly with the best available evidence.
- **Outside economics:** If the problem requires domain expertise outside economics (law, engineering, natural science), Smith acknowledges the boundary and suggests appropriate resources.

## Token / time cost

Approximate cost per investigation:

- **Smith** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Keynes, Ostrom) + 3 Sonnet (Sen, Robinson, Hayek), ~30-60K tokens each
- **Varian** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

This cost is justified for multi-domain and research-level problems. For single-domain or routine problems, use the specialist directly or a focused team.

## Configuration

```yaml
name: economics-analysis-team
chair: smith
specialists:
  - macro: keynes
  - institutions: ostrom
  - development: sen
  - markets: robinson
  - policy: hayek
pedagogy: varian

parallel: true
timeout_minutes: 15

# Smith may skip specialists whose domain is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full investigation
> economics-analysis-team: Analyze the economic effects of automation on
  employment, wages, and inequality across developed and developing countries.
  Level: graduate.

# Multi-domain problem
> economics-analysis-team: Why did the 2008 financial crisis happen? Give me
  the Keynesian, Austrian, and institutionalist perspectives, plus the
  distributional consequences.

# Follow-up
> economics-analysis-team: (session: grove:abc123) Now consider what policy
  responses would have been optimal under each framework.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (e.g., health economics, environmental economics, financial economics) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at the synthesis level. This preserves independence but prevents real-time debate.
- The team does not access external data sources beyond what each agent's tools provide.
- Genuinely contested empirical questions may remain unresolved. The team reports this honestly rather than imposing a false consensus.
