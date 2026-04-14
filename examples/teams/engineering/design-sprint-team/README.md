---
name: design-sprint-team
type: team
category: engineering
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/engineering/design-sprint-team/README.md
description: Rapid concept development team for engineering design problems. Four agents -- Brunel (lead), Tesla, Roebling, Polya-E -- run a condensed design cycle from problem definition through concept selection. Optimized for speed and breadth of concept generation rather than deep analysis. Use for early-stage design exploration, concept generation, trade studies, and design problems where multiple alternatives must be evaluated quickly.
superseded_by: null
---
# Design Sprint Team

Rapid concept development team for engineering design problems. Runs a condensed design cycle from problem definition through concept selection, optimized for speed and breadth rather than depth.

## When to use this team

- **Early-stage design exploration** where the problem space is not well understood and multiple approaches need evaluation.
- **Concept generation** where the goal is to produce and compare several design alternatives before committing to detailed analysis.
- **Trade studies** requiring structured comparison of competing design concepts.
- **Time-constrained design** where a good-enough answer now is better than a perfect answer later.
- **Design brainstorming** that needs engineering rigor beyond pure brainstorming.
- **Feasibility assessment** for a new project or product idea.

## When NOT to use this team

- **Detailed structural or thermal analysis** -- use roebling or watt directly, or the engineering-review-team for multi-domain depth.
- **Safety-critical design review** -- use the engineering-review-team where all specialists participate.
- **Systems engineering and integration** -- use the systems-team for V-model and verification activities.
- **Manufacturing and materials deep dives** -- Lovelace-E is not on this team; for fabrication questions, route through Brunel to Lovelace-E directly.

## Composition

| Role | Agent | Contribution | Model |
|------|-------|-------------|-------|
| **Lead / Integrator** | `brunel` | Problem definition, concept integration, trade study leadership | Opus |
| **Electrical / Systems** | `tesla` | Electrical feasibility, systems-level thinking, control architecture | Opus |
| **Structural / Civil** | `roebling` | Structural feasibility, load path identification, material implications | Sonnet |
| **Pedagogy / Method** | `polya-e` | Problem-solving framework, communication of results, learning context | Sonnet |

This team deliberately omits Johnson-K (aerospace), Watt (mechanical/thermal), and Lovelace-E (materials). The sprint team favors breadth of concept generation over depth of analysis in any single domain. For problems requiring aerospace, thermal, or materials expertise, Brunel can escalate to the engineering-review-team or route to the specialist directly.

## Orchestration flow

```
Input: design problem + optional constraints + optional user level
        |
        v
+---------------------------+
| Brunel (Opus)             |  Phase 1: Frame the problem
| Lead                      |          - define need, constraints, success criteria
+---------------------------+          - identify design variables
        |                              - set evaluation criteria
        |
        +--------+--------+
        |        |        |
        v        v        v
     Tesla   Roebling  Polya-E
     (sys)   (struct)  (method)
        |        |        |
    Phase 2: Generate concepts
             Each agent proposes 2-3 design concepts
             from their perspective. Tesla thinks in
             systems and circuits. Roebling thinks in
             structures and loads. Polya-E ensures
             the concepts are well-framed.
        |        |        |
        +--------+--------+
                 |
                 v
      +---------------------------+
      | Brunel (Opus)             |  Phase 3: Compile and evaluate
      | Merge concepts            |          - Pugh matrix or trade study
      +---------------------------+          - identify best concepts
                 |                           - flag showstoppers
                 v
      +---------------------------+
      | Polya-E (Sonnet)          |  Phase 4: Document
      | Present results           |          - concept descriptions
      +---------------------------+          - comparison table
                 |                           - recommendation with rationale
                 v
          Design sprint output
          + EngineeringDesign Grove record
```

## Sprint Protocol

### Phase 1 -- Frame (5 minutes)

Brunel defines:
- **Need statement:** One sentence describing what the design must accomplish.
- **Constraints:** Non-negotiable boundaries (budget, size, weight, regulatory, schedule).
- **Evaluation criteria:** 4-6 criteria with relative weights for comparing concepts.
- **Design variables:** What can be changed (geometry, material, architecture, configuration).

