# v1.49.889 — Retrospective

## What worked

**Wire shape is the same regardless of call shape.** v887 wired a class method (`MessageReader.readPending`); v889 wires a free function (`walkProjectFiles`). Both N=1, both hoist-at-top, both 4-LOC source change per #10448 sub-variant 1. Confirms #10445's claim that N (spawn-site count) is the primary wire-shape predictor — not surface shape (class vs function).

**`WalkOptions.ctx` over separate ctx parameter.** The function already had an options bag, so adding ctx as a property kept the public signature stable. The one production caller (`runner.ts`) needs no change today; a future ship can thread ctx through the runner without re-shaping the signature. Demonstrates a sub-variant of #10448's discipline: when a function already has an options bag, prefer it over a new positional parameter.

**Denial-before-realpath is the right ordering.** The test "rejects denial BEFORE attempting realpath" explicitly exercises the path where ctx denies access to a nonexistent directory. Without the hoist, that path would silently return `[]` (the realpath catch). With the hoist, denial fires first. Important for the security contract: the operator's allowList must be checked BEFORE any fs probing reveals existence.

## What didn't work

**Nothing surfaced.** Two consecutive clean chips. The N=1 hoist-at-top pattern continues to be straightforward.

## Verdict on scope

Single-chip ship matching v887's structure. ~15 min wall-clock (faster than v887 because the test fixture pattern from v887 was directly reusable). Continues to validate the catalog.

## Promotion-eligible candidates accumulated this ship

**1 instance** — `WalkOptions.ctx` over separate parameter sub-variant of #10448. When the target function already has an options bag, prefer adding ctx as a property over a new positional parameter — keeps the public signature stable. Promotion-eligible if a 2nd instance lands.

## Forward path

- **v890: Third LoaderContext chip** — `src/eval/calibration-adjustment-store.ts` (129 LOC). Continue size-ascending traversal.
- **v891: Substrate auto-emit for `observation.retention_days`** — closes v884 deferred half.
- **v892+: Continue Loader chip-down + open substrate auto-emit for `token_budget.max_percent`.**
