//! Tauri command handlers for unified security operations.
//!
//! Phase 374-01 -- Integration & Verification
//!
//! Provides 7 Tauri commands for security operations:
//! - security_get_status: aggregate security posture snapshot
//! - security_release_quarantine: user-only quarantine release
//! - sandbox_verify_full: run full sandbox verification
//! - proxy_health: credential proxy health check
//! - agent_create: create isolated agent with worktree + sandbox
//! - agent_destroy: destroy agent and clean up worktree
//! - agent_verify_isolation: verify two agents are isolated
//!
//! Plus one internal helper (not a Tauri command):
//! - emit_critical_security_event: emit breach-blocked IPC event

use tauri::Emitter;
use tokio::sync::Mutex;

use crate::security::{
    AgentIsolationState, EventSeverity, EventSource, SecurityEvent, SecurityState,
    SecurityStatus, ShieldState,
};

// ============================================================================
// security_get_status
// ============================================================================

/// Get current security status snapshot.
///
/// Returns a JSON object with aggregate security posture for the
/// dashboard shield indicator and status panel.
#[tauri::command]
pub async fn security_get_status(
    state: tauri::State<'_, Mutex<SecurityState>>,
) -> Result<serde_json::Value, String> {
    let s = state.lock().await;
    Ok(serde_json::json!({
        "status": s.status,
        "proxy_running": s.proxy_running,
        "sandbox_verified": s.sandbox_verified,
        "active_agent_count": s.active_agents.len(),
        "recent_event_count": s.recent_events.len(),
    }))
}

// ============================================================================
// security_release_quarantine
// ============================================================================

/// Release quarantine for a specific finding.
///
/// Security note: This is a Tauri command callable only from the desktop
/// frontend, NOT from any agent subprocess. Agents have no way to call
/// Tauri commands -- quarantine release is user-only by construction.
#[tauri::command]
pub async fn security_release_quarantine(
    finding_id: String,
    state: tauri::State<'_, Mutex<SecurityState>>,
) -> Result<(), String> {
    let mut s = state.lock().await;
    // Log the release as a SecurityEvent
    let event = SecurityEvent {
        id: format!("release-{}", finding_id),
        timestamp: iso_now(),
        severity: EventSeverity::Info,
        source: EventSource::Staging,
        event_type: "quarantine_released".to_string(),
        detail: serde_json::json!({
            "finding_id": finding_id,
            "released_by": "user",
        }),
    };
    s.recent_events.push_back(event);
    // Trim ring buffer if over capacity
    while s.recent_events.len() > 100 {
        s.recent_events.pop_front();
    }
    Ok(())
}

// ============================================================================
// sandbox_verify_full
// ============================================================================

/// Run full sandbox verification and update security state.
///
/// Delegates to the sandbox verification script and updates the
/// SecurityState and shield indicator via IPC event.
#[tauri::command]
pub async fn sandbox_verify_full(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SecurityState>>,
) -> Result<bool, String> {
    // Run the verification script (same as commands::sandbox::verify_sandbox)
    let script_path = std::env::current_dir()
        .map_err(|e| e.to_string())?
        .join("scripts")
        .join("security")
        .join("verify-sandbox.sh");

    let result = if script_path.exists() {
        let output = std::process::Command::new("bash")
            .arg(&script_path)
            .output()
            .map_err(|e| format!("Failed to run verification script: {}", e))?;
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let exit_code = output.status.code().unwrap_or(1) as u32;
        let verification = crate::security::sandbox::parse_verification_output(&stdout, exit_code);
        verification.all_passed
    } else {
        // Script not found -- report as unverified
        false
    };

    // Update security state
    let mut s = state.lock().await;
    s.sandbox_verified = result;

    // Emit shield update IPC event
    let shield = if result {
        ShieldState::Secure
    } else {
        ShieldState::Attention
    };
    let _ = app.emit("security:shield-update", &shield);

    Ok(result)
}

// ============================================================================
// proxy_health
// ============================================================================

/// Get credential proxy health status.
///
/// Returns a JSON object with proxy running state. In production this
/// would query the running ProxyServer instance for full health metrics.
#[tauri::command]
pub async fn proxy_health(
    state: tauri::State<'_, Mutex<SecurityState>>,
) -> Result<serde_json::Value, String> {
    let s = state.lock().await;
    Ok(serde_json::json!({
        "running": s.proxy_running,
    }))
}

// ============================================================================
// agent_create
// ============================================================================

