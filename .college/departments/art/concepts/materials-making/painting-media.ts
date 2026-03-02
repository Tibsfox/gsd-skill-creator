import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const paintingMedia: RosettaConcept = {
  id: 'art-painting-media',
  name: 'Painting Media',
  domain: 'art',
  description:
    'Painting media differ in their binder (what holds the pigment) and working properties. ' +
    'Watercolor uses water as solvent; pigment suspended in gum arabic binder; transparent ' +
    'layers (glazes) build up color; corrections are difficult once dry. Acrylic uses ' +
    'water-soluble synthetic polymer binder; dries quickly; can be used transparently or ' +
    'opaquely; flexible when dry. Oil paint uses linseed or other oils as binder; slow ' +
    'drying allows extended blending; fat over lean rule: each successive layer must have ' +
    'more oil to prevent cracking. Gouache is opaque watercolor; useful for illustration ' +
    'and graphic work. The choice of medium determines the character of the finished work: ' +
    'luminous and flowing (watercolor), bold and buildable (acrylic), rich and blendable (oil).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'art-color-mixing',
      description: 'Painting requires color mixing knowledge specific to each medium',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.09 + 0.49),
    angle: Math.atan2(0.7, 0.3),
  },
};
