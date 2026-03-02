import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const latitudeLongitude: RosettaConcept = {
  id: 'geo-latitude-longitude',
  name: 'Latitude, Longitude & Coordinate Systems',
  domain: 'geography',
  description:
    'Latitude measures angular distance north or south of the equator (0° to 90°); longitude measures ' +
    'angular distance east or west of the prime meridian (0° to 180°). Together they form a global grid ' +
    'enabling precise location identification. Time zones are defined by longitude (every 15° = 1 hour). ' +
    'This coordinate system underlies GPS, GIS, and all modern navigation technology.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.9,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.81 + 0.01),
    angle: Math.atan2(0.1, 0.9),
  },
};
