//! v1 → v2 keystore migration with backup-first pattern.
//!
//! On launch, the keystore probes the on-disk state. If a v1 plaintext
//! credentials file is detected (legacy format from before v1.49.650), the
//! migration logic runs:
//!
//! 1. Read v1 plaintext file into memory.
//! 2. Probe keyring availability via `KeyringStore::is_available()`.
//! 3. Path 1 (keyring available): `store(account, secret)` → `load(account)`
//!    → assert byte-equal. Path 2 (keyring unavailable): derive Argon2id
//!    key from user passphrase → age-encrypt → write `credentials.age` →
//!    re-decrypt → assert byte-equal.
//! 4. ONLY AFTER step 3 succeeds: delete v1 plaintext file.
//! 5. Idempotent re-runs no-op when v1 file is absent + v2 source present.
//!
//! Critical invariant (R1 mitigation): v1 plaintext is NEVER deleted before
//! v2 round-trip verifies. Any failure in steps 2-3 leaves v1 untouched and
//! the user can retry without data loss.

use crate::security::encryption::{decrypt_with_passphrase, encrypt_with_passphrase};
use crate::security::keyring_backend::{
    round_trip_verify_with, KeyringError, KeyringStore, KEYRING_ACCOUNT_DEFAULT,
};
use std::path::Path;

