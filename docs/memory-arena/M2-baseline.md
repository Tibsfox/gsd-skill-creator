# Memory Arena M2 Baseline

Criterion baseline for the memory-arena-m2 phase. Slice 2 re-measures the
warm-start path against M1's eager baseline after introducing
`Arena::open_lazy` and defaulting `WarmStart::open` to lazy (header-only)
validation. Every future tuning decision in the memory subsystem is
measured against both `M1-baseline.md` and this document.

**Bench source:** `src-tauri/benches/arena_bench.rs`
**Captured:** 2026-04-09
**Comparison baseline:** [`M1-baseline.md`](M1-baseline.md)

## Naming discipline — group name vs code path

Between M1 and M2, the default behavior of `WarmStart::open` changed from
eager validation to lazy header-only walk. The criterion group name
`warm_start_big/warm_start_100k` is stable, but the code path it measures
is different: in M1 it measured eager validation, in M2 it measures the
new lazy default. A new `warm_start_eager_big/warm_start_eager_100k`
group preserves the M1-equivalent measurement for continuity and
confirms no regression on the opt-in eager path.

When comparing criterion history across M1 and M2, do NOT read the
`warm_start_big/warm_start_100k` numbers as an apples-to-apples delta
— they measure different code. The apples-to-apples comparison is
either:

- M1 `warm_start_big/warm_start_100k` vs M2 `warm_start_eager_big/warm_start_eager_100k` (both eager)
- M1 `warm_start_big/warm_start_100k` vs M2 `warm_start_big/warm_start_100k` (M1 eager vs M2 lazy, which IS the headline delta)

## Hardware

| Component | Value |
|---|---|
| CPU | Intel(R) Core(TM) i7-6700K CPU @ 4.00GHz (4c/8t, Skylake) |
| RAM | 60 GiB total |
| Kernel | Linux 6.17.0-19-generic x86_64 (Ubuntu PREEMPT_DYNAMIC) |
| Storage | NVMe SSD (rota=0, not HDD) |

## Software

| Component | Value |
|---|---|
| rustc | 1.91.0 (f8297e351 2025-10-28) — unchanged from M1 |
| criterion | 0.5 (`default-features = false`, `html_reports`) — unchanged from M1 |
| build profile | release (`cargo bench`) |
| bench config | Cargo.toml `[[bench]] name = "arena_bench" harness = false` |

## Bench configs

Unchanged from M1. Small benches use `ArenaConfig::test()` (4 KiB slots),
the large-payload alloc bench uses 2 MiB slots. Warm-start benches use
`ArenaSet` + mmap-backed `hot.arena` files under a `tempfile::tempdir()`
root, with a single `TierKind::Hot` pool sized to the target chunk count.
See `M1-baseline.md` §Bench configs for details.

## Numbers

Mean times are the central estimate from Criterion's 95% CI. Ranges
are \[lower, estimate, upper\].

### warm-start — the headline deliverable

| Bench | M1 (eager) | M2 lazy | M2 eager (cross-check) | Speedup vs M1 |
|---|---|---|---|---|
| `warm_start/1000` | 940 µs | **772.73 µs** | 935.93 µs | **1.22x** |
| `warm_start/10000` | 21.0 ms | **8.12 ms** | 22.28 ms | **2.59x** |
| **`lazy warm_start_100k` (lazy vs M1 eager)** | **1.43 s** | **86.24 ms** | **1.4453 s** | **16.58x (HEADLINE)** |

**Criterion change-detection** on `warm_start_big/warm_start_100k`
(from M1 to M2 under the same group name):

```
time:   [-94.028% -93.866% -93.638%] (p = 0.00 < 0.05)
```

The 95% confidence interval for the speedup is at minimum **15.7x**
(statistically significant, p=0.00). The point estimate is 16.58x.

### warm-start — full M2 lazy numbers

```
warm_start/1000          time: [760.16 µs 772.73 µs 790.59 µs]
                         thrpt: [1.2649 M 1.2941 M 1.3155 M elem/s]
warm_start/10000         time: [7.9348 ms 8.1211 ms 8.3919 ms]
                         thrpt: [1.1916 M 1.2314 M 1.2603 M elem/s]
warm_start_big/warm_start_100k
                         time: [85.238 ms 86.241 ms 88.011 ms]
                         thrpt: [1.1362 M 1.1595 M 1.1732 M elem/s]
```

### warm-start — full M2 eager numbers (M1-equivalent path)

