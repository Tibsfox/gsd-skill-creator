import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const functions: RosettaConcept = {
  id: 'math-functions',
  name: 'Functions & Functional Relationships',
  domain: 'math',
  description:
    'A function is a rule that assigns exactly one output to each input. Functions can be represented ' +
    'as tables, graphs, equations, or verbal descriptions -- and fluency means moving between all forms. ' +
    'Key function families include linear (constant rate of change), quadratic, exponential, and ' +
    'trigonometric. Understanding rate of change connects functions to both algebra and calculus.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-equations-expressions',
      description: 'Functions are typically expressed as equations and require equation-solving to analyze',
    },
    {
      type: 'analogy',
      targetId: 'math-coordinate-geometry',
      description: 'Functions are visualized on the coordinate plane as graphs',
    },
    {
      type: 'cross-reference',
      targetId: 'math-euler-formula',
      description: "Euler's formula e^(i*pi)+1=0 is the complex function that unifies the mathematics department's core concepts; the math (MATH-101) department's functions wing provides the functional reasoning foundation",
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.16 + 0.4225),
    angle: Math.atan2(0.65, 0.4),
  },
};
