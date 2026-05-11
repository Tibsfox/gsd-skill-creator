//! Native OS keystore loading for credential proxy.
//!
//! Phase 369 — Credential Proxy. Extended at v1.49.650 with the unified
//! `Keystore` API (Path 1 = OS keyring direct; Path 2 = age-encrypted
//! credentials.age file with Argon2id-derived passphrase identity).
//!
//! ## Path selection
//!
//! `Keystore::load()` probes OS keyring availability and commits to the
//! winning path. v1 plaintext detection triggers a `MigrationRequired`
//! error that callers handle via `Keystore::migrate_v1_to_v2()`.
//!
//! ## Legacy plaintext fallback
//!
//! The legacy `~/.config/gsd-os/credentials.enc` (plaintext, despite the
//! .enc extension) is gated behind
//! `#[cfg(any(debug_assertions, feature = "legacy-plaintext-keystore"))]`.
//! Renamed from `insecure-plaintext-keystore` at v1.49.650. The feature
//! emits a `warn!` log when enabled and is scheduled for full removal at
//! v1.49.6XX cluster #3.

use crate::security::encryption::{decrypt_with_passphrase, encrypt_with_passphrase};
use crate::security::keyring_backend::{
    self, os_store, KeyringError, KeyringStore, KEYRING_ACCOUNT_DEFAULT, KEYRING_SERVICE,
};
use crate::security::migration::{self, DiscoveredState, MigrationError};
use crate::security::proxy::{ProxyError, SecretString};
use std::path::{Path, PathBuf};

/// Which keystore backend was used to load a credential.
#[derive(Debug, Clone, PartialEq)]
pub enum KeystoreBackend {
    GnomeKeyring,
    MacosKeychain,
    EncryptedFile(std::path::PathBuf),
    EnvironmentVariable,
    /// Path 1 — OS keyring (cross-platform via `keyring` crate v3).
    OsKeyring,
    /// Path 2 — age-encrypted file under config dir.
    AgeFile(std::path::PathBuf),
}

// ============================================================================
// v1.49.650 — Unified Keystore API (Path 1 + Path 2 + migration)
// ============================================================================

/// Errors from the unified `Keystore` API.
#[derive(Debug, thiserror::Error)]
pub enum KeystoreError {
    /// Path 2 source is locked; caller must supply a passphrase.
    #[error("keystore locked; passphrase required")]
    Locked,
    /// v1 plaintext file detected; caller must run `migrate_v1_to_v2`.
    #[error("v1 plaintext credential file detected; migration required")]
    MigrationRequired,
    /// Neither Path 1 nor Path 2 is usable on this host (keyring unavailable
    /// AND age file absent/un-decryptable).
    #[error("no keystore backend is usable on this host")]
    BackendUnavailable,
    /// Passphrase decryption failed for Path 2.
    #[error("invalid passphrase or tampered ciphertext")]
    InvalidPassphrase,
    /// Ciphertext tampering detected (age MAC failure).
    #[error("keystore content has been tampered")]
    Tampered,
    /// Underlying backend reported a non-recoverable error.
    #[error("keystore backend error: {0}")]
    Backend(String),
    /// IO error while reading or writing a keystore file.
    #[error("keystore io error: {0}")]
    Io(String),
    /// Migration helper surfaced an error.
    #[error("migration error: {0}")]
    Migration(String),
}

impl From<KeyringError> for KeystoreError {
    fn from(e: KeyringError) -> Self {
        match e {
            KeyringError::Unavailable => KeystoreError::BackendUnavailable,
            KeyringError::NotFound => KeystoreError::BackendUnavailable,
            other => KeystoreError::Backend(format!("{:?}", other)),
        }
    }
}

impl From<MigrationError> for KeystoreError {
    fn from(e: MigrationError) -> Self {
        KeystoreError::Migration(format!("{:?}", e))
    }
}

/// Resolve the canonical paths used by the unified keystore.
///
/// - `legacy_plaintext`: `~/.config/gsd-os/credentials.enc` (pre-v1.49.650)
/// - `path2_age`: `~/.config/gsd-os/credentials.age` (v1.49.650+ Path 2)
pub fn keystore_paths() -> Option<(PathBuf, PathBuf)> {
    let config_dir = dirs::config_dir()?;
    let gsd_dir = config_dir.join("gsd-os");
    Some((
        gsd_dir.join("credentials.enc"),
        gsd_dir.join("credentials.age"),
    ))
}

