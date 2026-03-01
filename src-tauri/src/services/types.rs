//! Type definitions for the GSD-OS Service Launcher.
//!
//! Defines service identifiers, states, health check types, start commands,
//! service definitions, and launch errors.

use serde::{Deserialize, Serialize};
use std::fmt;
use std::path::PathBuf;

/// Unique identifier for each GSD-OS managed service.
#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum ServiceId {
    Tmux,
    ClaudeCode,
    FileWatcher,
    Dashboard,
    Console,
    Staging,
    Terminal,
}

impl ServiceId {
    /// Return the lowercase string identifier for this service.
    pub fn as_str(&self) -> &'static str {
        match self {
            ServiceId::Tmux => "tmux",
            ServiceId::ClaudeCode => "claude_code",
            ServiceId::FileWatcher => "file_watcher",
            ServiceId::Dashboard => "dashboard",
            ServiceId::Console => "console",
            ServiceId::Staging => "staging",
            ServiceId::Terminal => "terminal",
        }
    }
}

impl fmt::Display for ServiceId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

/// Current lifecycle state of a service.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ServiceState {
    Offline,
    Starting,
    Online,
    Degraded,
    #[serde(rename = "failed")]
    Failed(String),
}

/// Type of health check to perform for a service.
#[derive(Debug, Clone)]
pub enum HealthCheckType {
    /// Check if a process with this name is running.
    ProcessRunning(String),
    /// Check if a tmux session with this name exists.
    TmuxSession(String),
    /// Check if a file or directory exists at this path.
    FileExists(PathBuf),
    /// Check if an HTTP endpoint responds with 2xx.
    HttpEndpoint(String),
    /// Check if a directory is being actively watched.
    DirectoryWatch(PathBuf),
}

/// How to start a service.
#[derive(Debug, Clone)]
pub enum StartCommand {
    /// Run a shell command to start the service.
    Shell(String),
    /// Service is managed internally (no external process).
    Internal,
}

/// Definition of a managed service including its identity,
/// dependencies, health check strategy, and LED position.
///
/// The `optional` field controls graceful degradation: when an optional
/// service (e.g., tmux) is unavailable, dependent services skip it
/// instead of failing. PR #24 (@PatrickRobotham) identified that tmux
/// was an undocumented hard dependency causing ENOENT crashes.
#[derive(Debug, Clone)]
pub struct ServiceDef {
    /// Unique service identifier.
    pub id: ServiceId,
    /// Human-readable display name.
    pub name: &'static str,
    /// Services that must be Online before this service can start.
    pub depends_on: Vec<ServiceId>,
    /// How to check if the service is healthy.
    pub health_check: HealthCheckType,
    /// How to start the service (None for user-guided services).
    pub start_command: Option<StartCommand>,
    /// Position in the LED indicator strip (0-6).
    pub led_position: u8,
    /// Whether this service is optional. Optional services that fail to
    /// start are skipped rather than blocking the entire startup chain.
    /// Added in v1.49.7 per PR #24 (@PatrickRobotham).
    pub optional: bool,
}

/// Errors that can occur when starting a service.
#[derive(Debug, thiserror::Error)]
pub enum LaunchError {
    #[error("Dependencies not met: {missing:?}")]
    DependencyNotMet { missing: Vec<ServiceId> },

    #[error("Dependency {service:?} failed: {error}")]
    DependencyFailed { service: ServiceId, error: String },

    #[error("Service is already running")]
    AlreadyRunning,

    #[error("Start failed: {0}")]
    StartFailed(String),

    #[error("Service not found: {0}")]
    NotFound(String),
}
