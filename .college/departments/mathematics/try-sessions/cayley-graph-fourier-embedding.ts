/**
 * Cayley Graph Fourier Embedding try-session -- mathematics (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/try-sessions/cayley-graph-fourier-embedding
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const cayleyGraphFourierEmbeddingSession: TrySessionDefinition = {
  id: 'math-cayley-graph-fourier-embedding-first-steps',
  title: "Embedding C4 into a Cayley Graph to Inherit Exact Fourier Analysis",
  description:
    "Take the 4-cycle C4, embed it isometrically into the abelian Cayley graph Cay(Z_2^2, {e1,e2}) via a cocycle labeling, then hand-derive its exact character-basis Fourier transform, shift, convolution theorem, and translation-modulation duality on a concrete signal.",
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        "Draw the 4-cycle C4 with vertices v0,v1,v2,v3 and its four edges, then fill in the 4x4 matrix of pairwise graph distances (shortest-path lengths) between the vertices.",
      expectedOutcome:
        "You see that C4 carries a metric but no native group structure or shift operator, so the isometric target is exactly this distance matrix that any embedding must preserve edge-for-edge.",
      hint: "Graph distance is the number of edges in the shortest path; opposite vertices of C4 are at distance 2.",
      conceptsExplored: ["math-cayley-graph-fourier-embedding", "mathematics-tonnetz-lattice"],
    },
    {
      instruction:
        "Assign the Gray-code labels 00, 01, 11, 10 to v0..v3 around the cycle and verify that every edge changes exactly one bit, so Hamming distance between labels equals graph distance.",
      expectedOutcome:
        "You recognize the label map as an isometric embedding of C4 into the hypercube Q2 = Cay(Z_2^2, {e1,e2}), where single-bit flips are precisely the group generators.",
      hint: "Adjacent vertices must differ in exactly one coordinate; the closing edge v3->v0 flips the first bit.",
      conceptsExplored: ["math-cayley-graph-fourier-embedding", "mathematics-tonnetz-lattice"],
    },
    {
      instruction:
        "Read each edge as its generator (e1 or e2), then sum the generator labels once around the single fundamental cycle of C4 and confirm the total is the identity 0 in Z_2^2.",
      expectedOutcome:
        "You understand the cocycle condition: the labeling is path-independent and hence a valid embedding precisely because every cycle sum vanishes in the target abelian group.",
      hint: "In Z_2^2 each generator is its own inverse, so e1 + e2 + e1 + e2 = 0.",
      conceptsExplored: ["math-cayley-graph-fourier-embedding"],
    },
    {
      instruction:
        "Construct the character table of Z_2^2 by writing the four characters chi_k(x) = (-1)^(k . x mod 2) for all k, and arrange them as the 4x4 Walsh-Hadamard matrix H.",
      expectedOutcome:
        "You obtain an orthogonal Fourier basis built from the Pontryagin dual of the group; H is the graph Fourier transform, replacing arbitrary Laplacian eigenvectors with group characters.",
      hint: "Index both k and x over Z_2^2 = {00,01,10,11}; k . x is the dot product taken mod 2.",
      conceptsExplored: ["math-cayley-graph-fourier-embedding", "math-dual-space-interpolation"],
    },
    {
      instruction:
        "Pick a signal f over the four vertices, compute f_hat = H f, then define the shift T = translation by generator e1 (a permutation of vertices) and check that H T H^{-1} is diagonal with entries chi_k(e1).",
      expectedOutcome:
        "You see translation is a genuine shift diagonalized by the characters, delivering the shift-invariance that ordinary spectral GSP cannot provide on an arbitrary graph.",
      hint: "Apply T then transform and compare against multiplying each f_hat[k] by (-1)^(first bit of k).",
      conceptsExplored: ["math-cayley-graph-fourier-embedding", "math-transform-uncertainty-principle"],
    },
    {
      instruction:
        "Choose a second signal g, compute the group convolution (f*g)(x) = sum over y of f(y) g(x - y) using Z_2^2 subtraction, then verify H(f*g) equals the elementwise product (H f) .* (H g).",
      expectedOutcome:
        "You confirm the convolution theorem holds exactly in the character basis, which is the central payoff the group structure buys over Laplacian-only spectral methods.",
      hint: "In Z_2^2 subtraction equals addition; convolution becomes a small XOR-indexed sum over four terms.",
      conceptsExplored: ["math-cayley-graph-fourier-embedding"],
    },
    {
      instruction:
        "Modulate f by multiplying it pointwise by a character chi_m, then transform and confirm the result is f_hat shifted by m in the dual (frequency) domain.",
      expectedOutcome:
        "You witness translation-modulation duality: modulation in the vertex domain is a shift in the dual domain, restoring the classical time-frequency symmetry on the graph.",
      hint: "Modulation and translation swap roles under H; a bump at frequency k moves to frequency k + m.",
      conceptsExplored: ["math-cayley-graph-fourier-embedding", "math-transform-uncertainty-principle"],
    },
    {
      instruction:
        "Attempt to isometrically embed K4 (or C5) into a hypercube, count the distance-2 vertex pairs against available single-bit-flip edges, and note where it fails; then relate the fix to Z-coefficient groups via Smith normal form and to the Tonnetz as a musical abelian Cayley graph.",
      expectedOutcome:
        "You grasp that only partial cubes embed into hypercubes, that general graphs need larger abelian groups recovered by Smith normal form, and that the Tonnetz is a real-world instance of this construction.",
      hint: "Every hypercube edge is a distance-1 flip, so a graph forcing too many distance-1 neighbors around a triangle cannot be a partial cube.",
      conceptsExplored: ["math-cayley-graph-fourier-embedding", "mathematics-tonnetz-lattice", "math-discrete-nodal-domains"],
    },
  ],
};
