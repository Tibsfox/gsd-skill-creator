//! v1.49.650 C1 — encryption primitives unit tests.
//!
//! Covers `src/security/encryption.rs`:
//! - Round-trip: encrypt(p, passphrase) → decrypt(c, passphrase) == p
//! - Distinct ciphertexts: two encryptions of the same plaintext produce
//!   different bytes (because salt + nonce are random per call)
//! - Tamper detection: flipping a single byte in ciphertext yields a decrypt
//!   error (no silent corruption)
//! - Wrong passphrase: decrypt with a different passphrase yields error
//! - Sanitizer positive: clean error messages pass through unchanged
//! - Sanitizer negative: a constructed leaky message is detected
//!   - 1 test for plaintext-fragment detection
//!   - 1 test for key-fragment detection
//! - Header validation: short input, bad magic, bad version all fail cleanly

use crate::security::encryption::{
    decrypt_with_passphrase, derive_key, encrypt_with_passphrase, generate_salt,
    sanitize_error_message, SanitizerSource, ARGON2_OUTPUT_LEN, ARGON2_SALT_LEN, HEADER_LEN, MAGIC,
};

const PLAINTEXT: &[u8] = b"anthropic:api_key:sk-ant-test-CREDENTIAL-VALUE-32B";
const PASSPHRASE: &str = "correct-horse-battery-staple-42";

#[test]
fn salt_is_32_bytes_and_random() {
    let s1 = generate_salt();
    let s2 = generate_salt();
    assert_eq!(s1.len(), ARGON2_SALT_LEN);
    assert_ne!(s1, s2, "two consecutive salts should differ");
}

#[test]
fn derive_key_is_deterministic_for_same_inputs() {
    let salt = [0u8; ARGON2_SALT_LEN];
    // Hygiene update (v1.49.637 C3 R14 audit): use a non-trivial fixture
    // even on the Rust side, where the TS-side zxcvbn validator does NOT
    // apply. This test only cares about derivation determinism, not
    // passphrase strength — but a strong fixture documents intent.
    let k1 = derive_key("salt-determinism-fixture-2026", &salt).expect("derive 1");
    let k2 = derive_key("salt-determinism-fixture-2026", &salt).expect("derive 2");
    assert_eq!(k1, k2, "Argon2id must be deterministic for fixed inputs");
    assert_eq!(k1.len(), ARGON2_OUTPUT_LEN);
}

#[test]
fn derive_key_differs_for_different_salts() {
    let mut salt1 = [0u8; ARGON2_SALT_LEN];
    let mut salt2 = [0u8; ARGON2_SALT_LEN];
    salt1[0] = 1;
    salt2[0] = 2;
    let k1 = derive_key("p", &salt1).expect("derive 1");
    let k2 = derive_key("p", &salt2).expect("derive 2");
    assert_ne!(k1, k2, "Argon2id must depend on salt");
}

#[test]
fn round_trip_encrypts_and_decrypts() {
    let ct = encrypt_with_passphrase(PLAINTEXT, PASSPHRASE).expect("encrypt");
    assert!(
        ct.len() > HEADER_LEN,
        "ciphertext includes header + age payload"
    );
    assert_eq!(&ct[..MAGIC.len()], MAGIC, "magic header at byte 0");

    let pt = decrypt_with_passphrase(&ct, PASSPHRASE).expect("decrypt");
    assert_eq!(pt, PLAINTEXT, "round-trip must preserve plaintext bytes");
}

#[test]
fn two_encryptions_of_same_plaintext_are_distinct() {
    let ct1 = encrypt_with_passphrase(PLAINTEXT, PASSPHRASE).expect("encrypt 1");
    let ct2 = encrypt_with_passphrase(PLAINTEXT, PASSPHRASE).expect("encrypt 2");
    assert_ne!(
        ct1, ct2,
        "salts + age nonces are random per call; ciphertexts must differ"
    );
}

#[test]
fn tampered_ciphertext_fails_to_decrypt() {
    let mut ct = encrypt_with_passphrase(PLAINTEXT, PASSPHRASE).expect("encrypt");
    // Flip a byte well inside the age payload (past the 37-byte header).
    let flip_idx = HEADER_LEN + 8;
    ct[flip_idx] ^= 0x01;
    assert!(
        decrypt_with_passphrase(&ct, PASSPHRASE).is_err(),
        "tampered ciphertext must NOT decrypt successfully"
    );
}

