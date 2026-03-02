import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dataCollection: RosettaConcept = {
  id: 'diglit-data-collection',
  name: 'What Data Is Collected About You',
  domain: 'digital-literacy',
  description: 'Modern apps and websites collect extensive data about users: ' +
    'location (GPS, cell tower, WiFi triangulation), behavior (clicks, scroll depth, time per page), ' +
    'social graph (who you know, who you interact with), purchases, health data, photos analyzed by AI. ' +
    'Data brokers: companies that buy, aggregate, and sell personal data -- ' +
    'your profile may be sold to insurers, employers, and political campaigns. ' +
    'Terms of service: the document almost nobody reads that grants extensive data rights. ' +
    'Data monetization models: ad-supported (your data pays for free service), ' +
    'premium subscription (you pay with money, not data). ' +
    '"If you are not paying for the product, you are the product" -- though increasingly, you may pay AND be the product.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'diglit-recommendation-systems',
      description: 'Collected data feeds recommendation systems -- collection and use are inseparable',
    },
    {
      type: 'cross-reference',
      targetId: 'data-privacy-consent',
      description: 'Ethical data collection requires informed consent -- most app data collection would fail this standard',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
