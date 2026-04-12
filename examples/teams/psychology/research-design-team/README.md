---
name: research-design-team
type: team
category: psychology
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/psychology/research-design-team/README.md
description: Focused research design and methodology team. Kahneman leads with experimental design and statistical reasoning, Piaget contributes developmental methodology expertise, James provides pragmatic integration and ensures ecological validity, and Skinner-P designs measurement protocols and operationalizes variables. Use for designing psychological studies, evaluating research methodology, planning replications, and critiquing published research. Not for clinical case formulation, teaching, or multi-perspective theoretical analysis.
superseded_by: null
---
# Research Design Team

A focused four-agent team for designing, evaluating, and critiquing psychological research. Kahneman leads with methodological rigor and statistical reasoning; Piaget contributes developmental design expertise; James provides pragmatic integration; Skinner-P operationalizes variables and designs measurement protocols.

## When to use this team

- **Designing a new study** -- "I want to test whether mindfulness meditation reduces test anxiety in college students."
- **Evaluating published research** -- "Is this study's methodology sound? What are its limitations?"
- **Planning a replication** -- "This priming study failed to replicate. How would you design a definitive replication?"
- **Statistical design** -- "What sample size do I need? What analysis is appropriate?"
- **Operationalization** -- "How do I measure 'self-esteem' or 'social connectedness' in a rigorous way?"
- **Ethical review preparation** -- "What ethical concerns should I address in my IRB proposal?"

## When NOT to use this team

- **Clinical case formulation** -- use the case-study-team.
- **Multi-perspective theoretical analysis** -- use the psychology-seminar-team.
- **Teaching or explanation** without a research component -- use Skinner-P or James directly.
- **Structural/intersectional analysis** -- use hooks through James.

## Composition

Four agents focused on methodological expertise:

| Role | Agent | Contribution | Model |
|------|-------|-------------|-------|
| **Lead / Methodologist** | `kahneman` | Experimental design, statistical reasoning, bias identification | Opus |
| **Developmental methods** | `piaget` | Longitudinal/cross-sectional design, age-appropriate measures, developmental validity | Opus |
| **Pragmatic integration** | `james` | Ecological validity, practical significance, real-world applicability | Opus |
| **Operationalization** | `skinner-p` | Variable measurement, behavioral operationalization, schedule design | Sonnet |

Three Opus agents reflect the reasoning depth required for methodological critique and experimental design. Skinner-P runs on Sonnet because operationalization is well-bounded once the design is established.

## Orchestration flow

```
Input: research question + context + mode (design/evaluate/replicate)
        |
        v
+---------------------------+
| Kahneman (Opus)           |  Phase 1: Analyze the research question
| Lead / Methodologist      |          - identify IV(s) and DV(s)
+---------------------------+          - determine appropriate design
        |                              - assess feasibility
        |                              - flag methodological pitfalls
        v
+---------------------------+
| Piaget (Opus)             |  Phase 2: Developmental check
| Developmental methods     |          - is the design developmentally appropriate?
+---------------------------+          - longitudinal vs. cross-sectional considerations
        |                              - age-appropriate measures
        |                              - (no-op if not developmental)
        v
+---------------------------+
| Skinner-P (Sonnet)        |  Phase 3: Operationalize
| Variable measurement      |          - operationally define all variables
+---------------------------+          - design measurement protocols
        |                              - specify reinforcement/manipulation procedures
        |                              - create behavioral checklists
        |
        +------- parallel --------+
        |                         |
        v                         v
+------------------+   +------------------+
| Kahneman (Opus)  |   | James (Opus)     |  Phase 4: Review
| Statistical      |   | Ecological       |          (parallel)
| review           |   | validity review  |
| - power analysis |   | - real-world     |
| - analysis plan  |   |   applicability  |
| - threat ID      |   | - practical      |
|                  |   |   significance   |
+------------------+   +------------------+
        |                         |
        +------------+------------+
                     |
                     v
+---------------------------+
| James (Opus)              |  Phase 5: Integrate
| Final research design     |          - merge methodological and practical
+---------------------------+          - produce ResearchDesign record
                     |                 - note limitations honestly
                     v
              ResearchDesign Grove record
```

## Phase details

### Phase 1 -- Research question analysis (Kahneman)

Kahneman parses the research question and determines:

- **Design type:** True experiment, quasi-experiment, correlational, longitudinal, cross-sectional, mixed-methods
- **Variables:** IV(s), DV(s), covariates, potential confounds
- **Statistical approach:** t-test, ANOVA, regression, SEM, multilevel modeling, Bayesian analysis
- **Threats to validity:** Internal (confounds, selection bias), external (sample generalizability), construct (measurement validity), statistical conclusion (power, multiple comparisons)
- **Replication considerations:** What would make this a strong, preregistered, adequately powered study?

### Phase 2 -- Developmental check (Piaget)

If the study involves developmental questions or participants at specific life stages, Piaget evaluates:

- **Design appropriateness:** Longitudinal (follows same participants over time) vs. cross-sectional (compares different age groups) -- each has trade-offs (cohort effects, attrition, cost)
- **Age-appropriate measures:** Verbal self-report is inappropriate for preverbal children; behavioral observation or eye-tracking is needed
- **Developmental confounds:** Maturation, historical period effects, cohort effects
- **Ethical considerations specific to children:** Assent procedures, parental consent, age-appropriate debriefing

If the study is not developmental, Piaget reports "no developmental issues" and is skipped in synthesis.

### Phase 3 -- Operationalization (Skinner-P)

Skinner-P translates abstract constructs into measurable variables:

