# Mission Templates Reference

Complete templates for every file in a GSD mission package. Copy and fill in — don't write from memory.

---

## Vision Document Template (`01-vision-doc.md`)

```markdown
# [PACK/FEATURE NAME] — Vision Guide

**Date:** [YYYY-MM-DD]
**Status:** Initial Vision / Pre-Research
**Depends on:** [list dependent vision docs, existing components, or "None"]
**Context:** [1-2 sentence scope and purpose]

---

## Vision
[2-4 paragraphs. The narrative soul of the project. Not a spec — the story of why this
matters. Use the user's own metaphors and framings from the conversation. Arc:
1. Open with something familiar (a problem the reader recognizes)
2. Identify the gap (what doesn't exist yet)
3. Show how this bridges it (the core idea)
4. End with the transformation (what the world looks like after)]

## Problem Statement
[3-5 numbered, concrete problems a user would recognize and nod at.]

1. **[Problem name].** [Description — one specific, observable situation]
2. **[Problem name].** [Description]
3. **[Problem name].** [Description]
4. **[Problem name].** [Optional — only if distinct]
5. **[Problem name].** [Optional — only if distinct]

## Core Concept
**[One-line interaction model, e.g., "Explore → Try → Practice → Understand → Integrate."]**

[2-3 paragraphs: How does a user engage? What's the flow from first touch to mastery/completion?]

### [Primary Interface / Environment Name]
```
[ASCII diagram of the user-facing structure — what they see and interact with]
```

## Architecture

### Component Map
```
[ASCII dependency tree showing all components and their relationships]
```

**Cross-component connections:**
- [Component A] → [Component B] — [what flows between them]
- [Component C] ↔ [Component D] — [bidirectional relationship description]

## [Module/Component Sections — one per major piece]

### [Module Name]
**Purpose:** [What does the user learn or get from this?]

**Key concepts:**
- [Concept 1]
- [Concept 2]

**Entry point:** [How does a user start engaging with this module?]

**Safety considerations:** [Any domain-specific safety notes, or "None"]

**Cross-references:** [Links to other modules this connects to]

---
[Repeat for each major component]

## Skill-Creator Integration

### Chipset Configuration
[See vision-archetypes.md for the YAML pattern matching this archetype]

```yaml
name: [pack-name]
version: 1.0.0
description: [one-line description]

skills:
  [skill-name]:
    domain: [domain-id]
    description: "[capability — trigger conditions + what it does]"

agents:
  topology: "[pipeline|router|map-reduce|swarm|leader-worker]"
  agents:
    - name: "[AGENT-NAME]"
      role: "[responsibility]"

evaluation:
  gates:
    pre_deploy:
      - check: "[check-name]"
        action: "[block|warn|log]"
```

## Scope Boundaries

### In Scope (v1.0)
- [What this milestone will deliver]
- [Keep this list honest — don't over-promise]

### Out of Scope (Future Considerations)
- [What comes later — prevents scope creep without discarding ideas]

## Success Criteria
[8-12 numbered criteria. Each must be: observable (an agent can check it), specific (no
vague language), and user-centric (framed as what the user experiences).]

1. [Criterion — "A user can [do X] and [observe Y result]"]
2. [Criterion]
3. [Criterion — include at least one safety criterion if domain warrants it]
...

## Relationship to Other Vision Documents

| Document | Relationship |
|----------|-------------|
| [filename] | [depends on / extends / peer / implements] |
| gsd-skill-creator-analysis.md | [relationship] |

## The Through-Line
[1-2 paragraphs connecting this work to the GSD ecosystem philosophy. Reference at least
one of: Amiga Principle, humane flow, progressive disclosure, spaces between, "giving
people their lives back", the giddy smile, Rosetta Stone identity. Make the connection
feel earned — not a tacked-on paragraph.]

---
*This vision guide is intended as input for GSD's `new-project` workflow.
[Specific guidance for the research phase, e.g., "Prioritize [Org X] for [topic Y]."]*
```

---

## Research Reference Template (`02-research-reference.md`)

*(Full pipeline only — skip for Fast/Mission-only speeds)*

