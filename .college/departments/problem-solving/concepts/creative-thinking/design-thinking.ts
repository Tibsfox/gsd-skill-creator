import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const designThinking: RosettaConcept = {
  id: 'prob-design-thinking',
  name: 'Design Thinking',
  domain: 'problem-solving',
  description:
    'Design thinking is a human-centered problem-solving methodology with five phases: Empathize (understand users), ' +
    'Define (frame the problem), Ideate (generate solutions), Prototype (build representations), and Test (evaluate). ' +
    'Its distinguishing feature is deep empathy — solutions start from understanding real human needs, ' +
    'not assumed ones. Design thinking is used in product design, healthcare, education, and social innovation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-brainstorming',
      description: 'Ideation in design thinking employs brainstorming and divergent thinking techniques',
    },
    {
      type: 'dependency',
      targetId: 'prob-evaluation-iteration',
      description: 'The Prototype-Test cycle in design thinking is a formalized evaluation-and-iteration loop',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.16 + 0.64),
    angle: Math.atan2(0.8, 0.4),
  },
};
