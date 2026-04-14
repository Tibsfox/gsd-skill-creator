//! Tier pools — typed memory regions with per-tier allocation policy.
//!
//! This module lands the structural primitives for Deliverable D1 of the
//! memory-arena-m1 phase. It ships:
//!
//! - `EvictionKind` / `TierPolicy` (re-exported from `types.rs` so
//!   `ArenaConfig::default_policies` can reference them without a cycle)
//! - `TierPool` — an `Arena` wrapped with a `TierKind` and a `TierPolicy`;
//!   enforces `max_chunks` on allocation
//!
//! Plan 04 extends this module with `ArenaSet`, `Manifest`, and `ArenaSetConfig`
//! — the multi-pool container that owns N `TierPool`s and a manifest.json.
//!
//! Hard rules from MISSION.md:
//! - All tunables flow through `ArenaConfig` / `TierPolicy` — no hardcoded
//!   constants in pool logic
//! - No `unsafe` in this file
//! - `max_chunks == 0` is treated as "unlimited" to keep the default policy
//!   a hint rather than a hard wall

pub use crate::memory_arena::types::{EvictionKind, TierPolicy};

use std::collections::HashMap;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::memory_arena::arena::Arena;
use crate::memory_arena::error::{ArenaError, ArenaResult};
use crate::memory_arena::types::{
    AllocatorSelector, ArenaConfig, ChunkId, ChunkState, SweepReport, TierKind, MAX_CHUNK_SIZE,
    MIN_CHUNK_SIZE,
};

#[cfg(feature = "cuda")]
use std::sync::Arc;
#[cfg(feature = "cuda")]
use crate::memory_arena::vram::{VramContext, VramPool};

/// Handle returned by `ArenaSet::begin_demote`. Callers pass it to
/// `complete_demote` or `abort_demote` to finalize or reverse the crossfade.
///
/// `Copy` so callers can stash it alongside other per-chunk metadata
/// without dealing with ownership moves.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CrossfadeHandle {
    pub source: ChunkId,
    pub source_tier: TierKind,
    pub target: ChunkId,
    pub target_tier: TierKind,
}

/// In-memory registry of in-flight crossfades (both demote and promote).
/// Keyed by `(source_tier, source_chunk_id)` so a chunk is allowed to
/// fade at most once at a time.
///
/// **Persistence (M10).** The registry is flushed to `<root>/crossfades.json`
/// by `ArenaSet::flush()` and restored on `ArenaSet::open`. On clean
/// shutdown the file is empty (or absent). On crash, the persisted entries
/// enable `gc_orphaned_targets()` to free unreachable target chunks instead
/// of leaking them.
#[derive(Debug, Default)]
pub(crate) struct CrossfadeRegistry {
    by_source: HashMap<(TierKind, ChunkId), CrossfadeHandle>,
}

impl CrossfadeRegistry {
    pub(crate) fn new() -> Self {
        Self {
            by_source: HashMap::new(),
        }
    }

    /// Insert a new in-flight fade. Rejects with `AlreadyFading` if a fade
    /// for the same source is already in progress.
    pub(crate) fn insert(&mut self, h: CrossfadeHandle) -> ArenaResult<()> {
        let key = (h.source_tier, h.source);
        if self.by_source.contains_key(&key) {
            return Err(ArenaError::AlreadyFading {
                chunk_id: h.source.as_u64(),
            });
        }
        self.by_source.insert(key, h);
        Ok(())
    }

    /// Get the handle for an in-flight fade, if any.
    pub(crate) fn get(&self, tier: TierKind, id: ChunkId) -> Option<CrossfadeHandle> {
        self.by_source.get(&(tier, id)).copied()
    }

    /// Remove an in-flight fade. Returns the previously-registered handle
    /// if present.
    pub(crate) fn remove(
        &mut self,
        tier: TierKind,
        id: ChunkId,
    ) -> Option<CrossfadeHandle> {
        self.by_source.remove(&(tier, id))
    }

    /// True if the registry has no in-flight fades.
    pub(crate) fn is_empty(&self) -> bool {
        self.by_source.is_empty()
    }

    /// Serialize all in-flight handles to a Vec for persistence.
    pub(crate) fn to_vec(&self) -> Vec<CrossfadeHandle> {
        self.by_source.values().copied().collect()
    }

    /// Restore registry from a persisted list of handles.
    pub(crate) fn from_vec(handles: Vec<CrossfadeHandle>) -> Self {
        let mut by_source = HashMap::with_capacity(handles.len());
        for h in handles {
            by_source.insert((h.source_tier, h.source), h);
        }
        Self { by_source }
    }
}

/// A tier pool wraps an `Arena` with a `TierKind` label and a `TierPolicy`.
/// Allocation enforces `max_chunks` BEFORE delegating to the inner arena so
/// the policy is a first-class gate rather than an afterthought.
#[derive(Debug)]
pub struct TierPool {
    tier: TierKind,
    arena: Arena,
    policy: TierPolicy,
    allocated_chunks: u32,
}

impl TierPool {
    /// Build a new tier pool. Delegates storage to `Arena::new`, so this is
    /// a heap-backed pool. File-backed pools come through `ArenaSet::create`
    /// in Plan 04.
    pub fn new(
        tier: TierKind,
        config: ArenaConfig,
        num_slots: usize,
        policy: TierPolicy,
    ) -> ArenaResult<Self> {
        let arena = Arena::new(config, num_slots)?;
        Ok(Self {
            tier,
            arena,
            policy,
            allocated_chunks: 0,
        })
    }

    /// Construct a pool wrapping a pre-built `Arena` (used by `ArenaSet` in
    /// Plan 04 where the arena is mmap-backed).
    pub(crate) fn from_arena(tier: TierKind, arena: Arena, policy: TierPolicy) -> Self {
        Self {
            tier,
            arena,
            policy,
            allocated_chunks: 0,
        }
    }

    /// Tier kind accessor.
    pub fn tier(&self) -> TierKind {
        self.tier
    }

    /// Policy accessor.
    pub fn policy(&self) -> &TierPolicy {
        &self.policy
    }

    /// Read-only access to the underlying arena.
    pub fn arena(&self) -> &Arena {
        &self.arena
    }

    /// Mutable access to the underlying arena. Callers MUST NOT alloc/free
    /// directly through this handle if they want `allocated_chunks` to stay
    /// accurate — use `alloc` / `free` on the `TierPool` instead.
    pub fn arena_mut(&mut self) -> &mut Arena {
        &mut self.arena
    }

    /// Current number of chunks this pool has allocated.
    pub fn len(&self) -> u32 {
        self.allocated_chunks
    }

    /// True if this pool currently holds zero chunks.
    pub fn is_empty(&self) -> bool {
        self.allocated_chunks == 0
    }

    /// Allocate a chunk into this pool. Enforces `policy.max_chunks` (if
    /// non-zero) before delegating to `Arena::alloc_chunk`.
    pub fn alloc(&mut self, payload: Vec<u8>) -> ArenaResult<ChunkId> {
        if self.policy.max_chunks != 0 && self.allocated_chunks >= self.policy.max_chunks {
            return Err(ArenaError::PoolFull {
                tier: self.tier,
                max_chunks: self.policy.max_chunks,
            });
        }
        let id = self.arena.alloc_chunk(self.tier, payload)?;
        self.allocated_chunks += 1;
        Ok(id)
    }

