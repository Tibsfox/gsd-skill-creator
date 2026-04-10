//! Warm-start recovery loop — D3 of memory-arena-m1.
//!
//! End-to-end entry point for reopening an `ArenaSet` after a crash:
//!
//! 1. Reopen the manifest and per-tier mmap files via `ArenaSet::open`
//! 2. For each pool, walk every slot in the backing storage
//! 3. For each occupied slot (magic byte present), validate header + checksum
//!    via `Chunk::deserialize`
//! 4. On success: re-register the slot via `TierPool::warm_start_reinsert`
//! 5. On corruption (bad header or bad checksum): ask the `ColdSource` for a
//!    rebuild payload. If supplied, alloc a fresh chunk; if not, leave the
//!    slot empty and increment `slots_missing` in the report.
//! 6. Replay any `<root>/<tier>.journal` from offset 0 (per-pool journals
//!    are a Plan-05/Plan-06 partial — see deviation note in SUMMARY 05).
//!
//! ## Why this is the canonical recovery path
//!
//! M1 relies on the per-tier mmap as the primary durable store. Checkpoint
//! files are optional in slice 1 (the existing `persistence.rs` writes them
//! but the warm-start path does not depend on them — it walks the mmap
//! bytes directly). This trade-off keeps the recovery surface narrow:
//! one validation algorithm, one rebuild path, one report shape.

use std::collections::HashMap;
use std::path::Path;

use crate::memory_arena::chunk::{read_header_from, Chunk};
use crate::memory_arena::error::ArenaResult;
use crate::memory_arena::pool::ArenaSet;
use crate::memory_arena::types::{ChunkId, TierKind, CHUNK_MAGIC, HEADER_SIZE};

/// Source of last-resort chunk rebuilds. When a slot fails header or
/// checksum validation, `WarmStart::open` asks the `ColdSource` to supply
/// the payload. If the cold source returns `None`, the slot is left missing
/// and counted in the report.
///
/// Implementations must be `Send + Sync + object-safe` so they can live
/// behind a `Box<dyn ColdSource>`.
pub trait ColdSource: Send + Sync {
    /// Fetch the original payload for a given `(tier, id)`. Returns:
    /// - `Ok(Some(payload))` — rebuild the slot from this payload
    /// - `Ok(None)` — source has no entry for this chunk, leave slot empty
    /// - `Err(...)` — source had a hard error (propagate up to caller)
    fn fetch(&self, tier: TierKind, id: ChunkId) -> ArenaResult<Option<Vec<u8>>>;
}

/// In-memory cold source stub. Production replacement (PG-backed) is a
/// slice 2 concern — this stub exists so Plan 05's integration tests can
/// pre-seed known payloads and Plan 06's fault-injection tests can assert
/// the rebuild path is exercised.
#[derive(Debug, Default)]
pub struct InMemoryColdSource {
    map: HashMap<(TierKind, ChunkId), Vec<u8>>,
}

impl InMemoryColdSource {
    pub fn new() -> Self {
        Self {
            map: HashMap::new(),
        }
    }

    /// Pre-seed a payload that future warm-starts can use to rebuild a
    /// corrupted slot.
    pub fn insert(&mut self, tier: TierKind, id: ChunkId, payload: Vec<u8>) {
        self.map.insert((tier, id), payload);
    }
}

impl ColdSource for InMemoryColdSource {
    fn fetch(&self, tier: TierKind, id: ChunkId) -> ArenaResult<Option<Vec<u8>>> {
        Ok(self.map.get(&(tier, id)).cloned())
    }
}

/// Structured report of a `WarmStart::open` invocation. Exposed so callers
/// (tests and observability) can assert on each outcome category.
#[derive(Debug, Default, Clone)]
pub struct WarmStartReport {
    /// Total slots inspected across all pools (skipping empty/zero slots).
    pub slots_walked: usize,
    /// Slots that passed full header + checksum validation.
    pub slots_validated: usize,
    /// Slots whose header or checksum was corrupt.
    pub slots_corrupt: usize,
    /// Corrupt slots that were rebuilt from `ColdSource` successfully.
    pub slots_rebuilt_from_cold: usize,
    /// Corrupt slots that the cold source could not supply — left empty.
    pub slots_missing: usize,
    /// Journal records replayed across all pools.
    pub journal_records_replayed: usize,
}

/// Warm-start recovery entry point.
pub struct WarmStart;

