import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const culturalArtTraditions: RosettaConcept = {
  id: 'art-cultural-traditions',
  name: 'Cultural Art Traditions',
  domain: 'art',
  description:
    'Art traditions outside the European canon are equally sophisticated and historically ' +
    'rich. West African sculpture (Benin bronzes, Yoruba tradition) influenced Picasso and ' +
    'Modernism. Chinese landscape painting (shan shui) uses negative space, atmospheric ' +
    'perspective, and calligraphic brushwork to suggest infinite depth on a scroll. ' +
    'Islamic geometric art developed complex non-figurative patterns as spiritual and ' +
    'mathematical expression; arabesque designs tile infinite planes. Indigenous art ' +
    'traditions (Aboriginal Australian, Pacific Northwest, Andean) encode cultural ' +
    'knowledge, cosmology, and ceremony. Pre-Columbian Mesoamerican art (Maya, Aztec) ' +
    'created monumental architectural sculpture with calendrical and cosmological meaning. ' +
    'Understanding these traditions requires engaging with the cultural context, not ' +
    'extracting aesthetic elements without meaning.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'art-art-movements',
      description: 'Western art movements were often influenced by and in dialogue with other cultural traditions',
    },
  ],
  complexPlanePosition: {
    real: 0.2,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.04 + 0.25),
    angle: Math.atan2(0.5, 0.2),
  },
};
