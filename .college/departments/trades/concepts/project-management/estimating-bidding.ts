import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const estimatingBidding: RosettaConcept = {
  id: 'trade-estimating-bidding',
  name: 'Estimating & Bidding',
  domain: 'trades',
  description:
    'Accurate estimating is the financial foundation of a successful contracting business. ' +
    'Material takeoff: systematically quantify all materials from plans and specifications — ' +
    'lumber (board feet), concrete (cubic yards), paint (coverage per gallon × area), fixtures ' +
    '(count from plans). Add waste factors (10-15% for framing lumber, 10% for tile). Labor ' +
    'estimating: time each task type based on historical data or industry standards; include ' +
    'setup, cleanup, and travel time. Overhead allocation: office, insurance, vehicle, tool ' +
    'depreciation must be recovered through job billing — typically expressed as a percentage ' +
    'multiplied onto direct costs. Profit margin (distinct from overhead): the return on risk ' +
    'and capital; 10-20% is typical for specialty trades. Common estimating errors: ' +
    'underestimating labor (the most common mistake), forgetting permit fees, and not accounting ' +
    'for site conditions. Bid presentation: itemized bids show transparency; lump-sum bids are ' +
    'simpler but harder to dispute. Competitive bidding vs. negotiated work: relationships reduce ' +
    'bid competition.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'trade-project-planning',
      description: 'Accurate estimating requires a complete project plan that identifies all scope items before pricing',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.4225 + 0.1225),
    angle: Math.atan2(0.35, 0.65),
  },
};
