import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const requirementsSpecifications: RosettaConcept = {
  id: 'engr-requirements-specifications',
  name: 'Requirements & Specifications',
  domain: 'engineering',
  description:
    'Engineering requirements define what a system must do (functional requirements) and how well it must do it ' +
    '(non-functional requirements: performance, reliability, safety, cost). ' +
    'Specifications translate requirements into quantitative, testable criteria. ' +
    'The gap between customer needs and technical specifications is where many engineering failures originate. ' +
    'Verification checks if specs are met; validation checks if the right problem was solved.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'engr-engineering-design-process',
      description: 'Requirements and specifications are created in the Define phase and guide all subsequent design decisions',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
