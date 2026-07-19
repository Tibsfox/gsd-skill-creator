/**
 * Geometric Graph Manifold Recovery try-session -- mathematics (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/try-sessions/geometric-graph-manifold-recovery
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const geometricGraphManifoldRecoverySession: TrySessionDefinition = {
  id: 'math-geometric-graph-manifold-recovery-first-steps',
  title: "Recovering a Manifold from Its Random Geometric Graph",
  description:
    "Build a random geometric graph on a known manifold, use rescaled shortest-path distances to recover its geodesic metric, and measure the Gromov-Hausdorff error as you cross the critical average degree.",
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        "Sample 400 points uniformly on the unit circle S^1 (store their angles theta_i) and record the closed-form geodesic distance d(theta_i, theta_j) = min(|delta|, 2*pi - |delta|) as your ground-truth metric.",
      expectedOutcome:
        "You have a point cloud on a manifold whose true geodesic distances you know exactly, giving a baseline the graph-derived metric must reproduce.",
      hint: "Use arc length, not chord length — wrap the angle difference around 2*pi.",
      conceptsExplored: ["math-geometric-graph-manifold-recovery"],
    },
    {
      instruction:
        "Build the random geometric graph by connecting every pair of sampled points whose geodesic distance is below a radius r, then compute the mean vertex degree of the resulting graph.",
      expectedOutcome:
        "You see that mean degree is approximately n times the r-ball measure (here n*2r/2pi), and that this single quantity is the knob controlling connectivity.",
      hint: "Degree grows linearly in r; count neighbours per node and average over nodes.",
      conceptsExplored: ["math-geometric-graph-manifold-recovery"],
    },
    {
      instruction:
        "Run a breadth-first or Dijkstra shortest-path on the RGG to get hop counts between all pairs, then multiply every hop count by r to form a graph-based estimate of the geodesic distance.",
      expectedOutcome:
        "You observe that r times hops closely tracks the true geodesic for well-separated pairs, because each hop advances roughly a distance r along the manifold.",
      hint: "scipy.sparse.csgraph.shortest_path on the adjacency matrix returns all-pairs hop counts.",
      conceptsExplored: ["math-geometric-graph-manifold-recovery"],
    },
    {
      instruction:
        "Sweep r from large down toward zero and, at each value, record the size of the giant component and the maximum r-times-hops error; locate the r where the graph fragments and the error explodes.",
      expectedOutcome:
        "You identify the dimension-dependent critical degree below which the giant component breaks apart and forced detours inflate distances, so metric recovery fails.",
      hint: "Watch for mean degree crossing the ~log n connectivity scale as you shrink r.",
      conceptsExplored: ["math-geometric-graph-manifold-recovery"],
    },
    {
      instruction:
        "Compute the Gromov-Hausdorff distortion using the identity correspondence on the sampled points: take one-half of the maximum over pairs of |r*hops - geodesic|, and plot it against mean degree.",
      expectedOutcome:
        "You watch the GH distortion collapse toward zero once mean degree passes the critical value, witnessing the metric-space convergence the theorem asserts.",
      hint: "The half-max-distortion formula is the correspondence definition of the Gromov-Hausdorff distance.",
      conceptsExplored: ["math-geometric-graph-manifold-recovery", "math-optimal-transport"],
    },
    {
      instruction:
        "On the same RGG, estimate the Ollivier-Ricci curvature of a few edges by computing the Wasserstein-1 distance between the uniform measures on the two endpoints' neighbourhoods, and compare its sign to the circle's zero curvature.",
      expectedOutcome:
        "You see the discrete curvature concentrate near the manifold's true Ricci curvature, so the graph recovers local curvature as well as the global geodesic metric.",
      hint: "Ollivier's kappa = 1 - W1(m_x, m_y)/d(x,y); solve the small transport linear program between the neighbourhoods.",
      conceptsExplored: ["math-geometric-graph-manifold-recovery", "mathematics-ollivier-ricci-curvature", "math-optimal-transport"],
    },
    {
      instruction:
        "Contrast your empirical recovery with the Bakry-Emery curvature-dimension condition CD(K,N), noting which quantities live on the smooth limit versus on the raw graph, and argue why Gromov-Hausdorff convergence is the bridge between them.",
      expectedOutcome:
        "You articulate that analytic curvature-dimension bounds are properties of the continuum limit, while GH recovery certifies that the discretizing graph faithfully carries that geometry.",
      hint: "CD(K,N) is a Gamma-calculus statement about the smooth manifold, not about the finite graph itself.",
      conceptsExplored: ["math-geometric-graph-manifold-recovery", "math-bakry-emery-curvature-dimension", "mathematics-ollivier-ricci-curvature"],
    },
  ],
};
