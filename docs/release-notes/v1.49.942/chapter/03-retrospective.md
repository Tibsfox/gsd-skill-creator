# v1.49.942 — Retrospective

## What went right

- **The sweep was scoped by reading the sibling, not by guessing.** Before writing anything, the cargo gate's v938 boundary tests were read directly (`cargo-flip-readiness.test.mjs:232-257`) to extract the exact shape — the two `it()` blocks, the `for`-loop over `['timed_out','cancelled','action_required']`, the `neutral`-transparent assertion (`streak 2`, `ready false`, `broke null`). The macOS tests are a faithful adaptation (`cargoConclusion`→`macosConclusion`, `churn:'tracked'`→`churn:'organic'`), so the two gates now share a boundary-test contract rather than two hand-rolled approximations.

- **Mutation proof confirmed the tests are load-bearing, not decorative.** Each new test was verified to red under the precise mutation it guards: shrinking `BREAKING` to `['failure']` reds the timed_out test (and only it); expanding `GREEN` to `['success','neutral']` reds the neutral test (and only it). The gate source was restored from git (`git checkout --`) after each mutation, and the working tree was confirmed clean before the commit — so the committed change is genuinely test-only.

- **The defer-bias direction was reasoned through, not assumed.** The hole is asymmetric: a `timed_out` that fell through to the transparent branch (instead of breaking) would let a flaky-infra leg *bridge* a streak; a `neutral` admitted into GREEN would *count* toward the streak. Both advance the flip on weaker evidence — the one direction the gate exists to forbid. The tests pin the safe classification, so a regression surfaces as a red test, not a premature flip.

- **The completeness critic earned its place by being overruled correctly.** The adversarial review's one finding — that `stale`/`startup_failure`/`in_progress` transparency is not individually unit-tested — is factually true but was the right call to dismiss: the cargo sibling does not pin those either. Pinning them on macOS alone would have made the two gates asymmetric, trading a real symmetry for speculative coverage. Scope held at "mirror v938," exactly as intended.

## What went well in process

- **A thin, single-file change still went through the full ship discipline.** Code commit first (`test(ci):`), five release-notes chapters, STORY, bump, full 18-step pre-tag-gate with no integration bypass, separate `chore(release)`, tag, dual-push with `ls-remote` verification, RH refresh/publish, STATE with `--counter-cadence`. The counter-cadence framing did not relax the gate: the first gate run actually *caught* a fresh critical npm advisory (the vitest-UI GHSA), which was split off and shipped on its own as v1.49.941 before this ship proceeded; the re-run then passed all 18 steps clean.

- **The ship sits in a satisfying arc.** Counter-cadence #20 (v1.49.925) *created* `macos-flip-readiness.mjs`; the cargo flip track (v938 gate → v939 load-bearing flip) *exercised* the same gate family and surfaced the Set-boundary hole; counter-cadence #21 (this ship) *hardens* the original gate's tests against that hole. The maintenance counter and the forward work converged on the same surface.

## What to watch

- **The defer-bias Set-boundary pattern now has two instances.** Cargo (v938) and macOS (v942) both pin GREEN/BREAKING boundaries with mutation-proven tests. That recurrence makes "pin the advance/break Set boundaries of a defer-biased gate" a clean manifest-lesson promotion candidate (see lessons). Promotion was deferred to keep this ship surgical; a future codify ship can land it.

- **Comment-pinned transparency remains unguarded in both gates.** `stale`/`startup_failure`/`in_progress` are documented as transparent in the gate comments but not asserted by any test in either suite. A future audit could pin them in *both* gates together (preserving symmetry) if a refactor ever threatens the transparent fall-through branch.
