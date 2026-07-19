/**
 * Equilateral Dimension -- mathematics concept (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/concepts/equilateral-dimension
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 27 * 2 * Math.PI / 33;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const equilateralDimension: RosettaConcept = {
  id: "math-equilateral-dimension",
  name: "Equilateral Dimension",
  domain: 'mathematics',
  description:
    "The equilateral dimension e(X) of a normed space X is the largest number of points that are pairwise at one common distance. Under the Euclidean norm ℓ2^n the answer is exactly n+1 — the vertices of a regular simplex — and no configuration beats it, since n+1 unit vectors with equal pairwise inner products exhaust the available rank. Change the metric and the count moves sharply: for ℓ∞ the value is 2^n (hypercube vertices), while Kusner's 1983 conjecture asserts e(ℓ1^n) = 2n, realized by the cross-polytope {±e_1,…,±e_n}, whose 2n vertices sit at mutual ℓ1-distance 2. That conjecture is proven only for n ≤ 4; the best general upper bound is O(n log n). Equilateral dimension thus makes precise how the choice of metric — not the dimension alone — governs how many points can be mutually equidistant, tying extremal geometry to stubbornly open combinatorics. (arXiv:2606.03987v1, 2026)",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "import numpy as np — build the cross-polytope as `V = np.vstack([np.eye(n), -np.eye(n)])`, the 2n vertices ±e_i. Pairwise ℓ1 gaps drop out of broadcasting: `D = np.abs(V[:,None,:] - V[None,:,:]).sum(-1)`; every off-diagonal entry is 2.0, so `np.allclose(D[~np.eye(2*n,dtype=bool)], 2)` is True and you hold an equilateral 2n-set witnessing Kusner's lower bound. Swap in a squared-sum-sqrt norm and only n+1 simplex points survive. See Kusner 1983.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "template<int N> using Cross = Eigen::Matrix<double,2*N,N>; assemble the cross-polytope with `Cross<N> V; V.topRows(N) = Eigen::Matrix<double,N,N>::Identity(); V.bottomRows(N) = -V.topRows(N);` — 2N rows ±e_i in one contiguous, RAII-owned buffer. The ℓ1 Gram check is a double loop accumulating `(V.row(i)-V.row(j)).cwiseAbs().sum()`, each pair returning 2.0. The destructor frees the witness; the template pins N at compile time. See Kusner 1983.",
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: "Represent each vertex as a sparse s-expression `(i . s)` meaning s·e_i with s ∈ {+1,-1}; the cross-polytope is `(loop for i below n append (list (cons i 1) (cons i -1)))`. Distance is a fold: `(defun l1 (a b) (reduce #'+ (mapcar (lambda (k) (abs (- (coord a k) (coord b k)))) axes)))`, and a macro unrolls the pairwise test into ground code — data becomes program. Every distinct pair returns 2, so recursion over the list certifies Kusner's equilateral set. See Kusner 1983.",
    }],
  ]),
  relationships: [
    {
      type: "dependency",
      targetId: "math-erdos-problem-index",
      description: "Sits as an entry in the Erdős-style open-problem index: Kusner's equilateral-dimension conjecture (e(ℓ1^n)=2n) is exactly the kind of crisply-stated, low-dimensionally-proven combinatorial-geometry question the index catalogues, and this concept inherits its open-problem framing from that parent.",
    },
    {
      type: "cross-reference",
      targetId: "math-millennium-problem-catalogue",
      description: "Shares the open-conjecture register with the Millennium catalogue: like those problems, e(ℓ1^n)=2n has an elementary statement and a construction (the cross-polytope) yet resists a general proof, differing mainly in stakes — Erdős-scale rather than Millennium-scale.",
    },
    {
      type: "analogy",
      targetId: "math-optimal-transport",
      description: "The ℓ1 metric that endows the cross-polytope with 2n mutually-equidistant vertices is the discrete Earth-Mover / L1 distance at the heart of optimal transport, so equilateral sets probe the same L1 geometry from an extremal, packing-style angle.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
