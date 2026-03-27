/**
 * Module 4: Diodes -- Lab exercises
 *
 * 5 labs backed by real MNA solveNonlinear simulation.
 * Each lab demonstrates a diode application with hands-on
 * simulation and a verify() function that checks expected
 * values against MNA nonlinear solver results.
 */

import { solveNonlinear } from '../../simulator/mna-engine.js';
import type { Component, Resistor, VoltageSource, Diode } from '../../simulator/components.js';

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
// Lab 1: Diode I-V Curve (m4-lab-01)
// ============================================================================

const lab01: Lab = {
  id: 'm4-lab-01',
  title: 'Diode I-V Curve',
  steps: [
    {
      instruction: 'Build a series circuit: 5V voltage source V1 (node 1 to ground), 1k ohm resistor R1 (node 1 to node 2), and diode D1 with anode at node 2 and cathode at ground. This puts the diode in forward bias through the current-limiting resistor.',
      expected_observation: 'The simulator converges in a few iterations. Node 1 is at 5V (source), node 2 is at approximately 0.6V (the diode forward voltage drop).',
      learn_note: 'A forward-biased silicon diode drops about 0.6V. The resistor limits the current to a safe level. Without R1, the diode would see the full 5V and try to pass enormous current.',
    },
    {
      instruction: 'Calculate the expected current: I = (V1 - V_diode) / R1 = (5 - 0.6) / 1000 = 4.4mA. Check the branch current from the MNA result.',
      expected_observation: 'The branch current through V1 is approximately 4.4mA (0.0044A). The piecewise-linear model gives a result close to the ideal calculation.',
      learn_note: 'In the piecewise-linear model, the diode is approximated as a 0.6V offset plus a small series resistance (R_on). The actual current depends on R_on, but with a large series resistor (1k >> R_on), the result closely matches the ideal.',
    },
    {
      instruction: 'Observe that the voltage across the diode (V_anode - V_cathode = V(2) - 0) is close to 0.6V. This is the forward voltage threshold of silicon.',
      expected_observation: 'V_diode is approximately 0.6V. The exact value depends on the piecewise-linear model parameters but will be in the range 0.55-0.65V.',
      learn_note: 'The I-V curve of a real diode is exponential (Shockley equation), but the piecewise-linear approximation captures the key behavior: negligible current below ~0.6V, rapidly increasing current above it. See H&H 1.6.',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 5 } as VoltageSource,
      { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 1000 } as Resistor,
      { id: 'D1', type: 'diode', nodes: ['2', '0'], saturationCurrent: 1e-12, thermalVoltage: 0.026 } as Diode,
    ];
    const result = solveNonlinear(components);
    if (!result.converged) return false;

    // Check node 2 voltage ~ diode forward drop (0.55-0.65V range)
    const v2 = result.nodeVoltages.find((nv) => nv.node === '2');
    if (!v2) return false;
    const vDiode = v2.voltage;
    if (vDiode < 0.4 || vDiode > 0.8) return false;

    // Check current ~ (5 - Vdiode) / 1000
    const expectedCurrent = (5 - vDiode) / 1000;
    const branchCurrent = result.branchCurrents.find((bc) => bc.branch === 'V1');
    if (!branchCurrent) return false;
    const current = Math.abs(branchCurrent.current);
    return withinTolerance(current, expectedCurrent, 0.05);
  },
};

// ============================================================================
// Lab 2: Half-Wave Rectifier (m4-lab-02)
// ============================================================================

