import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const naturalDisasters: RosettaConcept = {
  id: 'geo-natural-disasters',
  name: 'Natural Disasters & Hazards',
  domain: 'geography',
  description:
    'Natural disasters are extreme physical events causing significant damage and disruption. ' +
    'Geologic hazards (earthquakes, tsunamis, volcanic eruptions) arise from tectonic activity. ' +
    'Atmospheric hazards (hurricanes, tornadoes, droughts, floods) arise from weather systems. ' +
    'Vulnerability to natural disasters is as much a human geography issue as a physical one — ' +
    'poverty, land-use decisions, and governance determine whether a natural event becomes a catastrophe.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-lithosphere',
      description: 'Earthquake and volcanic hazard zones map directly onto tectonic plate boundaries',
    },
    {
      type: 'dependency',
      targetId: 'geo-weather-systems',
      description: 'Hurricane, tornado, and flood hazards arise from specific atmospheric conditions',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};
