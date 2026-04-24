/**
 * Latent World Model concept — planning in learned latent space rather than observation space.
 *
 * LeWorldModel (Maes, Le Lidec, Scieur, LeCun, Balestriero 2026) is the first
 * end-to-end pixel JEPA world model: an encoder maps a single frame to a 192-dim
 * CLS-style latent token, a predictor forecasts the next latent given current
 * latent and action, and the training objective L = L_pred + λ·SIGReg(Z) collapses
 * six hyperparameters to one. Planning via Cross-Entropy Method over the compact
 * latent completes in ~1s per episode versus DINO-WM's ~47s, a 48× speedup
 * attributed to the 192-dim token representation (~200× fewer tokens per frame
 * than DINO-WM's patch grid). The architecture transposes to mission-state
 * planning in gsd-skill-creator: Phase 732 ports the same structure to mission
 * state (current wave, completed tasks, open CAPCOM gates, budget) with CEM-based
 * pre-dispatch wave rehearsal.
 *
 * @module departments/ai-computation/concepts/latent-world-model
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~8*2pi/23, radius ~0.86 (architectural / world-model ring)
const theta = 8 * 2 * Math.PI / 23;
const radius = 0.86;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const latentWorldModel: RosettaConcept = {
  id: 'ai-computation-latent-world-model',
  name: 'Latent World Model',
  domain: 'ai-computation',
  description: 'A Latent World Model predicts future embeddings (not future raw ' +
    'observations) from current embeddings and an action. LeWorldModel (Maes et ' +
    'al. 2026, companion to LeJEPA) is the first end-to-end pixel JEPA world model ' +
    '— an encoder maps a single frame to a 192-dim CLS-style latent token, a ' +
    'predictor forecasts the next latent given current latent and action, and the ' +
    'training objective L = L_pred + λ·SIGReg(Z) has just two loss terms and one ' +
    'hyperparameter. The payoff is planning speed: Cross-Entropy Method over the ' +
    'compact latent completes in ~1s per episode versus DINO-WM\'s ~47s — a 48× ' +
    'speedup attributed specifically to the 192-dim token representation (~200× ' +
    'fewer tokens per frame than DINO-WM\'s patch grid), not to any single ' +
    'engineering optimization. The underlying principle (CEM cost scales with ' +
    'state-space dimensionality, so shrinking dimensionality dominates) is what ' +
    'the Phase 732 Mission-State World Model imports into gsd-skill-creator: the ' +
    'latent encodes mission state (current wave, completed tasks, open CAPCOM ' +
    'gates, budget, skill activation set) into ≤192 dimensions so CEM can ' +
    'rehearse a wave before the orchestrator actually dispatches it. Hard ' +
    'constraint: the predictor sits under CAPCOM, never replacing it. CEM ' +
    'rollouts are advisory; CAPCOM human-gate authority remains authoritative.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-isotropic-embedding',
      description: 'The latent space must be stably trained before anything can usefully plan in it; LeJEPA\'s isotropic target is the stability foundation that makes LeWM possible',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-capability-evolution',
      description: 'Latent world-model planning is a capability module in the ECM sense; it can be added as a default-off module without disturbing the agent identity substrate',
    },
    {
      type: 'dependency',
      targetId: 'adaptive-systems-single-lambda-principle',
      description: 'LeWM\'s two-loss single-λ objective is an instance of the Single-λ Principle — six tunable weights in DINO-WM collapse to one in LeWM',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
