---
name: psychology-seminar-team
type: team
category: psychology
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/psychology/psychology-seminar-team/README.md
description: Full Psychology Department seminar team for multi-domain problems spanning cognitive, developmental, social, clinical, and neuroscience perspectives. James classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response. Use for graduate-level seminars, complex case studies requiring multiple perspectives, research-level questions spanning sub-disciplines, or any problem where the domain is ambiguous and different psychological perspectives may yield different insights. Not for routine explanations, single-domain questions, or introductory-level teaching.
superseded_by: null
---
# Psychology Seminar Team

Full-department multi-perspective investigation team for psychological questions that span domains or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response, analogous to how the math-investigation-team runs multiple analysis methods on a mathematical problem.

## When to use this team

- **Multi-domain problems** spanning cognitive, developmental, social, clinical, and neuroscience perspectives -- where no single specialist covers the full scope.
- **Graduate-level seminar discussions** requiring coordinated input from multiple theoretical frameworks (e.g., "explain aggression from cognitive, developmental, social, and biological perspectives").
- **Complex case studies** where the individual's situation touches multiple domains (a teenager with anxiety, identity issues, social withdrawal, and a family history of depression).
- **Novel questions** where the user does not know which specialist to invoke, and James's multi-perspective classification is the right entry point.
- **Cross-paradigm synthesis** -- when understanding a phenomenon requires seeing it through multiple lenses (behavioral, cognitive, humanistic, social-structural).
- **Theoretical debates** -- comparing and contrasting competing psychological theories on the same phenomenon.

## When NOT to use this team

- **Single-domain questions** where the relevant specialist is obvious -- use James in single-agent mode.
- **Introductory-level teaching** with no multi-perspective component -- use Skinner-P directly.
- **Pure case formulation** where the clinical perspective is sufficient -- use the case-study-team.
- **Pure research design** questions -- use the research-design-team.
- **Crisis content** -- James handles crisis resource provision directly, never routed to the seminar team.

## Composition

The team runs all seven Psychology Department agents:

| Role | Agent | Perspective | Model |
|------|-------|-------------|-------|
| **Chair / Router** | `james` | Pragmatic integration, classification, synthesis | Opus |
| **Developmental** | `piaget` | Cognitive development, lifespan stages, constructivism | Opus |
| **Cognitive / Behavioral** | `kahneman` | Decision-making, biases, System 1/2, research methods | Opus |
| **Social / Cultural** | `vygotsky` | ZPD, scaffolding, cultural mediation, social context | Sonnet |
| **Clinical / Humanistic** | `rogers` | Person-centered formulation, subjective experience, growth | Sonnet |
| **Social Justice** | `hooks` | Intersectionality, power structures, systemic analysis | Sonnet |
| **Pedagogy** | `skinner-p` | Learning design, reinforcement, behavioral analysis | Sonnet |

Three agents run on Opus (James, Piaget, Kahneman) because their tasks require deep reasoning -- integration and synthesis (James), developmental analysis (Piaget), and cognitive/methodological rigor (Kahneman). Four run on Sonnet because their tasks are well-defined within their theoretical framework.

## Orchestration flow

```
Input: user query + optional user level + optional prior PsychologySession hash
        |
        v
+---------------------------+
| James (Opus)              |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity (introductory/intermediate/advanced)
        |                              - type (explain/analyze/apply/evaluate/design)
        |                              - user level
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
     Piaget  Kahneman  Vygotsky  Rogers   Hooks  (Skinner-P
     (devel)  (cog)    (social)  (clin)  (crit)   waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, analyzing the same
             phenomenon from their theoretical perspective.
             Each produces a Grove record. James activates
             only the relevant subset.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | James (Opus)              |  Phase 3: Synthesize
              | Merge specialist outputs  |          - identify convergences
              +---------------------------+          - preserve legitimate disagreements
                         |                           - produce integrated response
                         v
              +---------------------------+
              | Skinner-P (Sonnet)        |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest follow-up explorations
                         v
              +---------------------------+
              | James (Opus)              |  Phase 5: Record
              | Produce PsychologySession |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + PsychologySession Grove record
```

## Synthesis rules

James synthesizes the specialist outputs using these rules:

### Rule 1 -- Converging findings are strengthened

