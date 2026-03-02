import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const powerTools: RosettaConcept = {
  id: 'tech-power-tools',
  name: 'Power Tools',
  domain: 'technology',
  description:
    'Power tools use electrical, pneumatic, or hydraulic energy to multiply the user\'s effectiveness. ' +
    'Types: rotary (drill, router, circular saw), reciprocating (jigsaw, reciprocating saw), and oscillating. ' +
    'Safety is paramount — rotating or reciprocating blades do not distinguish between wood and fingers. ' +
    'Safe power tool use requires: proper PPE, sharp blades (dull blades cause kickback), ' +
    'two-point workpiece securing, and understanding tool kickback scenarios.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'tech-hand-tools',
      description: 'Power tools extend hand tool capabilities — understanding hand tool principles transfers to power tools',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
