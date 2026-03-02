import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const lateralThinking: RosettaConcept = {
  id: 'prob-lateral-thinking',
  name: 'Lateral Thinking',
  domain: 'problem-solving',
  description:
    'Lateral thinking (Edward de Bono) approaches problems from unexpected angles rather than following ' +
    'the most obvious logical path. Techniques include random entry (forced connection to a random word or image), ' +
    'provocation (stating something deliberately false to break habitual thinking), ' +
    'and the "six thinking hats" method. Lateral thinking is particularly valuable when conventional approaches ' +
    'are stuck in local optima and fresh perspective is needed.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-brainstorming',
      description: 'Lateral thinking techniques are advanced brainstorming methods for escaping conventional solution patterns',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.25 + 0.49),
    angle: Math.atan2(0.7, 0.5),
  },
};
