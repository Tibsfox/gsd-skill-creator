import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const celestialCoordinates: RosettaConcept = {
  id: 'astro-celestial-coordinates',
  name: 'Celestial Coordinates',
  domain: 'astronomy',
  description:
    'Celestial coordinates provide a grid system for locating objects on the celestial sphere — ' +
    'the imaginary sphere surrounding Earth on which stars appear projected. The equatorial ' +
    'coordinate system is most widely used: right ascension (RA) measures eastward from the ' +
    'vernal equinox in hours, minutes, seconds (24h = 360°); declination (Dec) measures north ' +
    '(+) or south (-) of the celestial equator in degrees. Stars near Dec +90° are circumpolar ' +
    'for northern observers — never setting below the horizon. The ecliptic coordinate system ' +
    'uses ecliptic longitude and latitude, convenient for solar system objects. The galactic ' +
    'coordinate system centers on the galactic plane, useful for stellar population studies. ' +
    'Epoch matters: Earth\'s precession shifts the vernal equinox reference point over 26,000 ' +
    'years — modern catalogs use J2000.0 epoch. Star charts, planetarium software, and GoTo ' +
    'telescopes all use equatorial coordinates, making RA/Dec fluency essential for amateur ' +
    'astronomy.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'astro-constellation-navigation',
      description: 'Celestial coordinates provide the formal grid system underlying informal constellation-based sky navigation',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
