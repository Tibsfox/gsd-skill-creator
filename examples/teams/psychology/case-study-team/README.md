---
name: case-study-team
type: team
category: psychology
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/psychology/case-study-team/README.md
description: Focused case formulation and intervention team. Rogers leads with person-centered case formulation centering the client's subjective experience, Hooks provides structural and intersectional analysis of the systemic context shaping the client's situation, Vygotsky analyzes social and cultural factors including relationships and institutional contexts, and Skinner-P designs behavioral interventions and operationalizes treatment goals. Use for clinical case conceptualization, treatment planning, intervention design, case presentations, and understanding individual experiences within their systemic context. Not for research design, pure theoretical analysis, or multi-domain seminar discussions.
superseded_by: null
---
# Case Study Team

A focused four-agent team for clinical case formulation, intervention design, and understanding individual psychological experience within its systemic context. Rogers leads with person-centered formulation; Hooks provides structural analysis; Vygotsky adds social-cultural context; Skinner-P designs interventions. This team mirrors the proof-workshop-team pattern: a focused expertise team optimized for a specific class of problem.

## When to use this team

- **Clinical case conceptualization** -- "A 22-year-old college student presents with social anxiety, perfectionism, and academic burnout. Formulate this case."
- **Treatment planning** -- "Given this formulation, what intervention approaches are indicated?"
- **Intervention design** -- "Design a behavioral intervention for a child with school refusal."
- **Case presentations** -- "Prepare a multi-perspective case presentation for a clinical supervision meeting."
- **Understanding experience in context** -- "A refugee family's children are struggling in school. What systemic factors should be considered?"
- **Cultural considerations in treatment** -- "How should treatment be adapted for a client from a collectivist culture?"

## When NOT to use this team

- **Research design** questions -- use the research-design-team.
- **Multi-paradigm theoretical analysis** -- use the psychology-seminar-team.
- **Pure cognitive/behavioral analysis** without a clinical dimension -- use Kahneman through James.
- **Developmental assessment** without clinical features -- use Piaget through James.

## Composition

Four agents focused on clinical and contextual expertise:

| Role | Agent | Contribution | Model |
|------|-------|-------------|-------|
| **Lead / Clinical formulation** | `rogers` | Person-centered case formulation, subjective experience, therapeutic relationship | Sonnet |
| **Structural analysis** | `hooks` | Intersectionality, systemic factors, power dynamics, cultural context | Sonnet |
| **Social-cultural context** | `vygotsky` | Social relationships, cultural tools, institutional factors, ZPD in recovery | Sonnet |
| **Intervention design** | `skinner-p` | Behavioral analysis, operationalized goals, reinforcement-based interventions | Sonnet |

All four agents run on Sonnet. The case-study-team prioritizes breadth of perspective over depth of reasoning in any single framework -- each agent contributes a focused, well-bounded analysis. James synthesizes the outputs (using Opus) when the team is invoked through the standard routing.

## Orchestration flow

```
Input: case information + mode (formulate/plan/intervene)
        |
        v
+---------------------------+
| Rogers (Sonnet)           |  Phase 1: Person-centered formulation
| Clinical formulation      |          - conditions of worth operating
+---------------------------+          - areas of incongruence
        |                              - actualizing direction
        |                              - subjective experience
        v
+---------------------------+
| Hooks (Sonnet)            |  Phase 2: Structural analysis
| Systemic context          |          - intersecting identities
+---------------------------+          - systemic factors (poverty, racism, sexism)
        |                              - institutional context
        |                              - power dynamics in treatment
        v
+------- parallel ----------+
|                           |
v                           v
+------------------+  +------------------+
| Vygotsky (Sonnet)|  | Skinner-P (Sonnet)|  Phase 3: Context + Intervention
| Social-cultural  |  | Behavioral        |          (parallel)
| - relationships  |  | - functional      |
| - cultural tools |  |   analysis        |
| - institutional  |  | - operationalized |
|   scaffolding    |  |   goals           |
| - ZPD in recovery|  | - reinforcement   |
|                  |  |   plan            |
+------------------+  +------------------+
|                           |
+-------------+-------------+
              |
              v
+---------------------------+
| James (Opus)              |  Phase 4: Integrate
| (via standard routing)    |          - merge formulation + context + plan
+---------------------------+          - produce CaseFormulation record
              |                        - note limitations and ethical considerations
              v
       CaseFormulation + PsychologicalExplanation
       Grove records
```

