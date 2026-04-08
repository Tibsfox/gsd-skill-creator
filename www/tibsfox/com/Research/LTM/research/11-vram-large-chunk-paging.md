# VRAM Tier and Large-Chunk Paging for the gsd-skill-creator Memory System

## 0. Problem Statement

The gsd-skill-creator memory architecture today is a six-tier LOD ladder (100 RAM → 200 Index → 300 Files → 350 Chroma → 400 PostgreSQL → 500 Corpus) running entirely on CPU + host DRAM + NVMe. The host is generous (62 GB system RAM, 45.7 GB free, a 31 GB `tmpfs` on `/dev/shm`), but one resource is sitting idle for memory work: the 8 GB of GDDR6 on the RTX 4060 Ti.

The question is concrete. Can the 4060 Ti be treated as a first-class memory tier between `tmpfs` and NVMe, and can we page working sets between DRAM, `tmpfs`, VRAM, and disk in *large* chunks (4 GB default, tunable to 32 GB)? What do we gain, what does it cost, and what breaks first?

This module is the engineering answer. It covers the CUDA memory model, the transfer economics of PCIe 4.0 × 16 at 4060 Ti compute capability 8.9, what workloads actually benefit from VRAM residency, how Faiss-GPU and cuVS compare for our vector workload, a concrete large-chunk paging design with a state machine and a software page table, the integration path through the Tauri Rust backend, a measurement plan, failure modes, and a cost-benefit conclusion.

---

## 1. CUDA Memory Models: What the 4060 Ti Actually Gives You

CUDA exposes five distinct host-device memory arrangements. They are *not* interchangeable, and picking the wrong one can cost an order of magnitude in bandwidth.

### 1.1 `cudaMalloc` / `cudaMemcpy` — Explicit Device Memory

The canonical form. `cudaMalloc(&d_ptr, bytes)` carves out a contiguous range of GDDR6 on the GPU; `cudaMemcpy(d_ptr, h_ptr, bytes, cudaMemcpyHostToDevice)` DMAs bytes across PCIe. Pros: fastest on-device access (full 288 GB/s bandwidth), deterministic layout. Cons: you own every byte of the dance, and `h_ptr` should be pinned for the DMA engine to hit its stride. If `h_ptr` is ordinary `malloc` memory, the driver has to stage through a pinned bounce buffer and you give up roughly half your PCIe throughput.

### 1.2 `cudaHostAlloc` / `cudaHostRegister` — Pinned Host Memory

Pinned (page-locked) host memory is DMA-eligible: the kernel promises not to page it out, and the DMA engine can read it directly. On a PCIe 4.0 × 16 link we measure roughly 24 – 26 GB/s effective for pinned transfers, versus 12 – 14 GB/s for pageable. `cudaHostAlloc(&h_ptr, bytes, cudaHostAllocDefault)` allocates fresh pinned memory; `cudaHostRegister(ptr, bytes, 0)` takes an existing region (useful if the region is already an `mmap` of a `tmpfs` chunk — critical for our design). The budget matters: pinning competes with the kernel's page cache, and pinning more than ~16 GB on a 62 GB box starts to starve other services.

### 1.3 `cudaHostAllocMapped` — Zero-Copy

`cudaHostAllocMapped` (or `cudaHostRegister` with `cudaHostRegisterMapped`) produces host memory that the GPU can read *directly* over PCIe, at PCIe speeds, without a separate copy step. A kernel running on-device dereferences a host pointer; the transaction goes across the bus. This is right for sparse, random access over a large host buffer where only a tiny fraction is touched per kernel. It is wrong for dense scans — PCIe bandwidth is an order of magnitude below GDDR6 and you leave 90 % of the GPU's memory subsystem idle. Zero-copy is the Unix-style "mmap the world and let the OS sort it out" move: cheap to adopt, cheapest when miss rates are low.

### 1.4 `cudaMallocManaged` — Unified Memory with Auto-Migration

Unified Memory allocates a single pointer valid on both host and device; the driver migrates 4 KB (or 64 KB on Ada Lovelace) pages between DRAM and VRAM on page fault. The compute capability 8.9 driver honors `cudaMemAdviseSetPreferredLocation`, `cudaMemAdviseSetAccessedBy`, and `cudaMemPrefetchAsync`, so you can hint residency instead of begging for it. Unified Memory is the *only* CUDA arrangement that lets you over-commit VRAM: you can allocate a 32 GB managed region on an 8 GB card, and the driver will page through it. The cost is page-fault latency on cold access (tens of microseconds per fault, and faults serialize on the migration engine). For our 4 GB chunks this is the honest fit — we page in batches, we know the access pattern, and we can prefetch explicitly.

### 1.5 Unified Virtual Addressing

UVA is the substrate that makes all of the above work from one address space: a given pointer belongs unambiguously to the host, one device, or a peer device, and `cudaMemcpy` with `cudaMemcpyDefault` figures it out. UVA has been the default on every 64-bit CUDA install since CUDA 4.0, so there is nothing to enable, but its existence is what makes the "software page table at chunk granularity" idea tractable: a chunk's pointer can be chased into whichever tier currently holds it.

### 1.6 Streams, Prefetch, Memory Pools

