# v1.49.852 — Stale-import cleanup: `src/scan-arxiv/bridge.ts`

**Released:** 2026-05-28

## Why this ship

Fifth ship of the operator-directed v848-v856 nine-ship campaign; fourth of five ProcessContext singleton chip ships. **Variant: stale-import cleanup, not a wire.**

The `scan-arxiv/bridge.ts` module imported `execFileSync` but never invoked it — leftover from a prior version. Removing the dead import takes the file out of the audit's grep scope, eliminating the need for a wire. This is the second stale-entry chip in the cluster (cf. v1.49.834 wired-but-still-in-allowlist variant).

## The fix

```diff
 import * as fs from 'node:fs';
 import * as path from 'node:path';
-import { execFileSync } from 'node:child_process';
```

1 LOC removal.

## Surface delta

- 2 files modified
- -1 source LOC + 7 LOC audit-test comment
- 0 new tests (dead-code removal)
- 0 new dependencies
- KNOWN_UNWIRED Process: 13 → 12

## Engine state

NASA degree at **1.178** (UNCHANGED — **70 consecutive ships at 1.178**, new widest pressure margin record by 1 over v851's 69).
Counter-cadence count UNCHANGED at 6.
Operational axes UNCHANGED at 4.
