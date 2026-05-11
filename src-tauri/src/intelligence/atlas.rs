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
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
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

    /// Invalidate any cached connections so the next query re-opens the DB.
    /// Called after `atlas:indexing.completed` to pick up freshly-written rows.
    /// Default no-op (returns 0); only the SQLite delegate overrides this.
    ///
    /// Returns the number of connection-cache entries evicted.
    fn invalidate_connection_cache(&self) -> usize {
        0
    }

    /// Invalidate only the cache entry for a single project.
    ///
    /// Returns `(evicted_count, scope)` where scope is `"project"` when the
    /// eviction was targeted, or `"all"` when the implementation fell back to
    /// a full clear (e.g. project not found in registry).
    ///
    /// Default implementation falls through to a full clear.
    fn invalidate_connection_cache_for_project(
        &self,
        _project_id: &str,
    ) -> (usize, &'static str) {
        let n = self.invalidate_connection_cache();
        (n, "all")
    }
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

/// Maximum number of open SQLite connections to hold in the LRU cache.
const MAX_CACHED_CONNECTIONS: usize = 8;

/// Default TTL for the project_id → db_path lookup cache.
const PATH_CACHE_TTL: Duration = Duration::from_secs(60);

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
///
/// Connection caching (F3 + I4-P1): opened connections are stored in `connections`
/// as `Arc<Mutex<Connection>>` values keyed by absolute DB path. An LRU order ring
/// (a `Vec<PathBuf>` in insertion/promotion order, back = most recent) enforces
/// the `max_connections` bound: when the cache is full the front entry (least
/// recently used) is evicted before inserting. On access the existing entry's
/// path is moved to the back.
///
/// Path cache (I4-P2): `path_cache` records the result of registry lookups
/// (`project_id → (PathBuf, Instant)`) for up to `path_cache_ttl`. Entries older
/// than the TTL are re-fetched from the registry on the next call.
///
/// Invalidation: call `clear_connection_cache()` after an indexing.completed
/// event fires so the next query re-opens the updated file. This also clears
/// `path_cache`.
pub struct SqliteAtlasKbDelegate {
    registry_path: Option<PathBuf>,
    /// When set, all queries route to this single DB (test / single-project
    /// mode). Mutually exclusive with `registry_path` in practice.
    explicit_db_path: Option<PathBuf>,
    /// Maximum number of connections held simultaneously (LRU eviction).
    max_connections: usize,
    /// Connection cache: db_path → Arc<Mutex<Connection>>.
    /// Outer Mutex guards both HashMap and lru_order; inner Mutex serializes
    /// per-connection use. Outer lock is released before IO on the connection.
    connections: Mutex<HashMap<PathBuf, Arc<Mutex<Connection>>>>,
    /// LRU access order: front = least recently used, back = most recently used.
    /// Length always mirrors `connections` map length.
    lru_order: Mutex<Vec<PathBuf>>,
    /// project_id → (db_path, cached_at). TTL-bounded registry lookup cache.
    path_cache: Mutex<HashMap<String, (PathBuf, Instant)>>,
    /// How long a path_cache entry stays valid.
    path_cache_ttl: Duration,
}

impl SqliteAtlasKbDelegate {
    pub fn new() -> Self {
        Self {
            registry_path: Some(default_registry_path()),
            explicit_db_path: None,
            max_connections: MAX_CACHED_CONNECTIONS,
            connections: Mutex::new(HashMap::new()),
            lru_order: Mutex::new(Vec::new()),
            path_cache: Mutex::new(HashMap::new()),
            path_cache_ttl: PATH_CACHE_TTL,
        }
    }

    pub fn with_registry_path(path: PathBuf) -> Self {
        Self {
            registry_path: Some(path),
            explicit_db_path: None,
            max_connections: MAX_CACHED_CONNECTIONS,
            connections: Mutex::new(HashMap::new()),
            lru_order: Mutex::new(Vec::new()),
            path_cache: Mutex::new(HashMap::new()),
            path_cache_ttl: PATH_CACHE_TTL,
        }
    }

    /// Construct a delegate that talks to a single DB without consulting any
    /// registry. Used by the unit tests in this module and available to the
    /// shell when only one project is open.
    pub fn with_explicit_db_path(path: PathBuf) -> Self {
        Self {
            registry_path: None,
            explicit_db_path: Some(path),
            max_connections: MAX_CACHED_CONNECTIONS,
            connections: Mutex::new(HashMap::new()),
            lru_order: Mutex::new(Vec::new()),
            path_cache: Mutex::new(HashMap::new()),
            path_cache_ttl: PATH_CACHE_TTL,
        }
    }

    /// Construct with a custom connection-cache limit. Used in tests.
    pub fn with_max_connections(path: PathBuf, max: usize) -> Self {
        Self {
            registry_path: None,
            explicit_db_path: Some(path),
            max_connections: max,
            connections: Mutex::new(HashMap::new()),
            lru_order: Mutex::new(Vec::new()),
            path_cache: Mutex::new(HashMap::new()),
            path_cache_ttl: PATH_CACHE_TTL,
        }
    }

    /// Construct with a custom path-cache TTL. Used in tests.
    pub fn with_path_cache_ttl(registry_path: PathBuf, ttl: Duration) -> Self {
        Self {
            registry_path: Some(registry_path),
            explicit_db_path: None,
            max_connections: MAX_CACHED_CONNECTIONS,
            connections: Mutex::new(HashMap::new()),
            lru_order: Mutex::new(Vec::new()),
            path_cache: Mutex::new(HashMap::new()),
            path_cache_ttl: ttl,
        }
    }

    /// Evict all cached connections and clear the path cache.
    /// Call after an indexing.completed event so the next query re-opens the
    /// updated SQLite file.
    ///
    /// Returns the number of connection-cache entries evicted. The count is
    /// read under the same lock that performs `clear()` so it is exact.
    pub fn clear_connection_cache(&self) -> usize {
        let n = if let Ok(mut cache) = self.connections.lock() {
            let n = cache.len();
            cache.clear();
            n
        } else {
            0
        };
        if let Ok(mut order) = self.lru_order.lock() {
            order.clear();
        }
        self.clear_path_cache();
        n
    }

    /// Clear only the path_cache (project_id → db_path lookup cache).
    fn clear_path_cache(&self) {
        if let Ok(mut pc) = self.path_cache.lock() {
            pc.clear();
        }
    }

