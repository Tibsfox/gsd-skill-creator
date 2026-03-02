import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const climateImpacts: RosettaConcept = {
  id: 'envr-climate-impacts',
  name: 'Climate Change Impacts',
  domain: 'environmental',
  description: 'Climate change affects every region and every sector of human society and natural systems. ' +
    'Extreme weather: heat waves are becoming more frequent, intense, and longer. Rainfall events more intense. Hurricanes stronger. ' +
    'Food security: changing precipitation patterns, heat stress, and shifting seasons threaten crop yields -- staple crops (wheat, maize, rice) are vulnerable. ' +
    'Sea level rise: 100+ million people live within 1 meter of current sea level -- coastal cities and island nations at risk. ' +
    'Ecosystem disruption: range shifts, mismatched phenology (flowers blooming before pollinators emerge), coral bleaching. ' +
    'Human health: heat-related illness, expanded range of vector-borne diseases (malaria, dengue), air quality degradation. ' +
    'Conflict and migration: resource scarcity and unlivable conditions are climate change multipliers for social instability. ' +
    'Differential impacts: the poorest and most vulnerable populations bear the heaviest impacts despite contributing the least to emissions. ' +
    'Irreversibility: some changes (species extinction, sea level rise) are permanent on human timescales.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'envr-climate-change-evidence',
      description: 'Impacts are the downstream consequences of the warming established by climate evidence -- they follow from the physical changes',
    },
    {
      type: 'cross-reference',
      targetId: 'nutr-food-sources-systems',
      description: 'Food systems are both a driver and a major casualty of climate change -- changing climate disrupts agriculture globally',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.2025 + 0.49),
    angle: Math.atan2(0.7, 0.45),
  },
};
