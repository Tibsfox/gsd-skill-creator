# memory_arena

Amiga exec.library-inspired persistent RAM storage for gsd-skill-creator's
custom memory subsystem. This is **slice 1** (M1) of a multi-slice build —
slice 1 ships the structural primitives and measurement-first baseline;
slice 2+ layer on crossfade tier transitions, custom allocators, huge
pages, VRAM, and cgroup wiring.

## Design principles

See `memory/amiga-ram-storage-design.md` for the full philosophy:

- **One large allocation at startup**, not per-request heap churn
- **Typed chunks** with magic + checksum headers (like Amiga Resident
  structures)
- **RAD:-style warm-start recovery** via mmap-backed slot walk + optional
  journal replay
- **Typed tier pools** with per-tier policy (max_chunks, eviction kind,
  promote/demote timing)
- **Intrusive LRU index** on top of the directory for O(1) eviction victim
  selection
- **Scalable LOD** — tiers add/merge based on measurement, everything is
  tunable via `ArenaConfig` / `TierPolicy`

Not `tmpfs`. Not `/dev/shm`. Not OS-managed. We own every byte.

## Module layout (M13)

| File | Lines | Purpose |
|---|---|---|
| `types.rs` | 466 | `TierKind`, `ChunkId`, `ChunkHeader`, `ArenaConfig`, `TierPolicy`, `EvictionKind`, `AllocatorSelector`, `SweepReport` |
| `chunk.rs` | 261 | `Chunk` primitive — header + payload + streaming xxh3 checksum, `read_header_core`/`read_header_extended` |
| `arena.rs` | 1,273 | `Arena` — fixed-slot allocator, heap/mmap, LRU-aware, `get_chunk_hot` zero-copy path |
| `allocator.rs` | 977 | `ChunkAllocator` trait + 4 impls (FixedSlot, Slab, Buddy, TLSF) + `AllocatorKind` enum dispatch + `SyncAllocator<A>` |
| `list.rs` | 309 | `List<T>` index-based intrusive doubly-linked list + `LruIndex` |
| `pool.rs` | 1,629 | `TierPool`, `ArenaSet` (multi-pool + manifest + crossfade registry persistence + orphan GC), `GcReport` |
| `warm_start.rs` | 420 | `WarmStart::open`, `ColdSource` + `AsyncColdSource` traits, `InMemoryColdSource` |
| `persistence.rs` | 873 | Checkpoint (v1 dense + v2 sparse) + append-only journal |
| `pg_cold.rs` | 127 | `PgColdSource` — PostgreSQL-backed ColdSource (feature = postgres) |
| `vram.rs` | 622 | `VramContext`, `VramPool`, `PinnedBuffer`, `GpuTopology`, `KernelHandle` (feature = cuda) |
| `handle.rs` | 161 | Opaque `ArenaHandle` + `TierKind` string conversion helpers |
| `error.rs` | 109 | `ArenaError` enum + `ArenaResult<T>` |
| `mod.rs` | 54 | Module re-exports |
| `tests.rs` | 8,294 | 341 tests (cuda) / 309 (no features) |
| **Total** | **15,575** | |

## Deliverables (M1 slice 1)

- **D1 Typed Tier Pools** — `TierPool`, `TierPolicy`, `ArenaSet`, `Manifest`
- **D2 Intrusive List + LRU Index** — `List<T>`, `LruIndex` wired into
  `Arena::alloc_chunk` / `free_chunk` / `touch_chunk` / `apply_alloc` /
  `reinsert_slot` / `place_chunk_at_slot`
- **D3 Warm-Start Loop** — `WarmStart::open` slot walk + `Chunk::deserialize`
  validation + `ColdSource` fallback rebuild
