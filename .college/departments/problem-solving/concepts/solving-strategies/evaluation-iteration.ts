import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const evaluationIteration: RosettaConcept = {
  id: 'prob-evaluation-iteration',
  name: 'Evaluation & Iteration',
  domain: 'problem-solving',
  description:
    'Evaluation tests a proposed solution against the success criteria established in problem definition. ' +
    'Iteration uses evaluation feedback to improve the solution. Most real solutions require multiple ' +
    'cycles of build-evaluate-improve. The failure to iterate (treating the first solution as final) is a ' +
    'common problem-solving error. Design thinking and agile development formalize this iterative cycle.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-trial-error',
      description: 'Evaluation and iteration is the disciplined form of trial-and-error — structured feedback loops',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.3025 + 0.36),
    angle: Math.atan2(0.6, 0.55),
  },
};
