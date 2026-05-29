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

### Calibrate-axis read-side wire recipe (Lesson #10451)

When wiring a new calibratable threshold's observation source (the read side per #10439's three-ship duality), the work follows a 7-step recipe that's now been applied twice (v837 predictive, v884 observation-retention):

1. **New module** `src/bounded-learning/<class>-events.ts` mirroring `predictive-low-confidence-events.ts`. Defines: event-kind union, `eventKindToValue` map to `[-1, +1]`, `eventToObservation` lifter to `CalibrationObservation`, `appendXEvent` / `readXEvents` JSONL I/O, `DEFAULT_X_EVENTS_PATH`. Failure contract: best-effort silent (per #10427).
2. **Dispatcher update** `src/bounded-learning/observation-sources.ts`: add branch to `observationSourceFor` flipping `wired: true`; add branch to `loadObservationsForThreshold` dispatching to the new module's read path; add new option (`<class>EventsPath`) to `ObservationLoaderOptions`.
3. **Public-API exports** `src/bounded-learning/index.ts`: re-export new module's surface. Use `as <alias>` re-exports when `eventKindToValue` / `eventToObservation` collide with existing named exports.
4. **CLI manual recorder** `src/cli/commands/bounded-learning.ts`: add threshold to `SUPPORTED_THRESHOLDS` array; add dispatch branch in `runRecordEvent`; add new `runRecord<Class>Event` function handling `--kind` + optional metadata flags + `--<class>-events <path>` override. Best-effort silent write per #10427.
5. **Read-side tests** `src/bounded-learning/__tests__/<class>-events.test.ts`: polarity map, `eventToObservation` lift, `eventsToObservations` no-filter, JSONL append/read round-trip, malformed-line tolerance, unknown-kind skip, missing-field skip. 13 tests in the v884 instance.
6. **Dispatcher tests** `src/bounded-learning/__tests__/observation-sources.test.ts`: flip `wired: false` → `wired: true` assertion; add new round-trip test reading the new JSONL through the dispatcher; add empty-file honest-baseline test.
7. **CLI tests** `src/cli/commands/bounded-learning.test.ts`: `--summary` mode assertion bumps `thresholds.length` and `wiredThresholdCount` by 1.

**Polarity convention.** Match the threshold semantics: when raising the threshold REDUCES surface frequency (warn / sweep / cap), `+1` favors LOWERING the threshold (positive evidence = "the surface fired but was useful → fire more often" → lower); `-1` favors RAISING (negative evidence = "the surface fired but was noisy / damaging → fire less often" → raise). When raising the threshold INCREASES surface frequency (predictive low-confidence fallback), the polarity inverts (`-1` favors RAISING). Math-check by hand before writing the test fixture per [Lesson #10425](#two-sided-likelihood-ratios-on-bounded-binary-observations-are-insensitive-to-unanimous-direction-lesson-10425).

**Substrate auto-emit deferred per #10439 staging.** This recipe lands only the read-side (steps 1-7); the substrate auto-recorder (write-side, traffic-attributed) ships in a follow-on. Document the deferred auto-emit in the recipe ship's retrospective + cross-link from #10439's table.

**Math-check pre-condition** (sibling of #10425): before writing step-5 tests, run the per-step evidence-growth-rate check by hand. For unanimous evidence in either direction, the one-sided e-process at `λ=0.5` must grow above 1 (the rejection threshold under Bonferroni-combined α/2). The Bonferroni-combined one-sided construction (from #10425's resolution) passes this check on bounded binary observations.

**Evidence.** v837 (predictive.low_confidence_threshold) + v884 (observation.retention_days). Both followed the same 7-step recipe; v884 took ~30 minutes from "decide which threshold" to "all tests green," indicating the recipe has consolidated.

**Anti-pattern.** Shipping the read-side wire without registering polarity-default match between CLI and (deferred) substrate auto-emit. The substrate write-side ship will need to mirror the CLI's `--kind` default to keep #10439's statistical compatibility — bake this into the recipe's release-notes so the deferred ship doesn't drift.

## Lesson reference

- **#10425** — Two-sided likelihood-ratio e-processes on bounded binary observations are insensitive to unanimous direction; use Bonferroni-combined one-sided instead. v795 candidate, promoted at v802.
- **#10451** — Calibrate-axis read-side wire recipe (7-step pattern). Two-instance promotion at v886: v837 predictive + v884 observation-retention. Sibling of #10439's three-ship duality (read-side + CLI manual + substrate auto-emit); #10451 captures the read-side procedure.
