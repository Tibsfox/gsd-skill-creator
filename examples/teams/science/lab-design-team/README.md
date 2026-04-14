---
name: lab-design-team
type: team
category: science
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/science/lab-design-team/README.md
description: Focused experimental design and laboratory science team combining McClintock (experimental design), Wu (measurement precision), Darwin (synthesis), and Pestalozzi (pedagogical adaptation). Use for designing controlled experiments, reviewing experimental protocols, specifying measurement procedures, or teaching experimental design through hands-on activities. Not for field observation, science communication, or methodological philosophy.
superseded_by: null
---
# Lab Design Team

Focused experimental design team for laboratory science. Combines the experimental intuition of McClintock, the measurement precision of Wu, the synthesis capability of Darwin, and the pedagogical design of Pestalozzi into a team optimized for designing, reviewing, and teaching controlled experiments.

## When to use this team

- **Designing controlled experiments** that require both careful variable control and precise measurement protocols.
- **Reviewing experimental protocols** for confounds, measurement adequacy, and sample size.
- **Teaching experimental design** through hands-on activities where students learn by designing and critiquing experiments.
- **Measurement specification** -- when an experiment needs a detailed measurement protocol with error analysis alongside the experimental design.
- **Power analysis and sample planning** -- when the team needs to determine appropriate sample sizes and measurement precision before starting.

## When NOT to use this team

- **Field observation studies** -- use `goodall` directly or the full `science-investigation-team`.
- **Science communication** -- use `communication-team`.
- **Methodological evaluation** of existing published work -- use `feynman-s` directly.
- **Full multi-domain investigations** -- use `science-investigation-team`.
- **Simple measurement questions** -- use `wu` directly.

## Composition

| Role | Agent | Contribution | Model |
|------|-------|-------------|-------|
| **Chair / Synthesizer** | `darwin` | Classifies query, orchestrates workflow, synthesizes outputs | Opus |
| **Experimental design** | `mcclintock` | Variable identification, control design, confound analysis, protocol construction | Opus |
| **Measurement precision** | `wu` | Measurement protocol, error analysis, significant figures, precision sufficiency | Sonnet |
| **Pedagogy** | `pestalozzi` | Level-appropriate activity design, hands-on experiments for learners | Sonnet |

Two Opus agents (Darwin, McClintock) handle the deep reasoning tasks. Two Sonnet agents (Wu, Pestalozzi) handle the well-defined precision and pedagogy tasks.

## Orchestration flow

```
Input: experimental design request + context + constraints
        |
        v
+---------------------------+
| Darwin (Opus)             |  Phase 1: Classify
| What kind of design       |          - new design vs. review
| request is this?          |          - complexity level
+---------------------------+          - pedagogical component needed?
        |
        +--------+--------+
        |        |        |
        v        v        v
  McClintock    Wu    (Pestalozzi
  (design)   (measure)   waits if
        |        |     not pedagogical)
    Phase 2: Parallel design
             McClintock: full experimental protocol
             Wu: measurement specifications for each DV
        |        |
        +--------+
             |
             v
  +---------------------------+
  | Darwin (Opus)             |  Phase 3: Integrate
  | Merge protocol + measures |          - ensure measurement precision
  +---------------------------+          matches design requirements
             |                           - resolve any conflicts
             v
  +---------------------------+
  | Pestalozzi (Sonnet)       |  Phase 4: Adapt (if pedagogical)
  | Level-appropriate version |          - create hands-on activity
  +---------------------------+          - add scaffolding
             |
             v
      Final integrated design
      + ExperimentalDesign Grove record
```

## Collaboration protocol

### McClintock-Wu handoff

This is the team's core collaboration. McClintock designs the experiment (what to manipulate, what to measure, what to control). Wu specifies how to measure the dependent variable with the precision the experiment requires. The handoff works in both directions:

- **Design-first:** McClintock produces a protocol. Wu evaluates whether the specified measurements can achieve the precision needed to detect the expected effect size. If not, Wu recommends instrument upgrades, increased replication, or adjusted precision targets.
- **Measurement-first:** Wu analyzes the available measurement tools and their precision limits. McClintock designs the experiment within those measurement constraints.

### Darwin's integration role

Darwin ensures that McClintock's protocol and Wu's measurement specifications are consistent. If McClintock designs an experiment requiring 0.01 mm precision but Wu determines the available instruments achieve only 0.1 mm, Darwin flags the gap and requests resolution.

### Pestalozzi's pedagogical layer

When the request has a teaching component, Pestalozzi receives the integrated design from Darwin and transforms it into a learning activity. The scientific rigor is preserved; the framing, scaffolding, and activity structure are adapted for the target learner level.

## Input contract

1. **Research question or design request** (required). What experiment needs to be designed, what protocol needs to be reviewed, or what design concept needs to be taught.
2. **Constraints** (optional). Available materials, instruments, time, budget, safety considerations, ethical boundaries.
3. **User level** (optional). If pedagogical adaptation is needed.

## Output contract

### Primary output: Integrated experimental design

An ExperimentalDesign Grove record that combines:

- McClintock's experimental protocol (variables, controls, procedure, confound analysis)
- Wu's measurement specification (instrument, calibration, precision, error budget)
- Pestalozzi's learning activity (if pedagogical component was requested)

### Secondary output: ScienceSession

A session record linking all work products for audit trail and follow-up.

## Invocation

```
# Design a controlled experiment
> lab-design-team: Design a controlled experiment to test whether salt concentration
  affects the germination rate of radish seeds. Available: 100 radish seeds, distilled
  water, table salt, petri dishes, ruler, balance.

# Review a protocol
> lab-design-team: Review this experimental protocol for testing antibiotic
  effectiveness. [attached protocol]

# Pedagogical design
> lab-design-team: Design a hands-on experiment for 7th graders that teaches the
  concept of controlled variables using plant growth. Level: beginner.

# Precision planning
> lab-design-team: We want to detect a 5% difference in reaction rates. What
  measurement precision do we need, and how should we design the experiment?
```

## Limitations

- The team does not handle field observation (Goodall's domain) or methodological philosophy (Feynman-S's domain).
- Communication of results to public audiences is outside scope (use communication-team).
- The team designs experiments but does not execute them or analyze resulting data (use the full investigation team or individual specialists for post-experiment analysis).
