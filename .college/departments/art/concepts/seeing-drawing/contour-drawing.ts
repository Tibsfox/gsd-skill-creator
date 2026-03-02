import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const contourDrawing: RosettaConcept = {
  id: 'art-contour-drawing',
  name: 'Contour Drawing',
  domain: 'art',
  description:
    'Contour drawing traces the edges and interior lines of an object with a slow, ' +
    'deliberate line that follows the surface. Blind contour drawing (not looking at the paper) ' +
    'forces the eye to lead the hand, building the hand-eye coordination essential for ' +
    'accurate observation. Modified contour (occasional glances) balances accuracy with the ' +
    'perceptual depth gained from blind practice. Pure outline drawing, by contrast, ' +
    'creates flat symbol drawings. Contour drawing engages the right hemisphere\'s ' +
    'spatial processing, suppressing the left hemisphere\'s tendency to substitute learned symbols.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'art-observational-drawing',
      description: 'Contour drawing is the primary technique used in observational drawing',
    },
    {
      type: 'analogy',
      targetId: 'art-gesture-drawing',
      description: 'Contour captures edges while gesture captures movement and flow',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.36 + 0.0225),
    angle: Math.atan2(0.15, 0.6),
  },
};
