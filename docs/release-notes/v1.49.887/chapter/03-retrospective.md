# v1.49.887 — Retrospective

## What worked

**Smallest-LOC-first chip-pick rule held.** Per #10444/#10445, `src/console/reader.ts` was the smallest entry (109 LOC) and turned out to have N=1 (one `readPending()` method holds all four fs ops). N=1 selects hoist-at-top per #10448 — the simplest wire shape in the catalog. The size-ascending rule incidentally surfaced the simplest sub-variant first, consistent with the prediction at #10445.

**`interpreter/loader.ts` as reference pattern.** The v782 original LoaderContext caller is structurally similar (single-method gate at top of `loadBundle`, all internal reads confined via `path.join`). Reusing that pattern for `console/reader.ts` was a straight copy at the call-site level — 4 LOC source change (import + private field + constructor param + one `ensureAllowed` call) for a complete chip.

**Failure-mode contract verified.** Per #10442, `ensureAllowed` was hoisted OUTSIDE the per-file try/catch that swallows individual file errors. Test "throws LoaderContextDenied when basePath is not in allowList" confirms the denial propagates as a rejected promise instead of being absorbed by the silent-skip handler.

## What didn't work

**Nothing surfaced.** The wire-shape catalog applied cleanly; no mid-ship surprises required scope expansion.

## Verdict on scope

Single-chip ship per v885 forward path prediction. N=1 hoist-at-top is the smallest possible wire — 4 LOC source change + 5 test additions + 1 KNOWN_UNWIRED entry removal. The ~20 min wall-clock from open-to-pre-tag-gate (audit-test + reader-test + full suite all green on first try) validates the playbook for the remaining 14 entries.

## Promotion-eligible candidates accumulated this ship

**None.** The chip applied existing catalog patterns cleanly:
- #10444 (size-ascending chip-pick) — applied; confirmed smallest-LOC entry happens to be simplest shape.
- #10445 (N as primary wire-shape predictor) — applied; N=1 → hoist-at-top.
- #10448 (sub-variant catalog) — applied; sub-variant 1 (hoist-at-top).
- #10442 (re-throw denial outside swallow-catch) — applied; ensureAllowed hoisted above per-file try/catch.

## Forward path

- **v888: Bounded-learning read-side wire for `token_budget.max_percent`** — third instance of #10451 7-step recipe; would promote from 2-instance ESTABLISHED to 3-instance STABLE.
- **v889+: More LoaderContext chips** — next smallest entry is `src/intelligence/atlas-indexer/file-walker.ts` (120 LOC). Continue size-ascending traversal to chip the 14-entry ledger toward 0.
- **v891: Substrate auto-emit for `observation.retention_days`** — closes v884 deferred half; requires building a retention-sweep substrate consumer.
