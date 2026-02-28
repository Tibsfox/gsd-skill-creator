/**
 * Module 1: The Circuit -- Lab exercises
 *
 * 5 labs backed by real MNA dcAnalysis simulation.
 * Each lab demonstrates a fundamental circuit concept with
 * hands-on simulation and a verify() function that checks
 * expected values against MNA results.
 */

import { dcAnalysis } from '../../simulator/mna-engine.js';
import type { Component, Resistor, VoltageSource } from '../../simulator/components.js';

export interface LabStep {
  instruction: string;
  expected_observation: string;
  learn_note: string;
}

export interface Lab {
  id: string;
  title: string;
  steps: LabStep[];
  verify: () => boolean;
}

// ============================================================================
// Helper: check if two values are within a relative tolerance
// ============================================================================

function withinTolerance(actual: number, expected: number, toleranceFraction: number): boolean {
  if (expected === 0) return Math.abs(actual) < toleranceFraction;
  return Math.abs(actual - expected) / Math.abs(expected) < toleranceFraction;
}

// ============================================================================
// Lab 1: First Circuit (m1-lab-01)
// ============================================================================

const lab01: Lab = {
  id: 'm1-lab-01',
  title: 'First Circuit',
  steps: [
    {
      instruction: 'Connect a 9V battery (voltage source V1) between node 1 (+) and node 0 (ground). Add a 1k ohm resistor R1 between node 1 and node 0. This is the simplest possible circuit: one source, one load.',
      expected_observation: 'The simulator shows node 1 at 9V. Current flows from the battery through the resistor and back.',
      learn_note: 'Every circuit needs a complete loop -- current must flow out of the source, through the load, and back to the source. No loop, no current.',
    },
    {
      instruction: 'Run dcAnalysis on the circuit. Look at the branch current through V1.',
      expected_observation: 'The current is 9mA (0.009A). This is V/R = 9V / 1000 ohm = 0.009A.',
      learn_note: 'Ohm\'s law in action: I = V/R. The voltage pushes current through the resistance. Higher voltage or lower resistance means more current.',
    },
    {
      instruction: 'Calculate the power dissipated by R1: P = V * I = 9V * 9mA = 81mW.',
      expected_observation: 'The resistor dissipates 81 milliwatts as heat. This is the electrical energy converted to thermal energy every second.',
      learn_note: 'Power tells you how much energy a component uses per second. A 1k resistor at 9V barely gets warm (81mW), but the same formula scales to dangerous levels at higher voltages.',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 9 } as VoltageSource,
      { id: 'R1', type: 'resistor', nodes: ['1', '0'], resistance: 1000 } as Resistor,
    ];
    const result = dcAnalysis(components);
    const branchCurrent = result.branchCurrents.find((bc) => bc.branch === 'V1');
    if (!branchCurrent) return false;
    const current = Math.abs(branchCurrent.current);
    const expected = 9 / 1000; // 9mA
    return withinTolerance(current, expected, 0.01);
  },
};

// ============================================================================
// Lab 2: Ohm's Law Explorer (m1-lab-02)
// ============================================================================

const lab02: Lab = {
  id: 'm1-lab-02',
  title: "Ohm's Law Explorer",
  steps: [
    {
      instruction: 'Build a circuit with a 12V source and a 1k ohm resistor. Run dcAnalysis and note the current.',
      expected_observation: 'Current = 12V / 1000 ohm = 12mA. The ammeter reads 0.012A.',
      learn_note: 'With a fixed voltage, the current depends entirely on the resistance. This is the starting point for Ohm\'s law: I = V/R.',
    },
    {
      instruction: 'Replace R1 with a 2k ohm resistor, keeping the same 12V source. Run dcAnalysis again.',
      expected_observation: 'Current = 12V / 2000 ohm = 6mA. Doubling the resistance halved the current.',
      learn_note: 'Current is inversely proportional to resistance. If you double R, you halve I. This is the core insight of Ohm\'s law.',
    },
    {
      instruction: 'Replace R1 with a 4k ohm resistor. Run dcAnalysis a third time.',
      expected_observation: 'Current = 12V / 4000 ohm = 3mA. Four times the resistance gives one quarter the original current.',
      learn_note: 'The pattern is clear: at fixed voltage, I = V/R is a linear relationship between current and conductance (1/R). This relationship holds for all resistive components.',
    },
    {
      instruction: 'Compare all three measurements: 12mA, 6mA, 3mA. Plot mentally: current vs. 1/R is a straight line through the origin.',
      expected_observation: 'The three points form a perfect linear relationship. The slope of the line is the voltage (12V).',
      learn_note: 'Ohm\'s law is not just a formula -- it is the defining property of a resistor. Components that obey V=IR are called "ohmic." Real-world resistors are ohmic over a wide range.',
    },
  ],
  verify: () => {
    const resistances = [1000, 2000, 4000];
    const expectedCurrents = [0.012, 0.006, 0.003];

    for (let i = 0; i < resistances.length; i++) {
      const components: Component[] = [
        { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 12 } as VoltageSource,
        { id: 'R1', type: 'resistor', nodes: ['1', '0'], resistance: resistances[i] } as Resistor,
      ];
      const result = dcAnalysis(components);
      const branchCurrent = result.branchCurrents.find((bc) => bc.branch === 'V1');
      if (!branchCurrent) return false;
      const current = Math.abs(branchCurrent.current);
      if (!withinTolerance(current, expectedCurrents[i], 0.01)) return false;
    }
    return true;
  },
};

