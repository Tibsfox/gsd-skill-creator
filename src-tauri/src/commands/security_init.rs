//! Tauri IPC command for initializing the .planning/security/ directory.
//!
//! Mirrors the TypeScript `securityInitCommand` from
//! `src/commands/security-init.ts`. Creates the directory structure,
//! template files, README, and schemas.json with proper permissions.
//!
//! Idempotent: safe to call multiple times. Existing files are not
//! overwritten. Directories are created with mode 0700 (owner only).

use serde::Serialize;
use std::fs;
use std::path::Path;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

/// Response payload returned to the webview after initialization.
#[derive(Debug, Serialize)]
pub struct SecurityInitResponse {
    pub success: bool,
    pub message: String,
    pub created_dirs: Vec<String>,
}

/// Initialize the .planning/security/ directory structure.
///
/// Creates all required directories and template files for the security
/// subsystem. Idempotent: existing files are not overwritten.
///
/// # Arguments
///
/// * `project_root` - Absolute path to the project root directory
///
/// # Returns
///
/// A `SecurityInitResponse` with details of what was created.
#[tauri::command]
pub async fn init_security_directory(
    project_root: String,
) -> Result<SecurityInitResponse, String> {
    let root = Path::new(&project_root);
    if !root.exists() {
        return Err("Cannot determine project root".to_string());
    }

    let security_dir = root.join(".planning").join("security");
    let events_dir = security_dir.join("events");
    let blocked_dir = security_dir.join("blocked");

    let mut created_dirs: Vec<String> = Vec::new();

    // Create directory structure
    for dir in [&security_dir, &events_dir, &blocked_dir] {
        ensure_secure_dir(dir).map_err(|e| {
            format!(
                "Permission denied creating security directory: {}",
                e
            )
        })?;
        created_dirs.push(dir.display().to_string());
    }

    // Write template files (idempotent)
    write_if_missing(&security_dir.join("README.md"), readme_content())
        .map_err(|e| format!("Failed to write README.md: {}", e))?;

    write_if_missing(&security_dir.join("schemas.json"), schemas_json())
        .map_err(|e| format!("Failed to write schemas.json: {}", e))?;

    write_if_missing(
        &security_dir.join("sandbox-profile.json"),
        sandbox_profile_template(),
    )
    .map_err(|e| format!("Failed to write sandbox-profile.json: {}", e))?;

    write_if_missing(
        &security_dir.join("proxy-config.json"),
        proxy_config_template(),
    )
    .map_err(|e| format!("Failed to write proxy-config.json: {}", e))?;

    write_if_missing(
        &security_dir.join("domain-allowlist.json"),
        domain_allowlist_template(),
    )
    .map_err(|e| format!("Failed to write domain-allowlist.json: {}", e))?;

    Ok(SecurityInitResponse {
        success: true,
        message: "Security directory initialized".to_string(),
        created_dirs,
    })
}

/// Create a directory with mode 0700 if it does not exist.
fn ensure_secure_dir(dir: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dir)?;

    #[cfg(unix)]
    {
        let perms = fs::Permissions::from_mode(0o700);
        fs::set_permissions(dir, perms)?;
    }

    Ok(())
}

/// Write a file only if it does not already exist.
fn write_if_missing(path: &Path, content: String) -> std::io::Result<()> {
    if path.exists() {
        return Ok(());
    }
    fs::write(path, content)
}

// ---------------------------------------------------------------------------
// Template content
// ---------------------------------------------------------------------------

fn readme_content() -> String {
    r#"# Security Directory Contract

This directory contains all runtime security state for the GSD-OS SSH Agent
Security system (v1.38). Every security subsystem writes structured data here
following the contracts defined below.

## Directory Structure

```
.planning/security/
├── sandbox-profile.json        <- Sandbox Configurator writes (Phase 368)
├── proxy-config.json           <- Credential Proxy reads (Phase 369)
├── domain-allowlist.json       <- User configures, proxy reads
├── schemas.json                <- JSON Schema definitions for all types
├── README.md                   <- This file
├── events/                     <- All security components write
│   └── YYYY-MM-DD.jsonl        <- Append-only event log
└── blocked/                    <- Proxy writes blocked requests
    └── [timestamp]-[domain].json
```

## Event Log Format (JSONL)

Security events are written to `events/YYYY-MM-DD.jsonl` in newline-delimited
JSON (JSONL) format. Each line is a complete JSON object representing one
SecurityEvent:

```json
{"id":"evt-uuid","timestamp":"2026-02-26T10:30:45Z","severity":"info","source":"proxy","event_type":"request_blocked","detail":{"domain":"api.unauthorized.com","reason":"not in allowlist"}}
```

**Append-only semantics:** Events are only appended, never modified or deleted.
Log rotation is the user's responsibility. Each day gets a new file.

## Sandbox Profile

Written by the Sandbox Configurator (Phase 368). Read by the bootstrap
script (Phase 373) before any agent process starts.

## Proxy Configuration

Written by the setup wizard or CLI. Read by the Credential Proxy (Phase 369)
at startup and on SIGHUP (config reload without restart).

**SECURITY INVARIANT:** `log_credentials` is always `false`. No configuration
change can enable credential logging.

## Domain Allowlist

User-editable file listing domains the proxy will forward requests to.

## Blocked Requests

Written by the proxy when a request is blocked. Each blocked request gets
its own JSON file named `[ISO-timestamp]-[domain].json`.

Blocked requests can be reviewed but not released by agents.

## File Permissions

| Path                        | Mode | Meaning                  |
|-----------------------------|------|--------------------------|
| .planning/security/         | 0700 | Owner read+write+execute |
| .planning/security/events/  | 0700 | Owner read+write+execute |
| .planning/security/blocked/ | 0700 | Owner read+write+execute |
| proxy socket file           | 0600 | Owner read+write only    |

## Initialization

Run via Tauri IPC:
```typescript
await invoke('init_security_directory', { projectRoot: '/path/to/project' });
```

## Warnings

- **Credentials never stored in this directory** (proxy runs outside sandbox)
- **Event log is append-only;** rotation is user's responsibility
- **Blocked requests can be reviewed but not released by agents**
- **Proxy config is read at startup and on SIGHUP**
"#
    .to_string()
}

