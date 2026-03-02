import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const variablesDataTypes: RosettaConcept = {
  id: 'code-variables-data-types',
  name: 'Variables & Data Types',
  domain: 'coding',
  description: 'Variables are named containers for values that change during program execution. ' +
    'Data types define what kind of value a variable holds and what operations are valid on it. ' +
    'Core types: integers (whole numbers), floats (decimals), strings (text), booleans (true/false), ' +
    'lists/arrays (ordered sequences), and objects/dictionaries (key-value maps). ' +
    'Type errors are among the most common bugs: adding a string to a number, ' +
    'accessing an array out of bounds, calling a method on null. ' +
    'Static typing (Java, C++) catches type errors at compile time; ' +
    'dynamic typing (Python, JavaScript) catches them at runtime.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'code-sequential-thinking',
      description: 'Variables are the memory that allows sequential steps to communicate values',
    },
    {
      type: 'analogy',
      targetId: 'math-ratios',
      description: 'Data types in programming parallel number sets in math: integers, rationals, reals have different properties',
    },
  ],
  complexPlanePosition: {
    real: 0.9,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.81 + 0.01),
    angle: Math.atan2(0.1, 0.9),
  },
};
