import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const equationsExpressions: RosettaConcept = {
  id: 'math-equations-expressions',
  name: 'Equations & Expressions',
  domain: 'math',
  description:
    'An expression is a mathematical phrase (like 3x + 5); an equation is a statement that two ' +
    'expressions are equal (3x + 5 = 14). Solving equations means finding the value(s) that make ' +
    'the statement true. The concept of equality as balance (not just "the answer is on the right") ' +
    'is crucial. Properties of equality justify the steps used to solve.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-variables-unknowns',
      description: 'Equations and expressions use variables to represent quantities',
    },
    {
      type: 'dependency',
      targetId: 'math-functions',
      description: 'Functions are relationships between variables expressed through equations',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.25 + 0.3025),
    angle: Math.atan2(0.55, 0.5),
  },
};
