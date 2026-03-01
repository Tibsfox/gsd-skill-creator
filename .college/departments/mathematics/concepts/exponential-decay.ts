/**
 * Exponential Decay concept -- Newton's law of cooling.
 *
 * Calculus Wing: rates of change and accumulation.
 * T(t) = T_ambient + (T_initial - T_ambient) * e^(-kt)
 *
 * @module departments/mathematics/concepts/exponential-decay
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~pi/6, radius ~0.8 (mostly concrete, computational)
const theta = Math.PI / 6;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const exponentialDecay: RosettaConcept = {
  id: 'math-exponential-decay',
  name: 'Exponential Decay',
  domain: 'mathematics',
  description: 'Newton\'s law of cooling: T(t) = T_ambient + (T_initial - T_ambient) * e^(-kt). ' +
    'Exponential decay models cooling curves, radioactive decay, and any process where ' +
    'the rate of change is proportional to the current value.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'cook-newtons-cooling',
      description: 'Cooling curves in cooking -- how hot food reaches safe temperatures, fermentation rates, yeast growth',
    },
    {
      type: 'analogy',
      targetId: 'math-logarithmic-scales',
      description: 'Logarithms are the inverse of exponentials -- decay and scaling are two sides of the same coin',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
