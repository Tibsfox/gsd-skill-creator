/**
 * Embedding Norm Specificity -- ai-computation concept (June-2026 arXiv cohort, T2).
 * @module departments/ai-computation/concepts/embedding-norm-specificity
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 35 * 2 * Math.PI / 41;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const embeddingNormSpecificity: RosettaConcept = {
  id: "ai-computation-embedding-norm-specificity",
  name: "Embedding Norm Specificity",
  domain: 'ai-computation',
  description:
    "Cosine-similarity retrieval and contrastive objectives like InfoNCE L2-normalize embeddings, treating vector magnitude as a discardable nuisance. An analytic account of contrastive optimization dynamics (arXiv:2606.30625, 2026) shows the opposite: embedding length is a learned quantity that grows with concept specificity and token frequency and shrinks under human label uncertainty. Reading the norm alongside cosine direction yields a training-free confidence estimate, well-calibrated without a separate calibration head, and flags ambiguous or rare inputs that direction alone cannot distinguish.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "ai-computation-isotropic-embedding",
      description: "Specializes the isotropy view of embedding space: where isotropy characterizes how directions are distributed over the unit sphere, this concept recovers the orthogonal magnitude axis that L2-normalization discards, turning a nuisance into signal.",
    },
    {
      type: "analogy",
      targetId: "ai-computation-hyperbolic-retrieval-geometry",
      description: "Both move beyond flat cosine direction by exploiting a further geometric degree of freedom — hyperbolic geometry uses curvature to encode hierarchy, whereas norm specificity uses vector length to encode concept granularity and uncertainty.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-calibrated-retrieval-budget",
      description: "The norm-derived confidence is a training-free calibration signal that can gate how much retrieval effort a query warrants, tying embedding magnitude directly to per-query retrieval budgeting decisions.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-lexical-anchor-probe",
      description: "Because embedding length grows with token frequency, the norm carries the same lexical-frequency information that lexical anchor probing extracts, giving a complementary read on rare versus common tokens.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