```markdown
# [PACK/FEATURE NAME] — [Domain] Reference

**Date:** [YYYY-MM-DD]
**Status:** Research Compilation
**Source Document:** 01-vision-doc.md
**Purpose:** [What this provides. "Where the vision says X, this provides the exact Y,
evidence Z, and safety boundaries W."]

---

## How to Use This Document
[Relationship to vision doc. Agents building [Module A] should read [Section B].
Agents implementing [Module C] should prioritize [Section D].]

**Key source organizations:**
- **[Org Name]** — [What they provide, why they're authoritative]
- **[Org Name]** — [What they provide, why they're authoritative]

---

## [Section per major topic, matching vision modules]

### [Foundation / Clinical Basis / Technical Context]
[Evidence-based content with inline professional citations. Every numerical claim cited.]

### [Techniques / Implementation Details / Specifications]
[Detailed, implementable content. Agents should be able to implement from this alone.]

### Safety Considerations

| Condition | Recommendation | Boundary Type |
|-----------|----------------|---------------|
| [Situation] | [What to do] | ABSOLUTE / GATE / ANNOTATE |

### Cross-References
[How this topic connects to other sections/modules]

---

## Source Bibliography

**Professional Organizations:**
- [Org Name] — [URL or description]

**Clinical/Peer-Reviewed Research:**
- [Citation]

**Technical Standards:**
- [Standard name and body]
```

**Research source quality rules (ABSOLUTE):**
- Government agencies (USGS, NIH, NASA, EPA, NIST, etc.)
- Peer-reviewed journals and university research
- Professional organizations and official standards bodies
- NEVER entertainment media, general blogs, or unsourced claims

---

## Milestone Spec Template (`03-milestone-spec.md`)

```markdown
# [MILESTONE NAME] — Milestone Specification

**Date:** [YYYY-MM-DD]
**Vision Document:** 01-vision-doc.md
**Research Reference:** 02-research-reference.md [or "N/A — Fast pipeline"]
**Estimated Execution:** ~[N] context windows across ~[N] sessions

---

## Mission Objective
[2-3 sentences. What does "done" look like? Concrete and verifiable.]

## Architecture Overview
```
[ASCII diagram of component relationships and data flow]
```

### System Layers
1. **[Layer name]** — [responsibility]
2. **[Layer name]** — [responsibility]
3. **[Layer name]** — [responsibility]

## Deliverables

| # | Deliverable | Acceptance Criteria | Component Spec |
|---|-------------|--------------------|--------------:|
| 1 | [artifact name] | [testable condition] | components/01-[name].md |
| 2 | [artifact name] | [testable condition] | components/02-[name].md |

## Component Breakdown

| # | Component | Wave | Track | Model | Est. Tokens | Depends On |
|---|-----------|------|-------|-------|-------------|------------|
| 0 | Shared Types | 0 | — | Haiku | ~5K | None |
| 1 | [Component] | 1 | A | Sonnet | ~20K | #0 |
| 2 | [Component] | 1 | B | Sonnet | ~18K | #0 |
| 3 | [Component] | 2 | — | Opus | ~25K | #1, #2 |

## Activation Profile

**Profile:** [Patrol / Squadron / Fleet]

| Role | Agent | Wave Presence |
|------|-------|--------------|
| FLIGHT | Orchestrator | All waves |
| PLAN | Planner | Waves 0–1 |
| EXEC | Executor(s) | Wave 1 |
| VERIFY | Verification | Wave 2 |
| CAPCOM | HITL Interface | Go/No-Go gates |

## Constraints
- [Non-negotiable constraint 1]
- [Non-negotiable constraint 2]

## Pre-Computed Knowledge Tiers

| Tier | Content | Size | Loading Strategy |
|------|---------|------|-----------------|
| Summary | High-level overview | ~2K | Always loaded |
| Active | Current module content | ~10K | On demand |
| Reference | Deep domain content | ~20K+ | Deep dives only |
```

---

## Wave Execution Plan Template (`04-wave-execution-plan.md`)

