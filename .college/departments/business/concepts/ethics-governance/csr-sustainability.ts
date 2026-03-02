import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const csrSustainability: RosettaConcept = {
  id: 'bus-csr-sustainability',
  name: 'Corporate Social Responsibility & Sustainability',
  domain: 'business',
  description:
    'Corporate social responsibility (CSR) is the commitment to conduct business ethically and contribute ' +
    'positively to society and environment. ESG (Environmental, Social, Governance) metrics allow comparison. ' +
    'Sustainability means meeting present needs without compromising future generations\' ability to meet theirs. ' +
    'B Corporations and benefit corporations legally integrate social purpose. ' +
    'The business case for CSR: risk reduction, talent attraction, customer loyalty, and regulatory goodwill.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'bus-business-ethics',
      description: 'CSR is the operational expression of stakeholder ethics in business strategy',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.85,
    magnitude: Math.sqrt(0.1225 + 0.7225),
    angle: Math.atan2(0.85, 0.35),
  },
};
