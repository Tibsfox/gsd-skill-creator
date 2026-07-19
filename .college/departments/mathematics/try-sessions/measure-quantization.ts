/**
 * Measure Quantization try-session -- mathematics (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/try-sessions/measure-quantization
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const measureQuantizationSession: TrySessionDefinition = {
  id: 'math-measure-quantization-first-steps',
  title: "Quantizing a Measure: Deriving Zador's Law",
  description:
    "Build a Lloyd quantizer from scratch, derive Zador's n^{-r/d} distortion law by both a scaling argument and a log-log fit, then connect the optimal codebook to semi-discrete optimal transport.",
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        "Write down the distortion functional V_{n,r}(μ)=inf over n-point sets α of ∫ min_i ‖x−a_i‖^r dμ(x), and identify the r=2 case as the population objective that empirical k-means approximates.",
      expectedOutcome:
        "You see quantization as choosing n representatives to minimize expected nearest-neighbor cost, and recognize k-means as its empirical, r=2 instance rather than a separate algorithm.",
      hint: "The inner min over i is exactly the nearest-neighbor assignment; the outer integral averages that per-sample cost under the measure μ.",
      conceptsExplored: ["math-measure-quantization"],
    },
    {
      instruction:
        "Fix a candidate Voronoi partition and derive the optimal representative of one cell by differentiating ∫_{cell} ‖x−a‖^2 dμ with respect to a and solving for the stationary point.",
      expectedOutcome:
        "You derive that the optimal r=2 representative of a cell is its μ-conditional centroid, yielding Lloyd's two alternating stationarity conditions: nearest-center assignment, then recentering.",
      hint: "Set the gradient 2∫_{cell}(a−x)dμ(x) to zero; the minimizer is the conditional mean of x over that cell.",
      conceptsExplored: ["math-measure-quantization"],
    },
    {
      instruction:
        "Implement one Lloyd iteration on 5000 samples from a 2-D Gaussian with n=16 centers, then loop the assign-recenter sweep and record the empirical distortion after each pass.",
      expectedOutcome:
        "You observe the distortion decreasing monotonically and the codebook converging to a stationary configuration — an actual fixed point of the alternation you derived in the previous step.",
      hint: "A full sweep can never increase distortion: assignment lowers it holding centers fixed, recentering lowers it holding assignments fixed.",
      conceptsExplored: ["math-measure-quantization"],
    },
    {
      instruction:
        "Assume a locally near-uniform density and argue that n Voronoi cells each occupy volume ~1/n, so a cell has radius ~n^{-1/d}; combine the per-cell cost ~radius^r to derive the aggregate rate V_{n,r} ~ n^{-r/d}.",
      expectedOutcome:
        "You derive the Zador exponent −r/d from pure scaling, seeing that the homogeneous dimension d — not the shape of the density — controls the decay rate of the distortion.",
      hint: "Volume scales as radius^d, so set radius^d ~ 1/n; then n cells each contribute ~radius^r ~ n^{-r/d} to the total, and the count cancels.",
      conceptsExplored: ["math-measure-quantization", "math-fractal-geometry"],
    },
    {
      instruction:
        "Compute the Lloyd-optimal distortion for n over a geometric grid (4, 8, 16, …, 512), plot log V_n against log n, and fit a straight line to read off the slope.",
      expectedOutcome:
        "You recover a slope close to −r/d, empirically confirming Zador's asymptotic law directly from the measured distortions instead of trusting the formula.",
      hint: "A power law n^{-r/d} is a straight line on log-log axes whose slope equals the exponent exactly; use least squares on the log-log points.",
      conceptsExplored: ["math-measure-quantization", "math-logarithmic-scales"],
    },
    {
      instruction:
        "Repeat the log-log slope measurement for samples drawn in d=1, 2, and 3 dimensions (keeping r=2), and tabulate the fitted exponent against the ambient dimension d.",
      expectedOutcome:
        "You confirm the fitted slope tracks −r/d as d changes, cementing that the homogeneous dimension alone determines the convergence rate of optimal quantization.",
      hint: "With r=2 the slope should roughly halve from d=1 to d=2 (−2 to −1) and shrink again toward −2/3 at d=3.",
      conceptsExplored: ["math-measure-quantization", "math-logarithmic-scales"],
    },
    {
      instruction:
        "State the Zador constant Q_{r,d}·(∫ f^{d/(d+r)})^{(d+r)/d} and test the companion point-density law: optimal centers concentrate with density proportional to f^{d/(d+r)}, not to f itself.",
      expectedOutcome:
        "You understand that the density enters only the constant, through an L^{d/(d+r)} quasi-norm, and that optimal quantizers deliberately under-sample high-density regions relative to μ.",
      hint: "Histogram your converged centers and compare to f^{d/(d+r)}; since the exponent d/(d+r) is below 1, mass gets spread out more evenly than f.",
      conceptsExplored: ["math-measure-quantization", "math-information-geometry"],
    },
    {
      instruction:
        "Reinterpret your converged codebook as the atoms of a discrete target measure and identify the quantization problem with semi-discrete optimal transport from μ to that n-atom measure.",
      expectedOutcome:
        "You see the distortion equals the r-Wasserstein transport cost to the atoms and that Voronoi cells become the transport (Laguerre) cells, linking quantization to optimal transport and to projection-based measure comparison.",
      hint: "Semi-discrete OT routes each x to its nearest atom under a weighted cost; with all weights zero that assignment is exactly the Voronoi rule you already coded.",
      conceptsExplored: ["math-measure-quantization", "math-optimal-transport", "mathematics-cramer-wold-slicing"],
    },
  ],
};