## Phase details

### Phase 1 -- Person-centered formulation (Rogers)

Rogers centers the client's subjective experience:

- **Presenting concerns:** What is the client experiencing, in their own terms?
- **Conditions of worth:** What messages has the client internalized about when they are acceptable?
- **Incongruence:** Where is the gap between self-concept and organismic experience?
- **Actualizing direction:** What would growth look like for this person?
- **Therapeutic relationship needs:** What core conditions (UPR, empathy, congruence) are most critical?

Rogers's formulation establishes the human center of the case. Subsequent phases contextualize and operationalize, but they do not override the subjective experience.

### Phase 2 -- Structural analysis (Hooks)

Hooks examines the systemic context:

- **Intersecting identities:** How do race, class, gender, sexuality, disability, immigration status, and other identity dimensions interact in this person's experience?
- **Systemic factors:** What structural forces (poverty, discrimination, institutional barriers) shape the presenting concerns?
- **Power dynamics in treatment:** How does the therapeutic relationship itself reflect power dynamics (e.g., a white therapist with a client of color, a cisgender therapist with a transgender client)?
- **Cultural considerations:** What cultural factors should inform formulation and treatment?

### Phase 3 -- Social-cultural context and intervention (Vygotsky + Skinner-P, parallel)

**Vygotsky (social-cultural context):**
- What social relationships support or hinder the client's functioning?
- What cultural tools (language, community resources, institutional supports) are available?
- Where is the client's "ZPD" for recovery -- what can they do with support that they cannot yet do alone?
- What scaffolding would help them progress?

**Skinner-P (intervention design):**
- What behaviors need to increase, decrease, or be learned?
- What reinforcement contingencies are maintaining the problematic patterns?
- What operationalized goals would indicate progress?
- What specific behavioral techniques (exposure, behavioral activation, contingency management, shaping) are indicated?
- What reinforcement schedule would sustain engagement?

### Phase 4 -- Integration (James)

James merges all perspectives into a coherent case formulation and treatment plan. The integration follows the principle that the person-centered formulation (Rogers) provides the foundation, the structural analysis (Hooks) provides the context, the social-cultural analysis (Vygotsky) identifies relational and institutional resources, and the behavioral plan (Skinner-P) provides the concrete intervention steps.

## Input contract

The team accepts:

1. **Case information** (required). Presenting concerns, demographic information, history, context.
2. **Mode** (required). One of:
   - `formulate` -- produce a multi-perspective case formulation
   - `plan` -- formulate and produce a treatment plan
   - `intervene` -- design a specific intervention for a particular behavior or goal

## Output contract

### Mode: formulate

**CaseFormulation Grove record:**

