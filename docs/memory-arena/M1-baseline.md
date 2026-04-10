# Memory Arena M1 Baseline

Criterion benchmark baseline for the memory-arena-m1 phase. Every future
tuning decision in the memory subsystem is measured against these numbers.

**Commit:** `9769103b1 build(memory-arena): criterion bench harness arena_bench (D4)`
**Bench source:** `src-tauri/benches/arena_bench.rs`
**Captured:** 2026-04-09

## Hardware

| Component | Value |
|---|---|
| CPU | Intel(R) Core(TM) i7-6700K CPU @ 4.00GHz (4c/8t, Skylake) |
| RAM | 60 GiB total (44 GiB available at capture time) |
| Kernel | Linux 6.17.0-19-generic x86_64 (Ubuntu PREEMPT_DYNAMIC) |
| Storage | NVMe SSD (rota=0, not HDD) |

## Software

| Component | Value |
|---|---|
| rustc | 1.91.0 (f8297e351 2025-10-28) |
| criterion | 0.5 (`default-features = false`, `html_reports`) |
| build profile | release (`cargo bench`) |
| bench config | Cargo.toml `[[bench]] name = "arena_bench" harness = false` |

## Bench configs

**Small alloc / get / touch / checkpoint / journal benches:**
```rust
ArenaConfig::test() {
    chunk_size: 4 * 1024,        // 4 KiB per slot
    min_chunk_size: 64,
    max_chunk_size: 16 * 1024,
    default_policies: ...,
}
```

**Large alloc bench:**
```rust
ArenaConfig {
    chunk_size: 2 * 1024 * 1024, // 2 MiB per slot
    min_chunk_size: 64,
    max_chunk_size: 4 * 1024 * 1024,
    default_policies: ...,
}
```

**Warm-start benches** use `ArenaSet` + mmap-backed `hot.arena` files under
a `tempfile::tempdir()` root, with a single `TierKind::Hot` pool sized to
the target chunk count.

## Numbers

Mean times are the central estimate from Criterion's 95% CI. Ranges are
\[lower, estimate, upper\].

### alloc

| Bench | Mean | Range | Throughput |
|---|---|---|---|
| `alloc_chunk_small_1kib` | **591 ns** | 584 – 598 ns | 1.61 GiB/s |
| `alloc_chunk_large_1mib` | **556 µs** | 538 – 569 µs | 1.76 GiB/s |

Small-payload alloc is ~591 ns per chunk — dominated by the in-place header
write + streaming xxh3 checksum. Large-payload alloc throughput is **1.76
GiB/s**, suggesting the checksum hot path is not the bottleneck (memcpy of
the payload into the slot is).

### get

| Bench | Mean | Range | Throughput |
|---|---|---|---|
| `get_chunk_hot` | **95 ns** | 94.7 – 96.2 ns | 10.5 M ops/s |

95 ns per get is a round-robin over 1000 pre-populated chunks. Dominated
by HashMap lookup + `Chunk::deserialize` (which re-runs the checksum
validation on every read).

### touch

| Bench | Mean | Range | Throughput |
|---|---|---|---|
| `touch_chunk_roundrobin_1k` | **275 µs** per 1k-touch batch (~275 ns/chunk) | 267 – 285 µs | 3.64 M ops/s |

Touch is ~3x more expensive than get because it also rewrites the header
with the bumped `access_count` + `last_access_ns` + re-finalized checksum,
plus the LRU `move_to_front` call. 13 outliers in 100 samples (mostly high
mild) indicate some measurement noise — acceptable baseline for M1.

### warm_start

| Bench | Chunks | Mean | Range | Throughput |
|---|---|---|---|---|
| `warm_start/1000` | 1,000 | **940 µs** | 935 – 946 µs | 1.06 M chunks/s |
| `warm_start/10000` | 10,000 | **21.0 ms** | 20.9 – 21.0 ms | 477 K chunks/s |
| `warm_start_big/warm_start_100k` | 100,000 | **1.43 s** | 1.43 – 1.44 s | 69.8 K chunks/s |

`WarmStart::open` walks every slot, reads the header, validates the
checksum via `Chunk::deserialize`, and re-registers via
`warm_start_reinsert` → `Arena::reinsert_slot`. The 1k→10k case is 22x
slower for 10x more data (slight superlinearity — HashMap resize costs).
The 10k→100k case is 68x slower for 10x more data, reflecting mmap
page-in latency becoming noticeable at 100k.

100k case used `sample_size(10)` (reduced from the default 100) because
each iteration is ~1.4s; a full 100-sample run would have taken ~2.5 min.

### checkpoint

| Bench | Mean | Range | Throughput |
|---|---|---|---|
| `checkpoint_write_1k` | **174 µs** | 173 – 176 µs | 5.73 M chunks/s |

`write_checkpoint` (v2 sparse format) for 1000 chunks. The sparse format
writes only occupied slot bytes plus a directory header, so runtime is
proportional to allocated chunks, not arena capacity.

### journal

| Bench | Mean | Range | Throughput |
|---|---|---|---|
| `journal_append_1k` | **181 µs** | 179 – 183 µs | 5.53 M ops/s |
| `journal_replay_1k` | **333 µs** | 330 – 336 µs | 3.00 M ops/s |

Append throughput uses the streaming-xxh3 `append_alloc` hot path (no
scratch record Vec). Replay is ~1.8x slower than append because it has
to re-parse the header of each record, rebuild the chunk, and call
`apply_alloc` on the target arena (which in turn updates directory + LRU).

## Notes

- **1 outlier, high-severe, on `alloc_chunk_small_1kib`** (1% of samples). Likely a GC pause or page fault in the test runner. Not a signal.
- **13 outliers on `touch_chunk_roundrobin_1k`** (13%, 7 high-mild + 6 high-severe). Likely cache effects across 1000-chunk sweeps. Consider using `Criterion::measurement_time` increases or reducing the batch size if this becomes problematic for slice 2 comparisons.
- **1 outlier, high-mild, on `warm_start_big/warm_start_100k`** (10% of the 10-sample set). Expected — mmap page-in timing is inherently noisy at this scale.
- **`warm_start/1000` and `touch_chunk_roundrobin_1k`** both triggered Criterion's "increase target time" warning. Not a problem for baseline capture; can be tuned if slice 2 comparisons need tighter CIs.

## How to re-run

```bash
cd /path/to/projectGSD/dev-tools/artemis-ii/src-tauri
cargo bench --bench arena_bench
```

Output goes to stdout and to `target/criterion/report/index.html` for HTML
visualizations.

## Known non-goals for M1 slice 1

These are NOT measured here because they are deliberately out of scope
(per `MISSION.md`'s Non-Goals section):

- Crossfade state machine (slice 2)
- Custom allocators (slab/buddy/TLSF bake-off — slice 2)
- `MAP_HUGETLB` (slice 2 — measure with/without)
- VRAM tier and `cudaMemcpyAsync` paths (GPU slice)
- cgroup `MemoryMax` enforcement (ops/infra layer)
- PostgreSQL-backed `ColdSource` impl (slice 2+)
- Per-pool journal replay (deferred per Plan 05 deviation — see
  `.planning/phases/memory-arena-m1-tiered-warmstart/memory-arena-m1-05-SUMMARY.md`)

Slice 2 will revisit these with targeted benches against this baseline.
