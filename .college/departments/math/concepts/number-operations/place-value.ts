import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const placeValue: RosettaConcept = {
  id: 'math-place-value',
  name: 'Place Value',
  domain: 'math',
  description:
    'The value of a digit depends on its position within a number. Each position represents a power of ten, ' +
    'creating a consistent structure that extends infinitely in both directions (ones, tens, hundreds... and ' +
    'tenths, hundredths...). Place value understanding enables efficient multi-digit computation, mental math ' +
    'strategies, and the connection between whole numbers and decimals.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-number-cardinality',
      description: 'Place value extends the number system built on cardinality and counting',
    },
    {
      type: 'analogy',
      targetId: 'math-fractions-ratios',
      description: 'Decimal place value is the base-10 expression of fractions with denominators that are powers of 10',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.5625 + 0.0625),
    angle: Math.atan2(0.25, 0.75),
  },
};
