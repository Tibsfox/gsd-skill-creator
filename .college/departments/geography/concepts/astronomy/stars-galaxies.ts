import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const starsGalaxies: RosettaConcept = {
  id: 'geo-stars-galaxies',
  name: 'Stars, Galaxies & the Universe',
  domain: 'geography',
  description:
    'Stars are self-luminous plasma spheres powered by nuclear fusion. The Sun is a typical medium-sized star. ' +
    'Stars form in nebulae, evolve through a life cycle based on mass, and end as white dwarfs, neutron stars, or black holes. ' +
    'Galaxies are gravitationally bound star systems; the Milky Way contains ~100–400 billion stars. ' +
    'The observable universe contains ~2 trillion galaxies, expanding since the Big Bang ~13.8 billion years ago.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-solar-system',
      description: 'The solar system is one planetary system around one star (the Sun) within the Milky Way galaxy',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};
