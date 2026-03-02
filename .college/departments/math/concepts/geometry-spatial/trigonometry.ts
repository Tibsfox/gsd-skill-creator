import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const trigonometry: RosettaConcept = {
  id: 'math-trigonometry',
  name: 'Trigonometry',
  domain: 'math',
  description:
    'Trigonometry studies the relationships between angles and sides of triangles, then generalizes ' +
    'them to periodic functions. SOH-CAH-TOA defines sine, cosine, and tangent for right triangles; ' +
    'the unit circle extends these to all angles. Trigonometric functions model periodic phenomena ' +
    '(waves, oscillations) and are foundational for physics, engineering, and signal processing.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-shape-properties',
      description: 'Trigonometry begins with the properties of right triangles',
    },
    {
      type: 'dependency',
      targetId: 'math-coordinate-geometry',
      description: 'The unit circle definition of trigonometric functions uses coordinate geometry',
    },
    {
      type: 'cross-reference',
      targetId: 'phys-wave-properties',
      description: 'Sine and cosine functions mathematically describe wave motion in physics',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.1225 + 0.5625),
    angle: Math.atan2(0.75, 0.35),
  },
};
