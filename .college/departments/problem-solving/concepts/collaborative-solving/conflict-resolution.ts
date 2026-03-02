import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const conflictResolution: RosettaConcept = {
  id: 'prob-conflict-resolution',
  name: 'Conflict Resolution',
  domain: 'problem-solving',
  description:
    'Conflict resolution addresses disagreements that arise during collaborative problem solving. ' +
    'Frameworks include interests-based negotiation (distinguishing positions from underlying interests), ' +
    'mediation, and principled negotiation. Key insight: apparent conflicts often dissolve when underlying ' +
    'interests are surfaced. Effective conflict resolution reaches durable solutions that parties actually ' +
    'commit to, rather than imposed compromises that generate compliance but not engagement.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-group-problem-solving',
      description: 'Conflict is a normal part of group problem solving — conflict resolution enables productive continuation',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.25 + 0.49),
    angle: Math.atan2(0.7, 0.5),
  },
};
