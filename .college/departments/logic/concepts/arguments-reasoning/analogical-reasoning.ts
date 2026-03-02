import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const analogicalReasoning: RosettaConcept = {
  id: 'log-analogical-reasoning',
  name: 'Analogical Reasoning',
  domain: 'logic',
  description: 'Analogical reasoning extends conclusions from one domain to another based on structural similarity. ' +
    'Structure: "A is to B as C is to D" -- if A and C share relevant properties, conclusions about A may apply to C. ' +
    'Legal reasoning by analogy: "This case is similar to that precedent in relevant respects, therefore the same ruling applies." ' +
    'Scientific analogies: the atom as a solar system (Bohr model). Analogies guide inquiry but can mislead if pushed too far. ' +
    'Criteria for strong analogies: (1) many shared relevant features, (2) few disanalogies, (3) shared features are relevant to the conclusion. ' +
    'Argument from analogy form: A has properties P1, P2, P3 and Q. B has P1, P2, P3. Therefore B probably has Q. ' +
    'Evaluating analogies: what are the disanalogies? Are the similarities superficial or structural? ' +
    'Metaphor as analogy: all metaphors are compressed analogies -- "argument is war" implies certain structures apply and others don\'t.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'log-argument-structure',
      description: 'Analogical arguments have their own structure -- understanding argument form enables evaluating analogy strength',
    },
    {
      type: 'cross-reference',
      targetId: 'code-pattern-recognition',
      description: 'Pattern recognition in coding applies analogical reasoning -- identifying structural similarity between problems enables solution transfer',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.3025 + 0.36),
    angle: Math.atan2(0.6, 0.55),
  },
};
