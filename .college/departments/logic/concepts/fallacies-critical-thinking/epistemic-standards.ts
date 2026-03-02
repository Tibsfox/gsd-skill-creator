import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const epistemicStandards: RosettaConcept = {
  id: 'log-epistemic-standards',
  name: 'Epistemic Standards and Knowledge Claims',
  domain: 'logic',
  description: 'Epistemology asks: what is knowledge, how do we acquire it, and what justifies belief? ' +
    'Knowledge (traditionally): justified true belief (JTB). Gettier problems show JTB is insufficient -- you can have a justified true belief by luck. ' +
    'Degrees of belief: instead of binary know/not-know, calibrated credences (0-1 probability estimates) better represent epistemic states. ' +
    'Bayesian epistemology: rational belief revision uses Bayes\' theorem -- update probabilities when new evidence arrives. ' +
    'Burden of proof: the claim-maker bears the burden. Absence of evidence ≠ evidence of absence (but can be, with appropriate caveats). ' +
    'Extraordinary claims require extraordinary evidence (Sagan standard). ' +
    'Defeaters: evidence or argument that undermines a belief even if it does not prove it false. ' +
    'Epistemic humility: calibrating confidence to the actual strength of evidence -- neither overconfident nor underconfident.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'log-critical-thinking-framework',
      description: 'Critical thinking requires epistemic standards -- you need a theory of knowledge to know what counts as good evidence',
    },
    {
      type: 'cross-reference',
      targetId: 'data-probability-basics',
      description: 'Bayesian epistemology and probability theory share the same mathematical foundation -- probability is the logic of uncertain belief',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.16 + 0.5625),
    angle: Math.atan2(0.75, 0.4),
  },
};