- **Dependent variables:** What specific behavior, response, or measurement constitutes the outcome? (e.g., "anxiety" -> Beck Anxiety Inventory score, or skin conductance response, or behavioral avoidance distance)
- **Independent variables:** What specific manipulation constitutes the treatment? (e.g., "mindfulness" -> 8-week MBSR program, 10 minutes daily app-guided meditation, or single-session body scan)
- **Behavioral protocols:** Step-by-step instructions for administering measures and manipulations
- **Reinforcement contingencies:** If the study involves training or intervention, what reinforcement schedule maintains participant engagement?

### Phase 4 -- Statistical and ecological review (Kahneman + James, parallel)

**Kahneman (statistical review):**
- Power analysis: What N is needed for 80% power at the expected effect size?
- Analysis plan: Which statistical test, what assumptions, how to handle violations?
- Multiple comparisons: Bonferroni, Holm, FDR correction?
- Preregistration template: Hypotheses, methods, and analysis plan specified in advance

**James (ecological validity review):**
- Does the laboratory design capture the real-world phenomenon?
- What is the practical significance of the expected effect size?
- Will the findings generalize to diverse populations?
- What are the pragmatic implications if the hypothesis is supported?

### Phase 5 -- Integration (James)

James merges the methodological and practical perspectives into a final ResearchDesign record that is both rigorous and useful.

## Input contract

The team accepts:

1. **Research question** (required). The question to be studied, or the published study to be evaluated.
2. **Context** (required). Background, prior literature, available resources, population of interest.
3. **Mode** (required). One of:
   - `design` -- create a research design from scratch
   - `evaluate` -- critique an existing design or published study
   - `replicate` -- design a replication of an existing study

## Output contract

### Grove record: ResearchDesign

```yaml
type: ResearchDesign
question: "Does mindfulness meditation reduce test anxiety in college students?"
design_type: "randomized controlled trial, pre-post with active control"
methodology:
  participants: "120 college students reporting moderate-to-high test anxiety (BAI >= 16)"
  random_assignment: "stratified by gender and baseline anxiety"
  conditions:
    treatment: "8-week MBSR program (Kabat-Zinn protocol), 2 hours/week + 20 min daily home practice"
    active_control: "8-week study skills workshop, matched for contact hours"
    waitlist_control: "assessment only, offered MBSR after study completion"
  measures:
    primary: "Beck Anxiety Inventory (BAI) change score, pre to post"
    secondary: ["exam performance (GPA change)", "self-reported mindfulness (FFMQ)", "salivary cortisol"]
    timing: "pre-intervention, mid-point (week 4), post-intervention, 3-month follow-up"
  analysis:
    primary: "Mixed ANOVA (group x time) on BAI scores"
    secondary: "Mediation analysis: does FFMQ change mediate BAI change?"
    power: "N=120 provides 82% power to detect d=0.50 at alpha=.05 (3 groups)"
    preregistered: true
  ethical_considerations:
    - "Informed consent with clear description of random assignment"
    - "Waitlist control receives treatment after study"
    - "Participants free to withdraw without penalty"
    - "Distress protocol: referral to campus counseling if BAI > 30 at any assessment"
  limitations:
    - "Self-selected sample (students who volunteer may differ from general population)"
    - "Cannot blind participants to condition"
    - "Home practice compliance difficult to verify"
    - "3-month follow-up may miss long-term maintenance or decay"
concept_ids:
  - psych-stress-response
  - psych-emotional-regulation
  - psych-treatment-approaches
agents: [kahneman, piaget, james, skinner-p]
```

## Escalation paths

### Study is inherently multi-domain

If the research question requires theoretical perspectives beyond the four-agent team (e.g., a study on racial bias in clinical diagnosis requires hooks's structural analysis), escalate to the psychology-seminar-team.

### Ethical concerns exceed IRB standard

If the team identifies ethical concerns that go beyond standard IRB requirements (e.g., research with vulnerable populations in conflict zones), James flags the concern for the user and recommends consultation with specialized ethics boards.

### Methodological impossibility

If the research question cannot be studied with available methods (e.g., randomly assigning children to abusive environments to study trauma), the team reports this honestly and suggests alternative designs (natural experiments, quasi-experiments, retrospective studies).

## Token / time cost

- **Kahneman** -- 2 Opus invocations (analyze + statistical review), ~50-70K tokens
- **Piaget** -- 1 Opus invocation (developmental check), ~20-30K tokens (may be skipped)
- **James** -- 2 Opus invocations (ecological review + integrate), ~30-50K tokens
- **Skinner-P** -- 1 Sonnet invocation (operationalize), ~20-30K tokens
- **Total** -- 120-180K tokens, 3-8 minutes wall-clock

## Configuration

```yaml
name: research-design-team
lead: kahneman
developmental: piaget
integration: james
operationalization: skinner-p

skip_developmental: auto  # skipped when query has no developmental component
preregistration_template: true
power_analysis: true
```

## Invocation

```
# Design a study
> research-design-team: Design a study testing whether gratitude journaling
  improves sleep quality in older adults. Mode: design.

# Evaluate a study
> research-design-team: This study found that power posing increases testosterone.
  N=42, p=.045. Mode: evaluate.

# Plan a replication
> research-design-team: The marshmallow test (Mischel, 1972) has been criticized
  for confounding delay of gratification with socioeconomic status. Design a
  replication that addresses this. Mode: replicate.
```

## Limitations

- The team focuses on design and methodology, not theoretical interpretation. For "why does this happen?" questions, use the seminar team.
- Power analysis requires estimated effect sizes, which may not be available for novel research questions. The team uses prior literature when possible and sensitivity analysis when not.
- The team does not conduct actual statistical analyses. It produces analysis plans that the researcher implements.