    /// Free a chunk from this pool.
    pub fn free(&mut self, id: ChunkId) -> ArenaResult<()> {
        self.arena.free_chunk(id)?;
        // Saturating to be defensive against callers who call free twice or
        // who manipulated the inner arena directly.
        self.allocated_chunks = self.allocated_chunks.saturating_sub(1);
        Ok(())
    }

    /// Re-register an existing on-disk slot during warm-start. Bumps the
    /// `allocated_chunks` counter and delegates the arena bookkeeping to
    /// `Arena::reinsert_slot`. Used exclusively by `WarmStart::open` —
    /// callers MUST have already validated the slot's header + checksum
    /// before calling this.
    pub(crate) fn warm_start_reinsert(
        &mut self,
        slot: usize,
        id: ChunkId,
    ) -> ArenaResult<()> {
        self.arena.reinsert_slot(slot, id)?;
        self.allocated_chunks += 1;
        Ok(())
    }

    /// Override the `allocated_chunks` counter. Used by `ArenaSet::open_lazy`
    /// to sync the pool's counter with an arena that was pre-populated by
    /// `Arena::open_lazy` — the lazy walk happens inside `Arena`, below the
    /// `TierPool` layer, so the pool's counter would otherwise stay at 0
    /// even though the directory is full.
    pub(crate) fn set_allocated_chunks(&mut self, count: u32) {
        self.allocated_chunks = count;
    }

    /// Journal-replay alloc hook. Wraps `Arena::apply_alloc` and updates
    /// `allocated_chunks` atomically with the arena-level insert, closing
    /// the slice-2 counter-drift caveat. Idempotent: double-replay of the
    /// same `chunk_id` is a no-op for both the arena and the counter.
    ///
    /// Used by `persistence::replay_into_set`.
    pub(crate) fn replay_alloc(
        &mut self,
        id: ChunkId,
        chunk_bytes: &[u8],
    ) -> ArenaResult<()> {
        let was_present = self.arena.contains(id);
        self.arena.apply_alloc(id, chunk_bytes)?;
        if !was_present && self.arena.contains(id) {
            self.allocated_chunks += 1;
        }
        Ok(())
    }

    /// Journal-replay free hook. Wraps `Arena::apply_free` and updates
    /// `allocated_chunks` atomically with the arena-level removal.
    /// Idempotent: freeing a chunk that isn't present is a no-op for both
    /// the arena and the counter.
    ///
    /// Used by `persistence::replay_into_set`.
    pub(crate) fn replay_free(&mut self, id: ChunkId) -> ArenaResult<()> {
        let was_present = self.arena.contains(id);
        self.arena.apply_free(id)?;
        if was_present && !self.arena.contains(id) {
            self.allocated_chunks = self.allocated_chunks.saturating_sub(1);
        }
        Ok(())
    }

    /// Evict a single chunk from this pool using its configured eviction
    /// policy. Returns the freed `ChunkId`, or `None` if the pool is empty.
    ///
    /// - `EvictionKind::Lru`: pops `lru_oldest()` from the arena.
    /// - `EvictionKind::Fifo`: scans the directory for the oldest
    ///   `created_at_ns` and frees that chunk.
    pub fn evict_lru(&mut self) -> ArenaResult<Option<ChunkId>> {
        if self.is_empty() {
            return Ok(None);
        }
        let victim = match self.policy.eviction {
            EvictionKind::Lru => self.arena.lru_oldest(),
            EvictionKind::Fifo => {
                // Scan all allocated chunks for the oldest created_at_ns.
                let mut oldest_id: Option<ChunkId> = None;
                let mut oldest_ts: u64 = u64::MAX;
                for (id, _slot) in self.arena.directory_entries() {
                    let ts = self.arena.read_created_at_ns(id)?;
                    if ts < oldest_ts {
                        oldest_ts = ts;
                        oldest_id = Some(id);
                    }
                }
                oldest_id
            }
        };
        match victim {
            Some(id) => {
                self.free(id)?;
                Ok(Some(id))
            }
            None => Ok(None),
        }
    }
}

// =============================================================================
// ArenaSet — multi-pool container with on-disk manifest
// =============================================================================

/// Current on-disk manifest format version. Bumped on incompatible changes.
pub const ARENA_SET_FORMAT_VERSION: u16 = 1;

/// Spec for a single pool in an `ArenaSet`. Fully serializable into the
/// manifest. Every field is load-bearing for reopening the arena set.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PoolSpec {
    pub tier: TierKind,
    pub chunk_size: u64,
    pub num_slots: usize,
    pub policy: TierPolicy,
    /// Which allocator strategy to use for this pool's arena. Defaults to
    /// `FixedSlot` for backward compat with legacy manifests that omit
    /// this field.
    #[serde(default)]
    pub allocator: AllocatorSelector,
}

/// Build-time config for an `ArenaSet`. Holds the root directory and the
/// list of pool specs. Construct via `ArenaSetConfig::new(root).with_pool(...)`.
#[derive(Debug, Clone)]
pub struct ArenaSetConfig {
    root: PathBuf,
    pools: Vec<PoolSpec>,
    #[cfg(feature = "cuda")]
    vram_context: Option<Arc<VramContext>>,
}

impl ArenaSetConfig {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self {
            root: root.into(),
            pools: Vec::new(),
            #[cfg(feature = "cuda")]
            vram_context: None,
        }
    }

    pub fn with_pool(mut self, spec: PoolSpec) -> Self {
        self.pools.push(spec);
        self
    }

    /// Attach a CUDA context for VRAM-backed Vector tier pools.
    #[cfg(feature = "cuda")]
    pub fn with_vram_context(mut self, ctx: Arc<VramContext>) -> Self {
        self.vram_context = Some(ctx);
        self
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn pools(&self) -> &[PoolSpec] {
        &self.pools
    }
}

/// The on-disk manifest. Serialized as JSON at `<root>/manifest.json`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Manifest {
    pub version: u16,
    pub pools: Vec<PoolSpec>,
}

/// Lowercase filename stem for a tier's backing arena file. Each `TierKind`
/// gets a stable lowercase name so `<root>/hot.arena`, `<root>/warm.arena`
/// etc. can be opened by name.
fn tier_filename_stem(tier: TierKind) -> &'static str {
    match tier {
        TierKind::Hot => "hot",
        TierKind::Warm => "warm",
        TierKind::Vector => "vector",
        TierKind::Blob => "blob",
        TierKind::Resident => "resident",
    }
}

/// Build an `ArenaConfig` appropriate for a pool spec. The default
/// `min_chunk_size` and `max_chunk_size` are derived from the spec's
/// chunk_size, clamped to the global MIN/MAX constants. This keeps the
/// validation permissive enough that a reopened pool doesn't spuriously
/// reject its own stored size.
fn arena_config_for_spec(spec: &PoolSpec) -> ArenaConfig {
    let min = (spec.chunk_size / 64).max(MIN_CHUNK_SIZE).min(spec.chunk_size);
    let max = (spec.chunk_size.saturating_mul(4))
        .min(MAX_CHUNK_SIZE)
        .max(spec.chunk_size);
    ArenaConfig {
        chunk_size: spec.chunk_size,
        min_chunk_size: min,
        max_chunk_size: max,
        default_policies: ArenaConfig::default().default_policies,
    }
}

