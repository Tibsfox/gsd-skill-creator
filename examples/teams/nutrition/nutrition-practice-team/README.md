---
name: nutrition-practice-team
type: team
category: nutrition
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/nutrition/nutrition-practice-team/README.md
description: Practice-oriented team for applying nutrition science to everyday food choices and feeding relationships. Pairs Atwater (accounting and reference intakes), Pollan (food-system translation), and Satter (feeding and communication) under Lind's coordination. Optimized for turning nutrition science into actionable guidance — what to put on the plate, how to read a label, how to talk about food — without losing the evidence base or the communication quality. Use for real-world dietary-practice questions, family feeding questions, and curriculum-adjacent questions.
superseded_by: null
---
# Nutrition Practice Team

Practice-oriented team for applying nutrition science to real-world food choices, family feeding, and everyday eating. Runs the department's accounting, food-system, and pedagogy specialists together under Lind's coordination.

## When to use this team

- **Real-world dietary practice.** A user wants to know how to put a nutrition recommendation into practice at their actual grocery store, for their actual family, within their actual cooking skills.
- **Family feeding questions** that span child developmental needs and family meal structures.
- **Label-reading and food-supply translation.** A user wants help reading ingredient labels, understanding ultra-processing, and distinguishing marketing claims from nutritional substance.
- **Meal-planning support** that respects both the evidence base and the family's real constraints.
- **Nutrition curriculum practice** — helping a teacher or a parent turn nutrition content into age-appropriate learning activities without moralizing or oversimplifying.
- **Ongoing family nutrition improvement** where iterative coaching is more useful than one-time critique.

## When NOT to use this team

- **Contested-claim deep dives** — use the workshop team.
- **Policy and industry-influence questions** — use Marion Nestle via the analysis team or direct routing.
- **Cardiovascular lipid questions** that need the full evidence treatment — use Ancel Keys via the workshop team.
- **Clinical nutrition** or medical feeding issues — escalate to a clinical provider.
- **Eating disorder concerns** — escalate to specialized clinical care.
- **Historical popular-nutrition claim checking** — use the workshop team (Davis is not on the practice team).

## Composition

The practice team runs four agents.

| Role | Agent | Focus | Model |
|------|-------|-------|-------|
| **Chair / Coordinator** | `lind` | Classification, synthesis, tier labeling, routing to practice specialists | Opus |
| **Accounting specialist** | `atwater` | Reference intakes, macronutrient accounting, label verification | Sonnet |
| **Food-system specialist** | `pollan` | Supply chain, ingredient-label reading, real-world translation | Sonnet |
| **Pedagogy specialist** | `satter` | Feeding relationships, communication quality, developmental framing | Sonnet |

One Opus (Lind for coordination) and three Sonnet specialists. The team is intentionally cheaper than the analysis team because practice-oriented questions typically do not need the full evidence-workshop depth — they need grounded recommendations that respect the evidence without re-litigating every contested claim.

## Orchestration flow

```
Input: practice question + family or individual context + cooking/shopping context
        |
        v
+---------------------------+
| Lind (Opus)               |  Phase 1: Understand the context
| Context + classification  |          - who is eating
+---------------------------+          - what is the current practice
        |                              - what change is being requested
        |                              - what constraints apply
        |
        +---------+---------+---------+
        |         |         |
        v         v         v
     Atwater   Pollan    Satter
   (accounting) (food    (pedagogy
                system)  and framing)
        |         |         |
    Phase 2: Specialists contribute in parallel:
             - Atwater: what the numbers say
             - Pollan: what the food supply offers
             - Satter: how to communicate it without moralizing
                       or developmental mismatch
        |         |         |
        +---------+---------+
                  |
                  v
        +---------------------------+
        | Lind (Opus)               |  Phase 3: Synthesize
        | Integrate three views     |          - resolve tensions
        +---------------------------+          - produce practical guidance
                  |                            - add follow-up plan
                  v
        +---------------------------+
        | Satter (Sonnet)           |  Phase 4: Communication check
        | Final pedagogy pass       |          - remove moralizing
        +---------------------------+          - developmental alignment
                  |
                  v
           Final response to user
           + NutritionSession Grove record
```

## Synthesis rules

### Rule 1 — Practice beats theory when they conflict

When Atwater's accounting and Pollan's food-system reading produce different recommendations, the team resolves toward what the user can actually do. A recommendation that is technically optimal but impossible to execute is worse than a recommendation that is slightly less optimal but realistic.

