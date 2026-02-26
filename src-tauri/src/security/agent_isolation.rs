//! Agent Isolation Manager for GSD-OS (Phase 371).
//!
//! Provides per-agent git worktree creation with scoped sandbox profiles,
//! private `.planning/` message bus per agent, INTEG (Main) read-across,
//! and shared integration directory for cross-agent results.
//!
//! Each EXEC/VERIFY/SCOUT agent gets its own worktree with a sandbox profile
//! scoped to only that worktree, preventing cross-agent filesystem access.
//! The INTEG (Main) agent can read all worktrees for integration.

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde::{Deserialize, Serialize};

use super::types::{
    AgentType, EventSeverity, EventSource, Filesystem, Network, SandboxProfile, SecurityEvent,
};

// ============================================================================
// Error types
// ============================================================================

/// Errors that can occur during agent isolation operations.
#[derive(Debug)]
pub enum IsolationError {
    /// Git worktree add/remove failed.
    WorktreeCreationFailed(String),
    /// Sandbox profile generation failed.
    SandboxGenerationFailed(String),
    /// Filesystem I/O error.
    IoError(std::io::Error),
    /// Git command failed.
    GitError(String),
}

impl std::fmt::Display for IsolationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::WorktreeCreationFailed(msg) => write!(f, "worktree creation failed: {}", msg),
            Self::SandboxGenerationFailed(msg) => {
                write!(f, "sandbox generation failed: {}", msg)
            }
            Self::IoError(e) => write!(f, "IO error: {}", e),
            Self::GitError(msg) => write!(f, "git error: {}", msg),
        }
    }
}

impl std::error::Error for IsolationError {}

impl From<std::io::Error> for IsolationError {
    fn from(e: std::io::Error) -> Self {
        IsolationError::IoError(e)
    }
}

// ============================================================================
// Agent status
// ============================================================================

/// Lifecycle status of an isolated agent.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentStatus {
    Creating,
    Active,
    Completed,
    Failed,
}

// ============================================================================
// Agent instance
// ============================================================================

/// A running agent with its worktree and sandbox profile.
#[derive(Debug, Clone)]
pub struct AgentInstance {
    /// Agent identifier (e.g., "exec-001", "verify-002").
    pub id: String,
    /// Agent type determining sandbox template.
    pub agent_type: AgentType,
    /// Absolute path to the agent's git worktree.
    pub worktree_path: PathBuf,
    /// Sandbox profile scoped to this agent's worktree.
    pub sandbox_profile: SandboxProfile,
    /// Current lifecycle status.
    pub status: AgentStatus,
    /// Unix timestamp of creation.
    pub created_at: String,
}

// ============================================================================
// Local sandbox profile generator (stub)
// ============================================================================

/// Local sandbox profile generator stub.
///
/// Generates minimal profiles scoped to the agent's worktree. This stub
/// will be replaced by the real `SandboxProfileGenerator` from Phase 368
/// when wired together in Phase 374.
pub struct LocalSandboxProfileGenerator;

impl LocalSandboxProfileGenerator {
    pub fn new() -> Self {
        Self
    }

    /// Generate a sandbox profile scoped to a specific worktree path.
    ///
    /// For non-INTEG agents: write_dirs = [worktree_path], deny_read = [~/.ssh, ~/.aws].
    /// For INTEG (Main): handled separately in create_agent with full project access.
    pub fn generate_for_worktree(
        &self,
        id: &str,
        agent_type: AgentType,
        path: &Path,
    ) -> Result<SandboxProfile, IsolationError> {
        let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("/tmp/home"));
        Ok(SandboxProfile {
            agent_id: id.to_string(),
            agent_type,
            filesystem: Filesystem {
                write_dirs: vec![path.to_string_lossy().to_string()],
                deny_read: vec![
                    home.join(".ssh").to_string_lossy().to_string(),
                    home.join(".aws").to_string_lossy().to_string(),
                ],
            },
            network: Network {
                allowed_domains: vec![],
                proxy_socket: String::new(),
            },
            worktree_path: Some(path.to_string_lossy().to_string()),
        })
    }
}

// ============================================================================
// Worktree hook payload
// ============================================================================

/// Payload for WorktreeCreate / WorktreeRemove hooks from Claude Code Agent Teams.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeHookPayload {
    /// Hook type: "WorktreeCreate" | "WorktreeRemove" | "TaskCompleted" | "TeammateIdle"
    pub hook: String,
    /// Absolute path to the agent worktree.
    pub worktree_path: String,
    /// Agent identifier.
    pub agent_id: String,
    /// Agent type string: "exec" | "verify" | "scout" | "main"
    pub agent_type: String,
}

// ============================================================================
// Agent Isolation Manager
// ============================================================================

/// Manages per-agent git worktrees with scoped sandbox profiles.
///
/// Each agent gets an isolated worktree under `.agents/` with:
/// - A sandbox profile restricting filesystem/network access to that worktree
/// - A private `.planning/` subtree (inbox, outbox, observations) as message bus
/// - No visibility into other agents' worktrees (except INTEG which reads all)
pub struct AgentIsolationManager {
    /// Project root directory.
    project_root: PathBuf,
    /// Directory containing all agent worktrees: `{project_root}/.agents/`
    agents_dir: PathBuf,
    /// Shared directory for cross-agent results: `{project_root}/.agents/shared/`
    shared_dir: PathBuf,
    /// Local sandbox profile generator stub.
    sandbox_gen: LocalSandboxProfileGenerator,
    /// Currently active agents keyed by agent ID.
    active_agents: HashMap<String, AgentInstance>,
    /// Per-type sequence counters for agent ID generation.
    counters: HashMap<String, u32>,
    /// Recorded security events.
    events: Vec<SecurityEvent>,
}

