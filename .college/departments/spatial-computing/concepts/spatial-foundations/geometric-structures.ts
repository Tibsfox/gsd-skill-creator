import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const geometricStructures: RosettaConcept = {
  id: 'spatial-geometric-structures',
  name: 'Geometric Structures in Block Space',
  domain: 'spatial-computing',
  description:
    'Circles in block space use the discrete midpoint algorithm: for radius R, include block (x,z) if ' +
    'x^2 + z^2 <= R^2. A radius-10 circle needs ~316 blocks in the perimeter. Spheres extend to 3D ' +
    'using x^2 + y^2 + z^2 <= R^2. Pixel art scales characters from 2D grids: a 16x16 sprite at ' +
    '2x scale becomes 32x32 blocks. Voxel geometry means diagonal lines are staircased -- the ' +
    'steeper the angle, the more staircase-like the result. Symmetry tools: building one quadrant ' +
    'of a circle and mirroring using WorldEdit or manual coordinate arithmetic. Spiral staircases ' +
    'trace a helix: each quarter turn rises 1 block, creating a visually smooth ascent. Arches use ' +
    'odd-width spans (3, 5, 7 blocks) centered on a keystone block for visual symmetry.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-geometry',
      description: 'Circle and sphere equations are direct applications of 2D/3D Euclidean geometry',
    },
    {
      type: 'dependency',
      targetId: 'spatial-structural-principles',
      description: 'Geometric structures like arches and domes require structural understanding to be load-bearing',
    },
  ],
  complexPlanePosition: {
    real: 0.78,
    imaginary: 0.28,
    magnitude: Math.sqrt(0.78 ** 2 + 0.28 ** 2),
    angle: Math.atan2(0.28, 0.78),
  },
};
