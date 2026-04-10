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
    ArenaConfig, ChunkId, TierKind, MAX_CHUNK_SIZE, MIN_CHUNK_SIZE,
};

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
}

/// Build-time config for an `ArenaSet`. Holds the root directory and the
/// list of pool specs. Construct via `ArenaSetConfig::new(root).with_pool(...)`.
#[derive(Debug, Clone)]
pub struct ArenaSetConfig {
    root: PathBuf,
    pools: Vec<PoolSpec>,
}

impl ArenaSetConfig {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self {
            root: root.into(),
            pools: Vec::new(),
        }
    }

    pub fn with_pool(mut self, spec: PoolSpec) -> Self {
        self.pools.push(spec);
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

        Ok(Self {
            root: config.root,
            pools,
            manifest,
        })
    }

    /// Reopen an existing arena set by reading `<root>/manifest.json`.
    /// The per-tier .arena files are reopened via `Arena::new_mmap_file`,
    /// which preserves their byte content across process restarts.
    pub fn open(root: impl AsRef<Path>) -> ArenaResult<Self> {
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
            let arena = Arena::new_mmap_file(arena_config, spec.num_slots, &arena_path)?;
            let pool = TierPool::from_arena(spec.tier, arena, spec.policy);
            pools.insert(spec.tier, pool);
        }

        Ok(Self {
            root,
            pools,
            manifest,
        })
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

    /// Flush all pool mmaps and rewrite the manifest atomically. Call before
    /// dropping if you want on-disk state to reflect recent allocations.
    pub fn flush(&self) -> ArenaResult<()> {
        for pool in self.pools.values() {
            pool.arena().flush_mmap()?;
        }
        let manifest_path = self.root.join("manifest.json");
        write_manifest_atomic(&manifest_path, &self.manifest)?;
        Ok(())
    }
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
