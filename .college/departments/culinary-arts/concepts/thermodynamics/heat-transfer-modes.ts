import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const heatTransferModes: RosettaConcept = {
  id: 'cook-heat-transfer-modes',
  name: 'Heat Transfer Modes',
  domain: 'culinary-arts',
  description: 'Three modes of heat transfer govern all cooking: conduction (direct contact -- ' +
    'cast iron searing, griddle cooking), convection (fluid motion -- oven roasting uses air ' +
    'convection, deep frying uses oil convection, boiling uses water convection), and radiation ' +
    '(electromagnetic waves -- broiling, grilling, toasting). Thermal conductivity varies by ' +
    'cookware material: copper (401 W/mK) > aluminum (237) > cast iron (80) > stainless steel ' +
    '(16). Higher conductivity means faster, more even heat distribution. Most cooking methods ' +
    'combine multiple modes -- oven roasting uses radiation from walls plus convection from ' +
    'circulating air.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cook-specific-heat-capacity',
      description: 'How quickly a substance heats depends on both transfer mode and its specific heat capacity',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-maillard-reaction',
      description: 'Dry heat transfer modes (conduction, radiation) enable surface temperatures for Maillard browning',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
