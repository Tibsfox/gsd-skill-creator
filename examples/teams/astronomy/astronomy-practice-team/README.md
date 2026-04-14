---
name: astronomy-practice-team
type: team
category: astronomy
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/astronomy/astronomy-practice-team/README.md
description: Four-agent practice pipeline for the observation-to-analysis workflow. Caroline Herschel plans the observation and identifies the field, Chandrasekhar-astro handles any orbital or dynamical computation, Payne-Gaposchkin reduces any spectroscopic data to physical parameters, and Tyson turns the whole thing into a learning session for the user. Use for teaching observational astronomy, running guided sky sessions, first-light reductions, and practice-based learning that starts with looking up and ends with understanding. Not for pure theory, dark-matter dynamics, or cosmological scale problems.
superseded_by: null
---
# Astronomy Practice Team

A four-agent practice-pipeline team for the observation-to-analysis workflow. This team answers the question "I went outside and looked at something — now what?" It runs sequentially, starting from the observation itself and ending with an understanding the user can take back to the next session. The team mirrors the `discovery-team` pattern from the math department: a focused pipeline optimized for hands-on learning rather than broad investigation.

## When to use this team

- **Observational practice sessions** — a user is learning to observe and wants guided walk-throughs that turn each session into a learning event.
- **First-light reductions** — a new piece of equipment, first data, need to turn numbers into knowledge.
- **Citizen science onboarding** — a beginner wants to contribute to variable-star monitoring, meteor counts, or comet observations.
- **Classroom lab sessions** — a teacher running a student observing assignment.
- **Observation-driven learning** — a specific observation triggers a cascade of "why does it look like that?" questions.
- **Comet and asteroid tracking** — planning nightly observations, computing positions, confirming detections.
- **Variable-star work** — period determination, light-curve construction, comparison with catalog.
- **Iterative observing skill building** — multi-night programs where each session improves technique.

## When NOT to use this team

- **Pure theory or modeling** — use `astronomy-workshop-team` for stellar physics, `astronomy-analysis-team` for cosmology and dynamics.
- **Dark matter and galaxy rotation** — use `rubin` directly.
- **Deep nucleosynthesis interpretation** — use `burbidge` directly or the workshop team.
- **Cosmology and distance-ladder work** — use `hubble` or the analysis team.
- **Research-level open problems** — use the analysis team for full coverage.
- **Pure observing planning with no analysis** — use `caroline-herschel` directly.

## Composition

The team runs four agents in sequence:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Observation lead** | `caroline-herschel` | Plan, identify, catalog | Sonnet |
| **Dynamics computation** | `chandrasekhar-astro` | Orbital mechanics, ephemeris | Opus |
| **Spectral reduction (optional)** | `payne-gaposchkin` | Classification if spectra are collected | Opus |
| **Pedagogy** | `tyson` | Learning synthesis | Sonnet |

Caroline Herschel leads because every practice session starts at the sky. Chandrasekhar-astro handles positions, trajectories, and any orbital-mechanics computation the session requires. Payne-Gaposchkin activates only when the session includes spectroscopy. Tyson closes the loop by turning the experience into a learning event.

Note: Hubble classifies the query and dispatches to this team but does not participate in the internal pipeline. The team runs directly once activated.

## Orchestration flow

```
Input: observational goal + observer context + equipment
        |
        v
+---------------------------+
| Caroline Herschel (Sonnet)|  Phase 1: Plan or identify
| Observation lead          |          - build session plan or identify field
+---------------------------+          - targets with visibility windows
        |                              - star-hop instructions if applicable
        v
+---------------------------+
| Chandrasekhar-astro (Opus)|  Phase 2: Dynamics (if needed)
| Orbital computation       |          - predict positions over observing run
+---------------------------+          - trajectory for comets and asteroids
        |                              - ephemeris table if requested
        v
+---------------------------+
| Payne-Gaposchkin (Opus)   |  Phase 3: Spectral reduction (if data exist)
| Spectroscopy              |          - classify any collected spectra
+---------------------------+          - RV measurement if relevant
        |                              - composition if S/N allows
        |   (skipped if no spectra)
        v
+---------------------------+
| Tyson (Sonnet)            |  Phase 4: Learning synthesis
| Pedagogy                  |          - what the session taught
+---------------------------+          - skills developed
        |                              - next-session recommendations
        v
         Final response to user
         + linked Grove records
```

## Why this sequence

- **Observation first.** Nothing happens without looking. Caroline Herschel ensures the observation is feasible, identifies what was seen, and catalogs the result.
- **Dynamics second.** If the session involves moving objects (comets, planets, asteroids, the Moon), Chandrasekhar-astro's orbital computation turns catalog positions into a trackable plan.
- **Spectroscopy third, optionally.** If the user collected spectra, Payne-Gaposchkin reduces them. This phase is skipped when the session is visual only.
- **Pedagogy last.** Tyson closes the loop by turning the raw session into a learning event — what was practiced, what was learned, what to do next.

## Synthesis rules

