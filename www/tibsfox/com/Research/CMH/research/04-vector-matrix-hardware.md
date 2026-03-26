# Vector and Matrix Processing Hardware

> **Domain:** Computer Architecture
> **Module:** 4 -- Vector and Matrix Processing Hardware
> **Through-line:** *From Cray-1 vector registers to Blackwell tensor cores -- the hardware architecture of parallel numerical computation has evolved through four decades, but the fundamental insight remains: data parallelism over instruction complexity.*

---

## Table of Contents

1. [Classical Vector Processors](#1-classical-vector-processors)
2. [GPU Architecture: CUDA Cores to Tensor Cores](#2-gpu-architecture-cuda-cores-to-tensor-cores)
3. [Tensor Core Evolution](#3-tensor-core-evolution)
4. [Google TPU and Systolic Arrays](#4-google-tpu-and-systolic-arrays)
5. [The Mixed-Precision Landscape](#5-the-mixed-precision-landscape)
6. [SIMD Extensions on CPUs](#6-simd-extensions-on-cpus)
7. [Cross-References](#7-cross-references)
8. [Sources](#8-sources)

---

## 1. Classical Vector Processors

Vector processors operate on large one-dimensional arrays using variable-length instructions, distinct from fixed-width SIMD [1]:

### 1.1 The Cray-1 (1976)

Achieved approximately 80 MFLOPS sustained using pipeline parallelism with separate pipelines for different operations. Employed "vector chaining" to pipeline batches of vector instructions -- the output of one pipeline feeds directly into the input of another without waiting for the full vector to complete [1].

### 1.2 The Japanese Vector Era

Fujitsu, Hitachi, and NEC produced register-based vector machines in the 1980s, typically slightly faster than contemporary Cray systems. NEC's SX series continued production into the 2020s, demonstrating the enduring value of the vector processing model for memory-bandwidth-bound workloads [1].

### 1.3 RISC-V Vector Extension

The RISC-V Vector Extension (RVV) is a notable modern example of genuine variable-length vector processing, providing scalable vector registers whose length is determined by the hardware implementation rather than the instruction encoding [1].

---

## 2. GPU Architecture: CUDA Cores to Tensor Cores

Modern NVIDIA GPUs contain 80-140 Streaming Multiprocessors (SMs), each the fundamental execution unit under SIMT (Single Instruction, Multiple Thread) execution [2]:

### 2.1 Streaming Multiprocessor Architecture

Each SM contains:
- **CUDA cores:** General-purpose floating-point and integer units
- **Tensor cores:** Dedicated matrix multiply-accumulate (MMA) units
- **RT cores:** Ray tracing acceleration (not relevant for compute)
- **Shared memory / L1 cache:** Configurable fast memory local to the SM
- **Register file:** Largest on-chip register file of any processor type

### 2.2 SIMT Execution

Threads execute in groups of 32 (warps on NVIDIA, wavefronts on AMD). All threads in a warp execute the same instruction simultaneously. Divergent branches cause serialization -- the fundamental programming constraint of GPU computing [2].

### 2.3 Memory Hierarchy

High Bandwidth Memory (HBM2/HBM3) provides 1-3 TB/s bandwidth -- a 10-30x advantage over CPUs. This bandwidth advantage is why GPUs dominate memory-bandwidth-bound workloads like matrix multiplication and neural network inference [2].

---

## 3. Tensor Core Evolution

Tensor Cores, introduced with the Volta architecture (2017), are dedicated matrix multiply-accumulate units [2][3]:

| Architecture | Year | MMA Shape | Precisions Supported | Key Innovation |
|-------------|------|-----------|---------------------|----------------|
| Volta | 2017 | 4x4x4 | FP16 accumulate to FP32 | First tensor cores |
| Turing | 2018 | 4x4x4 | +INT8, INT4 | Integer inference support |
| Ampere | 2020 | 8x8 | +BF16, TF32, INT8 | Sparsity (2:4), TF32 format |
| Hopper | 2022 | 64x256x16 | +FP8 | WGMMA, 4-warp cooperative groups |
| Blackwell | 2024 | 256x256x16 | +FP4 | tcgen05, dedicated tensor memory |

### 3.1 The Scale of Improvement

A single Hopper tensor core can perform 1,024 floating-point operations per clock cycle. Blackwell's fifth-generation tensor cores execute MMA across 2 SMs simultaneously. For AI workloads, tensor cores achieve 2-10x the throughput of standard CUDA cores [3].

### 3.2 RTX 4060 Ti (Ada Lovelace)

The GSD reference hardware: 4,352 CUDA cores across 34 SMs, 136 fourth-generation Tensor Cores, compute capability 8.9. FP32 throughput ~22 TFLOPS; FP16 Tensor Core throughput ~176 TFLOPS [2].

---

## 4. Google TPU and Systolic Arrays

Google's Tensor Processing Units use systolic array architectures where data flows through a grid of processing elements [4]:

- Each element performs a multiply-accumulate and passes results to its neighbors
- No instruction fetch per element -- the data flow IS the computation
- Optimized specifically for matrix multiplication and convolution
- TPU v4 pods use optically reconfigurable 3D torus interconnects

---

## 5. The Mixed-Precision Landscape

| Format | Bits | Exponent | Mantissa | Primary Use |
|--------|------|----------|----------|-------------|
| FP64 | 64 | 11 | 52 | Scientific computing, verification |
| FP32 | 32 | 8 | 23 | General purpose |
| TF32 | 19 | 8 | 10 | Training (NVIDIA Ampere+) |
| BF16 | 16 | 8 | 7 | Training and inference |
| FP16 | 16 | 5 | 10 | Inference and training |
| FP8 (E4M3) | 8 | 4 | 3 | Forward pass computation |
| FP8 (E5M2) | 8 | 5 | 2 | Gradient computation |
| INT8 | 8 | -- | -- | Quantized inference |
| INT4 | 4 | -- | -- | Heavily quantized inference |

### 5.1 The Performance Gap

El Capitan achieves 16.7 exaFLOPS on the HPL-MxP (mixed-precision) benchmark versus 1.809 exaFLOPS on standard HPL -- a 9.2x difference. This demonstrates the enormous performance gains from mixed-precision computation when mathematical techniques preserve accuracy [3][5].

---

## 6. SIMD Extensions on CPUs

Modern CPUs implement SIMD extensions that borrow from vector processing concepts [1]:

| Extension | Width | Vendor | Key Feature |
|-----------|-------|--------|-------------|
| SSE/SSE2 | 128-bit | Intel/AMD | 4x FP32 or 2x FP64 per instruction |
| AVX2 | 256-bit | Intel/AMD | 8x FP32 or 4x FP64 per instruction |
| AVX-512 | 512-bit | Intel | 16x FP32 or 8x FP64 per instruction |
| SVE/SVE2 | Variable (128-2048 bit) | ARM | Scalable vector length |

---

## 7. Cross-References

| Project | Connection |
|---------|------------|
| [MPC](../MPC/index.html) | GPU architecture directly implements the Math Co-Processor; CUDA cores and tensor cores are the execution substrate |
| [GRD](../GRD/index.html) | Gradient computation on tensor cores; backpropagation as matrix operations |
| [BPS](../BPS/index.html) | Signal processing on GPU; FFT and filtering as vectorized operations |
| [LED](../LED/index.html) | Fourier analysis for LED signal processing; frequency-domain analysis on GPU |
| [ECO](../ECO/index.html) | Statistical ecology computations; Monte Carlo simulations on GPU |

---

## 8. Sources

1. [Vector Processing History | IEEE Computer Architecture](https://ieeexplore.ieee.org/)
2. [NVIDIA GPU Architecture Whitepapers](https://www.nvidia.com/en-us/geforce/)
3. [NVIDIA Tensor Core Generations](https://developer.nvidia.com/)
4. [Google TPU Architecture](https://cloud.google.com/tpu/docs/system-architecture)
5. [TOP500 -- El Capitan Mixed-Precision Results](https://www.top500.org/)
