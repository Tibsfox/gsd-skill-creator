import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const fractionsRatios: RosettaConcept = {
  id: 'math-fractions-ratios',
  name: 'Fractions, Decimals & Ratios',
  domain: 'math',
  description:
    'Fractions represent parts of a whole or quotients of division; decimals are the base-10 notation ' +
    'for the same values; ratios compare two quantities multiplicatively. These are not separate topics ' +
    'but interconnected representations of the same relationships. Proportional reasoning -- understanding ' +
    'how ratios scale -- is a critical gateway to algebra, geometry, and statistics.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-place-value',
      description: 'Decimal notation extends place value below the ones position',
    },
    {
      type: 'analogy',
      targetId: 'math-data-representation',
      description: 'Ratios and percentages are the language of data comparison and statistical displays',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};
