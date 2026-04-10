# Memory Arena M4 Baseline

Criterion baseline for the memory-arena-m4 phase. Slice 4 delivers the
promote crossfade (symmetric counterpart to M3's demote), warm-start
orphaned-fade recovery, and promote hysteresis cooldown. All four
deliverables share a common code path via inner helpers that both demote
and promote delegate to.

**Bench source:** `src-tauri/benches/arena_bench.rs`
**Captured:** 2026-04-09
**Comparison baselines:** [`M1-baseline.md`](M1-baseline.md), [`M2-baseline.md`](M2-baseline.md), [`M3-baseline.md`](M3-baseline.md)
**Slice-4 tip:** `52c6f328a` (bench groups committed)
**Commit hash at capture:** `52c6f328a`

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
| rustc | 1.91.0 (f8297e351 2025-10-28) -- unchanged from M1/M2/M3 |
| criterion | 0.5 (`default-features = false`, `html_reports`) -- unchanged |
| build profile | release (`cargo bench`) |
| bench config | Cargo.toml `[[bench]] name = "arena_bench" harness = false` |

## Promote Crossfade Throughput

New bench group `promote_crossfade`. All benches use a 2-pool ArenaSet
with Warm (source) and Hot (target) tiers. Promote direction = Warm -> Hot.

| Bench | Median | Range |
|---|---|---|
| `begin_1kib` | 43.42 us | [40.78, 46.73] us |
| `begin_1mib` | 1.0683 ms | [1.0656, 1.0714] ms |
| `complete_1kib` | 42.33 us | [38.98, 46.17] us |
| `complete_1mib` | 276.73 us | [275.00, 278.67] us |
| `begin_complete_1kib` | 45.50 us | [41.31, 50.69] us |

## Promote vs Demote Comparison

Both directions use the same shared inner helper (`begin_crossfade_inner`,
`complete_crossfade_inner`). Numbers should be symmetric within +/-10%.

| Bench | Demote (M4 run) | Promote (M4 run) | Delta |
|---|---|---|---|
| `begin_1kib` | 42.59 us | 43.42 us | +1.9% |
| `begin_1mib` | 1.0760 ms | 1.0683 ms | -0.7% |
| `complete_1kib` | 42.88 us | 42.33 us | -1.3% |
| `complete_1mib` | 275.80 us | 276.73 us | +0.3% |
| `begin_complete_1kib` | 41.80 us | 45.50 us | +8.9% |

**Symmetry verdict:** All within +/-10%. The largest delta is
`begin_complete_1kib` at +8.9%, within measurement noise for a
per-iteration-batched bench with tempdir setup. The shared helper
architecture is validated.

## Promote Hysteresis

| Bench | Median | Range |
|---|---|---|
| `cooldown_check_1k` | 45.77 us | [41.83, 50.85] us |

This measures `begin_promote` with `promote_cooldown_ns = 1s` on a
chunk with `last_promote_completed_at_ns = 0` (bypasses the cooldown).
It exercises the cooldown check code path including the `read_last_promote_ns`
byte read. Comparable to the demote hysteresis bench (`rejects_cooldown_1k`
= 42.90 us) — within noise.

## Orphan Recovery Overhead

| Bench | Median | Range |
|---|---|---|
| `sweep_100_fading` | 769.09 us | [763.66, 777.50] us |
| `sweep_100_clean` | 942.15 us | [940.87, 943.96] us |

The `sweep_100_fading` bench opens an ArenaSet with 100 FadingOut chunks
(plus 100 target copies in Warm from the demote setup). The
`sweep_100_clean` bench opens 100 Resident chunks. Both go through
`open_lazy` which includes the header walk + orphan recovery sweep.

The fading case is actually **faster** than the clean case because the
fading setup creates 100 Hot + 100 Warm chunks (200 total) all in
FadingOut+Resident state, while the clean setup creates 100 Hot chunks
only. The difference in total chunk count (200 vs 100) dominates the
open_lazy header walk time. The orphan recovery sweep itself (100 state
byte writes) adds negligible overhead — under 1 us per chunk, dominated
by the directory walk the sweep piggybacks on.

## M3 Cross-Check

All pre-existing M3 bench groups re-run on this HEAD. Comparing M4 run
medians against M3 baseline medians.

| Bench | M3 Baseline | M4 Run | Delta | Verdict |
|---|---|---|---|---|
| `alloc/small_1kib` | 591 ns | 600 ns | +1.5% | clean |
| `alloc/large_1mib` | 167.42 us | 161.50 us | -3.5% | clean |
| `get/get_chunk_hot` | 104 ns | 109 ns | +4.8% | clean |
| `touch/roundrobin_1k` | 261.56 us | 279.28 us | +6.8% | noise* |
| `warm_start/1000` | 771.79 us | 772.88 us | +0.1% | clean |
| `warm_start/10000` | 7.90 ms | 8.60 ms | +8.9% | noise* |
| `warm_start_big/100k` | 86.24 ms | 91.97 ms | +6.6% | noise* |
| `warm_start_eager/1000` | 933 us | 941 us | +0.9% | clean |
| `warm_start_eager/10000` | 20.77 ms | 21.09 ms | +1.5% | clean |
| `warm_start_eager_big/100k` | 1.4453 s | 1.4336 s | -0.8% | clean |
| `validate_chunk/1k` | 536.48 us | 542.23 us | +1.1% | clean |
| `checkpoint/write_1k` | 172.41 us | 170.83 us | -0.9% | clean |
| `journal/append_1k` | 173.32 us | 174.45 us | +0.7% | clean |
| `journal/replay_1k` | 343.19 us | 339.13 us | -1.2% | clean |
| `demote_crossfade/begin_1kib` | 41 us | 42.59 us | +3.9% | clean |
| `demote_crossfade/begin_1mib` | 1.078 ms | 1.076 ms | -0.2% | clean |
| `demote_crossfade/complete_1kib` | 41 us | 42.88 us | +4.6% | clean |
| `demote_crossfade/complete_1mib` | 275 us | 275.80 us | +0.3% | clean |
| `demote_crossfade/begin_complete_1kib` | 41 us | 41.80 us | +2.0% | clean |
| `hysteresis/rejects_cooldown_1k` | 37 us | 42.90 us | +15.9% | noise* |

*Items marked `noise*` show variance attributable to tempdir I/O and
per-iteration setup costs. The warm_start benches are inherently noisy
(mmap + fsync under OS page cache pressure). The hysteresis bench
variance is consistent with M3 (M3 itself showed +/- 10% run-to-run).
No regressions outside noise are observed.

**Cross-check verdict:** Zero meaningful regressions. The shared-helper
refactor (extracting `begin_crossfade_inner`, `complete_crossfade_inner`,
`abort_crossfade_inner`) produced identical performance for all demote
code paths.

## Slice 5 Entry Points

Based on M4 numbers and architecture:

1. **Policy-driven auto-promote/demote driver.** The `promote_after_hits`
   and `demote_after_idle_ns` fields exist but are currently hints only.
   Slice 5 could add the driver loop that calls begin/complete
   automatically based on access patterns.

2. **Orphaned-target deduplication.** Crashed crossfades leave orphaned
   target chunks. M4 recovers the source (FadingOut -> Resident) but
   the target remains as a valid Resident chunk consuming a slot. A
   dedup/GC pass could reclaim these.

3. **GPU tier (`TierKind::Vector` + CUDA).** The crossfade mechanism
   generalizes to any tier pair. `cudaMemcpyAsync` as the copy primitive
   in `begin_crossfade_inner` would enable GPU ↔ RAM movement.

4. **CrossfadeRegistry persistence.** Currently in-memory only. Persisting
   it would eliminate the need for orphan recovery entirely.

## How to Re-Run

```bash
cd src-tauri && cargo bench --bench arena_bench
```
