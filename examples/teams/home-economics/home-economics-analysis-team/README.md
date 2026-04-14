---
name: home-economics-analysis-team
type: team
category: home-economics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/home-economics/home-economics-analysis-team/README.md
description: Full Home Economics Department team for multi-subsystem household problems spanning habitability, nutrition, technique, economics, motion study, and pedagogy. Richards classifies the query, audits habitability first, and activates the relevant specialists in parallel; the team returns a unified response with a pedagogical wrap from Liebhardt. Use for household overhauls, new-household setup, post-move rebuilds, or any problem where the subsystem is not obvious and multiple specialist lenses are needed. Not for single-task questions that map cleanly to one specialist.
superseded_by: null
---
# Home Economics Analysis Team

Full-department analysis team for household problems that span multiple subsystems or resist clean classification. Runs specialists in parallel after a Richards-led habitability audit and synthesizes the findings into a unified response with a pedagogy wrap, analogous to how `math-investigation-team` runs parallel specialists on a multi-domain mathematical problem.

## When to use this team

- **Household overhaul** — the house is not working and the problems are diffuse. Efficiency, habitability, nutrition, and teaching are all entangled.
- **New-household setup** — a family is moving into a new home, assembling a new household from two prior ones, or starting from scratch. Every subsystem needs attention.
- **Post-move rebuild** — after a move, the routines, storage, and layouts all need re-designing at once.
- **Life-stage transition** — a new baby, a child growing into teen years, an elder moving in, a partner returning to work. Multiple subsystems shift simultaneously.
- **Post-crisis restoration** — after an illness, a job loss, a death in the household, or a natural disaster. The household must be rebuilt as a working system.
- **Multi-person household with implicit-labor conflict** — the routines, budget, and teaching are all unclear, and several specialists are needed to surface the hidden structure.

## When NOT to use this team

- **Single-task questions** where the subsystem is obvious — route directly to the specialist via Richards in single-agent mode. The analysis team's token cost is substantial.
- **Pure meal planning** — use `home-economics-workshop-team` or Waters directly.
- **Pure cooking technique** — use Child directly.
- **Pure budget work** — use Richards directly for the economic frame.
- **Simple teaching questions** — use Liebhardt directly.

## Composition

The team runs all seven Home Economics Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `richards` | Classification, habitability audit, orchestration, synthesis | Opus |
| **Motion study** | `gilbreth` | Task decomposition, routine chart, ergonomics | Opus |
| **Sensory and food writing** | `fisher-he` | Experiential framing, sensory description, narrative critique | Opus |
| **Historical foundation** | `beecher` | Lineage grounding, curriculum sequence | Sonnet |
| **Cooking technique** | `child` | Technique guide, verification, diagnosis | Sonnet |
| **Seasonal planning** | `waters` | Weekly meal plan, ingredient-first design | Sonnet |
| **Pedagogy** | `liebhardt` | Teaching sequence, habit formation, retros | Sonnet |

Three agents run on Opus (Richards, Gilbreth, Fisher-he) because their tasks require judgment under ambiguity. Four run on Sonnet because their tasks are well-defined and benefit from throughput.

## Orchestration flow

```
Input: user query + household context + optional budget/time/teaching constraints
        |
        v
+---------------------------+
| Richards (Opus)           |  Phase 1: Classify the query
| Chair / Router            |          - subsystem (may be multi-subsystem)
+---------------------------+          - decision type (diagnose/design/plan/teach/repair)
        |                              - habitability impact (none/minor/major/critical)
        |                              - user level (beginner/intermediate/advanced)
        |
+---------------------------+
| Richards                  |  Phase 2: Habitability audit
| Sanitary engineering lens |          - If any critical habitability concern,
+---------------------------+            surface it FIRST and gate the rest of the
        |                                work on addressing it.
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Gilbreth  Waters    Child   Fisher-  Beecher   (Liebhardt
    (motion)  (plan)    (tech)  he       (history)  waits)
                                (sensory)
        |        |        |        |        |
    Phase 3: Specialists work in parallel on their slice
             of the query. Each produces a Grove record
             (HomeEconomicsAnalysis, HomeEconomicsPractice,
             HomeEconomicsExplanation, or HomeEconomicsReview).
             Richards activates only the relevant subset.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Richards (Opus)           |  Phase 4: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - surface habitability first
                         |                           - produce unified response
                         v
              +---------------------------+
              | Liebhardt (Sonnet)        |  Phase 5: Pedagogy wrap
              | Turn advice into practice |          - teaching sequence if needed
              +---------------------------+          - habit-formation if practice
                         |                           - documentation for durability
                         v
              +---------------------------+
              | Richards (Opus)           |  Phase 6: Record
              | Produce Session record    |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + HomeEconomicsSession Grove record
```

## Synthesis rules

Richards synthesizes the specialist outputs using these rules, analogous to the math department's investigation team synthesis:

### Rule 1 — Habitability precedes efficiency

If any specialist's work surfaces a habitability concern (mold, water, air, pest, thermal, sleep disruption), that concern is reported first in the synthesized response regardless of the user's original question. Efficiency and optimization come after habitability is addressed.

