# Retrospective — v1.49.800

## Carryover lessons applied

- **Lesson #10412 — Recon-first as default.** 13th consecutive application. Read the existing CLI command structure to plan the runCalibrationTick extraction. ~5 min recon → ~40-50 min implementation (watch-loop primitive + CLI refactor + tests + tear-down race fix).
- **Lesson #10422 — Verdict-pattern surface separation.** Re-applied. The watch-loop module is a new surface separate from audit-log, registry, calibration-loop, threshold-writer, and CLI. The runCalibrationTick extraction in the CLI is a refactor surface separate from the watch-mode entry surface.
- **Lesson #10423 — Lightest wire that satisfies the verdict.** Re-applied with deliberate scope choices: (a) used native `fs.watch` instead of a chokidar-style abstraction (smaller dep surface), (b) deferred file-rename / file-move handling (the use-case is editor-save which preserves the path), (c) deferred SIGTERM handling (SIGINT is the Ctrl+C interactive case; SIGTERM/daemon support is a different concern), (d) deferred parsing the JSON output between ticks (the operator can pipe through grep/jq).
- **Lesson #10424 (ESTABLISHED v794) — Adoption-refresh AFTER bump.** Applied. Seventh consecutive ship under the active gate.
- **#10426 candidate (v798) — APPLIED at second consumer.** v800's `runCalibrationTick` extraction is a second-instance abstraction extraction (after v798's observation-source registry). Same discipline: extract at second consumer, not third. Validates #10426 candidate for the second time within the same chained session.

## What Worked

- **Tear-down race fix happened during test failure, not in production.** The initial tearDown resolved `done` immediately. Test environment's afterEach rmSync caught the race within the first integration test run, surfacing the bug before any operator-facing impact. The test loop is a real-world race detector.
- **Extracted runCalibrationTick was reusable verbatim.** The extraction took ~5 min; the watch-mode entry took another ~5 min. No code duplication, no per-mode special cases. The audit log, registry, renderers — all consumed identically from both paths.
- **AbortSignal injection hook keeps tests deterministic.** The command's `{ watchSignal }` option lets tests inject a controller they can abort on demand. No fake-timer scaffolding, no subprocess spawning, no signal mocking.
- **Smoke-test-by-help check.** Verifying `--watch` shows in `--help` was a 1-line operator-facing smoke test. No need to spawn an interactive subprocess to verify the flag is wired.

## What Could Be Better

- **No interactive smoke test run.** The watch mode wasn't actually exercised in a real terminal session during this ship. Integration tests validate the AbortSignal path, but not the SIGINT path. If SIGINT handling has a bug, the operator finds it during first interactive use. The interactive smoke would have taken ~2 min but doesn't fit cleanly into the chained-session main-context window.
- **No JSON-line streaming output mode.** The watch loop emits one full JSON object per tick. For long-running watch sessions, a streaming consumer might prefer one-line JSON-per-tick instead. v800 uses the same renderer as the one-shot mode (multi-line `null, 2` indented). Defer until a real consumer surfaces the need.
- **`FlagLookup` discriminated union STILL in 4 CLI commands; not extracted this ship.** Continuing to defer. The cost remains at ~5 min per future CLI; the extract is ~15 min.
- **Watch-loop has no maximum-fires safety.** A pathological file that rewrites every 50ms would fire the loop continuously. The 200ms debounce window throttles, but doesn't cap total fires. If pathological input becomes a real concern, add `--watch-max-fires N`. Not needed today.

## Surprises

- **The tear-down race was a learning moment.** The initial design treated `done` as "all watchers torn down" — but the contract that matters for callers is "all OUR work has finished." The fix (await in-flight callback) is small but the design lesson is real: long-running primitives need clear "done" semantics that include in-flight async work.
- **`fs.watch` fires twice on some platforms.** macOS fires both `rename` and `change` events for a typical write. The debounce handled this naturally — the second event arrives within the debounce window and gets coalesced. Without the debounce, we'd fire the callback twice per change. The debounce wasn't just a "feels nice" UX choice; it's a correctness choice.

## Lessons applied at v1.49.800 (from v1.49.795-799 and earlier)

- **#10412** (recon-first) — applied. 13th consecutive application.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — applied with explicit deferrals (no chokidar, no SIGTERM, no streaming output, no max-fires).
- **#10424** (Adoption-refresh AFTER bump) — applied; gate inherited from v794.
- **#10425 candidate** — N/A this ship.
- **#10426 candidate — APPLIED at second consumer.** The `runCalibrationTick` extraction is the second-instance pattern. Validates #10426 for the second time in this session.

## Lesson candidate emitted this ship

**Tentative observation (not promoted to candidate yet): watch-loop tear-down race pattern.**

**Statement:** Long-running primitives that invoke async callbacks MUST await any in-flight callback during teardown before signaling completion. Otherwise, callers that begin cleanup (rmSync, network teardown, etc.) immediately after the loop signals done can race with the in-flight callback's async work, producing spurious errors.

**Why:** The initial v800 tearDown resolved `done` synchronously upon abort, without checking whether a callback was mid-execution. Test environment caught it quickly because afterEach rmSync deletes the tmpdir; in production this would have surfaced as intermittent "file disappeared mid-read" errors only under interactive use with very rapid Ctrl+C.

**How to apply:** When designing async loops that own callbacks, the `done`/`stopped`/`shutdown` signal MUST include "no callback is currently running." Track the in-flight callback's promise; await it before resolving the done signal.

**Promotion path:** Promote to lesson candidate when (a) a second-instance forward-shadow surfaces in another long-running primitive, OR (b) codification at next discipline-coverage codification ship. This is currently a single-instance observation, not yet a candidate.

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start. v801 needs fresh recon for the /sc:status surface.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — apply at every extension.
- **#10425 candidate** (two-sided-on-binary insensitivity) — N/A unless e-process re-design surfaces.
- **#10426 candidate** (cross-class abstraction-extraction timing) — apply at every cross-class moment. v800 was the second consumer-side validation in this session.
- **(tentative) watch-loop tear-down race** — apply at every long-running async primitive design.
- **FlagLookup extract** — non-lesson refactor opportunity, now 5 CLI files would benefit, still deferred.

## Verdict on T1.1 ship 6 scope

The `--watch` mode scope landed in one ship at ~40-50 min wall-clock — at the high end of the v796 prediction (~30-45 min). The tear-down race fix added ~10 min over the lightest-wire estimate. The integration test surface was meaningfully larger than v799 because timing-sensitive watch behavior needs explicit sleep + AbortSignal injection. v800 carries forward a tentative observation about tear-down race that may codify if it recurs.
