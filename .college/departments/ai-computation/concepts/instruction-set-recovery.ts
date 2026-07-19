/**
 * Instruction Set Recovery concept -- read the agent's active instruction set off its activations.
 *
 * PRISM (2026) formalizes instruction-set retrieval: an activation-conditioned
 * interpreter decodes a frozen model's hidden states into a faithful bullet list
 * of the instructions, constraints, prohibitions, and subgoals currently steering
 * it, exposing injected or hidden objectives a text log would miss.
 *
 * @module departments/ai-computation/concepts/instruction-set-recovery
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~13*2pi/23, radius ~0.80 (mechanistic monitoring, security-relevant)
const theta = 13 * 2 * Math.PI / 23;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const instructionSetRecovery: RosettaConcept = {
  id: 'ai-computation-instruction-set-recovery',
  name: 'Instruction Set Recovery',
  domain: 'ai-computation',
  description: 'Reliable agent monitoring requires knowing not just what a model outputs but WHICH ' +
    'instructions are steering it — hard when the model infers unintended subgoals, follows contextual ' +
    'cues, or is moved by prompt injections and hidden objectives. PRISM (2026) formalizes instruction-set ' +
    'retrieval and trains an activation-conditioned interpreter that decodes a frozen target model\'s ' +
    'hidden states into a faithful bullet list of the active instructions, constraints, prohibitions, and ' +
    'subgoals. Unlike prior activation-to-language methods, which were not built to recover the full ' +
    'simultaneous instruction set, PRISM uses judge-guided GRPO to reward covered instructions and ' +
    'penalize unsupported ones, outperforming baselines especially on security-relevant hidden objectives. ' +
    'The consequence for monitoring is direct: read the active instruction set off the activations to ' +
    'expose an injected or hidden subgoal that never appears in the output or the prompt log.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-activation-delta-probe',
      description: 'Both decode internal state: the activation-delta probe measures the magnitude of task drift, instruction-set recovery reads out the specific instruction set producing it',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-attention-readout-gap',
      description: 'Both localize agent behaviour to an internal mechanism rather than the prompt: the readout gap to the decision head, instruction-set recovery to the active instruction set in the residual stream',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