/// Multi-pool container backed by a root directory containing `manifest.json`
/// and one `<tier>.arena` file per configured pool. The entry point for
/// warm-start recovery in Plan 05.
///
/// Chunk-id namespaces are per-pool: a Hot `ChunkId(1)` and a Warm
/// `ChunkId(1)` are distinct, independent chunks in separate arenas.
pub struct ArenaSet {
    root: PathBuf,
    pools: HashMap<TierKind, TierPool>,
    manifest: Manifest,
    /// In-memory registry of in-flight demote crossfades. Not persisted.
    crossfade_registry: CrossfadeRegistry,
    /// Now-ns function pointer — defaults to the real monotonic system
    /// clock (unix nanoseconds). Tests override via `set_now_ns_for_test`
    /// so hysteresis timing can be asserted deterministically without
    /// wall-clock sleeps.
    now_ns: fn() -> u64,
    /// VRAM pool for Vector tier (device memory). Only present when a
    /// VramContext was provided at creation time AND a Vector pool spec
    /// exists. VRAM crossfades route through this pool instead of the
    /// mmap-backed TierPool for the Vector tier.
    #[cfg(feature = "cuda")]
    vram_pool: Option<VramPool>,
    /// Tracks which in-flight crossfades involve VRAM (source or target
    /// is the VramPool). Keyed by (source_tier, source_id) — same key
    /// space as crossfade_registry. Used by complete/abort to know
    /// whether to free from VramPool vs TierPool.
    #[cfg(feature = "cuda")]
    vram_crossfades: std::collections::HashSet<(TierKind, ChunkId)>,
}

/// Default clock: unix nanoseconds from `SystemTime`. Defined as a free
/// function so it can be stored as a `fn()` pointer on `ArenaSet`.
fn real_now_ns() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos() as u64)
        .unwrap_or(0)
}

impl std::fmt::Debug for ArenaSet {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ArenaSet")
            .field("root", &self.root)
            .field("pool_count", &self.pools.len())
            .field("manifest_version", &self.manifest.version)
            .finish()
    }
}

/// Internal crossfade direction. Used by the shared
/// `begin_crossfade_inner` helper to select which cooldown/timestamp
/// fields to consult for hysteresis. Not a public type — callers use
/// `begin_demote` / `begin_promote` directly.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum CrossfadeDirection {
    Demote,
    Promote,
}

impl ArenaSet {
    /// Create a fresh arena set at the config's root directory. Writes a
    /// fresh `manifest.json` and creates one `<tier>.arena` file per pool.
    /// Fails with `ArenaError::AlreadyExists` if `manifest.json` already
    /// exists at the root.
    pub fn create(config: ArenaSetConfig) -> ArenaResult<Self> {
        fs::create_dir_all(&config.root)?;

        let manifest_path = config.root.join("manifest.json");
        if manifest_path.exists() {
            return Err(ArenaError::AlreadyExists { path: manifest_path });
        }

        let mut pools = HashMap::with_capacity(config.pools.len());
        for spec in &config.pools {
            let arena_path = config.root.join(format!("{}.arena", tier_filename_stem(spec.tier)));
            let arena_config = arena_config_for_spec(spec);
            let arena = Arena::new_mmap_file(arena_config, spec.num_slots, &arena_path)?;
            let pool = TierPool::from_arena(spec.tier, arena, spec.policy);
            pools.insert(spec.tier, pool);
        }

        let manifest = Manifest {
            version: ARENA_SET_FORMAT_VERSION,
            pools: config.pools.clone(),
        };
        write_manifest_atomic(&manifest_path, &manifest)?;

        // Build VRAM pool if a VramContext was provided and a Vector pool
        // spec exists. The Vector TierPool is still created above (for
        // manifest compat) but the VramPool is the actual backing store.
        #[cfg(feature = "cuda")]
        let vram_pool = {
            if let Some(ctx) = &config.vram_context {
                config
                    .pools
                    .iter()
                    .find(|s| s.tier == TierKind::Vector)
                    .map(|spec| {
                        VramPool::new(
                            ctx.clone(),
                            spec.tier,
                            spec.chunk_size,
                            spec.num_slots,
                            spec.policy,
                        )
                    })
                    .transpose()?
            } else {
                None
            }
        };

        Ok(Self {
            root: config.root,
            pools,
            manifest,
            crossfade_registry: CrossfadeRegistry::new(),
            now_ns: real_now_ns,
            #[cfg(feature = "cuda")]
            vram_pool,
            #[cfg(feature = "cuda")]
            vram_crossfades: std::collections::HashSet::new(),
        })
    }

    /// Same as `create` but uses `Arena::new_mmap_file_hugetlb` for all
    /// pools, requesting 2 MiB huge pages via MAP_HUGETLB. Falls back to
    /// standard mmap per-pool if huge pages are unavailable.
    pub fn create_with_hugetlb(config: ArenaSetConfig) -> ArenaResult<Self> {
        fs::create_dir_all(&config.root)?;

        let manifest_path = config.root.join("manifest.json");
        if manifest_path.exists() {
            return Err(ArenaError::AlreadyExists { path: manifest_path });
        }

        let mut pools = HashMap::with_capacity(config.pools.len());
        for spec in &config.pools {
            let arena_path = config.root.join(format!("{}.arena", tier_filename_stem(spec.tier)));
            let arena_config = arena_config_for_spec(spec);
            let arena = Arena::new_mmap_file_hugetlb(arena_config, spec.num_slots, &arena_path)?;
            let pool = TierPool::from_arena(spec.tier, arena, spec.policy);
            pools.insert(spec.tier, pool);
        }

        let manifest = Manifest {
            version: ARENA_SET_FORMAT_VERSION,
            pools: config.pools.clone(),
        };
        write_manifest_atomic(&manifest_path, &manifest)?;

        #[cfg(feature = "cuda")]
        let vram_pool = {
            if let Some(ctx) = &config.vram_context {
                config
                    .pools
                    .iter()
                    .find(|s| s.tier == TierKind::Vector)
                    .map(|spec| {
                        VramPool::new(
                            ctx.clone(),
                            spec.tier,
                            spec.chunk_size,
                            spec.num_slots,
                            spec.policy,
                        )
                    })
                    .transpose()?
            } else {
                None
            }
        };

        Ok(Self {
            root: config.root,
            pools,
            manifest,
            crossfade_registry: CrossfadeRegistry::new(),
            now_ns: real_now_ns,
            #[cfg(feature = "cuda")]
            vram_pool,
            #[cfg(feature = "cuda")]
            vram_crossfades: std::collections::HashSet::new(),
        })
    }

