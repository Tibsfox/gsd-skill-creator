import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const wholeFoodsProcessing: RosettaConcept = {
  id: 'nutr-whole-foods-processing',
  name: 'Whole Foods and Food Processing',
  domain: 'nutrition',
  description: 'The degree of food processing strongly predicts health outcomes independent of nutrient composition. ' +
    'NOVA classification: Group 1 (unprocessed/minimally processed), Group 2 (culinary ingredients), Group 3 (processed foods), Group 4 (ultra-processed foods -- UPF). ' +
    'Ultra-processed foods: manufactured from industrial ingredients with little or no whole food content -- designed for hyperpalatability. ' +
    'Epidemiology: UPF consumption is associated with obesity, type 2 diabetes, cardiovascular disease, depression, and all-cause mortality. ' +
    'Food matrix: the physical structure of food affects nutrient availability and metabolic response. Eating almonds vs. almond oil has different metabolic effects. ' +
    'Hyperpalatability: engineered combinations of fat, sugar, and salt that override satiety signals -- designed to maximize consumption. ' +
    'Food additives: emulsifiers, preservatives, artificial colors/flavors -- some evidence of gut microbiome disruption from certain additives. ' +
    'Minimally processed: retains original food structure -- nutrients more bioavailable, better satiety, less impact on blood glucose. ' +
    'Practical guidance: cook from whole ingredients more often -- this single change shifts diet dramatically toward Group 1.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nutr-macronutrients',
      description: 'Processing changes how macronutrients are absorbed -- refined carbohydrates raise blood glucose faster than whole grain equivalents',
    },
    {
      type: 'cross-reference',
      targetId: 'nutr-gut-microbiome',
      description: 'UPF consumption reduces microbiome diversity -- certain additives and the lack of fiber in UPFs disrupt the gut ecosystem',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};
