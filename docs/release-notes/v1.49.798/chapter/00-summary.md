> Following v1.49.797 — _T1.1 Ship 3: Wire `suggestions.auto_dismiss_after_days`_, v1.49.798 ships as T1.1 ship 4 — the first non-trivial extension. Wires `token_budget.warn_at_percent` (first non-suggestions threshold class) and introduces a per-threshold-class observation-source registry to honestly represent the architectural reality that different threshold classes draw from different data sources.

# v1.49.798 — T1.1 Ship 4: Wire `token_budget.warn_at_percent` + Per-Class Observation-Source Registry

**Shipped:** 2026-05-27

The fourth ship in the T1.1 calibration-loop arc, and the first non-trivial wedge in the chained-session run. v795-797 wired three thresholds all in the `suggestions.*` class, all drawing observations from `.planning/patterns/suggestions.json`. v798 wires the first `token_budget.*` threshold and introduces the per-class observation-source registry needed to represent multiple classes honestly.

## What shipped

- **NEW `src/bounded-learning/observation-sources.ts`** — Registry module. Exports `observationSourceFor(threshold)` returning `{ sourceId, description, wired }` metadata, and `loadObservationsForThreshold(threshold, options)` dispatching by class prefix. `suggestions.*` → loads `.planning/patterns/suggestions.json`; `token_budget.*` and `observation.*` → empty (unwired); unknown classes → defensive empty.
- **`src/cli/commands/bounded-learning.ts`** — `SUPPORTED_THRESHOLDS` extended from 3 to 4 (adds `'token_budget.warn_at_percent'`). CLI now calls `loadObservationsForThreshold` instead of inline `loadSuggestions + entriesToObservations`. Renderers surface observation-source metadata (`observationSource: { sourceId, wired, description }` in JSON; labeled line in text output; yellow `(NOT YET CAPTURED)` annotation for unwired sources). Module docstring expanded to document the per-class architecture.
- **`src/bounded-learning/index.ts` + `types.ts`** — Re-export new types/functions; docstring refresh enumerating four wired thresholds.
- **+20 tests** across 4 files (12 dedicated observation-sources unit tests + 4 calibration-loop primitive tests for token_budget + 1 threshold-writer sibling-preservation test across two classes + 3 CLI tests for token_budget end-to-end).

Test count: **106/106 PASS** in the bounded-learning + CLI test surface (was 86 at v797 close; +20 this ship).

## Through-line

T1.1 is the calibration-loop arc. v795 was the primitive ship; v796-v797 were sub-30-min extensions within the same observation-source class. v798 is the first ship to cross the class boundary, and it does so by introducing the per-class registry abstraction at the second instance — the discipline-correct extraction point.

The architectural choice was deliberate. Three options were considered (see README): (A) lightest-wire — reuse the suggestions source for token_budget; rejected as semantically dishonest. (B) build a real token-budget observation source; rejected as out-of-scope for v798 (would be its own ship). (C) per-class registry + unwired stub for token_budget; selected. Option C is the right-sized abstraction extraction at the right point in the system's evolution.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5.

## Audit roadmap progress

| Item | Status |
|---|---|
| T1.1 ship 1 | Delivered at v795 (primitive + CLI + writer) |
| T1.1 ship 2 | Delivered at v796 (wire suggestions.cooldown_days) |
| T1.1 ship 3 | Delivered at v797 (wire suggestions.auto_dismiss_after_days) |
| **T1.1 ship 4** | **Delivered at v798 (wire token_budget.warn_at_percent + per-class registry)** |
| T1.1 ships 5-7 | OPEN (audit log, --watch, /sc:status — all chained in this session) |

## Real-world smoke test result

```
$ node dist/cli.js bounded-learning --threshold token_budget.warn_at_percent --json
{
  "threshold": "token_budget.warn_at_percent",
  "currentValue": 4,
  "proposedValue": null,
  "direction": "hold",
  "rejected": false,
  ...
  "observationSource": {
    "sourceId": "token-budget-events",
    "wired": false,
    "description": "Operator response to skill-load token-budget warn events (NOT YET CAPTURED)"
  }
}
```

The wire is verified: the threshold IS calibratable (loop runs, output renders, --apply pipeline accessible), but the architectural gap is visible to the operator (`observationSource.wired: false` + `(NOT YET CAPTURED)` annotation in description). A future ship can wire the source without changing the CLI surface — only the registry's classifier function needs to flip the `wired` boolean and the loader to read the new data source.

## Forward candidates

The chained session continues with three more ships:

- **v799 — Audit log** (~45-60 min — new module surface).
- **v800 — `--watch` mode** (~30-45 min).
- **v801 — `/sc:status` integration** (~30-45 min).

Outside this session:

- Real token-budget observation source (hook skill-load enforcer; log operator-response events). Separate ~45-60 min ship; could land as v802 or wait for actual telemetry need.

---
**Prev:** [v1.49.797](../v1.49.797/00-summary.md) · _(current tip after ship)_