    /// Reopen an existing arena set by reading `<root>/manifest.json`.
    /// The per-tier .arena files are reopened via `Arena::new_mmap_file`,
    /// which preserves their byte content across process restarts.
    ///
    /// This is the **eager** reopen path — pools come back with empty
    /// directories; the caller (typically `WarmStart::open_with_config`
    /// in eager mode) walks each slot and re-registers chunks via
    /// `reinsert_slot`. For the **lazy** reopen path that pre-populates
    /// directories via `Arena::open_lazy`, see `ArenaSet::open_lazy`.
    pub fn open(root: impl AsRef<Path>) -> ArenaResult<Self> {
        Self::open_inner(root, /*lazy=*/ false)
    }

    /// Reopen an existing arena set using the **lazy** header walk.
    ///
    /// Each pool's arena is opened via `Arena::open_lazy`, which walks
    /// slot headers and pre-populates the directory without touching
    /// payload bytes. This is the hot path for slice-2 warm-start: it
    /// turns M1's `warm_start_100k = 1.43 s` eager walk into a header-
    /// only walk with deferred payload validation.
    ///
    /// Structural corruption (bad magic / bad header / oversized
    /// payload_size) is absorbed into the free stack at the `Arena`
    /// level and never surfaces as an error. Payload-checksum corruption
    /// is invisible until a caller invokes `get_chunk` (which
    /// re-validates) or `validate_chunk` (explicit).
    pub fn open_lazy(root: impl AsRef<Path>) -> ArenaResult<Self> {
        Self::open_inner(root, /*lazy=*/ true)
    }

    fn open_inner(root: impl AsRef<Path>, lazy: bool) -> ArenaResult<Self> {
        let root = root.as_ref().to_path_buf();
        let manifest_path = root.join("manifest.json");
        let manifest_bytes = fs::read(&manifest_path)?;
        let manifest: Manifest = serde_json::from_slice(&manifest_bytes)
            .map_err(|e| ArenaError::ManifestParse(e.to_string()))?;
        if manifest.version != ARENA_SET_FORMAT_VERSION {
            return Err(ArenaError::ManifestVersionMismatch {
                have: manifest.version,
                want: ARENA_SET_FORMAT_VERSION,
            });
        }

        let mut pools = HashMap::with_capacity(manifest.pools.len());
        for spec in &manifest.pools {
            let arena_path = root.join(format!("{}.arena", tier_filename_stem(spec.tier)));
            let arena_config = arena_config_for_spec(spec);
            let arena = if lazy {
                Arena::open_lazy(arena_config, spec.num_slots, &arena_path)?
            } else {
                Arena::new_mmap_file(arena_config, spec.num_slots, &arena_path)?
            };
            let mut pool = TierPool::from_arena(spec.tier, arena, spec.policy);
            if lazy {
                // Lazy open pre-populated the arena's directory. Sync the
                // pool's allocated_chunks counter so `pool.len()` reflects
                // the reopened state without requiring the caller to walk
                // again.
                let count = pool.arena().stats().allocated_slots as u32;
                pool.set_allocated_chunks(count);
            }
            pools.insert(spec.tier, pool);
        }

        // Restore persisted crossfade registry (M10). This must happen
        // BEFORE the orphan recovery sweep so GC can use the handles.
        let persisted_handles = read_crossfade_registry(&root)?;
        let crossfade_registry = CrossfadeRegistry::from_vec(persisted_handles);

        // Orphaned-fade recovery sweep (M4). FadingOut chunks whose source
        // is NOT in the restored registry are crash orphans — revert them
        // to Resident. FadingOut chunks WITH a registry entry are resumable
        // crossfades — leave them as FadingOut so complete_* can finish.
        for pool in pools.values_mut() {
            let ids_to_recover: Vec<ChunkId> = pool
                .arena()
                .directory_entries()
                .filter_map(|(id, _slot)| {
                    match pool.arena().chunk_state(id) {
                        Ok(ChunkState::FadingOut) => {
                            // If this chunk is a known source in the restored
                            // registry, the crossfade is resumable — skip.
                            if crossfade_registry.get(pool.tier(), id).is_some() {
                                None
                            } else {
                                Some(id)
                            }
                        }
                        _ => None,
                    }
                })
                .collect();
            for id in ids_to_recover {
                pool.arena_mut()
                    .mark_state(id, ChunkState::Resident)?;
            }
        }

        Ok(Self {
            root,
            pools,
            manifest,
            crossfade_registry,
            now_ns: real_now_ns,
            // VRAM pools are not persisted — they must be re-created
            // with a fresh VramContext after process restart. VRAM is
            // volatile by definition (see MISSION.md non-goals).
            #[cfg(feature = "cuda")]
            vram_pool: None,
            #[cfg(feature = "cuda")]
            vram_crossfades: std::collections::HashSet::new(),
        })
    }

    /// Override the clock function. Test-only — tests call this to inject
    /// a deterministic clock so hysteresis timing can be asserted without
    /// wall-clock sleeps.
    #[doc(hidden)]
    pub fn set_now_ns_for_test(&mut self, f: fn() -> u64) {
        self.now_ns = f;
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn manifest(&self) -> &Manifest {
        &self.manifest
    }

    pub fn pool(&self, tier: TierKind) -> Option<&TierPool> {
        self.pools.get(&tier)
    }

    pub fn pool_mut(&mut self, tier: TierKind) -> Option<&mut TierPool> {
        self.pools.get_mut(&tier)
    }

    pub fn tiers(&self) -> impl Iterator<Item = TierKind> + '_ {
        self.pools.keys().copied()
    }

    /// Access the VRAM pool, if one was configured.
    #[cfg(feature = "cuda")]
    pub fn vram_pool(&self) -> Option<&VramPool> {
        self.vram_pool.as_ref()
    }

    /// Mutable access to the VRAM pool, if one was configured.
    #[cfg(feature = "cuda")]
    pub fn vram_pool_mut(&mut self) -> Option<&mut VramPool> {
        self.vram_pool.as_mut()
    }

    /// Returns true if a VRAM pool is configured and the given tier is
    /// the Vector tier (meaning it should route through VRAM).
    #[cfg(feature = "cuda")]
    fn is_vram_tier(&self, tier: TierKind) -> bool {
        tier == TierKind::Vector && self.vram_pool.is_some()
    }

    /// Return the next hotter configured tier (by heat_index), or `None`
    /// if `tier` is already the hottest configured tier. Only considers
    /// tiers that have pools in this ArenaSet.
    pub fn hotter_tier(&self, tier: TierKind) -> Option<TierKind> {
        let base = tier.heat_index();
        self.pools
            .keys()
            .filter(|t| t.heat_index() > base)
            .min_by_key(|t| t.heat_index())
            .copied()
    }

    /// Return the next colder configured tier (by heat_index), or `None`
    /// if `tier` is already the coldest configured tier. Only considers
    /// tiers that have pools in this ArenaSet.
    pub fn colder_tier(&self, tier: TierKind) -> Option<TierKind> {
        let base = tier.heat_index();
        self.pools
            .keys()
            .filter(|t| t.heat_index() < base)
            .max_by_key(|t| t.heat_index())
            .copied()
    }

    // =========================================================================
    // Crossfade primitives (M3 demote + M4 promote via shared helpers)
    // =========================================================================

