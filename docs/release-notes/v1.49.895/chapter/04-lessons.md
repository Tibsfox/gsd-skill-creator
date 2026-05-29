# v1.49.895 — Lessons

## Lessons promoted this ship

### #10452 — Substrate-wrapper pattern for calibratable thresholds (write-side procedure)

**Codified at:** v1.49.895.
**Evidence:** v891 (`runObservationRetentionSweep` — default-fixed sub-variant) + v893 (`runTokenBudgetCeilingCheck` — outcome-driven sub-variant).
**Domain:** Bounded-learning calibration discipline.
**Canonical doc:** `docs/bounded-learning-calibration-discipline.md`.

The substrate write-side ship in #10439's three-ship duality follows a thin-function shape: small module exporting `runX` function; minimal config-shape interface; three-flag options bag (`autoEmit`, `eventsPath`, `defaultKind`); substrate body bridges to existing substrate OR performs pure comparison; auto-emit is fire-and-forget per #10437.

**Two sub-variants:**
- **Default-fixed** — substrate returns work-count; polarity is operator-intent; default kind is conservative bias.
- **Outcome-driven** — substrate IS a comparison; polarity falls out of result; default kind is the comparison outcome.

**Discriminator:** does the substrate's natural output determine polarity?

Sibling of #10451 (read-side procedure).

### #10453 — Substrate→calibration end-to-end integration test pattern (verify-axis closing-move)

**Codified at:** v1.49.895.
**Evidence:** v856 (predictive low-confidence integration test) + v894 (observation retention integration test).
**Domain:** Meta-cadence discipline.
**Canonical doc:** `docs/meta-cadence-discipline.md`.

The verify-axis closing-move integration test follows a 7-step shape:

1. Temp dir setup via `mkdtempSync` + path joins.
2. Substrate-side write (returns result for assertion #1).
3. Fire-and-forget wait via `setTimeout(50ms)` (cross-ref #10454).
4. Calibration-loop read via `loadObservationsForThreshold`.
5. Polarity assertion (single + multi-event with net-sum check).
6. Missing-file tolerance (writer contract pin).
7. Malformed-line tolerance (writer contract pin).

Test file lives at `tests/integration/<class>-end-to-end.integration.test.ts`. v856 shipped at the canonical 10-ship trigger; v894 shipped at 3 ships (early within budget — recommended when substrate is fresh).

### #10454 — Fire-and-forget test-side wait via `setTimeout(50ms)` (not `setImmediate`)

**Codified at:** v1.49.895.
**Evidence:** v891 (`retention-substrate.test.ts`) + v893 (`ceiling-substrate.test.ts`) + v894 (integration test for observation-retention).
**Domain:** Failure-mode contracts discipline.
**Canonical doc:** `docs/failure-mode-contracts.md`.

When asserting on a fire-and-forget Promise's side effects, use `await new Promise<void>((resolve) => setTimeout(resolve, 50))` — NOT `setImmediate(resolve)` or `process.nextTick`. The fire-and-forget pattern's `mkdir + appendFile` chain requires OS-level scheduling, not just an event-loop tick.

**Limitation:** the `.catch(() => {})` swallow is the structural protection; tests can't reliably trigger the failure path without OS-level setup. Protection is correct-by-construction rather than test-verified.

Test-discipline complement of #10437's substrate-side fire-and-forget contract.

## Lessons mentioned this ship (no promotion)

- **#10451** (calibrate-axis read-side wire recipe) — promoted to **STABLE** at v888 (3 instances: v837 + v884 + v888). Mentioned in v895 for completeness; no separate codify ship needed.

## Promotion-eligible candidates (carry-forward — unchanged from v894)

1. Substrate-wrapper outcome-driven vs default-fixed sub-variants (1 outcome-driven instance v893). NOTE: now folded into #10452 as named sub-variants; this carry-forward is satisfied.
2. Fire-and-forget test limitation (sibling: v891 + v893). NOTE: now folded into #10454's "Limitation" section; this carry-forward is satisfied.
3. "3-ship-after-wire optional ship within #10428 budget" (1 instance v894). Promotion-eligible at 2nd instance.
4. Two-site hoisted-check sub-variant of #10448 (1 instance v892).
5. Audit-record-count test for two-site shapes (1 instance v892).
6. Default-kind selection discipline (1 instance v891). NOTE: cross-referenced from #10452's default-fixed sub-variant.
7. Read-side-only chokepoint at write-bearing classes (1 instance v890).
8. `opts.ctx` vs separate ctx parameter (1 instance v889).
9. `audit-log.test.ts` assertion-flip step (1 instance v888).
10. `module-singleton` wire shape (1 instance v881).
11. Audit-fidelity inline-literal extraction (1 instance v872).
12. Fake-fixture test pattern (3 instances; cross-cutting test-discipline home not yet created).
13. `git stash` cross-branch hazard (1 instance v883 session).
14. Codify-ship duration scales with composition (5 data points).
15. Cross-audit tool sanity-fixture coverage (1 instance v885).

Net: 2 carry-forward candidates SATISFIED (folded into new lessons), 1 NEW (3-ship-after-wire), and 12 unchanged. Total: ~13 carry-forward (was ~14 going in).
