# Branch Per Slice, Squash Per Milestone

> **Domain:** Version Control & Verification Architecture
> **Module:** 4 -- Git Strategy and the Verification Ladder
> **Through-line:** *Every slice gets its own branch. Every branch gets squash-merged as one clean commit.* GSD-2's git strategy is a forensic tool as much as a version control system.

---

## Table of Contents

1. [The Branch-Per-Slice Model](#1-the-branch-per-slice-model)
2. [Branch Naming Conventions](#2-branch-naming-conventions)
3. [Atomic Task Commits](#3-atomic-task-commits)
4. [The Squash Merge](#4-the-squash-merge)
5. [The Verification Ladder](#5-the-verification-ladder)
6. [Must-Haves as Mechanical Verification](#6-must-haves-as-mechanical-verification)
7. [The UAT Protocol](#7-the-uat-protocol)
8. [Revert Strategy](#8-revert-strategy)
9. [Comparative Analysis: GSD-2 vs Tibsfox GSD](#9-comparative-analysis-gsd-2-vs-tibsfox-gsd)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Branch-Per-Slice Model

GSD-2 creates a dedicated git branch for every slice. The branch isolates the slice's work from main, enabling:

1. **Safe exploration:** If the LLM's approach doesn't work, the branch is abandoned without contaminating main
2. **Clean rollback:** If a slice is found to be wrong after merge, the squash commit can be reverted atomically
3. **Parallel slice work:** Multiple slices can develop independently without conflicts
4. **Clear forensics:** The branch history shows exactly what the LLM did during the slice

**Branch creation:** Automatic at slice start. The state machine creates the branch before dispatching the first task.

**Branch protection:** While a slice branch is active, the state machine does not merge it to main. Only after the slice completes its full lifecycle (Research → Plan → Execute → Complete → UAT) does the squash merge trigger.

---

## 2. Branch Naming Conventions

GSD-2 uses hierarchical branch names that encode the work's position in the Milestone → Slice hierarchy:

```
gsd/{M_ID}/{S_ID}
```

Examples:
- `gsd/M001/S01` -- Milestone 1, Slice 1
- `gsd/M001/S02` -- Milestone 1, Slice 2
- `gsd/M002/S01` -- Milestone 2, Slice 1

**Rationale for this naming:** The branch name is a coordinate in the roadmap. Looking at a branch list immediately tells you:
- Which milestone the work belongs to
- Which slice within that milestone
- The relative position (S01 before S02 before S03)

This naming also makes branch cleanup mechanical: `git branch | grep gsd/M001/` returns all branches for Milestone 1.

**Branch lifecycle:**
1. Created by state machine at slice start
2. Receives task commits throughout slice execution
3. Squash-merged to main at UAT pass
4. Deleted after merge (cleanup is explicit, not assumed)

---

## 3. Atomic Task Commits

Each task within a slice commits atomically to the slice branch. The commit represents the complete work of one task -- no partial commits, no in-progress snapshots.

**Commit convention:**

```
feat(scope): description of what this task built

- Key change 1
- Key change 2
- Key change 3

Task: T01 | Slice: S01 | Milestone: M001
```

GSD-2 uses conventional commits throughout. The scope is the system or module being modified. The body explains what was built (not how) with a list of key changes.

**Why atomic commits matter for GSD-2:**

The task summary (`T0N-SUMMARY.md`) documents what the task built. The commit should mirror this summary. If the commit and the summary diverge, there is a documentation integrity problem -- the audit trail no longer accurately represents the build history.

GSD-2's verification ladder checks for this divergence: the UAT phase compares commit history against task summaries to confirm they tell the same story.

---

## 4. The Squash Merge

When a slice completes its UAT, GSD-2 squash-merges the slice branch to main. The squash merge:

1. Takes all individual task commits from the slice branch
2. Collapses them into a single commit on main
3. Uses the slice's UAT summary as the squash commit message
4. Deletes the slice branch

**Why squash, not rebase or merge commit:**

- **Squash** produces one clean commit per slice -- a demoable, verifiable unit of work with a descriptive commit message. `git bisect` can operate at slice granularity.
- **Rebase** preserves individual task commits but creates a linear history of LLM-generated commit messages, which may be noisy or redundant.
- **Merge commit** adds noise to the main branch history and makes `git log --first-parent` ambiguous.

**What the squash commit looks like:**

```
feat(auth): implement JWT token validation and refresh rotation

Slice M001/S02 -- Authentication Token System

Implements:
- JWT token validation middleware (src/middleware/auth.ts)
- Token refresh rotation with 7-day absolute expiry
- Rate limiting on /auth/refresh endpoint (10 req/hour)
- Integration tests covering expiry, invalid signature, rate limit

UAT: All 8 test cases pass. No regressions.
Tasks: T01 (validation middleware), T02 (refresh rotation), T03 (rate limiting)
```

This commit is a complete story of the slice's work. Anyone reading `git log --oneline` on main sees one commit per slice -- each one a demoable capability addition.

---

## 5. The Verification Ladder

GSD-2's verification ladder defines four levels of confirmation that a task is complete:

```
Level 1: STATIC
├── Type checking passes (tsc --noEmit)
├── Linting passes (eslint/ruff/etc)
└── No syntax errors

Level 2: ARTIFACT
├── All declared must-have artifacts exist
├── Required exports are present
└── Required file relationships exist (key links)

Level 3: BEHAVIORAL
├── All tests pass
├── No pre-existing tests regressed
├── Integration tests pass (if applicable)
└── Performance characteristics within bounds (if specified)

Level 4: HUMAN
├── UAT script executed
├── Demoable behavior confirmed
└── User sign-off recorded
```

**Levels 1-3 are automated.** The state machine runs them after every task. If any level fails, the task is considered incomplete and the Worker subagent is re-dispatched with the failure information.

**Level 4 is human.** The UAT is always the final gate. No slice reaches main without human confirmation that the visible behavior matches the specification.

---

## 6. Must-Haves as Mechanical Verification

Must-haves exist to make verification mechanical -- to remove as much judgment as possible from the Level 1-3 checks. A must-have is verifiable by a script, not by an opinion.

**Must-have quality criteria:**

| Quality | Example | Anti-Pattern |
|---------|---------|--------------|
| Specific | "JWT_SECRET is read from `process.env.JWT_SECRET`" | "Security is implemented correctly" |
| Mechanical | "`src/auth.ts` exports `validateToken`" | "Authentication works" |
| Binary | "Returns 401 for expired tokens" | "Handles edge cases appropriately" |

The pattern "returns 401 for expired tokens" is verifiable: write a test that sends an expired token and asserts status 401. The pattern "handles edge cases appropriately" is an opinion that requires human judgment.

GSD-2 enforces must-have quality at plan-time (not just at verification time): if a must-have cannot be expressed as a binary mechanical check, the Plan phase reformulates it until it can be.

---

## 7. The UAT Protocol

The UAT (User Acceptance Test) script is generated automatically by GSD-2 at the end of the Execute phase, derived from the slice plan's stated outcomes.

**UAT structure:**

```markdown
# UAT: M001/S02 -- JWT Authentication

## Pre-conditions
- Application running on localhost:3000
- Test user credentials: {provided in UAT env}

## Test Cases

### TC-01: Valid Token Access
1. Obtain a valid JWT token via POST /auth/login
2. Include token in Authorization: Bearer header
3. GET /api/protected
**Expected:** 200 OK with user data

### TC-02: Expired Token Rejection
1. Use a token with exp in the past (provided in test data)
2. GET /api/protected with expired token
**Expected:** 401 Unauthorized, body contains "token expired"

[...additional test cases...]

## Sign-off
Tester: [name/rig]
Date: [date]
Result: [ ] PASS / [ ] FAIL
Notes: [any observations]
```

The UAT is written for a human tester who may not be a developer. It assumes the tester knows how to use a browser or curl but does not assume they can read code.

**UAT generation quality:** The quality of the UAT depends on the quality of the slice plan's success criteria. This is why GSD-2 requires success criteria at plan time: not to bureaucratize the planning process, but to make UAT generation possible.

---

## 8. Revert Strategy

When a deployed slice is found to be incorrect after merging to main:

**Revert protocol:**
1. `git revert [squash commit hash]` -- produces a single revert commit on main
2. The revert commit is a clean inverse of the squash commit
3. The slice branch is restored from the revert point (branched from main at revert)
4. Work resumes on the restored branch with the failure information available

**Why revert instead of reset:**
- Reset would rewrite history -- visible to anyone who pulled after the squash
- Revert creates a new commit that expresses "this was wrong" without erasing that it happened
- The audit trail is preserved: the original squash, the revert, and the fix are all traceable

**What the revert commit looks like:**

```
revert: revert "feat(auth): implement JWT validation (M001/S02)"

Reason: Token refresh rotation caused session invalidation on
clock skew > 30s. Reverted pending investigation.

Refs: Squash commit abc1234, Issue #47
```

---

## 9. Comparative Analysis: GSD-2 vs Tibsfox GSD

| Git Dimension | GSD-2 | Tibsfox GSD |
|--------------|-------|------------|
| Branch strategy | Branch-per-slice | Branch-per-feature (developer choice) |
| Merge strategy | Squash merge per slice | Conventional merge with task commits |
| Commit granularity | Task-atomic (machine-generated) | Task-atomic (human + agent) |
| Verification | 4-level ladder (static → human) | Verification in plan files + human checkpoint |
| Rollback | Git revert (single squash target) | Git revert (per task commit) |
| History legibility | Slice-level on main (clean) | Task-level on main (more granular) |

Neither approach is strictly superior. GSD-2's cleaner main history trades some forensic detail for readability. Tibsfox GSD's task-level commits on main provide more rollback granularity.

---

## 10. Cross-References

| Project | Connection |
|---------|------------|
| [SYS](../SYS/index.html) | Version control system administration; branch management |
| [BCM](../BCM/index.html) | Engineering standards and verification patterns |
| [WAL](../WAL/index.html) | Systematic methodology; verification as method |
| [GRD](../GRD/index.html) | Optimization through iterative verification |

---

## 11. Sources

1. [GSD-2 README](https://github.com/gsd-build/GSD-2) -- Git strategy documentation
2. [Conventional Commits](https://www.conventionalcommits.org/) -- Commit message format
3. [Pro Git](https://git-scm.com/book) -- Squash merge, revert, rebase mechanics
4. [DeepWiki / GSD docs](https://deepwiki.com/gsd-build) -- Git strategy community analysis
