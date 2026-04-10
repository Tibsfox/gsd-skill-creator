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

use crate::memory_arena::arena::Arena;
use crate::memory_arena::error::{ArenaError, ArenaResult};
use crate::memory_arena::types::{ArenaConfig, ChunkId, TierKind};

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
}
