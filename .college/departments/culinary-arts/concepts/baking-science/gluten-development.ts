import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const glutenDevelopment: RosettaConcept = {
  id: 'cook-gluten-development',
  name: 'Gluten Development',
  domain: 'culinary-arts',
  description: 'Glutenin and gliadin proteins in wheat flour combine with water and mechanical ' +
    'action to form a gluten network -- an elastic, extensible matrix that traps gas and gives ' +
    'baked goods structure. Kneading aligns and strengthens gluten strands (bread needs 8-10 ' +
    'minutes of kneading). Hydration is essential: no water means no gluten. Over-mixing in ' +
    'cookies and cakes develops too much gluten, producing a tough, flat result instead of tender ' +
    'crumb. Resting dough (autolyse) allows gluten to relax, making it easier to shape. Fat coats ' +
    'flour particles and inhibits gluten formation -- this is why cold butter matters in pastry ' +
    '(flaky layers) and why chill time reduces cookie spread: cold fat solidifies, gluten relaxes, ' +
    'and the dough holds its shape in the oven.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'cook-protein-denaturation',
      description: 'Both involve protein structural changes -- gluten forms networks while denaturation unfolds proteins',
    },
    {
      type: 'dependency',
      targetId: 'cook-bakers-ratios',
      description: 'Flour-to-liquid ratio directly determines gluten development potential',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.25 + 0.16),
    angle: Math.atan2(0.4, 0.5),
  },
};