fn schemas_json() -> String {
    serde_json::to_string_pretty(&serde_json::json!({
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "GSD-OS Security Schemas",
        "description": "JSON Schema definitions for all security data structures written to .planning/security/",
        "definitions": {
            "SecurityEvent": {
                "type": "object",
                "required": ["id", "timestamp", "severity", "source", "event_type", "detail"],
                "properties": {
                    "id": { "type": "string" },
                    "timestamp": { "type": "string", "format": "date-time" },
                    "severity": { "type": "string", "enum": ["info", "warning", "critical", "blocked"] },
                    "source": { "type": "string", "enum": ["sandbox", "proxy", "staging", "agent-isolation"] },
                    "event_type": { "type": "string" },
                    "detail": { "type": "object", "additionalProperties": true }
                },
                "additionalProperties": false
            },
            "SandboxProfile": {
                "type": "object",
                "required": ["agent_id", "agent_type", "filesystem", "network"],
                "properties": {
                    "agent_id": { "type": "string" },
                    "agent_type": { "type": "string", "enum": ["exec", "verify", "scout", "main"] },
                    "filesystem": {
                        "type": "object",
                        "required": ["write_dirs", "deny_read"],
                        "properties": {
                            "write_dirs": { "type": "array", "items": { "type": "string" } },
                            "deny_read": { "type": "array", "items": { "type": "string" } }
                        },
                        "additionalProperties": false
                    },
                    "network": {
                        "type": "object",
                        "required": ["allowed_domains", "proxy_socket"],
                        "properties": {
                            "allowed_domains": { "type": "array", "items": { "$ref": "#/definitions/DomainCredential" } },
                            "proxy_socket": { "type": "string" }
                        },
                        "additionalProperties": false
                    },
                    "worktree_path": { "type": "string" }
                },
                "additionalProperties": false
            },
            "ProxyConfig": {
                "type": "object",
                "required": ["socket_path", "allowed_domains", "log_requests", "log_credentials"],
                "properties": {
                    "socket_path": { "type": "string" },
                    "allowed_domains": { "type": "array", "items": { "$ref": "#/definitions/DomainCredential" } },
                    "log_requests": { "type": "boolean" },
                    "log_credentials": { "type": "boolean", "const": false }
                },
                "additionalProperties": false
            },
            "DomainCredential": {
                "type": "object",
                "required": ["domain", "credential_type", "credential_source"],
                "properties": {
                    "domain": { "type": "string" },
                    "credential_type": { "type": "string", "enum": ["api_key_header", "ssh_agent", "bearer_token", "basic_auth"] },
                    "credential_source": { "type": "string", "enum": ["keychain", "env", "file"] },
                    "header_name": { "type": "string" }
                },
                "additionalProperties": false
            },
            "AgentIsolationState": {
                "type": "object",
                "required": ["agent_id", "agent_type", "worktree_path", "sandbox_profile", "status", "created_at"],
                "properties": {
                    "agent_id": { "type": "string" },
                    "agent_type": { "type": "string", "enum": ["exec", "verify", "scout", "main"] },
                    "worktree_path": { "type": "string" },
                    "sandbox_profile": { "$ref": "#/definitions/SandboxProfile" },
                    "status": { "type": "string" },
                    "created_at": { "type": "string", "format": "date-time" }
                },
                "additionalProperties": false
            },
            "BlockedRequest": {
                "type": "object",
                "required": ["timestamp", "domain", "agent_id", "reason"],
                "properties": {
                    "timestamp": { "type": "string", "format": "date-time" },
                    "domain": { "type": "string" },
                    "agent_id": { "type": "string" },
                    "reason": { "type": "string" },
                    "status_code": { "type": ["integer", "null"] }
                },
                "additionalProperties": false
            }
        }
    }))
    .unwrap()
        + "\n"
}

