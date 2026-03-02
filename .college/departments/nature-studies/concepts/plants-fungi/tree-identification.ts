import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const treeIdentification: RosettaConcept = {
  id: 'nature-tree-identification',
  name: 'Tree Identification',
  domain: 'nature-studies',
  description:
    'Tree identification uses a hierarchy of observable features: leaf shape and arrangement, ' +
    'bark texture and color, twig characteristics, fruit and seed type, overall form. ' +
    'Leaf arrangement: opposite (maple, ash, dogwood -- MAD) versus alternate (most other trees). ' +
    'Leaf type: simple (one blade) versus compound (multiple leaflets on a stem). ' +
    'Bark develops characteristic patterns with age: smooth (beech), plated (ponderosa pine), ' +
    'ridged and furrowed (oak), papery (birch), shaggy (shagbark hickory). ' +
    'Winter identification without leaves requires reading buds (large opposite buds = ash), ' +
    'persistent fruit (sweetgum spiky balls), and bark. Dichotomous keys are binary decision ' +
    'trees that systematically narrow identification by answering yes/no questions about ' +
    'observable features. The goal is confident regional identification of 20-30 common ' +
    'local species before branching to rare or exotic trees.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'sci-living-systems',
      description: 'Tree identification connects to plant biology and the science of living systems',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.36 + 0.09),
    angle: Math.atan2(0.3, 0.6),
  },
};
