---
name: statistics-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/chipsets/statistics-department/README.md
description: >
  Coordinated statistics department — seven named agents, six knowledge
  skills, three teams. 21st department instantiation of the department template pattern.
superseded_by: null
---

# Statistics Department

## 1. What is the Statistics Department?

The Statistics Department chipset is a coordinated set of reasoning agents, domain
skills, and pre-composed teams that together provide structured statistics
support across descriptive analysis, probability, inference, regression modeling,
Bayesian methods, and computational statistics. It is the 21st instantiation of
the "department template pattern" in gsd-skill-creator. Incoming requests are
classified by a router agent (Pearson), dispatched to the appropriate specialist,
and all work products are persisted as Grove records linked to the college concept
graph. The department places special emphasis on responsible statistical practice:
effect sizes alongside p-values, honest communication of uncertainty, and the
recognition (via Box) that all models are wrong but some are useful.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/statistics-department .claude/chipsets/statistics-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Pearson (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed -- the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/statistics-department/chipset.yaml', 'utf8')).name)"
# Expected output: statistics-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
reasoning), four on Sonnet (for throughput-oriented computation and pedagogy).

| Name        | Historical Figure         | Role                                                    | Model  | Tools                        |
|-------------|---------------------------|---------------------------------------------------------|--------|------------------------------|
| pearson     | Karl Pearson (1857-1936)  | Department chair -- classification, routing, synthesis  | opus   | Read, Glob, Grep, Bash, Write |
| bayes       | Thomas Bayes (1701-1761)  | Probabilistic reasoning -- Bayesian inference, updating | opus   | Read, Grep, Bash             |
| gosset      | W.S. Gosset (1876-1937)   | Experimental statistics -- t-tests, small-sample, design | sonnet | Read, Bash                   |
| box         | George E.P. Box (1919-2013) | Modeling and diagnostics -- regression, response surface, time series | opus | Read, Grep, Bash, Write |
| efron       | Bradley Efron (1938-)     | Computational statistics -- bootstrap, simulation, CV    | sonnet | Read, Bash                   |
| wasserstein | Ronald Wasserstein (ASA)  | Communication -- p-value reform, audience adaptation     | sonnet | Read, Write                  |
| george      | Pedagogy template         | Pedagogy -- active learning, simulation-based inference   | sonnet | Read, Write                  |

Pearson is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Pearson.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                  | Domain     | Trigger Patterns                                                   | Agent Affinity         |
|------------------------|------------|-------------------------------------------------------------------|------------------------|
| descriptive-statistics | statistics | summarize, mean, median, standard deviation, histogram, box plot, describe this data | pearson, gosset |
| probability-theory     | statistics | probability, conditional, Bayes' theorem, distribution, expected value, CLT | bayes, pearson |
| inferential-statistics | statistics | test whether, significant, hypothesis, confidence interval, p-value, power analysis, sample size | gosset, pearson, wasserstein |
| regression-modeling    | statistics | predict, regression, model, R-squared, residual, logistic, fit a model | box, efron |
| bayesian-methods       | statistics | prior, posterior, Bayesian, MCMC, credible interval, Bayes factor, update beliefs | bayes, efron |
| statistical-computing  | statistics | bootstrap, simulate, permutation test, cross-validation, Monte Carlo, resample | efron |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                  | Agents                                              | Use When                                            |
|-----------------------|-----------------------------------------------------|-----------------------------------------------------|
| stats-analysis-team   | pearson, bayes, gosset, box, efron, wasserstein, george | Multi-domain, research-level, or full-analysis requests |
| consulting-team       | box, pearson, gosset, george                        | Applied analysis, study design, client-facing results |
| methods-team          | bayes, efron, box, george                           | Method comparison, paradigm evaluation, sensitivity  |

**stats-analysis-team** is the full department. Use it for problems that span
multiple statistical domains or require the broadest possible expertise.

**consulting-team** pairs the modeling lead (Box) with the client liaison
(Pearson), the experimental specialist (Gosset), and the pedagogy guide (George).
Use it when the primary goal is applied analysis with client-accessible output.

