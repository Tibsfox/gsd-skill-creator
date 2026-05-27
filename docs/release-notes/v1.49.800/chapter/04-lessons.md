# 04 — Lessons Learned: v1.49.800 T1.1 Ship 6

## 0 candidates emitted; 0 promoted to ESTABLISHED

v800 is a long-running-mode ship that reuses the v795-v799 substrate. One tentative observation (watch-loop tear-down race) carried forward as a non-promoted note awaiting second-instance forward-shadow.

## Disciplines reinforced (no new IDs)

- **#10412 (Recon-first as default)** — 13th consecutive application since v784 codification. Read the existing CLI command structure to plan the runCalibrationTick extraction.
- **#10422 (Verdict-pattern surface separation)** — 10th forward application. Watch-loop module is a new surface separate from audit-log / registry / calibration-loop / threshold-writer / CLI. The runCalibrationTick extraction is a refactor surface separate from the watch-mode entry surface.
- **#10423 (Lightest wire that satisfies the verdict)** — 10th forward application. Resisted four temptations: chokidar abstraction (smaller dep surface), file-rename handling (not the use-case), SIGTERM handling (interactive-only ship), JSON-line streaming output (defer until consumer surfaces).
- **#10424 (ESTABLISHED at v794) — Adoption-refresh AFTER bump-version.** Applied. Seventh consecutive ship under the gate.
- **#10426 candidate (v798) — APPLIED at second consumer.** The `runCalibrationTick` extraction is a second-instance abstraction extraction (after the v798 observation-source registry). Same discipline: extract at second consumer, not third. Validates #10426 for the second time within this session.

## Tentative observation: watch-loop tear-down race pattern (NOT yet a candidate)

The initial v800 tearDown resolved `done` synchronously upon abort, without checking whether a callback was mid-execution. Test environment caught it quickly (afterEach rmSync raced with mid-read callback); fix was to await any in-flight callback before resolving done.

**Statement:** Long-running primitives that invoke async callbacks MUST await any in-flight callback during teardown before signaling completion.

**Promotion path:** Second-instance forward-shadow in another long-running primitive, OR codification at next discipline-coverage codification ship. Currently a single-instance observation.

## #10425 promotion path discussion (NOT promoted this ship)

v800 has no e-process redesign surface. Status: unchanged.

## #10426 promotion path discussion (NOT promoted this ship)

v800 applies #10426 a second time within this session (runCalibrationTick extraction). This is consumer-side validation, not the second-instance discipline emergence — same pattern of "extract at second consumer" being right-sized. The original v798 extraction remains the first instance of the discipline; promotion path unchanged.

## Meta-observation: chained-session prediction-tracking (continued)

Updated wall-clock data after six T1.1 ships:

- v795 ship 1 (new vertical): ~75 min.
- v796 ship 2 (same-class extension, cold-start): ~30 min.
- v797 ship 3 (same-class extension, chained): ~15-20 min.
- v798 ship 4 (cross-class + new module, chained): ~45-60 min.
- v799 ship 5 (new module consuming established abstractions, chained): ~30-40 min.
- **v800 ship 6 (new module + CLI refactor, chained): ~40-50 min.**

The v798 retro's prediction held: "v800 (--watch mode, no new module, modifies CLI command): expect ~30-45 min." Actual landed at ~40-50 min — slightly above prediction because the tear-down race fix wasn't anticipated.

Refined estimates for v801:

- v801 (/sc:status integration, modifies different existing command): expect 30-45 min if the pattern holds. No new module surface anticipated; the work is reading audit-log + threshold-state and rendering into the existing /sc:status output path.

## Cross-discipline observation: watch-loop debounce as correctness device

The 200ms debounce on the watch loop is not just a UX choice — it's a correctness device. `fs.watch` on some platforms (notably macOS) fires multiple events per logical file change (a typical editor write produces both `rename` and `change`). Without the debounce, the callback fires twice per save, producing duplicate audit-log entries and confusing the operator.

This is worth codifying alongside the tear-down race observation IF a second instance surfaces.

## Discipline-coverage status post-ship

Manifest entries: 15 → 15 (unchanged)
Manifest lessons: 65 → 65 (no new formal ID)
Codified-vs-uncodified gap: 2 (unchanged — #10425 + #10426 both still candidates)

## Forward backlog (post-v800)

| ID | Severity | Apply | Source |
|---|---|---|---|
| #10425 candidate | MEDIUM | Two-sided e-processes on bounded binary observations are insensitive to unanimous direction. | v795 design |
| #10426 candidate | MEDIUM | Extract per-class registries at the SECOND class instance, not the third. Re-validated v800 at second consumer. | v798 architectural-choice + v800 consumer |
| (tentative) watch-loop tear-down race | NOTE | Long-running primitives MUST await in-flight callbacks during teardown. | v800 implementation |
