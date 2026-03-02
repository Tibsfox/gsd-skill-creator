import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const printmaking: RosettaConcept = {
  id: 'art-printmaking',
  name: 'Printmaking',
  domain: 'art',
  description:
    'Printmaking transfers an image from a matrix (block, plate, or screen) to paper ' +
    'through pressure or ink transfer. Relief printing (woodblock, linocut) carves away ' +
    'areas that will NOT print; remaining raised surface holds ink. Intaglio (etching, ' +
    'engraving) holds ink in recessed lines; pressure forces paper into the grooves. ' +
    'Screen printing (serigraphy) forces ink through a mesh screen where areas have not ' +
    'been blocked. Monoprinting creates a single unique print from a non-permanent matrix. ' +
    'Printmaking is democratic (multiple identical copies), reproducible, and historically ' +
    'central to spreading images and ideas before photography. Each method creates ' +
    'characteristic marks: woodcut\'s bold graphic quality, etching\'s fine lines, ' +
    'screen print\'s flat areas of color.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'art-painting-media',
      description: 'Both use pigment application but printmaking creates multiples from a matrix',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, 0.4),
  },
};
