---
title: "v1.49.945 — serialize the ANTHROPIC_API_KEY env-var Rust tests (close the v939 cargo-lane flake)"
version: v1.49.945
date: 2026-06-01
summary: >
  Test-only fix that closes the accepted-risk the cargo CI lane carried since it
  went load-bearing at v1.49.939. The Rust keystore tests mutate the
  process-global ANTHROPIC_API_KEY env var, and cargo runs tests in parallel by
  default, so a test that SETS the var raced a sibling that expects it ABSENT —
  an intermittent ship-blocking failure (it materialized at v1.49.944, where the
  identical docs-only commit passed cargo on dev and failed on main, then greened
  on re-run). The fix is a shared, poison-tolerant std::sync::Mutex guard
  acquired at the top of every env-mutating test, serializing access across BOTH
  affected test files. Recon found the race is broader than the v944 handoff
  scoped it: a SECOND test file (client_tests.rs) also mutates the var, so a
  per-file guard would have been insufficient. Zero new dependency (no
  serial_test crate). Load-bearing-proven: the racy HEAD code flakes 3/60 under
  32-thread stress; the fixed code is 0/30. Closes the #10415 deferred-maintenance
  wedge within one milestone of its materialization.
tags: [fix, test, rust, cargo, ci, flake, keystore, lesson-10415, deferred-maintenance]
---

# v1.49.945 — serialize the ANTHROPIC_API_KEY env-var Rust tests (close the v939 cargo-lane flake)

**Shipped:** 2026-06-01

One-line: the Rust keystore tests that mutate the process-global `ANTHROPIC_API_KEY` are now serialized through a shared `Mutex` guard, eliminating the parallel-test data race that intermittently reddened the load-bearing cargo CI lane.

## Why this ship

The cargo CI lane went **load-bearing** at v1.49.939 (the second lane flipped via the #10463 staged-promotion gate). That flip carried an explicitly documented accepted-risk: *"cargo now ship-blocking — MONITOR next ships for flake; revert documented."* At v1.49.944 the risk materialized. The cargo lane failed on the post-ship `main` run of an identical, **docs-only** commit (`10a665f7b`) that had just passed cargo on the `dev` run; `gh run rerun --failed` greened it. v1.49.944 touched zero Rust, so this was not a regression from that ship — it was a pre-existing intermittent test race finally surfacing now that cargo can block a ship.

Per the **deferred-maintenance discipline (#10415)** — an open red test in a load-bearing lane is closed within 1-2 milestones of materialization, not deferred — this is the closing ship, one milestone after the flake appeared.

## Root cause

`cargo test` runs tests in parallel threads by default. Several keystore tests mutate the **process-global** environment variable `ANTHROPIC_API_KEY`:

- `api/tests/keystore_tests.rs::load_from_env_var` — sets the var, expects `KeyStore::load()` to succeed.
- `api/tests/keystore_tests.rs::no_key_found` — removes the var, expects `KeyStore::load()` to **fail** with `NotFound`.
- `api/tests/keystore_tests.rs::key_never_in_debug_output` — sets the var, loads, asserts on Debug output.

With no serialization, `no_key_found`'s "the var is absent" precondition is destroyed the instant a sibling test sets the var on another thread, so `KeyStore::load()` returns `Ok` and the test panics at `keystore_tests.rs:22` ("KeyStore::load should fail when no key is available"). The reverse window exists too (a remover clears the var between a setter's `set_var` and its `load`).

## What shipped (test code only — zero production change)

- **`src-tauri/src/api/tests/mod.rs`** — a module-private, `const`-initialized shared lock plus a poison-tolerant accessor:
  ```rust
  static ANTHROPIC_ENV_LOCK: Mutex<()> = Mutex::new(());
  fn lock_anthropic_env() -> MutexGuard<'static, ()> {
      ANTHROPIC_ENV_LOCK.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
  }
  ```
  Placed in the **common parent module** of both affected test files so a single lock serializes across them.
- **`src-tauri/src/api/tests/keystore_tests.rs`** — `let _env = super::lock_anthropic_env();` as the first line of all three env-mutating tests.
- **`src-tauri/src/api/tests/client_tests.rs`** — the same guard on `client_default_model` and `client_default_max_tokens`, which **also** set `ANTHROPIC_API_KEY`.

The guard is held for the whole test body (an `_env` binding, not a bare `_`, so it is not dropped early — rustc 1.95's `let_underscore_lock` lint would reject the bare form), making the entire `set_var .. load .. remove_var` span exclusive. `into_inner()` recovers a poisoned mutex so one panicking test cannot cascade-fail the rest; each env-mutating test re-establishes its own precondition at the top, so recovery is always safe.

## Scope correction (broader than the handoff named)

The v1.49.944 handoff scoped the race to `keystore_tests.rs` alone. Recon across the whole `src-tauri/` tree (grepping `ANTHROPIC_API_KEY`, `set_var`/`remove_var`, `KeyStore::load`, `load_credentials_from_keystore`, `store_key(`) found a **second** racer file: `client_tests.rs` sets the same var in two tests. A per-file guard would have left the cross-file race open. The complete racer set is **five tests across two files**; the security keystore tests use temp-dir keyrings/age paths (not the env var) and are not racers, and the only other env mutator — production `KeyStore::store_key()` — has no test caller.

## Why a Mutex, not the `serial_test` crate

`serial_test` (`#[serial]`) is the idiomatic alternative but adds a dev-dependency that the (already slow, apt-prelude) cargo lane would compile on every run. A zero-dependency `static Mutex<()>` fits the project's dependency-minimalism discipline (ADR 0001), and `Mutex::new` has been `const` since rustc 1.63 (well under the 1.95 toolchain), so no `once_cell`/`lazy_static` is needed.

## Verification

- `cargo test --no-default-features --manifest-path src-tauri/Cargo.toml api::tests::` — **38/38 pass**, compiles clean, no warnings.
- **Load-bearing counterfactual (the concurrency analog of a mutation-proof):** `git stash` the fix to restore the racy HEAD code, then stress at 32 threads x 60 runs -> **3/60 fail** with the exact `no_key_found` panic at `keystore_tests.rs:22`. Restore the fix, stress at 16 threads x 30 runs -> **0/30 fail**. The lock is load-bearing, not decorative.
- A 3-lens adversarial review (scope-completeness / rust-correctness / ci-regression) ran before T14: **all CLEAN, zero BLOCKER/CONCERN/NIT**. It independently re-derived the five-racer set, confirmed guard lifetime / poison-safety / non-reentrancy / const-static validity / child-to-parent visibility, and confirmed zero production behavior change and an intact `ci-matrix-parity` drift-guard.
- Full pre-tag-gate: all 18 steps PASS.

## What this ship deliberately does NOT do

- It does **not** change any production code — the three edited files are all under `#[cfg(test)] mod tests;`.
- It does **not** add a dependency (`serial_test` was considered and rejected).
- It does **not** touch `src-tauri/Cargo.lock` — its `gsd-os` self-version has been stale since v1.49.918 (not bumped by `bump-version.mjs`), is harmless (cargo auto-syncs it per run, never fails on it), and is out of scope for a test-race fix.

## Engine state

NASA degree **1.178** (unchanged — degree-non-advancing maintenance). **Counter-cadence #23** (unchanged — this is a `fix` ship closing a deferred-maintenance wedge, not a counter-cadence cleanup mission). Manifest **151** (unchanged — no new lesson promoted; this applies #10415).