**methods-team** is the methodological comparison pipeline. Bayes provides the
Bayesian perspective, Efron the computational perspective, Box the model-based
perspective, and George synthesizes the comparison. Use it to understand how
different paradigms handle the same problem.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`statistics-department` namespace. Five record types are defined:

| Record Type            | Produced By               | Key Fields                                              |
|------------------------|---------------------------|---------------------------------------------------------|
| StatisticalAnalysis    | gosset, efron, pearson    | test/method, assumptions checked, test statistic, p-value, effect size, CI |
| StatisticalModel       | box, bayes                | model specification, coefficients, diagnostics, iteration history |
| DataReport             | wasserstein, pearson      | audience, key finding, recommendations, caveats, technical appendix |
| StatisticalExplanation | george, wasserstein       | topic, target level, explanation body, misconceptions, follow-up |
| StatisticsSession      | pearson                   | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. StatisticsSession records
link all work products from a single interaction, providing an audit trail from
query to result.

## 7. College Integration

The chipset connects to the college statistics department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a StatisticalExplanation is produced, the chipset
  can automatically generate a Try Session (interactive practice) based on the
  explanation content.
- **Learning pathway updates**: Completed analyses, models, and explanations
  update the learner's progress along college-defined pathways.
- **Five wings** map to the college statistics department structure:
  1. Accounting Principles & Bookkeeping
  2. Financial Statements & Analysis
  3. Probability & Randomness
  4. Statistical Analysis & Inference
  5. Financial Literacy & Personal Finance

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The statistics department follows the same department template pattern established
by the math department. To create a department for another domain, follow the
six-step process documented in `examples/chipsets/math-department/README.md`:

1. Copy the chipset directory.
2. Rename agents.
3. Replace skills with domain-appropriate content.
4. Define new Grove record types.
5. Map to the target college department.
6. Update evaluation gates.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Pearson) as the entry point for all
queries. This provides classification, synthesis, and a CAPCOM boundary. Users
interact with exactly one agent, reducing cognitive load and providing a
consistent communication style.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (Pearson, Bayes, Box): These roles require the deepest
  reasoning. Routing and synthesis (Pearson) must understand all six domains.
  Bayesian reasoning (Bayes) requires multi-step probabilistic thinking.
  Model building and diagnostics (Box) require iterative judgment about
  model adequacy.
- **Sonnet agents** (Gosset, Efron, Wasserstein, George): These roles are
  throughput-oriented. Test computation, bootstrap execution, communication
  adaptation, and pedagogical explanation benefit from fast turnaround.

### Why this team structure

The three teams cover the three most common query shapes:

- **Full investigation**: needs every perspective (all 7 agents).
- **Applied consulting**: needs modeling, testing, and client communication (4 agents).
- **Methodological comparison**: needs multiple paradigms and synthesis (4 agents).

Teams are not exclusive. Pearson can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Pearson speaks to the
user. Other agents communicate through Pearson via internal dispatch. This is
enforced by the `is_capcom: true` flag.

### Statistical communication philosophy

Unlike the math department, the statistics department has a dedicated
communication specialist (Wasserstein). This reflects the discipline's unique
challenge: statistical results are routinely misinterpreted, and the ASA's
formal position on p-values demonstrates that the profession itself considers
communication a first-class concern. Every result that leaves the department
should include effect sizes, intervals, and honest caveats -- not just p-values.

## 10. Relationship to Math Department

The statistics department and the math department are complementary:

- **Math Department** provides pure mathematical reasoning -- proof construction,
  algebraic structures, geometric intuition, pattern recognition. These are
  the theoretical foundations.
- **Statistics Department** provides data-driven reasoning -- inference from
  samples, model building, Bayesian updating, computational resampling. These
  are the empirical methods.

In practice, the two departments share a natural boundary at probability theory:
the math department's Euler handles calculus-based probability derivations,
while the statistics department's Bayes handles probabilistic inference and
updating. A problem that starts as "derive the PDF of the sum of two
exponentials" belongs in math; a problem that starts as "given this data from
an exponential process, estimate the rate parameter" belongs in statistics.

The college concept graph links the two departments through shared concepts
in the "Data & Probability" and "Statistics & Inference" wings.
