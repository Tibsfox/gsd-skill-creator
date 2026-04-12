---
name: design-team
type: team
category: technology
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/technology/design-team/README.md
description: Focused design evaluation and creation team combining human-centered design (Norman), systems architecture (Berners-Lee), infrastructure feasibility (Borg), and creative learning (Resnick). Use for design reviews, prototype evaluation, accessibility audits, and creating technology solutions where usability, technical feasibility, and learnability must all be addressed. Not for pure risk assessment, ethics analysis, or social impact evaluation.
superseded_by: null
---
# Design Team

Focused team for technology design work -- evaluating existing designs, creating new ones, and ensuring that designed solutions are usable, technically sound, accessible, and learnable. Pairs the HCI specialist with the systems architect, the infrastructure engineer, and the pedagogy guide.

## When to use this team

- **Design reviews** where a product or interface needs evaluation from usability, technical, and learnability perspectives simultaneously.
- **Prototype evaluation** where a design concept needs both HCI critique and technical feasibility assessment.
- **Accessibility audits** that need to consider both interface design (Norman) and infrastructure access (Borg).
- **Creating technology solutions** where the design must be usable (Norman), architecturally sound (Berners-Lee), technically feasible (Borg), and learnable (Resnick).
- **Learning environment design** where the tool must meet "low floors, high ceilings, wide walls" criteria and also work reliably.

## When NOT to use this team

- **Risk assessment** of emerging technologies -- use `joy` or `tech-assessment-team`.
- **Social impact analysis** -- use `ethics-team`.
- **Pure systems troubleshooting** -- use `borg` directly.
- **Full multi-perspective assessment** -- use `tech-assessment-team`.

## Composition

| Role | Agent | Focus | Model |
|------|-------|-------|-------|
| **HCI specialist** | `norman` | Usability, affordances, heuristic evaluation, accessibility | Sonnet |
| **Systems architect** | `berners-lee` | Information architecture, standards, web architecture | Opus |
| **Infrastructure** | `borg` | Technical feasibility, system constraints, infrastructure access | Opus |
| **Pedagogy** | `resnick` | Learnability, creative learning, low floors/high ceilings/wide walls | Sonnet |

Berners-Lee serves as both a specialist contributor (information architecture) and the team's coordinator.

## Orchestration flow

```
Input: design artifact + context + evaluation goals
        |
        v
+---------------------------+
| Berners-Lee (Opus)        |  Phase 1: Frame the design question
| Coordinator               |          - what is being designed/evaluated
+---------------------------+          - what constraints exist
        |                              - which perspectives are needed
        |
        +--------+--------+--------+
        |        |        |        |
        v        v        v        v
     Norman    Borg    Resnick  Berners-Lee
     (HCI)    (infra)  (learn)  (arch)
        |        |        |        |
    Phase 2: Specialists evaluate in parallel
             Norman: usability + accessibility
             Borg: technical feasibility + infrastructure
             Resnick: learnability + creative agency
             Berners-Lee: information architecture + standards
        |        |        |        |
        +--------+--------+--------+
                    |
                    v
         +---------------------------+
         | Berners-Lee (Opus)        |  Phase 3: Synthesize
         | Merge design evaluations  |          - unified assessment
         +---------------------------+          - prioritized recommendations
                    |
                    v
             Design report + Grove records
```

## Synthesis rules

### Rule 1 -- Usability over cleverness

When Norman identifies a usability problem and Berners-Lee identifies an elegant architectural solution that creates the problem, usability wins. Users interact with the interface, not the architecture.

### Rule 2 -- Feasibility is a hard constraint

When Borg identifies that a design requires infrastructure that does not exist or cannot be provided equitably, this is a blocking finding. Beautiful designs that cannot be built or deployed are not solutions.

### Rule 3 -- Learnability is a first-class requirement

When Resnick finds that a design has a high floor (difficult to start), this is a major finding, not a cosmetic note. Technology that people cannot learn to use is technology that excludes people.

### Rule 4 -- Concrete recommendations

The design team produces specific, actionable recommendations, not abstract critique. "Improve the navigation" is insufficient. "Add a persistent breadcrumb trail showing the user's location within the 3-level hierarchy" is actionable.

## Input contract

1. **Design artifact** (required). Interface description, prototype, product specification, or design brief.
2. **Context** (required). Users, environment, constraints, and goals.
3. **Evaluation goals** (optional). Specific aspects to focus on (usability, accessibility, feasibility, learnability).

## Output contract

### Primary output: Design report

A unified design assessment that:

- Evaluates the design from all four perspectives
- Identifies strengths and weaknesses
- Provides prioritized, actionable recommendations
- Notes any tension between perspectives (e.g., technical constraint vs usability ideal)

### Grove records

- **TechDesign** from Norman: usability evaluation and interaction design recommendations
- **TechAnalysis** from Borg: technical feasibility assessment
- **TechExplanation** from Resnick: learnability evaluation
- **TechDesign** from Berners-Lee: information architecture assessment
- **TechSession** from Berners-Lee: session record linking all work products

## Configuration

```yaml
name: design-team
chair: berners-lee
specialists:
  - hci: norman
  - infrastructure: borg
  - pedagogy: resnick

parallel: true
timeout_minutes: 10
auto_skip: false
min_specialists: 2
```

## Invocation

```
# Design review
> design-team: Review this library website redesign for usability, technical
  feasibility, and learnability. Users range from children to seniors.

# Prototype evaluation
> design-team: Evaluate this smart thermostat prototype. Target users are
  non-technical homeowners.

# Accessibility audit
> design-team: Audit this e-government portal for accessibility and digital equity.

# New design
> design-team: Design a community bulletin board system for a neighborhood with
  mixed technology literacy and limited broadband.
```
