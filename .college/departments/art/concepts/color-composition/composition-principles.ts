import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const compositionPrinciples: RosettaConcept = {
  id: 'art-composition-principles',
  name: 'Composition Principles',
  domain: 'art',
  description:
    'Composition is the arrangement of visual elements to guide the viewer\'s eye and ' +
    'create a unified image. The rule of thirds divides the image into 9 equal sections; ' +
    'placing subjects at the intersection points creates visual tension more dynamic than ' +
    'dead-center placement. The golden ratio (phi = 1.618) appears in classical art as a ' +
    'proportioning system and in the golden spiral as a compositional guide. Visual hierarchy ' +
    'uses size, contrast, and position to signal importance. Leading lines pull the eye ' +
    'through the composition toward the subject. Negative space (empty space) shapes the ' +
    'positive space and is as compositionally active as the subject itself. Balance can be ' +
    'symmetrical (mirror), asymmetrical (different weights balanced by position), or radial.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-golden-ratio',
      description: 'The golden ratio appears directly in classical compositional systems',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};
