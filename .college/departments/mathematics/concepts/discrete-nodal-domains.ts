/**
 * Discrete Nodal Domains -- mathematics concept (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/concepts/discrete-nodal-domains
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 26 * 2 * Math.PI / 33;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const discreteNodalDomains: RosettaConcept = {
  id: "math-discrete-nodal-domains",
  name: "Discrete Nodal Domains",
  domain: 'mathematics',
  description:
    "Courant's nodal-domain theorem says a domain's k-th Laplacian eigenfunction has at most k sign-constant regions — its nodal domains — because each region, where the eigenfunction vanishes on its boundary, is a Dirichlet ground state whose eigenvalue is monotone in domain size. The discrete nodal-domain construction transfers this to a connected graph by treating it as internally disconnected: a strong nodal domain of an eigenvector v is a maximal connected set of vertices of one strict sign, and restricting v there solves the adjacency eigen-equation with the complement acting as a Dirichlet boundary. Because cross-boundary neighbors carry the opposite sign, the induced sub-block obeys A_S v_S ≥ λ v_S componentwise, so by Perron–Frobenius the spectral radius of the nodal-domain subgraph bounds the second adjacency eigenvalue λ₂ from above — a sharp, purely combinatorial certificate. It matters because it turns a global spectral question into local sign-geometry, sharpening λ₂ bounds and linking eigenvector oscillation to graph structure. (arXiv:2606.11659v3, 2026)",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "Build adjacency `A` with `numpy`, then `w, V = np.linalg.eigh(A)`. Take the runner-up eigenvector `v = V[:, -2]`; its strong nodal domains are the connected components of the sign-masked blocks `A[np.ix_(s, s)]` for `s = np.where(np.sign(v) > 0)` and `< 0`. For each block, `scipy.sparse.linalg.eigsh(A_s, k=1)` returns the Perron value that upper-bounds `w[-2]` — the Dirichlet ground state of one nodal piece. See Davies 2001.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "Hold the graph in an `Eigen::SparseMatrix<double> A`; a `SelfAdjointEigenSolver` owns the eigenpair storage by RAII. Take `v = solver.eigenvectors().col(n-2)`, then bucket indices into two `std::vector<int>` by `v(i) > 0`. Slice each induced block `A(idx, idx)` and feed it to a templated `perron_radius<Scalar>()`; the componentwise certificate `A_S v_S >= lambda * v_S` proves that radius bounds the second eigenvalue. See Davies 2001.",
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: "Represent the graph as an adjacency alist `((u . nbrs) ...)` — cons cells are both code and data. A nodal domain is a recursive flood-fill: `(labels ((walk (u sign seen) ...)) ...)` collecting same-sign vertices by `cdr`-ing neighbor lists. Since the eigen-equation `(= (sum (mapcar v nbrs)) (* lambda (v u)))` is itself an s-expression, a macro rewrites each domain into its Dirichlet sub-problem and evaluates the Perron bound symbolically. See Davies 2001.",
    }],
  ]),
  relationships: [
    {
      type: "dependency",
      targetId: "mathematics-hourglass-persistence",
      description: "Extends the hourglass-persistence sign-partition idea: nodal domains are the graph analogue of persistence's sign-constant components, specialized to a single sharp second-eigenvalue bound via Dirichlet boundaries.",
    },
    {
      type: "dependency",
      targetId: "math-perron-frobenius-centrality",
      description: "The bound rests on Perron-Frobenius / Collatz-Wielandt applied to each nodal domain's induced subgraph, whose spectral radius certifies the upper bound on the second adjacency eigenvalue.",
    },
    {
      type: "cross-reference",
      targetId: "mathematics-ollivier-ricci-curvature",
      description: "Complements curvature: nodal domains are a global spectral sign-geometry diagnostic on graphs, whereas Ollivier-Ricci curvature is a local optimal-transport one; both are discrete-differential-geometry lenses.",
    },
    {
      type: "analogy",
      targetId: "math-cayley-graph-fourier-embedding",
      description: "Analogous to graph Fourier frequency: eigenvectors ordered by eigenvalue accumulate nodal domains just as Fourier modes accumulate zero-crossings, giving a discrete Courant bound on domain count.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
