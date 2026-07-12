//! Service lifecycle manager for GSD-OS services (v1.39).
//!
//! Manages 7 services with dependency-ordered startup, health monitoring,
//! LED state reporting, and graceful shutdown.

pub mod health;
pub mod launcher;
pub mod led;
pub mod registry;
pub mod shutdown;
pub mod types;
pub use types::*;

#[cfg(test)]
mod tests;
