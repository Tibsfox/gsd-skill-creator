import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const resourceProductionChains: RosettaConcept = {
  id: 'spatial-resource-production-chains',
  name: 'Resource Production Chains',
  domain: 'spatial-computing',
  description:
    'Production chains link multiple automated systems: raw materials flow in, processed goods flow out. ' +
    'Smelting arrays use multiple furnaces in parallel -- a typical array has 8 furnaces fed by one ' +
    'input hopper feeding into 8 hoppers above each furnace, and 8 output hoppers below feeding into ' +
    'one collection chest. This processes 8x faster than a single furnace. Auto-crafting (via vanilla): ' +
    'crafters (1.21+) automate crafting table recipes -- feed raw materials in, extract crafted items. ' +
    'Bulk storage with barrels: a storage wall of barrels (6x6 = 36 barrels) holds 36 * 1728 items. ' +
    'Input-output separation: dedicate one hopper channel for input and another for retrieval to prevent ' +
    'backflow. Resource throughput planning: iron farm produces ~2000 iron/hour; a smelting array of ' +
    '8 furnaces smelts 1000 items/hour (1 item per 10 seconds per furnace). Matching production to ' +
    'consumption rate prevents bottlenecks.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'spatial-item-transport-sorting',
      description: 'Production chains require item sorting to route raw materials to correct processing stations',
    },
    {
      type: 'cross-reference',
      targetId: 'spatial-iterative-build-process',
      description: 'Production chains are designed, tested, and refined iteratively as bottlenecks are discovered',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.45 ** 2 + 0.65 ** 2),
    angle: Math.atan2(0.65, 0.45),
  },
};
