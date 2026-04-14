---
name: methods-team
type: team
category: statistics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/statistics/methods-team/README.md
description: Four-agent methodological comparison team for exploring how different statistical methods handle the same problem. Bayes provides the Bayesian perspective, Efron provides computational approaches, Box provides modeling and diagnostics, and George explains the tradeoffs. Use for frequentist-vs-Bayesian comparisons, parametric-vs-computational method evaluation, methodological exploration for research, and teaching statistical methodology. Not for routine applied analysis, study design, or communication-only tasks.
superseded_by: null
---
# Methods Team

A focused four-agent team for methodological comparison and exploration. Runs the same problem through different statistical paradigms (Bayesian, frequentist-computational, model-based) and synthesizes the comparison for understanding and method selection.

## When to use this team

- **Frequentist vs. Bayesian comparison** -- "what does a Bayesian analysis of this data tell us that a t-test doesn't?"
- **Parametric vs. computational evaluation** -- "is the bootstrap confidence interval meaningfully different from the formula-based one?"
- **Methodological exploration for research** -- developing or evaluating new methods, comparing estimators, studying robustness.
- **Teaching statistical methodology** -- showing students why different methods exist and when each is appropriate.
- **Sensitivity analysis** -- running the same analysis under different assumptions or methods to see how robust the conclusions are.

## When NOT to use this team

- **Routine applied analysis** where the method is clear -- use `consulting-team`.
- **Study design** -- use `consulting-team` or `gosset` directly.
- **Communication-only tasks** -- use `wasserstein` directly.
- **Full-department investigation** -- use `stats-analysis-team` for the seven-agent treatment.
- **Single-method computation** -- use the appropriate specialist directly.

## Composition

Four agents, with Bayes and Box providing the two main analytical perspectives:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Bayesian perspective** | `bayes` | Prior-to-posterior updating, Bayes factors, hierarchical models | Opus |
| **Computational perspective** | `efron` | Bootstrap, permutation tests, simulation, cross-validation | Sonnet |
| **Model-based perspective** | `box` | Regression, diagnostics, model comparison (AIC/BIC) | Opus |
| **Pedagogy / Comparison synthesis** | `george` | Explain the tradeoffs, build understanding | Sonnet |

Two Opus agents (Bayes, Box) because their paradigmatic reasoning requires deep analysis. Two Sonnet agents (Efron, George) because computation and explanation are well-bounded.

## Orchestration flow

```
Input: problem + data + comparison request
        |
        v
+---------------------------+
| Box (Opus)                |  Phase 1: Frame the comparison
| Identify the methods to   |          - what methods apply?
| compare and why            |          - what assumptions differ?
+---------------------------+          - what would we learn from comparing?
        |
        +------- parallel --------+-----------------------+
        |                         |                       |
        v                         v                       v
+------------------+   +------------------+   +------------------+
| Bayes (Opus)     |   | Efron (Sonnet)   |   | Box (Opus)       |
| Bayesian         |   | Computational    |   | Model-based      |
| analysis         |   | analysis         |   | analysis         |
| - prior/post     |   | - bootstrap      |   | - fit + diagnose |
| - credible int   |   | - permutation    |   | - AIC/BIC        |
| - Bayes factor   |   | - cross-val      |   | - residuals      |
+------------------+   +------------------+   +------------------+
        |                         |                       |
        +------------+------------+-----------+-----------+
                     |
                     v
+---------------------------+
| George (Sonnet)           |  Phase 4: Compare and explain
| Synthesize the comparison |          - where do methods agree?
+---------------------------+          - where do they diverge? why?
                     |                 - what does each method assume?
                     |                 - which is most appropriate and why?
                     v
              StatisticalExplanation + individual records
              Grove records
```

## Comparison protocol

### Phase 1 -- Framing (Box)

Box identifies:

1. **The competing methods.** Which frequentist, Bayesian, and computational methods are applicable?
2. **The assumptions of each.** What does each method assume about the data, the model, and the parameters?
3. **The comparison criteria.** Under what conditions would the methods disagree? What would a disagreement reveal?
4. **The expected insights.** What will we learn from this comparison that a single-method analysis would miss?

### Phase 2 -- Parallel analysis (Bayes, Efron, Box)

