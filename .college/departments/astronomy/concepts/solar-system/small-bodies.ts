import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const smallBodies: RosettaConcept = {
  id: 'astro-small-bodies',
  name: 'Small Bodies',
  domain: 'astronomy',
  description:
    'Small solar system bodies — asteroids, comets, meteoroids, and trans-Neptunian objects — ' +
    'are remnants of solar system formation providing clues to its early conditions. Asteroid ' +
    'belt (between Mars and Jupiter): mostly rocky and metallic bodies; Ceres (dwarf planet, ' +
    '940 km diameter) is the largest. Near-Earth asteroids (NEAs) pose impact hazard — Spaceguard ' +
    'and planetary defense programs catalog and track them. Comets: icy bodies from the Oort Cloud ' +
    'or Kuiper Belt that develop coma and ion/dust tails when solar heating vaporizes volatile ices. ' +
    'Halley\'s Comet (76-year period) is the most famous periodic comet. Meteoroids are small ' +
    'particles; meteors are the visible streaks when they ablate in the atmosphere; meteorites ' +
    'reach the surface. Meteorite types: chondrites (undifferentiated primitive material including ' +
    'carbonaceous chondrites with organic compounds), achondrites (from differentiated bodies), ' +
    'iron (metallic cores of disrupted planetesimals). The Kuiper Belt (30-50 AU) contains Pluto, ' +
    'Eris, and thousands of icy objects.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'astro-planetary-geology',
      description: 'Small body composition provides unaltered sample material for understanding the planetary formation processes also visible in planetary geology',
    },
    {
      type: 'dependency',
      targetId: 'astro-orbital-mechanics',
      description: 'Orbital dynamics govern small body trajectories, resonances, and impact probabilities',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.3025 + 0.2025),
    angle: Math.atan2(0.45, 0.55),
  },
};
