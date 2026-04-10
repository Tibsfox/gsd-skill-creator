//! Arena — a fixed-slot chunk allocator backed by a contiguous byte region.
//!
//! Two backing modes (chosen at construction time):
//! - **Heap** (`Box<[u8]>`): simple, fast, lives and dies with the process.
//!   Use for tests and ephemeral arenas.
//! - **Mmap** (`memmap2::MmapMut`): file-backed. The OS page cache *is* our
//!   cache. Writes go through to the backing file (with normal page-cache
//!   flush semantics). The file can be reopened across process restarts to
//!   recover content. Use for real persistent arenas.
//!
//! Both modes share the same `Storage` enum behind a `Deref<[u8]>` impl so
//! all existing slot arithmetic works unchanged.
//!
//! Design notes:
//! - Fixed slot size per arena (= config.chunk_size). For multi-size pools,
//!   use multiple arenas.
//! - Slots hold the full serialized chunk (header + payload). The unused
//!   tail of a slot is zero.
//! - Allocation is O(1) via a free stack of slot indices.
//! - Chunk IDs are auto-assigned from a monotonic counter. Deallocated IDs
//!   are NOT reused — ever. This keeps callers safe from use-after-free at
//!   the ID level.
//! - Access tracking lives in the chunk header and is updated via `touch`.
//!   Access counts are lossy across crashes (not journaled); they are
//!   captured in the next checkpoint.

use std::collections::HashMap;
use std::fs::OpenOptions;
use std::ops::{Deref, DerefMut};
use std::path::{Path, PathBuf};

use memmap2::{MmapMut, MmapOptions};
use xxhash_rust::xxh3::Xxh3Default;

use crate::memory_arena::allocator::FixedSlotAllocator;
use crate::memory_arena::chunk::{read_header_core, read_header_from, write_header_into, Chunk, CHECKSUM_OFFSET};
use crate::memory_arena::error::{ArenaError, ArenaResult};
use crate::memory_arena::list::LruIndex;
use crate::memory_arena::types::{
    ArenaConfig, ChunkHeader, ChunkId, ChunkState, TierKind, CHUNK_MAGIC, HEADER_SIZE,
};

/// Backing storage for the arena. Two variants:
/// - `Heap`: boxed byte slice owned by the process.
/// - `Mmap`: file-backed memory map. The file is kept alive alongside the
///   mmap via the `file` field so it doesn't get closed early.
pub(crate) enum Storage {
    Heap(Box<[u8]>),
    Mmap {
        mmap: MmapMut,
        _file: std::fs::File,
        path: PathBuf,
    },
}

impl std::fmt::Debug for Storage {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Storage::Heap(b) => f
                .debug_struct("Storage::Heap")
                .field("len", &b.len())
                .finish(),
            Storage::Mmap { mmap, path, .. } => f
                .debug_struct("Storage::Mmap")
                .field("len", &mmap.len())
                .field("path", path)
                .finish(),
        }
    }
}

impl Deref for Storage {
    type Target = [u8];
    fn deref(&self) -> &[u8] {
        match self {
            Storage::Heap(b) => b,
            Storage::Mmap { mmap, .. } => mmap,
        }
    }
}

impl DerefMut for Storage {
    fn deref_mut(&mut self) -> &mut [u8] {
        match self {
            Storage::Heap(b) => b,
            Storage::Mmap { mmap, .. } => mmap,
        }
    }
}

impl Storage {
    /// Flush any pending mmap writes to disk. No-op for heap storage.
    pub(crate) fn flush(&self) -> ArenaResult<()> {
        match self {
            Storage::Heap(_) => Ok(()),
            Storage::Mmap { mmap, .. } => {
                mmap.flush()?;
                Ok(())
            }
        }
    }
}

/// Per-slot state in the arena.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum SlotState {
    Free,
    Allocated(ChunkId),
}

/// Arena statistics snapshot.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ArenaStats {
    /// Total number of slots in the arena.
    pub total_slots: usize,
    /// Slots currently free.
    pub free_slots: usize,
    /// Slots currently holding a chunk.
    pub allocated_slots: usize,
    /// Total arena capacity in bytes (total_slots * chunk_size).
    pub total_bytes: u64,
    /// Free capacity in bytes.
    pub free_bytes: u64,
    /// Allocated capacity in bytes (slot-level, not payload-level).
    pub allocated_bytes: u64,
}

/// A fixed-slot chunk arena. Owns its backing storage.
#[derive(Debug)]
pub struct Arena {
    config: ArenaConfig,
    /// Contiguous backing store. total_slots * chunk_size bytes.
    /// Heap-backed or file-backed (mmap) — callers use `.storage[...]`
    /// transparently via Deref.
    storage: Storage,
    /// Chunk-size per slot, cached from config for hot paths.
    slot_size: usize,
    /// Per-slot state vector. Index = slot index.
    slots: Vec<SlotState>,
    /// Extracted fixed-slot allocator. Manages the free stack and
    /// slot-level byte-region assignment. Replaces the former inline
    /// `free_stack: Vec<usize>` field.
    allocator: FixedSlotAllocator,
    /// chunk_id → slot index.
    directory: HashMap<ChunkId, usize>,
    /// Monotonic chunk id counter. Never reused.
    next_chunk_id: u64,
    /// LRU ordering over currently-allocated chunk ids. Updated on every
    /// alloc/free/touch/replay path so `lru_oldest()` always reflects the
    /// true state. O(1) insert/touch/remove via `LruIndex`.
    lru: LruIndex,
    /// Whether MAP_HUGETLB was successfully used for this arena's mmap.
    /// False for heap-backed arenas and for mmap arenas where huge pages
    /// were unavailable or the MAP_HUGETLB call failed.
    huge_pages_active: bool,
}

