import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const clothingCare: RosettaConcept = {
  id: 'domestic-clothing-care',
  name: 'Clothing Care',
  domain: 'home-economics',
  description:
    'Clothing care knowledge extends garment life and reduces textile waste. ' +
    'Care label symbols: washing tub (machine wash), hand with water (hand wash), ' +
    'circle (dry clean), square (dry flat or hang dry), iron (iron), triangle (bleach). ' +
    'Sorting laundry: darks separate (prevent dye transfer), lights separate, delicates on gentle. ' +
    'Cold water washing preserves color and reduces energy use (90% of washing machine energy is heating water). ' +
    'Stain treatment before washing: oil-based stains need dish soap; protein stains (blood, grass) ' +
    'need cold water (hot sets them); coffee and wine need immediate blotting and cold water rinse. ' +
    'Basic mending: running stitch for seams (stitch length matches garment weight), ' +
    'whip stitch for edges, darning for holes in knitted fabric. Sewing on a button: ' +
    'use thread doubled, create thread shank for button to seat properly. ' +
    'Sustainable fashion: cost-per-wear = purchase price / number of wears; $200 shoes worn 200x = $1/wear.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'domestic-home-management',
      description: 'Clothing care is home management applied to the wardrobe -- systems and routines',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.36 + 0.09),
    angle: Math.atan2(0.3, 0.6),
  },
};
