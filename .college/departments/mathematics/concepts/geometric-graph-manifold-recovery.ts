/**
 * Geometric Graph Manifold Recovery -- mathematics concept (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/concepts/geometric-graph-manifold-recovery
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 29 * 2 * Math.PI / 33;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const geometricGraphManifoldRecovery: RosettaConcept = {
  id: "math-geometric-graph-manifold-recovery",
  name: "Geometric Graph Manifold Recovery",
  domain: 'mathematics',
  description:
    "Sample n points i.i.d. from a smooth density on a compact d-dimensional Riemannian manifold M and join any two within a radius r_n: this is the random geometric graph (RGG) on M. Equip its giant component with the graph (hop-count) distance rescaled by r_n. The theorem: once the mean degree exceeds a dimension-dependent critical value, so near-geodesic paths percolate, this rescaled graph metric converges to (M, geodesic distance) in Gromov-Hausdorff distance — the infimum, over correspondences between the two spaces, of the worst pairwise distance distortion. Intuitively each hop advances about r_n along M, so r_n times the hop count tracks geodesic length; below the threshold, forced detours inflate it and recovery fails. This makes precise, with sharp constants, why shortest-path methods like Isomap reconstruct a manifold's entire geometry — not merely pointwise distances — from a point cloud. (arXiv:2606.01627v1, 2026)",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "Sample `X = rng.standard_normal((n, d+1)); X /= norm(X, axis=1, keepdims=True)` onto the sphere, then `A = cdist(X, X) < r` is the RGG. Hand `A` to `shortest_path`; `r * hops` is a numpy estimate of geodesic distance. Once `n * ball_vol(r)` clears the ~`log n` threshold, `max(abs(r*hops - geo))` — the Gromov-Hausdorff gap — shrinks in one vectorized sweep. See Penrose 2003.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "Own the sample in an `Eigen::MatrixXd P(n, d+1)` — contiguous, RAII-managed; a `template<int D>` radius predicate fills `std::vector<std::vector<int>> adj`. A BFS over `adj` writes hop counts into an `Eigen::MatrixXi`, scaled by `r` for geodesic estimates. As mean degree crosses the dimension-set threshold, the sup-norm gap to the true metric — the Gromov-Hausdorff distortion — decays, with no heap traffic in the inner loop. See Penrose 2003.",
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: "The RGG *is* data: an assoc-list `((v1 . neighbours) ...)` you `mapcar` over. `(defun hops (u v g) ...)` recurses a BFS frontier as nested lists; `(* r (hops u v g))` is symbolic geodesic length. A `(defmacro above-critical (deg) ...)` expands the degree test inline. Then `(reduce #'max (mapcar #'distortion pairs))` reads the Gromov-Hausdorff recovery straight off the S-expressions. See Penrose 2003.",
    }],
  ]),
  relationships: [
    {
      type: "dependency",
      targetId: "mathematics-ollivier-ricci-curvature",
      description: "Extends the discrete-to-smooth program of Ollivier-Ricci: that concept recovers local curvature from single-edge neighbourhood transport, while manifold recovery recovers the entire geodesic metric in Gromov-Hausdorff distance from all shortest paths — same RGG, but a global metric invariant rather than a pointwise curvature.",
    },
    {
      type: "cross-reference",
      targetId: "math-optimal-transport",
      description: "The Gromov-Wasserstein distance is the optimal-transport relaxation of the Gromov-Hausdorff distance used here, and neighbourhood optimal transport is exactly what converts the recovered graph metric into a discrete curvature reading.",
    },
    {
      type: "analogy",
      targetId: "math-bakry-emery-curvature-dimension",
      description: "Bakry-Emery states an analytic Gamma-calculus curvature-dimension condition CD(K,N) on the smooth limit; Gromov-Hausdorff recovery is the metric-geometric bridge certifying that the discretizing graph faithfully carries that synthetic geometry — a deliberately distinct theme, not a curvature duplicate.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
