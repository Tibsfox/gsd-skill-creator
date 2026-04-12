---
name: materials-practice-team
type: team
category: materials
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/materials/materials-practice-team/README.md
description: Pipeline-oriented practice team for ongoing characterization, process qualification, and continuous materials improvement. Pairs Cort (process history) with Merica (nonferrous metallurgy) and Cottrell (characterization and pedagogy) to handle recurring questions that show up in a production environment — grade qualification, incoming inspection, characterization planning, and closing the loop between specification and delivery. Use for ongoing operational improvement, not for one-shot design decisions or failure diagnosis.
superseded_by: null
---
# Materials Practice Team

Pipeline-oriented practice team for the Materials Department. Handles the recurring work that happens when a materials operation is running: grade qualification, incoming inspection planning, characterization of representative samples, and the ongoing refinement of specifications against delivered material.

## When to use this team

- **Ongoing grade qualification** — when a supplier has been approved for a grade but each new lot needs verification.
- **Process-qualification programs** — when a new mill, a new supplier, or a new melt practice must be qualified against an existing specification.
- **Characterization planning** — when a sample needs to be examined and the question is which techniques are appropriate and what they should find.
- **Incoming inspection programs** — when material arrives and decisions must be made about what tests, at what frequency, with what acceptance criteria.
- **Specification refinement** — when a specification is producing too many borderline-failing parts and the engineer needs to understand whether the specification or the delivered material is the problem.
- **Process-audit support** — when a process-history review of a supplier is needed before ordering a critical batch.

## When NOT to use this team

- **One-shot design decisions** — use `materials-workshop-team`.
- **Pure failure analysis** — use `gordon` directly or `materials-analysis-team`.
- **Research-level selection or characterization** — use `materials-analysis-team`.
- **Nanomaterials questions** — use `smalley` directly.

## Composition

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Process historian** | `cort` | Process-route recognition, grade history, era-appropriate specification | Sonnet |
| **Light-metals specialist** | `merica` | Aluminum, nickel, and age-hardenable alloys at grade level | Sonnet |
| **Characterization and pedagogy** | `cottrell` | Technique selection, microstructure interpretation, level adaptation | Sonnet |
| **Chair (when escalation needed)** | `bessemer` | Classification, escalation to full department | Opus |

The core team is three Sonnet agents for throughput. Bessemer is optionally invoked only when the recurring work surfaces a question the core team cannot answer — a new subdomain, an unexpected failure, a policy decision about whether a borderline lot can be accepted.

## Orchestration flow

The practice team does not run a single-shot orchestration; it runs a repeating pipeline.

```
         Incoming sample / question / batch
                       |
                       v
           +---------------------------+
           | Cort (Sonnet)             |  Stage 1: Identify the material
           | Process route, grade,     |           and its expected properties
           | historical context        |           from the specification.
           +---------------------------+
                       |
                       v
           +---------------------------+
           | Merica (Sonnet)           |  Stage 2: For nonferrous lots, confirm
           | Grade-level properties,   |           grade, temper, heat-treat
           | temper, expected structure|           expectations. For ferrous,
           +---------------------------+           Cort stays in the lead.
                       |
                       v
           +---------------------------+
           | Cottrell (Sonnet)         |  Stage 3: Plan the characterization.
           | Technique selection,      |           Optical, SEM, TEM, XRD, DSC,
           | expected outcomes, pass   |           mechanical tests. Define
           | criteria                  |           accept/reject criteria.
           +---------------------------+
                       |
                       v
           +---------------------------+
           | Results loop              |  Stage 4: Characterization executed.
           | Compare to expectations   |           Pipeline re-enters at
           +---------------------------+           stage 1 if anomaly found.
                       |
                       v
             Accept / reject / escalate to Bessemer
```

## Synthesis rules

### Rule 1 — Specification before sample

The first step in any practice-team task is to read the specification and work out what the sample should look like. Characterization without a reference is evidence-gathering, not qualification.

### Rule 2 — Technique matched to feature size

Cottrell's technique selection is driven by the feature size in the specification. A grain-size requirement (ASTM E112) is answered by optical microscopy. A precipitate-distribution requirement is answered by TEM. A composition requirement is answered by EDS, WDS, or wet chemistry. Running every technique is not a plan.

### Rule 3 — Borderline lots escalate

A lot that is clearly in specification is accepted. A lot that is clearly out of specification is rejected. A borderline lot is escalated to Bessemer for a policy decision that considers the application criticality, the supplier history, and the cost of rejection.

### Rule 4 — Loops compound

The same sample path is walked repeatedly for ongoing programs. Trends matter more than individual data points. The practice team reports running averages, control charts, and drift detection in addition to individual results.

### Rule 5 — Process history is present-tense

Cort's process-history knowledge is not a historical curiosity in this team. When a supplier changes melt practice from BOF to EAF, the resulting steel has different residuals and different inclusion populations, and the characterization plan must adapt. Process history is current practice.

## Input contract

The team accepts:

1. **Sample or batch description** (required). What the material is supposed to be, where it came from, what the specification says.
2. **Characterization goal** (required). Qualification, inspection, specification refinement, root-cause on a non-conformance, process-audit support.
3. **Acceptance criteria** (required for qualification and inspection). What pass and fail look like.
4. **Historical context** (optional). Prior results for the same supplier, grade, or program.

## Output contract

### Primary output: MaterialsReview Grove record

```yaml
type: MaterialsReview
sample_or_batch: <description>
expected_material: <grade, temper, process route>
characterization_plan:
  - technique: <technique>
    purpose: <what it measures>
    pass_criterion: <specification bound>
results: <populated after execution>
running_trends: <if multiple lots>
disposition: <accept / reject / escalate>
recommendations: <text>
```

### Secondary output: narrative

A summary at the user level set by the chair (default: intermediate for ongoing practice work) explaining the plan, the results, and the disposition.

## Escalation paths

- **Borderline disposition:** escalate to Bessemer for a policy call. Document the escalation in the Grove record.
- **Unexpected microstructure:** if Cottrell sees a microstructure inconsistent with the specification, escalate to `materials-analysis-team` for a root-cause investigation.
- **Failure in service of a previously accepted lot:** escalate to Gordon for failure analysis and feed the findings back into the practice team's acceptance criteria.

## Token / time cost per cycle

- **Cort** — 1 Sonnet invocation, ~15K tokens
- **Merica** — 1 Sonnet invocation if nonferrous, ~15K tokens
- **Cottrell** — 1 Sonnet invocation, ~20K tokens
- **Bessemer** — only on escalation, ~20K tokens
- **Total per cycle** — 50-80K tokens, 2-5 minutes wall-clock

Designed to be cheap enough to run on every lot in an ongoing program.

## Invocation

```
# Ongoing incoming inspection
> materials-practice-team: Incoming lot of 7075-T6 aluminum plate from a
  new supplier. Specification is AMS 4045. Plan the characterization and
  acceptance criteria.

# Characterization planning for a sample
> materials-practice-team: I have a piece of cold-rolled mild steel sheet
  whose supplier we are evaluating. What should I measure and what should
  I expect to see?

# Specification refinement
> materials-practice-team: We are rejecting too many lots of 6061-T6
  extrusions on ultimate tensile strength. Review the specification and
  the characterization history and tell me whether the specification or
  the material is the problem.
```
