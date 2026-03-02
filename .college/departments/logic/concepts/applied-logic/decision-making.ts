import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const decisionMaking: RosettaConcept = {
  id: 'log-decision-making',
  name: 'Logical Decision Making',
  domain: 'logic',
  description: 'Rational decision making applies logical and probabilistic tools to choose among options under uncertainty. ' +
    'Expected value: weight outcomes by their probability -- choose the option with the highest expected value (EV). ' +
    'Decision trees: visualize choices, probabilities, and outcomes in a branching structure. ' +
    'Sunk cost fallacy: past costs should not influence future decisions -- only future costs and benefits matter. ' +
    'Opportunity cost: the value of the best alternative foregone when making a choice. ' +
    'Satisficing vs. maximizing: satisficers seek "good enough" options; maximizers seek optimal ones (maximizers are often less happy). ' +
    'Pre-mortem analysis: imagine the decision failed and work backward to identify how -- surfaces hidden risks. ' +
    'Reversibility: prefer reversible decisions when uncertain -- preserves option value. ' +
    'Near-far thinking: imagining a decision in the distant future promotes abstract, principle-based reasoning; proximate framing promotes concrete, detail-based reasoning.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'log-inductive-reasoning',
      description: 'Decision making under uncertainty requires inductive reasoning -- probability estimates come from induction',
    },
    {
      type: 'cross-reference',
      targetId: 'econ-opportunity-cost',
      description: 'Economic reasoning about opportunity cost formalizes the logic of what is given up with every choice',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};
