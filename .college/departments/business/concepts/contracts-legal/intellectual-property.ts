import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const intellectualProperty: RosettaConcept = {
  id: 'bus-intellectual-property',
  name: 'Intellectual Property',
  domain: 'business',
  description:
    'Intellectual property (IP) law protects creations of the mind. ' +
    'Patents protect inventions (utility, design, plant) for ~20 years. ' +
    'Copyrights protect original creative works automatically for the creator\'s life plus 70 years. ' +
    'Trademarks protect brand identifiers (names, logos) indefinitely with ongoing use. ' +
    'Trade secrets protect confidential business information. ' +
    'IP creates competitive advantage by temporarily preventing others from copying innovations.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'bus-contract-basics',
      description: 'IP licenses are contracts governing how intellectual property can be used by others',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.4225 + 0.25),
    angle: Math.atan2(0.5, 0.65),
  },
};
