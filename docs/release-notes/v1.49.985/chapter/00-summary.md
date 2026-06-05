# v1.49.985 — Summary

## The ship

Adds `windows-latest` as the next **staged** (non-blocking) leg of the CI `test` matrix — the first per-push cross-platform signal for Windows. It mirrors the proven macOS (v1.49.923→928) and cargo (v1.49.936→939) staging pattern: run on every push for signal, without ship-blocking power, until a deterministic readiness gate justifies the flip to load-bearing.

## What shipped

- **`windows-latest` staged matrix leg** — carries `continue-on-error: ${{ matrix.os == 'windows-latest' }}`, so a red windows leg never fails the run-level conclusion the ship gate reads. ubuntu + macOS stay load-bearing; `fail-fast: false` keeps a windows failure from cancelling them.
- **Job-level `defaults.run.shell: bash`** — every step runs under Git Bash on the windows runner (no-op on ubuntu/macOS), so all three legs execute identical step scripts.
- **`tools/ci/windows-flip-readiness.mjs`** (+ test) — a faithful organic-churn analog of `macos-flip-readiness.mjs` that operationalizes the #10463 flip gate for the windows leg.
- **Lockstep:** `ci-matrix-parity.test.ts` pins the STAGED-WINDOWS invariant (exactly one windows-gated `continue-on-error`); `vitest.tools.config.mjs` registers the new test.

## Verification

- YAML validated; `npm run build` clean; ci-matrix-parity drift-guard 15/15; new readiness test + include-list coverage guard pass; full `tools/` suite 899 tests.
- Adversarial CI-correctness review: 0 BLOCKER / 0 MAJOR — confirmed (with GitHub Actions sources) that only the windows leg is non-blocking, Git Bash is available on the runner, and the readiness jq uniquely matches `Test (windows-latest)`.

## Engine state

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged.