```markdown
# [MILESTONE] — Wave Execution Plan

**Total Tasks:** [N] | **Parallel Tracks:** [N] | **Sequential Depth:** [N] waves
**Estimated Wall Time:** ~[N] hours (vs ~[N] sequential)
**Critical Path:** [N] sequential sessions
**Cache TTL:** 5 minutes — Wave 0 must complete within this window

---

## Wave Summary

| Wave | Tasks | Parallel? | Est. Time | Cache Role |
|------|-------|-----------|-----------|------------|
| 0 | [N] | Sequential | ~[N] min | Produces shared cache |
| 1 | [N] | Parallel ([N] tracks) | ~[N] min | Consumes Wave 0 cache |
| 2 | [N] | Sequential | ~[N] min | Integration |
| N | [N] | Sequential | ~[N] min | Verification + release |

---

## Wave 0: Foundation (Sequential — Must complete < 5 min)

*Produces all shared artifacts that downstream waves consume from cache.*

| Task | Description | Produces | Model | Est. Tokens |
|------|-------------|----------|-------|-------------|
| 0.1 | Shared type definitions | types.ts | Haiku | ~3K |
| 0.2 | [Schema/interface] | [artifact] | Haiku | ~4K |

---

## Wave 1: [Build Phase Name] (Parallel)

*All tracks start immediately after Wave 0. No inter-track dependencies.*

### Track A: [Name]

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 1A.1 | [task] | [artifact] | Sonnet | ~[N]K | 0.1, 0.2 |

### Track B: [Name]

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 1B.1 | [task] | [artifact] | Sonnet | ~[N]K | 0.1, 0.2 |

---

## Wave 2: Integration (Sequential)

*Assembles outputs from parallel tracks. No parallel execution.*

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 2.1 | [integration task] | [artifact] | Opus | ~[N]K | All Wave 1 |

---

## Wave N: Verification & Release (Sequential — Safety Warden here)

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| N.1 | Safety audit | audit-report.md | Opus | ~[N]K | All Wave N-1 |
| N.2 | Final verification | verification-report.md | Sonnet | ~[N]K | N.1 |

---

## Cache Optimization Strategy

### Skill Loads Saved
- [Skill X] loaded once in Wave 0 → cached for all Wave 1 consumers

### Schema Reuse
- Shared types defined once → consumed by [N] downstream components

### Token Budget Estimate

| Wave | Est. Tokens | Context Windows | Sessions |
|------|-------------|-----------------|---------|
| 0 | ~[N]K | 1 | 1 |
| 1 | ~[N]K | [N] parallel | 1 |
| 2 | ~[N]K | 1 | 1 |
| Total | ~[N]K | [N] | [N] |

---

## Dependency Graph

```
[Wave 0: Foundation]
   ├── types.ts ──────────────────────┐
   └── [schema] ──────────┐           │
                          ▼           ▼
[Wave 1: Parallel]   [Track A]   [Track B]
                          │           │
                          ▼           ▼
[Wave 2: Integration] ◄──────────────┘
                          │
                          ▼
[Wave N: Verify] ──── Safety Warden ──── RELEASE
                          ▲
                     Critical Path
```
```

---

## Component Spec Template (`components/[NN]-[name].md`)

```markdown
# [COMPONENT NAME] — Component Specification

**Milestone:** [milestone name]
**Wave:** [number] | **Track:** [A/B/—]
**Model Assignment:** [Opus / Sonnet / Haiku]
**Estimated Tokens:** ~[N]K
**Dependencies:** [exactly which prior component outputs this needs]
**Produces:** [exactly which artifacts this creates]

---

## Objective
[2-3 sentences. Self-contained — an agent needs only this document and nothing else.
What is built? What does "done" look like?]

## Context
[ALL necessary background COPIED IN here — not referenced elsewhere. Include:
- Relevant excerpts from the vision doc
- Interface contracts from shared types (Wave 0)
- Domain knowledge the agent needs
- Decision rationale (why this design, not an alternative)
An agent who has never seen the other files must be able to implement this correctly.]

## Technical Specification

### Interfaces
[Input and output contracts]

### Behavioral Requirements
[What the component must do, must not do, and how it handles edge cases]

### Implementation Notes
[Architectural guidance, patterns to use, patterns to avoid]

## Implementation Steps
[Ordered, atomic, verifiable steps. Each step produces something observable.]

1. [Step with concrete, checkable outcome]
2. [Step]
3. [Step]

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| [ID]-01 | [input] | [output] | [condition] |
| [ID]-02 | [input] | [output] | [condition] |

## Verification Gate

Before marking complete, verify ALL of the following:

- [ ] [Specific condition — not "tests pass" but "TC-01 through TC-05 all pass"]
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Output artifacts present at expected paths: `[path]`
- [ ] [Domain-specific condition]

## Safety Boundaries
[If not applicable: "No domain-specific safety boundaries for this component."]
[If applicable:]
| Constraint | Boundary Type |
|-----------|---------------|
| [Must / Must not / Constraint] | ABSOLUTE / GATE / ANNOTATE |
```

