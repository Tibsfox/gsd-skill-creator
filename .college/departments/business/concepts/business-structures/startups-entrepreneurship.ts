import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const startupsEntrepreneurship: RosettaConcept = {
  id: 'bus-startups-entrepreneurship',
  name: 'Startups & Entrepreneurship',
  domain: 'business',
  description:
    'Entrepreneurship is the process of identifying opportunities and creating new ventures to pursue them. ' +
    'The Lean Startup methodology (Steve Blank, Eric Ries) emphasizes rapid hypothesis testing: ' +
    'build minimum viable products (MVPs), measure customer response, and pivot or persevere based on learning. ' +
    'Key concepts: product-market fit, scalability, runway (how long current capital lasts), ' +
    'unit economics (is each customer profitable?), and the venture capital funding stages.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'bus-corporations-llcs',
      description: 'Startups choose legal structures strategically — most growth startups incorporate as C-corps to enable VC investment',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.25 + 0.49),
    angle: Math.atan2(0.7, 0.5),
  },
};
