# v1.49.939 — Summary

## The ship

The staged `cargo` CI lane is now **load-bearing**. The job-level `continue-on-error: true` was deleted from the cargo job in `.github/workflows/ci.yml`, so a cargo failure now folds into the run-level conclusion the pre-tag-gate ci-gate reads — blocking a ship exactly like an ubuntu test failure. The flip was authorized by the v1.49.938 cargo-flip-readiness gate reaching **READY 3/3** (gate-not-vigilance, #10463).

## The pairing

The flip was paired in one commit with the mandatory inversion of the STAGED assertion in `tests/integration/ci-matrix-parity.test.ts` (the #10461 drift-guard): `toMatch(/continue-on-error: true/)` → `.not.toMatch(...)`, pinning the line's ABSENCE. A silent flip (or a silent re-stage) fails the test. **Mutation-proven:** re-adding the line reds exactly the inverted cargo assertion; the macOS assertion is unaffected (independent).

## Two rungs, second lane

Cargo's promotion was a two-rung sequence — staged v1.49.936 → load-bearing v1.49.939 — with no decoupled-nightly first rung (unlike the macOS v920→v923→v928 three-rung arc). This is the **second** CI lane to complete the staged→load-bearing arc, validating gate-not-vigilance beyond the macOS leg: a deterministic readiness verdict drove the flip, not operator eyeballing.

## Loose ends tied off

- `tools/ci/cargo-flip-readiness.mjs` docstrings updated from "the future flip commit" to past tense (self-referential #10427 — a flip-gate tool must not describe a now-done flip as pending). Its runtime guidance was already lifecycle-aware and now prints the post-flip REVERT path.
- The #10463 record (`docs/static-analysis-tool-discipline.md` + `disciplines.json` + rendered `CLAUDE.md`) documents the cargo flip + the lane-stability model.

## The accepted risk

Every ship now requires the cargo lane green (apt webkit2gtk + `cargo test --no-default-features`). Track record at flip: green on all 6 distinct commits since introduction. A transient infra flake could red-block an unrelated ship — the same trade macOS took at v1.49.928, mitigated by the gate-enforced N-green window. NASA 1.178, counter-cadence 20, manifest 150.
