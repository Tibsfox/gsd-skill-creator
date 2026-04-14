//! Persistence layer — checkpoint + journal for warm-start recovery.
//!
//! Architecture (see memory/amiga-ram-storage-design.md for the rationale):
//!
//! - **Checkpoint**: full snapshot of the arena. Self-contained, atomic write.
//! - **Journal**: append-only log of ALLOC/FREE ops since last checkpoint.
//!   Replayed on startup to catch up to where we were at crash time.
//! - **Recovery**: load checkpoint → replay journal. Journal replay is
//!   idempotent via `Arena::apply_alloc` / `apply_free`, so crashing
//!   mid-checkpoint is safe.
//!
//! # Format — Checkpoint (v2, sparse)
//!
//! v2 is **sparse** — it only writes the bytes for allocated chunks, not
//! the full `num_slots * chunk_size` storage. This closes the "lightly-used
//! arena takes 2 seconds to checkpoint" gap from M5 benchmarking.
//!
//! ```text
//! offset  size    content
//! 0       8       magic "GSDCKPT\0"
//! 8       2       version (u16 LE) = 2
//! 10      2       reserved
//! 12      8       next_chunk_id (u64 LE)
//! 20      8       chunk_size (slot size, u64 LE)
//! 28      8       num_slots (u64 LE)
//! 36      8       num_allocated (u64 LE)
//! 44      24*N    sparse dir: (chunk_id u64, slot u64, chunk_len u64) * N
//! 44+24N  ΣL      concatenated chunk bytes (header + payload) in dir order
//! end-8   8       checksum (xxh3_64 of all preceding bytes, u64 LE)
//! ```
//!
//! # Format — Checkpoint (v1, dense — still supported on read)
//!
//! ```text
//! offset  size    content
//! 0       8       magic "GSDCKPT\0"
//! 8       2       version (u16 LE) = 1
//! 10      2       reserved
//! 12      8       next_chunk_id (u64 LE)
//! 20      8       chunk_size (u64 LE)
//! 28      8       num_slots (u64 LE)
//! 36      8       num_allocated (u64 LE)
//! 44      16*N    directory: (chunk_id u64, slot u64) * num_allocated
//! 44+16N  N*S     storage: num_slots * chunk_size bytes (dense, includes zeros)
//! end-8   8       checksum (xxh3_64 of all preceding bytes, u64 LE)
//! ```
//!
//! # Format — Journal
//!
//! Header (12 bytes): magic "GSDJRNL\0" + version (u16 LE) + reserved (u16).
//! Followed by a stream of records:
//!
//! ```text
//! offset  size    content
//! 0       4       payload_len (u32 LE)
//! 4       1       op_type (u8): 1=ALLOC, 2=FREE
//! 5       N       payload (payload_len bytes, includes op_type)
//! 5+N-1   8       checksum (xxh3_64 of bytes [0..5+N-1], u64 LE)
//! ```
//!
//! - ALLOC payload: chunk_id (u64 LE) + chunk_bytes (variable, rest of payload)
//! - FREE payload: chunk_id (u64 LE)

use std::convert::TryInto;
use std::fs::{File, OpenOptions};
use std::io::{BufReader, BufWriter, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};

use xxhash_rust::xxh3::{xxh3_64, Xxh3Default};

use crate::memory_arena::arena::Arena;
use crate::memory_arena::error::{ArenaError, ArenaResult};
use crate::memory_arena::pool::ArenaSet;
use crate::memory_arena::types::{ArenaConfig, ChunkId, TierKind, HEADER_SIZE};

const CHECKPOINT_MAGIC: &[u8; 8] = b"GSDCKPT\0";
/// Current checkpoint format version. Writer emits v2 (sparse).
/// Reader supports both v1 (dense) and v2 (sparse) for backward compat.
const CHECKPOINT_VERSION: u16 = 2;
const CHECKPOINT_VERSION_V1_DENSE: u16 = 1;
const CHECKPOINT_VERSION_V2_SPARSE: u16 = 2;
const CHECKPOINT_HEADER_SIZE: usize = 44; // up to end of num_allocated

const JOURNAL_MAGIC: &[u8; 8] = b"GSDJRNL\0";
const JOURNAL_VERSION: u16 = 1;
const JOURNAL_HEADER_SIZE: usize = 12;

