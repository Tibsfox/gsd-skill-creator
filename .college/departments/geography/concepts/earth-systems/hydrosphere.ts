import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const hydrosphere: RosettaConcept = {
  id: 'geo-hydrosphere',
  name: 'Hydrosphere & Water Cycle',
  domain: 'geography',
  description:
    'The hydrosphere encompasses all water on Earth — oceans, lakes, rivers, glaciers, groundwater, ' +
    'and atmospheric water vapor. The water cycle describes continuous movement via evaporation, condensation, ' +
    'precipitation, runoff, and infiltration. Oceans regulate climate through heat absorption and circulation; ' +
    'glaciers store fresh water; groundwater sustains agriculture and human settlement.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-climate-zones',
      description: 'Ocean circulation patterns are a primary driver of regional climate zones',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};
