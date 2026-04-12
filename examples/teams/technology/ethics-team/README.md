---
name: ethics-team
type: team
category: technology
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/technology/ethics-team/README.md
description: Focused ethics and social impact team combining technology risk assessment (Joy), social construction analysis (Hicks), digital equity evaluation (Gates-M), and creative learning perspective (Resnick). Use for ethical evaluation of technology proposals, social impact assessment, labor analysis, equity audits, and any question where the primary concern is whether a technology should be deployed rather than whether it can be. Not for pure technical evaluation or design review.
superseded_by: null
---
# Ethics Team

Focused team for ethical and social analysis of technology -- evaluating whether a technology should be deployed, not just whether it can be. Combines risk assessment, social construction analysis, equity evaluation, and pedagogical framing to produce assessments that are technically informed, historically grounded, and centered on human well-being.

## When to use this team

- **Ethical evaluation** of technology proposals where the central question is "should we?" rather than "can we?"
- **Social impact assessment** of technology deployment in communities, workplaces, or public spaces.
- **Labor analysis** of automation, platform work, or AI-driven workforce changes.
- **Equity audits** evaluating who benefits and who bears the cost of a technology decision.
- **Policy evaluation** of technology governance proposals, regulations, or institutional technology policies.
- **Historical pattern analysis** connecting current technology decisions to past technology transitions.

## When NOT to use this team

- **Technical evaluation** of system architecture or infrastructure -- use `borg` or `design-team`.
- **Design review** focused on usability and interaction -- use `design-team`.
- **Full multi-perspective assessment** that includes technical and design alongside ethics -- use `tech-assessment-team`.
- **Foundational technology education** -- use `resnick` directly.

## Composition

| Role | Agent | Focus | Model |
|------|-------|-------|-------|
| **Risk specialist** | `joy` | Emerging tech risk, failure modes, precautionary principle, controllability | Opus |
| **Social analyst** | `hicks` | Social construction, labor, gender, power dynamics, historical patterns | Sonnet |
| **Impact specialist** | `gates-m` | Digital equity, social impact, global development, inclusion | Sonnet |
| **Pedagogy specialist** | `resnick` | Level-appropriate framing, creative agency, equitable access to learning | Sonnet |

Joy serves as the team coordinator due to the depth of reasoning required for risk synthesis. Berners-Lee is not on this team (the ethics team operates independently of the CAPCOM when invoked directly), but findings are routed through Berners-Lee when the ethics team is called from within a larger assessment.

## Orchestration flow

```
Input: technology or policy + context + assessment goals
        |
        v
+---------------------------+
| Joy (Opus)                |  Phase 1: Frame the ethical question
| Coordinator               |          - what is at stake
+---------------------------+          - who is affected
        |                              - what time horizon matters
        |
        +--------+--------+--------+
        |        |        |        |
        v        v        v        v
       Joy    Hicks    Gates-M  Resnick
      (risk)  (social) (equity) (learn)
        |        |        |        |
    Phase 2: Specialists analyze in parallel
             Joy: risk framework (reversibility,
                  controllability, scope, velocity, equity)
             Hicks: social construction, labor, power
             Gates-M: digital equity, inclusion, impact
             Resnick: who gets to learn, who is excluded
        |        |        |        |
        +--------+--------+--------+
                    |
                    v
         +---------------------------+
         | Joy (Opus)                |  Phase 3: Synthesize
         | Merge ethical assessments |          - identify convergence
         +---------------------------+          - preserve value tensions
                    |                           - flag irreversibility
                    v
         +---------------------------+
         | Resnick (Sonnet)          |  Phase 4: Framing
         | Level-appropriate output  |          - accessible language
         +---------------------------+          - actionable guidance
                    |
                    v
             Ethics assessment + Grove records
```

## Synthesis rules

### Rule 1 -- Irreversibility is a threshold, not a factor

If Joy identifies irreversible consequences, this finding gates the entire assessment. No amount of positive impact from Gates-M or creative potential from Resnick overrides irreversibility without explicit, informed consent from all affected stakeholders.

### Rule 2 -- Historical evidence weighs heavily

When Hicks identifies a historical pattern matching the current situation (e.g., "this automation pattern historically led to workforce displacement concentrated among women and minorities"), this evidence is weighted as strongly as theoretical risk analysis. History is data.

### Rule 3 -- Equity is multi-dimensional

Gates-M's five-dimension equity framework (access, affordability, skills, relevance, agency) is applied in full. A technology that scores well on access but poorly on agency (people can use it but cannot shape it) receives a mixed equity assessment, not a passing one.

### Rule 4 -- Value conflicts are named, not resolved

The ethics team identifies and articulates value conflicts rather than resolving them. "This technology increases safety at the cost of privacy" is a finding. Whether that trade-off is acceptable is a decision for the affected community, not for the assessment team.

### Rule 5 -- Alternatives are always considered

Every ethics assessment includes a "what else could we do?" section. The team evaluates the proposed technology against alternative approaches to the same problem, including the alternative of doing nothing.

## Input contract

1. **Technology or policy** (required). What is being evaluated.
2. **Context** (required). Deployment environment, affected populations, institutional setting.
3. **Assessment goals** (optional). Specific ethical dimensions to prioritize.

## Output contract

### Primary output: Ethics assessment

A unified assessment that:

- Identifies the ethical dimensions at stake
- Evaluates from risk, social, equity, and learning perspectives
- Names value conflicts explicitly
- Presents alternatives
- Provides a clear, honest recommendation (or honest acknowledgment that the decision depends on values the team cannot adjudicate)

### Grove records

- **TechAssessment** from Joy: risk assessment with five-dimension scores
- **TechAnalysis** from Hicks: social construction and labor analysis
- **TechAssessment** from Gates-M: equity audit across five dimensions
- **TechExplanation** from Resnick: accessible framing and learning implications
- **TechSession** from Joy: session record linking all work products

## Configuration

```yaml
name: ethics-team
chair: joy
specialists:
  - social: hicks
  - equity: gates-m
  - pedagogy: resnick

parallel: true
timeout_minutes: 12
auto_skip: false
min_specialists: 2
```

## Invocation

```
# Ethical evaluation
> ethics-team: Evaluate the ethics of using predictive policing algorithms in
  urban neighborhoods.

# Social impact assessment
> ethics-team: Assess the social impact of replacing school librarians with
  AI-powered recommendation systems.

# Labor analysis
> ethics-team: Analyze the labor implications of warehouse automation for
  communities that depend on warehouse employment.

# Equity audit
> ethics-team: Audit this digital government services platform for equity across
  age, income, disability, and language dimensions.

# Policy evaluation
> ethics-team: Evaluate the EU proposal to require AI systems to disclose their
  training data sources.
```

## Limitations

- The ethics team analyzes and presents findings; it does not make ethical decisions on behalf of communities.
- Value conflicts between stakeholders are identified but not resolved. Resolution requires democratic processes, not algorithmic assessment.
- Historical analogues are informative, not deterministic. Past patterns suggest likely outcomes but do not guarantee them.
- The team's analysis is bounded by available knowledge. Emerging technologies may present novel ethical dimensions that existing frameworks do not capture.