const OP_ALLOC: u8 = 1;
const OP_FREE: u8 = 2;
/// Pool-scoped alloc (M2). Record layout:
/// `[payload_len u32][op_type u8 = 3][pool_id u8][chunk_id u64 LE][chunk_bytes ...][checksum u64]`.
/// Legacy v1 records (op_type = 1) continue to decode as `pool_id = TierKind::Hot`.
const OP_ALLOC_V2: u8 = 3;
/// Pool-scoped free (M2). Record layout:
/// `[payload_len u32][op_type u8 = 4][pool_id u8][chunk_id u64 LE][checksum u64]`.
const OP_FREE_V2: u8 = 4;

// ============================================================================
// Checkpoint
// ============================================================================

/// Write the arena state to `path` atomically using the **sparse v2 format**.
///
/// Writes to `path.tmp`, fsyncs, then renames to `path`. On crash mid-write,
/// the old checkpoint remains intact.
///
/// # Format
///
/// Only bytes belonging to allocated chunks are written — free slots are
/// represented purely by their absence from the sparse directory. The per-chunk
/// payload bytes are read directly from the arena's slot storage (no copy to
/// a scratch Vec) and written in chunk-id order.
///
/// # Performance
///
/// For lightly-used arenas this is orders of magnitude smaller and faster
/// than the old dense v1 format. Empty arena checkpoints are ~52 bytes.
/// A 2 GiB arena (2048 × 1 MiB slots) with 100 small chunks drops from
/// ~2 GiB / 2 s to ~100 KiB / single-digit ms.
pub fn write_checkpoint(arena: &Arena, path: impl AsRef<Path>) -> ArenaResult<()> {
    let path = path.as_ref();
    let tmp_path = tmp_path_for(path);

    let num_slots = arena.num_slots() as u64;
    let chunk_size = arena.config().chunk_size;
    let num_allocated = arena.stats().allocated_slots as u64;
    let storage = arena.storage();

    // First pass: collect (id, slot, chunk_len) in id order and compute total
    // payload bytes so we can pre-size the output buffer.
    let mut entries: Vec<(ChunkId, usize)> = arena.directory_entries().collect();
    entries.sort_by_key(|(id, _)| id.as_u64());

    let mut chunk_lens: Vec<usize> = Vec::with_capacity(entries.len());
    let mut total_chunk_bytes: usize = 0;
    for (_, slot) in &entries {
        let slot_start = slot * (chunk_size as usize);
        let header_bytes = &storage[slot_start..slot_start + HEADER_SIZE];
        let header = crate::memory_arena::chunk::read_header_from(header_bytes)?;
        let len = HEADER_SIZE + header.payload_size as usize;
        if len > (chunk_size as usize) {
            return Err(ArenaError::PayloadSizeMismatch {
                header: header.payload_size,
                actual: (chunk_size as usize) - HEADER_SIZE,
            });
        }
        chunk_lens.push(len);
        total_chunk_bytes += len;
    }

    let sparse_dir_bytes = (num_allocated as usize) * 24;
    let mut buf: Vec<u8> = Vec::with_capacity(
        CHECKPOINT_HEADER_SIZE + sparse_dir_bytes + total_chunk_bytes + 8,
    );

    // Header
    buf.extend_from_slice(CHECKPOINT_MAGIC);
    buf.extend_from_slice(&CHECKPOINT_VERSION.to_le_bytes());
    buf.extend_from_slice(&0u16.to_le_bytes()); // reserved
    buf.extend_from_slice(&arena.next_chunk_id().to_le_bytes());
    buf.extend_from_slice(&chunk_size.to_le_bytes());
    buf.extend_from_slice(&num_slots.to_le_bytes());
    buf.extend_from_slice(&num_allocated.to_le_bytes());

    // Sparse directory: (chunk_id, slot, chunk_len) * num_allocated
    for ((id, slot), &len) in entries.iter().zip(chunk_lens.iter()) {
        buf.extend_from_slice(&id.as_u64().to_le_bytes());
        buf.extend_from_slice(&(*slot as u64).to_le_bytes());
        buf.extend_from_slice(&(len as u64).to_le_bytes());
    }

    // Concatenated chunk bytes (header + payload) in directory order.
    // Zero-copy: slice directly from the arena's storage, no scratch Vec.
    for ((_, slot), &len) in entries.iter().zip(chunk_lens.iter()) {
        let slot_start = slot * (chunk_size as usize);
        buf.extend_from_slice(&storage[slot_start..slot_start + len]);
    }

    // Checksum over everything written so far.
    let checksum = xxh3_64(&buf);
    buf.extend_from_slice(&checksum.to_le_bytes());

    // Atomic write: tempfile → fsync → rename → fsync dir.
    {
        let mut file = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&tmp_path)?;
        file.write_all(&buf)?;
        file.sync_all()?;
    }
    std::fs::rename(&tmp_path, path)?;
    if let Some(parent) = path.parent() {
        // Best-effort directory fsync. Ignore errors on platforms that
        // don't support it.
        if let Ok(dir) = File::open(parent) {
            let _ = dir.sync_all();
        }
    }

    Ok(())
}

