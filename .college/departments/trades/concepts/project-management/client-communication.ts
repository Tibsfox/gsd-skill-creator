import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const clientCommunication: RosettaConcept = {
  id: 'trade-client-communication',
  name: 'Client Communication',
  domain: 'trades',
  description:
    'Professional client communication determines project success and repeat business as much as ' +
    'technical quality. Scope of work documentation: written description of exactly what is and ' +
    'isn\'t included prevents "scope creep" disputes. Contracts: key elements are description of ' +
    'work, payment schedule, timeline, change order process, warranty, and dispute resolution. ' +
    'Change orders: any work beyond the original scope must be documented in writing before ' +
    'proceeding — verbal approvals are unenforceable and lead to payment disputes. Progress ' +
    'updates: proactive communication about schedule, delays, and discoveries prevents client ' +
    'anxiety; surprises are almost always worse than proactive notice. Communicating bad news: ' +
    'deliver early, clearly, with a proposed solution — "I found rot behind the tile; here\'s ' +
    'what it means and what options you have." Warranty and callbacks: clear warranty language ' +
    '(what\'s covered, for how long) and responsive callback handling build reputation more than ' +
    'any other single practice.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'trade-project-planning',
      description: 'Client communication is the human interface for the technical project planning and execution process',
    },
    {
      type: 'analogy',
      targetId: 'trade-estimating-bidding',
      description: 'Estimating and client communication are complementary business skills — estimating sets financial expectations, communication maintains them',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};
