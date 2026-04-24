/**
 * Isotropic Embedding concept — the unique-optimal embedding distribution for JEPAs.
 *
 * Balestriero & LeCun (2025, arXiv:2511.08544v3) prove that the isotropic Gaussian
 * uniquely minimizes downstream prediction risk for Joint-Embedding Predictive
 * Architectures under both linear and nonlinear probes. Lemmas 1 & 2 establish the
 * linear-probe case (anisotropy amplifies both bias AND variance); Theorem 1
 * establishes the nonlinear-probe case (the Gaussian minimizes ISB for k-NN and
 * kernel probes under scalar covariance constraints). The optimality result drives
 * LeJEPA's core design choice: instead of guarding against representation collapse
 * with heuristics, state the target distribution explicitly and measure deviation.
 *
 * @module departments/ai-computation/concepts/isotropic-embedding
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~3*2pi/23, radius ~0.91 (foundational / theoretical-purity region)
const theta = 3 * 2 * Math.PI / 23;
const radius = 0.91;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const isotropicEmbedding: RosettaConcept = {
  id: 'ai-computation-isotropic-embedding',
  name: 'Isotropic Embedding',
  domain: 'ai-computation',
  description: 'The isotropic Gaussian is the unique optimal embedding distribution ' +
    'for Joint-Embedding Predictive Architectures (JEPAs) under both linear and ' +
    'nonlinear downstream probes, as proved by Balestriero & LeCun (2025) in LeJEPA. ' +
    'Lemmas 1 and 2 establish that anisotropic embeddings amplify both the bias AND ' +
    'the variance of linear probe estimators on at least some downstream tasks. ' +
    'Theorem 1 extends the result to k-NN and kernel probes, showing that the ' +
    'isotropic Gaussian uniquely minimizes integrated square bias under scalar ' +
    'covariance constraints. Architecturally, the concept inverts a decade of ' +
    'self-supervised learning practice: instead of guarding against representation ' +
    'collapse with heuristics (stop-gradient, EMA, teacher-student networks, ' +
    'negative samples), state the target distribution explicitly and let the ' +
    'measurement drive design. The transposition to gsd-skill-creator is direct: the ' +
    'skill library is a latent space, and the Skill Space Isotropy Audit (Phase 728) ' +
    'applies the same distributional-target discipline to skill-embedding coverage.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mathematics-cramer-wold-slicing',
      description: 'Cramér-Wold slicing is the mechanism by which isotropy becomes measurable — projection-based characterization avoids the curse of dimensionality',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-heuristics-free-ssl',
      description: 'The isotropic-Gaussian target is LeJEPA\'s load-bearing design decision; heuristics-free self-supervised learning depends on stating this target explicitly',
    },
    {
      type: 'dependency',
      targetId: 'adaptive-systems-single-lambda-principle',
      description: 'Once the distributional target is stated, the orchestration loss collapses from many hyperparameters to a single λ balancing prediction against distribution matching',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
