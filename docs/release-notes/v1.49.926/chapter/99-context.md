# v1.49.926 — Context

## Milestone metadata

- **Version:** v1.49.926
- **Type:** Forward work (consume + verify axes)
- **Predecessor:** v1.49.925
- **NASA degree:** 1.178 (unchanged — 141 consecutive ships)
- **Counter-cadence count:** 20 (unchanged — forward ship, not counter-cadence)

## Files changed

- `src/token-budget/warn-substrate.ts` — **new.** `runTokenBudgetWarnCheck` — the substrate auto-emit writer for `token_budget.warn_at_percent` (the second `#10439` write-caller). Two-reading model: takes `followUpUsagePercent`, classifies `responded = followUp < warn_at_percent` → `responsive`/`ignored`, fire-and-forget auto-emits per `#10437`. Outcome-driven kind (`#10452`) with a `defaultKind` override; `autoEmit:false` + `eventsPath` + `reason` options. Mirrors `ceiling-substrate.ts`.
- `src/token-budget/warn-substrate.test.ts` — **new.** 9 unit tests (responded both directions, boundary equality → ignored, both-polarity auto-emit, `autoEmit:false`, `defaultKind` override, `reason`, fire-and-forget return).
- `tests/integration/token-budget-warn-end-to-end.integration.test.ts` — **new.** 8 tests: the substrate→calibration wire end-to-end (`#10453` 4th instance) — both polarities → ±1, accumulate count + net-polarity (order-independent), boundary equality, `defaultKind` override, missing-file tolerance, malformed-line tolerance, `autoEmit:false` suppression. Reads via `tokenBudgetEventsPath` (the warn option, not `tokenBudgetMaxEventsPath`).
- `src/bounded-learning/token-budget-events.ts` — **edit (docstring only).** One-field comment on `TokenBudgetEvent.usagePercent`, made path-agnostic (CLI trigger reading vs substrate follow-up reading). No runtime change.
- `tools/calibratable/verify-overdue-scan.mjs` — **edit (manifest data).** Corrected the `token_budget.warn_at_percent` ground-truth entry from the misattributed `wired v798 / tested v799` to the honest `wired/tested both v926`, with full-history notes documenting the ~122-ship masked-debt correction (mirrors the `max_percent` convention: `wired_first_caller_ship` = substrate ship).
- `docs/release-notes/v1.49.926/` — milestone notes (README + 00/03/04/99 chapters).

## Test posture

- New tests: 17 (9 unit in `src/token-budget/`, 8 integration in `tests/integration/`) — ×3 stress-stable
- Siblings green: `ceiling-substrate.test.ts` (9), `token-budget-max-end-to-end.integration.test.ts` (8)
- `tsc --noEmit`: clean
- `verify-overdue-scan.mjs`: exit 0, warn `COVERED wired@v926/tested@v926`; pinning test `tests/calibratable/verify-overdue-scan.test.ts` (3) green
- Adversarial review: 4-lens (polarity / test-discipline / design-honesty / xplat-failure-mode) = 4×OK, 0 blockers, 0 warns, 1 nit applied

## Engine state at close

- NASA degree 1.178 (141 consecutive ships)
- Counter-cadence count 20 (unchanged)
- Manifest: 24 domains, 150 lessons (unchanged)
- macOS organic-green streak (#10463): advanced — this ship's feature commit is organic green #2 (pushed alone to run the macOS leg on organic churn)
- KNOWN_UNWIRED Process/Egress/Loader: 0/0/0

## Carry-forward

- **In-loop production caller of `runTokenBudgetWarnCheck`** — deferred, matching the v893 ceiling sibling (also test-only). A future consume ship wires it into the `/sc:status` warn flow and promotes the documentation-only precondition to a type-level guard.
- **macOS leg flip** (v924 carry-forward #1) — now at organic green #2 of 3. One more organic-churn green macOS run → READY (`node tools/ci/macos-flip-readiness.mjs`); the flip then deletes `continue-on-error` from `ci.yml` + updates `ci-matrix-parity.test.ts`.
- **Dormant consume-axis substrates** (surfaced by this ship's survey): stochastic / eligibility / langevin / temperature — unconsumed since ~v500; next consumer-engine candidates.
- Older opens (unchanged): Rust-in-CI; a real `coprocessor:` skill consumer; the `algebrus.eigen` Python error.
