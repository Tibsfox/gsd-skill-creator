//! Core types for the memory arena.
//!
//! All constants are tunable via `ArenaConfig` — see
//! memory/crossfade-lod-tuning.md for the "everything is tunable" principle.

use std::collections::HashMap;

use serde::{Deserialize, Serialize};

/// Magic number at the start of every chunk header.
/// `b"GSDARENA"` — 8 bytes, recognizable in hex dumps, Amiga-style.
pub const CHUNK_MAGIC: [u8; 8] = *b"GSDARENA";

/// Current chunk header format version. Bumped on incompatible changes.
pub const CHUNK_HEADER_VERSION: u16 = 1;

/// Fixed size of the chunk header on disk / in memory. 128 bytes — generous
/// for future fields without wasting space. Aligned to 16 for SIMD headroom.
pub const HEADER_SIZE: usize = 128;

/// Default chunk payload size: 4 GiB. Tunable via `ArenaConfig::chunk_size`.
/// 4 GiB chosen because:
/// - Huge page friendly (2 MiB * 2048 = 4 GiB)
/// - Amortizes management overhead
/// - PCIe 4.0 x8 transfer to VRAM = ~286 ms sync (LTM-11 finding)
pub const DEFAULT_CHUNK_SIZE: u64 = 4 * 1024 * 1024 * 1024;

/// Minimum chunk size: 16 MiB. Small enough for tests, large enough to be
/// meaningful.
pub const MIN_CHUNK_SIZE: u64 = 16 * 1024 * 1024;

/// Maximum chunk size: 32 GiB. Above this, LTM-11 transfer economics break.
pub const MAX_CHUNK_SIZE: u64 = 32 * 1024 * 1024 * 1024;

/// Tier kind — Amiga-style typed memory regions. Each chunk declares which
/// tier it lives in so the allocator can apply tier-specific policies.
///
/// These map to memory/amiga-ram-storage-design.md section 2 (typed regions).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[repr(u8)]
pub enum TierKind {
    /// In-process hot path working set (like Amiga MEMF_FAST).
    Hot = 1,
    /// Warm tier — mmap-backed, recent access (the T1 tier).
    Warm = 2,
    /// Vector-aligned data suitable for GPU transfer (like MEMF_CHIP).
    Vector = 3,
    /// Arbitrary payload (text blobs, markdown, raw files).
    Blob = 4,
    /// Survives warm-start — resident structure with strict magic + checksum.
    Resident = 5,
}

impl TierKind {
    /// Convert a raw tier byte into a `TierKind`, or error.
    pub fn from_u8(byte: u8) -> crate::memory_arena::error::ArenaResult<Self> {
        match byte {
            1 => Ok(TierKind::Hot),
            2 => Ok(TierKind::Warm),
            3 => Ok(TierKind::Vector),
            4 => Ok(TierKind::Blob),
            5 => Ok(TierKind::Resident),
            other => Err(crate::memory_arena::error::ArenaError::UnknownTierKind(other)),
        }
    }

    /// Raw byte representation for on-disk encoding.
    pub fn as_u8(self) -> u8 {
        self as u8
    }

    /// Heat index for tier ordering. Higher = hotter. Used by the policy
    /// sweep driver to determine promote/demote direction without
    /// hardcoding tier names.
    pub fn heat_index(self) -> u8 {
        match self {
            TierKind::Hot => 4,
            TierKind::Warm => 3,
            TierKind::Vector => 2,
            TierKind::Blob => 1,
            TierKind::Resident => 0,
        }
    }

    /// True if `self` is a hotter tier than `other`.
    pub fn hotter_than(self, other: TierKind) -> bool {
        self.heat_index() > other.heat_index()
    }

    /// True if `self` is a colder tier than `other`.
    pub fn colder_than(self, other: TierKind) -> bool {
        self.heat_index() < other.heat_index()
    }
}

