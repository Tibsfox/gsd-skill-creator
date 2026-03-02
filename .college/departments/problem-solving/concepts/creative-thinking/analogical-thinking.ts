import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const analogicalThinking: RosettaConcept = {
  id: 'prob-analogical-thinking',
  name: 'Analogical Thinking',
  domain: 'problem-solving',
  description:
    'Analogical thinking maps the structure of a familiar domain onto an unfamiliar problem to generate solutions. ' +
    'Velcro was invented by observing burr hooks; sonar was inspired by bat echolocation. ' +
    'The power of analogy is that solutions evolved in one context can be borrowed and adapted in another. ' +
    'Analogy-based reasoning is one of the most productive forms of cross-domain creative problem solving.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-pattern-recognition',
      description: 'Analogical thinking extends pattern recognition across domain boundaries',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.3025 + 0.4225),
    angle: Math.atan2(0.65, 0.55),
  },
};
