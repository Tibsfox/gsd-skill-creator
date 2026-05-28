> Following v1.49.852 — _Stale-import cleanup: `src/scan-arxiv/bridge.ts`_, v1.49.853 is the **sixth ship of the v848-v856 nine-ship campaign** and **fifth and last** of five ProcessContext singleton chip ships. This ship chips `src/dashboard/collectors/git-collector.ts` — `collectGitMetrics()` `execFileAsync('git', args)` wired through the chokepoint with hoisted check per Lesson #10427. **KNOWN_UNWIRED Process count: 12 → 11.** End of the chip cluster; v854 opens the verify ship.

# v1.49.853 — ProcessContext singleton chip: `src/dashboard/collectors/git-collector.ts`

**Shipped:** 2026-05-28

Sixth ship of the nine-ship v848-v856 campaign; fifth and last of five chip ships in the ProcessContext singleton-chip batch. The `git-collector` module's `collectGitMetrics()` shells out to `execFileAsync('git', [...])` to extract commit history for the dashboard. The function is a fault-tolerant accessory (returns empty result on any failure per the contract documented at line 172), but security denials are load-bearing per Lesson #10427 — the wire hoists `ensureProcessAllowed` OUTSIDE the swallow-everything try/catch so `ProcessContextDenied` propagates while not-a-repo + git-unavailable + parse-failure continue to return empty result silently.

## What shipped

- **MODIFIED** `src/dashboard/collectors/git-collector.ts` — imports `ensureProcessAllowed` + `ProcessContext`; `collectGitMetrics(options, ctx?: ProcessContext)` accepts optional `ctx` as second positional parameter; `ensureProcessAllowed(ctx, 'dashboard/collectors/git-collector', 'exec-file', 'git', args)` hoisted BEFORE the try block per Lesson #10427.
- **MODIFIED** `src/security/process-context-audit.test.ts` — removed `'src/dashboard/collectors/git-collector.ts'` from `KNOWN_UNWIRED`, replaced with inline comment documenting the v1.49.853 wire shape.
- **MODIFIED** `src/dashboard/collectors/git-collector.test.ts` — new `describe('ProcessContext wire (v1.49.853)')` block with 3 test cases (deny + allow + backward-compat).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/dashboard/collectors/git-collector.test.ts` | +3 | New `ProcessContext wire` describe block |
| `src/security/process-context-audit.test.ts` | (no count change) | 2051 audit-test cases pass; file no longer in `KNOWN_UNWIRED` allowlist |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **71 consecutive ships at 1.178**, new widest pressure margin record by 1 over v852's 70).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23** (UNCHANGED).
Lessons in manifest (unique): **83** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).
**KNOWN_UNWIRED Process: 12 → 11.**
KNOWN_UNWIRED Egress: **11** (UNCHANGED).
Operational axes: **4** (UNCHANGED).

## Wire shape (per Lesson #10427)

```ts
export async function collectGitMetrics(
  options: GitCollectorOptions = {},
  ctx?: ProcessContext,
): Promise<GitCollectorResult> {
  const { ...args computation... } = options;

  // Security: hoisted ensureProcessAllowed propagates ProcessContextDenied
  // even though the try below swallows all git failures into an empty result
  // per the fault-tolerant contract.
  ensureProcessAllowed(ctx, 'dashboard/collectors/git-collector', 'exec-file', 'git', args);

  try {
    const { stdout } = await execFileAsync('git', args, { ... });
    // ...parse + return
  } catch {
    return { commits: [], totalCommits: 0, timeRange: null }; // fault-tolerant
  }
}
```

Matches v851 (`version-backfill`) hoist-at-top variant. The argv vector is `args` (already computed earlier in the function), so the audit-telemetry representation and the actual `execFileAsync` invocation share the exact same argv.

## Surface delta

- 3 files modified
- +14 source LOC (5 LOC in `git-collector.ts` — import + 1 param + 7-line hoisted call; 6 LOC + comment in audit-test KNOWN_UNWIRED swap; ~30 LOC test code)
- 0 new dependencies
- 0 manifest changes

## Chip-cluster summary (v849-v853)

| Ship | File | Variant | KNOWN_UNWIRED Process |
|---|---|---|---|
| v849 | `src/retro/changelog-watch.ts` | Hoist-at-top, single-call-site (forensic accessory) | 16 → 15 |
| v850 | `src/orchestrator/extension/extension-detector.ts` | Hoist-inside-branch, DI-override early-return | 15 → 14 |
| v851 | `src/skill/version-backfill.ts` | Hoist-at-top, single-call-site (forensic accessory) | 14 → 13 |
| v852 | `src/scan-arxiv/bridge.ts` | Stale-import cleanup (no wire) | 13 → 12 |
| v853 | `src/dashboard/collectors/git-collector.ts` | Hoist-at-top, single-call-site (fault-tolerant accessory) | 12 → 11 |

**Net 5-chip campaign batch: KNOWN_UNWIRED Process 16 → 11** (-5 entries, -31% of grandfathered list). 4 wires + 1 stale-import cleanup. Pattern coverage: hoist-at-top × 3, hoist-inside-branch × 1, stale-import-cleanup × 1.