/// Crossfade state for a chunk — lives at header byte 64 (`_reserved1[0]`).
///
/// This is the state-machine home for slice-3 demote crossfades. `Resident`
/// is the normal occupied state; `FadingOut` marks the source chunk of an
/// in-flight demote whose target exists in a different tier pool.
///
/// Deliberately 2-variant this slice. `FadingIn`, `InFlight`, `GpuStaging`
/// etc. are NON-GOALS until later slices — see `MISSION.md` §Non-Goals.
///
/// **Backward compat.** `Resident = 0` so any chunk whose `_reserved1`
/// region is all zero (i.e. every M1/M2 chunk) decodes as `Resident`
/// without migration.
///
/// **Checksum interaction.** The state byte lives at offset 64, which is
/// OUTSIDE the checksum window (`header[0..56] || payload`). This is by
/// design — it lets `mark_state` be a single-byte write and keeps
/// `abort_demote` cheap. See `memory/crossfade-lod-tuning.md`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum ChunkState {
    /// Normal occupied state. Default for M1/M2 chunks on upgrade.
    Resident = 0,
    /// Source chunk of an in-flight demote; target exists in another pool.
    FadingOut = 1,
}

impl ChunkState {
    /// Convert a raw state byte into a `ChunkState`, or error.
    pub fn from_u8(byte: u8) -> crate::memory_arena::error::ArenaResult<Self> {
        match byte {
            0 => Ok(ChunkState::Resident),
            1 => Ok(ChunkState::FadingOut),
            other => Err(crate::memory_arena::error::ArenaError::UnknownChunkState(other)),
        }
    }

    /// Raw byte representation for on-disk encoding.
    pub fn as_u8(self) -> u8 {
        self as u8
    }
}

/// Unique identifier for a chunk within an arena. Wraps a u64 for type safety.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
pub struct ChunkId(pub u64);

impl ChunkId {
    pub const ZERO: Self = ChunkId(0);

    pub fn new(id: u64) -> Self {
        ChunkId(id)
    }

    pub fn as_u64(self) -> u64 {
        self.0
    }
}

impl std::fmt::Display for ChunkId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "chunk#{}", self.0)
    }
}

/// Chunk header — 128 bytes on disk. Written at offset 0 of every chunk.
///
/// Layout (little-endian):
///   0..8    magic                          = CHUNK_MAGIC
///   8..10   version                        = CHUNK_HEADER_VERSION
///   10..11  tier                           = TierKind as u8
///   11..16  _reserved0                     = zeros (alignment)
///   16..24  chunk_id                       = u64
///   24..32  payload_size                   = u64 (bytes following the header)
///   32..40  created_at                     = u64 unix nanoseconds
///   40..48  last_access                    = u64 unix nanoseconds
///   48..56  access_count                   = u64
///   56..64  checksum                       = u64 xxh3 of (header[0..56] || payload)
///   64..65  chunk_state                    = ChunkState as u8 (M3)
///   65..72  _pad0                          = zeros (7 bytes reserved)
///   72..80  last_demote_completed_at_ns    = u64 (M3)
///   80..88  last_promote_completed_at_ns   = u64 (M4)
///   88..128 _reserved1_tail               = zeros (future fields)
///
/// **Checksum invariant.** The checksum at offset 56..64 covers
/// `header[0..56] || payload`. Bytes 64..128 (`chunk_state` + `_pad0` +
/// timestamps + `_reserved1_tail`) are OUTSIDE the checksum window so
/// state-machine fields can be mutated post-finalize without invalidating
/// the chunk.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ChunkHeader {
    pub magic: [u8; 8],
    pub version: u16,
    pub tier: TierKind,
    pub chunk_id: ChunkId,
    pub payload_size: u64,
    pub created_at_ns: u64,
    pub last_access_ns: u64,
    pub access_count: u64,
    pub checksum: u64,
    /// Crossfade state. Lives at header byte 64. Outside the checksum
    /// window — mutable via `Arena::mark_state` without re-checksumming.
    pub state: ChunkState,
    /// Timestamp (ns since unix epoch) of the most recent
    /// `complete_demote` that produced this chunk. 0 = never demoted.
    /// Lives at header bytes 72..80. Outside the checksum window — like
    /// the state byte, this is mutable via `Arena::write_last_demote_ns`
    /// without re-checksumming.
    ///
    /// Used by the hysteresis cooldown check in `ArenaSet::begin_demote`
    /// to prevent thrashing: a chunk that just completed a demote cannot
    /// be demoted again within `TierPolicy::demote_cooldown_ns`.
    pub last_demote_completed_at_ns: u64,
    /// Timestamp (ns since unix epoch) of the most recent
    /// `complete_promote` that produced this chunk. 0 = never promoted.
    /// Lives at header bytes 80..88. Outside the checksum window — like
    /// the demote timestamp, this is mutable via
    /// `Arena::write_last_promote_ns` without re-checksumming.
    ///
    /// Used by the hysteresis cooldown check in `ArenaSet::begin_promote`
    /// to prevent thrashing: a chunk that just completed a promote cannot
    /// be promoted again within `TierPolicy::promote_cooldown_ns`.
    pub last_promote_completed_at_ns: u64,
}