fn sandbox_profile_template() -> String {
    serde_json::to_string_pretty(&serde_json::json!({
        "agent_id": "main",
        "agent_type": "main",
        "filesystem": {
            "write_dirs": [],
            "deny_read": []
        },
        "network": {
            "allowed_domains": [],
            "proxy_socket": "/tmp/security-proxy.sock"
        }
    }))
    .unwrap()
        + "\n"
}

fn proxy_config_template() -> String {
    serde_json::to_string_pretty(&serde_json::json!({
        "socket_path": "/tmp/security-proxy.sock",
        "allowed_domains": [],
        "log_requests": true,
        "log_credentials": false
    }))
    .unwrap()
        + "\n"
}

fn domain_allowlist_template() -> String {
    serde_json::to_string_pretty(&serde_json::json!({
        "allowed_domains": [
            "api.anthropic.com",
            "github.com",
            "registry.npmjs.org"
        ]
    }))
    .unwrap()
        + "\n"
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_init_creates_directories() {
        let tmp = tempdir().unwrap();
        let root = tmp.path().to_str().unwrap().to_string();

        let result = init_security_directory(root.clone()).await;
        assert!(result.is_ok());

        let resp = result.unwrap();
        assert!(resp.success);
        assert_eq!(resp.created_dirs.len(), 3);

        let security_dir = PathBuf::from(&root)
            .join(".planning")
            .join("security");
        assert!(security_dir.exists());
        assert!(security_dir.join("events").exists());
        assert!(security_dir.join("blocked").exists());
    }

    #[tokio::test]
    async fn test_init_creates_template_files() {
        let tmp = tempdir().unwrap();
        let root = tmp.path().to_str().unwrap().to_string();

        init_security_directory(root.clone()).await.unwrap();

        let security_dir = PathBuf::from(&root)
            .join(".planning")
            .join("security");

        assert!(security_dir.join("README.md").exists());
        assert!(security_dir.join("schemas.json").exists());
        assert!(security_dir.join("sandbox-profile.json").exists());
        assert!(security_dir.join("proxy-config.json").exists());
        assert!(security_dir.join("domain-allowlist.json").exists());
    }

    #[tokio::test]
    async fn test_init_schemas_json_valid() {
        let tmp = tempdir().unwrap();
        let root = tmp.path().to_str().unwrap().to_string();

        init_security_directory(root.clone()).await.unwrap();

        let schemas_path = PathBuf::from(&root)
            .join(".planning")
            .join("security")
            .join("schemas.json");
        let content = fs::read_to_string(schemas_path).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&content).unwrap();

        let defs = parsed.get("definitions").unwrap().as_object().unwrap();
        assert_eq!(defs.len(), 6);
    }

    #[tokio::test]
    async fn test_init_is_idempotent() {
        let tmp = tempdir().unwrap();
        let root = tmp.path().to_str().unwrap().to_string();

        let result1 = init_security_directory(root.clone()).await;
        assert!(result1.is_ok());

        let result2 = init_security_directory(root.clone()).await;
        assert!(result2.is_ok());
    }

    #[tokio::test]
    async fn test_init_readme_has_keywords() {
        let tmp = tempdir().unwrap();
        let root = tmp.path().to_str().unwrap().to_string();

        init_security_directory(root.clone()).await.unwrap();

        let readme_path = PathBuf::from(&root)
            .join(".planning")
            .join("security")
            .join("README.md");
        let content = fs::read_to_string(readme_path).unwrap();

        assert!(content.contains("JSONL"));
        assert!(content.contains("Append-only"));
    }

    #[cfg(unix)]
    #[tokio::test]
    async fn test_init_directory_permissions() {
        let tmp = tempdir().unwrap();
        let root = tmp.path().to_str().unwrap().to_string();

        init_security_directory(root.clone()).await.unwrap();

        let security_dir = PathBuf::from(&root)
            .join(".planning")
            .join("security");
        let metadata = fs::metadata(&security_dir).unwrap();
        let mode = metadata.permissions().mode() & 0o777;
        assert_eq!(mode, 0o700);
    }

    #[tokio::test]
    async fn test_init_invalid_root() {
        let result =
            init_security_directory("/nonexistent/path/that/does/not/exist".to_string())
                .await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_domain_allowlist_defaults() {
        let tmp = tempdir().unwrap();
        let root = tmp.path().to_str().unwrap().to_string();

        init_security_directory(root.clone()).await.unwrap();

        let path = PathBuf::from(&root)
            .join(".planning")
            .join("security")
            .join("domain-allowlist.json");
        let content = fs::read_to_string(path).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&content).unwrap();

        let domains = parsed
            .get("allowed_domains")
            .unwrap()
            .as_array()
            .unwrap();
        let domain_strs: Vec<&str> =
            domains.iter().map(|d| d.as_str().unwrap()).collect();
        assert!(domain_strs.contains(&"api.anthropic.com"));
        assert!(domain_strs.contains(&"github.com"));
        assert!(domain_strs.contains(&"registry.npmjs.org"));
    }
}
