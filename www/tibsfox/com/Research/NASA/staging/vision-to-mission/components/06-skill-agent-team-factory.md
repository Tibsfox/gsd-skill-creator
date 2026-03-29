# Skill / Agent / Team / Chipset Factory — Component Specification

**Milestone:** NASA Mission Series
**Wave:** 2 | **Track:** A
**Model Assignment:** Opus
**Estimated Tokens:** ~35K
**Dependencies:** Component #3 (Pipeline), Component #5 (Retrospective System)
**Produces:** `skills/nasa/factory/SKILL.md`, generation templates, iterative improvement engine, skill evaluation harnesses

---

## Objective

Build the factory that generates new skills, agents, team topologies, and chipset configurations from NASA mission content and retrospective findings, then iteratively improves them across releases. The factory is the compound interest engine — each mission teaches the ecosystem something new, and that knowledge persists as reusable capability. Done means: the factory produces valid SKILL.md files with trigger descriptions, evaluation harnesses, and chipset YAML from mission content, and improves existing skills based on retrospective feedback.

## Context

The NASA mission series is expected to produce dozens of new skills across 73+ releases. Early missions (Mercury, Gemini) will generate foundational skills (orbital mechanics, telemetry basics). Later missions (JWST, Perseverance) will generate advanced skills (infrared spectroscopy analysis, autonomous navigation). The factory must handle both generation and iterative refinement.

Skill-creator's bounded-learning constraints apply: 20% maximum change per update, 3-correction minimum before promotion, 7-day cooldown on promoted skills. The factory respects these bounds.

The factory operates at Opus tier because it requires judgment: deciding when a pattern observed in mission content warrants a new skill vs. extending an existing one, choosing appropriate trigger descriptions, and designing evaluation harnesses.

## Technical Specification

### Skill Generation Pipeline

```
Mission Content (Parts A-H)
         │
         v
[Pattern Detection]
  "Is there a repeatable capability here
   that future missions will also need?"
         │
    ┌────┴────┐
    │ YES     │ NO
    │         └──→ Log observation; no action
    v
[Existing Skill Check]
  "Does a similar skill already exist?"
    │
    ├── YES → [Improvement Path]
    │         Check retrospective for feedback
    │         Apply ≤20% change
    │         Update evaluation harness
    │
    └── NO → [Generation Path]
              Write SKILL.md from template
              Define trigger description
              Build evaluation harness (≥20 test cases)
              Register in skill catalog
```

### Generation Template

```markdown
# [Skill Name]

## Trigger Description
[Specific enough to activate reliably; scoped enough not to over-trigger.
 Follow the "slightly pushy" principle: if in doubt, trigger.]

## Domain
[domain-id from skill-creator taxonomy]

## When This Skill Activates
- [User phrase pattern 1]
- [User phrase pattern 2]
- [User phrase pattern 3]

## What This Skill Does
[Detailed workflow. An agent with only this SKILL.md can execute.]

## Source Mission
[Which NASA mission(s) generated this skill]

## Mathematical Foundation
[TSPB layer mapping, if applicable]

## Evaluation Harness
| Test Case | Input | Expected | Pass Condition |
|-----------|-------|----------|----------------|
| [20+ test cases] | ... | ... | ... |
```

### Chipset Generation

New chipset configurations emerge when a mission's operational pattern doesn't fit existing topologies. The factory detects this by checking whether the pipeline executor needed to improvise routing that the current chipset doesn't support.

```yaml
# Example: generated from Voyager mission
name: long-duration-autonomous
version: 1.0.0
description: "Chipset for missions requiring years of autonomous operation with intermittent ground contact"
agents:
  topology: "pipeline-with-watchdog"
  agents:
    - name: "AUTONOMOUS-EXEC"
      role: "Independent execution between ground contacts"
    - name: "WATCHDOG"
      role: "Health monitoring; anomaly detection; safe-mode trigger"
    - name: "GROUND-SYNC"
      role: "Batch communication during contact windows"
```

### Behavioral Requirements

- New skills must have ≥20 evaluation test cases before registration
- Skill improvements ≤20% change per iteration (bounded learning)
- Trigger descriptions evaluated against false-positive/false-negative test cases
- New agent roles require justification (what existing role was insufficient?)
- New team topologies require a worked example (which mission needed it?)
- All generated artifacts include provenance (which mission, which part, which finding)

## Implementation Steps

1. Create `skills/nasa/factory/SKILL.md` with generation and improvement pipelines
2. Create generation templates (skill, agent, team, chipset)
3. Implement pattern detection heuristics (what warrants a new skill?)
4. Implement existing-skill matching (avoid duplicates)
5. Build evaluation harness generator (produces test cases from mission content)
6. Test: generate a skill from synthetic mission content; validate SKILL.md format

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| FA-01 | Orbital mechanics content from Apollo | Skill: orbital-mechanics-calculator | Valid SKILL.md; ≥20 test cases; domain: physics |
| FA-02 | Retro finding "improve trigger for telemetry skill" | Updated SKILL.md | Change ≤20%; trigger updated; tests pass |
| FA-03 | Voyager long-duration ops content | New chipset: long-duration-autonomous | Valid YAML; justification present |
| FA-04 | Content matching existing skill exactly | No new skill | Factory logs "existing skill covers this" |
| FA-05 | Content with TSPB math mapping | Skill includes math foundation section | TSPB layer and chapter referenced |

## Verification Gate

- [ ] Factory generates valid SKILL.md from test input
- [ ] Generated skills have ≥20 evaluation test cases
- [ ] Improvement path respects 20% change bound
- [ ] Chipset generation produces valid YAML
- [ ] Provenance tracking present in all generated artifacts

## Safety Boundaries

| Constraint | Boundary Type |
|-----------|---------------|
| Skill improvements ≤20% change per iteration | ABSOLUTE |
| New agent roles require justification | GATE |
| All generated content includes provenance | ABSOLUTE |
