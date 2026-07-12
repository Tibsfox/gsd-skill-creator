//! OS keyring backend (Path 1 — preferred).
//!
//! Wraps the `keyring` crate v3 with platform features enabled at the
//! workspace level (Linux: sync-secret-service over D-Bus; macOS:
//! apple-native; Windows: windows-native). When the OS keyring is
//! available, the API credential is stored DIRECTLY in the keyring under:
//!
//! - Service: `gsd-skill-creator`
//! - Account: `anthropic-api-key`
//!
//! No encrypted file is written; no passphrase is prompted; no Argon2id
//! derivation runs. Matches `gh auth` / `cargo login` / `kubectl config`
//! precedent.
//!
//! ## Testability
//!
//! Production callers use [`os_store`] (a singleton wrapping `keyring::Entry`).
//! Tests construct an [`InMemoryKeyring`] which implements the same
//! [`KeyringStore`] trait against an in-memory HashMap. The keyring-crate
//! mock backend was rejected because its `CredentialPersistence::EntryOnly`
//! semantic means a fresh `Entry::new(...)` always returns empty state —
//! which is fine against a real OS keyring (state lives in the OS) but
//! defeats `set → load` testing.

use crate::security::proxy::SecretString;

pub const KEYRING_SERVICE: &str = "gsd-skill-creator";
pub const KEYRING_ACCOUNT_DEFAULT: &str = "anthropic-api-key";

/// Errors from the keyring backend.
#[derive(Debug, thiserror::Error)]
pub enum KeyringError {
    /// The OS keyring is unavailable on this host (no D-Bus secret service
    /// on Linux, locked keychain on macOS, etc.). Callers should fall back
    /// to Path 2.
    #[error("OS keyring unavailable")]
    Unavailable,
    /// The entry exists but the stored secret could not be retrieved.
    #[error("keyring read failed")]
    ReadFailed,
    /// Writing the secret to the keyring failed.
    #[error("keyring write failed")]
    WriteFailed,
    /// Deleting the entry from the keyring failed.
    #[error("keyring delete failed")]
    DeleteFailed,
    /// The requested entry was not found.
    #[error("keyring entry not found")]
    NotFound,
}

/// Trait abstraction over a keyring store; production uses the OS
/// secure-storage daemon, tests use an in-memory HashMap.
pub trait KeyringStore: Send + Sync {
    fn is_available(&self) -> bool;
    fn store(&self, account: &str, secret: &str) -> Result<(), KeyringError>;
    fn load(&self, account: &str) -> Result<SecretString, KeyringError>;
    fn delete(&self, account: &str) -> Result<(), KeyringError>;
}

/// Generic round-trip verifier: load + assert byte-equal.
///
/// Used by migration logic to confirm a Path 1 write succeeded before
/// deleting the v1 plaintext file (R1 mitigation).
pub fn round_trip_verify_with(
    store: &dyn KeyringStore,
    account: &str,
    expected: &str,
) -> Result<(), KeyringError> {
    let loaded = store.load(account)?;
    if loaded.expose() != expected {
        return Err(KeyringError::ReadFailed);
    }
    Ok(())
}

// ============================================================================
// Production implementation — wraps keyring::Entry
// ============================================================================

/// Production backend that wraps `keyring::Entry` against the OS
/// secure-storage daemon.
pub struct OsKeyring;

impl KeyringStore for OsKeyring {
    fn is_available(&self) -> bool {
        keyring::Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT_DEFAULT).is_ok()
    }

    fn store(&self, account: &str, secret: &str) -> Result<(), KeyringError> {
        let entry =
            keyring::Entry::new(KEYRING_SERVICE, account).map_err(|_| KeyringError::Unavailable)?;
        entry
            .set_password(secret)
            .map_err(|_| KeyringError::WriteFailed)
    }

    fn load(&self, account: &str) -> Result<SecretString, KeyringError> {
        let entry =
            keyring::Entry::new(KEYRING_SERVICE, account).map_err(|_| KeyringError::Unavailable)?;
        match entry.get_password() {
            Ok(value) => Ok(SecretString::new(value)),
            Err(keyring::Error::NoEntry) => Err(KeyringError::NotFound),
            Err(_) => Err(KeyringError::ReadFailed),
        }
    }

    fn delete(&self, account: &str) -> Result<(), KeyringError> {
        let entry =
            keyring::Entry::new(KEYRING_SERVICE, account).map_err(|_| KeyringError::Unavailable)?;
        match entry.delete_credential() {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()),
            Err(_) => Err(KeyringError::DeleteFailed),
        }
    }
}

/// Production singleton.
pub fn os_store() -> OsKeyring {
    OsKeyring
}

// ============================================================================
// In-memory test backend
// ============================================================================

#[cfg(test)]
pub mod testing {
    use super::*;
    use std::collections::HashMap;
    use std::sync::Mutex;

    /// In-memory keyring store for unit tests. Behaves like a real keyring
    /// for the operations we care about (store/load/delete idempotency).
    /// Optionally configurable to simulate keyring-unavailable hosts.
    pub struct InMemoryKeyring {
        store: Mutex<HashMap<String, String>>,
        available: bool,
    }

    impl InMemoryKeyring {
        pub fn new() -> Self {
            Self {
                store: Mutex::new(HashMap::new()),
                available: true,
            }
        }

        /// Simulate an unavailable keyring backend (returns `Unavailable`
        /// from every method that probes the OS).
        pub fn unavailable() -> Self {
            Self {
                store: Mutex::new(HashMap::new()),
                available: false,
            }
        }
    }

    impl Default for InMemoryKeyring {
        fn default() -> Self {
            Self::new()
        }
    }

    impl KeyringStore for InMemoryKeyring {
        fn is_available(&self) -> bool {
            self.available
        }

        fn store(&self, account: &str, secret: &str) -> Result<(), KeyringError> {
            if !self.available {
                return Err(KeyringError::Unavailable);
            }
            self.store
                .lock()
                .unwrap()
                .insert(account.to_string(), secret.to_string());
            Ok(())
        }

        fn load(&self, account: &str) -> Result<SecretString, KeyringError> {
            if !self.available {
                return Err(KeyringError::Unavailable);
            }
            match self.store.lock().unwrap().get(account) {
                Some(v) => Ok(SecretString::new(v.clone())),
                None => Err(KeyringError::NotFound),
            }
        }

        fn delete(&self, account: &str) -> Result<(), KeyringError> {
            if !self.available {
                return Err(KeyringError::Unavailable);
            }
            self.store.lock().unwrap().remove(account);
            Ok(())
        }
    }
}
