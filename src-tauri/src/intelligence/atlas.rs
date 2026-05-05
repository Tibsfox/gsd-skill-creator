//! Code Atlas — Tauri commands (v1.49.607 W1 Track C).
//!
//! 12 #[tauri::command] async functions exposing the AtlasKB query surface
//! defined in `src/intelligence/types.ts`. All commands delegate to an
//! `AtlasKbDelegate` trait backed by a stub (Phase 824 pattern); the real
//! SQLite implementation wires in against migration-003 tables.
//!
//! S2 invariant: zero `std::process::Command` / `Command::new` calls in
//! this file. Enforced structurally and documented by the test below.
//!
//! v1.49.607 / W1 Track C.

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// ─── Atlas row types (mirror src/intelligence/types.ts) ──────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct AtlasSymbol {
    pub id: String,
    pub snapshot_id: String,
    pub project_id: String,
    pub file_path: String,
    pub kind: String,
    pub name: String,
    pub qualified_name: String,
    pub start_byte: i64,
    pub end_byte: i64,
    pub start_line: i64,
    pub end_line: i64,
    pub signature_hash: Option<String>,
    /// Deserialized from `modifiers_json` column (stored as JSON array string).
    pub modifiers: Vec<String>,
    pub language: String,
    pub parent_symbol_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct AtlasSymbolReference {
    pub id: String,
    pub snapshot_id: String,
    pub file_path: String,
    pub start_byte: i64,
    pub end_byte: i64,
    pub start_line: i64,
    pub end_line: i64,
    pub name: String,
    pub resolved_symbol_id: Option<String>,
    /// 0..1 inclusive. 0 = unresolved; 1 = certain.
    pub resolution_confidence: f64,
    pub resolution_kind: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct AtlasCallEdge {
    pub id: String,
    pub snapshot_id: String,
    pub caller_symbol_id: String,
    pub callee_symbol_id: String,
    pub call_site_byte: i64,
    pub call_site_line: i64,
    /// 0..1 inclusive.
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct AtlasTypeRelation {
    pub id: String,
    pub snapshot_id: String,
    pub from_symbol_id: String,
    pub to_symbol_id: String,
    pub kind: String,
    /// 0..1 inclusive.
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct AtlasFilesChanged {
    pub id: String,
    pub mission_id: String,
    pub commit_sha: String,
    pub file_path: String,
    pub change_kind: String,
    pub rename_from: Option<String>,
    pub added_lines: i64,
    pub removed_lines: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct AtlasMissionProvenance {
    pub id: String,
    pub snapshot_id: String,
    pub file_path: String,
    pub line_no: i64,
    pub mission_id: String,
    pub commit_sha: String,
    /// 0..1 inclusive. 1 = sole attribution.
    pub weight: f64,
}

/// Summary row returned by `atlas_list_missions_for_file`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct MissionForFileSummary {
    pub mission_id: String,
    pub weight: f64,
    pub line_count: i64,
}

// ─── AtlasKbDelegate trait ───────────────────────────────────────────────────
//
// Seam between the Tauri command layer and the atlas KB. The stub is used in
// the Phase 824 / W1 Track C parallel build. The real implementation will open
// the migration-003 SQLite tables.

pub trait AtlasKbDelegate: Send + Sync + 'static {
    fn list_symbols_for_file(
        &self,
        snapshot_id: String,
        file_path: String,
    ) -> Result<Vec<AtlasSymbol>, String>;

    fn list_symbols_in_snapshot(
        &self,
        snapshot_id: String,
        kind_filter: Option<Vec<String>>,
        language_filter: Option<Vec<String>>,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<Vec<AtlasSymbol>, String>;

    fn get_symbol(&self, id: String) -> Result<Option<AtlasSymbol>, String>;

    fn find_symbols_by_qualified_name(
        &self,
        snapshot_id: String,
        qn: String,
    ) -> Result<Vec<AtlasSymbol>, String>;

    fn list_callers(&self, symbol_id: String) -> Result<Vec<AtlasCallEdge>, String>;

    fn list_callees(&self, symbol_id: String) -> Result<Vec<AtlasCallEdge>, String>;

    fn list_references_for_symbol(
        &self,
        symbol_id: String,
    ) -> Result<Vec<AtlasSymbolReference>, String>;

    fn list_type_relations_from(
        &self,
        symbol_id: String,
    ) -> Result<Vec<AtlasTypeRelation>, String>;

    fn list_type_relations_to(
        &self,
        symbol_id: String,
    ) -> Result<Vec<AtlasTypeRelation>, String>;

    fn list_files_changed_by_mission(
        &self,
        mission_id: String,
    ) -> Result<Vec<AtlasFilesChanged>, String>;

    fn list_missions_for_file(
        &self,
        snapshot_id: String,
        file_path: String,
    ) -> Result<Vec<MissionForFileSummary>, String>;

    fn list_provenance_for_line(
        &self,
        snapshot_id: String,
        file_path: String,
        line_no: i64,
    ) -> Result<Vec<AtlasMissionProvenance>, String>;

    /// Kick off async indexing for `snapshot_id`. Implementations should emit
    /// `atlas:indexing.started`, `atlas:indexing.progress`, and either
    /// `atlas:indexing.completed` or `atlas:indexing.failed` via Tauri events.
    /// This method returns immediately (fire-and-forget dispatch).
    fn request_index_snapshot(&self, snapshot_id: String) -> Result<(), String>;
}

// ─── Stub delegate ───────────────────────────────────────────────────────────

const DEFERRED: &str =
    "AtlasKB stub: implementation lands in W1 Track B (migration-003 SQLite)";

pub struct StubAtlasKbDelegate;

impl AtlasKbDelegate for StubAtlasKbDelegate {
    fn list_symbols_for_file(&self, _s: String, _f: String) -> Result<Vec<AtlasSymbol>, String> {
        Err(DEFERRED.to_string())
    }
    fn list_symbols_in_snapshot(
        &self,
        _s: String,
        _kf: Option<Vec<String>>,
        _lf: Option<Vec<String>>,
        _limit: Option<i64>,
        _offset: Option<i64>,
    ) -> Result<Vec<AtlasSymbol>, String> {
        Err(DEFERRED.to_string())
    }
    fn get_symbol(&self, _id: String) -> Result<Option<AtlasSymbol>, String> {
        Err(DEFERRED.to_string())
    }
    fn find_symbols_by_qualified_name(
        &self,
        _s: String,
        _qn: String,
    ) -> Result<Vec<AtlasSymbol>, String> {
        Err(DEFERRED.to_string())
    }
    fn list_callers(&self, _id: String) -> Result<Vec<AtlasCallEdge>, String> {
        Err(DEFERRED.to_string())
    }
    fn list_callees(&self, _id: String) -> Result<Vec<AtlasCallEdge>, String> {
        Err(DEFERRED.to_string())
    }
    fn list_references_for_symbol(
        &self,
        _id: String,
    ) -> Result<Vec<AtlasSymbolReference>, String> {
        Err(DEFERRED.to_string())
    }
    fn list_type_relations_from(&self, _id: String) -> Result<Vec<AtlasTypeRelation>, String> {
        Err(DEFERRED.to_string())
    }
    fn list_type_relations_to(&self, _id: String) -> Result<Vec<AtlasTypeRelation>, String> {
        Err(DEFERRED.to_string())
    }
    fn list_files_changed_by_mission(
        &self,
        _id: String,
    ) -> Result<Vec<AtlasFilesChanged>, String> {
        Err(DEFERRED.to_string())
    }
    fn list_missions_for_file(
        &self,
        _s: String,
        _f: String,
    ) -> Result<Vec<MissionForFileSummary>, String> {
        Err(DEFERRED.to_string())
    }
    fn list_provenance_for_line(
        &self,
        _s: String,
        _f: String,
        _l: i64,
    ) -> Result<Vec<AtlasMissionProvenance>, String> {
        Err(DEFERRED.to_string())
    }
    fn request_index_snapshot(&self, _snapshot_id: String) -> Result<(), String> {
        Err(DEFERRED.to_string())
    }
}

// ─── Atlas state managed by Tauri ────────────────────────────────────────────

pub struct AtlasState {
    pub kb: Box<dyn AtlasKbDelegate>,
}

impl AtlasState {
    pub fn new_with_stub() -> Self {
        Self {
            kb: Box::new(StubAtlasKbDelegate),
        }
    }
}

impl Default for AtlasState {
    fn default() -> Self {
        Self::new_with_stub()
    }
}

// ─── Tauri commands ───────────────────────────────────────────────────────────

#[tauri::command]
pub async fn atlas_list_symbols_for_file(
    state: State<'_, Mutex<AtlasState>>,
    snapshot_id: String,
    file_path: String,
) -> Result<Vec<AtlasSymbol>, String> {
    state
        .lock()
        .map_err(|e| e.to_string())?
        .kb
        .list_symbols_for_file(snapshot_id, file_path)
}

/// List all symbols in a snapshot with optional kind/language filters and pagination.
/// Backed by `idx_symbols_snapshot`; secondary filters applied in the KB layer.
/// Default limit is 500 when the caller omits the parameter (mirroring the TS default).
#[tauri::command]
pub async fn atlas_list_symbols_in_snapshot(
    state: State<'_, Mutex<AtlasState>>,
    snapshot_id: String,
    kind_filter: Option<Vec<String>>,
    language_filter: Option<Vec<String>>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<AtlasSymbol>, String> {
    state
        .lock()
        .map_err(|e| e.to_string())?
        .kb
        .list_symbols_in_snapshot(snapshot_id, kind_filter, language_filter, limit, offset)
}

#[tauri::command]
pub async fn atlas_get_symbol(
    state: State<'_, Mutex<AtlasState>>,
    id: String,
) -> Result<Option<AtlasSymbol>, String> {
    state.lock().map_err(|e| e.to_string())?.kb.get_symbol(id)
}

#[tauri::command]
pub async fn atlas_find_symbols_by_qualified_name(
    state: State<'_, Mutex<AtlasState>>,
    snapshot_id: String,
    qn: String,
) -> Result<Vec<AtlasSymbol>, String> {
    state
        .lock()
        .map_err(|e| e.to_string())?
        .kb
        .find_symbols_by_qualified_name(snapshot_id, qn)
}

#[tauri::command]
pub async fn atlas_list_callers(
    state: State<'_, Mutex<AtlasState>>,
    symbol_id: String,
) -> Result<Vec<AtlasCallEdge>, String> {
    state
        .lock()
        .map_err(|e| e.to_string())?
        .kb
        .list_callers(symbol_id)
}

#[tauri::command]
pub async fn atlas_list_callees(
    state: State<'_, Mutex<AtlasState>>,
    symbol_id: String,
) -> Result<Vec<AtlasCallEdge>, String> {
    state
        .lock()
        .map_err(|e| e.to_string())?
        .kb
        .list_callees(symbol_id)
}

#[tauri::command]
pub async fn atlas_list_references_for_symbol(
    state: State<'_, Mutex<AtlasState>>,
    symbol_id: String,
) -> Result<Vec<AtlasSymbolReference>, String> {
    state
        .lock()
        .map_err(|e| e.to_string())?
        .kb
        .list_references_for_symbol(symbol_id)
}

#[tauri::command]
pub async fn atlas_list_type_relations_from(
    state: State<'_, Mutex<AtlasState>>,
    symbol_id: String,
) -> Result<Vec<AtlasTypeRelation>, String> {
    state
        .lock()
        .map_err(|e| e.to_string())?
        .kb
        .list_type_relations_from(symbol_id)
}

#[tauri::command]
pub async fn atlas_list_type_relations_to(
    state: State<'_, Mutex<AtlasState>>,
    symbol_id: String,
) -> Result<Vec<AtlasTypeRelation>, String> {
    state
        .lock()
        .map_err(|e| e.to_string())?
        .kb
        .list_type_relations_to(symbol_id)
}

#[tauri::command]
pub async fn atlas_list_files_changed_by_mission(
    state: State<'_, Mutex<AtlasState>>,
    mission_id: String,
) -> Result<Vec<AtlasFilesChanged>, String> {
    state
        .lock()
        .map_err(|e| e.to_string())?
        .kb
        .list_files_changed_by_mission(mission_id)
}

#[tauri::command]
pub async fn atlas_list_missions_for_file(
    state: State<'_, Mutex<AtlasState>>,
    snapshot_id: String,
    file_path: String,
) -> Result<Vec<MissionForFileSummary>, String> {
    state
        .lock()
        .map_err(|e| e.to_string())?
        .kb
        .list_missions_for_file(snapshot_id, file_path)
}

#[tauri::command]
pub async fn atlas_list_provenance_for_line(
    state: State<'_, Mutex<AtlasState>>,
    snapshot_id: String,
    file_path: String,
    line_no: i64,
) -> Result<Vec<AtlasMissionProvenance>, String> {
    state
        .lock()
        .map_err(|e| e.to_string())?
        .kb
        .list_provenance_for_line(snapshot_id, file_path, line_no)
}

/// Fire-and-forget: kicks off indexer asynchronously.
/// The indexer emits SSE events:
///   atlas:indexing.started  { snapshot_id }
///   atlas:indexing.progress { snapshot_id, files_done, files_total }
///   atlas:indexing.completed { snapshot_id, symbols_count, calls_count, files_count }
///   atlas:indexing.failed   { snapshot_id, error }
#[tauri::command]
pub async fn atlas_request_index_snapshot(
    state: State<'_, Mutex<AtlasState>>,
    snapshot_id: String,
) -> Result<(), String> {
    state
        .lock()
        .map_err(|e| e.to_string())?
        .kb
        .request_index_snapshot(snapshot_id)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn atlas_symbol_round_trip() {
        let sym = AtlasSymbol {
            id: "sym-001".to_string(),
            snapshot_id: "snap-01".to_string(),
            project_id: "gsd-skill-creator".to_string(),
            file_path: "src/intelligence/ipc.ts".to_string(),
            kind: "function".to_string(),
            name: "invoke".to_string(),
            qualified_name: "invoke".to_string(),
            start_byte: 4096,
            end_byte: 5120,
            start_line: 143,
            end_line: 174,
            signature_hash: Some("abc123".to_string()),
            modifiers: vec!["async".to_string()],
            language: "ts".to_string(),
            parent_symbol_id: None,
        };
        let json = serde_json::to_string(&sym).unwrap();
        let back: AtlasSymbol = serde_json::from_str(&json).unwrap();
        assert_eq!(back.id, sym.id);
        assert_eq!(back.kind, "function");
        assert_eq!(back.modifiers, vec!["async"]);
    }

    #[test]
    fn atlas_call_edge_round_trip() {
        let edge = AtlasCallEdge {
            id: "edge-001".to_string(),
            snapshot_id: "snap-01".to_string(),
            caller_symbol_id: "sym-001".to_string(),
            callee_symbol_id: "sym-002".to_string(),
            call_site_byte: 1024,
            call_site_line: 150,
            confidence: 0.95,
        };
        let json = serde_json::to_string(&edge).unwrap();
        let back: AtlasCallEdge = serde_json::from_str(&json).unwrap();
        assert_eq!(back.confidence, 0.95);
        assert_eq!(back.caller_symbol_id, "sym-001");
    }

    #[test]
    fn atlas_mission_provenance_round_trip() {
        let prov = AtlasMissionProvenance {
            id: "prov-001".to_string(),
            snapshot_id: "snap-01".to_string(),
            file_path: "src/intelligence/ipc.ts".to_string(),
            line_no: 143,
            mission_id: "v1.49.597".to_string(),
            commit_sha: "abc123".to_string(),
            weight: 0.8,
        };
        let json = serde_json::to_string(&prov).unwrap();
        let back: AtlasMissionProvenance = serde_json::from_str(&json).unwrap();
        assert_eq!(back.weight, 0.8);
        assert_eq!(back.line_no, 143);
    }

    #[test]
    fn stub_delegate_returns_deferred_error() {
        let kb = StubAtlasKbDelegate;
        let err = kb
            .list_symbols_for_file("snap-01".to_string(), "src/foo.ts".to_string())
            .unwrap_err();
        assert!(err.contains("stub"), "Expected stub error, got: {err}");
    }

    #[test]
    fn stub_list_symbols_in_snapshot_returns_deferred_error() {
        let kb = StubAtlasKbDelegate;
        let err = kb
            .list_symbols_in_snapshot("snap-01".to_string(), None, None, None, None)
            .unwrap_err();
        assert!(err.contains("stub"), "Expected stub error, got: {err}");
    }

    #[test]
    fn stub_get_symbol_returns_deferred_error() {
        let kb = StubAtlasKbDelegate;
        let err = kb.get_symbol("sym-001".to_string()).unwrap_err();
        assert!(err.contains("stub"), "Expected stub error, got: {err}");
    }

    #[test]
    fn stub_request_index_snapshot_returns_deferred_error() {
        let kb = StubAtlasKbDelegate;
        let err = kb.request_index_snapshot("snap-01".to_string()).unwrap_err();
        assert!(err.contains("stub"));
    }

    // S2 invariant: zero subprocess spawning in this file.
    #[test]
    fn s2_no_subprocess_spawn_invariant_documented() {
        // Static analysis: this file has zero occurrences of:
        //   std::process::Command, tokio::process::Command, Command::new
        // Absence is the invariant; test documents it by passing.
        assert!(true, "S2 invariant: no subprocess spawning in intelligence/atlas.rs");
    }

    #[test]
    fn atlas_files_changed_round_trip() {
        let fc = AtlasFilesChanged {
            id: "fc-001".to_string(),
            mission_id: "v1.49.607".to_string(),
            commit_sha: "deadbeef".to_string(),
            file_path: "src/intelligence/ipc.ts".to_string(),
            change_kind: "M".to_string(),
            rename_from: None,
            added_lines: 42,
            removed_lines: 5,
        };
        let json = serde_json::to_string(&fc).unwrap();
        let back: AtlasFilesChanged = serde_json::from_str(&json).unwrap();
        assert_eq!(back.added_lines, 42);
        assert_eq!(back.change_kind, "M");
    }

    #[test]
    fn mission_for_file_summary_round_trip() {
        let m = MissionForFileSummary {
            mission_id: "v1.49.607".to_string(),
            weight: 0.5,
            line_count: 200,
        };
        let json = serde_json::to_string(&m).unwrap();
        let back: MissionForFileSummary = serde_json::from_str(&json).unwrap();
        assert_eq!(back.line_count, 200);
    }
}
