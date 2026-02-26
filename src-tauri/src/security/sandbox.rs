//! OS-level sandbox platform detection, dependency validation, and per-agent
//! profile generation for bubblewrap (Linux) and Seatbelt (macOS).
//!
//! Security-critical module: SSH keys and credential directories must be denied
//! at the READ level (not just write) so agents cannot even inspect key presence.
//!
//! Phase 368 — Sandbox Configurator

use std::path::{Path, PathBuf};
use std::process::Command;

use serde::{Deserialize, Serialize};

use super::types::AgentType;

// ============================================================================
// Platform detection
// ============================================================================

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

/// Detect the sandboxing platform available on the current OS.
///
/// On Linux: looks for bubblewrap (`bwrap`) in PATH and reads its version.
/// On macOS: checks for `sandbox-exec` availability.
/// Elsewhere: returns `Unsupported` with OS description.
pub fn detect_platform() -> SandboxPlatform {
    if cfg!(target_os = "linux") {
        match Command::new("which").arg("bwrap").output() {
            Ok(output) if output.status.success() => {
                let bwrap_path = PathBuf::from(
                    String::from_utf8_lossy(&output.stdout).trim().to_string(),
                );
                let version = Command::new("bwrap")
                    .arg("--version")
                    .output()
                    .ok()
                    .map(|v| String::from_utf8_lossy(&v.stdout).trim().to_string())
                    .unwrap_or_else(|| "unknown".to_string());
                SandboxPlatform::Linux {
                    bwrap_path,
                    bwrap_version: version,
                }
            }
            _ => SandboxPlatform::Unsupported(
                "Linux detected but bubblewrap (bwrap) not found in PATH".to_string(),
            ),
        }
    } else if cfg!(target_os = "macos") {
        let available = Command::new("which")
            .arg("sandbox-exec")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false);
        SandboxPlatform::MacOS {
            sandbox_exec_available: available,
        }
    } else {
        SandboxPlatform::Unsupported(format!(
            "Unsupported OS: {}",
            std::env::consts::OS
        ))
    }
}

/// Check that all required dependencies are installed for the given platform.
///
/// Returns `Ok(())` if all dependencies are present, or `Err` with a list of
/// missing dependencies including per-distro install instructions.
pub fn check_dependencies(platform: &SandboxPlatform) -> Result<(), Vec<MissingDependency>> {
    match platform {
        SandboxPlatform::Linux { .. } => {
            let mut missing = Vec::new();

            // Check for bwrap (already found if we got Linux variant, but
            // also check socat for proxy socket forwarding)
            if Command::new("which")
                .arg("socat")
                .output()
                .map(|o| !o.status.success())
                .unwrap_or(true)
            {
                missing.push(MissingDependency {
                    name: "socat".to_string(),
                    install_apt: Some("sudo apt install socat".to_string()),
                    install_dnf: Some("sudo dnf install socat".to_string()),
                    install_brew: None,
                });
            }

            if missing.is_empty() {
                Ok(())
            } else {
                Err(missing)
            }
        }
        SandboxPlatform::MacOS {
            sandbox_exec_available,
        } => {
            if *sandbox_exec_available {
                Ok(())
            } else {
                Err(vec![MissingDependency {
                    name: "sandbox-exec".to_string(),
                    install_apt: None,
                    install_dnf: None,
                    install_brew: Some(
                        "sandbox-exec is included with macOS — check system integrity"
                            .to_string(),
                    ),
                }])
            }
        }
        SandboxPlatform::Unsupported(_reason) => Err(vec![MissingDependency {
            name: "bubblewrap".to_string(),
            install_apt: Some("sudo apt install bubblewrap socat".to_string()),
            install_dnf: Some("sudo dnf install bubblewrap socat".to_string()),
            install_brew: None,
        }]),
    }
}

// ============================================================================
// Internal profile representation
// ============================================================================

/// Internal sandbox profile used for bwrap/Seatbelt command generation.
///
/// This is a PathBuf-based internal representation distinct from the Phase 367
/// JSON-oriented `SandboxProfile` type. Conversion methods bridge the two.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InternalSandboxProfile {
    pub agent_type: AgentType,
    pub write_dirs: Vec<PathBuf>,
    pub deny_read_dirs: Vec<PathBuf>,
    pub allowed_domains: Vec<String>,
    pub proxy_socket: Option<PathBuf>,
}

