import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const communicationInSolving: RosettaConcept = {
  id: 'prob-communication-in-solving',
  name: 'Communication in Problem Solving',
  domain: 'problem-solving',
  description:
    'Effective collaborative problem solving requires communicating clearly about the problem state, ' +
    'proposed solutions, and reasoning. This includes visual communication (diagrams, sketches, models), ' +
    'written documentation (problem statements, solution specs), and verbal explanation. ' +
    'The ability to explain one\'s thinking is a metacognitive skill — articulating reasoning makes implicit ' +
    'assumptions explicit and enables others to identify errors.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'comm-structured-presentation',
      description: 'Presenting a problem analysis or solution requires structured presentation skills',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.3025 + 0.36),
    angle: Math.atan2(0.6, 0.55),
  },
};
