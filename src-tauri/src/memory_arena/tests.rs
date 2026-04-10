//! Unit tests for the chunk primitive, arena allocator, and persistence.

use super::*;
use crate::memory_arena::arena::Arena;
use crate::memory_arena::persistence::{
    read_checkpoint, replay_into, write_checkpoint, JournalReader, JournalWriter,
};
use crate::memory_arena::types::{ArenaConfig, HEADER_SIZE};
use tempfile::tempdir;

#[test]
fn chunk_roundtrip_small_blob() {
    let payload = b"hello amiga".to_vec();
    let mut chunk = Chunk::new(ChunkId::new(42), TierKind::Blob, payload.clone());
    chunk.finalize();

    let bytes = chunk.serialize();
    assert_eq!(bytes.len(), HEADER_SIZE + payload.len());

    let back = Chunk::deserialize(&bytes).expect("roundtrip should succeed");
    assert_eq!(back.header().chunk_id, ChunkId::new(42));
    assert_eq!(back.header().tier, TierKind::Blob);
    assert_eq!(back.header().payload_size, payload.len() as u64);
    assert_eq!(back.payload(), payload.as_slice());
}

#[test]
fn chunk_roundtrip_all_tier_kinds() {
    for tier in [
        TierKind::Hot,
        TierKind::Warm,
        TierKind::Vector,
        TierKind::Blob,
        TierKind::Resident,
    ] {
        let payload = vec![0xAB; 256];
        let mut chunk = Chunk::new(ChunkId::new(tier.as_u8() as u64), tier, payload.clone());
        chunk.finalize();
        let bytes = chunk.serialize();
        let back = Chunk::deserialize(&bytes).expect("tier roundtrip should succeed");
        assert_eq!(back.header().tier, tier);
        assert_eq!(back.payload(), payload.as_slice());
    }
}

#[test]
fn chunk_detects_bit_flip_in_payload() {
    let payload = vec![0u8; 512];
    let mut chunk = Chunk::new(ChunkId::new(1), TierKind::Warm, payload);
    chunk.finalize();
    let mut bytes = chunk.serialize();

    // Flip a bit deep in the payload.
    bytes[HEADER_SIZE + 100] ^= 0x01;

    let result = Chunk::deserialize(&bytes);
    assert!(
        matches!(result, Err(ArenaError::ChecksumMismatch { .. })),
        "expected ChecksumMismatch, got {:?}",
        result
    );
}

#[test]
fn chunk_detects_bit_flip_in_header() {
    let payload = vec![0u8; 128];
    let mut chunk = Chunk::new(ChunkId::new(99), TierKind::Hot, payload);
    chunk.finalize();
    let mut bytes = chunk.serialize();

    // Flip a bit in the access_count field (offset 48..56) — not checksum.
    bytes[49] ^= 0x10;

    let result = Chunk::deserialize(&bytes);
    assert!(
        matches!(result, Err(ArenaError::ChecksumMismatch { .. })),
        "expected ChecksumMismatch from header tamper, got {:?}",
        result
    );
}

#[test]
fn chunk_rejects_invalid_magic() {
    let payload = vec![1u8, 2, 3, 4];
    let mut chunk = Chunk::new(ChunkId::new(7), TierKind::Blob, payload);
    chunk.finalize();
    let mut bytes = chunk.serialize();

    // Corrupt the magic.
    bytes[0] = b'X';

    let result = Chunk::deserialize(&bytes);
    assert!(
        matches!(result, Err(ArenaError::InvalidMagic { .. })),
        "expected InvalidMagic, got {:?}",
        result
    );
}

#[test]
fn chunk_rejects_unsupported_version() {
    let payload = vec![0u8; 64];
    let mut chunk = Chunk::new(ChunkId::new(3), TierKind::Warm, payload);
    chunk.finalize();
    let mut bytes = chunk.serialize();

    // Bump version to 99 in the little-endian u16 at offset 8..10.
    bytes[8] = 99;
    bytes[9] = 0;

    let result = Chunk::deserialize(&bytes);
    assert!(
        matches!(result, Err(ArenaError::UnsupportedVersion { version: 99 })),
        "expected UnsupportedVersion, got {:?}",
        result
    );
}

#[test]
fn chunk_rejects_unknown_tier() {
    let payload = vec![0u8; 32];
    let mut chunk = Chunk::new(ChunkId::new(5), TierKind::Hot, payload);
    chunk.finalize();
    let mut bytes = chunk.serialize();

    // Tier byte lives at offset 10.
    bytes[10] = 200;

    let result = Chunk::deserialize(&bytes);
    assert!(
        matches!(result, Err(ArenaError::UnknownTierKind(200))),
        "expected UnknownTierKind(200), got {:?}",
        result
    );
}

#[test]
fn chunk_rejects_buffer_smaller_than_header() {
    let too_small = vec![0u8; HEADER_SIZE - 1];
    let result = Chunk::deserialize(&too_small);
    assert!(
        matches!(result, Err(ArenaError::BufferTooSmall { .. })),
        "expected BufferTooSmall, got {:?}",
        result
    );
}

#[test]
fn chunk_rejects_payload_size_mismatch() {
    let payload = vec![0u8; 100];
    let mut chunk = Chunk::new(ChunkId::new(11), TierKind::Blob, payload);
    chunk.finalize();
    let mut bytes = chunk.serialize();

    // Truncate the buffer so the header's payload_size (100) exceeds actual.
    bytes.truncate(HEADER_SIZE + 50);

    let result = Chunk::deserialize(&bytes);
    assert!(
        matches!(result, Err(ArenaError::PayloadSizeMismatch { .. })),
        "expected PayloadSizeMismatch, got {:?}",
        result
    );
}

#[test]
fn chunk_touch_updates_access_count() {
    let mut chunk = Chunk::new(ChunkId::new(1), TierKind::Hot, vec![0u8; 16]);
    assert_eq!(chunk.header().access_count, 0);
    chunk.touch();
    assert_eq!(chunk.header().access_count, 1);
    chunk.touch();
    chunk.touch();
    assert_eq!(chunk.header().access_count, 3);
}

#[test]
fn empty_payload_is_valid() {
    let mut chunk = Chunk::new(ChunkId::new(0), TierKind::Resident, Vec::new());
    chunk.finalize();
    let bytes = chunk.serialize();
    assert_eq!(bytes.len(), HEADER_SIZE);
    let back = Chunk::deserialize(&bytes).expect("empty payload should roundtrip");
    assert_eq!(back.payload().len(), 0);
    assert_eq!(back.header().tier, TierKind::Resident);
}

#[test]
fn arena_config_test_preset_has_small_chunks() {
    let cfg = ArenaConfig::test();
    assert!(cfg.chunk_size <= 16 * 1024);
    assert!(cfg.min_chunk_size >= 64);
}

#[test]
fn arena_config_validate_size_enforces_bounds() {
    let cfg = ArenaConfig::test();
    assert!(cfg.validate_size(cfg.chunk_size).is_ok());
    assert!(cfg.validate_size(cfg.min_chunk_size).is_ok());
    assert!(cfg.validate_size(cfg.max_chunk_size).is_ok());
    assert!(cfg.validate_size(cfg.min_chunk_size - 1).is_err());
    assert!(cfg.validate_size(cfg.max_chunk_size + 1).is_err());
}

#[test]
fn header_size_constant_matches_layout() {
    // Paranoia: if someone bumps fields, make sure HEADER_SIZE is still right.
    // We allocate HEADER_SIZE and write into it — anything writing past that
    // would fail the debug_assert in write_header_into.
    let header = ChunkHeader::new(ChunkId::new(1), TierKind::Hot, 100);
    let mut buf = [0u8; HEADER_SIZE];
    super::chunk::write_header_into(&header, &mut buf);
    // Magic should be at offset 0.
    assert_eq!(&buf[0..8], &CHUNK_MAGIC);
    // Last 64 bytes should be the reserved tail.
    assert!(buf[64..HEADER_SIZE].iter().all(|&b| b == 0));
}

// ============================================================================
// Arena tests
// ============================================================================

/// Small arena config for tests: 4 slots of 4 KiB each = 16 KiB total.
fn test_arena() -> Arena {
    Arena::new(ArenaConfig::test(), 4).expect("test arena should build")
}

#[test]
fn arena_new_starts_empty() {
    let arena = test_arena();
    let stats = arena.stats();
    assert_eq!(stats.total_slots, 4);
    assert_eq!(stats.free_slots, 4);
    assert_eq!(stats.allocated_slots, 0);
    assert_eq!(stats.total_bytes, 16 * 1024);
}

#[test]
fn arena_max_payload_size_is_slot_minus_header() {
    let arena = test_arena();
    assert_eq!(arena.max_payload_size(), 4 * 1024 - HEADER_SIZE);
}

#[test]
fn arena_alloc_then_read_roundtrip() {
    let mut arena = test_arena();
    let payload = b"the amiga principle".to_vec();
    let id = arena
        .alloc_chunk(TierKind::Blob, payload.clone())
        .expect("alloc should succeed");

    let chunk = arena.get_chunk(id).expect("get should succeed");
    assert_eq!(chunk.payload(), payload.as_slice());
    assert_eq!(chunk.header().tier, TierKind::Blob);
    assert_eq!(chunk.header().chunk_id, id);
}

