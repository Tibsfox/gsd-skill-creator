---
name: spatial-computing-practice-team
type: team
category: spatial-computing
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/spatial-computing/spatial-computing-practice-team/README.md
description: Pipeline four-agent team for prototyping AR/VR experiences end-to-end — Azuma designs registration and tracking, Furness designs comfort and HMD budget, Bret Victor designs direct-manipulation interaction, and Papert-sp produces the learning pathway and onboarding tutorial. Runs sequentially as a design pipeline for professional AR/VR prototypes. Use for building AR/VR prototypes from scratch, producing reference implementations, or translating a concept into an executable spec. Not for pure review, directness-only critique, or multi-wing analysis.
superseded_by: null
---
# Spatial Computing Practice Team

Pipeline team for prototyping professional AR/VR experiences end-to-end. Four agents run sequentially, each building on the previous agent's output, to turn a concept into an executable specification. This team mirrors the `discovery-team` pipeline: one agent's output flows into the next rather than running in parallel.

## When to use this team

- **Building AR/VR prototypes** from a concept description to a buildable spec
- **Producing reference implementations** that other teams can adapt
- **Translating a concept into an executable spec** — concrete enough for a developer to implement
- **Professional AR/VR prototypes** where registration, comfort, interaction, and onboarding all matter
- **Training system design** where the output needs a real tutorial and validation plan

## When NOT to use this team

- **Pure review** of an existing artifact — use `spatial-computing-workshop-team`
- **Directness-only critique** — use `spatial-computing-workshop-team` with Bret-victor leading
- **Multi-wing analysis** where the wing is not known — use `spatial-computing-analysis-team`
- **Voxel building or Minecraft education** — these are handled by specialist agents directly without the AR/VR pipeline overhead
- **Non-AR/VR spatial computing** (pure desktop CAD, 2D design tools)

## Composition

Four agents running sequentially as a pipeline:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Stage 1 — AR tracking designer** | `azuma` | Registration budget, tracking stack, calibration | Sonnet |
| **Stage 2 — VR/HMD designer** | `furness` | Comfort, frame rate budget, hardware, session length | Sonnet |
| **Stage 3 — Interaction designer** | `bret-victor` | Direct manipulation, feedback loops, discoverability | Opus |
| **Stage 4 — Pedagogy / Onboarding** | `papert-sp` | Tutorial design, learning pathway, constructionist exercises | Sonnet |

One Opus agent (Bret-victor) because interaction design is the stage that most benefits from deep reasoning. Three Sonnet agents because their tasks are well-defined and follow established engineering protocols.

Note: This team does not include the department chair (Sutherland) in its core flow. The pipeline assumes Sutherland has already classified the query and delegated it. Sutherland may be invoked at the end for final synthesis and Grove record production if the user wants a CAPCOM-polished response.

## Orchestration flow

```
Input: concept description + target platform + user population + session constraints
        |
        v
+---------------------------+
| Azuma (Sonnet)            |  Stage 1: Registration and tracking
| AR tracking designer      |          - specify tracking requirements
+---------------------------+          - select tracking stack
        |                              - calibration protocol
        |                              - failure mode anticipation
        |                              - OUTPUT: tracking spec
        v
+---------------------------+
| Furness (Sonnet)          |  Stage 2: Comfort and hardware
| VR/HMD designer           |          - hardware selection
+---------------------------+          - frame rate and latency budget
        |                              - comfort options
        |                              - session length discipline
        |                              - OUTPUT: comfort spec
        v
+---------------------------+
| Bret-victor (Opus)        |  Stage 3: Interaction design
| Interaction designer      |          - direct-manipulation principles
+---------------------------+          - feedback loop design
        |                              - discoverability
        |                              - OUTPUT: interaction spec
        v
+---------------------------+
| Papert-sp (Sonnet)        |  Stage 4: Onboarding and learning
| Pedagogy / Tutorial       |          - tutorial flow
+---------------------------+          - constructionist onboarding
        |                              - learning pathway
        |                              - OUTPUT: onboarding spec
        v
         Final executable prototype spec
         + four linked Grove records
         (one per stage)
```

The pipeline is strictly sequential because later stages depend on decisions from earlier stages. Bret-victor's interaction design must respect Furness's comfort constraints. Papert-sp's onboarding must introduce the interactions Bret-victor specified.

## Stage protocols

### Stage 1 — Azuma: Tracking spec

Azuma produces:

- Registration requirements (linear mm, angular deg, latency ms)
- Tracking stack selection with justification
- Calibration protocol (per-install, per-user, re-calibration cadence)
- Failure modes and mitigations specific to the environment
- Display configuration (OST, VST, projection, handheld)

Output: `SpatialComputingDesign` Grove record — "AR tracking spec for [concept]"

### Stage 2 — Furness: Comfort spec

Furness builds on Azuma's spec:

