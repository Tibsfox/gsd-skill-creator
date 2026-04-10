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

pub mod arena;
pub mod chunk;
pub mod error;
pub mod handle;
pub mod persistence;
pub mod pool;
pub mod types;

pub use arena::{Arena, ArenaStats};
pub use chunk::Chunk;
pub use error::{ArenaError, ArenaResult};
pub use handle::{tier_kind_from_str, tier_kind_to_str, ArenaHandle};
pub use persistence::{
    read_checkpoint, replay_into, write_checkpoint, JournalOp, JournalReader, JournalWriter,
};
pub use pool::{EvictionKind, TierPolicy, TierPool};
pub use types::{ArenaConfig, ChunkHeader, ChunkId, TierKind, CHUNK_MAGIC, HEADER_SIZE};

#[cfg(test)]
mod tests;
