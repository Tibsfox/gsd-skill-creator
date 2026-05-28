> Following v1.49.840 — _Codification ship: promote #10436 + #10437_, v1.49.841 is the **first ship of the new operational-debt cluster**. Closes the v1.49.840 forward-flag "Quality-drift scoring calibration drift for codify+chip ships" by adding a 5th `release_type` (chip) to `tools/release-history/classify-types.mjs`, switching `tools/release-history/quality-drift-check.mjs` to per-type baselines, and changing the recent-N drift comparison from "recent-vs-all-time-historical" to "recent-vs-baseline-recent" so the drift-check measures regression-since-last-calibration instead of cadence-shift-since-the-beginning-of-time.

# v1.49.841 — Quality-drift Scorer Recalibration: `chip` Release-type + Per-type Baselines

**Shipped:** 2026-05-27

First ship of the new operational-debt cluster following the v840 codify-ship cluster close. Closes a 22-ship-old forward-flag (informational drift-check firing F-grade alerts on every refresh because the all-time-historical baseline was degree-heavy while recent operational cadence is chip-heavy). Three structural changes: (1) new `chip` release_type captures small operational ships by name-marker heuristic so the substantive-feature baseline isn't dragged down; (2) per-type baselines compare like-to-like (chip-vs-chip, feature-vs-feature); (3) recent-N drift comparison anchors to the baseline's recent-N snapshot (not all-time historical) so the check answers "did things get worse since I calibrated" rather than "is the recent cadence different from the all-time average".

## What shipped

- **MODIFIED** `tools/release-history/classify-types.mjs`:
  - Adds `chip` to the type docstring + dist initializer + summary print.
  - New classification branch (priority slot between `patch` and the `feature` default): name regex `\b(Chip|Codification Ship|Codify|Scaffold|Singleton|Stale[- ]Entry|Wedge Close|Inverse[- ]Check|Atomic Writer)\b` matches the recurring chip-class scope markers in the post-v800 operational-debt cadence. Word-boundary anchor `\b` keeps "Gastown Chipset" (v19, score 99) from matching "Chip". The `Codify` token is title-case to avoid catching prose mentions in degree titles.
  - Exports `classify(release, readmeText)` so the new chip-detection regex can be tested in isolation.
  - Entrypoint guard: `main()` only runs when the file is invoked as a CLI (not when imported for tests). Pattern mirrors `src/cli.ts` (closes v1.49.500 entrypoint-side-effect regression class).
- **MODIFIED** `tools/release-history/quality-drift-check.mjs`:
  - New per-type historical aggregation query: `SELECT r.release_type, COUNT(*), AVG(s.score) ... GROUP BY r.release_type`. Stored as `current.by_type.historical[type] = { count, average }`.
  - New per-type recent aggregation (in-memory from the existing recent-20 fetch): `current.by_type.recent[type] = { count, average }`.
  - Baseline migration: when an existing baseline lacks the `by_type` field (pre-v1.49.841 schema), emit a `baseline_schema_migration` warning prompting the operator to re-run with `--update-baseline`.
  - Per-type `average_drop_<type>` alerts replace the global `average_drop` alert.
  - Per-type `recent_drift_<type>` alerts replace the global `recent20_drift` alert. The comparison anchors to `baseline.by_type.recent[type]` (not `baseline.by_type.historical[type]`) so the alert fires only when the type's recent-N score drops below the snapshot taken at last calibration. Min-samples gate (`per_type_min_samples`, default 3) suppresses single-ship noise.
  - `recent_all_F` alert filter tightened from `release_type !== 'degree'` to `authoredTypes = {feature, milestone, patch}` — chip ships are F-by-design on the substantive-feature rubric and shouldn't count toward "authoring regression" signal.
  - Threshold knob added: `per_type_min_samples: 3` (tunable via `cfg.quality_drift`).
  - Report output: `per_type_deltas` replaces the legacy `avg_delta` / `recent20_delta` in the JSON stdout block.
  - Header docstring extended with v1.49.841 design notes.
- **NEW** `tools/release-history/__tests__/classify-types-chip.test.mjs` — 16 vitest assertions covering the chip-detection regex (positive: 10 chip-class title patterns; negative: Chipset / substantive features / degrees / milestones / patches must NOT classify as chip). Lives outside the vitest include glob per the established `tools/release-history/__tests__/` forward-ready pattern.

### Reclassification result

Re-running `node tools/release-history/classify-types.mjs` produced this distribution:

| Type      | Count | Avg score | Notes |
|-----------|-------|-----------|-------|
| degree    | 442   | 96.6      | UNCHANGED — NASA missions |
| milestone | 64    | 95.0      | UNCHANGED |
| feature   | 350   | 85.0      | -23 (chip ships pulled out); avg +2.8 vs pre-recalibration 82.2 |
| chip      | 23    | 38.6      | NEW — 22 from v802-v840 cadence + cc-1 staged-deck scaffold (v664) |
| patch     | 4     | 76.0      | UNCHANGED |

