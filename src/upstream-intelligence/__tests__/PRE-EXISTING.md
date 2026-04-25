# Pre-Existing Failures — v1.49.573 audit trail

Phase 775 (Gate G14 closure) records the following pre-existing test failures
that exist on the v1.49.572 baseline and are NOT regressions introduced by
v1.49.573. They are documented here so Phase 776 (regression report) and
Phase 778 (retrospective) can reference the audit trail without re-discovery.

## Source baseline

- **Tip referenced for baseline**: v1.49.572 release commit `c8ca8de63`
  (release notes commit `6182f12af` — `feat(v1.49.572): Mathematical
  Foundations Refresh`).
- **Branch**: `dev`
- **Detected during**: Phase 769 (T2a Experience Compression).

## Pre-existing failures (carried forward, NOT v1.49.573 regressions)

### `src/mathematical-foundations/__tests__/integration.test.ts` — 2 failures

- **File**: `src/mathematical-foundations/__tests__/integration.test.ts`
- **Failure count**: 2
- **Status**: Pre-existing on v1.49.572 baseline.
- **First detected**: Phase 769 (v1.49.573 T2a Experience Compression).
- **Action**: surface in Phase 776 regression report; no fix attempted in
  v1.49.573. The fix is a v1.49.572 audit-trail item, not a v1.49.573
  responsibility.

## Why this matters for Gate G14

The v1.49.573 milestone closes Gate G14 with the byte-identical regression
test (`composition-flag-off-byte-identical.test.ts`). The Gate G14 verdict
distinguishes between:

1. **Tests that were passing before v1.49.573 and now fail** — would BLOCK
   the gate (these are real regressions introduced by Half B).
2. **Tests that were failing before v1.49.573 and still fail** — do NOT
   block the gate; they are carried forward as known-pre-existing.

The 2 failures in `src/mathematical-foundations/__tests__/integration.test.ts`
fall in category 2 and are surfaced here so the Phase 776 report can encode
the distinction in its regression-count vs baseline-count delta.

## Verification command

```bash
# v1.49.572 tip baseline run:
git checkout c8ca8de63
npx vitest run src/mathematical-foundations
# Returns: 2 failing tests in integration.test.ts (these are the
# pre-existing failures referenced above).

# v1.49.573 Phase 775 closure run:
git checkout dev
npx vitest run src/mathematical-foundations
# Same 2 failing tests — count is identical, no new regressions.
```

## Phase cross-reference

- Detected in: **Phase 769** (T2a Experience Compression — surfaced during
  baseline regression run).
- Documented in: **Phase 775** (this file, Gate G14 closure).
- Referenced by: **Phase 776** (regression report) and **Phase 778**
  (v1.49.573 retrospective).
