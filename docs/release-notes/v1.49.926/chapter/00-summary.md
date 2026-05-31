# v1.49.926 — Summary

**Forward work — consume + verify axes.** The first genuine forward `feat` in 14 ships (v912–v925 were all counter-cadence / cross-platform-CI / docs). No NASA degree advance (holds at 1.178, 141 consecutive ships); counter-cadence count unchanged (this is not a counter-cadence ship). Completes the `token_budget.warn_at_percent` bounded-learning loop.

## The deliverable

### `src/token-budget/warn-substrate.ts` — the missing substrate auto-emit writer

`runTokenBudgetWarnCheck(config, followUpUsagePercent, options)` reads `warn_at_percent` from the integration config, classifies the operator's response to a warn, and fire-and-forget auto-emits a `TokenBudgetEvent` (`#10437`) so the calibration loop gets traffic-attributed observations. It is the long-missing **second `#10439` write-caller** (the v803 CLI manual recorder was the first), bringing warn to parity with its three siblings (predictive v846, retention v891, ceiling v893).

**The warn-vs-ceiling design subtlety.** `max_percent` is a single-reading inequality (`usagePercent < max_percent` both decides and emits). `warn_at_percent` is a **two-reading** concept: a warn fires when usage crosses the threshold (reading 1), and the operator's *response* is measured on the next check (reading 2). The substrate models reading 2 — hence the parameter is `followUpUsagePercent`, not `usagePercent`, with an explicit precondition (a warn already fired): calling it at warn-fire time would misclassify the fire itself as `ignored`. Polarity is encoded once in `token-budget-events.ts::eventKindToValue` (`responsive` → +1 favors LOWER, `ignored` → −1 favors RAISE; the "raise reduces fire-frequency" family, not predictive's inverted one) and is not re-derived. Boundary equality (`followUp === warn`) is `ignored`, mirroring ceiling's strict-less-than.

### `tests/integration/token-budget-warn-end-to-end.integration.test.ts` — the verify e2e

Exercises the real substrate→calibration wire against a temp JSONL: `runTokenBudgetWarnCheck` (write) → `loadObservationsForThreshold('token_budget.warn_at_percent', { tokenBudgetEventsPath })` (read), asserting both polarities, count + order-independent net-polarity (`#10453`), missing-file + malformed-line tolerance, and `autoEmit:false` suppression. **4th instance** of the substrate→calibration end-to-end pattern (ESTABLISHED at v898).

### `tools/calibratable/verify-overdue-scan.mjs` — masked-debt correction

The scanner reported warn `COVERED` on a ground-truth entry `wired v798 / tested v799`. Git verification: v798 (`f8df751f6`) shipped the read-side registry stub, v799 (`55227ae6d`) was a bounded-learning audit-log ship — **neither** the substrate nor the canonical e2e. The entry masked the gap for ~122 ships. Corrected to the honest convention (mirroring `max_percent`): `wired/tested both v926`, with full-history notes recording the misattribution.

## Result

17 new tests green (9 unit + 8 e2e; ×3 stress-stable); `tsc --noEmit` clean; sibling ceiling/max suites green; scanner clean (warn `COVERED wired@v926/tested@v926`, exit 0); pinning test green; **4-lens adversarial review = 4×OK, 0 blockers, 0 warns** (1 nit applied — independent writer cross-check on the happy path). An in-loop production caller of `runTokenBudgetWarnCheck` remains deferred, matching the v893 ceiling sibling's accepted shelf-status.
