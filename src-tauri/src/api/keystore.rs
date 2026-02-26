//! API-specific KeyStore wrapping security::keystore with credential loading.
//!
//! Phase 376 -- API Client
//!
//! Security invariants:
//! - get_key() is pub(crate) -- key material never leaves the Rust process
//! - Debug output never prints the key value
//! - Error messages never contain key material

use crate::security::keystore::{load_credentials_from_keystore, KeystoreBackend};
use crate::security::proxy::SecretString;

/// Errors from the API keystore.
#[derive(Debug, thiserror::Error)]
pub enum KeyStoreError {
    #[error("No API key found. Set ANTHROPIC_API_KEY env var, store in OS keychain, or place in ~/.config/gsd-os/credentials.enc")]
    NotFound,
    #[error("Keystore error: {0}")]
    Internal(String),
}

/// API credential store wrapping the platform keystore.
///
/// Loads the API key from environment, OS keychain, or encrypted file.
/// The key is stored as a SecretString that zeroes memory on drop.
pub struct KeyStore {
    secret: Option<SecretString>,
    backend: Option<KeystoreBackend>,
}

impl KeyStore {
    /// Load the API key from the best available source.
    ///
    /// Priority: env ANTHROPIC_API_KEY -> OS keychain -> encrypted file
    pub fn load() -> Result<Self, KeyStoreError> {
        match load_credentials_from_keystore("anthropic", "api_key") {
            Ok((secret, backend)) => Ok(Self {
                secret: Some(secret),
                backend: Some(backend),
            }),
            Err(_) => Err(KeyStoreError::NotFound),
        }
    }

    /// Create an empty KeyStore with no key loaded.
    ///
    /// Used for the "needs_key" flow when no credential is available.
    pub fn empty() -> Self {
        Self {
            secret: None,
            backend: None,
        }
    }

    /// Whether an API key is currently loaded.
    pub fn has_key(&self) -> bool {
        self.secret.is_some()
    }

    /// Access the raw API key value. Restricted to this crate.
    ///
    /// SECURITY: Key material stays within the Rust process boundary.
    pub(crate) fn get_key(&self) -> Result<&str, KeyStoreError> {
        self.secret
            .as_ref()
            .map(|s| s.expose())
            .ok_or(KeyStoreError::NotFound)
    }

    /// Store a new API key (sets env var as fallback for this session).
    pub fn store_key(key: String) -> Result<Self, KeyStoreError> {
        // For now, store as env var fallback (future: write to encrypted file)
        unsafe { std::env::set_var("ANTHROPIC_API_KEY", &key); }
        Ok(Self {
            secret: Some(SecretString::new(key)),
            backend: Some(KeystoreBackend::EnvironmentVariable),
        })
    }
}

// Debug must NEVER print key
impl std::fmt::Debug for KeyStore {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "KeyStore {{ has_key: {}, backend: {:?} }}",
            self.has_key(),
            self.backend
        )
    }
}
