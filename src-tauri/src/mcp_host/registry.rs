//! Server config persistence for the MCP host manager.
//!
//! `ServerRegistry` persists server configurations, trust state, and health
//! metadata to a JSON file (~/.gsd/mcp-servers.json), surviving app restarts.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

use super::security::TrustState;
use super::types::TransportConfig;

// ============================================================================
// ServerRegistryEntry
// ============================================================================

/// A persisted server configuration with trust and health metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerRegistryEntry {
    pub id: String,
    pub config: TransportConfig,
    pub auto_connect: bool,
    pub trust_state: TrustState,
    pub enabled: bool,
    pub added_at: u64,
    pub last_connected: Option<u64>,
}

// ============================================================================
// ServerRegistry
// ============================================================================

/// Persists server configurations and trust state to a JSON file.
///
/// Configurations survive Tauri app restarts. Quarantine state is preserved
/// across save/load cycles -- a previously-quarantined server remains
/// quarantined after restart.
pub struct ServerRegistry {
    entries: HashMap<String, ServerRegistryEntry>,
    config_path: PathBuf,
}

impl ServerRegistry {
    /// Creates a new registry targeting the given config file path.
    pub fn new(config_path: PathBuf) -> Self {
        Self {
            entries: HashMap::new(),
            config_path,
        }
    }

    /// Returns the default config path: `~/.gsd/mcp-servers.json`.
    pub fn default_path() -> PathBuf {
        dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(".gsd")
            .join("mcp-servers.json")
    }

    /// Loads server configs from the JSON file.
    ///
    /// If the file doesn't exist, starts with an empty registry (not an error).
    /// If the file exists but is malformed, returns an error.
    pub async fn load(&mut self) -> Result<(), String> {
        if !self.config_path.exists() {
            self.entries.clear();
            return Ok(());
        }

        let contents = tokio::fs::read_to_string(&self.config_path)
            .await
            .map_err(|e| format!("Failed to read config file: {}", e))?;

        let entries: Vec<ServerRegistryEntry> = serde_json::from_str(&contents)
            .map_err(|e| format!("Failed to parse config file: {}", e))?;

        self.entries.clear();
        for entry in entries {
            self.entries.insert(entry.id.clone(), entry);
        }

        Ok(())
    }

    /// Saves server configs to the JSON file.
    ///
    /// Creates the parent directory if needed. Writes atomically via temp file
    /// then rename to prevent corruption on crash.
    pub async fn save(&self) -> Result<(), String> {
        if let Some(parent) = self.config_path.parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .map_err(|e| format!("Failed to create config directory: {}", e))?;
        }

        let entries: Vec<&ServerRegistryEntry> = self.entries.values().collect();
        let contents = serde_json::to_string_pretty(&entries)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;

        // Write to temp file then rename for atomic write
        let tmp_path = self.config_path.with_extension("json.tmp");
        tokio::fs::write(&tmp_path, &contents)
            .await
            .map_err(|e| format!("Failed to write temp config file: {}", e))?;

        tokio::fs::rename(&tmp_path, &self.config_path)
            .await
            .map_err(|e| format!("Failed to rename config file: {}", e))?;

