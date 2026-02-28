/**
 * Transient Analysis & Circuit File Format -- Test Suite
 *
 * TDD RED phase: comprehensive tests for Backward Euler transient analysis,
 * capacitor/inductor companion models, circuit save/load format, and
 * full round-trip simulation.
 *
 * Requirements: SIM-07, SIM-09
 */

import { describe, it, expect } from 'vitest';
import {
  stampCapacitorTransient,
  stampInductorTransient,
} from '../simulator/components.js';
import type {
  Resistor,
  Capacitor,
  Inductor,
  VoltageSource,
  Component,
  StampTarget,
} from '../simulator/components.js';
import type { StampLogEntry } from '../simulator/mna-engine.js';
import { buildMatrix, solve, dcAnalysis } from '../simulator/mna-engine.js';
import { transientAnalysis } from '../simulator/transient.js';
import type { BackwardEulerConfig } from '../simulator/transient.js';
import {
  saveCircuit,
  loadCircuit,
  circuitToComponents,
} from '../shared/circuit-format.js';
import type { CircuitDefinition, SavedCircuit } from '../shared/circuit-format.js';

// ============================================================================
// Helpers
// ============================================================================

function resistor(id: string, n1: string, n2: string, r: number): Resistor {
  return { id, type: 'resistor', nodes: [n1, n2], resistance: r };
}

function capacitor(id: string, n1: string, n2: string, c: number): Capacitor {
  return { id, type: 'capacitor', nodes: [n1, n2], capacitance: c };
}

function inductor(id: string, n1: string, n2: string, l: number): Inductor {
  return { id, type: 'inductor', nodes: [n1, n2], inductance: l };
}

function voltageSource(id: string, nPlus: string, nMinus: string, v: number): VoltageSource {
  return { id, type: 'voltage-source', nodes: [nPlus, nMinus], voltage: v };
}

/** Create a minimal StampTarget for testing individual stamp functions */
function createTarget(n: number, m: number): StampTarget {
  const size = n + m;
  const matrix: number[][] = [];
  for (let i = 0; i < size; i++) {
    matrix.push(new Array(size).fill(0));
  }
  const rhs = new Array(size).fill(0);
  const stampLog: StampLogEntry[] = [];

  // Simple nodeIndex: node "1" -> 0, node "2" -> 1, etc.; "0" -> -1 (ground)
  const nodeIndex = (node: string): number => {
    if (node === '0') return -1;
    const idx = parseInt(node, 10) - 1;
    return idx >= 0 && idx < n ? idx : -1;
  };

  const vsIndex = (_id: string): number => 0; // single VS at offset 0

  return { matrix, rhs, stampLog, nodeIndex, vsIndex, n };
}

// ============================================================================
// Group 1: Capacitor Companion Model (SIM-07)
// ============================================================================

