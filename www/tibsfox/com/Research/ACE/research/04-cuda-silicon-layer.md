# CUDA Kernels -- Silicon Layer Architecture

> **Domain:** Compute Engine Layer 4
> **Module:** 4 -- The Silicon Layer
> **Through-line:** *A CUDA kernel does not try to do everything on every thread -- it identifies the specialized execution path and runs it thousands of times in parallel.* The thread hierarchy, memory model, and tile programming abstractions of modern GPU computing embody the same Amiga Principle that drives the entire compute engine: specialized execution paths, faithfully iterated, produce outcomes that general-purpose brute force cannot.

---

## Table of Contents

1. [Thread Hierarchy Fundamentals](#1-thread-hierarchy-fundamentals)
2. [The SIMT Execution Model](#2-the-simt-execution-model)
3. [Memory Hierarchy](#3-memory-hierarchy)
4. [Occupancy and Throughput Optimization](#4-occupancy-and-throughput-optimization)
5. [CUDA 13.x -- cuTile Tile-Based Programming](#5-cuda-13x----cutile-tile-based-programming)
6. [cuTile Python Interface](#6-cutile-python-interface)
7. [cuda.compute Python API](#7-cudacompute-python-api)
8. [PTX and NVVM Intermediate Representation](#8-ptx-and-nvvm-intermediate-representation)
9. [GSD Silicon Layer Mapping](#9-gsd-silicon-layer-mapping)
10. [LoRA Adapter Compilation Path](#10-lora-adapter-compilation-path)
11. [Dual RTX 5090 Configuration](#11-dual-rtx-5090-configuration)
12. [Cooling Strategy for PNW Operation](#12-cooling-strategy-for-pnw-operation)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. Thread Hierarchy Fundamentals

CUDA organizes computation hierarchically [1]. A **kernel** is a function marked `__global__` that executes on the GPU across many threads simultaneously. The hierarchy is:

```
CUDA THREAD HIERARCHY
================================================================

  ┌─────────────────────────────────────────────┐
  │ GRID (all blocks for one kernel launch)     │
  │   Dimensions: 1D / 2D / 3D                 │
  │                                             │
  │  ┌──────────────────────┐  ┌─────────────┐ │
  │  │ BLOCK 0              │  │ BLOCK 1     │ │
  │  │  ┌────┐ ┌────┐      │  │  ...        │ │
  │  │  │Warp│ │Warp│ ...  │  │             │ │
  │  │  │ 0  │ │ 1  │      │  │             │ │
  │  │  │32  │ │32  │      │  │             │ │
  │  │  │thds│ │thds│      │  │             │ │
  │  │  └────┘ └────┘      │  │             │ │
  │  │  Shared Memory       │  │             │ │
  │  │  L1 Cache            │  │             │ │
  │  └──────────────────────┘  └─────────────┘ │
  │                                             │
  │  ┌──────────────────────┐  ┌─────────────┐ │
  │  │ BLOCK 2              │  │ BLOCK N-1   │ │
  │  │  ...                 │  │  ...        │ │
  │  └──────────────────────┘  └─────────────┘ │
  └─────────────────────────────────────────────┘
```

### Hierarchy Levels

- **Thread:** Lowest abstraction unit; executes kernel code; has `threadIdx.x/y/z` position within its block
- **Warp:** 32 threads executing in lockstep (SIMT model); warp divergence kills performance
- **Block:** Group of threads (multiple of 32, typically 256); share **shared memory** and **L1 cache**; run on a single SM
- **Grid:** All blocks for a kernel launch; can be 1D/2D/3D
- **Cluster (CUDA 11.2+):** Group of up to 8 thread blocks sharing distributed shared memory; portable cluster size [2]

### SM (Streaming Multiprocessor) Contents

Each SM contains: CUDA Cores (integer/float arithmetic), Special Function Units (transcendentals: sin, cos, exp), Warp Schedulers, Register File, Shared Memory/L1 Cache, and Tensor Cores (newer architectures for matrix operations) [1].

---

## 2. The SIMT Execution Model

SIMT (Single Instruction, Multiple Threads) is NVIDIA's execution model [1]. Unlike SIMD (where a single instruction operates on multiple data elements in a single wide register), SIMT allows individual threads to have independent execution state while still executing in lockstep at the warp level.

### Warp Execution

All 32 threads in a warp execute the same instruction simultaneously. When threads within a warp take different branches (divergence), the warp serializes -- both paths execute, with threads that don't match the current path masked off [3].

```
WARP DIVERGENCE EXAMPLE
================================================================

  Thread 0-15:  if (tid < 16)    Thread 16-31: else
  ─────────────────────────────────────────────
  Pass 1:   [ACTIVE] [ACTIVE]... [MASKED] [MASKED]...
            Execute "if" branch

  Pass 2:   [MASKED] [MASKED]... [ACTIVE] [ACTIVE]...
            Execute "else" branch

  Result: 2x execution time for divergent warps
```

### Performance Implications

- **Avoid warp divergence:** Structure conditionals so that all threads in a warp take the same path
- **32-thread alignment:** Use block sizes that are multiples of 32 (warp size)
- **Coalesced memory access:** Adjacent threads should access adjacent memory addresses for full bandwidth utilization [3]

> **SAFETY WARNING:** Warp divergence in safety-critical CUDA kernels can cause non-obvious performance degradation. In real-time systems, this can cause deadline misses. All kernel branches must be analyzed for divergence patterns.

---

## 3. Memory Hierarchy

The GPU memory hierarchy determines kernel performance more than any other factor [1]:

| Memory Type | Scope | Latency | Size | Notes |
|------------|-------|---------|------|-------|
| Registers | Per thread | ~1 cycle | Limited per SM (~256KB) | Fastest; compiler-managed |
| Shared Memory | Per block | ~5-10 cycles | Up to 228KB per SM | Software-managed; L1 sibling |
| L1 Cache | Per SM | ~5-10 cycles | Combined with shared memory | Hardware-managed |
| L2 Cache | Per GPU | ~100 cycles | 6-128 MB | All SMs share |
| Global Memory | Per GPU | ~400-600 cycles | VRAM (up to 32GB) | Main bottleneck |
| Constant Memory | Per GPU | ~5 cycles (cached) | 64KB | Read-only; broadcast |
| Texture Memory | Per GPU | ~5 cycles (cached) | Shared with global | Spatial locality optimized |
| Unified Memory | Host + Device | Variable | Virtual address space | VM abstraction; migrates on demand |

### Optimization Principles

```
MEMORY ACCESS OPTIMIZATION STRATEGY
================================================================

  Rule 1: Minimize global memory access
    ├── Load data into shared memory once
    ├── Operate on shared memory repeatedly
    └── Write results back to global memory once

  Rule 2: Maximize shared memory reuse
    ├── Tile-based algorithms: load tiles into shared memory
    ├── Use __syncthreads() between load and compute
    └── Shared memory bank conflicts: stride access patterns

  Rule 3: Coalesce memory access patterns
    ├── Adjacent threads access adjacent memory addresses
    ├── Aligned to 128-byte cache lines
    └── Avoid stride patterns that waste bandwidth

  Rule 4: Use the memory hierarchy
    ├── Constants → constant memory (broadcast)
    ├── Read-only spatial data → texture memory
    ├── Frequently reused data → shared memory
    └── Thread-private data → registers
```

### Bank Conflicts

Shared memory is divided into 32 banks (one per warp thread). When two threads in a warp access the same bank but different addresses, a bank conflict occurs, serializing the access [3]. The exception is a broadcast: all threads accessing the exact same address in the same bank is free.

---

## 4. Occupancy and Throughput Optimization

**Occupancy** is the ratio of active warps to the maximum possible warps on an SM [1]. Higher occupancy generally means better latency hiding -- while one warp waits for memory, another warp can execute.

### Factors Limiting Occupancy

| Factor | Constraint | Optimization |
|--------|-----------|-------------|
| Registers per thread | SM has finite register file | Reduce register pressure; use `__launch_bounds__` |
| Shared memory per block | SM has finite shared memory | Balance tile size vs. shared memory usage |
| Block size | SM has maximum active blocks | Use 128-256 threads per block |
| Cluster size | Max distributed shared memory | Keep clusters small for portability |

### Occupancy Calculator

```
OCCUPANCY CALCULATION
================================================================

  Given: SM has 64 active warps maximum (Blackwell)
         Kernel uses 48 registers per thread
         Block size: 256 threads (8 warps per block)

  Register limit: 65536 registers / (48 * 256) = 5 blocks max
  Active warps: 5 * 8 = 40 warps
  Occupancy: 40 / 64 = 62.5%

  NVIDIA API: cudaOccupancyMaxPotentialClusterSize()
```

### Throughput vs. Latency

Not all kernels need high occupancy. Compute-bound kernels (arithmetic-intensive) benefit from high occupancy. Memory-bound kernels benefit from optimization of memory access patterns regardless of occupancy. The NVIDIA Visual Profiler (nvvp) and Nsight Compute identify the bottleneck [4].

---

## 5. CUDA 13.x -- cuTile Tile-Based Programming

CUDA 13.1 (December 2025) introduced the largest update to the CUDA platform since its invention [5]. The centerpiece is **CUDA Tile**: a tile-based GPU programming model that abstracts away hardware details for better portability across GPU architectures.

### cuTile Concept

Instead of programming individual threads, cuTile programmers operate on **tiles** -- rectangular blocks of data that are loaded, computed on, and stored as units:

```
cuTile PROGRAMMING MODEL
================================================================

  Traditional CUDA:          cuTile CUDA:
  ────────────────           ────────────
  Each thread handles        Tiles are the abstraction
  one element:               unit:

  __global__ void f(         auto tile = cutile::load(
    float* A, float* B) {     A[block_offset],
    int i = blockIdx.x *      TILE_M, TILE_N);
      blockDim.x + threadIdx;
    B[i] = A[i] * 2.0f;     tile = cutile::compute(
  }                            tile, [](auto x) {
                                 return x * 2.0f;
                               });

                             cutile::store(
                               tile, B[block_offset]);
```

### Key Benefits

1. **Portability:** Same tile code runs on Ampere, Ada, and Blackwell architectures [6]
2. **Tensor core abstraction:** cuTile automatically maps tile operations to tensor core hardware when beneficial
3. **Memory movement automation:** The NVIDIA compiler and runtime handle shared memory staging, global memory coalescing, and bank conflict avoidance
4. **Block-level parallelism:** Tiles naturally express block-level cooperation without explicit `__syncthreads()` calls

### CUDA 13.2 Extensions

CUDA 13.2 extends cuTile support to Ampere and Ada architectures (in addition to Blackwell) and introduces closures and recursion -- enabling functional programming patterns on GPU hardware [6].

---

## 6. cuTile Python Interface

cuTile Python expresses the tile model in Python, focusing on dividing arrays into tiles operated on in parallel [5]:

```
cuTile PYTHON EXAMPLE
================================================================

  import cutile
  import numpy as np

  @cutile.kernel
  def vector_add(A: cutile.Tile, B: cutile.Tile) -> cutile.Tile:
      return A + B

  # Launch: tiles automatically partition the input
  C = vector_add(
      cutile.from_numpy(a_np),
      cutile.from_numpy(b_np),
      tile_size=(256,)
  )
```

### Python-to-GPU Compilation Path

```
PYTHON cuTile COMPILATION
================================================================

  Python source (@cutile.kernel)
       |
       v
  NVIDIA Python compiler (JIT)
       |
       v
  cuTile IR (tile-level operations)
       |
       v
  NVVM IR (LLVM-based GPU IR)
       |
       v
  PTX bytecode (virtual ISA)
       |
       v
  SASS machine code (GPU-specific)
       |
       v
  Hardware execution (SM)
```

The JIT compilation pipeline achieves near-handwritten-CUDA-C++ performance by applying tile-level optimizations that are difficult to express in thread-level programming [5].

---

## 7. cuda.compute Python API

NVIDIA's `cuda.compute` library (released 2026) provides a high-level Pythonic API for device-wide CUB primitives [7]. It JIT-compiles specialized kernels with link-time optimization.

### Standard Primitives

| Primitive | Operation | Use Case |
|-----------|-----------|----------|
| `sort` | Radix/merge sort on GPU | Rosetta Core pattern ordering |
| `scan` | Prefix sum (inclusive/exclusive) | Cumulative statistics |
| `reduce` | Parallel reduction (sum, min, max) | Aggregation operations |
| `histogram` | Frequency distribution | Pattern frequency analysis |
| `select` | Conditional filtering | Data cleanup, outlier removal |

### Performance Achievement

cuda.compute achieved near-speed-of-light performance equivalent to handwritten CUDA C++ on the GPU MODE kernel leaderboard [7]. The key innovation: custom data types and operators defined in Python remove the C++ binding requirement entirely.

```
cuda.compute EXAMPLE
================================================================

  import cuda.compute as cc

  # Sort 1M floats on GPU -- JIT-compiled, near-optimal
  sorted_data = cc.sort(gpu_array, algorithm='radix')

  # Parallel reduction with custom operator
  total = cc.reduce(gpu_array, op=lambda a, b: a + b)

  # Histogram with 256 bins
  hist = cc.histogram(gpu_array, bins=256)
```

### GSD Silicon Layer Connection

These primitives are the building blocks of the Rosetta Core's pattern detection and calibration engines [M2]. When the calibration feedback loop (observe-compare-adjust-record) needs to process large datasets, cuda.compute provides GPU-accelerated primitives that maintain Python-level readability.

---

## 8. PTX and NVVM Intermediate Representation

### PTX (Parallel Thread Execution)

PTX is NVIDIA's virtual ISA [8]. PTX code is portable across GPU generations -- the GPU driver JIT-compiles PTX to the target architecture's SASS machine code at load time.

```
PTX EXAMPLE -- VECTOR ADD
================================================================

  .version 8.4
  .target sm_90            // Blackwell target
  .address_size 64

  .visible .entry vector_add(
      .param .u64 A,
      .param .u64 B,
      .param .u64 C,
      .param .u32 N)
  {
      .reg .u32 %tid, %ntid, %ctaid;
      .reg .u64 %addr_a, %addr_b, %addr_c;
      .reg .f32 %a, %b, %c;

      mov.u32 %tid, %tid.x;
      mov.u32 %ntid, %ntid.x;
      mov.u32 %ctaid, %ctaid.x;
      // ... compute global index, bounds check, load/add/store
  }
```

### NVVM IR

NVVM IR is the LLVM-based intermediate representation used by the NVIDIA compiler toolchain [8]. cuTile Python, cuda.compute, and NVCC all lower to NVVM IR before final compilation to PTX/SASS.

```
COMPILATION PIPELINE
================================================================

  Source Language        Compiler           IR              Backend
  ──────────────        ────────           ──              ───────
  CUDA C++        ──>   NVCC          ──>  NVVM IR    ──> PTX ──> SASS
  cuTile Python   ──>   cuTile JIT    ──>  NVVM IR    ──> PTX ──> SASS
  cuda.compute    ──>   JIT + LTO     ──>  NVVM IR    ──> PTX ──> SASS
  GLSL shaders    ──>   glslangValidator   SPIR-V    ──> driver-specific
```

---

## 9. GSD Silicon Layer Mapping

The GSD silicon layer maps skill-creator operations to GPU computation [9]:

| GSD Operation | GPU Mapping | CUDA Mechanism |
|--------------|-------------|----------------|
| LoRA adapter training | cuTile tiles for QLoRA gradient computation | cuBLAS matmul + custom kernel |
| Compiled shader generation | PTX bytecode via NVCC or NVVM IR | NVCC pipeline |
| Intent classifier | CUDA kernel running inference on local adapter | cuDNN + TensorRT |
| VRAM budget management | Occupancy API | `cudaOccupancyMaxPotentialClusterSize` |
| Pattern detection | cuda.compute sort + histogram | CUB primitives |
| Calibration math | cuBLAS + cuSOLVER | Linear algebra |

### Skill Promotion to Silicon

The skill promotion pipeline [M3] terminates at the silicon layer:

```
SKILL → SILICON COMPILATION
================================================================

  Stage 4 (LoRA Adapter):
    Training data: skill input/output pairs
    Framework: QLoRA (4-bit quantization)
    Output: .safetensors adapter weights
    Execution: cuBLAS matmul for inference

  Stage 5 (Compiled Shader):
    Input: high-frequency operation pattern
    Compilation: cuTile tile → NVVM IR → PTX → SASS
    Output: compiled GPU shader binary
    Execution: native hardware speed
    Deployment: loaded into Denise-class mesh nodes [M5]
```

---

## 10. LoRA Adapter Compilation Path

LoRA (Low-Rank Adaptation) adapters allow fine-tuning large models on specific tasks with minimal parameter overhead [10]:

### QLoRA on GSD Hardware

```
QLoRA TRAINING ON DUAL RTX 5090
================================================================

  Base model weights (frozen, 4-bit quantized)
       |
       ├── LoRA adapter A (rank 16, task: intent classification)
       │   Parameters: ~2M (tiny vs. base model)
       │   Training: 5K examples, ~30 min on RTX 5090
       │   Inference: cuBLAS batch matmul
       │
       ├── LoRA adapter B (rank 8, task: code generation)
       │   Parameters: ~1M
       │   Training: 10K examples, ~45 min
       │
       └── LoRA adapter C (rank 32, task: domain translation)
           Parameters: ~4M
           Training: 20K examples, ~2 hours

  Total VRAM: 32GB per 5090 (base) + ~50MB per adapter
  NVLink: peer-to-peer VRAM access between cards
```

### Adapter Inference Pipeline

1. Load base model weights to GPU 0 (frozen, quantized)
2. Load task-specific LoRA adapter alongside base weights
3. At inference time: `output = base_output + alpha * (B @ A @ input)`
4. LoRA computation is a single cuBLAS matmul, adding <5% overhead

---

## 11. Dual RTX 5090 Configuration

For the GSD white-box node with dual RTX 5090s [9]:

| Specification | Value |
|--------------|-------|
| Architecture | Blackwell (GB202) |
| Compute capability | 12.x |
| CUDA cores | ~21,760 per card |
| Tensor cores | 4th-gen, FP4/FP8/BF16/TF32 |
| VRAM | 32 GB GDDR7 per card |
| Memory bandwidth | ~1,792 GB/s per card |
| TDP | 575W per card |
| NVLink | 5th-gen, 900 GB/s bridge |
| cuTile support | Native (CUDA 13.1+) |

### NVLink Configuration

The NVLink bridge enables peer-to-peer VRAM access between the two cards [11]:

```
DUAL RTX 5090 NVLink TOPOLOGY
================================================================

  ┌──────────────────┐     NVLink Bridge     ┌──────────────────┐
  │  RTX 5090 #0     │  ◄──── 900 GB/s ────► │  RTX 5090 #1     │
  │                  │                        │                  │
  │  32 GB GDDR7     │  Peer-to-peer VRAM    │  32 GB GDDR7     │
  │  575W TDP        │  access: both cards   │  575W TDP        │
  │                  │  see 64 GB unified    │                  │
  └────────┬─────────┘                        └────────┬─────────┘
           │                                           │
           │           PCIe Gen 5 x16                  │
           └──────────────── CPU ──────────────────────┘
```

### Power Configuration

- **GPU draw:** 575W x 2 = 1,150W for GPUs alone
- **System total:** ~1,400W under full load (CPU, RAM, storage, fans)
- **PSU requirement:** 1,600W+ rated, 80+ Platinum efficiency
- **Circuit breaker:** Dedicated 20A circuit (240V) recommended

> **SAFETY WARNING:** Dual RTX 5090 power draw of 1,150W GPU-only exceeds a standard 15A/120V circuit capacity (1,800W theoretical, ~1,440W practical with 80% rule). Dedicated 20A circuit or 240V supply required. Circuit breaker sizing must be verified before deployment.

---

## 12. Cooling Strategy for PNW Operation

### Thermal Design for PNW Summer

PNW summer ambient temperatures: 25-35C (July-August peak), with occasional heat dome events reaching 40C+ [12].

| Component | Cooling Solution | Rationale |
|-----------|-----------------|-----------|
| RTX 5090 #0 | 360mm AIO liquid cooler | 575W TDP exceeds air cooling capacity |
| RTX 5090 #1 | 360mm AIO liquid cooler | Same requirement |
| CPU | 280mm AIO liquid cooler | i7/Ryzen 9 class, 125-170W TDP |
| Case airflow | 3x 140mm intake (front) + 2x 140mm exhaust (top/rear) | Positive pressure to reduce dust |
| Room placement | North-facing wall, intake from exterior | Coolest wall in PNW homes |

### Solar Power Budget

For self-sufficient PNW operation [M5]:

| Parameter | Value | Source |
|-----------|-------|--------|
| Peak system draw | 1,400W | Measured under full GPU load |
| Daily compute hours | 8h (burst duty cycle) | GSD workflow pattern |
| Daily energy need | 11.2 kWh | 1,400W x 8h |
| PNW winter insolation | ~3 peak sun hours/day | NREL solar resource data |
| PNW summer insolation | ~6 peak sun hours/day | NREL solar resource data |
| Panel sizing (winter) | 3.7 kW minimum | 11.2 / 3 = 3.7 kW |
| Panel sizing (margin) | 4.0 kW recommended | 10% margin for degradation |
| Battery sizing | 10 kWh LFP | Full burst cycle without grid |

### Cooling-Power Interdependence

Higher ambient temperature increases cooling power draw (fans spin faster, AIO pumps work harder), which increases total system power, which increases heat output -- a positive feedback loop. The solar array must be sized for the worst case: full GPU load during a summer heat dome with extended daylight but reduced panel efficiency due to heat derating.

---

## 13. Cross-References

> **Related:** [Claude Code -- Agentic Architecture](01-claude-code-agentic-architecture.md) -- cuda.compute is accessed through MCP server integration; CUDA kernels are the execution backend for GPU-accelerated agent operations.

> **Related:** [Rosetta Core -- Translation Engine](02-rosetta-core-translation-engine.md) -- The Python panel connects directly to cuTile; the C++ panel connects to CUDA device code; the GLSL panel connects to shader compilation.

> **Related:** [GSD Chipset Orchestration](03-gsd-chipset-orchestration.md) -- The skill promotion pipeline terminates at the silicon layer (Stages 4 and 5); Denise-class nodes run the GPU hardware.

> **Related:** [Mesh & Phase Synchronization](05-mesh-phase-synchronization.md) -- NVLink topology within nodes connects to inter-node bus architecture; dual-5090 cooling strategy scales to 10-node mesh.

> **Related:** [Fractal Documentation Fidelity](06-fractal-documentation-fidelity.md) -- CUDA kernel documentation requires the three-zoom fidelity approach: executive summary of what the kernel does, architectural overview of the thread/memory model, and implementation detail of the actual kernel code.

**Cross-project references:**
- **MPC** (Math Co-Processor): GPU-accelerated linear algebra, FFT, and statistics
- **SYS** (Systems Administration): Infrastructure provisioning for GPU nodes
- **K8S** (Kubernetes): Container orchestration for GPU workload scheduling
- **CMH** (Computational Mesh): Mesh interconnect between GPU nodes
- **GSD2** (GSD Architecture): Silicon layer specification within the chipset model
- **SFC** (Skill Factory): LoRA adapter training and compiled shader deployment
- **GPO** (GPU Operations): Comprehensive GPU programming patterns
- **OCN** (Ocean Intelligence): GPU-accelerated numerical modeling

---

## 14. Sources

1. NVIDIA. *CUDA C++ Programming Guide*. CUDA Toolkit Documentation 13.2, 2026.
2. NVIDIA. "CUDA Compute Capability 9.0+ Architecture Guide." NVIDIA Developer, 2025.
3. Kirk, D. and Hwu, W. *Programming Massively Parallel Processors*. Morgan Kaufmann, 2022.
4. NVIDIA. *Nsight Compute Profiling Guide*. NVIDIA Developer, 2025.
5. NVIDIA Technical Blog. "NVIDIA CUDA 13.1 Powers Next-Gen GPU Programming with NVIDIA CUDA Tile." December 2025.
6. NVIDIA Technical Blog. "Simplify GPU Programming with NVIDIA CUDA Tile in Python." December 2025.
7. NVIDIA Technical Blog. "Topping the GPU MODE Kernel Leaderboard with NVIDIA cuda.compute." February 2026.
8. NVIDIA. *PTX ISA Specification, Version 8.4*. NVIDIA Developer, 2025.
9. Tibsfox. *gsd-silicon-layer-spec.md*. GSD Project Knowledge, February 2026.
10. Hu, E. et al. "LoRA: Low-Rank Adaptation of Large Language Models." arXiv:2106.09685, 2021.
11. NVIDIA. "NVIDIA NVLink and NVSwitch." NVIDIA Data Center Solutions, 2025.
12. NREL. *National Solar Radiation Database*. National Renewable Energy Laboratory, 2024.
13. Dettmers, T. et al. "QLoRA: Efficient Finetuning of Quantized LLMs." arXiv:2305.14314, 2023.
14. NVIDIA. *cuBLAS Library Documentation*. CUDA Toolkit 13.2, 2026.
15. Tibsfox. *gsd-chipset-architecture-vision.md*. GSD Project Knowledge, 2025-2026.
16. NVIDIA. "CUDA 13.2 Release Notes." NVIDIA Developer, January 2026.
17. NVIDIA. *Unified Memory Programming Guide*. CUDA Toolkit Documentation, 2025.
