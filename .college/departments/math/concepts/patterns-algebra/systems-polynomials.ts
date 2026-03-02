import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const systemsPolynomials: RosettaConcept = {
  id: 'math-systems-polynomials',
  name: 'Systems of Equations & Polynomials',
  domain: 'math',
  description:
    'Systems of equations involve finding values that satisfy multiple equations simultaneously -- ' +
    'solved by substitution, elimination, or graphically. Polynomials are expressions with multiple ' +
    'terms involving powers of variables. Polynomial operations (adding, multiplying, factoring) and ' +
    'solving polynomial equations are central to advanced algebra and preparation for calculus.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-equations-expressions',
      description: 'Systems and polynomials extend single-equation algebra to more complex structures',
    },
    {
      type: 'cross-reference',
      targetId: 'math-trigonometry',
      description: 'Trigonometric functions are a specialized polynomial-like family in higher mathematics',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.09 + 0.64),
    angle: Math.atan2(0.8, 0.3),
  },
};