describe('Capacitor Companion Model (SIM-07)', () => {
  it('Backward Euler companion: equivalent resistor has value dt/C', () => {
    // C = 1uF, dt = 1ms => R_eq = dt/C = 1e-3/1e-6 = 1000 Ohm
    // G_eq = 1/R_eq = 1/1000 = 0.001 S
    const target = createTarget(2, 0);
    const cap = capacitor('C1', '1', '2', 1e-6);
    const dt = 1e-3;
    const v_prev = 0; // initial voltage

    stampCapacitorTransient(target, cap, dt, v_prev);

    const g_eq = 1e-6 / 1e-3; // C/dt = conductance
    // Stamped like a resistor: G[0][0] += g_eq, G[1][1] += g_eq, G[0][1] -= g_eq, G[1][0] -= g_eq
    expect(target.matrix[0][0]).toBeCloseTo(g_eq, 10);
    expect(target.matrix[1][1]).toBeCloseTo(g_eq, 10);
    expect(target.matrix[0][1]).toBeCloseTo(-g_eq, 10);
    expect(target.matrix[1][0]).toBeCloseTo(-g_eq, 10);
  });

  it('Backward Euler companion: current source has value C * v_prev / dt', () => {
    // C = 1uF, dt = 1ms, v_prev = 3V => I_eq = C * v_prev / dt = 1e-6 * 3 / 1e-3 = 0.003 A
    const target = createTarget(2, 0);
    const cap = capacitor('C1', '1', '2', 1e-6);
    const dt = 1e-3;
    const v_prev = 3;

    stampCapacitorTransient(target, cap, dt, v_prev);

    const i_eq = 1e-6 * 3 / 1e-3; // 0.003 A
    // Current source from node 2 to node 1 (charging direction):
    // rhs[0] += i_eq (current enters node 1), rhs[1] -= i_eq (current leaves node 2)
    // Note: the resistor also contributes to rhs via the conductance, but the current source
    // part is I_eq. We check the full rhs which should contain the current source contribution.
    expect(target.rhs[0]).toBeCloseTo(i_eq, 10);
    expect(target.rhs[1]).toBeCloseTo(-i_eq, 10);
  });

  it('companion model stamps into MNA matrix correctly (resistor + current source pattern)', () => {
    // Verify that the capacitor companion follows the same stamp pattern as
    // a resistor (G matrix) plus a current source (RHS vector)
    const target = createTarget(1, 0); // single non-ground node
    const cap = capacitor('C1', '1', '0', 10e-6); // 10uF to ground
    const dt = 0.5e-3;
    const v_prev = 2.5;

    stampCapacitorTransient(target, cap, dt, v_prev);

    const g_eq = 10e-6 / 0.5e-3; // C/dt = 0.02 S
    const i_eq = 10e-6 * 2.5 / 0.5e-3; // 0.05 A

    // Node 1 is index 0, node "0" is ground (-1)
    // Only diagonal stamp for resistor-to-ground
    expect(target.matrix[0][0]).toBeCloseTo(g_eq, 10);
    // Current source into node 1
    expect(target.rhs[0]).toBeCloseTo(i_eq, 10);
  });
});

// ============================================================================
// Group 2: Inductor Companion Model (SIM-07)
// ============================================================================

describe('Inductor Companion Model (SIM-07)', () => {
  it('Backward Euler companion: equivalent resistor has value L/dt', () => {
    // L = 1mH, dt = 1us => R_eq = L/dt = 1e-3/1e-6 = 1000 Ohm
    // G_eq = 1/R_eq = dt/L = 1e-6/1e-3 = 0.001 S
    const target = createTarget(2, 0);
    const ind = inductor('L1', '1', '2', 1e-3);
    const dt = 1e-6;
    const i_prev = 0;

    stampInductorTransient(target, ind, dt, i_prev);

    const g_eq = dt / ind.inductance; // dt/L = conductance
    expect(target.matrix[0][0]).toBeCloseTo(g_eq, 10);
    expect(target.matrix[1][1]).toBeCloseTo(g_eq, 10);
    expect(target.matrix[0][1]).toBeCloseTo(-g_eq, 10);
    expect(target.matrix[1][0]).toBeCloseTo(-g_eq, 10);
  });

  it('Backward Euler companion: current source has value i_prev', () => {
    // L = 1mH, dt = 1us, i_prev = 0.005 A
    // Current source I_eq = i_prev = 0.005 A flowing from node 1 to node 2
    const target = createTarget(2, 0);
    const ind = inductor('L1', '1', '2', 1e-3);
    const dt = 1e-6;
    const i_prev = 0.005;

    stampInductorTransient(target, ind, dt, i_prev);

    // Current i_prev flows from node 1 to node 2:
    // rhs[0] -= i_prev (current leaves node 1), rhs[1] += i_prev (current enters node 2)
    expect(target.rhs[0]).toBeCloseTo(-i_prev, 10);
    expect(target.rhs[1]).toBeCloseTo(i_prev, 10);
  });

  it('companion model stamps into MNA matrix correctly', () => {
    const target = createTarget(1, 0); // inductor from node 1 to ground
    const ind = inductor('L1', '1', '0', 2e-3); // 2mH to ground
    const dt = 0.1e-3;
    const i_prev = 0.01;

    stampInductorTransient(target, ind, dt, i_prev);

    const g_eq = dt / ind.inductance; // 0.1e-3 / 2e-3 = 0.05 S
    expect(target.matrix[0][0]).toBeCloseTo(g_eq, 10);
    // Current source: i_prev leaves node 1 (to ground)
    expect(target.rhs[0]).toBeCloseTo(-i_prev, 10);
  });
});

// ============================================================================
// Group 3: Transient Analysis (SIM-07)
// ============================================================================

