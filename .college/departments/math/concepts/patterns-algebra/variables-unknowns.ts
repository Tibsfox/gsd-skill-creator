import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const variablesUnknowns: RosettaConcept = {
  id: 'math-variables-unknowns',
  name: 'Variables & Unknowns',
  domain: 'math',
  description:
    'A variable is a symbol that can represent an unknown quantity (solve for x) or a quantity that varies ' +
    'across situations (for any x). This dual role is a source of confusion for learners. Understanding ' +
    'variables as placeholders, as varying quantities, and as parameters in formulas enables the transition ' +
    'from arithmetic (specific numbers) to algebra (general relationships).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-pattern-recognition',
      description: 'Variables emerge from the need to express pattern rules that work for any input',
    },
    {
      type: 'dependency',
      targetId: 'math-equations-expressions',
      description: 'Variables are the building blocks of equations and algebraic expressions',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
