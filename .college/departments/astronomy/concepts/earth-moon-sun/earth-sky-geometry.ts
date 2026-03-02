import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const earthSkyGeometry: RosettaConcept = {
  id: 'astro-earth-sky-geometry',
  name: 'Earth-Sky Geometry',
  domain: 'astronomy',
  description:
    'The apparent motions of the sky result from real motions of the Earth. ' +
    'Earth\'s rotation (24 hours) causes the daily east-to-west apparent motion of the Sun, ' +
    'Moon, and stars. Earth\'s revolution around the Sun (365.25 days) causes the seasonal ' +
    'change in which constellations are visible at night (as Earth faces different directions). ' +
    'The celestial sphere model: imagine all stars painted on the inside of a giant sphere ' +
    'centered on Earth; the celestial equator is the projection of Earth\'s equator; ' +
    'the celestial poles are directly above Earth\'s poles (Polaris is 0.7 degrees from the north celestial pole). ' +
    'Seasons are caused by Earth\'s axial tilt (23.5 degrees) -- NOT by distance from the Sun. ' +
    'In northern hemisphere summer, the Sun is higher in the sky (more direct rays, longer days); ' +
    'in winter, lower (more oblique rays, shorter days). Earth is actually closest to the Sun in January.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'phys-newtons-laws',
      description: 'Newton\'s law of gravitation governs orbital mechanics underlying Earth\'s revolution',
    },
    {
      type: 'dependency',
      targetId: 'astro-moon-phases',
      description: 'Moon phases result from the geometry of the Earth-Moon-Sun system',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.36 + 0.09),
    angle: Math.atan2(0.3, 0.6),
  },
};
