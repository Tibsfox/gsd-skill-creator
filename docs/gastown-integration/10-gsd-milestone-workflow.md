# 10 — GSD Milestone Workflow with Gastown

## The Integration Model

GSD answers **what** to build. Gastown answers **how** to coordinate the agents building it. Together:

```
GSD Milestone → GSD Phases → GSD Plans → Gastown Beads → Gastown Convoys
                                              ↓
                                    Sling Dispatch → Polecats
                                              ↓
                                    Done Retirement → Refinery → Merged
                                              ↓
                                    GSD Verification → Phase Complete
```

## Step-by-Step Workflow

### 1. Plan with GSD

Use GSD's standard planning workflow (`/gsd:new-milestone`, `/gsd:plan-phase`). Plans define:
- What to build (acceptance criteria)
- Which files to touch
- Test requirements
- Dependencies between plans

### 2. Mayor Creates Beads from Plans

Each GSD plan becomes one or more Gastown beads:

```
GSD Phase 1: "Authentication System"
  Plan 1A: "Add JWT middleware"     → Bead gt-001
  Plan 1B: "Add user model"         → Bead gt-002
  Plan 1C: "Add login endpoint"     → Bead gt-003 (depends on 001, 002)
```

Independent plans dispatch in parallel. Dependent plans wait.

### 3. Mayor Groups Beads into Convoys

Related beads that should land together become a convoy:

```
Convoy "auth-sprint": [gt-001, gt-002, gt-003]
Progress: 0.0 → 0.33 → 0.66 → 1.0
```

### 4. Sling Dispatches to Polecats

The mayor uses sling dispatch to assign beads to idle polecats. Each polecat:
- Gets one bead
- Creates branch `polecat/gt-001`
- Executes the GSD plan (write code, run tests, commit)
- Calls done retirement when complete

### 5. Refinery Merges Completed Work

As polecats complete, their branches enter the merge queue. The refinery:
- Processes FIFO, one at a time
- Rebases onto target branch
- Runs tests
- Fast-forward merges
- Notifies mayor

### 6. GSD Verifies Phase Completion

When the convoy reaches 1.0 progress (all beads merged):
- Run `/gsd:verify-work` to confirm the phase goal was achieved
- GSD checks acceptance criteria against the merged code
- Phase marked complete in `.planning/STATE.md`

## Wave-Based Parallel Execution

GSD's wave-based execution maps naturally to Gastown convoys:

```
Wave 0 (Foundation):
  Convoy "wave-0": [types, scaffold]
  → 2 polecats, parallel

Wave 1 (Core):
  Convoy "wave-1": [feature-a, feature-b, feature-c]
  → 3 polecats, parallel
  → Depends on Wave 0 convoy completion

Wave 2 (Integration):
  Convoy "wave-2": [integration-tests, docs]
  → 2 polecats, parallel
  → Depends on Wave 1 convoy completion
```

The mayor watches convoy progress and dispatches the next wave when the previous one completes.

## The Golden Rule

**GSD phase gates take precedence over GUPP.** If GSD says "verify before proceeding," the mayor waits for verification even though GUPP says "execute immediately." This is documented in [ADR-003](../data/chipset/gastown-orchestration/docs/adr/003-gupp-advisory.md).

The hierarchy: Human intent → GSD milestones → GSD phases → Gastown orchestration → Agent execution.

gsd-skill-creator is Claude Code's Rosetta Stone — it translates human intent into structured work, coordinates the agents that build it, and verifies that what was built matches what was planned.
