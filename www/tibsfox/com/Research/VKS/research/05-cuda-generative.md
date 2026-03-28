# CUDA Generative Math -- Noise, Reaction-Diffusion & Evolutionary Substrates

## Overview

When the human walks away, the GPU is free. The CUDA Generative Math layer treats that freedom as a resource: the full GPU compute pipeline available for generative art, evolutionary algorithms, and mathematical exploration. This module covers the CUDA kernel library that provides the mathematical substrate for the screensaver engine's most dynamic visual content.

## CUDA Toolkit Integration

The engine targets CUDA 12.x with the following libraries:

- **cuRAND** -- GPU-accelerated random number generation
- **cuFFT** -- Fast Fourier Transform for spectral analysis
- **cuBLAS** -- Dense linear algebra for matrix operations
- **Thrust** -- High-level parallel algorithms

### cuRAND Noise Generation

Procedural noise is the foundation of generative visuals. The engine provides five noise types, all generated on GPU:

**Perlin Noise**
- 2D and 3D implementations using cuRAND for permutation tables
- Octave stacking (1-8 octaves) for fractal Brownian motion (fBm)
- Time-varying seed for animated noise fields

**Simplex Noise**
- Ken Perlin's improved algorithm (2001)
- Better isotropy than classic Perlin noise
- Lower computational cost in higher dimensions

**Worley / Cellular Noise**
- Voronoi-based cellular patterns
- F1, F2, and F2-F1 distance metrics
- Produces organic, cell-like structures

**Value Noise**
- Simplest noise type: random values at integer coordinates, interpolated
- Fast to compute, useful for displacement maps

**Blue Noise**
- Spatially uniform random distribution
- Generated via dart-throwing algorithm on GPU
- Used for dithering and anti-aliased sampling

## Reaction-Diffusion Systems

Reaction-diffusion (RD) systems produce some of the most visually striking generative patterns: Turing patterns, spots, stripes, spirals, and labyrinthine structures.

### Gray-Scott Model

The canonical two-chemical RD system:

```
dU/dt = Du * laplacian(U) - U*V^2 + f*(1-U)
dV/dt = Dv * laplacian(V) + U*V^2 - (f+k)*V
```

Parameters `f` (feed rate) and `k` (kill rate) control the pattern type:
- f=0.055, k=0.062 -- spots
- f=0.030, k=0.062 -- stripes
- f=0.025, k=0.060 -- spirals
- f=0.078, k=0.061 -- mitosis

The CUDA kernel runs on a 2D grid with shared memory optimization for the Laplacian stencil. At 1920x1080 resolution, the system achieves 200+ iterations per frame at 60fps on an RTX 4060 Ti.

### Belousov-Zhabotinsky (BZ) Model

A three-chemical oscillating reaction producing spiral waves:

```
da/dt = a(b - c) + Da * laplacian(a)
db/dt = b(c - a) + Db * laplacian(b)
dc/dt = c(a - b) + Dc * laplacian(c)
```

The BZ model produces rotating spiral arms that interact, annihilate, and reform -- mesmerizing in screensaver context.

## Fluid Simulation

### Stable Fluids (Jos Stam Method)

The Navier-Stokes equations solved on GPU via the Stable Fluids algorithm:

1. **Advection** -- Semi-Lagrangian back-tracing
2. **Diffusion** -- Jacobi iteration (20-40 iterations)
3. **Projection** -- Pressure solve via Jacobi, divergence-free correction
4. **External forces** -- Random vortex injection for continuous motion

The fluid field drives color advection, producing ink-in-water effects.

## N-Body Gravity

A gravitational N-body simulation with 10,000-100,000 particles:

- All-pairs O(N^2) computation parallelized across CUDA blocks
- Softening parameter prevents singularities at close approach
- Leapfrog (Verlet) integration for energy conservation
- Color mapping by velocity magnitude

The result: galaxies forming, colliding, and reforming in real time.

## Evolutionary Algorithm Substrates

This layer provides the genetic operators used by the AI Evolution Engine:

- **Tournament selection** -- Select parents from population by fitness comparison
- **Crossover** -- Uniform and single-point crossover of shader parameter vectors
- **Mutation** -- Gaussian perturbation of parameters with adaptive step size
- **Fitness evaluation** -- GPU-parallel evaluation of population members

## Vulkan-CUDA Interop

All CUDA outputs are shared with Vulkan via external memory:

```
cudaExternalMemoryHandleDesc desc;
desc.type = cudaExternalMemoryHandleTypeOpaqueFd;
desc.handle.fd = vulkan_export_fd;
desc.size = buffer_size;
cudaImportExternalMemory(&ext_mem, &desc);
```

This zero-copy path keeps all data on GPU -- no readback to CPU.

## Cross-References

> **Related:** [Vulkan Engine Architecture](02-vulkan-engine.md) for the interop layer, [AI Evolution Engine](06-ai-evolution.md) for how these substrates are used in evolutionary art.
