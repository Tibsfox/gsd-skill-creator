---
name: data-science-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/data-science-department/README.md
description: >
  Coordinated data science department -- seven named agents, six knowledge
  skills, three teams. 13th instantiation of the department template pattern.
  Distinguishing feature: ethics review is a standing requirement, not an
  optional add-on.
superseded_by: null
---

# Data Science Department

## 1. What is the Data Science Department?

The Data Science Department chipset is a coordinated set of analysis agents, domain
skills, and pre-composed teams that together provide structured data science
support across data wrangling, statistical modeling, machine learning, visualization,
experimental design, and ethics governance. It is the 13th instantiation of the
"department template pattern" in gsd-skill-creator. Incoming requests are classified
by a router agent (Nightingale), dispatched to the appropriate specialist, and all
work products are persisted as Grove records linked to the college concept graph.

The department has a distinguishing architectural feature: ethics review via Benjamin
is a standing requirement for any work involving human data, not an opt-in service.
This reflects the reality that data science decisions about people carry ethical risk
by default.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/data-science-department .claude/chipsets/data-science-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Nightingale (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed -- the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/data-science-department/chipset.yaml', 'utf8')).name)"
# Expected output: data-science-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
reasoning), four on Sonnet (for throughput-oriented tasks).

| Name        | Historical Figure          | Role                                                    | Model  | Tools                        |
|-------------|----------------------------|---------------------------------------------------------|--------|------------------------------|
| nightingale | Florence Nightingale       | Department chair -- classification, routing, synthesis  | opus   | Read, Glob, Grep, Bash, Write |
| tukey       | John Tukey                 | EDA specialist -- profiling, distributions, features    | opus   | Read, Bash, Write            |
| breiman     | Leo Breiman                | ML specialist -- algorithm selection, ensembles         | opus   | Read, Bash, Write            |
| tufte       | Edward Tufte               | Visualization specialist -- chart design, critique      | sonnet | Read, Bash, Write            |
| fisher      | Ronald Fisher              | Experiment specialist -- A/B testing, ANOVA, causality  | sonnet | Read, Bash, Write            |
| benjamin    | Ruha Benjamin              | Ethics specialist -- bias audit, fairness, privacy      | sonnet | Read, Grep, Bash, Write      |
| cairo       | Alberto Cairo              | Pedagogy specialist -- data literacy, explanation       | sonnet | Read, Write                  |

Nightingale is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Nightingale.

### Why these historical figures

The roster is designed to cover the full data science lifecycle while representing
the breadth of the field's intellectual tradition:

- **Nightingale** pioneered using data visualization to change public health policy -- the original data-driven decision maker.
- **Tukey** invented EDA and championed looking at data before testing hypotheses.
- **Breiman** bridged statistics and machine learning, inventing random forests and framing the "two cultures" debate.
- **Tufte** established the principles of honest, efficient data display.
- **Fisher** formalized experimental design, making causal inference rigorous.
- **Benjamin** named how automated systems reproduce inequality, making data ethics concrete.
- **Cairo** made data literacy accessible to everyone, not just specialists.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                        | Domain       | Trigger Patterns                                                          | Agent Affinity           |
|------------------------------|--------------|---------------------------------------------------------------------------|--------------------------|
| data-wrangling               | data-science | clean this data, missing values, join tables, tidy data, data quality     | tukey                    |
| statistical-modeling         | data-science | regression, ANOVA, Bayesian, confidence interval, p-value, AIC, BIC      | tukey, fisher, breiman   |
| machine-learning-foundations | data-science | random forest, gradient boosting, cross-validation, classification        | breiman                  |
| data-visualization           | data-science | chart, plot, dashboard, visualization, data-ink, color palette            | tufte, nightingale       |
| experimental-design-ds       | data-science | A/B test, experiment, sample size, power analysis, causal, randomize      | fisher                   |
| ethics-governance            | data-science | bias, fairness, privacy, consent, GDPR, disparate impact, model card     | benjamin                 |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                    | Agents                                                         | Use When                                            |
|-------------------------|----------------------------------------------------------------|-----------------------------------------------------|
| data-analysis-team      | nightingale, tukey, breiman, tufte, fisher, benjamin, cairo    | Multi-domain, research-level, or full-analysis requests |
| modeling-team           | breiman, tukey, fisher, cairo                                  | Model building, feature engineering, statistical inference |
| visualization-team      | tufte, nightingale, benjamin, cairo                            | Visualization design, dashboards, visual audits     |

**data-analysis-team** is the full department. Use it for problems that
span multiple data science domains or require the broadest possible expertise.

**modeling-team** pairs the ML specialist (Breiman) with the EDA specialist
(Tukey), the experiment specialist (Fisher), and the pedagogy guide (Cairo).
Use it when the primary goal is building, comparing, or validating models.

**visualization-team** pairs the visualization designer (Tufte) with the
data context provider (Nightingale), the ethics reviewer (Benjamin), and
the pedagogy specialist (Cairo). Use it for dashboards, publication graphics,
and visual audits.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`data-science-department` namespace. Five record types are defined:

