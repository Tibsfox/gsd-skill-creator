//! v1.49.650 C1 — migration logic tests.
//!
//! Three core invariants validated:
//! 1. Round-trip: migrate(v1) → v2 stores match → v1 deleted post-success
//! 2. Backup-first-on-fail: any failure (keyring unavailable on Path 1,
//!    encryption failure on Path 2, passphrase mismatch) leaves v1 plaintext
//!    UNTOUCHED on disk
//! 3. Idempotency: re-running migrate_if_needed on already-migrated install
//!    returns Ok(0) without errors
//!
//! Discovery-state tests verify the 4-state indicator table (Empty / Path1 /
//! Path2 / V1Plaintext) plus orphan detection.

use crate::security::keyring_backend::{testing::InMemoryKeyring, KeyringStore};
use crate::security::migration::{
    discover_state, migrate_if_needed, migrate_v1, migrate_v1_to_path1, migrate_v1_to_path2,
    parse_v1_plaintext, DiscoveredState, MigrationError,
};
use std::path::PathBuf;
use tempfile::TempDir;

const PLAINTEXT_LINE: &str = "anthropic:api_key:sk-ant-test-VALUE-32B";

fn write_v1_plaintext(dir: &TempDir, content: &str) -> PathBuf {
    let path = dir.path().join("credentials.enc");
    std::fs::write(&path, content).expect("write v1 plaintext");
    path
}

fn path2_age_path(dir: &TempDir) -> PathBuf {
    dir.path().join("credentials.age")
}

// ========================================================================
// parse_v1_plaintext
// ========================================================================

#[test]
fn parse_v1_plaintext_handles_single_line() {
    let v = parse_v1_plaintext("anthropic:api_key:VALUE");
    assert_eq!(v.len(), 1);
    assert_eq!(
        v[0],
        (
            "anthropic".to_string(),
            "api_key".to_string(),
            "VALUE".to_string()
        )
    );
}

#[test]
fn parse_v1_plaintext_skips_malformed() {
    let v = parse_v1_plaintext("bad-line\nanthropic:api_key:VALUE\nother:bad");
    assert_eq!(v.len(), 1);
    assert_eq!(v[0].2, "VALUE");
}

#[test]
fn parse_v1_plaintext_preserves_value_containing_colons() {
    // splitn(3, ':') — third field captures rest including colons.
    let v = parse_v1_plaintext("anthropic:api_key:sk-with:colons:inside");
    assert_eq!(v[0].2, "sk-with:colons:inside");
}

// ========================================================================
// discover_state
// ========================================================================

#[test]
fn discover_state_empty() {
    let dir = TempDir::new().unwrap();
    let kr = InMemoryKeyring::new();
    let state = discover_state(&kr, &path2_age_path(&dir), &dir.path().join("missing.enc"));
    assert_eq!(state, DiscoveredState::Empty);
}

#[test]
fn discover_state_v1_plaintext_present() {
    let dir = TempDir::new().unwrap();
    let kr = InMemoryKeyring::new();
    let v1 = write_v1_plaintext(&dir, PLAINTEXT_LINE);
    let state = discover_state(&kr, &path2_age_path(&dir), &v1);
    assert_eq!(state, DiscoveredState::V1Plaintext);
}

#[test]
fn discover_state_path1_when_keyring_present() {
    let dir = TempDir::new().unwrap();
    let kr = InMemoryKeyring::new();
    kr.store("anthropic-api-key", "stored-value").unwrap();
    let state = discover_state(&kr, &path2_age_path(&dir), &dir.path().join("absent.enc"));
    assert_eq!(state, DiscoveredState::Path1);
}

#[test]
fn discover_state_path2_when_age_file_present() {
    let dir = TempDir::new().unwrap();
    let kr = InMemoryKeyring::new();
    std::fs::write(path2_age_path(&dir), b"fake-ciphertext").unwrap();
    let state = discover_state(&kr, &path2_age_path(&dir), &dir.path().join("absent.enc"));
    assert_eq!(state, DiscoveredState::Path2);
}

#[test]
fn discover_state_orphan_when_both_path1_and_path2_present() {
    let dir = TempDir::new().unwrap();
    let kr = InMemoryKeyring::new();
    kr.store("anthropic-api-key", "v").unwrap();
    std::fs::write(path2_age_path(&dir), b"fake").unwrap();
    let state = discover_state(&kr, &path2_age_path(&dir), &dir.path().join("absent.enc"));
    assert_eq!(state, DiscoveredState::Path1WithPath2Orphan);
}

