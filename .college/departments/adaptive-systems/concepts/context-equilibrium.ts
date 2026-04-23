/**
 * Context Equilibrium concept -- multi-turn drift as stable attractor states.
 *
 * Dongre et al. (2025) showed that multi-turn LLM drift often converges to
 * stable equilibria where context drift and parametric knowledge reach a
 * dynamic balance point, rather than drifting unboundedly.
 *
 * @module departments/adaptive-systems/concepts/context-equilibrium
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~11*2pi/23, radius ~0.78 (dynamical systems, abstract)
const theta = 11 * 2 * Math.PI / 23;
const radius = 0.78;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const contextEquilibrium: RosettaConcept = {
  id: 'adaptive-systems-context-equilibrium',
  name: 'Context Equilibrium',
  domain: 'adaptive-systems',
  description: 'Context equilibrium describes the stable attractor states that ' +
    'multi-turn LLM conversations converge toward as context drift and parametric ' +
    'knowledge reach a dynamic balance. Dongre et al. (2025) modeled multi-turn ' +
    'drift as a dynamical system with equilibrium points where contextual ' +
    'evidence and model priors exert equal competitive pressure; once an ' +
    'equilibrium is reached, further context accumulation produces diminishing ' +
    'shifts in model output. This framing connects LLM drift theory to adaptive ' +
    'control equilibrium concepts, treating context windows as bounded-capacity ' +
    'feedback channels.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'adaptive-systems-agent-stability-index',
      description: 'ASI measures deviations from behavioral stability; context-equilibrium theory provides the theoretical basis for what "stable" means in multi-agent systems',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-response-semantic-drift',
      description: 'RSD captures what happens when context equilibrium is not achieved and the diffusion decoder drifts toward parametric attractors',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-grounding-faithfulness',
      description: 'At equilibrium, grounding faithfulness stabilizes; monitoring SGI scores reveals whether the system has reached a good vs. bad equilibrium',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
