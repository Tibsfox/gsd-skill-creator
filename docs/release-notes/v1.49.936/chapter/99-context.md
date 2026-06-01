---
title: "Context"
chapter: 99-context
version: v1.49.936
date: 2026-06-01
summary: "Where v1.49.936 sits in the larger arc."
tags: [context]
---

# v1.49.936 — Context

## Where this sits

- The seventh shipped item of the **v929 carry-forward campaign** (CF4a), after CF1
  (v930), CF2a (v931), the v932 recovery, CF2b (v933), CF3 (v934), and CF4b+CF4c (v935).
- CF4a = a STAGED non-blocking cargo CI lane (the first CI job to compile the Rust/Tauri
  crate), following the #10463 staged-CI-lane-promotion pattern. Flip-to-load-bearing is
  a deliberate later ship.
- Remaining campaign work: CF4d (the deferred `algebrus.eigen` complex-serialization wire
  fix, discovered during the v935 recon).

## Engine state

- NASA degree 1.178 (unchanged).
- counter-cadence 20 (unchanged — forward infra work).
- manifest 150 lessons (no new lesson; a #10463 instance — staged promotion reused for a
  second lane; plus a carried-forward candidate on the lane-agnostic staged recipe).
- Architecture gaps unchanged: 6/7 closed-or-intentional.

## References

- The lane: `.github/workflows/ci.yml` (the `cargo` job).
- The drift-guard: `tests/integration/ci-matrix-parity.test.ts` (the staged describe block).
- The non-blocking semantics: `tools/pre-tag-gate.sh` step 4 reads the run-level conclusion.
- The crate under test: `src-tauri/Cargo.toml` (`gsd-os`); `--no-default-features` excludes
  the optional `cuda` + `postgres` features.
- The pattern: #10463 (staged CI-lane promotion); the v920 -> v923 -> v928 macOS three-rung
  template; `tools/ci/macos-flip-readiness.mjs`.
- Prior milestone: v1.49.935 (CF4b + CF4c — first coprocessor: skill consumer + eigen verdict).
