import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const combinationMethods: RosettaConcept = {
  id: 'cook-combination-methods',
  name: 'Combination Methods and Knife Skills',
  domain: 'culinary-arts',
  description: 'Combination methods use both dry and wet heat sequentially. Braising: sear meat ' +
    'at high heat (dry) to develop a Maillard crust, then slow cook in liquid (wet) at low ' +
    'temperature for hours -- collagen converts to gelatin at 70C+ (158F+), transforming tough ' +
    'cuts into tender, succulent dishes. Stewing follows the same principle with smaller pieces ' +
    'and more liquid. The searing step is critical for flavor development, not for "sealing in ' +
    'juices" (a persistent myth). Knife skills form the mechanical foundation of all preparation: ' +
    'the rock chop (pivot on tip), julienne (matchstick cuts), brunoise (fine dice from julienne), ' +
    'and chiffonade (ribbon cuts for herbs). Each technique builds on proper grip and blade control.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cook-protein-denaturation',
      description: 'Braising and stewing rely on collagen-to-gelatin conversion, a specific protein denaturation process',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-maillard-reaction',
      description: 'The initial searing step in braising develops Maillard flavors before wet cooking begins',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.64 + 0.01),
    angle: Math.atan2(0.1, 0.8),
  },
};