### Rule 2 — Tier labels are still mandatory

Practice orientation does not relax the tier-label discipline. Recommendations still carry settled/strong/contested labels. The difference from the workshop team is that the practice team does not dwell on the contested questions — it gives the user the best current answer with the tier label attached and moves on.

### Rule 3 — Child-involving responses pass through Satter

Every response that involves a child, a family meal, or a feeding relationship passes through Satter for communication quality and developmental framing, regardless of who produced the underlying content.

### Rule 4 — Constraints are respected

The team does not ignore user-declared constraints (allergies, cultural preferences, budget, cooking skill, time, access to ingredients). Recommendations are built around the constraints, not in spite of them.

### Rule 5 — Iterative coaching rather than one-shot prescription

For ongoing family nutrition questions, the team recommends small, incremental changes the user can integrate, with a follow-up plan. "Try this for two weeks and come back" is preferred over "do all of this immediately."

## Input contract

The team accepts:

1. **Practice question** (required). What the user is trying to accomplish in everyday food and feeding.
2. **Context** (often required). Family structure, ages of children, cooking and shopping environment, cultural or budget constraints.
3. **Current practice** (optional). What the family is doing now that the user wants to change or improve.
4. **Learner level** (optional). Primary adult audience level, used to calibrate the response.

## Output contract

### Primary output: Practical guidance

A structured response that:

- Identifies the current practice and the change being requested
- Recommends specific, actionable steps
- Respects user-declared constraints
- Uses the food frame alongside the nutrient frame
- Removes moralizing language
- Applies developmental framing for any child-involving content
- Includes a follow-up plan

### Grove record: NutritionSession

```yaml
type: NutritionSession
started_at: <ISO 8601>
query: <user query>
classification:
  domain: practice
  evidence_strength: strong
  type: advise
  learner_level: <level>
agents_invoked:
  - lind
  - atwater
  - pollan
  - satter
work_products:
  - <NutritionAssessment from Atwater>
  - <NutritionExplanation from Pollan>
  - <NutritionExplanation from Satter>
practical_steps: [<concrete recommendations>]
constraints_respected: [<user-declared constraints>]
followup_plan: <timeline and check-in>
```

## Escalation paths

### Internal

- **Atwater's numbers don't fit Pollan's food-supply reality.** Prioritize what the user can execute. Note the gap.
- **Satter flags developmental mismatch in the team's draft.** Revise before delivery.
- **The user's declared constraints make the standard recommendation impossible.** Work within the constraints. Do not lecture.

### External

- **Question turns out to need evidence workshop treatment.** Escalate to the workshop team.
- **Question turns out to need policy context.** Escalate to Marion Nestle via the analysis team.
- **Clinical or medical feeding issue surfaces.** Escalate to a pediatric or clinical provider.
- **Eating-disorder signals appear.** Escalate to specialized clinical care.

## Token / time cost

- **Lind** — 2 Opus invocations, ~30K tokens
- **Atwater** — 1 Sonnet invocation, ~15K tokens
- **Pollan** — 1 Sonnet invocation, ~25K tokens
- **Satter** — 1 Sonnet invocation for content + 1 for communication check, ~25K tokens
- **Total** — 100-150K tokens, 3-6 minutes wall-clock

Cheapest of the three pre-composed teams. Designed for frequent, iterative use.

## Invocation

```
# Family meal planning
> nutrition-practice-team: I have three kids (ages 3, 7, 11) and I'm trying
  to put more vegetables on the table without making it a battle. Budget is
  tight. What should I try?

# Label reading
> nutrition-practice-team: Can you walk me through the ingredient list on this
  frozen dinner? Is this ultra-processed or not?

# Grocery store translation
> nutrition-practice-team: My doctor said to eat a Mediterranean diet. What do
  I actually put in my cart at Safeway?

# Ongoing improvement
> nutrition-practice-team: We've been doing the pressure-free dinner approach
  for two months. My 4-year-old still eats only three things. What next?
```

## Limitations

- The practice team does not include Keys, Nestle, or Davis. Contested evidence, industry-influence, and historical-transparency questions should be handled by the workshop or analysis teams.
- Iterative coaching works best when the user returns with prior NutritionSession context. Single-shot questions get a useful answer but lose the benefit of follow-up.
- The team does not replace a registered dietitian for clinical nutrition, a pediatric feeding specialist for medical feeding issues, or an eating-disorder clinician. Its scope is competent everyday nutrition practice.
