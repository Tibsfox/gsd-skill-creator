import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const logicGatesRedstone: RosettaConcept = {
  id: 'spatial-logic-gates-redstone',
  name: 'Logic Gates via Redstone',
  domain: 'spatial-computing',
  description:
    'AND gates require two inputs powering the same output wire. OR gates use parallel redstone paths. ' +
    'NOT gates use a torch that inverts power -- active input extinguishes the torch output. ' +
    'NAND gates combine NOT with AND using a torch on the output. Comparators in subtraction mode ' +
    'implement XOR equivalents. Physical construction: redstone dust on solid blocks carries signal; ' +
    'a redstone torch placed on the side or top of a block outputs signal when the block is NOT powered. ' +
    'Two-input AND gate: place both input lines to power a single solid block, then attach output ' +
    'dust -- the block must receive power from BOTH sides simultaneously. Inputs can come from levers ' +
    '(latching), buttons (momentary), pressure plates (automatic), or other circuit outputs. ' +
    'NAND is the universal gate: any Boolean function can be built with NAND gates alone.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'elec-combinational-logic',
      description: 'Redstone implements the same Boolean algebra as electronic CMOS logic gates',
    },
    {
      type: 'dependency',
      targetId: 'spatial-signal-propagation',
      description: 'Gate construction requires understanding signal strength rules for reliable operation',
    },
  ],
  complexPlanePosition: {
    real: 0.60,
    imaginary: 0.50,
    magnitude: Math.sqrt(0.60 ** 2 + 0.50 ** 2),
    angle: Math.atan2(0.50, 0.60),
  },
};