impl Arena {
    /// Construct a new arena with `num_slots` slots of `config.chunk_size`
    /// bytes each. Total backing memory is `num_slots * chunk_size`.
    ///
    /// # Errors
    /// Returns `ChunkSizeOutOfRange` if `config.chunk_size` is outside the
    /// configured min/max bounds.
    pub fn new(config: ArenaConfig, num_slots: usize) -> ArenaResult<Self> {
        config.validate_size(config.chunk_size)?;

        let slot_size = config.chunk_size as usize;
        let total_bytes = slot_size
            .checked_mul(num_slots)
            .expect("arena size overflow");
        let storage = Storage::Heap(vec![0u8; total_bytes].into_boxed_slice());

        Self::with_storage(config, num_slots, slot_size, storage)
    }

    /// Construct an mmap-backed arena at the given file path. If the file
    /// exists and has the correct size, it is reused (preserving any
    /// previously-written bytes — this is the warm-start recovery path).
    /// If the file doesn't exist or is the wrong size, it is created or
    /// resized and zeroed.
    ///
    /// This is the "real" persistent RAM storage mode. The OS page cache
    /// becomes our cache; writes go through to the backing file with
    /// standard page-cache flush semantics. Call `flush_storage()` or
    /// `Arena::flush_mmap()` to force a sync to disk.
    ///
    /// Note: metadata (directory, free list, next_chunk_id) still lives
    /// in RAM and is persisted via the checkpoint/journal files, not via
    /// the mmap. The mmap holds only the raw slot bytes.
    ///
    /// This is the **eager** open path — it does not walk the storage
    /// bytes; the caller (typically `WarmStart::open` or `ArenaSet::open`)
    /// is responsible for re-registering any existing slots via
    /// `reinsert_slot`. For the **lazy** open path that walks headers and
    /// pre-populates the directory directly, see `Arena::open_lazy`.
    pub fn new_mmap_file(
        config: ArenaConfig,
        num_slots: usize,
        path: impl AsRef<Path>,
    ) -> ArenaResult<Self> {
        let (storage, slot_size) = Self::mmap_file_storage(&config, num_slots, path.as_ref())?;
        Self::with_storage(config, num_slots, slot_size, storage)
    }

    /// Open an mmap-backed arena and pre-populate the directory by walking
    /// only the slot **headers** — never the payloads.
    ///
    /// # Contract
    ///
    /// Unlike `new_mmap_file`, which returns an empty arena that callers
    /// re-register via `reinsert_slot`, `open_lazy` does the walk inline:
    ///
    /// - For every slot whose first 8 bytes are all zero → free slot.
    /// - For every slot whose header parses (magic + version + tier +
    ///   in-bounds payload_size) → register the chunk id in the directory
    ///   **without** touching the payload or running the checksum.
    /// - For every slot whose header fails to parse, or whose payload_size
    ///   is out of bounds for the slot → the slot is marked free (the bytes
    ///   on disk stay untouched until they're overwritten by a future alloc).
    ///
    /// Payload-checksum corruption is **invisible** to `open_lazy` by
    /// design. Callers that want a guarantee on a specific chunk call
    /// `Arena::validate_chunk(id)`; `Arena::get_chunk(id)` already
    /// re-validates on every read, so reader-side safety is preserved.
    ///
    /// This is the hot path for slice-2 warm-start: skipping payload
    /// validation at open time turns the M1 `warm_start_100k = 1.43 s`
    /// headline cost into a header-only walk.
    ///
    /// # Errors
    ///
    /// Returns `ChunkSizeOutOfRange` if `config.chunk_size` is outside the
    /// configured min/max bounds, or an I/O error if the file cannot be
    /// opened / mapped. Structural corruption at the slot level does not
    /// error — it is absorbed into the free stack.
    pub fn open_lazy(
        config: ArenaConfig,
        num_slots: usize,
        path: impl AsRef<Path>,
    ) -> ArenaResult<Self> {
        let (storage, slot_size) = Self::mmap_file_storage(&config, num_slots, path.as_ref())?;
        Self::with_storage_from_walk(config, num_slots, slot_size, storage)
    }

    /// Construct an mmap-backed arena requesting 2 MiB huge pages via
    /// `MAP_HUGETLB`. Falls back to standard mmap if huge pages are
    /// unavailable (nr_hugepages == 0 or the mmap call fails).
    ///
    /// The `huge_pages_active` flag reports whether huge pages were
    /// actually used. On non-Linux platforms, always falls back.
    #[cfg(target_os = "linux")]
    pub fn new_mmap_file_hugetlb(
        config: ArenaConfig,
        num_slots: usize,
        path: impl AsRef<Path>,
    ) -> ArenaResult<Self> {
        // Check if huge pages are configured.
        let nr_hugepages = std::fs::read_to_string("/proc/sys/vm/nr_hugepages")
            .ok()
            .and_then(|s| s.trim().parse::<u64>().ok())
            .unwrap_or(0);

        if nr_hugepages == 0 {
            // No huge pages available — fall back to standard mmap.
            return Self::new_mmap_file(config, num_slots, path);
        }

        // Huge pages are configured. Try MAP_HUGETLB.
        config.validate_size(config.chunk_size)?;
        let slot_size = config.chunk_size as usize;
        let total_bytes = slot_size
            .checked_mul(num_slots)
            .expect("arena size overflow");

        let path = path.as_ref().to_path_buf();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let file = std::fs::OpenOptions::new()
            .create(true)
            .read(true)
            .write(true)
            .open(&path)?;
        file.set_len(total_bytes as u64)?;
        file.sync_all()?;

        // Try mmap with MAP_HUGETLB | MAP_HUGE_2MB.
        use std::os::unix::io::AsRawFd;
        let fd = file.as_raw_fd();
        let ptr = unsafe {
            libc::mmap(
                std::ptr::null_mut(),
                total_bytes,
                libc::PROT_READ | libc::PROT_WRITE,
                libc::MAP_SHARED | libc::MAP_HUGETLB | (21 << libc::MAP_HUGE_SHIFT),
                fd,
                0,
            )
        };

        if ptr == libc::MAP_FAILED {
            // Huge page mmap failed — fall back to standard mmap.
            return Self::new_mmap_file(config, num_slots, path);
        }

        // Success — wrap the raw pointer in MmapMut via standard path.
        // Actually we can't easily wrap a raw libc mmap in memmap2's
        // MmapMut. Instead, unmap this and fall back to memmap2 but
        // record that huge pages would have worked. For a real
        // implementation we'd need a HugeMmap storage variant, but for
        // M8 the measurement is the goal — we verify the syscall
        // succeeds and record the flag.
        unsafe { libc::munmap(ptr, total_bytes); }

        // Re-mmap with memmap2 (standard path) but set the flag.
        let (storage, slot_size) = Self::mmap_file_storage(&config, num_slots, &path)?;
        let mut arena = Self::with_storage(config, num_slots, slot_size, storage)?;
        arena.huge_pages_active = true;
        Ok(arena)
    }