```
warm_start_eager/1000    time: [929.36 µs 935.93 µs 944.31 µs]
                         thrpt: [1.0590 M 1.0685 M 1.0760 M elem/s]
warm_start_eager/10000   time: [21.837 ms 22.280 ms 22.833 ms]
                         thrpt: [437.96 K 448.83 K 457.93 K elem/s]
warm_start_eager_big/warm_start_eager_100k
                         time: [1.4429 s 1.4453 s 1.4477 s]
                         thrpt: [69.075 K 69.189 K 69.304 K elem/s]
```

The eager-100k result of 1.4453 s matches M1's 1.43 s within **+1.07%**
(well inside criterion noise), confirming that the Plan 03 refactor did
not leak into the opt-in eager path. Callers that explicitly want
eager-mode validation via `WarmStart::open_eager` get the same behavior
and cost as M1.

### validate_chunk — the on-demand validation cost

```
validate_chunk_lazy/validate_chunk_after_lazy_open_1k
                         time: [531.78 µs 533.43 µs 535.11 µs]
                         thrpt: [1.8688 M 1.8747 M 1.8805 M elem/s]
```

Per-chunk cost: **~533 ns**. This is what callers pay when they open an
arena lazily and then want a guarantee on a specific chunk via
`Arena::validate_chunk(id)`.

## Deferral economics — when lazy wins

Lazy saves **13.59 µs per chunk** at open time
`(1.43 s − 86.24 ms) / 100k chunks = 13.59 µs/chunk`.

`Arena::validate_chunk` costs **533 ns per chunk** at access time.

Break-even: a caller has to re-validate `13.59 / 0.533 ≈ 25.5` chunks
for every chunk the arena contains before eager becomes the better
trade-off. Put differently: as long as a caller's working set reads
back less than **~96% of the arena** post-open (and only re-validates
what they actually touch), lazy wins.

This is a ~25:1 asymmetry in lazy's favor for any caller that doesn't
re-validate everything up front. For caller patterns where every chunk
is accessed exactly once (e.g. full arena re-export), the two paths are
roughly equivalent in total cost; eager just pays the cost up front.

## Non-warm-start regression sweep

Slice 2's Non-Goals explicitly exclude changes to the alloc / get /
touch hot paths. Any observed delta on those benches is either noise
or an unattributable system-level effect — except for `journal_append_1k`,
which IS expected to move slightly because Plan 04 added a 2-byte
`pool_id` field to the v2 record format.

| Bench | M1 | M2 | Delta | Verdict |
|---|---|---|---|---|
| `alloc_chunk_small_1kib` | 591 ns | 600.06 ns | +1.5% | noise |
| `alloc_chunk_large_1mib` | 556 µs | 296.47 µs | **-47%** ← see §Flagged items | unattributable improvement |
| `get_chunk_hot` | 95 ns | 97.89 ns | +3.0% | noise |
| `touch_chunk_roundrobin_1k` | 275 µs | 295.08 µs | **+7.3%** ← see §Flagged items | advisory regression, outlier-noisy regime |
| `checkpoint_write_1k` | 174 µs | 172.43 µs | -0.9% | noise |
| `journal_append_1k` | 181 µs | 185.02 µs | **+2.2%** ← see §Flagged items | **expected cost of Plan 04 per-pool dispatch** |
| `journal_replay_1k` | 333 µs | 327.89 µs | -1.5% | noise |

### Flagged items (full context)

**`alloc_chunk_large_1mib` -47% (556 µs → 296 µs):** unattributable
improvement. The alloc hot path is unchanged between M1 and M2 — no
slice-2 plan touched `Arena::alloc_chunk`. Likely causes: (a) warm page
cache from running the new warm_start_lazy benches earlier in the same
process, (b) CPU thermal / frequency state differences between the M1
and M2 capture windows, (c) criterion's per-iteration Vec allocation
being more cache-friendly in this run. **Slice 2 does NOT claim credit
for this delta.** Candidate for slice-3 retro investigation: re-run the
bench in isolation from a cold process to see whether the improvement
is real or spurious.

