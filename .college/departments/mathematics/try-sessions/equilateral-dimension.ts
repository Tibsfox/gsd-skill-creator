/**
 * Equilateral Dimension try-session -- mathematics (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/try-sessions/equilateral-dimension
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const equilateralDimensionSession: TrySessionDefinition = {
  id: 'math-equilateral-dimension-first-steps',
  title: "How Many Points Can Be Mutually Equidistant?",
  description:
    "A hands-on derivation of why the largest set of mutually-equidistant points depends on the norm — building the regular simplex in ℓ2, the cross-polytope in ℓ1, and the hypercube in ℓ∞, then meeting Kusner's open conjecture head-on.",
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        "In a notebook, plot three points forming a unit equilateral triangle in the Euclidean plane, then argue on paper why no fourth point can lie at distance 1 from all three at once.",
      expectedOutcome:
        "You see concretely that the maximum mutually-equidistant set in ℓ2^2 has 3 = n+1 points, and that the regular simplex is the extremal configuration that generalizes to every Euclidean dimension.",
      hint: "A fourth equidistant point would need to sit at the circumcenter offset both above and below the plane simultaneously — impossible when you are confined to R^2.",
      conceptsExplored: ["math-equilateral-dimension"],
    },
    {
      instruction:
        "Take m mutually-equidistant points, subtract their centroid, normalize the results, and write the Gram matrix of the unit vectors as (1−α)I + αJ; determine for which m it can stay positive semidefinite in R^n.",
      expectedOutcome:
        "You derive the hard ceiling e(ℓ2^n) = n+1 from a rank argument: the Gram matrix has rank at most n, so at most n+1 equal-inner-product unit vectors can coexist.",
      hint: "J is the all-ones matrix; PSD combined with rank ≤ n forces the number of equiangular unit vectors down to m ≤ n+1.",
      conceptsExplored: ["math-equilateral-dimension"],
    },
    {
      instruction:
        "Switch the metric to ℓ1 and, for the four points ±e_1, ±e_2 in R^2, compute all six pairwise Manhattan distances both by hand and in numpy, tabulating every result.",
      expectedOutcome:
        "You confirm every pair sits at ℓ1-distance exactly 2, so the taxicab plane carries an equilateral set of 2n = 4 points — strictly more than the Euclidean maximum of 3.",
      hint: "Both the +e_i versus −e_i pair and the e_i versus e_j pair produce an absolute-value sum of exactly 2.",
      conceptsExplored: ["math-equilateral-dimension", "math-optimal-transport"],
    },
    {
      instruction:
        "Generalize to R^n: define the cross-polytope V = {±e_i} and prove the pairwise ℓ1 distance is always 2 by splitting into the three cases e_i/e_j, e_i/−e_i, and e_i/−e_j.",
      expectedOutcome:
        "You establish the 2n lower bound for e(ℓ1^n) constructively and understand the cross-polytope as the ℓ1 analogue of the Euclidean simplex.",
      hint: "Each case leaves exactly two nonzero coordinates of magnitude 1 (or a single coordinate of magnitude 2), always summing to 2.",
      conceptsExplored: ["math-equilateral-dimension"],
    },
    {
      instruction:
        "Compute the ℓ∞ case: verify the 2^n hypercube vertices {±1}^n are mutually equidistant at ℓ∞-distance 2, then tabulate e against the norm (ℓ2, ℓ1, ℓ∞) for n = 1..4.",
      expectedOutcome:
        "You see three sharply different growth laws — n+1, 2n, and 2^n — driven purely by the choice of norm at a fixed dimension, which is the concept's headline claim.",
      hint: "Under ℓ∞ any two distinct sign vectors differ by 2 in at least one coordinate and never by more, so all pairwise sup-distances equal 2.",
      conceptsExplored: ["math-equilateral-dimension"],
    },
    {
      instruction:
        "Write down Kusner's 1983 conjecture e(ℓ1^n) = 2n, then look up and record the exact dimensions in which it is proven and the best-known general upper bound.",
      expectedOutcome:
        "You understand that the lower bound 2n is elementary while matching it from above is open past n = 4, with the best general bound only O(n log n) — a wide, unresolved gap.",
      hint: "Koolen–Laurent–Schrijver settled n = 4; Alon–Pudlák supply the general n log n upper bound.",
      conceptsExplored: ["math-equilateral-dimension", "math-erdos-problem-index"],
    },
    {
      instruction:
        "Place the conjecture in the open-problem landscape: compare its 'crisp statement, low-dimensional proof' profile against one entry in the Erdős index and one in the Millennium catalogue.",
      expectedOutcome:
        "You can articulate why equilateral dimension belongs to the same register of teachable-yet-unsolved metric-geometry problems, and where it differs in stakes and difficulty from the Millennium tier.",
      hint: "Both Erdős-style and Millennium problems share the crisp-statement/hard-proof pattern; equilateral dimension is Erdős-scale, not Millennium-scale.",
      conceptsExplored: ["math-equilateral-dimension", "math-erdos-problem-index", "math-millennium-problem-catalogue"],
    },
  ],
};