/// Errors during migration.
#[derive(Debug, thiserror::Error)]
pub enum MigrationError {
    #[error("v1 plaintext file not found at expected path")]
    SourceMissing,
    #[error("v1 plaintext file format unrecognised")]
    SourceFormatInvalid,
    #[error("keyring backend error during migration")]
    KeyringFailed(#[from] KeyringError),
    #[error("encryption error during migration")]
    EncryptionFailed,
    #[error("io error during migration")]
    Io(#[from] std::io::Error),
    #[error("v2 round-trip verification failed; v1 plaintext NOT deleted")]
    VerifyFailed,
    #[error("invalid migration target — caller did not supply required passphrase for Path 2")]
    PassphraseRequired,
}

/// Discovered on-disk state for migration probe.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DiscoveredState {
    /// No keyring entry, no `credentials.age`, no v1 plaintext file.
    Empty,
    /// OS keyring entry present (Path 1 active).
    Path1,
    /// `credentials.age` file present (Path 2 active).
    Path2,
    /// v1 plaintext `credentials.enc` file present (legacy — migration target).
    V1Plaintext,
    /// Both keyring entry AND credentials.age present (orphan). Path 1 wins
    /// at probe time; the orphan Path-2 file is reported separately.
    Path1WithPath2Orphan,
}

/// Detect the current on-disk keystore state across all four possible
/// indicators. Priority: Path 1 > Path 2 > V1 plaintext > Empty.
///
/// The orphan combination is reported explicitly so the caller can surface
/// a `keystore status` note suggesting the operator clean up the orphan
/// Path-2 file.
pub fn discover_state(
    keyring: &dyn KeyringStore,
    path2_age_file: &Path,
    v1_plaintext_file: &Path,
) -> DiscoveredState {
    let has_keyring_entry = keyring.load(KEYRING_ACCOUNT_DEFAULT).is_ok();
    let has_age_file = path2_age_file.exists();
    let has_v1 = v1_plaintext_file.exists();

    match (has_keyring_entry, has_age_file, has_v1) {
        (true, true, _) => DiscoveredState::Path1WithPath2Orphan,
        (true, false, _) => DiscoveredState::Path1,
        (false, true, _) => DiscoveredState::Path2,
        (false, false, true) => DiscoveredState::V1Plaintext,
        (false, false, false) => DiscoveredState::Empty,
    }
}

/// Parse a v1 plaintext credential file into (service, account, value)
/// tuples. Each line is `<service>:<account>:<value>`.
///
/// Returns `Vec<(String, String, String)>`. Lines that don't match the
/// 3-colon format are silently skipped. Empty result means the file is
/// effectively empty.
pub fn parse_v1_plaintext(content: &str) -> Vec<(String, String, String)> {
    content
        .lines()
        .filter_map(|line| {
            let parts: Vec<&str> = line.splitn(3, ':').collect();
            if parts.len() == 3 {
                Some((
                    parts[0].to_string(),
                    parts[1].to_string(),
                    parts[2].to_string(),
                ))
            } else {
                None
            }
        })
        .collect()
}

/// Migrate v1 plaintext → Path 1 keyring with backup-first pattern.
///
/// Steps:
/// 1. Parse v1 plaintext file into (service, account, value) tuples.
/// 2. For each tuple, store the value in the keyring under `account`.
/// 3. For each tuple, verify the keyring round-trips byte-equal.
/// 4. ONLY AFTER all writes verify, delete the v1 plaintext file.
///
/// Returns the number of credentials migrated on success.
pub fn migrate_v1_to_path1(
    keyring: &dyn KeyringStore,
    v1_plaintext_file: &Path,
) -> Result<usize, MigrationError> {
    if !v1_plaintext_file.exists() {
        return Err(MigrationError::SourceMissing);
    }
    let content = std::fs::read_to_string(v1_plaintext_file)?;
    let entries = parse_v1_plaintext(&content);
    if entries.is_empty() {
        return Err(MigrationError::SourceFormatInvalid);
    }

    // Step 2: write all to keyring.
    for (_service, account, value) in &entries {
        keyring.store(account, value)?;
    }
    // Step 3: verify all round-trips before any deletion.
    for (_service, account, value) in &entries {
        if let Err(_e) = round_trip_verify_with(keyring, account, value) {
            return Err(MigrationError::VerifyFailed);
        }
    }
    // Step 4: ONLY now, delete v1 plaintext (success).
    std::fs::remove_file(v1_plaintext_file)?;
    Ok(entries.len())
}

/// Migrate v1 plaintext → Path 2 age-encrypted file with backup-first pattern.
///
/// Steps:
/// 1. Read v1 plaintext file contents.
/// 2. Encrypt the entire file content under the passphrase.
/// 3. Write encrypted bytes to `path2_age_file`.
/// 4. Re-decrypt + assert byte-equal to v1 content.
/// 5. ONLY AFTER step 4 succeeds, delete v1 plaintext file.
///
/// Critical invariant: if any step fails, v1 plaintext is left in place.
/// The encrypted file may be left on disk; the next migration attempt will
/// overwrite it.
pub fn migrate_v1_to_path2(
    v1_plaintext_file: &Path,
    path2_age_file: &Path,
    passphrase: &str,
) -> Result<usize, MigrationError> {
    if !v1_plaintext_file.exists() {
        return Err(MigrationError::SourceMissing);
    }
    if passphrase.is_empty() {
        return Err(MigrationError::PassphraseRequired);
    }
    let content = std::fs::read(v1_plaintext_file)?;

    let encrypted = encrypt_with_passphrase(&content, passphrase)
        .map_err(|_| MigrationError::EncryptionFailed)?;

    // Ensure parent dir exists.
    if let Some(parent) = path2_age_file.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(path2_age_file, &encrypted)?;

    // Verify round-trip.
    let decrypted = decrypt_with_passphrase(&encrypted, passphrase)
        .map_err(|_| MigrationError::EncryptionFailed)?;
    if decrypted != content {
        return Err(MigrationError::VerifyFailed);
    }

    // Step 5: ONLY now, delete v1 plaintext.
    std::fs::remove_file(v1_plaintext_file)?;

    // Return count of credential lines parsed (informational).
    let s = std::str::from_utf8(&content).unwrap_or("");
    Ok(parse_v1_plaintext(s).len())
}

/// Top-level dispatcher: detect state, choose Path 1 or Path 2 based on
/// keyring availability, run migration.
///
/// `passphrase` is required for Path 2; pass `None` only when callers have
/// already confirmed the keyring is available (or when probing first via
/// `discover_state`).
pub fn migrate_v1(
    keyring: &dyn KeyringStore,
    v1_plaintext_file: &Path,
    path2_age_file: &Path,
    passphrase: Option<&str>,
) -> Result<usize, MigrationError> {
    if keyring.is_available() {
        migrate_v1_to_path1(keyring, v1_plaintext_file)
    } else {
        match passphrase {
            Some(p) => migrate_v1_to_path2(v1_plaintext_file, path2_age_file, p),
            None => Err(MigrationError::PassphraseRequired),
        }
    }
}

/// Idempotent migration check: if v1 plaintext is absent, treat as already
/// migrated and return `Ok(0)`. Otherwise dispatch to `migrate_v1`.
pub fn migrate_if_needed(
    keyring: &dyn KeyringStore,
    v1_plaintext_file: &Path,
    path2_age_file: &Path,
    passphrase: Option<&str>,
) -> Result<usize, MigrationError> {
    if !v1_plaintext_file.exists() {
        return Ok(0);
    }
    migrate_v1(keyring, v1_plaintext_file, path2_age_file, passphrase)
}
