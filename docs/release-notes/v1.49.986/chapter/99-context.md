---
title: "Context"
chapter: 99-context
version: v1.49.986
date: 2026-06-06
summary: "Where v1.49.986 sits in the larger arc."
tags: [context, phase-4]
---

# v1.49.986 — Context

## Milestone metadata

- **Version:** v1.49.986
- **Type:** `ci(windows)` — Phase 4 rungs 2-3 — windows CI cross-platform green + load-bearing flip
- **Predecessor:** v1.49.985 (staged windows-latest CI test leg, Phase 4 rung 1; post-ship `f85c63c56`)
- **NASA degree:** 1.178 (unchanged)
- **Counter-cadence count:** 29 (unchanged; this is a normal, non-counter-cadence ship)

## Where this sits

v1.49.985 opened Phase 4 (cross-platform CI) by staging the `windows-latest` matrix leg as non-blocking — rung 1 of a 3-rung arc that mirrors the macOS promotion (v920 stage → v928 flip) and the cargo lane (v936 stage → v939 flip). This milestone bundles **rung 2** (drive the leg green by fixing the suite's Unix assumptions) and **rung 3** (flip it to load-bearing once the readiness gate cleared), closing the Phase 4 windows arc. All three OS legs are now load-bearing.

The rung-2 and rung-3 work landed as a sequence of `fix(windows)`/`ci(windows)` commits on dev across 2026-06-06, each CI-validated on all three platforms before this release bundled them.

## Files changed

- `.github/workflows/ci.yml` — deleted the gated `continue-on-error` for the windows leg (rung 3 flip).
- `tests/integration/ci-matrix-parity.test.ts` — drift-guard invariant STAGED-WINDOWS → LOAD-BEARING ZERO-COE.
- Rung-2 tool/test fixes: `tools/atlas-deps-audit.mjs`, `tools/check-tools-test-coverage.mjs`, `tools/college-src-boundary-audit.mjs`, `tools/atlas-perf-bench.mjs`, `tools/update-state-md-on-ship.mjs`, `tools/state-md-normalizer-prose.mjs`, `tools/elc-smoke/score.mjs`, `tools/mus-smoke/score.mjs`, `scripts/append-story-entry.mjs`, `scripts/closure-verify-cf.mjs`, and the paired tests `tools/__tests__/ftp-sync.test.mjs`, `tools/__tests__/state-md-set-shipped.test.mjs`, `tools/__tests__/gh-release-publish.test.mjs`, `tools/__tests__/state-md-normalizer-prose.test.mjs`.

## Engine state at close

NASA degree **1.178** · counter-cadence count **29** · manifest lessons **152** — all unchanged. No lesson promoted; forward Phase-4 CI infrastructure.
