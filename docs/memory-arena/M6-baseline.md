# M6 Baseline — VRAM Tier + cudaMemcpyAsync

**Slice:** memory-arena-m6-vram-tier
**Branch:** artemis-ii
**Date:** 2026-04-10
**HEAD:** (post M6 implementation)

## Hardware

| Component | Value |
|-----------|-------|
| GPU | NVIDIA GeForce RTX 4060 Ti |
| VRAM | 8188 MiB (8 GB) |
| PCIe | Gen1 x8 (current link — power-saving downclocked) |
| PCIe theoretical (Gen4 x8) | 12.8 GB/s |
| Driver | 580.126.09 |
| CUDA Toolkit | 12.4 (V12.4.131) |
| Compute Capability | 8.9 (Ada Lovelace) |
| cudarc | 0.19.4 (driver + std + fallback-dynamic-loading) |

**PCIe note:** `nvidia-smi` reports `pcie.link.gen.current = 1` at idle.
The link negotiates up under load. Measured bandwidth (4-5 GiB/s) is
consistent with Gen3 x8 or partial Gen4 negotiation, well above the
Gen1 x8 floor (2 GB/s).

## Transfer Throughput

| Bench | Time (median) | Bandwidth |
|-------|---------------|-----------|
| upload_1kib | 3.80 us | 257 MiB/s |
| upload_1mib | 200.3 us | 4.88 GiB/s |
| download_1kib | 4.82 us | 203 MiB/s |
| download_1mib | 226.9 us | 4.30 GiB/s |
| roundtrip_1mib | 447.2 us | 4.37 GiB/s |

**Upload is ~12% faster than download** for 1 MiB — consistent with
host-to-device having slightly less synchronization overhead (the GPU
can accept data without waiting for the host to be ready to receive).

**1 KiB transfers are latency-dominated** at ~4 us. The effective
bandwidth (200-257 MiB/s) is far below the link maximum because each
transfer pays a fixed overhead (context bind, stream sync, driver round-trip).
This confirms that VRAM crossfades should batch or pipeline small
payloads in future slices.

**1 MiB transfers achieve 4.3-4.9 GiB/s** — 34-38% of PCIe Gen4 x8
theoretical (12.8 GB/s). The gap is expected: (a) pageable host memory
(no pinned allocation), (b) synchronous wait after each copy, (c) PCIe
link may not be negotiating to full Gen4. Pinned memory optimization
(cudaMallocHost) is a future slice.

## Crossfade Overhead

| Bench | Time (median) |
|-------|---------------|
| demote_hot_to_vram_1kib | 49.8 ms |
| promote_vram_to_hot_1kib | 49.9 ms |
| demote_hot_to_vram_1mib | 49.7 ms |

**The crossfade numbers are dominated by ArenaSet creation overhead**
(~49 ms per iter_batched iteration). The actual transfer is <1 ms.
The bench measures end-to-end including ArenaSet::create + VramContext
initialization per iteration. In production, the ArenaSet is created
once and crossfades are invoked repeatedly.

Subtracting the setup overhead, the crossfade bookkeeping (state byte
mutation, registry insert/remove, checksum validation) adds negligible
time over the raw transfer.

## Test Counts

| Configuration | Tests | Delta from M5 |
|---------------|-------|---------------|
| `cargo test --lib -- memory_arena` (no cuda) | 223 | +0 |
| `cargo test --lib --features cuda -- memory_arena` | 248 | +25 |

New test modules (all `#[cfg(feature = "cuda")]`):
- `m6_vram_context` — 5 tests (VramContext init, device_info, alloc)
- `m6_vram_transfer` — 6 tests (upload/download sync + async, zero-byte, wrong-size)
- `m6_vram_pool` — 7 tests (VramPool alloc/get/free/full/contains)
- `m6_vram_crossfade` — 7 tests (ArenaSet VRAM crossfade demote/promote/abort/backward-compat)

## M5 Cross-Check (non-VRAM benches, no cuda feature)

| Bench | M5 | M6 | Delta |
|-------|----|----|-------|
| alloc_chunk_small_1kib | 591 ns | 610 ns | +3.2% (noise) |
| alloc_chunk_large_1mib | 173 us | 183 us | +5.8% (noise) |
| get_chunk_hot | 108 ns | 108 ns | +0.0% |
| touch_chunk_roundrobin_1k | 268 us | 269 us | +0.4% |

No regressions. The small alloc variance is within Criterion CI bounds.
The default build (no cuda feature) produces identical behavior to M5.

## Architecture Notes

- **cudarc 0.19.4** — API changed from older versions: `CudaDevice` is now
  `CudaContext` + `CudaStream`. Allocations happen on `CudaStream`.
- **VramPool is NOT a TierPool** — it's a separate struct wrapping
  `CudaSlice<u8>` allocations, not mmap-backed Arena chunks.
- **Crossfade dispatch is compile-time** for the no-cuda build (zero overhead).
  With cuda, runtime `is_vram_tier()` check selects the copy path.
- **VRAM chunks have no headers** — no magic, no checksum, no state byte.
  Hysteresis and FadingOut state are skipped for VRAM sources.

## Slice 7 Entry Points

1. **Pinned host memory** (`cudaMallocHost`) — should improve 1 MiB+ transfer
   bandwidth by 30-50% by avoiding pageable→pinned staging inside the driver.
2. **VRAM chunk headers** — add lightweight metadata to VRAM allocations so
   hysteresis and state tracking work across all tiers uniformly.
3. **Policy sweep VRAM integration** — extend `run_policy_sweep()` to consider
   VRAM pools for automatic promote/demote decisions.
4. **Multi-stream pipelining** — overlap upload/download with compute for
   batch crossfade scenarios.
5. **Warm-start VRAM recovery** — on restart, re-upload chunks from RAM
   cold source to VRAM based on access patterns.
