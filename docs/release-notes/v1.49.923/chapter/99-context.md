# v1.49.923 — Context

## Milestone metadata

- **Version:** v1.49.923
- **Type:** CI infrastructure (forward — drains carry-forward #1 from the v1.49.922 retro)
- **Predecessor:** v1.49.922
- **NASA degree:** 1.178 (unchanged)
- **Counter-cadence count:** 18 (unchanged — forward CI work, not a cleanup mission)
- **Source:** the v1.49.922 retro's named carry-forward #1 ("promote macos-latest into the
  ci.yml matrix once nightly-green-stable") + the documented promotion path in the retired
  ci-macos.yml header.

## Files changed (feature commit `4ef0be9f0`)

- `.github/workflows/ci.yml` — `test` job folded into a `strategy.matrix` over
  `[ubuntu-latest, macos-latest]`; `runs-on: ${{ matrix.os }}`;
  `continue-on-error: ${{ matrix.os == 'macos-latest' }}`; `fail-fast: false`;
  `timeout-minutes: 60`. Steps unchanged.
- `.github/workflows/ci-macos.yml` — DELETED (the decoupled nightly lane, retired).
- `tests/integration/ci-macos-parity.test.ts` — DELETED; replaced by
  `tests/integration/ci-matrix-parity.test.ts` (9 tests): matrix-parity + staged-non-blocking
  + retirement drift-guard, slice bounded to the test job, exactly-one-continue-on-error.
- `tools/pre-tag-gate.sh` — ci-gate (step 4) comment updated: macOS is now a non-blocking
  matrix leg in `ci.yml`, not a separate lane; the `--workflow ci.yml` pin remains as a guard.

The feature landed as one `ci:` commit on dev (`4ef0be9f0`), pushed, CI-green, before this
`chore(release)` bump/notes commit.

## Test posture

- New drift-guard green: **9 tests** (was 6 on the retired two-file guard). Net +3 in the main
  vitest suite; tools-suite (698) unchanged.
- Empirical COE-semantics probe (throwaway branch `probe/coe-matrix`, cleaned up): a matrix
  with a passing blocking leg + a failing `continue-on-error` leg → failing leg `failure`,
  **run-level conclusion `success`**. Real GitHub Actions.
- Real `ci.yml` matrix run on dev tip `4ef0be9f0`: run `26699329004` = **success**, jobs
  Block-private-files / Security-Audit / Build / Test (ubuntu-latest) / Test (macos-latest) all
  green.

## Adversarial review provenance

- A 3-lens review (GH-Actions semantics / drift-guard adequacy / ship-pipeline completeness) +
  synthesis. The semantics lens raised a sourced BLOCKER (job-level continue-on-error "doesn't
  mask the run conclusion"); the synthesis refuted it (cited case needs a `needs:[test]`
  downstream; none here) and the empirical probe closed it. Two hardening items adopted: bound
  the drift-guard's job slice to the next top-level job (not EOF), and assert exactly one
  continue-on-error in the job (catches a step-level one masking the ubuntu leg).

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + #10184 (single-step main FF) +
#10197 (STORY-gate post-bump-version). Canonical sequence at
`docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- bump-version run BEFORE the full pre-tag-gate so completeness `--current` resolves to v1.49.923.
- No `www/` change → no FTP sync, no chapter-gen needed.
- GH release publish remains batch-deferred (since v886).
- Operator retains the G3 (dev→main) gate.

## Engine state at close

- NASA degree 1.178 (138 consecutive ships)
- Counter-cadence count 18
- Manifest: 24 domains, 149 lessons (one lesson candidate noted in 04-lessons, not codified)
- KNOWN_UNWIRED Process/Egress/Loader: 0/0/0 (unchanged)
- Architecture gaps: 5/7 closed-or-intentional (unchanged)
- macOS CI: now a non-blocking `ci.yml` matrix leg, push-triggered on main/dev; flip to
  load-bearing deferred until N consecutive green pushes
- Open follow-ons: the load-bearing flip; Rust-in-CI; a real `coprocessor:` skill consumer
