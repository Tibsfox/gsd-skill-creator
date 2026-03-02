import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const heuristics: RosettaConcept = {
  id: 'prob-heuristics',
  name: 'Heuristics',
  domain: 'problem-solving',
  description:
    'Heuristics are practical rules of thumb that generally work, even though they do not guarantee success. ' +
    'Examples: working backwards from the goal, solving a simpler version of the problem first, ' +
    'drawing a diagram, looking for analogies, eliminating impossible solutions. ' +
    'Heuristics are cognitively efficient — they focus effort rather than exhaustive search. ' +
    'Expert problem solvers have rich heuristic libraries built through extensive practice.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-pattern-recognition',
      description: 'Heuristics are triggered by pattern recognition — matching a problem type to its known useful strategies',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
