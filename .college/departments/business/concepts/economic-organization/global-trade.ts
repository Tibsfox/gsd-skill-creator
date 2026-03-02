import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const globalTrade: RosettaConcept = {
  id: 'bus-global-trade',
  name: 'Global Trade & Comparative Advantage',
  domain: 'business',
  description:
    'Comparative advantage explains why countries benefit from specialization and trade even if one country ' +
    'is better at producing everything. Countries should produce what they have the lowest opportunity cost for. ' +
    'Trade enables higher total output and consumption than autarky. ' +
    'Counterforces: trade creates winners and losers domestically, and supply chain dependencies create vulnerabilities. ' +
    'Tariffs, quotas, and trade agreements reflect these competing interests.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'bus-market-structures',
      description: 'Global trade creates international competition that alters domestic market structures',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.2025 + 0.49),
    angle: Math.atan2(0.7, 0.45),
  },
};
