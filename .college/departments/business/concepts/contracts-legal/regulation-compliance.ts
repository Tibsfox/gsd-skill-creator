import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const regulationCompliance: RosettaConcept = {
  id: 'bus-regulation-compliance',
  name: 'Regulation & Compliance',
  domain: 'business',
  description:
    'Businesses operate within a regulatory environment set by government to correct market failures, ' +
    'protect consumers, and ensure fair competition. Key regulatory areas: securities law (SEC), antitrust (FTC/DOJ), ' +
    'environmental (EPA), data privacy (GDPR, CCPA), and industry-specific regulations (FDA, banking). ' +
    'Compliance programs establish internal controls to ensure adherence. ' +
    'Non-compliance risks include fines, litigation, reputational damage, and criminal liability.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'bus-contract-basics',
      description: 'Regulatory requirements often supplement or modify contract terms — particularly in consumer contracts',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.25 + 0.49),
    angle: Math.atan2(0.7, 0.5),
  },
};
