import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const tradeoffAnalysis: RosettaConcept = {
  id: 'engr-tradeoff-analysis',
  name: 'Tradeoff Analysis',
  domain: 'engineering',
  description:
    'Engineering design involves constant tradeoffs: strength vs. weight, cost vs. performance, ' +
    'simplicity vs. functionality, speed vs. accuracy. ' +
    'Tradeoff analysis systematically evaluates competing design options against weighted criteria. ' +
    'The Pugh matrix (decision matrix) is a common tool. ' +
    'Key insight: optimizing one parameter nearly always degrades others — the engineer\'s job is finding ' +
    'the best balance, not a perfect solution.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'engr-requirements-specifications',
      description: 'Tradeoff analysis evaluates designs against the specifications to identify which requirements to prioritize',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.4225 + 0.25),
    angle: Math.atan2(0.5, 0.65),
  },
};
