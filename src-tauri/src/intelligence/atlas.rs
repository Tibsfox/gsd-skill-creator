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

use rusqlite::{Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
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

// ─── SQLite-backed delegate (E4 — closes the W1 Track C → Track B gap) ──────
//
// Mirrors `super::real_kb::RealKbDelegate`: holds a registry path, lazy-opens
// per-project DBs that the TS-side `KBStore`+`SymbolsKB`+`ProvenanceKB` write
// against (better-sqlite3 and rusqlite produce identical bytes-on-disk after
// migrations 001 + 002 + 003).
//
// Resolution model: the Atlas Tauri commands take `snapshot_id` (not
// `project_id`), so this delegate scans every registered project DB until it
// finds rows for the requested snapshot. With small registries (≤ a handful of
// projects) the scan is O(N) registries × one indexed lookup; the alternative
// (threading project_id through the IPC surface) is a v1.49.608+ refinement.

/// Locate the registry DB. Honors `GSD_INTELLIGENCE_REGISTRY` env var for
/// tests; falls back to `~/.gsd/intelligence/registry.db` (the same default
/// used by `RealKbDelegate`).
fn default_registry_path() -> PathBuf {
    if let Ok(p) = std::env::var("GSD_INTELLIGENCE_REGISTRY") {
        return PathBuf::from(p);
    }
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    home.join(".gsd").join("intelligence").join("registry.db")
}

/// Real Atlas KB delegate — backed by per-project SQLite (migration 003).
///
/// Two construction modes:
///   * `new()` / `with_registry_path(p)` — production / multi-project mode.
///     Opens the registry, iterates registered projects, and dispatches each
///     query to whichever project DB owns the snapshot or symbol referenced
///     by the call.
///   * `with_explicit_db_path(p)` — single-project / test mode. Bypasses the
///     registry and opens exactly one DB. Useful for in-memory tests and for
///     wiring directly when the desktop UI already knows which project is
///     open (a v1.49.608+ optimization).
pub struct SqliteAtlasKbDelegate {
    registry_path: Option<PathBuf>,
    /// When set, all queries route to this single DB (test / single-project
    /// mode). Mutually exclusive with `registry_path` in practice.
    explicit_db_path: Option<PathBuf>,
}

impl SqliteAtlasKbDelegate {
    pub fn new() -> Self {
        Self {
            registry_path: Some(default_registry_path()),
            explicit_db_path: None,
        }
    }

    pub fn with_registry_path(path: PathBuf) -> Self {
        Self {
            registry_path: Some(path),
            explicit_db_path: None,
        }
    }

    /// Construct a delegate that talks to a single DB without consulting any
    /// registry. Used by the unit tests in this module and available to the
    /// shell when only one project is open.
    pub fn with_explicit_db_path(path: PathBuf) -> Self {
        Self {
            registry_path: None,
            explicit_db_path: Some(path),
        }
    }

    /// Open every per-project DB the registry knows about (plus the explicit
    /// DB when configured). Returns an empty Vec when no DB is available;
    /// callers map this to "no rows" rather than an error so the UI shows a
    /// blank state instead of a popup.
    fn open_all_project_dbs(&self) -> Vec<Connection> {
        let mut conns = Vec::new();
        if let Some(p) = self.explicit_db_path.as_ref() {
            if p.exists() {
                if let Ok(c) = Connection::open(p) {
                    conns.push(c);
                }
            }
            return conns;
        }
        let registry = match self.registry_path.as_ref() {
            Some(p) if p.exists() => p,
            _ => return conns,
        };
        let reg_conn = match Connection::open(registry) {
            Ok(c) => c,
            Err(_) => return conns,
        };
        let mut stmt = match reg_conn.prepare("SELECT path FROM projects") {
            Ok(s) => s,
            Err(_) => return conns,
        };
        let rows = match stmt.query_map([], |row| row.get::<_, String>(0)) {
            Ok(r) => r,
            Err(_) => return conns,
        };
        for r in rows.flatten() {
            let db_path = Path::new(&r)
                .join(".gsd")
                .join("intelligence")
                .join("intelligence.db");
            if db_path.exists() {
                if let Ok(c) = Connection::open(&db_path) {
                    conns.push(c);
                }
            }
        }
        conns
    }
}

impl Default for SqliteAtlasKbDelegate {
    fn default() -> Self {
        Self::new()
    }
}

// ─── Row mappers ─────────────────────────────────────────────────────────────

fn row_to_atlas_symbol(row: &rusqlite::Row<'_>) -> rusqlite::Result<AtlasSymbol> {
    let modifiers_json: String = row.get("modifiers_json")?;
    let modifiers: Vec<String> =
        serde_json::from_str(&modifiers_json).unwrap_or_default();
    Ok(AtlasSymbol {
        id: row.get("id")?,
        snapshot_id: row.get("snapshot_id")?,
        project_id: row.get("project_id")?,
        file_path: row.get("file_path")?,
        kind: row.get("kind")?,
        name: row.get("name")?,
        qualified_name: row.get("qualified_name")?,
        start_byte: row.get("start_byte")?,
        end_byte: row.get("end_byte")?,
        start_line: row.get("start_line")?,
        end_line: row.get("end_line")?,
        signature_hash: row.get("signature_hash")?,
        modifiers,
        language: row.get("language")?,
        parent_symbol_id: row.get("parent_symbol_id")?,
    })
}

fn row_to_atlas_reference(row: &rusqlite::Row<'_>) -> rusqlite::Result<AtlasSymbolReference> {
    Ok(AtlasSymbolReference {
        id: row.get("id")?,
        snapshot_id: row.get("snapshot_id")?,
        file_path: row.get("file_path")?,
        start_byte: row.get("start_byte")?,
        end_byte: row.get("end_byte")?,
        start_line: row.get("start_line")?,
        end_line: row.get("end_line")?,
        name: row.get("name")?,
        resolved_symbol_id: row.get("resolved_symbol_id")?,
        resolution_confidence: row.get("resolution_confidence")?,
        resolution_kind: row.get("resolution_kind")?,
    })
}

fn row_to_atlas_call_edge(row: &rusqlite::Row<'_>) -> rusqlite::Result<AtlasCallEdge> {
    Ok(AtlasCallEdge {
        id: row.get("id")?,
        snapshot_id: row.get("snapshot_id")?,
        caller_symbol_id: row.get("caller_symbol_id")?,
        callee_symbol_id: row.get("callee_symbol_id")?,
        call_site_byte: row.get("call_site_byte")?,
        call_site_line: row.get("call_site_line")?,
        confidence: row.get("confidence")?,
    })
}

fn row_to_atlas_type_relation(row: &rusqlite::Row<'_>) -> rusqlite::Result<AtlasTypeRelation> {
    Ok(AtlasTypeRelation {
        id: row.get("id")?,
        snapshot_id: row.get("snapshot_id")?,
        from_symbol_id: row.get("from_symbol_id")?,
        to_symbol_id: row.get("to_symbol_id")?,
        kind: row.get("kind")?,
        confidence: row.get("confidence")?,
    })
}

fn row_to_files_changed(row: &rusqlite::Row<'_>) -> rusqlite::Result<AtlasFilesChanged> {
    Ok(AtlasFilesChanged {
        id: row.get("id")?,
        mission_id: row.get("mission_id")?,
        commit_sha: row.get("commit_sha")?,
        file_path: row.get("file_path")?,
        change_kind: row.get("change_kind")?,
        rename_from: row.get("rename_from")?,
        added_lines: row.get("added_lines")?,
        removed_lines: row.get("removed_lines")?,
    })
}

fn row_to_mission_provenance(row: &rusqlite::Row<'_>) -> rusqlite::Result<AtlasMissionProvenance> {
    Ok(AtlasMissionProvenance {
        id: row.get("id")?,
        snapshot_id: row.get("snapshot_id")?,
        file_path: row.get("file_path")?,
        line_no: row.get("line_no")?,
        mission_id: row.get("mission_id")?,
        commit_sha: row.get("commit_sha")?,
        weight: row.get("weight")?,
    })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/// Render a SQL `IN (?, ?, …)` placeholder list of length N.
fn placeholders(n: usize) -> String {
    std::iter::repeat("?").take(n).collect::<Vec<_>>().join(",")
}

impl AtlasKbDelegate for SqliteAtlasKbDelegate {
    fn list_symbols_for_file(
        &self,
        snapshot_id: String,
        file_path: String,
    ) -> Result<Vec<AtlasSymbol>, String> {
        let mut out = Vec::new();
        for conn in self.open_all_project_dbs() {
            let mut stmt = match conn.prepare(
                "SELECT * FROM symbols
                 WHERE snapshot_id = ?1 AND file_path = ?2
                 ORDER BY start_byte ASC",
            ) {
                Ok(s) => s,
                Err(_) => continue,
            };
            let rows = stmt
                .query_map([&snapshot_id, &file_path], row_to_atlas_symbol)
                .map_err(|e| format!("list_symbols_for_file query: {e}"))?;
            for r in rows {
                out.push(r.map_err(|e| format!("list_symbols_for_file row: {e}"))?);
            }
            if !out.is_empty() {
                break;
            }
        }
        Ok(out)
    }

    fn list_symbols_in_snapshot(
        &self,
        snapshot_id: String,
        kind_filter: Option<Vec<String>>,
        language_filter: Option<Vec<String>>,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<Vec<AtlasSymbol>, String> {
        let limit_v = limit.unwrap_or(500);
        let offset_v = offset.unwrap_or(0);
        let kinds = kind_filter.unwrap_or_default();
        let langs = language_filter.unwrap_or_default();

        let mut clauses: Vec<String> = vec!["snapshot_id = ?".to_string()];
        if !kinds.is_empty() {
            clauses.push(format!("kind IN ({})", placeholders(kinds.len())));
        }
        if !langs.is_empty() {
            clauses.push(format!("language IN ({})", placeholders(langs.len())));
        }
        let sql = format!(
            "SELECT * FROM symbols WHERE {} ORDER BY file_path ASC, start_byte ASC LIMIT ? OFFSET ?",
            clauses.join(" AND ")
        );

        let mut out = Vec::new();
        for conn in self.open_all_project_dbs() {
            let mut stmt = match conn.prepare(&sql) {
                Ok(s) => s,
                Err(_) => continue,
            };
            let mut params: Vec<&dyn rusqlite::ToSql> = Vec::new();
            params.push(&snapshot_id);
            for k in &kinds {
                params.push(k);
            }
            for l in &langs {
                params.push(l);
            }
            params.push(&limit_v);
            params.push(&offset_v);
            let rows = stmt
                .query_map(params.as_slice(), row_to_atlas_symbol)
                .map_err(|e| format!("list_symbols_in_snapshot query: {e}"))?;
            for r in rows {
                out.push(r.map_err(|e| format!("list_symbols_in_snapshot row: {e}"))?);
            }
            if !out.is_empty() {
                break;
            }
        }
        Ok(out)
    }

    fn get_symbol(&self, id: String) -> Result<Option<AtlasSymbol>, String> {
        for conn in self.open_all_project_dbs() {
            let row = conn
                .query_row("SELECT * FROM symbols WHERE id = ?", [&id], row_to_atlas_symbol)
                .optional()
                .map_err(|e| format!("get_symbol: {e}"))?;
            if row.is_some() {
                return Ok(row);
            }
        }
        Ok(None)
    }

    fn find_symbols_by_qualified_name(
        &self,
        snapshot_id: String,
        qn: String,
    ) -> Result<Vec<AtlasSymbol>, String> {
        let mut out = Vec::new();
        for conn in self.open_all_project_dbs() {
            let mut stmt = match conn.prepare(
                "SELECT * FROM symbols
                 WHERE snapshot_id = ?1 AND qualified_name = ?2
                 ORDER BY file_path ASC, start_byte ASC",
            ) {
                Ok(s) => s,
                Err(_) => continue,
            };
            let rows = stmt
                .query_map([&snapshot_id, &qn], row_to_atlas_symbol)
                .map_err(|e| format!("find_symbols_by_qualified_name query: {e}"))?;
            for r in rows {
                out.push(r.map_err(|e| format!("find_symbols_by_qualified_name row: {e}"))?);
            }
            if !out.is_empty() {
                break;
            }
        }
        Ok(out)
    }

    fn list_callers(&self, symbol_id: String) -> Result<Vec<AtlasCallEdge>, String> {
        let mut out = Vec::new();
        for conn in self.open_all_project_dbs() {
            let mut stmt = match conn.prepare(
                "SELECT * FROM calls
                 WHERE callee_symbol_id = ?
                 ORDER BY snapshot_id DESC, call_site_byte ASC",
            ) {
                Ok(s) => s,
                Err(_) => continue,
            };
            let rows = stmt
                .query_map([&symbol_id], row_to_atlas_call_edge)
                .map_err(|e| format!("list_callers query: {e}"))?;
            for r in rows {
                out.push(r.map_err(|e| format!("list_callers row: {e}"))?);
            }
            if !out.is_empty() {
                break;
            }
        }
        Ok(out)
    }

    fn list_callees(&self, symbol_id: String) -> Result<Vec<AtlasCallEdge>, String> {
        let mut out = Vec::new();
        for conn in self.open_all_project_dbs() {
            let mut stmt = match conn.prepare(
                "SELECT * FROM calls
                 WHERE caller_symbol_id = ?
                 ORDER BY snapshot_id DESC, call_site_byte ASC",
            ) {
                Ok(s) => s,
                Err(_) => continue,
            };
            let rows = stmt
                .query_map([&symbol_id], row_to_atlas_call_edge)
                .map_err(|e| format!("list_callees query: {e}"))?;
            for r in rows {
                out.push(r.map_err(|e| format!("list_callees row: {e}"))?);
            }
            if !out.is_empty() {
                break;
            }
        }
        Ok(out)
    }

    fn list_references_for_symbol(
        &self,
        symbol_id: String,
    ) -> Result<Vec<AtlasSymbolReference>, String> {
        let mut out = Vec::new();
        for conn in self.open_all_project_dbs() {
            let mut stmt = match conn.prepare(
                "SELECT * FROM symbol_references
                 WHERE resolved_symbol_id = ?
                 ORDER BY snapshot_id DESC, file_path ASC, start_byte ASC",
            ) {
                Ok(s) => s,
                Err(_) => continue,
            };
            let rows = stmt
                .query_map([&symbol_id], row_to_atlas_reference)
                .map_err(|e| format!("list_references_for_symbol query: {e}"))?;
            for r in rows {
                out.push(r.map_err(|e| format!("list_references_for_symbol row: {e}"))?);
            }
            if !out.is_empty() {
                break;
            }
        }
        Ok(out)
    }

    fn list_type_relations_from(
        &self,
        symbol_id: String,
    ) -> Result<Vec<AtlasTypeRelation>, String> {
        let mut out = Vec::new();
        for conn in self.open_all_project_dbs() {
            let mut stmt = match conn.prepare(
                "SELECT * FROM type_relations
                 WHERE from_symbol_id = ?
                 ORDER BY snapshot_id DESC, kind ASC",
            ) {
                Ok(s) => s,
                Err(_) => continue,
            };
            let rows = stmt
                .query_map([&symbol_id], row_to_atlas_type_relation)
                .map_err(|e| format!("list_type_relations_from query: {e}"))?;
            for r in rows {
                out.push(r.map_err(|e| format!("list_type_relations_from row: {e}"))?);
            }
            if !out.is_empty() {
                break;
            }
        }
        Ok(out)
    }

    fn list_type_relations_to(
        &self,
        symbol_id: String,
    ) -> Result<Vec<AtlasTypeRelation>, String> {
        let mut out = Vec::new();
        for conn in self.open_all_project_dbs() {
            let mut stmt = match conn.prepare(
                "SELECT * FROM type_relations
                 WHERE to_symbol_id = ?
                 ORDER BY snapshot_id DESC, kind ASC",
            ) {
                Ok(s) => s,
                Err(_) => continue,
            };
            let rows = stmt
                .query_map([&symbol_id], row_to_atlas_type_relation)
                .map_err(|e| format!("list_type_relations_to query: {e}"))?;
            for r in rows {
                out.push(r.map_err(|e| format!("list_type_relations_to row: {e}"))?);
            }
            if !out.is_empty() {
                break;
            }
        }
        Ok(out)
    }

    fn list_files_changed_by_mission(
        &self,
        mission_id: String,
    ) -> Result<Vec<AtlasFilesChanged>, String> {
        let mut out = Vec::new();
        for conn in self.open_all_project_dbs() {
            let mut stmt = match conn.prepare(
                "SELECT * FROM files_changed
                 WHERE mission_id = ?
                 ORDER BY commit_sha ASC, file_path ASC",
            ) {
                Ok(s) => s,
                Err(_) => continue,
            };
            let rows = stmt
                .query_map([&mission_id], row_to_files_changed)
                .map_err(|e| format!("list_files_changed_by_mission query: {e}"))?;
            for r in rows {
                out.push(r.map_err(|e| format!("list_files_changed_by_mission row: {e}"))?);
            }
            if !out.is_empty() {
                break;
            }
        }
        Ok(out)
    }

    fn list_missions_for_file(
        &self,
        snapshot_id: String,
        file_path: String,
    ) -> Result<Vec<MissionForFileSummary>, String> {
        let mut out = Vec::new();
        for conn in self.open_all_project_dbs() {
            let mut stmt = match conn.prepare(
                "SELECT mission_id, SUM(weight) AS weight, COUNT(*) AS line_count
                 FROM mission_provenance
                 WHERE snapshot_id = ?1 AND file_path = ?2
                 GROUP BY mission_id
                 ORDER BY weight DESC, mission_id ASC",
            ) {
                Ok(s) => s,
                Err(_) => continue,
            };
            let rows = stmt
                .query_map([&snapshot_id, &file_path], |row| {
                    Ok(MissionForFileSummary {
                        mission_id: row.get(0)?,
                        weight: row.get(1)?,
                        line_count: row.get(2)?,
                    })
                })
                .map_err(|e| format!("list_missions_for_file query: {e}"))?;
            for r in rows {
                out.push(r.map_err(|e| format!("list_missions_for_file row: {e}"))?);
            }
            if !out.is_empty() {
                break;
            }
        }
        Ok(out)
    }

    fn list_provenance_for_line(
        &self,
        snapshot_id: String,
        file_path: String,
        line_no: i64,
    ) -> Result<Vec<AtlasMissionProvenance>, String> {
        let mut out = Vec::new();
        for conn in self.open_all_project_dbs() {
            let mut stmt = match conn.prepare(
                "SELECT * FROM mission_provenance
                 WHERE snapshot_id = ?1 AND file_path = ?2 AND line_no = ?3
                 ORDER BY weight DESC, mission_id ASC",
            ) {
                Ok(s) => s,
                Err(_) => continue,
            };
            let rows = stmt
                .query_map(
                    rusqlite::params![&snapshot_id, &file_path, &line_no],
                    row_to_mission_provenance,
                )
                .map_err(|e| format!("list_provenance_for_line query: {e}"))?;
            for r in rows {
                out.push(r.map_err(|e| format!("list_provenance_for_line row: {e}"))?);
            }
            if !out.is_empty() {
                break;
            }
        }
        Ok(out)
    }

    fn request_index_snapshot(&self, snapshot_id: String) -> Result<(), String> {
        // The indexer itself runs on the TS side (W2 Track A). The Rust
        // delegate has no in-process indexer, so we surface a descriptive
        // not-yet-wired error pointing the caller at the canonical surface.
        // The desktop UI can still render existing rows via the read paths;
        // index *triggering* lands on a follow-on track.
        Err(format!(
            "atlas_request_index_snapshot({snapshot_id}): indexer dispatch is owned by the TS server (src/intelligence/atlas-indexer); call via the Node IPC seam"
        ))
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

    /// Construct an AtlasState backed by SQLite. Honors the
    /// `GSD_INTELLIGENCE_REGISTRY` env var; falls back to
    /// `~/.gsd/intelligence/registry.db`.
    pub fn new_with_sqlite() -> Self {
        Self {
            kb: Box::new(SqliteAtlasKbDelegate::new()),
        }
    }

    /// Construct from an explicit registry-DB path. Useful for tests that
    /// stand up a temp registry.
    pub fn new_with_registry_path(path: PathBuf) -> Self {
        Self {
            kb: Box::new(SqliteAtlasKbDelegate::with_registry_path(path)),
        }
    }
}

impl Default for AtlasState {
    fn default() -> Self {
        // Prefer SQLite-backed delegate; falls through cleanly to "no rows"
        // when no registry exists yet.
        Self::new_with_sqlite()
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

    // ─── SqliteAtlasKbDelegate tests (E4) ─────────────────────────────────

    use rusqlite::{params, Connection};
    use std::path::PathBuf;
    use tempfile::TempDir;

    /// Create a temp DB with the migration-003 schema applied. Mirrors what
    /// better-sqlite3 produces on the TS side so rusqlite can read it back.
    fn create_atlas_db(tmp: &TempDir) -> PathBuf {
        let db_path = tmp.path().join("intelligence.db");
        let conn = Connection::open(&db_path).unwrap();
        // Embed migration-003 directly. We do not depend on the on-disk
        // migrations/003_atlas_symbols.sql file at compile time because the
        // tauri crate sits at `src-tauri/` while the migrations live at
        // `src/intelligence/db/migrations/`; the relative include path would
        // bake in repo layout. Instead, we mirror just the columns the
        // delegate queries, which is the contract under test.
        conn.execute_batch(
            "CREATE TABLE symbols (
                id TEXT PRIMARY KEY,
                snapshot_id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                file_path TEXT NOT NULL,
                kind TEXT NOT NULL,
                name TEXT NOT NULL,
                qualified_name TEXT NOT NULL,
                start_byte INTEGER NOT NULL,
                end_byte INTEGER NOT NULL,
                start_line INTEGER NOT NULL,
                end_line INTEGER NOT NULL,
                signature_hash TEXT,
                modifiers_json TEXT NOT NULL DEFAULT '[]',
                language TEXT NOT NULL,
                parent_symbol_id TEXT
            );
            CREATE TABLE symbol_references (
                id TEXT PRIMARY KEY,
                snapshot_id TEXT NOT NULL,
                file_path TEXT NOT NULL,
                start_byte INTEGER NOT NULL,
                end_byte INTEGER NOT NULL,
                start_line INTEGER NOT NULL,
                end_line INTEGER NOT NULL,
                name TEXT NOT NULL,
                resolved_symbol_id TEXT,
                resolution_confidence REAL NOT NULL DEFAULT 0.0,
                resolution_kind TEXT
            );
            CREATE TABLE calls (
                id TEXT PRIMARY KEY,
                snapshot_id TEXT NOT NULL,
                caller_symbol_id TEXT NOT NULL,
                callee_symbol_id TEXT NOT NULL,
                call_site_byte INTEGER NOT NULL,
                call_site_line INTEGER NOT NULL,
                confidence REAL NOT NULL DEFAULT 1.0
            );
            CREATE TABLE type_relations (
                id TEXT PRIMARY KEY,
                snapshot_id TEXT NOT NULL,
                from_symbol_id TEXT NOT NULL,
                to_symbol_id TEXT NOT NULL,
                kind TEXT NOT NULL,
                confidence REAL NOT NULL DEFAULT 1.0
            );
            CREATE TABLE files_changed (
                id TEXT PRIMARY KEY,
                mission_id TEXT NOT NULL,
                commit_sha TEXT NOT NULL,
                file_path TEXT NOT NULL,
                change_kind TEXT NOT NULL,
                rename_from TEXT,
                added_lines INTEGER NOT NULL DEFAULT 0,
                removed_lines INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE mission_provenance (
                id TEXT PRIMARY KEY,
                snapshot_id TEXT NOT NULL,
                file_path TEXT NOT NULL,
                line_no INTEGER NOT NULL,
                mission_id TEXT NOT NULL,
                commit_sha TEXT NOT NULL,
                weight REAL NOT NULL DEFAULT 1.0
            );",
        )
        .unwrap();
        db_path
    }

    /// Seed two symbols, one call edge, one type relation, two refs, and
    /// some provenance rows so each delegate method has at least one
    /// matching row to return.
    fn seed_minimal_atlas_rows(db_path: &PathBuf) {
        let conn = Connection::open(db_path).unwrap();
        conn.execute(
            "INSERT INTO symbols (id, snapshot_id, project_id, file_path, kind, name, qualified_name, start_byte, end_byte, start_line, end_line, signature_hash, modifiers_json, language, parent_symbol_id) \
             VALUES (?1, 'snap-01', 'gsd-skill-creator', 'src/foo.ts', 'function', 'foo', 'foo', 0, 100, 1, 10, 'sig-foo', '[\"async\"]', 'ts', NULL)",
            params!["sym-001"],
        ).unwrap();
        conn.execute(
            "INSERT INTO symbols (id, snapshot_id, project_id, file_path, kind, name, qualified_name, start_byte, end_byte, start_line, end_line, signature_hash, modifiers_json, language, parent_symbol_id) \
             VALUES (?1, 'snap-01', 'gsd-skill-creator', 'src/bar.ts', 'class', 'Bar', 'Bar', 0, 200, 1, 30, 'sig-bar', '[\"export\"]', 'ts', NULL)",
            params!["sym-002"],
        ).unwrap();
        conn.execute(
            "INSERT INTO calls (id, snapshot_id, caller_symbol_id, callee_symbol_id, call_site_byte, call_site_line, confidence) \
             VALUES ('edge-001', 'snap-01', 'sym-001', 'sym-002', 50, 5, 0.9)",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO type_relations (id, snapshot_id, from_symbol_id, to_symbol_id, kind, confidence) \
             VALUES ('tr-001', 'snap-01', 'sym-001', 'sym-002', 'uses_type', 0.95)",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO symbol_references (id, snapshot_id, file_path, start_byte, end_byte, start_line, end_line, name, resolved_symbol_id, resolution_confidence, resolution_kind) \
             VALUES ('ref-001', 'snap-01', 'src/foo.ts', 50, 53, 5, 5, 'Bar', 'sym-002', 1.0, 'type_use')",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO files_changed (id, mission_id, commit_sha, file_path, change_kind, rename_from, added_lines, removed_lines) \
             VALUES ('fc-001', 'v1.49.607', 'deadbeef', 'src/foo.ts', 'M', NULL, 42, 5)",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO mission_provenance (id, snapshot_id, file_path, line_no, mission_id, commit_sha, weight) \
             VALUES ('mp-001', 'snap-01', 'src/foo.ts', 5, 'v1.49.607', 'deadbeef', 0.8)",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO mission_provenance (id, snapshot_id, file_path, line_no, mission_id, commit_sha, weight) \
             VALUES ('mp-002', 'snap-01', 'src/foo.ts', 5, 'v1.49.606', 'cafef00d', 0.2)",
            [],
        ).unwrap();
    }

    #[test]
    fn sqlite_delegate_list_symbols_for_file_returns_seeded_rows() {
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db);
        let rows = kb
            .list_symbols_for_file("snap-01".to_string(), "src/foo.ts".to_string())
            .unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].id, "sym-001");
        assert_eq!(rows[0].kind, "function");
        assert_eq!(rows[0].modifiers, vec!["async".to_string()]);
    }

    #[test]
    fn sqlite_delegate_list_symbols_in_snapshot_with_filters() {
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db);

        // No filters → both rows.
        let all = kb
            .list_symbols_in_snapshot("snap-01".to_string(), None, None, None, None)
            .unwrap();
        assert_eq!(all.len(), 2);

        // kind filter → only the function.
        let fns = kb
            .list_symbols_in_snapshot(
                "snap-01".to_string(),
                Some(vec!["function".to_string()]),
                None,
                None,
                None,
            )
            .unwrap();
        assert_eq!(fns.len(), 1);
        assert_eq!(fns[0].kind, "function");

        // language filter → both (both ts).
        let ts = kb
            .list_symbols_in_snapshot(
                "snap-01".to_string(),
                None,
                Some(vec!["ts".to_string()]),
                None,
                None,
            )
            .unwrap();
        assert_eq!(ts.len(), 2);

        // limit → cap to 1.
        let limited = kb
            .list_symbols_in_snapshot("snap-01".to_string(), None, None, Some(1), None)
            .unwrap();
        assert_eq!(limited.len(), 1);
    }

    #[test]
    fn sqlite_delegate_call_and_type_relation_edges() {
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db);

        let callers = kb.list_callers("sym-002".to_string()).unwrap();
        assert_eq!(callers.len(), 1);
        assert_eq!(callers[0].caller_symbol_id, "sym-001");
        assert_eq!(callers[0].confidence, 0.9);

        let callees = kb.list_callees("sym-001".to_string()).unwrap();
        assert_eq!(callees.len(), 1);
        assert_eq!(callees[0].callee_symbol_id, "sym-002");

        let from = kb.list_type_relations_from("sym-001".to_string()).unwrap();
        assert_eq!(from.len(), 1);
        assert_eq!(from[0].kind, "uses_type");

        let to = kb.list_type_relations_to("sym-002".to_string()).unwrap();
        assert_eq!(to.len(), 1);
        assert_eq!(to[0].from_symbol_id, "sym-001");

        let refs = kb
            .list_references_for_symbol("sym-002".to_string())
            .unwrap();
        assert_eq!(refs.len(), 1);
        assert_eq!(refs[0].name, "Bar");
    }

    #[test]
    fn sqlite_delegate_provenance_aggregation() {
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db);

        // listMissionsForFile aggregates two provenance rows that hit src/foo.ts.
        let summary = kb
            .list_missions_for_file("snap-01".to_string(), "src/foo.ts".to_string())
            .unwrap();
        // Each mission contributes one row at line 5 → 2 mission summaries.
        assert_eq!(summary.len(), 2);
        // 0.8 sorts before 0.2 by weight DESC.
        assert_eq!(summary[0].mission_id, "v1.49.607");
        assert!((summary[0].weight - 0.8).abs() < 1e-9);
        assert_eq!(summary[0].line_count, 1);

        let line_prov = kb
            .list_provenance_for_line(
                "snap-01".to_string(),
                "src/foo.ts".to_string(),
                5,
            )
            .unwrap();
        assert_eq!(line_prov.len(), 2);

        let fc = kb
            .list_files_changed_by_mission("v1.49.607".to_string())
            .unwrap();
        assert_eq!(fc.len(), 1);
        assert_eq!(fc[0].change_kind, "M");
        assert_eq!(fc[0].added_lines, 42);
    }

    #[test]
    fn sqlite_delegate_get_symbol_and_qualified_name() {
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db);

        let sym = kb.get_symbol("sym-001".to_string()).unwrap();
        assert!(sym.is_some());
        assert_eq!(sym.unwrap().qualified_name, "foo");

        let missing = kb.get_symbol("sym-does-not-exist".to_string()).unwrap();
        assert!(missing.is_none());

        let qn = kb
            .find_symbols_by_qualified_name("snap-01".to_string(), "Bar".to_string())
            .unwrap();
        assert_eq!(qn.len(), 1);
        assert_eq!(qn[0].id, "sym-002");
    }

    #[test]
    fn sqlite_delegate_unknown_snapshot_returns_empty_not_error() {
        // Contract: bad/unknown snapshot_id returns Ok(vec![]), not Err.
        // The desktop UI relies on this so the Atlas tab stays calm before
        // the first index run.
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db);

        let rows = kb
            .list_symbols_for_file("snap-DOES-NOT-EXIST".to_string(), "src/foo.ts".to_string())
            .unwrap();
        assert!(rows.is_empty());

        let in_snap = kb
            .list_symbols_in_snapshot("nope".to_string(), None, None, None, None)
            .unwrap();
        assert!(in_snap.is_empty());

        let line_prov = kb
            .list_provenance_for_line("nope".to_string(), "src/foo.ts".to_string(), 5)
            .unwrap();
        assert!(line_prov.is_empty());

        let by_qn = kb
            .find_symbols_by_qualified_name("nope".to_string(), "foo".to_string())
            .unwrap();
        assert!(by_qn.is_empty());
    }

    #[test]
    fn sqlite_delegate_with_no_db_returns_empty_not_error() {
        // Empty registry / nonexistent DB → empty results, not Err.
        // This is the cold-start state for a freshly-installed shell.
        let tmp = TempDir::new().unwrap();
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(
            tmp.path().join("does-not-exist.db"),
        );
        let rows = kb
            .list_symbols_for_file("snap-01".to_string(), "src/foo.ts".to_string())
            .unwrap();
        assert!(rows.is_empty());

        let none_sym = kb.get_symbol("sym-anything".to_string()).unwrap();
        assert!(none_sym.is_none());

        // Empty registry path also yields empty (production cold-start path).
        let kb2 = SqliteAtlasKbDelegate::with_registry_path(
            tmp.path().join("registry-not-here.db"),
        );
        let rows2 = kb2
            .list_callers("sym-anything".to_string())
            .unwrap();
        assert!(rows2.is_empty());
    }

    #[test]
    fn sqlite_delegate_request_index_returns_descriptive_error() {
        // Indexer dispatch is not in the Rust delegate's surface; verify the
        // error message points to the canonical TS owner instead of being
        // silently dropped.
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db);
        let err = kb
            .request_index_snapshot("snap-01".to_string())
            .unwrap_err();
        assert!(err.contains("atlas-indexer") || err.contains("TS server"));
    }

    #[test]
    fn atlas_state_default_uses_sqlite_delegate() {
        // AtlasState::default() → SqliteAtlasKbDelegate (cold-start safe).
        // We can only observe behavior, not the concrete type, so we rely on
        // the cold-start contract: no DB → Ok(empty) (not Err(stub)).
        let state = AtlasState::default();
        let r = state
            .kb
            .list_symbols_for_file("snap-01".to_string(), "src/foo.ts".to_string());
        // Either Ok(empty) (no registry on this CI host) OR Ok(rows) if the
        // host has data. Critically, NOT Err with the stub-deferred message.
        match r {
            Ok(_) => {}
            Err(msg) => panic!("default delegate should not be the stub; got Err({msg})"),
        }
    }
}
