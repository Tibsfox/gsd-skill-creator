//! Security module for GSD-OS SSH Agent Security (v1.38).
//!
//! Provides typed interfaces for all security components: sandbox profiles,
//! credential proxy configuration, security events, domain credentials,
//! and agent isolation state.
//!
//! TypeScript equivalent: src/types/security.ts

pub mod sandbox;
pub mod types;
pub use types::*;
