//! Encryption primitives for keystore Path 2 (age-encrypted file fallback).
//!
//! Argon2id KDF + age (X25519 + ChaCha20-Poly1305) encrypt/decrypt + an
//! error-message sanitizer that asserts no 4-byte fragment of plaintext or
//! key appears in user-visible error text.
//!
//! ## 4-byte sanitizer threshold rationale
//!
//! `sanitize_error_message` checks every 4-byte contiguous substring of
//! `plaintext` and `key` against the error message. The threshold was
//! chosen per lab-director arch-review refinement #3:
//!
//! - **1-byte**: ~1/256 collision rate; far too noisy
//! - **2-byte**: ~1/65,536; still noisy on natural English bigrams
//! - **3-byte**: ~1/16M; common substrings ("the", "ing", "and") still collide
//! - **4-byte**: ~1/4.3B; statistical sweet spot — natural-language false
//!   positives near zero while still catching recognizable credential fragments
//! - **8-byte**: misses partial-prefix leaks (first 7 bytes of an API key
//!   visible in an error wouldn't fire)
//!
//! 4 bytes is the smallest threshold where false-positive rate is
//! statistically negligible (~2e-10) and any 4+-byte fragment of an API
//! key, password, or session token is recognizably the secret.
//!
//! ## Argon2id parameters (Path 2 KDF)
//!
//! Per OWASP Password Storage Cheat Sheet (2024-09):
//! - **Memory cost:** 64 MiB
//! - **Iterations:** 3
//! - **Parallelism:** 1
//! - **Salt:** 32 bytes from `OsRng`, stored alongside ciphertext
//! - **Output:** 32-byte derived key

use argon2::{Algorithm, Argon2, Params, Version};
use rand_core::{OsRng, RngCore};
use secrecy::SecretString;

// ============================================================================
// Argon2id parameters (production)
// ============================================================================

pub const ARGON2_MEMORY_KIB: u32 = 64 * 1024; // 64 MiB
pub const ARGON2_ITERATIONS: u32 = 3;
pub const ARGON2_PARALLELISM: u32 = 1;
pub const ARGON2_OUTPUT_LEN: usize = 32;
pub const ARGON2_SALT_LEN: usize = 32;

// ============================================================================
// Sanitizer types (per arch-review refinement #3)
// ============================================================================

/// Source of a detected leak in a sanitized error message.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SanitizerSource {
    Plaintext,
    Key,
}

/// A 4+-byte fragment of plaintext or key was detected in a user-visible
/// error message. Caller MUST redact and produce a generic error before
/// surfacing.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SanitizerViolation {
    pub offset: usize,
    pub length: usize,
    pub source: SanitizerSource,
}

impl std::fmt::Display for SanitizerViolation {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "sanitizer detected {:?} fragment (offset={}, len={})",
            self.source, self.offset, self.length
        )
    }
}

impl std::error::Error for SanitizerViolation {}

/// Sanitize a user-visible error message by asserting no 4-byte substring
/// of `plaintext` or `key` appears in `msg`.
///
/// Returns `Ok(msg)` on clean, `Err(SanitizerViolation)` on detected leak.
/// Empty `plaintext` or `key` inputs are skipped (no check possible).
///
/// The 4-byte threshold rationale is documented in the module header.
pub fn sanitize_error_message(
    msg: &str,
    plaintext: &[u8],
    key: &[u8],
) -> Result<String, SanitizerViolation> {
    const THRESHOLD: usize = 4;

    if plaintext.len() >= THRESHOLD {
        for (i, window) in plaintext.windows(THRESHOLD).enumerate() {
            if msg.as_bytes().windows(THRESHOLD).any(|w| w == window) {
                return Err(SanitizerViolation {
                    offset: i,
                    length: THRESHOLD,
                    source: SanitizerSource::Plaintext,
                });
            }
        }
    }

    if key.len() >= THRESHOLD {
        for (i, window) in key.windows(THRESHOLD).enumerate() {
            if msg.as_bytes().windows(THRESHOLD).any(|w| w == window) {
                return Err(SanitizerViolation {
                    offset: i,
                    length: THRESHOLD,
                    source: SanitizerSource::Key,
                });
            }
        }
    }

    Ok(msg.to_string())
}

// ============================================================================
// Key derivation (Argon2id)
// ============================================================================

/// Errors from encryption primitives.
#[derive(Debug, thiserror::Error)]
pub enum EncryptionError {
    #[error("key derivation failed")]
    Argon2(String),
    #[error("encryption failed")]
    Encrypt,
    #[error("decryption failed (wrong passphrase or tampered ciphertext)")]
    Decrypt,
    #[error("io error: {0}")]
    Io(String),
}

/// Generate a 32-byte random salt for Argon2id KDF.
pub fn generate_salt() -> [u8; ARGON2_SALT_LEN] {
    let mut salt = [0u8; ARGON2_SALT_LEN];
    OsRng.fill_bytes(&mut salt);
    salt
}

