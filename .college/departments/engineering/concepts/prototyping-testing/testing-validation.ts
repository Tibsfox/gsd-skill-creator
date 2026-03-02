import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const testingValidation: RosettaConcept = {
  id: 'engr-testing-validation',
  name: 'Testing & Validation',
  domain: 'engineering',
  description:
    'Engineering testing verifies that a design meets its specifications under expected and extreme conditions. ' +
    'Types: functional testing (does it work?), stress testing (does it fail gracefully?), ' +
    'environmental testing (temperature, vibration, humidity), and life testing (durability). ' +
    'Test plans define what to test, how, and what constitutes pass/fail. ' +
    'Data from testing feeds back into design improvement — testing is an ongoing dialogue with the design.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'engr-rapid-prototyping',
      description: 'Prototypes are the physical artifacts that undergo testing and validation',
    },
    {
      type: 'dependency',
      targetId: 'engr-requirements-specifications',
      description: 'Test acceptance criteria come directly from the engineering specifications',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