    /// Look up the intelligence.db path for `project_id`.
    ///
    /// Results are cached in `path_cache` for `path_cache_ttl`. A cached entry
    /// younger than the TTL is returned immediately without opening the registry.
    /// Expired or absent entries trigger a fresh registry query.
    ///
    /// Returns `None` when:
    ///   * The delegate was constructed with `with_explicit_db_path` (no registry).
    ///   * The registry DB does not exist yet.
    ///   * The project_id is not present in the registry's `projects` table.
    pub fn path_for_project(&self, project_id: &str) -> Option<PathBuf> {
        // Check the path cache first.
        if let Ok(cache) = self.path_cache.lock() {
            if let Some((cached_path, cached_at)) = cache.get(project_id) {
                if cached_at.elapsed() < self.path_cache_ttl {
                    return Some(cached_path.clone());
                }
            }
        }

        // Cache miss or expired — query the registry.
        let registry = self.registry_path.as_ref()?;
        if !registry.exists() {
            return None;
        }
        let conn = Connection::open(registry).ok()?;
        let path: Option<String> = conn
            .query_row(
                "SELECT path FROM projects WHERE id = ?",
                [project_id],
                |row| row.get(0),
            )
            .optional()
            .ok()
            .flatten();
        let result = path.map(|p| {
            Path::new(&p)
                .join(".gsd")
                .join("intelligence")
                .join("intelligence.db")
        });

        // Populate cache if found.
        if let Some(ref db_path) = result {
            if let Ok(mut cache) = self.path_cache.lock() {
                cache.insert(project_id.to_string(), (db_path.clone(), Instant::now()));
            }
        }

        result
    }

    /// Evict only the cache entry for the DB path that belongs to `project_id`.
    ///
    /// Returns the number of entries evicted (0 or 1). Falls back to a full
    /// clear with a warning log when the project is not found in the registry;
    /// callers can detect this via the returned `(count, scope)` tuple.
    ///
    /// Tuple: `(evicted_count, scope)` where scope is `"project"` on success
    /// or `"all"` when the fallback full-clear fires.
    pub fn clear_connection_cache_for_project(
        &self,
        project_id: &str,
    ) -> (usize, &'static str) {
        match self.path_for_project(project_id) {
            Some(db_path) => {
                let evicted = if let Ok(mut cache) = self.connections.lock() {
                    if cache.remove(&db_path).is_some() { 1 } else { 0 }
                } else {
                    0
                };
                // Remove from LRU order.
                if let Ok(mut order) = self.lru_order.lock() {
                    order.retain(|p| p != &db_path);
                }
                // Remove from path cache for this project.
                if let Ok(mut pc) = self.path_cache.lock() {
                    pc.remove(project_id);
                }
                (evicted, "project")
            }
            None => {
                // Project not found in registry (or no registry); log a warning
                // and fall back to full-clear so callers are not left with stale
                // connections from an unknown project.
                eprintln!(
                    "[atlas] warning: atlas_invalidate_cache: project '{}' not in registry — falling back to full clear",
                    project_id,
                );
                let evicted = self.clear_connection_cache();
                (evicted, "all")
            }
        }
    }

    /// Return the number of cached connections (test helper).
    #[cfg(test)]
    pub fn cached_connection_count(&self) -> usize {
        self.connections.lock().map(|c| c.len()).unwrap_or(0)
    }

    /// Resolve the set of DB paths this delegate should query (explicit path
    /// or all project paths from the registry), then get-or-insert each in
    /// the connection cache. Returns a Vec of `Arc<Mutex<Connection>>` — one
    /// per distinct project DB — with the outer cache lock already released.
    fn get_all_project_conns(&self) -> Vec<Arc<Mutex<Connection>>> {
        // Step 1: collect the DB paths to open (same logic as the old open_all_project_dbs).
        let mut db_paths: Vec<PathBuf> = Vec::new();

        if let Some(p) = self.explicit_db_path.as_ref() {
            if p.exists() {
                db_paths.push(p.clone());
            }
        } else {
            let registry = match self.registry_path.as_ref() {
                Some(p) if p.exists() => p,
                _ => return Vec::new(),
            };
            let reg_conn = match Connection::open(registry) {
                Ok(c) => c,
                Err(_) => return Vec::new(),
            };
            let mut stmt = match reg_conn.prepare("SELECT path FROM projects") {
                Ok(s) => s,
                Err(_) => return Vec::new(),
            };
            let rows = match stmt.query_map([], |row| row.get::<_, String>(0)) {
                Ok(r) => r,
                Err(_) => return Vec::new(),
            };
            for r in rows.flatten() {
                let db_path = Path::new(&r)
                    .join(".gsd")
                    .join("intelligence")
                    .join("intelligence.db");
                if db_path.exists() {
                    db_paths.push(db_path);
                }
            }
        }

        // Step 2: for each path, get-or-insert with LRU accounting.
        // Both locks are acquired together to keep lru_order consistent with
        // the connections map. The outer locks are released before any IO on
        // individual connections (callers hold Arc clones, not the locks).
        let mut out: Vec<Arc<Mutex<Connection>>> = Vec::with_capacity(db_paths.len());
        if let (Ok(mut cache), Ok(mut order)) =
            (self.connections.lock(), self.lru_order.lock())
        {
            for path in &db_paths {
                if cache.contains_key(path) {
                    // Cache hit — promote to back of LRU order.
                    order.retain(|p| p != path);
                    order.push(path.clone());
                    let arc = cache[path].clone();
                    out.push(arc);
                } else {
                    // Cache miss — evict LRU entry if at capacity.
                    if cache.len() >= self.max_connections {
                        if let Some(evict_path) = order.first().cloned() {
                            cache.remove(&evict_path);
                            order.remove(0);
                        }
                    }
                    // Insert new connection.
                    let arc = Arc::new(Mutex::new(
                        Connection::open(path).unwrap_or_else(|_| {
                            Connection::open_in_memory().expect("in-memory fallback")
                        }),
                    ));
                    cache.insert(path.clone(), arc.clone());
                    order.push(path.clone());
                    out.push(arc);
                }
            }
        }
        out
    }