/// Read a checkpoint file and rebuild the arena. Supports both v1 (dense)
/// and v2 (sparse) formats — v2 is the new default, v1 is kept for backward
/// compatibility with checkpoints written before M8.
///
/// The supplied `config` is validated against the checkpoint's chunk_size.
/// A mismatch is a hard error (the caller built the arena with one size
/// but the checkpoint was written with another).
pub fn read_checkpoint(
    config: ArenaConfig,
    path: impl AsRef<Path>,
) -> ArenaResult<Arena> {
    let path = path.as_ref();
    let mut file = File::open(path)?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf)?;

    if buf.len() < CHECKPOINT_HEADER_SIZE + 8 {
        return Err(ArenaError::CorruptCheckpoint {
            reason: format!("file too short: {} bytes", buf.len()),
        });
    }

    // Verify checksum first. Tail 8 bytes is the checksum.
    let content = &buf[..buf.len() - 8];
    let stored_sum = u64::from_le_bytes(buf[buf.len() - 8..].try_into().unwrap());
    let computed_sum = xxh3_64(content);
    if stored_sum != computed_sum {
        return Err(ArenaError::CorruptCheckpoint {
            reason: format!(
                "checksum mismatch: stored {:#x}, computed {:#x}",
                stored_sum, computed_sum
            ),
        });
    }

    // Parse header.
    if &content[0..8] != CHECKPOINT_MAGIC {
        return Err(ArenaError::CorruptCheckpoint {
            reason: format!("bad magic: {:?}", &content[0..8]),
        });
    }
    let version = u16::from_le_bytes(content[8..10].try_into().unwrap());
    if version != CHECKPOINT_VERSION_V1_DENSE && version != CHECKPOINT_VERSION_V2_SPARSE {
        return Err(ArenaError::CorruptCheckpoint {
            reason: format!("unsupported version: {}", version),
        });
    }
    let next_chunk_id = u64::from_le_bytes(content[12..20].try_into().unwrap());
    let chunk_size = u64::from_le_bytes(content[20..28].try_into().unwrap());
    let num_slots = u64::from_le_bytes(content[28..36].try_into().unwrap());
    let num_allocated = u64::from_le_bytes(content[36..44].try_into().unwrap());

    if chunk_size != config.chunk_size {
        return Err(ArenaError::ConfigMismatch {
            expected: format!("chunk_size={}", config.chunk_size),
            found: format!("chunk_size={}", chunk_size),
        });
    }

    // Build an empty arena with the right number of slots.
    let mut arena = Arena::new(config, num_slots as usize)?;
    arena.set_next_chunk_id(next_chunk_id);

    match version {
        CHECKPOINT_VERSION_V1_DENSE => {
            read_v1_into(&mut arena, content, num_allocated, num_slots, chunk_size)?;
        }
        CHECKPOINT_VERSION_V2_SPARSE => {
            read_v2_into(&mut arena, content, num_allocated, chunk_size)?;
        }
        _ => unreachable!(),
    }

    Ok(arena)
}