All three analysts receive the same problem and data. Each works independently:

**Bayes:** Full Bayesian analysis with explicit prior specification, posterior computation, and Bayes factor (if applicable). Reports prior sensitivity analysis.

**Efron:** Computational analysis -- bootstrap CIs, permutation test (if applicable), simulation-based power or coverage study. Reports computational diagnostics (ESS, convergence, seed).

**Box:** Model-based analysis -- regression or GLM fit, model diagnostics, AIC/BIC comparison of candidate models. Reports diagnostic checklist results.

### Phase 3 -- Comparison synthesis (George)

George compares the three analyses:

1. **Agreement:** Where do all three agree? These conclusions are robust to methodological choice.
2. **Divergence:** Where do they diverge? George explains why:
   - Different priors (Bayesian) vs. different assumptions (frequentist) vs. different computation (bootstrap).
   - Prior sensitivity: if the Bayesian result is sensitive to the prior, the data may be uninformative.
   - Diagnostic findings: if Box found assumption violations, the formula-based method may be unreliable while the bootstrap remains valid.
3. **Recommendations:** Which method is most appropriate for this specific problem and why?
4. **What we learned:** What does the comparison teach about the problem that no single method reveals?

## Input contract

The team accepts:

1. **Problem and data** (required). A statistical problem with data (or sufficient summaries).
2. **Comparison request** (required). What methods to compare, or "compare all applicable approaches."
3. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`.
4. **Focus** (optional). Specific aspect of the comparison to emphasize (e.g., "I care most about robustness," "I need to justify my method choice in a journal submission").

## Output contract

### Primary output: Methodological comparison

A structured comparison that:

- Summarizes what each method found
- Highlights agreements and divergences
- Explains the source of any disagreements
- Recommends the most appropriate method with justification
- Includes a comparison table for quick reference

### Grove records

- **StatisticalExplanation:** The comparison synthesis from George.
- **StatisticalModel:** Box's model-based analysis.
- **StatisticalAnalysis:** Efron's computational analysis and/or Bayes' Bayesian analysis.

## Escalation paths

- **Problem needs experimental design:** Add `gosset` or escalate to `consulting-team`.
- **Results need client communication:** Add `wasserstein` or escalate to `stats-analysis-team`.
- **Problem is beyond statistics:** Acknowledge the boundary honestly.

## Token / time cost

- **Box** -- 2 Opus invocations (frame + model), ~40-60K tokens
- **Bayes** -- 1 Opus invocation, ~30-50K tokens
- **Efron** -- 1 Sonnet invocation, ~20-30K tokens
- **George** -- 1 Sonnet invocation, ~20-30K tokens
- **Total** -- 110-170K tokens, 3-8 minutes wall-clock

## Configuration

```yaml
name: methods-team
framing_lead: box
perspectives:
  - bayesian: bayes
  - computational: efron
  - model_based: box
synthesis: george

parallel: true
timeout_minutes: 10
```

## Invocation

```
# Frequentist vs. Bayesian
> methods-team: I have a sample of 15 measurements (mean=52.3, SD=8.1). Compare
  a one-sample t-test against a Bayesian analysis with a weakly informative prior.
  Level: graduate.

# Bootstrap vs. formula
> methods-team: Compare the formula-based 95% CI for the median with the BCa
  bootstrap CI. Data: [list]. Which should I trust more?

# Method selection for publication
> methods-team: I'm writing a paper analyzing count data with overdispersion.
  Compare Poisson regression, negative binomial regression, and a Bayesian
  hierarchical model. Focus: robustness. Level: graduate.

# Teaching methodology
> methods-team: Show an intermediate student why the same dataset can give
  different answers under frequentist vs. Bayesian analysis. Level: intermediate.
```

## Limitations

- The team does not design experiments or handle client communication. For those, use `consulting-team` or add specialists ad hoc.
- The comparison is only as good as the individual analyses. If Bayes uses a poor prior or Box chooses the wrong model family, the comparison reflects that.
- Three perspectives (Bayesian, computational, model-based) cover the major paradigms but do not include every possible method (e.g., exact tests, nonparametric regression, semiparametric methods are handled at the level of generality available).
