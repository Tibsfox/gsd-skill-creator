# v1.49.800 — T1.1 Ship 6: Bounded-Learning `--watch` Mode

**Released:** 2026-05-27
**Type:** forward-cadence Tier 1 audit ship 6/4-7 (NOT a NASA degree advance, NOT counter-cadence)
**Predecessor:** v1.49.799 — T1.1 Ship 5 (Bounded-Learning Audit Log)
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** T1.1 ship 6 — long-running `--watch` mode for cross-session calibration

## Summary

Adds `--watch` mode to `skill-creator bounded-learning`. The CLI now re-runs the calibration loop whenever `--suggestions` or `--config` changes on disk, with a debounced coalesce window (default 200ms). Closes the gap where operator decisions accumulating during a session were invisible until manual re-invocation.

**v1.49.800 milestone:** crosses the milestone-number boundary (v797..v799 were T1.1 extensions; v800 starts the second hundred-block of v1.49.* milestones).

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/bounded-learning/watch-loop.ts` | NEW | `runWatchLoop(paths, callback, options)` — fs.watch per path + 200ms debounce + AbortSignal stop + missing-path poller (500ms). Returns `{ stop, done }` handle. |
| `src/bounded-learning/index.ts` | MODIFIED | Re-export `runWatchLoop` + types. |
| `src/cli/commands/bounded-learning.ts` | MODIFIED | Extracted `runCalibrationTick(ctx)` helper from the one-shot path. Added `--watch`, `--watch-debounce <ms>` flags, and `runInWatchMode(ctx, debounceMs, signal)`. Test hook: `boundedLearningCommand(args, { watchSignal })` injects an AbortSignal for cooperative shutdown. SIGINT handler installed for interactive use. |
| `src/bounded-learning/__tests__/watch-loop.test.ts` | NEW | 8 unit tests: single-change fire / debounce coalescing / multiple windows / multi-path / fireImmediately / abort-signal stop / direct stop / missing-path poller pickup. |
| `src/cli/commands/bounded-learning.test.ts` | MODIFIED | +3 CLI integration tests: initial-tick-only / re-runs-on-change / --watch-debounce override. |
| `docs/release-notes/v1.49.800/` | NEW | 5-file chapter set. |

## What changed (behaviorally)

- `skill-creator bounded-learning --watch` enters long-running mode. Fires one initial calibration tick, then re-fires after every debounced change to `--suggestions` or `--config`. Exits on SIGINT (Ctrl+C).
- `--watch-debounce <ms>` overrides the default 200ms debounce window.
- Audit log captures every tick (initial + each post-change), so the operator can replay the watch session even after exit.
- Best-effort silent contract for audit-log writes (carried from v799) extends naturally to watch mode: a transient write failure doesn't tear down the loop.

## What this ship is not

- Not a NASA degree advance.
- Not a counter-cadence ship.
- Not a polling-only fallback. Uses native `fs.watch` (with a missing-path poller for files not yet created).
- Not a daemon. The CLI is interactive: operator runs in a terminal, hits Ctrl+C to exit. Daemonization is a separate concern.

## Verification

- `npx vitest run src/bounded-learning/ src/cli/commands/bounded-learning.test.ts` → **132/132 PASS** (121 from v799 + 11 new: 8 watch-loop unit + 3 CLI integration).
- `npm run build` → PASS (TypeScript strict).
- Smoke: `node dist/cli.js bounded-learning --help` lists `--watch` + `--watch-debounce` under Options.
- The watch-loop's tear-down was hardened mid-implementation to await in-flight callbacks before resolving the `done` promise — preventing a test-environment race where `afterEach` rmSync would delete the tmpdir while a callback was mid-file-read.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5.

## Audit roadmap status

| Item | Status |
|---|---|
| T1.1 ship 1 (primitive) | v795 |
| T1.1 ship 2 (cooldown_days) | v796 |
| T1.1 ship 3 (auto_dismiss_after_days) | v797 |
| T1.1 ship 4 (token_budget + registry) | v798 |
| T1.1 ship 5 (audit log) | v799 |
| **T1.1 ship 6 (--watch mode)** | **v800 (this ship)** |
| T1.1 ship 7 (/sc:status integration) | OPEN (chained session continues) |

## Forward path: T1.1 ship 7 (final ship of chained session)

- **v801 — `/sc:status` integration** (~30-45 min). Surface bounded-learning calibration state in the existing /sc:status output. Includes: current values for all wired thresholds, last calibration timestamp from audit log, pending recommendations.

## Lesson candidate emitted this ship

**Tentative observation: watch-loop tear-down race pattern.** During v800 implementation, the initial `tearDown()` resolved the `done` promise immediately upon abort, without awaiting any in-flight callback. This produced a test-environment race where afterEach rmSync deleted the tmpdir while the callback was mid-readFile. Pattern: long-running loops that invoke async callbacks MUST await in-flight callbacks during teardown before signaling completion. This is a single-instance observation; promotion to candidate after second-instance forward-shadow.

## Lesson-backlog state

| Phase | Open candidates |
|---|---|
| v798 close | 2 (#10425 + #10426) |
| v799 close | 2 (#10425 + #10426) |
| **v800 close** | **2** (#10425 + #10426 — unchanged; watch-loop tear-down race is tentative observation, not promoted) |
