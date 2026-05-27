> Following v1.49.796 — _T1.1 Ship 2: Wire `suggestions.cooldown_days`_, v1.49.797 ships as T1.1 ship 3 — Wire `suggestions.auto_dismiss_after_days`: extends the calibration loop's wired threshold whitelist from two entries to three. Third consecutive ship under the threshold-agnostic primitive pattern from v795.

# v1.49.797 — T1.1 Ship 3: Wire `suggestions.auto_dismiss_after_days`

**Shipped:** 2026-05-27

The third ship in the T1.1 calibration-loop arc, and the first of five chained ships in a single operator-authorized session running v797 through v801. v797 widens `SUPPORTED_THRESHOLDS` from 2 to 3, refreshes three module docstrings, and adds 9 tests covering the new threshold end-to-end.

## What shipped

- **`src/cli/commands/bounded-learning.ts`** — `SUPPORTED_THRESHOLDS` extended from `['suggestions.min_occurrences', 'suggestions.cooldown_days']` to add `'suggestions.auto_dismiss_after_days'`. Module docstring refreshed: now enumerates three wired thresholds and gives the per-threshold direction interpretation for the new one (DECREASE = auto-dismiss pending sooner; INCREASE = keep in queue longer).
- **`src/bounded-learning/types.ts`** + **`src/bounded-learning/index.ts`** — Docstring refresh; list three wired thresholds.
- **`src/bounded-learning/__tests__/calibration-loop.test.ts`** — +4 tests in a new `runCalibrationLoop — suggestions.auto_dismiss_after_days (v1.49.797)` describe block: decrease (`30 → 29`), increase (`30 → 31`), hold-at-insufficient-evidence, floor-clamp at 1.
- **`src/bounded-learning/__tests__/threshold-writer.test.ts`** — +1 test proving `applyRecommendation` writes `auto_dismiss_after_days = 29` to disk with `min_occurrences = 3` and `cooldown_days = 7` siblings preserved.
- **`src/cli/commands/bounded-learning.test.ts`** — +4 tests in a new `boundedLearningCommand — --threshold suggestions.auto_dismiss_after_days (v1.49.797)` describe block, exercising the full CLI path with the new threshold.

Test count: **86/86 PASS** in the bounded-learning + CLI test surface (was 77 at v796 close; +9 this ship).

## Through-line

Third consecutive extension within the v795 vertical. The architectural payoff continues to validate at sub-30-min wall-clock per extension. Same observation source (operator accept/dismiss decisions on surfaced suggestions); same direction-interpretation mapping (accept-skew ⇒ DECREASE, dismiss-skew ⇒ INCREASE); same single-step adjustment with `ABSOLUTE_FLOOR = 1`.

The semantic interpretation for `auto_dismiss_after_days` is documented in the CLI module docstring: when operator accept-skew is high (operators triage actively and accept), the auto-dismiss window can shrink; when dismiss-skew is high, pending suggestions should live longer so the operator gets time to triage. This semantic choice is one defensible reading of the shared observation source; alternative readings are possible and operators can override via `--apply` discretion.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5. v797 is forward-cadence audit-driven.

## Audit roadmap progress

| Item | Status |
|---|---|
| T1.4 — PROJECT.md GAP table refresh | Delivered at v785 |
| S5 — PROJECT.md normalizer | Delivered at v785 |
| T1.2 ship 1-6 — Adoption telemetry + cluster verdicts (6/6) | Delivered v786-v793 |
| Path A — NASA 1.178 IBEX | Delivered at v788 |
| Path A meta — Codification of v785-v789 lesson cluster | Delivered at v790 |
| Path E — #10424 deterministic gate + ESTABLISHED promotion | Delivered at v794 |
| T1.1 ship 1 — Bounded-learning calibration loop primitive + CLI + writer | Delivered at v795 |
| T1.1 ship 2 — Wire suggestions.cooldown_days | Delivered at v796 |
| **T1.1 ship 3 — Wire suggestions.auto_dismiss_after_days** | **Delivered at v797 (this ship)** |
| T1.1 ships 4-6 — token_budget + audit log + --watch + /sc:status | OPEN |
| T1.3 — College of Knowledge consumer engine | OPEN — 3-5 ships |
| S3 — Codify the meta-cadence | OPEN |
| S4 — Public surface separation | OPEN |
| S6 — Self-evidence loop for security disciplines | OPEN |
| S7 — Counter-cadence cadence | OPEN |

## Real-world smoke test result

```
$ node dist/cli.js bounded-learning --threshold suggestions.auto_dismiss_after_days --json
{
  "threshold": "suggestions.auto_dismiss_after_days",
  "currentValue": 30,
  "proposedValue": null,
  "direction": "hold",
  "rejected": false,
  "evidence": 1,
  "rejectionThreshold": 40,
  "observations": 0,
  ...
  "reason": "No terminal accept/dismiss observations yet; threshold held at 30.
             Run `/sc:suggest` to accumulate acceptance data.",
  "applied": "noop"
}
```

The loop reads the live default (30) and produces a clean hold against zero-data input. Operator-facing surface ships with the same three-tier output (text / `--quiet` CSV / `--json`).

## Forward candidates

This is ship 1 of 5 in the chained T1.1 session. Following ships:

- **v798 — Wire `token_budget.warn_at_percent`** (next, ~45-60 min — observation-source choice expected).
- **v799 — Audit log** (~45-60 min — new module surface).
- **v800 — `--watch` mode** (~30-45 min).
- **v801 — `/sc:status` integration** (~30-45 min).

---
**Prev:** [v1.49.796](../v1.49.796/00-summary.md) · _(current tip after ship)_
