/**
 * Measure Quantization -- mathematics concept (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/concepts/measure-quantization
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 30 * 2 * Math.PI / 33;
const radius = 0.70;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const measureQuantization: RosettaConcept = {
  id: "math-measure-quantization",
  name: "Measure Quantization",
  domain: 'mathematics',
  description:
    "Optimal quantization asks: given a probability measure μ on R^d, which n points a_1,…,a_n best summarize it? Formally, minimize the r-th-power distortion V_{n,r}(μ)=inf_{|α|=n} ∫ min_i ‖x−a_i‖^r dμ(x) — the average cost of snapping each sample to its nearest representative, the population version of k-means (r=2). Optimal centers induce a Voronoi partition, and each cell's r-mean is its own optimizer, so solutions satisfy Lloyd's stationarity conditions (assign, then recenter). Zador's theorem pins the rate: for μ with absolutely-continuous density f, lim_{n→∞} n^{r/d} V_{n,r}(μ) = Q_{r,d}·(∫ f^{d/(d+r)})^{(d+r)/d}. Thus the error decays like n^{−r/d}: the exponent is fixed by the homogeneous dimension d, while the density's L^{d/(d+r)} quasi-norm sets the constant. For the uniform law on [0,1] with r=2, d=1 this pins the classic value Q_{2,1}=1/12, so V_{n,2}=1/(12 n^2) — a checkable number the Lloyd sweep reproduces directly. This asymptotic law underlies vector quantization, numerical cubature, and k-means consistency. (arXiv:2606.09373v1, 2026)",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "Draw samples X ~ μ as an (m,d) ndarray and seed a codebook C of n rows. One Lloyd sweep: D=cdist(X,C); labels=D.argmin(1); C=np.stack([X[labels==i].mean(0) for i in range(n)]). Track distortion (D.min(1)**2).mean() as V_{n,2}; grow n on a geometric grid and it falls like n**(-2/d). That slope on a log-log plot is Zador's law, read off the arrays. See Zador 1982.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "template<int D> using Pt=Eigen::Matrix<double,D,1>; keep samples and codebook in contiguous std::vector<Pt<D>> — no raw new, destructors reclaim. Each Lloyd sweep: for every sample take argmin over centroids by (x-c).squaredNorm(), accumulate a running Eigen sum per cell, then divide to recenter. Distortion is the reduced squaredNorm; it contracts as n^(-r/D), the exponent baked into the template parameter D. See Zador 1982.",
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: "Represent the codebook as a list of point-lists: a sample is data, a centroid is data, and Lloyd's update is itself an s-expression you can (macroexpand). (defun nearest (x cs) (car (sort (copy-list cs) #'< :key (lambda (c) (dist2 x c))))). Reduce the samples into bins, then map a centroid over each bin — the iteration is pure recursive list processing. The distortion form shrinks like n^(-r/d). See Zador 1982.",
    }],
  ]),
  relationships: [
    {
      type: "dependency",
      targetId: "mathematics-cramer-wold-slicing",
      description: "Cramér-Wold slicing reduces a d-dimensional measure to its 1-D projections; quantization inherits that reduction — sliced distortion averages 1-D quantization errors — yet Zador's n^{−r/d} exponent proves the full-dimensional rate cannot be recovered from slices alone, sharpening exactly what projection-based comparison does and does not capture.",
    },
    {
      type: "cross-reference",
      targetId: "math-optimal-transport",
      description: "Semi-discrete optimal transport from μ to an n-atom target coincides with quantization: the transport cost equals the r-distortion and optimal cells are Laguerre/Voronoi cells — but quantization optimizes atom locations, whereas transport fixes both marginals and solves only for the coupling.",
    },
    {
      type: "analogy",
      targetId: "math-fractal-geometry",
      description: "The homogeneous dimension d in the n^{−r/d} law generalizes beyond integer d: for self-similar measures on fractal supports the exponent uses the quantization dimension, a Minkowski-type dimension, tying distortion asymptotics directly to fractal geometry.",
    },
    {
      type: "cross-reference",
      targetId: "math-wasserstein-gradient-flow-langevin",
      description: "Both are Wasserstein/OT-cluster concepts: optimal quantization of a measure is a semi-discrete transport problem whose optimal point masses can be found by a Wasserstein gradient flow, so the quantization energy and the Langevin/JKO flow that minimizes it belong linked.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