/// v1 (dense) reader — kept for backward compat with pre-M8 checkpoints.
fn read_v1_into(
    arena: &mut Arena,
    content: &[u8],
    num_allocated: u64,
    num_slots: u64,
    chunk_size: u64,
) -> ArenaResult<()> {
    let directory_size = (num_allocated as usize) * 16;
    let storage_start = CHECKPOINT_HEADER_SIZE + directory_size;
    let storage_size = (num_slots as usize) * (chunk_size as usize);
    if content.len() != storage_start + storage_size {
        return Err(ArenaError::CorruptCheckpoint {
            reason: format!(
                "v1 size mismatch: expected {} bytes, got {}",
                storage_start + storage_size,
                content.len()
            ),
        });
    }

    // Bulk copy storage bytes into the arena. This restores all slots
    // (including freed ones, which are zeroed in the checkpoint).
    let storage_bytes = &content[storage_start..storage_start + storage_size];
    arena.storage_mut().copy_from_slice(storage_bytes);

    // Replay directory entries. This marks slots allocated.
    let dir_bytes = &content[CHECKPOINT_HEADER_SIZE..storage_start];
    for i in 0..num_allocated as usize {
        let offset = i * 16;
        let id = u64::from_le_bytes(dir_bytes[offset..offset + 8].try_into().unwrap());
        let slot = u64::from_le_bytes(dir_bytes[offset + 8..offset + 16].try_into().unwrap()) as usize;

        let slot_start = slot * (chunk_size as usize);
        let header_bytes = &arena.storage()[slot_start..slot_start + HEADER_SIZE];
        let header = crate::memory_arena::chunk::read_header_from(header_bytes)?;
        let total = HEADER_SIZE + header.payload_size as usize;
        if total > (chunk_size as usize) {
            return Err(ArenaError::CorruptCheckpoint {
                reason: format!(
                    "slot {}: payload size {} exceeds chunk_size {}",
                    slot, header.payload_size, chunk_size
                ),
            });
        }
        let chunk_bytes = arena.storage()[slot_start..slot_start + total].to_vec();
        arena.place_chunk_at_slot(ChunkId::new(id), slot, &chunk_bytes)?;
    }

    Ok(())
}

/// v2 (sparse) reader — the format written by the current `write_checkpoint`.
fn read_v2_into(
    arena: &mut Arena,
    content: &[u8],
    num_allocated: u64,
    chunk_size: u64,
) -> ArenaResult<()> {
    let dir_bytes_len = (num_allocated as usize) * 24;
    let storage_start = CHECKPOINT_HEADER_SIZE + dir_bytes_len;
    if content.len() < storage_start {
        return Err(ArenaError::CorruptCheckpoint {
            reason: format!(
                "v2 truncated: header+dir needs {} bytes, got {}",
                storage_start,
                content.len()
            ),
        });
    }

    // First pass: parse directory entries and sum expected chunk bytes.
    let dir_bytes = &content[CHECKPOINT_HEADER_SIZE..storage_start];
    let mut entries: Vec<(ChunkId, usize, usize)> =
        Vec::with_capacity(num_allocated as usize);
    let mut total_chunk_bytes: usize = 0;
    for i in 0..num_allocated as usize {
        let offset = i * 24;
        let id = u64::from_le_bytes(dir_bytes[offset..offset + 8].try_into().unwrap());
        let slot =
            u64::from_le_bytes(dir_bytes[offset + 8..offset + 16].try_into().unwrap()) as usize;
        let len =
            u64::from_le_bytes(dir_bytes[offset + 16..offset + 24].try_into().unwrap()) as usize;

        if len < HEADER_SIZE || len > (chunk_size as usize) {
            return Err(ArenaError::CorruptCheckpoint {
                reason: format!(
                    "v2 entry {}: chunk_len {} out of range [{}, {}]",
                    i, len, HEADER_SIZE, chunk_size
                ),
            });
        }
        entries.push((ChunkId::new(id), slot, len));
        total_chunk_bytes += len;
    }

    if content.len() != storage_start + total_chunk_bytes {
        return Err(ArenaError::CorruptCheckpoint {
            reason: format!(
                "v2 size mismatch: expected {} bytes, got {}",
                storage_start + total_chunk_bytes,
                content.len()
            ),
        });
    }

    // Second pass: copy each chunk's bytes into its slot in arena storage,
    // then mark the slot allocated via place_chunk_at_slot (which validates
    // the header + checksum against the in-storage bytes).
    //
    // place_chunk_at_slot by itself only updates bookkeeping — v1 used to
    // bulk-copy the full storage buffer, but in the sparse v2 format we only
    // have each chunk's bytes, so we write directly to the target slot here.
    let slot_size = chunk_size as usize;
    let mut cursor = storage_start;
    for (id, slot, len) in entries {
        if slot >= arena.num_slots() {
            return Err(ArenaError::CorruptCheckpoint {
                reason: format!(
                    "v2 entry: slot {} out of bounds ({})",
                    slot,
                    arena.num_slots()
                ),
            });
        }
        let slot_start = slot * slot_size;
        // Copy the serialized chunk bytes into the slot, then zero the tail
        // so old contents don't linger (not strictly needed for a fresh
        // arena, but matches the invariant maintained by alloc_chunk).
        let storage = arena.storage_mut();
        storage[slot_start..slot_start + len].copy_from_slice(&content[cursor..cursor + len]);
        if slot_start + len < slot_start + slot_size {
            storage[slot_start + len..slot_start + slot_size].fill(0);
        }
        arena.place_chunk_at_slot(id, slot, &content[cursor..cursor + len])?;
        cursor += len;
    }

    Ok(())
}

