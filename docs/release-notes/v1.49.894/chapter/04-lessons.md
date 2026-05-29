# v1.49.894 — Lessons

## Lessons emitted this ship

**None new.** All design decisions reused established patterns:

- **#10428** (meta-cadence verify-axis) — applied. Integration test at 3 ships after wire (well within 10-ship budget).
- **#10438** (mocks-prove-signature, integration-proves-behavior) — applied. v891 substrate + v884 read had mock unit tests; v894 adds real-collaborator integration test.
- **#10437** (subscriber-gated observability) — applied. Fire-and-forget wait via `setTimeout(50ms)` mirrors v891 unit test pattern.

## Promoted this ship (1-instance → 2-instance ESTABLISHED candidates)

1. **"Substrate→calibration end-to-end test" pattern** — **promoted 1→2** (v856 predictive + v894 retention). Codify in v895.

## Promotion-eligible candidates (new this ship)

1. **"3-ship-after-wire optional ship within #10428 budget"** (1 instance v894). Verify-axis trigger is at 10 ships; nothing prevents shipping earlier. Promotion-eligible at 2nd instance.

## Promotion-eligible candidates (carry-forward — promotions accumulating for v895)

**2-instance ESTABLISHED (ready for codify):**
- **Substrate-wrapper pattern for calibratable thresholds** (v891 + v893).
- **Fire-and-forget test-side wait via `setTimeout(50ms)`** (v891 unit + v894 integration; effectively 3 instances now: v891 + v893 + v894).
- **"Substrate→calibration end-to-end test" pattern** (v856 + v894).

**1-instance carry-forward:**
- Substrate-wrapper outcome-driven vs default-fixed sub-variants (1 instance v893).
- Fire-and-forget test limitation (sibling: v891 + v893).
- "3-ship-after-wire optional ship" (1 instance v894).
- Two-site hoisted-check sub-variant of #10448 (1 instance v892).
- Audit-record-count test for two-site shapes (1 instance v892).
- Default-kind selection discipline (1 instance v891).
- Read-side-only chokepoint at write-bearing classes (1 instance v890).
- `opts.ctx` vs separate ctx parameter (1 instance v889).
- `audit-log.test.ts` assertion-flip step (1 instance v888).
- `module-singleton` wire shape (1 instance v881).
- Audit-fidelity inline-literal extraction (1 instance v872).
- Fake-fixture test pattern (3 instances).
- `git stash` cross-branch hazard (1 instance v883 session).
- Codify-ship duration scales with composition (5 data points).
- Cross-audit tool sanity-fixture coverage (1 instance v885).
