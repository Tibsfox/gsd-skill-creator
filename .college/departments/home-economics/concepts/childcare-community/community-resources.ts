import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const communityResources: RosettaConcept = {
  id: 'domestic-community-resources',
  name: 'Community Resources',
  domain: 'home-economics',
  description:
    'Community resources are the services, networks, and institutions available to households ' +
    'for support, enrichment, and civic participation. Categories include: government services ' +
    '(public health, social services, libraries, parks), healthcare resources (clinics, mental ' +
    'health services, pharmacies), educational supports (tutoring programs, adult literacy, ' +
    'extension services), emergency assistance (food banks, shelters, crisis hotlines), and ' +
    'social networks (faith communities, neighborhood associations, mutual aid groups). Finding ' +
    'and accessing resources requires knowing how to search 211 (US social services directory), ' +
    'evaluate eligibility requirements, and navigate bureaucratic processes. Civic participation ' +
    'includes voting, attending local government meetings, volunteering, and community organizing. ' +
    'Strong community connections improve household resilience: knowing neighbors, local resources, ' +
    'and civic processes allows households to navigate crises more effectively than isolation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'domestic-childcare-basics',
      description: 'Community resources include childcare support services, parenting programs, and family assistance',
    },
    {
      type: 'analogy',
      targetId: 'domestic-child-development',
      description: 'Community resources directly support child development through enrichment programs, healthcare, and family support',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};
