import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const hypothesisTesting: RosettaConcept = {
  id: 'data-hypothesis-testing',
  name: 'Hypothesis Testing',
  domain: 'data-science',
  description: 'A formal procedure for deciding whether observed data is consistent with a null hypothesis. ' +
    'Null hypothesis (H₀): there is no effect (the coin is fair; the drug has no effect; ' +
    'there is no difference between groups). ' +
    'Alternative hypothesis (H₁): there is an effect. ' +
    'p-value: the probability of observing data as extreme as yours, if the null hypothesis were true. ' +
    'If p < 0.05 (the conventional threshold), reject the null. ' +
    'Type I error (false positive): rejecting a true null -- probability = α (usually 0.05). ' +
    'Type II error (false negative): failing to reject a false null -- probability = β. ' +
    'Statistical significance ≠ practical significance: a drug can be significantly better than placebo ' +
    'but the effect size is too small to matter clinically.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'data-probability-basics',
      description: 'The p-value is a probability -- hypothesis testing is applied probability',
    },
    {
      type: 'cross-reference',
      targetId: 'log-deductive-reasoning',
      description: 'Hypothesis testing applies the same deductive structure: if H₀ then X; we observe not-X; therefore reject H₀',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.1225 + 0.5625),
    angle: Math.atan2(0.75, 0.35),
  },
};