impl AgentIsolationManager {
    /// Create a new isolation manager for the given project root.
    ///
    /// Creates `.agents/`, `.agents/shared/integration/`, and `.agents/shared/results/`
    /// directories on initialization.
    pub fn new(project_root: PathBuf) -> Result<Self, IsolationError> {
        let agents_dir = project_root.join(".agents");
        let shared_dir = agents_dir.join("shared");

        fs::create_dir_all(&agents_dir)?;
        fs::create_dir_all(shared_dir.join("integration"))?;
        fs::create_dir_all(shared_dir.join("results"))?;

        Ok(Self {
            project_root,
            agents_dir,
            shared_dir,
            sandbox_gen: LocalSandboxProfileGenerator::new(),
            active_agents: HashMap::new(),
            counters: HashMap::new(),
            events: Vec::new(),
        })
    }

    /// Create a new isolated agent with its own git worktree.
    ///
    /// Steps:
    /// 1. Generate agent ID from type + incrementing counter (exec-001, exec-002, etc.)
    /// 2. Run `git worktree add` to create an isolated checkout
    /// 3. Create per-agent `.planning/` subtree (inbox, outbox, observations)
    /// 4. Generate sandbox profile scoped to the worktree
    /// 5. Write `.sandbox-profile.json` to the worktree root
    /// 6. For INTEG (Main): profile includes project root + all active worktrees
    pub async fn create_agent(
        &mut self,
        agent_type: AgentType,
    ) -> Result<AgentInstance, IsolationError> {
        let type_key = match &agent_type {
            AgentType::Exec => "exec",
            AgentType::Verify => "verify",
            AgentType::Scout => "scout",
            AgentType::Main => "main",
        }
        .to_string();

        // Increment counter for this agent type
        let counter = self.counters.entry(type_key.clone()).or_insert(0);
        *counter += 1;
        let agent_id = format!("{}-{:03}", type_key, counter);

        let worktree_path = self.agents_dir.join(&agent_id);

        // Run git worktree add
        let output = Command::new("git")
            .args(["worktree", "add", &worktree_path.to_string_lossy()])
            .current_dir(&self.project_root)
            .output()
            .map_err(|e| IsolationError::GitError(e.to_string()))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            return Err(IsolationError::WorktreeCreationFailed(stderr));
        }

        // Create per-agent .planning/ subtree (private message bus)
        let planning_dir = worktree_path.join(".planning");
        fs::create_dir_all(planning_dir.join("inbox"))?;
        fs::create_dir_all(planning_dir.join("outbox"))?;
        fs::create_dir_all(planning_dir.join("observations"))?;

        // Generate sandbox profile
        let profile = if agent_type == AgentType::Main {
            // INTEG agent: project root write + read all worktrees
            let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("/tmp/home"));
            let mut write_dirs = vec![self.project_root.to_string_lossy().to_string()];
            // Add all active agent worktree paths as readable
            for agent in self.active_agents.values() {
                write_dirs.push(agent.worktree_path.to_string_lossy().to_string());
            }
            SandboxProfile {
                agent_id: agent_id.clone(),
                agent_type: agent_type.clone(),
                filesystem: Filesystem {
                    write_dirs,
                    deny_read: vec![
                        home.join(".ssh").to_string_lossy().to_string(),
                        home.join(".aws").to_string_lossy().to_string(),
                    ],
                },
                network: Network {
                    allowed_domains: vec![],
                    proxy_socket: String::new(),
                },
                worktree_path: Some(worktree_path.to_string_lossy().to_string()),
            }
        } else {
            self.sandbox_gen
                .generate_for_worktree(&agent_id, agent_type.clone(), &worktree_path)?
        };

        // Write .sandbox-profile.json to worktree root
        let profile_json = serde_json::to_string_pretty(&profile)
            .map_err(|e| IsolationError::SandboxGenerationFailed(e.to_string()))?;
        fs::write(worktree_path.join(".sandbox-profile.json"), &profile_json)?;

        // Build agent instance
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
            .to_string();

        let instance = AgentInstance {
            id: agent_id.clone(),
            agent_type: agent_type.clone(),
            worktree_path: worktree_path.clone(),
            sandbox_profile: profile,
            status: AgentStatus::Active,
            created_at: timestamp,
        };

        // Store in active agents
        self.active_agents.insert(agent_id.clone(), instance.clone());

        // Emit security event
        self.emit_event(
            "agent_created",
            EventSeverity::Info,
            serde_json::json!({
                "agent_id": agent_id,
                "agent_type": type_key,
            }),
        );

        Ok(instance)
    }

    /// Get a reference to recorded security events.
    pub fn get_events(&self) -> &[SecurityEvent] {
        &self.events
    }

    /// Get a reference to active agents.
    pub fn get_active_agents(&self) -> &HashMap<String, AgentInstance> {
        &self.active_agents
    }

    /// Record a security event internally.
    fn emit_event(
        &mut self,
        event_type: &str,
        severity: EventSeverity,
        detail: serde_json::Value,
    ) {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
            .to_string();

        self.events.push(SecurityEvent {
            id: format!("iso-{}", self.events.len() + 1),
            timestamp,
            severity,
            source: EventSource::AgentIsolation,
            event_type: event_type.to_string(),
            detail,
        });
    }
}
