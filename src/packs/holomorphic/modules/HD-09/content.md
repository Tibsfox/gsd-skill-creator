---
module: HD-09
title: "Dynamic Mode Decomposition"
textbook_chapters: [26, 27, 11, 12, 13]
textbook_chapters_confidence: medium
textbook_chapters_note: "Dynamic Mode Decomposition IS spectral decomposition (Ch 26–27, Part VIII: Unification) and IS educational linear algebra (Ch 11–13, Part IV: Structure). dmd() IS the construction of a linear evolution operator from snapshot data. svd() IS an educational SVD from linear algebra axioms."
---

# HD-09: Dynamic Mode Decomposition

## What is DMD?

Dynamic Mode Decomposition (DMD) is a **data-driven** method for extracting
coherent spatiotemporal patterns (dynamic modes) from time-series data. Given
a sequence of snapshots from a dynamical system, DMD finds the best-fit linear
operator that advances the system forward in time.

## The Algorithm

1. **Collect snapshots:** Arrange measurements into matrices
   X = [x_1, x_2, ..., x_{n-1}] and X' = [x_2, x_3, ..., x_n].
2. **Linear model:** Assume X' = AX for some unknown operator A.
3. **SVD of X:** Compute X = U * Sigma * V* (singular value decomposition).
4. **Project to reduced space:** Form the projected operator
   A_tilde = U* X' V Sigma^{-1}, a small r x r matrix.
5. **Eigendecomposition:** The eigenvalues of A_tilde approximate
   eigenvalues of A; modes are recovered via Phi = X' V Sigma^{-1} W,
   where W contains eigenvectors of A_tilde.

The SVD step is critical: it compresses high-dimensional data into a
low-rank representation, filtering noise and revealing dominant structures.

## Eigenvalues and the Unit Circle

DMD eigenvalues live in the complex plane, and their position relative
to the **unit circle** determines system behavior:

- **|lambda| < 1 (inside):** decaying mode, energy dissipates over time
- **|lambda| = 1 (on circle):** persistent/neutral mode, neither growing nor decaying
- **|lambda| > 1 (outside):** growing mode, energy amplifies over time

Eigenvalues with significant imaginary parts represent oscillatory behavior:
oscillating decay when |lambda| < 1, oscillating growth when |lambda| > 1.

## Connection to Holomorphic Dynamics

DMD eigenvalues map directly to concepts from holomorphic dynamics:

- Eigenvalues **on** the unit circle correspond to **periodic orbits**
- Eigenvalues **inside** the circle act like **attracting fixed points** (multiplier |lambda| < 1)
- Eigenvalues **outside** the circle act like **repelling fixed points** (multiplier |lambda| > 1)

The multiplier of a fixed point z* under f is f'(z*). In DMD, the eigenvalue
IS the multiplier of the discrete-time linear map. This bridge lets us apply
fixed-point classification (HD-02) directly to data-driven mode analysis.

## The Parker Connection

Matt Parker's video "But what is a partial differential equation?" illustrates
how PDEs connect spatial patterns to time evolution. DMD provides the
computational bridge: given spatiotemporal data (e.g., fluid flow snapshots),
DMD extracts the spatial patterns (modes) and their temporal dynamics
(eigenvalues/frequencies). Each mode evolves as lambda^t, connecting
the PDE's spatial structure to exponential time evolution.

## DMD Variants

The standard DMD algorithm has inspired numerous extensions:

- **Exact DMD:** Projects modes back to high-dimensional space for
  exact reconstruction (Phi = X' V Sigma^{-1} W).
- **Optimized DMD:** Solves a nonlinear optimization to minimize
  reconstruction error directly.
- **Compressed DMD:** Uses random projections to reduce computational
  cost for very high-dimensional systems.
- **Streaming DMD:** Updates the decomposition incrementally as new
  snapshots arrive, without storing the full data matrix.
- **Multi-resolution DMD (MrDMD):** Applies DMD at multiple time scales,
  separating fast and slow dynamics hierarchically.
- **piDMD (Physics-Informed DMD):** Constrains eigenvalues to respect
  known physics, e.g., |lambda| <= 1 for dissipative systems.

## piDMD and Bounded Learning

The piDMD constraint |lambda| <= 1 + epsilon mirrors skill-creator's
**bounded learning principle**: no more than 20% content change per
refinement cycle. Both enforce stability by preventing unbounded growth.
A piDMD eigenvalue exceeding the stability bound triggers the same
response as a skill refinement exceeding the 20% limit: reject and
constrain to the boundary.
