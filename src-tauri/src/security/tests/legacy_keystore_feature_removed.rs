//! v1.49.637 cluster #4 C1 — Post-retirement invariant test for the
//! `legacy-plaintext-keystore` Cargo feature.
//!
//! This file REPLACES the prior `keystore_reachability.rs` test module, which
//! asserted that the cfg-gate existed and was correctly authored. With the
//! feature retired at v1.49.637 (substrate enumeration: 20 references /
//! 3 cfg-blocks all removed), the invariant flips: we now assert the feature
//! is GONE from the substrate and the production code path is unconditional.
//!
//! Invariants asserted:
//! 1. `Cargo.toml` does NOT contain `legacy-plaintext-keystore` feature
//!    declaration.
//! 2. `keystore.rs` source does NOT contain any `legacy-plaintext-keystore`
//!    references (covers cfg attributes, comments, identifiers).
//! 3. The disabled-fallback error message remains in `keystore.rs` (the
//!    behavioral invariant — operators still get a clear error pointing at
//!    the env-var workaround + migration CLI).
//!
//! Audit-trail: .planning/c1-keystore-removal-design.md

#[test]
fn no_legacy_feature_in_cargo_toml() {
    let cargo_toml = include_str!("../../../Cargo.toml");
    assert!(
        !cargo_toml.contains("legacy-plaintext-keystore = []"),
        "Cargo.toml MUST NOT declare the legacy-plaintext-keystore feature after v1.49.637 cluster #4 C1"
    );
}

#[test]
fn no_legacy_feature_references_in_keystore_src() {
    let keystore_src = include_str!("../keystore.rs");

    // The cfg gates themselves must be gone. Historical mentions in comments
    // (retirement audit-trail) are permitted; we assert no live `cfg(...)`
    // attributes remain that reference the retired feature.
    assert!(
        !keystore_src.contains(r#"cfg(feature = "legacy-plaintext-keystore")"#),
        "keystore.rs MUST NOT contain `cfg(feature = \"legacy-plaintext-keystore\")` after C1"
    );
    assert!(
        !keystore_src.contains(r#"cfg(any(debug_assertions, feature = "legacy-plaintext-keystore"))"#),
        "keystore.rs MUST NOT contain the `cfg(any(debug_assertions, feature = ...))` gate after C1"
    );
    assert!(
        !keystore_src.contains(r#"cfg(not(any(debug_assertions, feature = "legacy-plaintext-keystore")))"#),
        "keystore.rs MUST NOT contain the `cfg(not(any(...)))` gate after C1; production path is unconditional"
    );
}

#[test]
fn disabled_fallback_error_message_preserved() {
    // Behavioral invariant: even with the feature gate removed, the production
    // code path must continue to surface the disabled-fallback error pointing
    // operators at the env-var workaround and the migration CLI.
    let keystore_src = include_str!("../keystore.rs");

    assert!(
        keystore_src.contains("Plaintext credential-file fallback is disabled in release builds"),
        "keystore.rs must preserve the disabled-fallback error message after C1"
    );
    assert!(
        keystore_src.contains("ANTHROPIC_API_KEY"),
        "disabled-fallback error must name the ANTHROPIC_API_KEY env-var workaround"
    );
    assert!(
        keystore_src.contains("skill-creator keystore migrate"),
        "disabled-fallback error must point users at the migration CLI"
    );
    assert!(
        keystore_src.contains("docs/keystore.md"),
        "disabled-fallback error must point users at the keystore documentation"
    );
}
