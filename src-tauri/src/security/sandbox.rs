//! OS-level sandbox platform detection, dependency validation, and per-agent
//! profile generation for bubblewrap (Linux) and Seatbelt (macOS).
//!
//! Security-critical module: SSH keys and credential directories must be denied
//! at the READ level (not just write) so agents cannot even inspect key presence.
//!
//! Phase 368 — Sandbox Configurator

use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};

/// Detected OS sandbox technology with version/path metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SandboxPlatform {
    Linux {
        bwrap_path: PathBuf,
        bwrap_version: String,
    },
    MacOS {
        sandbox_exec_available: bool,
    },
    Unsupported(String),
}

/// A missing dependency with per-distro install instructions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MissingDependency {
    pub name: String,
    pub install_apt: Option<String>,
    pub install_dnf: Option<String>,
    pub install_brew: Option<String>,
}

/// Internal sandbox profile used for bwrap/Seatbelt command generation.
///
/// This is a PathBuf-based internal representation distinct from the Phase 367
/// JSON-oriented `SandboxProfile` type. Conversion methods bridge the two.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InternalSandboxProfile {
    pub agent_type: super::types::AgentType,
    pub write_dirs: Vec<PathBuf>,
    pub deny_read_dirs: Vec<PathBuf>,
    pub allowed_domains: Vec<String>,
    pub proxy_socket: Option<PathBuf>,
}

/// Detect the sandboxing platform available on the current OS.
pub fn detect_platform() -> SandboxPlatform {
    todo!("detect_platform not yet implemented")
}

/// Check that all required dependencies are installed for the given platform.
pub fn check_dependencies(_platform: &SandboxPlatform) -> Result<(), Vec<MissingDependency>> {
    todo!("check_dependencies not yet implemented")
}

/// Profile error types for write/serialization operations.
#[derive(Debug, thiserror::Error)]
pub enum ProfileError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    Json(#[from] serde_json::Error),
}

/// Generates sandbox profiles for each agent type.
pub struct SandboxProfileGenerator {
    project_dir: PathBuf,
    planning_dir: PathBuf,
    home_dir: PathBuf,
    proxy_socket: PathBuf,
}

impl SandboxProfileGenerator {
    pub fn new(project_dir: PathBuf, proxy_socket: PathBuf) -> Self {
        let planning_dir = project_dir.join(".planning");
        let home_dir = dirs::home_dir().unwrap_or_else(|| PathBuf::from("/tmp/home"));
        Self {
            project_dir,
            planning_dir,
            home_dir,
            proxy_socket,
        }
    }

    /// Test constructor using /tmp paths for deterministic testing.
    pub fn new_test() -> Self {
        Self {
            project_dir: PathBuf::from("/tmp/test-project"),
            planning_dir: PathBuf::from("/tmp/test-project/.planning"),
            home_dir: dirs::home_dir().unwrap_or_else(|| PathBuf::from("/tmp/home")),
            proxy_socket: PathBuf::from("/tmp/proxy.sock"),
        }
    }

    /// Generate an internal sandbox profile for the given agent type.
    pub fn generate(
        &self,
        _agent_type: super::types::AgentType,
        _worktree: Option<&Path>,
    ) -> InternalSandboxProfile {
        todo!("generate not yet implemented")
    }

    /// Write a profile to disk as JSON and platform-specific format.
    pub fn write_profile(
        &self,
        _profile: &InternalSandboxProfile,
        _output_dir: &Path,
    ) -> Result<PathBuf, ProfileError> {
        todo!("write_profile not yet implemented")
    }

    /// Convert profile to bubblewrap command-line arguments.
    pub fn to_bwrap_command(&self, _profile: &InternalSandboxProfile) -> Vec<String> {
        todo!("to_bwrap_command not yet implemented")
    }

    /// Convert profile to macOS Seatbelt scheme string.
    pub fn to_seatbelt_profile(&self, _profile: &InternalSandboxProfile) -> String {
        todo!("to_seatbelt_profile not yet implemented")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::types::AgentType;
    use std::path::PathBuf;

    #[test]
    fn test_detect_platform_returns_variant() {
        let platform = detect_platform();
        match platform {
            SandboxPlatform::Linux { .. }
            | SandboxPlatform::MacOS { .. }
            | SandboxPlatform::Unsupported(_) => {}
        }
    }

    #[test]
    fn test_missing_dependency_has_install_command() {
        let dep = MissingDependency {
            name: "bubblewrap".to_string(),
            install_apt: Some("sudo apt install bubblewrap socat".to_string()),
            install_dnf: Some("sudo dnf install bubblewrap socat".to_string()),
            install_brew: None,
        };
        assert!(dep.install_apt.is_some());
        assert!(dep.install_apt.unwrap().contains("apt install"));
    }

    #[test]
    fn test_profile_generator_main_denies_ssh_read() {
        let gen = SandboxProfileGenerator::new_test();
        let profile = gen.generate(AgentType::Main, None);
        let ssh_dir = dirs::home_dir().unwrap().join(".ssh");
        assert!(
            profile.deny_read_dirs.contains(&ssh_dir),
            "main profile must deny read to ~/.ssh/"
        );
    }

    #[test]
    fn test_profile_generator_exec_write_only_worktree() {
        let gen = SandboxProfileGenerator::new_test();
        let worktree = PathBuf::from("/tmp/test-worktree");
        let profile = gen.generate(AgentType::Exec, Some(&worktree));
        assert_eq!(profile.write_dirs.len(), 1);
        assert_eq!(profile.write_dirs[0], worktree);
    }

    #[test]
    fn test_profile_generator_verify_no_network() {
        let gen = SandboxProfileGenerator::new_test();
        let profile = gen.generate(AgentType::Verify, None);
        assert!(
            profile.allowed_domains.is_empty(),
            "VERIFY agent must have no network access"
        );
        assert!(
            profile.write_dirs.is_empty(),
            "VERIFY agent must have no write access"
        );
    }

    #[test]
    fn test_profile_generator_scout_research_write() {
        let gen = SandboxProfileGenerator::new_test();
        let profile = gen.generate(AgentType::Scout, None);
        assert!(
            profile.write_dirs.iter().any(|d| d.ends_with("research")),
            "SCOUT write_dirs must include .planning/research/"
        );
        assert!(
            !profile.allowed_domains.is_empty(),
            "SCOUT must have expanded domain allowlist"
        );
    }

    #[test]
    fn test_bwrap_command_includes_unshare_net() {
        let gen = SandboxProfileGenerator::new_test();
        let profile = gen.generate(AgentType::Main, None);
        let cmd = gen.to_bwrap_command(&profile);
        assert!(
            cmd.contains(&"--unshare-net".to_string()),
            "bwrap command must unshare network namespace"
        );
    }

    #[test]
    fn test_seatbelt_profile_denies_ssh_dir() {
        let gen = SandboxProfileGenerator::new_test();
        let profile = gen.generate(AgentType::Main, None);
        let seatbelt = gen.to_seatbelt_profile(&profile);
        assert!(
            !seatbelt.contains(".ssh"),
            "Seatbelt profile must not allow .ssh path"
        );
    }
}
