import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const bakersRatios: RosettaConcept = {
  id: 'cook-bakers-ratios',
  name: 'Baker\'s Ratios',
  domain: 'culinary-arts',
  description: 'Baker\'s percentages express all ingredient weights as a percentage of flour ' +
    'weight, which is always 100%. This makes recipes scalable: a standard cookie ratio is 100% ' +
    'flour, 66% butter, 50% sugar, 25% eggs. Too much butter (above 70% of flour weight) causes ' +
    'excessive spread -- cookies come out flat because the fat melts and spreads before the ' +
    'structure sets. Too little flour means insufficient structure to hold shape. Hydration ' +
    'percentage (water or liquid as % of flour) determines dough consistency: bread dough at ' +
    '65-80% hydration, pizza dough at 60-70%, cookie dough at 30-40%. Understanding ratios ' +
    'transforms recipe-following into recipe-designing.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cook-gluten-development',
      description: 'Flour ratio determines the gluten potential -- more flour means more protein available for gluten network',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-sugar-chemistry',
      description: 'Sugar ratio relative to flour affects spread, moisture retention, and texture in baked goods',
    },
    {
      type: 'cross-reference',
      targetId: 'math-ratios',
      description: 'Baker\'s percentages are a direct application of ratios and proportions from mathematics',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.49 + 0.01),
    angle: Math.atan2(0.1, 0.7),
  },
};