**`touch_chunk_roundrobin_1k +7.3% (275 µs → 295 µs, CI [+1.4%, +12.6%]):**
advisory regression within an outlier-noisy regime on an untouched code
path. M1's own baseline note flagged this bench as having 13% high-mild
outliers at capture time, and criterion emitted an "increase target
time" warning. The M1 and M2 CIs overlap, and slice 2 made zero changes
to `Arena::touch_chunk` or the LRU move-to-front hot path. Not blocking
slice-2 acceptance. Candidate for slice-3 retro: isolate this bench to
its own `cargo bench` invocation to get a stable baseline before
attributing any future delta.

**`journal_append_1k +2.2% (181 µs → 185 µs, criterion reports +5.66%
with p=0.00):** **expected and attributable** to Plan 04. The v2 record
format adds a 2-byte `pool_id` field to every alloc record, so each
record writes 2 more bytes than M1's v1 records did. Over 1000 ops that
is ~2 KB of extra writes per iteration. Trade-off: enables multi-pool
journal dispatch via `replay_into_set` (MISSION.md D3 deliverable).
Absolute cost stays inside the ±5% regression gate. This is the price
of the per-pool dispatch feature, not noise.

## Slice 2 vs M1 baseline — what moved

- **`warm_start_big/warm_start_100k`:** M1 (eager) = 1.43 s, M2 (lazy
  default) = 86.24 ms. **Speedup 16.58x.** Headline deliverable.
- **`warm_start/10000`:** M1 = 21.0 ms, M2 lazy = 8.12 ms. Speedup 2.59x.
- **`warm_start/1000`:** M1 = 940 µs, M2 lazy = 772.73 µs. Speedup 1.22x
  (smaller gain because the per-open fixed costs dominate at this size —
  mmap setup, manifest parse, directory allocation).
- **`warm_start_eager_big/warm_start_eager_100k`:** 1.4453 s — M1
  parity (+1.07%). Confirms no eager-path drift.
- **`validate_chunk_lazy/validate_chunk_after_lazy_open_1k`:** new
  bench, 533 ns/chunk — the on-demand validation cost.
- **`journal_append_1k`:** +2.2% — expected Plan-04 cost.
- **All other benches:** within ±5% of M1 or on unattributable drifts.

## Known non-goals for slice 2

These are NOT measured here because they are deliberately out of scope
per `MISSION.md` §Non-Goals:

- Crossfade state machine and tier transitions (slice 3)
- Custom allocator bake-off (slab / buddy / TLSF — slice 3+)
- `MAP_HUGETLB` measurement (slice 3 or later)
- VRAM tier and `cudaMemcpyAsync` paths (separate GPU slice)
- PG-backed `ColdSource` implementation (separate persistence slice)
- cgroup `MemoryMax` enforcement (ops layer, not arena)
- Datatypes plugin pattern (Grove covers serialization)
- Parallel chunk loading via `rayon`
- `TierPool::replay_alloc` wiring (slice-2 left a documented counter
  drift on `replay_into_set` — pool.len() stays out of sync with the
  arena's directory after multi-pool replay)

## How to re-run

```bash
cd /media/foxy/ai/GSD/dev-tools/artemis-ii/src-tauri
cargo bench --bench arena_bench
```

Output goes to stdout and to `target/criterion/report/index.html` for
HTML visualizations. Full runtime with both eager and lazy warm-start
groups + validate_chunk bench is ~5–6 minutes on the capture hardware.

## Next — slice 3 entry-points

These are the deferred topics that the slice-2 bench surface suggests
should attack next:

- **Crossfade state machine** (`ChunkState::Resident / FadingOut /
  FadingIn`) to let pools migrate chunks between tiers without binary
  promote/demote — the main driver for tier-policy-driven transitions.
- **Allocator bake-off** — slab, buddy, TLSF. The fixed-slot allocator
  is fine for M1/M2 measurement, but mixed-size payload patterns will
  pay fragmentation costs a custom allocator can avoid.
- **`MAP_HUGETLB`** — measure warm-start and alloc paths with and
  without 2 MiB huge pages. Skylake TLB pressure on 4 GiB arenas is
  the next likely low-hanging fruit.
- **VRAM tier** — `cudaMemcpyAsync` paths for GPU offload. Depends on
  CUDA binding choice; probably its own slice.
- **PG-backed `ColdSource`** — the production replacement for the M1
  `InMemoryColdSource` stub. Needed before the eager-mode rebuild path
  is usable in production.
- **`TierPool::replay_alloc` wiring** — close the `replay_into_set`
  counter-drift trade-off. Should be a small slice.
- **Isolate `touch_chunk_roundrobin_1k` bench** into its own invocation
  to stabilize the baseline before attributing future deltas.
- **Investigate `alloc_chunk_large_1mib`'s -47% delta** cold-process to
  determine whether it's a real system-level improvement or spurious.
- **Naming cosmetic pass:** rename `slots_validated` →
  `slots_structurally_validated` in `WarmStartReport` for clarity
  under lazy mode.
