//! Tauri commands for the memory arena.
//!
//! Exposes the arena to TypeScript callers. Commands are held behind a
//! `tokio::sync::Mutex<Option<ArenaHandle>>` so the arena can be initialized
//! lazily and multiple commands can share one handle.
//!
//! All payloads are base64-encoded in IPC to keep the Tauri channel clean
//! and avoid JSON-unfriendly byte arrays.

use std::path::PathBuf;
use std::sync::Arc;

use base64::{engine::general_purpose::STANDARD as B64, Engine};
use serde::{Deserialize, Serialize};
use tauri::State;
use tokio::sync::Mutex;

use crate::memory_arena::{
    tier_kind_from_str, tier_kind_to_str, ArenaConfig, ArenaError, ArenaHandle, ArenaSet,
    ArenaSetConfig, ChunkId, GcReport, PoolSpec, SweepReport, TierKind, TierPolicy,
};

// ----------------------------------------------------------------------------
// Shared state
// ----------------------------------------------------------------------------

/// Tauri-managed state wrapping the optional arena handle. Wrapped in `Arc`
/// because Tauri's `State<T>` requires `Send + Sync + 'static`.
#[derive(Default)]
pub struct ArenaState {
    pub handle: Arc<Mutex<Option<ArenaHandle>>>,
}

