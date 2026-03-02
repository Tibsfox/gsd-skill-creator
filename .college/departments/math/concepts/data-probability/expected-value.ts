import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const expectedValue: RosettaConcept = {
  id: 'math-expected-value',
  name: 'Expected Value & Conditional Probability',
  domain: 'math',
  description:
    'Expected value is the probability-weighted average outcome of a random process -- the long-run ' +
    'average if the experiment were repeated many times. Conditional probability asks: given that ' +
    'event A occurred, what is the probability of event B? Independence means knowing A tells us ' +
    'nothing new about B. These concepts underpin rational decision-making under uncertainty.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-probability-foundations',
      description: 'Expected value and conditional probability extend basic probability rules',
    },
    {
      type: 'cross-reference',
      targetId: 'stat-expected-value',
      description: 'Statistical applications of expected value appear in gambling, insurance, and finance',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.2025 + 0.36),
    angle: Math.atan2(0.6, 0.45),
  },
};
