---
name: nutrition-analysis-team
type: team
category: nutrition
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/nutrition/nutrition-analysis-team/README.md
description: Full Nutrition Department analysis team for multi-domain questions spanning biochemistry, policy, evidence critique, food systems, and pedagogy. Lind classifies the query, activates relevant specialists in parallel, then synthesizes their findings into a tier-labeled response that distinguishes settled from contested claims and surfaces industry funding and historical-transparency context where appropriate. Use for complex nutrition questions, contested claims requiring multiple perspectives, and queries where the domain is not obvious. Not for routine calorie counts, single-specialist questions, or clinical emergencies.
superseded_by: null
---
# Nutrition Analysis Team

Full-department multi-method analysis team for nutrition questions that span domains or that require explicit strength-of-evidence handling. Runs specialists in parallel and synthesizes their independent findings into a coherent, tier-labeled response.

## When to use this team

- **Multi-domain nutrition questions** spanning biochemistry, epidemiology, policy, food systems, and pedagogy — where no single specialist covers the full scope.
- **Contested-claim questions** where the right answer is a strength-of-evidence tier with multiple perspectives, not a single one-line answer.
- **Policy and guideline questions** that require both the underlying science (Keys or Atwater) and the policy analysis (Nestle).
- **Popular-nutrition claims** that originate in historical writing and require transparency treatment (Davis) alongside modern evidence.
- **Child nutrition questions with multiple dimensions** — e.g., a parent asking about a specific supplement for a specific child, which touches biochemistry, pedagogy, and contested claims all at once.
- **Cross-cutting questions** where a reader needs to understand both the food-system context (Pollan) and the scientific recommendation (Keys, Atwater).

## When NOT to use this team

- **Routine calorie or macronutrient computations** — use atwater directly. The analysis team's token cost is substantial.
- **Pure cardiovascular lipid questions** where the domain is obvious — use ancel-keys directly or the workshop team.
- **Clinical nutrition emergencies** — escalate to a medical provider, not the team.
- **Eating disorder treatment** — escalate to specialized clinical care, not the team.
- **Single-specialist questions** where Lind can route directly — use the routing rather than the full team.

## Composition

The team runs all seven Nutrition Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `lind` | Classification, orchestration, synthesis, tier labeling | Opus |
| **Cardiovascular specialist** | `ancel-keys` | Lipid metabolism, dietary-pattern epidemiology, cohort methodology | Opus |
| **Policy specialist** | `marion-nestle` | DGA process, industry influence, funding disclosure, federal programs | Opus |
| **Macronutrient specialist** | `atwater` | Energy balance, Atwater factors, reference intakes, food composition | Sonnet |
| **Historical specialist** | `adelle-davis` | Popular-nutrition writing history, replication failures, transparency treatment | Sonnet |
| **Food-system specialist** | `pollan` | Supply chain, food culture, ingredient-label reading, real-world translation | Sonnet |
| **Pedagogy specialist** | `satter` | Feeding relationships, Division of Responsibility, nutrition communication | Sonnet |

Three agents run on Opus (Lind, Keys, Nestle) because their tasks require judgment under ambiguity — classification and synthesis, contested-evidence interpretation, and policy-industry pattern analysis. Four run on Sonnet because their tasks are well-defined and framework-driven.

## Orchestration flow

```
Input: user query + optional learner level + optional prior NutritionSession hash
        |
        v
+---------------------------+
| Lind (Opus)               |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - evidence strength required
        |                              - type (assess/explain/compute/critique/advise)
        |                              - learner level
        |                              - recommended specialists
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
     Keys    Nestle   Atwater  Davis   Pollan  (Satter
     (CV)    (policy) (macro)  (hist)  (food)   waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, each producing a
             NutritionAnalysis, NutritionAssessment, NutritionReview,
             or NutritionExplanation record in their own framework.
             Lind activates only the relevant subset — not all 6
             are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Lind (Opus)               |  Phase 3: Synthesize
              | Merge specialist outputs  |          - apply tier labels
              +---------------------------+          - reconcile or preserve disagreement
                         |                           - produce unified response
                         v
              +---------------------------+
              | Satter (Sonnet)           |  Phase 4: Pedagogy wrap
              | Communication quality    |          - check for moralizing language
              +---------------------------+          - adapt for learner level
                         |                           - add child-appropriate framing if relevant
                         v
              +---------------------------+
              | Lind (Opus)               |  Phase 5: Record
              | Produce NutritionSession |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + NutritionSession Grove record
```

## Synthesis rules

### Rule 1 — Tier labels are mandatory

Every substantive claim in the synthesized response carries a strength-of-evidence tier: settled, strong, contested, weak, or not replicated. Lind enforces this discipline. A response that cannot be tier-labeled is flagged as "assessment pending" rather than delivered without a label.

