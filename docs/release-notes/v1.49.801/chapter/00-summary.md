> Following v1.49.800 — _T1.1 Ship 6: Bounded-Learning `--watch` Mode_, v1.49.801 ships as the final T1.1 ship — `/sc:status` integration. Operators now see bounded-learning calibration state at every session-start status check.

# v1.49.801 — T1.1 Ship 7: `/sc:status` Bounded-Learning Integration (T1.1 ARC CLOSED)

**Shipped:** 2026-05-27

The final ship in the T1.1 calibration-loop arc, and the fifth/final ship in this 5-ship chained session. Adds `--summary` flag to `skill-creator bounded-learning` (one JSON object summarizing all wired thresholds + audit-log + pending recommendations) and a Step 5.5 in `/sc:status` that consumes it and renders a per-threshold calibration dashboard.

## What shipped

- **`src/cli/commands/bounded-learning.ts`** — New `--summary` flag + `runSummary(args)` helper. Single JSON object: 4 wired thresholds (currentValue, observationSource, lastTick), audit-log metadata (path, totalEntries, lastEntryAt), pendingRecommendations array (dry-run results with non-hold direction).
- **`project-claude/commands/sc/status.md`** — Added Step 5.5 "Display bounded-learning calibration state": invokes the new `--summary` subcommand with 5s timeout (best-effort silent skip on failure); renders per-threshold table with `(unwired)` annotations and a pending-recommendation warning block when applicable.
- **`.claude/commands/sc/status.md`** — Installed copy synced via `project-claude/install.cjs`.
- **+4 tests** in `bounded-learning.test.ts` covering the --summary path.

Test count: **136/136 PASS** in the bounded-learning + CLI test surface (was 132 at v800 close; +4 this ship).

## Through-line

T1.1 ARC CLOSED. Seven ships over two sessions (v795 cold-start + v796-v801 chained-session with operator "all" pivot). Original scope was 4-6 ships; final count 7 because v798 forced the cross-class observation-source registry extraction.

The chained-session compounding effect is empirically validated:

- Same-class extensions in chained sessions land at ~15-25 min (vs ~30 min cold-start).
- Architectural-tax ships add ~30 min over the lightest-wire baseline but unlock 2-3x compounding for downstream consumers.
- Final integration ships (this one) ride the entire architectural stack — no new modules needed.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5.

## T1.1 arc final state

After 7 ships:

- 4 of 6 calibratable thresholds wired (`suggestions.min_occurrences`, `suggestions.cooldown_days`, `suggestions.auto_dismiss_after_days`, `token_budget.warn_at_percent`). `token_budget.max_percent` and `observation.retention_days` remain unwired.
- Per-class observation-source registry in place; suggestions class wired, token_budget + observation classes unwired (stub).
- Append-only JSONL audit log writing per CLI invocation; tolerant reader API.
- Long-running `--watch` mode with debounce + AbortSignal + missing-path poller.
- `/sc:status` surfaces calibration state with per-threshold table + pending-recommendation warnings.

## Audit roadmap progress

| Item | Status |
|---|---|
| T1.1 ships 1-6 | Delivered v795-v800 |
| **T1.1 ship 7** | **Delivered at v801 (this ship — T1.1 ARC CLOSED)** |
| T1.3 (College of Knowledge consumer engine) | OPEN — 3-5 ships |
| S3/S4/S6/S7 (Strengthening Levers) | OPEN |
| Real token-budget observation source | OPEN |
| Audit-log query/report subcommand | OPEN |

## Real-world smoke test result

```
$ node dist/cli.js bounded-learning --summary | head -20
{
  "thresholds": [
    {
      "threshold": "suggestions.min_occurrences",
      "currentValue": 3,
      "observationSource": { "sourceId": "suggestions.json", "wired": true },
      "lastTick": null
    },
    ...
  ],
  "auditLog": { "path": ".planning/patterns/bounded-learning-log.jsonl", "totalEntries": 0, "lastEntryAt": null },
  "pendingRecommendations": [],
  "wiredThresholdCount": 4
}
```

---
**Prev:** [v1.49.800](../v1.49.800/00-summary.md) · _(T1.1 ARC CLOSED with this ship)_
