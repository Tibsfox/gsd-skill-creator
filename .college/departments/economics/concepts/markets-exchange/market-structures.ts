import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const marketStructures: RosettaConcept = {
  id: 'econ-market-structures',
  name: 'Market Structures',
  domain: 'economics',
  description: 'Market structure describes how competitive a market is -- which affects prices, quantities, and efficiency. ' +
    'Perfect competition: many sellers, identical products, free entry/exit -- price = marginal cost, zero long-run profit. ' +
    'Monopoly: single seller, price-setter (not taker), charges above marginal cost, creates deadweight loss. ' +
    'Oligopoly: few large sellers, strategic interaction -- each firm\'s decisions affect others (game theory territory). ' +
    'Monopolistic competition: many sellers but differentiated products (restaurants, clothing) -- some pricing power, free entry. ' +
    'Natural monopoly: a single firm can serve the market more cheaply than multiple firms (utilities, railroads) -- regulated. ' +
    'Market power: the ability to influence price -- arises from barriers to entry, differentiation, network effects. ' +
    'Antitrust policy: government regulation preventing market concentration from harming consumers. ' +
    'Tech platforms: exhibit strong network effects and multi-sided markets -- a new type of market structure economists are still modeling.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'econ-supply-demand',
      description: 'Market structure modifies how supply and demand operate -- perfect competition is the base case; others deviate from it',
    },
    {
      type: 'cross-reference',
      targetId: 'code-open-source',
      description: 'Open-source software operates in markets with near-zero marginal cost -- understanding this requires market structure economics',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