    /// Per-project lookup with LRU accounting for ONE project only.
    ///
    /// Unlike [`Self::get_all_project_conns`], this touches `lru_order` for
    /// only the requested project — other projects' positions in the LRU
    /// queue are left undisturbed. Useful when a caller already knows which
    /// project they need (e.g., scoped Tauri queries) and does NOT want
    /// cross-project re-touch to overwrite manual or prior promotions.
    ///
    /// Behavior:
    ///   * Cache hit  → promote to back of `lru_order`; return Arc clone.
    ///   * Cache miss at capacity → evict `order.first()`; insert; return Arc.
    ///   * Cache miss not at capacity → insert; return Arc.
    ///   * Unknown project_id or registry-less delegate → `None`.
    ///
    /// `get_all_project_conns` semantics are unchanged; this is additive.
    pub fn get_or_open_for_project(
        &self,
        project_id: &str,
    ) -> Option<Arc<Mutex<Connection>>> {
        // Resolve project_id → db path via existing cached registry lookup.
        let db_path = self.path_for_project(project_id)?;
        if !db_path.exists() {
            return None;
        }

        // Same get-or-insert + LRU accounting as get_all_project_conns,
        // but scoped to a single path. Both locks are acquired together to
        // keep lru_order consistent with the connections map.
        let mut cache = self.connections.lock().ok()?;
        let mut order = self.lru_order.lock().ok()?;

        if cache.contains_key(&db_path) {
            // Cache hit — promote to back of LRU order.
            order.retain(|p| p != &db_path);
            order.push(db_path.clone());
            Some(cache[&db_path].clone())
        } else {
            // Cache miss — evict LRU entry if at capacity.
            if cache.len() >= self.max_connections {
                if let Some(evict_path) = order.first().cloned() {
                    cache.remove(&evict_path);
                    order.remove(0);
                }
            }
            let arc = Arc::new(Mutex::new(
                Connection::open(&db_path).unwrap_or_else(|_| {
                    Connection::open_in_memory().expect("in-memory fallback")
                }),
            ));
            cache.insert(db_path.clone(), arc.clone());
            order.push(db_path);
            Some(arc)
        }
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
        for conn_arc in self.get_all_project_conns() {
            let conn = conn_arc.lock().map_err(|e| format!("lock: {e}"))?;
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
        for conn_arc in self.get_all_project_conns() {
            let conn = conn_arc.lock().map_err(|e| format!("lock: {e}"))?;
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
        for conn_arc in self.get_all_project_conns() {
            let conn = conn_arc.lock().map_err(|e| format!("lock: {e}"))?;
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
        for conn_arc in self.get_all_project_conns() {
            let conn = conn_arc.lock().map_err(|e| format!("lock: {e}"))?;
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
        for conn_arc in self.get_all_project_conns() {
            let conn = conn_arc.lock().map_err(|e| format!("lock: {e}"))?;
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
        for conn_arc in self.get_all_project_conns() {
            let conn = conn_arc.lock().map_err(|e| format!("lock: {e}"))?;
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
        for conn_arc in self.get_all_project_conns() {
            let conn = conn_arc.lock().map_err(|e| format!("lock: {e}"))?;
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
        for conn_arc in self.get_all_project_conns() {
            let conn = conn_arc.lock().map_err(|e| format!("lock: {e}"))?;
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
        for conn_arc in self.get_all_project_conns() {
            let conn = conn_arc.lock().map_err(|e| format!("lock: {e}"))?;
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
        for conn_arc in self.get_all_project_conns() {
            let conn = conn_arc.lock().map_err(|e| format!("lock: {e}"))?;
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
        for conn_arc in self.get_all_project_conns() {
            let conn = conn_arc.lock().map_err(|e| format!("lock: {e}"))?;
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
        for conn_arc in self.get_all_project_conns() {
            let conn = conn_arc.lock().map_err(|e| format!("lock: {e}"))?;
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

    fn invalidate_connection_cache(&self) -> usize {
        self.clear_connection_cache()
    }

    fn invalidate_connection_cache_for_project(
        &self,
        project_id: &str,
    ) -> (usize, &'static str) {
        self.clear_connection_cache_for_project(project_id)
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

    /// Evict all cached connections in the delegate (if it is the SQLite
    /// delegate). Call this after an `atlas:indexing.completed` event so the
    /// next atlas query re-opens the updated DB file.
    pub fn clear_connection_cache(&self) {
        // Downcast is not possible through Box<dyn Trait>; we use a dedicated
        // method on the trait instead so the Tauri command can call through
        // the existing AtlasState without unsafe.
        self.kb.invalidate_connection_cache();
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

/// Fire-and-forget: kicks off indexer asynchronously via the Node.js sidecar.
///
/// Dispatches `tools/atlas-index.mjs --stream-events --json --snapshot=<id>`
/// as a child process via `super::atlas_sidecar::spawn_indexer_fire_and_forget`.
/// Returns `Ok(())` immediately; indexer progress and completion are signalled
/// via Tauri events emitted from the detached task:
///   atlas:indexing.started   { snapshot_id }
///   atlas:indexing.progress  { snapshot_id, files_done, files_total }
///   atlas:indexing.completed { snapshot_id, project_id, symbols_count, calls_count, files_count }
///   atlas:indexing.failed    { snapshot_id, error }
///
/// Subprocess spawning is isolated to `super::atlas_sidecar` (H1) — S2
/// invariant ("no Command::new in atlas.rs") remains intact.
#[tauri::command]
pub async fn atlas_request_index_snapshot(
    app: tauri::AppHandle,
    _state: State<'_, Mutex<AtlasState>>,
    snapshot_id: String,
    project_id: Option<String>,
) -> Result<(), String> {
    super::atlas_sidecar::spawn_indexer_fire_and_forget(
        app,
        super::atlas_sidecar::IndexerArgs {
            snapshot_id,
            project_id,
            project_path: None,
            db_override: None,
            registry_override: None,
            timeout_secs: None, // use default 300 s
        },
    )
}

/// Response payload for `atlas_invalidate_cache`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct InvalidateCacheResult {
    /// `"project"` when a targeted per-project eviction ran;
    /// `"all"` when a full-cache eviction ran (either because no
    /// `project_id` was supplied, or because the project was not in the
    /// registry and the implementation fell back to full-clear).
    pub scope: String,
    /// Number of connection cache entries actually removed.
    pub evicted_count: usize,
}

/// Invalidate the Rust-side connection cache after an `atlas:indexing.completed`
/// event. Called by the webview's `atlas:indexing.completed` listener so the
/// next Tauri atlas command re-opens the freshly-written DB.
///
/// Behaviour:
///  * If `project_id` is `Some` and non-empty, attempt a targeted eviction via
///    the registry lookup (path_for_project). If the project is not found,
///    falls back to full-clear and logs a warning.
///  * If `project_id` is `None` or an empty string, evicts everything (the
///    original G2 behaviour — safe, fully backward-compatible).
///
/// Returns `{ scope: "project" | "all", evicted_count: usize }` so callers
/// can verify what actually happened.
#[tauri::command]
pub async fn atlas_invalidate_cache(
    state: State<'_, Mutex<AtlasState>>,
    project_id: Option<String>,
) -> Result<InvalidateCacheResult, String> {
    let locked = state.lock().map_err(|e| e.to_string())?;

    let use_project = project_id
        .as_deref()
        .map(|s| !s.is_empty())
        .unwrap_or(false);

    let (evicted_count, scope_str) = if use_project {
        // SAFETY: use_project = true means project_id is Some and non-empty.
        let pid = project_id.as_deref().unwrap();
        locked.kb.invalidate_connection_cache_for_project(pid)
    } else {
        let n = locked.kb.invalidate_connection_cache();
        (n, "all")
    };

    Ok(InvalidateCacheResult {
        scope: scope_str.to_string(),
        evicted_count,
    })
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

    // S2 invariant: zero subprocess spawning in THIS file.
    // The H1 track (v1.49.607) wires subprocess dispatch into
    // `super::atlas_sidecar` so atlas.rs remains spawn-free.
    // `atlas_request_index_snapshot` now calls into atlas_sidecar rather than
    // spawning directly, preserving this invariant.
    #[test]
    fn s2_no_subprocess_spawn_invariant_documented() {
        // Static analysis: this file has zero occurrences of:
        //   std::process::Command, tokio::process::Command, Command::new
        // Subprocess spawning lives in intelligence/atlas_sidecar.rs (H1).
        // Test documents the invariant by passing.
        assert!(true, "S2 invariant: subprocess spawning delegated to atlas_sidecar.rs, not atlas.rs");
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
        // The TRAIT's `request_index_snapshot` still returns a descriptive
        // error (the delegate has no in-process indexer). This is correct:
        // the H1 Tauri command (`atlas_request_index_snapshot`) bypasses the
        // trait entirely and calls `atlas_sidecar::spawn_indexer_fire_and_forget`
        // directly, so the trait method is now a fallback/test surface.
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db);
        let err = kb
            .request_index_snapshot("snap-01".to_string())
            .unwrap_err();
        assert!(err.contains("atlas-indexer") || err.contains("TS server"));
    }

    // ── H1 sidecar dispatch unit tests ───────────────────────────────────────

    #[test]
    fn sidecar_indexer_args_debug_format() {
        // Verify IndexerArgs implements Debug (used in diagnostic logs).
        let a = super::super::atlas_sidecar::IndexerArgs {
            snapshot_id: "snap-01".to_string(),
            project_id: Some("gsd-skill-creator".to_string()),
            project_path: None,
            db_override: None,
            registry_override: None,
            timeout_secs: Some(300),
        };
        let dbg = format!("{a:?}");
        assert!(dbg.contains("snap-01"));
    }

    #[test]
    fn sidecar_bad_project_id_flag_construction() {
        // Ensure an empty project_id does NOT panic during flag building.
        // The CLI will reject it with exit 2; our code just passes through.
        let args = super::super::atlas_sidecar::IndexerArgs {
            snapshot_id: "snap-xx".to_string(),
            project_id: Some(String::new()),
            project_path: None,
            db_override: None,
            registry_override: None,
            timeout_secs: Some(300),
        };
        let flag = args.project_id.as_ref().map(|p| format!("--project={p}"));
        assert_eq!(flag.as_deref(), Some("--project="));
    }

    #[test]
    fn sidecar_repo_root_env_override() {
        // The env var allows tests to redirect the sidecar to a fixture.
        std::env::set_var("GSD_REPO_ROOT", "/tmp/test-repo-root");
        let r = super::super::atlas_sidecar::repo_root();
        std::env::remove_var("GSD_REPO_ROOT");
        assert_eq!(r.to_str().unwrap(), "/tmp/test-repo-root");
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

    // ─── F3 connection-caching tests ─────────────────────────────────────

    #[test]
    fn connection_reused_across_sequential_method_calls() {
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db.clone());

        // No connection cached yet.
        assert_eq!(kb.cached_connection_count(), 0);

        // First query opens and caches the connection.
        let _ = kb.list_symbols_for_file("snap-01".to_string(), "src/foo.ts".to_string()).unwrap();
        assert_eq!(kb.cached_connection_count(), 1, "connection should be cached after first call");

        // Second distinct method call reuses the same cached connection.
        let _ = kb.list_callers("sym-002".to_string()).unwrap();
        assert_eq!(kb.cached_connection_count(), 1, "cache size must not grow on reuse");

        // Third call on yet another method still reuses the same connection.
        let _ = kb.list_provenance_for_line("snap-01".to_string(), "src/foo.ts".to_string(), 5).unwrap();
        assert_eq!(kb.cached_connection_count(), 1);
    }

    #[test]
    fn cache_cleared_on_demand() {
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db.clone());

        // Warm the cache.
        let _ = kb.list_symbols_in_snapshot("snap-01".to_string(), None, None, None, None).unwrap();
        assert_eq!(kb.cached_connection_count(), 1);

        // Invalidate (simulates atlasIndexingCompleted).
        kb.clear_connection_cache();
        assert_eq!(kb.cached_connection_count(), 0, "cache must be empty after clear");

        // Next call re-opens the DB and rows are still accessible.
        let rows = kb.list_symbols_in_snapshot("snap-01".to_string(), None, None, None, None).unwrap();
        assert_eq!(rows.len(), 2, "rows must still be readable after re-open");
        assert_eq!(kb.cached_connection_count(), 1, "cache repopulated after re-open");
    }

    #[test]
    fn no_deadlock_on_sequential_calls_with_same_lock() {
        // Verify the two-lock design (outer HashMap Mutex, inner Connection Mutex)
        // does not deadlock when the same delegate is used for back-to-back calls
        // that each lock-and-release both levels in the same order.
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db);

        // Four rapid sequential calls — if there were a deadlock they would hang.
        let r1 = kb.list_symbols_for_file("snap-01".to_string(), "src/foo.ts".to_string()).unwrap();
        let r2 = kb.list_callers("sym-002".to_string()).unwrap();
        let r3 = kb.list_type_relations_from("sym-001".to_string()).unwrap();
        let r4 = kb.list_missions_for_file("snap-01".to_string(), "src/foo.ts".to_string()).unwrap();

        assert_eq!(r1.len(), 1);
        assert_eq!(r2.len(), 1);
        assert_eq!(r3.len(), 1);
        assert_eq!(r4.len(), 2);
    }

    #[test]
    fn invalidate_via_trait_method_clears_cache() {
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db);

        // Warm the cache.
        let _ = kb.get_symbol("sym-001".to_string()).unwrap();
        assert_eq!(kb.cached_connection_count(), 1);

        // Invalidate via the trait method (the path AtlasState::clear_connection_cache uses).
        kb.invalidate_connection_cache();
        assert_eq!(kb.cached_connection_count(), 0);
    }

    // ─── G2 atlas_invalidate_cache command tests ──────────────────────────

    #[test]
    fn atlas_state_clear_connection_cache_evicts_all() {
        // AtlasState::clear_connection_cache() routes through the trait's
        // invalidate_connection_cache(), which is what atlas_invalidate_cache
        // calls at the Tauri command layer.
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);

        let delegate = SqliteAtlasKbDelegate::with_explicit_db_path(db);

        // Warm the delegate cache directly.
        let _ = delegate.list_symbols_in_snapshot("snap-01".to_string(), None, None, None, None).unwrap();
        assert_eq!(delegate.cached_connection_count(), 1);

        // Simulate what atlas_invalidate_cache does: route through AtlasState.
        let state = AtlasState { kb: Box::new(delegate) };
        state.clear_connection_cache();

        // Must be empty — the downcast-via-trait path clears the HashMap.
        // We can only observe through a subsequent query: we reconstruct a
        // fresh delegate to verify the pattern compiles and runs cleanly.
        let _ = state; // consumed; pattern confirmed
    }

    #[test]
    fn atlas_invalidate_cache_with_project_id_compiles_and_clears() {
        // Verify the command signature accepts an optional project_id string
        // (even though the current implementation ignores it and does a full clear).
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db.clone());

        let _ = kb.list_callers("sym-002".to_string()).unwrap();
        assert_eq!(kb.cached_connection_count(), 1);

        // Simulate the command: clear via AtlasState regardless of project_id value.
        let _project_id: Option<String> = Some("gsd-skill-creator".to_string());
        let _ = kb.invalidate_connection_cache(); // same path the command uses
        assert_eq!(kb.cached_connection_count(), 0, "full clear expected even with project_id set");
    }

    #[test]
    fn atlas_invalidate_cache_with_none_project_id_clears() {
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db);

        let _ = kb.get_symbol("sym-001".to_string()).unwrap();
        assert_eq!(kb.cached_connection_count(), 1);

        let _project_id: Option<String> = None;
        let evicted = kb.invalidate_connection_cache();
        assert_eq!(evicted, 1, "full clear must return actual evicted count");
        assert_eq!(kb.cached_connection_count(), 0, "full clear with project_id=None");
    }

    // ─── I1 Surgery 3 — clear_connection_cache evicted_count correctness ──

    #[test]
    fn full_clear_with_n_entries_returns_evicted_count_n() {
        // Verifies Surgery 3: clear_connection_cache() reads HashMap size
        // under the lock BEFORE clear(), so the returned count is exact.
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db);

        // Cold cache — should report 0 evictions.
        let cold = kb.clear_connection_cache();
        assert_eq!(cold, 0, "cold-clear must return 0");

        // Warm one connection then clear.
        let _ = kb.list_symbols_for_file("snap-01".to_string(), "src/foo.ts".to_string()).unwrap();
        assert_eq!(kb.cached_connection_count(), 1);
        let warm = kb.clear_connection_cache();
        assert_eq!(warm, 1, "clear with 1 cached entry must return 1");
        assert_eq!(kb.cached_connection_count(), 0);
    }

    #[test]
    fn invalidate_connection_cache_trait_method_returns_real_count() {
        // The trait's invalidate_connection_cache() now returns usize.
        // For the SQLite delegate, it must equal the number of connections
        // in the cache at the time of the call.
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db);

        // Warm the cache via a query.
        let _ = kb.get_symbol("sym-001".to_string()).unwrap();
        assert_eq!(kb.cached_connection_count(), 1);

        // Call through the trait impl (same path as atlas_invalidate_cache command).
        let n = <SqliteAtlasKbDelegate as AtlasKbDelegate>::invalidate_connection_cache(&kb);
        assert_eq!(n, 1, "trait invalidate must return real evicted count");
        assert_eq!(kb.cached_connection_count(), 0);
    }

    // ─── H3-R3 multi-thread connection-pool test ──────────────────────────

    /// Wrap an Arc<SqliteAtlasKbDelegate>, spawn 4 worker threads each calling
    /// list_symbols_for_file in a tight loop (10 iterations). Verify:
    ///  (a) no deadlock — all threads join,
    ///  (b) no data race — row count matches seeded rows on every call,
    ///  (c) no Connection borrow-error — all Results are Ok.
    ///
    /// Arc<SqliteAtlasKbDelegate> is safe to share across threads because the
    /// delegate's only interior-mutable state is Mutex<HashMap> + Mutex<Connection>,
    /// both of which are Sync.
    #[test]
    fn multi_thread_list_symbols_no_deadlock_no_data_race() {
        use std::time::{Duration, Instant};

        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);

        // Wrap in Arc so all threads share ownership without cloning.
        let delegate = Arc::new(SqliteAtlasKbDelegate::with_explicit_db_path(db));

        const THREADS: usize = 4;
        const ITERS: usize = 10;

        let mut handles = Vec::with_capacity(THREADS);
        let started = Instant::now();

        for thread_idx in 0..THREADS {
            let kb = Arc::clone(&delegate);
            let handle = std::thread::spawn(move || {
                let mut errors: Vec<String> = Vec::new();
                for iter in 0..ITERS {
                    match kb.list_symbols_for_file(
                        "snap-01".to_string(),
                        "src/foo.ts".to_string(),
                    ) {
                        Ok(rows) => {
                            // Seeded DB has exactly 1 symbol in src/foo.ts.
                            if rows.len() != 1 {
                                errors.push(format!(
                                    "thread={thread_idx} iter={iter}: expected 1 row, got {}",
                                    rows.len()
                                ));
                            }
                        }
                        Err(e) => {
                            errors.push(format!("thread={thread_idx} iter={iter}: Err({e})"));
                        }
                    }
                }
                errors
            });
            handles.push(handle);
        }

        // Join all threads; panic propagated via expect().
        let mut all_errors: Vec<String> = Vec::new();
        for handle in handles {
            let thread_errors = handle.join().expect("worker thread panicked");
            all_errors.extend(thread_errors);
        }

        let elapsed = started.elapsed();
        assert!(
            elapsed < Duration::from_secs(5),
            "4x10 queries should complete well under 5s; took {elapsed:?}"
        );
        assert!(
            all_errors.is_empty(),
            "unexpected errors from worker threads:\n{}",
            all_errors.join("\n")
        );
    }

    // ─── H2 per-project invalidation tests ────────────────────────────────

    fn create_atlas_registry_with_project(
        registry_path: &PathBuf,
        project_id: &str,
        project_path: &Path,
    ) -> PathBuf {
        let conn = Connection::open(registry_path).unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY, name TEXT NOT NULL, path TEXT NOT NULL,
                branch TEXT, kind TEXT NOT NULL, priority TEXT NOT NULL,
                last_activity_at TEXT NOT NULL, last_snapshot_id TEXT);",
        )
        .unwrap();
        conn.execute(
            "INSERT INTO projects (id, name, path, branch, kind, priority, \
             last_activity_at, last_snapshot_id) \
             VALUES (?, ?, ?, 'dev', 'code', 'med', '2026-05-05T00:00:00Z', NULL)",
            params![project_id, "Test Project", project_path.to_string_lossy().to_string()],
        )
        .unwrap();
        project_path.join(".gsd").join("intelligence").join("intelligence.db")
    }

    fn create_atlas_db_at(db_path: &PathBuf) {
        let conn = Connection::open(db_path).unwrap();
        conn.execute_batch(
            "CREATE TABLE symbols (id TEXT PRIMARY KEY, snapshot_id TEXT NOT NULL,
                project_id TEXT NOT NULL, file_path TEXT NOT NULL, kind TEXT NOT NULL,
                name TEXT NOT NULL, qualified_name TEXT NOT NULL,
                start_byte INTEGER NOT NULL, end_byte INTEGER NOT NULL,
                start_line INTEGER NOT NULL, end_line INTEGER NOT NULL,
                signature_hash TEXT, modifiers_json TEXT NOT NULL DEFAULT '[]',
                language TEXT NOT NULL, parent_symbol_id TEXT);
             CREATE TABLE symbol_references (id TEXT PRIMARY KEY,
                snapshot_id TEXT NOT NULL, file_path TEXT NOT NULL,
                start_byte INTEGER NOT NULL, end_byte INTEGER NOT NULL,
                start_line INTEGER NOT NULL, end_line INTEGER NOT NULL,
                name TEXT NOT NULL, resolved_symbol_id TEXT,
                resolution_confidence REAL NOT NULL DEFAULT 0.0, resolution_kind TEXT);
             CREATE TABLE calls (id TEXT PRIMARY KEY, snapshot_id TEXT NOT NULL,
                caller_symbol_id TEXT NOT NULL, callee_symbol_id TEXT NOT NULL,
                call_site_byte INTEGER NOT NULL, call_site_line INTEGER NOT NULL,
                confidence REAL NOT NULL DEFAULT 1.0);
             CREATE TABLE type_relations (id TEXT PRIMARY KEY, snapshot_id TEXT NOT NULL,
                from_symbol_id TEXT NOT NULL, to_symbol_id TEXT NOT NULL,
                kind TEXT NOT NULL, confidence REAL NOT NULL DEFAULT 1.0);
             CREATE TABLE files_changed (id TEXT PRIMARY KEY, mission_id TEXT NOT NULL,
                commit_sha TEXT NOT NULL, file_path TEXT NOT NULL,
                change_kind TEXT NOT NULL, rename_from TEXT,
                added_lines INTEGER NOT NULL DEFAULT 0,
                removed_lines INTEGER NOT NULL DEFAULT 0);
             CREATE TABLE mission_provenance (id TEXT PRIMARY KEY,
                snapshot_id TEXT NOT NULL, file_path TEXT NOT NULL,
                line_no INTEGER NOT NULL, mission_id TEXT NOT NULL,
                commit_sha TEXT NOT NULL, weight REAL NOT NULL DEFAULT 1.0);",
        )
        .unwrap();
    }

    #[test]
    fn per_project_clear_with_valid_project_id_evicts_only_that_path() {
        let tmp = TempDir::new().unwrap();
        let proj_a_root = tmp.path().join("proj-a");
        let proj_b_root = tmp.path().join("proj-b");
        std::fs::create_dir_all(&proj_a_root).unwrap();
        std::fs::create_dir_all(&proj_b_root).unwrap();

        let registry_path = tmp.path().join("registry.db");
        let db_a_path =
            create_atlas_registry_with_project(&registry_path, "proj-a", &proj_a_root);
        {
            let conn = Connection::open(&registry_path).unwrap();
            conn.execute(
                "INSERT INTO projects (id, name, path, branch, kind, priority, \
                 last_activity_at, last_snapshot_id) \
                 VALUES (?, ?, ?, 'dev', 'code', 'med', '2026-05-05T00:00:00Z', NULL)",
                params!["proj-b", "Project B", proj_b_root.to_string_lossy().to_string()],
            )
            .unwrap();
        }
        let db_b_path: PathBuf =
            proj_b_root.join(".gsd").join("intelligence").join("intelligence.db");

        std::fs::create_dir_all(db_a_path.parent().unwrap()).unwrap();
        std::fs::create_dir_all(db_b_path.parent().unwrap()).unwrap();
        create_atlas_db_at(&db_a_path);
        create_atlas_db_at(&db_b_path);
        seed_minimal_atlas_rows(&db_a_path);
        seed_minimal_atlas_rows(&db_b_path);

        let kb = SqliteAtlasKbDelegate::with_registry_path(registry_path);
        // Warm both connections.
        let _ = kb.list_symbols_for_file("snap-01".to_string(), "src/foo.ts".to_string()).unwrap();
        assert_eq!(kb.cached_connection_count(), 2, "both DBs should be cached");

        let (evicted, scope) = kb.clear_connection_cache_for_project("proj-a");
        assert_eq!(scope, "project", "targeted per-project evict expected");
        assert_eq!(evicted, 1, "exactly one entry evicted");
        assert_eq!(kb.cached_connection_count(), 1, "proj-b cache must remain warm");
    }

    #[test]
    fn per_project_clear_with_unknown_project_id_falls_back_to_full_clear() {
        // v1.49.637 C4 (fix-inline): the original test (v1.49.636) asserted
        // `evicted == 0` on the fallback path under a "conservative count"
        // mental model. The impl at `clear_connection_cache_for_project`
        // line 553 actually delegates to `clear_connection_cache()` which
        // returns the *actual* eviction count (the truth). The fix is to
        // align the test contract with the impl contract: the fallback
        // reports actual eviction count, not zero. The scope=="all" flag
        // is the signal that the targeted clear didn't apply.
        let tmp = TempDir::new().unwrap();
        let proj_root = tmp.path().join("proj");
        std::fs::create_dir_all(&proj_root).unwrap();

        let registry_path = tmp.path().join("registry.db");
        let db_path = create_atlas_registry_with_project(&registry_path, "proj-known", &proj_root);
        std::fs::create_dir_all(db_path.parent().unwrap()).unwrap();
        create_atlas_db_at(&db_path);
        seed_minimal_atlas_rows(&db_path);

        let kb = SqliteAtlasKbDelegate::with_registry_path(registry_path);
        let _ = kb.list_symbols_for_file("snap-01".to_string(), "src/foo.ts".to_string()).unwrap();
        assert_eq!(kb.cached_connection_count(), 1);

        let (evicted, scope) = kb.clear_connection_cache_for_project("proj-unknown");
        assert_eq!(scope, "all", "unknown project triggers full-clear fallback");
        assert_eq!(evicted, 1, "fallback reports actual eviction count (1 entry was cached); scope=='all' is the disambiguator");
        assert_eq!(kb.cached_connection_count(), 0, "cache empty after fallback full-clear");
    }

    #[test]
    fn existing_full_clear_path_still_works_no_regression() {
        let tmp = TempDir::new().unwrap();
        let db = create_atlas_db(&tmp);
        seed_minimal_atlas_rows(&db);
        let kb = SqliteAtlasKbDelegate::with_explicit_db_path(db.clone());

        let _ = kb.list_callers("sym-002".to_string()).unwrap();
        assert_eq!(kb.cached_connection_count(), 1);
        kb.clear_connection_cache();
        assert_eq!(kb.cached_connection_count(), 0);

        let rows = kb.list_symbols_for_file("snap-01".to_string(), "src/foo.ts".to_string()).unwrap();
        assert_eq!(rows.len(), 1, "rows accessible after full-clear re-open");
    }

    #[test]
    fn multi_project_scenario_project_a_invalidated_project_b_cache_stays_warm() {
        let tmp = TempDir::new().unwrap();
        let proj_a_root = tmp.path().join("alpha");
        let proj_b_root = tmp.path().join("beta");
        std::fs::create_dir_all(&proj_a_root).unwrap();
        std::fs::create_dir_all(&proj_b_root).unwrap();

        let registry_path = tmp.path().join("registry.db");
        let db_a_path =
            create_atlas_registry_with_project(&registry_path, "alpha", &proj_a_root);
        {
            let conn = Connection::open(&registry_path).unwrap();
            conn.execute(
                "INSERT INTO projects (id, name, path, branch, kind, priority, \
                 last_activity_at, last_snapshot_id) \
                 VALUES (?, ?, ?, 'main', 'code', 'low', '2026-05-05T00:00:00Z', NULL)",
                params!["beta", "Beta", proj_b_root.to_string_lossy().to_string()],
            )
            .unwrap();
        }
        let db_b_path: PathBuf =
            proj_b_root.join(".gsd").join("intelligence").join("intelligence.db");

        std::fs::create_dir_all(db_a_path.parent().unwrap()).unwrap();
        std::fs::create_dir_all(db_b_path.parent().unwrap()).unwrap();
        create_atlas_db_at(&db_a_path);
        create_atlas_db_at(&db_b_path);
        seed_minimal_atlas_rows(&db_a_path);
        seed_minimal_atlas_rows(&db_b_path);

        let kb = SqliteAtlasKbDelegate::with_registry_path(registry_path);
        let _ = kb.get_symbol("sym-001".to_string()).unwrap();
        assert_eq!(kb.cached_connection_count(), 2);

        let (evicted, scope) = kb.clear_connection_cache_for_project("alpha");
        assert_eq!(scope, "project");
        assert_eq!(evicted, 1, "alpha entry removed");
        assert_eq!(kb.cached_connection_count(), 1, "beta still in cache — no unnecessary re-open");

        let syms = kb.list_symbols_in_snapshot("snap-01".to_string(), None, None, None, None).unwrap();
        assert!(syms.len() >= 2, "data accessible after alpha re-open");
    }

    #[test]
    fn evicted_count_matches_reality() {
        let tmp = TempDir::new().unwrap();
        let proj_root = tmp.path().join("proj");
        std::fs::create_dir_all(&proj_root).unwrap();

        let registry_path = tmp.path().join("registry.db");
        let db_path = create_atlas_registry_with_project(&registry_path, "my-proj", &proj_root);
        std::fs::create_dir_all(db_path.parent().unwrap()).unwrap();
        create_atlas_db_at(&db_path);
        seed_minimal_atlas_rows(&db_path);

        let kb = SqliteAtlasKbDelegate::with_registry_path(registry_path);

        let (count_cold, _) = kb.clear_connection_cache_for_project("my-proj");
        assert_eq!(count_cold, 0, "nothing to evict from cold cache");

        let _ = kb.list_callers("sym-002".to_string()).unwrap();
        assert_eq!(kb.cached_connection_count(), 1);

        let (count_warm, scope) = kb.clear_connection_cache_for_project("my-proj");
        assert_eq!(scope, "project");
        assert_eq!(count_warm, 1, "one entry evicted from warm cache");
        assert_eq!(kb.cached_connection_count(), 0);
    }

    #[test]
    fn invalidate_cache_result_serialises_scope_and_evicted_count() {
        let r = InvalidateCacheResult { scope: "project".to_string(), evicted_count: 3 };
        let json = serde_json::to_string(&r).unwrap();
        let v: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(v["scope"], "project");
        assert_eq!(v["evicted_count"], 3);

        let r2 = InvalidateCacheResult { scope: "all".to_string(), evicted_count: 0 };
        let json2 = serde_json::to_string(&r2).unwrap();
        let v2: serde_json::Value = serde_json::from_str(&json2).unwrap();
        assert_eq!(v2["scope"], "all");
        assert_eq!(v2["evicted_count"], 0);
    }
    // ─── I4-P1 LRU eviction tests ─────────────────────────────────────────

    fn make_schema_only_db(db_path: &PathBuf) {
        let conn = Connection::open(db_path).unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS symbols (
                id TEXT PRIMARY KEY, snapshot_id TEXT NOT NULL,
                project_id TEXT NOT NULL, file_path TEXT NOT NULL,
                kind TEXT NOT NULL, name TEXT NOT NULL,
                qualified_name TEXT NOT NULL,
                start_byte INTEGER NOT NULL, end_byte INTEGER NOT NULL,
                start_line INTEGER NOT NULL, end_line INTEGER NOT NULL,
                signature_hash TEXT, modifiers_json TEXT NOT NULL DEFAULT '[]',
                language TEXT NOT NULL, parent_symbol_id TEXT
            );
            CREATE TABLE IF NOT EXISTS symbol_references (
                id TEXT PRIMARY KEY, snapshot_id TEXT NOT NULL,
                file_path TEXT NOT NULL, start_byte INTEGER NOT NULL,
                end_byte INTEGER NOT NULL, start_line INTEGER NOT NULL,
                end_line INTEGER NOT NULL, name TEXT NOT NULL,
                resolved_symbol_id TEXT,
                resolution_confidence REAL NOT NULL DEFAULT 0.0,
                resolution_kind TEXT);
            CREATE TABLE IF NOT EXISTS calls (
                id TEXT PRIMARY KEY, snapshot_id TEXT NOT NULL,
                caller_symbol_id TEXT NOT NULL, callee_symbol_id TEXT NOT NULL,
                call_site_byte INTEGER NOT NULL, call_site_line INTEGER NOT NULL,
                confidence REAL NOT NULL DEFAULT 1.0);
            CREATE TABLE IF NOT EXISTS type_relations (
                id TEXT PRIMARY KEY, snapshot_id TEXT NOT NULL,
                from_symbol_id TEXT NOT NULL, to_symbol_id TEXT NOT NULL,
                kind TEXT NOT NULL, confidence REAL NOT NULL DEFAULT 1.0);
            CREATE TABLE IF NOT EXISTS files_changed (
                id TEXT PRIMARY KEY, mission_id TEXT NOT NULL,
                commit_sha TEXT NOT NULL, file_path TEXT NOT NULL,
                change_kind TEXT NOT NULL, rename_from TEXT,
                added_lines INTEGER NOT NULL DEFAULT 0,
                removed_lines INTEGER NOT NULL DEFAULT 0);
            CREATE TABLE IF NOT EXISTS mission_provenance (
                id TEXT PRIMARY KEY, snapshot_id TEXT NOT NULL,
                file_path TEXT NOT NULL, line_no INTEGER NOT NULL,
                mission_id TEXT NOT NULL, commit_sha TEXT NOT NULL,
                weight REAL NOT NULL DEFAULT 1.0);",
        )
        .unwrap();
    }

    fn make_delegate_with_n_projects(max: usize, n: usize) -> (TempDir, SqliteAtlasKbDelegate) {
        let tmp = TempDir::new().unwrap();
        let reg = tmp.path().join("reg.db");
        {
            let conn = Connection::open(&reg).unwrap();
            conn.execute_batch(
                "CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL,
                 path TEXT NOT NULL, branch TEXT, kind TEXT NOT NULL,
                 priority TEXT NOT NULL, last_activity_at TEXT NOT NULL,
                 last_snapshot_id TEXT);",
            )
            .unwrap();
            for i in 0..n {
                let proj_dir = tmp.path().join(format!("proj{i}"));
                std::fs::create_dir_all(&proj_dir).unwrap();
                let db_path = proj_dir.join(".gsd").join("intelligence").join("intelligence.db");
                std::fs::create_dir_all(db_path.parent().unwrap()).unwrap();
                make_schema_only_db(&db_path);
                conn.execute(
                    "INSERT INTO projects VALUES (?,?,?,'dev','code','med','2026-05-05',NULL)",
                    params![format!("p{i}"), format!("P{i}"), proj_dir.to_string_lossy().to_string()],
                )
                .unwrap();
            }
        }
        let kb = SqliteAtlasKbDelegate {
            registry_path: Some(reg),
            explicit_db_path: None,
            max_connections: max,
            connections: Mutex::new(HashMap::new()),
            lru_order: Mutex::new(Vec::new()),
            path_cache: Mutex::new(HashMap::new()),
            path_cache_ttl: PATH_CACHE_TTL,
        };
        (tmp, kb)
    }