### Rule 2 — Converging findings are strengthened

When two or more specialists reach the same conclusion from independent methodologies (e.g., Atwater's biochemistry and Keys's epidemiology both supporting a claim), Lind marks the result as high-confidence and upgrades the tier accordingly.

### Rule 3 — Diverging findings are preserved and investigated

When specialists disagree, Lind does not force reconciliation. Both findings are reported with attribution. If the disagreement persists after re-checking, the response carries both positions with their evidence bases and the user is told explicitly that the question is contested.

### Rule 4 — Funding context is included when a cited study is industry-funded

When the team cites a study whose funding creates the usual caveats, Nestle's funding disclosure check is included in the response. The study is not dismissed automatically but is contextualized.

### Rule 5 — Historical-transparency treatment is applied to popular-nutrition claims

When a claim originates in Davis-era popular nutrition writing or a similar tradition, the Davis agent's historical-transparency protocol is applied — contribution, replication status, and acknowledgment of documented harms.

### Rule 6 — Pedagogy pass-through when children are involved

When the user, the subject, or the audience includes a child, the response passes through Satter for communication-quality review and developmental framing before delivery.

### Rule 7 — Learner level governs presentation

All specialist findings are included regardless of learner level. Satter adapts the presentation — more scaffolding and concrete examples for beginners, more technical density for advanced and professional readers. The content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language nutrition question.
2. **Learner level** (optional). One of: `beginner`, `intermediate`, `advanced`, `professional`.
3. **Prior NutritionSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Labels claims with strength-of-evidence tiers
- Credits the specialists involved
- Notes unresolved disagreements honestly
- Surfaces industry funding when relevant
- Acknowledges historical-transparency context when relevant
- Suggests follow-up explorations

### Grove record: NutritionSession

```yaml
type: NutritionSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  evidence_strength: mixed
  type: critique
  learner_level: intermediate
agents_invoked:
  - lind
  - ancel-keys
  - marion-nestle
  - atwater
  - pollan
  - satter
work_products:
  - <grove hashes>
tier_labels_used: [strong, contested-but-plausible, not-replicated]
funding_flags: [<list>]
historical_transparency_applied: false
```

Each specialist's output is a standalone Grove record (NutritionAnalysis, NutritionAssessment, NutritionReview, or NutritionExplanation) linked from the NutritionSession.

## Escalation paths

### Internal escalations

- **Keys and Atwater disagree on a biochemistry question:** Re-check both. If Atwater's accounting contradicts a Keys claim, the accounting usually wins and Keys revises.
- **Nestle flags an industry-funded study that Keys was citing:** Both perspectives are preserved in the response; the user gets the study result and the funding context.
- **Davis historical-transparency conflicts with modern evidence base:** Davis acknowledges the historical record, Keys or Atwater provides the modern evidence, response carries both.
- **Satter raises a pedagogy concern about how a response will land:** Satter's revision is applied.

### External escalations

- **Clinical nutrition emergency:** Escalate to a medical provider.
- **Eating disorder concerns:** Escalate to specialized clinical care.
- **Food safety or contamination question:** Route out of the nutrition department to a food-safety resource.

## Token / time cost

Approximate cost per full investigation:

- **Lind** — 2 Opus invocations (classify + synthesize), ~40K tokens
- **Opus specialists** — Keys, Nestle, ~40-60K tokens each when invoked
- **Sonnet specialists** — Atwater, Davis, Pollan, Satter, ~20-40K tokens each when invoked
- **Total** — 150-400K tokens, 5-15 minutes wall-clock

Justified for multi-domain and contested questions. For single-domain routine questions, use the specialist directly via Lind's routing.

## Invocation

```
# Multi-domain question
> nutrition-analysis-team: My friend sent me an article claiming that saturated
  fat is actually fine and the dietary guidelines are wrong. Can you walk me
  through what the evidence actually says?

# Popular claim checking
> nutrition-analysis-team: My grandmother's old nutrition book says to take
  2000 IU of vitamin E daily for heart health. Should I?

# Child nutrition with multiple dimensions
> nutrition-analysis-team: My five-year-old refuses vegetables and my
  pediatrician mentioned a multivitamin. What should I think about?
```

## Limitations

- Limited to the seven agents' combined expertise. Questions requiring specialized sub-disciplines (clinical nutrition, sports nutrition, enteral feeding) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 — convergence is measured at synthesis. Preserves independence at the cost of real-time collaboration.
- The team does not access external databases beyond what individual agent tools provide.
- Research-level genuinely open questions may exhaust all specialists without resolution; the team reports this honestly rather than speculating.
