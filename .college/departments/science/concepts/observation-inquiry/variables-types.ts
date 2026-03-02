import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const variablesTypes: RosettaConcept = {
  id: 'sci-variables-types',
  name: 'Variables in Science',
  domain: 'science',
  description:
    'An independent variable is what the experimenter deliberately changes; a dependent variable is what ' +
    'is measured in response; controlled variables are kept constant to ensure a fair test. Identifying ' +
    'these correctly is essential for designing experiments that can establish cause-and-effect relationships ' +
    'rather than mere correlations.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-scientific-questions',
      description: 'Variables are identified from the question: what changes, what is measured, what is held constant',
    },
    {
      type: 'dependency',
      targetId: 'sci-controlled-experiments',
      description: 'Controlling variables is the mechanism that makes an experiment fair and interpretable',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.5625 + 0.09),
    angle: Math.atan2(0.3, 0.75),
  },
};