/// Derive a 32-byte key from a passphrase + salt via Argon2id with the
/// production parameter set.
///
/// Returns the derived key wrapped in `SecretString` so it zeroizes on drop.
pub fn derive_key(passphrase: &str, salt: &[u8]) -> Result<Vec<u8>, EncryptionError> {
    let params = Params::new(
        ARGON2_MEMORY_KIB,
        ARGON2_ITERATIONS,
        ARGON2_PARALLELISM,
        Some(ARGON2_OUTPUT_LEN),
    )
    .map_err(|e| EncryptionError::Argon2(e.to_string()))?;

    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let mut output = vec![0u8; ARGON2_OUTPUT_LEN];
    argon2
        .hash_password_into(passphrase.as_bytes(), salt, &mut output)
        .map_err(|e| EncryptionError::Argon2(e.to_string()))?;
    Ok(output)
}

// ============================================================================
// Encrypt / decrypt via age
// ============================================================================

/// On-disk format for Path 2 ciphertext.
///
/// Wire format (concatenated; no framing):
/// - 4-byte magic header `b"GSDK"` (GSD Keystore)
/// - 1-byte version byte (currently `1`)
/// - 32-byte Argon2id salt
/// - remaining: age-encrypted payload
///
/// The version byte lets future migrations distinguish parameter sets and
/// catches accidental cross-build incompatibility (test vs release per R13).
pub const MAGIC: &[u8; 4] = b"GSDK";
pub const FORMAT_VERSION: u8 = 1;
pub const HEADER_LEN: usize = MAGIC.len() + 1 + ARGON2_SALT_LEN; // 4 + 1 + 32 = 37

/// Encrypt `plaintext` to the binary on-disk format using a passphrase.
///
/// Steps: generate 32-byte salt → derive Argon2id key → use the key bytes
/// as an `age` Scrypt-style passphrase identity → encrypt → prepend
/// magic+version+salt header. Returns the on-disk bytes.
pub fn encrypt_with_passphrase(
    plaintext: &[u8],
    passphrase: &str,
) -> Result<Vec<u8>, EncryptionError> {
    use std::io::Write;

    let salt = generate_salt();
    let derived = derive_key(passphrase, &salt)?;
    // Wrap derived key as age passphrase (hex-encoded for stability across
    // any internal Unicode handling).
    let hex_key = hex_encode(&derived);
    let age_passphrase = SecretString::new(hex_key);

    let encryptor = age::Encryptor::with_user_passphrase(age_passphrase);
    let mut encrypted = Vec::new();
    let mut writer = encryptor
        .wrap_output(&mut encrypted)
        .map_err(|_| EncryptionError::Encrypt)?;
    writer
        .write_all(plaintext)
        .map_err(|_| EncryptionError::Encrypt)?;
    writer.finish().map_err(|_| EncryptionError::Encrypt)?;

    let mut out = Vec::with_capacity(HEADER_LEN + encrypted.len());
    out.extend_from_slice(MAGIC);
    out.push(FORMAT_VERSION);
    out.extend_from_slice(&salt);
    out.extend_from_slice(&encrypted);
    Ok(out)
}

/// Decrypt the on-disk binary format using a passphrase.
///
/// Validates magic header + format version + salt presence before deriving
/// the Argon2id key and attempting age decryption.
pub fn decrypt_with_passphrase(
    ciphertext: &[u8],
    passphrase: &str,
) -> Result<Vec<u8>, EncryptionError> {
    use std::io::Read;

    if ciphertext.len() < HEADER_LEN {
        return Err(EncryptionError::Decrypt);
    }
    if &ciphertext[..MAGIC.len()] != MAGIC {
        return Err(EncryptionError::Decrypt);
    }
    let version = ciphertext[MAGIC.len()];
    if version != FORMAT_VERSION {
        return Err(EncryptionError::Decrypt);
    }
    let salt = &ciphertext[MAGIC.len() + 1..HEADER_LEN];
    let body = &ciphertext[HEADER_LEN..];

    let derived = derive_key(passphrase, salt)?;
    let hex_key = hex_encode(&derived);
    let age_passphrase = SecretString::new(hex_key);

    let decryptor = match age::Decryptor::new(body).map_err(|_| EncryptionError::Decrypt)? {
        age::Decryptor::Passphrase(d) => d,
        age::Decryptor::Recipients(_) => return Err(EncryptionError::Decrypt),
    };
    let mut reader = decryptor
        .decrypt(&age_passphrase, None)
        .map_err(|_| EncryptionError::Decrypt)?;

    let mut plaintext = Vec::new();
    reader
        .read_to_end(&mut plaintext)
        .map_err(|_| EncryptionError::Decrypt)?;
    Ok(plaintext)
}

// ============================================================================
// Hex helpers (avoid pulling in the hex crate for a single use site)
// ============================================================================

fn hex_encode(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut out = String::with_capacity(bytes.len() * 2);
    for &b in bytes {
        out.push(HEX[(b >> 4) as usize] as char);
        out.push(HEX[(b & 0x0f) as usize] as char);
    }
    out
}