When multiple specialists arrive at the same conclusion from different theoretical frameworks (e.g., both Kahneman and Rogers identify avoidance as the maintaining mechanism, though one frames it as System 1 and the other as conditions of worth), mark the finding as high-confidence. Cross-paradigm convergence is the strongest evidence psychology offers.

### Rule 2 -- Competing perspectives are preserved, not resolved

Psychology is a multi-paradigm discipline. When Kahneman's mechanistic analysis and Rogers's humanistic analysis offer genuinely different interpretations of the same phenomenon, James does not force a false synthesis. Both perspectives are presented with their respective strengths. The user benefits from seeing the phenomenon through multiple lenses.

### Rule 3 -- Structural analysis contextualizes individual analysis

When hooks identifies systemic factors that shape the phenomenon, this context frames the other analyses. Individual-level explanations (Kahneman's biases, Rogers's conditions of worth) operate within the structural context hooks describes (racism, poverty, sexism). The structural analysis does not override the individual analysis -- it contextualizes it.

### Rule 4 -- Developmental trajectory grounds the analysis

Piaget's developmental context establishes what capacities are in place, what is developmentally expected, and what represents deviation. Other specialists' analyses are calibrated against this developmental baseline.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included regardless of user level. Skinner-P adapts the presentation: simpler language, more scaffolding, and concrete examples for lower levels; concise technical writing for higher levels.

## Input contract

The team accepts:

1. **User query** (required). Natural language question about psychology, behavior, mental health, or related topics.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, James infers.
3. **Prior PsychologySession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query from multiple perspectives
- Identifies convergences and legitimate disagreements
- Credits the specialists involved
- Provides practical implications (James's pragmatic principle)
- Suggests follow-up explorations

### Grove record: PsychologySession

```yaml
type: PsychologySession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: advanced
  type: analyze
  user_level: graduate
agents_invoked:
  - james
  - piaget
  - kahneman
  - vygotsky
  - rogers
  - hooks
  - skinner-p
work_products:
  - <grove hash of PsychologicalExplanation>
  - <grove hash of PsychologicalAnalysis>
  - <grove hash of CaseFormulation>
concept_ids:
  - <relevant college concept IDs>
user_level: graduate
```

## Escalation paths

### Internal escalations

- **Irreconcilable theoretical conflict:** When specialists produce genuinely contradictory claims (not just different perspectives), James flags the contradiction and presents the evidence for each position. Psychology tolerates multi-paradigm coexistence -- the seminar team does not need to resolve every disagreement.
- **Specialist unable to contribute:** If a specialist's framework does not apply to the query (e.g., behavioral-neuroscience content with no developmental dimension), that specialist reports "no contribution" and is excluded from synthesis.

### External escalations

- **Crisis content:** If the query involves suicidal ideation, self-harm, or abuse, James provides crisis resources immediately and does not route to the seminar team.
- **Outside psychology:** If the query requires medical, legal, or other non-psychological expertise, James acknowledges the boundary.

## Token / time cost

Approximate cost per seminar:

- **James** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Piaget, Kahneman) + 3 Sonnet (Vygotsky, Rogers, Hooks), ~30-50K tokens each
- **Skinner-P** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-350K tokens, 5-12 minutes wall-clock

## Configuration

```yaml
name: psychology-seminar-team
chair: james
specialists:
  - developmental: piaget
  - cognitive: kahneman
  - social_cultural: vygotsky
  - clinical: rogers
  - critical: hooks
pedagogy: skinner-p

parallel: true
timeout_minutes: 12

auto_skip: true
min_specialists: 2
```

## Invocation

```
# Full seminar
> psychology-seminar-team: Explain human aggression from cognitive, developmental,
  social, clinical, and structural perspectives. Level: graduate.

# Complex case
> psychology-seminar-team: A 16-year-old from a low-income family presents with
  academic decline, social withdrawal, and self-reported "emptiness." Analyze from
  all available perspectives.

# Theoretical debate
> psychology-seminar-team: Compare and contrast how behaviorism, humanism, and
  cognitive psychology explain the maintenance of depression.
```

## Limitations

- The team is limited to the seven agents' combined perspectives. Specialized sub-disciplines (neuropsychology, forensic psychology, industrial-organizational psychology) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at synthesis. This preserves independence but prevents real-time cross-pollination.
- The team does not access external computational resources or empirical databases beyond what each agent's tools provide.
- Psychology's multi-paradigm nature means some questions genuinely have no single correct answer. The team reports this honestly rather than imposing false consensus.
