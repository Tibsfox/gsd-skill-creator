# v1.49.945 — Summary

## The ship

A test-only `fix` that closes the cargo-lane flake the project accepted as a monitored risk when the cargo CI lane went **load-bearing** at v1.49.939.

The Rust keystore tests mutate the process-global env var `ANTHROPIC_API_KEY`, and `cargo test` runs tests in parallel by default. With no serialization, a test that SETS the var raced a sibling that expects it ABSENT — an intermittent ship-blocking failure. It materialized at v1.49.944: the identical docs-only commit passed cargo on the `dev` run and failed on the `main` run, then greened on `gh run rerun --failed`.

## Root cause

`api/tests/keystore_tests.rs::no_key_found` removes the var and expects `KeyStore::load()` to fail; a concurrent setter (`load_from_env_var`, `key_never_in_debug_output`, or — across files — `client_tests.rs::client_default_model` / `client_default_max_tokens`) makes the var present mid-test, so `load()` returns `Ok` and the test panics at `keystore_tests.rs:22`. The reverse window (a remover clearing the var between a setter's `set_var` and its `load`) exists too.

## The fix (test code only)

- **`api/tests/mod.rs`** — a module-private `static ANTHROPIC_ENV_LOCK: Mutex<()> = Mutex::new(());` plus a poison-tolerant `lock_anthropic_env()` accessor, placed in the **common parent** of both affected test files.
- **`api/tests/keystore_tests.rs`** — `let _env = super::lock_anthropic_env();` on all three env-mutating tests.
- **`api/tests/client_tests.rs`** — the same guard on the two env-mutating tests there.

The guard is held for the whole body (an `_env` binding, not bare `_`), so the entire `set_var .. load .. remove_var` span is exclusive across both files. Zero new dependency (no `serial_test`); `Mutex::new` is `const` on rustc 1.95.

## Scope correction

The v1.49.944 handoff scoped the race to one file. Recon across `src-tauri/` found `client_tests.rs` also mutates the var — so the complete racer set is **five tests across two files**, and a per-file guard would have left the cross-file race open. The security keystore tests use temp-dir keyrings (not the env var) and are not racers.

## Verification

- `cargo test --no-default-features ... api::tests::` — 38/38, clean.
- **Counterfactual (concurrency analog of mutation-proof):** racy HEAD code stress-fails **3/60** (32 threads) with the exact `no_key_found` panic; the fixed code is **0/30** (16 threads). Load-bearing proven.
- 3-lens adversarial review (scope / rust-correctness / ci-regression): **all CLEAN, zero findings**.
- Full pre-tag-gate 18/18 PASS.

## Engine state

NASA 1.178 (unchanged), counter-cadence **#23** (unchanged — a `fix` ship, not a counter-cadence cleanup), manifest **151** (unchanged — applies #10415, promotes no lesson).
