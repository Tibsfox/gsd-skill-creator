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

## M1 module layout

| File | Purpose |
|---|---|
| `types.rs` | `TierKind`, `ChunkId`, `ChunkHeader`, `ArenaConfig`, `TierPolicy`, `EvictionKind` |
| `chunk.rs` | `Chunk` primitive — header + payload + streaming xxh3 checksum |
| `arena.rs` | `Arena` — fixed-slot allocator, heap- or mmap-backed, LRU-aware |
| `list.rs` | `List<T>` index-based intrusive doubly-linked list + `LruIndex` |
| `pool.rs` | `TierPool` (arena + policy) and `ArenaSet` (multi-pool container + `manifest.json`) |
| `warm_start.rs` | `WarmStart::open`, `ColdSource` trait, `InMemoryColdSource` stub |
| `persistence.rs` | Checkpoint (v1 dense + v2 sparse) + append-only journal |
| `handle.rs` | Opaque `ArenaHandle` + `TierKind` string conversion helpers |
| `error.rs` | `ArenaError` enum + `ArenaResult<T>` |
| `tests.rs` | 106 unit + integration tests (+1 `#[ignore]` for journal truncation, deferred to slice 2) |

## Deliverables (M1 slice 1)

- **D1 Typed Tier Pools** — `TierPool`, `TierPolicy`, `ArenaSet`, `Manifest`
- **D2 Intrusive List + LRU Index** — `List<T>`, `LruIndex` wired into
  `Arena::alloc_chunk` / `free_chunk` / `touch_chunk` / `apply_alloc` /
  `reinsert_slot` / `place_chunk_at_slot`
- **D3 Warm-Start Loop** — `WarmStart::open` slot walk + `Chunk::deserialize`
  validation + `ColdSource` fallback rebuild
- **D4 Criterion Bench Harness** — see [Benchmarks](#benchmarks)

## Non-goals (slice 2+)

Explicitly out of scope in slice 1, per `MISSION.md`:

- Crossfade state machine
- Custom allocators beyond fixed-slot (slab/buddy/TLSF bake-off)
- `MAP_HUGETLB`
- VRAM tier and `cudaMemcpyAsync` paths
- cgroup `MemoryMax` enforcement
- PostgreSQL-backed `ColdSource` implementation (stub only this slice)
- Datatypes plugin pattern (Grove handles serialization needs)

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

**Baseline numbers:**
- [`docs/memory-arena/M1-baseline.md`](../../../docs/memory-arena/M1-baseline.md)
  — M1 eager baseline (slice 1)
- [`docs/memory-arena/M2-baseline.md`](../../../docs/memory-arena/M2-baseline.md)
  — M2 lazy-default + per-pool journal dispatch (slice 2), with M1-vs-M2
  delta. Headline: lazy `warm_start_100k` = 86.24 ms vs M1 eager = 1.43 s
  (**16.58x speedup**).

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
