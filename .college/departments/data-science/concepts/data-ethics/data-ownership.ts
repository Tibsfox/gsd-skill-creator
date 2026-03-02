import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dataOwnership: RosettaConcept = {
  id: 'data-data-ownership',
  name: 'Data Ownership & Open Data',
  domain: 'data-science',
  description: 'Who owns data? Legal frameworks differ: in the US, there is no general right to your personal data. ' +
    'GDPR (EU) establishes rights: access, rectification, erasure, portability. ' +
    'Open data: government data (data.gov), scientific research data, open APIs -- ' +
    'freely available for analysis, often enabling public benefit research. ' +
    'Data licensing: Creative Commons (CC-BY), Open Data Commons for datasets. ' +
    'Data for profit: your social media posts train AI models without compensation. ' +
    'Data sovereignty: Indigenous data sovereignty recognizes communities\' rights over data about their members. ' +
    'Data trusts: a governance model where a trusted third party manages data on behalf of individuals. ' +
    'The tension: open data enables innovation but privacy requires limits on openness.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'econ-market-failures',
      description: 'Data is a non-rival good (sharing doesn\'t reduce it) but excludable -- a public goods problem',
    },
    {
      type: 'dependency',
      targetId: 'data-privacy-consent',
      description: 'Data ownership and privacy are linked -- ownership rights determine consent requirements',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.1225 + 0.5625),
    angle: Math.atan2(0.75, 0.35),
  },
};