/// The unified keystore handle.
///
/// Constructed via `Keystore::load_with_backend()` which probes OS keyring
/// availability and dispatches to Path 1 or Path 2. The legacy
/// `load_credentials_from_keystore` free function continues to satisfy
/// existing callers in `api/keystore.rs` and is layered on top.
pub struct Keystore {
    backend: Option<KeystoreBackend>,
    secret: Option<SecretString>,
}

impl Keystore {
    /// Empty keystore (no credential loaded).
    pub fn empty() -> Self {
        Self { backend: None, secret: None }
    }

    /// Which backend, if any, holds the credential.
    pub fn backend(&self) -> Option<&KeystoreBackend> {
        self.backend.as_ref()
    }

    /// Whether a credential is currently in-memory.
    pub fn has_secret(&self) -> bool {
        self.secret.is_some()
    }

    /// Probe the on-disk state via the supplied keyring store and path-2 file
    /// location.
    pub fn discover(
        keyring: &dyn KeyringStore,
        path2_age: &Path,
        v1_plaintext: &Path,
    ) -> DiscoveredState {
        migration::discover_state(keyring, path2_age, v1_plaintext)
    }

    /// Load the credential from the appropriate backend.
    ///
    /// - Path 1 (keyring available): returns Self with the loaded secret.
    /// - Path 2 (age file present): requires `passphrase` — returns
    ///   `KeystoreError::Locked` if not provided.
    /// - v1 plaintext detected: returns `KeystoreError::MigrationRequired`.
    /// - Empty: returns Self with `has_secret() == false`.
    pub fn load_with_backend(
        keyring: &dyn KeyringStore,
        path2_age: &Path,
        v1_plaintext: &Path,
        passphrase: Option<&str>,
    ) -> Result<Self, KeystoreError> {
        let state = migration::discover_state(keyring, path2_age, v1_plaintext);
        match state {
            DiscoveredState::V1Plaintext => Err(KeystoreError::MigrationRequired),
            DiscoveredState::Path1 | DiscoveredState::Path1WithPath2Orphan => {
                let secret = keyring.load(KEYRING_ACCOUNT_DEFAULT)?;
                Ok(Self {
                    backend: Some(KeystoreBackend::OsKeyring),
                    secret: Some(secret),
                })
            }
            DiscoveredState::Path2 => {
                let pass = passphrase.ok_or(KeystoreError::Locked)?;
                let ciphertext = std::fs::read(path2_age)
                    .map_err(|e| KeystoreError::Io(e.to_string()))?;
                let plaintext = decrypt_with_passphrase(&ciphertext, pass)
                    .map_err(|_| KeystoreError::InvalidPassphrase)?;
                let s = String::from_utf8(plaintext)
                    .map_err(|_| KeystoreError::Tampered)?;
                Ok(Self {
                    backend: Some(KeystoreBackend::AgeFile(path2_age.to_path_buf())),
                    secret: Some(SecretString::new(s)),
                })
            }
            DiscoveredState::Empty => Ok(Self::empty()),
        }
    }

    /// Save a credential value. Uses the same path the keystore was loaded
    /// from, or commits a new path if currently empty.
    ///
    /// On Path 2, `passphrase` is required.
    pub fn save_with_backend(
        keyring: &dyn KeyringStore,
        path2_age: &Path,
        account: &str,
        value: &str,
        passphrase: Option<&str>,
    ) -> Result<KeystoreBackend, KeystoreError> {
        if keyring.is_available() {
            keyring.store(account, value)?;
            keyring_backend::round_trip_verify_with(keyring, account, value)?;
            Ok(KeystoreBackend::OsKeyring)
        } else {
            let pass = passphrase.ok_or(KeystoreError::Locked)?;
            let bytes = value.as_bytes();
            let ciphertext = encrypt_with_passphrase(bytes, pass)
                .map_err(|_| KeystoreError::Backend("encrypt failed".into()))?;
            if let Some(parent) = path2_age.parent() {
                std::fs::create_dir_all(parent)
                    .map_err(|e| KeystoreError::Io(e.to_string()))?;
            }
            std::fs::write(path2_age, &ciphertext)
                .map_err(|e| KeystoreError::Io(e.to_string()))?;
            Ok(KeystoreBackend::AgeFile(path2_age.to_path_buf()))
        }
    }

