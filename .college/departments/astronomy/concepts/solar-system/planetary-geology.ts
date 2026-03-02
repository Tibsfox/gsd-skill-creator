import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const planetaryGeology: RosettaConcept = {
  id: 'astro-planetary-geology',
  name: 'Planetary Geology',
  domain: 'astronomy',
  description:
    'Planetary geology applies geological methods to understanding the surface and interior ' +
    'processes of planets, moons, and smaller bodies. Terrestrial planet surfaces record their ' +
    'history: cratering rates provide age estimates (heavily cratered = old, sparse craters = ' +
    'resurfaced); volcanic features (shield volcanoes like Olympus Mons — 22 km height, ' +
    'caldera, lava flows) indicate internal heat; tectonic features (Valles Marineris — canyon ' +
    'system 4,000 km long, 7 km deep). Gas giant interiors are differentiated: hydrogen-helium ' +
    'envelope, metallic hydrogen layer generating magnetic fields, possible rocky core. Planetary ' +
    'differentiation: heavy elements sink to form metallic core during accretion melting — ' +
    'Earth\'s iron-nickel core, Mars\'s smaller core explains weaker magnetic field. Moons show ' +
    'diverse geology: Europa\'s ice shell over liquid water ocean (tidal heating); Io\'s active ' +
    'volcanism (tidal flexing from Jupiter); Titan\'s hydrocarbon lakes and rain cycle.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'astro-orbital-mechanics',
      description: 'Orbital dynamics (tidal forces, resonances) drive geological processes like volcanism on Io and ocean heating on Europa',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};
