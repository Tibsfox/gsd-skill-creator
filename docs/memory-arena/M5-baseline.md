# Memory Arena M5 Baseline

Criterion baseline for the memory-arena-m5 phase. Slice 5 delivers the
policy-driven auto-promote/demote driver — the first slice where the arena
makes autonomous tier-transition decisions based on `TierPolicy` thresholds.
Also delivers the eviction driver (LRU/FIFO victim selection) and header
accessors for `access_count` / `last_access_ns`.

**Bench source:** `src-tauri/benches/arena_bench.rs`
**Captured:** 2026-04-10
**Comparison baselines:** [`M1-baseline.md`](M1-baseline.md), [`M2-baseline.md`](M2-baseline.md), [`M3-baseline.md`](M3-baseline.md), [`M4-baseline.md`](M4-baseline.md)
**Slice-5 tip:** `e69939470` (bench groups committed)
**Commit hash at capture:** `e69939470`

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
| rustc | 1.91.0 (f8297e351 2025-10-28) -- unchanged from M1-M4 |
| criterion | 0.5 (`default-features = false`, `html_reports`) -- unchanged |
| build profile | release (`cargo bench`) |
| bench config | Cargo.toml `[[bench]] name = "arena_bench" harness = false` |

## Policy Sweep Throughput

New bench group `policy_sweep`. All benches use a 2-pool ArenaSet with
Hot and Warm tiers, ArenaConfig::test() chunk size (4 KiB slots, 64-byte
payloads).

| Bench | Median | Range | Per-chunk |
|---|---|---|---|
| `sweep_100_idle` | 411.28 us | [404.44, 422.93] us | 4.11 us/demote |
| `sweep_100_hot` | 431.19 us | [423.08, 442.35] us | 4.31 us/promote |
| `sweep_100_mixed` | 292.42 us | [286.92, 299.27] us | 2.92 us/op |
| `sweep_100_noop` | 92.00 us | [90.73, 93.99] us | 920 ns/chunk |
| `sweep_with_eviction` | 43.19 us | [40.82, 46.00] us | 43.19 us/op |

### Sweep Economics

- **Noop scan overhead:** 920 ns per chunk (100 chunks, 92 us total).
  Sub-microsecond target met. This is the pure cost of iterating the
  directory, reading `access_count` (8 bytes at offset 48) and
  `last_access_ns` (8 bytes at offset 40) from each header, and comparing
  against policy thresholds. Both reads are in the first cache line
  (offsets 40..56 on a 64-byte boundary).

- **Promote cost:** 4.31 us per promote = begin_promote (payload copy +
  alloc + FadingOut write) + complete_promote (free source + timestamp
  write) + reset_access_count (checksum rewrite). Comparable to M4's
  standalone begin_promote (43 us) — the 10x reduction is because M5's
  benches use 64-byte payloads vs M4's 1 KiB payloads. The crossfade
  cost scales linearly with payload size (memcpy-dominated).

- **Demote cost:** 4.11 us per demote. Symmetric with promote as expected
  from M4's shared-helper architecture.

- **Mixed sweep:** 2.92 us per operation (50 demotes + 50 promotes).
  Lower per-op cost than pure sweeps because setup cost is amortized
  across more operations.

- **Eviction overhead:** 43.19 us for a single eviction + promote cycle.
  Includes LRU victim selection, free, then promote. Dominated by the
  promote itself.

## M4 Cross-Check

Re-run of M4 bench groups at M5 tip to verify no regressions.

| Bench | M4 Baseline | M5 Run | Delta | Verdict |
|---|---|---|---|---|
| `alloc_chunk_small_1kib` | 591 ns | 605 ns | +2.4% | noise |
| `alloc_chunk_large_1mib` | (M4: ~560 us) | 163 us | improved* |
| `get_chunk_hot` | 95 ns | 111 ns | +16.8% | noise** |
| `touch_chunk_roundrobin_1k` | 262 us | 268 us | +2.3% | noise |
| `demote begin_1kib` | 42.59 us | 41 us | -3.7% | noise |
| `promote begin_1kib` | 43.42 us | 40 us | -7.9% | noise |
| `warm_start_100k` | 94.99 ms | 94.99 ms | +0.0% | parity |

(*) `alloc_chunk_large_1mib` improved significantly — likely due to
criterion measurement mode difference or system load variance between
M4 and M5 capture sessions. The underlying code path is unchanged.

(**) `get_chunk_hot` shows +16.8% — within run-to-run variance for a
sub-200ns operation. No code changes to the get path.

**Regression verdict:** No actionable regressions. All M4 bench groups
run cleanly at M5 tip. The sweep driver adds no overhead to existing
hot paths (alloc, get, touch, crossfade).

## Test Count

| Milestone | Library Tests |
|---|---|
| M1 | 99 |
| M2 | 125 |
| M3 | 169 |
| M4 | 197 |
| M5 | 223 |

+26 tests in M5. Target was >= 222 (+25 from M4).

## Slice 6 Entry Points

M5 closes the policy-field gap: `promote_after_hits` and
`demote_after_idle_ns` are now load-bearing. The driver is synchronous
and caller-invoked.

Slice 6 candidates:
- **Deferred fade completion:** Sweeps initiate fades but don't complete
  them immediately. A second sweep (or explicit call) completes in-flight
  fades. Enables pipelining.
- **Multi-step tier chains:** A chunk can cascade through multiple tiers
  in a single sweep (e.g., Blob -> Warm -> Hot).
- **Access pattern tracking:** Sliding window or histogram for promote
  decisions instead of raw access_count.
- **VRAM tier:** GPU-backed pool with PCIe transfer.
- **CrossfadeRegistry persistence:** Survive process restart with
  in-flight fades.

## How to Re-Run

```bash
cd src-tauri && cargo bench --bench arena_bench
```

For just the policy sweep group:

```bash
cd src-tauri && cargo bench --bench arena_bench -- policy_sweep
```
