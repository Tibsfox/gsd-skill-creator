---
title: "v1.49.985 — staged windows-latest CI test leg (Phase 4)"
version: v1.49.985
date: 2026-06-05
summary: >
  Adds windows-latest as the next STAGED (non-blocking) leg of the CI test
  matrix, mirroring the v1.49.923 macOS staging. It carries a gated
  continue-on-error so it gives per-push cross-platform signal without
  ship-blocking power; ubuntu + macOS stay load-bearing. A new
  windows-flip-readiness.mjs operationalizes the eventual load-bearing flip.
tags: [phase-4, ci, cross-platform, windows, staged-lane]
---

# v1.49.985 — staged windows-latest CI test leg (Phase 4)

**Shipped:** 2026-06-05

Windows joins the CI `test` matrix as a non-blocking **staged** leg — the first per-push cross-platform signal for Windows, following the proven macOS (v1.49.923→928) and cargo (v1.49.936→939) staging pattern.

## Why this ship

Phase 4 is cross-platform CI. The `test` job already matrixed `ubuntu-latest` + `macos-latest`; this ship adds `windows-latest`. The suite carries Unix assumptions (path separators, `/tmp`, fs permissions, line endings), so Windows is **expected RED initially** — the whole point of a staged leg is to surface that signal *without* ship-blocking power, so the failures can be driven green over an iterative follow-on before the leg is promoted to load-bearing.

## What shipped

- **`windows-latest` staged matrix leg** — folded into the existing `test` job. It carries `continue-on-error: ${{ matrix.os == 'windows-latest' }}`, so a red windows leg never fails the run-level conclusion the pre-tag-gate ci-gate reads. The `ubuntu` + `macOS` legs stay **load-bearing** (their failures still block a ship), and `fail-fast: false` keeps a windows failure from cancelling them.
- **Job-level `defaults.run.shell: bash`** — runs every step script under Git Bash on the windows runner (a no-op on ubuntu/macOS, where bash is already the default), so the multi-line Grove fixture-gen prelude and the `npm`/`npx` steps execute identically across all three legs.
- **`tools/ci/windows-flip-readiness.mjs`** (+ test) — a deterministic, advisory readiness reporter that operationalizes the #10463 flip gate for the windows leg. A faithful organic-churn analog of `macos-flip-readiness.mjs`: it reports READY once N consecutive organic-churn green windows runs accumulate, gating the eventual load-bearing flip.
- **Lockstep drift-guard** — `tests/integration/ci-matrix-parity.test.ts` now pins the STAGED-WINDOWS invariant (exactly one `continue-on-error`, windows-gated; ubuntu + macOS unmasked), and `vitest.tools.config.mjs` registers the new test in its explicit include list.

## Verification

- YAML validated; `npm run build` clean; the ci-matrix-parity drift-guard passes **15/15**; the new windows-flip-readiness test + the include-list coverage guard pass; the full `tools/` suite passes (**899 tests**).
- Adversarial CI-correctness review (with authoritative GitHub Actions sources): **0 BLOCKER / 0 MAJOR**. Confirmed the load-bearing claim (a job-level `continue-on-error` on a matrix expression makes *only* the windows leg non-blocking; a red continue-on-error leg does not fail the run), that Git Bash is available on the windows runner, and that the readiness tool's jq uniquely matches `Test (windows-latest)`.

## Engine state

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged (forward Phase-4 CI infrastructure; no lesson promoted).