impl ChunkHeader {
    /// Build a new header with current timestamp and zero access count.
    /// The checksum field is left at 0 — it must be computed and filled in
    /// by `Chunk::finalize` once the payload is written. The state field
    /// defaults to `ChunkState::Resident`; `last_demote_completed_at_ns`
    /// and `last_promote_completed_at_ns` default to 0 (never moved).
    pub fn new(chunk_id: ChunkId, tier: TierKind, payload_size: u64) -> Self {
        let now_ns = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos() as u64)
            .unwrap_or(0);
        Self {
            magic: CHUNK_MAGIC,
            version: CHUNK_HEADER_VERSION,
            tier,
            chunk_id,
            payload_size,
            created_at_ns: now_ns,
            last_access_ns: now_ns,
            access_count: 0,
            checksum: 0,
            state: ChunkState::Resident,
            last_demote_completed_at_ns: 0,
            last_promote_completed_at_ns: 0,
        }
    }
}

/// Eviction policy selector for a tier pool. The actual eviction driver
/// (picks a victim and frees it) lives in slice 2 — this slice just stores
/// the choice so the manifest can round-trip it.
///
/// Defined in `types.rs` (not `pool.rs`) because `ArenaConfig::default_policies`
/// needs to reference it, and `ArenaConfig` lives here. `pool.rs` re-exports.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum EvictionKind {
    /// Least-recently-used via the `LruIndex` on the wrapped `Arena`.
    Lru,
    /// First-in-first-out — oldest insertion wins.
    Fifo,
}

/// Per-tier allocation policy. All fields are pure data — serde-serializable
/// so the manifest can round-trip them.
///
/// `max_chunks == 0` means "unlimited" (skip the check).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct TierPolicy {
    /// Hard cap on the number of concurrently-allocated chunks. 0 = unlimited.
    pub max_chunks: u32,
    /// Eviction policy (used by slice 2's eviction driver).
    pub eviction: EvictionKind,
    /// Promote a chunk to a hotter tier after this many hits (slice 2).
    pub promote_after_hits: u32,
    /// Demote a chunk to a colder tier after this long idle (slice 2).
    pub demote_after_idle_ns: u64,
    /// Minimum time between consecutive demotes of the same chunk (M3).
    /// 0 = no cooldown (default, preserves pre-slice-3 behavior).
    /// `serde(default)` preserves backward compat with legacy manifest.json
    /// files that don't include this field — they deserialize with 0.
    #[serde(default)]
    pub demote_cooldown_ns: u64,
    /// Minimum time between consecutive promotes of the same chunk (M4).
    /// 0 = no cooldown (default, preserves pre-slice-4 behavior).
    /// `serde(default)` preserves backward compat with legacy manifest.json
    /// files that don't include this field — they deserialize with 0.
    #[serde(default)]
    pub promote_cooldown_ns: u64,
}