| Record Type       | Produced By                    | Key Fields                                                    |
|-------------------|--------------------------------|---------------------------------------------------------------|
| DataAnalysis      | tukey, fisher                  | dataset profile, distributions, outliers, missing data pattern, features |
| DataModel         | breiman, fisher                | algorithm, hyperparameters, CV performance, feature importance, baseline |
| DataVisualization | tufte, nightingale             | chart type, variable mappings, design decisions, honesty check, accessibility |
| DataExplanation   | cairo, benjamin                | topic, target level, explanation body, ethics findings, recommendations |
| DataSession       | nightingale                    | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. DataSession records
link all work products from a single interaction, providing an audit trail from
query to result.

## 7. College Integration

The chipset connects to the college data science department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a DataExplanation is produced, the chipset can
  automatically generate a Try Session (interactive practice) based on the
  explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed analyses, models, and explanations
  update the learner's progress along college-defined pathways.
- **Five wings** map to the college data science department structure:
  1. Data Collection
  2. Exploratory Analysis
  3. Visualization & Communication
  4. Statistical Inference
  5. Data Ethics

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The data science department follows the same department template pattern as the
math department. To customize for a related domain, follow the same steps
outlined in the math department README:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/data-science-department examples/chipsets/biostatistics-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references. For a biostatistics department you might use: nightingale (keep as
chair -- she is both data science and biostatistics), kaplan (survival analysis),
cox (proportional hazards), cornfield (epidemiology), bradford-hill (causal
criteria), rothman (methods), snow (public health pedagogy).

### Step 3: Replace skills with domain-appropriate content

Swap the six data science skills for biostatistics equivalents. Keep the same
structure: domain, description, triggers, and agent_affinity.

### Step 4: Define new Grove record types

Replace the five `DataX` record types with domain-appropriate types. A
biostatistics department might use: EpiAnalysis, SurvivalModel, ClinicalTrial,
EpiExplanation, EpiSession.

### Step 5: Map to the target college department

Update the `college` section with the target department and its wings.

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The `ethics_agent_present` gate is
specific to data science -- consider whether it applies in the target domain.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Nightingale) as the entry point for all
queries. This provides three benefits:

1. **Classification**: Nightingale determines which domain(s) a query touches before
   dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-domain queries, Nightingale collects results from
   multiple specialists and synthesizes a unified response.
3. **CAPCOM boundary**: The user interacts with exactly one agent, ensuring
   consistent communication and ethics integration.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (nightingale, tukey, breiman): These roles require the deepest
  reasoning. Routing and synthesis (Nightingale) must understand all six domains
  well enough to classify correctly. Exploratory data analysis (Tukey) requires
  open-ended investigation where the "right answer" is not known in advance.
  Machine learning model selection (Breiman) requires navigating complex trade-offs
  among algorithms, data characteristics, and constraints.
- **Sonnet agents** (tufte, fisher, benjamin, cairo): These roles are more
  procedural. Chart design follows established principles. Experimental design
  follows standardized protocols. Ethics auditing follows a checklist-driven
  methodology. Pedagogy follows structured explanation patterns. Sonnet's speed
  matters more than depth ceiling for these tasks.

### Why ethics is a standing requirement

In the math department, ethics review is rarely relevant -- a proof of the
Pythagorean theorem does not have disparate impact on protected groups. In data
science, nearly every project involves data about people, decisions about people,
or systems that affect people. Making ethics review opt-in means it will often
be skipped under time pressure. Making it a standing requirement means Benjamin
is consulted whenever human data is involved, regardless of whether the user
asked for it.

### Why this team structure

The three teams cover the three most common problem shapes:

- **Full investigation**: needs every perspective (all 7 agents)
- **Modeling-focused**: needs the analytical core (4 agents, no visualization or ethics)
- **Visualization-focused**: needs the communication pipeline (4 agents, no modeling or experimentation)

Teams are not exclusive. Nightingale can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Nightingale speaks to the
user. Other agents communicate through Nightingale via internal dispatch. This is
enforced by the `is_capcom: true` flag -- only one agent in the chipset may
carry this flag.

## 10. Relationship to Math Department

The data science department and the math department are complementary:

- **Math Department** provides pure mathematical reasoning -- proof construction,
  algebraic manipulation, geometric intuition, pattern detection. These are
  foundational capabilities.
- **Data Science Department** provides applied analytical reasoning -- data
  wrangling, modeling, visualization, experimentation, ethics. These build on
  mathematical foundations but add domain-specific concerns about data quality,
  human impact, and communication.

In practice, data science work frequently requires mathematical foundations.
A statistical model is built on linear algebra and calculus. A visualization
uses geometric reasoning. An experimental design uses probability theory.
The data science department does not replicate these foundations -- it draws on
them through the college concept graph, where math concepts appear as
prerequisites for data science concepts.

Future integration could formalize cross-department referral: when Breiman
encounters a problem that is fundamentally mathematical (e.g., deriving a
custom loss function), Nightingale could refer to the math department's Euler
or Gauss for the computation, then resume the data science workflow.