#[test]
fn arena_allocates_distinct_ids() {
    let mut arena = test_arena();
    let id1 = arena.alloc_chunk(TierKind::Hot, vec![1u8; 16]).unwrap();
    let id2 = arena.alloc_chunk(TierKind::Hot, vec![2u8; 16]).unwrap();
    let id3 = arena.alloc_chunk(TierKind::Hot, vec![3u8; 16]).unwrap();
    assert_ne!(id1, id2);
    assert_ne!(id2, id3);
    // IDs are monotonic but not necessarily sequential (future proofing).
    assert!(id2.as_u64() > id1.as_u64());
    assert!(id3.as_u64() > id2.as_u64());
}

#[test]
fn arena_fills_up_and_reports_correct_stats() {
    let mut arena = test_arena();
    for i in 0..4 {
        arena.alloc_chunk(TierKind::Warm, vec![i as u8; 32]).unwrap();
    }
    let stats = arena.stats();
    assert_eq!(stats.allocated_slots, 4);
    assert_eq!(stats.free_slots, 0);
}

#[test]
fn arena_rejects_alloc_when_full() {
    let mut arena = test_arena();
    for _ in 0..4 {
        arena.alloc_chunk(TierKind::Warm, vec![0u8; 16]).unwrap();
    }
    // Fifth alloc should fail.
    let result = arena.alloc_chunk(TierKind::Warm, vec![0u8; 16]);
    assert!(
        result.is_err(),
        "expected error when arena full, got {:?}",
        result
    );
}

#[test]
fn arena_rejects_oversized_payload() {
    let mut arena = test_arena();
    // slot_size is 4096, max_payload is 4096 - 128 = 3968. Try 4000.
    let huge = vec![0u8; 4000];
    let result = arena.alloc_chunk(TierKind::Blob, huge);
    assert!(
        matches!(result, Err(ArenaError::PayloadSizeMismatch { .. })),
        "expected PayloadSizeMismatch, got {:?}",
        result
    );
}

#[test]
fn arena_free_returns_slot_to_pool() {
    let mut arena = test_arena();
    let id = arena.alloc_chunk(TierKind::Hot, vec![7u8; 64]).unwrap();
    assert_eq!(arena.stats().allocated_slots, 1);

    arena.free_chunk(id).unwrap();
    assert_eq!(arena.stats().allocated_slots, 0);
    assert_eq!(arena.stats().free_slots, 4);

    // Freed id should no longer be in directory.
    assert!(!arena.contains(id));

    // Read should now fail.
    let result = arena.get_chunk(id);
    assert!(result.is_err(), "expected error after free, got {:?}", result);
}

#[test]
fn arena_free_then_alloc_does_not_reuse_id() {
    let mut arena = test_arena();
    let id1 = arena.alloc_chunk(TierKind::Hot, vec![1u8; 16]).unwrap();
    arena.free_chunk(id1).unwrap();
    let id2 = arena.alloc_chunk(TierKind::Hot, vec![2u8; 16]).unwrap();
    // id2 must be fresh, not reused.
    assert_ne!(id1, id2);
    assert!(id2.as_u64() > id1.as_u64());
}

#[test]
fn arena_free_unknown_id_errors() {
    let mut arena = test_arena();
    let result = arena.free_chunk(ChunkId::new(9999));
    assert!(result.is_err(), "expected error on bogus id, got {:?}", result);
}

#[test]
fn arena_multiple_tiers_coexist() {
    let mut arena = test_arena();
    let hot = arena.alloc_chunk(TierKind::Hot, vec![1u8; 32]).unwrap();
    let warm = arena.alloc_chunk(TierKind::Warm, vec![2u8; 32]).unwrap();
    let vector = arena.alloc_chunk(TierKind::Vector, vec![3u8; 32]).unwrap();
    let blob = arena.alloc_chunk(TierKind::Blob, vec![4u8; 32]).unwrap();

    assert_eq!(arena.get_chunk(hot).unwrap().header().tier, TierKind::Hot);
    assert_eq!(arena.get_chunk(warm).unwrap().header().tier, TierKind::Warm);
    assert_eq!(arena.get_chunk(vector).unwrap().header().tier, TierKind::Vector);
    assert_eq!(arena.get_chunk(blob).unwrap().header().tier, TierKind::Blob);
}

#[test]
fn arena_iter_chunk_ids_returns_all_allocated() {
    let mut arena = test_arena();
    let id1 = arena.alloc_chunk(TierKind::Hot, vec![0u8; 16]).unwrap();
    let id2 = arena.alloc_chunk(TierKind::Hot, vec![0u8; 16]).unwrap();
    let id3 = arena.alloc_chunk(TierKind::Hot, vec![0u8; 16]).unwrap();

    let ids: std::collections::HashSet<ChunkId> = arena.iter_chunk_ids().collect();
    assert_eq!(ids.len(), 3);
    assert!(ids.contains(&id1));
    assert!(ids.contains(&id2));
    assert!(ids.contains(&id3));
}

#[test]
fn arena_touch_bumps_access_count() {
    let mut arena = test_arena();
    let id = arena.alloc_chunk(TierKind::Hot, vec![0u8; 32]).unwrap();

    let before = arena.get_chunk(id).unwrap();
    assert_eq!(before.header().access_count, 0);

    arena.touch_chunk(id).unwrap();
    arena.touch_chunk(id).unwrap();
    arena.touch_chunk(id).unwrap();

    let after = arena.get_chunk(id).unwrap();
    assert_eq!(after.header().access_count, 3);
    // Checksum must still verify — get_chunk re-validates via Chunk::deserialize.
}

#[test]
fn arena_empty_payload_is_valid() {
    let mut arena = test_arena();
    let id = arena.alloc_chunk(TierKind::Resident, Vec::new()).unwrap();
    let chunk = arena.get_chunk(id).unwrap();
    assert_eq!(chunk.payload().len(), 0);
    assert_eq!(chunk.header().tier, TierKind::Resident);
}

#[test]
fn arena_many_alloc_free_cycles_are_stable() {
    // Stress test: allocate and free 100 times with a 4-slot arena.
    // Verifies the free stack stays consistent.
    let mut arena = test_arena();
    for i in 0..100 {
        let id = arena
            .alloc_chunk(TierKind::Hot, vec![(i % 256) as u8; 64])
            .unwrap();
        // Verify we can read what we just wrote.
        let chunk = arena.get_chunk(id).unwrap();
        assert_eq!(chunk.payload()[0], (i % 256) as u8);
        arena.free_chunk(id).unwrap();
    }
    // Arena should be empty.
    assert_eq!(arena.stats().allocated_slots, 0);
    assert_eq!(arena.stats().free_slots, 4);
}

#[test]
fn arena_filled_then_half_freed_has_correct_stats() {
    let mut arena = test_arena();
    let ids: Vec<ChunkId> = (0..4)
        .map(|i| {
            arena
                .alloc_chunk(TierKind::Warm, vec![i as u8; 32])
                .unwrap()
        })
        .collect();
    assert_eq!(arena.stats().allocated_slots, 4);

    // Free the first two.
    arena.free_chunk(ids[0]).unwrap();
    arena.free_chunk(ids[1]).unwrap();

    let stats = arena.stats();
    assert_eq!(stats.allocated_slots, 2);
    assert_eq!(stats.free_slots, 2);

    // The surviving two should still read correctly.
    let chunk2 = arena.get_chunk(ids[2]).unwrap();
    assert_eq!(chunk2.payload()[0], 2u8);
    let chunk3 = arena.get_chunk(ids[3]).unwrap();
    assert_eq!(chunk3.payload()[0], 3u8);

    // The freed two should error on read.
    assert!(arena.get_chunk(ids[0]).is_err());
    assert!(arena.get_chunk(ids[1]).is_err());
}

// ============================================================================
// Persistence: checkpoint tests
// ============================================================================

#[test]
fn checkpoint_roundtrip_empty_arena() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("empty.ckpt");

    let arena = test_arena();
    write_checkpoint(&arena, &path).expect("checkpoint empty arena");

    let restored = read_checkpoint(ArenaConfig::test(), &path).expect("restore empty arena");
    assert_eq!(restored.stats().total_slots, 4);
    assert_eq!(restored.stats().allocated_slots, 0);
    assert_eq!(restored.next_chunk_id(), 1);
}

#[test]
fn checkpoint_roundtrip_with_chunks() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("chunks.ckpt");

    // Build an arena with mixed tiers and payloads.
    let mut arena = test_arena();
    let id_a = arena
        .alloc_chunk(TierKind::Hot, b"alpha-payload".to_vec())
        .unwrap();
    let id_b = arena
        .alloc_chunk(TierKind::Warm, b"bravo-the-amiga-principle".to_vec())
        .unwrap();
    let id_c = arena
        .alloc_chunk(TierKind::Vector, vec![0xCCu8; 256])
        .unwrap();

    write_checkpoint(&arena, &path).expect("checkpoint write");

    let restored = read_checkpoint(ArenaConfig::test(), &path).expect("checkpoint read");
    assert_eq!(restored.stats().allocated_slots, 3);
    assert_eq!(restored.next_chunk_id(), arena.next_chunk_id());

    // Every chunk should read back identically.
    let a = restored.get_chunk(id_a).unwrap();
    assert_eq!(a.payload(), b"alpha-payload");
    assert_eq!(a.header().tier, TierKind::Hot);
    let b = restored.get_chunk(id_b).unwrap();
    assert_eq!(b.payload(), b"bravo-the-amiga-principle");
    assert_eq!(b.header().tier, TierKind::Warm);
    let c = restored.get_chunk(id_c).unwrap();
    assert_eq!(c.payload(), vec![0xCCu8; 256].as_slice());
    assert_eq!(c.header().tier, TierKind::Vector);
}

