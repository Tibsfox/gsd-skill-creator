/**
 * Koopman Bilinear Form concept — lifted-observable sequence-memory operator.
 *
 * Dynamics / State-Space wing.
 * The Koopman operator is the linear evolution operator for observables
 * defined on the phase space of a dynamical system; it turns non-linear
 * dynamics on the base space into linear dynamics on an infinite-dimensional
 * observable space. Mamba-class state-space models admit a Koopman
 * interpretation: the state-update operator, viewed on the lifted observable
 * space, is bilinear. The April 2026 cluster paper (arXiv:2604.17221)
 * formalises the bilinear form and derives stability conditions. For
 * gsd-skill-creator, this is the M5 substrate for sequence memory — Phase
 * 749 (if-budget) ships a reference implementation with spectral checks.
 *
 * Milestone: v1.49.572 math-foundations-apr2026.
 *
 * @module departments/ai-computation/concepts/koopman-bilinear-form
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~13*2pi/29, radius ~0.87 (dynamical-systems ring)
const theta = 13 * 2 * Math.PI / 29;
const radius = 0.87;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const koopmanBilinearForm: RosettaConcept = {
  id: 'ai-computation-koopman-bilinear-form',
  name: 'Koopman Bilinear Form',
  domain: 'ai-computation',
  description: 'The Koopman operator U acts on observables g of a dynamical system ' +
    'by composition with the flow: (Ug)(x) = g(f(x)). U is linear even when f is ' +
    'not, which is the load-bearing property of the Koopman picture. Mamba-class ' +
    'state-space models admit a Koopman interpretation in which the state-update ' +
    'operator, viewed on a lifted observable space, is bilinear — a product of ' +
    'two linear operators acting on input-token and state respectively. The ' +
    'April 2026 cluster paper (arXiv:2604.17221) formalises this bilinearity and ' +
    'derives stability conditions: the spectral radius of the bilinear form ' +
    'controls memory retention across long sequences, and the numerical range ' +
    'controls robustness to perturbation. For gsd-skill-creator\'s Silicon Layer, ' +
    'Koopman-bilinear memory is the preferred alternative to attention ' +
    'approximations: it has characterised failure modes rather than unknown ones. ' +
    'Phase 749 (if-budget) ships a reference implementation with the spectral ' +
    'checks built in as runtime assertions.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'A JAX implementation represents the bilinear form as a 3-tensor K[i,j,k] such that state_next[k] = sum_{i,j} K[i,j,k] * input[i] * state[j]. Spectral radius is estimated via power iteration on the unfolded matrix. See arXiv:2604.17221.',
    }],
    ['typescript', {
      panelId: 'typescript',
      explanation: 'The Phase 749 primitive exports a BilinearForm interface and an apply(input, state): state function. Spectral checks run at construction; runtime assertions guard against drift past the stable spectral-radius bound. See arXiv:2604.17221.',
    }],
    ['rust', {
      panelId: 'rust',
      explanation: 'A Rust implementation uses ndarray for the 3-tensor and a small custom spectral-radius estimator. The bilinear primitive is exposed via Node N-API so the TypeScript Silicon-Layer routing layer can call it without copying the tensor. See arXiv:2604.17221.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-semantic-channel',
      description: 'Koopman-bilinear memory is the sequence-memory primitive sitting alongside the semantic-channel routing primitive in the Silicon Layer; both are M5 substrates',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-capability-evolution',
      description: 'Capability-evolution tracking over long sequences depends on Koopman-bilinear memory retention; the two concepts co-locate at the Convergent Substrate boundary',
    },
    {
      type: 'dependency',
      targetId: 'mathematics-complex-numbers',
      description: 'Spectral-radius computations use complex-number arithmetic; the Complex Analysis wing\'s complex-numbers concept is a prerequisite',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
