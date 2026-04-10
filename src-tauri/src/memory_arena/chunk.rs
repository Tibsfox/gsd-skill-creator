//! Chunk primitive — the unit of storage in the memory arena.
//!
//! A chunk is: [ChunkHeader 128 bytes][payload N bytes].
//! xxh3 checksum covers header bytes 0..56 (everything before the checksum
//! field) concatenated with the full payload.
//!
//! This file deliberately uses only the standard library plus xxhash-rust
//! for checksumming. No mmap, no allocator, no I/O yet — those come in
//! later milestones. Keeping this layer pure makes unit testing trivial.

use std::convert::TryInto;

use xxhash_rust::xxh3::Xxh3Default;

use crate::memory_arena::error::{ArenaError, ArenaResult};
use crate::memory_arena::types::{
    ChunkHeader, ChunkId, TierKind, CHUNK_HEADER_VERSION, CHUNK_MAGIC, HEADER_SIZE,
};

/// Offset within the header where the checksum field lives. The checksum
/// input is header[0..CHECKSUM_OFFSET] || payload. This lets us compute the
/// checksum without a scratch buffer — we just skip the checksum slot.
pub(crate) const CHECKSUM_OFFSET: usize = 56;

/// A chunk is a contiguous byte buffer with a header at offset 0 and a
/// payload following immediately. This struct is a thin owned wrapper that
/// knows how to serialize and validate itself.
///
/// In later milestones this will be replaced with a view over an mmap
/// region — but the serialization format stays identical so tests transfer
/// directly.
#[derive(Debug, Clone)]
pub struct Chunk {
    header: ChunkHeader,
    payload: Vec<u8>,
}

impl Chunk {
    /// Create a new chunk with the given payload. The header is stamped
    /// with the current time and access count zero. Checksum is left at 0
    /// until `finalize` is called.
    pub fn new(chunk_id: ChunkId, tier: TierKind, payload: Vec<u8>) -> Self {
        let header = ChunkHeader::new(chunk_id, tier, payload.len() as u64);
        Self { header, payload }
    }

    /// Header accessor.
    pub fn header(&self) -> &ChunkHeader {
        &self.header
    }

    /// Payload accessor.
    pub fn payload(&self) -> &[u8] {
        &self.payload
    }

    /// Mutable payload accessor — for in-place updates before finalize.
    pub fn payload_mut(&mut self) -> &mut Vec<u8> {
        &mut self.payload
    }

    /// Compute the checksum and store it in the header. Call this after
    /// you're done writing the payload and before `serialize`. The on-wire
    /// invariant is: `chunk.header.checksum == xxh3_64(header[0..56] || payload)`.
    pub fn finalize(&mut self) {
        self.header.checksum = self.compute_checksum();
    }

    /// Compute the current checksum without storing it.
    ///
    /// Uses streaming xxh3 (`Xxh3Default::update`) so no scratch buffer is
    /// allocated for the hash input — header prefix and payload are fed to
    /// the hasher in place. Previously this allocated a fresh Vec of
    /// `CHECKSUM_OFFSET + payload_size` bytes on every call, which was the
    /// dominant cost of `alloc` for large payloads (M5 benchmark flagged
    /// ~500 µs alloc on small payloads and 724 µs at 250 KiB, almost all
    /// of it spent on this scratch Vec).
    pub fn compute_checksum(&self) -> u64 {
        let mut header_bytes = [0u8; HEADER_SIZE];
        write_header_into(&self.header, &mut header_bytes);
        // Zero out the checksum slot so it doesn't depend on itself.
        header_bytes[CHECKSUM_OFFSET..CHECKSUM_OFFSET + 8].fill(0);

        // Streaming xxh3: feed header[0..CHECKSUM_OFFSET] then the full
        // payload. No scratch allocation.
        let mut hasher = Xxh3Default::new();
        hasher.update(&header_bytes[..CHECKSUM_OFFSET]);
        hasher.update(&self.payload);
        hasher.digest()
    }

    /// Serialize the chunk into a new byte vector (header + payload).
    /// Call `finalize` first if you want the checksum to be current.
    pub fn serialize(&self) -> Vec<u8> {
        let mut out = vec![0u8; HEADER_SIZE + self.payload.len()];
        write_header_into(&self.header, &mut out[..HEADER_SIZE]);
        out[HEADER_SIZE..].copy_from_slice(&self.payload);
        out
    }

