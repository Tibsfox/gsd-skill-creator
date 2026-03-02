import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const itemTransportSorting: RosettaConcept = {
  id: 'spatial-item-transport-sorting',
  name: 'Item Transport & Sorting',
  domain: 'spatial-computing',
  description:
    'Hoppers pull items from containers above them and push items into containers below or in front. ' +
    'A hopper chain is a series of hoppers transporting items horizontally and vertically. ' +
    'Throughput: each hopper transfers 1 item every 0.4 seconds (8 game ticks); for high-volume ' +
    'farms, parallel hopper chains may be needed. Item sorters use comparators to detect specific items: ' +
    'a dropper-hopper loop with named items exploits comparator output levels to route items. ' +
    'A simpler filter: fill a hopper with 4 stacks of the filter item + 1 target item in slot 5; ' +
    'items that match the target can pass through; others cannot fill slot 5 and get routed elsewhere. ' +
    'Minecart with hopper: faster item transport over long distances -- powered rails keep it moving. ' +
    'Water streams move dropped items: a channel of flowing water carries items to a hopper input ' +
    'efficiently from large farm collection areas.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'spatial-automated-farms',
      description: 'Farm output collection requires hopper networks to transport items from drop locations to storage',
    },
    {
      type: 'dependency',
      targetId: 'spatial-resource-production-chains',
      description: 'Item sorting routes raw materials to processing stations in production chains',
    },
  ],
  complexPlanePosition: {
    real: 0.50,
    imaginary: 0.60,
    magnitude: Math.sqrt(0.50 ** 2 + 0.60 ** 2),
    angle: Math.atan2(0.60, 0.50),
  },
};
