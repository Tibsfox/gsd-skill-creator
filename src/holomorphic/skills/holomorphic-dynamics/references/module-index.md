# Holomorphic Dynamics Module Index

Quick reference for all 10 modules in the educational pack.

| Module | Title | Key Concepts | Path |
|--------|-------|-------------|------|
| HD-01 | Iteration on the Complex Plane | Orbits, escape radius, escape time, quadratic map | `modules/HD-01/` |
| HD-02 | Fixed Points and Stability | Multiplier, classification, basins of attraction | `modules/HD-02/` |
| HD-03 | The Mandelbrot Set | Parameter space, cardioid, period bulbs, rendering | `modules/HD-03/` |
| HD-04 | Julia Sets and Fatou Sets | Fatou-Julia dichotomy, connected vs Cantor dust | `modules/HD-04/` |
| HD-05 | Cycles and Period Doubling | Period-n cycles, Feigenbaum constant, bifurcation | `modules/HD-05/` |
| HD-06 | Topology of the Complex Plane | Connectedness, Riemann sphere, conformal maps | `modules/HD-06/` |
| HD-07 | From Dynamics to Deep Learning | Neural nets as iterated maps, training dynamics | `modules/HD-07/` |
| HD-08 | Skill-Creator as a Dynamical System | Skill positions, contractive maps, Fatou-Julia skills | `modules/HD-08/` |
| HD-09 | Dynamic Mode Decomposition | SVD-based DMD, DMDc, mrDMD, piDMD, BOP-DMD | `modules/HD-09/` |
| HD-10 | Koopman Operator Theory | EDMD, dictionary lifting, spectral decomposition | `modules/HD-10/` |

## File Structure

Each module directory contains:

- `content.md` -- Educational markdown (60-80 lines)
- `try-session.ts` -- Interactive TypeScript demo (exports `runTrySession`)
- `try-session.py` -- Python demo using PyDMD (HD-09, HD-10 only)
- `references/` -- Research paper summaries (HD-06, HD-09 only)

## Core Libraries

| Library | Path | Description |
|---------|------|-------------|
| Types | `src/holomorphic/types.ts` | Shared type definitions |
| Complex arithmetic | `src/holomorphic/complex/arithmetic.ts` | add, sub, mul, div, magnitude, cexp, cpow |
| Iteration engine | `src/holomorphic/complex/iterate.ts` | computeOrbit, detectPeriod, classifyFixedPoint |
| Fractal renderer | `src/holomorphic/renderer/core.ts` | renderMandelbrot, renderJulia |
| Visualization helpers | `src/holomorphic/renderer/helpers.ts` | renderBifurcation, renderOrbitPlot, renderPhasePortrait |
| Eigenvalue plot | `src/holomorphic/renderer/eigenvalue-plot.ts` | plotEigenvaluesOnUnitCircle |
| Skill dynamics | `src/holomorphic/dynamics/skill-dynamics.ts` | classifySkillDynamics, classifyFatouJulia |
| DMD core | `src/holomorphic/dmd/dmd-core.ts` | dmd, svd, classifyDMDEigenvalue |
| DMD control | `src/holomorphic/dmd/dmd-control.ts` | dmdc |
| DMD multiresolution | `src/holomorphic/dmd/dmd-multiresolution.ts` | mrdmd |
| DMD physics | `src/holomorphic/dmd/dmd-physics.ts` | pidmd |
| DMD robust | `src/holomorphic/dmd/dmd-robust.ts` | bopdmd |
| Koopman / EDMD | `src/holomorphic/dmd/koopman.ts` | edmd, liftDictionary |
| Skill-DMD bridge | `src/holomorphic/dmd/skill-dmd-bridge.ts` | bridgeDMDToSkillDynamics |