describe('Transient Analysis (SIM-07)', () => {
  it('RC step response: after 1 time constant, V_cap is ~63.2% of 5V', () => {
    // 5V source, R=1k, C=1uF. tau = R*C = 1ms.
    // At t=1ms, V_cap should be ~5*(1-exp(-1)) = ~3.16V
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 5),
      resistor('R1', 'in', 'cap', 1000),
      capacitor('C1', 'cap', '0', 1e-6),
    ];
    const config: BackwardEulerConfig = {
      timeStep: 10e-6,   // 10us steps for accuracy
      stopTime: 1e-3,    // 1ms = 1 tau
      maxIterations: 100,
      tolerance: 1e-9,
    };

    const result = transientAnalysis(components, config, '0');
    const lastPoint = result.timePoints[result.timePoints.length - 1];
    const vCap = lastPoint.nodeVoltages['cap'];

    // Should be within 5% of theoretical 3.16V
    expect(vCap).toBeGreaterThan(3.16 * 0.95);
    expect(vCap).toBeLessThan(3.16 * 1.05);
  });

  it('RC step response: after 5 time constants, V_cap is ~99.3% of 5V', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 5),
      resistor('R1', 'in', 'cap', 1000),
      capacitor('C1', 'cap', '0', 1e-6),
    ];
    const config: BackwardEulerConfig = {
      timeStep: 50e-6,   // 50us steps
      stopTime: 5e-3,    // 5ms = 5 tau
      maxIterations: 100,
      tolerance: 1e-9,
    };

    const result = transientAnalysis(components, config, '0');
    const lastPoint = result.timePoints[result.timePoints.length - 1];
    const vCap = lastPoint.nodeVoltages['cap'];

    // After 5 tau, should be ~99.3% of 5V = ~4.965V
    expect(vCap).toBeGreaterThan(4.9);
    expect(vCap).toBeLessThan(5.01);
  });

  it('RL step response: after 1 tau, current is ~63.2% of I_max', () => {
    // 5V source, R=1k, L=1mH. tau = L/R = 1us.
    // I_max = V/R = 5/1000 = 5mA
    // At t=1us, I should be ~5mA * (1-exp(-1)) = ~3.16mA
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 5),
      resistor('R1', 'in', 'out', 1000),
      inductor('L1', 'out', '0', 1e-3),
    ];
    const config: BackwardEulerConfig = {
      timeStep: 10e-9,   // 10ns steps for accuracy (tau=1us)
      stopTime: 1e-6,    // 1us = 1 tau
      maxIterations: 100,
      tolerance: 1e-12,
    };

    const result = transientAnalysis(components, config, '0');
    const lastPoint = result.timePoints[result.timePoints.length - 1];

    // Current through the circuit: I = (V_in - V_out) / R
    // Or equivalently, the inductor current
    const vIn = lastPoint.nodeVoltages['in'];
    const vOut = lastPoint.nodeVoltages['out'];
    const iCircuit = (vIn - vOut) / 1000;

    // Should be around 3.16mA (within 10% tolerance for Backward Euler)
    expect(iCircuit).toBeGreaterThan(3.16e-3 * 0.90);
    expect(iCircuit).toBeLessThan(3.16e-3 * 1.10);
  });

  it('has correct number of time points (stopTime / timeStep + 1)', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 5),
      resistor('R1', 'in', '0', 1000),
    ];
    const config: BackwardEulerConfig = {
      timeStep: 0.1e-3,
      stopTime: 1e-3,
      maxIterations: 100,
      tolerance: 1e-9,
    };

    const result = transientAnalysis(components, config, '0');
    // stopTime / timeStep = 10, plus initial point at t=0 => 11
    expect(result.timePoints).toHaveLength(11);
  });

  it('each time point contains all node voltages and branch currents', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 5),
      resistor('R1', 'in', 'mid', 1000),
      resistor('R2', 'mid', '0', 1000),
    ];
    const config: BackwardEulerConfig = {
      timeStep: 0.1e-3,
      stopTime: 0.3e-3,
      maxIterations: 100,
      tolerance: 1e-9,
    };

    const result = transientAnalysis(components, config, '0');
    for (const tp of result.timePoints) {
      expect(tp).toHaveProperty('time');
      expect(tp).toHaveProperty('nodeVoltages');
      expect(tp).toHaveProperty('branchCurrents');
      // Should have entries for both non-ground nodes
      expect('in' in tp.nodeVoltages).toBe(true);
      expect('mid' in tp.nodeVoltages).toBe(true);
    }
  });

  it('result reports converged = true for well-behaved circuits', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 5),
      resistor('R1', 'in', '0', 1000),
    ];
    const config: BackwardEulerConfig = {
      timeStep: 0.1e-3,
      stopTime: 1e-3,
      maxIterations: 100,
      tolerance: 1e-9,
    };

    const result = transientAnalysis(components, config, '0');
    expect(result.converged).toBe(true);
  });

  it('config is preserved in result', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 5),
      resistor('R1', 'in', '0', 1000),
    ];
    const config: BackwardEulerConfig = {
      timeStep: 0.1e-3,
      stopTime: 1e-3,
      maxIterations: 100,
      tolerance: 1e-9,
    };

    const result = transientAnalysis(components, config, '0');
    expect(result.config).toEqual(config);
    expect(result.totalSteps).toBe(10);
  });
});