#[test]
fn checkpoint_preserves_next_chunk_id_after_free() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("nextid.ckpt");

    let mut arena = test_arena();
    let id1 = arena.alloc_chunk(TierKind::Hot, vec![1u8; 16]).unwrap();
    let id2 = arena.alloc_chunk(TierKind::Hot, vec![2u8; 16]).unwrap();
    arena.alloc_chunk(TierKind::Hot, vec![3u8; 16]).unwrap();
    arena.free_chunk(id2).unwrap();
    // next_chunk_id should now be 4 (we allocated 1,2,3).
    let next_before = arena.next_chunk_id();
    assert_eq!(next_before, 4);

    write_checkpoint(&arena, &path).unwrap();
    let mut restored = read_checkpoint(ArenaConfig::test(), &path).unwrap();
    assert_eq!(restored.next_chunk_id(), 4);

    // A new alloc on the restored arena should get id 4, not reuse id 2.
    let id_new = restored.alloc_chunk(TierKind::Hot, vec![9u8; 16]).unwrap();
    assert_eq!(id_new, ChunkId::new(4));
    // And id1 should still be readable.
    assert!(restored.get_chunk(id1).is_ok());
}

#[test]
fn checkpoint_rejects_tampered_file() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("tampered.ckpt");

    let mut arena = test_arena();
    arena
        .alloc_chunk(TierKind::Blob, b"sensitive".to_vec())
        .unwrap();
    write_checkpoint(&arena, &path).unwrap();

    // Flip a byte in the middle.
    let mut bytes = std::fs::read(&path).unwrap();
    let mid = bytes.len() / 2;
    bytes[mid] ^= 0x01;
    std::fs::write(&path, &bytes).unwrap();

    let result = read_checkpoint(ArenaConfig::test(), &path);
    assert!(
        matches!(result, Err(ArenaError::CorruptCheckpoint { .. })),
        "expected CorruptCheckpoint, got {:?}",
        result
    );
}

#[test]
fn checkpoint_rejects_wrong_chunk_size() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("size.ckpt");

    let arena = test_arena();
    write_checkpoint(&arena, &path).unwrap();

    // Try to load with a different chunk size.
    let mut wrong_config = ArenaConfig::test();
    wrong_config.chunk_size = 8 * 1024; // was 4 KiB
    let result = read_checkpoint(wrong_config, &path);
    assert!(
        matches!(result, Err(ArenaError::ConfigMismatch { .. })),
        "expected ConfigMismatch, got {:?}",
        result
    );
}

// ============================================================================
// Persistence: journal tests
// ============================================================================

#[test]
fn journal_roundtrip_alloc_and_free() {
    let dir = tempdir().unwrap();
    let journal_path = dir.path().join("ops.journal");

    // Source arena: alloc two, free one.
    let mut source = test_arena();
    let id1 = source.alloc_chunk(TierKind::Hot, b"one".to_vec()).unwrap();
    let id2 = source.alloc_chunk(TierKind::Warm, b"two".to_vec()).unwrap();
    let c1_bytes = source.get_chunk(id1).unwrap().serialize();
    let c2_bytes = source.get_chunk(id2).unwrap().serialize();
    source.free_chunk(id1).unwrap();

    // Write the same sequence to the journal.
    let mut writer = JournalWriter::open(&journal_path).unwrap();
    writer.append_alloc(id1, &c1_bytes).unwrap();
    writer.append_alloc(id2, &c2_bytes).unwrap();
    writer.append_free(id1).unwrap();
    writer.flush().unwrap();
    drop(writer);

    // Replay into a fresh arena.
    let mut dest = test_arena();
    let reader = JournalReader::open(&journal_path).unwrap();
    let count = replay_into(&mut dest, reader).unwrap();
    assert_eq!(count, 3);

    // Final state: only id2 is alive, same payload.
    assert!(!dest.contains(id1));
    assert!(dest.contains(id2));
    let chunk2 = dest.get_chunk(id2).unwrap();
    assert_eq!(chunk2.payload(), b"two");
}

#[test]
fn journal_replay_is_idempotent() {
    let dir = tempdir().unwrap();
    let journal_path = dir.path().join("idem.journal");

    let mut source = test_arena();
    let id = source.alloc_chunk(TierKind::Blob, b"idempotent".to_vec()).unwrap();
    let chunk_bytes = source.get_chunk(id).unwrap().serialize();

    let mut writer = JournalWriter::open(&journal_path).unwrap();
    writer.append_alloc(id, &chunk_bytes).unwrap();
    writer.flush().unwrap();
    drop(writer);

    // Replay once.
    let mut dest = test_arena();
    let reader = JournalReader::open(&journal_path).unwrap();
    replay_into(&mut dest, reader).unwrap();
    assert_eq!(dest.stats().allocated_slots, 1);
    assert!(dest.contains(id));

    // Replay again into the same arena — should be a no-op (idempotent).
    let reader = JournalReader::open(&journal_path).unwrap();
    replay_into(&mut dest, reader).unwrap();
    assert_eq!(dest.stats().allocated_slots, 1);
    assert!(dest.contains(id));
    let chunk = dest.get_chunk(id).unwrap();
    assert_eq!(chunk.payload(), b"idempotent");
}

#[test]
fn journal_truncate_resets_to_header() {
    let dir = tempdir().unwrap();
    let journal_path = dir.path().join("trunc.journal");

    let mut writer = JournalWriter::open(&journal_path).unwrap();
    for i in 0..5 {
        let payload = vec![i as u8; 32];
        let chunk = {
            let mut c = Chunk::new(ChunkId::new(i as u64 + 1), TierKind::Hot, payload);
            c.finalize();
            c.serialize()
        };
        writer
            .append_alloc(ChunkId::new(i as u64 + 1), &chunk)
            .unwrap();
    }
    writer.flush().unwrap();

    let size_before = std::fs::metadata(&journal_path).unwrap().len();
    assert!(size_before > 12, "journal should have records");

    writer.truncate().unwrap();
    let size_after = std::fs::metadata(&journal_path).unwrap().len();
    assert_eq!(size_after, 12, "truncate should leave only the header");

    drop(writer);

    // Reading a truncated journal should yield zero ops.
    let reader = JournalReader::open(&journal_path).unwrap();
    let mut arena = test_arena();
    let count = replay_into(&mut arena, reader).unwrap();
    assert_eq!(count, 0);
}

#[test]
fn journal_handles_truncated_last_record_as_eof() {
    let dir = tempdir().unwrap();
    let journal_path = dir.path().join("crashed.journal");

    // Write two records.
    let mut source = test_arena();
    let id1 = source.alloc_chunk(TierKind::Hot, b"aaa".to_vec()).unwrap();
    let id2 = source.alloc_chunk(TierKind::Hot, b"bbb".to_vec()).unwrap();
    let c1 = source.get_chunk(id1).unwrap().serialize();
    let c2 = source.get_chunk(id2).unwrap().serialize();

    let mut writer = JournalWriter::open(&journal_path).unwrap();
    writer.append_alloc(id1, &c1).unwrap();
    writer.append_alloc(id2, &c2).unwrap();
    writer.flush().unwrap();
    drop(writer);

    // Simulate a crash: truncate the file mid-second-record.
    let mut bytes = std::fs::read(&journal_path).unwrap();
    // Cut off the last 20 bytes of the file — well inside record 2.
    assert!(bytes.len() > 30);
    bytes.truncate(bytes.len() - 20);
    std::fs::write(&journal_path, &bytes).unwrap();

    // Replay should succeed with only the first record applied.
    let mut dest = test_arena();
    let reader = JournalReader::open(&journal_path).unwrap();
    let count = replay_into(&mut dest, reader).unwrap();
    assert_eq!(count, 1);
    assert!(dest.contains(id1));
    assert!(!dest.contains(id2));
}

#[test]
fn journal_detects_corrupt_record_checksum() {
    let dir = tempdir().unwrap();
    let journal_path = dir.path().join("corrupt.journal");

    let mut source = test_arena();
    let id = source.alloc_chunk(TierKind::Warm, b"pristine".to_vec()).unwrap();
    let bytes = source.get_chunk(id).unwrap().serialize();

    let mut writer = JournalWriter::open(&journal_path).unwrap();
    writer.append_alloc(id, &bytes).unwrap();
    writer.flush().unwrap();
    drop(writer);

    // Flip a bit inside the payload (header is 12 bytes, then record).
    let mut file_bytes = std::fs::read(&journal_path).unwrap();
    // Header is 12 bytes. Record starts at 12. Flip a byte deep in it.
    let target = 12 + 20;
    file_bytes[target] ^= 0x10;
    std::fs::write(&journal_path, &file_bytes).unwrap();

    // Corrupt record → treated as EOF, zero ops applied.
    let mut dest = test_arena();
    let reader = JournalReader::open(&journal_path).unwrap();
    let count = replay_into(&mut dest, reader).unwrap();
    assert_eq!(count, 0);
    assert!(!dest.contains(id));
}

#[test]
fn journal_rejects_wrong_magic() {
    let dir = tempdir().unwrap();
    let journal_path = dir.path().join("badmagic.journal");

    // Write garbage into the header.
    std::fs::write(&journal_path, b"NOTAJRNL\x00\x00\x00\x00").unwrap();

    let result = JournalReader::open(&journal_path);
    assert!(
        matches!(result, Err(ArenaError::CorruptJournal { .. })),
        "expected CorruptJournal, got {:?}",
        result
    );
}

