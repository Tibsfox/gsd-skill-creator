import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const biasInHistory: RosettaConcept = {
  id: 'hist-bias-in-history',
  name: 'Bias in Historical Sources',
  domain: 'history',
  description:
    'All historical sources reflect the biases of their creators. Bias is not merely dishonesty — it includes ' +
    'unconscious assumptions, selective emphasis, and the limits of the creator\'s social position and knowledge. ' +
    'A biased source is not useless; it is evidence of how its creator saw the world. ' +
    'Identifying bias requires asking: What does this source leave out? Whose interests does it serve? ' +
    'What would a person from a different position have written about the same events?',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-source-analysis',
      description: 'Bias analysis is a core component of source analysis frameworks like HAPP and SOAPS',
    },
    {
      type: 'cross-reference',
      targetId: 'crit-confirmation-bias',
      description: 'Historians\' own confirmation biases can distort which sources they select and how they interpret them',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