### Phase 2 -- Generate (10 minutes)

Each specialist generates 2-3 concepts independently:
- **Tesla** generates concepts that emphasize system architecture, electrical/electronic solutions, and control strategies.
- **Roebling** generates concepts that emphasize structural efficiency, load path clarity, and constructability.
- **Polya-E** does not generate concepts but ensures the problem framing is clear and the concepts are comparable.

### Phase 3 -- Evaluate (5 minutes)

Brunel compiles all concepts into a Pugh matrix:
- Each concept scored against each criterion (better/same/worse than baseline, or numerical 1-5).
- Criteria weighted by importance.
- Showstoppers identified (any concept that violates a constraint is eliminated).
- Top 2-3 concepts advanced for recommendation.

### Phase 4 -- Document (5 minutes)

Polya-E produces a design sprint report:
- Problem statement and constraints
- Concepts considered (brief description of each)
- Evaluation matrix
- Recommended concept(s) with rationale
- Risks and next steps (what detailed analysis is needed before commitment)

## Input contract

1. **Design problem** (required). Description of the engineering need.
2. **Constraints** (optional but strongly recommended). Budget, size, weight, regulatory, schedule.
3. **User level** (optional). Defaults to intermediate.

## Output contract

### Primary output: Design sprint report

A structured report containing:
- Problem definition
- 4-8 design concepts with descriptions
- Evaluation matrix (Pugh or weighted scoring)
- Recommended concept(s)
- Risk assessment
- Next steps for detailed design

### Grove record: EngineeringDesign

```yaml
type: EngineeringDesign
sprint: true
problem_statement: <one-sentence need>
constraints:
  - <list of non-negotiable boundaries>
concepts:
  - name: <concept name>
    description: <brief description>
    proposed_by: <agent name>
    scores: {criterion_1: +, criterion_2: S, ...}
  - name: <concept name>
    ...
evaluation_matrix: <Pugh or weighted scoring results>
recommended: <concept name(s)>
rationale: <why this concept leads>
risks:
  - <identified risks>
next_steps:
  - <what detailed analysis is needed>
```

## Token / time cost

Approximate cost per sprint:

- **Brunel** -- 2 Opus invocations (frame + evaluate), ~30K tokens total
- **Tesla** -- 1 Opus invocation (concept generation), ~20K tokens
- **Roebling** -- 1 Sonnet invocation (concept generation), ~15K tokens
- **Polya-E** -- 1 Sonnet invocation (documentation), ~15K tokens
- **Total** -- 80-120K tokens, 3-8 minutes wall-clock

This is roughly one-third the cost of a full engineering-review-team session, making it appropriate for early-stage exploration where multiple sprints may be run on different problem framings.

## Configuration

```yaml
name: design-sprint-team
lead: brunel
specialists:
  - systems: tesla
  - structural: roebling
documentation: polya-e

parallel: true
timeout_minutes: 10
```

## Invocation

```
# Design sprint for a new product
> design-sprint-team: Design concepts for a portable water filtration system
  for disaster relief. Constraints: must weigh under 5 kg, cost under $50 to
  manufacture, filter 1000 liters between replacements.

# Early-stage exploration
> design-sprint-team: We need to span a 15-meter gap for pedestrian traffic
  in a park. Budget is $75K. What are our options?

# Trade study
> design-sprint-team: Compare three approaches to mounting solar panels on a
  residential roof: flush-mount, tilted rack, and building-integrated.
```

## Limitations

- The sprint team prioritizes speed over depth. Concepts are feasibility-level, not detailed designs.
- No materials specialist (Lovelace-E) on the team -- manufacturability is assessed at a high level only.
- No aerospace specialist (Johnson-K) -- aerospace-specific problems should use the systems-team or the full review team.
- No thermal/mechanical specialist (Watt) -- thermal analysis is flagged as a next step rather than resolved in the sprint.
- The output is a starting point for detailed design, not a finished design.
