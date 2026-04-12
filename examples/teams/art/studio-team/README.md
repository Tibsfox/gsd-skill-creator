---
name: studio-team
type: team
category: art
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/art/studio-team/README.md
description: Focused studio practice team for hands-on art-making guidance. O'Keeffe leads observational work and the observation-to-abstraction continuum, Hokusai provides compositional structure and design principles, Kahlo brings expression and personal meaning, and Lowenfeld calibrates instruction to the learner's developmental stage and facilitates process. Use for guided studio projects, observational drawing sessions, painting exercises, creative problem-solving in any medium, and teaching art-making skills at any level. Not for art-historical analysis, conceptual art evaluation, or pure color theory.
superseded_by: null
---
# Studio Team

A focused four-agent team for hands-on art-making instruction and guided studio practice. O'Keeffe leads observation-based work, Hokusai provides compositional structure, Kahlo brings personal expression and meaning, and Lowenfeld calibrates everything to the learner's developmental level. This team mirrors the `proof-workshop-team` pattern: a focused expertise group optimized for a specific class of work rather than broad analysis.

## When to use this team

- **Guided studio projects** -- "Walk me through painting a landscape from observation," "Help me develop a self-portrait series."
- **Observational drawing sessions** -- structured practice with warm-ups, sustained drawing, and reflection.
- **Painting and mixed-media exercises** -- technique instruction with compositional and expressive guidance.
- **Creative problem-solving** -- "I'm stuck on this painting. What should I try next?"
- **Art-making at any level** -- Lowenfeld ensures the instruction matches the learner.
- **Studio critique during process** -- feedback on work-in-progress rather than finished pieces.

## When NOT to use this team

- **Art-historical analysis** with no studio component -- use `art-critique-team`.
- **Conceptual art evaluation** or contemporary art interpretation -- use Ai Weiwei directly or `art-critique-team`.
- **Pure color theory** experiments with no studio application -- use Albers directly.
- **Comprehensive multi-perspective critique** of finished work -- use `art-critique-team`.

## Composition

| Role | Agent | Focus | Model |
|------|-------|-------|-------|
| **Observation lead** | `okeefe` | Sustained looking, observation-to-abstraction, perceptual methods | Opus |
| **Composition guide** | `hokusai` | Spatial organization, design principles, arrangement of elements | Sonnet |
| **Expression guide** | `kahlo` | Personal meaning, symbolism, authenticity, emotional honesty | Opus |
| **Pedagogy facilitator** | `lowenfeld` | Developmental calibration, process facilitation, critique method | Sonnet |

Two Opus agents (O'Keeffe, Kahlo) handle the interpretive and perceptual tasks. Two Sonnet agents (Hokusai, Lowenfeld) handle the structural and facilitation tasks.

## Orchestration flow

```
Input: studio task or creative problem + user level
        |
        v
+---------------------------+
| O'Keeffe (Opus)           |  Phase 1: Observation
| What do we see?            |          - sustained looking
+---------------------------+          - perceptual analysis
        |                              - subject characteristics
        |
        +--------+--------+
        |        |        |
        v        v        v
    Hokusai    Kahlo   (O'Keeffe
    (compose)  (express) continues)
        |        |        |
    Phase 2: Specialists work in parallel
             Hokusai: compositional options
             Kahlo: expressive possibilities
             O'Keeffe: abstraction strategies
        |        |        |
        +--------+--------+
                 |
                 v
        +---------------------------+
        | Lowenfeld (Sonnet)        |  Phase 3: Synthesize & calibrate
        | Developmental calibration |          - merge specialist guidance
        +---------------------------+          - adapt to learner level
                 |                             - structure as studio exercise
                 v
          Studio guidance output
          + ArtSession Grove record
```

The studio team uses O'Keeffe as the entry point rather than Leonardo because the team is always observation-first. Leonardo routes to the studio team; the studio team starts with seeing.

## Studio Session Structure

A typical studio-team session follows this structure:

### Warm-up (10-15 minutes)
Led by O'Keeffe. Observational exercises: blind contour, gesture drawing, negative space. Calibrated by Lowenfeld for the learner's level.

### Exploration (15-20 minutes)
All three specialists contribute. O'Keeffe: what to observe in the subject. Hokusai: thumbnail compositions (at least 3 options). Kahlo: what personal connection or meaning can the student bring?

### Execution guidance (sustained)
The team provides guidance during the making process. O'Keeffe: "Look at the subject again -- is this edge accurate?" Hokusai: "Your focal point has drifted -- return to the composition plan." Kahlo: "What are you trying to express with this choice? Lean into that."

### Reflection (10 minutes)
Lowenfeld facilitates. Four-step critique protocol adapted for self-reflection: Describe what you made. Analyze the formal decisions. Interpret the meaning that emerged. Evaluate what worked and what to try differently next time.

## Input contract

The team accepts:

1. **Studio task** (required). A creative project, art-making exercise, or studio problem.
2. **User level** (required). One of: `beginner`, `intermediate`, `advanced`, `professional`.
3. **Medium** (optional). The materials or tools being used.
4. **Prior ArtSession hash** (optional). For continuing a multi-session project.

## Output contract

### Primary output: Studio guidance

A structured response that:

- Begins with an observation exercise relevant to the task
- Provides compositional options
- Suggests expressive directions
- Adapts all guidance to the learner's level
- Includes specific next steps

### Grove record: ArtSession

Lowenfeld produces an ArtSession record linking all guidance to the college concept graph.

## Configuration

```yaml
name: studio-team
lead: okeefe
specialists:
  - composition: hokusai
  - expression: kahlo
pedagogy: lowenfeld

parallel: true
timeout_minutes: 15
auto_skip: false
min_specialists: 2
```

## Invocation

```
# Guided studio session
> studio-team: Guide me through painting a still life with three objects and
  one light source. Medium: acrylic on canvas. Level: intermediate.

# Observational drawing
> studio-team: Design a one-hour observational drawing session for beginners
  using only pencil and paper. Level: beginner.

# Creative problem-solving
> studio-team: I'm painting a self-portrait and the face looks flat despite
  correct proportions. What should I try? Level: intermediate.

# Multi-session project
> studio-team: (session: grove:abc123) Continue the landscape series.
  Today I want to work on the third painting — the cliff at sunset. Level: advanced.
```
