import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const helloWorld: RosettaConcept = {
  id: 'test-hello-world',
  name: 'Hello World',
  domain: 'test-department',
  description: 'The canonical first program -- every programming journey begins here. ' +
    'Hello World teaches output, string literals, and program structure in a single line.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      code: 'print("Hello, World!")',
      explanation: 'Python uses the print() function for output.',
      pedagogicalNotes: 'The simplest Python program. One line does one thing.',
    }],
    ['cpp', {
      panelId: 'cpp',
      code: '#include <iostream>\nint main() { std::cout << "Hello, World!" << std::endl; return 0; }',
      explanation: 'C++ requires a main function and iostream for output.',
      pedagogicalNotes: 'Compare with Python -- C++ requires more ceremony but gives more control.',
    }],
  ]),
  relationships: [
    {
      type: 'analogy',
      targetId: 'math-variables',
      description: 'Variables in Hello World are like variables in algebra -- named containers for values',
    },
  ],
  complexPlanePosition: {
    real: 0.9,
    imaginary: -0.8,
    magnitude: Math.sqrt(0.81 + 0.64),
    angle: Math.atan2(-0.8, 0.9),
  },
};
