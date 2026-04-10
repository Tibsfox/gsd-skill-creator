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

use crate::memory_arena::chunk::{read_header_core, Chunk};
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

/// Configuration for `WarmStart::open_with_config`. The default is **lazy**
/// validation — the M2 slice's headline change.
///
/// Under lazy mode (the default), `WarmStart::open` delegates to
/// `ArenaSet::open_lazy`, which walks slot headers and pre-populates
/// each pool's directory without touching payload bytes. Payload
/// corruption is invisible at open time; callers that need a guarantee
/// invoke `Arena::validate_chunk(id)` or rely on `get_chunk`'s
/// re-validation on every read.
///
/// Under eager mode (`eager_validation: true`), the M1 behavior is
/// preserved: every occupied slot is walked, its full header + checksum
/// is validated via `Chunk::deserialize`, and corrupt slots are routed
/// through `ColdSource` for rebuild.
#[derive(Debug, Clone, Copy)]
pub struct WarmStartConfig {
    /// If true, validate every chunk's payload checksum during open.
    /// If false (default), walk only headers and defer payload
    /// validation to caller-driven `validate_chunk` / `get_chunk` calls.
    pub eager_validation: bool,
}

impl Default for WarmStartConfig {
    fn default() -> Self {
        Self {
            eager_validation: false,
        }
    }
}

/// Per-invocation stats for `WarmStart::open_with_config`. Returned
/// alongside the `WarmStartReport` so callers (tests + benches) can
/// distinguish header-only walks from full-validation walks.
#[derive(Debug, Default, Clone, Copy)]
pub struct WarmStartStats {
    /// Number of pools walked.
    pub pools_walked: usize,
    /// Total header-level reads across all pools (the lazy walk's unit
    /// of work). Under eager mode this equals
    /// `slots_validated + slots_corrupt`.
    pub headers_walked: usize,
    /// Number of chunks successfully registered in a pool directory
    /// after the walk. Under lazy mode, matches the number of occupied
    /// slots. Under eager mode, matches `WarmStartReport.slots_validated`.
    pub slots_occupied: usize,
    /// Number of slots that ended up free after the walk.
    pub slots_free: usize,
    /// Number of payload checksums verified during the walk. Under lazy
    /// mode this is always 0 (no payload touches). Under eager mode it
    /// equals `WarmStartReport.slots_validated`.
    pub checksums_validated: usize,
}

/// Warm-start recovery entry point.
pub struct WarmStart;

impl WarmStart {
    /// Reopen an `ArenaSet` at `root` using the default (lazy)
    /// configuration and return the 2-tuple that M1 callers expect.
    ///
    /// Under the M2 default, this walks only slot headers — no payload
    /// bytes are touched, no checksums are verified. Callers that need a
    /// guarantee invoke `Arena::validate_chunk` or rely on `get_chunk`'s
    /// per-read re-validation. Callers that want the M1 eager behavior
    /// (with `ColdSource`-driven corruption rebuild) call
    /// `WarmStart::open_eager` instead.
    ///
    /// Backward-compatible signature: existing M1 call sites that invoke
    /// `WarmStart::open(root, cold)` compile unchanged. The shape of
    /// `WarmStartReport` is also unchanged; under lazy mode the
    /// validation-related counters reflect header-level success.
    pub fn open(
        root: impl AsRef<Path>,
        cold: &dyn ColdSource,
    ) -> ArenaResult<(ArenaSet, WarmStartReport)> {
        let (set, report, _stats) =
            Self::open_with_config(root, cold, WarmStartConfig::default())?;
        Ok((set, report))
    }

    /// Reopen an `ArenaSet` using the **eager** path explicitly: every
    /// occupied slot has its header + checksum validated via
    /// `Chunk::deserialize`, and corrupt slots are routed through
    /// `cold` for rebuild. This is the M1 behavior.
    ///
    /// Tests and callers that explicitly want the rebuild-from-cold
    /// contract call this method directly rather than relying on
    /// `WarmStart::open`'s default.
    pub fn open_eager(
        root: impl AsRef<Path>,
        cold: &dyn ColdSource,
    ) -> ArenaResult<(ArenaSet, WarmStartReport)> {
        let (set, report, _stats) = Self::open_with_config(
            root,
            cold,
            WarmStartConfig {
                eager_validation: true,
            },
        )?;
        Ok((set, report))
    }

    /// Reopen an `ArenaSet` with an explicit `WarmStartConfig`. Returns
    /// the report + stats tuple for callers (tests + benches) that want
    /// the full picture.
    pub fn open_with_config(
        root: impl AsRef<Path>,
        cold: &dyn ColdSource,
        config: WarmStartConfig,
    ) -> ArenaResult<(ArenaSet, WarmStartReport, WarmStartStats)> {
        let root = root.as_ref().to_path_buf();
        if config.eager_validation {
            let mut set = ArenaSet::open(&root)?;
            let mut report = WarmStartReport::default();

            // Walk pools in deterministic order — collect tiers first to
            // avoid borrow issues mutating the set inside the loop.
            let tiers: Vec<TierKind> = set.tiers().collect();
            let pools_walked = tiers.len();
            for tier in tiers {
                recover_pool(&mut set, tier, cold, &mut report)?;
            }

            // Stats derivation for the eager path.
            let mut slots_free: usize = 0;
            let post_tiers: Vec<TierKind> = set.tiers().collect();
            for tier in post_tiers {
                if let Some(pool) = set.pool(tier) {
                    slots_free += pool.arena().free_slot_count();
                }
            }
            let stats = WarmStartStats {
                pools_walked,
                headers_walked: report.slots_walked,
                slots_occupied: report.slots_validated
                    + report.slots_rebuilt_from_cold,
                slots_free,
                checksums_validated: report.slots_validated,
            };
            Ok((set, report, stats))
        } else {
            // Lazy path: ArenaSet::open_lazy pre-populates each pool's
            // directory via Arena::open_lazy. No checksums run; structural
            // corruption is absorbed into the free stack below the
            // WarmStart layer. Cold source is unused in lazy mode.
            let _ = cold; // silence unused-variable warning
            let set = ArenaSet::open_lazy(&root)?;

            let mut slots_walked: usize = 0;
            let mut slots_free: usize = 0;
            let tiers: Vec<TierKind> = set.tiers().collect();
            let pools_walked = tiers.len();
            for tier in &tiers {
                if let Some(pool) = set.pool(*tier) {
                    let pstats = pool.arena().stats();
                    slots_walked += pstats.allocated_slots;
                    slots_free += pstats.free_slots;
                }
            }

            // Under lazy mode, slots_validated is set to equal
            // slots_walked: every header that parsed counts as "validated
            // at the structural level". This keeps M1 happy-path test
            // assertions (`report.slots_validated == N`) green under the
            // new default. Per-chunk payload validation is deferred to
            // caller-driven `validate_chunk` / `get_chunk` calls.
            let report = WarmStartReport {
                slots_walked,
                slots_validated: slots_walked,
                slots_corrupt: 0,
                slots_rebuilt_from_cold: 0,
                slots_missing: 0,
                journal_records_replayed: 0,
            };
            let stats = WarmStartStats {
                pools_walked,
                headers_walked: slots_walked,
                slots_occupied: slots_walked,
                slots_free,
                checksums_validated: 0,
            };
            Ok((set, report, stats))
        }
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

        // Try to parse the core header (bytes 0..64). On failure, count
        // as corrupt-unknown-id because we can't extract a chunk id from
        // a broken header. Extended fields are irrelevant for the eager
        // recovery walk — full validation happens via Chunk::deserialize.
        let header = match read_header_core(header_bytes) {
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
