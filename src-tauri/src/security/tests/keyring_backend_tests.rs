//! v1.49.650 C1 — keyring backend unit tests using `InMemoryKeyring`.
//!
//! Production code uses `OsKeyring` which wraps `keyring::Entry` against
//! the OS daemon. Unit tests use `InMemoryKeyring` (a HashMap behind a
//! Mutex) so they're hermetic — no D-Bus, no Keychain, no Credential
//! Manager required.
//!
//! Integration with the real OS keyring is exercised by the migration
//! tests (which probe `is_available()` before deciding Path 1 vs Path 2),
//! and by end-to-end CLI smoke tests in a future milestone.

use crate::security::keyring_backend::{
    round_trip_verify_with, testing::InMemoryKeyring, KeyringError, KeyringStore,
};

#[test]
fn in_memory_store_is_available() {
    let kr = InMemoryKeyring::new();
    assert!(kr.is_available());
}

#[test]
fn unavailable_keyring_reports_unavailable() {
    let kr = InMemoryKeyring::unavailable();
    assert!(!kr.is_available());
    assert!(matches!(kr.store("a", "v"), Err(KeyringError::Unavailable)));
    assert!(matches!(kr.load("a"), Err(KeyringError::Unavailable)));
    assert!(matches!(kr.delete("a"), Err(KeyringError::Unavailable)));
}

#[test]
fn store_then_load_round_trips() {
    let kr = InMemoryKeyring::new();
    kr.store("test-account", "secret-value").expect("store");
    let loaded = kr.load("test-account").expect("load");
    assert_eq!(loaded.expose(), "secret-value");
}

#[test]
fn load_missing_entry_returns_not_found() {
    let kr = InMemoryKeyring::new();
    assert!(matches!(kr.load("missing"), Err(KeyringError::NotFound)));
}

#[test]
fn delete_removes_entry() {
    let kr = InMemoryKeyring::new();
    kr.store("acct", "v").expect("store");
    kr.delete("acct").expect("delete");
    assert!(matches!(kr.load("acct"), Err(KeyringError::NotFound)));
}

#[test]
fn delete_absent_entry_is_idempotent() {
    let kr = InMemoryKeyring::new();
    kr.delete("never-stored")
        .expect("delete absent is idempotent");
}

#[test]
fn store_overwrites_existing_value() {
    let kr = InMemoryKeyring::new();
    kr.store("acct", "v1").expect("store v1");
    kr.store("acct", "v2").expect("store v2");
    assert_eq!(kr.load("acct").expect("load").expose(), "v2");
}

#[test]
fn round_trip_verify_matches() {
    let kr = InMemoryKeyring::new();
    kr.store("acct", "expected").expect("store");
    round_trip_verify_with(&kr, "acct", "expected").expect("verify match");
}

#[test]
fn round_trip_verify_mismatch_fails() {
    let kr = InMemoryKeyring::new();
    kr.store("acct", "stored").expect("store");
    match round_trip_verify_with(&kr, "acct", "different") {
        Err(KeyringError::ReadFailed) => {}
        other => panic!("expected ReadFailed, got {:?}", other),
    }
}

#[test]
fn round_trip_verify_missing_fails_with_not_found() {
    let kr = InMemoryKeyring::new();
    match round_trip_verify_with(&kr, "missing", "expected") {
        Err(KeyringError::NotFound) => {}
        other => panic!("expected NotFound, got {:?}", other),
    }
}
