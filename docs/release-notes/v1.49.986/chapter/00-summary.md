# v1.49.986 — Summary

## The ship

Phase 4 (cross-platform CI) rungs 2 and 3. The `windows-latest` matrix leg that v1.49.985 introduced STAGED (non-blocking) was driven from red — 34 failures across 9 tool/test files, all Unix assumptions — to fully green, then FLIPPED to load-bearing once `tools/ci/windows-flip-readiness.mjs` reached READY 3/3 across organic churn. All three OS legs (ubuntu, macOS, windows) now block a ship.

## What shipped

- **Rung 2 (drive green), 3 root-cause clusters:** POSIX-normalize logical repo-relative paths in `atlas-deps-audit.mjs` / `check-tools-test-coverage.mjs` / `college-src-boundary-audit.mjs` (+ separator-agnostic `ftp-sync` test assertions); `pathToFileURL().href` for the `atlas-perf-bench` dist `import()`; `execFileSync` argv for the `update-state-md-on-ship` git-tag glob (cmd.exe kept the single quotes); `fileURLToPath` main-guards in `append-story-entry` + `state-md-normalizer-prose`; `fs.symlinkSync('junction')` / `where` / Node-native search replacing `ln` / `which` / `grep`; one Linux-only snap test `skipIf(win32)`.
- **Rung 3 (flip):** deleted the gated `continue-on-error` for `windows-latest` in `.github/workflows/ci.yml` and flipped the `ci-matrix-parity.test.ts` invariant STAGED-WINDOWS → LOAD-BEARING ZERO-COE, in lockstep (#10461).

## Verification

- windows-latest now `Test Files 58 passed | 1 skipped`, `Tests 893 passed | 6 skipped`; all three legs green; the flip CI run was run-conclusion `success` with windows load-bearing.
- `ci-matrix-parity` 15/15; `windows-flip-readiness` 36/36; readiness gate READY 3/3 (organic churn, never the promotion ship itself).

## Engine state

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged.