// ----------------------------------------------------------------------------
// IPC DTOs
// ----------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArenaInitRequest {
    /// Directory to hold checkpoint + journal files.
    pub dir: String,
    /// Slot size in bytes. If omitted, uses the default 4 GiB.
    #[serde(default)]
    pub chunk_size: Option<u64>,
    /// Minimum chunk size allowed (validation bound). If omitted, uses default.
    #[serde(default)]
    pub min_chunk_size: Option<u64>,
    /// Maximum chunk size allowed (validation bound). If omitted, uses default.
    #[serde(default)]
    pub max_chunk_size: Option<u64>,
    /// Number of slots in a freshly-created arena. Ignored on recovery.
    pub num_slots: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArenaInitResponse {
    pub initialized: bool,
    pub recovered: bool,
    pub checkpoint_path: String,
    pub journal_path: String,
    pub stats: ArenaStatsDto,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArenaStatsDto {
    pub total_slots: usize,
    pub free_slots: usize,
    pub allocated_slots: usize,
    pub total_bytes: u64,
    pub free_bytes: u64,
    pub allocated_bytes: u64,
    pub next_chunk_id: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AllocRequest {
    /// Tier kind as string: "hot" | "warm" | "vector" | "blob" | "resident".
    pub tier: String,
    /// Base64-encoded payload bytes.
    pub payload_base64: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AllocResponse {
    pub chunk_id: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetChunkResponse {
    pub chunk_id: u64,
    pub tier: String,
    pub payload_base64: String,
    pub payload_size: u64,
    pub access_count: u64,
    pub created_at_ns: u64,
    pub last_access_ns: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListIdsResponse {
    pub chunk_ids: Vec<u64>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckpointResponse {
    pub checkpointed: bool,
    pub stats: ArenaStatsDto,
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/// Convert an `ArenaError` to the `String` Tauri commands return on failure.
fn err_string(e: ArenaError) -> String {
    e.to_string()
}

/// Convert an arena stats snapshot + next_chunk_id into the IPC DTO.
fn make_stats_dto(handle: &ArenaHandle) -> ArenaStatsDto {
    let stats = handle.arena().stats();
    ArenaStatsDto {
        total_slots: stats.total_slots,
        free_slots: stats.free_slots,
        allocated_slots: stats.allocated_slots,
        total_bytes: stats.total_bytes,
        free_bytes: stats.free_bytes,
        allocated_bytes: stats.allocated_bytes,
        next_chunk_id: handle.arena().next_chunk_id(),
    }
}

// ----------------------------------------------------------------------------
// Commands
// ----------------------------------------------------------------------------

/// Initialize (or recover) a persistent arena at the given directory.
///
/// If a checkpoint exists at `dir/arena.checkpoint`, it is loaded and any
/// journal entries at `dir/arena.journal` are replayed. Otherwise a fresh
/// arena is created with `num_slots` slots.
///
/// Idempotent: calling twice returns the current stats of the already-
/// initialized arena (subsequent init calls do NOT reset the arena).
#[tauri::command]
pub async fn arena_init(
    req: ArenaInitRequest,
    state: State<'_, ArenaState>,
) -> Result<ArenaInitResponse, String> {
    let mut guard = state.handle.lock().await;

    // Idempotent: if already initialized, just return current state.
    if let Some(h) = guard.as_ref() {
        return Ok(ArenaInitResponse {
            initialized: true,
            recovered: false, // already initialized; we don't know from here
            checkpoint_path: h.checkpoint_path().to_string_lossy().into_owned(),
            journal_path: h.journal_path().to_string_lossy().into_owned(),
            stats: make_stats_dto(h),
        });
    }

    let dir = PathBuf::from(&req.dir);

    let mut config = ArenaConfig::default();
    if let Some(size) = req.chunk_size {
        config.chunk_size = size;
    }
    if let Some(size) = req.min_chunk_size {
        config.min_chunk_size = size;
    }
    if let Some(size) = req.max_chunk_size {
        config.max_chunk_size = size;
    }

    let checkpoint_path = dir.join("arena.checkpoint");
    let recovered = checkpoint_path.exists();

    let handle = ArenaHandle::init(&dir, config, req.num_slots).map_err(err_string)?;

    let response = ArenaInitResponse {
        initialized: true,
        recovered,
        checkpoint_path: handle.checkpoint_path().to_string_lossy().into_owned(),
        journal_path: handle.journal_path().to_string_lossy().into_owned(),
        stats: make_stats_dto(&handle),
    };
    *guard = Some(handle);
    Ok(response)
}

/// Get current arena statistics. Errors if the arena hasn't been initialized.
#[tauri::command]
pub async fn arena_stats(state: State<'_, ArenaState>) -> Result<ArenaStatsDto, String> {
    let guard = state.handle.lock().await;
    let handle = guard.as_ref().ok_or_else(|| "arena not initialized".to_string())?;
    Ok(make_stats_dto(handle))
}

/// Allocate a chunk. Payload is base64 in, chunk_id out.
#[tauri::command]
pub async fn arena_alloc(
    req: AllocRequest,
    state: State<'_, ArenaState>,
) -> Result<AllocResponse, String> {
    let mut guard = state.handle.lock().await;
    let handle = guard
        .as_mut()
        .ok_or_else(|| "arena not initialized".to_string())?;

    let tier = tier_kind_from_str(&req.tier).map_err(|_| format!("unknown tier: {}", req.tier))?;
    let payload = B64.decode(&req.payload_base64)
        .map_err(|e| format!("base64 decode: {}", e))?;

    let id = handle.alloc(tier, payload).map_err(err_string)?;
    Ok(AllocResponse { chunk_id: id.as_u64() })
}

/// Read a chunk by id. Returns metadata + base64 payload.
#[tauri::command]
pub async fn arena_get(
    chunk_id: u64,
    state: State<'_, ArenaState>,
) -> Result<GetChunkResponse, String> {
    let guard = state.handle.lock().await;
    let handle = guard.as_ref().ok_or_else(|| "arena not initialized".to_string())?;

    let chunk = handle.get(ChunkId::new(chunk_id)).map_err(err_string)?;
    let header = chunk.header();
    let tier_str = tier_kind_to_str(header.tier).to_string();

    Ok(GetChunkResponse {
        chunk_id: header.chunk_id.as_u64(),
        tier: tier_str,
        payload_base64: B64.encode(chunk.payload()),
        payload_size: header.payload_size,
        access_count: header.access_count,
        created_at_ns: header.created_at_ns,
        last_access_ns: header.last_access_ns,
    })
}

/// Free a chunk by id. Journaled immediately.
#[tauri::command]
pub async fn arena_free(
    chunk_id: u64,
    state: State<'_, ArenaState>,
) -> Result<(), String> {
    let mut guard = state.handle.lock().await;
    let handle = guard
        .as_mut()
        .ok_or_else(|| "arena not initialized".to_string())?;
    handle.free(ChunkId::new(chunk_id)).map_err(err_string)
}

/// Touch a chunk — bump access count. Not journaled (in-memory only).
#[tauri::command]
pub async fn arena_touch(
    chunk_id: u64,
    state: State<'_, ArenaState>,
) -> Result<(), String> {
    let mut guard = state.handle.lock().await;
    let handle = guard
        .as_mut()
        .ok_or_else(|| "arena not initialized".to_string())?;
    handle.touch(ChunkId::new(chunk_id)).map_err(err_string)
}

/// Write a checkpoint and truncate the journal.
#[tauri::command]
pub async fn arena_checkpoint(
    state: State<'_, ArenaState>,
) -> Result<CheckpointResponse, String> {
    let mut guard = state.handle.lock().await;
    let handle = guard
        .as_mut()
        .ok_or_else(|| "arena not initialized".to_string())?;
    handle.checkpoint().map_err(err_string)?;
    Ok(CheckpointResponse {
        checkpointed: true,
        stats: make_stats_dto(handle),
    })
}

/// List all currently allocated chunk IDs. Not ordered.
#[tauri::command]
pub async fn arena_list_ids(state: State<'_, ArenaState>) -> Result<ListIdsResponse, String> {
    let guard = state.handle.lock().await;
    let handle = guard.as_ref().ok_or_else(|| "arena not initialized".to_string())?;
    let chunk_ids: Vec<u64> = handle.arena().iter_chunk_ids().map(|id| id.as_u64()).collect();
    Ok(ListIdsResponse { chunk_ids })
}

// ----------------------------------------------------------------------------
// M9-M13 IPC commands — ArenaSet (multi-pool) operations
// ----------------------------------------------------------------------------

/// Managed state for the multi-pool ArenaSet. Separate from `ArenaState`
/// so both the single-arena (checkpoint/journal) and multi-pool (mmap)
/// paths can coexist.
#[derive(Default)]
pub struct ArenaSetState {
    pub set: Arc<Mutex<Option<ArenaSet>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArenaSetInitRequest {
    pub dir: String,
    pub chunk_size: Option<u64>,
    pub pools: Vec<PoolSpecDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PoolSpecDto {
    pub tier: String,
    pub num_slots: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArenaSetInitResponse {
    pub initialized: bool,
    pub pool_count: usize,
    pub tiers: Vec<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SweepReportDto {
    pub promotes_initiated: u32,
    pub promotes_completed: u32,
    pub demotes_initiated: u32,
    pub demotes_completed: u32,
    pub evictions: u32,
    pub skipped_cooldown: u32,
    pub error_count: usize,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GcReportDto {
    pub targets_freed: u32,
    pub sources_reverted: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetChunkHotResponse {
    pub chunk_id: u64,
    pub payload_base64: String,
    pub payload_size: u64,
}

/// Initialize a multi-pool ArenaSet. Creates one mmap-backed pool per
/// requested tier. Idempotent.
#[tauri::command]
pub async fn arena_set_init(
    req: ArenaSetInitRequest,
    state: State<'_, ArenaSetState>,
) -> Result<ArenaSetInitResponse, String> {
    let mut guard = state.set.lock().await;

    if let Some(set) = guard.as_ref() {
        let tiers: Vec<String> = set.tiers().map(|t| tier_kind_to_str(t).to_string()).collect();
        return Ok(ArenaSetInitResponse {
            initialized: true,
            pool_count: tiers.len(),
            tiers,
        });
    }

    let dir = std::path::PathBuf::from(&req.dir);
    let chunk_size = req.chunk_size.unwrap_or(4096);

    let mut config = ArenaSetConfig::new(&dir);
    for pool_dto in &req.pools {
        let tier = tier_kind_from_str(&pool_dto.tier)
            .map_err(|_| format!("unknown tier: {}", pool_dto.tier))?;
        config = config.with_pool(PoolSpec {
            tier,
            chunk_size,
            num_slots: pool_dto.num_slots,
            policy: TierPolicy::default_for(tier),
            allocator: Default::default(),
        });
    }

    let set = if dir.join("manifest.json").exists() {
        ArenaSet::open_lazy(&dir).map_err(err_string)?
    } else {
        ArenaSet::create(config).map_err(err_string)?
    };

    let tiers: Vec<String> = set.tiers().map(|t| tier_kind_to_str(t).to_string()).collect();
    let pool_count = tiers.len();
    *guard = Some(set);

    Ok(ArenaSetInitResponse {
        initialized: true,
        pool_count,
        tiers,
    })
}

/// Allocate a chunk in a specific tier of the ArenaSet.
#[tauri::command]
pub async fn arena_set_alloc(
    tier: String,
    payload_base64: String,
    state: State<'_, ArenaSetState>,
) -> Result<AllocResponse, String> {
    let mut guard = state.set.lock().await;
    let set = guard.as_mut().ok_or_else(|| "arena set not initialized".to_string())?;
    let tier_kind = tier_kind_from_str(&tier).map_err(|_| format!("unknown tier: {}", tier))?;
    let payload = B64.decode(&payload_base64).map_err(|e| format!("base64 decode: {}", e))?;

    let pool = set.pool_mut(tier_kind).ok_or_else(|| format!("no pool for tier: {}", tier))?;
    let id = pool.alloc(payload).map_err(err_string)?;
    Ok(AllocResponse { chunk_id: id.as_u64() })
}

/// Read a chunk via get_chunk_hot (zero-copy, single header parse).
#[tauri::command]
pub async fn arena_set_get_hot(
    tier: String,
    chunk_id: u64,
    state: State<'_, ArenaSetState>,
) -> Result<GetChunkHotResponse, String> {
    let guard = state.set.lock().await;
    let set = guard.as_ref().ok_or_else(|| "arena set not initialized".to_string())?;
    let tier_kind = tier_kind_from_str(&tier).map_err(|_| format!("unknown tier: {}", tier))?;

    let pool = set.pool(tier_kind).ok_or_else(|| format!("no pool for tier: {}", tier))?;
    let payload = pool.arena().get_chunk_hot(ChunkId::new(chunk_id)).map_err(err_string)?;

    Ok(GetChunkHotResponse {
        chunk_id,
        payload_base64: B64.encode(payload),
        payload_size: payload.len() as u64,
    })
}

/// Run a policy sweep across all pools. Returns promotion/demotion counts.
#[tauri::command]
pub async fn arena_set_sweep(
    state: State<'_, ArenaSetState>,
) -> Result<SweepReportDto, String> {
    let mut guard = state.set.lock().await;
    let set = guard.as_mut().ok_or_else(|| "arena set not initialized".to_string())?;
    let report = set.run_policy_sweep();
    Ok(SweepReportDto {
        promotes_initiated: report.promotes_initiated,
        promotes_completed: report.promotes_completed,
        demotes_initiated: report.demotes_initiated,
        demotes_completed: report.demotes_completed,
        evictions: report.evictions,
        skipped_cooldown: report.skipped_cooldown,
        error_count: report.errors.len(),
    })
}

/// Garbage-collect orphaned crossfade targets.
#[tauri::command]
pub async fn arena_set_gc(
    state: State<'_, ArenaSetState>,
) -> Result<GcReportDto, String> {
    let mut guard = state.set.lock().await;
    let set = guard.as_mut().ok_or_else(|| "arena set not initialized".to_string())?;
    let report = set.gc_orphaned_targets();
    Ok(GcReportDto {
        targets_freed: report.targets_freed,
        sources_reverted: report.sources_reverted,
    })
}

/// Flush all pool mmaps, manifest, and crossfade registry to disk.
#[tauri::command]
pub async fn arena_set_flush(
    state: State<'_, ArenaSetState>,
) -> Result<(), String> {
    let guard = state.set.lock().await;
    let set = guard.as_ref().ok_or_else(|| "arena set not initialized".to_string())?;
    set.flush().map_err(err_string)
}

/// Free a chunk from a specific tier.
#[tauri::command]
pub async fn arena_set_free(
    tier: String,
    chunk_id: u64,
    state: State<'_, ArenaSetState>,
) -> Result<(), String> {
    let mut guard = state.set.lock().await;
    let set = guard.as_mut().ok_or_else(|| "arena set not initialized".to_string())?;
    let tier_kind = tier_kind_from_str(&tier).map_err(|_| format!("unknown tier: {}", tier))?;

    let pool = set.pool_mut(tier_kind).ok_or_else(|| format!("no pool for tier: {}", tier))?;
    pool.free(ChunkId::new(chunk_id)).map_err(err_string)
}

/// List all chunk IDs in a specific tier pool.
#[tauri::command]
pub async fn arena_set_list_ids(
    tier: String,
    state: State<'_, ArenaSetState>,
) -> Result<ListIdsResponse, String> {
    let guard = state.set.lock().await;
    let set = guard.as_ref().ok_or_else(|| "arena set not initialized".to_string())?;
    let tier_kind = tier_kind_from_str(&tier).map_err(|_| format!("unknown tier: {}", tier))?;

    let pool = set.pool(tier_kind).ok_or_else(|| format!("no pool for tier: {}", tier))?;
    let chunk_ids: Vec<u64> = pool.arena().iter_chunk_ids().map(|id| id.as_u64()).collect();
    Ok(ListIdsResponse { chunk_ids })
}

// ----------------------------------------------------------------------------
// CgroupEnforcer state + IPC commands
// ----------------------------------------------------------------------------

/// Tauri-managed state for the cgroup memory enforcer.
#[derive(Default)]
pub struct CgroupState {
    pub enforcer: Arc<Mutex<Option<crate::memory_arena::CgroupEnforcer>>>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CgroupStateResponse {
    pub limit_bytes: u64,
    pub current_bytes: u64,
    pub swap_limit_bytes: u64,
    pub headroom_bytes: u64,
    pub utilization: f64,
    pub can_grow: bool,
}

/// Initialize the cgroup enforcer: set memory.max to 8 GiB, disable swap.
#[tauri::command]
pub async fn cgroup_init(state: State<'_, CgroupState>) -> Result<CgroupStateResponse, String> {
    let mut guard = state.enforcer.lock().await;
    let mut enforcer = crate::memory_arena::CgroupEnforcer::discover()
        .map_err(|e| e.to_string())?;
    enforcer.initialize().map_err(|e| e.to_string())?;
    let mem_state = enforcer.state().map_err(|e| e.to_string())?;
    let can_grow = enforcer.can_grow();
    *guard = Some(enforcer);
    Ok(CgroupStateResponse {
        limit_bytes: mem_state.limit_bytes,
        current_bytes: mem_state.current_bytes,
        swap_limit_bytes: mem_state.swap_limit_bytes,
        headroom_bytes: mem_state.headroom_bytes,
        utilization: mem_state.utilization,
        can_grow,
    })
}

/// Query current cgroup memory state.
#[tauri::command]
pub async fn cgroup_state(state: State<'_, CgroupState>) -> Result<CgroupStateResponse, String> {
    let guard = state.enforcer.lock().await;
    let enforcer = guard.as_ref().ok_or_else(|| "cgroup not initialized".to_string())?;
    let mem_state = enforcer.state().map_err(|e| e.to_string())?;
    Ok(CgroupStateResponse {
        limit_bytes: mem_state.limit_bytes,
        current_bytes: mem_state.current_bytes,
        swap_limit_bytes: mem_state.swap_limit_bytes,
        headroom_bytes: mem_state.headroom_bytes,
        utilization: mem_state.utilization,
        can_grow: enforcer.can_grow(),
    })
}

/// Grow the cgroup memory limit by one step (4 GiB).
#[tauri::command]
pub async fn cgroup_grow(state: State<'_, CgroupState>) -> Result<CgroupStateResponse, String> {
    let mut guard = state.enforcer.lock().await;
    let enforcer = guard.as_mut().ok_or_else(|| "cgroup not initialized".to_string())?;
    enforcer.grow().map_err(|e| e.to_string())?;
    let mem_state = enforcer.state().map_err(|e| e.to_string())?;
    Ok(CgroupStateResponse {
        limit_bytes: mem_state.limit_bytes,
        current_bytes: mem_state.current_bytes,
        swap_limit_bytes: mem_state.swap_limit_bytes,
        headroom_bytes: mem_state.headroom_bytes,
        utilization: mem_state.utilization,
        can_grow: enforcer.can_grow(),
    })
}

// ----------------------------------------------------------------------------
// Tests (async, using tempdir)
// ----------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::memory_arena::ArenaHandle;
    use tempfile::tempdir;

    /// Build an ArenaHandle directly (without going through the Tauri state)
    /// so we can exercise the DTO conversion and command logic.
    fn make_test_handle(dir: &std::path::Path) -> ArenaHandle {
        ArenaHandle::init(dir, ArenaConfig::test(), 4).unwrap()
    }

    #[test]
    fn make_stats_dto_reflects_arena_state() {
        let dir = tempdir().unwrap();
        let mut handle = make_test_handle(dir.path());
        let dto = make_stats_dto(&handle);
        assert_eq!(dto.total_slots, 4);
        assert_eq!(dto.allocated_slots, 0);
        assert_eq!(dto.free_slots, 4);
        assert_eq!(dto.next_chunk_id, 1);

        handle.alloc(TierKind::Hot, vec![1u8; 64]).unwrap();
        let dto2 = make_stats_dto(&handle);
        assert_eq!(dto2.allocated_slots, 1);
        assert_eq!(dto2.free_slots, 3);
        assert_eq!(dto2.next_chunk_id, 2);
    }

    #[test]
    fn tier_string_roundtrip() {
        for s in ["hot", "warm", "vector", "blob", "resident"] {
            let tier = tier_kind_from_str(s).unwrap();
            assert_eq!(tier_kind_to_str(tier), s);
        }
    }

    #[test]
    fn tier_string_rejects_unknown() {
        assert!(tier_kind_from_str("bogus").is_err());
    }

    #[test]
    fn handle_survives_warm_start() {
        // Initialize handle, alloc, checkpoint, drop.
        let dir = tempdir().unwrap();
        let id = {
            let mut h = make_test_handle(dir.path());
            let id = h.alloc(TierKind::Blob, b"warm-start-survivor".to_vec()).unwrap();
            h.checkpoint().unwrap();
            id
        };

        // Reinit from the same directory — should recover.
        let h2 = ArenaHandle::init(dir.path(), ArenaConfig::test(), 4).unwrap();
        let chunk = h2.get(id).unwrap();
        assert_eq!(chunk.payload(), b"warm-start-survivor");
    }

    #[test]
    fn handle_replays_journal_after_crash() {
        // Simulate: alloc some chunks, WITHOUT checkpointing, then "crash"
        // (drop the handle), then reinit — the journal should replay.
        let dir = tempdir().unwrap();
        let (id1, id2) = {
            let mut h = make_test_handle(dir.path());
            let id1 = h.alloc(TierKind::Hot, b"first".to_vec()).unwrap();
            let id2 = h.alloc(TierKind::Warm, b"second".to_vec()).unwrap();
            // NO checkpoint — simulate sudden crash.
            (id1, id2)
        };

        // Reinit — journal replay should recover both.
        let h2 = ArenaHandle::init(dir.path(), ArenaConfig::test(), 4).unwrap();
        assert!(h2.arena().contains(id1));
        assert!(h2.arena().contains(id2));
        assert_eq!(h2.get(id1).unwrap().payload(), b"first");
        assert_eq!(h2.get(id2).unwrap().payload(), b"second");
    }

    #[test]
    fn handle_checkpoint_truncates_journal() {
        let dir = tempdir().unwrap();
        let mut h = make_test_handle(dir.path());
        h.alloc(TierKind::Hot, b"one".to_vec()).unwrap();
        h.alloc(TierKind::Hot, b"two".to_vec()).unwrap();

        let size_before = std::fs::metadata(h.journal_path()).unwrap().len();
        assert!(size_before > 12, "journal should have records");

        h.checkpoint().unwrap();

        let size_after = std::fs::metadata(h.journal_path()).unwrap().len();
        assert_eq!(size_after, 12, "journal should be truncated to header");
    }

    #[test]
    fn handle_full_lifecycle_with_free() {
        let dir = tempdir().unwrap();
        let mut h = make_test_handle(dir.path());

        let a = h.alloc(TierKind::Hot, b"a".to_vec()).unwrap();
        let b = h.alloc(TierKind::Hot, b"b".to_vec()).unwrap();
        let c = h.alloc(TierKind::Hot, b"c".to_vec()).unwrap();

        h.free(b).unwrap();
        h.checkpoint().unwrap();

        // Restart.
        drop(h);
        let h2 = ArenaHandle::init(dir.path(), ArenaConfig::test(), 4).unwrap();
        assert!(h2.arena().contains(a));
        assert!(!h2.arena().contains(b));
        assert!(h2.arena().contains(c));
    }

    #[test]
    fn alloc_request_decodes_base64_payload() {
        // Sanity: the request DTO accepts base64 content.
        let encoded = B64.encode(b"hello");
        let req = AllocRequest {
            tier: "blob".into(),
            payload_base64: encoded.clone(),
        };
        let decoded = B64.decode(&req.payload_base64).unwrap();
        assert_eq!(decoded, b"hello");
    }

    // ──────────────────────────────────────────────────────────
    // ArenaSet IPC tests (Path 1: M9-M13 commands)
    // ──────────────────────────────────────────────────────────

    fn make_test_arena_set(dir: &std::path::Path) -> ArenaSet {
        let config = ArenaConfig::test();
        let set_config = ArenaSetConfig::new(dir)
            .with_pool(PoolSpec {
                tier: TierKind::Hot,
                chunk_size: config.chunk_size,
                num_slots: 8,
                policy: TierPolicy::default_for(TierKind::Hot),
                allocator: Default::default(),
            })
            .with_pool(PoolSpec {
                tier: TierKind::Blob,
                chunk_size: config.chunk_size,
                num_slots: 16,
                policy: TierPolicy::default_for(TierKind::Blob),
                allocator: Default::default(),
            });
        ArenaSet::create(set_config).unwrap()
    }

    #[test]
    fn arena_set_alloc_and_get_hot_roundtrip() {
        let dir = tempdir().unwrap();
        let mut set = make_test_arena_set(dir.path());

        let pool = set.pool_mut(TierKind::Hot).unwrap();
        let id = pool.alloc(vec![0xAB; 128]).unwrap();

        let payload = pool.arena().get_chunk_hot(id).unwrap();
        assert_eq!(payload, &[0xAB; 128]);
    }

    #[test]
    fn arena_set_sweep_returns_dto_compatible_report() {
        let dir = tempdir().unwrap();
        let mut set = make_test_arena_set(dir.path());
        let report = set.run_policy_sweep();
        // Empty set sweep should complete cleanly.
        let dto = SweepReportDto {
            promotes_initiated: report.promotes_initiated,
            promotes_completed: report.promotes_completed,
            demotes_initiated: report.demotes_initiated,
            demotes_completed: report.demotes_completed,
            evictions: report.evictions,
            skipped_cooldown: report.skipped_cooldown,
            error_count: report.errors.len(),
        };
        // Should serialize cleanly.
        let json = serde_json::to_string(&dto).unwrap();
        assert!(json.contains("promotesInitiated"));
    }

    #[test]
    fn arena_set_gc_returns_dto_compatible_report() {
        let dir = tempdir().unwrap();
        let mut set = make_test_arena_set(dir.path());
        let report = set.gc_orphaned_targets();
        let dto = GcReportDto {
            targets_freed: report.targets_freed,
            sources_reverted: report.sources_reverted,
        };
        let json = serde_json::to_string(&dto).unwrap();
        assert!(json.contains("targetsFreed"));
    }

    #[test]
    fn arena_set_flush_and_reopen() {
        let dir = tempdir().unwrap();
        {
            let mut set = make_test_arena_set(dir.path());
            let pool = set.pool_mut(TierKind::Hot).unwrap();
            pool.alloc(vec![42; 64]).unwrap();
            set.flush().unwrap();
        }
        // Reopen.
        let set2 = ArenaSet::open_lazy(dir.path()).unwrap();
        assert_eq!(set2.pool(TierKind::Hot).unwrap().len(), 1);
    }

    #[test]
    fn pool_spec_dto_serialization() {
        let dto = PoolSpecDto {
            tier: "hot".into(),
            num_slots: 8,
        };
        let json = serde_json::to_string(&dto).unwrap();
        assert!(json.contains("\"tier\":\"hot\""));
        let back: PoolSpecDto = serde_json::from_str(&json).unwrap();
        assert_eq!(back.tier, "hot");
        assert_eq!(back.num_slots, 8);
    }
}