    /// Migrate the v1 plaintext file at the supplied path to v2 storage.
    ///
    /// Delegates to `migration::migrate_v1` which preserves the backup-first
    /// invariant. Returns the count of credentials migrated.
    pub fn migrate_v1_to_v2(
        keyring: &dyn KeyringStore,
        v1_plaintext: &Path,
        path2_age: &Path,
        passphrase: Option<&str>,
    ) -> Result<usize, KeystoreError> {
        migration::migrate_v1(keyring, v1_plaintext, path2_age, passphrase).map_err(Into::into)
    }
}

// Production helper — uses the OS keyring + canonical paths.
//
// Returns Some only when both `dirs::config_dir()` resolves and the call
// succeeds; otherwise the caller falls back to the legacy code path.
pub fn keystore_load_production(
    passphrase: Option<&str>,
) -> Result<Keystore, KeystoreError> {
    let (v1, path2) = keystore_paths().ok_or(KeystoreError::BackendUnavailable)?;
    Keystore::load_with_backend(&os_store(), &path2, &v1, passphrase)
}

// ============================================================================
// v1.49.636 C1 — Tauri command surface types + boundary helpers
// ============================================================================

/// On-disk keystore state, reported by `keystore_status` Tauri command.
///
/// TS mirror: `desktop/src/keystore/types.ts::KeystoreState`.
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum KeystoreState {
    Absent,
    Plaintext,
    Encrypted,
}

/// Active keystore backend kind exposed to the desktop UI.
///
/// TS mirror: `desktop/src/keystore/types.ts::KeystoreBackendKind`.
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum KeystoreBackendKind {
    Keyring,
    File,
}

/// Response shape for the `keystore_status` Tauri command.
///
/// TS mirror: `desktop/src/keystore/types.ts::KeystoreStatus`.
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
pub struct KeystoreStatus {
    pub state: KeystoreState,
    pub backend: Option<KeystoreBackendKind>,
}

/// Success payload for the `keystore_migrate_v1_to_v2` Tauri command.
///
/// TS mirror: `desktop/src/keystore/types.ts::MigrationOutcome`.
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
pub struct MigrationOutcome {
    pub migrated_count: usize,
}

/// Stateless probe — reports keystore state without loading any secret.
///
/// Maps the internal `DiscoveredState` to the TS-visible `KeystoreStatus`.
/// Returns `KeystoreState::Absent` if `keystore_paths()` cannot resolve.
pub fn probe_keystore_status() -> KeystoreStatus {
    probe_keystore_status_with(&os_store())
}

/// Test-friendly variant of `probe_keystore_status` accepting an injected
/// `KeyringStore`. Used by unit tests that need to assert backend reporting
/// without depending on the host's real OS keyring availability.
pub fn probe_keystore_status_with(keyring: &dyn KeyringStore) -> KeystoreStatus {
    let (v1, path2) = match keystore_paths() {
        Some(p) => p,
        None => {
            return KeystoreStatus {
                state: KeystoreState::Absent,
                backend: None,
            }
        }
    };
    let state = migration::discover_state(keyring, &path2, &v1);
    match state {
        DiscoveredState::Empty => KeystoreStatus {
            state: KeystoreState::Absent,
            backend: None,
        },
        DiscoveredState::V1Plaintext => KeystoreStatus {
            state: KeystoreState::Plaintext,
            backend: None,
        },
        DiscoveredState::Path1 | DiscoveredState::Path1WithPath2Orphan => KeystoreStatus {
            state: KeystoreState::Encrypted,
            backend: Some(KeystoreBackendKind::Keyring),
        },
        DiscoveredState::Path2 => KeystoreStatus {
            state: KeystoreState::Encrypted,
            backend: Some(KeystoreBackendKind::File),
        },
    }
}