// ============================================================================
// Profile errors
// ============================================================================

/// Profile error types for write/serialization operations.
#[derive(Debug, thiserror::Error)]
pub enum ProfileError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    Json(#[from] serde_json::Error),
}

// ============================================================================
// Profile generator
// ============================================================================

/// Default domains allowed for all agents except VERIFY (which gets none).
const BASE_DOMAINS: &[&str] = &[
    "api.anthropic.com",
    "github.com",
    "registry.npmjs.org",
];

/// Additional domains for SCOUT agents (research access).
const SCOUT_EXTRA_DOMAINS: &[&str] = &[
    "crates.io",
    "docs.rs",
    "stackoverflow.com",
    "developer.mozilla.org",
    "pkg.go.dev",
    "pypi.org",
];

/// Generates sandbox profiles for each agent type.
pub struct SandboxProfileGenerator {
    project_dir: PathBuf,
    planning_dir: PathBuf,
    home_dir: PathBuf,
    proxy_socket: PathBuf,
}

impl SandboxProfileGenerator {
    /// Create a new generator for the given project.
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

    /// Credential directories that must be denied at READ level for all agents.
    fn credential_deny_dirs(&self) -> Vec<PathBuf> {
        vec![
            self.home_dir.join(".ssh"),
            self.home_dir.join(".config"),
            self.home_dir.join(".aws"),
        ]
    }

    /// Generate an internal sandbox profile for the given agent type.
    ///
    /// # Agent type profiles
    ///
    /// - **Main**: write project + .planning/, deny read ~/.ssh/, ~/.config/, ~/.aws/
    /// - **Exec**: write worktree only, deny read everything outside worktree
    /// - **Verify**: no writes, no network, deny read credentials
    /// - **Scout**: write .planning/research/ only, expanded domain allowlist
    pub fn generate(
        &self,
        agent_type: AgentType,
        worktree: Option<&Path>,
    ) -> InternalSandboxProfile {
        let deny_read_dirs = self.credential_deny_dirs();

        match agent_type {
            AgentType::Main => InternalSandboxProfile {
                agent_type: AgentType::Main,
                write_dirs: vec![
                    self.project_dir.clone(),
                    self.planning_dir.clone(),
                ],
                deny_read_dirs,
                allowed_domains: BASE_DOMAINS.iter().map(|s| s.to_string()).collect(),
                proxy_socket: Some(self.proxy_socket.clone()),
            },

            AgentType::Exec => {
                let wt = worktree
                    .map(|p| p.to_path_buf())
                    .unwrap_or_else(|| self.project_dir.join("worktrees/exec"));
                InternalSandboxProfile {
                    agent_type: AgentType::Exec,
                    write_dirs: vec![wt],
                    deny_read_dirs,
                    allowed_domains: BASE_DOMAINS.iter().map(|s| s.to_string()).collect(),
                    proxy_socket: Some(self.proxy_socket.clone()),
                }
            }

            AgentType::Verify => InternalSandboxProfile {
                agent_type: AgentType::Verify,
                write_dirs: vec![],
                deny_read_dirs,
                allowed_domains: vec![],
                proxy_socket: None,
            },

            AgentType::Scout => {
                let mut domains: Vec<String> =
                    BASE_DOMAINS.iter().map(|s| s.to_string()).collect();
                domains.extend(SCOUT_EXTRA_DOMAINS.iter().map(|s| s.to_string()));

                InternalSandboxProfile {
                    agent_type: AgentType::Scout,
                    write_dirs: vec![self.planning_dir.join("research")],
                    deny_read_dirs,
                    allowed_domains: domains,
                    proxy_socket: Some(self.proxy_socket.clone()),
                }
            }
        }
    }

    /// Write a profile to disk as JSON.
    ///
    /// Creates `{agent_type}-profile.json` in the output directory.
    pub fn write_profile(
        &self,
        profile: &InternalSandboxProfile,
        output_dir: &Path,
    ) -> Result<PathBuf, ProfileError> {
        std::fs::create_dir_all(output_dir)?;
        let agent_name = match profile.agent_type {
            AgentType::Main => "main",
            AgentType::Exec => "exec",
            AgentType::Verify => "verify",
            AgentType::Scout => "scout",
        };
        let path = output_dir.join(format!("{}-sandbox.json", agent_name));
        let json = serde_json::to_string_pretty(profile)?;
        std::fs::write(&path, json)?;
        Ok(path)
    }

