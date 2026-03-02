import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const circuitTypes: RosettaConcept = {
  id: 'trade-circuit-types',
  name: 'Circuit Types',
  domain: 'trades',
  description:
    'Residential wiring uses series, parallel, and combination circuits with distinct behavioral ' +
    'properties. Series circuits: components connected end-to-end in a single path; current is ' +
    'the same throughout; voltages add up; one failure opens the entire circuit (older Christmas ' +
    'lights, fuses). Parallel circuits: components share the same two nodes; voltage is the same ' +
    'across each branch; currents add; one branch failure doesn\'t affect others — standard ' +
    'household outlets are wired in parallel. Combination circuits mix both configurations. ' +
    'Three-way switches (for staircase lighting) use travelers to allow switching from two ' +
    'locations. GFCI (Ground Fault Circuit Interrupter) outlets detect current imbalance between ' +
    'hot and neutral (indicating ground fault) and trip in milliseconds — required in wet areas ' +
    '(kitchen, bathroom, exterior). AFCI (Arc Fault Circuit Interrupter) breakers detect ' +
    'dangerous arcing from damaged wiring. Understanding circuit topology allows electricians ' +
    'to diagnose faults, add circuits correctly, and verify load distribution.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'trade-electrical-basics',
      description: 'Circuit types build on the foundational electrical concepts of voltage, current, and resistance',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
