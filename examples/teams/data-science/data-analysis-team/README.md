---
name: data-analysis-team
type: team
category: data-science
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/data-science/data-analysis-team/README.md
description: Full Data Science Department investigation team for multi-domain problems spanning wrangling, modeling, visualization, experimentation, and ethics. Nightingale classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with a learning pathway from Cairo. Use for research-level questions, practitioner-level work requiring coordinated specialist input, or any problem where the domain is not obvious and different data science perspectives may yield different insights. Not for routine wrangling, single-model training, or pure visualization design.
superseded_by: null
---
# Data Analysis Team

Full-department multi-method investigation team for data science problems that span domains or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response.

## When to use this team

- **Multi-domain problems** spanning wrangling, modeling, visualization, experimentation, and ethics -- where no single specialist covers the full scope.
- **Research-level questions** where the domain is not obvious and the problem may yield different insights from different data science perspectives.
- **Practitioner-level work** requiring coordinated input from multiple specialists (e.g., a healthcare prediction problem that needs Tukey's profiling, Breiman's modeling, Fisher's experimental validation, and Benjamin's bias audit).
- **Novel problems** where the user does not know which specialist to invoke, and Nightingale's classification is the right entry point.
- **End-to-end analysis** -- when a project needs data wrangling, modeling, visualization, and ethical review as a coordinated workflow.
- **Audit and review** -- when existing work products need cross-specialist validation.

## When NOT to use this team

- **Simple data cleaning** -- use `tukey` directly. The investigation team's token cost is substantial.
- **Single-model training** where the algorithm and features are already decided -- use `breiman` directly.
- **Pure visualization design** -- use `tufte` directly.
- **A/B test design** with no modeling or ethics component -- use `fisher` directly.
- **Ethics-only audit** with no modeling or analysis component -- use `benjamin` directly.
- **Beginner-level teaching** with no research component -- use `cairo` directly.

## Composition

The team runs all seven Data Science Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `nightingale` | Classification, orchestration, synthesis | Opus |
| **EDA specialist** | `tukey` | Profiling, distributions, outliers, feature engineering | Opus |
| **ML specialist** | `breiman` | Algorithm selection, ensemble methods, model evaluation | Opus |
| **Visualization specialist** | `tufte` | Chart design, critique, dashboard architecture | Sonnet |
| **Experiment specialist** | `fisher` | A/B testing, power analysis, causal inference | Sonnet |
| **Ethics specialist** | `benjamin` | Bias audit, fairness metrics, privacy review | Sonnet |
| **Pedagogy specialist** | `cairo` | Level-appropriate explanation, learning pathways | Sonnet |

Three agents run on Opus (Nightingale, Tukey, Breiman) because their tasks require deep reasoning -- routing and synthesis, exploratory analysis, and complex model selection. Four run on Sonnet because their tasks are well-defined and computationally bounded.

## Orchestration flow

```
Input: user query + optional user level + optional prior DataSession hash
        |
        v
+---------------------------+
| Nightingale (Opus)        |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity (routine/challenging/research-level)
        |                              - type (compute/design/explain/explore/audit)
        |                              - user level (beginner/intermediate/advanced/practitioner)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
     Tukey    Breiman   Tufte    Fisher  Benjamin  (Cairo
     (EDA)    (ML)      (viz)   (expt)  (ethics)   waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             problem but producing independent findings in
             their own framework. Each produces a Grove record.
             Nightingale activates only the relevant subset --
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Nightingale (Opus)        |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by confidence
                         |                           - surface ethical concerns
                         v
              +---------------------------+
              | Cairo (Sonnet)            |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest follow-up explorations
                         v
              +---------------------------+
              | Nightingale (Opus)        |  Phase 5: Record
              | Produce DataSession      |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + DataSession Grove record
```

## Synthesis rules

Nightingale synthesizes the specialist outputs using these rules:

### Rule 1 -- Converging findings are strengthened

