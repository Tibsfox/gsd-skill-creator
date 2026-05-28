# v1.49.853 — ProcessContext singleton chip: `src/dashboard/collectors/git-collector.ts`

**Released:** 2026-05-28

## Why this ship

Sixth ship of the operator-directed v848-v856 nine-ship campaign; **fifth and last of the ProcessContext singleton-chip batch.** Closes the chip-execution cluster cleanly; v854 opens the mesh-verify ship.

`git-collector` was chosen as the fifth/last chip because:
- 221 LOC, single execFile call site
- Existing test file with `vi.mock('child_process')` infrastructure
- Fault-tolerant accessory contract documented in source — matches the chip pattern cleanly
- Async execFile (vs sync execSync) — exercises the await-async-throw test pattern alongside v851 sync surfaces, completing variant coverage

## The wire

```ts
export async function collectGitMetrics(
  options: GitCollectorOptions = {},
  ctx?: ProcessContext,
): Promise<GitCollectorResult> {
  // ...args computation
  ensureProcessAllowed(ctx, 'dashboard/collectors/git-collector', 'exec-file', 'git', args);
  try {
    const { stdout } = await execFileAsync('git', args, { ... });
    // ...
  } catch {
    return { commits: [], totalCommits: 0, timeRange: null };
  }
}
```

5 LOC change. Same v851 hoist-at-top shape, async variant.

## Surface delta

- 3 files modified
- +14 source LOC + ~30 test LOC
- 0 new test files (3 new test cases in new `ProcessContext wire (v1.49.853)` describe block)
- 0 manifest changes
- 0 new dependencies
- KNOWN_UNWIRED Process: 12 → 11

## Engine state

NASA degree at **1.178** (UNCHANGED — **71 consecutive ships at 1.178**, new widest pressure margin record by 1 over v852's 70).
Counter-cadence count UNCHANGED at 6.
Operational axes UNCHANGED at 4.
