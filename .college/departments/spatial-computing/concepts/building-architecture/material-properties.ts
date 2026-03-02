import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const materialProperties: RosettaConcept = {
  id: 'spatial-material-properties',
  name: 'Block & Material Properties',
  domain: 'spatial-computing',
  description:
    'Minecraft blocks have hardness (time to mine) and blast resistance (resistance to explosions). ' +
    'Obsidian has blast resistance 1200 -- essentially explosion-proof. Cobblestone has blast ' +
    'resistance 6 -- good for general fortifications. Sand and gravel are affected by gravity -- ' +
    'they fall if unsupported, making them useful for dispensing but unreliable for structures. ' +
    'Aesthetic texture matching: stone brick is formal/castle, oak planks are rustic/warm, ' +
    'quartz is modern/clean, sandstone is desert/Egyptian. Biome-appropriate materials: spruce ' +
    'log and dark oak in taiga/forest builds; sandstone and terracotta in desert builds; ' +
    'prismarine and sea lanterns in ocean/aquatic builds. Transparent blocks: glass (no light loss), ' +
    'glass pane (thinner visual profile), slabs (half blocks for detail work). ' +
    'Light-emitting blocks: glowstone (level 15), sea lantern (15), torch (14), campfire (15).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'spatial-structural-principles',
      description: 'Material selection affects structural aesthetics and the visual weight of pillars and walls',
    },
    {
      type: 'cross-reference',
      targetId: 'spatial-automated-farms',
      description: 'Block properties (gravity, flammability) are critical for farm design safety',
    },
  ],
  complexPlanePosition: {
    real: 0.82,
    imaginary: 0.18,
    magnitude: Math.sqrt(0.82 ** 2 + 0.18 ** 2),
    angle: Math.atan2(0.18, 0.82),
  },
};
