import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const hypothesisFormation: RosettaConcept = {
  id: 'sci-hypothesis-formation',
  name: 'Hypothesis Formation',
  domain: 'science',
  description:
    'A hypothesis is a testable prediction about the relationship between variables, typically stated as ' +
    '"If [independent variable], then [dependent variable], because [reasoning]." It is grounded in prior ' +
    'knowledge and must be falsifiable -- capable of being proven wrong. A hypothesis is not a guess but a ' +
    'reasoned prediction that guides experimental design.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-scientific-questions',
      description: 'Hypotheses are generated to answer specific scientific questions',
    },
    {
      type: 'dependency',
      targetId: 'sci-controlled-experiments',
      description: 'The hypothesis directly determines the experimental design used to test it',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};
