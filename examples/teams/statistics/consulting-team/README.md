---
name: consulting-team
type: team
category: statistics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/statistics/consulting-team/README.md
description: Four-agent statistical consulting team for applied problems where a client needs help with study design, analysis, and interpretation. Box leads with model building and diagnostics, Pearson classifies and synthesizes, Gosset handles experimental design and testing, and George translates results into client-accessible language. Use for applied data analysis, study design consultation, result interpretation for non-statisticians, and iterative model building with client feedback. Not for purely theoretical questions, large-scale computation, or Bayesian-specific analysis.
superseded_by: null
---
# Consulting Team

A focused four-agent team for applied statistical consulting. Box leads the modeling; Pearson manages the client relationship; Gosset designs experiments and runs tests; George makes the results accessible. This team mirrors the `proof-workshop-team` pattern: a focused expertise team optimized for a specific class of problem rather than broad investigation.

## When to use this team

- **Applied data analysis** -- a client has data and needs help analyzing it. The focus is on producing actionable results, not exploring methodology.
- **Study design consultation** -- "how should I collect data to answer this question?" Design, power analysis, and randomization planning.
- **Result interpretation** -- translating completed analyses into language that non-statisticians can act on.
- **Iterative model building** -- back-and-forth with a client to build, diagnose, revise, and finalize a statistical model.
- **Quality improvement** -- process control, response surface optimization, designed experiments for manufacturing or service improvement.

## When NOT to use this team

- **Purely theoretical questions** -- use `bayes` or `pearson` directly.
- **Large-scale computation** (bootstrap, simulation, cross-validation) -- use `efron` directly or `methods-team`.
- **Bayesian-specific analysis** -- use `bayes` directly or `methods-team`.
- **Multi-paradigm comparison** -- use `stats-analysis-team` for the full seven-agent treatment.
- **Statistical communication without analysis** -- use `wasserstein` directly.

## Composition

Four agents, with Box leading the analytical work:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Modeling lead** | `box` | Model building, diagnostics, response surface, time series | Opus |
| **Client liaison / Router** | `pearson` | Classification, synthesis, client communication | Opus |
| **Experimental design / Testing** | `gosset` | t-tests, ANOVA, sample size, experimental design | Sonnet |
| **Pedagogy / Accessibility** | `george` | Client-level explanations, misconception prevention | Sonnet |

Two Opus agents (Box, Pearson) because modeling and synthesis require deep reasoning. Two Sonnet agents (Gosset, George) because testing and explanation are well-bounded tasks.

## Orchestration flow

```
Input: client problem + data (or study question) + client level
        |
        v
+---------------------------+
| Pearson (Opus)            |  Phase 1: Understand the client's problem
| Client liaison            |          - what question needs answering?
+---------------------------+          - what data are available?
        |                              - what decisions will the results inform?
        v
+---------------------------+
| Box (Opus)                |  Phase 2: Plan the analysis
| Modeling lead             |          - select methods
+---------------------------+          - propose model(s)
        |                              - design experiment (if pre-data)
        |
        +------- parallel --------+
        |                         |
        v                         v
+------------------+   +------------------+
| Box (Opus)       |   | Gosset (Sonnet)  |  Phase 3: Execute
| Fit models       |   | Run tests        |          (parallel)
| Run diagnostics  |   | Check assumptions|
+------------------+   +------------------+
        |                         |
        +------------+------------+
                     |
                     v
+---------------------------+
| Box (Opus)                |  Phase 4: Integrate and revise
| Merge test results with   |          - reconcile test and model findings
| model diagnostics          |          - revise model if diagnostics demand it
+---------------------------+          - iterate if needed
                     |
                     v
+---------------------------+
| George (Sonnet)           |  Phase 5: Translate
| Client-level explanation  |          - plain-language findings
+---------------------------+          - practical recommendations
                     |                 - caveats the client should know
                     v
+---------------------------+
| Pearson (Opus)            |  Phase 6: Deliver
| Final synthesis + record  |          - quality check
+---------------------------+          - produce DataReport
                     |
                     v
              DataReport + StatisticalModel
              Grove records
```

