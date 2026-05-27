> Following v1.49.799 — _T1.1 Ship 5: Bounded-Learning Audit Log_, v1.49.800 ships as T1.1 ship 6 — `--watch` mode for cross-session calibration. CLI becomes long-running, re-firing the calibration loop on every debounced change to suggestions or config files.

# v1.49.800 — T1.1 Ship 6: Bounded-Learning `--watch` Mode

**Shipped:** 2026-05-27

The sixth ship in the T1.1 calibration-loop arc, fourth in the chained-session run. Adds long-running watch mode to the CLI: operator runs `bounded-learning --watch` in a terminal, accumulates suggestion decisions in their session, and sees the recommendation update automatically.

## What shipped

- **NEW `src/bounded-learning/watch-loop.ts`** — `runWatchLoop(paths, callback, options)`. Per-path `fs.watch` + 200ms debounce + AbortSignal stop + 500ms poller for missing paths. Returns `{ stop, done }` handle. Hardened mid-implementation: `tearDown` awaits in-flight callbacks before resolving `done` (prevents teardown race with caller cleanup).
- **`src/cli/commands/bounded-learning.ts`** — Per-tick logic extracted into `runCalibrationTick(ctx)`. One-shot mode calls it once; `--watch` mode calls it via `runWatchLoop` on every debounced file change. New flags: `--watch`, `--watch-debounce <ms>`. Test hook: `boundedLearningCommand(args, { watchSignal })` for AbortSignal injection.
- **`src/bounded-learning/index.ts`** — Re-exports new symbols.
- **+11 tests** across 2 files (8 watch-loop unit + 3 CLI integration).

Test count: **132/132 PASS** in the bounded-learning + CLI test surface (was 121 at v799 close; +11 this ship).

## Through-line

T1.1 is the calibration-loop arc. v795-v799 built the primitive, three wired thresholds, the per-class observation-source registry, and the audit log. v800 makes the loop long-running. v801 (next ship) makes it visible from /sc:status.

The architectural compounding continues: `runCalibrationTick` is the per-tick helper consumed by both the one-shot CLI path and the watch loop. The watch loop's audit-log writes use the same `appendAuditLogEntry` API from v799 — no code path duplication.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5.

## Audit roadmap progress

| Item | Status |
|---|---|
| T1.1 ships 1-5 | Delivered v795-v799 |
| **T1.1 ship 6** | **Delivered at v800 (this ship — --watch mode)** |
| T1.1 ship 7 | OPEN (/sc:status integration — final chained ship) |

## Real-world smoke test result

```
$ node dist/cli.js bounded-learning --help | grep watch
  --watch              Re-run loop on suggestions.json or skill-creator.json changes
  --watch-debounce <ms> Watch-mode debounce window (default 200ms; only with --watch)
```

Interactive smoke test deferred to operator (would block this ship's main-context window). The integration test exercises the watch loop end-to-end via the AbortSignal injection hook.

## Forward candidates

- **v801 — `/sc:status` integration** (~30-45 min — final chained ship).

After the chained session:

- Real token-budget observation source.
- Audit-log query/report subcommand.

---
**Prev:** [v1.49.799](../v1.49.799/00-summary.md) · _(current tip after ship)_
