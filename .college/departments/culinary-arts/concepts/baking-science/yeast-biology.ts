import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const yeastBiology: RosettaConcept = {
  id: 'cook-yeast-biology',
  name: 'Yeast Biology',
  domain: 'culinary-arts',
  description: 'Saccharomyces cerevisiae (baker\'s yeast) is a single-celled fungus that feeds on ' +
    'sugars and produces CO2 (leavening) and ethanol (flavor). Active temperature range: 35-46C ' +
    '(95-115F). Below 35C yeast activity is sluggish; above 60C (140F) yeast cells die. Proofing ' +
    'tests viability: dissolve yeast in warm liquid with sugar, bubbling within 5-10 minutes ' +
    'confirms active yeast. Bulk fermentation (first rise) develops flavor complexity through ' +
    'slow enzymatic activity. Over-proofing stretches the gluten network beyond its capacity, ' +
    'causing bread to collapse. Cold retardation in the refrigerator (4C) slows yeast activity ' +
    'for overnight development, producing deeper flavor without over-proofing.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cook-fermentation',
      description: 'Yeast biology IS the mechanism of fermentation -- yeast is the fermenting organism in bread',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-gluten-development',
      description: 'Yeast CO2 inflates the gluten network -- strong gluten traps gas for a good rise',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-temperature-danger-zone',
      description: 'Dough containing eggs or dairy must not proof in the danger zone (40-140F) for more than 2 hours',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