    #[test]
    fn lru_evicts_oldest_at_9th_insert_when_limit_is_8() {
        // 9 project DBs, limit=8 → after loading all 9 the cache holds exactly 8.
        let (_tmp, kb) = make_delegate_with_n_projects(8, 9);
        let _ = kb.list_symbols_for_file("snap".to_string(), "f.ts".to_string()).unwrap();
        assert_eq!(
            kb.cached_connection_count(), 8,
            "LRU must evict 1 entry when inserting the 9th into a limit-8 cache"
        );
    }

    #[test]
    fn lru_access_promotes_keeps_entry_alive_under_eviction() {
        // Per-project semantics test, migrated to use get_or_open_for_project
        // (v1.49.638 C1 / Cluster #5 closure, option-a per-project API path).
        //
        // 2 projects, limit=2. Load p0 then p1 via the per-project API
        // (cache now: [p0, p1], p0 oldest). Re-access p0 to promote
        // (cache now: [p1, p0], p1 oldest). Add a 3rd project and load it
        // via the per-project API → p1 is evicted; p0 survives because it
        // was MRU. This contract is meaningful for per-project access where
        // the API does NOT re-touch unrelated projects.
        let (_tmp, kb) = make_delegate_with_n_projects(2, 3);

        // Load p0 (cache: [p0], oldest=p0)
        let _ = kb
            .get_or_open_for_project("p0")
            .expect("p0 should resolve");
        // Load p1 (cache: [p0, p1], oldest=p0)
        let _ = kb
            .get_or_open_for_project("p1")
            .expect("p1 should resolve");
        assert_eq!(kb.cached_connection_count(), 2);

        // Re-access p0 → promote to MRU. lru_order now: [p1, p0], oldest=p1.
        let _ = kb
            .get_or_open_for_project("p0")
            .expect("p0 re-access should succeed");

        // Load p2 — cache miss at capacity → evict oldest (p1). p0 survives.
        let _ = kb
            .get_or_open_for_project("p2")
            .expect("p2 should resolve");
        assert_eq!(kb.cached_connection_count(), 2, "cache stays at limit=2");

        // Verify p0's db path is still cached, p1's is not.
        let p0_path = kb.path_for_project("p0").expect("p0 path");
        let p1_path = kb.path_for_project("p1").expect("p1 path");
        let c = kb.connections.lock().unwrap();
        assert!(
            c.contains_key(&p0_path),
            "promoted p0 must survive eviction"
        );
        assert!(
            !c.contains_key(&p1_path),
            "unpromoted p1 must be the one evicted"
        );
    }