/// Map a `KeystoreError` to a user-visible string for the Tauri boundary.
///
/// The exhaustive match gives compiler-enforced coverage of every variant.
/// Payload fields (`Io(msg)`, `Backend(msg)`, `Migration(msg)`) are
/// construction-controlled to never carry plaintext or key bytes —
/// `Io(...)` comes from `std::io::Error::to_string()`, `Backend(...)` from
/// `format!("{:?}", other)` on keyring crate errors, and `Migration(...)`
/// from `format!("{:?}", e)` on `MigrationError`. None of these constructor
/// sites observe the cleartext credential value.
///
/// Verified by `keystore_error_to_user_string_never_leaks_synthetic_secret`
/// in `src-tauri/src/commands/keystore.rs`.
pub fn keystore_error_to_user_string(e: &KeystoreError) -> String {
    match e {
        KeystoreError::BackendUnavailable => {
            "Keystore backend unavailable".to_string()
        }
        KeystoreError::MigrationRequired => {
            "v1 plaintext credentials detected; migration required".to_string()
        }
        KeystoreError::Locked => {
            "Keystore is encrypted; passphrase required".to_string()
        }
        KeystoreError::InvalidPassphrase => "Invalid passphrase".to_string(),
        KeystoreError::Tampered => {
            "Keystore data appears tampered; refusing to load".to_string()
        }
        KeystoreError::Io(msg) => format!("Keystore I/O error: {}", msg),
        KeystoreError::Migration(msg) => format!("Migration error: {}", msg),
        KeystoreError::Backend(msg) => format!("Keystore backend error: {}", msg),
    }
}

// ============================================================================
// Legacy free-function surface (preserved for api/keystore.rs)
// ============================================================================

/// Load API credentials from the best available keystore.
///
/// **Legacy v1.49.634 surface** — preserved for `src-tauri/src/api/keystore.rs`
/// which has not yet been migrated to the unified `Keystore` API. New
/// callers should use `Keystore::load_with_backend()` or
/// `keystore_load_production()`.
pub fn load_credentials_from_keystore(
    service: &str,
    account: &str,
) -> Result<(SecretString, KeystoreBackend), ProxyError> {
    // Platform-specific primary stores
    #[cfg(target_os = "linux")]
    {
        if let Ok(secret) = load_from_gnome_keyring(service, account) {
            return Ok((secret, KeystoreBackend::GnomeKeyring));
        }
    }
    #[cfg(target_os = "macos")]
    {
        if let Ok(secret) = load_from_macos_keychain(service, account) {
            return Ok((secret, KeystoreBackend::MacosKeychain));
        }
    }

    // Fallback chain: env ANTHROPIC_API_KEY → (release-gated) plaintext
    // credential file. The unified `Keystore::load_with_backend()` API
    // provides the v1.49.650 Path 1 (OS keyring) + Path 2 (age-encrypted
    // file) surfaces; callers wanting those should use the unified API.
    // This legacy free function preserves its v1.49.634 precedence so
    // existing api/keystore.rs consumers see no behavioral change.
    load_from_encrypted_file(service, account)
}

// ============================================================================
// GNOME Keyring (Linux, feature-gated)
// ============================================================================

#[cfg(all(target_os = "linux", feature = "gnome-keyring"))]
fn load_from_gnome_keyring(service: &str, _account: &str) -> Result<SecretString, ProxyError> {
    // When the gnome-keyring feature is enabled, this would use libsecret.
    // For now, return an error to fall through to encrypted file.
    // Full libsecret integration requires the secret-service crate and D-Bus.
    Err(ProxyError::KeystoreError(format!(
        "GNOME Keyring lookup for '{}' not yet wired (feature gate ready)",
        service
    )))
}

#[cfg(not(all(target_os = "linux", feature = "gnome-keyring")))]
fn load_from_gnome_keyring(_service: &str, _account: &str) -> Result<SecretString, ProxyError> {
    Err(ProxyError::KeystoreError(
        "GNOME Keyring not available (feature not enabled)".to_string(),
    ))
}

// ============================================================================
// macOS Keychain (macOS, feature-gated)
// ============================================================================

#[cfg(all(target_os = "macos", feature = "macos-keychain"))]
fn load_from_macos_keychain(service: &str, _account: &str) -> Result<SecretString, ProxyError> {
    // When the macos-keychain feature is enabled, this would use security-framework.
    // For now, return an error to fall through to encrypted file.
    Err(ProxyError::KeystoreError(format!(
        "macOS Keychain lookup for '{}' not yet wired (feature gate ready)",
        service
    )))
}

