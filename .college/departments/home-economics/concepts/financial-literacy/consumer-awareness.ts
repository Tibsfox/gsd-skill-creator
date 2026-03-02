import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const consumerAwareness: RosettaConcept = {
  id: 'domestic-consumer-awareness',
  name: 'Consumer Awareness',
  domain: 'home-economics',
  description:
    'Consumer awareness involves critically evaluating marketing, understanding contracts, and ' +
    'knowing legal rights. Advertising techniques include artificial urgency (limited time), social ' +
    'proof (everyone is buying), anchoring (crossed-out high price makes sale price seem great), ' +
    'and loss framing (what you miss by not buying). Reading contracts: identify parties, obligations, ' +
    'duration, cancellation terms, and dispute resolution clauses — terms in fine print are legally ' +
    'binding. Understanding the annual percentage rate (APR) is essential for credit decisions: ' +
    'a credit card at 22% APR applied to a $1,000 balance costs $220/year in interest. Consumer ' +
    'protection rights include FTC regulations on advertising claims, product return laws, identity ' +
    'theft protections, and lemon laws for defective vehicles. Comparison shopping using unit ' +
    'pricing (cost per oz, per use) rather than package price reveals true value. Impulse purchase ' +
    'delay strategies: 24-hour rule, list shopping, and avoiding shopping when hungry or tired.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'domestic-budgeting',
      description: 'Consumer awareness helps maintain budget discipline by identifying and resisting manipulative marketing',
    },
    {
      type: 'analogy',
      targetId: 'domestic-saving-investing',
      description: 'Both consumer awareness and investing require critical evaluation of financial opportunities and risks',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.3025 + 0.2025),
    angle: Math.atan2(0.45, 0.55),
  },
};