// ============================================================================
// Group 4: Circuit File Format (SIM-09)
// ============================================================================

describe('Circuit File Format (SIM-09)', () => {
  const sampleCircuit: CircuitDefinition = {
    components: [
      { id: 'V1', type: 'voltage-source', params: { voltage: 10 } },
      { id: 'R1', type: 'resistor', params: { resistance: 1000 } },
      { id: 'R2', type: 'resistor', params: { resistance: 2000 } },
    ],
    connections: [
      { componentId: 'V1', pin: '+', node: 'in' },
      { componentId: 'V1', pin: '-', node: '0' },
      { componentId: 'R1', pin: '1', node: 'in' },
      { componentId: 'R1', pin: '2', node: 'mid' },
      { componentId: 'R2', pin: '1', node: 'mid' },
      { componentId: 'R2', pin: '2', node: '0' },
    ],
    metadata: {
      name: 'Voltage Divider',
      description: 'Simple 2:1 voltage divider',
      author: 'test',
      created: 1700000000,
      modified: 1700000000,
    },
  };

  it('saveCircuit produces SavedCircuit with formatVersion "1.0" and a checksum', () => {
    const saved = saveCircuit(sampleCircuit);
    expect(saved.formatVersion).toBe('1.0');
    expect(saved.circuit).toEqual(sampleCircuit);
    expect(typeof saved.checksum).toBe('string');
    expect(saved.checksum.length).toBeGreaterThan(0);
  });

  it('loadCircuit reconstructs CircuitDefinition from SavedCircuit', () => {
    const saved = saveCircuit(sampleCircuit);
    const loaded = loadCircuit(saved);
    expect(loaded).toEqual(sampleCircuit);
  });

  it('round-trip: save then load produces identical CircuitDefinition', () => {
    const saved = saveCircuit(sampleCircuit);
    const loaded = loadCircuit(saved);
    expect(loaded).toStrictEqual(sampleCircuit);
  });

  it('circuitToComponents converts CircuitDefinition to Component[] array', () => {
    const components = circuitToComponents(sampleCircuit);
    expect(Array.isArray(components)).toBe(true);
    expect(components).toHaveLength(3);

    const v1 = components.find((c) => c.id === 'V1');
    expect(v1).toBeDefined();
    expect(v1!.type).toBe('voltage-source');
    if (v1!.type === 'voltage-source') {
      expect(v1!.voltage).toBe(10);
      expect(v1!.nodes).toEqual(['in', '0']);
    }

    const r1 = components.find((c) => c.id === 'R1');
    expect(r1).toBeDefined();
    expect(r1!.type).toBe('resistor');
    if (r1!.type === 'resistor') {
      expect(r1!.resistance).toBe(1000);
      expect(r1!.nodes).toEqual(['in', 'mid']);
    }
  });

  it('invalid checksum on load throws error', () => {
    const saved = saveCircuit(sampleCircuit);
    // Tamper with the checksum
    const tampered: SavedCircuit = { ...saved, checksum: 'bad-checksum' };
    expect(() => loadCircuit(tampered)).toThrow(/checksum mismatch/i);
  });

  it('missing required fields on load throw descriptive errors', () => {
    const invalid = {
      formatVersion: '1.0' as const,
      circuit: { components: [], connections: [] } as unknown as CircuitDefinition,
      checksum: '', // will be recomputed as needed
    };
    // Missing metadata.name should throw
    expect(() => loadCircuit(invalid)).toThrow();
  });
});