fn tmp_path_for(path: &Path) -> PathBuf {
    let mut tmp = path.to_path_buf();
    let mut name = tmp
        .file_name()
        .map(|n| n.to_os_string())
        .unwrap_or_default();
    name.push(".tmp");
    tmp.set_file_name(name);
    tmp
}

// ============================================================================
// Journal
// ============================================================================

/// Append-only journal writer. Records ALLOC/FREE ops since the last
/// checkpoint. Call `truncate` after a successful checkpoint to reset.
pub struct JournalWriter {
    file: BufWriter<File>,
    path: PathBuf,
}

impl JournalWriter {
    /// Create or open a journal at `path`. If the file exists, new records
    /// are appended. If not, a fresh file is created with the journal header.
    pub fn open(path: impl AsRef<Path>) -> ArenaResult<Self> {
        let path = path.as_ref().to_path_buf();
        let exists = path.exists() && std::fs::metadata(&path).map(|m| m.len() >= JOURNAL_HEADER_SIZE as u64).unwrap_or(false);

        let file = OpenOptions::new()
            .create(true)
            .read(true)
            .write(true)
            .open(&path)?;

        let mut file = BufWriter::new(file);

        if !exists {
            // Write header.
            let mut header = [0u8; JOURNAL_HEADER_SIZE];
            header[0..8].copy_from_slice(JOURNAL_MAGIC);
            header[8..10].copy_from_slice(&JOURNAL_VERSION.to_le_bytes());
            // 10..12 reserved (zero)
            file.write_all(&header)?;
            file.flush()?;
            file.get_mut().sync_all()?;
        } else {
            // Seek to end for append.
            file.get_mut().seek(SeekFrom::End(0))?;
        }

        Ok(Self { file, path })
    }

    /// Append an ALLOC record: chunk_id + full serialized chunk bytes.
    ///
    /// Uses streaming xxh3 over the header, op byte, id, and chunk_bytes
    /// slice directly — no scratch record Vec. For large chunks this avoids
    /// the full payload copy that the old implementation paid on every
    /// alloc.
    ///
    /// This is the legacy (v1) entry point — records are written with
    /// op_type `OP_ALLOC` and no pool_id on the wire. Callers that want
    /// multi-pool dispatch should use `append_alloc_for_pool` instead.
    pub fn append_alloc(&mut self, id: ChunkId, chunk_bytes: &[u8]) -> ArenaResult<()> {
        // Header: [payload_len u32 LE][OP_ALLOC u8][chunk_id u64 LE]
        let payload_len = 1 + 8 + chunk_bytes.len();
        let len_bytes = (payload_len as u32).to_le_bytes();
        let id_bytes = id.as_u64().to_le_bytes();
        let op = [OP_ALLOC];

        // Streaming checksum over: len_bytes || op || id || chunk_bytes.
        // Matches the reader which hashes [len_buf || payload].
        let mut hasher = Xxh3Default::new();
        hasher.update(&len_bytes);
        hasher.update(&op);
        hasher.update(&id_bytes);
        hasher.update(chunk_bytes);
        let checksum = hasher.digest().to_le_bytes();

        // Write the record sequentially via BufWriter — no intermediate
        // record allocation. BufWriter absorbs the small writes.
        self.file.write_all(&len_bytes)?;
        self.file.write_all(&op)?;
        self.file.write_all(&id_bytes)?;
        self.file.write_all(chunk_bytes)?;
        self.file.write_all(&checksum)?;
        Ok(())
    }