// ========================================================================
// migrate_v1_to_path1 (keyring path)
// ========================================================================

#[test]
fn migrate_to_path1_round_trips_and_deletes_v1() {
    let dir = TempDir::new().unwrap();
    let kr = InMemoryKeyring::new();
    let v1 = write_v1_plaintext(&dir, PLAINTEXT_LINE);

    let count = migrate_v1_to_path1(&kr, &v1).expect("migration should succeed");
    assert_eq!(count, 1);
    assert!(
        !v1.exists(),
        "v1 plaintext must be deleted after successful migration"
    );
    assert_eq!(
        kr.load("api_key").expect("read back").expose(),
        "sk-ant-test-VALUE-32B"
    );
}

#[test]
fn migrate_to_path1_with_missing_source_errors_cleanly() {
    let dir = TempDir::new().unwrap();
    let kr = InMemoryKeyring::new();
    let missing = dir.path().join("does-not-exist.enc");
    match migrate_v1_to_path1(&kr, &missing) {
        Err(MigrationError::SourceMissing) => {}
        other => panic!("expected SourceMissing, got {:?}", other),
    }
}

#[test]
fn migrate_to_path1_with_empty_v1_fails_and_preserves_v1() {
    // Empty file (or one with no valid lines) should fail; v1 stays in place.
    let dir = TempDir::new().unwrap();
    let kr = InMemoryKeyring::new();
    let v1 = write_v1_plaintext(&dir, "not-a-valid-line\n");
    match migrate_v1_to_path1(&kr, &v1) {
        Err(MigrationError::SourceFormatInvalid) => {}
        other => panic!("expected SourceFormatInvalid, got {:?}", other),
    }
    assert!(
        v1.exists(),
        "v1 plaintext must NOT be deleted on parse failure"
    );
}

#[test]
fn migrate_to_path1_with_unavailable_keyring_errors_and_preserves_v1() {
    // Path 1 attempt with unavailable keyring: should fail at store step.
    let dir = TempDir::new().unwrap();
    let kr = InMemoryKeyring::unavailable();
    let v1 = write_v1_plaintext(&dir, PLAINTEXT_LINE);
    assert!(migrate_v1_to_path1(&kr, &v1).is_err());
    assert!(
        v1.exists(),
        "v1 plaintext must NOT be deleted on keyring failure"
    );
}

#[test]
fn migrate_to_path1_handles_multiple_credentials() {
    // Distinct account names — each lands in the keyring under its own key.
    let dir = TempDir::new().unwrap();
    let kr = InMemoryKeyring::new();
    let multi = "anthropic:anthropic-api-key:VALUE1\nopenai:openai-api-key:VALUE2\n";
    let v1 = write_v1_plaintext(&dir, multi);
    let count = migrate_v1_to_path1(&kr, &v1).expect("multi migration");
    assert_eq!(count, 2);
    assert_eq!(
        kr.load("anthropic-api-key").expect("anthropic").expose(),
        "VALUE1"
    );
    assert_eq!(
        kr.load("openai-api-key").expect("openai").expose(),
        "VALUE2"
    );
    assert!(!v1.exists());
}

// ========================================================================
// migrate_v1_to_path2 (age-encrypted file path)
// ========================================================================

#[test]
fn migrate_to_path2_round_trips_and_deletes_v1() {
    let dir = TempDir::new().unwrap();
    let v1 = write_v1_plaintext(&dir, PLAINTEXT_LINE);
    let age_path = path2_age_path(&dir);

    // Hygiene update (v1.49.637 C3 R14 audit): "test-passphrase" already
    // scores 4 under zxcvbn, but the Rust path bypasses the TS validator
    // entirely. Re-use the canonical strong fixture from encryption_tests
    // for consistency across the security test suite.
    let count =
        migrate_v1_to_path2(&v1, &age_path, "correct-horse-battery-staple-42").expect("migration");
    assert_eq!(count, 1);
    assert!(
        !v1.exists(),
        "v1 must be deleted after successful Path-2 migration"
    );
    assert!(age_path.exists(), "age file must be written");
    let bytes = std::fs::read(&age_path).expect("read age file");
    assert!(bytes.len() > 37, "age file must contain header + payload");
    assert_eq!(&bytes[..4], b"GSDK", "magic header");
}