### Rule 2 — Budget is a hard input

If the user specified a budget, no recommendation that exceeds the budget is produced. Specialists who would produce over-budget advice are instructed to produce the best advice within budget instead. If the budget is truly insufficient, Richards surfaces that conflict honestly.

### Rule 3 — Converging findings are strengthened

When two or more specialists arrive at the same recommendation independently (e.g., Gilbreth recommends relocating the pantry for motion efficiency and Richards recommends relocating it for thermal reasons), the convergence is called out in the synthesis as a high-confidence finding.

### Rule 4 — Diverging findings are preserved and investigated

When specialists disagree (e.g., Waters recommends batch cooking on Sunday and Gilbreth recommends splitting into weekday micro-sessions), Richards does not force a reconciliation. Instead, the disagreement is surfaced with attribution, each specialist's reasoning is presented, and the user is asked to choose based on which constraint (time consolidation vs. daily flexibility) matters more.

### Rule 5 — Teaching is the default wrap

Unless the user explicitly asks for a one-off recommendation, Liebhardt wraps the response with a teaching or habit-formation frame. This is because home-economics advice that is not taught forward is fragile, and the department's founding argument is that household skill must be taught to persist.

### Rule 6 — User level governs presentation, not content

All specialist findings are included regardless of user level. Liebhardt adapts the presentation — simpler language, more scaffolding, worked examples for beginners; concise technical writing for advanced users. The content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language household question.
2. **Household context** (required). Number of eaters, ages, dietary constraints, budget, housing type, garden/market access.
3. **User level** (optional). Inferred if not provided.
4. **Prior HomeEconomicsSession hash** (optional). For follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Surfaces any habitability concerns first
- Directly answers the query
- Presents specialist findings with attribution
- Notes any unresolved conflicts or trade-offs
- Includes a teaching or habit-formation wrap from Liebhardt
- Suggests follow-up explorations

### Grove record: HomeEconomicsSession

```yaml
type: HomeEconomicsSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  subsystem: multi-subsystem
  decision_type: design
  habitability_impact: minor
  user_level: intermediate
agents_invoked:
  - richards
  - gilbreth
  - waters
  - child
  - fisher-he
  - beecher
  - liebhardt
work_products:
  - <grove hash of HomeEconomicsAnalysis>
  - <grove hash of HomeEconomicsPractice>
  - <grove hash of HomeEconomicsExplanation>
habitability_audit: pass
concept_ids:
  - home-meal-rotation
  - home-work-triangle
  - home-apprenticeship
user_level: intermediate
```

## Token and time cost

Approximate cost per full investigation:

- **Richards** — 2 Opus invocations (classify + synthesize), ~40K tokens
- **Gilbreth** — 1 Opus invocation, ~30K tokens
- **Fisher-he** — 1 Opus invocation, ~25K tokens
- **Waters, Child, Beecher, Liebhardt** — 4 Sonnet invocations, ~20K tokens each
- **Total** — 180-300K tokens, 5-15 minutes wall-clock

This cost is justified for multi-subsystem and overhaul-level problems. For single-subsystem problems, use the specialist directly or a focused team.

## Escalation paths

### Internal escalations

- **Habitability concern requires professional remediation** — Richards escalates to the user with a recommendation to call a licensed professional (mold, structural, CO, contaminated water). The team does not attempt to handle these within home economics.
- **Specialist reports budget infeasibility** — Richards surfaces the conflict honestly: the nutritional target or efficiency target cannot be met within the budget given.
- **Specialist disagreement persists after re-delegation** — Richards reports both findings with attribution and asks the user to decide.

### External escalations

- **Medical nutrition** — route to the nutrition department
- **Statistical analysis of food preferences** — route to the data-science department's `fisher` agent (not the home-economics `fisher-he` agent)
- **Structural repair** — route outside home economics
- **Legal or financial advice beyond household budgeting** — route to the relevant professional

## Configuration

```yaml
name: home-economics-analysis-team
chair: richards
specialists:
  - motion: gilbreth
  - sensory: fisher-he
  - history: beecher
  - technique: child
  - seasonal: waters
pedagogy: liebhardt

parallel: true
timeout_minutes: 15

# Richards may skip specialists whose subsystem is not relevant
auto_skip: true

# Habitability is always audited first
habitability_first: true
```

## Invocation

```
# Full overhaul
> home-economics-analysis-team: Our household is not working. Two adults, two kids (ages 8, 11), budget $800/month for food and household, we're always tired and the kitchen is chaos. Where do we start?

# New household
> home-economics-analysis-team: We just moved into a new apartment. Two of us, budget $60/week food, both work from home, want a functional kitchen and sustainable routines. Design the first month.

# Life-stage transition
> home-economics-analysis-team: We have a new baby and our current routines are collapsing. Two parents, newborn, no extended family nearby. What should we change?
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring medical, legal, structural, or financial-professional advice are handled at the boundary.
- Parallel specialists do not communicate during their working phase — convergence is measured only at the synthesis stage.
- Habitability issues requiring professional remediation are surfaced as referrals, not solutions.
- The team cannot replace a real professional inspection (mold, CO, structural), only point at the signals that warrant one.