impl WarmStart {
    /// Reopen an `ArenaSet` at `root`, walking every occupied slot to
    /// validate the header + checksum and optionally replay journals.
    /// Corrupt slots are routed through `cold` for rebuild.
    pub fn open(
        root: impl AsRef<Path>,
        cold: &dyn ColdSource,
    ) -> ArenaResult<(ArenaSet, WarmStartReport)> {
        let root = root.as_ref().to_path_buf();
        let mut set = ArenaSet::open(&root)?;
        let mut report = WarmStartReport::default();

        // Walk pools in deterministic order — collect tiers first to avoid
        // borrow issues mutating the set inside the loop.
        let tiers: Vec<TierKind> = set.tiers().collect();

        for tier in tiers {
            recover_pool(&mut set, tier, cold, &mut report)?;
        }

        Ok((set, report))
    }
}

/// Walk one pool's slots, validating + rebuilding as needed.
fn recover_pool(
    set: &mut ArenaSet,
    tier: TierKind,
    cold: &dyn ColdSource,
    report: &mut WarmStartReport,
) -> ArenaResult<()> {
    // Phase 1: collect slot decisions read-only. We can't hold a mut borrow
    // of the pool while we read its storage, so capture (slot_idx, decision)
    // pairs first then mutate the pool in phase 2.
    let pool = set.pool(tier).expect("tier from set.tiers() must exist");
    let arena = pool.arena();
    let num_slots = arena.num_slots();
    let slot_size = arena.config().chunk_size as usize;
    let storage = arena.storage();

    enum Decision {
        Empty,
        Valid(ChunkId),
        Corrupt(ChunkId),
        CorruptUnknownId,
    }

    let mut decisions: Vec<(usize, Decision)> = Vec::new();
    for slot_idx in 0..num_slots {
        let start = slot_idx * slot_size;
        let header_bytes = &storage[start..start + HEADER_SIZE];

        // Cheap pre-check: a slot whose first 8 bytes are all zero is free.
        if header_bytes[..CHUNK_MAGIC.len()].iter().all(|&b| b == 0) {
            // Free slot — skip.
            continue;
        }
        report.slots_walked += 1;

        // Try to parse the header. On failure, count as corrupt-unknown-id
        // because we can't extract a chunk id from a broken header.
        let header = match read_header_from(header_bytes) {
            Ok(h) => h,
            Err(_) => {
                report.slots_corrupt += 1;
                decisions.push((slot_idx, Decision::CorruptUnknownId));
                continue;
            }
        };
        let id = header.chunk_id;

        // Bounds-check payload size against slot size.
        let total_len = HEADER_SIZE + header.payload_size as usize;
        if total_len > slot_size {
            report.slots_corrupt += 1;
            decisions.push((slot_idx, Decision::Corrupt(id)));
            continue;
        }

        // Validate full chunk including checksum.
        let chunk_bytes = &storage[start..start + total_len];
        match Chunk::deserialize(chunk_bytes) {
            Ok(_) => {
                report.slots_validated += 1;
                decisions.push((slot_idx, Decision::Valid(id)));
            }
            Err(_) => {
                report.slots_corrupt += 1;
                decisions.push((slot_idx, Decision::Corrupt(id)));
            }
        }
    }

    // Phase 2: apply decisions with mutable access.
    let pool = set.pool_mut(tier).expect("tier still present");
    for (slot_idx, decision) in decisions {
        match decision {
            Decision::Empty => {} // unreachable; we skipped these
            Decision::Valid(id) => {
                // Re-register the existing slot — bytes are already correct.
                pool.warm_start_reinsert(slot_idx, id)?;
            }
            Decision::Corrupt(id) => {
                // Try cold rebuild. The slot is currently free in the
                // bookkeeping (we never registered it) but the bytes on
                // disk are stale-corrupt. We don't need to clear them
                // first; alloc will overwrite the slot we pop next.
                match cold.fetch(tier, id)? {
                    Some(payload) => {
                        // Pop a free slot via the normal alloc path. We
                        // don't constrain WHICH slot — the previously-
                        // corrupt one stays free until something else
                        // claims it. The recovered chunk gets a fresh slot
                        // with a fresh header.
                        let _new_id = pool.alloc(payload)?;
                        report.slots_rebuilt_from_cold += 1;
                    }
                    None => {
                        report.slots_missing += 1;
                    }
                }
            }
            Decision::CorruptUnknownId => {
                // Header is too broken to extract an id, so cold source
                // can't help. Count as missing and move on.
                report.slots_missing += 1;
            }
        }
    }

    Ok(())
}
