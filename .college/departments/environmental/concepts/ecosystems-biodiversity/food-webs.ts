import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const foodWebs: RosettaConcept = {
  id: 'envr-food-webs',
  name: 'Food Webs and Trophic Dynamics',
  domain: 'environmental',
  description: 'Food webs map who eats whom -- the network of feeding relationships that determine energy flow in an ecosystem. ' +
    'Food chain: a single linear sequence (grass → rabbit → fox → apex predator). ' +
    'Food web: the complete network of overlapping food chains -- more realistic than linear chains. ' +
    'Trophic levels: producers (level 1), primary consumers (level 2), secondary consumers (level 3), etc. ' +
    '10% rule: only ~10% of energy passes between trophic levels -- why large predators are rare and ecosystems support fewer carnivores than herbivores. ' +
    'Biomass pyramid: decreasing biomass at each higher level reflects energy loss. ' +
    'Top-down control (trophic cascades): predators controlling prey populations can have cascading effects down the food web. ' +
    'Bottom-up control: primary productivity determines the entire web\'s energy budget. ' +
    'Omnivores and detritivores: most animals eat multiple trophic levels; decomposers close the nutrient cycle.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'envr-ecosystem-structure',
      description: 'Food webs are the feeding relationship dimension of ecosystem structure -- they map the biotic interactions',
    },
    {
      type: 'cross-reference',
      targetId: 'nutr-nutrients-functions',
      description: 'Nutrients flow through food webs -- what animals eat determines what nutrients they obtain, connecting ecology to nutrition',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};
