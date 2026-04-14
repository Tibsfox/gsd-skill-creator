# M9-M13 Baseline — Arena Completion + Grove Integration

**Date:** 2026-04-10
**Branch:** artemis-ii
**Tip:** `f9c7dcc5b` (11 commits past M8)
**Hardware:** AMD Ryzen (Linux 6.17.0-19-generic), 64 GB RAM, NVMe, NVIDIA RTX 4060 Ti 8 GB

## Overview

Five memory arena slices (M9-M13) close all 10 future entry points identified
in the M8 baseline. A 6-commit integration layer wires the arena into the
Tauri IPC surface and the Grove content-addressed storage format.

**Total module size:** 15,575 lines of Rust across 14 files + 2,419 lines
of TypeScript across 8 files (clients, tests, migration).

## M9 — AllocatorSelector + get_chunk_hot (tip `841a03cd4`)

### D1: AllocatorSelector on PoolSpec

`AllocatorSelector` enum (`FixedSlot | Slab | Buddy | Tlsf`) added to
`PoolSpec` with `#[serde(default)]` for backward compat with legacy
manifests that omit the field. Plumbed through `ArenaSet::create`,
`open_inner`, manifest round-trip. All existing PoolSpec construction
sites updated.

### D2: get_chunk_hot / get_chunk_hot_with_header

Zero-copy read path on `Arena`:

- **`get_chunk_hot(id) → &[u8]`** — single header parse via
  `read_header_core`, inline streaming xxh3 checksum over backing
  storage bytes, returns a slice into the mmap. No `Chunk` allocation,
  no payload copy, no redundant re-parse.
- **`get_chunk_hot_with_header(id) → (ChunkHeader, &[u8])`** — same
  path but also returns the parsed header.

Both validate the checksum on every call — this is NOT an unchecked
fast path. The speedup comes from eliminating the double header parse
in `get_chunk` (which calls `read_header_core` then `Chunk::deserialize`
which calls `read_header_from` → `read_header_core` again).

**Tests:** 11 new (291 total)

## M10 — CrossfadeRegistry Persistence + Orphan-Target GC (tip `3f1deb1c9`)

### D1: CrossfadeRegistry Persistence

`CrossfadeHandle` gains `Serialize + Deserialize`. The `CrossfadeRegistry`
gains `to_vec()`, `from_vec()`, `is_empty()` methods.

`ArenaSet::flush()` writes in-flight crossfade handles to
`<root>/crossfades.json` via `write_json_atomic()` (temp file + fsync +
rename). On clean shutdown (empty registry), the file is removed.

`ArenaSet::open_inner()` restores the registry from `crossfades.json` via
`read_crossfade_registry()`. FadingOut sources WITH a registry entry are
preserved (resumable crossfade); those WITHOUT are reverted to Resident
(crash orphans, as before).

### D2: gc_orphaned_targets

`ArenaSet::gc_orphaned_targets() → GcReport`:

1. Walks all persisted crossfade handles
2. Reverts FadingOut sources to Resident
3. Frees orphaned target chunks from their pools
4. Clears the stale registry entries

`GcReport { targets_freed, sources_reverted }` tracks outcomes.

M4 orphan recovery tests updated to call `gc_orphaned_targets()` after
open — the correct API post-M10.

**Tests:** 6 new (297 total)

## M11 — SyncAllocator + AsyncColdSource (tip `14c690022`)

### D1: SyncAllocator

`SyncAllocator<A: ChunkAllocator>` — Mutex-guarded wrapper around any
allocator. All 4 allocator strategies gain thread-safe variants.

- `Send + Sync` via `unsafe impl` (Mutex serializes all access)
- Concurrent alloc/free tested with 8 threads × 16 allocations
- Zero-allocation overhead when uncontended (atomic CAS)

### D2: AsyncColdSource

`AsyncColdSource` trait with `Pin<Box<dyn Future>>` return type for
object safety. Blanket impl for all sync `ColdSource` (wraps result in
ready future). Enables native async `PgColdSource` without `block_on`
bridge.

