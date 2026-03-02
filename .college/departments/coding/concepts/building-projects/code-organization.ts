import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const codeOrganization: RosettaConcept = {
  id: 'code-code-organization',
  name: 'Code Organization',
  domain: 'coding',
  description: 'Structuring code for readability, maintainability, and collaboration. ' +
    'Functions: single responsibility, short (20 lines max), named after what they do not how. ' +
    'Modules: related functions grouped in a file, import only what you need. ' +
    'Classes: data and the functions that operate on it together (OOP). ' +
    'SOLID principles: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion. ' +
    'DRY (Don\'t Repeat Yourself): if you copy code three times, extract it to a function. ' +
    'The most important reader of your code is future-you in six months: write for clarity.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'code-abstraction',
      description: 'Good code organization relies on abstraction -- each module hides its implementation',
    },
    {
      type: 'cross-reference',
      targetId: 'writ-drafting-discovery',
      description: 'Code organization parallels essay structure: both require logical grouping and clear hierarchy',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
