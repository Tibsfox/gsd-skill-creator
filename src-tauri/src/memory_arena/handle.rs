//! ArenaHandle — a bundle of (Arena, JournalWriter, paths) that owns
//! the filesystem side of a persistent arena.
//!
//! Tauri commands interact with the arena through this handle so we can
//! keep a single lock over all the mutable pieces (arena state + journal
//! file handle).

use std::path::{Path, PathBuf};

use crate::memory_arena::arena::Arena;
use crate::memory_arena::chunk::Chunk;
use crate::memory_arena::error::{ArenaError, ArenaResult};
use crate::memory_arena::persistence::{
    read_checkpoint, replay_into, write_checkpoint, JournalReader, JournalWriter,
};
use crate::memory_arena::types::{ArenaConfig, ChunkId, TierKind};

const CHECKPOINT_FILENAME: &str = "arena.checkpoint";
const JOURNAL_FILENAME: &str = "arena.journal";

/// Tier string used in IPC payloads. Symmetric with `TierKind::from_str`.
pub fn tier_kind_to_str(tier: TierKind) -> &'static str {
    match tier {
        TierKind::Hot => "hot",
        TierKind::Warm => "warm",
        TierKind::Vector => "vector",
        TierKind::Blob => "blob",
        TierKind::Resident => "resident",
    }
}

/// Parse a tier kind string. Returns `UnknownTierKind(0)` on failure so the
/// existing error variant is reusable.
pub fn tier_kind_from_str(s: &str) -> ArenaResult<TierKind> {
    match s {
        "hot" => Ok(TierKind::Hot),
        "warm" => Ok(TierKind::Warm),
        "vector" => Ok(TierKind::Vector),
        "blob" => Ok(TierKind::Blob),
        "resident" => Ok(TierKind::Resident),
        _ => Err(ArenaError::UnknownTierKind(0)),
    }
}

/// Owned handle to a persistent arena: arena state + journal file + paths.
pub struct ArenaHandle {
    arena: Arena,
    journal: JournalWriter,
    checkpoint_path: PathBuf,
    journal_path: PathBuf,
}

impl ArenaHandle {
    /// Initialize a persistent arena at `dir`.
    ///
    /// - If a checkpoint exists, load it and replay any journal entries.
    /// - If no checkpoint exists, create a fresh arena of the requested size
    ///   and start a new journal.
    ///
    /// `num_slots` is only used when creating fresh — on recovery, the slot
    /// count comes from the checkpoint file.
    pub fn init(dir: impl AsRef<Path>, config: ArenaConfig, num_slots: usize) -> ArenaResult<Self> {
        let dir = dir.as_ref();
        std::fs::create_dir_all(dir)?;

        let checkpoint_path = dir.join(CHECKPOINT_FILENAME);
        let journal_path = dir.join(JOURNAL_FILENAME);

        // Step 1: build the base arena. Either load from checkpoint or
        // start fresh.
        let mut arena = if checkpoint_path.exists() {
            read_checkpoint(config, &checkpoint_path)?
        } else {
            Arena::new(config, num_slots)?
        };

        // Step 2: replay any journal entries. Runs in BOTH the checkpoint
        // and fresh paths, because "crash before first checkpoint" leaves
        // us with a journal but no checkpoint — we still need to recover.
        if journal_path.exists() {
            if let Ok(reader) = JournalReader::open(&journal_path) {
                replay_into(&mut arena, reader)?;
            }
        }

        let journal = JournalWriter::open(&journal_path)?;

        Ok(Self {
            arena,
            journal,
            checkpoint_path,
            journal_path,
        })
    }

    /// Allocate a chunk and journal the operation.
    pub fn alloc(&mut self, tier: TierKind, payload: Vec<u8>) -> ArenaResult<ChunkId> {
        let id = self.arena.alloc_chunk(tier, payload)?;
        // Serialize the stored chunk for the journal entry.
        let chunk = self.arena.get_chunk(id)?;
        let bytes = chunk.serialize();
        self.journal.append_alloc(id, &bytes)?;
        self.journal.flush()?;
        Ok(id)
    }

    /// Free a chunk and journal the operation.
    pub fn free(&mut self, id: ChunkId) -> ArenaResult<()> {
        self.arena.free_chunk(id)?;
        self.journal.append_free(id)?;
        self.journal.flush()?;
        Ok(())
    }

    /// Read a chunk. No journal side effect.
    pub fn get(&self, id: ChunkId) -> ArenaResult<Chunk> {
        self.arena.get_chunk(id)
    }

    /// Touch a chunk (in-memory only, not journaled).
    pub fn touch(&mut self, id: ChunkId) -> ArenaResult<()> {
        self.arena.touch_chunk(id)
    }

    /// Write a checkpoint to disk and truncate the journal.
    ///
    /// Order: journal flush → checkpoint write → journal truncate.
    /// If any step fails, the arena state is unchanged (checkpoint is atomic
    /// via tempfile rename; a failed truncate leaves recoverable journal data).
    pub fn checkpoint(&mut self) -> ArenaResult<()> {
        self.journal.flush()?;
        write_checkpoint(&self.arena, &self.checkpoint_path)?;
        self.journal.truncate()?;
        Ok(())
    }

    /// Read-only access to the underlying arena (for stats, iteration).
    pub fn arena(&self) -> &Arena {
        &self.arena
    }

    /// Path to the checkpoint file (for tooling, testing).
    pub fn checkpoint_path(&self) -> &Path {
        &self.checkpoint_path
    }

    /// Path to the journal file (for tooling, testing).
    pub fn journal_path(&self) -> &Path {
        &self.journal_path
    }
}

impl std::fmt::Debug for ArenaHandle {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ArenaHandle")
            .field("arena", &self.arena)
            .field("checkpoint_path", &self.checkpoint_path)
            .field("journal_path", &self.journal_path)
            .finish()
    }
}