// ============================================================================
// Lab 3: Voltage Divider (m1-lab-03)
// ============================================================================

const lab03: Lab = {
  id: 'm1-lab-03',
  title: 'Voltage Divider',
  steps: [
    {
      instruction: 'Build a series circuit: 10V source (nodes 1 to 0), R1=2k ohm (nodes 1 to 2), R2=1k ohm (nodes 2 to 0). Measure the voltage at node 2.',
      expected_observation: 'V(2) = 3.333V. The 10V input has been divided down to one-third.',
      learn_note: 'A voltage divider splits the input voltage according to the resistance ratio. V_out = V_in * R2 / (R1 + R2). With R1=2k and R2=1k, the ratio is 1/3.',
    },
    {
      instruction: 'Verify the formula: V_out = 10V * 1000/(2000+1000) = 10V * 1/3 = 3.333V. Compare with the MNA result.',
      expected_observation: 'The MNA result matches the formula exactly (within numerical precision). The formula works because R1 and R2 carry the same current (series circuit).',
      learn_note: 'The voltage divider formula assumes no load -- nothing else connected to the output node. Loading the output with a low-resistance path changes the division ratio.',
    },
    {
      instruction: 'Calculate the current: I = V_in / (R1+R2) = 10V / 3000 ohm = 3.333mA. Verify that V_R1 = I * R1 = 6.667V and V_R2 = I * R2 = 3.333V.',
      expected_observation: 'V_R1 + V_R2 = 6.667 + 3.333 = 10V, which equals the source voltage. KVL is satisfied around the loop.',
      learn_note: 'The voltage divider is the most common subcircuit in all of electronics. It appears in biasing networks, sensor interfaces, feedback paths, and signal conditioning.',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 10 } as VoltageSource,
      { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 2000 } as Resistor,
      { id: 'R2', type: 'resistor', nodes: ['2', '0'], resistance: 1000 } as Resistor,
    ];
    const result = dcAnalysis(components);
    const v2 = result.nodeVoltages.find((nv) => nv.node === '2');
    if (!v2) return false;
    const expected = 10 * 1000 / (2000 + 1000); // 3.3333...
    return withinTolerance(v2.voltage, expected, 0.001); // 0.1% tolerance
  },
};

// ============================================================================
// Lab 4: Kirchhoff's Laws (m1-lab-04)
// ============================================================================

