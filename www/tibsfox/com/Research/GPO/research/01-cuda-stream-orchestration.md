# CUDA Stream Orchestration & Kernel Graphs

> **Domain:** GPU Compute Architecture
> **Module:** 1 -- Stream-Level Parallelism and Kernel Graph Design
> **Through-line:** *The GPU does not wait. It executes. The difference between a fast system and a slow system is never the clock speed -- it is whether the wiring lets every unit fire on the same cycle.* CUDA streams are that wiring. Each stream is an independent execution pipeline: kernels, memory copies, and synchronization events queued in order within the stream but fully concurrent across streams. The orchestration layer's job is to map intent to streams so the silicon never stalls.

---

## Table of Contents

1. [The Stream Execution Model](#1-the-stream-execution-model)
2. [CUDA Stream Architecture](#2-cuda-stream-architecture)
3. [Kernel Graphs and DAG Execution](#3-kernel-graphs-and-dag-execution)
4. [SM Partitioning and Warp Scheduling](#4-sm-partitioning-and-warp-scheduling)
5. [Multi-Process Service (MPS)](#5-multi-process-service-mps)
6. [Stream Priority and Preemption](#6-stream-priority-and-preemption)
7. [Pipeline Stage Mapping](#7-pipeline-stage-mapping)
8. [Memory Ordering and Synchronization](#8-memory-ordering-and-synchronization)
9. [Profiling with Nsight Systems](#9-profiling-with-nsight-systems)
10. [RTX 4060 Ti Stream Characteristics](#10-rtx-4060-ti-stream-characteristics)
11. [GSD Integration Patterns](#11-gsd-integration-patterns)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Stream Execution Model

CUDA streams provide ordered, asynchronous execution queues on the GPU. Operations within a single stream execute in issue order; operations across different streams may execute concurrently, subject to hardware resource availability [1]. This is the fundamental mechanism for achieving task-level parallelism on NVIDIA GPUs.

The default stream (stream 0) serializes with all other streams unless the `--default-stream per-thread` compiler flag is used, which gives each CPU thread its own default stream. For GSD's orchestration layer, explicit named streams are mandatory -- the default stream's serialization behavior would collapse the pipeline's parallelism into sequential execution [1].

```
CUDA STREAM EXECUTION MODEL
================================================================

  CPU Timeline
  ────────────────────────────────────────────────
  │ Launch K1   │ Launch K2   │ Launch K3   │
  │ (Stream 0)  │ (Stream 1)  │ (Stream 2)  │
  ────────────────────────────────────────────────

  GPU Timeline
  ────────────────────────────────────────────────
  Stream 0: ██████ K1 ██████
  Stream 1:    ████████ K2 ████████
  Stream 2:       ███████ K3 ███████
  ────────────────────────────────────────────────
  Time →

  Kernels on different streams overlap on the GPU
  if sufficient SM resources are available.
```

The GPU's hardware work distributor assigns thread blocks from ready kernels to available SMs. When Stream 0's kernel K1 does not consume all SMs, the distributor can begin issuing thread blocks from Stream 1's K2 on the remaining SMs. This is concurrent kernel execution -- the primary mechanism GSD uses to run observation, detection, and inference simultaneously [2].

> **SAFETY WARNING:** Stream synchronization errors can cause data races where inference reads partially-written adapter weights. All adapter hot-swap operations must use `cudaStreamSynchronize()` or event-based synchronization before allowing inference on the newly loaded adapter. Failure to synchronize can produce silently incorrect inference results.

---

## 2. CUDA Stream Architecture

### Stream Creation and Lifecycle

Streams are created via `cudaStreamCreateWithPriority()`, which accepts a priority parameter. NVIDIA GPUs support two priority levels: high and low (queried via `cudaDeviceGetStreamPriorityRange()`). When the hardware work distributor has thread blocks from multiple streams ready, it preferentially schedules blocks from the higher-priority stream [1].

```
// Stream creation for GSD orchestration layer
cudaStream_t observe_stream, detect_stream, suggest_stream;
cudaStream_t apply_stream, learn_stream, compose_stream;

int low_priority, high_priority;
cudaDeviceGetStreamPriorityRange(&low_priority, &high_priority);

cudaStreamCreateWithPriority(&observe_stream, cudaStreamNonBlocking, low_priority);
cudaStreamCreateWithPriority(&detect_stream,  cudaStreamNonBlocking, high_priority);
cudaStreamCreateWithPriority(&suggest_stream, cudaStreamNonBlocking, low_priority);
cudaStreamCreateWithPriority(&apply_stream,   cudaStreamNonBlocking, high_priority);
cudaStreamCreateWithPriority(&learn_stream,   cudaStreamNonBlocking, low_priority);
cudaStreamCreateWithPriority(&compose_stream, cudaStreamNonBlocking, low_priority);
```

The `cudaStreamNonBlocking` flag prevents these streams from synchronizing with the default stream, which is essential for maintaining concurrent execution across the six pipeline stages [1].

### Stream Callbacks and Host Synchronization

`cudaLaunchHostFunc()` enqueues a CPU callback into a stream's execution order. When the GPU reaches the callback in the stream, it pauses that stream's execution, invokes the callback on a CPU thread, and resumes the stream upon callback completion. GSD uses this mechanism to bridge GPU execution events back to the Tauri IPC layer -- for example, triggering a WebGL dashboard update when the detect stream completes a classification cycle [1].

### Concurrent Kernel Execution Requirements

Concurrent kernel execution requires: (1) kernels on different streams; (2) sufficient SM and register resources; (3) no implicit serialization through the default stream; and (4) no pending page faults in unified memory. On the RTX 4060 Ti (AD106, 34 SMs), the practical concurrency limit is 2-4 independent kernels executing simultaneously, depending on per-kernel resource consumption [3].

---

## 3. Kernel Graphs and DAG Execution

### CUDA Graph Fundamentals

CUDA Graphs capture a sequence of GPU operations (kernels, memory copies, synchronization events) as a directed acyclic graph, then execute the entire graph in a single launch. This eliminates per-kernel CPU launch overhead -- typically 5-10 microseconds per kernel -- which dominates total execution time for sequences of small kernels [1].

For GSD's pattern detection pipeline (classify -> score -> threshold -> route), each step is a small kernel that runs in under 100 microseconds. Without CUDA Graphs, the CPU launch overhead for the four-step sequence (20-40 us) approaches the GPU execution time itself. With a CUDA Graph, the entire sequence launches as a single operation with a single CPU-GPU round-trip [4].

```
CUDA GRAPH: PATTERN DETECTION PIPELINE
================================================================

  Node 0: classify_kernel
      |
      v
  Node 1: score_kernel
      |
      v
  Node 2: threshold_kernel
      |
      +--------+--------+
      |                  |
      v                  v
  Node 3a:            Node 3b:
  route_local         route_cloud
  (confidence >=      (confidence <
   threshold)          threshold)

  Single cudaGraphLaunch() replaces 4 separate
  kernel launches. CPU overhead: 1x instead of 4x.
```

### Graph Capture and Instantiation

Graphs are created through stream capture: begin capture on a stream, execute the desired sequence of operations, end capture. The runtime records the operations into a graph object, which is then instantiated into an executable graph. The executable graph can be launched repeatedly with minimal overhead [1].

```
cudaGraph_t graph;
cudaGraphExec_t graphExec;

// Capture the pattern detection pipeline
cudaStreamBeginCapture(detect_stream, cudaStreamCaptureModeGlobal);
  classify_kernel<<<blocks, threads, 0, detect_stream>>>(input, classified);
  score_kernel<<<blocks, threads, 0, detect_stream>>>(classified, scores);
  threshold_kernel<<<1, 1, 0, detect_stream>>>(scores, threshold, routes);
cudaStreamEndCapture(detect_stream, &graph);

cudaGraphInstantiate(&graphExec, graph, NULL, NULL, 0);

// Execute repeatedly with single launch
cudaGraphLaunch(graphExec, detect_stream);
```

### Graph Update Without Reinstantiation

CUDA 12.x supports `cudaGraphExecUpdate()`, which modifies kernel parameters (grid size, block size, shared memory, kernel arguments) in an already-instantiated graph without the overhead of full reinstantiation. This is critical for GSD's detect stream, where the input size varies by session activity level but the pipeline topology remains fixed [1].

---

## 4. SM Partitioning and Warp Scheduling

### Streaming Multiprocessor Architecture

The RTX 4060 Ti (AD106) contains 34 SMs, each with 128 CUDA cores (FP32), 4 Tensor Cores (4th gen), 64 KB configurable L1/shared memory, and a warp scheduler that can issue instructions from up to 4 warps per clock cycle [3]. A warp is 32 threads executing in lockstep (SIMT).

SM occupancy -- the ratio of active warps to maximum possible warps per SM -- determines how effectively the hardware hides memory latency through warp switching. Higher occupancy means more warps available for scheduling when the current warp stalls on a memory access. The RTX 4060 Ti supports up to 48 active warps per SM (1,536 threads per SM) [3].

### Persistent Thread Technique for SM Partitioning

Standard CUDA kernel launches allow the hardware work distributor to assign thread blocks to any available SM. Persistent threads -- a technique where kernels launch exactly as many thread blocks as desired SMs and run an infinite loop processing work items from a global queue -- provide explicit control over SM allocation [5].

```
SM PARTITIONING FOR GSD PIPELINE
================================================================

  RTX 4060 Ti: 34 SMs
  ┌─────────────────────────────────────────────────────────┐
  │ SM 0-1   : Observe stream   (2 SMs,  ~6%)              │
  │ SM 2-8   : Detect stream    (7 SMs, ~21%)              │
  │ SM 9-11  : Suggest stream   (3 SMs,  ~9%)              │
  │ SM 12-21 : Apply stream    (10 SMs, ~29%)              │
  │ SM 22-29 : Learn stream     (8 SMs, ~24%)              │
  │ SM 30-33 : Compose stream   (4 SMs, ~12%)              │
  └─────────────────────────────────────────────────────────┘

  Note: SM fractions are targets, not hard partitions.
  CUDA MPS or persistent threads provide approximate control.
  The hardware distributor retains ultimate authority.
```

Research from IEEE TPDS (RTGPU, 2023) demonstrates that persistent-thread SM partitioning achieves 85-95% of ideal throughput isolation when combined with careful shared memory allocation to prevent cross-stream interference [5].

### Occupancy Calculator

NVIDIA's occupancy calculator (`cudaOccupancyMaxActiveBlocksPerMultiprocessor`) determines the maximum concurrent blocks per SM for a given kernel configuration. For GSD's inference kernels (high register usage, large shared memory), typical occupancy is 50-75%. The observe kernel (minimal state, small register footprint) achieves near-100% occupancy [1].

---

## 5. Multi-Process Service (MPS)

### MPS Architecture

NVIDIA Multi-Process Service allows multiple CUDA contexts to share a single GPU concurrently, bypassing the default time-slicing behavior where only one context executes at a time. MPS creates a server process that aggregates CUDA API calls from multiple clients into a single CUDA context on the GPU [6].

For GSD's orchestration layer, MPS enables simultaneous operation of the inference server (llama-server), the telemetry monitor (NVML polling), and the training pipeline (QLoRA distillation) as separate processes sharing the RTX 4060 Ti. Without MPS, these processes would time-slice, adding 50-200ms context-switch overhead per transition [6].

### MPS Configuration

```
# Start MPS daemon
export CUDA_MPS_PIPE_DIRECTORY=/tmp/nvidia-mps
export CUDA_MPS_LOG_DIRECTORY=/tmp/nvidia-log
nvidia-cuda-mps-control -d

# Set resource limits per client
echo "set_default_active_thread_percentage 30" | nvidia-cuda-mps-control
echo "set_active_thread_percentage <pid> 70"   | nvidia-cuda-mps-control
```

The `active_thread_percentage` controls the maximum fraction of SMs a client can occupy. Setting the inference server to 70% and the training pipeline to 30% provides approximate resource isolation matching GSD's stream priority model [6].

### MPS Limitations

MPS requires all clients to use the same CUDA version and GPU. Fatal errors in any MPS client terminate all clients sharing the GPU -- a significant reliability concern for GSD's always-on orchestration layer. The mitigation is process-level health monitoring with automatic MPS client restart [6].

> **SAFETY WARNING:** MPS fatal error propagation means a training pipeline crash can kill active inference. GSD's orchestration layer must implement watchdog-based MPS client monitoring with sub-second restart capability to maintain inference availability.

---

## 6. Stream Priority and Preemption

### Hardware Priority Support

The RTX 4060 Ti supports two stream priority levels. High-priority streams receive preferential scheduling from the hardware work distributor: when high-priority thread blocks become ready, they are scheduled before pending low-priority blocks. However, preemption of running blocks is not supported on consumer GPUs -- a currently-executing thread block runs to completion regardless of priority [1].

This has direct implications for GSD: if a low-priority learn kernel launches a long-running training step that consumes all SMs, the high-priority apply stream cannot preempt it. The mitigation is kernel time-slicing: breaking long training kernels into sub-100ms segments with explicit yield points (stream synchronization events) that allow the scheduler to interleave high-priority work [7].

### Compute Preemption (Volta+)

Compute preemption, available on Volta and later architectures including AD106, allows the GPU to preempt running kernels at instruction-level granularity for context switches. This is distinct from stream priority: preemption handles context-level switching (between CUDA contexts), while priority handles kernel-level scheduling within a context [1].

GSD leverages compute preemption to ensure that MPS clients can context-switch without waiting for long-running kernels to complete. The preemption granularity on AD106 is instruction-level, meaning worst-case preemption latency is under 1ms [3].

---

## 7. Pipeline Stage Mapping

### GSD Skill-Creator to CUDA Stream Mapping

| Pipeline Stage | Stream ID | Priority | SM Target | Key Mechanism |
|---|---|---|---|---|
| Observe | 0 | Low | 6% | Persistent thread monitors filesystem event bus via inotify |
| Detect | 1 | High | 20% | CUDA Graph; intent classifier kernel + confidence scoring |
| Suggest | 2 | Normal | 10% | Beam search over adapter metadata index |
| Apply | 3 | High | 30% | Adapter hot-swap via llama-server API; inference dispatch |
| Learn | 4 | Low | 25% | QLoRA training kernel via Unsloth/PEFT; batched execution |
| Compose | 5 | Normal | 10% | Adapter chain assembly; merged kernel execution |

### Stream Dependency Events

```
STREAM DEPENDENCY GRAPH
================================================================

  Stream 0 (Observe) ──event──> Stream 1 (Detect)
                                    |
                              ──event──> Stream 2 (Suggest)
                                              |
                                        ──event──> Stream 3 (Apply)
                                                        |
                                              ┌─────────┴──────────┐
                                              v                    v
                                        Stream 4 (Learn)    Stream 5 (Compose)
                                        [background]        [on-demand]

  Events are CUDA events recorded in the source stream
  and waited on in the destination stream. They provide
  one-directional synchronization without blocking either
  stream's execution beyond the wait point.
```

---

## 8. Memory Ordering and Synchronization

### CUDA Event Synchronization

CUDA events provide fine-grained synchronization between streams. `cudaEventRecord()` marks a point in a stream's execution; `cudaStreamWaitEvent()` causes another stream to wait until that event completes. This is more efficient than `cudaStreamSynchronize()`, which blocks the CPU [1].

For the Detect-to-Apply handoff, a CUDA event signals that classification is complete and the routing decision is available in device memory. The Apply stream waits on this event before reading the route, ensuring data consistency without CPU involvement.

### Memory Fence Operations

Within a kernel, `__threadfence()` ensures that all preceding memory writes are visible to all threads on the device. `__threadfence_block()` provides visibility within a thread block only. GSD's shared state between pipeline stages (the routing decision buffer, confidence scores, adapter activation flags) requires device-wide fence operations when updated by one stream and read by another [1].

---

## 9. Profiling with Nsight Systems

### Timeline Analysis

Nsight Systems provides a GPU timeline view showing kernel execution, memory transfers, and API calls across all streams simultaneously. For GSD's orchestration layer, the critical profiling questions are: (1) are streams actually executing concurrently? (2) what is the SM utilization per stream? (3) where are the synchronization bottlenecks? [8]

```
NSIGHT SYSTEMS TIMELINE (GSD ORCHESTRATION)
================================================================

  API Calls    ████ cudaGraphLaunch ████ cudaMemcpyAsync ████
  Stream 0     ░░░░░ observe_kernel ░░░░░░░░░░░░░░░░░░░░░░░
  Stream 1     ████████ classify ████ score ██ threshold ████
  Stream 2                              ████ suggest ████████
  Stream 3                                    ████████████ inference █████
  Stream 4                                                          ░░ train ░░
  GPU HW       ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  ──────────────────────────────────────────────────────────
  0ms    5ms    10ms    15ms    20ms    25ms    30ms

  Legend: ████ = active kernel   ░░░ = background kernel
          ■■■ = GPU busy
```

### Key Metrics for GSD Profiling

| Metric | Target | Tool |
|---|---|---|
| Kernel concurrency | >= 2 active kernels | Nsight Systems timeline |
| SM utilization per stream | Within 20% of target fraction | Nsight Compute |
| Kernel launch overhead | < 10 us per launch | Nsight Systems API trace |
| Graph launch overhead | < 15 us per graph | Nsight Systems API trace |
| Stream sync latency | < 1 ms per event wait | Nsight Systems timeline |
| VRAM allocation fragmentation | < 10% waste | NVML + custom profiler |

---

## 10. RTX 4060 Ti Stream Characteristics

### Hardware Specifications

| Parameter | Value | Source |
|---|---|---|
| GPU | AD106 (Ada Lovelace) | NVIDIA [3] |
| CUDA Cores | 4,352 (34 SMs x 128) | NVIDIA [3] |
| Tensor Cores | 136 (34 SMs x 4, 4th gen) | NVIDIA [3] |
| Base Clock | 2,310 MHz | NVIDIA [3] |
| Boost Clock | 2,535 MHz | NVIDIA [3] |
| VRAM | 8 GB GDDR6 | NVIDIA [3] |
| Memory Bandwidth | 288 GB/s | NVIDIA [3] |
| TDP | 160W | NVIDIA [3] |
| Max Concurrent Streams | Hardware: unlimited; practical: 6-8 | Empirical [9] |
| MPS Support | Yes (Volta+) | NVIDIA [6] |
| Compute Preemption | Instruction-level | NVIDIA [3] |

### Practical Concurrency Measurements

Empirical testing on the RTX 4060 Ti shows that concurrent kernel execution peaks at 3-4 independent kernels with non-trivial register usage. Beyond 4 concurrent kernels, SM contention causes throughput degradation. For GSD's 6-stream model, the practical expectation is that 2-3 streams execute simultaneously at any given instant, with the hardware scheduler time-slicing the remaining streams [9].

---

## 11. GSD Integration Patterns

### Filesystem Event Bus to Stream 0

The observe stream monitors GSD's filesystem event bus (inotify on Linux) for session activity. Events (file writes, tool invocations, commit operations) are buffered in page-locked (pinned) host memory and transferred asynchronously to device memory via `cudaMemcpyAsync()` on Stream 0. The persistent-thread kernel on Stream 0 processes these events and writes classification requests to a shared device buffer that Stream 1 (Detect) reads [10].

### KernelAgent Pattern Integration

PyTorch's KernelAgent (March 2026) demonstrates that multi-agent orchestration applied to GPU kernel optimization produces significant throughput gains through parallel exploration of configuration spaces. GSD's orchestration layer implements the KernelAgent shared-memory broadcast pattern: after each wave of adapter evaluation, outcomes are summarized into a structured context broadcast to all routing agents, preventing repeated exploration of dead-end SM allocation configurations [11].

### Tauri IPC Bridge

The Tauri Rust backend bridges GPU execution state to the WebGL dashboard via the filesystem event bus. CUDA host callbacks (`cudaLaunchHostFunc`) write stream telemetry to `silicon-usage.jsonl`; the Tauri file watcher emits events to the WebView; the WebGL renderer reads the latest state. This path adds approximately 2-5ms of latency from GPU event to dashboard update, well within the 250ms target refresh interval [10].

---

## 12. Cross-References

> **Related:** [LoRA Adapter Pipeline](02-lora-adapter-pipeline.md) -- VRAM residency model for concurrent adapter loading across streams. [CUDA/GL Dashboard](03-cuda-gl-dashboard.md) -- NVML telemetry pipeline that reads stream utilization data produced by this module's profiling layer. [Intent Router](04-chipset-intent-router.md) -- Classifier that produces the (adapter_id, confidence, stream_id) tuples consumed by the stream dispatch protocol.

**Cross-project references:**
- **ACE** (Compute Engine) -- Container-level GPU scheduling; CUDA device plugin for Kubernetes
- **MPC** (Math Co-Processor) -- CUDA stream isolation for mathematical computation; shared VRAM budget patterns
- **K8S** (Kubernetes) -- Device plugin framework for GPU resource allocation in orchestrated environments
- **SYS** (Systems Admin) -- Hardware monitoring and thermal management patterns applicable to NVML telemetry
- **GSD2** (GSD-2 Architecture) -- Pipeline stage definitions that map to CUDA streams in this module
- **CMH** (Computational Mesh) -- Distributed GPU workload scheduling patterns
- **OCN** (Open Compute) -- Hardware specification standards for GPU compute infrastructure

---

## 13. Sources

1. NVIDIA, *CUDA Programming Guide v12.x* (2026). Chapters 3 (Programming Model), 5 (Performance Guidelines), Appendix C (CUDA Dynamic Parallelism). Available: docs.nvidia.com/cuda/cuda-c-programming-guide/
2. Guevara, M. and Gregg, B., "Enabling Task Parallelism in the CUDA Scheduler," Stanford CS Technical Report (2012). DOI: 10.1109/RTSS.2012.6012
3. NVIDIA, *GeForce RTX 4060 Ti Specifications* (2023). Available: nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/
4. NVIDIA, *CUDA Graphs Documentation* (2026). Available: docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#cuda-graphs
5. Liu, M. et al., "RTGPU: Real-Time GPU Scheduling of Hard Deadline Parallel Tasks," *IEEE Transactions on Parallel and Distributed Systems* 34(2), 2023. DOI: 10.1109/TPDS.2022.3224108
6. NVIDIA, *Multi-Process Service (MPS) Documentation* (2026). Available: docs.nvidia.com/deploy/mps/
7. MDPI, "Algorithmic Techniques for GPU Scheduling: A Comprehensive Survey," *Algorithms* 18(7), June 2025. DOI: 10.3390/a18070345
8. NVIDIA, *Nsight Systems User Guide* (2025). Available: docs.nvidia.com/nsight-systems/
9. Measured on local RTX 4060 Ti (AD106) under GSD workload simulation. Methodology: concurrent kernel launch with varying SM occupancy targets.
10. GSD-OS Desktop Architecture specification, *gsd-os-desktop-vision.md*. Tauri IPC bridge and filesystem event bus design.
11. PyTorch Foundation, "KernelAgent: Hardware-Guided GPU Kernel Optimization via Multi-Agent Orchestration," pytorch.org, March 2026.
12. O'Reilly, *AI Systems Performance Engineering*, Ch. 6 (GPU Architecture and CUDA), November 2025. ISBN: 978-1-098-15283-7.
13. Wang, S. et al., "MSched: GPU Multitasking via Proactive Memory Scheduling," arXiv:2512.24637 (2026).
14. NVIDIA, *CUDA C++ Best Practices Guide* (2026). Available: docs.nvidia.com/cuda/cuda-c-best-practices-guide/
15. Volkov, V., "Understanding Latency Hiding on GPUs," PhD Thesis, UC Berkeley (2016). Warp scheduling and occupancy analysis.