    /// Append a FREE record: just the chunk_id.
    ///
    /// Legacy (v1) entry point; see `append_free_for_pool` for the
    /// multi-pool variant.
    pub fn append_free(&mut self, id: ChunkId) -> ArenaResult<()> {
        let payload_len = 1 + 8;
        let len_bytes = (payload_len as u32).to_le_bytes();
        let id_bytes = id.as_u64().to_le_bytes();
        let op = [OP_FREE];

        let mut hasher = Xxh3Default::new();
        hasher.update(&len_bytes);
        hasher.update(&op);
        hasher.update(&id_bytes);
        let checksum = hasher.digest().to_le_bytes();

        self.file.write_all(&len_bytes)?;
        self.file.write_all(&op)?;
        self.file.write_all(&id_bytes)?;
        self.file.write_all(&checksum)?;
        Ok(())
    }

    /// Append a pool-scoped ALLOC record (M2).
    ///
    /// Record layout: `[payload_len u32][OP_ALLOC_V2 u8][pool_id u8]
    /// [chunk_id u64 LE][chunk_bytes ...][checksum u64]`. The pool_id is
    /// the `TierKind::as_u8()` encoding (1..=5). This record type is
    /// decoded by the same `JournalReader::next_op` path and surfaces on
    /// the reader side as `JournalOp::Alloc { pool_id, .. }`.
    ///
    /// Writers and readers share one journal file; v1 and v2 records can
    /// coexist in the same file (the reader dispatches on op_type).
    pub fn append_alloc_for_pool(
        &mut self,
        pool_id: TierKind,
        id: ChunkId,
        chunk_bytes: &[u8],
    ) -> ArenaResult<()> {
        // Header: [payload_len u32 LE][OP_ALLOC_V2 u8][pool_id u8][chunk_id u64 LE]
        let payload_len = 1 + 1 + 8 + chunk_bytes.len();
        let len_bytes = (payload_len as u32).to_le_bytes();
        let id_bytes = id.as_u64().to_le_bytes();
        let op = [OP_ALLOC_V2];
        let pool = [pool_id.as_u8()];

        let mut hasher = Xxh3Default::new();
        hasher.update(&len_bytes);
        hasher.update(&op);
        hasher.update(&pool);
        hasher.update(&id_bytes);
        hasher.update(chunk_bytes);
        let checksum = hasher.digest().to_le_bytes();

        self.file.write_all(&len_bytes)?;
        self.file.write_all(&op)?;
        self.file.write_all(&pool)?;
        self.file.write_all(&id_bytes)?;
        self.file.write_all(chunk_bytes)?;
        self.file.write_all(&checksum)?;
        Ok(())
    }

    /// Append a pool-scoped FREE record (M2).
    ///
    /// Record layout: `[payload_len u32][OP_FREE_V2 u8][pool_id u8]
    /// [chunk_id u64 LE][checksum u64]`.
    pub fn append_free_for_pool(
        &mut self,
        pool_id: TierKind,
        id: ChunkId,
    ) -> ArenaResult<()> {
        let payload_len = 1 + 1 + 8;
        let len_bytes = (payload_len as u32).to_le_bytes();
        let id_bytes = id.as_u64().to_le_bytes();
        let op = [OP_FREE_V2];
        let pool = [pool_id.as_u8()];

        let mut hasher = Xxh3Default::new();
        hasher.update(&len_bytes);
        hasher.update(&op);
        hasher.update(&pool);
        hasher.update(&id_bytes);
        let checksum = hasher.digest().to_le_bytes();

        self.file.write_all(&len_bytes)?;
        self.file.write_all(&op)?;
        self.file.write_all(&pool)?;
        self.file.write_all(&id_bytes)?;
        self.file.write_all(&checksum)?;
        Ok(())
    }

    /// Flush buffered writes to disk and fsync.
    pub fn flush(&mut self) -> ArenaResult<()> {
        self.file.flush()?;
        self.file.get_mut().sync_all()?;
        Ok(())
    }

    /// Truncate the journal back to just its header. Called after a
    /// successful checkpoint.
    pub fn truncate(&mut self) -> ArenaResult<()> {
        self.file.flush()?;
        let file = self.file.get_mut();
        file.set_len(JOURNAL_HEADER_SIZE as u64)?;
        file.seek(SeekFrom::End(0))?;
        file.sync_all()?;
        Ok(())
    }

    /// Path to the journal file.
    pub fn path(&self) -> &Path {
        &self.path
    }
}

