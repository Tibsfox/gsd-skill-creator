//! Warm-start recovery loop — RED stub.
//!
//! Module scaffolding for memory-arena-m1 Plan 05. The GREEN commit in Task 2
//! replaces every `todo!()` body with a real implementation.
//!
//! See MISSION.md Deliverable D3 for the full design. This module is the
//! end-to-end entry point for reopening an `ArenaSet` after a crash:
//!
//! 1. Read manifest, validate version + magic
//! 2. For each pool, walk slots, validate header + checksum on occupied slots
//! 3. Replay per-pool journal (if present) from last checkpoint offset
//! 4. On uncorrectable corruption → rebuild from `ColdSource`
//!
//! Plan 05 ships the happy path. Plan 06 adds the fault-injection tests.

use std::path::Path;

use crate::memory_arena::error::ArenaResult;
use crate::memory_arena::pool::ArenaSet;
use crate::memory_arena::types::{ChunkId, TierKind};

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
    _map: std::collections::HashMap<(TierKind, ChunkId), Vec<u8>>,
}

impl InMemoryColdSource {
    pub fn new() -> Self {
        todo!("RED: InMemoryColdSource::new — Plan 05 Task 2")
    }

    pub fn insert(&mut self, _tier: TierKind, _id: ChunkId, _payload: Vec<u8>) {
        todo!("RED: InMemoryColdSource::insert — Plan 05 Task 2")
    }
}

impl ColdSource for InMemoryColdSource {
    fn fetch(&self, _tier: TierKind, _id: ChunkId) -> ArenaResult<Option<Vec<u8>>> {
        todo!("RED: InMemoryColdSource::fetch — Plan 05 Task 2")
    }
}

/// Structured report of a `WarmStart::open` invocation. Exposed so callers
/// (tests and observability) can assert on each outcome category.
#[derive(Debug, Default, Clone)]
pub struct WarmStartReport {
    pub slots_walked: usize,
    pub slots_validated: usize,
    pub slots_corrupt: usize,
    pub slots_rebuilt_from_cold: usize,
    pub slots_missing: usize,
    pub journal_records_replayed: usize,
}

/// Warm-start recovery entry point.
pub struct WarmStart;

impl WarmStart {
    /// Reopen an `ArenaSet` at `root`, walking every occupied slot to
    /// validate the header + checksum and optionally replay journals.
    /// Corrupt slots are routed through `cold` for rebuild.
    pub fn open(
        _root: impl AsRef<Path>,
        _cold: &dyn ColdSource,
    ) -> ArenaResult<(ArenaSet, WarmStartReport)> {
        todo!("RED: WarmStart::open — Plan 05 Task 2")
    }
}
