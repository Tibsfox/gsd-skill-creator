import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const responsiblePractice: RosettaConcept = {
  id: 'data-responsible-practice',
  name: 'Responsible Data Practice',
  domain: 'data-science',
  description: 'Principles for ethical and rigorous data work. ' +
    'Reproducibility: share code and data so others can verify and build on your work. ' +
    'Pre-registration: specify hypotheses and analysis plan before collecting data -- prevents p-hacking. ' +
    'Transparency: document data sources, cleaning steps, and modeling choices. ' +
    'P-hacking: running many tests and only reporting significant ones inflates false positive rates. ' +
    'HARKing (Hypothesizing After Results are Known): presenting post-hoc hypotheses as if planned. ' +
    'The replication crisis: many published findings fail to replicate -- especially in psychology and nutrition. ' +
    'Data ethics checklist: Who collected this data? Who might be harmed? What are the limitations? ' +
    'What are the alternative explanations? Have you reported null results?',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'data-hypothesis-testing',
      description: 'Pre-registration prevents p-hacking -- the statistical test determines what counts as responsible',
    },
    {
      type: 'cross-reference',
      targetId: 'nutr-evaluating-claims',
      description: 'Nutritional science suffers from p-hacking and HARKing -- the same responsible practice principles apply',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.16 + 0.49),
    angle: Math.atan2(0.7, 0.4),
  },
};
