
# v1.49.841 — Quality-drift Scorer Recalibration: `chip` Release-type + Per-type Baselines

**Released:** 2026-05-27

## Why this ship

The v1.49.840 codify-ship retrospective forward-flagged the quality-drift scorer's calibration drift: the `tools/release-history/quality-drift-check.mjs` script fired 4 alerts on every `tools/release-history/refresh.mjs` invocation, two of them `major` severity. The alerts were structurally false positives — the all-time-historical baseline was 442 NASA degrees (avg 96.6), the recent cadence is operational-debt (avg ~35), so any recent-vs-historical comparison would always show a 60+ point "regression" even when no actual authoring regression had occurred. The drift-watcher was preserving NO signal.

Per the v840 forward-flag, three options were on the table: (1) recalibrate the scorer with a new chip-class rubric (heaviest), (2) add per-ship-type weight (medium), (3) suppress drift-check for non-degree ships (loses signal). v841 ships option (2): per-type baselines + recent-vs-recent comparison + new `chip` release_type to keep the substantive-feature baseline clean.

## The three structural changes

### 1. New `chip` release_type (classify-types.mjs)

Adds a 5th type to the existing four (degree / milestone / feature / patch). Chip-class ships have minimal release-notes surface by design (codification, KNOWN_UNWIRED chip, scaffold, stale-entry cleanup, wedge close, audit inverse-check, atomic-writer tool). They were previously misclassified as `feature` and dragged the feature average down from 85.0 to 82.2. Detection via title regex on 10 chip-class markers; word-boundary anchoring prevents "Gastown Chipset" misclassification.

Reclassification: 23 ships moved to `chip` type (22 from the v802-v840 operational-debt cadence + cc-1 v664 staged-deck scaffold).

### 2. Per-type baselines (quality-drift-check.mjs)

New `current.by_type.historical[type]` and `current.by_type.recent[type]` fields capture per-type aggregations at baseline-capture time. Alerts now fire per-type rather than globally — `average_drop_chip`, `recent_drift_feature`, etc. The all-time-historical mix is no longer the comparison anchor.

### 3. Recent-vs-baseline-recent comparison

The novel piece: `recent_drift_<type>` compares current `recent_by_type[type]` against `baseline.by_type.recent[type]` (not `baseline.by_type.historical[type]`). Semantically the drift-check now answers "did this type's score drop SINCE I last calibrated" instead of "is the recent cadence different from the all-time average". The former is regression detection; the latter is cadence-shift detection (noise).

## Drift-check signal before/after

| State | Alert count | Severity mix |
|---|---|---|
| Pre-v841 | 4 | 2 major + 2 warning |
| Post-v841 | 1 | 0 major + 1 informational warning |

The remaining warning is genuine: recent feature-type ships are smaller-scope than historical feature work (T-prefix and S-prefix series). Defer a `task` sub-type to a future ship if the warning fires persistently.

## Surface delta

- 2 tooling files modified (classify-types.mjs + quality-drift-check.mjs)
- 1 new test file (16 chip-classification assertions)
- 1 DB classification re-run (23 ships moved feature → chip)
- 1 baseline file re-captured (gitignored, in `.planning/release-cache/`)
- 0 documentation changes
- 0 manifest extensions

## Manifest state

| Field | Before | After |
|---|---|---|
| Manifest entries (discipline domains) | 23 | 23 |
| Lessons in manifest (unique) | 78 | 78 |
| Open lesson candidate backlog | 0 | 0 |
| Tentative observations carried forward | ~10-12 | ~12-14 (+2 from v841 forward-flags) |

## Engine state

NASA degree at **1.178** (UNCHANGED — **59 consecutive ships at 1.178**; was 58 entering this ship). New widest-pressure-margin record.
Counter-cadence count UNCHANGED at 6.
KNOWN_UNWIRED Process UNCHANGED at 21.
KNOWN_UNWIRED Egress UNCHANGED at 11.
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
UNCODIFIED count: 39 ≤ ceiling 41 (UNCHANGED).