// ============================================================================
// Group 5: Full Round-Trip Simulation (SIM-09)
// ============================================================================

describe('Full Round-Trip Simulation (SIM-09)', () => {
  it('voltage divider: save/load/simulate DC matches direct simulation', () => {
    // Define voltage divider as CircuitDefinition
    const circuitDef: CircuitDefinition = {
      components: [
        { id: 'V1', type: 'voltage-source', params: { voltage: 10 } },
        { id: 'R1', type: 'resistor', params: { resistance: 1000 } },
        { id: 'R2', type: 'resistor', params: { resistance: 1000 } },
      ],
      connections: [
        { componentId: 'V1', pin: '+', node: 'in' },
        { componentId: 'V1', pin: '-', node: '0' },
        { componentId: 'R1', pin: '1', node: 'in' },
        { componentId: 'R1', pin: '2', node: 'mid' },
        { componentId: 'R2', pin: '1', node: 'mid' },
        { componentId: 'R2', pin: '2', node: '0' },
      ],
      metadata: {
        name: 'Divider Test',
        description: 'Equal voltage divider',
        author: 'test',
        created: 1700000000,
        modified: 1700000000,
      },
    };

    // Direct simulation
    const directComponents: Component[] = [
      voltageSource('V1', 'in', '0', 10),
      resistor('R1', 'in', 'mid', 1000),
      resistor('R2', 'mid', '0', 1000),
    ];
    const directResult = dcAnalysis(directComponents, '0');
    const directMid = directResult.nodeVoltages.find((nv) => nv.node === 'mid')!.voltage;

    // Round-trip simulation
    const saved = saveCircuit(circuitDef);
    const loaded = loadCircuit(saved);
    const roundTripComponents = circuitToComponents(loaded);
    const roundTripResult = dcAnalysis(roundTripComponents, '0');
    const roundTripMid = roundTripResult.nodeVoltages.find((nv) => nv.node === 'mid')!.voltage;

    // Both should give 5V
    expect(directMid).toBeCloseTo(5.0, 10);
    expect(roundTripMid).toBeCloseTo(directMid, 10);
  });

  it('RC circuit: save/load/simulate transient results match', () => {
    // Define RC circuit
    const circuitDef: CircuitDefinition = {
      components: [
        { id: 'V1', type: 'voltage-source', params: { voltage: 5 } },
        { id: 'R1', type: 'resistor', params: { resistance: 1000 } },
        { id: 'C1', type: 'capacitor', params: { capacitance: 1e-6 } },
      ],
      connections: [
        { componentId: 'V1', pin: '+', node: 'in' },
        { componentId: 'V1', pin: '-', node: '0' },
        { componentId: 'R1', pin: '1', node: 'in' },
        { componentId: 'R1', pin: '2', node: 'cap' },
        { componentId: 'C1', pin: '1', node: 'cap' },
        { componentId: 'C1', pin: '2', node: '0' },
      ],
      metadata: {
        name: 'RC Circuit',
        description: 'RC charging test',
        author: 'test',
        created: 1700000000,
        modified: 1700000000,
      },
    };

    // Direct simulation
    const directComponents: Component[] = [
      voltageSource('V1', 'in', '0', 5),
      resistor('R1', 'in', 'cap', 1000),
      capacitor('C1', 'cap', '0', 1e-6),
    ];
    const config: BackwardEulerConfig = {
      timeStep: 50e-6,
      stopTime: 1e-3,
      maxIterations: 100,
      tolerance: 1e-9,
    };

    const directResult = transientAnalysis(directComponents, config, '0');

    // Round-trip simulation
    const saved = saveCircuit(circuitDef);
    const loaded = loadCircuit(saved);
    const roundTripComponents = circuitToComponents(loaded);
    const roundTripResult = transientAnalysis(roundTripComponents, config, '0');

    // Compare final capacitor voltages
    const directFinal = directResult.timePoints[directResult.timePoints.length - 1].nodeVoltages['cap'];
    const roundTripFinal = roundTripResult.timePoints[roundTripResult.timePoints.length - 1].nodeVoltages['cap'];

    expect(roundTripFinal).toBeCloseTo(directFinal, 10);
  });
});
