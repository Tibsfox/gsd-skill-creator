import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const controlledExperiments: RosettaConcept = {
  id: 'sci-controlled-experiments',
  name: 'Controlled Experiments',
  domain: 'science',
  description:
    'A controlled experiment changes only one variable (the independent variable) while holding all others ' +
    'constant, allowing the experimenter to attribute any changes in the dependent variable to the one changed. ' +
    'This is the gold standard for establishing causation. Without control, confounding variables prevent ' +
    'valid interpretation of results.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-variables-types',
      description: 'Understanding independent, dependent, and controlled variables is prerequisite to designing controlled experiments',
    },
    {
      type: 'dependency',
      targetId: 'sci-experimental-controls',
      description: 'Control groups provide the baseline against which experimental results are compared',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
