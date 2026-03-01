/**
 * Complex Numbers concept -- z = a + bi.
 *
 * Complex Analysis Wing: the imaginary dimension.
 * Numbers with real and imaginary parts enable rotation, oscillation,
 * and the unit circle architecture of the Rosetta Core.
 *
 * @module departments/mathematics/concepts/complex-numbers
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~pi/3, radius ~0.85 (moving toward abstract)
const theta = Math.PI / 3;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const complexNumbers: RosettaConcept = {
  id: 'math-complex-numbers',
  name: 'Complex Numbers',
  domain: 'mathematics',
  description: 'z = a + bi -- numbers with real and imaginary parts. Complex numbers ' +
    'enable rotation, oscillation, and the mapping of 2D phenomena. They are ' +
    'the foundation of the unit circle architecture in skill-creator.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'culinary-flavor-pairing',
      description: 'Flavor pairing as complex mapping -- balancing real (taste) and imaginary (aroma) dimensions',
    },
    {
      type: 'dependency',
      targetId: 'math-trig-functions',
      description: 'Complex numbers on the unit circle are expressed through trig functions',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