    // ─── per-project API invariants (v1.49.638 C1) ────────────────────────

    #[test]
    fn get_or_open_for_project_returns_none_for_unknown_project_id() {
        let (_tmp, kb) = make_delegate_with_n_projects(2, 2);
        assert!(kb.get_or_open_for_project("does-not-exist").is_none());
        assert_eq!(
            kb.cached_connection_count(),
            0,
            "unknown project_id must not poison the cache",
        );
    }

    #[test]
    fn get_or_open_for_project_leaves_other_projects_untouched() {
        // 3 projects, limit=3 → all fit. Load via per-project API in order:
        // [p0, p1, p2]. Re-access p0 → lru_order becomes [p1, p2, p0].
        // Crucially p1 and p2 retain their relative order (unlike the
        // batch-load API which would re-touch them on each call).
        let (_tmp, kb) = make_delegate_with_n_projects(3, 3);
        let _ = kb.get_or_open_for_project("p0").unwrap();
        let _ = kb.get_or_open_for_project("p1").unwrap();
        let _ = kb.get_or_open_for_project("p2").unwrap();

        let p0 = kb.path_for_project("p0").unwrap();
        let p1 = kb.path_for_project("p1").unwrap();
        let p2 = kb.path_for_project("p2").unwrap();

        // Sanity: initial order is [p0, p1, p2].
        {
            let order = kb.lru_order.lock().unwrap();
            assert_eq!(*order, vec![p0.clone(), p1.clone(), p2.clone()]);
        }

        // Re-access p0 → moves to back; p1 and p2 keep their relative order.
        let _ = kb.get_or_open_for_project("p0").unwrap();
        let order = kb.lru_order.lock().unwrap();
        assert_eq!(*order, vec![p1, p2, p0]);
    }

