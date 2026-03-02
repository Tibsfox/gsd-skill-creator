import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const marginalThinking: RosettaConcept = {
  id: 'econ-marginal-thinking',
  name: 'Marginal Thinking',
  domain: 'economics',
  description: 'Marginal thinking asks: what changes at the margin -- for one more unit? This is how economists actually reason about decisions. ' +
    'Marginal benefit: the additional benefit of consuming or producing one more unit. ' +
    'Marginal cost: the additional cost of producing one more unit. ' +
    'Optimal rule: continue an activity until marginal benefit equals marginal cost (MB = MC). ' +
    'Diminishing marginal utility: each additional unit provides less satisfaction than the previous one (first slice of pizza vs. fifth). ' +
    'Why companies price the way they do: price is set at the margin, not based on average cost. ' +
    '"Sunk cost" mistake is a failure of marginal thinking -- asking "is it worth continuing?" requires looking only at future (marginal) costs and benefits. ' +
    'Thinking at the margin transforms all-or-nothing decisions into "how much?" decisions -- a much more useful frame.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'econ-opportunity-cost',
      description: 'Marginal cost is always an opportunity cost -- the marginal unit uses resources that could be used elsewhere',
    },
    {
      type: 'cross-reference',
      targetId: 'math-derivatives-calculus',
      description: 'Marginal thinking is applied calculus -- marginal cost and marginal benefit are derivatives of cost and benefit functions',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
