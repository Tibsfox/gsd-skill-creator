import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const inductiveReasoning: RosettaConcept = {
  id: 'log-inductive-reasoning',
  name: 'Inductive Reasoning and Inference',
  domain: 'logic',
  description: 'Inductive reasoning draws general conclusions from specific observations -- the basis of scientific inquiry. ' +
    'Induction does not guarantee truth: no matter how many white swans you observe, you cannot be certain all swans are white (one black swan falsifies). ' +
    'Enumerative induction: "All observed Xs are Y, therefore all Xs are Y." ' +
    'Statistical induction: "80% of sampled Xs are Y, therefore approximately 80% of all Xs are Y." ' +
    'Inference to the best explanation (abduction): choose the hypothesis that best explains the evidence. ' +
    'Hume\'s problem of induction: there is no logical guarantee the future will resemble the past -- induction relies on this assumption. ' +
    'Inductive strength: depends on sample size, representativeness, and number of confirming instances. ' +
    'Science uses both: induction to form hypotheses, deduction to derive testable predictions, experimentation to test. ' +
    'Practical use: most everyday reasoning is inductive -- recognizing this enables more calibrated confidence in conclusions.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'log-validity-soundness',
      description: 'Understanding deductive validity clarifies what induction is NOT -- inductive strength is a different standard',
    },
    {
      type: 'cross-reference',
      targetId: 'data-probability-basics',
      description: 'Probability theory formalizes inductive reasoning -- statistical inference is quantified induction',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
