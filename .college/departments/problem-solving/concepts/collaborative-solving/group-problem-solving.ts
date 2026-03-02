import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const groupProblemSolving: RosettaConcept = {
  id: 'prob-group-problem-solving',
  name: 'Group Problem Solving',
  domain: 'problem-solving',
  description:
    'Groups can outperform individuals on complex problems through cognitive diversity, error correction, ' +
    'and parallel processing. But groups also fail through conformity pressure, social loafing, ' +
    'and communication overhead. Effective group problem-solving requires clear roles, ' +
    'psychological safety to share dissenting ideas, structured ideation phases, and explicit decision processes. ' +
    'Understanding both the advantages and pitfalls of group cognition is essential for collaborative work.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-brainstorming',
      description: 'Group brainstorming rules specifically address how to prevent conformity from suppressing creative ideas',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
