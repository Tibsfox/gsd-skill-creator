import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const humanResources: RosettaConcept = {
  id: 'bus-human-resources',
  name: 'Human Resources Management',
  domain: 'business',
  description:
    'Human resources management (HRM) covers acquiring, developing, and retaining the people who carry out business strategy. ' +
    'Functions include recruitment, compensation, performance management, training, and employee relations. ' +
    'Key frameworks: Maslow\'s hierarchy of needs (motivation), Herzberg\'s two-factor theory (hygiene vs. motivators). ' +
    'Modern HR increasingly focuses on culture, diversity, and psychological safety as drivers of performance.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'bus-organizational-structure',
      description: 'HRM policies must align with organizational structure — different structures require different HR approaches',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.25 + 0.49),
    angle: Math.atan2(0.7, 0.5),
  },
};
