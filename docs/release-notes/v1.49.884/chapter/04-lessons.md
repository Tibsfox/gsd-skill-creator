# v1.49.884 — Lessons

## Lessons emitted this ship

**None new.** All design decisions reused established patterns:

- **#10425** (bounded-learning math-check before test fixture) — applied. The two-sided e-process insensitivity issue does NOT recur for `too_aggressive` / `too_lax` because the loop already uses the Bonferroni-combined one-sided construction per #10425's resolution.
- **#10426** (per-class observation source registry) — applied. The new module slots into the existing `observation-sources.ts` dispatch alongside the suggestions / token_budget / predictive sources without further abstraction extraction.
- **#10427** (failure-mode contracts) — applied. `appendObservationRetentionEvent` is best-effort silent at the call-site boundary; CLI catch swallows per #10427's accessory-surface convention.
- **#10439** (CLI manual + substrate auto-emit duality, calibrate-axis completeness rule) — partially applied. The CLI manual recorder ships; the substrate auto-recorder is deferred. The verify-overdue scanner correctly reflects the partial state (still UNWIRED).

## Promotion-eligible candidates (carry-forward)

Nothing this ship. The v837-style read-side wire is now a 2-instance pattern (predictive + observation-retention) — close to but not yet at the promotion threshold for "calibrate-axis read-side wire recipe." A third instance would qualify.

## Carry-forward from v883

Unchanged from v883's enumeration. The v884 ship did not surface a second instance of any v883-carry-forward candidate:

1. `module-singleton` wire shape (still 1 instance from v881)
2. Audit-fidelity inline-literal extraction (still 1 instance from v872)
3. Fake-fixture test pattern (still 3 instances; cross-cutting test-discipline home not yet created)
4. Tools-detecting-silent-failures must fail loudly (still 1 instance from v867)
5. `git stash` cross-branch hazard (still 1 instance from v883 session)
6. Codify-ship duration scales with composition (still 4 data points; inconsistent units)
