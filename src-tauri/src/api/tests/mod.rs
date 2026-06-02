mod streaming_tests;
mod keystore_tests;
mod client_tests;
mod retry_tests;
mod history_tests;
mod resilience_tests;

use std::sync::{Mutex, MutexGuard};

/// Serializes tests that mutate the process-global `ANTHROPIC_API_KEY` env var.
///
/// `cargo test` runs tests in parallel by default, so a test that SETS the var
/// (`keystore_tests::load_from_env_var`, `keystore_tests::key_never_in_debug_output`,
/// `client_tests::client_default_model`, `client_tests::client_default_max_tokens`)
/// races a sibling that expects it ABSENT (`keystore_tests::no_key_found`), and
/// vice versa -- producing intermittent cargo-lane failures. Acquire this lock at
/// the top of every env-mutating test and hold the returned guard for the whole
/// body; env access then becomes mutually exclusive across both test modules.
static ANTHROPIC_ENV_LOCK: Mutex<()> = Mutex::new(());

/// Acquire the shared `ANTHROPIC_API_KEY` env lock for the duration of a test.
///
/// Poison-tolerant: if a prior test panicked while holding the guard the mutex
/// is poisoned, but each env-mutating test re-establishes its own precondition
/// (set or remove) at the top, so recovering the guard is safe and prevents one
/// failing test from cascade-failing the rest.
fn lock_anthropic_env() -> MutexGuard<'static, ()> {
    ANTHROPIC_ENV_LOCK
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}