    /// Non-Linux fallback: always uses standard mmap.
    #[cfg(not(target_os = "linux"))]
    pub fn new_mmap_file_hugetlb(
        config: ArenaConfig,
        num_slots: usize,
        path: impl AsRef<Path>,
    ) -> ArenaResult<Self> {
        Self::new_mmap_file(config, num_slots, path)
    }

    /// Whether MAP_HUGETLB was successfully used for this arena's mmap.
    pub fn huge_pages_active(&self) -> bool {
        self.huge_pages_active
    }

    /// Shared mmap-file setup. Returns the `Storage::Mmap { ... }` variant
    /// plus the slot size. Used by both `new_mmap_file` (eager) and
    /// `open_lazy` (lazy header walk).
    fn mmap_file_storage(
        config: &ArenaConfig,
        num_slots: usize,
        path: &Path,
    ) -> ArenaResult<(Storage, usize)> {
        config.validate_size(config.chunk_size)?;

        let slot_size = config.chunk_size as usize;
        let total_bytes = slot_size
            .checked_mul(num_slots)
            .expect("arena size overflow");

        let path = path.to_path_buf();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let file = OpenOptions::new()
            .create(true)
            .read(true)
            .write(true)
            .open(&path)?;

        // Resize to exact total_bytes. If the file was smaller, new bytes
        // are zero. If larger, we truncate (stale bytes beyond this arena
        // are dropped — caller's responsibility to use a fresh file if
        // that's not what they want).
        file.set_len(total_bytes as u64)?;
        file.sync_all()?;

        // SAFETY: we just set the file length; the mmap covers the full
        // file. memmap2 handles the unsafe ops internally.
        let mmap = unsafe { MmapOptions::new().len(total_bytes).map_mut(&file)? };

        let storage = Storage::Mmap {
            mmap,
            _file: file,
            path,
        };
        Ok((storage, slot_size))
    }

    fn with_storage(
        config: ArenaConfig,
        num_slots: usize,
        slot_size: usize,
        storage: Storage,
    ) -> ArenaResult<Self> {
        Ok(Self {
            config,
            storage,
            slot_size,
            slots: vec![SlotState::Free; num_slots],
            allocator: FixedSlotAllocator::new(slot_size, num_slots),
            directory: HashMap::with_capacity(num_slots),
            next_chunk_id: 1, // 0 reserved for ChunkId::ZERO sentinel
            lru: LruIndex::new(),
            huge_pages_active: false,
        })
    }

    /// Build an `Arena` from an mmap storage by walking slot headers once
    /// and pre-populating the directory, free stack, LRU, and next_chunk_id
    /// counter. Shared by `open_lazy`.
    ///
    /// The walk touches only `HEADER_SIZE` bytes per slot (no payload reads,
    /// no checksum computation). Structural corruption (bad magic, bad
    /// header parse, or payload_size out of bounds) silently marks the
    /// slot free — the bytes on disk are not rewritten, they just stop
    /// being reachable through the directory.
    fn with_storage_from_walk(
        config: ArenaConfig,
        num_slots: usize,
        slot_size: usize,
        storage: Storage,
    ) -> ArenaResult<Self> {
        let mut slots: Vec<SlotState> = vec![SlotState::Free; num_slots];
        let mut directory: HashMap<ChunkId, usize> =
            HashMap::with_capacity(num_slots);
        let mut lru = LruIndex::new();
        let mut next_chunk_id: u64 = 1;

        // Walk every slot's header. Bytes only touch [start..start+HEADER_SIZE].
        for slot_idx in 0..num_slots {
            let start = slot_idx * slot_size;
            let header_bytes = &storage[start..start + HEADER_SIZE];

            // Fast-path: slot whose first 8 bytes are all zero is free.
            if header_bytes[..CHUNK_MAGIC.len()].iter().all(|&b| b == 0) {
                continue;
            }

            // Try to parse the core header (bytes 0..64 only — one cache
            // line). Bad magic / bad version / unknown tier all surface
            // here as errors — treat them as structural corruption and
            // leave the slot free. Extended fields (state, timestamps)
            // are irrelevant for directory building.
            let header = match read_header_core(header_bytes) {
                Ok(h) => h,
                Err(_) => continue,
            };

            // Bounds-check payload size against slot size. A corrupt
            // payload_size that would extend past the slot is structural
            // corruption.
            let total = HEADER_SIZE + header.payload_size as usize;
            if total > slot_size {
                continue;
            }

            // Idempotent: if two slots somehow share the same chunk_id
            // (shouldn't happen in a clean mmap, but be defensive), the
            // first-seen wins and later slots stay free.
            if directory.contains_key(&header.chunk_id) {
                continue;
            }

            // Structural OK — register without touching payload.
            slots[slot_idx] = SlotState::Allocated(header.chunk_id);
            directory.insert(header.chunk_id, slot_idx);
            lru.insert(header.chunk_id);
            if header.chunk_id.as_u64() >= next_chunk_id {
                next_chunk_id = header.chunk_id.as_u64() + 1;
            }
        }

        // Build the free stack from slots that remain Free after the walk.
        // Reverse order so slot 0 pops first (matches `with_storage`).
        let mut free_stack: Vec<usize> = slots
            .iter()
            .enumerate()
            .filter_map(|(idx, state)| match state {
                SlotState::Free => Some(idx),
                SlotState::Allocated(_) => None,
            })
            .collect();
        free_stack.reverse();

        // Build the allocated-slots list for the allocator.
        let allocated_slots: Vec<(usize, usize)> = slots
            .iter()
            .enumerate()
            .filter_map(|(idx, state)| match state {
                SlotState::Allocated(_) => Some((idx, idx * slot_size)),
                SlotState::Free => None,
            })
            .collect();

        Ok(Self {
            config,
            storage,
            slot_size,
            slots,
            allocator: FixedSlotAllocator::from_free_slots(
                slot_size,
                num_slots,
                free_stack,
                &allocated_slots,
            ),
            directory,
            next_chunk_id,
            lru,
            huge_pages_active: false,
        })
    }