```yaml
type: CaseFormulation
presenting_concern: "Social anxiety and academic burnout in a first-generation college student"
person_centered:
  conditions_of_worth: "Worth contingent on academic achievement; family expectations as sole path to economic mobility"
  incongruence: "Exhaustion and desire for connection vs. self-concept as 'the strong one who doesn't need help'"
  actualizing_direction: "Expanding self-concept to include vulnerability and interdependence"
structural_context:
  identities: ["first-generation student", "Latina", "low-income background", "first in family in professional setting"]
  systemic_factors: ["imposter syndrome amplified by institutional underrepresentation", "cultural mismatch with university norms", "financial stress"]
  power_dynamics: "University systems designed for middle-class white students; help-seeking pathways assume cultural familiarity"
social_context:
  supportive: ["close relationship with grandmother", "peer study group in ethnic studies department"]
  barriers: ["family does not understand college culture", "limited professional network", "no models of 'how to do this'"]
  zpd: "Can engage in self-advocacy with practice and scaffolding; currently avoids authority figures"
behavioral_analysis:
  maintaining_factors: ["avoidance of social situations reduces anxiety (negative reinforcement)", "perfectionism maintained by intermittent academic success (variable ratio)"]
  target_behaviors: ["increase help-seeking from professors", "decrease avoidance of social events", "establish recovery routine"]
  intervention: "graduated exposure to help-seeking + behavioral activation for social engagement + contingency management for self-care"
concept_ids:
  - psych-treatment-approaches
  - psych-social-influence
  - psych-prejudice-stereotyping
  - psych-emotional-regulation
agents: [rogers, hooks, vygotsky, skinner-p]
```

### Mode: plan

CaseFormulation + treatment plan with session-by-session structure, including:

- Treatment goals (operationalized)
- Session structure and frequency
- Techniques per phase (engagement, active treatment, maintenance, termination)
- Outcome measures and reassessment schedule
- Cultural adaptations
- Relapse prevention plan

### Mode: intervene

Focused intervention specification with:

- Target behavior
- Functional analysis (antecedents, behavior, consequences)
- Intervention protocol (step-by-step)
- Reinforcement schedule
- Measurement plan
- Expected timeline

## Escalation paths

### Case requires cognitive/developmental expertise

If the case involves significant cognitive processing issues (Kahneman) or developmental concerns (Piaget) beyond the team's composition, escalate to the psychology-seminar-team for full-department analysis.

### Crisis content

If case material reveals imminent risk (suicidal ideation, homicidal ideation, child abuse), the team halts formulation and James provides crisis resources. The case-study team does not serve as a crisis intervention team.

### Ethical complexity

If the case involves dual relationships, mandated reporting ambiguity, or cross-jurisdictional issues, the team flags the ethical concern for the user and recommends consultation.

## Token / time cost

- **Rogers** -- 1 Sonnet invocation, ~25-35K tokens
- **Hooks** -- 1 Sonnet invocation, ~25-35K tokens
- **Vygotsky** -- 1 Sonnet invocation, ~20-30K tokens
- **Skinner-P** -- 1 Sonnet invocation, ~20-30K tokens
- **James (integration)** -- 1 Opus invocation, ~30-40K tokens
- **Total** -- 120-170K tokens, 3-7 minutes wall-clock

## Configuration

```yaml
name: case-study-team
lead: rogers
structural: hooks
social_cultural: vygotsky
intervention: skinner-p
integration: james  # via standard routing

crisis_protocol: true
cultural_adaptation: true
```

## Invocation

```
# Case formulation
> case-study-team: A 45-year-old Black woman presents with chronic fatigue, loss of
  interest, and feelings of being "invisible" at work despite strong performance.
  Mode: formulate.

# Treatment planning
> case-study-team: Formulate and plan treatment for a 10-year-old boy with school
  refusal following his parents' divorce. Mode: plan.

# Specific intervention
> case-study-team: Design an intervention for a college student who cannot start
  assignments until the night before they are due. Mode: intervene.

# Cultural considerations
> case-study-team: A Hmong family's teenager is refusing traditional healing
  practices recommended by elders. The family is in conflict. Mode: formulate.
```

## Limitations

- All four specialists run on Sonnet. For cases requiring the deepest reasoning (complex differential diagnosis, nuanced ethical analysis), consider escalating to the seminar team where Opus agents are available.
- The team does not provide medical diagnosis or medication recommendations. Pharmacological aspects are outside scope.
- The team produces formulations and plans, not therapy. It is a clinical reasoning tool, not a therapeutic agent.
- Cultural considerations are informed by general principles, not specific cultural expertise. The team recommends consultation with cultural community members when specificity is needed.
