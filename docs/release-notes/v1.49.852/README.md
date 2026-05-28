> Following v1.49.851 — _ProcessContext singleton chip: `src/skill/version-backfill.ts`_, v1.49.852 is the **fifth ship of the v848-v856 nine-ship campaign** and fourth of five ProcessContext singleton chip ships. This ship is a **stale-import cleanup** rather than a wire: `src/scan-arxiv/bridge.ts` imported `execFileSync` but never called it. Removing the dead import takes the file out of audit scope cleanly. Second instance of stale-entry chip (cf. v1.49.834 `intelligence/analyzer/git.ts` wired-but-still-in-allowlist variant; this one is import-without-use). **KNOWN_UNWIRED Process count: 13 → 12.**

# v1.49.852 — Stale-import cleanup: `src/scan-arxiv/bridge.ts`

**Shipped:** 2026-05-28

Fifth ship of the nine-ship v848-v856 campaign; fourth of five chip ships in the ProcessContext singleton-chip batch. **Variant: stale-import cleanup, not a wire.** The `scan-arxiv/bridge.ts` module imported `execFileSync` from `node:child_process` but never called it — likely leftover from an earlier version where the bridge ran an external script directly. Removing the unused import takes the file out of the audit's grep scope (`/from\s+['"](?:node:)?child_process['"]/`), eliminating the need for a wire entirely.

This is the **second stale-entry chip** in the campaign-cluster series. The first was v1.49.834 (`intelligence/analyzer/git.ts`), which was wired but still in the allowlist — a different stale shape. v852 confirms the v1.49.806 forward-observation that audit unidirectionality leaves BOTH stale-shape variants undetected by the runtime check.

## What shipped

- **MODIFIED** `src/scan-arxiv/bridge.ts` — removed the unused `import { execFileSync } from 'node:child_process';` line.
- **MODIFIED** `src/security/process-context-audit.test.ts` — removed `'src/scan-arxiv/bridge.ts'` from `KNOWN_UNWIRED`, replaced with inline comment documenting the v1.49.852 stale-import cleanup variant + cross-reference to v1.49.834 stale-entry-wired variant.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| (no new tests) | 0 | Dead-code removal; no functional change |
| `src/security/process-context-audit.test.ts` | (no count change) | 2051 audit-test cases pass; file out of audit scope (no `node:child_process` import) and removed from `KNOWN_UNWIRED` simultaneously |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **70 consecutive ships at 1.178**, new widest pressure margin record by 1 over v851's 69).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23** (UNCHANGED).
Lessons in manifest (unique): **83** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).
**KNOWN_UNWIRED Process: 13 → 12.**
KNOWN_UNWIRED Egress: **11** (UNCHANGED).
Operational axes: **4** (UNCHANGED).

## Surface delta

- 2 files modified
- -1 source LOC (removed import line)
- +7 LOC + cross-reference comment in audit-test
- 0 new dependencies
- 0 manifest changes

## Stale-entry pattern (forward-observation reinforcement)

The v1.49.806 forward-observation noted that the audit's runtime check is unidirectional: it catches NEW child-process callers that aren't in the allowlist + don't have wires, but it does NOT catch entries that ARE in the allowlist + don't need to be. v834 found one wired-but-still-in-allowlist instance; v852 finds one imports-without-using instance. Both are stale shapes the unidirectional check missed.

**Below-threshold observation (2nd instance of stale-entry pattern):** Worth considering an inverse-check audit tool (`tools/security/check-stale-known-unwired.mjs`) that scans the KNOWN_UNWIRED list and flags entries that either (a) no longer import child_process or (b) already call ensureProcessAllowed without being removed. Cross-references v847's #10428 codify cadence (counter-cadence ship territory) and #10421 metric-emitting-tool discipline.

This observation is the SECOND instance of a stale-entry-detection pattern; per #10426 the 2-instance threshold is met for refinements of existing parent disciplines. **Not promoting in this ship** (campaign focus is chip-execution, not codification), but documenting for the next codify ship to pick up.
