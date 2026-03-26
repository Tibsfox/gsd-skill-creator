# Parallel Processing Paradigms

> **Domain:** Distributed Computing
> **Module:** 3 -- Parallel Processing Paradigms
> **Through-line:** *MPI, NCCL, RDMA -- three libraries solving the same problem at different layers of the stack. The choice between them determines whether your cluster achieves 15% or 80% of peak throughput.*

---

## Table of Contents

1. [MPI: The Universal Standard](#1-mpi-the-universal-standard)
2. [NCCL: GPU-Optimized Collectives](#2-nccl-gpu-optimized-collectives)
3. [RDMA and GPU-Initiated Networking](#3-rdma-and-gpu-initiated-networking)
4. [Gloo and Other Libraries](#4-gloo-and-other-libraries)
5. [Collective Operations](#5-collective-operations)
6. [Communication Library Selection](#6-communication-library-selection)
7. [Cross-References](#7-cross-references)
8. [Sources](#8-sources)

---

## 1. MPI: The Universal Standard

The Message Passing Interface is a language-independent specification for distributed memory parallel computing, with implementations including Open MPI, MPICH, and Intel MPI [1]:

### 1.1 Operation Categories

- **Point-to-point:** Send, Recv, Isend, Irecv (non-blocking variants)
- **Collective:** Broadcast, Reduce, AllReduce, AllGather, ReduceScatter, Scatter, Gather, AllToAll
- **One-sided:** Put, Get, Accumulate (RDMA-like)

### 1.2 Strengths

- Runs on any platform: cluster, supercomputer, cloud
- Supports CPU and GPU-resident data (CUDA-aware MPI)
- Decades of optimization and battle-testing
- Rich ecosystem of tools (profilers, debuggers, benchmarks)

### 1.3 Limitations

- CPU coordination overhead for GPU workloads
- Not optimized for specific GPU interconnects (NVLink, NVSwitch)
- Higher latency than NCCL for GPU collectives in multi-GPU configurations

---

## 2. NCCL: GPU-Optimized Collectives

NVIDIA's Collective Communication Library implements multi-GPU and multi-node communication primitives optimized for NVIDIA GPUs and networking [2]:

### 2.1 Topology-Aware Optimization

NCCL performs automatic topology detection across PCIe, NVLink, NVSwitch, InfiniBand, and RoCE to maximize performance. It selects communication paths that minimize data movement across the slowest links in the system hierarchy [2].

### 2.2 Data Transfer Protocols

| Protocol | Mechanism | Bandwidth | Latency | Best For |
|----------|-----------|-----------|---------|---------|
| Simple | Producer-consumer handshake, 8-byte flags | Maximum | Higher | Large messages |
| LL (Low-Latency) | Inline 4-byte flags per 8 bytes data | 25-50% of peak | Sub-microsecond | Small messages |
| LL128 | 128-byte units (120 data + 8 flag) | ~95% of peak | Low | Medium messages |

### 2.3 Algorithm Selection

NCCL selects between ring algorithms (bandwidth-optimal for large messages, O(N) latency) and tree algorithms (logarithmic latency, better for small/medium messages). The double binary tree approach pipelines Reduce and Broadcast operations to implement AllReduce [2].

### 2.4 Performance

Experimental findings indicate NCCL achieves up to 345% lower execution time in AllReduce operations compared to MPI and Gloo in multi-GPU configurations. However, in cross-container virtualization environments, NCCL can exhibit up to 213% higher latency compared to single-container deployments [2][3].

---

## 3. RDMA and GPU-Initiated Networking

Remote Direct Memory Access enables data transfer between systems without CPU involvement [4]:

### 3.1 GPUDirect RDMA

Allows direct GPU-to-NIC data paths, bypassing CPU memory entirely. The GPU writes data directly to the NIC's send buffer; the NIC reads the GPU's receive buffer directly. This eliminates two memory copies and the associated CPU overhead [4].

### 3.2 GPU-Initiated Networking (GIN)

NCCL 2.28 introduced the Device API with GIN, exposing one-sided RDMA primitives (put, put-with-signal) directly to GPU threads. This eliminates CPU coordination overhead entirely and is particularly effective for irregular communication patterns in Mixture-of-Experts workloads [4].

---

## 4. Gloo and Other Libraries

### 4.1 Gloo

Meta's collective communication library, used as PyTorch's default CPU backend. Supports TCP and shared memory transports. Lower performance than NCCL for GPU workloads but provides broad compatibility and simple deployment [3].

### 4.2 RCCL

AMD's equivalent of NCCL for ROCm GPUs. Implements the same API surface, enabling code portability between NVIDIA and AMD GPU clusters [3].

### 4.3 MSCCL

Microsoft's customizable collective communication library, based on NCCL but allowing user-defined communication patterns optimized for specific topologies [3].

---

## 5. Collective Operations

The fundamental communication patterns that parallel applications require [1][2]:

| Operation | Pattern | Use Case |
|-----------|---------|---------|
| Broadcast | One-to-all | Distribute model parameters |
| Reduce | All-to-one | Aggregate gradients to parameter server |
| AllReduce | All-to-all reduction | Distributed training gradient synchronization |
| AllGather | All gather all | Collect distributed activations |
| ReduceScatter | Reduce + scatter result | Gradient sharding for ZeRO-style parallelism |
| AllToAll | Personalized exchange | Expert routing in MoE models |

### 5.1 AllReduce: The Critical Operation

AllReduce (sum all gradients, distribute result to all) is the dominant communication operation in distributed AI training. Its performance directly determines training throughput scaling efficiency. Ring AllReduce achieves optimal bandwidth utilization but O(N) latency; tree AllReduce achieves O(log N) latency but lower bandwidth [2].

---

## 6. Communication Library Selection

| Library | Optimized For | Transport | Primary Use Case |
|---------|-------------|-----------|-----------------|
| MPI | General distributed computing | TCP, IB, shared memory | CPU clusters, hybrid |
| NCCL | NVIDIA GPU collectives | NVLink, IB, RoCE, PCIe | GPU training and inference |
| Gloo | CPU + fallback GPU | TCP, shared memory | PyTorch default CPU |
| RCCL | AMD GPU collectives | Infinity Fabric, RoCE | AMD GPU clusters |
| MSCCL | Custom communication patterns | Based on NCCL | Microsoft research |

---

## 7. Cross-References

| Project | Connection |
|---------|------------|
| [MPC](../MPC/index.html) | Distributed math computation over collective operations; ALGEBRUS distributed GEMM |
| [GSD2](../GSD2/index.html) | Agent coordination patterns parallel collective communication patterns |
| [SYS](../SYS/index.html) | Server-level networking as the transport substrate for MPI/NCCL |
| [VAV](../VAV/index.html) | Distributed storage I/O patterns; RDMA for low-latency storage access |
| [BRC](../BRC/index.html) | Federation communication as a high-level collective over mesh networking |

---

## 8. Sources

1. [MPI Forum -- MPI Standard](https://www.mpi-forum.org/)
2. [NVIDIA NCCL Documentation](https://docs.nvidia.com/deeplearning/nccl/)
3. [PyTorch Distributed Communication -- Gloo/NCCL/MPI backends](https://pytorch.org/)
4. [NVIDIA GPUDirect RDMA and GIN](https://developer.nvidia.com/gpudirect)
