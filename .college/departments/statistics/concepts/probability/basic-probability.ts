import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const basicProbability: RosettaConcept = {
  id: 'stat-basic-probability',
  name: 'Basic Probability',
  domain: 'statistics',
  description:
    'Probability measures the likelihood of an event on a scale from 0 (impossible) to 1 (certain). ' +
    'Classical probability: P(A) = favorable outcomes / total equally-likely outcomes. ' +
    'Empirical probability estimates probability from observed frequency. ' +
    'Key rules: complement rule P(not A) = 1 − P(A), addition rule for mutually exclusive events, ' +
    'multiplication rule for independent events. These are the building blocks of all statistical reasoning.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.64 + 0.0625),
    angle: Math.atan2(0.25, 0.8),
  },
};