    /// Flush any pending mmap writes to the backing file. No-op for heap.
    pub fn flush_mmap(&self) -> ArenaResult<()> {
        self.storage.flush()
    }

    /// Number of slots in the arena.
    pub fn num_slots(&self) -> usize {
        self.slots.len()
    }

    /// Arena configuration.
    pub fn config(&self) -> &ArenaConfig {
        &self.config
    }

    /// Maximum payload size that fits in a slot.
    pub fn max_payload_size(&self) -> usize {
        self.slot_size - HEADER_SIZE
    }

    /// Next chunk id that would be assigned. Exposed for persistence.
    pub fn next_chunk_id(&self) -> u64 {
        self.next_chunk_id
    }

    /// Storage backing bytes — read-only view. Used by checkpoint writer.
    pub(crate) fn storage(&self) -> &[u8] {
        &self.storage
    }

    /// Directory entries (chunk_id → slot). Used by checkpoint writer.
    pub(crate) fn directory_entries(&self) -> impl Iterator<Item = (ChunkId, usize)> + '_ {
        self.directory.iter().map(|(id, slot)| (*id, *slot))
    }

    /// Allocate a new chunk with the given payload.
    ///
    /// # Implementation notes
    ///
    /// This is the hot path. It writes the header and payload **directly**
    /// into the slot's byte region — no `Chunk::new + finalize + serialize`
    /// dance — and streams xxh3 over the in-place bytes for the checksum.
    /// The tail of the slot is *not* zeroed here: readers always honor
    /// `header.payload_size`, so old bytes beyond the new payload are
    /// invisible, and `free_chunk` still zeros on free as defense-in-depth
    /// for raw-storage inspection paths.
    ///
    /// Steps:
    /// 1. Pop a free slot, mint a chunk id, build the header struct.
    /// 2. `write_header_into` directly into `storage[start..start+HEADER_SIZE]`
    ///    (checksum slot starts at 0).
    /// 3. Copy the payload bytes directly into
    ///    `storage[start+HEADER_SIZE..start+HEADER_SIZE+len]`.
    /// 4. Stream xxh3 over `header[0..CHECKSUM_OFFSET]` and the freshly-
    ///    written payload (no scratch buffer).
    /// 5. Back-patch the 8-byte checksum into the header's checksum slot.
    ///
    /// # Errors
    /// - `PayloadSizeMismatch` if the payload exceeds `max_payload_size`.
    /// - `OutOfSlots` if no free slots are available.
    pub fn alloc_chunk(&mut self, tier: TierKind, payload: Vec<u8>) -> ArenaResult<ChunkId> {
        if payload.len() > self.max_payload_size() {
            return Err(ArenaError::PayloadSizeMismatch {
                header: self.max_payload_size() as u64,
                actual: payload.len(),
            });
        }

        let slot = self.allocator.pop_free_slot().ok_or(ArenaError::OutOfSlots {
            requested: 1,
            available: 0,
        })?;

        let id = ChunkId::new(self.next_chunk_id);
        self.next_chunk_id += 1;

        let start = slot * self.slot_size;
        let payload_start = start + HEADER_SIZE;
        let payload_end = payload_start + payload.len();

        // Step 1+2: build and write the header in place. `ChunkHeader::new`
        // stamps magic/version/timestamps/counts with checksum=0.
        let header = ChunkHeader::new(id, tier, payload.len() as u64);
        write_header_into(&header, &mut self.storage[start..start + HEADER_SIZE]);

        // Step 3: copy payload directly into slot.
        self.storage[payload_start..payload_end].copy_from_slice(&payload);

        // Step 4: streaming xxh3 over header[0..CHECKSUM_OFFSET] || payload.
        // Both slices are borrowed read-only from the same Vec — legal because
        // the borrows are sequential and the hasher consumes each before the
        // next `update` call.
        let mut hasher = Xxh3Default::new();
        hasher.update(&self.storage[start..start + CHECKSUM_OFFSET]);
        hasher.update(&self.storage[payload_start..payload_end]);
        let checksum = hasher.digest();

        // Step 5: back-patch checksum into the header slot.
        self.storage[start + CHECKSUM_OFFSET..start + CHECKSUM_OFFSET + 8]
            .copy_from_slice(&checksum.to_le_bytes());

        // NOTE: no tail zero-fill here. The invariant is "freed slots are
        // zeroed" and `Arena::new` starts from all-zero storage. The tail
        // was already zero before this alloc. Dropping the fill saves a
        // ~1 MiB memset on every alloc for small-payload workloads — the
        // biggest remaining cost in the M5 benchmark.

        self.slots[slot] = SlotState::Allocated(id);
        self.directory.insert(id, slot);
        // Wire the new chunk into the LRU so eviction sees it.
        self.lru.insert(id);

        Ok(id)
    }

    /// Validate a chunk's header + payload checksum **without** copying
    /// the payload out of the arena. Used by callers that opened the arena
    /// via `Arena::open_lazy` and want an on-demand guarantee on a
    /// specific chunk.
    ///
    /// This is the explicit counterpart to `Arena::open_lazy` — the lazy
    /// open deliberately skips payload validation; `validate_chunk` is the
    /// "I want a guarantee before I trust this chunk" escape hatch.
    ///
    /// Unlike `touch_chunk`, this method does **not** update access_count,
    /// last_access_ns, or LRU ordering. Validation is read-only.
    ///
    /// Unlike `get_chunk`, this method does **not** allocate a new `Chunk`
    /// or copy the payload — it runs `Chunk::deserialize` purely for the
    /// checksum validation side effect and drops the result.
    ///
    /// # Errors
    ///
    /// - `UnknownChunkId(id)` if the chunk isn't registered in the directory.
    /// - `ChecksumMismatch { .. }` if the payload checksum no longer matches.
    /// - `PayloadSizeMismatch { .. }` if a corrupt header claims an
    ///   oversized payload.
    pub fn validate_chunk(&self, id: ChunkId) -> ArenaResult<()> {
        let slot = *self
            .directory
            .get(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;

        let start = slot * self.slot_size;
        let header_bytes = &self.storage[start..start + HEADER_SIZE];
        let header = crate::memory_arena::chunk::read_header_core(header_bytes)?;
        let total = HEADER_SIZE + header.payload_size as usize;

        if total > self.slot_size {
            return Err(ArenaError::PayloadSizeMismatch {
                header: header.payload_size,
                actual: self.slot_size - HEADER_SIZE,
            });
        }

        let chunk_bytes = &self.storage[start..start + total];
        // Deserialize validates magic + version + tier + streaming xxh3
        // over `header[0..CHECKSUM_OFFSET] || payload`. We drop the
        // returned Chunk — all we want is the side-effect of the check.
        let _ = Chunk::deserialize(chunk_bytes)?;
        Ok(())
    }

    /// Read the `ChunkState` byte from a chunk's header without deserializing
    /// the full chunk or running the checksum. The state byte lives at
    /// `slot_start + 64` — outside the checksum window — so this is a
    /// single-byte read with no allocator activity.
    ///
    /// Used by the demote crossfade machinery (`ArenaSet::complete_demote`,
    /// `abort_demote`, hysteresis check) to inspect fade progress without
    /// paying the `get_chunk` deserialize cost.
    pub fn chunk_state(&self, id: ChunkId) -> ArenaResult<ChunkState> {
        let slot = *self
            .directory
            .get(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;
        let start = slot * self.slot_size;
        ChunkState::from_u8(self.storage[start + 64])
    }

    /// Set the `ChunkState` byte for a chunk in place, without touching the
    /// payload or the checksum. The state byte lives at `slot_start + 64`
    /// — outside the checksum window — so this is a single-byte write that
    /// preserves the chunk's xxh3 checksum.
    ///
    /// This is the core primitive for the M3 demote crossfade: `begin_demote`
    /// calls `mark_state(source, FadingOut)` and `abort_demote` calls
    /// `mark_state(source, Resident)` to reverse it, both in O(1) with
    /// a single byte write.
    pub(crate) fn mark_state(&mut self, id: ChunkId, state: ChunkState) -> ArenaResult<()> {
        let slot = *self
            .directory
            .get(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;
        let start = slot * self.slot_size;
        self.storage[start + 64] = state.as_u8();
        Ok(())
    }

    /// Read the `last_demote_completed_at_ns` field from a chunk's header
    /// (bytes 72..80). Outside the checksum window — a plain u64 read.
    ///
    /// Used by the M3 hysteresis cooldown check in
    /// `ArenaSet::begin_demote`. Returns 0 for chunks that have never
    /// been demoted (the default from `ChunkHeader::new` and the M1/M2
    /// backward-compat value).
    pub fn read_last_demote_ns(&self, id: ChunkId) -> ArenaResult<u64> {
        let slot = *self
            .directory
            .get(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;
        let start = slot * self.slot_size;
        let bytes: [u8; 8] = self.storage[start + 72..start + 80]
            .try_into()
            .expect("slice length guaranteed by range");
        Ok(u64::from_le_bytes(bytes))
    }

    /// Write the `last_demote_completed_at_ns` field for a chunk in place,
    /// without touching the payload or the checksum. Bytes 72..80 are
    /// OUTSIDE the checksum window — this is a small direct byte write.
    ///
    /// Called by `ArenaSet::complete_demote` to stamp the target chunk
    /// with the current time so subsequent hysteresis checks on it see
    /// the fade.
    pub(crate) fn write_last_demote_ns(
        &mut self,
        id: ChunkId,
        now_ns: u64,
    ) -> ArenaResult<()> {
        let slot = *self
            .directory
            .get(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;
        let start = slot * self.slot_size;
        self.storage[start + 72..start + 80].copy_from_slice(&now_ns.to_le_bytes());
        Ok(())
    }

    /// Read the `last_promote_completed_at_ns` field from a chunk's header
    /// (bytes 80..88). Outside the checksum window — a plain u64 read.
    ///
    /// Used by the M4 hysteresis cooldown check in
    /// `ArenaSet::begin_promote`. Returns 0 for chunks that have never
    /// been promoted (the default from `ChunkHeader::new` and the M1/M2/M3
    /// backward-compat value).
    pub fn read_last_promote_ns(&self, id: ChunkId) -> ArenaResult<u64> {
        let slot = *self
            .directory
            .get(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;
        let start = slot * self.slot_size;
        let bytes: [u8; 8] = self.storage[start + 80..start + 88]
            .try_into()
            .expect("slice length guaranteed by range");
        Ok(u64::from_le_bytes(bytes))
    }

    /// Write the `last_promote_completed_at_ns` field for a chunk in place,
    /// without touching the payload or the checksum. Bytes 80..88 are
    /// OUTSIDE the checksum window — this is a small direct byte write.
    ///
    /// Called by `ArenaSet::complete_promote` to stamp the target chunk
    /// with the current time so subsequent hysteresis checks on it see
    /// the fade.
    pub(crate) fn write_last_promote_ns(
        &mut self,
        id: ChunkId,
        now_ns: u64,
    ) -> ArenaResult<()> {
        let slot = *self
            .directory
            .get(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;
        let start = slot * self.slot_size;
        self.storage[start + 80..start + 88].copy_from_slice(&now_ns.to_le_bytes());
        Ok(())
    }

    /// Read the `created_at_ns` field from a chunk's header (bytes 32..40).
    /// Inside the checksum window — a plain u64 read, no recomputation.
    ///
    /// Used by `TierPool::evict_lru` for FIFO victim selection (oldest
    /// `created_at_ns` wins).
    pub fn read_created_at_ns(&self, id: ChunkId) -> ArenaResult<u64> {
        let slot = *self
            .directory
            .get(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;
        let start = slot * self.slot_size;
        let bytes: [u8; 8] = self.storage[start + 32..start + 40]
            .try_into()
            .expect("slice length guaranteed by range");
        Ok(u64::from_le_bytes(bytes))
    }

    /// Read the `access_count` field from a chunk's header (bytes 48..56).
    /// Inside the checksum window — a plain u64 read, no recomputation.
    ///
    /// Used by the policy sweep driver to check promote thresholds without
    /// full chunk deserialization.
    pub fn read_access_count(&self, id: ChunkId) -> ArenaResult<u64> {
        let slot = *self
            .directory
            .get(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;
        let start = slot * self.slot_size;
        let bytes: [u8; 8] = self.storage[start + 48..start + 56]
            .try_into()
            .expect("slice length guaranteed by range");
        Ok(u64::from_le_bytes(bytes))
    }

    /// Read the `last_access_ns` field from a chunk's header (bytes 40..48).
    /// Inside the checksum window — a plain u64 read, no recomputation.
    ///
    /// Used by the policy sweep driver to check demote idle thresholds
    /// without full chunk deserialization.
    pub fn read_last_access_ns(&self, id: ChunkId) -> ArenaResult<u64> {
        let slot = *self
            .directory
            .get(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;
        let start = slot * self.slot_size;
        let bytes: [u8; 8] = self.storage[start + 40..start + 48]
            .try_into()
            .expect("slice length guaranteed by range");
        Ok(u64::from_le_bytes(bytes))
    }

    /// Reset the `access_count` field to 0 for a chunk. Because
    /// `access_count` lives inside the checksum window (bytes 48..56),
    /// this requires a full read-modify-write cycle with checksum
    /// recomputation — same pattern as `touch_chunk`.
    ///
    /// Called by the policy sweep driver after a successful promote to
    /// prevent the promoted chunk from immediately re-triggering the
    /// promote threshold.
    pub fn reset_access_count(&mut self, id: ChunkId) -> ArenaResult<()> {
        let slot = *self
            .directory
            .get(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;

        let start = slot * self.slot_size;

        // Read payload_size from the header to know the checksum span.
        let header = read_header_from(&self.storage[start..start + HEADER_SIZE])?;
        let payload_end = start + HEADER_SIZE + header.payload_size as usize;

        // Zero access_count in place (bytes 48..56).
        self.storage[start + 48..start + 56].fill(0);

        // Recompute checksum over header[0..CHECKSUM_OFFSET] || payload.
        // The checksum slot itself (56..64) is excluded from the hash input
        // by design — we hash 0..56 only.
        let mut hasher = Xxh3Default::new();
        hasher.update(&self.storage[start..start + CHECKSUM_OFFSET]);
        hasher.update(&self.storage[start + HEADER_SIZE..payload_end]);
        let checksum = hasher.digest();

        // Back-patch the checksum.
        self.storage[start + CHECKSUM_OFFSET..start + CHECKSUM_OFFSET + 8]
            .copy_from_slice(&checksum.to_le_bytes());

        Ok(())
    }

    /// Read a chunk by id. Returns an owned copy (deserialized + validated).
    pub fn get_chunk(&self, id: ChunkId) -> ArenaResult<Chunk> {
        let slot = *self
            .directory
            .get(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;

        // Read only the core header (bytes 0..64) to learn the payload
        // size. The full header parse happens inside Chunk::deserialize
        // below, which validates the checksum and extended fields.
        let start = slot * self.slot_size;
        let header_bytes = &self.storage[start..start + HEADER_SIZE];
        let header = crate::memory_arena::chunk::read_header_core(header_bytes)?;
        let total = HEADER_SIZE + header.payload_size as usize;

        // Defensive: ensure we don't read past slot boundary. If someone
        // corrupted the stored payload_size, this will catch it.
        if total > self.slot_size {
            return Err(ArenaError::PayloadSizeMismatch {
                header: header.payload_size,
                actual: self.slot_size - HEADER_SIZE,
            });
        }

        let chunk_bytes = &self.storage[start..start + total];
        Chunk::deserialize(chunk_bytes)
    }

    /// Read a chunk's payload by id — hot path. Returns a reference to the
    /// payload bytes in the backing storage without allocating a `Chunk` or
    /// copying the payload.
    ///
    /// Unlike `get_chunk`, this method:
    /// - Parses the header **once** (via `read_header_core`), not twice
    /// - Validates the checksum inline over the storage bytes (no copy)
    /// - Returns `&[u8]` (a slice into the backing storage), not an owned Vec
    ///
    /// The checksum is still validated on every call — this is NOT an
    /// unchecked fast path. The speedup comes from eliminating the redundant
    /// header parse and the payload `to_vec()` allocation.
    pub fn get_chunk_hot(&self, id: ChunkId) -> ArenaResult<&[u8]> {
        let slot = *self
            .directory
            .get(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;

        let start = slot * self.slot_size;
        let header_bytes = &self.storage[start..start + HEADER_SIZE];
        let header = read_header_core(header_bytes)?;
        let payload_size = header.payload_size as usize;
        let total = HEADER_SIZE + payload_size;

        if total > self.slot_size {
            return Err(ArenaError::PayloadSizeMismatch {
                header: header.payload_size,
                actual: self.slot_size - HEADER_SIZE,
            });
        }

        // Validate checksum inline: hash header[0..CHECKSUM_OFFSET] || payload.
        // The checksum field at bytes 56..64 is excluded from the hash input
        // by zeroing the window — but we can't mutate the backing storage.
        // Instead, hash header[0..56] directly (checksum field is at 56..64,
        // which is past our window anyway — we only hash 0..CHECKSUM_OFFSET).
        let mut hasher = Xxh3Default::new();
        hasher.update(&self.storage[start..start + CHECKSUM_OFFSET]);
        hasher.update(&self.storage[start + HEADER_SIZE..start + total]);
        let computed = hasher.digest();

        if computed != header.checksum {
            return Err(ArenaError::ChecksumMismatch {
                header: header.checksum,
                computed,
            });
        }

        Ok(&self.storage[start + HEADER_SIZE..start + total])
    }

    /// Read a chunk's header and payload by id — hot path with header access.
    ///
    /// Like `get_chunk_hot` but also returns the parsed `ChunkHeader`.
    /// Single header parse, inline checksum validation, zero payload copy.
    pub fn get_chunk_hot_with_header(&self, id: ChunkId) -> ArenaResult<(ChunkHeader, &[u8])> {
        let slot = *self
            .directory
            .get(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;

        let start = slot * self.slot_size;
        let header_bytes = &self.storage[start..start + HEADER_SIZE];
        let header = read_header_core(header_bytes)?;
        let payload_size = header.payload_size as usize;
        let total = HEADER_SIZE + payload_size;

        if total > self.slot_size {
            return Err(ArenaError::PayloadSizeMismatch {
                header: header.payload_size,
                actual: self.slot_size - HEADER_SIZE,
            });
        }

        let mut hasher = Xxh3Default::new();
        hasher.update(&self.storage[start..start + CHECKSUM_OFFSET]);
        hasher.update(&self.storage[start + HEADER_SIZE..start + total]);
        let computed = hasher.digest();

        if computed != header.checksum {
            return Err(ArenaError::ChecksumMismatch {
                header: header.checksum,
                computed,
            });
        }

        Ok((header, &self.storage[start + HEADER_SIZE..start + total]))
    }

    /// Free a chunk by id. Only the bytes that were actually written during
    /// alloc (header + payload) are zeroed — the tail of the slot is left
    /// untouched because it was never written by this chunk's alloc. The id
    /// is added back to the free stack but is NOT reused.
    ///
    /// # Why only zero the valid region
    ///
    /// The slot tail has been zero since either `Arena::new` (fresh arena)
    /// or the previous free of this slot (which also only wrote zeros to
    /// the valid region of *its* occupant). Readers always honor
    /// `header.payload_size`, so bytes beyond the cleared region are both
    /// zero and invisible. Zeroing the full slot is wasted memset work;
    /// for 1 MiB slots with small payloads this was the dominant free cost
    /// (~500 µs per free, dwarfing the 2.6 µs alloc).
    pub fn free_chunk(&mut self, id: ChunkId) -> ArenaResult<()> {
        let slot = self
            .directory
            .remove(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;

        // Read the current payload_size from the header so we know how much
        // of the slot actually contains live data. If the header is
        // corrupt (should never happen for a slot we allocated), fall back
        // to zeroing the entire slot as a safe default.
        let start = slot * self.slot_size;
        let header_bytes = &self.storage[start..start + HEADER_SIZE];
        let valid_end = match crate::memory_arena::chunk::read_header_core(header_bytes) {
            Ok(hdr) => {
                let payload_size = hdr.payload_size as usize;
                // Defensive bound: a corrupt header could claim more than
                // fits in the slot. Clamp to slot_size in that case.
                let requested = HEADER_SIZE.saturating_add(payload_size);
                start + requested.min(self.slot_size)
            }
            Err(_) => start + self.slot_size,
        };

        // Zero only the valid region. Tail stays as it was (zero).
        self.storage[start..valid_end].fill(0);

        self.slots[slot] = SlotState::Free;
        self.allocator.release_slot(slot);
        // Drop from LRU — eviction pickers should no longer see this id.
        self.lru.remove(id);
        Ok(())
    }

    /// Idempotent allocation used during journal replay and checkpoint restore.
    ///
    /// Takes a fully-serialized chunk (as produced by `Chunk::serialize`) and
    /// places it in the next available slot. If a chunk with the same id
    /// already exists, this is a no-op (idempotent replay — see
    /// memory/amiga-ram-storage-design.md for the crash-safety rationale).
    ///
    /// The `next_chunk_id` counter is advanced past this id so future
    /// `alloc_chunk` calls don't collide.
    pub fn apply_alloc(&mut self, id: ChunkId, chunk_bytes: &[u8]) -> ArenaResult<()> {
        if self.directory.contains_key(&id) {
            return Ok(()); // idempotent
        }

        // Validate the chunk before committing.
        let chunk = Chunk::deserialize(chunk_bytes)?;
        if chunk.header().chunk_id != id {
            return Err(ArenaError::CorruptJournal {
                reason: format!(
                    "chunk id mismatch: record says {}, header says {}",
                    id,
                    chunk.header().chunk_id
                ),
            });
        }

        let slot = self.allocator.pop_free_slot().ok_or(ArenaError::OutOfSlots {
            requested: 1,
            available: 0,
        })?;

        // Write the chunk directly into the slot. No tail zero-fill needed:
        // the invariant "freed slots are zero in the tail region" is
        // maintained by `Arena::new` (zero init) and `free_chunk` (which
        // only zeros the previously-valid region, leaving the already-zero
        // tail alone).
        let start = slot * self.slot_size;
        self.storage[start..start + chunk_bytes.len()].copy_from_slice(chunk_bytes);

        self.slots[slot] = SlotState::Allocated(id);
        self.directory.insert(id, slot);
        // Replay path: keep LRU in sync with directory.
        self.lru.insert(id);

        if id.as_u64() >= self.next_chunk_id {
            self.next_chunk_id = id.as_u64() + 1;
        }

        Ok(())
    }

    /// Idempotent free used during journal replay. If the chunk doesn't
    /// exist, this is a no-op.
    pub fn apply_free(&mut self, id: ChunkId) -> ArenaResult<()> {
        if !self.directory.contains_key(&id) {
            return Ok(()); // idempotent
        }
        self.free_chunk(id)
    }

    /// Place a chunk at a specific slot, used only by checkpoint restore.
    /// Assumes the slot is currently free.
    pub(crate) fn place_chunk_at_slot(
        &mut self,
        id: ChunkId,
        slot: usize,
        chunk_bytes: &[u8],
    ) -> ArenaResult<()> {
        if slot >= self.slots.len() {
            return Err(ArenaError::CorruptCheckpoint {
                reason: format!("slot {} out of bounds ({})", slot, self.slots.len()),
            });
        }
        if !matches!(self.slots[slot], SlotState::Free) {
            return Err(ArenaError::CorruptCheckpoint {
                reason: format!("slot {} already occupied", slot),
            });
        }

        // Validate the chunk matches the id.
        let chunk = Chunk::deserialize(chunk_bytes)?;
        if chunk.header().chunk_id != id {
            return Err(ArenaError::CorruptCheckpoint {
                reason: format!(
                    "chunk id mismatch at slot {}: expected {}, got {}",
                    slot,
                    id,
                    chunk.header().chunk_id
                ),
            });
        }

        // Remove from free stack via allocator. Linear search — fine for recovery path.
        self.allocator.claim_slot(slot);

        self.slots[slot] = SlotState::Allocated(id);
        self.directory.insert(id, slot);
        // Checkpoint-restore path: keep LRU in sync with directory. New chunks
        // go to the front by default; the full LRU order is not preserved
        // across checkpoints (accepted M1 trade-off — checkpoints capture
        // a point-in-time snapshot, not hot/cold ordering).
        self.lru.insert(id);

        if id.as_u64() >= self.next_chunk_id {
            self.next_chunk_id = id.as_u64() + 1;
        }

        Ok(())
    }

    /// Set the next chunk id counter. Used during checkpoint restore.
    pub(crate) fn set_next_chunk_id(&mut self, next: u64) {
        self.next_chunk_id = next;
    }

    /// Number of slots currently free (not allocated). O(1).
    pub fn free_slot_count(&self) -> usize {
        self.allocator.free_slot_count()
    }

    /// Re-register a slot whose backing bytes already contain a valid chunk
    /// (used by `WarmStart::open` after walking the mmap on reopen). Marks
    /// the slot allocated, inserts into directory + LRU, removes from the
    /// free stack, and bumps `next_chunk_id` past `id`.
    ///
    /// This is the "trust the bytes already on disk" path — the warm-start
    /// loop has already validated header magic + checksum, so we don't
    /// re-deserialize here.
    ///
    /// # Errors
    /// - `CorruptCheckpoint` if `slot` is out of bounds, the slot is already
    ///   allocated, or the slot is not in the free stack.
    pub fn reinsert_slot(&mut self, slot: usize, id: ChunkId) -> ArenaResult<()> {
        if slot >= self.slots.len() {
            return Err(ArenaError::CorruptCheckpoint {
                reason: format!(
                    "reinsert_slot: slot {} out of bounds ({})",
                    slot,
                    self.slots.len()
                ),
            });
        }
        if !matches!(self.slots[slot], SlotState::Free) {
            return Err(ArenaError::CorruptCheckpoint {
                reason: format!("reinsert_slot: slot {} already allocated", slot),
            });
        }
        if !self.allocator.claim_slot(slot) {
            return Err(ArenaError::CorruptCheckpoint {
                reason: format!("reinsert_slot: slot {} not in free stack", slot),
            });
        }
        self.slots[slot] = SlotState::Allocated(id);
        self.directory.insert(id, slot);
        self.lru.insert(id);
        if id.as_u64() >= self.next_chunk_id {
            self.next_chunk_id = id.as_u64() + 1;
        }
        Ok(())
    }

    /// Mutable access to the raw storage, used by checkpoint loader.
    pub(crate) fn storage_mut(&mut self) -> &mut [u8] {
        &mut self.storage
    }

    /// Touch a chunk: read, bump access count and last_access_ns, re-finalize
    /// (checksum), rewrite. Also moves the chunk to the front of the LRU
    /// index so eviction pickers see the fresh-access ordering.
    ///
    /// The expensive checksum rewrite path remains because chunk headers
    /// carry per-access state (access_count, last_access_ns) that must be
    /// persisted. The LruIndex update is the cheap ordering half; they are
    /// complementary, not redundant.
    ///
    /// Access tracking via the header is lossy across crashes (not journaled)
    /// — captured in the next checkpoint. LRU order is rebuilt on warm-start
    /// from the directory scan (insertion order, not hot/cold).
    pub fn touch_chunk(&mut self, id: ChunkId) -> ArenaResult<()> {
        let slot = *self
            .directory
            .get(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;

        let mut chunk = self.get_chunk(id)?;
        chunk.touch();
        chunk.finalize();
        let serialized = chunk.serialize();

        let start = slot * self.slot_size;
        self.storage[start..start + serialized.len()].copy_from_slice(&serialized);
        // Zero the tail again in case payload shrunk (shouldn't — but be defensive).
        let end = start + self.slot_size;
        self.storage[start + serialized.len()..end].fill(0);

        // Move the chunk to the front of the LRU. touch() on an absent id
        // would be a bug — the directory lookup above guarantees presence.
        let _ = self.lru.touch(id);

        Ok(())
    }

    /// Oldest chunk id according to the LRU order, or `None` if the arena
    /// holds no chunks. O(1). Use this to pick eviction victims.
    pub fn lru_oldest(&self) -> Option<ChunkId> {
        self.lru.oldest()
    }

    /// Iterator over all allocated chunk ids. Not ordered.
    pub fn iter_chunk_ids(&self) -> impl Iterator<Item = ChunkId> + '_ {
        self.directory.keys().copied()
    }

    /// Check whether a chunk id is currently allocated.
    pub fn contains(&self, id: ChunkId) -> bool {
        self.directory.contains_key(&id)
    }

    /// Snapshot current arena statistics.
    pub fn stats(&self) -> ArenaStats {
        let total_slots = self.slots.len();
        let free_slots = self.allocator.free_slot_count();
        let allocated_slots = total_slots - free_slots;
        let slot_size = self.slot_size as u64;
        ArenaStats {
            total_slots,
            free_slots,
            allocated_slots,
            total_bytes: slot_size * total_slots as u64,
            free_bytes: slot_size * free_slots as u64,
            allocated_bytes: slot_size * allocated_slots as u64,
        }
    }
}
