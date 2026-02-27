# Holomorphic Dynamics Educational Pack

## Overview

The Holomorphic Dynamics Educational Pack is a self-contained TypeScript
library and curriculum covering the mathematics of iteration on the
complex plane, fractal geometry, and modern data-driven dynamics. It is
designed for developers, students, and curious minds who want to understand
how simple iteration rules produce fractal structures of extraordinary
complexity, and how those same mathematical ideas connect to deep learning,
skill systems, and data-driven modeling.

The pack contains:

- **10 progressive modules** (HD-01 through HD-10) with educational
  markdown content and interactive try-sessions
- **Complex arithmetic library** -- all operations from scratch, no
  external math dependencies
- **Iteration engine** -- orbit computation, period detection, fixed-point
  classification
- **Fractal renderer** -- Mandelbrot set, Julia sets, bifurcation diagrams,
  orbit plots, phase portraits
- **Skill dynamics model** -- maps skill-creator onto the complex plane
  using holomorphic dynamics
- **DMD suite** -- five Dynamic Mode Decomposition variants (standard,
  control, multi-resolution, physics-informed, robust bootstrap)
- **Koopman operator** -- Extended DMD with dictionary lifting for
  nonlinear dynamics analysis
- **187 tests** across 23 test files with full coverage of all algorithms

No external math libraries are used. Every algorithm (SVD, eigensolve,
complex exponential, DMD) is implemented educationally so learners can
trace every step.

## Architecture

```
src/holomorphic/
  index.ts                      # Master barrel -- all public exports
  types.ts                      # Shared type definitions
  README.md                     # This file
  complex/
    arithmetic.ts               # Complex number operations
    iterate.ts                  # Iteration engine
  renderer/
    core.ts                     # Mandelbrot/Julia fractal renderer
    helpers.ts                  # Bifurcation, orbit, phase portrait
    eigenvalue-plot.ts          # DMD eigenvalue unit-circle plot
  dynamics/
    skill-dynamics.ts           # Skill-creator dynamical model
  dmd/
    types.ts                    # DMD type definitions
    dmd-core.ts                 # Standard DMD via SVD
    dmd-control.ts              # DMDc (control inputs)
    dmd-multiresolution.ts      # mrDMD (time-scale separation)
    dmd-physics.ts              # piDMD (physics-informed)
    dmd-robust.ts               # BOP-DMD (bootstrap optimization)
    koopman.ts                  # EDMD (Extended DMD / Koopman)
    skill-dmd-bridge.ts         # DMD eigenvalue to skill dynamics
  modules/
    HD-01/ through HD-10/       # Educational modules
      content.md                # Educational text
      try-session.ts            # Interactive TypeScript demo
      try-session.py            # Python demo (HD-09, HD-10 only)
      references/               # Research paper notes (HD-06, HD-09)
  skills/
    holomorphic-dynamics/
      SKILL.md                  # Skill definition for skill-creator
      references/
        module-index.md         # Quick-reference table
```

### Design Principles

1. **Educational transparency** -- Every algorithm shows its work. The SVD
   uses power iteration with deflation. The eigensolve uses the QR shift.
   No black boxes.

2. **Progressive disclosure** -- Modules build on each other. HD-01 teaches
   iteration before HD-02 teaches fixed points before HD-03 teaches the
   Mandelbrot set.

3. **Self-contained** -- Zero external math dependencies. The complex
   arithmetic, linear algebra, and DMD algorithms are all implemented
   in TypeScript.

4. **Dual track** -- Classical dynamics (HD-01 through HD-08) and
   data-driven dynamics (HD-09, HD-10) converge through the skill-DMD
   bridge.

## Modules

### HD-01: Iteration on the Complex Plane

Introduces orbits of the quadratic map f(z) = z^2 + c. Defines escape
radius, escape time, and the four fundamental orbit behaviors: converging,
periodic, chaotic, and escaping. This is the computational foundation for
everything that follows.

**Learning objectives:** Understand iteration, compute orbits, recognize
escape behavior, use escape time as a coloring function.

### HD-02: Fixed Points and Stability

Analyzes convergent orbits through the multiplier lambda = f'(z*). Covers
the classification: superattracting (|lambda| = 0), attracting (0 < |lambda| < 1),
rationally indifferent (|lambda| = 1, rational angle), irrationally
indifferent (|lambda| = 1, irrational angle), and repelling (|lambda| > 1).

**Learning objectives:** Compute multipliers, classify fixed points,
understand basins of attraction.

### HD-03: The Mandelbrot Set

