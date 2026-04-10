//! Error types for the memory arena.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum ArenaError {
    #[error("buffer too small: need {need} bytes, got {got}")]
    BufferTooSmall { need: usize, got: usize },

    #[error("invalid magic: expected {expected:?}, got {got:?}")]
    InvalidMagic { expected: [u8; 8], got: [u8; 8] },

    #[error("checksum mismatch: header says {header:#x}, computed {computed:#x}")]
    ChecksumMismatch { header: u64, computed: u64 },

    #[error("unsupported header version: {version}")]
    UnsupportedVersion { version: u16 },

    #[error("payload size mismatch: header says {header}, buffer has {actual}")]
    PayloadSizeMismatch { header: u64, actual: usize },

    #[error("unknown tier kind: {0}")]
    UnknownTierKind(u8),

    #[error("unknown chunk state: {0}")]
    UnknownChunkState(u8),

    #[error("chunk size out of range: {size} (min {min}, max {max})")]
    ChunkSizeOutOfRange { size: u64, min: u64, max: u64 },

    #[error("arena out of slots: {requested} requested, {available} available")]
    OutOfSlots { requested: usize, available: usize },

    #[error("unknown chunk id: {0}")]
    UnknownChunkId(u64),

    #[error("corrupt checkpoint: {reason}")]
    CorruptCheckpoint { reason: String },

    #[error("corrupt journal: {reason}")]
    CorruptJournal { reason: String },

    #[error("config mismatch on restore: expected {expected}, found {found}")]
    ConfigMismatch { expected: String, found: String },

    #[error("pool full: tier {tier:?} reached max_chunks {max_chunks}")]
    PoolFull {
        tier: crate::memory_arena::types::TierKind,
        max_chunks: u32,
    },

    #[error("arena set already exists at {path:?}")]
    AlreadyExists { path: std::path::PathBuf },

    #[error("manifest version mismatch: have {have}, want {want}")]
    ManifestVersionMismatch { have: u16, want: u16 },

    #[error("manifest parse error: {0}")]
    ManifestParse(String),

    #[error("unknown tier: {0:?}")]
    UnknownTier(crate::memory_arena::types::TierKind),

    #[error("invalid crossfade target: source tier {source_tier:?} == target tier {target_tier:?}")]
    InvalidCrossfadeTarget {
        source_tier: crate::memory_arena::types::TierKind,
        target_tier: crate::memory_arena::types::TierKind,
    },

    #[error("chunk {chunk_id} is already fading")]
    AlreadyFading { chunk_id: u64 },

    #[error("unknown crossfade handle for chunk {chunk_id}")]
    UnknownCrossfade { chunk_id: u64 },

    #[error("crossfade state mismatch for chunk {chunk_id}: expected {expected:?}, found {found:?}")]
    CrossfadeStateMismatch {
        chunk_id: u64,
        expected: crate::memory_arena::types::ChunkState,
        found: crate::memory_arena::types::ChunkState,
    },

    #[error("hysteresis cooldown for chunk {chunk_id}: {cooldown_remaining_ns} ns remaining")]
    HysteresisCooldown {
        chunk_id: u64,
        cooldown_remaining_ns: u64,
    },

    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
}

pub type ArenaResult<T> = Result<T, ArenaError>;
