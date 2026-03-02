import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const supplyChainManufacturing: RosettaConcept = {
  id: 'mfab-supply-chain-manufacturing',
  name: 'Supply Chain & Manufacturing Strategy',
  domain: 'materials',
  description:
    'Manufacturing strategy determines what to make in-house versus outsource, where to locate production, ' +
    'and how to organize production flow. Make-or-buy decisions consider cost, quality, intellectual property, ' +
    'and supply security. Supply chain design balances inventory cost against disruption risk — ' +
    'the COVID-19 pandemic exposed fragility in just-in-time globally distributed supply chains. ' +
    'Reshoring and nearshoring trends reflect renewed attention to supply chain resilience.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-quality-control',
      description: 'Supply chain management must ensure supplier quality matches in-house production standards',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.2025 + 0.5625),
    angle: Math.atan2(0.75, 0.45),
  },
};