/// A single operation decoded from the journal.
///
/// Each op carries a `pool_id: TierKind` so multi-pool `ArenaSet` replay
/// via `replay_into_set` can dispatch each op to the right pool. Legacy
/// v1 records (written before M2 with the non-pool-scoped
/// `append_alloc` / `append_free` API) decode as `pool_id = TierKind::Hot`.
/// M1's single-arena callers all implicitly used the Hot tier; anything
/// else surfaced in a future fix-forward would be a slice 3 concern.
#[derive(Debug, Clone)]
pub enum JournalOp {
    Alloc {
        pool_id: TierKind,
        chunk_id: ChunkId,
        chunk_bytes: Vec<u8>,
    },
    Free {
        pool_id: TierKind,
        chunk_id: ChunkId,
    },
}

/// Journal reader — iterates records in order.
#[derive(Debug)]
pub struct JournalReader {
    reader: BufReader<File>,
    exhausted: bool,
}

impl JournalReader {
    /// Open a journal for reading. Validates the file header.
    pub fn open(path: impl AsRef<Path>) -> ArenaResult<Self> {
        let file = File::open(path.as_ref())?;
        let mut reader = BufReader::new(file);

        let mut header = [0u8; JOURNAL_HEADER_SIZE];
        reader.read_exact(&mut header)?;
        if &header[0..8] != JOURNAL_MAGIC {
            return Err(ArenaError::CorruptJournal {
                reason: format!("bad magic: {:?}", &header[0..8]),
            });
        }
        let version = u16::from_le_bytes(header[8..10].try_into().unwrap());
        if version != JOURNAL_VERSION {
            return Err(ArenaError::CorruptJournal {
                reason: format!("unsupported version: {}", version),
            });
        }

        Ok(Self {
            reader,
            exhausted: false,
        })
    }

    /// Read the next operation. Returns `Ok(None)` at clean EOF. Returns
    /// `Err(CorruptJournal)` on a truncated record or checksum mismatch.
    ///
    /// Truncated records (crash mid-write) are a common case and treated
    /// as EOF — we stop replaying at the last good record.
    pub fn next_op(&mut self) -> ArenaResult<Option<JournalOp>> {
        if self.exhausted {
            return Ok(None);
        }

        // Read payload_len (4 bytes).
        let mut len_buf = [0u8; 4];
        match self.reader.read_exact(&mut len_buf) {
            Ok(()) => {}
            Err(e) if e.kind() == std::io::ErrorKind::UnexpectedEof => {
                self.exhausted = true;
                return Ok(None);
            }
            Err(e) => return Err(ArenaError::Io(e)),
        }
        let payload_len = u32::from_le_bytes(len_buf) as usize;

        // Read payload + checksum. If we can't, treat as truncation.
        let mut payload = vec![0u8; payload_len];
        if self.reader.read_exact(&mut payload).is_err() {
            self.exhausted = true;
            return Ok(None);
        }
        let mut checksum_buf = [0u8; 8];
        if self.reader.read_exact(&mut checksum_buf).is_err() {
            self.exhausted = true;
            return Ok(None);
        }
        let stored_sum = u64::from_le_bytes(checksum_buf);

        // Verify checksum over [len_buf || payload].
        let mut hash_input = Vec::with_capacity(4 + payload_len);
        hash_input.extend_from_slice(&len_buf);
        hash_input.extend_from_slice(&payload);
        let computed_sum = xxh3_64(&hash_input);
        if stored_sum != computed_sum {
            // Treat corruption as EOF — stop replaying here.
            // Alternative would be hard error; either is defensible.
            self.exhausted = true;
            return Ok(None);
        }

        // Decode the op.
        if payload.is_empty() {
            return Err(ArenaError::CorruptJournal {
                reason: "empty payload".into(),
            });
        }
        let op_type = payload[0];
        match op_type {
            OP_ALLOC => {
                if payload.len() < 1 + 8 {
                    return Err(ArenaError::CorruptJournal {
                        reason: "ALLOC payload too short".into(),
                    });
                }
                let chunk_id = u64::from_le_bytes(payload[1..9].try_into().unwrap());
                let chunk_bytes = payload[9..].to_vec();
                // Legacy v1 records default to the Hot tier — M1 callers
                // all used the Hot tier conventionally and there are no
                // known persisted M1 journals on non-Hot tiers.
                Ok(Some(JournalOp::Alloc {
                    pool_id: TierKind::Hot,
                    chunk_id: ChunkId::new(chunk_id),
                    chunk_bytes,
                }))
            }
            OP_FREE => {
                if payload.len() != 1 + 8 {
                    return Err(ArenaError::CorruptJournal {
                        reason: format!("FREE payload wrong size: {}", payload.len()),
                    });
                }
                let chunk_id = u64::from_le_bytes(payload[1..9].try_into().unwrap());
                Ok(Some(JournalOp::Free {
                    pool_id: TierKind::Hot,
                    chunk_id: ChunkId::new(chunk_id),
                }))
            }
            OP_ALLOC_V2 => {
                // Layout: [op u8][pool_id u8][chunk_id u64 LE][chunk_bytes ...]
                if payload.len() < 1 + 1 + 8 {
                    return Err(ArenaError::CorruptJournal {
                        reason: "ALLOC_V2 payload too short".into(),
                    });
                }
                let pool_id = TierKind::from_u8(payload[1])?;
                let chunk_id =
                    u64::from_le_bytes(payload[2..10].try_into().unwrap());
                let chunk_bytes = payload[10..].to_vec();
                Ok(Some(JournalOp::Alloc {
                    pool_id,
                    chunk_id: ChunkId::new(chunk_id),
                    chunk_bytes,
                }))
            }
            OP_FREE_V2 => {
                if payload.len() != 1 + 1 + 8 {
                    return Err(ArenaError::CorruptJournal {
                        reason: format!(
                            "FREE_V2 payload wrong size: {}",
                            payload.len()
                        ),
                    });
                }
                let pool_id = TierKind::from_u8(payload[1])?;
                let chunk_id =
                    u64::from_le_bytes(payload[2..10].try_into().unwrap());
                Ok(Some(JournalOp::Free {
                    pool_id,
                    chunk_id: ChunkId::new(chunk_id),
                }))
            }
            other => Err(ArenaError::CorruptJournal {
                reason: format!("unknown op type: {}", other),
            }),
        }
    }
}

