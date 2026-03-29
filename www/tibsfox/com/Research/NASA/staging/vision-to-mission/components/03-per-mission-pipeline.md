# Per-Mission Pipeline — Component Specification

**Milestone:** NASA Mission Series
**Wave:** 1 | **Track:** B
**Model Assignment:** Opus
**Estimated Tokens:** ~40K
**Dependencies:** Component #0 (Shared Types)
**Produces:** `skills/nasa/pipeline-executor/SKILL.md`, `skills/nasa/pipeline-executor/templates/`, CAPCOM gate definitions

---

## Objective

Build the pipeline executor skill that drives each NASA mission through the seven-part sequence (A→B→C/D/E/F→G→H). The executor reads a mission from the catalog, routes it through each part in correct dependency order, enforces CAPCOM gates between parts, tracks artifact production, and signals release readiness. An agent with only this spec can implement the complete pipeline routing logic.

## Context

Each of the ~73 NASA missions passes through Parts A through H. Parts A and B are sequential (B depends on A). Parts C, D, E, and F are parallelizable (all depend on B but not on each other). Part G depends on all A-F outputs. Part H depends on G output. The pipeline must handle the part dependency graph, enforce CAPCOM gates at key transitions, and track which artifacts each part produces.

The pipeline executor is the central nervous system of each release. It does not produce content itself — it orchestrates the agents that do.

Research mission pack templates (from uploaded files) define the detailed output requirements for each part:
- Part A: NASA Mission History template (files_188_.zip)
- Part D: NASA Engineering Deep Dive template (files_190_.zip)
- Part F: Mission Operations template (files_191_.zip)
- Part G: 8-Pass Refinement template (files_193_.zip)
- Parts B, C, E, H: Derived from template patterns established in the above

## Technical Specification

### Pipeline Dependency Graph

```
Part A (History) ──→ Part B (Science)
                         │
                         ├──→ Part C (Education)     ─┐
                         ├──→ Part D (Engineering)    ─┤
                         ├──→ Part E (Simulation)     ─┤ Parallel
                         └──→ Part F (Operations)     ─┘
                                                       │
                                                       v
                                                  Part G (Refinement)
                                                       │
                                                       v
                                                  Part H (Datasets)
```

### CAPCOM Gates

| Gate | Location | Type | Condition |
|------|----------|------|-----------|
| G1 | After Part A | Auto | Part A artifacts validated against schema |
| G2 | After Part B | Auto | Part B artifacts validated; science findings present |
| G3 | After Parts C-F (all) | HITL | Human reviews parallel outputs before synthesis |
| G4 | After Part G | Auto | 8 passes documented; lessons classified |
| G5 | After Part H | HITL | Human approves dataset integrations before release |

### SKILL.md Structure

```markdown
# NASA Pipeline Executor

## When to Trigger
Trigger when starting a new NASA mission release. Activated by:
- "Execute pipeline for nasa-v1.X"
- "Start [mission name] pipeline"
- "Run Parts A through H for [mission]"

## Pipeline Steps

### Step 1: Load Mission Context
- Read mission entry from mission-index.json for this version
- Load previous release retrospective (if not v1.0)
- Load lessons-forward list applicable to this release
- Report: mission name, epoch, type, safety flags, lessons to apply

### Step 2: Execute Part A (History)
- Assign EXEC-HISTORY agent
- Input: mission catalog entry
- Output: docs/nasa/missions/[id]/part-a.md
- Gate G1: validate schema, check completeness

### Step 3: Execute Part B (Science)
- Assign EXEC-HISTORY agent (continues from Part A context)
- Input: Part A output + catalog entry
- Output: docs/nasa/missions/[id]/part-b.md
- Gate G2: validate science findings present

### Step 4: Execute Parts C, D, E, F (Parallel)
- Assign EXEC-EDU (C), EXEC-ENG (D), EXEC-SIM (E), EXEC-OPS (F)
- All receive: Part A + Part B output
- Outputs: part-c.md, part-d.md, part-e.md, part-f.md
- Gate G3: CAPCOM human review of all four outputs

### Step 5: Execute Part G (Refinement)
- Assign RETRO agent
- Input: All Parts A-F output
- Output: part-g.md + retrospective entries
- Gate G4: 8 passes documented

### Step 6: Execute Part H (Datasets)
- Assign DATA agent
- Input: Part G output + all prior parts
- Output: part-h.md + integration skills
- Gate G5: CAPCOM approval of dataset integrations

### Step 7: Signal Release Ready
- All parts complete; all gates passed
- Hand off to Release Cadence Engine
```

### Behavioral Requirements

- Pipeline never skips a part (even if a part produces minimal output for a given mission)
- Parts C, D, E, F execute in parallel where agent topology supports it; sequential fallback is acceptable
- CAPCOM gates G3 and G5 require human approval (cannot be auto-passed)
- Safety Warden active throughout all parts (not just at release)
- If any part is BLOCKED by Safety Warden, pipeline halts and escalates to CAPCOM
- Mission safety flags from catalog propagate to all parts (e.g., `disaster-narrative` flag activates enhanced Safety Warden scrutiny)

## Implementation Steps

1. Create `skills/nasa/pipeline-executor/SKILL.md` with complete pipeline logic
2. Create part templates in `skills/nasa/pipeline-executor/templates/` (one per part)
3. Define CAPCOM gate schemas (what each gate checks, how approval is recorded)
4. Write artifact validation scripts (check each part's required outputs exist)
5. Test: dry-run pipeline for a synthetic mission (verify routing, gates, artifact tracking)

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| PP-01 | Mission with all types of content | All 8 parts produce artifacts | 8 artifact directories populated |
| PP-02 | Mission with `disaster-narrative` flag | Enhanced Safety Warden active in Parts A, B, F | Warden logs show enhanced scrutiny |
| PP-03 | Part C produces invalid output | Gate G3 fails | Pipeline halts; CAPCOM notified |
| PP-04 | Parts C-F parallel execution | All four produce output regardless of order | All 4 part files present; no cross-dependency |
| PP-05 | Safety Warden BLOCKs Part A | Pipeline halts | Release not signaled; CAPCOM escalation |

## Verification Gate

- [ ] SKILL.md complete and self-contained
- [ ] All 5 CAPCOM gates defined with clear pass/fail conditions
- [ ] Part templates present for all 8 parts (A-H)
- [ ] Artifact validation script catches missing outputs
- [ ] Dry-run produces expected artifact manifest

## Safety Boundaries

| Constraint | Boundary Type |
|-----------|---------------|
| Pipeline never skips a part | ABSOLUTE |
| CAPCOM gates G3 and G5 require human approval | ABSOLUTE |
| Safety Warden active throughout, not just at release | ABSOLUTE |
| `disaster-narrative` flag triggers enhanced scrutiny | GATE |
