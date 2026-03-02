import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const intellectualHumility: RosettaConcept = {
  id: 'crit-intellectual-humility',
  name: 'Intellectual Humility',
  domain: 'critical-thinking',
  description:
    'Intellectual humility is the recognition that one\'s knowledge is limited and fallible. ' +
    'It involves holding views proportionally to evidence, remaining open to updating beliefs, and ' +
    'resisting the social pressure to project false certainty. It is not the same as uncertainty or ' +
    'lack of confidence — it is the accurate calibration of confidence to actual knowledge.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'crit-confirmation-bias',
      description: 'Intellectual humility is the dispositional antidote to confirmation bias',
    },
    {
      type: 'analogy',
      targetId: 'sci-scientific-theories',
      description: 'Science institutionalizes intellectual humility — all theories are provisional and subject to revision',
    },
  ],
  complexPlanePosition: {
    real: 0.25,
    imaginary: 0.9,
    magnitude: Math.sqrt(0.0625 + 0.81),
    angle: Math.atan2(0.9, 0.25),
  },
};