// ============================================================================
// Persistence: combined checkpoint + journal recovery
// ============================================================================

#[test]
fn full_recovery_from_checkpoint_plus_journal() {
    // Simulate a realistic workload:
    // 1. Start fresh, alloc some chunks
    // 2. Take a checkpoint
    // 3. Do more allocs and frees (journaled)
    // 4. "Crash" — drop everything
    // 5. Recover: read checkpoint + replay journal
    // 6. Verify final state matches what we had before the crash

    let dir = tempdir().unwrap();
    let ckpt_path = dir.path().join("full.ckpt");
    let jrnl_path = dir.path().join("full.journal");

    // Phase 1: initial state.
    let mut arena = test_arena();
    let id_checkpoint = arena
        .alloc_chunk(TierKind::Hot, b"in-checkpoint".to_vec())
        .unwrap();
    write_checkpoint(&arena, &ckpt_path).unwrap();

    // Phase 2: post-checkpoint ops logged to journal.
    let mut journal = JournalWriter::open(&jrnl_path).unwrap();
    let id_later = arena
        .alloc_chunk(TierKind::Warm, b"after-checkpoint".to_vec())
        .unwrap();
    let later_bytes = arena.get_chunk(id_later).unwrap().serialize();
    journal.append_alloc(id_later, &later_bytes).unwrap();

    let id_transient = arena
        .alloc_chunk(TierKind::Blob, b"will-be-freed".to_vec())
        .unwrap();
    let transient_bytes = arena.get_chunk(id_transient).unwrap().serialize();
    journal.append_alloc(id_transient, &transient_bytes).unwrap();
    journal.append_free(id_transient).unwrap();
    journal.flush().unwrap();
    drop(journal);

    // Phase 3: "crash" — drop the in-memory arena.
    let crashed_next_id = arena.next_chunk_id();
    drop(arena);

    // Phase 4: recover from checkpoint, then replay journal.
    let mut recovered = read_checkpoint(ArenaConfig::test(), &ckpt_path).unwrap();
    let reader = JournalReader::open(&jrnl_path).unwrap();
    replay_into(&mut recovered, reader).unwrap();

    // Phase 5: verify final state.
    // Should have id_checkpoint and id_later alive, id_transient freed.
    assert!(recovered.contains(id_checkpoint));
    assert!(recovered.contains(id_later));
    assert!(!recovered.contains(id_transient));

    let chk = recovered.get_chunk(id_checkpoint).unwrap();
    assert_eq!(chk.payload(), b"in-checkpoint");
    let later = recovered.get_chunk(id_later).unwrap();
    assert_eq!(later.payload(), b"after-checkpoint");

    // next_chunk_id should be at least where we left off, so future
    // allocs don't collide with recovered ids.
    assert!(recovered.next_chunk_id() >= crashed_next_id);
}

#[test]
fn recovery_without_journal_is_still_valid() {
    let dir = tempdir().unwrap();
    let ckpt_path = dir.path().join("nojournal.ckpt");

    let mut arena = test_arena();
    let id = arena
        .alloc_chunk(TierKind::Hot, b"lonely".to_vec())
        .unwrap();
    write_checkpoint(&arena, &ckpt_path).unwrap();
    drop(arena);

    // No journal file at all.
    let recovered = read_checkpoint(ArenaConfig::test(), &ckpt_path).unwrap();
    assert!(recovered.contains(id));
    let chunk = recovered.get_chunk(id).unwrap();
    assert_eq!(chunk.payload(), b"lonely");
}

#[test]
fn apply_alloc_is_idempotent() {
    let mut arena = test_arena();
    let original = arena
        .alloc_chunk(TierKind::Hot, b"original".to_vec())
        .unwrap();
    let chunk_bytes = arena.get_chunk(original).unwrap().serialize();

    // Applying an alloc for an already-existing id should be a no-op.
    arena.apply_alloc(original, &chunk_bytes).unwrap();
    assert_eq!(arena.stats().allocated_slots, 1);
}

#[test]
fn apply_free_is_idempotent_for_missing() {
    let mut arena = test_arena();
    // Freeing a non-existent id should not error.
    arena.apply_free(ChunkId::new(9999)).unwrap();
    assert_eq!(arena.stats().allocated_slots, 0);
}

// ============================================================================
// M6: mmap-backed arena tests
// ============================================================================

#[test]
fn mmap_arena_creates_file_of_correct_size() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("mmap-size.bin");

    let arena = Arena::new_mmap_file(ArenaConfig::test(), 4, &path)
        .expect("mmap arena creation");
    assert_eq!(arena.num_slots(), 4);

    let metadata = std::fs::metadata(&path).unwrap();
    // 4 slots × 4 KiB = 16 KiB
    assert_eq!(metadata.len(), 4 * 4 * 1024);
}

#[test]
fn mmap_arena_alloc_get_roundtrip() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("mmap-roundtrip.bin");

    let mut arena = Arena::new_mmap_file(ArenaConfig::test(), 4, &path).unwrap();
    let id = arena
        .alloc_chunk(TierKind::Warm, b"persistent ram".to_vec())
        .unwrap();
    let chunk = arena.get_chunk(id).unwrap();
    assert_eq!(chunk.payload(), b"persistent ram");
    assert_eq!(chunk.header().tier, TierKind::Warm);
}

#[test]
fn mmap_arena_supports_all_tier_kinds() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("mmap-tiers.bin");

    let mut arena = Arena::new_mmap_file(ArenaConfig::test(), 5, &path).unwrap();
    for tier in [
        TierKind::Hot,
        TierKind::Warm,
        TierKind::Vector,
        TierKind::Blob,
        TierKind::Resident,
    ] {
        let id = arena
            .alloc_chunk(tier, vec![tier.as_u8(); 64])
            .unwrap();
        let chunk = arena.get_chunk(id).unwrap();
        assert_eq!(chunk.header().tier, tier);
        assert_eq!(chunk.payload()[0], tier.as_u8());
    }
    assert_eq!(arena.stats().allocated_slots, 5);
}

#[test]
fn mmap_arena_fills_and_empties_correctly() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("mmap-fill.bin");

    let mut arena = Arena::new_mmap_file(ArenaConfig::test(), 4, &path).unwrap();
    let ids: Vec<ChunkId> = (0..4)
        .map(|i| arena.alloc_chunk(TierKind::Hot, vec![i as u8; 16]).unwrap())
        .collect();
    assert_eq!(arena.stats().free_slots, 0);
    assert!(arena.alloc_chunk(TierKind::Hot, vec![0u8; 16]).is_err());

    for id in ids {
        arena.free_chunk(id).unwrap();
    }
    assert_eq!(arena.stats().free_slots, 4);
}

#[test]
fn mmap_arena_persists_bytes_through_remount_via_checkpoint() {
    // Verify that:
    // 1. mmap-backed arena writes reach the backing file
    // 2. We can checkpoint and restore into a new mmap arena
    let dir = tempdir().unwrap();
    let mmap_path = dir.path().join("persist-mmap.bin");
    let ckpt_path = dir.path().join("persist-mmap.ckpt");

    let expected_payload = b"survives across remount".to_vec();
    let id = {
        let mut arena = Arena::new_mmap_file(ArenaConfig::test(), 4, &mmap_path).unwrap();
        let id = arena
            .alloc_chunk(TierKind::Resident, expected_payload.clone())
            .unwrap();
        // Flush mmap writes to disk before checkpoint.
        arena.flush_mmap().unwrap();
        crate::memory_arena::persistence::write_checkpoint(&arena, &ckpt_path).unwrap();
        id
    };

    // Remount — new mmap-backed arena from the same file + checkpoint.
    let restored = crate::memory_arena::persistence::read_checkpoint(
        ArenaConfig::test(),
        &ckpt_path,
    )
    .unwrap();
    let chunk = restored.get_chunk(id).unwrap();
    assert_eq!(chunk.payload(), expected_payload.as_slice());
    assert_eq!(chunk.header().tier, TierKind::Resident);
}

#[test]
fn mmap_flush_is_noop_for_heap_arena() {
    // flush_mmap on a heap arena should succeed without side effects.
    let arena = test_arena();
    arena.flush_mmap().unwrap();
    assert_eq!(arena.stats().allocated_slots, 0);
}

#[test]
fn mmap_arena_checkpoint_tamper_detection_still_works() {
    // Sanity: mmap backing doesn't break the existing checksum path.
    let dir = tempdir().unwrap();
    let mmap_path = dir.path().join("tamper.bin");
    let ckpt_path = dir.path().join("tamper.ckpt");

    let mut arena = Arena::new_mmap_file(ArenaConfig::test(), 4, &mmap_path).unwrap();
    arena
        .alloc_chunk(TierKind::Blob, b"original".to_vec())
        .unwrap();
    arena.flush_mmap().unwrap();
    crate::memory_arena::persistence::write_checkpoint(&arena, &ckpt_path).unwrap();

    // Tamper with the checkpoint file.
    let mut bytes = std::fs::read(&ckpt_path).unwrap();
    let mid = bytes.len() / 2;
    bytes[mid] ^= 0x01;
    std::fs::write(&ckpt_path, &bytes).unwrap();

    let result =
        crate::memory_arena::persistence::read_checkpoint(ArenaConfig::test(), &ckpt_path);
    assert!(
        matches!(result, Err(ArenaError::CorruptCheckpoint { .. })),
        "expected CorruptCheckpoint for tampered file, got {:?}",
        result
    );
}

// ============================================================================
// M8 — Sparse checkpoint v2 tests
// ============================================================================

