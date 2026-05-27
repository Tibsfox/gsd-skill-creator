> Following v1.49.794 — _Deterministic Gate for #10424: Adoption-Refresh Overwrite Guard_, v1.49.795 ships as T1.1 ship 1 — Bounded-Learning Calibration Loop: a primitive + CLI + threshold writer that consumes operator acceptance decisions and emits anytime-valid recommendations to adjust skill-creator thresholds.

# v1.49.795 — T1.1 Ship 1: Bounded-Learning Calibration Loop

**Shipped:** 2026-05-26

First ship in the Tier 1 audit roadmap's most ambitious remaining item. Lands a new `src/bounded-learning/` peer module (alongside the pre-existing `two-gate/` sub-namespace) carrying the primitive + a `skill-creator bounded-learning` CLI that reads `.planning/patterns/suggestions.json`, feeds operator accept/dismiss decisions through two one-sided e-processes at Bonferroni α/2, and reports threshold-adjustment recommendations. With `--apply`, the recommendation is atomically written back to `.planning/skill-creator.json` (gated against concurrent edits).

## What shipped

- **`src/bounded-learning/types.ts`** — Shared types: `CalibratableThreshold`, `AdjustmentDirection`, `CalibrationObservation`, `CalibrationRecommendation`, `CalibrationLoopConfig`, `SuggestionDecision`.
- **`src/bounded-learning/suggestions-mapper.ts`** — Maps `.planning/patterns/suggestions.json` entries to `[-1, 1]` observations. Accept=+1, dismiss=−1, deferred/pending=0. `entriesToObservations` filters out neutral observations so the e-process sees only terminal accept/dismiss decisions.
- **`src/bounded-learning/calibration-loop.ts`** — `runCalibrationLoop` drives two one-sided e-processes in parallel: one for accept-skew (recommend DECREASE), one for sign-flipped dismiss-skew (recommend INCREASE). Single-step adjustment with absolute floor at 1.
- **`src/bounded-learning/threshold-writer.ts`** — `applyRecommendation` with dry-run/`--apply` gate + concurrent-edit detection. Atomic rename-from-tmpfile write to `.planning/skill-creator.json`. Refuses if on-disk threshold value doesn't match the recommendation's `currentValue` (operator edited the config between recon and apply).
- **`src/bounded-learning/index.ts`** — Public API exports.
- **`src/bounded-learning/__tests__/{suggestions-mapper, calibration-loop, threshold-writer}.test.ts`** — 29 unit tests covering happy paths, holds, both rejection directions, floor clamp, balanced-input non-rejection, concurrent-edit refusal, malformed config tolerance.
- **`src/cli/commands/bounded-learning.ts`** (~290 lines) — Top-level CLI command. Three-tier output (text/quiet/JSON). Args: `--threshold`, `--alpha`, `--lambda`, `--suggestions`, `--config`, `--apply`, `--quiet`/`-q`, `--json`, `--help`/`-h`. Exit codes 0 (success) / 1 (invalid flag) / 2 (config not found).
- **`src/cli/commands/bounded-learning.test.ts`** — 17 CLI integration tests against temp-dir fixtures.
- **`src/cli/dispatch.ts`** + **`src/cli/help.ts`** — Dispatcher + help registration.

Test count: 30,939 → 30,946 root + new bounded-learning module tests + new CLI tests, all passing.

## Through-line

T1.1 is the calibration-loop arc — close the bounded-learning meta-loop where operator decisions feed back into the skill-creator's own thresholds. The handoff from v793 named it the most ambitious Tier 1 remaining item at 4-6 ships. Ship 1 lands the complete read/compute/write surface for ONE threshold (`suggestions.min_occurrences`); ships 2-6 will extend to additional thresholds and add cross-threshold coordination as data accumulates.

The two-one-sided-e-process design (Bonferroni α/2 each) is the load-bearing math choice — without it the calibration loop would be insensitive to binary observations, which is exactly the regime operator decisions live in. The choice was made mid-build after the math check exposed the two-sided e-process's inability to grow on `|x| = 1`.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5. v795 is forward-cadence audit-driven.

## Audit roadmap progress

| Item | Status |
|---|---|
| T1.4 — PROJECT.md GAP table refresh | Delivered at v785 |
| S5 — PROJECT.md normalizer | Delivered at v785 |
| T1.2 ship 1-6 — Adoption telemetry + cluster verdicts (6/6) | Delivered v786-v793 |
| Path A — NASA 1.178 IBEX | Delivered at v788 |
| Path A meta — Codification of v785-v789 lesson cluster | Delivered at v790 |
| Path E — #10424 deterministic gate + ESTABLISHED promotion | Delivered at v794 |
| **T1.1 ship 1 — Bounded-learning calibration loop primitive + CLI + writer** | **Delivered at v795 (this ship)** |
| T1.1 ships 2-6 — Real-data wiring + multi-threshold + cross-threshold coordination | OPEN |
| T1.3 — College of Knowledge consumer engine | OPEN — 3-5 ships |
| S3 — Codify the meta-cadence | OPEN |
| S4 — Public surface separation | OPEN |
| S6 — Self-evidence loop for security disciplines | OPEN |
| S7 — Counter-cadence cadence | OPEN |

## Real-world smoke test result

```
$ node dist/cli.js bounded-learning --json
{
  "threshold": "suggestions.min_occurrences",
  "currentValue": 3,
  "proposedValue": null,
  "direction": "hold",
  "rejected": false,
  "evidence": 1,
  "rejectionThreshold": 40,
  "observations": 0,
  ...
  "reason": "No terminal accept/dismiss observations yet; threshold held at 3.
             Run `/sc:suggest` to accumulate acceptance data.",
  "applied": "noop"
}
```

The loop runs end-to-end with zero data and produces a coherent "hold" recommendation. The next ship's primary signal will be either (a) accumulated acceptance data finally producing a directional recommendation, or (b) the operator surfacing pending suggestions via `/sc:suggest` so the loop has data to consume.

## Forward candidates

- **T1.1 ship 2:** wire a second threshold OR add audit-log surface OR add `--watch` mode OR surface in `/sc:status`. Operator picks per-ship.
- **T1.1 ships 3-6:** extend to multi-threshold + cross-threshold coordination + (optional) real-data backfill from session retro entries.
- **NASA 1.179:** INTERSTELLAR-BOUNDARY axis obs#3 continuation.
- **T1.3:** College of Knowledge consumer engine.

---
**Prev:** [v1.49.794](../v1.49.794/00-summary.md) · _(current tip)_
