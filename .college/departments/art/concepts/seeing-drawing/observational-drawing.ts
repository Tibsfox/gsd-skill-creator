import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const observationalDrawing: RosettaConcept = {
  id: 'art-observational-drawing',
  name: 'Observational Drawing',
  domain: 'art',
  description:
    'The practice of drawing from direct observation rather than memory or imagination. ' +
    'Observational drawing trains the brain to see shapes, proportions, and relationships ' +
    'rather than symbols. The beginner\'s mistake is drawing what they know (a symbol for eye, ' +
    'a symbol for house) instead of what they actually see. Betty Edwards\' right-brain drawing ' +
    'approach inverts this: draw the spaces between objects (negative space), draw upside-down ' +
    'to defeat symbol recognition, and draw contours rather than outlines. The result is that ' +
    'drawing becomes a learnable perceptual skill, not an innate talent.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'art-contour-drawing',
      description: 'Contour drawing is the foundational technique of observational drawing',
    },
    {
      type: 'analogy',
      targetId: 'nature-outdoor-observation',
      description: 'Both require slowing down perception and attending to details others miss',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.25 + 0.01),
    angle: Math.atan2(0.1, 0.5),
  },
};
