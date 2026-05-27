# v1.49.827 — Lessons

## New lesson candidates (0 promoted; 1 carried forward)

No new lesson candidates promoted this ship. Chip ships applying an existing pattern typically don't generate new candidates unless the pattern's shape needs refinement. One observation surfaced at the 1-instance threshold and is carried forward for next codify ship.

### Carried forward: DI-executor + hoisted-check refinement of #10433

The `CommandExecutor` dependency-injection pattern combined with multiple swallowing try/catches produces a different wire-cost shape than the pure internal-helper case codified at v824. Cost shape:

```
wire_cost_LOC ≈ 4 + (3 × N_swallowing_callsites)
```

vs the pure internal-helper case:

```
wire_cost_LOC ≈ 10 + N_callsites + 4 × N_public_threading_signatures
```

Both files in this ship that exhibit the DI-executor shape (health-check.ts, venv-manager.ts) match the new cost shape closely:
- health-check.ts: 1 swallowing callsite → 4 + 3 = ~6 LOC actual (6 LOC predicted, exact match)
- venv-manager.ts: 6 swallowing callsites → 4 + 18 = ~22 LOC actual ~26 LOC (close)

Below 2-instance threshold for codification per #10426 (2 instances in 1 ship counts as 1 application of the pattern observation — wait for 2nd ship before promotion). Defer to a future codify ship.

## Forward-test of existing lessons

### #10433 — Internal-helper pattern for `ctx?` threading

**Status:** CALIBRATED for pure internal-helper shape. extractor.ts at ~12 LOC matches the low-end of the predicted band (14-20 LOC) for 1-callsite files. For files with internal helper AND multiple call sites, v825's git/core batch already validated 18-22 LOC.

**Refinement surfaced:** DI-executor shape (where the file has a dependency-injected executor + swallowing try/catches) requires the #10427 hoist pattern instead, with a different cost shape. See "Carried forward" above.

### #10427 — Failure-mode contracts (load-bearing chokepoint denials)

**Status:** LOAD-BEARING. This ship's health-check.ts and venv-manager.ts both have try/catches that swallow exec errors into structured fail-results. Per #10427, the security check MUST hoist OUT of those try/catches. Applied to both files (1 hoist in health-check, 6 hoists in venv-manager). Without #10427, the natural pattern would have been "put the check in defaultExec" — which would have been silently caught by `catch (err) { ... return makeFailResult(...) }`, defeating the entire security chokepoint.

This is the cleanest forward-validation of #10427 since its codification — 7 hoists in 1 ship, all driven by the same load-bearing argument.

### #10432 — KNOWN_UNWIRED ledger discipline

**Status:** REAFFIRMED (4th instance). The 3-file batch chip ratchets `KNOWN_UNWIRED` Process: 28 → 25. Block-comment consolidation applied: inline forward-note replaced with 3-line completion comment. Per-ship release-notes record `KNOWN_UNWIRED N → N-K` (here: 28 → 25).

### #10434 — Ratchet-ledger pattern (KNOWN_UNWIRED generalization)

**Status:** ORTHOGONAL — not exercised this ship (chokepoint context is the original instance, not the generalization).

## Tentative observations carried forward

- **DI-executor + hoisted-check refinement of #10433** (1 ship containing 2 instances — but counted as 1 ship-instance per #10426 cadence). Defer until 2nd ship.
- LOC-band-by-callsite-count refinement for #10433 (now 2 ships observed: v825 + v827 — eligible for codification by #10426). Move to "ready for next codify ship".
- `onPredictions` substrate-consumer wire pattern (still 2 instances per v826: copper + selector). Eligible — carried from v826 handoff.
- Cross-rootdir wire pattern (1 strong instance per v823). Wait for 2nd.

## Cadence observation

This is a consume-axis ship (chips KNOWN_UNWIRED Process 28 → 25), continuing the consume-axis run that began at v824's calibrate ship. Per #10428 meta-cadence, consume ships at ≤6-ship cadence from substrate-to-first-non-test-caller — chokepoints have been in 5 ships now (v820, v825, v827 for git/core+dogfood; v819 aminet; v810 copper). Within cadence rule. Codify-axis is at ~3 ships since v824 (current ship) — cadence floor is 7-10 ships, so next codify ship is targeted ~v832-834.