#[test]
fn wrong_passphrase_fails_to_decrypt() {
    let ct = encrypt_with_passphrase(PLAINTEXT, PASSPHRASE).expect("encrypt");
    assert!(
        decrypt_with_passphrase(&ct, "wrong-passphrase").is_err(),
        "wrong passphrase must NOT decrypt successfully"
    );
}

#[test]
fn short_ciphertext_fails_cleanly() {
    assert!(decrypt_with_passphrase(b"too-short", PASSPHRASE).is_err());
    assert!(decrypt_with_passphrase(b"", PASSPHRASE).is_err());
}

#[test]
fn bad_magic_fails_cleanly() {
    let mut ct = encrypt_with_passphrase(PLAINTEXT, PASSPHRASE).expect("encrypt");
    ct[0] = b'X';
    assert!(decrypt_with_passphrase(&ct, PASSPHRASE).is_err());
}

#[test]
fn bad_version_fails_cleanly() {
    let mut ct = encrypt_with_passphrase(PLAINTEXT, PASSPHRASE).expect("encrypt");
    ct[MAGIC.len()] = 99;
    assert!(decrypt_with_passphrase(&ct, PASSPHRASE).is_err());
}

// ========================================================================
// Sanitizer tests (per arch-review refinement #3)
// ========================================================================

#[test]
fn sanitizer_passes_clean_messages() {
    let plaintext = b"anthropic:api_key:KNOWN-VALUE-32-BYTES-PLACEHOLDER";
    let key = b"DERIVED-KEY-32-BYTES-PLACEHOLDER";
    let clean = "decryption failed (wrong passphrase or tampered ciphertext)";
    let result = sanitize_error_message(clean, plaintext, key);
    assert!(
        result.is_ok(),
        "clean error message must pass sanitizer; got {:?}",
        result
    );
    assert_eq!(result.unwrap(), clean);
}

#[test]
fn sanitizer_passes_when_inputs_too_short() {
    // Plaintext < 4 bytes: no 4-byte window possible, sanitizer skips it.
    let result = sanitize_error_message("error", b"abc", b"DERIVED-KEY-32-BYTES-PLACEHOLDER");
    assert!(
        result.is_ok(),
        "sanitizer must skip when plaintext < 4 bytes"
    );

    let result = sanitize_error_message("error", b"PLACEHOLDER-PLAINTEXT", b"abc");
    assert!(result.is_ok(), "sanitizer must skip when key < 4 bytes");
}

#[test]
fn sanitizer_fires_when_error_contains_plaintext_fragment() {
    // POSITIVE detection: error message includes a 4+-byte chunk of plaintext.
    let plaintext = b"anthropic:api_key:KNOWN-VALUE-32-BYTES";
    let key = b"DERIVED-KEY-32-BYTES-PLACEHOLDER";
    let leaky_msg = "decryption failed for cred 'anthropic:api_'"; // contains 'thro', 'pic:', 'api_' …
    let result = sanitize_error_message(leaky_msg, plaintext, key);
    match result {
        Err(v) => {
            assert_eq!(v.source, SanitizerSource::Plaintext);
            assert_eq!(v.length, 4);
        }
        Ok(_) => panic!(
            "sanitizer FAILED to detect plaintext fragment in '{}'",
            leaky_msg
        ),
    }
}

#[test]
fn sanitizer_fires_when_error_contains_key_fragment() {
    // POSITIVE detection: error message includes a 4+-byte chunk of derived key.
    let plaintext = b"anthropic:api_key:KNOWN-VALUE-32-BYTES";
    let key = b"DERIVED-KEY-32-BYTES-PLACEHOLDER";
    let leaky_msg = "internal error near token DERI";
    let result = sanitize_error_message(leaky_msg, plaintext, key);
    match result {
        Err(v) => {
            assert_eq!(v.source, SanitizerSource::Key);
            assert_eq!(v.length, 4);
        }
        Ok(_) => panic!("sanitizer FAILED to detect key fragment in '{}'", leaky_msg),
    }
}

#[test]
fn sanitizer_does_not_fire_on_3_byte_overlap() {
    // Threshold is 4 bytes; a 3-byte overlap should NOT trigger.
    let plaintext = b"abcdefgh";
    let key = b"";
    // "the" overlaps 0 bytes with `abcdefgh`. Need a real 3-byte overlap:
    let result = sanitize_error_message("error near abc...", plaintext, key);
    // "abc" is 3 bytes — threshold is 4 — must pass.
    assert!(
        result.is_ok(),
        "3-byte overlap must NOT fire 4-byte sanitizer"
    );
}
