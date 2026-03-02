import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const signalPropagation: RosettaConcept = {
  id: 'spatial-signal-propagation',
  name: 'Redstone Signal Propagation',
  domain: 'spatial-computing',
  description:
    'Redstone signal has strength 0-15: a power source outputs 15. Each block of redstone dust ' +
    'the signal travels through reduces strength by 1. After 15 blocks, the signal dies. ' +
    'Repeaters restore signal to full strength 15 and allow signals to travel unlimited distances. ' +
    'Solid blocks can be "powered" (full power) or "quasi-powered" (via adjacent dust). ' +
    'Signal goes through: dust can connect to blocks on the same level, one level up, or one level down. ' +
    'Redstone torches invert signal: they output strength 15 when the block they are attached to ' +
    'is NOT powered, and output 0 when it IS powered. Comparators output the difference between ' +
    'two inputs (subtraction mode) or pass the maximum of two inputs (compare mode). ' +
    'Pistons extend when powered and can push up to 12 blocks; sticky pistons also retract. ' +
    'Dust connects to other dust in a cross pattern (+) by default; T-junctions can be forced ' +
    'by right-clicking a dust block to restrict connections.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'spatial-logic-gates-redstone',
      description: 'Gate reliability depends on signal strength reaching all inputs with sufficient strength',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-signal-ac-analysis',
      description: 'Signal attenuation over distance is conceptually similar to electrical signal loss in long wire runs',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.42,
    magnitude: Math.sqrt(0.65 ** 2 + 0.42 ** 2),
    angle: Math.atan2(0.42, 0.65),
  },
};
