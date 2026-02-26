//! Tauri IPC commands for sandbox configuration and status.
//!
//! Exposes platform detection, profile configuration, and sandbox status
//! to the webview frontend via Tauri's command system.
//!
//! Phase 368 — Sandbox Configurator

use crate::security::sandbox::{detect_platform, SandboxPlatform, SandboxProfileGenerator};
use crate::security::types::AgentType;

use serde::Serialize;
use std::path::PathBuf;

/// Sandbox status payload returned to the webview.
#[derive(Debug, Serialize)]
pub struct SandboxStatus {
    pub platform: SandboxPlatform,
    pub active: bool,
    pub profile_path: Option<String>,
}

/// Get the detected sandbox platform (Linux/macOS/Unsupported).
#[tauri::command]
pub fn get_sandbox_platform() -> SandboxPlatform {
    detect_platform()
}

/// Configure a sandbox profile for the given agent type.
///
/// Generates and writes a profile JSON file to the security directory.
#[tauri::command]
pub async fn configure_sandbox(
    project_root: String,
    agent_type: AgentType,
    worktree_path: Option<String>,
) -> Result<String, String> {
    let project_dir = PathBuf::from(&project_root);
    let proxy_socket = project_dir
        .join(".planning")
        .join("security")
        .join("proxy.sock");
    let output_dir = project_dir
        .join(".planning")
        .join("security");

    let gen = SandboxProfileGenerator::new(project_dir, proxy_socket);
    let wt = worktree_path.map(PathBuf::from);
    let profile = gen.generate(agent_type, wt.as_deref());

    let path = gen
        .write_profile(&profile, &output_dir)
        .map_err(|e| e.to_string())?;

    Ok(path.display().to_string())
}

/// Get the current sandbox status.
#[tauri::command]
pub fn get_sandbox_status() -> SandboxStatus {
    SandboxStatus {
        platform: detect_platform(),
        active: false, // Will be wired in Phase 373
        profile_path: None,
    }
}