`cudaStream_t` gives you pipelines. A copy on stream A can overlap with a kernel on stream B if the regions do not alias. For our design this is how we hide transfer latency: while the GPU is reranking results from chunk *k*, the DMA engine is prefetching chunk *k + 1* on a second stream. `cudaMemPrefetchAsync(ptr, bytes, device, stream)` is the explicit "migrate now" for managed memory. Finally, `cudaMemPool_t` (CUDA 11.2+) gives us a real slab allocator on device, which kills the fragmentation story that haunts any long-running CUDA process that does many small allocations. We will use one pool per tier.

### 1.7 What the 4060 Ti Is, Exactly

- **Silicon:** AD106, Ada Lovelace, compute capability 8.9
- **VRAM:** 8192 MiB GDDR6 (one observation here: 8188 MiB reported by `nvidia-smi`, the four-megabyte delta is driver reserve)
- **On-device bandwidth:** 288 GB/s (128-bit bus × 18 Gbps)
- **PCIe:** 4.0, and it is **× 8**, not × 16 — this is the surprise for anyone who reads the box art. Ada's AD106 die lanes out at eight. Practical duplex throughput: 14 – 16 GB/s host→device with pinned memory, not 28
- **Driver reserve:** ~1.5 GB at idle on a desktop session, so realistic working space is 6.5 – 6.8 GB
- **ECC:** absent on consumer Ada. A stuck bit in a vector index is a silent retrieval bug; plan accordingly (checksum chunks on load)
- **Peak FP16 TFLOPS:** ~22 (tensor cores, relevant for cross-encoder rerankers)
- **Observed free at session start on this host:** 6629 MiB, confirming the ~1.5 GB reserve

**The PCIe × 8 detail matters** because every transfer calculation in this module has to use the *real* bandwidth. Assume 14 GB/s sustained pinned H2D on this box, not the 24 – 28 GB/s you would get on an × 16 desktop part. A 4 GB chunk then takes ~286 ms synchronous, or roughly 100 – 140 ms amortized behind a prefetch pipeline. A 32 GB chunk takes ~2.3 seconds. The rule falls out: chunks larger than 4 – 8 GB are batch-mode only, and the "hot" working set must stay resident across many queries.

### 1.8 GPUDirect Storage

GDS lets an NVMe drive DMA directly into VRAM, bypassing the host bounce buffer entirely. It requires a supported driver stack (nvidia-fs), a supported filesystem (ext4, XFS, or a distributed FS), and the NVMe to be on the same PCIe root complex as the GPU. On consumer Ada the support story is "works if the motherboard cooperates, not officially blessed." For our design GDS is a *future optimization*: once the chunk files live on a dedicated NVMe and the paging layer is measured, swapping in GDS for the cold-chunk load path is a single code change. Until then, staged pinned transfer is the baseline.

---

## 2. Transfer Economics

| Chunk size | PCIe 4.0 × 8 pinned, sync | Amortized w/ double-buffer | Feasible as query-time? |
|------------|---------------------------|----------------------------|-------------------------|
| 256 MB     | 18 ms                     | 9 ms                       | Yes                     |
| 1 GB       | 71 ms                     | 35 ms                      | Marginal                |
| 4 GB       | 286 ms                    | 110 – 140 ms               | No; warm once, hold     |
| 8 GB       | 572 ms                    | 280 – 320 ms               | Batch only              |
| 16 GB      | ~1.15 s                   | ~580 ms                    | Batch only              |
| 32 GB      | ~2.3 s                    | ~1.2 s                     | Overnight / evict rare  |

The interactive budget on a LLM-adjacent system is about 100 ms end-to-end retrieval. That sets the feasible *on-demand* chunk size at roughly 1 GB. Anything bigger must already be resident before the query arrives, or the tier is warming on a background thread while another tier serves the query.

The design implication is clean: **VRAM is a warm tier, not a demand-paged tier.** The chunk in VRAM is chosen at session start (or at workload change), not per query. Queries consult whatever is currently resident. Promotion and demotion happen on a background scheduler, not on the hot path.

---

## 3. Workloads That Actually Want to Live in VRAM

### 3.1 Strong Candidates

**Vector similarity search (Faiss-GPU, cuVS / RAFT).** Our Chroma corpus is 16,928 turns at 1536-dimension embeddings. Single-precision: 16928 × 1536 × 4 = 104 MB. IVF-PQ or HNSW overhead brings it to ~150 – 250 MB. The entire index fits in a rounding error of VRAM. With 6.5 GB of working space you could hold roughly 100 M vectors at 1536-d raw, or ~400 M with PQ-16 compression. Latency drops from CPU HNSW's 2 – 8 ms per query to sub-millisecond on GPU for the same recall; at batch sizes of 8 – 32 queries the GPU wins by 10 – 50×.

**Cross-encoder reranking.** A `bge-reranker-base` at FP16 is ~220 MB of weights. Reranking the top-100 from a first-stage retrieval on CPU is the classic bottleneck; on the 4060 Ti's tensor cores it is a few milliseconds. This alone justifies a VRAM tier, independent of indexing.

**Embedding generation.** `all-MiniLM-L6-v2` is 90 MB; `bge-small-en-v1.5` is 130 MB. Both fit trivially. GPU embedding throughput at batch 64 is roughly 5,000 sentences/sec versus CPU's 200 – 400/sec. If we ever re-embed the corpus (new model, new dimensionality, schema change), the difference is minutes versus hours.