    /// Deserialize a chunk from a byte buffer. Validates magic, version,
    /// tier kind, and checksum. Returns an `ArenaError` on any mismatch.
    pub fn deserialize(bytes: &[u8]) -> ArenaResult<Self> {
        if bytes.len() < HEADER_SIZE {
            return Err(ArenaError::BufferTooSmall {
                need: HEADER_SIZE,
                got: bytes.len(),
            });
        }

        let header = read_header_from(&bytes[..HEADER_SIZE])?;

        let expected_total = HEADER_SIZE + header.payload_size as usize;
        if bytes.len() != expected_total {
            return Err(ArenaError::PayloadSizeMismatch {
                header: header.payload_size,
                actual: bytes.len() - HEADER_SIZE,
            });
        }

        let payload = bytes[HEADER_SIZE..].to_vec();
        let chunk = Chunk { header, payload };

        // Recompute and compare the checksum against what the header claims.
        let computed = chunk.compute_checksum();
        if computed != header.checksum {
            return Err(ArenaError::ChecksumMismatch {
                header: header.checksum,
                computed,
            });
        }

        Ok(chunk)
    }

    /// Record an access: bumps count and updates last_access_ns. Does not
    /// re-checksum — callers should re-finalize before persisting. For in-
    /// memory-only tracking this is fine as-is.
    pub fn touch(&mut self) {
        self.header.access_count = self.header.access_count.saturating_add(1);
        self.header.last_access_ns = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos() as u64)
            .unwrap_or(0);
    }
}

/// Serialize a `ChunkHeader` into a 128-byte buffer. Little-endian for
/// portability with x86_64 and aarch64. Caller guarantees buf.len() >= HEADER_SIZE.
pub(crate) fn write_header_into(header: &ChunkHeader, buf: &mut [u8]) {
    debug_assert!(buf.len() >= HEADER_SIZE);
    buf[..HEADER_SIZE].fill(0);
    buf[0..8].copy_from_slice(&header.magic);
    buf[8..10].copy_from_slice(&header.version.to_le_bytes());
    buf[10] = header.tier.as_u8();
    // 11..16 reserved0
    buf[16..24].copy_from_slice(&header.chunk_id.as_u64().to_le_bytes());
    buf[24..32].copy_from_slice(&header.payload_size.to_le_bytes());
    buf[32..40].copy_from_slice(&header.created_at_ns.to_le_bytes());
    buf[40..48].copy_from_slice(&header.last_access_ns.to_le_bytes());
    buf[48..56].copy_from_slice(&header.access_count.to_le_bytes());
    buf[56..64].copy_from_slice(&header.checksum.to_le_bytes());
    // 64..128 reserved1 (already zeroed)
}

/// Deserialize a `ChunkHeader` from a 128-byte buffer. Validates magic,
/// version, and tier kind.
pub(crate) fn read_header_from(buf: &[u8]) -> ArenaResult<ChunkHeader> {
    if buf.len() < HEADER_SIZE {
        return Err(ArenaError::BufferTooSmall {
            need: HEADER_SIZE,
            got: buf.len(),
        });
    }

    let mut magic = [0u8; 8];
    magic.copy_from_slice(&buf[0..8]);
    if magic != CHUNK_MAGIC {
        return Err(ArenaError::InvalidMagic {
            expected: CHUNK_MAGIC,
            got: magic,
        });
    }

    let version = u16::from_le_bytes(buf[8..10].try_into().unwrap());
    if version != CHUNK_HEADER_VERSION {
        return Err(ArenaError::UnsupportedVersion { version });
    }

    let tier = TierKind::from_u8(buf[10])?;

    let chunk_id = ChunkId::new(u64::from_le_bytes(buf[16..24].try_into().unwrap()));
    let payload_size = u64::from_le_bytes(buf[24..32].try_into().unwrap());
    let created_at_ns = u64::from_le_bytes(buf[32..40].try_into().unwrap());
    let last_access_ns = u64::from_le_bytes(buf[40..48].try_into().unwrap());
    let access_count = u64::from_le_bytes(buf[48..56].try_into().unwrap());
    let checksum = u64::from_le_bytes(buf[56..64].try_into().unwrap());

    Ok(ChunkHeader {
        magic,
        version,
        tier,
        chunk_id,
        payload_size,
        created_at_ns,
        last_access_ns,
        access_count,
        checksum,
    })
}