---

## Test Plan Template (`05-test-plan.md`)

```markdown
# [MILESTONE] — Test Plan

**Total Tests:** [N] | **Safety-Critical:** [N] | **Target Coverage:** [N]%+
**Test density target:** 2–4 tests per success criterion

---

## Test Categories

| Category | Count | Priority | Failure Action |
|----------|-------|----------|----------------|
| Safety-critical | [N] | Mandatory | BLOCK release |
| Core functionality | [N] | Required | BLOCK release |
| Integration | [N] | Required | BLOCK release |
| Edge cases | [N] | Best-effort | LOG |

---

## Safety-Critical Tests (Mandatory Pass — Blocking)

| Test ID | Verifies | Expected Behavior | Component |
|---------|----------|-------------------|-----------|
| SC-01 | [safety concern] | [expected behavior] | [component] |

---

## Core Functionality Tests

### [Component A] Tests
| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-A-01 | [behavior] | [input] | [output] |

### [Component B] Tests
[Repeat for each component]

---

## Integration Tests

| Test ID | Interface Between | Scenario | Expected Behavior |
|---------|------------------|----------|-------------------|
| IT-01 | [A] → [B] | [scenario] | [behavior] |

---

## Verification Matrix

*Maps every success criterion from the vision doc to the tests that verify it.*

| Success Criterion | Test IDs | Status |
|-------------------|----------|--------|
| 1. [Criterion from vision doc] | CF-A-01, IT-01 | Pending |
| 2. [Criterion] | CF-B-01, CF-B-02 | Pending |
[Every criterion must have ≥2 tests]
```

---

## README Template (`README.md`)

```markdown
# [MILESTONE NAME] — Mission Package

**Date:** [YYYY-MM-DD]
**Version:** [1.0.0]
**Status:** Ready for GSD orchestrator
**Pipeline:** [Full / Fast / Mission-only]

---

## Contents

| File | Purpose |
|------|---------|
| 01-vision-doc.md | North star: what and why |
| 02-research-reference.md | Domain evidence and safety constraints |
| 03-milestone-spec.md | Mission objective, deliverables, crew |
| 04-wave-execution-plan.md | Wave structure, parallel tracks, token budget |
| 05-test-plan.md | All tests, verification matrix |
| components/00-shared-types.md | Wave 0: schemas and interfaces |
| components/01-[name].md | [one-line purpose] |
| components/02-[name].md | [one-line purpose] |

## How to Use

1. Open a new Claude Code session
2. Load `01-vision-doc.md` as the project charter:
   ```
   claude --new-task "Read this vision doc and begin Wave 0: $(cat 01-vision-doc.md)"
   ```
3. Feed `04-wave-execution-plan.md` to the orchestrator for wave sequencing
4. Execute components in wave order — parallel tracks can run simultaneously
5. Run test plan after each wave completes

## Execution Summary

| Metric | Value |
|--------|-------|
| Total components | [N] |
| Parallel tracks | [N] |
| Sequential depth | [N] waves |
| Activation profile | [Patrol / Squadron / Fleet] |
| Model split | ~[N]% Opus / ~[N]% Sonnet / ~[N]% Haiku |
| Estimated context windows | ~[N] |
| Estimated wall time | ~[N] hours |
| Total tests | [N] ([N] safety-critical) |

## Ecosystem Connections

This milestone connects to:
- [Related vision doc] — [relationship]
- [Other component] — [how they interact]
```
