/**
 * Fractal Geometry concept -- z = z^2 + c.
 *
 * Complex Analysis Wing: the imaginary dimension.
 * Self-similar structures at every scale (Mandelbrot set).
 *
 * @module departments/mathematics/concepts/fractal-geometry
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~5*pi/12, radius ~0.75 (between balanced and abstract)
const theta = 5 * Math.PI / 12;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const fractalGeometry: RosettaConcept = {
  id: 'math-fractal-geometry',
  name: 'Fractal Geometry',
  domain: 'mathematics',
  description: 'z = z^2 + c -- self-similar structures at every scale. The Mandelbrot ' +
    'set demonstrates how simple iteration rules generate infinite complexity, ' +
    'mirroring how seed concepts in the Calibration Engine expand fractally.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'culinary-fractal-plating',
      description: 'Fractal plating patterns -- self-similar garnish arrangements and branching herb structures',
    },
    {
      type: 'dependency',
      targetId: 'math-complex-numbers',
      description: 'Mandelbrot iteration operates on complex numbers',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
