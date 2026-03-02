import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const constellationNavigation: RosettaConcept = {
  id: 'astro-constellation-navigation',
  name: 'Constellation Navigation',
  domain: 'astronomy',
  description:
    'Constellations are patterns of stars as seen from Earth -- not physical groups, ' +
    'as the stars are at vastly different distances. The IAU recognizes 88 official constellations ' +
    'covering the entire sky. Navigation starts with bright, easily-found anchor constellations: ' +
    'Ursa Major (the Big Dipper) is circumpolar from mid-northern latitudes -- always visible, ' +
    'never sets. The Big Dipper\'s pointer stars (Merak, Dubhe) point to Polaris (North Star), ' +
    '< 1 degree from the north celestial pole -- the key to celestial navigation. ' +
    'From Polaris, systematic sky navigation extends outward: Cassiopeia (W-shape opposite the Dipper), ' +
    'Leo (sickle shape, spring), Scorpius (summer, southerly), Orion (winter, with Rigel, Betelgeuse, Orion Nebula). ' +
    'The ecliptic (apparent path of the Sun through the sky) passes through the zodiacal constellations; ' +
    'planets stay near the ecliptic and can be distinguished from stars by their non-twinkling light.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'astro-earth-sky-geometry',
      description: 'Constellation navigation requires understanding how Earth\'s rotation causes the sky to appear to rotate',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.25 + 0.01),
    angle: Math.atan2(0.1, 0.5),
  },
};