#[test]
fn m8_sparse_checkpoint_is_smaller_than_dense_for_lightly_used_arena() {
    // A lightly-used arena (one tiny chunk in a 4-slot × 4 KiB arena) should
    // produce a checkpoint dramatically smaller than the old dense v1 format,
    // which wrote all 16 KiB of storage unconditionally.
    let dir = tempdir().unwrap();
    let path = dir.path().join("sparse-light.ckpt");

    let mut arena = test_arena();
    arena
        .alloc_chunk(TierKind::Blob, b"tiny".to_vec())
        .unwrap();

    write_checkpoint(&arena, &path).expect("write v2 sparse checkpoint");
    let size = std::fs::metadata(&path).unwrap().len() as usize;

    // Dense v1 lower bound: header (44) + dir (16*1) + full storage (4*4096)
    //                     + trailing checksum (8) = 16452 bytes.
    const DENSE_LOWER_BOUND: usize = 44 + 16 + (4 * 4096) + 8;

    // Sparse v2 upper bound (one chunk, 4-byte payload):
    //   header (44) + sparse dir (24*1) + (HEADER_SIZE + 4) + checksum (8)
    let sparse_upper_bound = 44 + 24 + (HEADER_SIZE + 4) + 8;

    assert!(
        size < DENSE_LOWER_BOUND,
        "sparse checkpoint {} bytes should beat dense lower bound {}",
        size,
        DENSE_LOWER_BOUND
    );
    assert!(
        size <= sparse_upper_bound,
        "sparse checkpoint {} bytes exceeds expected upper bound {}",
        size,
        sparse_upper_bound
    );
}

#[test]
fn m8_sparse_checkpoint_declares_version_2() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("version.ckpt");
    let arena = test_arena();
    write_checkpoint(&arena, &path).unwrap();

    let bytes = std::fs::read(&path).unwrap();
    // Version is a u16 LE at offset 8.
    let version = u16::from_le_bytes([bytes[8], bytes[9]]);
    assert_eq!(version, 2, "expected sparse v2 format");
}

#[test]
fn m8_sparse_checkpoint_roundtrips_many_chunks_with_varied_sizes() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("varied.ckpt");

    // Use a 2 KiB chunk arena so we can fit several varied-size chunks.
    let cfg = ArenaConfig {
        chunk_size: 2 * 1024,
        min_chunk_size: 64,
        max_chunk_size: 8 * 1024,
        ..ArenaConfig::default()
    };
    let mut arena = Arena::new(cfg.clone(), 8).unwrap();

    let id1 = arena.alloc_chunk(TierKind::Hot, vec![0x11; 8]).unwrap();
    let id2 = arena
        .alloc_chunk(TierKind::Warm, vec![0x22; 200])
        .unwrap();
    let id3 = arena
        .alloc_chunk(TierKind::Vector, vec![0x33; 1024])
        .unwrap();
    let id4 = arena.alloc_chunk(TierKind::Blob, vec![]).unwrap();

    // Free one and re-allocate to exercise non-contiguous slot usage.
    arena.free_chunk(id2).unwrap();
    let id5 = arena
        .alloc_chunk(TierKind::Resident, vec![0x55; 128])
        .unwrap();

    write_checkpoint(&arena, &path).unwrap();
    let restored = read_checkpoint(cfg, &path).unwrap();

    assert_eq!(restored.stats().allocated_slots, 4);
    assert_eq!(restored.get_chunk(id1).unwrap().payload(), vec![0x11; 8]);
    assert_eq!(
        restored.get_chunk(id3).unwrap().payload(),
        vec![0x33; 1024]
    );
    assert_eq!(restored.get_chunk(id4).unwrap().payload(), Vec::<u8>::new());
    assert_eq!(restored.get_chunk(id5).unwrap().payload(), vec![0x55; 128]);
    // id2 was freed so it should not be recoverable.
    assert!(restored.get_chunk(id2).is_err());
}

#[test]
fn m8_sparse_checkpoint_rejects_tampered_chunk_bytes() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("sparse-tamper.ckpt");
    let mut arena = test_arena();
    arena
        .alloc_chunk(TierKind::Blob, b"original".to_vec())
        .unwrap();
    write_checkpoint(&arena, &path).unwrap();

    // Flip a byte in the payload region (after header + sparse dir, before
    // the trailing 8-byte checksum).
    let mut bytes = std::fs::read(&path).unwrap();
    // Header 44 + 1 dir entry * 24 = 68. Flip something deeper in.
    let target = 68 + HEADER_SIZE + 2;
    bytes[target] ^= 0x55;
    std::fs::write(&path, &bytes).unwrap();

    let result = read_checkpoint(ArenaConfig::test(), &path);
    assert!(
        matches!(result, Err(ArenaError::CorruptCheckpoint { .. })),
        "expected CorruptCheckpoint for tampered sparse checkpoint, got {:?}",
        result
    );
}

#[test]
fn m8_sparse_checkpoint_checkpoint_then_free_then_checkpoint_shrinks() {
    // Sparse format should reflect freed chunks by shrinking the next
    // checkpoint (not by carrying dead bytes forward).
    let dir = tempdir().unwrap();
    let path = dir.path().join("shrink.ckpt");
    let mut arena = test_arena();
    let ids: Vec<_> = (0..4)
        .map(|i| {
            arena
                .alloc_chunk(TierKind::Warm, vec![i as u8; 1024])
                .unwrap()
        })
        .collect();

    write_checkpoint(&arena, &path).unwrap();
    let full_size = std::fs::metadata(&path).unwrap().len();

    // Free 3 of the 4 chunks and re-checkpoint.
    for &id in &ids[..3] {
        arena.free_chunk(id).unwrap();
    }
    write_checkpoint(&arena, &path).unwrap();
    let trimmed_size = std::fs::metadata(&path).unwrap().len();

    assert!(
        trimmed_size < full_size,
        "expected sparse checkpoint to shrink after frees: {} -> {}",
        full_size,
        trimmed_size
    );

    // And it should still restore correctly with the one remaining chunk.
    let restored = read_checkpoint(ArenaConfig::test(), &path).unwrap();
    assert_eq!(restored.stats().allocated_slots, 1);
    assert_eq!(restored.get_chunk(ids[3]).unwrap().payload(), vec![3u8; 1024]);
}

#[test]
fn m8_reader_still_accepts_legacy_v1_dense_checkpoint() {
    // Hand-craft a v1 (dense) checkpoint byte stream and verify the reader
    // still accepts it. This guards the backward-compat path promised by
    // the v1/v2 dispatch in read_checkpoint.
    use xxhash_rust::xxh3::xxh3_64;
    let dir = tempdir().unwrap();
    let path = dir.path().join("legacy-v1.ckpt");

    // Build a canonical arena with one chunk so we know what bytes to emit.
    let mut arena = test_arena();
    let id = arena.alloc_chunk(TierKind::Warm, b"legacy".to_vec()).unwrap();
    let expected_slot = {
        // Directory has one entry — its slot number is what we need.
        let entries: Vec<_> = arena
            .directory_entries()
            .collect::<Vec<_>>()
            .into_iter()
            .collect();
        entries[0].1
    };

    // v1 layout:
    //   magic(8) version(2)=1 reserved(2) next_chunk_id(8) chunk_size(8)
    //   num_slots(8) num_allocated(8) dir[16*1] storage[4*4096] checksum(8)
    let chunk_size: u64 = 4 * 1024;
    let num_slots: u64 = 4;
    let num_allocated: u64 = 1;
    let next_chunk_id: u64 = arena.next_chunk_id();

    let mut buf: Vec<u8> = Vec::new();
    buf.extend_from_slice(b"GSDCKPT\0");
    buf.extend_from_slice(&1u16.to_le_bytes()); // version = 1 (dense)
    buf.extend_from_slice(&0u16.to_le_bytes()); // reserved
    buf.extend_from_slice(&next_chunk_id.to_le_bytes());
    buf.extend_from_slice(&chunk_size.to_le_bytes());
    buf.extend_from_slice(&num_slots.to_le_bytes());
    buf.extend_from_slice(&num_allocated.to_le_bytes());
    // Directory: (id, slot)
    buf.extend_from_slice(&id.as_u64().to_le_bytes());
    buf.extend_from_slice(&(expected_slot as u64).to_le_bytes());
    // Dense storage: copy from the live arena's storage.
    buf.extend_from_slice(arena.storage());
    let sum = xxh3_64(&buf);
    buf.extend_from_slice(&sum.to_le_bytes());
    std::fs::write(&path, &buf).unwrap();

    let restored = read_checkpoint(ArenaConfig::test(), &path)
        .expect("legacy v1 checkpoint must still be readable");
    assert_eq!(restored.stats().allocated_slots, 1);
    assert_eq!(restored.get_chunk(id).unwrap().payload(), b"legacy");
}

// ============================================================================
// M9 — Streaming xxh3 equivalence tests
// ============================================================================

