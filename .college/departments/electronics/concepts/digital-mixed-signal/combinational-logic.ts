import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const combinationalLogic: RosettaConcept = {
  id: 'elec-combinational-logic',
  name: 'Combinational Logic',
  domain: 'electronics',
  description:
    'Boolean algebra uses AND (multiplication), OR (addition), and NOT (complement) operations. ' +
    'De Morgan\'s theorem: NOT(A AND B) = (NOT A) OR (NOT B); NOT(A OR B) = (NOT A) AND (NOT B). ' +
    'CMOS logic uses complementary n-type and p-type MOSFET pairs -- high input turns on NMOS and ' +
    'turns off PMOS, pulling output low; low input is the inverse. NAND and NOR are universal gates -- ' +
    'any Boolean function can be implemented with NAND gates alone. Karnaugh maps (K-maps) minimize ' +
    'Boolean expressions by grouping 1s in 2^n rectangular groups. Sum of products (SOP) and product ' +
    'of sums (POS) are standard canonical forms. Propagation delay limits maximum clock frequency; ' +
    'fan-out limits how many gate inputs one output can drive.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'spatial-logic-gates-redstone',
      description: 'Minecraft redstone implements the same Boolean algebra as electronic CMOS logic gates',
    },
    {
      type: 'dependency',
      targetId: 'elec-sequential-logic-design',
      description: 'Combinational logic feeds the next-state logic in sequential circuits and state machines',
    },
  ],
  complexPlanePosition: {
    real: 0.50,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.50 ** 2 + 0.55 ** 2),
    angle: Math.atan2(0.55, 0.50),
  },
};
