// Parked MCP-host subsystem: API surface not wired under the default feature set.
#![allow(dead_code)]

pub mod commands;
pub mod connection;
pub mod manager;
pub mod registry;
pub mod router;
pub mod security;
pub mod trace;
pub mod types;

pub use commands::McpHostState;
