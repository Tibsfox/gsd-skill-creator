---
title: "Context"
chapter: 99-context
version: v1.49.945
date: 2026-06-01
summary: "Where v1.49.945 sits in the larger arc."
tags: [context, fix, cargo, ci, deferred-maintenance]
---

# v1.49.945 — Context

## Milestone metadata

- **Version:** v1.49.945
- **Type:** `fix` (test-only; closes a deferred-maintenance wedge per #10415)
- **Predecessor:** v1.49.944 (wire session-end prune through observation.retention_days substrate, counter-cadence #23, consume)
- **NASA degree:** 1.178 (unchanged — degree-non-advancing maintenance)
- **Counter-cadence count:** 23 (unchanged — a `fix` ship, not a counter-cadence cleanup mission)

## Where this sits

- The cargo CI lane's load-bearing flip arc completed at v1.49.939 (staged v1.49.936 -> load-bearing v1.49.939, the two-rung sequence; the macOS lane was the three-rung sibling v920 -> v923 -> v928). The flip carried a named accepted-risk: cargo is now ship-blocking, so a flaky Rust test can red-block a ship.
- The risk materialized at v1.49.944, where the post-ship `main` cargo run failed on an identical docs-only commit that had passed on `dev`, then greened on re-run. This ship is the resolution.
- It is the first **Rust** test-discipline fix in the recent arc, which has been TypeScript-heavy (the v929-v937 coprocessor carry-forward campaign, the v943/v944 codify/consume ships).

## Files changed

- `src-tauri/src/api/tests/mod.rs` — **+~24 lines.** A module-private `static ANTHROPIC_ENV_LOCK: Mutex<()> = Mutex::new(());` plus a poison-tolerant `lock_anthropic_env() -> MutexGuard<'static, ()>` accessor (`.lock().unwrap_or_else(|p| p.into_inner())`), placed in the common parent module of the two affected test files.
- `src-tauri/src/api/tests/keystore_tests.rs` — **+3 lines.** `let _env = super::lock_anthropic_env();` on `load_from_env_var`, `no_key_found`, `key_never_in_debug_output`.
- `src-tauri/src/api/tests/client_tests.rs` — **+2 lines.** The same guard on `client_default_model`, `client_default_max_tokens`.
- `docs/release-notes/v1.49.945/` — milestone notes (README + 00/03/04/99 chapters).

No production code changed (all three edited Rust files are under `#[cfg(test)] mod tests;`). `src-tauri/Cargo.lock` was deliberately **not** touched (its stale `gsd-os` self-version is harmless and out of scope).

## The racer set

Five tests across two files mutate the process-global `ANTHROPIC_API_KEY`:

| Test | File | Mutation | Guarded |
|---|---|---|---|
| `load_from_env_var` | keystore_tests.rs | set -> load (expect Ok) | yes |
| `no_key_found` | keystore_tests.rs | remove -> load (expect Err) | yes |
| `key_never_in_debug_output` | keystore_tests.rs | set -> load | yes |
| `client_default_model` | client_tests.rs | set -> load | yes |
| `client_default_max_tokens` | client_tests.rs | set -> load | yes |

Non-racers (correctly unguarded): `key_never_in_error_display`, `has_key_returns_false_when_empty`, `client_requires_key` (uses `KeyStore::empty()`), `request_body_shape`. The security keystore tests (`security/tests/`) use temp-dir keyrings / age paths, not the env var. Production `KeyStore::store_key()` (the only other env mutator) has no test caller.

## Test posture

- `cargo test --no-default-features --manifest-path src-tauri/Cargo.toml api::tests::` — 38/38 pass, compiles clean, no warnings.
- Load-bearing counterfactual: racy HEAD code **3/60** fail (32 threads); fixed code **0/30** (16 threads).
- 3-lens adversarial review (scope-completeness / rust-correctness / ci-regression): all CLEAN, zero findings.
- Full pre-tag-gate: 18/18 PASS.

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count 23 (unchanged).
- Manifest: **151 lessons** (unchanged — a `fix` ship applies lessons, promotes none).
- Architecture gaps: 6/7 closed-or-intentional (unchanged).
- Dependency security: 0 high+ vulnerabilities (no dependency added).

## References

- The deferred-maintenance discipline: `docs/deferred-maintenance-discipline.md` (#10415).
- The cargo lane's load-bearing flip: v1.49.939 (`project_v939-cargo-lane-loadbearing-flip`); the readiness gate `tools/ci/cargo-flip-readiness.mjs` (v1.49.938).
- The flake detail: memory `project_cargo-keystore-test-flake`.
- The fixed tests: `src-tauri/src/api/tests/keystore_tests.rs`, `src-tauri/src/api/tests/client_tests.rs`; the shared guard: `src-tauri/src/api/tests/mod.rs`.
- The credential loader under test: `src-tauri/src/security/keystore.rs` (`load_credentials_from_keystore`, OS-keyring-first then env fallback).
- Counter-cadence predecessor: v1.49.944 (#23, consume).
