# FOURIER, VECTORA, and STATOS

> **Domain:** Specialized Computation Engines
> **Module:** 3 -- FOURIER, VECTORA, and STATOS
> **Through-line:** *Three chips for three domains: signals, geometry, and statistics. Each exploits the GPU's massive parallelism differently -- FOURIER through the FFT's butterfly structure, VECTORA through embarrassingly parallel function evaluation, STATOS through independent Monte Carlo paths.*

---

## Table of Contents

1. [FOURIER: Signal Processing Engine](#1-fourier-signal-processing-engine)
2. [VECTORA: Vector Calculus and Geometry](#2-vectora-vector-calculus-and-geometry)
3. [STATOS: Statistical Engine](#3-statos-statistical-engine)
4. [Kernel Design Patterns](#4-kernel-design-patterns)
5. [Cross-References](#5-cross-references)
6. [Sources](#6-sources)

---

## 1. FOURIER: Signal Processing Engine

Built on cuFFT and cuFFTDx, FOURIER provides GPU-accelerated Fourier transforms and spectral analysis [1]:

### 1.1 cuFFT Capabilities

- 1D, 2D, and 3D transforms of complex and real-valued data
- Transform sizes up to 2^27 (134 million points) in a single call
- Batch transforms for processing multiple signals simultaneously
- In-place and out-of-place operation modes

### 1.2 cuFFTDx: The Device Extension

The breakthrough for the Math Co-Processor: cuFFTDx allows FFT operations to execute inside user kernels without host round-trips [1]:

- Traditional cuFFT: copy data to GPU -> launch FFT kernel -> read results back
- cuFFTDx: FFT embedded in computation pipeline, data never leaves VRAM
- For GSD-Tracker's real-time spectral analysis, audio transforms in-place without leaving VRAM

### 1.3 Performance

- 1D FFT of 2^20 complex single-precision values: <1 ms on RTX 4060 Ti
- Batch FFTs achieve higher throughput due to full SM occupancy
- Fused FFT + windowing + power spectrum in a single kernel launch

### 1.4 Operation Catalog

| Operation | Description | Use Case |
|-----------|-------------|---------|
| FFT (1D/2D/3D) | Forward Fourier transform | Spectral analysis |
| IFFT | Inverse Fourier transform | Signal reconstruction |
| Power spectrum | |FFT|^2 | Frequency content visualization |
| Convolution | FFT multiply IFFT | Filtering, correlation |
| Windowing | Hann, Hamming, Blackman | Spectral leakage reduction |
| STFT | Short-time Fourier transform | Time-frequency analysis |

---

## 2. VECTORA: Vector Calculus and Geometry

Custom CUDA kernels for operations that don't map to existing NVIDIA libraries [2]:

### 2.1 Gradient Computation

For a scalar field f: R^n -> R represented as a grid, the gradient at each grid point is computed via finite differences. One CUDA thread per grid point computes all gradient values simultaneously. For a 1024^3 grid: approximately 1 billion gradient evaluations in parallel [2].

### 2.2 Coordinate Transformations

Converting between Cartesian, polar, spherical, and cylindrical coordinates is embarrassingly parallel -- each point transforms independently. A batch of 1 million point transformations completes in microseconds [2].

### 2.3 Bezier and B-Spline Evaluation

GSD-Animate's easing curves are Bezier curves. Evaluating a cubic Bezier at N parameter values requires 4N multiplications and 3N additions -- perfectly suited to CUDA's SIMT execution model [2].

### 2.4 Operation Catalog

| Operation | Description | Use Case |
|-----------|-------------|---------|
| Gradient | Nabla f via finite differences | Physics simulation |
| Divergence | Div(F) for vector fields | Fluid dynamics |
| Curl | Curl(F) for vector fields | Electromagnetics |
| Jacobian | Full Jacobian matrix | Optimization, robotics |
| Hessian | Second-order derivatives | Newton's method |
| Coord transform | Cartesian/polar/spherical | Graphics, physics |
| Bezier eval | Cubic Bezier at N points | Animation easing |
| Distance field | Signed distance computation | Collision detection |

### 2.5 LLM-Generated Kernels

Recent research demonstrates that LLMs can generate optimized CUDA kernels matching or exceeding human-written performance. The KernelBench benchmark shows LLM-generated kernels achieving up to 179x speedup over naive implementations. For VECTORA, Claude can generate the custom kernels that the Math Co-Processor will use -- the AI writes its own math hardware [3].

---

## 3. STATOS: Statistical Engine

Custom CUDA kernels with cuRAND device API for random number generation [4]:

### 3.1 cuRAND Device API

GPU-accelerated random number generation with multiple algorithms [4]:

| Algorithm | Type | Properties |
|-----------|------|-----------|
| XORWOW | Pseudo-random | Default, good quality |
| MRG32K3a | Pseudo-random | Long period, high quality |
| MTGP32 | Mersenne Twister | Well-studied properties |
| Philox | Counter-based | Best for parallel streams |
| Sobol | Quasi-random | Low-discrepancy sequences |

The device API generates random numbers inside GPU kernels without host interaction -- critical for Monte Carlo performance [4].

### 3.2 Monte Carlo Simulation

The pattern: launch a kernel with N threads, each thread initializes its own RNG state, generates random variates, performs simulation logic, and writes results. No host-device synchronization during simulation. A Monte Carlo option pricing model with 100,000 paths and 252 time steps executes in milliseconds [4].

### 3.3 Statistical Reduction

Computing statistics over large datasets uses parallel reduction -- O(log n) in parallel depth. On RTX 4060 Ti, reducing 100 million values takes <5 ms. Reductions are fused with generation: a Monte Carlo kernel generates paths and accumulates running statistics in shared memory simultaneously [4].

### 3.4 Operation Catalog

| Operation | Description | Use Case |
|-----------|-------------|---------|
| Descriptive stats | Mean, median, variance, skew, kurtosis | Data analysis |
| Distributions | Normal, Poisson, binomial, chi-squared | Sampling |
| Hypothesis testing | t-test, chi-squared test, F-test | Statistical inference |
| Regression | Linear, polynomial, logistic | Model fitting |
| Monte Carlo | N-path simulation with cuRAND | Risk analysis, physics |
| Bootstrap | Resampled confidence intervals | Robust statistics |

---

## 4. Kernel Design Patterns

### 4.1 Embarrassingly Parallel

VECTORA's coordinate transforms and STATOS's Monte Carlo paths are embarrassingly parallel -- each element is independent. Maximum GPU utilization, minimal synchronization [2][4].

### 4.2 Reduction

STATOS's statistical aggregation uses tree reduction -- O(log n) parallel depth. Shared memory within each SM holds intermediate results; a second kernel reduces across SMs [4].

### 4.3 Fused Pipelines

cuFFTDx enables fused signal processing: windowing + FFT + power spectrum + peak detection in a single kernel. No intermediate global memory writes. STATOS similarly fuses generation + simulation + reduction [1][4].

---

## 5. Cross-References

| Project | Connection |
|---------|------------|
| [BPS](../BPS/index.html) | FOURIER: real-time spectral analysis for bio-physics sensors; STATOS: statistical significance testing |
| [GRD](../GRD/index.html) | VECTORA: gradient computation is the core operation of gradient descent optimization |
| [ECO](../ECO/index.html) | STATOS: Monte Carlo population modeling; ALGEBRUS: ecological covariance analysis |
| [LED](../LED/index.html) | FOURIER: frequency analysis of PWM waveforms; spectral content of LED driver signals |
| [DAA](../DAA/index.html) | FOURIER: audio spectral analysis; frequency-domain effects processing |
| [CMH](../CMH/index.html) | GPU architecture foundations; tensor cores and CUDA cores as the execution substrate |

---

## 6. Sources

1. [NVIDIA cuFFT and cuFFTDx Documentation](https://docs.nvidia.com/cuda/cufft/)
2. [CUDA Programming Guide -- Custom Kernels](https://docs.nvidia.com/cuda/cuda-c-programming-guide/)
3. [KernelBench: LLM-Generated CUDA Kernels](https://arxiv.org/abs/2404.11789)
4. [NVIDIA cuRAND Documentation](https://docs.nvidia.com/cuda/curand/)