## Consulting protocol

### Phase 1 -- Problem understanding (Pearson)

Pearson asks the critical consulting questions:

1. **What decision will this analysis inform?** The analysis method depends on the decision.
2. **What data are available?** Sample size, measurement types, collection method, known biases.
3. **What has been tried already?** Avoid redoing work.
4. **What constraints exist?** Budget, timeline, expertise of the audience, regulatory requirements.

### Phase 2 -- Analysis planning (Box)

Box proposes an analysis plan:

1. **Descriptive phase.** Summarize the data; visualize distributions and relationships.
2. **Modeling phase.** Propose candidate models based on the research question and data structure.
3. **Testing phase.** Identify the hypothesis tests that address the client's question.
4. **Diagnostic phase.** Plan the assumption checks and model diagnostics.

### Phase 3 -- Execution (Box + Gosset, parallel)

Box fits models and runs diagnostics. Gosset runs hypothesis tests with full assumption checking. Both work from the same data but produce independent outputs.

### Phase 4 -- Integration (Box)

Box merges the results:

- Do the model and the tests agree?
- Do diagnostics reveal problems that invalidate conclusions?
- Is model revision needed?

If revision is needed, Box iterates (Phase 3-4) until the model is adequate.

### Phase 5 -- Translation (George)

George translates the technical results into client-accessible language:

- Key findings in one paragraph.
- What the client should do based on the results.
- What the results do NOT tell the client (caveats, limitations).
- Visual aids recommended for the client's presentation.

### Phase 6 -- Delivery (Pearson)

Pearson performs a final quality check and produces the DataReport Grove record with all findings, recommendations, and technical appendix.

## Input contract

The team accepts:

1. **Client problem** (required). The question or situation.
2. **Data** (when available). Raw data or sufficient summaries.
3. **Client level** (required). One of: `non-technical`, `semi-technical`, `technical`.
4. **Decision context** (optional). What the client will do with the results.

## Output contract

### Primary output: DataReport

A structured report with:

- Executive summary (1 paragraph, written for the client level)
- Key findings with effect sizes and intervals
- Practical recommendations
- Caveats and limitations
- Technical appendix (for those who want the details)

### Grove records

- **DataReport:** The client-facing document.
- **StatisticalModel:** Technical model specification and diagnostics (linked from the DataReport).
- **StatisticalAnalysis:** Hypothesis test results (linked from the DataReport).

## Escalation paths

- **Problem is multi-domain or requires Bayesian analysis:** Escalate to `stats-analysis-team`.
- **Client needs heavy computation (bootstrap, simulation):** Add `efron` ad hoc or escalate to `methods-team`.
- **Client needs formal communication (press release, journal article):** Add `wasserstein`.

## Token / time cost

- **Pearson** -- 2 Opus invocations, ~30K tokens
- **Box** -- 2-3 Opus invocations (plan, fit/diagnose, integrate), ~60-90K tokens
- **Gosset** -- 1 Sonnet invocation, ~15-25K tokens
- **George** -- 1 Sonnet invocation, ~15-25K tokens
- **Total** -- 120-170K tokens, 3-8 minutes wall-clock

## Configuration

```yaml
name: consulting-team
client_liaison: pearson
modeling_lead: box
testing: gosset
pedagogy: george

parallel: true
timeout_minutes: 10
max_iterations: 3
```

## Invocation

```
# Applied analysis
> consulting-team: I have sales data for 12 months across 5 regions. I need to
  know which regions are underperforming and whether the trend is improving.
  Client: regional VP (non-technical).

# Study design
> consulting-team: I want to test whether a new employee training program
  improves productivity. How should I design the study? Budget: 60 employees.

# Model iteration
> consulting-team: (session: grove:abc123) The residual plot shows a funnel
  shape. What should we change?
```

## Limitations

- The team does not include Bayesian analysis or heavy computation. For those, escalate.
- The team is optimized for one-on-one consulting, not classroom teaching (use `george` directly for that).
- Time series analysis is available through Box but is not the team's primary focus.