- **D4 Criterion Bench Harness** — see [Benchmarks](#benchmarks)

## Former non-goals — now delivered

All items from the original M1 non-goals list have been delivered:

| Non-goal (M1) | Delivered in |
|---|---|
| Crossfade state machine | M3 (demote) + M4 (promote) |
| Custom allocators (slab/buddy/TLSF) | M7 (bake-off) + M9 (AllocatorSelector) |
| `MAP_HUGETLB` | M8 |
| VRAM tier and `cudaMemcpyAsync` | M6 |
| PostgreSQL-backed ColdSource | M8 |
| Thread-safe allocators | M11 (SyncAllocator) |
| Async ColdSource | M11 (AsyncColdSource) |
| Multi-GPU support | M13 (GpuTopology) |
| CUDA kernel launches | M13 (KernelHandle) |

**Remaining non-goals:**
- cgroup `MemoryMax` enforcement (deferred — not yet needed)
- Datatypes plugin pattern (Grove handles serialization)

## Benchmarks

Criterion benchmarks live at `src-tauri/benches/arena_bench.rs` and cover:

- `alloc_chunk_small_1kib` / `alloc_chunk_large_1mib`
- `get_chunk_hot`
- `touch_chunk_roundrobin_1k` (exercises the LRU move-to-front hot path)
- `warm_start/1000`, `warm_start/10000`, `warm_start_big/warm_start_100k`
  — lazy default path as of M2
- `warm_start_eager/1000`, `warm_start_eager/10000`,
  `warm_start_eager_big/warm_start_eager_100k` — the M1-equivalent
  eager path, kept for side-by-side comparison
- `validate_chunk_lazy/validate_chunk_after_lazy_open_1k` — on-demand
  validation cost after a lazy open (M2)
- `checkpoint_write_1k`
- `journal_append_1k` / `journal_replay_1k`
- `demote_crossfade/begin_1kib`, `begin_1mib`, `complete_1kib`,
  `complete_1mib`, `begin_complete_1kib` — demote crossfade pipeline
  latency for small and large payloads (M3)
- `hysteresis/rejects_cooldown_1k` — hysteresis cooldown rejection
  latency (M3)

**Baseline numbers:**
- [`docs/memory-arena/M1-baseline.md`](../../../docs/memory-arena/M1-baseline.md)
  — M1 eager baseline (slice 1)
- [`docs/memory-arena/M2-baseline.md`](../../../docs/memory-arena/M2-baseline.md)
  — M2 lazy-default + per-pool journal dispatch (slice 2), with M1-vs-M2
  delta. Headline: lazy `warm_start_100k` = 86.24 ms vs M1 eager = 1.43 s
  (**16.58x speedup**).
- [`docs/memory-arena/M3-baseline.md`](../../../docs/memory-arena/M3-baseline.md)
  — M3 demote crossfade + ChunkState + hysteresis (slice 3), with M2-vs-M3
  cross-check. Headline: demote `begin_1kib` = 41 us, `complete_1kib` = 41 us,
  lazy `warm_start_100k` = 86.87 ms (+0.73% vs M2, noise).

**Slice history**

- **M1** = eager baseline. `WarmStart::open` walked every slot's header +
  payload checksum at open time.
- **M2** = lazy default + per-pool journal dispatch. `WarmStart::open`
  now walks only slot headers; payload validation is deferred to
  `Arena::validate_chunk` or the per-read re-validation in `get_chunk`.
  Callers that need the eager M1 contract opt in explicitly via
  `WarmStart::open_eager` or `WarmStartConfig { eager_validation: true }`.
  Journal records gained an `OP_ALLOC_V2` / `OP_FREE_V2` variant that
  carries a `pool_id: TierKind` byte for multi-pool `replay_into_set`
  dispatch; legacy v1 records decode as `pool_id = TierKind::Hot`.
- **M3** = demote crossfade + ChunkState enum + hysteresis cooldown.
- **M4** = promote crossfade (symmetric ±10% with demote) + orphan recovery
  on warm-start (FadingOut→Resident). `last_promote_completed_at_ns` at
  header bytes 80..88.
- **M5** = policy-driven sweep driver. `TierKind::heat_index()`, `hotter_tier`
  / `colder_tier` adjacency, `TierPool::evict_lru()`, `ArenaSet::run_policy_sweep()`
  → `SweepReport`. Synchronous single-pass, hottest-first.
- **M6** = VRAM tier via cudarc (cuda feature). `VramContext`, `VramPool`,
  `ArenaSet` crossfade dispatch RAM↔VRAM. RTX 4060 Ti baseline.
- **M7** = allocator bake-off. `ChunkAllocator` trait, 4 implementations
  (FixedSlot, Slab, Buddy, TLSF) behind `AllocatorKind` enum dispatch.
- **M8** = PG ColdSource (postgres feature), MAP_HUGETLB with fallback,
  `read_header_core`/`read_header_extended` cache-line split. Closes all
  8 original handoff items.
- **M9** = `AllocatorSelector` on `PoolSpec` (serde default, backward compat).
  `get_chunk_hot()` / `get_chunk_hot_with_header()` zero-copy read path.
- **M10** = CrossfadeRegistry persistence to `crossfades.json` + `gc_orphaned_targets()`.
- **M11** = `SyncAllocator<A>` Mutex wrapper + `AsyncColdSource` trait with blanket impl.
- **M12** = `PinnedBuffer` (MAP_LOCKED) + VRAM sweep integration tests (cuda).
- **M13** = `GpuTopology` multi-GPU discovery + `KernelHandle` launch config (cuda).

**Re-run command:**
```bash
cd src-tauri && cargo bench --bench arena_bench
```

The harness uses `criterion = "0.5"` with `default-features = false` and
only `html_reports` enabled. HTML reports are written to
`target/criterion/report/index.html` after each run.

Every future slice (3, 4, ...) measures its changes against both the M1
and M2 baselines. Regressions are a gate; improvements are the
justification for each subsequent slice.

## Design memories

See `.claude/agent-memory/foxy/` (or equivalent memory index) for:

- `amiga-ram-storage-design.md` — philosophy + exec.library lineage
- `crossfade-lod-tuning.md` — tunable-everything principle
- `memory-system-budget.md` — 32-48 GiB working budget
- `no-swap-policy.md` — no OS swap allowed, ever

## References

- [`MISSION.md`](../../../.planning/phases/memory-arena-m1-tiered-warmstart/MISSION.md)
  (gitignored — the phase's source of truth)
- `Chunk::deserialize` validates: magic bytes, version field, tier kind,
  xxh3 checksum covering `header[0..56] || payload`
- `Arena::new_mmap_file` reuses an existing .arena file on reopen (the
  warm-start path)
- `ArenaSet` isolates chunk-id namespaces per pool (Hot `ChunkId(1)` and
  Warm `ChunkId(1)` are distinct chunks)