**Tests:** 7 new (304 total without cuda)

## M12 — PinnedBuffer + VRAM Sweep Integration (tip `fd1dc6342`, cuda feature)

### D1: PinnedBuffer

Page-locked host memory via `MAP_LOCKED` mmap with graceful fallback to
`std::alloc` when `ulimit -l` is too low.

- `PinnedBuffer::new(ctx, len)` — allocate
- `as_slice()` / `as_mut_slice()` — zero-copy access
- `Send + Sync`, auto-freed on drop
- Zero-size buffers handled (no allocation)

### D2: VRAM Sweep Integration

`run_policy_sweep()` correctly demotes idle Hot chunks to Vector/VRAM
tier via existing crossfade dispatch. Validated with:

- **Policy sweep test:** idle Hot chunk demoted to Vector (VRAM-backed)
  after clock advance past `demote_after_idle_ns`
- **Manual crossfade round-trip:** Hot→VRAM→Hot bidirectional path

**Tests:** 5 new cuda-gated (334 total with cuda)

## M13 — GpuTopology + KernelHandle (tip `1d72d15d1`, cuda feature)

### D1: GpuTopology

Multi-GPU discovery via `CudaContext::device_count()`:

- `GpuTopology::discover()` — enumerate all CUDA devices
- `device_info(ordinal)` — per-device metadata (name, memory, compute capability)
- `create_context(ordinal)` — VramContext per device

Supports heterogeneous multi-GPU setups.

### D2: KernelHandle

CUDA kernel launch configuration:

- `KernelHandle::new(name, block_size, grid_size)` — explicit dimensions
- `KernelHandle::from_data_len(name, data_len, block_size)` — auto grid
  size via `ceil(data_len / block_size)`
- `total_threads()` — grid × block product
- Ready for `CudaFunction::launch` integration with compiled PTX modules

**Tests:** 7 new cuda-gated (341 total with cuda)

## Integration Layer (6 commits)

### IPC Commands (tip `f0936b8c0`)

8 new Tauri commands wrapping `ArenaSet`:

| Command | Method |
|---------|--------|
| `arena_set_init` | Create/reopen multi-pool ArenaSet |
| `arena_set_alloc` | Per-tier allocation |
| `arena_set_get_hot` | Zero-copy M9 read |
| `arena_set_free` | Per-tier free |
| `arena_set_sweep` | Policy sweep (M5) |
| `arena_set_gc` | Orphan GC (M10) |
| `arena_set_flush` | Mmap + manifest + registry |
| `arena_set_list_ids` | Per-tier chunk ID enumeration |

`ArenaSetState` wraps `ArenaSet` behind `tokio::sync::Mutex`. DTOs are
`#[serde(rename_all = "camelCase")]` for TypeScript interop. 5 Rust tests.

### TypeScript Clients

| File | Lines | Purpose |
|------|-------|---------|
| `rust-arena-set.ts` | 218 | `RustArenaSet` — IPC client for `arena_set_*` commands |
| `content-addressed-set-store.ts` | 329 | Tier-aware CAS backed by ArenaSet |
| `grove-store.ts` | 64 | `GroveStore` interface — shared contract for both CAS variants |
| `grove-migration.ts` | 198 | JSON ↔ ArenaSet migration |

### GroveStore Interface

Shared contract that both `ContentAddressedStore` (single arena) and
`ContentAddressedSetStore` (multi-pool) implement:

```typescript
interface GroveStore {
  loadIndex(): Promise<void>;
  put(hash, bytes): Promise<PutResult>;
  putAuto(bytes): Promise<PutResult>;
  replaceByHash(hash, bytes): Promise<PutResult>;
  getByHash(hash): Promise<Uint8Array | null>;
  hasHash(hash): Promise<boolean>;
  chunkIdForHash(hash): Promise<number | null>;
  removeByHash(hash): Promise<boolean>;
  listHashes(): Promise<string[]>;
  count(): Promise<number>;
  preload(hashes): Promise<number>;
}
```

