/**
 * Heuristics-Free Self-Supervised Learning concept — from accumulated tricks to stated objectives.
 *
 * LeJEPA (Balestriero & LeCun 2025, arXiv:2511.08544v3) demonstrates that a decade
 * of anti-collapse heuristics in self-supervised learning — stop-gradient,
 * teacher-student networks with EMA schedulers, negative samples, whitening layers
 * — can be replaced by a single provable objective (SIGReg) parameterized by a
 * single hyperparameter λ. The paper reports stable training of 1.8B ViT-g without
 * any of the listed heuristics, 79% ImageNet-1K linear probe on ViT-H/14, and a
 * Spearman ≈0.99 correlation between training loss and downstream accuracy.
 * Architecturally, the finding repositions "anti-collapse" from a bag of tricks
 * that engineers maintain empirically into a distributional constraint that the
 * system measures directly.
 *
 * @module departments/data-science/concepts/heuristics-free-ssl
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~5*2pi/23, radius ~0.88 (data-science / methodology ring)
const theta = 5 * 2 * Math.PI / 23;
const radius = 0.88;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const heuristicsFreeSsl: RosettaConcept = {
  id: 'data-science-heuristics-free-ssl',
  name: 'Heuristics-Free Self-Supervised Learning',
  domain: 'data-science',
  description: 'Heuristics-Free Self-Supervised Learning is the methodological ' +
    'stance introduced by LeJEPA (Balestriero & LeCun 2025) that a decade of ' +
    'accumulated anti-collapse tricks in SSL — stop-gradient, teacher-student ' +
    'networks with EMA schedulers, negative samples, whitening layers, asymmetric ' +
    'projection heads — should be replaced by a single provable objective when ' +
    'possible. The paper proves that the isotropic Gaussian is the unique optimal ' +
    'embedding distribution under both linear and nonlinear probes, introduces ' +
    'SIGReg (Cramér-Wold slicing + Epps-Pulley ECF, ~50 LOC) as the regularizer ' +
    'that enforces this target, and reports stable training of 1.8B ViT-g without ' +
    'any of the previously-standard heuristics. Empirical payoffs: 79% ImageNet-1K ' +
    'top-1 linear probe on ViT-H/14, 60+ architectures tested across the encoder ' +
    'zoo, Spearman ≈0.99 correlation between training loss and downstream accuracy ' +
    '(giving a label-free quality signal), and in-domain beating transfer on ' +
    'Galaxy10 against DINOv2/v3. Architecturally, the finding repositions ' +
    '"anti-collapse" from a bag of engineering tricks into a distributional ' +
    'constraint to be measured. The stance is what gsd-skill-creator imports into ' +
    'Half B of v1.49.571: instead of guarding against skill-library collapse with ' +
    'implicit heuristics, the Skill Space Isotropy Audit measures the distribution ' +
    'of skill coverage directly.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-isotropic-embedding',
      description: 'Heuristics-free SSL depends on stating the target distribution (isotropic Gaussian) explicitly',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-characteristic-function-test',
      description: 'The Epps-Pulley ECF test is the computational engine that makes the heuristics-free stance practical in SGD',
    },
    {
      type: 'dependency',
      targetId: 'adaptive-systems-single-lambda-principle',
      description: 'Heuristics-free SSL is the instance where the single-λ principle was first demonstrated in production ML',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
