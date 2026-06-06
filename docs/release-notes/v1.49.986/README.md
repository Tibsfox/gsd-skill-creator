---
title: "v1.49.986 — Phase 4 rungs 2-3 — windows CI cross-platform green + load-bearing flip"
version: v1.49.986
date: 2026-06-06
summary: >
  Phase 4 (cross-platform CI) rungs 2 and 3. The staged windows-latest matrix leg
  introduced in v1.49.985 was driven from red (34 failures across 9 tool/test files)
  to fully green by fixing the test suite's Unix assumptions, then FLIPPED from staged
  (continue-on-error, non-blocking) to LOAD-BEARING once windows-flip-readiness.mjs
  reached READY 3/3 across organic churn. All three OS legs (ubuntu, macOS, windows)
  now block a ship.
tags: [ci, windows, cross-platform, phase-4]
---

# v1.49.986 — Phase 4 rungs 2-3 — windows CI cross-platform green + load-bearing flip

**Shipped:** 2026-06-06

The staged `windows-latest` CI leg introduced in v1.49.985 is now green and load-bearing: every OS leg (ubuntu / macOS / windows) blocks a ship.

## Why this ship

v1.49.985 opened Phase 4 by folding `windows-latest` into the CI matrix as a STAGED (`continue-on-error`, non-blocking) leg — red on arrival because the test suite carried Unix assumptions. The 3-rung arc (mirroring macOS v920→928 and cargo v936→939) is: (1) stage the leg, (2) drive it green, (3) flip it to load-bearing. This ship bundles **rung 2** (drive green) and **rung 3** (flip), closing the Phase 4 windows arc.

## What shipped

**Rung 2 — drive windows green** (34 failures across 9 files, fixed in 3 clusters):

- **Path separators (`\` vs `/`).** `atlas-deps-audit.mjs` (a `file://` + backslash path resolution made every intra-tree import read as cross-tree → 274 false violations), `check-tools-test-coverage.mjs`, and `college-src-boundary-audit.mjs` now normalize logical repo-relative paths to POSIX before comparison/emit. The `ftp-sync` test assertions were made separator-agnostic — the tool's `localAbs` stays native because it is handed to `uploadFrom`.
- **ESM import specifiers.** `atlas-perf-bench.mjs` did `await import()` of a raw native path, which throws `ERR_UNSUPPORTED_ESM_URL_SCHEME` on Windows; wrapped in `pathToFileURL().href`.
- **Shell + spawn portability.** `update-state-md-on-ship.mjs` ran `execSync("git tag -l 'v*.*.*'")`, whose single quotes survive cmd.exe (Node's Windows child shell, regardless of the workflow's `shell: bash`) → zero tags → silent no-op; switched to `execFileSync` argv. `append-story-entry.mjs` and `state-md-normalizer-prose.mjs` main-guards used `new URL().pathname` (`/D:/…` ≠ native argv) → fixed with `fileURLToPath`. `ln` / `which` / `grep` spawns replaced with `fs.symlinkSync('junction')` / `where` / a Node-native search. One Linux-only snap-confinement test is `skipIf(win32)`.

**Rung 3 — flip to load-bearing:**

- Deleted the gated `continue-on-error: ${{ matrix.os == 'windows-latest' }}` from `.github/workflows/ci.yml`; the windows leg now folds into the run-level conclusion the pre-tag-gate ci-gate reads.
- Flipped the `tests/integration/ci-matrix-parity.test.ts` drift-guard invariant STAGED-WINDOWS (exactly-one continue-on-error) → LOAD-BEARING ZERO-COE (all three legs unmasked), in lockstep (#10461).
- The flip was gated on `tools/ci/windows-flip-readiness.mjs` reaching READY 3/3 across organic churn — accrued from three diverse real-fix pushes, never from the promotion ship itself (#10463).

## Verification

- Full `npx vitest run` + tools suite green on all three OS legs; windows-latest now reports `Test Files 58 passed | 1 skipped`, `Tests 893 passed | 6 skipped`.
- Each rung-2 cluster was Linux-verified before push; each rung-3 accrual push was CI-confirmed windows-green before the next (the readiness streak needs consecutive greens, and CI runs only on a push tip).
- The flip CI run returned run-conclusion `success` with windows-latest now load-bearing and green.
- `ci-matrix-parity` drift-guard: 15/15; `windows-flip-readiness`: 36/36.
- Ship-review scaled to blast radius: the change set was already CI-validated green on all platforms across multiple runs (windows green ×4) and Linux-verified per commit, so direct multi-angle verification stood in for the full five-lens panel.

## Engine state

NASA degree **1.178** · counter-cadence count **29** · manifest lessons **152** — all unchanged. Forward Phase-4 CI infrastructure; no lesson promoted.
