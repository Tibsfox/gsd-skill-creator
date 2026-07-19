/**
 * Chip Firing Graph Riemann Roch -- mathematics concept (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/concepts/chip-firing-graph-riemann-roch
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 25 * 2 * Math.PI / 33;
const radius = 0.70;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const chipFiringGraphRiemannRoch: RosettaConcept = {
  id: "math-chip-firing-graph-riemann-roch",
  name: "Chip Firing Graph Riemann Roch",
  domain: 'mathematics',
  description:
    "A divisor on a finite connected graph G is an integer chip-count D over its vertices; firing a vertex sends one chip down each incident edge, changing D by a column of the graph Laplacian L = Deg − A. Two divisors are linearly equivalent when they differ by L·f for an integer firing script f, so Pic(G) = Z^V / im L, whose degree-0 part is the sandpile (critical) group. Define the rank r(D) combinatorially: r(D) = −1 if no equivalent divisor is effective, else the largest k such that D minus any k chips stays equivalent to an effective divisor. With canonical divisor K(v) = deg(v) − 2 and genus g = |E| − |V| + 1, the Baker–Norine theorem states r(D) − r(K − D) = deg(D) − g + 1, a perfect mirror of Riemann–Roch for algebraic curves. Effectivity and rank become computable through q-reduced divisors — the unique class representative reachable by Dhar's burning algorithm — a divisor theory recently formalized end-to-end in Lean 4. (arXiv:2606.16679v1, 2026)",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "Represent a divisor as `D = np.array(chips)` over vertices and the graph Laplacian `L = np.diag(deg) - A`. Firing vertex v is `D -= L[:, v]`; linear equivalence is `D - L @ f` for any integer script `f`. The genus drops out as `g = A.sum()//2 - len(D) + 1` and the canonical divisor is `K = deg - 2`. Decide effectivity by reducing to the q-reduced form in a Dhar burning loop, then test `Dq[q] >= 0`. See Baker & Norine 2007.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "Hold the divisor in a `std::vector<int>` and the Laplacian as an `Eigen::SparseMatrix<int> L = Deg - A`, sized once at construction so RAII owns the buffers. Fire vertex v with `d -= L.col(v)`; a firing script acts by `d.noalias() -= L * f`. Template the chip type on an integral `T`. Dhar's burning walks a `std::queue<int>` until the fire saturates, yielding the unique q-reduced representative in near-linear time. See Baker & Norine 2007.",
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: "Model a divisor as an alist `((v . chips) ...)` and firing as symbolic data: firing q is `(vec- D (laplacian-col G q))`. Since the firing script is itself a list, linear equivalence is a `reduce` folding fired columns — code and divisor share one representation. A `(defmacro with-burning ...)` expands Dhar's recursion into a tail-recursive `burn` that returns the q-reduced form symbolically. See Baker & Norine 2007.",
    }],
  ]),
  relationships: [
    {
      type: "dependency",
      targetId: "mathematics-coherent-functor",
      description: "The assignment G ↦ Pic(G) = Z^V/im L is functorial; graph morphisms induce maps on the Picard and Jacobian groups, placing chip-firing divisor theory inside the coherent-functor framework it relies on for categorical coherence and naturality of the divisor sequence.",
    },
    {
      type: "cross-reference",
      targetId: "math-perron-frobenius-centrality",
      description: "Both constructions are built from the same graph Laplacian, but Perron–Frobenius extracts the dominant eigenvector (a spectral quantity) while chip-firing reads the integer cokernel of the Laplacian (a divisorial one) — a deliberate spectral-versus-divisorial contrast, not a duplication.",
    },
    {
      type: "dependency",
      targetId: "math-euler-formula",
      description: "The graph genus g = |E| − |V| + 1 is the first Betti number computed from the Euler characteristic, and it fixes deg(K) = 2g − 2, so the Baker–Norine identity depends on this Euler-characteristic cycle-rank count for its right-hand side.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
