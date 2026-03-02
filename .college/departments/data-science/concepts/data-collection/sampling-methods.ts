import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const samplingMethods: RosettaConcept = {
  id: 'data-sampling-methods',
  name: 'Sampling Methods',
  domain: 'data-science',
  description: 'A population is all units of interest; a sample is the subset actually measured. ' +
    'Simple random sampling: every unit has equal probability of selection -- the gold standard. ' +
    'Stratified sampling: divide population into groups (strata), sample proportionally from each -- ' +
    'ensures representation of important subgroups. ' +
    'Cluster sampling: sample entire clusters (classrooms, cities) -- cheaper but less precise. ' +
    'Convenience sampling: take what is easy to get (volunteers, Amazon Mechanical Turk) -- ' +
    'fast and cheap but almost always biased. ' +
    'Sample size determines precision: larger samples reduce sampling error. ' +
    'n=1000 gives about ±3% margin of error for proportions regardless of population size.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'data-sampling-bias',
      description: 'Each sampling method introduces different types of bias',
    },
    {
      type: 'cross-reference',
      targetId: 'data-probability-basics',
      description: 'Probability theory explains why random sampling produces representative samples',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};
