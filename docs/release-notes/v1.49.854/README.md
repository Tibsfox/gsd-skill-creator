> Following v1.49.853 — _ProcessContext singleton chip: `src/dashboard/collectors/git-collector.ts` (closes chip-cluster)_, v1.49.854 is the **seventh ship of the v848-v856 nine-ship campaign** and the **first verify-overdue ship under the newly-codified #10438 verify-axis** (v847). Adds `tests/integration/mesh-default-executor.integration.test.ts` (4 cases against real git temp repos) — closes the v843 mesh-family verify-overdue gap. One ship past the v853 canonical 10-ship-from-v843 threshold; lands within tolerance.

# v1.49.854 — Verify ship: mesh-default-executor integration test against real git

**Shipped:** 2026-05-28

Seventh ship of the nine-ship v848-v856 campaign; **first verify-overdue ship under newly-codified #10438** (verify axis as a first-class numbered lesson, promoted v847). The v1.49.843 mesh-family chip wired `createMeshWorktreeManager` through the ProcessContext chokepoint using the DI-executor + tokenized-argv shape codified at v847 as #10441. The wire is well-unit-tested via `src/mesh/mesh-worktree.test.ts` (mocked GitExecutor), but per #10438 unit tests against mocks prove the wire's signature; integration tests against real collaborators prove the wire's behavior.

## What shipped

- **NEW** `tests/integration/mesh-default-executor.integration.test.ts` — 4 integration test cases that exercise the DEFAULT GitExecutor (created at `createMeshWorktreeManager` line 145) against REAL git in temp repos:
  1. **Default executor creates a mesh branch via real git** — `createBranch('node1', 'task42')` → verify branch exists via `git branch --list`.
  2. **Default executor lists real mesh branches** — pre-seed two branches via direct git → `listMeshBranches()` → assert names match.
  3. **Default executor propagates ProcessContextDenied when ctx restricts git** — restrictive ctx → `createBranch()` throws + audit records denial + real git repo has NO mesh branch.
  4. **Default executor allows git when ctx permits it** — permissive ctx → `createBranch()` succeeds + audit records allow + real git has the branch.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `tests/integration/mesh-default-executor.integration.test.ts` | +4 | NEW integration test file — exercises real git temp repos |
| (no source changes) | 0 | v854 is a verify ship per #10438 — adds proof of the v843 wire, not new substrate |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **72 consecutive ships at 1.178**, new widest pressure margin record by 1 over v853's 71).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23** (UNCHANGED).
Lessons in manifest (unique): **83** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).
KNOWN_UNWIRED Process: **11** (UNCHANGED).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).
Operational axes: **4** (UNCHANGED — but verify axis now has its first applied instance after the v847 codification).

## Verify-ship pattern (per #10438)

```
v1.49.843 (substrate ship) → wire + unit tests (mocked GitExecutor) → ship
                            ↓
v1.49.847 (codify ship)    → #10438 promotes verify axis to numbered lesson
                            ↓
v1.49.854 (verify ship)    → real-git integration test → proof of behavior
```

The trigger per #10438: `≥10 ships since first non-test caller landed and no integration test exists`. v853 was exactly 10 ships from v843 (the canonical hit); v854 is one ship past — landing within tolerance and matching the verify-overdue forecast from the v843 retrospective.

## Surface delta

- 1 NEW test file (139 LOC including 30 LOC docstring)
- 0 source changes
- 0 manifest changes
- 0 new dependencies

## Why integration over unit tests

Unit tests in `src/mesh/mesh-worktree.test.ts` use a mocked GitExecutor — they prove the WIRE signature (createBranch calls the executor with the right command, ensureProcessAllowed is invoked, etc.). The integration test proves the WIRE BEHAVIOR — that the default executor actually shells out to real git, that the security check actually fires before execSync, that the audit record carries the actual argv from the tokenized git command. Both layers are necessary; neither substitutes for the other per #10438's anti-patterns.