impl TierPolicy {
    /// Default policy for a given tier. These numbers are hints, not load-
    /// bearing tuning — slice 2's benchmarks will revisit them.
    pub fn default_for(tier: TierKind) -> Self {
        match tier {
            TierKind::Hot => Self {
                max_chunks: 64,
                eviction: EvictionKind::Lru,
                promote_after_hits: 0,
                demote_after_idle_ns: 5_000_000_000,
                demote_cooldown_ns: 0,
                promote_cooldown_ns: 0,
            },
            TierKind::Warm => Self {
                max_chunks: 64,
                eviction: EvictionKind::Lru,
                promote_after_hits: 4,
                demote_after_idle_ns: 10_000_000_000,
                demote_cooldown_ns: 0,
                promote_cooldown_ns: 0,
            },
            TierKind::Vector => Self {
                max_chunks: 64,
                eviction: EvictionKind::Lru,
                promote_after_hits: 2,
                demote_after_idle_ns: 5_000_000_000,
                demote_cooldown_ns: 0,
                promote_cooldown_ns: 0,
            },
            TierKind::Blob => Self {
                max_chunks: 64,
                eviction: EvictionKind::Fifo,
                promote_after_hits: 0,
                demote_after_idle_ns: 0,
                demote_cooldown_ns: 0,
                promote_cooldown_ns: 0,
            },
            TierKind::Resident => Self {
                max_chunks: 64,
                eviction: EvictionKind::Fifo,
                promote_after_hits: 0,
                demote_after_idle_ns: 0,
                demote_cooldown_ns: 0,
                promote_cooldown_ns: 0,
            },
        }
    }
}

/// Build the default per-tier policy table covering all five `TierKind`
/// variants. Used by `ArenaConfig::default()` and `ArenaConfig::test()`.
fn default_policy_table() -> HashMap<TierKind, TierPolicy> {
    let mut map = HashMap::with_capacity(5);
    for tier in [
        TierKind::Hot,
        TierKind::Warm,
        TierKind::Vector,
        TierKind::Blob,
        TierKind::Resident,
    ] {
        map.insert(tier, TierPolicy::default_for(tier));
    }
    map
}

/// Arena configuration — all tunable parameters live here.
///
/// See memory/crossfade-lod-tuning.md: "Nothing is hardcoded. All design
/// parameters are knobs we experiment with."
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArenaConfig {
    /// Payload size per chunk. Default 4 GiB. Tunable.
    pub chunk_size: u64,
    /// Reject chunks below this size during validation.
    pub min_chunk_size: u64,
    /// Reject chunks above this size during validation.
    pub max_chunk_size: u64,
    /// Default per-tier policy table — covers all five `TierKind` variants.
    /// `ArenaSet::create` consults this when a pool spec omits an explicit
    /// policy. Fully tunable at construction time.
    #[serde(default = "default_policy_table")]
    pub default_policies: HashMap<TierKind, TierPolicy>,
}

impl Default for ArenaConfig {
    fn default() -> Self {
        Self {
            chunk_size: DEFAULT_CHUNK_SIZE,
            min_chunk_size: MIN_CHUNK_SIZE,
            max_chunk_size: MAX_CHUNK_SIZE,
            default_policies: default_policy_table(),
        }
    }
}

impl ArenaConfig {
    /// Config optimized for unit tests — tiny chunks so we don't blow
    /// the CI runner's memory.
    pub fn test() -> Self {
        Self {
            chunk_size: 4 * 1024,
            min_chunk_size: 64,
            max_chunk_size: 16 * 1024,
            default_policies: default_policy_table(),
        }
    }

    /// Validate that a proposed chunk size is within policy.
    pub fn validate_size(&self, size: u64) -> crate::memory_arena::error::ArenaResult<()> {
        if size < self.min_chunk_size || size > self.max_chunk_size {
            Err(crate::memory_arena::error::ArenaError::ChunkSizeOutOfRange {
                size,
                min: self.min_chunk_size,
                max: self.max_chunk_size,
            })
        } else {
            Ok(())
        }
    }
}
