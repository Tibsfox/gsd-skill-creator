# ALGEBRUS -- Linear Algebra Engine

> **Domain:** GPU-Accelerated Linear Algebra
> **Module:** 2 -- ALGEBRUS: The Linear Algebra Engine
> **Through-line:** *ALGEBRUS is the workhorse chip -- matrix operations underpin everything from neural network verification to physics simulation to economic modeling. When Claude needs to solve Ax = b, ALGEBRUS does the arithmetic at CUDA speed.*

---

## Table of Contents

1. [cuBLAS Architecture](#1-cublas-architecture)
2. [cuSOLVER: Direct Solvers](#2-cusolver-direct-solvers)
3. [cuSPARSE: Sparse Operations](#3-cusparse-sparse-operations)
4. [Performance on RTX 4060 Ti](#4-performance-on-rtx-4060-ti)
5. [Batched Operations](#5-batched-operations)
6. [Operation Catalog](#6-operation-catalog)
7. [Cross-References](#7-cross-references)
8. [Sources](#8-sources)

---

## 1. cuBLAS Architecture

cuBLAS provides GPU-accelerated Basic Linear Algebra Subprograms supporting three operation levels [1][2]:

- **Level 1:** Vector-vector (dot product, axpy, norms)
- **Level 2:** Matrix-vector (gemv, trsv)
- **Level 3:** Matrix-matrix (GEMM, trsm, syrk)

### 1.1 cuBLASLt Extensions

cuBLASLt extends the standard API with fused kernels that combine multiple operations into a single kernel launch [1]:

- GEMM + bias + activation in one dispatch
- Epilogue fusion eliminates memory round-trips
- Enables operations like "solve linear system and apply ReLU" in a single call

### 1.2 The GEMM Operation

The General Matrix Multiply: D = F(alpha * A * B + beta * C), where F is an optional epilogue function. This is the single most important operation for AI workloads and the foundation of ALGEBRUS [1].

---

## 2. cuSOLVER: Direct Solvers

cuSOLVER provides direct solver routines for dense and sparse systems [3]:

| Algorithm | Operation | Use Case |
|-----------|-----------|---------|
| LU factorization | A = PLU | General linear system solving |
| QR factorization | A = QR | Least-squares problems |
| Cholesky factorization | A = LL^T | Symmetric positive-definite systems |
| SVD | A = USV^T | Dimensionality reduction, pseudoinverse |
| Eigendecomposition | Av = lambda*v | Vibration analysis, PCA |
| Bunch-Kaufman | A = LDL^T | Symmetric indefinite systems |

### 2.1 Batched Solvers

cuSOLVER's batched API solves thousands of small linear systems in parallel. If Claude generates a mesh with 10,000 cells each requiring a local 3x3 system solve, the batched API handles all of them in a single kernel launch [3].

---

## 3. cuSPARSE: Sparse Operations

cuSPARSE handles matrices where most entries are zero, using compressed formats (CSR, CSC, COO, BSR) that store only non-zero values [4]:

### 3.1 Key Operations

- **SpMV:** Sparse matrix-vector multiply (graph algorithms, finite elements)
- **SpMM:** Sparse matrix-dense matrix multiply (GNN training, scientific computing)
- **Sparse triangular solve:** Forward/backward substitution with sparse factors
- **Format conversion:** Between CSR, CSC, COO, and dense formats

### 3.2 Applications

Graph algorithms, finite element methods, network analysis, and any workload where the matrix is predominantly zero -- which includes most real-world scientific and engineering problems [4].

---

## 4. Performance on RTX 4060 Ti

The Ada Lovelace architecture (compute capability 8.9) provides [2]:

| Metric | Performance |
|--------|-------------|
| FP32 GEMM | ~22 TFLOPS |
| FP16 Tensor Core | ~176 TFLOPS |
| FP64 | 1:64 of FP32 (~344 GFLOPS) |
| Memory bandwidth | 288 GB/s (GDDR6X) |
| CUDA cores | 4,352 |
| Tensor cores | 136 (4th gen) |

### 4.1 FP64 Considerations

The Ada Lovelace consumer architecture provides 1:64 FP64 throughput relative to FP32 -- adequate for verification workloads but not sustained HPC. For mathematical verification (where Claude needs to check if its generated code produces correct results), FP64 is available but slow. Most verification can use FP32 or mixed precision [2].

---

## 5. Batched Operations

The fundamental advantage of GPU-based math: parallelism across data [1][3]:

### 5.1 Batch GEMM

Instead of computing one matrix multiply, compute thousands simultaneously. Each operates on independent data but shares the same kernel code. GPU occupancy is maximized, and per-operation overhead is amortized [1].

### 5.2 Batch Solve

Solve 10,000 independent 4x4 linear systems in less time than solving a single 1000x1000 system -- because the small systems fit entirely in registers and shared memory [3].

### 5.3 Batch FFT

cuFFT's batched transform API processes multiple independent FFTs in a single call, achieving full SM occupancy. A batch of 1,000 1024-point FFTs completes in microseconds [5].

---

## 6. Operation Catalog

### 6.1 ALGEBRUS Operations

| Category | Operations |
|----------|-----------|
| Multiply | GEMM, SYMM, HEMM, TRMM |
| Solve | LU, QR, Cholesky, SVD, eigensolve |
| Factor | LU pivot, QR pivot, Cholesky |
| Transform | Transpose, conjugate, permute |
| Reduce | Determinant, trace, rank, norm |
| Sparse | SpMV, SpMM, sparse solve, format convert |

### 6.2 Dispatch Interface

Each operation is exposed as a JSON-RPC tool call with standardized schema: chip name, operation name, matrix dimensions, precision requirement, and serialized operand data. Results include the computed values plus metadata (precision used, residual error, computation time) [2].

---

## 7. Cross-References

| Project | Connection |
|---------|------------|
| [CMH](../CMH/index.html) | BLAS/LAPACK foundations; ALGEBRUS implements the kernels documented in CMH Module 05 |
| [GRD](../GRD/index.html) | Gradient computation as matrix operations; Jacobian and Hessian via ALGEBRUS |
| [BPS](../BPS/index.html) | Sensor data processing; covariance matrix computation, Kalman filter updates |
| [ECO](../ECO/index.html) | Ecological statistics; population covariance matrices, PCA via SVD |
| [VAV](../VAV/index.html) | Storage optimization; RAID parity as linear algebra over GF(2) |

---

## 8. Sources

1. [NVIDIA cuBLAS Documentation](https://docs.nvidia.com/cuda/cublas/)
2. [NVIDIA Ada Lovelace Architecture Whitepaper](https://www.nvidia.com/)
3. [NVIDIA cuSOLVER Documentation](https://docs.nvidia.com/cuda/cusolver/)
4. [NVIDIA cuSPARSE Documentation](https://docs.nvidia.com/cuda/cusparse/)
5. [NVIDIA cuFFT Documentation](https://docs.nvidia.com/cuda/cufft/)
