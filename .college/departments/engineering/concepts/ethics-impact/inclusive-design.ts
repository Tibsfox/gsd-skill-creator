import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const inclusiveDesign: RosettaConcept = {
  id: 'engr-inclusive-design',
  name: 'Inclusive & Accessible Design',
  domain: 'engineering',
  description:
    'Inclusive design creates products and environments usable by all people to the greatest extent possible, ' +
    'without specialized adaptations. Universal design principles: equitable use, flexibility, simple operation, ' +
    'perceptible information, tolerance for error, low physical effort. ' +
    'Accessibility (ensuring products work for people with disabilities) is a legal requirement in many contexts ' +
    'and an ethical imperative. Inclusive design often produces better solutions for everyone — curb cuts, ' +
    'originally for wheelchairs, benefit cyclists, parents with strollers, and delivery workers.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'engr-engineering-ethics',
      description: 'Inclusive design is an ethical imperative — designing only for the average excludes significant populations',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.9,
    magnitude: Math.sqrt(0.09 + 0.81),
    angle: Math.atan2(0.9, 0.3),
  },
};
