---
name: stats-analysis-team
type: team
category: statistics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/statistics/stats-analysis-team/README.md
description: Full Statistics Department investigation team for multi-domain problems spanning descriptive analysis, inference, modeling, Bayesian reasoning, and computational methods. Pearson classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with pedagogical framing from George. Use for research-level questions, graduate-level work requiring coordinated specialist input, or any statistical problem where the domain is not obvious and different perspectives may yield different insights. Not for routine tests, pure computation, or single-method queries.
superseded_by: null
---
# Stats Analysis Team

Full-department multi-method investigation team for statistical problems that span domains or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response.

## When to use this team

- **Multi-domain problems** spanning inference, modeling, Bayesian analysis, and computational methods -- where no single specialist covers the full scope.
- **Research-level questions** where the domain is not obvious and the problem may yield different insights from different statistical perspectives.
- **Graduate-level work** requiring coordinated input from multiple specialists (e.g., a problem that needs Gosset's test design, Box's model diagnostics, and Efron's bootstrap verification).
- **Comprehensive analyses** where the user wants descriptive summaries, inferential tests, model building, and communication of results as a complete package.
- **Methodological comparisons** -- when understanding a problem requires seeing it through both frequentist and Bayesian lenses, or both parametric and computational approaches.

## When NOT to use this team

- **Routine hypothesis tests** -- use `gosset` or `pearson` directly. The investigation team's token cost is substantial.
- **Pure Bayesian analysis** where the method is clear -- use `bayes` directly.
- **Pure computation** (bootstrap, simulation) -- use `efron` directly.
- **Simple explanation requests** with no analysis component -- use `george` directly.
- **Single-domain problems** where the classification is obvious -- route to the specialist via `pearson` in single-agent mode.

## Composition

The team runs all seven Statistics Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `pearson` | Classification, orchestration, synthesis | Opus |
| **Probabilistic reasoning** | `bayes` | Bayesian inference, prior-to-posterior updating | Opus |
| **Experimental statistics** | `gosset` | t-tests, small-sample inference, experimental design | Sonnet |
| **Modeling / Diagnostics** | `box` | Regression, model building, diagnostics, time series | Opus |
| **Computational statistics** | `efron` | Bootstrap, permutation, simulation, cross-validation | Sonnet |
| **Communication** | `wasserstein` | Result interpretation, audience adaptation, p-value reform | Sonnet |
| **Pedagogy** | `george` | Level-appropriate explanation, active learning | Sonnet |

Three agents run on Opus (Pearson, Bayes, Box) because their tasks require deep reasoning. Four run on Sonnet because their tasks are well-defined and computationally bounded.

## Orchestration flow

```
Input: user query + optional user level + optional prior StatisticsSession hash
        |
        v
+---------------------------+
| Pearson (Opus)            |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity (routine/challenging/research-level)
        |                              - type (compute/test/model/explain/design/interpret/verify)
        |                              - user level (beginner/intermediate/advanced/graduate)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
     Bayes    Gosset    Box     Efron  (Wasserstein  (George
    (prob)   (exper)  (model)  (comp)    waits)       waits)
        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             problem but producing independent findings in
             their own framework. Each produces a Grove record.
             Pearson activates only the relevant subset --
             not all 4 are invoked on every query.
        |        |        |        |
        +--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Pearson (Opus)            |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by confidence
                         |                           - produce unified response
                         v
              +---------------------------+
              | Wasserstein (Sonnet)      |  Phase 4: Communication wrap
              | Audience-appropriate      |          - adapt to target audience
              +---------------------------+          - add effect sizes and intervals
                         |                           - frame caveats honestly
                         v
              +---------------------------+
              | George (Sonnet)           |  Phase 5: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest follow-up explorations
                         v
              +---------------------------+
              | Pearson (Opus)            |  Phase 6: Record
              | Produce StatisticsSession |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + StatisticsSession Grove record
```

## Synthesis rules

### Rule 1 -- Converging findings are strengthened

When frequentist inference (Gosset) and Bayesian analysis (Bayes) agree on the direction and magnitude of an effect, mark the result as high-confidence. Cross-paradigm convergence is the strongest signal available.

### Rule 2 -- Diverging findings are preserved and investigated

When specialists disagree (e.g., p-value says significant but Bayes factor is inconclusive), Pearson does not force a reconciliation. Instead:

1. State both findings with attribution.
2. Explain why they might diverge (e.g., prior sensitivity, different assumptions).
3. Report the disagreement honestly to the user.

### Rule 3 -- Model diagnostics gate model results

When Box identifies assumption violations in a model, the model's inferential results are flagged. Efron's computational methods (bootstrap, permutation) may provide assumption-free alternatives. Report both.

### Rule 4 -- Communication standards always apply

Wasserstein's communication review is mandatory for all team outputs. No result leaves the team without effect sizes, confidence/credible intervals, and honest caveats.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included regardless of user level. George adapts the presentation. The statistical content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language statistical question, problem, or request.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Pearson infers.
3. **Prior StatisticsSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Shows work at the appropriate level of detail
- Credits the specialists involved
- Includes effect sizes and confidence/credible intervals
- Notes any unresolved disagreements between frequentist and Bayesian analyses
- Suggests follow-up explorations

### Grove record: StatisticsSession

```yaml
type: StatisticsSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: research-level
  type: model
  user_level: graduate
agents_invoked:
  - pearson
  - bayes
  - gosset
  - box
  - efron
  - wasserstein
  - george
work_products:
  - <grove hash of StatisticalAnalysis>
  - <grove hash of StatisticalModel>
  - <grove hash of StatisticalExplanation>
  - <grove hash of DataReport>
concept_ids:
  - <relevant college concept IDs>
user_level: graduate
```

## Escalation paths

### Internal escalations

- **Frequentist-Bayesian disagreement:** Report both perspectives with attribution. Explain the source of disagreement (prior sensitivity, different loss functions, etc.).
- **Model assumption violations:** Box flags the problem; Efron provides computational alternatives; Gosset provides nonparametric alternatives.
- **Communication ambiguity:** Wasserstein escalates to Pearson when the target audience is unclear.

### External escalations

- **From consulting-team:** When a consulting problem reveals multi-domain complexity beyond four agents.
- **From methods-team:** When a methodological comparison requires the full department's perspective.

### Escalation to the user

- **Genuinely ambiguous results:** When the data do not support a clear conclusion, report this honestly.
- **Outside statistics:** When the problem requires domain expertise outside statistics (e.g., causal inference requiring domain-specific DAGs), Pearson acknowledges the boundary.

## Token / time cost

Approximate cost per investigation:

- **Pearson** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Bayes, Box) + 2 Sonnet (Gosset, Efron), ~30-60K tokens each
- **Wasserstein + George** -- 2 Sonnet invocations, ~20K tokens each
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

## Configuration

```yaml
name: stats-analysis-team
chair: pearson
specialists:
  - probabilistic: bayes
  - experimental: gosset
  - modeling: box
  - computational: efron
communication: wasserstein
pedagogy: george

parallel: true
timeout_minutes: 15
auto_skip: true
min_specialists: 2
```

## Invocation

```
# Full investigation
> stats-analysis-team: Analyze this clinical trial dataset. Compare treatment and
  control groups, build a predictive model, and present results for clinicians.
  Level: advanced.

# Multi-paradigm analysis
> stats-analysis-team: Is there evidence that this new teaching method improves
  test scores? Give me both frequentist and Bayesian perspectives.

# Follow-up
> stats-analysis-team: (session: grove:abc123) Now control for socioeconomic
  status and re-analyze.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Highly specialized methods (spatial statistics, survival analysis, causal inference with DAGs) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2.
- Research-level open methodological questions may not have definitive answers. The team reports the state of the debate honestly.
