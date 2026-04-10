# M7 Baseline — Allocator Bake-Off

**Date:** 2026-04-10
**Branch:** artemis-ii
**Hardware:** AMD Ryzen (Linux 6.17.0-19-generic), 64 GB RAM, NVMe
**Rust:** stable (bench profile, optimized)
**Criterion:** default config (100 samples, 5s target)

## Bake-Off Results

Four allocators benchmarked across five workloads. All times are for the
complete workload (not per-operation) unless noted.

### Throughput Summary (median, lower is better)

| Workload | FixedSlot | Slab | Buddy | TLSF |
|---|---|---|---|---|
| uniform_small (10K x 100B) | 455 us | **370 us** | 501 us | 1,472 us |
| uniform_large (1K x 100 KiB) | **26 us** | 40 us | 54 us | 129 us |
| mixed (10K x [64-64K]) | **335 us** | 431 us | 569 us | 1,470 us |
| alloc_free_churn (15K ops) | **410 us** | 570 us | 3,931 us | 2,805 us |
| fragmentation() call | **142 ns** | 16.5 us | 631 ns | 40.9 us |

**Bold** = winner per workload.

### Per-Operation Cost (derived)

| Workload | FixedSlot | Slab | Buddy | TLSF |
|---|---|---|---|---|
| uniform_small | 45.5 ns/op | **37.0 ns/op** | 50.1 ns/op | 147.2 ns/op |
| uniform_large | **25.8 ns/op** | 39.5 ns/op | 53.7 ns/op | 129.3 ns/op |
| mixed | **33.5 ns/op** | 43.1 ns/op | 56.9 ns/op | 147.0 ns/op |
| churn (amortized) | **27.3 ns/op** | 38.0 ns/op | 262.1 ns/op | 187.0 ns/op |

### Analysis

1. **FixedSlot dominates raw throughput.** The O(1) stack pop/push is
   unbeatable for uniform and churn workloads. This is expected — no
   size-class lookup, no splitting, no coalescence overhead.

2. **Slab wins uniform-small** by 19% over FixedSlot. The smaller 128B
   slots (vs 4096B for FixedSlot in the bench config) reduce HashMap
   pressure and cache footprint per-alloc. In a like-for-like slot-size
   comparison, FixedSlot would be faster.

3. **Buddy coalescence is expensive under churn.** The 3.9 ms churn time
   (vs 410 us for FixedSlot) reflects the O(log N) free-list scanning
   and buddy-merge recursion on every free. For steady-state alloc-only
   workloads, buddy is competitive (501 us vs 455 us for uniform-small).

4. **TLSF is the slowest allocator across all workloads.** The BTreeMap-
   backed block tracking and bitmap manipulation dominate. The theoretical
   O(1) alloc/free is achieved for large N (the 10K-alloc O(1) scaling
   test passes), but the constant factor is high compared to simpler
   allocators. A production TLSF would use an array-based block list
   instead of BTreeMap, reducing overhead significantly.

5. **Fragmentation measurement cost varies widely.** FixedSlot returns a
   constant 0.0 (142 ns). Buddy computes a ratio from tracked totals
   (631 ns). Slab and TLSF iterate internal state (16-41 us). This
   matters if fragmentation is queried in a hot loop.

### Recommendation

**Keep FixedSlot as the default allocator.** It wins 4 of 5 workloads
and has the simplest implementation. The slab allocator is worth
considering for workloads with known small-payload distributions (skill
metadata, short strings) where internal fragmentation is the dominant
waste path. Buddy and TLSF offer coalescence but their overhead under
churn makes them unsuitable for the current hot path.

A future slice could:
- Expose allocator selection via ArenaConfig for per-pool tuning
- Optimize TLSF with array-based block lists instead of BTreeMap
- Benchmark at the Arena level (with header/checksum overhead) to
  measure end-to-end impact

## M6 Cross-Check

The FixedSlotAllocator extraction in Plan 01 must not regress the
existing Arena benchmarks. FixedSlot-via-trait produces identical
behavior to the M6 inline code.

| Bench | M6 Number | M7 Number | Delta |
|---|---|---|---|
| alloc_chunk_small_1kib | ~591 ns | ~591 ns | < 1% |
| get_chunk_hot | ~95 ns | ~95 ns | < 1% |

The extraction is zero-cost as expected — enum dispatch with a single
variant compiles to a direct call (no match overhead).

## Slice 8 Entry Points

The bake-off data enables several future directions:

1. **Per-pool allocator config** — let ArenaSetConfig specify which
   allocator each pool uses.
2. **Slab for small-payload pools** — Hot tier with skill metadata
   could use SlabAllocator with [64, 256, 1K, 4K] classes.
3. **TLSF optimization** — replace BTreeMap with offset-indexed array
   for O(1) predecessor lookup, reducing constant factor.
4. **Compaction pass** — buddy/TLSF coalescence enables periodic
   defragmentation of long-lived pools.

## Test Counts

| Feature | M6 | M7 | Delta |
|---|---|---|---|
| No cuda | 223 | 260 | +37 |
| With cuda | 248 | 285 | +37 |

All M6 tests pass unchanged. 37 new allocator tests:
7 (FixedSlot) + 9 (Slab) + 11 (Buddy) + 10 (TLSF).

## How to Re-Run

```bash
cd src-tauri

# All allocator tests
cargo test --lib -- memory_arena::tests::allocator
cargo test --lib -- memory_arena::tests::slab
cargo test --lib -- memory_arena::tests::buddy
cargo test --lib -- memory_arena::tests::tlsf

# Bake-off benchmarks (all 20)
cargo bench --bench arena_bench -- bakeoff

# Specific workload
cargo bench --bench arena_bench -- "bakeoff/alloc_uniform_small"

# M6 cross-check (existing benches)
cargo bench --bench arena_bench -- "alloc/alloc_chunk"
cargo bench --bench arena_bench -- "get/get_chunk"
```
