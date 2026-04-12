---
name: spatial-computing-workshop-team
type: team
category: spatial-computing
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/spatial-computing/spatial-computing-workshop-team/README.md
description: Focused four-agent workshop team for interaction design review, directness critique, and iterative refinement of spatial computing interfaces. Bret Victor leads with direct-manipulation critique, Engelbart adds augmentation assessment, Krueger contributes responsive environment perspective, and Papert-sp translates the finished review into level-appropriate guidance. Use for interaction design review, directness critique, small VR/AR prototype review, and teaching interaction design through worked examples. Not for novel multi-wing problems or pipeline-style prototype building.
superseded_by: null
---
# Spatial Computing Workshop Team

A focused four-agent team for interaction design review and iterative refinement. Bret Victor leads; Engelbart adds augmentation framing; Krueger contributes body-scale environment perspective; Papert-sp translates the review into teachable form. This team mirrors the `proof-workshop-team` pattern: a focused expertise team optimized for a specific class of problem rather than broad investigation.

## When to use this team

- **Interaction design review** — "review this VR menu system for directness and comfort"
- **Directness critique** — "our selection and manipulation feels indirect; help us fix it"
- **Small VR/AR prototype review** — a single-scene prototype that needs critique before expansion
- **Teaching interaction design** — walkthrough of a design with commentary on each choice
- **Iterative refinement** — multiple review rounds as a design matures

## When NOT to use this team

- **Novel multi-wing problems** that span spatial reasoning, world-building, immersive environments, and embodied learning — use `spatial-computing-analysis-team`
- **Pipeline-style prototype building** that needs sequential design, build, and validate — use `spatial-computing-practice-team`
- **Pure pedagogy** where there is no design artifact — invoke Papert-sp directly
- **High-stakes VR training design** — use `spatial-computing-analysis-team` to include Furness

## Composition

Four agents, run mostly sequentially with one parallel synthesis step:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Interaction reviewer** | `bret-victor` | Directness critique, design recommendations | Opus |
| **Augmentation advisor** | `engelbart` | Augmentation value assessment, navigation coherence | Opus |
| **Environment consultant** | `krueger` | Body-scale, responsive environment perspective | Sonnet |
| **Pedagogy / Translation** | `papert-sp` | Level-appropriate explanation, exercise generation | Sonnet |

Two Opus agents (Bret-victor, Engelbart) because design critique and augmentation reasoning require deep analysis. Two Sonnet agents (Krueger, Papert-sp) because their tasks are well-bounded.

## Orchestration flow

```
Input: artifact (design, prototype, or spec) + platform + mode (review/refine/teach)
        |
        v
+---------------------------+
| Bret-victor (Opus)        |  Phase 1: Directness critique
| Lead / Reviewer           |          - apply five directness tests
+---------------------------+          - identify violations with severity
        |                              - propose specific fixes
        v
+---------------------------+
| Engelbart (Opus)          |  Phase 2: Augmentation review
| Augmentation advisor      |          - what unique affordances does this use?
+---------------------------+          - is the spatial cost justified?
        |                              - any navigation/coordinate issues?
        v
+---------------------------+
| Krueger (Sonnet)          |  Phase 3: Environment perspective
| Environment consultant    |          - does it treat the body as input?
+---------------------------+          - is the environment legible at first use?
        |                              - collaborative native or solo-only?
        v
+---------------------------+
| Papert-sp (Sonnet)        |  Phase 4: Translation
| Pedagogy guide            |          - summarize review at target level
+---------------------------+          - suggest teaching exercises
        |                              - produce learning pathway
        v
              Final review artifact
              + SpatialComputingReview Grove record
              + SpatialComputingExplanation Grove record
```

Unlike the analysis team's parallel execution, the workshop team runs sequentially. Each agent's output feeds the next. This is because workshop reviews are iterative critiques, not independent investigations — later agents respond to earlier ones.

## Review protocol

### Phase 1 — Directness critique (Bret-victor)

Bret-victor runs the five directness tests on the artifact:

1. Immediate feedback — does the result appear as the user acts?
2. Direct object — does the user touch the thing they care about?
3. Visible state — is the system's state visible?
4. Reversible actions — can the user undo as easily as redo?
5. No modes — can the user act without first selecting a tool?

Each violation is documented with severity (major/minor) and a specific fix.

### Phase 2 — Augmentation review (Engelbart)

