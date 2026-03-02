import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const globalizationTrade: RosettaConcept = {
  id: 'econ-globalization-trade',
  name: 'Globalization and Trade',
  domain: 'economics',
  description: 'Globalization is the increasing integration of economies through trade, investment, and information flows. ' +
    'Comparative advantage (Ricardo): trade benefits both parties even if one is absolutely better at everything -- specialization gains exceed losses. ' +
    'Terms of trade: the relative price at which goods are exchanged between countries. ' +
    'Trade balance: exports minus imports. Persistent deficits are often misunderstood -- they also mean capital inflows. ' +
    'Winners and losers from trade: aggregate gains, but concentrated losses (workers in import-competing industries). ' +
    'Tariffs and protectionism: taxes on imports protect domestic industries but raise prices for consumers and trigger retaliation. ' +
    'Global value chains: modern production fragments across many countries -- a smartphone has components from 20+ countries. ' +
    'Race to the bottom: competition for investment may pressure countries to lower labor and environmental standards. ' +
    'Empirical record: global poverty has fallen dramatically since 1990 -- coinciding with trade expansion, though causation is debated.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'econ-opportunity-cost',
      description: 'Comparative advantage is built on opportunity cost -- countries specialize in goods with the lowest opportunity cost',
    },
    {
      type: 'cross-reference',
      targetId: 'envr-sustainability-solutions',
      description: 'Global trade creates environmental challenges -- supply chains generate carbon emissions that are invisible to end consumers',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.16 + 0.5625),
    angle: Math.atan2(0.75, 0.4),
  },
};
