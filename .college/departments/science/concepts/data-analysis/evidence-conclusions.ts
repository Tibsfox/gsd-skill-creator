import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const evidenceConclusions: RosettaConcept = {
  id: 'sci-evidence-conclusions',
  name: 'Evidence & Drawing Conclusions',
  domain: 'science',
  description:
    'Drawing conclusions means interpreting data to determine whether results support or refute the ' +
    'hypothesis -- while acknowledging limitations. Conclusions must be grounded in data, not in what ' +
    'the experimenter hoped to find. A failed hypothesis is not a failed experiment; it provides ' +
    'information that refines understanding.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-data-tables-graphs',
      description: 'Conclusions are drawn from patterns identified in graphs and tables of experimental data',
    },
    {
      type: 'dependency',
      targetId: 'sci-claims-evidence-reasoning',
      description: 'Scientific conclusions use the claims-evidence-reasoning framework for rigorous argument',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