        Ok(())
    }

    /// Adds or replaces a server entry.
    pub fn add(&mut self, entry: ServerRegistryEntry) {
        self.entries.insert(entry.id.clone(), entry);
    }

    /// Removes and returns a server entry.
    pub fn remove(&mut self, id: &str) -> Option<ServerRegistryEntry> {
        self.entries.remove(id)
    }

    /// Returns a reference to a server entry.
    pub fn get(&self, id: &str) -> Option<&ServerRegistryEntry> {
        self.entries.get(id)
    }

    /// Returns a mutable reference to a server entry.
    pub fn get_mut(&mut self, id: &str) -> Option<&mut ServerRegistryEntry> {
        self.entries.get_mut(id)
    }

    /// Returns all entries as references.
    pub fn list(&self) -> Vec<&ServerRegistryEntry> {
        self.entries.values().collect()
    }

    /// Returns entries configured for auto-connect (auto_connect=true AND enabled=true).
    pub fn auto_connect_entries(&self) -> Vec<&ServerRegistryEntry> {
        self.entries
            .values()
            .filter(|e| e.auto_connect && e.enabled)
            .collect()
    }

    /// Updates the trust state for a server entry.
    ///
    /// Quarantine state persists through save/load cycles -- this is how a
    /// previously-quarantined server remains quarantined after restart.
    pub fn set_trust_state(&mut self, id: &str, state: TrustState) {
        if let Some(entry) = self.entries.get_mut(id) {
            entry.trust_state = state;
        }
    }

    /// Returns the number of entries.
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// Returns true if the registry is empty.
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Returns the config file path.
    pub fn config_path(&self) -> &PathBuf {
        &self.config_path
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    fn make_entry(id: &str, auto_connect: bool, enabled: bool) -> ServerRegistryEntry {
        ServerRegistryEntry {
            id: id.to_string(),
            config: TransportConfig::Stdio {
                command: "node".to_string(),
                args: vec!["server.js".to_string()],
                env: HashMap::new(),
            },
            auto_connect,
            trust_state: TrustState::Quarantine,
            enabled,
            added_at: 1700000000,
            last_connected: None,
        }
    }

    #[test]
    fn default_path_ends_with_mcp_servers() {
        let path = ServerRegistry::default_path();
        assert!(path.to_str().unwrap().ends_with("mcp-servers.json"));
        assert!(path.to_str().unwrap().contains(".gsd"));
    }

    #[test]
    fn add_and_get_entry() {
        let mut registry = ServerRegistry::new(PathBuf::from("/tmp/test-registry.json"));
        let entry = make_entry("server-1", true, true);
        registry.add(entry);

        let found = registry.get("server-1");
        assert!(found.is_some());
        assert_eq!(found.unwrap().id, "server-1");
        assert_eq!(registry.len(), 1);
    }

    #[test]
    fn remove_entry() {
        let mut registry = ServerRegistry::new(PathBuf::from("/tmp/test-registry.json"));
        registry.add(make_entry("server-1", true, true));
        assert_eq!(registry.len(), 1);

        let removed = registry.remove("server-1");
        assert!(removed.is_some());
        assert!(registry.get("server-1").is_none());
        assert_eq!(registry.len(), 0);
    }

    #[test]
    fn auto_connect_filters_correctly() {
        let mut registry = ServerRegistry::new(PathBuf::from("/tmp/test-registry.json"));
        registry.add(make_entry("auto-enabled", true, true));
        registry.add(make_entry("auto-disabled", true, false));
        registry.add(make_entry("manual-enabled", false, true));
        registry.add(make_entry("manual-disabled", false, false));

        let auto = registry.auto_connect_entries();
        assert_eq!(auto.len(), 1);
        assert_eq!(auto[0].id, "auto-enabled");
    }

    #[test]
    fn quarantine_persists() {
        let mut registry = ServerRegistry::new(PathBuf::from("/tmp/test-registry.json"));
        let mut entry = make_entry("server-1", true, true);
        entry.trust_state = TrustState::Trusted;
        registry.add(entry);

        // Set to quarantine
        registry.set_trust_state("server-1", TrustState::Quarantine);

        // Verify quarantine persists
        let found = registry.get("server-1").unwrap();
        assert_eq!(found.trust_state, TrustState::Quarantine);
    }

    #[test]
    fn list_returns_all_entries() {
        let mut registry = ServerRegistry::new(PathBuf::from("/tmp/test-registry.json"));
        registry.add(make_entry("server-1", true, true));
        registry.add(make_entry("server-2", false, true));

        let all = registry.list();
        assert_eq!(all.len(), 2);
    }

    #[test]
    fn is_empty_checks() {
        let mut registry = ServerRegistry::new(PathBuf::from("/tmp/test-registry.json"));
        assert!(registry.is_empty());
        registry.add(make_entry("server-1", true, true));
        assert!(!registry.is_empty());
    }

    #[test]
    fn entry_serializes_camel_case() {
        let entry = make_entry("test-server", true, true);
        let json = serde_json::to_string(&entry).unwrap();
        assert!(json.contains("\"autoConnect\""));
        assert!(json.contains("\"trustState\""));
        assert!(json.contains("\"addedAt\""));
        assert!(json.contains("\"lastConnected\""));
        assert!(!json.contains("auto_connect"));
    }
}
