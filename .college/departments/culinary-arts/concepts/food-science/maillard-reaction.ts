import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const maillardReaction: RosettaConcept = {
  id: 'cook-maillard-reaction',
  name: 'Maillard Reaction',
  domain: 'culinary-arts',
  description: 'A non-enzymatic browning reaction between amino acids and reducing sugars that ' +
    'produces hundreds of flavor and aroma compounds. Onset begins around 140C (280F) and ' +
    'accelerates with higher temperatures. Unlike caramelization, the Maillard reaction requires ' +
    'amino acids -- this is why seared meat, toasted bread, and roasted coffee develop complex ' +
    'flavors beyond simple sugar browning. Surface moisture must evaporate first (water caps ' +
    'temperature at 100C), which is why dry surfaces brown faster. The reaction is pH-sensitive: ' +
    'alkaline conditions accelerate browning (hence baking soda on pretzels).',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'cook-caramelization',
      description: 'Both produce browning but through different chemistry -- Maillard requires amino acids while caramelization is pure sugar pyrolysis',
    },
    {
      type: 'dependency',
      targetId: 'cook-protein-denaturation',
      description: 'Proteins must denature and expose amino acids before they can participate in Maillard reactions',
    },
    {
      type: 'cross-reference',
      targetId: 'math-logarithmic-scales',
      description: 'Maillard reaction rate is pH-sensitive (logarithmic scale) and taste perception follows Weber-Fechner logarithmic law',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
