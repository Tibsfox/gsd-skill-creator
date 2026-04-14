---
name: home-economics-workshop-team
type: team
category: home-economics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/home-economics/home-economics-workshop-team/README.md
description: Focused strategic workshop team for a single deep question about the household — a meal plan overhaul, a kitchen redesign, a new budget, a teaching program for one skill. Pairs Richards with three specialists (Waters, Child, Liebhardt) rather than the full department. Lower token cost than the analysis team while still covering the planning-technique-pedagogy triangle. Use for a one-question deep dive; not for multi-subsystem overhauls (use the analysis team) or for single-task questions (route directly to a specialist).
superseded_by: null
---
# Home Economics Workshop Team

Focused strategic workshop for a single deep question about the household. The workshop pairs Richards with three specialists rather than the full department, covering the planning-technique-pedagogy triangle at a lower token cost than the full analysis team. Modeled on the math department's `proof-workshop-team` and the business department's `business-workshop-team`: a focused configuration for one deep question.

## When to use this team

- **Meal plan overhaul** — the household wants to rebuild its weekly meal plan from scratch. Waters plans, Child verifies technique feasibility, Liebhardt sequences the rollout.
- **New kitchen setup or redesign** — a focused kitchen project. Richards audits habitability, Waters plans how the kitchen will be used, Child identifies the technique equipment, Liebhardt plans the teaching of anyone new to the kitchen.
- **New budget rollout** — the household is adopting a new budget or spending plan. Richards sets the economic frame, Waters rebuilds meals within the new budget, Liebhardt designs the habit-formation plan.
- **Teaching one skill to a household** — "we want our kids to learn to cook weeknight dinners." Liebhardt sequences, Child provides the techniques, Waters provides the meal frame, Richards frames the economic and habitability context.
- **Routine reset** — one specific routine (morning, laundry, cleanup) needs rebuilding. Smaller than a full household overhaul.

## When NOT to use this team

- **Multi-subsystem overhaul** — use `home-economics-analysis-team` (full department).
- **Single-specialist question** — route directly to the specialist via Richards.
- **Habitability crisis** (mold, CO, water) — route directly to Richards, who will escalate to a professional if needed.
- **Pure cooking technique** — use Child directly.
- **Pure motion study on a single task** — use Gilbreth directly (not included in this team).
- **Pure historical context** — use Beecher directly (not included in this team).
- **Pure sensory critique** — use Fisher-he directly (not included in this team).

## Composition

The team runs four of the seven Home Economics Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `richards` | Classification, habitability audit, synthesis | Opus |
| **Seasonal planning** | `waters` | Weekly plan, ingredient-first design | Sonnet |
| **Cooking technique** | `child` | Technique guide, feasibility verification | Sonnet |
| **Pedagogy** | `liebhardt` | Teaching sequence, habit formation | Sonnet |

One Opus (Richards) plus three Sonnet specialists. The workshop is designed to fit within a single hour of wall-clock time and under 150K tokens.

## The planning-technique-pedagogy triangle

The three specialists in this workshop are not arbitrary. They form the triangle that most household-skill questions need:

- **Planning (Waters)** — what should happen over time, given the season, pantry, budget
- **Technique (Child)** — how to execute the plan without failure
- **Pedagogy (Liebhardt)** — how to turn the plan into a durable practice

A meal plan without technique verification is fragile (the cook may not be able to execute it). A technique without a plan is a recipe, not a practice. A plan and a technique without pedagogy is a one-off, not a durable household change. The triangle covers all three.

Richards frames the question, audits habitability as a precondition, and synthesizes the three specialists into a coherent answer.

## Orchestration flow

```
Input: focused question + household context + constraints
        |
        v
+---------------------------+
| Richards (Opus)           |  Phase 1: Frame the question
| Chair                     |          - habitability precondition check
+---------------------------+          - classify the deep question
        |                              - identify which corner of the triangle
        |                                dominates (planning, technique, pedagogy)
        |
        +--------+--------+--------+
        |        |        |
        v        v        v
    Waters    Child    Liebhardt
    (plan)    (tech)   (pedagogy)
        |        |        |
    Phase 2: Specialists work in parallel on the same
             question from their respective lenses.
             Waters produces the plan. Child verifies
             technique feasibility and fills in missing
             technique content. Liebhardt designs the
             rollout sequence.
        |        |        |
        +--------+--------+
                 |
                 v
    +---------------------------+
    | Richards (Opus)           |  Phase 3: Synthesize
    | Merge + consistency check |          - plan is technique-feasible
    +---------------------------+          - pedagogy matches the plan's complexity
                 |                         - budget constraint is honored
                 v
          Final response to user
          + HomeEconomicsPractice Grove record
```

## Synthesis rules

The workshop's synthesis is simpler than the full analysis team because there are fewer specialists to reconcile. The rules:

### Rule 1 — Plan feasibility check