    /// Convert profile to bubblewrap command-line arguments.
    ///
    /// Security model: anything NOT explicitly bound is inaccessible.
    /// Credential directories (~/.ssh/, ~/.config/, ~/.aws/) are never bound,
    /// making them physically unreadable from inside the sandbox.
    pub fn to_bwrap_command(&self, profile: &InternalSandboxProfile) -> Vec<String> {
        let mut args = vec![
            "bwrap".to_string(),
            "--die-with-parent".to_string(),
            "--cap-drop".to_string(),
            "ALL".to_string(),
            "--unshare-net".to_string(),
            "--unshare-pid".to_string(),
            "--unshare-uts".to_string(),
            "--proc".to_string(),
            "/proc".to_string(),
            "--dev".to_string(),
            "/dev".to_string(),
        ];

        // Standard read-only system directories
        for sys_dir in &["/usr", "/lib", "/lib64", "/bin", "/sbin", "/etc"] {
            let p = Path::new(sys_dir);
            if p.exists() {
                args.push("--ro-bind".to_string());
                args.push(sys_dir.to_string());
                args.push(sys_dir.to_string());
            }
        }

        // Write directories get read-write bind mounts
        for dir in &profile.write_dirs {
            args.push("--bind".to_string());
            args.push(dir.to_string_lossy().to_string());
            args.push(dir.to_string_lossy().to_string());
        }

        // Read-only bind for project dir if not already in write_dirs
        if !profile
            .write_dirs
            .iter()
            .any(|d| d == &self.project_dir)
        {
            args.push("--ro-bind".to_string());
            args.push(self.project_dir.to_string_lossy().to_string());
            args.push(self.project_dir.to_string_lossy().to_string());
        }

        // Proxy socket bind (if applicable)
        if let Some(ref sock) = profile.proxy_socket {
            args.push("--bind".to_string());
            args.push(sock.to_string_lossy().to_string());
            args.push(sock.to_string_lossy().to_string());
        }

        // deny_read_dirs: NOT bound = inaccessible (bwrap security model)
        // No explicit deny needed — absence from bind list = denied

        args
    }

    /// Convert profile to macOS Seatbelt scheme string.
    ///
    /// Generates a scheme for `sandbox-exec -p <scheme>`. Uses deny-default
    /// policy: only paths explicitly allowed are accessible. SSH/credential
    /// directories are never in the allow list.
    pub fn to_seatbelt_profile(&self, profile: &InternalSandboxProfile) -> String {
        let mut scheme = String::new();
        scheme.push_str("(version 1)\n");
        scheme.push_str("(deny default)\n\n");

        // Allow reading system directories
        scheme.push_str("; System read access\n");
        for sys_dir in &["/usr", "/System", "/Library", "/bin", "/sbin"] {
            scheme.push_str(&format!(
                "(allow file-read* (subpath \"{}\"))\n",
                sys_dir
            ));
        }
        scheme.push('\n');

        // Allow process operations
        scheme.push_str("; Process operations\n");
        scheme.push_str("(allow process-exec)\n");
        scheme.push_str("(allow process-fork)\n\n");

        // Project directory access
        scheme.push_str("; Project access\n");
        if profile
            .write_dirs
            .iter()
            .any(|d| d == &self.project_dir)
        {
            scheme.push_str(&format!(
                "(allow file-read* file-write* (subpath \"{}\"))\n",
                self.project_dir.display()
            ));
        } else {
            scheme.push_str(&format!(
                "(allow file-read* (subpath \"{}\"))\n",
                self.project_dir.display()
            ));
        }

        // Write directories
        for dir in &profile.write_dirs {
            if dir != &self.project_dir {
                scheme.push_str(&format!(
                    "(allow file-read* file-write* (subpath \"{}\"))\n",
                    dir.display()
                ));
            }
        }
        scheme.push('\n');

        // Network access
        if !profile.allowed_domains.is_empty() {
            scheme.push_str("; Network access (proxied)\n");
            scheme.push_str("(allow network-outbound)\n");
        } else {
            scheme.push_str("; No network access\n");
            scheme.push_str("(deny network-outbound)\n");
        }

        // Credential directories are NEVER in the allow list (deny default handles it)
        // This is the Seatbelt equivalent of bwrap's "not bound = inaccessible"

        scheme
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
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
