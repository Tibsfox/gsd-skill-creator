import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const climateZones: RosettaConcept = {
  id: 'geo-climate-zones',
  name: 'Climate Zones',
  domain: 'geography',
  description:
    'Climate zones are broad regions characterized by similar long-term temperature and precipitation patterns. ' +
    'The Koppen classification system identifies five major zones: tropical, dry, temperate, continental, and polar. ' +
    'Climate zones are primarily determined by latitude, but modified by altitude, ocean currents, and continentality. ' +
    'They determine what crops grow, what buildings look like, and how people dress and behave.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-earth-moon-sun',
      description: 'Earth\'s axial tilt creates unequal solar heating that is the primary driver of climate zones',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