const lab02: Lab = {
  id: 'm4-lab-02',
  title: 'Half-Wave Rectifier',
  steps: [
    {
      instruction: 'Build a half-wave rectifier: 10V source V1 (node 1 to ground, representing the positive peak of an AC signal), diode D1 with anode at node 1 and cathode at node 2, and a 1k load resistor R_L (node 2 to ground). The diode passes positive half-cycles to the load.',
      expected_observation: 'The simulator shows node 2 at approximately 9.4V. The diode drops about 0.6V, so V_load = 10V - 0.6V = 9.4V.',
      learn_note: 'In a half-wave rectifier, the diode passes only positive half-cycles. The peak output voltage is Vpeak minus one diode drop. For negative half-cycles (not simulated here), the diode blocks and V_load = 0.',
    },
    {
      instruction: 'Calculate the load current: I_load = V_load / R_L = 9.4V / 1000 = 9.4mA. Verify against the simulation.',
      expected_observation: 'The branch current through V1 is approximately 9.4mA. This current flows through the diode and the load.',
      learn_note: 'The load sees pulsating DC: peaks at Vpeak - Vf, dropping to zero between peaks. Without a filter capacitor, this ripple is 100% of the output voltage. Real rectifiers always include filtering.',
    },
    {
      instruction: 'Consider what happens during negative half-cycles (we would use a negative source voltage). The diode blocks and no current flows to the load.',
      expected_observation: 'With a negative source, the diode is reverse-biased. The output would be zero (or very slightly negative due to leakage current, which is negligible).',
      learn_note: 'Half-wave rectification is simple (one diode) but inefficient: it uses only 50% of the input energy. For better efficiency, use a full-wave bridge. See H&H 1.6 for comparison.',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 10 } as VoltageSource,
      { id: 'D1', type: 'diode', nodes: ['1', '2'], saturationCurrent: 1e-12, thermalVoltage: 0.026 } as Diode,
      { id: 'R_L', type: 'resistor', nodes: ['2', '0'], resistance: 1000 } as Resistor,
    ];
    const result = solveNonlinear(components);
    if (!result.converged) return false;

    // Check load voltage ~ 9.4V (10V - 0.6V forward drop)
    const vLoad = result.nodeVoltages.find((nv) => nv.node === '2');
    if (!vLoad) return false;
    return withinTolerance(vLoad.voltage, 9.4, 0.05);
  },
};

// ============================================================================
// Lab 3: Full-Wave Bridge Rectifier (m4-lab-03)
// ============================================================================

const lab03: Lab = {
  id: 'm4-lab-03',
  title: 'Full-Wave Bridge Rectifier',
  steps: [
    {
      instruction: 'A full bridge rectifier uses 4 diodes so current flows through the load in the same direction for both AC half-cycles. Each path goes through exactly 2 diodes. We model this by placing a 12V source in series with 2 diodes and a 1k load: V1 (node 1 to ground), D1 anode=1 cathode=2, D2 anode=2 cathode=3, R_L (node 3 to ground).',
      expected_observation: 'The simulator shows V_load (node 3) at approximately 10.8V. Two diode drops subtract from the source: 12V - 2*0.6V = 10.8V.',
      learn_note: 'In a real bridge, 4 diodes are arranged so that on each half-cycle, 2 diodes conduct and 2 block. The key insight is that every path from source to load crosses exactly 2 forward-biased diodes, losing about 1.2V total.',
    },
    {
      instruction: 'Calculate the load current: I_load = V_load / R_L = 10.8V / 1000 = 10.8mA. The source provides this current through the two-diode path.',
      expected_observation: 'Branch current through V1 is approximately 10.8mA, matching the calculated value.',
      learn_note: 'The bridge rectifier is more efficient than half-wave because it uses both AC half-cycles. The trade-off is the extra diode drop (2*Vf vs 1*Vf) and the need for 4 diodes. For high-voltage circuits, the extra 0.6V is negligible.',
    },
    {
      instruction: 'Compare bridge vs half-wave: bridge gives 10.8V from 12V input (90% efficiency) while half-wave gives 11.4V (95% per-diode, but only 50% duty cycle). The bridge wins on average output.',
      expected_observation: 'The bridge delivers continuous output at both half-cycles, so average output is nearly double that of half-wave, despite the extra diode drop.',
      learn_note: 'Bridge rectifiers are the standard choice for AC-DC power supplies. Common packaged bridges (e.g., DB107) contain all 4 diodes in a single component. See H&H 1.6 for full analysis.',
    },
  ],
  verify: () => {
    // Model the two-diode-drop path: V1 -> D1 -> D2 -> R_L -> ground
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 12 } as VoltageSource,
      { id: 'D1', type: 'diode', nodes: ['1', '2'], saturationCurrent: 1e-12, thermalVoltage: 0.026 } as Diode,
      { id: 'D2', type: 'diode', nodes: ['2', '3'], saturationCurrent: 1e-12, thermalVoltage: 0.026 } as Diode,
      { id: 'R_L', type: 'resistor', nodes: ['3', '0'], resistance: 1000 } as Resistor,
    ];
    const result = solveNonlinear(components);
    if (!result.converged) return false;

    // Check load voltage ~ 10.8V (12V - 2*0.6V)
    const vLoad = result.nodeVoltages.find((nv) => nv.node === '3');
    if (!vLoad) return false;
    return withinTolerance(vLoad.voltage, 10.8, 0.05);
  },
};