The parameter space of the quadratic family. The Mandelbrot set M is the
set of c-values for which the critical orbit (starting from z = 0) remains
bounded. Covers the main cardioid, period bulbs, antenna, and the
connection between M and Julia sets.

**Learning objectives:** Understand parameter vs dynamical space, render
the Mandelbrot set, identify components.

### HD-04: Julia Sets and Fatou Sets

For each c, the Julia set J(f) partitions the plane into the chaotic
Julia set and the stable Fatou set. Connected Julia sets occur when
c is in M; Cantor dust Julia sets occur when c is outside M.

**Learning objectives:** Understand the Fatou-Julia dichotomy, render
Julia sets, relate Julia topology to the Mandelbrot set.

### HD-05: Cycles and Period Doubling

Periodic orbits and the route to chaos. Period doubling cascades through
periods 1, 2, 4, 8, 16, ... converge at the Feigenbaum point with the
universal ratio delta = 4.669... Bifurcation diagrams visualize this
transition.

**Learning objectives:** Find periodic orbits, compute bifurcation
diagrams, understand Feigenbaum universality.

### HD-06: Topology of the Complex Plane

The topological properties that constrain dynamical systems: connectedness,
simple connectedness, compactness, the Riemann sphere (one-point
compactification), and conformal equivalence. Includes references to
Meyerson, Greene-Lobb, and the MAT327 topology course.

**Learning objectives:** Understand topological invariants, see how
topology constrains dynamics, work with the Riemann sphere.

### HD-07: From Dynamics to Deep Learning

Neural networks as iterated function composition. Each layer applies
a map (linear transformation + activation), and training is iteration
in parameter space. Learning rate is analogous to the parameter c:
too small gives slow convergence, too large gives divergence, and
critical values produce period doubling in loss curves.

**Learning objectives:** See the dynamics-DL analogy, understand
training as iteration, connect bifurcation to learning rate schedules.

### HD-08: Skill-Creator as a Dynamical System

Maps the skill-creator system onto the complex plane. Each skill has
position z = r * e^(i*theta) where r is distance from mastery and
theta encodes domain. The contractive affine map f(z) = alpha*z + beta
models skill evolution. Fixed-point classification maps directly to
skill states: superattracting = compiled, attracting = improving,
indifferent = stalled, repelling = degrading.

**Learning objectives:** Model skills as complex dynamical systems,
classify skill health using multiplier theory, use Fatou-Julia to
separate stable from chaotic skill domains.

### HD-09: Dynamic Mode Decomposition

Data-driven extraction of spatiotemporal modes from snapshot data.
Standard DMD uses SVD to find a low-rank linear operator. Eigenvalues
on the complex plane classify modes: inside the unit circle (decaying),
outside (growing), on the circle (neutral/oscillatory). Four variants
extend the base algorithm: DMDc (control inputs), mrDMD (time-scale
separation), piDMD (physics-informed eigenvalue constraints), and
BOP-DMD (robust bootstrap optimization).

**Learning objectives:** Implement DMD from scratch, classify eigenvalues,
understand how constraints shape the dynamics.

### HD-10: Koopman Operator Theory

The theoretical crown. The Koopman operator K acts on observable
functions g: X -> R rather than state vectors x in X, lifting nonlinear
dynamics into an infinite-dimensional linear space. EDMD approximates K
using dictionary functions (polynomials, radial basis functions) and
standard DMD on the lifted data. The skill-DMD bridge connects DMD
eigenvalue classifications back to skill dynamics.

**Learning objectives:** Understand the Koopman operator, implement EDMD
with dictionary lifting, bridge data-driven and classical dynamics.

## Core API Reference

### Complex Arithmetic

```typescript
import { add, sub, mul, div, magnitude, argument, conjugate, cexp, cpow } from './';
```

All operations work on `ComplexNumber = { re: number; im: number }`.
Constants `ZERO`, `ONE`, `I` are provided.

### Iteration

```typescript
import { computeOrbit, detectPeriod, classifyFixedPoint } from './';
```

- `computeOrbit(z0, f, maxIter, escapeRadius)` -- Returns `Orbit` with
  points, escaped flag, and escape time
- `detectPeriod(orbit)` -- Uses Floyd's cycle detection to find period
- `classifyFixedPoint(multiplier)` -- Returns classification from multiplier

### Rendering

```typescript
import { renderMandelbrot, renderJulia, renderBifurcation } from './';
```

- `renderMandelbrot(width, height, bounds, maxIter)` -- Escape-time grid
- `renderJulia(c, width, height, bounds, maxIter)` -- Julia set grid
- `renderBifurcation(cRange, zInit, maxIter, lastN)` -- Bifurcation data

### Dynamics