    /// Shared implementation for both `begin_demote` and `begin_promote`.
    /// The logic is identical in both directions — the only difference is
    /// which cooldown policy field and which timestamp accessor to use for
    /// the hysteresis check.
    fn begin_crossfade_inner(
        &mut self,
        direction: CrossfadeDirection,
        source_tier: TierKind,
        source_id: ChunkId,
        target_tier: TierKind,
    ) -> ArenaResult<CrossfadeHandle> {
        if source_tier == target_tier {
            return Err(ArenaError::InvalidCrossfadeTarget {
                source_tier,
                target_tier,
            });
        }

        // Quick pre-check: reject a second fade on the same source before
        // we do any work. `insert` below catches it too, but surfacing the
        // error early avoids any mutation of target pool state.
        if self
            .crossfade_registry
            .get(source_tier, source_id)
            .is_some()
        {
            return Err(ArenaError::AlreadyFading {
                chunk_id: source_id.as_u64(),
            });
        }

        // Ensure both pools exist up front so we fail fast.
        if !self.pools.contains_key(&source_tier) {
            return Err(ArenaError::UnknownTier(source_tier));
        }
        if !self.pools.contains_key(&target_tier) {
            return Err(ArenaError::UnknownTier(target_tier));
        }

        // Hysteresis cooldown check. The direction selects which policy
        // field (demote_cooldown_ns vs promote_cooldown_ns) and which
        // timestamp (read_last_demote_ns vs read_last_promote_ns) to use.
        // Skipped for VRAM sources — VramPool has no chunk header timestamps.
        {
            #[cfg(feature = "cuda")]
            let skip_hysteresis = self.is_vram_tier(source_tier);
            #[cfg(not(feature = "cuda"))]
            let skip_hysteresis = false;

            if !skip_hysteresis {
                let source_pool = self
                    .pools
                    .get(&source_tier)
                    .ok_or(ArenaError::UnknownTier(source_tier))?;
                let (cooldown, last) = match direction {
                    CrossfadeDirection::Demote => (
                        source_pool.policy().demote_cooldown_ns,
                        source_pool.arena().read_last_demote_ns(source_id)?,
                    ),
                    CrossfadeDirection::Promote => (
                        source_pool.policy().promote_cooldown_ns,
                        source_pool.arena().read_last_promote_ns(source_id)?,
                    ),
                };
                if cooldown > 0 && last > 0 {
                    let now = (self.now_ns)();
                    let elapsed = now.saturating_sub(last);
                    if elapsed < cooldown {
                        return Err(ArenaError::HysteresisCooldown {
                            chunk_id: source_id.as_u64(),
                            cooldown_remaining_ns: cooldown - elapsed,
                        });
                    }
                }
            }
        }

        // Determine if either side is VRAM-backed.
        #[cfg(feature = "cuda")]
        let source_is_vram = self.is_vram_tier(source_tier);
        #[cfg(feature = "cuda")]
        let target_is_vram = self.is_vram_tier(target_tier);

        // 1. Snapshot the source chunk's payload.
        // RAM source: `get_chunk` validates the checksum.
        // VRAM source: download from VramPool.
        let payload = {
            #[cfg(feature = "cuda")]
            {
                if source_is_vram {
                    self.vram_pool
                        .as_ref()
                        .ok_or(ArenaError::UnknownTier(source_tier))?
                        .get(source_id)?
                } else {
                    let source_pool = self
                        .pools
                        .get(&source_tier)
                        .ok_or(ArenaError::UnknownTier(source_tier))?;
                    let chunk = source_pool.arena().get_chunk(source_id)?;
                    chunk.payload().to_vec()
                }
            }
            #[cfg(not(feature = "cuda"))]
            {
                let source_pool = self
                    .pools
                    .get(&source_tier)
                    .ok_or(ArenaError::UnknownTier(source_tier))?;
                let chunk = source_pool.arena().get_chunk(source_id)?;
                chunk.payload().to_vec()
            }
        };

        // 2. Allocate the target chunk.
        // RAM target: alloc in TierPool.
        // VRAM target: alloc in VramPool (upload to device).
        let target_id = {
            #[cfg(feature = "cuda")]
            {
                if target_is_vram {
                    self.vram_pool
                        .as_mut()
                        .ok_or(ArenaError::UnknownTier(target_tier))?
                        .alloc(&payload)?
                } else {
                    let target_pool = self
                        .pools
                        .get_mut(&target_tier)
                        .ok_or(ArenaError::UnknownTier(target_tier))?;
                    target_pool.alloc(payload)?
                }
            }
            #[cfg(not(feature = "cuda"))]
            {
                let target_pool = self
                    .pools
                    .get_mut(&target_tier)
                    .ok_or(ArenaError::UnknownTier(target_tier))?;
                target_pool.alloc(payload)?
            }
        };

        // 3. Flip the source chunk's state byte to `FadingOut`.
        // VRAM source: no state byte — VramPool doesn't have chunk headers.
        {
            #[cfg(feature = "cuda")]
            let skip_mark = source_is_vram;
            #[cfg(not(feature = "cuda"))]
            let skip_mark = false;

            if !skip_mark {
                let source_pool = self
                    .pools
                    .get_mut(&source_tier)
                    .ok_or(ArenaError::UnknownTier(source_tier))?;
                source_pool
                    .arena_mut()
                    .mark_state(source_id, ChunkState::FadingOut)?;
            }
        }

        // 4. Register the handle.
        let handle = CrossfadeHandle {
            source: source_id,
            source_tier,
            target: target_id,
            target_tier,
        };
        self.crossfade_registry.insert(handle)?;

        // Track VRAM involvement so complete/abort knows which pool to free.
        #[cfg(feature = "cuda")]
        if source_is_vram || target_is_vram {
            self.vram_crossfades.insert((source_tier, source_id));
        }

        Ok(handle)
    }

    /// Begin a demote crossfade: copy the source chunk's payload into a
    /// fresh chunk in `target_tier`, then mark the source's state byte as
    /// `FadingOut`. Returns a `CrossfadeHandle` that the caller passes to
    /// `complete_demote` (to finalize) or `abort_demote` (to reverse).
    ///
    /// # Errors
    /// - `InvalidCrossfadeTarget` if `source_tier == target_tier`.
    /// - `UnknownTier(t)` if either tier is not configured in this set.
    /// - `UnknownChunkId(id)` if `source_id` is not allocated in `source_tier`.
    /// - `AlreadyFading { chunk_id }` if the source is already in an
    ///   in-flight fade.
    /// - `PoolFull` if the target pool is out of slots.
    pub fn begin_demote(
        &mut self,
        source_tier: TierKind,
        source_id: ChunkId,
        target_tier: TierKind,
    ) -> ArenaResult<CrossfadeHandle> {
        self.begin_crossfade_inner(CrossfadeDirection::Demote, source_tier, source_id, target_tier)
    }

