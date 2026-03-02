import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const algorithmicBias: RosettaConcept = {
  id: 'data-algorithmic-bias',
  name: 'Algorithmic Bias & Fairness',
  domain: 'data-science',
  description: 'Algorithms can encode and amplify human biases present in training data. ' +
    'COMPAS recidivism algorithm: predicted Black defendants as higher risk at twice the rate of white defendants ' +
    'with the same actual recidivism. ' +
    'Amazon hiring algorithm: trained on historical resumes (mostly male) -- downgraded resumes containing "women\'s." ' +
    'Facial recognition: error rates 10-34% higher for darker-skinned women than lighter-skinned men. ' +
    'Sources of bias: historical discrimination in training data, non-representative samples, ' +
    'proxy variables that correlate with protected characteristics. ' +
    'Fairness metrics: demographic parity, equalized odds, calibration -- but these metrics can mathematically conflict. ' +
    'Disparate impact: facially neutral criteria that disproportionately affect protected groups.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'data-sampling-bias',
      description: 'Training data sampling bias is the root cause of most algorithmic bias',
    },
    {
      type: 'cross-reference',
      targetId: 'code-ai-ml-fundamentals',
      description: 'ML engineers who build models must understand algorithmic bias from a data perspective',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.09 + 0.64),
    angle: Math.atan2(0.8, 0.3),
  },
};
