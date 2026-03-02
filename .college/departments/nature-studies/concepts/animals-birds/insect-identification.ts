import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const insectIdentification: RosettaConcept = {
  id: 'nature-insect-identification',
  name: 'Insect Identification',
  domain: 'nature-studies',
  description:
    'Insects comprise over a million described species and are ecologically indispensable as ' +
    'pollinators, decomposers, and food sources. Key identification features: body plan (head, ' +
    'thorax, abdomen), six legs, and typically two pairs of wings. Major orders include Coleoptera ' +
    '(beetles — hardened forewings), Lepidoptera (butterflies and moths — scaled wings), Diptera ' +
    '(flies and mosquitoes — single wing pair, halters), Hymenoptera (bees, wasps, ants — ' +
    'pinched waist), and Orthoptera (grasshoppers, crickets — powerful hindlegs). Field identification ' +
    'uses body shape, wing venation, antennae type (filiform, clubbed, pectinate), and habitat. ' +
    'Seasonal timing matters: adult emergence windows help narrow possibilities. Citizen science ' +
    'platforms like iNaturalist allow photo-based identification with AI assistance and expert review.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nature-bird-identification',
      description: 'Insect and bird identification share systematic field skills: observation, key features, and reference guides',
    },
    {
      type: 'dependency',
      targetId: 'nature-ecology',
      description: 'Insect identification supports ecological understanding of pollination, food webs, and decomposition',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