    /// Begin a promote crossfade: copy the source chunk's payload into a
    /// fresh chunk in `target_tier`, then mark the source's state byte as
    /// `FadingOut`. Returns a `CrossfadeHandle` that the caller passes to
    /// `complete_promote` (to finalize) or `abort_promote` (to reverse).
    ///
    /// The mechanics are identical to `begin_demote` — the direction is
    /// caller semantics (warm->hot vs hot->warm), not mechanism. The only
    /// difference is which hysteresis fields are consulted
    /// (`promote_cooldown_ns` / `last_promote_completed_at_ns`).
    pub fn begin_promote(
        &mut self,
        source_tier: TierKind,
        source_id: ChunkId,
        target_tier: TierKind,
    ) -> ArenaResult<CrossfadeHandle> {
        self.begin_crossfade_inner(CrossfadeDirection::Promote, source_tier, source_id, target_tier)
    }

    /// Shared implementation for `complete_demote` and `complete_promote`.
    /// The only parameterization is which timestamp to write on the target:
    /// demote writes `last_demote_completed_at_ns`, promote writes
    /// `last_promote_completed_at_ns`.
    fn complete_crossfade_inner(
        &mut self,
        direction: CrossfadeDirection,
        handle: CrossfadeHandle,
    ) -> ArenaResult<ChunkId> {
        // 1. Verify the handle is still registered.
        let registered = self
            .crossfade_registry
            .get(handle.source_tier, handle.source)
            .ok_or(ArenaError::UnknownCrossfade {
                chunk_id: handle.source.as_u64(),
            })?;
        if registered != handle {
            return Err(ArenaError::UnknownCrossfade {
                chunk_id: handle.source.as_u64(),
            });
        }

        #[cfg(feature = "cuda")]
        let is_vram_fade = self
            .vram_crossfades
            .contains(&(handle.source_tier, handle.source));
        #[cfg(feature = "cuda")]
        let source_is_vram = self.is_vram_tier(handle.source_tier);
        #[cfg(feature = "cuda")]
        let target_is_vram = self.is_vram_tier(handle.target_tier);

        // 2. Verify the source is still in FadingOut.
        // Skipped for VRAM sources — no state byte.
        {
            #[cfg(feature = "cuda")]
            let skip_check = source_is_vram;
            #[cfg(not(feature = "cuda"))]
            let skip_check = false;

            if !skip_check {
                let source_state = self
                    .pools
                    .get(&handle.source_tier)
                    .ok_or(ArenaError::UnknownTier(handle.source_tier))?
                    .arena()
                    .chunk_state(handle.source)?;
                if source_state != ChunkState::FadingOut {
                    return Err(ArenaError::CrossfadeStateMismatch {
                        chunk_id: handle.source.as_u64(),
                        expected: ChunkState::FadingOut,
                        found: source_state,
                    });
                }
            }
        }

        // 3. Stamp the target chunk's completion timestamp.
        // Skipped for VRAM targets — no chunk headers.
        {
            #[cfg(feature = "cuda")]
            let skip_stamp = target_is_vram;
            #[cfg(not(feature = "cuda"))]
            let skip_stamp = false;

            if !skip_stamp {
                let now = (self.now_ns)();
                let target_pool = self
                    .pools
                    .get_mut(&handle.target_tier)
                    .ok_or(ArenaError::UnknownTier(handle.target_tier))?;
                match direction {
                    CrossfadeDirection::Demote => {
                        target_pool
                            .arena_mut()
                            .write_last_demote_ns(handle.target, now)?;
                    }
                    CrossfadeDirection::Promote => {
                        target_pool
                            .arena_mut()
                            .write_last_promote_ns(handle.target, now)?;
                    }
                }
            }
        }

        // 4. Free the source chunk.
        // VRAM source: free from VramPool.
        // RAM source: free from TierPool.
        {
            #[cfg(feature = "cuda")]
            {
                if source_is_vram {
                    self.vram_pool
                        .as_mut()
                        .ok_or(ArenaError::UnknownTier(handle.source_tier))?
                        .free(handle.source)?;
                } else {
                    let source_pool = self
                        .pools
                        .get_mut(&handle.source_tier)
                        .ok_or(ArenaError::UnknownTier(handle.source_tier))?;
                    source_pool.free(handle.source)?;
                }
            }
            #[cfg(not(feature = "cuda"))]
            {
                let source_pool = self
                    .pools
                    .get_mut(&handle.source_tier)
                    .ok_or(ArenaError::UnknownTier(handle.source_tier))?;
                source_pool.free(handle.source)?;
            }
        }

        // 5. Deregister.
        self.crossfade_registry
            .remove(handle.source_tier, handle.source);
        #[cfg(feature = "cuda")]
        if is_vram_fade {
            self.vram_crossfades
                .remove(&(handle.source_tier, handle.source));
        }

        Ok(handle.target)
    }

    /// Shared implementation for `abort_demote` and `abort_promote`.
    /// Abort is fully direction-agnostic: restore source to Resident,
    /// free target, deregister. No timestamp is written on abort.
    fn abort_crossfade_inner(&mut self, handle: CrossfadeHandle) -> ArenaResult<()> {
        // 1. Verify the handle is still registered.
        let registered = self
            .crossfade_registry
            .get(handle.source_tier, handle.source)
            .ok_or(ArenaError::UnknownCrossfade {
                chunk_id: handle.source.as_u64(),
            })?;
        if registered != handle {
            return Err(ArenaError::UnknownCrossfade {
                chunk_id: handle.source.as_u64(),
            });
        }

        #[cfg(feature = "cuda")]
        let is_vram_fade = self
            .vram_crossfades
            .contains(&(handle.source_tier, handle.source));
        #[cfg(feature = "cuda")]
        let source_is_vram = self.is_vram_tier(handle.source_tier);
        #[cfg(feature = "cuda")]
        let target_is_vram = self.is_vram_tier(handle.target_tier);

        // 2. Restore source state to Resident FIRST.
        // Skipped for VRAM sources — no state byte.
        {
            #[cfg(feature = "cuda")]
            let skip_restore = source_is_vram;
            #[cfg(not(feature = "cuda"))]
            let skip_restore = false;

            if !skip_restore {
                let source_pool = self
                    .pools
                    .get_mut(&handle.source_tier)
                    .ok_or(ArenaError::UnknownTier(handle.source_tier))?;
                source_pool
                    .arena_mut()
                    .mark_state(handle.source, ChunkState::Resident)?;
            }
        }

        // 3. Free the target chunk.
        // VRAM target: free from VramPool.
        // RAM target: free from TierPool.
        {
            #[cfg(feature = "cuda")]
            {
                if target_is_vram {
                    self.vram_pool
                        .as_mut()
                        .ok_or(ArenaError::UnknownTier(handle.target_tier))?
                        .free(handle.target)?;
                } else {
                    let target_pool = self
                        .pools
                        .get_mut(&handle.target_tier)
                        .ok_or(ArenaError::UnknownTier(handle.target_tier))?;
                    target_pool.free(handle.target)?;
                }
            }
            #[cfg(not(feature = "cuda"))]
            {
                let target_pool = self
                    .pools
                    .get_mut(&handle.target_tier)
                    .ok_or(ArenaError::UnknownTier(handle.target_tier))?;
                target_pool.free(handle.target)?;
            }
        }

        // 4. Deregister.
        self.crossfade_registry
            .remove(handle.source_tier, handle.source);
        #[cfg(feature = "cuda")]
        if is_vram_fade {
            self.vram_crossfades
                .remove(&(handle.source_tier, handle.source));
        }

        Ok(())
    }

