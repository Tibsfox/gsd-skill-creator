import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const constraintsResources: RosettaConcept = {
  id: 'prob-constraints-resources',
  name: 'Constraints & Resources',
  domain: 'problem-solving',
  description:
    'Every problem is bounded by constraints (what you cannot change) and enabled by resources (what you have available). ' +
    'Mapping both is essential before generating solutions. Constraints include time, money, materials, and rules. ' +
    'Resources include knowledge, tools, people, and time. ' +
    'Constraints are not always negative — imposed constraints can spark creativity by preventing obvious approaches.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-problem-definition',
      description: 'Constraints and resources are clarified as part of thorough problem definition',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.64 + 0.0625),
    angle: Math.atan2(0.25, 0.8),
  },
};
