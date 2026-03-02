import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const causalReasoning: RosettaConcept = {
  id: 'log-causal-reasoning',
  name: 'Causal Reasoning',
  domain: 'logic',
  description: 'Causal reasoning identifies cause-effect relationships -- one of the most important and most error-prone forms of reasoning. ' +
    'Correlation vs. causation: two variables can vary together without one causing the other (ice cream sales and drowning rates both peak in summer). ' +
    'Mill\'s methods: agreement (what do all cases of X share?), difference (what differs between X and not-X?), concomitant variation (does X vary with Y?). ' +
    'Necessary vs. sufficient conditions: oxygen is necessary but not sufficient for fire. Decapitation is sufficient for death. ' +
    'Counterfactual analysis: "If A had not occurred, would B have occurred?" -- the basis of modern causal inference. ' +
    'Confounders: hidden third variables that cause both the apparent cause and effect. ' +
    'Reverse causation: does X cause Y, or Y cause X? (Does exercise cause happiness, or happy people exercise more?) ' +
    'Randomized controlled trials: the gold standard for establishing causation -- random assignment eliminates confounders.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'log-argument-structure',
      description: 'Causal claims are a type of argument -- they need to be assessed using the same tools as any other argument',
    },
    {
      type: 'cross-reference',
      targetId: 'data-hypothesis-testing',
      description: 'Hypothesis testing is the statistical tool for evaluating causal claims -- the logic of experimental design implements causal reasoning',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
