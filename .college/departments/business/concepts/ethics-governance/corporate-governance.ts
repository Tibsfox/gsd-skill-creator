import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const corporateGovernance: RosettaConcept = {
  id: 'bus-corporate-governance',
  name: 'Corporate Governance',
  domain: 'business',
  description:
    'Corporate governance is the system by which corporations are directed and controlled. ' +
    'Key mechanisms: board of directors (oversees management, represents shareholders), ' +
    'executive compensation (aligning incentives), audit committees (financial oversight), ' +
    'and shareholder voting rights. ' +
    'Agency problems arise when managers\' interests diverge from shareholders\'. ' +
    'Good governance reduces corruption, improves decision-making, and builds investor confidence.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'bus-business-ethics',
      description: 'Governance structures institutionalize ethical commitments — they make ethical behavior more likely',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.16 + 0.64),
    angle: Math.atan2(0.8, 0.4),
  },
};
