/**
 * Harness as Object concept -- first-class harness systems.
 *
 * The Natural-Language Agent Harnesses paper (2026, arXiv:2603.25723) elevates
 * harness to a first-class systems object defined as control plus contracts plus
 * state. The harness-runtime boundary becomes analytical rather than absolute.
 * The taxonomy maps onto the gsd-skill-creator Wave / CAPCOM / Squadron / Fleet
 * decomposition; independent arrival at the same pattern is strong validation.
 *
 * @module departments/ai-computation/concepts/harness-as-object
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~16*2pi/23, radius ~0.80 (systems, slightly abstract)
const theta = 16 * 2 * Math.PI / 23;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const harnessAsObject: RosettaConcept = {
  id: 'ai-computation-harness-as-object',
  name: 'Harness as First-Class Object',
  domain: 'ai-computation',
  description: 'Harness as First-Class Object is the architectural treatment of the ' +
    'orchestration layer (the wrapper around an LLM runtime) as a named systems ' +
    'entity rather than a thin controller. Defined as control plus contracts plus ' +
    'state, the harness mediates between the probabilistic runtime and deterministic ' +
    'downstream systems. The April 2026 Natural-Language Agent Harnesses paper ' +
    'articulates this explicitly, and the taxonomy maps directly onto the ' +
    'gsd-skill-creator Wave / CAPCOM / Squadron / Fleet decomposition. The ' +
    'practical consequence is that the harness becomes a debuggable, checkpointed, ' +
    'versioned artifact rather than an implicit consequence of how the runtime is ' +
    'invoked. CAMCO (Rushing et al. 2026) further formalizes the gate pattern within ' +
    'such a harness as a K_max-then-escalate theorem.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-capability-evolution',
      description: 'The harness object is what orchestrates ECM loading, versioning, and runtime-safety enforcement',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-evidence-centric-reasoning',
      description: 'Evidence-centric reasoning graphs are maintained by the harness as part of its state contract',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
