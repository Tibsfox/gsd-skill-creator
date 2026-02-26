//! Tests for API KeyStore -- credential loading priority and secret redaction.

use crate::api::keystore::{KeyStore, KeyStoreError};

#[test]
fn load_from_env_var() {
    // Set env var for this test
    unsafe { std::env::set_var("ANTHROPIC_API_KEY", "sk-ant-test123"); }
    let result = KeyStore::load();
    assert!(result.is_ok(), "KeyStore::load should succeed with env var set");
    let ks = result.unwrap();
    assert!(ks.has_key());
    // Clean up
    unsafe { std::env::remove_var("ANTHROPIC_API_KEY"); }
}

#[test]
fn no_key_found() {
    // Ensure no env var is set
    unsafe { std::env::remove_var("ANTHROPIC_API_KEY"); }
    let result = KeyStore::load();
    assert!(result.is_err(), "KeyStore::load should fail when no key is available");
    match result.unwrap_err() {
        KeyStoreError::NotFound => {} // expected
        other => panic!("Expected NotFound, got: {:?}", other),
    }
}

#[test]
fn key_never_in_debug_output() {
    let secret_key = "sk-ant-supersecret-key-12345";
    unsafe { std::env::set_var("ANTHROPIC_API_KEY", secret_key); }
    let ks = KeyStore::load().unwrap();
    let debug_output = format!("{:?}", ks);
    assert!(
        !debug_output.contains(secret_key),
        "API key must NOT appear in Debug output: {}",
        debug_output
    );
    assert!(
        debug_output.contains("has_key: true"),
        "Debug should show has_key: true"
    );
    unsafe { std::env::remove_var("ANTHROPIC_API_KEY"); }
}

#[test]
fn key_never_in_error_display() {
    // KeyStoreError::NotFound should not contain any key material
    let err = KeyStoreError::NotFound;
    let display = format!("{}", err);
    assert!(
        !display.contains("sk-ant"),
        "Error display must NOT contain key prefix"
    );
}

#[test]
fn has_key_returns_false_when_empty() {
    let ks = KeyStore::empty();
    assert!(!ks.has_key(), "KeyStore::empty().has_key() should be false");
}
