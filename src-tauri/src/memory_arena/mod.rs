//! Memory Arena — Amiga exec.library-inspired persistent RAM storage.
//!
//! This is the foundation primitive for gsd-skill-creator's custom memory
//! subsystem. Design principles (see memory/amiga-ram-storage-design.md):
//!
//! - One large allocation at startup (not per-request heap churn)
//! - Typed chunks with magic number + checksum headers (like Amiga Resident)
//! - RAD:-style warm-start recovery via on-disk journal + checkpoint
//! - Crossfade tier transitions (not binary promote/demote)
//! - Scalable LOD (tiers add/merge based on measurement)
//!
//! Not tmpfs. Not /dev/shm. Not OS-managed. We own every byte.
//!
//! Milestone 1 scope: chunk primitives (types, headers, checksums, tests).
//! Milestones 2+: arena allocator, journal, checkpoint, Tauri IPC.

pub mod allocator;
pub mod arena;
pub mod cgroup;
pub mod chunk;
pub mod error;
pub mod handle;
pub mod list;
pub mod persistence;
#[cfg(feature = "postgres")]
pub mod pg_cold;
pub mod pool;
pub mod types;
#[cfg(feature = "cuda")]
pub mod vram;
pub mod warm_start;

pub use arena::{Arena, ArenaStats};
pub use cgroup::{
    CgroupEnforcer, CgroupMemoryState, GROWTH_STEP_BYTES, HARD_CAP_BYTES, INITIAL_LIMIT_BYTES,
};
pub use chunk::Chunk;
pub use error::{ArenaError, ArenaResult};
pub use handle::{tier_kind_from_str, tier_kind_to_str, ArenaHandle};
pub use list::{List, LruIndex, NodeIdx};
pub use persistence::{
    read_checkpoint, replay_into, replay_into_set, write_checkpoint, JournalOp, JournalReader,
    JournalWriter,
};
#[cfg(feature = "postgres")]
pub use pg_cold::PgColdSource;
pub use pool::{
    ArenaSet, ArenaSetConfig, CrossfadeHandle, EvictionKind, GcReport, Manifest, PoolSpec,
    TierPolicy, TierPool, ARENA_SET_FORMAT_VERSION,
};
pub use types::{
    AllocatorSelector, ArenaConfig, ChunkHeader, ChunkId, SweepReport, TierKind, CHUNK_MAGIC,
    HEADER_SIZE,
};
pub use warm_start::{
    AsyncColdSource, ColdSource, InMemoryColdSource, WarmStart, WarmStartConfig, WarmStartReport,
    WarmStartStats,
};

#[cfg(test)]
mod tests;
