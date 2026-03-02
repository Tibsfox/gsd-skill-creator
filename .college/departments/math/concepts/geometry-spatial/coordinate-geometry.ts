import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const coordinateGeometry: RosettaConcept = {
  id: 'math-coordinate-geometry',
  name: 'Coordinate Geometry',
  domain: 'math',
  description:
    'The coordinate plane bridges algebra and geometry by assigning number pairs to every point. ' +
    'Descartes\' insight that geometric shapes can be described by equations allows algebraic tools ' +
    'to solve geometric problems. Key ideas include distance, slope, midpoint, and using equations ' +
    'to describe lines, circles, and other curves.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-functions',
      description: 'Functions are visualized as graphs on the coordinate plane',
    },
    {
      type: 'dependency',
      targetId: 'math-shape-properties',
      description: 'Coordinate geometry provides algebraic methods for proving geometric properties',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
