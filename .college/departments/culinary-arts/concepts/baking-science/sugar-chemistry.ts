import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const sugarChemistry: RosettaConcept = {
  id: 'cook-sugar-chemistry',
  name: 'Sugar Chemistry',
  domain: 'culinary-arts',
  description: 'Sugar serves roles beyond sweetness in baking. Hygroscopy: sugar attracts and ' +
    'retains moisture, keeping baked goods soft for days. Crystallization: fudge requires controlled ' +
    'crystal formation (small crystals = smooth), while caramel requires preventing crystals ' +
    '(inversion). Inversion: sucrose splits into glucose and fructose under heat or acid, ' +
    'preventing crystallization (honey is naturally inverted). In cookies: more sugar means more ' +
    'spread because sugar liquefies during baking before the structure sets. Brown sugar (contains ' +
    'molasses, acidic) promotes chewiness through hygroscopy and acid-gluten interaction. White ' +
    'sugar promotes crispness through faster moisture evaporation. Sugar type and amount directly ' +
    'determine whether cookies spread flat or hold their shape.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cook-caramelization',
      description: 'Sugar chemistry at high temperatures IS caramelization -- sugar decomposes into flavor and color compounds',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-bakers-ratios',
      description: 'Sugar ratio relative to flour determines spread, texture, and moisture retention in baked goods',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.25 + 0.09),
    angle: Math.atan2(0.3, 0.5),
  },
};
