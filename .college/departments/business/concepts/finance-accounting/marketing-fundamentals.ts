import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const marketingFundamentals: RosettaConcept = {
  id: 'bus-marketing-fundamentals',
  name: 'Marketing Fundamentals',
  domain: 'business',
  description:
    'Marketing is the process of identifying customer needs and creating value to meet them profitably. ' +
    'The 4 Ps framework: Product (what), Price (how much), Place (where distributed), Promotion (how communicated). ' +
    'Market segmentation divides customers by shared characteristics to tailor offerings. ' +
    'The marketing funnel: Awareness → Interest → Desire → Action (AIDA). ' +
    'Digital marketing has transformed the speed and measurability of customer acquisition.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'bus-supply-demand',
      description: 'Marketing seeks to shift demand curves by creating awareness and preference for the firm\'s offerings',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.36 + 0.36),
    angle: Math.atan2(0.6, 0.6),
  },
};
