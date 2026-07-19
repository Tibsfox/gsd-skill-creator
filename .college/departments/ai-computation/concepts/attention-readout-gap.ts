/**
 * Attention Readout Gap concept -- tool-selection failures live in the decision readout, not attention.
 *
 * "Looking Is Not Picking" (2026) shows an LLM can attend most strongly to the
 * correct tool-definition segment yet still select the wrong tool, so the failure
 * is a decision-readout error rather than a harness-visibility or lost-in-the-middle
 * attention problem; readout-side interventions recover far more failures than prompt repair.
 *
 * @module departments/ai-computation/concepts/attention-readout-gap
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~7*2pi/23, radius ~0.82 (mechanistic dissociation, abstract-ish)
const theta = 7 * 2 * Math.PI / 23;
const radius = 0.82;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const attentionReadoutGap: RosettaConcept = {
  id: 'ai-computation-attention-readout-gap',
  name: 'Attention Readout Gap',
  domain: 'ai-computation',
  description: 'A dissociation between where a model looks and what it decides: an LLM can place ' +
    'its strongest attention on the correct tool-definition segment and still emit the wrong tool ' +
    'call. "Looking Is Not Picking" (2026) localizes such tool-selection failures to the decision ' +
    'readout that maps attended context to an action, rather than to harness visibility or a ' +
    'lost-in-the-middle attention deficit. The diagnostic consequence is direct: readout-side ' +
    'interventions recover substantially more failures than prompt-side repair, so the fix belongs ' +
    'at the decision head, not the context window.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-activation-delta-probe',
      description: 'Both probe internal state to explain behaviour: the activation-delta probe reads task drift from the residual stream, the attention-readout gap separates attended input from the decision readout',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-local-linearity-steering',
      description: 'The decision readout is a steerable direction; recovering failures by intervening on the readout is a local-linearity steering move applied at the action head',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