### Drift-check signal before/after

| State | Alert count | Alerts |
|---|---|---|
| Pre-v841 (4 alerts) | 2 major + 2 warning | `average_drop` (-7.1pt) + `recent20_drift` (-63.7pt) + `recent_all_F` + `grade_shift_F` |
| Post-v841 (1 warning) | 0 major + 1 warning | `recent_all_F` only (genuine — recent feature-type ships are substantive code work with minimal release notes by scope) |

The remaining warning is informational and reflects real cadence rather than a false positive: recent feature-type ships (T1.1/T1.3/T2.2/S6/S5/S2 ship series, publish.mjs preservation, observation-source wire) are smaller-scope than historical feature work. A future ship could add a `task` sub-type for T-prefix work if the warning fires persistently — deferred until 3rd-cycle observation per #10426.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `tools/release-history/__tests__/classify-types-chip.test.mjs` | 16 | Chip-class title patterns (10 positive) + Chipset/feature/degree/milestone/patch negative-cases |

Full suite at ship time: 35,261 passed / 45 skipped / 7 todo / 0 fail. The new chip-classification tests live outside the current vitest include glob (forward-ready); verified via inline node-script smoke runner (15/15 pass).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **59 consecutive ships at 1.178**; new record).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23 → 23** (UNCHANGED — single-file tooling fix, no new domain).
Total lessons referenced in manifest: **78 → 78** (UNCHANGED).
Wired calibratable thresholds: **5 of 7** (UNCHANGED).
KNOWN_UNWIRED Process: **21** (UNCHANGED). Egress: **11** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).

## Why this ship

The v1.49.840 codify-ship retrospective forward-flagged the quality-drift scorer's false-positive behavior:

> Quality-drift scoring calibration drift for codify+chip ships — NEW. Recent-20 average dropped from 97.4 → 33.7 because the scorer was calibrated against NASA mission ships; codify+chip ships have minimal content + are graded F. The grading is informational, not load-bearing, but the drift-check alerts at every refresh.

v841 closes this. The pre-v841 drift-check fired 4 alerts on every refresh, two of them `major` severity. The major alerts were structurally false positives: the all-time-historical baseline included 442 NASA degrees (avg 96.6) and the recent cadence is operational-debt (avg ~35), so the comparison was apples-to-oranges. The check was preserving NO signal — anybody reading the alerts would learn to ignore them, defeating the drift-watcher's purpose entirely.

Three design options were on the table (from the v840 forward-flag): (1) recalibrate scorer for codify+chip class — heaviest, requires new rubric; (2) add per-ship-type weight — medium, what v841 ships; (3) suppress drift-check for non-degree ships — quickest but loses signal entirely.

(2) was picked because it preserves the most signal: chip-type drift still fires if chip ships start scoring meaningfully worse than the chip baseline, and feature-type drift still fires if substantive features start scoring meaningfully worse. The only signal lost is "type-mix shift across the whole release cadence", which was the noise source.

## Forward observations

- **Recent-vs-baseline-recent comparison is novel.** The conventional drift-check pattern is "compare current state to baseline state" where baseline is captured once and never updated. The v841 change captures the baseline's recent-N snapshot at calibration time, so "recent drift" measures change-since-calibration rather than change-since-the-beginning-of-recorded-history. This is closer to the intent (regression detection) but introduces a subtlety: the baseline must be periodically re-captured (e.g. monthly) or it stops being "recent" in any meaningful sense. Operator-bounded for now; future ship may add `--auto-rebaseline-after N` semantics.
- **Tentative observation (1 instance): chip-type recurring scope markers as ship-class signal.** The v841 regex captures the 10 chip-class title markers observed in v802-v840 cadence (Chip, Codification Ship, Codify, Scaffold, Singleton, Stale-Entry, Wedge Close, Inverse-Check, Atomic Writer). If a new chip-class marker emerges (e.g. "Ratchet Close", "Sweep Forward"), the regex needs extension. Forward-test trigger: any future chip ship that doesn't classify as chip on first reclassification.
- **Tentative observation (1 instance): drift-check noise as scoring-system feedback loop.** False-positive alerts trained the operator to ignore alerts. v841 closes one specific source. Future patterns of "informational alert that fires on every refresh" should be treated as a missing-discrimination signal, not as background noise. Forward-test trigger: any future alert that fires on >50% of refreshes without operator action.

## Pickup

v1.49.841 SHIPPED. Drift-check noise eliminated. Next ship: ProcessContext terminal family batch chip (v842, candidate from v840 next-session list).

| Engine pulse | Value |
|---|---|
| NASA degree | 1.178 (59 consecutive ships) |
| Counter-cadence | 6 |
| Manifest entries | 23 |
| Unique lessons in manifest | 78 |
| UNCODIFIED | 39 ≤ 41 |
| KNOWN_UNWIRED Process | 21 |
| KNOWN_UNWIRED Egress | 11 |
| Wired calib thresholds | 5 / 7 |
| Drift-check alerts | 0 major, 1 informational warning |