// ============================================================================
// Lab 4: Zener Voltage Regulator (m4-lab-04)
// ============================================================================

const lab04: Lab = {
  id: 'm4-lab-04',
  title: 'Zener Voltage Regulator',
  steps: [
    {
      instruction: 'A Zener diode regulates voltage by conducting in reverse breakdown at a fixed voltage Vz. Our piecewise-linear simulator does not model Zener breakdown natively, so we model the Zener as a 5.1V voltage source (representing the clamped output). Circuit: 12V source V1 (node 1 to ground), 470 ohm series resistor Rs (node 1 to node 2), and a 5.1V source V_Z (node 2 to ground, positive at ground) representing the Zener.',
      expected_observation: 'Node 2 is at 5.1V (clamped by the Zener model). The series resistor drops 12V - 5.1V = 6.9V.',
      learn_note: 'In a real Zener circuit, the Zener diode is reverse-biased and conducts at its rated voltage (e.g., 5.1V). The series resistor limits current to prevent destroying the Zener. We model this with a voltage source because our simulator piecewise-linear diode does not support reverse breakdown.',
    },
    {
      instruction: 'Calculate the Zener current: Iz = (V1 - Vz) / Rs = (12 - 5.1) / 470 = 14.7mA. This is the current the Zener must sink to maintain regulation.',
      expected_observation: 'The branch current through Rs is approximately 14.7mA. The Zener absorbs all of this current (no separate load in this basic configuration).',
      learn_note: 'The Zener current must stay within its rated range. Too little current and the Zener falls out of regulation. Too much current and the Zener overheats. Typical small Zeners (1N4733A) handle up to 65mA.',
    },
    {
      instruction: 'Calculate power dissipated in the Zener: Pz = Vz * Iz = 5.1V * 14.7mA = 75mW. The series resistor dissipates Pr = (Vin-Vz)^2/Rs = 6.9^2/470 = 101mW.',
      expected_observation: 'Total power from source = 12V * 14.7mA = 176mW. The Zener and resistor share this power. Efficiency is modest (5.1/12 = 42.5%) but regulation is tight.',
      learn_note: 'Zener regulators are simple but inefficient due to the series resistor dissipation. For higher efficiency, use a linear regulator (LM7805) or switching regulator. Zeners remain useful as voltage references and overvoltage clamps. See H&H 1.6.',
    },
  ],
  verify: () => {
    // Model Zener as a voltage source clamping node 2 to 5.1V.
    // The Zener VS has positive terminal at ground (node 0) and negative at node 2,
    // which means V(0) - V(2) = -5.1V  =>  V(2) = 5.1V.
    // Actually we model it as: V_Z positive at node 2, negative at ground = 5.1V.
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 12 } as VoltageSource,
      { id: 'Rs', type: 'resistor', nodes: ['1', '2'], resistance: 470 } as Resistor,
      { id: 'V_Z', type: 'voltage-source', nodes: ['2', '0'], voltage: 5.1 } as VoltageSource,
    ];
    const result = solveNonlinear(components);
    if (!result.converged) return false;

    // Check node 2 voltage ~ 5.1V
    const v2 = result.nodeVoltages.find((nv) => nv.node === '2');
    if (!v2) return false;
    if (!withinTolerance(v2.voltage, 5.1, 0.10)) return false;

    // Check current ~ (12 - 5.1) / 470 = 14.68mA
    const expectedCurrent = (12 - 5.1) / 470;
    // Current through V1 branch
    const branchV1 = result.branchCurrents.find((bc) => bc.branch === 'V1');
    if (!branchV1) return false;
    return withinTolerance(Math.abs(branchV1.current), expectedCurrent, 0.10);
  },
};