#[cfg(not(all(target_os = "macos", feature = "macos-keychain")))]
fn load_from_macos_keychain(_service: &str, _account: &str) -> Result<SecretString, ProxyError> {
    Err(ProxyError::KeystoreError(
        "macOS Keychain not available (feature not enabled)".to_string(),
    ))
}

// ============================================================================
// Encrypted file fallback + env var
// ============================================================================

fn load_from_encrypted_file(
    service: &str,
    account: &str,
) -> Result<(SecretString, KeystoreBackend), ProxyError> {
    // Check ANTHROPIC_API_KEY env var as development convenience (last resort)
    if service == "anthropic" || account.contains("api_key") {
        if let Ok(key) = std::env::var("ANTHROPIC_API_KEY") {
            if !key.is_empty() {
                return Ok((
                    SecretString::new(key),
                    KeystoreBackend::EnvironmentVariable,
                ));
            }
        }
    }

    let config_dir = dirs::config_dir().ok_or_else(|| {
        ProxyError::KeystoreError("Cannot find config directory".to_string())
    })?;
    let cred_file = config_dir.join("gsd-os").join("credentials.enc");

    if !cred_file.exists() {
        return Err(ProxyError::KeystoreError(format!(
            "Credential file not found: {}",
            cred_file.display()
        )));
    }

    // v1.49.634 §18 (C3) → v1.49.650 (renamed): the plaintext credential-file
    // fallback is gated out of release builds. In debug builds OR when the
    // developer opts in via `--features legacy-plaintext-keystore`, the legacy
    // path remains available so existing developer setups continue to work.
    // Release builds (cargo build --release without the feature) return a
    // clear error pointing users at the env-var workaround and the unified
    // Keystore::migrate_v1_to_v2 surface.
    //
    // Reachability proof: .planning/keystore-reachability-audit.md
    // Encryption migration: v1.49.650 C1 (encryption.rs +
    //   keyring_backend.rs + migration.rs).
    //
    // Feature rename history:
    //   v1.49.634: insecure-plaintext-keystore (introduced)
    //   v1.49.650: legacy-plaintext-keystore (renamed; deprecation marker)
    //   v1.49.6XX cluster #3: REMOVED entirely
    #[cfg(any(debug_assertions, feature = "legacy-plaintext-keystore"))]
    {
        // Emit a warn-level marker when the feature is enabled (debug builds
        // surface this on the test harness; release-with-feature surfaces it
        // to the operator's stderr).
        #[cfg(feature = "legacy-plaintext-keystore")]
        eprintln!(
            "warn: legacy-plaintext-keystore feature enabled; scheduled for removal at v1.49.6XX cluster #3"
        );

        let content = std::fs::read_to_string(&cred_file)
            .map_err(|e| ProxyError::KeystoreError(e.to_string()))?;
        for line in content.lines() {
            let parts: Vec<&str> = line.splitn(3, ':').collect();
            if parts.len() == 3 && parts[0] == service && parts[1] == account {
                return Ok((
                    SecretString::new(parts[2].to_string()),
                    KeystoreBackend::EncryptedFile(cred_file),
                ));
            }
        }

        Err(ProxyError::KeystoreError(format!(
            "Credential not found for {}/{}",
            service, account
        )))
    }
    #[cfg(not(any(debug_assertions, feature = "legacy-plaintext-keystore")))]
    {
        let _ = cred_file; // silence unused-binding warning when the gate excludes the branch
        Err(ProxyError::KeystoreError(format!(
            "Plaintext credential-file fallback is disabled in release builds for {}/{}. \
             Set the ANTHROPIC_API_KEY environment variable as a workaround, or run \
             `skill-creator keystore migrate` to upgrade to the v1.49.650 encrypted keystore. \
             Tracking: v1.49.650 C1 (see docs/keystore.md).",
            service, account
        )))
    }
}

// Mark unused service-param when both gnome-keyring + macos-keychain features
// are off (the platform stubs return Err immediately).
#[allow(dead_code)]
fn _silence_warnings() {
    let _ = KEYRING_SERVICE;
}