#[test]
fn m9_streaming_chunk_checksum_matches_oneshot_xxh3() {
    // Lock the invariant that `Chunk::compute_checksum` (now streaming)
    // produces the exact same 64-bit result as a one-shot xxh3_64 over
    // header[0..CHECKSUM_OFFSET] || payload. If this ever regresses every
    // existing checkpoint on disk silently breaks.
    //
    // We derive the expected one-shot hash by taking the finalized chunk's
    // serialized bytes, zeroing the checksum slot, and hashing header prefix
    // + payload in a single buffer — matching the exact bytes the streaming
    // path now feeds to Xxh3Default.
    use xxhash_rust::xxh3::xxh3_64;
    const CHECKSUM_OFFSET: usize = 56;

    for payload_len in [0usize, 1, 63, 64, 65, 128, 1024, 4096 - HEADER_SIZE] {
        let payload: Vec<u8> = (0..payload_len).map(|i| (i as u8).wrapping_mul(13)).collect();
        let mut chunk = Chunk::new(ChunkId::new(42), TierKind::Warm, payload.clone());
        chunk.finalize();

        // Serialize the finalized chunk and zero the checksum slot in the
        // serialized header — gives us the exact prefix the hasher saw.
        let mut serialized = chunk.serialize();
        serialized[CHECKSUM_OFFSET..CHECKSUM_OFFSET + 8].fill(0);

        let mut expected_input = Vec::with_capacity(CHECKSUM_OFFSET + payload_len);
        expected_input.extend_from_slice(&serialized[..CHECKSUM_OFFSET]);
        expected_input.extend_from_slice(&payload);
        let expected = xxh3_64(&expected_input);

        assert_eq!(
            chunk.header().checksum,
            expected,
            "streaming chunk checksum diverged from one-shot xxh3_64 at payload_len={}",
            payload_len
        );
    }
}

#[test]
fn m9_chunk_alloc_path_does_not_leak_scratch_buffers() {
    // Indirect test: many allocations of small chunks should not OOM or
    // regress the existing roundtrip semantics. The old path allocated
    // (HEADER_SIZE + payload) bytes per alloc for the checksum scratch Vec;
    // the new path streams without allocation.
    //
    // We can't assert "no allocation happened" from stable Rust, but we can
    // verify that allocations of varied sizes still roundtrip through serialize
    // and deserialize with correct checksums — which is what the streaming
    // path must preserve.
    for n in [1usize, 100, 1000] {
        for payload_len in [16usize, 200, 1024] {
            let mut arena = test_arena();
            // The 4x4 KiB test arena can only fit 4 chunks; cap accordingly.
            let count = n.min(4);
            for i in 0..count {
                let payload = vec![(i as u8).wrapping_add(1); payload_len];
                let id = arena.alloc_chunk(TierKind::Blob, payload.clone()).unwrap();
                let back = arena.get_chunk(id).unwrap();
                assert_eq!(back.payload(), payload.as_slice());
            }
        }
    }
}

#[test]
fn m9_journal_streaming_checksum_matches_replay() {
    // Streaming journal writes must still replay correctly. We write a
    // sequence of ALLOC + FREE records and read them back via JournalReader
    // (which uses the one-shot xxh3_64 over [len_buf || payload]).
    let dir = tempdir().unwrap();
    let path = dir.path().join("m9-journal");

    let mut arena = test_arena();
    let ids: Vec<_> = (0..3)
        .map(|i| {
            arena
                .alloc_chunk(TierKind::Warm, vec![(i as u8) + 1; 64])
                .unwrap()
        })
        .collect();

    {
        let mut w = JournalWriter::open(&path).unwrap();
        for id in &ids {
            let chunk = arena.get_chunk(*id).unwrap();
            w.append_alloc(*id, &chunk.serialize()).unwrap();
        }
        w.append_free(ids[1]).unwrap();
        w.flush().unwrap();
    }

    // Reader must successfully walk every record — if streaming xxh3 didn't
    // match one-shot, next_op would return CorruptJournal or stop early.
    let mut r = JournalReader::open(&path).unwrap();
    let mut seen = 0;
    while let Some(_op) = r.next_op().unwrap() {
        seen += 1;
    }
    assert_eq!(seen, 4, "expected 3 ALLOCs + 1 FREE in journal");
}

// ============================================================================
// M11 — Zero-copy alloc path + narrow-zero free tests
// ============================================================================

#[test]
fn m11_alloc_path_produces_valid_checksum() {
    // The new alloc path writes header + payload + checksum directly into
    // slot storage with no intermediate Vec. Roundtripping through
    // get_chunk must still validate the streaming checksum.
    let mut arena = test_arena();
    for payload_len in [0usize, 1, 17, 200, 1024, 4096 - HEADER_SIZE] {
        let payload: Vec<u8> = (0..payload_len).map(|i| (i as u8).wrapping_mul(7)).collect();
        let id = arena.alloc_chunk(TierKind::Blob, payload.clone()).unwrap();
        let got = arena.get_chunk(id).unwrap();
        assert_eq!(got.payload(), payload.as_slice(), "payload mismatch at len={}", payload_len);
        arena.free_chunk(id).unwrap();
    }
}

#[test]
fn m11_shrinking_realloc_cycle_does_not_leak_stale_bytes() {
    // The tricky invariant: after an alloc(large) + free + alloc(small)
    // cycle, the tail of the slot must still read as zero to downstream
    // code that might inspect raw bytes. We free's narrow-zero only clears
    // HEADER + valid_payload, so the "tail beyond old_payload" remains
    // whatever it was before — which should be zero thanks to the
    // fresh-arena invariant.
    let mut arena = test_arena(); // 4 KiB slots, 4 slots
    let large = vec![0xAAu8; 3000];
    let id1 = arena.alloc_chunk(TierKind::Warm, large).unwrap();
    arena.free_chunk(id1).unwrap();

    // Reallocate a smaller chunk into the same slot. The tail [100..3000]
    // was zeroed by free_chunk (since the large payload was the valid
    // region); bytes [3000..4096-HEADER] were never written, still zero.
    let small = vec![0xBBu8; 100];
    let id2 = arena.alloc_chunk(TierKind::Warm, small.clone()).unwrap();

    let got = arena.get_chunk(id2).unwrap();
    assert_eq!(got.payload(), small.as_slice());

    // Directly inspect the raw storage for the slot to confirm the tail
    // is all zero (not leaking old payload bytes). Use the `storage`
    // pub(crate) accessor available in the tests.rs module.
    let slot = arena.directory_entries().find(|(id, _)| *id == id2).unwrap().1;
    let slot_size = arena.config().chunk_size as usize;
    let start = slot * slot_size;
    let payload_start = start + HEADER_SIZE;
    let payload_end = payload_start + small.len();
    let tail_end = start + slot_size;
    let tail = &arena.storage()[payload_end..tail_end];
    assert!(
        tail.iter().all(|&b| b == 0),
        "slot tail should be all zero after shrinking realloc, found non-zero byte"
    );
}

#[test]
fn m11_free_only_zeros_valid_region() {
    // Alloc a small chunk into a fresh arena, record the tail state,
    // then free and verify the tail is unchanged (not re-zeroed, but
    // also not poisoned).
    let mut arena = test_arena(); // 4 KiB slots
    let payload = vec![0xCCu8; 64];
    let id = arena.alloc_chunk(TierKind::Blob, payload).unwrap();

    let slot = arena.directory_entries().find(|(i, _)| *i == id).unwrap().1;
    let slot_size = arena.config().chunk_size as usize;
    let start = slot * slot_size;
    let valid_end = start + HEADER_SIZE + 64;
    let tail_snapshot: Vec<u8> = arena.storage()[valid_end..start + slot_size].to_vec();

    arena.free_chunk(id).unwrap();

    // Valid region must now be zero.
    let valid_after: Vec<u8> = arena.storage()[start..valid_end].to_vec();
    assert!(
        valid_after.iter().all(|&b| b == 0),
        "valid region should be zeroed on free"
    );
    // Tail must be identical to the pre-free snapshot (we didn't touch it).
    let tail_after: &[u8] = &arena.storage()[valid_end..start + slot_size];
    assert_eq!(
        tail_after, tail_snapshot.as_slice(),
        "free should leave tail untouched"
    );
}

// =============================================================================
// memory-arena-m1 Plan 01 — TierPool / TierPolicy tests
// =============================================================================

#[cfg(test)]
mod pool_tests {
    use crate::memory_arena::error::ArenaError;
    use crate::memory_arena::pool::{EvictionKind, TierPolicy, TierPool};
    use crate::memory_arena::types::{ArenaConfig, TierKind};

    #[test]
    fn tier_policy_default_for_all_variants_has_nonzero_max_chunks() {
        for tier in [
            TierKind::Hot,
            TierKind::Warm,
            TierKind::Vector,
            TierKind::Blob,
            TierKind::Resident,
        ] {
            let policy = TierPolicy::default_for(tier);
            assert!(
                policy.max_chunks > 0,
                "default_for({:?}) should have non-zero max_chunks",
                tier
            );
        }
    }

    #[test]
    fn arena_config_test_exposes_default_policies_for_all_tiers() {
        let config = ArenaConfig::test();
        for tier in [
            TierKind::Hot,
            TierKind::Warm,
            TierKind::Vector,
            TierKind::Blob,
            TierKind::Resident,
        ] {
            assert!(
                config.default_policies.contains_key(&tier),
                "ArenaConfig::test().default_policies missing {:?}",
                tier
            );
        }
    }

    #[test]
    fn tier_pool_new_and_accessors() {
        let pool = TierPool::new(
            TierKind::Warm,
            ArenaConfig::test(),
            4,
            TierPolicy::default_for(TierKind::Warm),
        )
        .expect("pool should construct");
        assert_eq!(pool.tier(), TierKind::Warm);
        assert_eq!(
            pool.policy().eviction,
            EvictionKind::Lru,
            "warm tier defaults to LRU"
        );
    }

