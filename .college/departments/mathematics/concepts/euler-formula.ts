/**
 * Euler's Formula concept -- the bridge between exponentials and trigonometry.
 *
 * Complex Analysis Wing: peak abstraction.
 * e^(i*theta) = cos(theta) + i*sin(theta)
 *
 * @module departments/mathematics/concepts/euler-formula
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~5*pi/12, radius ~0.9 (high abstraction)
const theta = 5 * Math.PI / 12;
const radius = 0.9;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const eulerFormula: RosettaConcept = {
  id: 'math-euler-formula',
  name: 'Euler\'s Formula',
  domain: 'mathematics',
  description: 'e^(i*theta) = cos(theta) + i*sin(theta) -- the bridge between ' +
    'exponentials and trigonometry. Euler\'s formula unifies five fundamental ' +
    'constants (e, i, pi, 1, 0) and underlies the Complex Plane of Experience.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-complex-numbers',
      description: 'Euler\'s formula requires complex numbers as its domain',
    },
    {
      type: 'dependency',
      targetId: 'math-trig-functions',
      description: 'The right side of Euler\'s formula IS trig functions',
    },
    {
      type: 'cross-reference',
      targetId: 'culinary-emulsification',
      description: 'Concept rotation on the Complex Plane -- like emulsifying oil and water into a stable mixture',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
