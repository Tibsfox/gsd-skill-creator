# PyDMD Reference

## Overview

[PyDMD](https://github.com/mathLab/PyDMD) is a Python library implementing
Dynamic Mode Decomposition and its variants. It provides a consistent API
for modal analysis of dynamical systems from data.

## Key Classes

| Class | Description |
|-------|-------------|
| `DMD` | Standard Dynamic Mode Decomposition |
| `BOPDMD` | Bagging Optimized DMD for noisy data |
| `CDMD` | Compressed DMD with random projections |
| `HankelDMD` | Time-delay embedding via Hankel matrices |
| `MrDMD` | Multi-resolution DMD for multi-scale dynamics |
| `piDMD` | Physics-informed DMD with eigenvalue constraints |
| `SpDMD` | Sparsity-promoting DMD for mode selection |
| `EDMD-DL` | Extended DMD with deep learning observables |

## API Pattern

All PyDMD classes follow a consistent interface:

```python
dmd = DMD(svd_rank=r)
dmd.fit(X)           # Fit the model to snapshot data
dmd.eigs             # Eigenvalues (complex)
dmd.modes            # Dynamic modes (complex matrix)
dmd.dynamics         # Time evolution of each mode
dmd.reconstructed_data  # Reconstructed snapshots
dmd.predict(t)       # Predict state at future times
```

## Connection to Our Implementation

Our TypeScript DMD (`src/holomorphic/dmd/dmd-core.ts`) implements the
core algorithm with educational clarity. While PyDMD uses NumPy/SciPy
for production linear algebra, our version uses explicit power iteration
SVD and direct eigensolvers to make each step transparent.

Key mapping:
- `PyDMD.fit(X)` maps to `dmd(snapshots)`
- `PyDMD.eigs` maps to `DMDResult.eigenvalues`
- `PyDMD.modes` maps to `DMDResult.modes`
- `PyDMD.dynamics` maps to `reconstructFromDMD(result, t)`