    #[test]
    fn tier_pool_alloc_honors_max_chunks() {
        let policy = TierPolicy {
            max_chunks: 2,
            eviction: EvictionKind::Lru,
            promote_after_hits: 0,
            demote_after_idle_ns: 0,
        };
        let mut pool = TierPool::new(TierKind::Hot, ArenaConfig::test(), 8, policy)
            .expect("pool should construct");

        // First two allocs succeed.
        pool.alloc(vec![1u8; 64]).expect("alloc 1 should succeed");
        pool.alloc(vec![2u8; 64]).expect("alloc 2 should succeed");

        // Third alloc must fail with PoolFull.
        let err = pool.alloc(vec![3u8; 64]).expect_err("third alloc should fail");
        match err {
            ArenaError::PoolFull { tier, max_chunks } => {
                assert_eq!(tier, TierKind::Hot);
                assert_eq!(max_chunks, 2);
            }
            other => panic!("expected PoolFull, got {:?}", other),
        }
    }

    #[test]
    fn tier_policy_serde_roundtrip() {
        let policy = TierPolicy {
            max_chunks: 123,
            eviction: EvictionKind::Fifo,
            promote_after_hits: 7,
            demote_after_idle_ns: 999_000,
        };
        let json = serde_json::to_string(&policy).expect("serialize");
        let back: TierPolicy = serde_json::from_str(&json).expect("deserialize");
        assert_eq!(policy, back);
    }

    #[test]
    fn eviction_kind_serde_roundtrip() {
        for kind in [EvictionKind::Lru, EvictionKind::Fifo] {
            let json = serde_json::to_string(&kind).expect("serialize");
            let back: EvictionKind = serde_json::from_str(&json).expect("deserialize");
            assert_eq!(kind, back);
        }
    }
}

// =============================================================================
// memory-arena-m1 Plan 02 — List<T> + LruIndex tests
// =============================================================================

#[cfg(test)]
mod list_tests {
    use crate::memory_arena::list::{List, LruIndex};
    use crate::memory_arena::types::ChunkId;
    use std::collections::VecDeque;

    #[test]
    fn empty_list_has_no_head_tail_or_len() {
        let list: List<u32> = List::new();
        assert_eq!(list.len(), 0);
        assert!(list.is_empty());
        assert!(list.head().is_none());
        assert!(list.tail().is_none());
    }

    #[test]
    fn push_front_empty_sets_head_equals_tail() {
        let mut list: List<u32> = List::new();
        let idx = list.push_front(42);
        assert_eq!(list.len(), 1);
        assert_eq!(list.head(), Some(idx));
        assert_eq!(list.tail(), Some(idx));
        assert_eq!(list.get(idx), Some(&42));
    }

    #[test]
    fn push_front_then_push_back_iterates_head_to_tail() {
        let mut list: List<u32> = List::new();
        let front = list.push_front(10);
        let back = list.push_back(20);
        let values: Vec<u32> = list.iter_front_to_back().map(|(_, v)| *v).collect();
        assert_eq!(values, vec![10, 20]);
        assert_eq!(list.head(), Some(front));
        assert_eq!(list.tail(), Some(back));
    }

    #[test]
    fn pop_front_on_empty_returns_none() {
        let mut list: List<u32> = List::new();
        assert!(list.pop_front().is_none());
        assert!(list.pop_back().is_none());
    }

    #[test]
    fn push_front_triple_pop_back_order() {
        let mut list: List<u32> = List::new();
        list.push_front(1); // front = 1, tail = 1
        list.push_front(2); // front = 2, tail = 1
        list.push_front(3); // front = 3, tail = 1
        assert_eq!(list.pop_back(), Some(1));
        assert_eq!(list.pop_back(), Some(2));
        assert_eq!(list.pop_back(), Some(3));
        assert!(list.is_empty());
    }

    #[test]
    fn unlink_removes_node_and_frees_slot() {
        let mut list: List<u32> = List::new();
        let a = list.push_front(1);
        let b = list.push_front(2);
        let c = list.push_front(3);
        // order: c, b, a
        assert_eq!(list.unlink(b), Some(2));
        assert_eq!(list.len(), 2);
        let values: Vec<u32> = list.iter_front_to_back().map(|(_, v)| *v).collect();
        assert_eq!(values, vec![3, 1]);
        // The freed slot should be reused by the next push — peek at nodes len via
        // a push and check that len tracks correctly without the capacity leaking.
        let _d = list.push_front(4);
        assert_eq!(list.len(), 3);
        // Silence unused warnings.
        let _ = (a, c);
    }

    #[test]
    fn move_to_front_preserves_len_and_reorders() {
        let mut list: List<u32> = List::new();
        let a = list.push_back(1);
        let b = list.push_back(2);
        let c = list.push_back(3);
        // order: 1, 2, 3
        list.move_to_front(c);
        // order: 3, 1, 2
        assert_eq!(list.len(), 3);
        assert_eq!(list.head(), Some(c));
        let values: Vec<u32> = list.iter_front_to_back().map(|(_, v)| *v).collect();
        assert_eq!(values, vec![3, 1, 2]);
        // Moving the head to front is a no-op.
        list.move_to_front(c);
        let values: Vec<u32> = list.iter_front_to_back().map(|(_, v)| *v).collect();
        assert_eq!(values, vec![3, 1, 2]);
        // Moving the tail to front.
        list.move_to_front(b);
        let values: Vec<u32> = list.iter_front_to_back().map(|(_, v)| *v).collect();
        assert_eq!(values, vec![2, 3, 1]);
        let _ = a;
    }

    #[test]
    fn lru_index_insert_then_touch_leaves_id_at_front() {
        let mut lru = LruIndex::new();
        assert!(lru.oldest().is_none());
        lru.insert(ChunkId::new(1));
        lru.insert(ChunkId::new(2));
        lru.insert(ChunkId::new(3));
        // insert pushes to front, so order front-to-back: 3, 2, 1. Oldest = 1.
        assert_eq!(lru.oldest(), Some(ChunkId::new(1)));
        assert!(lru.touch(ChunkId::new(1)));
        // Now order: 1, 3, 2. Oldest = 2.
        assert_eq!(lru.oldest(), Some(ChunkId::new(2)));
    }

    #[test]
    fn lru_index_remove_reports_and_absent_touch_returns_false() {
        let mut lru = LruIndex::new();
        lru.insert(ChunkId::new(1));
        assert!(!lru.remove(ChunkId::new(99)));
        assert!(lru.remove(ChunkId::new(1)));
        assert!(lru.oldest().is_none());
        assert!(!lru.touch(ChunkId::new(1))); // absent → false
    }

    #[test]
    fn lru_index_double_insert_is_touch() {
        let mut lru = LruIndex::new();
        lru.insert(ChunkId::new(1));
        lru.insert(ChunkId::new(2));
        lru.insert(ChunkId::new(3));
        // Re-insert 1: should become the new front without duplicating.
        lru.insert(ChunkId::new(1));
        assert_eq!(lru.len(), 3);
        // Oldest is now 2 (1 was re-sent to front).
        assert_eq!(lru.oldest(), Some(ChunkId::new(2)));
    }

    // Deterministic linear-congruential generator — avoids pulling in `rand`.
    struct Lcg(u64);
    impl Lcg {
        fn new(seed: u64) -> Self {
            Self(seed)
        }
        fn next(&mut self) -> u64 {
            // Numerical Recipes LCG constants.
            self.0 = self
                .0
                .wrapping_mul(6364136223846793005)
                .wrapping_add(1442695040888963407);
            self.0
        }
    }

    /// Naive reference implementation of the LRU: VecDeque where touch/remove
    /// do a linear scan. Property test drives both this and `LruIndex` through
    /// the same 10k randomized op stream and asserts `oldest()` matches after
    /// every op.
    #[test]
    fn lru_index_property_matches_naive_reference_10k_ops() {
        let mut lru = LruIndex::new();
        let mut reference: VecDeque<ChunkId> = VecDeque::new();
        let mut rng = Lcg::new(0xDEADBEEF_CAFE_1234);

        // Keep a small ID pool so inserts/removes actually hit each other.
        const ID_POOL: u64 = 32;
        const OPS: usize = 10_000;

        for _ in 0..OPS {
            let op = rng.next() % 4;
            let id = ChunkId::new(rng.next() % ID_POOL);

            match op {
                0 => {
                    // insert
                    lru.insert(id);
                    // reference: remove any existing, push to front
                    reference.retain(|x| *x != id);
                    reference.push_front(id);
                }
                1 => {
                    // touch
                    let lru_found = lru.touch(id);
                    let pos = reference.iter().position(|x| *x == id);
                    let ref_found = pos.is_some();
                    assert_eq!(lru_found, ref_found, "touch presence divergence");
                    if let Some(p) = pos {
                        reference.remove(p);
                        reference.push_front(id);
                    }
                }
                2 => {
                    // remove
                    let lru_removed = lru.remove(id);
                    let pos = reference.iter().position(|x| *x == id);
                    let ref_removed = pos.is_some();
                    assert_eq!(lru_removed, ref_removed, "remove presence divergence");
                    if let Some(p) = pos {
                        reference.remove(p);
                    }
                }
                _ => {
                    // noop query
                    let _ = lru.contains(id);
                }
            }

            // Invariant check: oldest and len must match the reference.
            assert_eq!(
                lru.len(),
                reference.len(),
                "len divergence after op {}",
                op
            );
            let expected_oldest = reference.back().copied();
            assert_eq!(
                lru.oldest(),
                expected_oldest,
                "oldest() divergence after op {}",
                op
            );
        }
    }
}

// =============================================================================
// memory-arena-m1 Plan 03 — Arena LRU integration tests
// =============================================================================

