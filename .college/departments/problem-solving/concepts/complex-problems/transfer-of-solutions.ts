import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const transferOfSolutions: RosettaConcept = {
  id: 'prob-transfer-of-solutions',
  name: 'Transfer of Problem-Solving Skills',
  domain: 'problem-solving',
  description:
    'Transfer is the ability to apply a problem-solving strategy learned in one context to a new context. ' +
    'Near transfer applies strategies to very similar problems; far transfer applies them across domains. ' +
    'Far transfer is difficult — it requires abstraction, recognizing deep structural similarity beneath ' +
    'surface-level differences. Teaching for transfer requires explicit reflection on principles rather ' +
    'than just procedures.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-analogical-thinking',
      description: 'Far transfer and analogical thinking are the same cognitive process — applying deep structure across domains',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.16 + 0.64),
    angle: Math.atan2(0.8, 0.4),
  },
};
