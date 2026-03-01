/**
 * Ratios and Proportions concept -- a/b = c/d.
 *
 * Algebra Wing: the language of quantity and relationship.
 * Proportional reasoning, scaling, percentages.
 *
 * @module departments/mathematics/concepts/ratios-proportions
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~pi/12, radius ~0.5 (very concrete)
const theta = Math.PI / 12;
const radius = 0.5;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const ratiosProportions: RosettaConcept = {
  id: 'math-ratios',
  name: 'Ratios and Proportions',
  domain: 'mathematics',
  description: 'a/b = c/d -- proportional reasoning, scaling, and percentages. ' +
    'Ratios are the foundation of recipe scaling, unit conversion, and ' +
    'any comparison between quantities.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'cook-bakers-ratios',
      description: 'Baker\'s percentages express all ingredients as ratios to flour weight',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