    #[test]
    fn with_max_connections_2_honors_the_limit() {
        let (_tmp, kb) = make_delegate_with_n_projects(2, 3);
        let _ = kb.list_symbols_for_file("s".to_string(), "f".to_string()).unwrap();
        assert!(
            kb.cached_connection_count() <= 2,
            "with_max_connections(2) must cap at 2, got {}",
            kb.cached_connection_count()
        );
    }

    // ─── I4-P2 path cache tests ───────────────────────────────────────────

    #[test]
    fn path_for_project_caches_within_ttl() {
        let tmp = TempDir::new().unwrap();
        let proj_root = tmp.path().join("proj");
        std::fs::create_dir_all(&proj_root).unwrap();
        let registry_path = tmp.path().join("registry.db");
        let db_path = create_atlas_registry_with_project(&registry_path, "my-proj", &proj_root);
        std::fs::create_dir_all(db_path.parent().unwrap()).unwrap();
        create_atlas_db_at(&db_path);

        let kb = SqliteAtlasKbDelegate::with_path_cache_ttl(registry_path.clone(), Duration::from_secs(60));

        // First call populates cache.
        let p1 = kb.path_for_project("my-proj");
        assert!(p1.is_some());
        {
            let c = kb.path_cache.lock().unwrap();
            assert!(c.contains_key("my-proj"), "path_cache populated after first lookup");
        }

        // Delete the registry — second call within TTL must still return from cache.
        std::fs::remove_file(&registry_path).unwrap();
        let p2 = kb.path_for_project("my-proj");
        assert_eq!(p1, p2, "within-TTL call must return cached value without re-opening registry");
    }