The plan produced by Waters must be verifiable as technique-feasible by Child. If Child identifies a technique that the intended cook cannot yet execute, the plan is revised — either by substituting a simpler technique or by adding a teaching step to Liebhardt's sequence.

### Rule 2 — Pedagogy matches plan complexity

The pedagogy sequence from Liebhardt must match the complexity of the plan. A four-meal-per-week plan for an adult beginner cook needs a longer teaching ramp than a one-meal plan for an experienced cook. If the ramp is too steep, the plan is shortened.

### Rule 3 — Budget is a hard input

Budget constraints are honored by all specialists. A plan that exceeds the budget is revised, not approved with a note.

### Rule 4 — Habitability precondition

If a habitability concern surfaces during the workshop (the planned kitchen has inadequate ventilation, the storage plan puts food near a mold source), the workshop halts and reports the habitability issue. The user addresses the habitability first; the workshop resumes once it is clear.

## Input contract

The team accepts:

1. **Focused question** (required). One deep question, not a list of questions.
2. **Household context** (required). Composition, budget, dietary constraints, kitchen state.
3. **Learner(s)** (optional). Who needs to learn the practice? If omitted, assume the household's current cook(s).
4. **Prior HomeEconomicsSession hash** (optional). For follow-ups.

## Output contract

### Primary output: A practice document

The workshop produces a practice document — a single artifact that the household can implement. Examples:

- A complete weekly meal plan with shopping list, technique notes, and rollout schedule
- A kitchen setup plan with equipment list, layout sketch, technique notes, and teaching sequence
- A new budget rollout with category allocations, envelope scheme, and habit-formation plan
- A one-skill teaching program for a household learner

The practice document is concrete, actionable, and time-bounded. It is not a general explainer.

### Grove record

```yaml
type: HomeEconomicsPractice
subject: <focused question>
practice_type: meal_plan | kitchen_design | budget_rollout | teaching_program | routine_reset
duration: "4 weeks" | "ongoing weekly"
content: <the practice document>
specialists:
  - waters
  - child
  - liebhardt
chair: richards
concept_ids:
  - <relevant college concept IDs>
```

## Token and time cost

- **Richards** — 2 Opus invocations (frame + synthesize), ~30K tokens
- **Waters, Child, Liebhardt** — 3 Sonnet invocations, ~25K tokens each
- **Total** — 100-150K tokens, 3-8 minutes wall-clock

Less than half the cost of the full analysis team. Appropriate for focused questions where a full department investigation would be overkill.

## Escalation paths

### Internal escalations

- **Habitability concern** — Richards surfaces and halts the workshop; user addresses the habitability issue before the workshop resumes or is replaced by analysis team for a broader review.
- **Plan infeasible within budget** — Richards reports the conflict and proposes alternatives (lower target, higher budget, different household composition of effort).
- **Specialist disagreement** — Richards identifies the conflict (usually between the plan's ambition and the cook's readiness) and asks the user to choose.

### External escalations

- **Multi-subsystem problem** — workshop was the wrong choice; escalate to `home-economics-analysis-team`.
- **Motion study required** — Gilbreth is not in this team; if the workshop reveals a need for motion analysis (the proposed routine will not fit the available time), Richards escalates to include Gilbreth or to the analysis team.
- **Historical grounding required** — Beecher is not in this team; rare for a workshop to need her.
- **Sensory critique required** — Fisher-he is not in this team; if the workshop reveals that the existing meals feel wrong despite being technically fine, route the sensory question to Fisher-he separately.

## Configuration

```yaml
name: home-economics-workshop-team
chair: richards
specialists:
  - waters
  - child
  - liebhardt

parallel: true
timeout_minutes: 8

# Habitability precondition still applies
habitability_first: true

# Target: one practice document
output_mode: practice_document
```

## Invocation

```
# Meal plan overhaul
> home-economics-workshop-team: Rebuild our weekly meal plan. Two adults on $70/week, moderate cooking skill, want more variety and less takeout. Current state: we order in twice a week.

# Kitchen setup
> home-economics-workshop-team: Design a kitchen setup for our new apartment. We cook weeknight dinners for 2, weekend entertaining for up to 6, and want sustainable habits.

# Budget rollout
> home-economics-workshop-team: We're adopting a new budget with $600/month for food and household. Current spend averages $800. Build the rollout plan.

# Teach one skill
> home-economics-workshop-team: Teach our 12-year-old to prepare one weeknight dinner per week over the next two months. Current skill: can chop and sauté with supervision.
```

## Limitations

- Four-agent team cannot cover all seven perspectives. For overhaul-scale questions, use the analysis team.
- Does not include motion study (Gilbreth) — if the workshop reveals a motion-study need, escalate.
- Does not include sensory critique (Fisher-he) — if the workshop reveals a sensory need, escalate.
- Does not include historical grounding (Beecher) — if the workshop reveals a history need, escalate.
- Wall-clock time budgeted for one hour; complex questions may exceed that and should be moved to the analysis team.
