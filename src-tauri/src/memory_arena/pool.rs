//! Tier pools — typed memory regions with per-tier allocation policy.
//!
//! RED stub for memory-arena-m1 Plan 01. The GREEN commit in Task 2 replaces
//! every `todo!()` body with a real implementation.
//!
//! `TierPolicy` and `EvictionKind` live in `types.rs` (they're pure data that
//! `ArenaConfig` needs to reference directly) and are re-exported here for
//! API stability. `TierPool` lives here because it owns an `Arena`.

pub use crate::memory_arena::types::{EvictionKind, TierPolicy};

use crate::memory_arena::arena::Arena;
use crate::memory_arena::error::ArenaResult;
use crate::memory_arena::types::{ArenaConfig, ChunkId, TierKind};

#[derive(Debug)]
pub struct TierPool {
    _tier: TierKind,
    _arena: Arena,
    _policy: TierPolicy,
}

impl TierPool {
    pub fn new(
        _tier: TierKind,
        _config: ArenaConfig,
        _num_slots: usize,
        _policy: TierPolicy,
    ) -> ArenaResult<Self> {
        todo!("RED: TierPool::new — implemented in Plan 01 Task 2")
    }

    pub fn tier(&self) -> TierKind {
        todo!("RED: TierPool::tier — implemented in Plan 01 Task 2")
    }

    pub fn policy(&self) -> &TierPolicy {
        todo!("RED: TierPool::policy — implemented in Plan 01 Task 2")
    }

    pub fn arena(&self) -> &Arena {
        todo!("RED: TierPool::arena — implemented in Plan 01 Task 2")
    }

    pub fn arena_mut(&mut self) -> &mut Arena {
        todo!("RED: TierPool::arena_mut — implemented in Plan 01 Task 2")
    }

    pub fn len(&self) -> u32 {
        todo!("RED: TierPool::len — implemented in Plan 01 Task 2")
    }

    pub fn alloc(&mut self, _payload: Vec<u8>) -> ArenaResult<ChunkId> {
        todo!("RED: TierPool::alloc — implemented in Plan 01 Task 2")
    }

    pub fn free(&mut self, _id: ChunkId) -> ArenaResult<()> {
        todo!("RED: TierPool::free — implemented in Plan 01 Task 2")
    }
}
