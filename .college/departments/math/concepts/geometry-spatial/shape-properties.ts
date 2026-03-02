import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const shapeProperties: RosettaConcept = {
  id: 'math-shape-properties',
  name: 'Shape Properties & Classification',
  domain: 'math',
  description:
    'Geometric shapes are classified by their properties: number of sides, angle types, symmetry, ' +
    'and special relationships between sides. The hierarchy of quadrilaterals (all squares are rectangles, ' +
    'but not all rectangles are squares) exemplifies how properties nest. Identifying and proving properties ' +
    'develops deductive reasoning that transfers to all mathematical argument.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-transformations',
      description: 'Understanding shape properties is prerequisite for reasoning about how shapes change under transformations',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.64 + 0.0225),
    angle: Math.atan2(0.15, 0.8),
  },
};
