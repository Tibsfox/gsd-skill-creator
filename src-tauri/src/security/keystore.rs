//! Native OS keystore loading for credential proxy.
//!
//! Phase 369 -- Credential Proxy
//!
//! Platform strategy:
//! - Linux: GNOME Keyring (libsecret) via feature gate, encrypted file fallback
//! - macOS: macOS Keychain via feature gate, encrypted file fallback
//! - Both: ANTHROPIC_API_KEY env var as development convenience (last resort)

use crate::security::proxy::{ProxyError, SecretString};

/// Which keystore backend was used to load a credential.
#[derive(Debug, Clone, PartialEq)]
pub enum KeystoreBackend {
    GnomeKeyring,
    MacosKeychain,
    EncryptedFile(std::path::PathBuf),
    EnvironmentVariable,
}

/// Load API credentials from the best available keystore.
///
/// On Linux: tries GNOME Keyring (libsecret) first, falls back to encrypted file.
/// On macOS: tries Keychain first, falls back to encrypted file.
/// Both: checks ANTHROPIC_API_KEY env var as last development fallback.
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

    // Fallback: encrypted file at ~/.config/gsd-os/credentials.enc
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

    // TODO: decrypt file -- for now read plaintext (Phase 373 adds encryption)
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