Engelbart evaluates:

- What unique spatial affordances does this design use?
- Is the cognitive cost (learning curve, session fatigue, physical demand) worth the augmentation gain?
- Does the coordinate framing support collaborative or multi-user use?
- Is there a simpler non-spatial design that would achieve the same outcome?

### Phase 3 — Environment perspective (Krueger)

Krueger evaluates:

- Does the design treat the user's body as primary input, or does it rely on controllers?
- Is the environment legible on first contact? Any tutorial needed?
- Multi-user capable?
- Aesthetic coherence — does the environment feel alive, or assembled?

### Phase 4 — Translation (Papert-sp)

Papert-sp produces a level-appropriate summary of the review. If the user is a beginner, the summary uses analogies and concrete examples. If the user is an expert, it uses technical precision. Papert-sp also suggests 2-3 follow-up exercises for the designer to internalize the lessons.

## Input contract

The team accepts:

1. **Artifact** (required). The design document, prototype description, or specification under review.
2. **Platform** (required). Target platform (VR, AR, voxel, CAD, mixed).
3. **User task** (required). What the user is supposed to accomplish with this artifact.
4. **Designer level** (optional). Level of the person receiving the review (for Papert-sp's translation).
5. **Mode** (required). One of: `review`, `refine`, `teach`.

## Output contract

### Primary output: Workshop review

A structured review that includes:

- **Directness scorecard** (from Bret-victor) — 5 tests, each pass/fail/partial
- **Violations list** with severity and fix recommendations
- **Augmentation assessment** (from Engelbart) — scale and justification
- **Environment notes** (from Krueger) — body-first analysis
- **Strengths** that should not be changed
- **Priority-ordered fix list** — major violations first, polish last
- **Teaching summary** (from Papert-sp) — level-appropriate explanation

### Grove records

```yaml
type: SpatialComputingReview
artifact: <reference>
directness_score: 3/5
violations:
  - issue: <description>
    severity: major
    source_agent: bret-victor
    fix: <proposed fix>
augmentation_rating: moderate
environment_rating: body-first
strengths:
  - <preserved strengths>
priority_fixes:
  - <ordered list>
agent: bret-victor (lead)
```

Plus a linked `SpatialComputingExplanation` record from Papert-sp.

## Escalation paths

- **When the review reveals the artifact is broken at a fundamental level** (not merely flawed, but conceptually wrong): escalate to `spatial-computing-analysis-team` for a full rethink.
- **When the artifact's issues span multiple wings** (e.g., the interaction is broken AND the environment is unsafe AND the registration is wrong): escalate to `spatial-computing-analysis-team`.
- **When the user wants a build, not a review**: route to `spatial-computing-practice-team`.
- **When the user is a beginner who needs to learn interaction design first**: invoke Papert-sp directly before running the workshop.

## Token / time cost

- **Bret-victor** — 1 Opus invocation, ~40K tokens
- **Engelbart** — 1 Opus invocation, ~30K tokens
- **Krueger** — 1 Sonnet invocation, ~20K tokens
- **Papert-sp** — 1 Sonnet invocation, ~20K tokens
- **Total** — ~110K tokens, 3-8 minutes wall-clock

Cheaper than the full analysis team. Good for iterative design reviews where the team runs multiple times on evolving artifacts.

## Configuration

```yaml
name: spatial-computing-workshop-team
lead: bret-victor
specialists:
  - augmentation: engelbart
  - environment: krueger
pedagogy: papert-sp

sequential: true
timeout_minutes: 8
```

## Invocation

```
# Review a VR menu system
> spatial-computing-workshop-team: Review this VR settings menu for directness
  and comfort. Users say it feels clunky. Mode: review.

# Iterative refinement
> spatial-computing-workshop-team: We iterated on our hand-menu design. Run the
  workshop again and compare to version 1. Mode: refine.

# Teaching walkthrough
> spatial-computing-workshop-team: Walk through this reference VR app and
  explain the interaction design choices for an intermediate learner. Mode: teach.
```

## Limitations

- The workshop team cannot evaluate registration precision, AR tracking, or high-stakes VR comfort — use the analysis team for those concerns.
- The sequential orchestration means total latency is higher per-token than parallel teams; the trade-off is that each agent's output builds on the previous agent's.
- The team produces reviews, not builds. The user or another team must implement the fixes.
