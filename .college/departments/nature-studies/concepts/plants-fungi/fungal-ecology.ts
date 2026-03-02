import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const fungalEcology: RosettaConcept = {
  id: 'nature-fungal-ecology',
  name: 'Fungal Ecology',
  domain: 'nature-studies',
  description:
    'Fungi are neither plant nor animal -- they are decomposers, recyclers, and symbiotic ' +
    'partners that make forest life possible. The mycelium -- the vegetative body of the fungus -- ' +
    'is a network of thread-like hyphae that can span acres; the mushroom is just the fruiting body. ' +
    'Mycorrhizal networks (the "wood wide web") connect tree roots with fungal hyphae in mutually ' +
    'beneficial exchange: the tree provides sugars; the fungus provides water and mineral access. ' +
    'Studies show trees share nutrients through mycorrhizal networks, with old "mother trees" ' +
    'supporting seedlings. Saprotrophic fungi decompose dead wood, recycling nutrients into soil. ' +
    'Parasitic fungi attack living hosts. Lichen is a symbiosis of fungus and alga/cyanobacterium. ' +
    'Fungi identification requires caution: many edible species have toxic lookalikes; ' +
    'learning identification from an experienced guide before eating any wild mushroom is essential.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nature-ecology',
      description: 'Fungal ecology is central to understanding nutrient cycling in forest ecosystems',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.16 + 0.25),
    angle: Math.atan2(0.5, 0.4),
  },
};