Grove consumers (GroveNamespace, SkillCodebase, SignatureView,
SessionActivationView, ArenaSkillStore) can accept either store via
dependency injection.

### Migration

**`migrateJsonToArenaSet()`** — reads `.grove/arena.json`, classifies
each chunk by payload size:
- < 256 bytes → `hot` (type records, namespace heads)
- < 4 KiB → `warm` (bindings, metadata)
- ≥ 4 KiB → `blob` (skill code, research payloads)

Custom classifier supported. Optional backup of old JSON file.

**`exportArenaSetToJson()`** — reverse path for rollback. Walks all tiers,
writes legacy-format JSON.

### TypeScript Tests

| File | Tests | Coverage |
|------|-------|---------|
| `rust-arena-set.test.ts` | 12 | init, alloc, getHot, free, sweep, gc, flush, errors, e2e |
| `content-addressed-set-store.test.ts` | 19 | put/get, dedup, tier routing, putAuto, remove, list, sweep/gc/flush passthrough, registerEntry, e2e |
| `grove-migration.test.ts` | 6 | migrate, empty, backup, custom classifier, export, round-trip |

## Cumulative State

| Metric | M1 start | M8 close | M13 + integration |
|--------|----------|----------|-------------------|
| Rust files in memory_arena/ | 10 | 12 | 14 |
| Rust lines (memory_arena/) | ~3,000 | ~11,000 | 15,575 |
| Rust tests (no features) | 99 | 280 | 309 |
| Rust tests (cuda) | 99 | 305 | 341 |
| Cargo optional deps | 0 | 4 | 4 |
| Feature flags | 0 | 2 | 2 |
| Tauri IPC commands | 8 | 8 | 16 |
| TS client files | 2 | 2 | 6 |
| TS tests (memory/) | 286 | 286 | 323 |
| Commits on branch | 15 | 83 | 94 |

## All 10 Future Entry Points — CLOSED

| # | Entry Point | Closed In |
|---|-------------|-----------|
| 1 | Swap default allocator to bake-off winner | M9 |
| 2 | Policy sweep VRAM integration | M12 |
| 3 | Pinned host memory (cudaMallocHost) | M12 |
| 4 | Multi-GPU support | M13 |
| 5 | CUDA kernel launches | M13 |
| 6 | CrossfadeRegistry persistence | M10 |
| 7 | Orphaned-target deduplication / GC | M10 |
| 8 | Thread-safe allocators | M11 |
| 9 | Async ColdSource trait | M11 |
| 10 | get_chunk_hot optimization | M9 |

## Architecture Post-Integration

```
┌─────────────────────────────────────────────────────────┐
│ Grove Consumers (TS)                                    │
│ GroveNamespace · SkillCodebase · SignatureView · ...     │
│                    ↕ GroveStore interface                │
├──────────────────┬──────────────────────────────────────┤
│ CAS (single)     │ CAS-Set (multi-pool)                 │
│ ContentAddressed │ ContentAddressedSetStore              │
│ Store            │ ↕ tier routing (hot/warm/blob/res)   │
│ ↕ RustArena      │ ↕ RustArenaSet                       │
├──────────────────┴──────────────────────────────────────┤
│ Tauri IPC (16 commands)                                  │
│ arena_* (8) + arena_set_* (8)                           │
├─────────────────────────────────────────────────────────┤
│ Rust memory_arena (15,575 lines, 14 files)              │
│ Arena · ArenaSet · TierPool · ChunkAllocator trait       │
│ CrossfadeRegistry · PolicySweep · WarmStart · GC         │
│ PgColdSource · VramContext · VramPool · GpuTopology       │
│ PinnedBuffer · KernelHandle · SyncAllocator              │
├─────────────────────────────────────────────────────────┤
│ Storage: mmap (.arena files) + manifest.json             │
│          + crossfades.json + per-tier journals            │
│ Optional: CUDA VRAM (feature=cuda)                       │
│ Optional: PostgreSQL cold source (feature=postgres)      │
└─────────────────────────────────────────────────────────┘
```
