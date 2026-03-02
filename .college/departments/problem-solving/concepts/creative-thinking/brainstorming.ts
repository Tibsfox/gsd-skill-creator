import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const brainstorming: RosettaConcept = {
  id: 'prob-brainstorming',
  name: 'Brainstorming',
  domain: 'problem-solving',
  description:
    'Brainstorming is a divergent thinking technique for generating many ideas quickly by suspending judgment. ' +
    'Rules: defer evaluation, build on others\' ideas, go for volume, welcome wild ideas. ' +
    'The separation of generation from evaluation is key — critical thinking during ideation kills creative ideas. ' +
    'After brainstorming, convergent thinking evaluates and selects. ' +
    'Modern variants include brainwriting (silent idea-writing), reverse brainstorming, and mind mapping.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-problem-definition',
      description: 'Effective brainstorming is focused by a well-defined problem statement',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.4225 + 0.25),
    angle: Math.atan2(0.5, 0.65),
  },
};
