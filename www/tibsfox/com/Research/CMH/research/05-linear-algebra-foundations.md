# Linear Algebra Computational Foundations

> **Domain:** Numerical Mathematics
> **Module:** 5 -- Linear Algebra Computational Foundations
> **Through-line:** *GEMM -- General Matrix Multiply -- is the single most important computational kernel in HPC and AI. It is the inner loop of neural network training, the core of matrix factorization, and the benchmark that defines the TOP500. Everything else in high-performance computing exists to feed GEMM faster.*

---

## Table of Contents

1. [The BLAS Hierarchy](#1-the-blas-hierarchy)
2. [GEMM: The King of Kernels](#2-gemm-the-king-of-kernels)
3. [LAPACK and Distributed Linear Algebra](#3-lapack-and-distributed-linear-algebra)
4. [Optimized Implementations](#4-optimized-implementations)
5. [Tiling and Cache Exploitation](#5-tiling-and-cache-exploitation)
6. [Communication-Avoiding Algorithms](#6-communication-avoiding-algorithms)
7. [Cross-References](#7-cross-references)
8. [Sources](#8-sources)

---

## 1. The BLAS Hierarchy

The Basic Linear Algebra Subprograms define three levels of operations with fundamentally different computational intensity [1][2]:

### 1.1 Level 1 BLAS -- Vector Operations

Scalar, vector, and vector-vector operations: dot product, axpy (y = ax + y), norms, rotations. Computational intensity O(1) -- each data element is used in a constant number of operations. Memory-bandwidth bound on all modern hardware [1].

### 1.2 Level 2 BLAS -- Matrix-Vector Operations

Matrix-vector multiplication (gemv), triangular solve (trsv), rank-1 update (ger). Computational intensity O(1) per matrix element. Still memory-bandwidth bound but with larger working sets that benefit from cache [1].

### 1.3 Level 3 BLAS -- Matrix-Matrix Operations

Matrix-matrix multiplication (gemm), triangular matrix multiply (trsm), symmetric rank-k update (syrk). Computational intensity O(n) -- for an n x n matrix multiply, 2n^3 operations on 4n^2 data elements gives intensity n/2 [1].

**This is the critical level:** large enough working sets achieve compute-bound operation, making Level 3 BLAS the target for hardware optimization. Every major GPU and CPU vendor optimizes their GEMM kernel as the highest-priority numerical library [1][2].

---

## 2. GEMM: The King of Kernels

The General Matrix Multiply operation: C = alpha * A * B + beta * C [1][2]:

### 2.1 Why GEMM Matters

- **Neural network training:** Forward pass (activation = weights * input), backward pass (gradient = error * activations^T), weight update (delta_weights = gradients * inputs^T) -- all GEMM
- **Matrix factorization:** LU, QR, Cholesky, SVD all reduce to blocked GEMM operations
- **TOP500 benchmark:** HPL (High Performance Linpack) is fundamentally a GEMM benchmark
- **AI inference:** Each transformer layer performs multiple GEMM operations per token

### 2.2 Computational Intensity

For multiplying two n x n matrices: 2n^3 floating-point operations on 3n^2 data elements. The ratio (2n/3) grows with matrix size, meaning larger matrices achieve higher hardware utilization. This is why AI models with large hidden dimensions (thousands to tens of thousands) achieve near-peak GPU throughput [1].

---

## 3. LAPACK and Distributed Linear Algebra

### 3.1 LAPACK

LAPACK builds on BLAS to provide higher-level numerical algorithms [3]:

- **Linear systems:** LU factorization (solving Ax = b)
- **Least-squares:** QR factorization
- **Eigenvalue problems:** Schur decomposition, symmetric eigensolvers
- **Singular Value Decomposition (SVD)**

LAPACK was designed to exploit Level 3 BLAS for cache-friendly blocked algorithms, replacing the earlier LINPACK (Level 1 BLAS) and EISPACK packages [3].

### 3.2 ScaLAPACK

Extends LAPACK to distributed-memory parallel systems using PBLAS (Parallel BLAS) and BLACS (Basic Linear Algebra Communication Subprograms). Distributes matrices across nodes using a 2D block-cyclic layout [3].

### 3.3 Modern Alternatives

| Library | Focus | Architecture |
|---------|-------|-------------|
| MAGMA | Heterogeneous CPU+GPU dense linear algebra | Task-based scheduling |
| PLASMA | Multi-core dense linear algebra | Asynchronous task scheduling |
| SLATE | Distributed GPU-accelerated dense linear algebra | Successor to ScaLAPACK |

---

## 4. Optimized Implementations

The reference BLAS/LAPACK from Netlib is written in Fortran and performs poorly. Production systems use vendor-optimized implementations [2][4]:

| Library | Vendor | Target | Key Feature |
|---------|--------|--------|-------------|
| Intel MKL (oneMKL) | Intel | x86 CPUs | AVX-512 optimized |
| cuBLAS | NVIDIA | NVIDIA GPUs | Tensor core support |
| NVPL | NVIDIA | ARM CPUs | Neoverse optimized |
| AOCL-BLAS | AMD | Zen CPUs | Zen 4/5 tuned |
| OpenBLAS | Community | Multi-platform | Auto-tuned, open source |
| BLIS | UT Austin | Multi-platform | Modular architecture |

These implementations contain hand-tuned assembly kernels for specific microarchitectures -- the inner GEMM loop is often written at the register allocation level for maximum throughput [4].

---

## 5. Tiling and Cache Exploitation

Matrix multiplication performance depends critically on data reuse within cache hierarchies [2][4]:

### 5.1 The Tiling Concept

Loop tiling (blocking) restructures computation to operate on cache-sized submatrices, ensuring that data loaded into L2/L3 cache is reused O(n) times rather than O(1). Without tiling, a naive matrix multiply achieves approximately 1-5% of peak; with proper tiling, 80-95% is achievable [4].

### 5.2 GPU Tiling

For GPUs, tiling maps naturally to shared memory within SMs. The computation is structured as:

1. Load tile of A and tile of B from global memory to shared memory
2. Compute partial products using shared memory (fast, low-latency)
3. Accumulate results in registers
4. Repeat for all tiles
5. Write final results to global memory

Bank conflict avoidance via padding or swizzling patterns is critical for achieving peak shared memory bandwidth [2].

---

## 6. Communication-Avoiding Algorithms

Traditional algorithms communicate (move data) proportionally to computation. Communication-avoiding algorithms restructure computation to minimize data movement [4]:

- **2.5D matrix multiply:** Uses extra memory to reduce communication by O(sqrt(P)) where P is processor count
- **Communication-avoiding LU:** Reduces pivoting communication from O(n) rounds to O(log(P))
- **Tall-skinny QR (TSQR):** Reduces communication for QR of tall, narrow matrices common in data science

These algorithms become critical at scale where communication latency dominates computation time [4].

---

## 7. Cross-References

| Project | Connection |
|---------|------------|
| [MPC](../MPC/index.html) | ALGEBRUS chip implements cuBLAS/cuSOLVER; the Math Co-Processor executes the kernels documented here |
| [GRD](../GRD/index.html) | Gradient computation is GEMM; backpropagation is a sequence of matrix multiplies |
| [BPS](../BPS/index.html) | Signal processing math; FFT as a structured matrix operation |
| [VAV](../VAV/index.html) | Linear algebra for storage optimization; RAID parity as matrix operations over GF(2) |
| [ECO](../ECO/index.html) | Statistical ecology; covariance matrices, PCA, regression as LAPACK operations |
| [LED](../LED/index.html) | Fourier analysis as DFT matrix multiplication; LED signal processing |

---

## 8. Sources

1. [BLAS -- Basic Linear Algebra Subprograms | Netlib](https://www.netlib.org/blas/)
2. [NVIDIA cuBLAS Documentation](https://docs.nvidia.com/cuda/cublas/)
3. [LAPACK Users' Guide | Netlib](https://www.netlib.org/lapack/)
4. [BLIS: A Framework for Rapidly Instantiating BLAS | UT Austin FLAME](https://github.com/flame/blis)
