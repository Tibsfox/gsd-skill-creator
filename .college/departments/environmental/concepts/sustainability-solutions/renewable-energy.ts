import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const renewableEnergy: RosettaConcept = {
  id: 'envr-renewable-energy',
  name: 'Renewable Energy',
  domain: 'environmental',
  description: 'Renewable energy comes from sources that are naturally replenished on human timescales -- the core of decarbonization. ' +
    'Solar PV: cost fell 90% in the last decade, now the cheapest electricity source in history. Intermittent (night, clouds). ' +
    'Wind: onshore and offshore. Cost competitive with fossil fuels in most regions. Intermittent. ' +
    'Hydropower: largest renewable source globally. Reliable, dispatchable, but limited by geography and ecological impacts. ' +
    'Grid integration: renewables require storage (batteries, pumped hydro) or flexible demand to handle intermittency. ' +
    'LCOE (levelized cost of electricity): the lifetime cost per unit of electricity -- the standard metric for comparing sources. ' +
    'Energy transition: global electricity generation from renewables is growing rapidly (35%+ in 2024). ' +
    'Hard-to-decarbonize sectors: shipping, aviation, steel, cement require green hydrogen or carbon capture -- not just electrification. ' +
    'Mineral requirements: solar panels, wind turbines, and batteries require lithium, cobalt, copper -- creating new supply chain challenges.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'envr-climate-change-evidence',
      description: 'Renewable energy is the primary decarbonization solution -- its deployment directly addresses the fossil fuel emissions driving climate change',
    },
    {
      type: 'cross-reference',
      targetId: 'econ-market-failures',
      description: 'The energy transition requires correcting market failures -- fossil fuels are underpriced because they do not pay for their climate externalities',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