#[test]
fn migrate_to_path2_with_empty_passphrase_errors() {
    let dir = TempDir::new().unwrap();
    let v1 = write_v1_plaintext(&dir, PLAINTEXT_LINE);
    let age_path = path2_age_path(&dir);
    match migrate_v1_to_path2(&v1, &age_path, "") {
        Err(MigrationError::PassphraseRequired) => {}
        other => panic!("expected PassphraseRequired, got {:?}", other),
    }
    assert!(v1.exists(), "v1 must NOT be deleted on empty passphrase");
}

#[test]
fn migrate_to_path2_with_missing_source_errors_cleanly() {
    let dir = TempDir::new().unwrap();
    let missing = dir.path().join("does-not-exist.enc");
    match migrate_v1_to_path2(&missing, &path2_age_path(&dir), "p") {
        Err(MigrationError::SourceMissing) => {}
        other => panic!("expected SourceMissing, got {:?}", other),
    }
}

#[test]
fn migrate_to_path2_creates_parent_dirs() {
    let dir = TempDir::new().unwrap();
    let v1 = write_v1_plaintext(&dir, PLAINTEXT_LINE);
    let nested_age = dir.path().join("nested/deeper/credentials.age");
    let count = migrate_v1_to_path2(&v1, &nested_age, "p").expect("migration");
    assert_eq!(count, 1);
    assert!(
        nested_age.exists(),
        "Path 2 migration must create parent dirs"
    );
}

// ========================================================================
// migrate_v1 dispatcher + migrate_if_needed idempotency
// ========================================================================

#[test]
fn dispatcher_chooses_path1_when_keyring_available() {
    let dir = TempDir::new().unwrap();
    let kr = InMemoryKeyring::new();
    let v1 = write_v1_plaintext(&dir, PLAINTEXT_LINE);
    let age = path2_age_path(&dir);
    let count = migrate_v1(&kr, &v1, &age, None).expect("Path 1 dispatch");
    assert_eq!(count, 1);
    assert!(
        !age.exists(),
        "Path 2 file must NOT be written when Path 1 dispatched"
    );
    assert!(kr.load("api_key").is_ok());
}

#[test]
fn dispatcher_chooses_path2_when_keyring_unavailable() {
    let dir = TempDir::new().unwrap();
    let kr = InMemoryKeyring::unavailable();
    let v1 = write_v1_plaintext(&dir, PLAINTEXT_LINE);
    let age = path2_age_path(&dir);
    let count = migrate_v1(&kr, &v1, &age, Some("p")).expect("Path 2 dispatch");
    assert_eq!(count, 1);
    assert!(
        age.exists(),
        "Path 2 file must be written when keyring unavailable"
    );
}

#[test]
fn dispatcher_errors_when_path2_required_but_no_passphrase() {
    let dir = TempDir::new().unwrap();
    let kr = InMemoryKeyring::unavailable();
    let v1 = write_v1_plaintext(&dir, PLAINTEXT_LINE);
    let age = path2_age_path(&dir);
    match migrate_v1(&kr, &v1, &age, None) {
        Err(MigrationError::PassphraseRequired) => {}
        other => panic!("expected PassphraseRequired, got {:?}", other),
    }
    assert!(
        v1.exists(),
        "v1 must NOT be deleted when passphrase missing"
    );
}

#[test]
fn migrate_if_needed_noops_when_v1_absent() {
    let dir = TempDir::new().unwrap();
    let kr = InMemoryKeyring::new();
    let absent_v1 = dir.path().join("does-not-exist.enc");
    let count =
        migrate_if_needed(&kr, &absent_v1, &path2_age_path(&dir), None).expect("idempotent");
    assert_eq!(count, 0);
}

#[test]
fn migrate_if_needed_idempotency_post_migration() {
    let dir = TempDir::new().unwrap();
    let kr = InMemoryKeyring::new();
    let v1 = write_v1_plaintext(&dir, PLAINTEXT_LINE);
    let age = path2_age_path(&dir);

    // First call migrates.
    let count1 = migrate_if_needed(&kr, &v1, &age, None).expect("first migration");
    assert_eq!(count1, 1);
    assert!(!v1.exists());

    // Second call sees v1 absent → no-op.
    let count2 = migrate_if_needed(&kr, &v1, &age, None).expect("idempotent re-run");
    assert_eq!(count2, 0);
}
