import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const fermentation: RosettaConcept = {
  id: 'cook-fermentation',
  name: 'Fermentation',
  domain: 'culinary-arts',
  description: 'Anaerobic metabolism by microorganisms (yeast, bacteria) that converts sugars ' +
    'into acids, gases, or alcohol. In cooking, yeast (Saccharomyces cerevisiae) is active at ' +
    '35-46C (95-115F) and dies above 60C (140F). Yeast fermentation produces CO2 for leavening ' +
    '(bread rises) and ethanol for flavor complexity. Bacterial fermentation produces lactic ' +
    'acid (yogurt, sauerkraut, kimchi) or acetic acid (vinegar). Fermentation byproducts ' +
    'participate in Maillard reactions during baking, creating the complex crust flavors of ' +
    'long-fermented breads. Controlled fermentation also improves mineral bioavailability by ' +
    'breaking down phytates in grains.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cook-maillard-reaction',
      description: 'Fermentation byproducts (amino acids, reducing sugars) participate in Maillard reactions during baking',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-protein-denaturation',
      description: 'Acid from fermentation denatures proteins without heat, as in yogurt and cheese making',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.16 + 0.25),
    angle: Math.atan2(0.5, 0.4),
  },
};