/// Replay every record from a journal into an arena. Stops at the first
/// clean EOF or corrupt record (treating the latter as a crash mid-write).
///
/// Replay is idempotent: applying the same journal twice produces the
/// same arena state.
///
/// This is the single-arena entry point — it ignores each op's `pool_id`
/// and routes every op to the caller-supplied arena. For multi-pool
/// dispatch use `replay_into_set`.
pub fn replay_into(arena: &mut Arena, mut reader: JournalReader) -> ArenaResult<usize> {
    let mut applied = 0usize;
    while let Some(op) = reader.next_op()? {
        match op {
            JournalOp::Alloc { chunk_id, chunk_bytes, .. } => {
                arena.apply_alloc(chunk_id, &chunk_bytes)?;
            }
            JournalOp::Free { chunk_id, .. } => {
                arena.apply_free(chunk_id)?;
            }
        }
        applied += 1;
    }
    Ok(applied)
}

/// Replay every record from a journal into a multi-pool `ArenaSet`,
/// dispatching each op to the pool identified by its `pool_id`. Stops at
/// the first clean EOF or corrupt record.
///
/// If the journal contains an op for a pool that isn't part of this
/// `ArenaSet`, the op is skipped silently — this permits partial
/// replays when the set's tier shape has changed between runs. Callers
/// that want strict behavior should pre-validate their manifests.
///
/// **M3 Plan 05 — counter-drift caveat closed.** Replay now routes
/// through `TierPool::replay_alloc` / `TierPool::replay_free`, which
/// update the `allocated_chunks` counter atomically with the arena-level
/// insert/remove. Callers can read `pool.len()` directly post-replay.
pub fn replay_into_set(
    set: &mut ArenaSet,
    mut reader: JournalReader,
) -> ArenaResult<usize> {
    let mut applied = 0usize;
    while let Some(op) = reader.next_op()? {
        match op {
            JournalOp::Alloc {
                pool_id,
                chunk_id,
                chunk_bytes,
            } => {
                if let Some(pool) = set.pool_mut(pool_id) {
                    pool.replay_alloc(chunk_id, &chunk_bytes)?;
                    applied += 1;
                }
                // Missing pool → skip silently.
            }
            JournalOp::Free { pool_id, chunk_id } => {
                if let Some(pool) = set.pool_mut(pool_id) {
                    pool.replay_free(chunk_id)?;
                    applied += 1;
                }
            }
        }
    }
    Ok(applied)
}
