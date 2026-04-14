---
name: modeling-team
type: team
category: data-science
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/data-science/modeling-team/README.md
description: Focused modeling team for statistical and machine learning model construction, comparison, and validation. Breiman handles algorithm selection and ML pipelines, Tukey provides EDA and feature engineering, Fisher provides experimental design and statistical inference, and Cairo ensures findings are communicated clearly. Use for model building, model comparison, feature engineering, and statistical inference tasks that do not require full-department orchestration.
superseded_by: null
---
# Modeling Team

Focused team for statistical and machine learning model construction, comparison, and validation. Combines exploratory analysis, predictive modeling, experimental inference, and pedagogy without the overhead of the full department.

## When to use this team

- **Model building** where the algorithm, features, or approach are not yet decided and multiple perspectives would help.
- **Model comparison** between statistical and machine learning approaches -- the "two cultures" question.
- **Feature engineering** driven by exploratory analysis that feeds directly into model training.
- **Statistical inference** that benefits from both frequentist (Fisher) and predictive (Breiman) perspectives.
- **Experimental analysis** where the data comes from a designed experiment and needs both ANOVA (Fisher) and predictive modeling (Breiman).
- **Teaching moments** where the user wants to understand not just the model result but the reasoning behind model choice and evaluation.

## When NOT to use this team

- **Multi-domain problems** requiring visualization design, ethics audit, or full-department orchestration -- use `data-analysis-team`.
- **Pure visualization** -- use `tufte` directly.
- **Ethics-only audit** -- use `benjamin` directly.
- **Simple, well-defined model training** where algorithm and features are already decided -- use `breiman` directly.
- **Simple EDA** without modeling -- use `tukey` directly.

## Composition

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **ML specialist** | `breiman` | Algorithm selection, ensemble methods, cross-validation | Opus |
| **EDA specialist** | `tukey` | Profiling, distributions, feature engineering | Opus |
| **Experiment specialist** | `fisher` | ANOVA, experimental design, causal inference | Sonnet |
| **Pedagogy specialist** | `cairo` | Level-appropriate explanation, model interpretation | Sonnet |

Two Opus agents (Breiman, Tukey) handle the reasoning-intensive tasks -- model selection requires deep trade-off analysis, and EDA requires open-ended investigation. Two Sonnet agents (Fisher, Cairo) handle well-structured tasks -- ANOVA is procedural and pedagogy follows established patterns.

## Orchestration flow

The modeling team operates under Nightingale's coordination (Nightingale delegates to this team but does not participate as a specialist). The flow is sequential where dependencies exist:

```
Input: modeling task + dataset + optional constraints
        |
        v
+---------------------------+
| Tukey (Opus)              |  Phase 1: Explore
| EDA and feature eng.      |          - profile the data
+---------------------------+          - identify issues
        |                              - engineer candidate features
        |                              - produce DataAnalysis record
        |
        +--------+--------+
        |                 |
        v                 v
    Breiman (Opus)    Fisher (Sonnet)
    (ML pipeline)     (stat. inference)
        |                 |
    Phase 2: Model (parallel where independent)
        |     - Breiman: algorithm selection, training, evaluation
        |     - Fisher: ANOVA, hypothesis tests, causal analysis
        |
        +--------+--------+
                 |
                 v
      +---------------------------+
      | Cairo (Sonnet)            |  Phase 3: Explain
      | Interpret and communicate |          - translate findings
      +---------------------------+          - learning pathway
                 |
                 v
          DataModel + DataAnalysis + DataExplanation records
```

Tukey always runs first because modeling without exploration is modeling on assumptions. Breiman and Fisher then work in parallel -- Breiman builds the predictive model while Fisher runs the inferential analysis. Cairo wraps the findings for the target audience.

## Synthesis rules

### Rule 1 -- EDA informs modeling

Tukey's findings constrain Breiman's and Fisher's work. If Tukey identifies multicollinearity, Breiman should consider regularization. If Tukey finds non-normality, Fisher should use non-parametric alternatives. The EDA is not optional context -- it is binding input.

### Rule 2 -- Two cultures transparency

When Breiman's predictive model and Fisher's inferential model disagree (e.g., a variable is the top predictor in random forest but non-significant in regression), both findings are reported. The disagreement itself is informative -- it may indicate non-linear effects, interactions, or confounding that the linear model cannot capture.

### Rule 3 -- Interpretability is a feature

If the user needs to explain the model to stakeholders, regulators, or affected individuals, Breiman considers interpretability as a model selection criterion, not just prediction accuracy. Cairo ensures the final explanation matches the audience.

## Input contract

The team accepts:

1. **Modeling task** (required). What to model, what the target variable is, what metric to optimize.
2. **Dataset reference** (required). Path or table name.
3. **Constraints** (optional). Interpretability requirements, latency, fairness criteria.
4. **User level** (optional). For Cairo's explanation calibration.

## Output contract

### Primary output

A unified report containing:

- Tukey's data profile and feature engineering recommendations
- Breiman's model specification, cross-validated performance, and feature importance
- Fisher's inferential results (if applicable) with confidence intervals and effect sizes
- Cairo's level-appropriate explanation of the findings

### Grove records

- `DataAnalysis` -- Tukey's profiling and feature engineering findings
- `DataModel` -- Breiman's model specification and evaluation
- `DataExplanation` -- Cairo's accessible narrative

## Configuration

```yaml
name: modeling-team
specialists:
  - ml: breiman
  - eda: tukey
  - experiment: fisher
pedagogy: cairo

parallel: false  # Tukey must run before Breiman and Fisher
timeout_minutes: 10

min_specialists: 2
```

## Invocation

```
# Model building
> modeling-team: Build the best model for predicting hospital readmission.
  Dataset: readmissions.csv. Target: readmitted_30day. Optimize F1.

# Model comparison
> modeling-team: Compare logistic regression and gradient boosting for this
  credit default prediction task. I need to explain the model to regulators.

# Feature engineering + modeling
> modeling-team: The raw features are not predictive enough. Investigate the
  data and engineer features that improve churn prediction.

# Statistical inference + prediction
> modeling-team: We ran a 3-arm clinical trial. Analyze for both treatment
  effects (ANOVA) and predictive modeling of patient response.
```

## Limitations

- No visualization specialist -- if the output needs polished charts, route to Tufte separately or escalate to data-analysis-team.
- No ethics specialist -- if the model affects protected groups, route to Benjamin separately or escalate to data-analysis-team.
- Sequential dependency on Tukey means the team cannot start modeling until EDA is complete.
