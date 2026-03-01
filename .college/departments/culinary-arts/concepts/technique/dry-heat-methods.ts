import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dryHeatMethods: RosettaConcept = {
  id: 'cook-dry-heat-methods',
  name: 'Dry Heat Methods',
  domain: 'culinary-arts',
  description: 'Cooking methods that transfer heat without water or liquid. Sauteing (190-230C / ' +
    '375-450F): quick, high-heat cooking in a small amount of fat, developing fond (caramelized ' +
    'bits) on the pan surface. Roasting (150-230C / 300-450F): oven convection heat surrounds ' +
    'food, browning the surface while cooking through. Grilling and broiling (260-315C / 500-600F): ' +
    'intense radiant heat creates char marks and smoky flavors. Pan-frying uses moderate fat depth ' +
    'for partial immersion, while deep-frying fully submerges food in oil (175-190C / 350-375F). ' +
    'All dry heat methods can achieve temperatures above 140C where Maillard browning begins, ' +
    'producing complex flavors impossible with wet heat alone.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cook-maillard-reaction',
      description: 'Dry heat enables temperatures above 140C where Maillard browning produces complex flavors',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-heat-transfer-modes',
      description: 'Each dry heat method uses a different primary transfer mode -- conduction (saute), convection (roasting), radiation (grilling)',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-temperature-danger-zone',
      description: 'Dry heat must achieve safe internal temperatures -- verify with thermometer regardless of surface browning',
    },
  ],
  complexPlanePosition: {
    real: 0.9,
    imaginary: -0.1,
    magnitude: Math.sqrt(0.81 + 0.01),
    angle: Math.atan2(-0.1, 0.9),
  },
};
