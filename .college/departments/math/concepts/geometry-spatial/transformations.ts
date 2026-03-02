import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const transformations: RosettaConcept = {
  id: 'math-transformations',
  name: 'Transformations, Congruence & Similarity',
  domain: 'math',
  description:
    'Rigid transformations (translation, rotation, reflection) preserve shape and size, producing ' +
    'congruent figures. Dilations scale figures to produce similar shapes. Understanding these transformations ' +
    'through the lens of function-like mappings (each point maps to exactly one image point) connects ' +
    'geometry to algebra and underpins proof by transformation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-shape-properties',
      description: 'Transformations preserve certain shape properties while changing position, orientation, or size',
    },
    {
      type: 'analogy',
      targetId: 'math-functions',
      description: 'Geometric transformations are functions that map points to points in the plane',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.4225 + 0.1225),
    angle: Math.atan2(0.35, 0.65),
  },
};