#[cfg(test)]
mod arena_lru_tests {
    use crate::memory_arena::arena::Arena;
    use crate::memory_arena::types::{ArenaConfig, TierKind};

    #[test]
    fn lru_oldest_empty_arena_is_none() {
        let arena = Arena::new(ArenaConfig::test(), 4).unwrap();
        assert!(arena.lru_oldest().is_none());
    }

    #[test]
    fn lru_insertion_order_tracks_alloc_and_free() {
        let mut arena = Arena::new(ArenaConfig::test(), 8).unwrap();
        let a = arena.alloc_chunk(TierKind::Hot, vec![1u8; 64]).unwrap();
        let b = arena.alloc_chunk(TierKind::Hot, vec![2u8; 64]).unwrap();
        let _c = arena.alloc_chunk(TierKind::Hot, vec![3u8; 64]).unwrap();
        assert_eq!(arena.lru_oldest(), Some(a));
        arena.free_chunk(a).unwrap();
        assert_eq!(arena.lru_oldest(), Some(b));
    }

    #[test]
    fn lru_touch_reorders_oldest() {
        let mut arena = Arena::new(ArenaConfig::test(), 8).unwrap();
        let a = arena.alloc_chunk(TierKind::Warm, vec![1u8; 64]).unwrap();
        let b = arena.alloc_chunk(TierKind::Warm, vec![2u8; 64]).unwrap();
        let _c = arena.alloc_chunk(TierKind::Warm, vec![3u8; 64]).unwrap();
        assert_eq!(arena.lru_oldest(), Some(a));
        arena.touch_chunk(a).unwrap();
        // After touching a, b is now the oldest.
        assert_eq!(arena.lru_oldest(), Some(b));
    }

    #[test]
    fn apply_alloc_and_apply_free_update_lru() {
        // Build a source arena with a chunk, serialize its bytes, then use
        // apply_alloc to replay into a target arena. The replay path must
        // update the LRU so downstream eviction sees the replayed chunk.
        let mut source = Arena::new(ArenaConfig::test(), 4).unwrap();
        let id = source
            .alloc_chunk(TierKind::Blob, vec![42u8; 100])
            .unwrap();
        let chunk = source.get_chunk(id).unwrap();
        let chunk_bytes = chunk.serialize();

        let mut target = Arena::new(ArenaConfig::test(), 4).unwrap();
        target.apply_alloc(id, &chunk_bytes).unwrap();
        assert_eq!(target.lru_oldest(), Some(id));

        // Now apply_free: the LRU must forget the id.
        target.apply_free(id).unwrap();
        assert!(target.lru_oldest().is_none());
    }

    #[test]
    fn lru_touch_stays_fast_sanity_check() {
        // Informational: this just confirms 10k touch_chunk calls don't
        // explode or deadlock. Real latency numbers come from Plan 07 benches.
        let mut arena = Arena::new(ArenaConfig::test(), 4).unwrap();
        let id = arena.alloc_chunk(TierKind::Hot, vec![1u8; 64]).unwrap();
        for _ in 0..10_000 {
            arena.touch_chunk(id).unwrap();
        }
        assert_eq!(arena.lru_oldest(), Some(id));
    }
}

// =============================================================================
// memory-arena-m1 Plan 04 — ArenaSet + manifest tests
// =============================================================================

#[cfg(test)]
mod arena_set_tests {
    use crate::memory_arena::error::ArenaError;
    use crate::memory_arena::pool::{
        ArenaSet, ArenaSetConfig, EvictionKind, PoolSpec, TierPolicy,
    };
    use crate::memory_arena::types::{ArenaConfig, ChunkId, TierKind};
    use tempfile::tempdir;

    fn small_policy(max: u32) -> TierPolicy {
        TierPolicy {
            max_chunks: max,
            eviction: EvictionKind::Lru,
            promote_after_hits: 0,
            demote_after_idle_ns: 0,
        }
    }

    fn pool_spec(tier: TierKind, max: u32) -> PoolSpec {
        // Use the ArenaConfig::test() sizes so every pool is tiny and
        // fits comfortably in RAM during unit tests.
        let cfg = ArenaConfig::test();
        PoolSpec {
            tier,
            chunk_size: cfg.chunk_size,
            num_slots: 8,
            policy: small_policy(max),
        }
    }

    #[test]
    fn arena_set_creates_backing_files_and_manifest() {
        let tmp = tempdir().unwrap();
        let config = ArenaSetConfig::new(tmp.path())
            .with_pool(pool_spec(TierKind::Hot, 0))
            .with_pool(pool_spec(TierKind::Warm, 0))
            .with_pool(pool_spec(TierKind::Blob, 0));
        let set = ArenaSet::create(config).expect("create arena set");
        // Manifest file exists.
        assert!(tmp.path().join("manifest.json").exists());
        // Per-tier arena files exist.
        assert!(tmp.path().join("hot.arena").exists());
        assert!(tmp.path().join("warm.arena").exists());
        assert!(tmp.path().join("blob.arena").exists());
        // Unconfigured tiers do NOT have arena files.
        assert!(!tmp.path().join("vector.arena").exists());
        assert!(!tmp.path().join("resident.arena").exists());
        drop(set);
    }

    #[test]
    fn arena_set_isolates_chunk_id_namespaces() {
        let tmp = tempdir().unwrap();
        let config = ArenaSetConfig::new(tmp.path())
            .with_pool(pool_spec(TierKind::Hot, 0))
            .with_pool(pool_spec(TierKind::Warm, 0));
        let mut set = ArenaSet::create(config).expect("create");

        let hot_id = set
            .pool_mut(TierKind::Hot)
            .unwrap()
            .alloc(vec![1u8; 32])
            .expect("hot alloc");
        let warm_id = set
            .pool_mut(TierKind::Warm)
            .unwrap()
            .alloc(vec![2u8; 32])
            .expect("warm alloc");

        // Per-pool monotonic counters — both return ChunkId(1).
        assert_eq!(hot_id, ChunkId::new(1));
        assert_eq!(warm_id, ChunkId::new(1));

        // But they live in separate arenas.
        assert!(set.pool(TierKind::Hot).unwrap().arena().contains(hot_id));
        assert!(set.pool(TierKind::Warm).unwrap().arena().contains(warm_id));
    }

    #[test]
    fn arena_set_manifest_roundtrips() {
        let tmp = tempdir().unwrap();
        let path = tmp.path().to_path_buf();
        let config = ArenaSetConfig::new(&path)
            .with_pool(pool_spec(TierKind::Hot, 8))
            .with_pool(pool_spec(TierKind::Warm, 16));
        {
            let set = ArenaSet::create(config).expect("create");
            drop(set);
        }
        let reopened = ArenaSet::open(&path).expect("open");
        let manifest = reopened.manifest();
        assert_eq!(manifest.pools.len(), 2);
        let hot_spec = manifest
            .pools
            .iter()
            .find(|p| p.tier == TierKind::Hot)
            .unwrap();
        assert_eq!(hot_spec.policy.max_chunks, 8);
        let warm_spec = manifest
            .pools
            .iter()
            .find(|p| p.tier == TierKind::Warm)
            .unwrap();
        assert_eq!(warm_spec.policy.max_chunks, 16);
    }

    #[test]
    fn arena_set_create_rejects_existing_manifest() {
        let tmp = tempdir().unwrap();
        let path = tmp.path().to_path_buf();
        let config1 = ArenaSetConfig::new(&path).with_pool(pool_spec(TierKind::Hot, 0));
        ArenaSet::create(config1).expect("first create");

        let config2 = ArenaSetConfig::new(&path).with_pool(pool_spec(TierKind::Hot, 0));
        let err = ArenaSet::create(config2).expect_err("second create must fail");
        assert!(
            matches!(err, ArenaError::AlreadyExists { .. }),
            "expected AlreadyExists, got {:?}",
            err
        );
    }

    #[test]
    fn arena_set_policy_enforcement_per_tier() {
        let tmp = tempdir().unwrap();
        let config = ArenaSetConfig::new(tmp.path())
            .with_pool(pool_spec(TierKind::Hot, 2))
            .with_pool(pool_spec(TierKind::Warm, 0));
        let mut set = ArenaSet::create(config).expect("create");

        // Hot: alloc 2, then third fails with PoolFull.
        set.pool_mut(TierKind::Hot)
            .unwrap()
            .alloc(vec![1u8; 32])
            .unwrap();
        set.pool_mut(TierKind::Hot)
            .unwrap()
            .alloc(vec![2u8; 32])
            .unwrap();
        let err = set
            .pool_mut(TierKind::Hot)
            .unwrap()
            .alloc(vec![3u8; 32])
            .expect_err("should be PoolFull");
        assert!(matches!(err, ArenaError::PoolFull { tier: TierKind::Hot, max_chunks: 2 }));

        // Warm still has room (max_chunks = 0 → unlimited).
        set.pool_mut(TierKind::Warm)
            .unwrap()
            .alloc(vec![4u8; 32])
            .expect("warm alloc should succeed");
    }

    #[test]
    fn arena_set_pool_accessor_none_for_unconfigured_tier() {
        let tmp = tempdir().unwrap();
        let config = ArenaSetConfig::new(tmp.path()).with_pool(pool_spec(TierKind::Hot, 0));
        let set = ArenaSet::create(config).expect("create");
        assert!(set.pool(TierKind::Hot).is_some());
        assert!(set.pool(TierKind::Warm).is_none());
        assert!(set.pool(TierKind::Vector).is_none());
    }
}