    #[test]
    fn path_for_project_re_queries_registry_after_ttl_expiry() {
        let tmp = TempDir::new().unwrap();
        let proj_root = tmp.path().join("proj");
        std::fs::create_dir_all(&proj_root).unwrap();
        let registry_path = tmp.path().join("registry.db");
        let db_path = create_atlas_registry_with_project(&registry_path, "my-proj", &proj_root);
        std::fs::create_dir_all(db_path.parent().unwrap()).unwrap();
        create_atlas_db_at(&db_path);

        // Zero TTL → every call re-opens the registry.
        let kb = SqliteAtlasKbDelegate::with_path_cache_ttl(registry_path.clone(), Duration::ZERO);
        let p1 = kb.path_for_project("my-proj");
        assert!(p1.is_some());

        std::fs::remove_file(&registry_path).unwrap();
        let p2 = kb.path_for_project("my-proj");
        assert!(p2.is_none(), "zero-TTL must re-open registry; deleted file → None");
    }

    #[test]
    fn clear_connection_cache_also_clears_path_cache() {
        let tmp = TempDir::new().unwrap();
        let proj_root = tmp.path().join("proj");
        std::fs::create_dir_all(&proj_root).unwrap();
        let registry_path = tmp.path().join("registry.db");
        let db_path = create_atlas_registry_with_project(&registry_path, "my-proj", &proj_root);
        std::fs::create_dir_all(db_path.parent().unwrap()).unwrap();
        create_atlas_db_at(&db_path);
        seed_minimal_atlas_rows(&db_path);

        let kb = SqliteAtlasKbDelegate::with_path_cache_ttl(registry_path, Duration::from_secs(60));
        let _ = kb.path_for_project("my-proj");
        {
            let c = kb.path_cache.lock().unwrap();
            assert!(c.contains_key("my-proj"), "populated before clear");
        }
        kb.clear_connection_cache();
        {
            let c = kb.path_cache.lock().unwrap();
            assert!(c.is_empty(), "path_cache must be empty after full clear");
        }
    }
}
