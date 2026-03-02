import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const operationsMeaning: RosettaConcept = {
  id: 'math-operations-meaning',
  name: 'Operations & Their Meaning',
  domain: 'math',
  description:
    'The four arithmetic operations each have a specific meaning tied to actions on quantities. ' +
    'Addition combines groups; subtraction separates or compares; multiplication scales a quantity by ' +
    'equal groups; division distributes into equal shares or measures how many groups fit. ' +
    'Understanding operation meaning (not just procedures) enables flexible problem-solving and prevents ' +
    'errors from applying the wrong operation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-number-cardinality',
      description: 'Understanding operations requires a solid foundation in what numbers represent',
    },
    {
      type: 'dependency',
      targetId: 'math-place-value',
      description: 'Multi-digit operations depend on understanding place value structure',
    },
  ],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.7225 + 0.04),
    angle: Math.atan2(0.2, 0.85),
  },
};
