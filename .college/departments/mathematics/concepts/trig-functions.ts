/**
 * Trigonometric Functions concept -- periodic functions on the unit circle.
 *
 * Geometry Wing: periodic patterns and spatial reasoning.
 * sin(theta), cos(theta), tan(theta)
 *
 * @module departments/mathematics/concepts/trig-functions
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~pi/4, radius ~0.7 (balanced concrete/abstract)
const theta = Math.PI / 4;
const radius = 0.7;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const trigFunctions: RosettaConcept = {
  id: 'math-trig-functions',
  name: 'Trigonometric Functions',
  domain: 'mathematics',
  description: 'Sine, cosine, tangent -- periodic functions on the unit circle. ' +
    'Trigonometric functions describe oscillation, rotation, and any phenomenon ' +
    'that repeats at regular intervals.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'culinary-periodic-processes',
      description: 'Periodic flavor development in fermentation, oven temperature cycling',
    },
    {
      type: 'dependency',
      targetId: 'math-euler-formula',
      description: 'Euler\'s formula unifies trig functions with complex exponentials',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
