/**
 * Discrete Nodal Domains try-session -- mathematics (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/try-sessions/discrete-nodal-domains
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const discreteNodalDomainsSession: TrySessionDefinition = {
  id: 'math-discrete-nodal-domains-first-steps',
  title: "Bounding λ₂ with Discrete Nodal Domains",
  description:
    "Derive the sharp upper bound on a graph's second adjacency eigenvalue by decomposing a sign-changing eigenvector into nodal domains and treating each as a Dirichlet ground-state subproblem, then verify it numerically.",
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        "Take the path graph P6 (vertices 1..6 in a line), write down its 6x6 adjacency matrix A by hand, and compute all six eigenpairs with numpy eigh or the closed form λ_k = 2·cos(kπ/7).",
      expectedOutcome:
        "You obtain six adjacency eigenvalues and see that the largest one, λ₁, has an eigenvector that is strictly positive on every vertex — the Perron vector.",
      hint: "For a path, eigenvectors are sinusoids v_k(j) = sin(k·j·π/(n+1)); the top one has no sign change.",
      conceptsExplored: ["math-discrete-nodal-domains", "math-perron-frobenius-centrality"],
    },
    {
      instruction:
        "Confirm the top eigenvector is everywhere positive (one nodal domain), then use its orthogonality to the second eigenvector to argue that the second eigenvector must take both signs.",
      expectedOutcome:
        "You reason that a vector orthogonal to an everywhere-positive vector cannot be single-signed, so the second eigenvector has at least two nodal domains.",
      hint: "Sum of (positive Perron entries)·(second-eigenvector entries) must be zero — that forces a sign change.",
      conceptsExplored: ["math-discrete-nodal-domains", "math-perron-frobenius-centrality"],
    },
    {
      instruction:
        "Partition the six vertices by the sign of the second eigenvector and list the maximal connected same-sign blocks; these are the strong nodal domains S+ and S−.",
      expectedOutcome:
        "You see that a strong nodal domain is exactly a connected component of the sign-induced subgraph, and for P6 the domains are two adjacent sub-paths.",
      hint: "Zero-valued vertices would break connectivity; for a generic eigenvector there are none.",
      conceptsExplored: ["math-discrete-nodal-domains"],
    },
    {
      instruction:
        "On S+, write (Av)_i = λ·v_i for a vertex i, split the neighbor sum into in-domain and out-of-domain parts, and show the out-of-domain part is ≤ 0.",
      expectedOutcome:
        "You derive A_{S+}·v_{S+} = λ·v_{S+} − (boundary term) with boundary term ≤ 0, hence A_{S+}·v_{S+} ≥ λ·v_{S+} componentwise on the positive vector v_{S+}.",
      hint: "Neighbors outside S+ are either in S− (negative) or zero, so their contribution can never be positive.",
      conceptsExplored: ["math-discrete-nodal-domains"],
    },
    {
      instruction:
        "Apply the Collatz–Wielandt characterization: for a positive vector x with A_S·x ≥ μ·x, the spectral radius ρ(A_S) ≥ μ. Instantiate it with μ = λ₂ and x = v_{S+}.",
      expectedOutcome:
        "You conclude λ₂ ≤ ρ(G[S+]), the spectral radius of the induced positive-nodal-domain subgraph — the Dirichlet-domain-monotonicity bound.",
      hint: "Collatz–Wielandt: ρ = max over positive x of min_i (Ax)_i / x_i.",
      conceptsExplored: ["math-discrete-nodal-domains", "math-perron-frobenius-centrality"],
    },
    {
      instruction:
        "Numerically compute ρ(G[S+]) for your P6 positive nodal domain (a shorter path) and compare it to the actual λ₂ of the full P6; check the inequality and how tight it is.",
      expectedOutcome:
        "You verify λ₂(P6) ≤ ρ(sub-path) holds and is near-sharp, seeing Dirichlet monotonicity as the reason the bound is tight.",
      hint: "The positive nodal domain of P6's second eigenvector is roughly its first half — a path of about three vertices.",
      conceptsExplored: ["math-discrete-nodal-domains", "math-perron-frobenius-centrality"],
    },
    {
      instruction:
        "Order all six eigenvectors by eigenvalue and count the strong nodal domains of each; tabulate nodal-domain count against eigen-index k.",
      expectedOutcome:
        "You observe the count grows with k, obeying the discrete Courant bound (k-th eigenvector has at most k strong nodal domains) — eigenvectors behave like graph frequencies.",
      hint: "This mirrors zero-crossings of Fourier modes; higher frequency means more sign alternations.",
      conceptsExplored: ["math-discrete-nodal-domains", "math-cayley-graph-fourier-embedding"],
    },
    {
      instruction:
        "Compute an Ollivier–Ricci curvature on the same P6 edges and contrast what it reveals with the nodal-domain sign-partition diagnostic.",
      expectedOutcome:
        "You articulate that nodal domains are a global spectral (eigenvector-derived) tool while curvature is a local optimal-transport one, and both are discrete-differential-geometry lenses complementing hourglass persistence.",
      hint: "Nodal domains come from eigenvectors (global); Ollivier–Ricci from mass transport on individual edges (local).",
      conceptsExplored: ["math-discrete-nodal-domains", "mathematics-ollivier-ricci-curvature", "mathematics-hourglass-persistence"],
    },
  ],
};
