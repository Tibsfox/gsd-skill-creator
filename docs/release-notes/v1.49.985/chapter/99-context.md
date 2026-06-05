---
title: "Context"
chapter: 99-context
version: v1.49.985
date: 2026-06-05
summary: "Where v1.49.985 sits in the larger arc."
tags: [context, phase-4, ci]
---

# v1.49.985 — Context

## Milestone metadata

- **Version:** v1.49.985
- **Type:** `ci(matrix)` — staged windows-latest CI test leg (Phase 4)
- **Predecessor:** v1.49.984 (`9f29ca681`, skill-mining config migrator / integration migrate)
- **NASA degree:** 1.178 (unchanged)
- **Counter-cadence count:** 29 (unchanged)

## Where this sits

This opens **Phase 4 (cross-platform CI)** — a thread carried since v1.49.978 and named as open in the v1.49.984 context. The `test` job already matrixed ubuntu + macOS; this adds the windows leg in the same STAGED form macOS and cargo were introduced in. It is rung 1 of the three-rung arc (staged → readiness-gated → load-bearing): this ship stands up the non-blocking signal lane and its readiness tool. Driving the windows leg green (fixing the suite's Unix assumptions) and then flipping it to load-bearing are the follow-on rungs. The other open threads remain time/volume-gated (the 5.1c re-audit ~2026-06-19→07-03 and the retention re-audit + first dry-run tick) plus the amiga retire decision.

## Files changed

- **CI:** `.github/workflows/ci.yml` — `windows-latest` added to the `test` matrix with a gated `continue-on-error`, a job-level `defaults.run.shell: bash`, and an explanatory comment.
- **Drift-guard:** `tests/integration/ci-matrix-parity.test.ts` — new STAGED-WINDOWS invariant (exactly one windows-gated `continue-on-error`; ubuntu + macOS unmasked); PARITY assertion extended to windows.
- **Tooling:** `tools/ci/windows-flip-readiness.mjs` (new, organic-churn flip-readiness reporter) + `tools/ci/__tests__/windows-flip-readiness.test.mjs` (new); `vitest.tools.config.mjs` registers the new test in its explicit include list.

## Engine state at close

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged (forward Phase-4 CI infrastructure; no lesson promoted).
