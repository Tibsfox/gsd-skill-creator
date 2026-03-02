import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const automatedFarms: RosettaConcept = {
  id: 'spatial-automated-farms',
  name: 'Automated Farms',
  domain: 'spatial-computing',
  description:
    'Crop farms use water flow mechanics: water flows 7 blocks on flat terrain before stopping. ' +
    'Placing a water source at one end of an 8-block row keeps all crops hydrated (farmland must ' +
    'be within 4 blocks of water). Harvest automation: a piston wall can break all crops simultaneously ' +
    'when triggered, dropping items for hopper collection below. Mob farms exploit mob spawning ' +
    'mechanics: a 9x9 spawning platform in a dark room funnels mobs into a drop shaft for fall damage. ' +
    'Spawn rates increase when the player waits far from the spawning area (prevents mob cap filling). ' +
    'Tree farms use pistons: an oak sapling with a piston above limits tree height to 5 blocks, ' +
    'guaranteeing harvestable trees. Bamboo farms are simple -- bamboo grows 1 block per random tick; ' +
    'a piston at height 16 auto-harvests when the bamboo reaches it. Sugar cane grows 3 blocks tall; ' +
    'a piston at height 2 harvests the top 1-2 blocks while leaving the root.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'spatial-circuit-timing',
      description: 'Automated farms use clock circuits to trigger harvesting pistons at regular intervals',
    },
    {
      type: 'dependency',
      targetId: 'spatial-item-transport-sorting',
      description: 'Farm output flows into hopper collection systems for sorting and storage',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.55 ** 2 + 0.55 ** 2),
    angle: Math.atan2(0.55, 0.55),
  },
};
