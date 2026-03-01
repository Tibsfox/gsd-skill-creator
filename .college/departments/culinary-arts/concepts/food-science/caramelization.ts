import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const caramelization: RosettaConcept = {
  id: 'cook-caramelization',
  name: 'Caramelization',
  domain: 'culinary-arts',
  description: 'The pyrolysis (thermal decomposition) of sugars without amino acids, producing ' +
    'brown color, nutty flavors, and aromatic compounds. Each sugar caramelizes at a different ' +
    'temperature: fructose at 110C (230F), glucose at 150C (302F), sucrose at 160C (320F). ' +
    'Unlike the Maillard reaction, caramelization is purely sugar chemistry -- no proteins ' +
    'involved. Controlled caramelization produces desirable flavors (creme brulee, caramel ' +
    'sauce); excessive caramelization leads to bitter, burnt flavors. Water content and pH ' +
    'affect the rate: acidic conditions slow caramelization, alkaline conditions accelerate it.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'cook-maillard-reaction',
      description: 'Both produce browning but through different mechanisms -- caramelization is pure sugar pyrolysis without amino acids',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.36 + 0.04),
    angle: Math.atan2(0.2, 0.6),
  },
};
