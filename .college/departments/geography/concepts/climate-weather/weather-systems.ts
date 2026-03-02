import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const weatherSystems: RosettaConcept = {
  id: 'geo-weather-systems',
  name: 'Weather Systems',
  domain: 'geography',
  description:
    'Weather is the short-term state of the atmosphere in a specific place. Weather systems — fronts, high- and low-pressure systems, ' +
    'jet streams, and air masses — determine day-to-day conditions. Severe weather events (hurricanes, tornadoes, blizzards) ' +
    'form under specific conditions of temperature, moisture, and pressure. ' +
    'Meteorology uses satellites, weather stations, and models to forecast these dynamic systems.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-climate-zones',
      description: 'Climate zones define the typical weather envelope within which specific systems develop',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};