    /// Finalize a demote crossfade: free the source chunk and return the
    /// target chunk id as the canonical reference going forward.
    pub fn complete_demote(&mut self, handle: CrossfadeHandle) -> ArenaResult<ChunkId> {
        self.complete_crossfade_inner(CrossfadeDirection::Demote, handle)
    }

    /// Finalize a promote crossfade: free the source chunk and return the
    /// target chunk id as the canonical reference going forward.
    pub fn complete_promote(&mut self, handle: CrossfadeHandle) -> ArenaResult<ChunkId> {
        self.complete_crossfade_inner(CrossfadeDirection::Promote, handle)
    }

    /// Reverse a demote crossfade: free the target chunk and restore the
    /// source's state byte to `Resident`.
    ///
    /// **Ordering rationale.** The source state byte is restored to
    /// `Resident` BEFORE the target is freed. If the process crashes
    /// mid-abort, the worst-case residue is an orphaned target (leak of
    /// slot space, recoverable by warm-start) rather than a `FadingOut`
    /// source with no reachable target.
    pub fn abort_demote(&mut self, handle: CrossfadeHandle) -> ArenaResult<()> {
        self.abort_crossfade_inner(handle)
    }

    /// Reverse a promote crossfade: free the target chunk and restore the
    /// source's state byte to `Resident`. Same crash-safety ordering as
    /// `abort_demote`.
    pub fn abort_promote(&mut self, handle: CrossfadeHandle) -> ArenaResult<()> {
        self.abort_crossfade_inner(handle)
    }

    // =========================================================================
    // Policy sweep driver (M5)
    // =========================================================================

    /// Run a single synchronous policy sweep across all pools. Inspects
    /// every allocated chunk, compares access_count / last_access_ns
    /// against the pool's `TierPolicy` thresholds, and initiates +
    /// completes crossfades for any chunk that qualifies.
    ///
    /// Every crossfade initiated in this sweep is completed in the same
    /// sweep — no deferred completion, no in-flight fades persist.
    ///
    /// Pools are processed hottest-first (by `TierKind::heat_index`)
    /// to avoid promote-then-demote oscillation within a single sweep.
    pub fn run_policy_sweep(&mut self) -> SweepReport {
        let mut report = SweepReport::new();
        let now = (self.now_ns)();

        // Collect configured tiers sorted by heat_index descending (hottest first).
        let mut tiers: Vec<TierKind> = self.pools.keys().copied().collect();
        tiers.sort_by(|a, b| b.heat_index().cmp(&a.heat_index()));

        for tier in tiers {
            // Snapshot chunk ids to avoid borrow conflicts on &mut self.
            let chunk_ids: Vec<ChunkId> = match self.pools.get(&tier) {
                Some(pool) => pool.arena().iter_chunk_ids().collect(),
                None => continue,
            };

            let policy = match self.pools.get(&tier) {
                Some(pool) => *pool.policy(),
                None => continue,
            };

            for id in chunk_ids {
                // Skip if chunk was freed by an earlier step in this sweep
                // (e.g. eviction).
                if !self.pools.get(&tier).map_or(false, |p| p.arena().contains(id)) {
                    continue;
                }

                // --- Promote check ---
                if policy.promote_after_hits > 0 {
                    if let Some(target_tier) = self.hotter_tier(tier) {
                        let access_count = match self.pools.get(&tier)
                            .and_then(|p| p.arena().read_access_count(id).ok())
                        {
                            Some(c) => c,
                            None => continue,
                        };

                        if access_count >= policy.promote_after_hits as u64 {
                            match self.begin_promote(tier, id, target_tier) {
                                Ok(handle) => {
                                    report.promotes_initiated += 1;
                                    match self.complete_promote(handle) {
                                        Ok(target_id) => {
                                            report.promotes_completed += 1;
                                            // Reset access count on the promoted target.
                                            if let Some(tp) = self.pools.get_mut(&target_tier) {
                                                let _ = tp.arena_mut().reset_access_count(target_id);
                                            }
                                        }
                                        Err(e) => {
                                            report.errors.push((id, tier, e));
                                        }
                                    }
                                    continue; // Source freed, skip demote check.
                                }
                                Err(ArenaError::PoolFull { .. }) => {
                                    // Evict from target pool and retry once.
                                    if let Some(tp) = self.pools.get_mut(&target_tier) {
                                        match tp.evict_lru() {
                                            Ok(Some(_)) => {
                                                report.evictions += 1;
                                            }
                                            Ok(None) => {
                                                // Target empty but full? Shouldn't happen.
                                                continue;
                                            }
                                            Err(e) => {
                                                report.errors.push((id, tier, e));
                                                continue;
                                            }
                                        }
                                    }
                                    // Retry promote after eviction.
                                    match self.begin_promote(tier, id, target_tier) {
                                        Ok(handle) => {
                                            report.promotes_initiated += 1;
                                            match self.complete_promote(handle) {
                                                Ok(target_id) => {
                                                    report.promotes_completed += 1;
                                                    if let Some(tp) = self.pools.get_mut(&target_tier) {
                                                        let _ = tp.arena_mut().reset_access_count(target_id);
                                                    }
                                                }
                                                Err(e) => {
                                                    report.errors.push((id, tier, e));
                                                }
                                            }
                                            continue;
                                        }
                                        Err(e) => {
                                            report.errors.push((id, tier, e));
                                            continue;
                                        }
                                    }
                                }
                                Err(ArenaError::HysteresisCooldown { .. }) => {
                                    report.skipped_cooldown += 1;
                                }
                                Err(ArenaError::AlreadyFading { .. }) => {
                                    report.skipped_already_fading += 1;
                                }
                                Err(e) => {
                                    report.errors.push((id, tier, e));
                                }
                            }
                        }
                    }
                }

                // --- Demote check ---
                if policy.demote_after_idle_ns > 0 {
                    if let Some(target_tier) = self.colder_tier(tier) {
                        // Re-check chunk still exists (might have been evicted).
                        if !self.pools.get(&tier).map_or(false, |p| p.arena().contains(id)) {
                            continue;
                        }

                        let last_access = match self.pools.get(&tier)
                            .and_then(|p| p.arena().read_last_access_ns(id).ok())
                        {
                            Some(ts) => ts,
                            None => continue,
                        };

                        let idle_ns = now.saturating_sub(last_access);
                        if idle_ns >= policy.demote_after_idle_ns {
                            match self.begin_demote(tier, id, target_tier) {
                                Ok(handle) => {
                                    report.demotes_initiated += 1;
                                    match self.complete_demote(handle) {
                                        Ok(_) => {
                                            report.demotes_completed += 1;
                                        }
                                        Err(e) => {
                                            report.errors.push((id, tier, e));
                                        }
                                    }
                                }
                                Err(ArenaError::PoolFull { .. }) => {
                                    // Evict from target pool and retry once.
                                    if let Some(tp) = self.pools.get_mut(&target_tier) {
                                        match tp.evict_lru() {
                                            Ok(Some(_)) => {
                                                report.evictions += 1;
                                            }
                                            Ok(None) => continue,
                                            Err(e) => {
                                                report.errors.push((id, tier, e));
                                                continue;
                                            }
                                        }
                                    }
                                    match self.begin_demote(tier, id, target_tier) {
                                        Ok(handle) => {
                                            report.demotes_initiated += 1;
                                            match self.complete_demote(handle) {
                                                Ok(_) => {
                                                    report.demotes_completed += 1;
                                                }
                                                Err(e) => {
                                                    report.errors.push((id, tier, e));
                                                }
                                            }
                                        }
                                        Err(ArenaError::HysteresisCooldown { .. }) => {
                                            report.skipped_cooldown += 1;
                                        }
                                        Err(ArenaError::AlreadyFading { .. }) => {
                                            report.skipped_already_fading += 1;
                                        }
                                        Err(e) => {
                                            report.errors.push((id, tier, e));
                                        }
                                    }
                                }
                                Err(ArenaError::HysteresisCooldown { .. }) => {
                                    report.skipped_cooldown += 1;
                                }
                                Err(ArenaError::AlreadyFading { .. }) => {
                                    report.skipped_already_fading += 1;
                                }
                                Err(e) => {
                                    report.errors.push((id, tier, e));
                                }
                            }
                        }
                    }
                }
            }
        }

        report
    }

