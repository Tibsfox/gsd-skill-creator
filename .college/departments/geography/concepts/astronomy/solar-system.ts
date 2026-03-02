import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const solarSystem: RosettaConcept = {
  id: 'geo-solar-system',
  name: 'Solar System',
  domain: 'geography',
  description:
    'The solar system consists of the Sun and all objects gravitationally bound to it: eight planets, ' +
    'dwarf planets, moons, asteroids, comets, and the Kuiper Belt. The inner rocky planets (Mercury, Venus, Earth, Mars) ' +
    'differ fundamentally from the outer gas giants (Jupiter, Saturn) and ice giants (Uranus, Neptune). ' +
    'Understanding solar system structure explains day/night cycles, seasons, tides, and Earth\'s unique conditions for life.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-earth-moon-sun',
      description: 'Earth-Moon-Sun relationships are the most geographically relevant subset of solar system knowledge',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};
