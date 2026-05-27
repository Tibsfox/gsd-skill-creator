# Bounded-Learning Calibration Discipline

**Surface:** Designing or extending the bounded-learning calibration loop (`src/bounded-learning/`); choosing the statistical primitive for an anytime-valid threshold-update decision; adding a new calibratable threshold class.

**Codified at:** v1.49.802 (lesson from v1.49.795 T1.1 Ship 1 — initial calibration-loop primitive design surfaced a math trap before commit).

## Why this discipline exists

The bounded-learning module turns recurring operator-feedback signals (accept / dismiss, warn-ignored / warn-honored, etc.) into anytime-valid update decisions on configuration thresholds. The math primitive at the heart of the loop is a likelihood-ratio e-process accumulated across observations in `[−1, +1]`. The decision is whether to nudge a threshold up, down, or hold — under an anytime-valid guarantee (controlled Type-I error regardless of when the operator stops to inspect).

Subtle design choices on the e-process construction (one-sided vs two-sided, bounded vs unbounded support, single statistic vs Bonferroni-combined pair) cascade into the observable behavior of the calibration loop. A construction that *looks* statistically sound at the top level can be insensitive to the very signal it was designed to detect — and the test fixture's trip-point assertion silently encodes the same blind spot if the math was never checked separately.

This discipline records the design patterns and math-check conventions that prevent that class of failure.

## Discipline pattern

### Two-sided likelihood ratios on bounded binary observations are insensitive to unanimous direction (Lesson #10425)

For observations strictly at `|x| = 1` (the bounded binary case used by `suggestions.*` thresholds), the two-sided likelihood-ratio e-process

$$E_n = \prod_i \cosh(\lambda \cdot x_i) \cdot \exp(-\lambda^2 / 2)$$

is bounded above by 1 for every `λ > 0`:

$$\cosh(\lambda) \cdot \exp(-\lambda^2 / 2) \le 1 \quad \text{for all } \lambda \ge 0, \text{ with equality only at } \lambda = 0.$$

No choice of `λ` ever drives `E_n` above the rejection threshold (e.g. `1 / α`) even under unanimous +1 or unanimous −1 evidence. The construction "works" in the textbook sense (anytime-valid, controlled Type-I) — but it is *insensitive to direction*, which is the only signal the calibration loop has.

**The right primitive:** two one-sided likelihood-ratio e-processes, each tested at `α / 2` (Bonferroni-combined two-sided), with each one-sided statistic free to grow unboundedly under unanimous evidence in its direction.

**Why this trap is easy to fall into:** the two-sided statistic *looks* obviously right ("combine the directions into one statistic"). The trap is visible only by running the per-step evidence-growth-rate check by hand: for `|x|=1`,

$$\cosh(0.5 \cdot 1) \cdot \exp(-0.5^2 / 2) = 1.1276 \cdot 0.8825 = 0.9952 \le 1.$$

If `0.9952 ≤ 1`, no `λ` can pump the product above 1 either. The test fixture's "10 unanimous accepts ⇒ trip" assertion encodes that prediction silently; if the math is wrong, the prediction is wrong, and the test failure surfaces the bug late.

### Math-check-before-test-fixture convention

When designing a new bounded-learning primitive (or extending an existing one to a new domain), run the per-step evidence growth-rate check **by hand** before writing the test fixture's trip-point assertion. The check has three parts:

1. **What is the support of `x`?** (bounded binary at `±1`? bounded continuous in `[−1, +1]`? bounded with mass at zero?)
2. **What does the e-process look like at the support boundary?** (Compute `E_1` for `x = +1` and `x = −1` and a representative interior point.)
3. **Does `E_n` grow under the unanimous-direction signal you expect to detect?** (Compute `E_n / E_{n-1}` for `n = 2, 3` under unanimous evidence; if the ratio is ≤ 1, the statistic is the wrong shape for this domain.)

If step 3 fails, the construction is unfit for the signal. Replace it before any code or test fixture is written.

### Per-class observation source registry (cross-reference: Architecture-retrofit patterns)

Calibratable thresholds belong to classes that draw from different observation sources (`suggestions.*` from `suggestions.json`, `token_budget.*` from token-budget events, etc.). When a second class is added, extract a per-class registry that dispatches `loadObservationsForThreshold` by class. See [`architecture-retrofit-patterns.md`](architecture-retrofit-patterns.md) for the cross-class abstraction-extraction rule (Lesson #10426).

## When this discipline kicks in

- Authoring a new threshold class (e.g. `observation.retention_days`).
- Choosing the statistical primitive for an anytime-valid decision on a new signal.
- Reviewing a new e-process construction for the calibration loop.
- Writing a trip-point assertion in a calibration-loop test.
- Extending the calibration loop to support continuous bounded observations (not just binary at `±1`).

## Anti-pattern summary

- ❌ Selecting the two-sided likelihood-ratio statistic for bounded binary observations without checking the per-step growth rate at the support boundary.
- ❌ Letting the test fixture's trip-point assertion *be* the math check. The assertion encodes a prediction; if the prediction is wrong because the construction is wrong, the test failure surfaces the bug only after the fixture and primitive are both written.
- ❌ Reusing an existing observation source for a new threshold class because it's the lightest technical wire. Per-class observation sources are *necessary surface* (cross-reference Lesson #10426); the lightest-wire discipline applies to unnecessary surface, not necessary surface.

## Lesson reference

- **#10425** — Two-sided likelihood-ratio e-processes on bounded binary observations are insensitive to unanimous direction; use Bonferroni-combined one-sided instead. v795 candidate, promoted at v802.
