import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const metabolismEnergy: RosettaConcept = {
  id: 'nutr-metabolism-energy',
  name: 'Metabolism and Energy Balance',
  domain: 'nutrition',
  description: 'Metabolism encompasses all biochemical reactions that convert food into energy and build body tissues. ' +
    'Basal metabolic rate (BMR): energy required at rest to maintain vital functions -- accounts for ~60-70% of total daily energy expenditure. ' +
    'Thermic effect of food (TEF): energy cost of digesting and absorbing food -- ~10% of calories. Protein has highest TEF (~25-30% of its calories). ' +
    'Total daily energy expenditure (TDEE): BMR + physical activity + TEF. ' +
    'ATP: the energy currency of cells. All metabolic pathways ultimately produce ATP. Cells cannot store large amounts -- must continuously produce it. ' +
    'Glycolysis: breakdown of glucose to pyruvate -- produces 2 ATP rapidly (anaerobic) or feeds the Krebs cycle. ' +
    'Krebs cycle (TCA cycle) + oxidative phosphorylation: fully oxidizes glucose to CO₂ and water, producing ~32 ATP. ' +
    'Fat oxidation (beta-oxidation): fatty acids are broken into acetyl-CoA, entering Krebs cycle -- fat yields more ATP per gram (9 kcal) than glucose (4 kcal). ' +
    'Metabolic flexibility: the ability to efficiently switch between burning carbohydrates and fat -- associated with good metabolic health.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nutr-macronutrients',
      description: 'Metabolism processes macronutrients -- the biochemical pathways operate specifically on carbohydrates, fats, and proteins',
    },
    {
      type: 'cross-reference',
      targetId: 'envr-carbon-cycle',
      description: 'Metabolism is cellular respiration -- the carbon you inhale as CO₂ is the same carbon that cycled through the biosphere into your food',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};
