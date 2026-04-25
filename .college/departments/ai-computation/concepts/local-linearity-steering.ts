/**
 * Local Linearity Steering concept — activation-space CRAFT modulation without fine-tuning.
 *
 * Source: Local Linearity of LLMs (arXiv:2604.19018, Skifstad, Yang & Chou).
 *
 * The key finding: the forward dynamics of large language models are approximately
 * locally linear in the neighbourhood of any given activation trajectory. This
 * enables a model-based linear optimal control formulation (LQR applied to the
 * activation-space Jacobian) for steering the model's outputs, computing steering
 * vectors analytically rather than learning them from a reward signal (no fine-tuning
 * required). For gsd-skill-creator, this is the no-fine-tune CRAFT-role modulation
 * architecture: instead of injecting CRAFT-role instructions into the system prompt
 * (which consumes prompt budget and is susceptible to role bleed), an activation-
 * space steering vector can be applied to modulate CRAFT roles directly.
 *
 * Risk: High. Gated on white-box API access resolution before Phase 767 T1c.
 *
 * Milestone: v1.49.573 upstream-intelligence-pack-v1.44.
 *
 * @module departments/ai-computation/concepts/local-linearity-steering
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~3*2pi/29, radius ~0.91 (activation-steering ring)
const theta = 3 * 2 * Math.PI / 29;
const radius = 0.91;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const localLinearitySteering: RosettaConcept = {
  id: 'ai-computation-local-linearity-steering',
  name: 'Local Linearity Steering',
  domain: 'ai-computation',
  description: 'Local Linearity of LLMs (arXiv:2604.19018) establishes that the ' +
    'activation-space forward dynamics of large language models are approximately ' +
    'locally linear in the neighbourhood of any given trajectory. The Jacobian of ' +
    'the activation map with respect to the input exists and is well-conditioned ' +
    'locally. This enables a model-based linear optimal control formulation (LQR ' +
    'on the activation-space Jacobian) for computing steering vectors analytically: ' +
    'given a target activation direction, the optimal perturbation to the residual ' +
    'stream that moves the model toward that direction can be solved as a standard ' +
    'LQR problem. For gsd-skill-creator\'s DACP runtime, this is the no-fine-tune ' +
    'CRAFT-role modulation architecture: steering vectors modulate CRAFT roles at ' +
    'the activation level rather than via system-prompt injection. Phase 767 T1c ' +
    'implements this as an opt-in layer on top of the DACP runtime, contingent on ' +
    'white-box API access resolution (the only High-risk M1 paper).',
  panels: new Map([
    ['typescript', {
      panelId: 'typescript',
      explanation: 'Phase 767 exports an ActivationSteering class with ' +
        'computeSteeringVector(targetRole: CraftRole): SteeringVector using the ' +
        'Jacobian computed at the current activation trajectory. The vector is ' +
        'applied as a residual-stream addition. DACP src/ is byte-identical with ' +
        'the flag off (CAPCOM Gate G11 hard-preservation). See arXiv:2604.19018.',
    }],
    ['python', {
      panelId: 'python',
      explanation: 'A JAX implementation computes the activation Jacobian via ' +
        'jax.jacrev on the forward pass, then solves the LQR gain matrix with ' +
        'scipy.linalg.solve_discrete_are. Steering direction is the LQR-optimal ' +
        'perturbation for the target CRAFT role\'s reference activation. ' +
        'See arXiv:2604.19018.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-semantic-channel',
      description: 'Local-linearity steering operates on the activation space that ' +
        'the semantic-channel model describes: the steering vector moves the model ' +
        'within the intent leg of the DACP three-part bundle, exploiting the local ' +
        'linearity of the channel\'s encoding map.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-bounded-learning-theorem',
      description: 'Activation steering without fine-tuning preserves the ' +
        'bounded-learning constitution: the steering vector is computed and applied ' +
        'at inference time, not trained into the model weights, so no weight update ' +
        'occurs and the bounded-learning caps do not apply to the steering step.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