- Hardware selection consistent with tracking requirements
- Frame rate target (90 Hz minimum) and latency budget (under 20 ms)
- Comfort options (teleport, vignettes, seated mode)
- Session length caps and break schedule
- Safety considerations (chaperone, physical hazards)
- Validation plan — how will success be measured

Output: `SpatialComputingDesign` Grove record — "Comfort and hardware spec for [concept]"

### Stage 3 — Bret-victor: Interaction spec

Bret-victor builds on Azuma and Furness:

- Direct-manipulation interaction flows for the primary tasks
- Feedback loops (visual, audio, haptic)
- Eliminate tool modes wherever possible
- Selection and manipulation techniques compatible with comfort spec
- Discoverability — how the user learns the controls without a manual

Output: `SpatialComputingDesign` Grove record — "Interaction spec for [concept]"

### Stage 4 — Papert-sp: Onboarding spec

Papert-sp produces the tutorial and learning pathway:

- First-run tutorial (constructionist — build something in the first five minutes)
- Prerequisite check and remediation
- Exercise sequence for mastery
- Assessment through artifacts (not multiple-choice)
- Bridge from tutorial to full experience

Output: `SpatialComputingExplanation` Grove record — "Onboarding and tutorial for [concept]"

## Input contract

The team accepts:

1. **Concept description** (required). Natural language description of what the prototype should do.
2. **Target platform** (required). Specific hardware class or platform.
3. **User population** (required). Who will use the prototype and their prior experience.
4. **Session constraints** (required). Session length, frequency, environment.
5. **Validation goals** (optional). How success will be measured.

## Output contract

### Primary output: Executable prototype spec

A four-part specification that a development team can implement:

1. Tracking spec (Stage 1, Azuma)
2. Comfort and hardware spec (Stage 2, Furness)
3. Interaction spec (Stage 3, Bret-victor)
4. Onboarding spec (Stage 4, Papert-sp)

Each part is a standalone Grove record, but the four are linked as a pipeline and should be read together.

### Grove records

```yaml
type: SpatialComputingSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
pipeline: spatial-computing-practice-team
stages:
  - stage: 1
    agent: azuma
    record: <grove hash>
  - stage: 2
    agent: furness
    record: <grove hash>
  - stage: 3
    agent: bret-victor
    record: <grove hash>
  - stage: 4
    agent: papert-sp
    record: <grove hash>
concept_ids:
  - <relevant college concept IDs>
```

## Escalation paths

- **When Stage 1 (Azuma) concludes tracking is not feasible**: halt the pipeline, escalate to `spatial-computing-analysis-team` for alternative approaches.
- **When Stage 2 (Furness) concludes the concept cannot run at 90 Hz on the target hardware**: either reduce scope (send back to Stage 1 with reduced tracking requirements) or escalate to analysis team for hardware change.
- **When Stage 3 (Bret-victor) finds the comfort constraints make direct manipulation impossible**: flag the trade-off; the user chooses whether to relax comfort or accept indirect interaction.
- **When Stage 4 (Papert-sp) concludes the interaction is un-learnable for the target population**: send back to Stage 3 for interaction simplification.

## Token / time cost

- **Stage 1 (Azuma)** — 1 Sonnet invocation, ~25K tokens
- **Stage 2 (Furness)** — 1 Sonnet invocation, ~25K tokens
- **Stage 3 (Bret-victor)** — 1 Opus invocation, ~40K tokens
- **Stage 4 (Papert-sp)** — 1 Sonnet invocation, ~20K tokens
- **Total** — ~110K tokens, 4-10 minutes wall-clock

Comparable cost to the workshop team but produces a buildable spec rather than a review. Good for turning concepts into action.

## Configuration

```yaml
name: spatial-computing-practice-team
pipeline:
  - stage: 1
    agent: azuma
  - stage: 2
    agent: furness
  - stage: 3
    agent: bret-victor
  - stage: 4
    agent: papert-sp

sequential: true
allow_back_edges: true  # later stages can send back to earlier stages
timeout_minutes: 10
```

## Invocation

```
# Build a prototype spec
> spatial-computing-practice-team: Build a prototype spec for an AR maintenance
  training system for HVAC technicians on the HoloLens 2 platform. Session length
  30 min, population mixed experience.

# Translate a concept
> spatial-computing-practice-team: Translate this concept doc into an executable
  VR prototype spec for a Meta Quest Pro. [attached concept]

# Reference implementation
> spatial-computing-practice-team: Produce a reference spec for a VR museum
  walkthrough that other cultural institutions can adapt.
```

## Limitations

- The pipeline produces specs, not running code. Implementation still requires engineering.
- Back-edges (a later stage sending back to an earlier one) add iteration cost; expect 1-2 back-edges per run.
- The pipeline assumes the concept is valid AR/VR territory; it does not evaluate whether spatial computing is the right approach. Use `spatial-computing-analysis-team` for that question first.
- The team does not include Krueger or Engelbart; for responsive-environment or augmentation-value questions, use the workshop or analysis teams.
