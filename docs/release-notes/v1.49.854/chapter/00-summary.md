# v1.49.854 — Verify ship: mesh-default-executor integration test against real git

**Released:** 2026-05-28

## Why this ship

Seventh ship of the operator-directed v848-v856 nine-ship campaign; **first verify-overdue ship under newly-codified #10438** (verify axis as a first-class numbered lesson, promoted v847).

The v843 mesh-family chip wired `createMeshWorktreeManager` through ProcessContext using the DI-executor + tokenized-argv shape (later codified at v847 as #10441). Unit tests covered the wire signature against mocks. Per #10438, the verify ship is the named follow-up that proves the wire's BEHAVIOR — that the default executor actually shells out to real git, that `ensureProcessAllowed` actually fires before execSync, that the audit record carries the actual argv tokenized from the git command string.

v854 is one ship past the canonical 10-ship threshold (v853) — landing within tolerance.

## The test

```ts
describe('verify v843 mesh-family default executor against real git (v1.49.854)', () => {
  beforeEach: create temp dir, git init, configure user, initial empty commit
  afterEach: chdir back + rmSync temp dir

  it('default executor creates a mesh branch via real git', ...);
  it('default executor lists real mesh branches', ...);
  it('default executor propagates ProcessContextDenied when ctx restricts git', ...);
  it('default executor allows git when ctx permits it (and records audit)', ...);
});
```

4 test cases. ~139 LOC. Exercises the createMeshWorktreeManager() default-executor path against real git temp repos.

## Surface delta

- 1 NEW test file (`tests/integration/mesh-default-executor.integration.test.ts`)
- 0 source changes
- 0 manifest changes
- 0 new dependencies

## Engine state

NASA degree at **1.178** (UNCHANGED — **72 consecutive ships at 1.178**, new widest pressure margin record by 1 over v853's 71).
Counter-cadence count UNCHANGED at 6.
Operational axes UNCHANGED at 4 (but verify axis now has its first applied instance under codification).
