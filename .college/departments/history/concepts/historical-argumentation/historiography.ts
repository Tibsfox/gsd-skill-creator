import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const historiography: RosettaConcept = {
  id: 'hist-historiography',
  name: 'Historiography',
  domain: 'history',
  description:
    'Historiography is the study of how history has been written and how historical interpretation changes over time. ' +
    'The same events get reinterpreted by each generation: the causes of the Civil War, the legacy of colonialism, ' +
    'and the significance of the French Revolution have all been rewritten multiple times. ' +
    'Understanding historiography reveals that history is not a fixed body of facts but an ongoing, contested conversation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-bias-in-history',
      description: 'Historiographical debates often center on how different historians\' biases shaped their interpretations',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.1225 + 0.64),
    angle: Math.atan2(0.8, 0.35),
  },
};
