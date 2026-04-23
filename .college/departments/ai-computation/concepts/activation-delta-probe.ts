/**
 * Activation Delta Probe concept -- task-drift detection via internal layer deltas.
 *
 * Abdelnabi et al. (2024) introduced the activation-delta probe as a method
 * to detect when an LLM has drifted from its intended task using internal
 * representation differences between layers, achieving near-perfect AUROC.
 *
 * @module departments/ai-computation/concepts/activation-delta-probe
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~6*2pi/23, radius ~0.80 (mechanistic probe, abstract-ish)
const theta = 6 * 2 * Math.PI / 23;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const activationDeltaProbe: RosettaConcept = {
  id: 'ai-computation-activation-delta-probe',
  name: 'Activation Delta Probe',
  domain: 'ai-computation',
  description: 'The activation-delta probe detects task drift by measuring the ' +
    'L2 distance between a model\'s internal activation vectors at a reference ' +
    'task-start state versus the current state mid-conversation. Abdelnabi et al. ' +
    '(2024) showed this approach achieves near-perfect AUROC for detecting ' +
    'prompt-injection-induced task drift, outperforming output-text classifiers. ' +
    'The probe is model-agnostic and operates on any layer\'s residual stream, ' +
    'making it a lightweight intrinsic monitoring method that requires no ground-truth labels.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-alignment-drift',
      description: 'Activation-delta probes are the detection mechanism; alignment drift is what they detect when task-instruction fidelity degrades',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-grounding-faithfulness',
      description: 'SGI grounding-faithfulness scores complement activation-delta probes: probes detect task drift, SGI measures output faithfulness to retrieved context',
    },
    {
      type: 'dependency',
      targetId: 'data-science-drift-detection',
      description: 'Activation-delta probing extends classical drift-detection to the internal representation space of neural networks',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