const lab04: Lab = {
  id: 'm1-lab-04',
  title: "Kirchhoff's Laws",
  steps: [
    {
      instruction: 'Build this circuit: 12V source (nodes 1 to 0), R1=1k ohm (nodes 1 to 2), R2=2k ohm (nodes 2 to 0), R3=2k ohm (nodes 2 to 0). R2 and R3 are in parallel. Run dcAnalysis.',
      expected_observation: 'V(1) = 12V (source node), V(2) = 6V (junction node). The parallel combination of R2||R3 = 1k ohm, making the total resistance 2k ohm.',
      learn_note: 'When two resistors share the same two nodes, they are in parallel. R_parallel = R2*R3/(R2+R3) = 2k*2k/(2k+2k) = 1k ohm.',
    },
    {
      instruction: 'Verify KVL: the voltage drops around the loop must sum to zero. V_source - V_R1 - V(2) = 12 - 6 - 6 = 0.',
      expected_observation: 'KVL check passes: 12V - 6V - 6V = 0V. The sum of voltage rises equals the sum of voltage drops around any closed loop.',
      learn_note: 'Kirchhoff\'s Voltage Law (KVL): the algebraic sum of all voltages around any closed loop is zero. This is conservation of energy -- a charge that traverses a loop returns to its starting potential.',
    },
    {
      instruction: 'Verify KCL at node 2: total current in = total current out. I_R1 = 6mA flows in, I_R2 = 3mA and I_R3 = 3mA flow out. 6mA = 3mA + 3mA.',
      expected_observation: 'KCL check passes: current into node 2 equals current out of node 2. The 6mA from R1 splits equally between R2 and R3 (both 2k ohm).',
      learn_note: 'Kirchhoff\'s Current Law (KCL): the algebraic sum of all currents entering any node is zero. This is conservation of charge -- charge cannot accumulate at a node.',
    },
    {
      instruction: 'Change R3 to 4k ohm and re-run. Now the current split is unequal: I_R2 = 4mA, I_R3 = 2mA, I_total = 6mA... wait, does the total change?',
      expected_observation: 'Yes, the total changes because R2||R3 changes. With R2=2k, R3=4k: R_par = 2k*4k/(2k+4k) = 1.333k. Total R = 2.333k. I_total = 5.14mA.',
      learn_note: 'Changing any resistance in the network affects currents everywhere. KCL still holds at every node, but all the individual currents shift to maintain the balance.',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 12 } as VoltageSource,
      { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 1000 } as Resistor,
      { id: 'R2', type: 'resistor', nodes: ['2', '0'], resistance: 2000 } as Resistor,
      { id: 'R3', type: 'resistor', nodes: ['2', '0'], resistance: 2000 } as Resistor,
    ];
    const result = dcAnalysis(components);

    // Check V(2) = 6V (R2||R3 = 1k, total R = 2k, V(2) = 12 * 1k/2k = 6V)
    const v2 = result.nodeVoltages.find((nv) => nv.node === '2');
    if (!v2) return false;
    if (!withinTolerance(v2.voltage, 6, 0.01)) return false;

    // Check KVL: V(1) - V_R1 - V(2) = 0 => V(1) = 12, V_R1 = V(1) - V(2) = 6
    const v1 = result.nodeVoltages.find((nv) => nv.node === '1');
    if (!v1) return false;
    const vR1 = v1.voltage - v2.voltage;
    const kvlSum = vR1 + v2.voltage - 12; // should be 0
    if (Math.abs(kvlSum) > 0.01) return false;

    // Check KCL at node 2: I_R1 = I_R2 + I_R3
    // I_R1 = (V1-V2)/R1 = 6/1000 = 6mA
    // I_R2 = V2/R2 = 6/2000 = 3mA
    // I_R3 = V2/R3 = 6/2000 = 3mA
    const iR1 = (v1.voltage - v2.voltage) / 1000;
    const iR2 = v2.voltage / 2000;
    const iR3 = v2.voltage / 2000;
    const kclBalance = Math.abs(iR1 - iR2 - iR3);
    if (kclBalance > 0.0001) return false;

    return true;
  },
};

// ============================================================================
// Lab 5: Power and Heat (m1-lab-05)
// ============================================================================

const lab05: Lab = {
  id: 'm1-lab-05',
  title: 'Power and Heat',
  steps: [
    {
      instruction: 'Build a simple circuit: 5V source (nodes 1 to 0), R1=100 ohm (nodes 1 to 0). Run dcAnalysis and note the voltage and current.',
      expected_observation: 'V(1) = 5V, I = 5V / 100 ohm = 50mA (0.05A). The resistor carries significant current due to its low resistance.',
      learn_note: 'Lower resistance means higher current at the same voltage. A 100-ohm resistor draws 50 times more current than a 10k-ohm resistor at 5V.',
    },
    {
      instruction: 'Calculate power three ways: P = V*I = 5 * 0.05 = 0.25W. P = I^2*R = 0.0025 * 100 = 0.25W. P = V^2/R = 25/100 = 0.25W.',
      expected_observation: 'All three formulas give the same answer: 0.25W (250mW). This is expected because they are algebraically equivalent via Ohm\'s law.',
      learn_note: 'The three power formulas are interchangeable: P=VI, P=I^2R, P=V^2/R. Use whichever is most convenient for the quantities you know. They all yield the same result.',
    },
    {
      instruction: 'Consider the thermal implications: 0.25W in a small resistor. A standard 1/4W (0.25W) resistor is rated for exactly this power. Operating at maximum rating means the resistor runs hot.',
      expected_observation: 'The power dissipation exactly matches the resistor rating. In practice, you would choose a 1/2W resistor for margin, or use a higher resistance to reduce current.',
      learn_note: 'Every resistor has a power rating. Exceeding it causes overheating, resistance drift, and eventually failure. Good design uses components at 50-70% of their rating.',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 5 } as VoltageSource,
      { id: 'R1', type: 'resistor', nodes: ['1', '0'], resistance: 100 } as Resistor,
    ];
    const result = dcAnalysis(components);

    const v1 = result.nodeVoltages.find((nv) => nv.node === '1');
    if (!v1) return false;
    const voltage = v1.voltage;

    const branchCurrent = result.branchCurrents.find((bc) => bc.branch === 'V1');
    if (!branchCurrent) return false;
    const current = Math.abs(branchCurrent.current);

    const expected = 0.25;

    // P = V * I
    const pVI = voltage * current;
    if (!withinTolerance(pVI, expected, 0.01)) return false;

    // P = I^2 * R
    const pI2R = current * current * 100;
    if (!withinTolerance(pI2R, expected, 0.01)) return false;

    // P = V^2 / R
    const pV2R = voltage * voltage / 100;
    if (!withinTolerance(pV2R, expected, 0.01)) return false;

    return true;
  },
};

// ============================================================================
// Export all labs
// ============================================================================

export const labs: Lab[] = [lab01, lab02, lab03, lab04, lab05];