    /// Flush all pool mmaps and rewrite the manifest atomically. Also
    /// persists the crossfade registry to `crossfades.json` if any fades
    /// are in-flight, or removes the file if the registry is empty.
    pub fn flush(&self) -> ArenaResult<()> {
        for pool in self.pools.values() {
            pool.arena().flush_mmap()?;
        }
        let manifest_path = self.root.join("manifest.json");
        write_manifest_atomic(&manifest_path, &self.manifest)?;

        // Persist the crossfade registry (M10).
        let crossfades_path = self.root.join("crossfades.json");
        if self.crossfade_registry.is_empty() {
            // Clean shutdown — no in-flight fades. Remove the file if it
            // exists so a future open doesn't try to resume stale entries.
            let _ = fs::remove_file(&crossfades_path);
        } else {
            let handles = self.crossfade_registry.to_vec();
            write_json_atomic(&crossfades_path, &handles)?;
        }
        Ok(())
    }

    // =========================================================================
    // Orphan-target GC (M10)
    // =========================================================================

    /// Garbage-collect all in-flight crossfade entries from the restored
    /// registry. For each persisted handle:
    ///
    /// 1. If the source is still `FadingOut`, revert it to `Resident`.
    /// 2. Free the target chunk from its pool.
    /// 3. Remove the handle from the registry.
    ///
    /// After a crash, both the source data and target data are intact on
    /// disk. GC chooses the safe path: keep the source (it's the original),
    /// discard the target (it's the copy). Callers that want to RESUME a
    /// crossfade instead of cleaning it up should call `complete_demote` /
    /// `complete_promote` with the restored handle before calling GC.
    ///
    /// Call after `WarmStart::open` to reclaim leaked slots.
    pub fn gc_orphaned_targets(&mut self) -> GcReport {
        let mut report = GcReport::default();

        // Snapshot the registry handles — consume them so we can mutate pools.
        let handles: Vec<CrossfadeHandle> = self.crossfade_registry.to_vec();

        for handle in handles {
            // Revert source to Resident if it's still FadingOut.
            let source_exists = self
                .pools
                .get(&handle.source_tier)
                .map_or(false, |p| p.arena().contains(handle.source));

            if source_exists {
                let is_fading = self
                    .pools
                    .get(&handle.source_tier)
                    .and_then(|p| p.arena().chunk_state(handle.source).ok())
                    .map_or(false, |s| s == ChunkState::FadingOut);

                if is_fading {
                    if let Some(pool) = self.pools.get_mut(&handle.source_tier) {
                        let _ = pool.arena_mut().mark_state(handle.source, ChunkState::Resident);
                    }
                    report.sources_reverted += 1;
                }
            }

            // Free the target chunk (the orphaned copy).
            // Free the target chunk from its pool.
            let freed = {
                #[cfg(feature = "cuda")]
                {
                    if self.is_vram_tier(handle.target_tier) {
                        self.vram_pool
                            .as_mut()
                            .map(|vp| vp.free(handle.target).is_ok())
                            .unwrap_or(false)
                    } else {
                        self.pools
                            .get_mut(&handle.target_tier)
                            .map(|p| p.free(handle.target).is_ok())
                            .unwrap_or(false)
                    }
                }
                #[cfg(not(feature = "cuda"))]
                {
                    self.pools
                        .get_mut(&handle.target_tier)
                        .map(|p| p.free(handle.target).is_ok())
                        .unwrap_or(false)
                }
            };

            if freed {
                report.targets_freed += 1;
            }

            // Remove the stale handle from the registry.
            self.crossfade_registry
                .remove(handle.source_tier, handle.source);
        }

        report
    }
}

/// Report returned by `ArenaSet::gc_orphaned_targets`.
#[derive(Debug, Default, Clone, Copy)]
pub struct GcReport {
    /// Number of orphaned target chunks freed.
    pub targets_freed: u32,
    /// Number of FadingOut sources reverted to Resident.
    pub sources_reverted: u32,
}

/// Atomic manifest write: serialize to a temp file in the same directory,
/// fsync, then rename over the real path. The rename is atomic on POSIX,
/// so a crash mid-write can't leave a half-written manifest.
fn write_manifest_atomic(path: &Path, manifest: &Manifest) -> ArenaResult<()> {
    let tmp_path = path.with_extension("json.tmp");
    {
        let mut tmp_file = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&tmp_path)?;
        let bytes = serde_json::to_vec_pretty(manifest)
            .map_err(|e| ArenaError::ManifestParse(e.to_string()))?;
        tmp_file.write_all(&bytes)?;
        tmp_file.sync_all()?;
    }
    fs::rename(&tmp_path, path)?;
    Ok(())
}

/// Atomic JSON write for any serializable value. Same temp-file + rename
/// pattern as `write_manifest_atomic`.
fn write_json_atomic<T: serde::Serialize>(path: &Path, value: &T) -> ArenaResult<()> {
    let tmp_path = path.with_extension("json.tmp");
    {
        let mut tmp_file = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&tmp_path)?;
        let bytes = serde_json::to_vec_pretty(value)
            .map_err(|e| ArenaError::ManifestParse(e.to_string()))?;
        tmp_file.write_all(&bytes)?;
        tmp_file.sync_all()?;
    }
    fs::rename(&tmp_path, path)?;
    Ok(())
}

/// Read the persisted crossfade registry from `<root>/crossfades.json`.
/// Returns an empty Vec if the file doesn't exist (clean shutdown or
/// fresh arena). Returns an error only on actual I/O or parse failures.
fn read_crossfade_registry(root: &Path) -> ArenaResult<Vec<CrossfadeHandle>> {
    let path = root.join("crossfades.json");
    if !path.exists() {
        return Ok(Vec::new());
    }
    let bytes = fs::read(&path)?;
    let handles: Vec<CrossfadeHandle> = serde_json::from_slice(&bytes)
        .map_err(|e| ArenaError::ManifestParse(format!("crossfades.json: {}", e)))?;
    Ok(handles)
}
