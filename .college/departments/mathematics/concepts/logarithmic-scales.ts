/**
 * Logarithmic Scales concept -- log_b(x).
 *
 * Algebra Wing: the language of quantity and relationship.
 * Compressing large ranges into human-perceivable scales.
 *
 * @module departments/mathematics/concepts/logarithmic-scales
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~pi/6, radius ~0.65 (mostly concrete)
const theta = Math.PI / 6;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const logarithmicScales: RosettaConcept = {
  id: 'math-logarithmic-scales',
  name: 'Logarithmic Scales',
  domain: 'mathematics',
  description: 'log_b(x) -- compressing large ranges into human-perceivable scales. ' +
    'Logarithms turn multiplication into addition, making vast differences ' +
    'manageable (decibels, pH, Richter scale).',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'culinary-ph-cooking',
      description: 'pH in cooking uses logarithmic scale -- taste perception follows Weber-Fechner law',
    },
    {
      type: 'analogy',
      targetId: 'math-exponential-decay',
      description: 'Logarithms are the inverse of exponentials -- two perspectives on the same relationship',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
