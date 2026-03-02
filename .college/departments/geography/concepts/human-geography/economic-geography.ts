import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const economicGeography: RosettaConcept = {
  id: 'geo-economic-geography',
  name: 'Economic Geography',
  domain: 'geography',
  description:
    'Economic geography examines how location influences economic activity. It covers resource distribution, ' +
    'agricultural land use (Von Thunen\'s model), industrial location theory, global supply chains, and ' +
    'the geography of trade. Core insight: distance, transport costs, and agglomeration economies shape ' +
    'why industries cluster in certain places and why wealth is unevenly distributed across the globe.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-culture-regions',
      description: 'Economic zones often correspond to cultural regions sharing trade languages and institutions',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};
