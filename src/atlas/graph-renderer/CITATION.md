# Atlas graph-renderer — citations & implementer's notes

This module is a clean-room replacement for Cytoscape.js's WebGL renderer.
ADR 0003 forbids new external runtime deps for `src/atlas/*`; the algorithms
below were re-implemented from the primary literature, not derived from a
prior implementation.

## Primary references

- **Fruchterman, T. M. J. & Reingold, E. M. (1991).** "Graph Drawing by
  Force-directed Placement." *Software: Practice and Experience* 21(11),
  1129-1164. — attractive force `f_a(d) = d²/k`, repulsive force
  `f_r(d) = -k²/d`, optimal edge length `k = C·√(area/n)`, linear cooling
  schedule, frame-confined displacement cap by current temperature.
- **Barnes, J. & Hut, P. (1986).** "A hierarchical O(N log N) force-calculation
  algorithm." *Nature* 324, 446-449. — recursive quad-cell decomposition,
  per-cell center-of-mass pseudo-particle, opening criterion `s/d < θ` for
  cluster-as-single-body approximation.
- **Khronos Group (2017).** *OpenGL ES 3.0 / WebGL 2.0 specification.* —
  instanced array rendering (`drawArraysInstanced`, `vertexAttribDivisor`)
  for one-draw-call-per-primitive-type.

## Algorithm choices

- **θ = 0.9** (Barnes-Hut opening): looser than the Barnes-Hut paper's typical
  0.5; trades ~1% energy accuracy for ~3× per-iteration speed-up. Layouts
  remain visually indistinguishable at this θ for graphs in the 100–10K
  node range.
- **C = 1.0** (FR optimal-edge constant): tuned for unit-mass nodes in a
  square bounding box; raise for wider ideal spacing.
- **Linear cooling**: `t ← max(0, t − t₀/iterations)`. The FR paper is
  explicit that any monotonically decreasing schedule converges; linear was
  chosen for predictability.
- **Iterations = 200 default**: empirically sufficient for 3K-node symbol
  graphs to reach `lastMaxDisp < 0.5` on commodity hardware in < 5 s
  (mission performance target). No formal convergence proof — this is an
  iterative heuristic, not a fixed-point algorithm.

## Numerical-stability notes

- **Coincident bodies.** Two bodies at identical positions trigger a 1/0
  divergence in the repulsion sum. Mitigated by a 1e-3 deterministic offset
  when the squared distance falls below 1e-6.
- **Initial-condition seeding.** Nodes at the exact origin are jittered onto
  the bounding box on the first tick (deterministic via Mulberry32). Without
  this, the first quadtree degenerates to a single empty cell.
- **Bounding-box clamping.** Each tick clamps positions to the FR bounding
  box; this is the original FR paper's frame-confinement and prevents
  runaway translation when the graph is disconnected.
- **Float32 round-trip.** `worldToScreen ∘ screenToWorld` is an exact
  inverse modulo IEEE-754 fp rounding; tests assert ≤1e-6 round-trip error.

## Performance budget

- **Per-iteration cost.** Quadtree build + walk dominates. Budget for 3K
  nodes at 200 iterations ≤ 5 s wall time → ≤ 25 ms per iteration. The
  Barnes-Hut walk is `O(n log n)` with θ=0.9 → ~3K · 11 ≈ 33K body
  visits per tick; the inner loop is a few dozen flops, which fits.
- **Frame budget for 3K-node steady-state at 30 FPS.** Two draw calls
  (edges as instanced LINES, nodes as instanced TRIANGLE_STRIP); upload
  cost is a single `bufferSubData` per primitive type. The mission
  performance target (≥30 FPS at 3K nodes) is set by upload + draw, both
  O(n) and well below 16 ms on integrated GPUs.
- **LOD breakpoints** (see `lod.ts`): labels off above 3K visible nodes;
  edges off at zoom < 0.4 above 5K nodes.

## What lives here vs. layered above

This module is the *primitive*. The view component (Wave 1+) layers on top
with: graph-data ingest, label rendering, animation tweens, selection state,
keyboard navigation. None of those concerns leak into this primitive.