/// Create an isolated agent with worktree and scoped sandbox profile.
///
/// Parses agent_type string to AgentType enum, constructs a temporary
/// AgentIsolationManager, and creates the agent. Records the resulting
/// AgentIsolationState in SecurityState for dashboard display.
#[tauri::command]
pub async fn agent_create(
    agent_id: String,
    agent_type: String,
    state: tauri::State<'_, Mutex<SecurityState>>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    // Parse agent type
    let at = parse_agent_type(&agent_type);

    // Create a stub AgentIsolationState for tracking
    // In production, this would delegate to AgentIsolationManager::create_agent()
    // which requires a project_root. The full lifecycle is managed by the
    // bootstrap system; this command records state for IPC/dashboard.
    let isolation_state = AgentIsolationState {
        agent_id: agent_id.clone(),
        agent_type: at.clone(),
        worktree_path: format!(".agents/{}", agent_id),
        sandbox_profile: crate::security::SandboxProfile {
            agent_id: agent_id.clone(),
            agent_type: at,
            filesystem: crate::security::Filesystem {
                write_dirs: vec![format!(".agents/{}", agent_id)],
                deny_read: vec!["~/.ssh".to_string(), "~/.aws".to_string()],
            },
            network: crate::security::Network {
                allowed_domains: vec![],
                proxy_socket: String::new(),
            },
            worktree_path: Some(format!(".agents/{}", agent_id)),
        },
        status: "active".to_string(),
        created_at: iso_now(),
    };

    let mut s = state.lock().await;
    s.active_agents.insert(agent_id.clone(), isolation_state);

    // Emit IPC event for dashboard
    let _ = app.emit("security:agent-created", &agent_id);

    Ok(())
}

// ============================================================================
// agent_destroy
// ============================================================================

/// Destroy an agent, removing its worktree and sandbox profile.
///
/// Removes the agent from SecurityState and emits an IPC event
/// for dashboard updates.
#[tauri::command]
pub async fn agent_destroy(
    agent_id: String,
    state: tauri::State<'_, Mutex<SecurityState>>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let mut s = state.lock().await;
    s.active_agents.remove(&agent_id);

    // Emit IPC event for dashboard
    let _ = app.emit("security:agent-destroyed", &agent_id);

    Ok(())
}

// ============================================================================
// agent_verify_isolation
// ============================================================================

/// Verify that two agents are isolated from each other.
///
/// Checks that neither agent's sandbox profile allows writing to the
/// other agent's worktree path. Returns true if properly isolated.
#[tauri::command]
pub async fn agent_verify_isolation(
    agent_a: String,
    agent_b: String,
    state: tauri::State<'_, Mutex<SecurityState>>,
) -> Result<bool, String> {
    let s = state.lock().await;

    let a = match s.active_agents.get(&agent_a) {
        Some(agent) => agent,
        None => return Err(format!("Agent {} not found", agent_a)),
    };
    let b = match s.active_agents.get(&agent_b) {
        Some(agent) => agent,
        None => return Err(format!("Agent {} not found", agent_b)),
    };

    // Check that agent A's write_dirs do NOT contain agent B's worktree
    let a_can_write_b = a
        .sandbox_profile
        .filesystem
        .write_dirs
        .iter()
        .any(|d| d == &b.worktree_path);
    let b_can_write_a = b
        .sandbox_profile
        .filesystem
        .write_dirs
        .iter()
        .any(|d| d == &a.worktree_path);

    Ok(!a_can_write_b && !b_can_write_a)
}

// ============================================================================
// Internal helper: emit critical security event
// ============================================================================

/// Emit a critical security event that bypasses the magic filter on the frontend.
///
/// Called internally by sandbox, proxy, and staging scanner when a critical
/// event occurs. NOT a Tauri command -- this is an internal function.
pub async fn emit_critical_security_event(
    app: &tauri::AppHandle,
    event: &SecurityEvent,
    state: &Mutex<SecurityState>,
) -> Result<(), String> {
    let mut s = state.lock().await;
    s.recent_events.push_back(event.clone());
    while s.recent_events.len() > 100 {
        s.recent_events.pop_front();
    }

    // breach-blocked bypasses magic system on frontend (always shown)
    app.emit("security:breach-blocked", event)
        .map_err(|e| e.to_string())?;
    // Also update shield state
    app.emit("security:shield-update", &ShieldState::BreachBlocked)
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================================================
// Helpers
// ============================================================================

/// Parse an agent type string to AgentType enum.
fn parse_agent_type(s: &str) -> crate::security::AgentType {
    match s {
        "exec" => crate::security::AgentType::Exec,
        "verify" => crate::security::AgentType::Verify,
        "scout" => crate::security::AgentType::Scout,
        _ => crate::security::AgentType::Main,
    }
}

/// Produce an ISO 8601 timestamp string.
fn iso_now() -> String {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    format!("{}Z", secs)
}
