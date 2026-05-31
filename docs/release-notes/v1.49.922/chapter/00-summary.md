# v1.49.922 — Summary

**The layered cross-platform cleanup, closed.** v1.49.921's retro warned that fixing the
macOS lane's vitest step would expose the next layer — and named the culprit: a BSD-incompatible
`git grep` regex in `perf-assertion-audit`. This milestone fixes that, plus two latent
ship-tooling gate bugs the macOS-lane work surfaced, then re-dispatches the lane and proves it
green **end-to-end** — including the node:test step that had been gated behind the failing
tools-suite step and had never run on macOS. No NASA degree advance (1.178); fix-forward work,
so counter-cadence holds at 18.

## Three fixes, one theme: GNU-vs-BSD correctness in ship tooling

**1. perf-assertion-audit git grep BSD portability (the lane's "layer 2").**
`runAudit()` passes each `SHAPE_PATTERN.source` to `git grep -E`. The `relative-ratio`
pattern carried a lazy `[^)]+?` (BSD: "repetition-operator operand invalid") and a `\d`
nested in a character class that the `\d`→`[0-9]` translator mangled into `[[0-9].+ \-]`.
Fix: de-lazy, write the class as `[0-9.+ \-]` directly, and extract a hardened, unit-tested
`toPosixEre()` that strips lazy quantifiers so the consumer is robust to the whole class.
`detectShape` uses only `.test()`, so greedy-vs-lazy is behaviourally identical JS-side.
The fix also closed a **latent Linux under-count**: the GNU-mangled ERE was silently missing
genuine `N * ident + K` relative-ratio sites — findings 75 → 90, all true positives.

**2. ci-gate workflow pinning.** Pre-tag-gate step 4 listed all workflows' dev runs and took
`.[0]` at the dev-tip; the dispatchable, non-blocking macOS lane could win that selection and
make the gate read the wrong conclusion. Now pinned to `--workflow ci.yml`
(`SC_CI_GATE_WORKFLOW` override). Verified live: with both `CI` and `CI (macOS)` runs at the
same dev-tip, the old logic picked `CI (macOS)`, the new logic deterministically picks `CI`.

**3. step-17 gate abort.** `|| true` on the `latest-shipped-version-drift` grep so a
non-drift PROJECT.md WARN can no longer abort the whole gate under `set -euo pipefail`.

## Verification

- Tools-suite green on Linux (**698 tests**, +7 new portability guards). Gate fixes proven by
  isolated repro (clean-child shell for step 17; live before/after for ci-gate selection).
- macOS lane re-dispatched on the fixed SHA: run `26697886385` = **success**, every step
  including the first-ever macOS node:test run.

## The meta-point

A cross-platform lane's payoff is *layered*: each layer you fix reveals the next. v920 stood
the lane up, v921 fixed the tmpdir-symlink class, and v922 closes the git-grep-regex class —
at which point the lane finally runs clean through every step. The two gate bugs fixed here
were not lane failures but ship-tooling defects the lane work happened to surface; closing
them tightens the ship pipeline against the same GNU-vs-BSD asymmetry.