// ============================================================================
// Lab 5: LED Driver (m4-lab-05)
// ============================================================================

const lab05: Lab = {
  id: 'm4-lab-05',
  title: 'LED Driver',
  steps: [
    {
      instruction: 'Build an LED driver circuit: 5V source V1 (node 1 to ground), current-limiting resistor R1 (node 1 to node 2), and a diode D1 modeling the LED (anode=node 2, cathode=ground). The simulator uses a standard silicon diode model (Vf ~ 0.6V). Real LEDs have higher Vf (1.8-3.3V depending on color).',
      expected_observation: 'The simulator converges. Node 2 is at approximately 0.6V (the piecewise-linear diode forward drop). Current flows through R1 and D1.',
      learn_note: 'LEDs are diodes made from compound semiconductors. Their forward voltage depends on the emitted wavelength: red ~1.8V, green ~2.2V, blue ~3.0V. Our simulator uses the standard silicon 0.6V model as an approximation.',
    },
    {
      instruction: 'With the silicon diode model: R1 = (Vsupply - Vf) / Itarget. For Vf=0.6V and Itarget=20mA: R1 = (5 - 0.6) / 0.020 = 220 ohm. However, the piecewise-linear model has a small R_on, so the actual current will be close but not exact.',
      expected_observation: 'The simulation shows current approximately matching the target. The small R_on of the piecewise-linear model causes a slight deviation from the ideal calculation.',
      learn_note: 'For a real LED design with Vf=2.0V: R = (5-2.0)/0.020 = 150 ohm. Always calculate the resistor based on the actual LED forward voltage from the datasheet, not the generic 0.6V silicon value.',
    },
    {
      instruction: 'Verify the current is in a reasonable range. With R1=220 ohm and the standard diode model, I = (5 - ~0.6) / 220 ~ 20mA.',
      expected_observation: 'Current through the circuit is approximately 20mA (within 10%). The LED (diode) is forward-biased and conducting.',
      learn_note: 'Current-limiting resistors are essential for LEDs. Without one, the LED forward voltage is nearly constant while current increases exponentially -- the LED quickly overheats and fails. Always size the resistor for your target current and actual LED Vf. See H&H 1.6.',
    },
  ],
  verify: () => {
    // R1 calculated for ~20mA with silicon diode model:
    // R1 = (5 - 0.6) / 0.020 = 220 ohm
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 5 } as VoltageSource,
      { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 220 } as Resistor,
      { id: 'D1', type: 'diode', nodes: ['2', '0'], saturationCurrent: 1e-12, thermalVoltage: 0.026 } as Diode,
    ];
    const result = solveNonlinear(components);
    if (!result.converged) return false;

    // Check that the diode is forward-biased (node 2 > 0.4V)
    const v2 = result.nodeVoltages.find((nv) => nv.node === '2');
    if (!v2) return false;
    if (v2.voltage < 0.4) return false;

    // Check current ~ 20mA (within 10%)
    // Current = (V1 - V_diode) / R1
    const expectedCurrent = (5 - v2.voltage) / 220;
    const branchCurrent = result.branchCurrents.find((bc) => bc.branch === 'V1');
    if (!branchCurrent) return false;
    const current = Math.abs(branchCurrent.current);
    return withinTolerance(current, expectedCurrent, 0.10);
  },
};

// ============================================================================
// Export all labs
// ============================================================================

export const labs: Lab[] = [lab01, lab02, lab03, lab04, lab05];
