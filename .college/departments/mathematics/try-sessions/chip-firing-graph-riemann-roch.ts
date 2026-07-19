/**
 * Chip Firing Graph Riemann Roch try-session -- mathematics (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/try-sessions/chip-firing-graph-riemann-roch
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const chipFiringGraphRiemannRochSession: TrySessionDefinition = {
  id: 'math-chip-firing-graph-riemann-roch-first-steps',
  title: "Chip-Firing on K4: Deriving Graph Riemann–Roch by Hand",
  description:
    "Build the graph Laplacian of the complete graph K4, fire vertices to explore linear equivalence, run Dhar's burning algorithm to find q-reduced divisors, and verify the Baker–Norine graph Riemann–Roch theorem on a concrete divisor.",
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        "Build the complete graph K4: write its adjacency matrix A and degree diagonal Deg, then form the graph Laplacian L = Deg − A and confirm that every column of L sums to zero.",
      expectedOutcome:
        "You see that firing acts through the columns of L and that the zero column-sum encodes chip conservation — the total degree of a divisor never changes under any firing.",
      hint: "For K4 every vertex has degree 3, so Deg = 3·I while A has 0 on the diagonal and 1 off it.",
      conceptsExplored: ["math-chip-firing-graph-riemann-roch", "math-perron-frobenius-centrality"],
    },
    {
      instruction:
        "Place the divisor D = (3, 0, 0, 0) of three chips on vertex 0, fire vertex 0 by computing D − L[:,0], and record both the new configuration and its total degree.",
      expectedOutcome:
        "You observe vertex 0 shedding 3 chips (its valence) while each neighbor gains one, with deg unchanged at 3 — firing is the Laplacian acting, so linear equivalence is exactly the integer lattice im L.",
      hint: "The column L[:,0] for K4 is (3, −1, −1, −1); subtracting it pushes chips outward along every edge.",
      conceptsExplored: ["math-chip-firing-graph-riemann-roch"],
    },
    {
      instruction:
        "Compute the graph genus g = |E| − |V| + 1 and the canonical divisor K(v) = deg(v) − 2 for K4, then verify that deg(K) equals 2g − 2.",
      expectedOutcome:
        "You get g = 3 and K = (1,1,1,1) with deg(K) = 4 = 2g − 2, mirroring how a genus-g algebraic curve's canonical class has degree 2g − 2.",
      hint: "K4 has 6 edges and 4 vertices; the cycle rank you compute is the graph's first Betti number.",
      conceptsExplored: ["math-chip-firing-graph-riemann-roch", "math-euler-formula"],
    },
    {
      instruction:
        "Fix sink q = vertex 0 and run Dhar's burning algorithm on a test divisor: start a fire at q and burn any non-sink vertex once its incident burnt edges exceed its chip count.",
      expectedOutcome:
        "You understand that a divisor is q-reduced precisely when the whole graph burns, and that an unburnt set marks a legal cluster-firing that further reduces the configuration toward its canonical representative.",
      hint: "A vertex v catches fire when (burnt edges into v) > D(v); iterate the burn until no new vertex ignites.",
      conceptsExplored: ["math-chip-firing-graph-riemann-roch"],
    },
    {
      instruction:
        "Reduce a chosen divisor to its unique q-reduced representative D_q using repeated burning, then decide effectivity by checking whether D_q(q) ≥ 0.",
      expectedOutcome:
        "You learn every linear-equivalence class has exactly one q-reduced representative, and that D is equivalent to an effective divisor if and only if that representative keeps the sink non-negative.",
      hint: "In a q-reduced divisor only the sink may go negative; all other vertices are already guaranteed ≥ 0.",
      conceptsExplored: ["math-chip-firing-graph-riemann-roch", "mathematics-coherent-functor"],
    },
    {
      instruction:
        "Compute the Baker–Norine rank r(D) by the chip-firing-game rule: r(D) is the largest k for which subtracting any k chips still leaves a divisor equivalent to an effective one, and −1 if D itself is not equivalent to effective.",
      expectedOutcome:
        "You grasp rank as an adversarial game — the opponent removes k chips anywhere, you must still reach effective — a purely combinatorial replacement for the dimension of a linear system on a curve.",
      hint: "Use the q-reduced sink-sign test from the previous step as your effectivity oracle inside the rank search.",
      conceptsExplored: ["math-chip-firing-graph-riemann-roch"],
    },
    {
      instruction:
        "Take D = 5 chips on one vertex (deg 5 > 2g − 2 = 4) and verify Baker–Norine directly: evaluate r(D) − r(K − D) and compare it to deg(D) − g + 1.",
      expectedOutcome:
        "You confirm r(K − D) = −1 because deg(K − D) = −1 < 0, r(D) = deg(D) − g = 2, and 2 − (−1) = 3 = 5 − 3 + 1 — the graph Riemann–Roch identity holds exactly on your example.",
      hint: "Any divisor of negative degree can never be equivalent to an effective one, so its rank is automatically −1.",
      conceptsExplored: ["math-chip-firing-graph-riemann-roch", "math-euler-formula"],
    },
    {
      instruction:
        "Frame Pic(G) = Z^V/im L as a functor from graphs to abelian groups, then contrast the divisorial cokernel-of-Laplacian view with the spectral Perron–Frobenius dominant-eigenvector view of the very same Laplacian.",
      expectedOutcome:
        "You see that chip-firing lives in a functorial (coherent-functor) setting where graph morphisms act on Picard groups, and that it reads the Laplacian's integer cokernel rather than its spectrum.",
      hint: "Perron–Frobenius asks for the top eigenvector; chip-firing asks for the integer cokernel of the same matrix.",
      conceptsExplored: ["math-chip-firing-graph-riemann-roch", "mathematics-coherent-functor", "math-perron-frobenius-centrality"],
    },
  ],
};
