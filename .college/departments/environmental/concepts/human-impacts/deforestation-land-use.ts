import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const deforestationLandUse: RosettaConcept = {
  id: 'envr-deforestation-land-use',
  name: 'Deforestation and Land Use Change',
  domain: 'environmental',
  description: 'Land use change is the largest driver of biodiversity loss and a major contributor to climate change. ' +
    'Deforestation rate: approximately 10 million hectares of forest lost annually -- primarily tropical forests (Amazon, Congo, Southeast Asia). ' +
    'Drivers: agriculture (soy, palm oil, cattle), logging, mining, infrastructure development. ' +
    'Amazon tipping point: scientists estimate if 20-25% of the Amazon is deforested, reduced evapotranspiration triggers dieback of the remainder. ' +
    'Carbon release: forests are carbon sinks. Deforestation releases stored carbon -- accounts for ~10% of annual CO₂ emissions. ' +
    'Soil degradation: deforestation exposes soil to erosion, compaction, and nutrient loss. ' +
    'Land use efficiency: meat production requires 10-20× more land per calorie than plant-based foods -- diet is a major land use lever. ' +
    'REDD+: UN program paying developing countries to reduce emissions from deforestation -- incentivizing conservation through carbon markets.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'envr-biodiversity-loss',
      description: 'Habitat destruction from deforestation is the leading cause of biodiversity loss -- land use change drives species extinction',
    },
    {
      type: 'cross-reference',
      targetId: 'nutr-food-sources-systems',
      description: 'Food systems are the primary driver of deforestation -- what we eat determines how much land is converted from forest to agriculture',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