When two or more specialists arrive at the same result independently (e.g., Tukey's EDA reveals a feature's importance and Breiman's model confirms it as the top predictor), mark the result as high-confidence.

### Rule 2 -- Diverging findings are preserved and investigated

When specialists disagree, Nightingale does not force a reconciliation. Instead:

1. State both findings with attribution ("Tukey's profiling suggests outliers should be removed; Breiman's random forest performs better with them included").
2. Check for error: re-delegate to the specialist whose result is less expected.
3. If the disagreement persists, present both approaches with trade-offs.
4. Report the disagreement honestly to the user.

### Rule 3 -- Ethics over optimization

When Benjamin identifies a fairness concern that conflicts with a model's predictive performance, the ethical finding takes priority in the synthesis. A model that predicts well but discriminates is not an acceptable model. Nightingale presents the trade-off explicitly and recommends the path that satisfies both performance and fairness requirements.

### Rule 4 -- Exploration precedes modeling

Tukey's output is always produced before Breiman builds models. Modeling on unexamined data is modeling on assumptions. If Tukey flags data quality issues, those must be addressed before model training proceeds.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Cairo adapts the presentation -- simpler language, more scaffolding, worked examples for lower levels; concise technical writing for higher levels. The analytical content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language data science question, problem, or request.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `practitioner`. If omitted, Nightingale infers from the query.
3. **Prior DataSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Shows work at the appropriate level of detail
- Credits the specialists involved
- Surfaces ethical considerations (Benjamin's findings are always included when relevant)
- Notes any unresolved disagreements or limitations
- Suggests follow-up explorations

### Grove record: DataSession

```yaml
type: DataSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: research-level
  type: explore
  user_level: practitioner
agents_invoked:
  - nightingale
  - tukey
  - breiman
  - tufte
  - fisher
  - benjamin
  - cairo
work_products:
  - <grove hash of DataAnalysis>
  - <grove hash of DataModel>
  - <grove hash of DataVisualization>
  - <grove hash of DataExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: practitioner
```

## Escalation paths

### Internal escalations (within the team)

- **Tukey finds data quality issues, Breiman models anyway:** Tukey's findings take priority. Data quality must be addressed before modeling.
- **Breiman's model shows great performance, Benjamin finds disparate impact:** Benjamin's finding takes priority. The model must be modified or constrained.
- **Fisher recommends an experiment, but the user wants observational causal claims:** Fisher states the limitations honestly. Nightingale presents both the experimental gold standard and the observational alternative.

### External escalations (from other teams)

- **From modeling-team:** When a modeling task reveals it needs full exploratory analysis, ethics review, and visualization, escalate to data-analysis-team.
- **From visualization-team:** When a visualization project reveals underlying data quality or ethical issues, escalate to data-analysis-team.

### Escalation to the user

- **Irreconcilable ethical concerns:** If Benjamin identifies a serious issue that the user's constraints make unfixable, Nightingale communicates this directly.
- **Insufficient data:** If Tukey determines the data cannot support the intended analysis, Nightingale communicates this with recommendations for additional data collection.
- **Outside data science:** If the problem requires domain expertise outside data science, Nightingale acknowledges the boundary.

## Token / time cost

Approximate cost per investigation:

- **Nightingale** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Tukey, Breiman) + 3 Sonnet (Tufte, Fisher, Benjamin), ~30-60K tokens each
- **Cairo** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

This cost is justified for multi-domain and research-level problems. For single-domain or routine problems, use the specialist directly or a focused team.

## Configuration

```yaml
name: data-analysis-team
chair: nightingale
specialists:
  - eda: tukey
  - ml: breiman
  - visualization: tufte
  - experiment: fisher
  - ethics: benjamin
pedagogy: cairo

parallel: true
timeout_minutes: 15

# Nightingale may skip specialists whose domain is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full investigation
> data-analysis-team: We have customer transaction data and want to predict churn,
  build a dashboard for the business team, and ensure our model is fair across
  demographic groups. Level: practitioner.

# Multi-domain problem
> data-analysis-team: Our A/B test shows a 3% lift in conversion but the effect
  varies dramatically across customer segments. What's going on?

# Follow-up
> data-analysis-team: (session: grove:abc123) Now extend that analysis to include
  the European customer cohort.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (deep learning architecture design, bayesian nonparametrics) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at the synthesis level.
- The team does not access external computational resources beyond what each agent's tools provide.
- Ethics review depends on the protected attributes and use context being specified or inferable. Bias in dimensions the team cannot identify will go undetected.
