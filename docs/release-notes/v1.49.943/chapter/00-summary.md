# v1.49.943 — Summary

## The ship

A counter-cadence codify ship (#22) that closes the two carried-forward items the v1.49.942 retrospective named, on the same surface:

1. **Promotes** the "pin the GREEN/BREAKING Set boundaries of a defer-biased gate" pattern to manifest lesson **#10464** (manifest 150 -> 151) — it reached its second instance at v942 (cargo v938 + macOS v942), satisfying the promote-on-second-instance rule.
2. **Test-pins** the named transparent states `stale`/`startup_failure`/`in_progress` in **both** flip-readiness suites — the v942 "future audit could pin them in both gates together (preserving symmetry)."

The diff is **+35 lines test-only** plus the manifest/doc promotion. The gate sources are unchanged.

## Lesson #10464

A defer-biased flip-readiness gate sorts each CI-leg conclusion into a `GREEN` Set (`{success}`, advances the streak), a `BREAKING` Set (`{failure, timed_out, cancelled, action_required}`, breaks it), and a transparent remainder. The safety property is defer-bias: a misclassification may only DEFER the flip, never advance it. Each boundary has a silent failure direction — a conclusion drifting into GREEN advances on a non-green run; a flaky conclusion missing from BREAKING advances on a flaky lane. Happy-path tests (N plain greens) pass wherever the boundary sits, so the boundaries must be pinned explicitly. The pin is a **discriminating fixture**: `[green, X, green]` @ `n=3` asserting `streak === 2`, `ready === false`, `broke === null` — it reds if `X` drifts into GREEN (streak reaches 3) *or* into BREAKING (`broke` set). A `[green, X, green, green]` shape pushes `streak` to `n` in the transparent case too (`ready` true either way), so the test must use exactly two greens to keep `ready === false` the discriminating assertion.

## The application

Each suite gains one test looping `['stale','startup_failure','in_progress']` through the discriminating shape:

- `tools/ci/__tests__/macos-flip-readiness.test.mjs` (**+18**)
- `tools/ci/__tests__/cargo-flip-readiness.test.mjs` (**+17**)

Both are **mutation-proven** in both directions: widening GREEN with one of the states reds the test (and only it); widening BREAKING reds it too; `git checkout` restores green. The gate sources were restored after each mutation, so the commit is test-only.

## Why now, why together

The promotion and the application are the same surface: the new tests are a fresh instance of the lesson being promoted, and they complete the macOS<->cargo Set-boundary symmetry that v942 deliberately preserved by not pinning these states on one gate alone. Landing both keeps the discipline doc's reference implementation and the real suites in lockstep.

## Engine state

NASA 1.178 (unchanged), counter-cadence **#22** (prior #21 = v1.49.942, which produced the second instance), manifest **151** (+1: new lesson #10464).
