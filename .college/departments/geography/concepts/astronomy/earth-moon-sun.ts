import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const earthMoonSun: RosettaConcept = {
  id: 'geo-earth-moon-sun',
  name: 'Earth-Moon-Sun System',
  domain: 'geography',
  description:
    'The Earth-Moon-Sun system governs fundamental geographic rhythms. Earth\'s axial tilt (23.5°) causes seasons; ' +
    'Earth\'s rotation causes day/night; the Moon\'s gravitational pull causes tides. ' +
    'Solar and lunar eclipses result from alignment of all three. ' +
    'Understanding this system is prerequisite to understanding time zones, climate zones, and the calendar.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-climate-zones',
      description: 'Earth\'s axial tilt is the root cause of climate zone differences between equator and poles',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.5625 + 0.09),
    angle: Math.atan2(0.3, 0.75),
  },
};
