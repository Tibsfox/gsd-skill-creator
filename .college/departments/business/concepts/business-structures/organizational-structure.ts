import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const organizationalStructure: RosettaConcept = {
  id: 'bus-organizational-structure',
  name: 'Organizational Structure',
  domain: 'business',
  description:
    'Organizational structure defines how activities, roles, and responsibilities are distributed and coordinated. ' +
    'Functional structure groups by specialty (finance, marketing, operations). ' +
    'Divisional structure groups by product, region, or customer. ' +
    'Matrix structure creates dual reporting lines. Flat structures have few management layers; hierarchical structures have many. ' +
    'Structure should match strategy, size, and environment — there is no universally optimal form.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'bus-corporations-llcs',
      description: 'Organizational structure decisions apply primarily within formally incorporated entities',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
