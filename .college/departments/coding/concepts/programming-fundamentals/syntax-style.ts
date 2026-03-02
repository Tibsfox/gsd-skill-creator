import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const syntaxStyle: RosettaConcept = {
  id: 'code-syntax-style',
  name: 'Syntax & Code Style',
  domain: 'coding',
  description: 'Syntax is the set of grammatical rules a programming language requires -- ' +
    'violating them produces syntax errors that prevent the program from running at all. ' +
    'Style is the set of conventions that make code readable to humans -- PEP 8 for Python, ' +
    'Google Style Guide for JavaScript. The distinction: syntax is enforced by the computer, ' +
    'style is enforced by the team. ' +
    'Meaningful variable names (user_age not ua), consistent indentation, ' +
    'short functions with single responsibilities, and comments explaining "why" not "what" ' +
    'are the hallmarks of readable code. ' +
    'Linters (ESLint, Pylint) automate style checking.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'code-variables-data-types',
      description: 'Syntax rules govern how variables are declared and used in each language',
    },
    {
      type: 'analogy',
      targetId: 'writ-word-choice-connotation',
      description: 'Code style is to programming what word choice is to writing -- both affect clarity and communication',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.5625 + 0.0225),
    angle: Math.atan2(0.15, 0.75),
  },
};