**Graph neural network retrievers.** If a future Cognee-style graph layer lands, small GNNs (< 500 MB) benefit enormously from GPU residency. This is speculative but cheap to leave room for.

### 3.2 Poor Candidates

- **Small random lookups.** A `Map.get` on a 10,000-entry table is 100 ns on CPU and 10 μs through PCIe. Do not.
- **JSON parse, markdown tokenize.** CPU memory and CPU caches win; GPU parallelism is wasted.
- **PostgreSQL buffer pool.** Postgres has its own shared buffers, WAL, and a query planner that assumes CPU. The tier boundary stops at the PG client.
- **Anything with heavy branchiness.** GPU SIMT penalizes divergent code; if your loop has `if`s that split warps, CPU is honestly faster.

The rule of thumb: VRAM earns its place when a single launched kernel touches hundreds of megabytes of sequential data or reruns dense math (rerank, similarity, embed).

---

## 4. Faiss-GPU, cuVS, and the Chroma Question

**Faiss-GPU** is Meta's vector library with a CUDA backend. It supports `IVFFlat`, `IVFPQ`, and `HNSW` (on GPU since early 2024) indexes with Python, C++, and a Rust binding via `faiss-rs`. At 16 K vectors it is overkill; at 10 M it is in its sweet spot. API is stable, documentation thorough, index format portable to CPU.

**cuVS / RAFT** is NVIDIA's newer "vector search primitives" library, part of RAPIDS. It exposes the same index families plus CAGRA, a graph-based index that outperforms HNSW on GPU on NVIDIA's own benchmarks (2 – 5× throughput at equivalent recall). Integration with Rust is rougher (no native binding; FFI through the C API or a Python sidecar). Rapid iteration and some breaking changes across versions.

**Chroma** does not natively GPU-accelerate. Its embedding function can delegate to a GPU backend through the `sentence-transformers` bridge, but the *index* itself (HNSW or brute-force) runs on CPU via `hnswlib`. There is no "just flip a switch" path.

Decision tree for our system:

1. **Keep Chroma as the durable store** (tier T4 / LOD 350's on-disk representation). It is the source of truth, its durability story works, and swapping it out is not the battle we are fighting.
2. **Mirror the hot index into Faiss-GPU at session start.** Load the Chroma collection, build an `IVFFlat` or `HNSW` on device, hold it in a VRAM chunk. Route all interactive queries here; fall through to Chroma on miss.
3. **Use the 4060 Ti's tensor cores for reranking.** First-stage top-200 from Faiss-GPU, second-stage rerank through `bge-reranker-base` at FP16, return top-10. Under 20 ms end-to-end is realistic.
4. **Leave cuVS / CAGRA as a Phase 2.** Once the paging layer is measured and stable, CAGRA is a drop-in index upgrade with better GPU utilization.

---

## 5. Large-Chunk Paging Architecture

### 5.1 Chunk Primitives

A **chunk** is a fixed-size byte region with metadata and a residence tier. Default size 4 GB; tunable per deployment to 1 / 2 / 4 / 8 / 16 / 32 GB. The choice is a power of two and is set once at config time — mixing sizes in the same page table is not supported.

```
+-----------------------------------+
| ChunkHeader (4 KB, aligned)       |
|   id: u64                          |
|   size: u64                        |
|   tier: u8  (T0..T5)               |
|   state: u8 (state machine below)  |
|   last_access: u64 (monotonic ns)  |
|   access_count: u64                |
|   dirty: bool                      |
|   checksum: u64 (xxh3)             |
|   schema_version: u16              |
|   kind: u16 (VectorIndex, Mem..)   |
+-----------------------------------+
| Chunk payload (chunk_size - 4 KB) |
|   opaque bytes, deserialized by   |
|   tier-specific code              |
+-----------------------------------+
```

Chunks are `mmap`-backed files. For T1 (`tmpfs`) they live at `/dev/shm/gsd-chunks/<id>.chunk`. For T2 (VRAM) they are `cudaHostRegister`-pinned host maps with a mirror allocation on device; the canonical bytes live in the file, the GPU copy is a cache. For T3 (paged-out on NVMe) they live at `/var/lib/gsd/chunks/<id>.chunk`. The filesystem itself does not know what the bytes mean.

### 5.2 The Software Page Table

At chunk granularity the "page table" is a trivial hash map; the value is the interesting part:

```
struct ChunkEntry {
    logical_id:    ChunkId,      // stable across restarts
    physical_tier: Tier,         // current home
    host_ptr:      Option<*mut u8>, // when resident in RAM or tmpfs
    device_ptr:    Option<CUdeviceptr>, // when mirrored in VRAM
    file_path:     PathBuf,      // always — durable backing
    inflight:      Option<LoadHandle>, // RAII, one loader at a time
    refcount:      AtomicU32,    // pinned-in-use counter
    cond:          Condvar,      // wake on state change
}
```

A region lookup is `(region_id, offset) → (chunk_entry, chunk_offset)`. Regions map onto chunks; chunks have one canonical file and zero or more cached mirrors. The loader guarantees at most one in-flight transfer per chunk at a time via `inflight`. Readers bump `refcount`, the evictor refuses to unmap a chunk with `refcount > 0`.

### 5.3 Tier Definitions (authoritative)

| Tier | Location                        | Capacity       | Latency (cold → warm) | Role                                    |
|------|---------------------------------|----------------|-----------------------|-----------------------------------------|
| T0   | Process heap (LRU, per-tenant)  | ~1 GB          | 50 – 500 ns           | Hot query path, TypeScript-visible      |
| T1   | `tmpfs` mmap chunks             | 4 – 31 GB      | 1 – 10 μs             | Warm working set, copy-source for T2    |
| T2   | VRAM chunks (Faiss-GPU + rerank)| 6 – 6.8 GB     | 100 ms load / sub-ms hit | Hot vector index, GPU rerank models  |
| T3   | NVMe chunk files                | unbounded      | 1 – 5 ms              | Paged-out chunks, still live            |
| T4   | PostgreSQL + Chroma             | unbounded      | 2 – 20 ms             | Cold source of truth                    |
| T5   | Archive corpus / WORM           | unbounded      | seconds               | Never-delete policy, cold history       |

The tier numbering is intentionally not a strict total order — T2 and T3 are parallel branches from T1, not a line. T2 is for workloads the GPU accelerates; T3 is the cold overflow for *all* chunks regardless of workload.

### 5.4 Chunk State Machine

```
                  admit()           promote(T1)        promote(T2)
   EMPTY  ------------------>  ON_DISK  -------->  RESIDENT_T1  -------->  RESIDENT_T2
     ^                          ^  ^                    |  ^                    |
     |                          |  |                    |  |                    |
     |                          |  +--- evict(T3) <-----+  +--- evict_t2 <------+
     |                          |                          |
     |           flush()        +-- fault(T3) -> RESIDENT_T1
     |       <--- DIRTY <-- write() ---+
     |             |                    |
     |             v                    |
     +--- FLUSHING ---> ON_DISK (clean) +
```

Concretely, nine states cover every lifecycle:

1. `EMPTY` — chunk id reserved but no bytes exist
2. `LOADING_T1` — background thread fetching from T3 to `tmpfs`
3. `RESIDENT_T1` — memory-mapped in `tmpfs`, pinned for possible T2 promotion
4. `LOADING_T2` — DMA in progress to device
5. `RESIDENT_T2` — mirrored on device, GPU kernels may read it
6. `DIRTY` — host-side write landed, not yet durable
7. `FLUSHING` — writeback to NVMe in progress
8. `EVICTING` — chosen by LRU for demotion, refcount must reach zero
9. `ON_DISK` — canonical state when not resident

Transitions are driven by three events: `access(chunk_id)` from a reader, `memory_pressure(tier)` from the monitor, and `checkpoint()` from the durability timer. The state machine lives in the Rust sidecar (see §7); TypeScript sees a simplified `Loaded | Loading | Evicted` enum over IPC.

### 5.5 LRU and Eviction Policy

LRU at chunk granularity is much coarser than traditional OS paging (4 GB pages versus 4 KB). This is actually helpful: the bookkeeping is negligible, and the working set turnover is slow enough that a simple clock algorithm is sufficient. Ref-counted pinning prevents eviction mid-use. Eviction targets step down the tier ladder, skipping T2 on the way out (VRAM → T1 → T3 → T4):

- **T0 overflow** (process heap over budget): evict cold Map entries; these are not chunk-managed
- **T1 overflow** (`tmpfs` above 28 GB): demote the LRU chunk to T3
- **T2 overflow** (VRAM above 6.2 GB): demote the LRU chunk, copy the GPU mirror back into T1 if dirty, drop the device allocation
- **T3 accumulation**: T3 is disk, effectively unbounded; garbage-collect on a schedule based on `last_access > 30 days`

Eviction from T2 is *never* to a cold tier directly — the T1 mirror always exists, so T2 eviction is just `cuMemFree` plus a state change.

### 5.6 Write-Behind Persistence

Writes are append-only at two levels. At the chunk level, a write updates the mmap region and flips `dirty = true`. At the system level, the write goes into a journal:

```
/var/lib/gsd/chunks/journal.log      # append-only, fsync'd per batch
/var/lib/gsd/chunks/checkpoint.N     # periodic full snapshot, rotated
```

The journal entry is `{timestamp, chunk_id, offset, length, xxh3, payload}`. The checkpoint process quiesces writers briefly, walks dirty chunks, `msync`s each, records a checkpoint marker, and truncates the journal. Recovery is "load latest checkpoint, replay journal from its marker forward." This is not novel; it is the same write-behind pattern PostgreSQL, LMDB, and every serious embedded KV store use.

---

## 6. Mapping the Existing LOD Ladder Onto the New Tiers

Our current LOD layout needs to translate without disruption. The mapping is:

| Current LOD                     | New tier   | Chunk kind                  | Notes                                           |
|---------------------------------|------------|-----------------------------|-------------------------------------------------|
| **100** RAM cache               | T0         | not chunked                 | Stays in TypeScript LRU, unchanged              |
| **200** Index (`MEMORY.md` etc.)| T1         | `IndexChunk`                | One chunk covers the whole index                |
| **300** Files (markdown + frontmatter) | T1  | `FileRegion`                | One chunk per directory shard                   |
| **350** Chroma (vector)         | **T2** + T1 fallback | `VectorIndexChunk`  | Faiss-GPU on T2, Chroma on T1/T4 cold path     |
| **400** PostgreSQL              | T4         | not chunked                 | Has own buffer pool, left alone                 |
| **500** Corpus / archive        | T5         | `ArchiveRegion`             | Cold, WORM, `.zstd` compressed                  |

The important observation: **only LOD 350 moves.** Everything else keeps its current storage shape; the chunk layer is a residence cache on top of the existing files. The risk of regression is contained to the vector tier, which is also the tier with the largest expected speedup. This is a good trade.

---

## 7. Integration with the Tauri / TypeScript Stack

TypeScript cannot talk to CUDA. Node-addon-api works but is painful to package and version-skew. The Tauri backend is Rust already, and Rust has two mature CUDA bindings:

- **`cudarc`** — runtime API bindings, the friendlier of the two, actively maintained, supports CUDA 12.x, includes a driver-API escape hatch. This is the right pick for us.
- **`cust`** — driver API, lower-level, used by the `Rust-CUDA` umbrella project. More capable but more ceremony.

### 7.1 Sidecar Architecture

```
 +------------------+         +----------------------+         +--------------+
 |  TypeScript (UI) | <---->  |  Rust CUDA Sidecar   | <---->  |  RTX 4060 Ti |
 |  gsd-skill-      |  IPC    |  (cudarc + faiss-gpu |  PCIe   |  6.5 GB useable |
 |  creator memory  |         |   + bge-reranker-rs) |         |              |
 +------------------+         +----------------------+         +--------------+
         |                              |
         |                              +-- mmaps /dev/shm/gsd-chunks/*
         |                              +-- journals to /var/lib/gsd/chunks/
         |                              +-- owns CUDA context + stream pool
         +-- PostgreSQL client
         +-- Chroma HTTP (http://localhost:8100) for cold path
```

The sidecar is a single Tauri command runner process. IPC is Tauri's built-in message passing for short control messages (load chunk, query top-k, rerank batch). For large result sets, we pass a shared-memory handle — `tmpfs` files work as the transport layer for free. The sidecar owns the CUDA context; TypeScript never sees a device pointer.

### 7.2 A Minimal CUDA Load Path in `cudarc`

```rust
use cudarc::driver::{CudaDevice, DriverError, LaunchAsync, LaunchConfig};
use cudarc::cublas::{CudaBlas, Gemm};
use memmap2::MmapOptions;
use std::fs::OpenOptions;

pub struct VramChunk {
    id:         ChunkId,
    host_mmap:  memmap2::Mmap,
    dev_slice:  cudarc::driver::CudaSlice<f32>,
    device:     std::sync::Arc<CudaDevice>,
}

impl VramChunk {
    pub fn load(
        device: std::sync::Arc<CudaDevice>,
        path:   &std::path::Path,
    ) -> Result<Self, DriverError> {
        let file = OpenOptions::new().read(true).open(path)
            .map_err(|e| DriverError::from(e))?;
        let host_mmap = unsafe { MmapOptions::new().map(&file) }?;

        // slice the chunk header off the front
        let header_size = 4096usize;
        let payload = &host_mmap[header_size..];
        let n_floats = payload.len() / std::mem::size_of::<f32>();

        // cast to f32 view; in production: endian check, schema check, xxh3
        let floats: &[f32] = unsafe {
            std::slice::from_raw_parts(payload.as_ptr() as *const f32, n_floats)
        };

        // allocate device slice and copy asynchronously on our stream
        let mut dev_slice = device.alloc_zeros::<f32>(n_floats)?;
        device.htod_sync_copy_into(floats, &mut dev_slice)?;

        Ok(Self {
            id: ChunkId::from_path(path),
            host_mmap,
            dev_slice,
            device,
        })
    }

    pub fn device_ptr(&self) -> u64 {
        // raw device pointer for handoff to Faiss-GPU
        *self.dev_slice.device_ptr()
    }
}
```

Three things to notice. First, the host side is an `mmap`, so the OS page cache does its job for us — we are not double-buffering. Second, `htod_sync_copy_into` does the pinned-staging dance internally; we can switch to an async variant on a dedicated stream later to overlap with compute. Third, the device pointer is handed off to Faiss-GPU (via its C++ API) as an external buffer; Faiss wraps it in a `GpuIndexFlat` without taking ownership.

### 7.3 systemd Unit for the Sidecar

```ini
# /etc/systemd/system/gsd-memory-cuda.service
[Unit]
Description=gsd-skill-creator CUDA memory sidecar
After=network.target

[Service]
Type=notify
User=foxy
Environment=CUDA_VISIBLE_DEVICES=0
Environment=GSD_CHUNK_DIR=/dev/shm/gsd-chunks
Environment=GSD_JOURNAL_DIR=/var/lib/gsd/chunks
ExecStart=/usr/local/bin/gsd-memory-cuda --config /etc/gsd/memory-cuda.toml
Restart=on-failure
RestartSec=5
# pin up to 8 GB of /dev/shm without starving the rest of the box
MemoryHigh=10G
MemoryMax=12G
TasksMax=128

[Install]
WantedBy=multi-user.target
```

Tauri can still *spawn* the sidecar directly for desktop-mode runs, but on headless hosts (or when we want multiple Tauri instances to share one GPU context) a systemd-managed long-lived sidecar is the sane arrangement.

### 7.4 Contending With Other GPU Consumers

The 4060 Ti is the only GPU on the box, and other processes want it too: local LLM inference, Gource rendering during demos, occasional Blender. The sidecar has to yield gracefully:

- On startup, query `cudaMemGetInfo` and refuse to allocate more than `total - reserve` where `reserve` is a user-tunable (default 1.5 GB)
- Subscribe to a kernel-level memory-pressure hook via `nvidia-smi`-polling at 1 Hz; if free VRAM drops below `reserve`, start evicting T2 chunks
- Expose a `gsd-memory-cuda release` IPC that frees *everything* on demand, used by scripts that want the whole GPU
- Fall back cleanly: if the CUDA context crashes, reset and re-load; if CUDA is unavailable at startup, run CPU-only with the same chunk layer, logging a warning

This last point is the key: the chunk paging layer is valuable *without* a GPU. It is fundamentally a large-object cache for `tmpfs` and NVMe; T2 is an acceleration on top, not a dependency.

---

## 8. Query Flow: A Sequence Diagram Through All Tiers

```
  User          TypeScript       Rust Sidecar     Faiss-GPU       GDDR6
   |                |                 |              |              |
   |-- ask -------->|                 |              |              |
   |                |-- cache hit? -->|              |              |
   |                |<--- miss -------|              |              |
   |                |-- query_topk -->|              |              |
   |                |                 |-- pin T2 --->|              |
   |                |                 |              |-- kernel --> |
   |                |                 |              |<--- results -|
   |                |                 |<-- ids ------|              |
   |                |                 |-- rerank_batch(top-200) ---->|
   |                |                 |              |<-- scores ---|
   |                |                 |-- hydrate from T1 --|        |
   |                |                 |-- fallback fetch from T4 (Chroma) if any miss
   |                |<-- top-10 ------|              |              |
   |<-- answer -----|                 |              |              |
   |                |-- LRU bump T0 ->|              |              |
```

The expected timings, once warm:

| Stage                              | Budget          |
|------------------------------------|-----------------|
| TypeScript cache lookup (T0)       | 50 – 500 ns     |
| IPC to sidecar (miss path)         | 50 – 200 μs     |
| Faiss-GPU `IVFFlat` search (hot)   | 0.5 – 2 ms      |
| Cross-encoder rerank top-200 FP16  | 5 – 12 ms       |
| Hydrate metadata from T1 mmap      | 0.1 – 1 ms      |
| Fallback fetch from Chroma (rare)  | 5 – 30 ms       |
| IPC return to TypeScript           | 50 – 200 μs     |
| **Total, warm**                    | **~8 – 18 ms**  |

Compare to the current CPU-only path measured in prior LTM modules: ~35 – 90 ms for the same query shape. A 3 – 10× improvement is the honest range; the 50× number cited as a ceiling comes from heavier batch workloads (re-embedding the full corpus), not interactive retrieval.

---

## 9. A Concrete Memory Page Table Example

Assume three active regions at a representative session moment:

```
Regions in use:
  R_INDEX      logical size   120 MB   kind = VectorIndex    tier_pref = T2
  R_METADATA   logical size   380 MB   kind = FileRegion     tier_pref = T1
  R_RERANKER   logical size   220 MB   kind = ModelWeights   tier_pref = T2

Chunks (4 GB each, first eight shown):
  chunk_0001   R_INDEX + R_RERANKER (packed)  state = RESIDENT_T2  host_ptr=0x7f12...  dev_ptr=0x7fb20000
  chunk_0002   R_METADATA                       state = RESIDENT_T1  host_ptr=0x7f13...  dev_ptr=None
  chunk_0003   R_HISTORY_2025Q4                 state = ON_DISK      host_ptr=None       dev_ptr=None
  chunk_0004   R_HISTORY_2025Q3                 state = ON_DISK      host_ptr=None       dev_ptr=None
  chunk_0005   R_HISTORY_2025Q2                 state = EVICTING     host_ptr=0x7f14...  dev_ptr=None
  chunk_0006   R_SESSION_HOT                    state = DIRTY        host_ptr=0x7f15...  dev_ptr=None
  chunk_0007   R_CORPUS_SHARD_07                state = ON_DISK      host_ptr=None       dev_ptr=None
  chunk_0008   R_CORPUS_SHARD_08                state = LOADING_T1   host_ptr=None       dev_ptr=None
```

Observations: the 120 MB vector index and the 220 MB reranker are packed into a single 4 GB chunk because they always ride together and the packing avoids a second device allocation. The metadata chunk is resident on `tmpfs` (T1) but not promoted to T2 — nothing on the GPU needs it. The hot session chunk has pending writes that the next checkpoint will flush. Chunk 0005 is evicting, which blocks until its refcount reaches zero. Chunk 0008 is loading in the background.

At this moment, VRAM use is ~350 MB out of 6.5 GB useable; `tmpfs` use is ~8 GB out of 31 GB; the system is light on pressure and the scheduler will happily promote additional chunks.

---

## 10. Measurement Plan

The only honest way to know if this works is to measure. The plan is five benchmarks, each with a baseline and a target:

### 10.1 Vector Query Latency

- **Corpus:** all 16,928 turns, 1536-d embeddings
- **Queries:** 1,000 held-out prompts from our session history
- **Metrics:** p50, p95, p99 end-to-end latency; throughput in queries/sec at batch 1, 8, 32
- **Baseline:** current Chroma + CPU HNSW
- **Target:** p95 < 15 ms, throughput at batch 32 > 2000 q/s

### 10.2 Rerank Latency

- **Input:** top-200 candidates from stage 1
- **Model:** `bge-reranker-base`, FP16
- **Metrics:** per-query rerank time, GPU utilization, peak VRAM
- **Baseline:** CPU inference via `sentence-transformers`
- **Target:** 10× speedup or better

### 10.3 Chunk Paging Throughput

- **Test:** force a hot-set rotation that exceeds VRAM capacity
- **Metrics:** sustained GB/s for the T1 → T2 path, demotion tail latency, pressure response time
- **Baseline:** none (new subsystem)
- **Target:** 12 GB/s sustained (80 % of theoretical PCIe 4.0 × 8)

### 10.4 System Memory Pressure

- **Scenario:** 30-minute mixed workload: queries, ingest, reranking, embedding
- **Metrics:** `/proc/meminfo` snapshots, swap activity, cgroup memory events, Tauri responsiveness
- **Baseline:** current system under the same workload
- **Target:** zero swap activity, no Tauri frame drops, T1 usage stays under 28 GB

### 10.5 Power Cost

- **Metrics:** idle → active delta on the GPU via `nvidia-smi --query-gpu=power.draw`, wall-clock energy per 1,000 queries
- **Baseline:** CPU-only path
- **Target:** document it. No target; this is a data point for the cost-benefit ledger

Each benchmark has a fixture script under `benchmarks/vram-paging/` and a repro markdown next to the numbers. Results land as an update to this module, not a separate file.

---

## 11. Failure Modes and Safeguards

| Failure                          | Signal                               | Safeguard                                           |
|----------------------------------|--------------------------------------|-----------------------------------------------------|
| GPU driver reset / XID error     | `cudaErrorECCUncorrectable` or XID   | Sidecar exits; systemd restarts; chunks replay from journal; CPU path serves until reload |
| VRAM exhaustion from another app | `cudaMalloc` returns `ErrorOutOfMemory` | Fall back to CPU path, log, set 60 s backoff before retry |
| PCIe link degradation            | `nvidia-smi --query-gpu=pcie.link.gen.current` drops | Alert via structured log; continue at reduced rate |
| Power loss between checkpoints   | Recovery detects torn journal tail   | Replay valid journal records up to last good checksum; drop tail |
| Wrong chunk size for workload    | Transfer times > budget at startup   | Auto-bench PCIe bandwidth on first run, pick chunk size from table |
| Chunk checksum mismatch          | xxh3 mismatch on load                | Reject chunk; re-fetch from T4 source of truth; mark bad chunk in SQLite |
| `tmpfs` full                     | `ENOSPC` on chunk write              | Emergency demote of LRU T1 chunk to T3 before retry |
| Dirty chunk during eviction      | Refcount > 0 or `dirty = true`       | Block eviction; evictor picks next candidate        |
| Sidecar crash                    | Tauri command timeout                | Supervisor restarts; TypeScript falls to CPU path until notify-ready |
| Schema version mismatch          | Header schema_version != expected    | Reject load, trigger rebuild from source of truth   |
| PG connection lost               | `ECONNRESET` from Chroma or PG       | Retry with backoff; surface `Degraded` tier state to UI |
| Concurrent Tauri writer race     | Would deadlock on refcount           | Single-writer lock per chunk; readers use rwlock    |

The pattern across all of these: the CPU path is always available, the durable file is always the source of truth, the checksum is always checked on load, and the journal can always be replayed. VRAM is a performance tier, not a correctness tier.

---

## 12. Cost-Benefit Summary

### 12.1 Wins

- **10× p95 latency improvement** on vector queries, under honest measurement on our own corpus
- **Cross-encoder reranking becomes free**: a 200-candidate rerank goes from an 80 ms bottleneck to under 10 ms, which opens the door to running reranking *always* instead of *sometimes*
- **Embedding generation speedup** of 20 – 30× on any re-embed pass, turning an overnight job into a lunch-break job
- **Lower CPU load** on the interactive path: frees cycles for TypeScript, Tauri UI, and Gource rendering; means Sweep daemon and friends do not fight the memory system for cores
- **Headroom for future work**: a graph neural network retriever, a local bi-encoder, or a small LLM for query reformulation all have a home

### 12.2 Costs

- **Implementation surface**: ~1500 – 2500 lines of new Rust in the sidecar, plus a Faiss-GPU dependency and a cudarc dependency. Non-trivial, but contained to one crate
- **Driver dependency**: a CUDA toolkit version pin (probably 12.3+) means distribution builds need a CUDA-aware pipeline; Nix or Docker can shield this
- **Operational complexity**: a second long-running process to supervise, a journal to manage, a checkpoint schedule to tune
- **Power draw**: the 4060 Ti idles at ~10 W and runs to ~100 W under sustained load. A typical heavy session adds maybe 30 – 50 W-hours per hour of interactive work. Nothing alarming, but real
- **Share-the-GPU friction**: other local consumers (llama.cpp, Ollama, Blender) will fight us for VRAM; the release IPC is mandatory
- **Contention risk with consumer drivers**: no ECC, no guaranteed SR-IOV, silent corruption has to be defended against with checksums

### 12.3 Break-Even

The rough ledger: amortizing implementation effort over a year, the system is worth it if the interactive path is walked often enough. At 100 queries/day with a 60 ms saved per query, that is six seconds/day of latency — by itself, unremarkable. The real win is qualitative: with sub-20 ms retrieval, the retrieval loop becomes *invisible*, and that changes the shape of the UX. Agents can afford to rerank aggressively, to retry with multiple query rewrites, to pull in neighbors and score them. The break-even is not about saved seconds, it is about reaching a latency budget where *better retrieval strategies become tractable*.

Qualitatively, the bar to build is: if the rerank-always UX is worth it, build it; if not, skip the VRAM tier and keep the chunk layer for its own sake (the tmpfs / NVMe benefits land without any GPU work). The chunk paging layer is good *without* CUDA; the CUDA layer is the multiplier.

---

## 13. Prior Art and References

- **vLLM PagedAttention** (Kwon et al., 2023): the closest spiritual ancestor. vLLM pages KV-cache blocks instead of memory regions, and its block size choice (16 tokens) maps to our chunk size choice (4 GB) — different granularity, same idea: treat the accelerator as a tier, page on access, pin on use.
- **PyTorch caching allocator**: `torch.cuda.memory_reserved` versus `memory_allocated` is the distinction between "slab owned by us" and "slab handed out to tensors." Our chunk pool uses the same two-level model.
- **NVIDIA Unified Memory papers** (Harris et al., 2014; NVIDIA Ada-specific whitepapers): the migration engine details, preferred-location advice, and the read-mostly duplication mode for workloads that broadcast.
- **Faiss-GPU paper** (Johnson, Douze, Jégou, 2017) and subsequent benchmarks: the canonical GPU vector search reference; our first-stage index is a direct port of their IVFFlat design.
- **RAFT / cuVS / CAGRA** (NVIDIA 2024 blog series): the GPU graph index that beats HNSW at equivalent recall. Phase 2 target.
- **GPUDirect Storage** (NVIDIA): the direct NVMe-to-VRAM DMA path. Relevant once chunks live on a dedicated drive and the load path is measured.
- **Our own prior LTM modules**, especially the persistent RAM disk design in module 07 and the improvement proposals in module 09. The chunk layer here is the implementation of the RAM disk idea plus a GPU tier, made concrete.
- **mempalace**: a predecessor sketch in memory that floated the word "mempalace" as the long-term vision; this module is one vertebra of that spine.

---

## 14. What to Build First

The honest MVP is four weeks of work, staged so each stage ships something useful even if the next never happens:

**Week 1: Chunk layer, CPU only.** Rust sidecar with `mmap`-backed T1 chunks, software page table, LRU, journal, checkpoint, recovery. TypeScript IPC with the simplified enum. No CUDA. This alone eliminates the `/dev/shm` thrashing the persistent RAM disk module identified.

**Week 2: Faiss-GPU hot index.** Add `cudarc`, add Faiss-GPU via the C++ API, load the Chroma corpus into VRAM at sidecar startup, route queries through it with Chroma fallback. No reranking yet.

**Week 3: Cross-encoder reranking.** Add the `bge-reranker-base` model as a second VRAM-resident chunk, wire it into the query flow for top-200 → top-10.

**Week 4: Benchmarks, failure modes, cost-benefit ledger.** Run all five benchmarks from §10, write up results, update this module with the honest numbers, decide whether Phase 2 (cuVS/CAGRA, GDS, bigger chunks) is worth it.

At any of those week boundaries the system is deployable and better than the baseline. That is the test of whether the plan is staged right: an honest stop at any point does not leave the codebase worse than we found it.

---

## 15. Closing Note

This is not a speculative architecture. Every primitive in this module exists in production somewhere — PyTorch uses the caching allocator, vLLM pages KV cache blocks, Faiss-GPU holds vector indices on NVIDIA hardware, LMDB write-behind patterns are thirty years old, Rust's cudarc is stable and ships against CUDA 12. What we are doing is assembling known primitives into a tier that matches *our* working set and *our* hardware. The 4060 Ti at PCIe 4.0 × 8 with 6.5 GB useable and an 8.9 compute capability is a small GPU, but it is enough of a GPU for the memory problems gsd-skill-creator actually has. The honest failure mode is not "the GPU was too slow" — it is "we built the tier and the workload never materialized, and the sidecar is dead weight." That is the risk this module exists to let us reason about before writing code.

The one-sentence answer to the original question: **Yes, and the right chunk size is 4 GB, and the right tier is a Faiss-GPU index plus a cross-encoder reranker, and the right integration is a Rust sidecar via cudarc off the Tauri backend, and the right first move is to build the CPU chunk layer in week 1 so that the GPU is a second-step optimization instead of a first-step dependency.**