### Rule 1 — Feasibility anchors the plan

If Caroline Herschel determines the observation is infeasible (target below horizon, Moon too bright, equipment inadequate), the pipeline halts and a revised plan is offered. The team does not pretend that infeasible observations are productive.

### Rule 2 — Physical interpretation respects the data

Chandrasekhar-astro and Payne-Gaposchkin report physical quantities consistent with the data quality. A visual observation yields position and brightness estimate, not absolute magnitude or composition. A spectrum at S/N 15 does not support abundance analysis.

### Rule 3 — Learning is always a deliverable

Tyson's output always includes at least one explicit learning point — a technique mastered, a misconception corrected, a next step identified. Practice sessions that produce only data without reflection miss the point.

### Rule 4 — Iterative sessions compound

When a session follows a prior AstronomySession, Tyson explicitly references what was learned last time and frames the current session as a step forward. This turns isolated observations into a coherent learning trajectory.

## Input contract

The team accepts:

1. **Observational goal** (required). What the user wants to observe.
2. **Observer context** (required). Latitude, longitude, date/time, equipment.
3. **User level** (required). One of: `beginner`, `intermediate`, `advanced`, `graduate`.
4. **Data** (optional). Existing observations, images, spectra from a prior session.
5. **Prior session hash** (optional). Previous AstronomySession for continuity.

## Output contract

### Primary output: Session record with learning reflection

A unified result that includes:

- Observation plan or record
- Any computed positions and ephemerides
- Any reduced spectroscopic data
- Identifications and measurements
- Learning reflection — what the session achieved, what to try next
- Recommended follow-up

### Grove records

Each phase produces its own record:

- **AstronomyObservation (plan)** — Caroline Herschel's session plan
- **AstronomyAnalysis (orbital)** — Chandrasekhar-astro's ephemerides if applicable
- **AstronomyAnalysis (spectral)** — Payne-Gaposchkin's reductions if applicable
- **AstronomyExplanation (learning)** — Tyson's synthesis

All records link to a parent AstronomySession record.

## Escalation paths

### Internal escalations

- **Caroline Herschel reports target unobservable** — Halt main pipeline, offer alternatives.
- **Chandrasekhar-astro finds orbit prediction uncertainty too large** — Request better orbital elements or fresh observation.
- **Payne-Gaposchkin cannot reduce spectra due to data quality** — Report honestly; the session still has value for technique-building.

### External escalations

- **User wants deep stellar physics on an observed target** — Escalate to `astronomy-workshop-team`.
- **User observes something that needs full multi-wing analysis** — Escalate to `astronomy-analysis-team`.
- **User wants cosmological context** — Escalate to `hubble` directly.

## Token / time cost

Approximate cost per session:

- Caroline Herschel (Sonnet): ~20K tokens
- Chandrasekhar-astro (Opus): ~20-40K tokens (when active)
- Payne-Gaposchkin (Opus): ~30-50K tokens (when active, with spectra)
- Tyson (Sonnet): ~20K tokens
- **Total:** 60-130K tokens, 3-8 minutes wall-clock

Cheaper than the workshop and analysis teams because the computational and spectroscopic phases are often skipped in beginner sessions.

## Configuration

```yaml
name: astronomy-practice-team
lead: caroline-herschel
specialists:
  - observation: caroline-herschel
  - dynamics: chandrasekhar-astro
  - spectroscopy: payne-gaposchkin
pedagogy: tyson

parallel: false  # sequential pipeline
timeout_minutes: 10

# Spectroscopy phase runs only when user provides spectra
optional_phases:
  - spectroscopy

# Learning reflection always emitted
always_emit_explanation: true
```

## Invocation

```
# Beginner practice session
> astronomy-practice-team: I'm at 47N 122W, have 7x50 binoculars, and want to
  spend two hours tonight learning my way around the summer sky. Level: beginner.

# Comet tracking program
> astronomy-practice-team: Plan a two-week observation program for comet
  C/2024 XYZ from my backyard. Include nightly position predictions and what
  I should look for. Level: intermediate.

# Variable star follow-up
> astronomy-practice-team: I observed delta Cephei nightly for two weeks and
  recorded brightness estimates. Reduce to a light curve and tell me what I
  can learn from the pattern. Level: intermediate.

# Multi-session continuity
> astronomy-practice-team: (session: grove:abc123) Continue the learning
  trajectory from last week. Level: beginner.
```

## Limitations

- The team does not replace a planetarium or ephemeris software — it sits on top of them. Bash invocations of skyfield/Astropy handle the numerical work.
- Spectral reduction phase is only as good as the spectra provided. Beginner equipment typically cannot support spectroscopic analysis.
- The pipeline is sequential — longer than a single-agent query but shorter than a parallel multi-wing investigation. Appropriate for practice, not deep research.
- The team assumes the user is present and engaged. It does not produce autonomous observing plans for a robotic telescope.
- Weather is not modeled. Caroline Herschel plans based on clear-sky assumptions and warns about Moon phase only.