```typescript
import { classifySkillDynamics, classifyFatouJulia } from './';
```

- `classifySkillDynamics(position)` -- Full dynamics classification
- `classifyFatouJulia(position)` -- Stable (Fatou) vs chaotic (Julia)

### DMD

```typescript
import { dmd, dmdc, mrdmd, pidmd, bopdmd, edmd } from './';
```

All DMD functions take a `SnapshotMatrix` (2D number array) and return
eigenvalues, modes, and amplitudes. Variants accept additional config:

- `dmd(X)` -- Standard DMD
- `dmdc(X, B)` -- With control matrix
- `mrdmd(X, levels)` -- Multi-resolution decomposition
- `pidmd(X, constraints)` -- Physics-informed constraints
- `bopdmd(X, config)` -- Bootstrap optimization
- `edmd(X, config)` -- Extended DMD with Koopman dictionary

### Bridge

```typescript
import { bridgeDMDToSkillDynamics } from './';
```

Maps DMD eigenvalue spectrum to skill dynamics classifications,
selecting the dominant mode by |amplitude| * |eigenvalue| weighting.

## Try Sessions

Each module (except HD-06) includes a `try-session.ts` that exports a
`runTrySession()` function. These are standalone demonstrations that
import from the holomorphic barrel and print results to the console.

HD-09 and HD-10 also include `try-session.py` files designed for use
with the PyDMD library, providing Python-native comparisons with the
TypeScript implementations.

To run a try-session:

```typescript
import { runTrySession } from './modules/HD-01/try-session';
runTrySession();
```

## Learning Path

**Recommended order:** HD-01 -> HD-02 -> HD-03 -> HD-04 -> HD-05 ->
HD-06 -> HD-07 -> HD-08 -> HD-09 -> HD-10

The first six modules form the classical core. HD-07 and HD-08 are
application modules. HD-09 and HD-10 introduce data-driven methods.

For learners focused on data-driven dynamics, the minimum path is:
HD-01 -> HD-02 -> HD-09 -> HD-10.

For learners focused on skill-creator integration:
HD-01 -> HD-02 -> HD-04 -> HD-08.

## Mathematical Background

### Complex Iteration

Given f: C -> C and z_0 in C, the orbit {z_0, z_1 = f(z_0), z_2 = f(z_1), ...}
describes the evolution of z_0 under repeated application of f. For the
quadratic family f(z) = z^2 + c, the parameter c determines whether
orbits converge, cycle, escape, or behave chaotically.

### Fixed Points and Multipliers

A fixed point z* satisfies f(z*) = z*. The multiplier lambda = f'(z*)
determines local behavior: |lambda| < 1 attracts nearby orbits,
|lambda| > 1 repels them, and |lambda| = 1 is the critical boundary.

### The Mandelbrot Set

M = { c in C : the orbit of 0 under z^2 + c does not escape to infinity }.
The boundary of M is where dynamics transition between bounded and
unbounded behavior. Every point c in M corresponds to a connected Julia
set; every point outside M gives a Cantor-dust Julia set.

### Dynamic Mode Decomposition

Given snapshots X = [x_1, ..., x_m], DMD finds a matrix A such that
x_{k+1} ~ A * x_k. The SVD of X allows low-rank approximation of A,
yielding eigenvalues (growth rates and frequencies) and modes
(spatial patterns). Eigenvalue position relative to the unit circle
classifies mode behavior.

### The Koopman Operator

For a dynamical system x_{k+1} = F(x_k), the Koopman operator K acts
on observables: (Kg)(x) = g(F(x)). This is linear even when F is
nonlinear, enabling spectral analysis of nonlinear systems. EDMD
approximates K in a finite dictionary of observables.

## Connection to Skill-Creator

Module HD-08 provides the theoretical foundation for modeling
skill-creator as a dynamical system. The key insight is that each
skill's trajectory through learning is an orbit under a contractive
map on the complex plane. The fixed-point classification from HD-02
gives a mathematically rigorous taxonomy of skill health states.

The DMD bridge (HD-09/HD-10) enables data-driven analysis of actual
skill trajectories, extracting growth/decay rates and oscillation
frequencies from observed skill position histories without requiring
an explicit model.

## Dependencies

- **TypeScript** -- All source code
- **Vitest** -- Test framework (187 tests across 23 files)
- **No external math libraries** -- Complex arithmetic, SVD, eigensolve,
  and all DMD algorithms are implemented from scratch for educational
  transparency
- **Optional: PyDMD** -- Python try-sessions for HD-09 and HD-10 use
  PyDMD for comparison, but are not required for the TypeScript pack
