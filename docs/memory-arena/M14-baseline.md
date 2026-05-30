# M14 Baseline — GPU Compute: Runtime-Compiled Kernels + Generic Launch + Integrity Consumption

**Date:** 2026-05-30
**Branch:** dev
**Hardware:** AMD Ryzen (Linux 6.17.0-23-generic), 64 GB RAM, NVMe, NVIDIA GeForce RTX 4060 Ti 8 GB
**Toolchain:** CUDA 12.4 (nvcc V12.4.131), `libnvrtc.so.12`, cudarc 0.19.4 (`driver` + `nvrtc`)

## Overview

M14 resumes the arena past the M9–M13 close (artemis-ii, 2026-04-10). It is the
first **GPU-compute** slice: where M6/M12/M13 built the VRAM *tier* (device
allocation, pinned staging, multi-GPU topology, launch *configuration*), M14
makes the arena a general GPU-compute substrate — arbitrary kernels, compiled
from CUDA C at runtime, launched over arena-resident VRAM chunks, with the
GPU checksum kernel finally consumed by an integrity verdict.

All M14 surface is gated behind `#[cfg(feature = "cuda")]` (the whole `vram.rs`
module is). The default (CI) build is unaffected.

**Tests:** +8 cuda-gated (`memory_arena`: **365 → 373** with `--features cuda`;
**321** with `--no-default-features`, unchanged). 0 failures, 0 new deps,
0 Cargo touches.

## D1 — NVRTC runtime CUDA-C compilation

`VramContext::compile_cuda(cuda_src, fn_name) -> ArenaResult<CudaKernel>`.

Before M14 the only way to get a `CudaKernel` was `load_ptx` /`load_ptx_file`,
which take **pre-written PTX assembly** — the single built-in kernel
(`BATCH_XOR_CHECKSUM_PTX`) is ~50 lines of hand-authored PTX. `compile_cuda`
calls `cudarc::nvrtc::compile_ptx(src)` to compile high-level CUDA C → PTX at
runtime, then reuses the existing `load_module` / `load_function` path. The
kernel entry point must be `extern "C" __global__` so the symbol is exported
un-mangled and matches `fn_name`. On failure the NVRTC compiler log is surfaced
through `ArenaError::CudaError`.

**Why it matters:** the unused half of the `nvrtc` cudarc feature is now live.
Kernels are authored as readable CUDA C, not hand-assembled PTX.

**Headline test — `nvrtc_compiled_checksum_matches_hand_ptx`:** a CUDA-C
re-expression of the batch XOR checksum is compiled via NVRTC and launched over
the same input as the hand-PTX kernel; the two outputs are asserted
**byte-for-byte identical**. Runtime compilation is provably equivalent to the
hand-authored baseline.

## D2 — Generic in-place launch over arena VRAM chunks

`VramContext::launch_inplace_u8(kernel, handle, buf, len)` +
`VramPool::apply_kernel(id, kernel)`.

The only launch path before M14 was `launch_checksum`, hardcoded to the
4-argument checksum signature. M14 adds the canonical generic shape — an
in-place transform kernel `(unsigned char* data, unsigned int len)` — and a
pool-level method that applies any such compiled kernel to an existing VRAM
chunk. The transform runs on the device; the result stays GPU-resident and is
observable via `VramPool::get`. Launch geometry is one thread per byte
(`grid = ceil(len / 256)`).

Together D1+D2 are the capability leap: **write a CUDA-C kernel → compile it at
runtime → apply it to arena VRAM chunks.** This is the arena's contribution to
the project's GAP-4 (GPU pipeline E2E) — a runnable skill-activation→GPU-dispatch
→result path now exists at the substrate layer.

**Test — `apply_kernel_transforms_chunk_in_place`:** a runtime-compiled
`increment` kernel applied to a 4-byte chunk; download confirms every byte
incremented on-device.

## D3 — `verify_checksums` consumed as an integrity verdict

`VramPool::verify_against_host(expected) -> IntegrityReport { ok, mismatches }`.

`verify_checksums()` existed since the M6/M13 integration but its output was
never compared against anything — built code with no consumer (audit S2
shelfware). M14 wires it into a verdict: run the batch checksum kernel once,
compare each chunk's GPU-computed XOR against a caller-supplied expected map,
and report any chunk whose checksum differs (or that has no expected entry) as a
mismatch. The verdict is order-independent (lookup by `ChunkId`, not position),
so it is robust to `verify_checksums`' HashMap-iteration ordering.

**Tests:** clean pool → `ok`, no mismatches; one tampered expected value →
exactly that `ChunkId` flagged; empty pool → `ok`.

## Cumulative State

| Metric | M13 close | M14 |
|--------|-----------|-----|
| Rust tests (`memory_arena`, no features) | 309¹ | 321¹ |
| Rust tests (`memory_arena`, cuda) | 341¹ | 373 |
| `vram.rs` public GPU-compute methods | `load_ptx`, `load_ptx_file`, `launch_checksum` | + `compile_cuda`, `launch_inplace_u8`, `apply_kernel`, `verify_against_host` |
| New types | — | `IntegrityReport` |
| Cargo optional deps | 4 | 4 |
| Feature flags | 2 | 2 |

¹ M13-era counts are from `M9-M13-baseline.md`; the no-features and pre-M14
cuda counts (309 / 365 at session start) reflect interim dev-line chipping
between the artemis-ii close and this slice. M14 adds exactly 8 cuda-gated
tests and 0 no-features tests.

## Forward (remaining arena threads, per session-014 roadmap)

- **M15** — wire `CgroupEnforcer` (built, unconsumed) into `ArenaSet` as an
  opt-in memory ceiling (CI-runnable; test via mock cgroup dir).
- **M16** — run `migrateJsonToArenaSet()` over the live 107 MB `.grove/arena.json`
  and prove the tier-aware `ArenaSet` as the production Grove backing store
  (needs a headless `arena_set_*` path first).
- **Follow-on (deferred this slice):** expose D3 integrity verification as a
  Tauri IPC command (`arena_set_verify_vram`) so the app can trigger it — kept
  out of M14 to avoid `lib.rs`/commands churn; the Rust-side consumer + tests
  already flip `verify_checksums` from unconsumed to living code.

## Re-run

```bash
cargo test --manifest-path src-tauri/Cargo.toml --lib --features cuda memory_arena
```
