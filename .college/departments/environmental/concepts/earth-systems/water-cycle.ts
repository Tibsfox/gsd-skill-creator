import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const waterCycle: RosettaConcept = {
  id: 'envr-water-cycle',
  name: 'The Water Cycle',
  domain: 'environmental',
  description: 'The water cycle (hydrological cycle) continuously moves water through the atmosphere, land surface, and groundwater systems. ' +
    'Evaporation: liquid water becomes vapor, primarily from oceans -- solar energy drives this. ' +
    'Transpiration: plants release water vapor through leaves -- combined with evaporation = evapotranspiration. ' +
    'Condensation: water vapor cools and forms clouds (liquid droplets or ice crystals). ' +
    'Precipitation: water falls as rain, snow, sleet, or hail. ' +
    'Runoff and infiltration: water flows across the surface (runoff) or percolates into soil and groundwater (infiltration). ' +
    'Groundwater: the slow-moving water in aquifers -- drinking water source for 2 billion people. ' +
    'Climate change effects: intensification of the water cycle -- more intense precipitation events, longer droughts, accelerating glacial melt. ' +
    'Freshwater scarcity: 97.5% of Earth\'s water is saltwater. Of freshwater, 69% is glacial ice.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'envr-climate-science',
      description: 'Climate change alters the water cycle -- warmer temperatures intensify evaporation and change precipitation patterns globally',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.5625 + 0.09),
    angle: Math.atan2(0.3, 0.75),
  },
};
