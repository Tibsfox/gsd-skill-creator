# v1.49.947 — Summary

## The ship

Counter-cadence #24 (gate-not-vigilance): build `skill-creator cadence`, the deterministic meta-cadence overdue-check the discipline doc had carried as a "tentative future" forward-shadow.

The prose check was **misapplied twice in the v1.49.944 session**, both as trigger-READING errors: calibrate's `>=20 observations` conjunct was read as met when the max was **12**, and consume was false-positived by string-matching `wired:false` against the **defensive catch-all branches** in `observation-sources.ts` (which fire only for non-existent threshold classes). That is the gate-not-vigilance trigger: convert the offending rule into a gate.

## The tool

`skill-creator cadence [--axis codify|consume|calibrate|verify] [--check] [--json]` — per-axis verdict `not-overdue` / `candidate` / `manual`.

- **calibrate** (machine-readable): enumerates `ALL_CALIBRATABLE_THRESHOLDS`, reads ACTUAL observation counts, flags `candidate` only at `>=20`. Live repo: `max 12 < 20 -> not overdue` (the correct verdict the session mis-read).
- **consume** (machine-readable): enumerates REAL union members; counts genuinely-`wired:false`. Catch-alls never appear (iterates real members, not the registry). Live repo: `0 genuinely-unwired -> not overdue`.
- **codify** (`manual`): no structured candidate backlog; reports manifest count + defers to prose.
- **verify** (heuristic): `tests/integration/` string-reference per wired threshold; labelled best-effort.

## The honest limit

The "`>=N` ships since last X" second conjunct is operator-tracked (no per-axis last-ship marker), so a met first conjunct yields `candidate` (confirm manually), never a silent "overdue". The tool is a first-conjunct surface, not a replacement for operator judgement.

## Supporting change

`src/bounded-learning/types.ts` gains a runtime `ALL_CALIBRATABLE_THRESHOLDS` array + a compile-time completeness guard (`satisfies` + `_AllThresholdsCovered` conditional type) pinning type<->array drift both directions (#10461).

## Verification

- tsc clean; cadence.test.ts 14/14; affected scope (cli + bounded-learning) 809/809.
- Two mutation-proofs: calibrate `>=20` boundary (`>=`->`>` reds the test) + compile-time drift guard (drop an array member -> TS2322).
- End-to-end run on the real repo (human / --json / --check exit / --axis bogus -> 2); it reproduces the v944 session's TRUE state.
- Full vitest suite green standalone (35684 passed). Pre-tag-gate 17/18; `vitest` step bypassed (operator-authorized this batch) for the pre-existing M4 branches concurrency flake (filed follow-up; CI is the backstop). See README "Verification".

## Engine state

NASA 1.178 (unchanged), counter-cadence **#24** (gate-not-vigilance; prior #23 = v944), manifest **151** (unchanged — realizes the forward-shadow + applies #10428/#10461; promotes no lesson).
