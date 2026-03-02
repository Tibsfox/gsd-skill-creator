import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const communityMonitoring: RosettaConcept = {
  id: 'nature-community-monitoring',
  name: 'Community-Based Environmental Monitoring',
  domain: 'nature-studies',
  description:
    'Community-based environmental monitoring (CBEM) organizes volunteers to systematically ' +
    'track local ecological conditions over time — generating long-term datasets no single ' +
    'researcher could maintain. Successful programs define a clear monitoring question (Are ' +
    'breeding bird numbers changing?), select indicators (species presence, count, phenology), ' +
    'establish protocols simple enough for consistent volunteer execution, and set up data ' +
    'submission workflows. Coordination challenges: volunteer training and retention, seasonal ' +
    'coverage gaps, and geographic clustering. Programs like Christmas Bird Count (since 1900), ' +
    'CoCoRaHS (rainfall), and stream macroinvertebrate monitoring demonstrate multi-decade value. ' +
    'CBEM also builds environmental literacy, community attachment to place, and public support ' +
    'for conservation decisions grounded in local data rather than remote assessment.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nature-data-collection',
      description: 'Community monitoring programs depend on standardized data collection methods to aggregate volunteer observations',
    },
    {
      type: 'dependency',
      targetId: 'nature-citizen-science',
      description: 'Community monitoring is a structured application of citizen science principles at the local scale',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};
