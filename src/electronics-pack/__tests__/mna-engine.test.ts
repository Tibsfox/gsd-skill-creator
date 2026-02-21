/**
 * MNA Circuit Simulator Engine — Core Test Suite
 *
 * TDD RED phase: comprehensive tests for Modified Nodal Analysis engine.
 * Covers matrix construction, component stamping (R/C/L/V/I),
 * Gaussian elimination with partial pivoting, DC analysis, and stamp log.
 *
 * Requirements: SIM-01, SIM-02, SIM-04, SIM-05, SIM-08
 */

import { describe, it, expect } from 'vitest';
import {
  MNAEngine,
  buildMatrix,
  solve,
  dcAnalysis,
  solveNonlinear,
  acAnalysis,
} from '../simulator/mna-engine';
import {
  stampResistor,
  stampCapacitor,
  stampInductor,
  stampVoltageSource,
  stampCurrentSource,
  stampComponent,
  stampDiode,
} from '../simulator/components';
import type { StampLogEntry, MNASolution, ACAnalysisPoint } from '../simulator/mna-engine';
import type {
  Resistor,
  Capacitor,
  Inductor,
  VoltageSource,
  CurrentSource,
  Diode,
  Component,
} from '../simulator/components';

// ============================================================================
// Helper: create components with defaults
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

function currentSource(id: string, nFrom: string, nTo: string, i: number): CurrentSource {
  return { id, type: 'current-source', nodes: [nFrom, nTo], current: i };
}

function diode(id: string, anode: string, cathode: string): Diode {
  return { id, type: 'diode', nodes: [anode, cathode], saturationCurrent: 1e-12, thermalVoltage: 0.026 };
}

// ============================================================================
// Group 1: Matrix Construction (SIM-01)
// ============================================================================

describe('Matrix Construction (SIM-01)', () => {
  it('empty circuit produces 0x0 matrix', () => {
    const result = buildMatrix([], '0');
    expect(result.matrix).toHaveLength(0);
    expect(result.rhs).toHaveLength(0);
  });

  it('single resistor between nodes 1 and 2 produces 2x2 G matrix', () => {
    const components: Component[] = [resistor('R1', '1', '2', 1000)];
    const result = buildMatrix(components, '0');
    // Two nodes (1, 2), no voltage sources => 2x2 matrix
    expect(result.matrix).toHaveLength(2);
    expect(result.matrix[0]).toHaveLength(2);
  });

  it('ground node (node "0") is excluded from matrix', () => {
    // Resistor from node 1 to ground: only 1 non-ground node
    const components: Component[] = [resistor('R1', '1', '0', 1000)];
    const result = buildMatrix(components, '0');
    expect(result.matrix).toHaveLength(1);
    expect(result.rhs).toHaveLength(1);
  });

  it('ground node "gnd" is also excluded from matrix', () => {
    const components: Component[] = [resistor('R1', '1', 'gnd', 1000)];
    const result = buildMatrix(components, 'gnd');
    expect(result.matrix).toHaveLength(1);
  });

  it('buildMatrix creates (n+m)x(n+m) matrix for n nodes + m voltage sources', () => {
    // 3 non-ground nodes, 1 voltage source => 4x4 matrix
    const components: Component[] = [
      resistor('R1', '1', '2', 1000),
      resistor('R2', '2', '3', 2000),
      voltageSource('V1', '1', '0', 10),
    ];
    const result = buildMatrix(components, '0');
    // Nodes: 1, 2, 3 => n=3, voltage sources: V1 => m=1 => 4x4
    expect(result.matrix).toHaveLength(4);
    expect(result.matrix[0]).toHaveLength(4);
    expect(result.rhs).toHaveLength(4);
  });

  it('nodeNames array contains all non-ground nodes in order', () => {
    const components: Component[] = [
      resistor('R1', '1', '2', 1000),
      resistor('R2', '2', '3', 2000),
    ];
    const result = buildMatrix(components, '0');
    expect(result.nodeNames).toContain('1');
    expect(result.nodeNames).toContain('2');
    expect(result.nodeNames).toContain('3');
    expect(result.nodeNames).not.toContain('0');
  });

  it('vsNames array contains voltage source IDs in order', () => {
    const components: Component[] = [
      voltageSource('V1', '1', '0', 10),
      voltageSource('V2', '2', '0', 5),
    ];
    const result = buildMatrix(components, '0');
    expect(result.vsNames).toContain('V1');
    expect(result.vsNames).toContain('V2');
    expect(result.vsNames).toHaveLength(2);
  });
});

// ============================================================================
// Group 2: Component Stamping (SIM-02)
// ============================================================================

describe('Component Stamping (SIM-02)', () => {
  describe('Resistor stamps', () => {
    it('resistor between nodes i,j stamps G matrix symmetrically', () => {
      // R=1000 between node "1" (index 0) and node "2" (index 1)
      // G[0][0] += 1/1000, G[1][1] += 1/1000, G[0][1] -= 1/1000, G[1][0] -= 1/1000
      const components: Component[] = [resistor('R1', '1', '2', 1000)];
      const result = buildMatrix(components, '0');
      const g = 1 / 1000; // conductance
      expect(result.matrix[0][0]).toBeCloseTo(g, 10);
      expect(result.matrix[1][1]).toBeCloseTo(g, 10);
      expect(result.matrix[0][1]).toBeCloseTo(-g, 10);
      expect(result.matrix[1][0]).toBeCloseTo(-g, 10);
    });

    it('resistor to ground stamps only diagonal', () => {
      // R=500 from node "1" (index 0) to ground "0"
      // Only G[0][0] += 1/500
      const components: Component[] = [resistor('R1', '1', '0', 500)];
      const result = buildMatrix(components, '0');
      expect(result.matrix[0][0]).toBeCloseTo(1 / 500, 10);
    });
  });

  describe('Voltage source stamps', () => {
    it('voltage source from i(+) to j(-) stamps B, C submatrices and e vector', () => {
      // V1=10V from node "1" (index 0) to node "2" (index 1)
      // VS index k=0 (first VS), matrix row/col offset = n=2
      // B[0][k]+=1 => matrix[0][2]+=1
      // B[1][k]-=1 => matrix[1][2]-=1
      // C[k][0]+=1 => matrix[2][0]+=1
      // C[k][1]-=1 => matrix[2][1]-=1
      // e[k]=10 => rhs[2]=10
      const components: Component[] = [voltageSource('V1', '1', '2', 10)];
      const result = buildMatrix(components, '0');
      // n=2 nodes (1,2), m=1 VS => 3x3 matrix
      expect(result.matrix).toHaveLength(3);
      // B stamps
      expect(result.matrix[0][2]).toBe(1);
      expect(result.matrix[1][2]).toBe(-1);
      // C stamps
      expect(result.matrix[2][0]).toBe(1);
      expect(result.matrix[2][1]).toBe(-1);
      // e vector
      expect(result.rhs[2]).toBe(10);
    });

    it('voltage source to ground stamps only the non-ground row/col', () => {
      // V1=5V from node "1" (index 0) to ground "0"
      // n=1 node, m=1 VS => 2x2 matrix
      // B[0][k=0]+=1 => matrix[0][1]+=1
      // C[k=0][0]+=1 => matrix[1][0]+=1
      // e[k=0]=5 => rhs[1]=5
      const components: Component[] = [voltageSource('V1', '1', '0', 5)];
      const result = buildMatrix(components, '0');
      expect(result.matrix).toHaveLength(2);
      expect(result.matrix[0][1]).toBe(1);
      expect(result.matrix[1][0]).toBe(1);
      expect(result.rhs[1]).toBe(5);
    });
  });

  describe('Current source stamps', () => {
    it('current source from i to j stamps rhs vector', () => {
      // I1=0.001A from node "1" (index 0) to node "2" (index 1)
      // rhs[0] -= 0.001, rhs[1] += 0.001
      const components: Component[] = [
        resistor('R1', '1', '0', 1000), // need resistors to create nodes in matrix
        resistor('R2', '2', '0', 1000),
        currentSource('I1', '1', '2', 0.001),
      ];
      const result = buildMatrix(components, '0');
      // rhs[0] should have -0.001 contribution from current source
      // rhs[1] should have +0.001 contribution from current source
      expect(result.rhs[0]).toBeCloseTo(-0.001, 10);
      expect(result.rhs[1]).toBeCloseTo(0.001, 10);
    });
  });

  describe('Capacitor DC stamp', () => {
    it('capacitor stamps as open circuit for DC (no contribution to G)', () => {
      // Only a capacitor and a resistor; capacitor should not change matrix
      const withCap: Component[] = [
        resistor('R1', '1', '0', 1000),
        capacitor('C1', '1', '0', 1e-6),
      ];
      const withoutCap: Component[] = [
        resistor('R1', '1', '0', 1000),
      ];
      const resultWith = buildMatrix(withCap, '0');
      const resultWithout = buildMatrix(withoutCap, '0');
      // Matrix should be identical (capacitor is open circuit in DC)
      expect(resultWith.matrix[0][0]).toBeCloseTo(resultWithout.matrix[0][0], 10);
    });
  });

  describe('Inductor DC stamp', () => {
    it('inductor stamps as short circuit for DC (zero-volt voltage source)', () => {
      // Inductor from node "1" to node "2" acts as 0V source in DC
      // So it adds a VS row/col to the matrix
      const components: Component[] = [
        resistor('R1', '1', '0', 1000),
        inductor('L1', '1', '2', 0.01),
      ];
      const result = buildMatrix(components, '0');
      // Nodes: 1, 2 => n=2, inductor acts as VS => m=1 => 3x3
      expect(result.matrix).toHaveLength(3);
      // The inductor should stamp like a voltage source with V=0
      // rhs for the inductor row should be 0
      expect(result.rhs[2]).toBe(0);
    });
  });
});

// ============================================================================
// Group 3: Gaussian Elimination with Partial Pivoting (SIM-04)
// ============================================================================

describe('Gaussian Elimination with Partial Pivoting (SIM-04)', () => {
  it('solves identity matrix correctly', () => {
    const A = [[1, 0], [0, 1]];
    const b = [3, 7];
    const x = solve(A, b);
    expect(x[0]).toBeCloseTo(3, 10);
    expect(x[1]).toBeCloseTo(7, 10);
  });

  it('solves 2x2 system: [2,1;1,3]*[x;y]=[5;5] => x=2,y=1', () => {
    const A = [[2, 1], [1, 3]];
    const b = [5, 5];
    const x = solve(A, b);
    expect(x[0]).toBeCloseTo(2, 10);
    expect(x[1]).toBeCloseTo(1, 10);
  });

  it('solves 3x3 system with known answer', () => {
    // 2x + y - z = 8
    // -3x - y + 2z = -11
    // -2x + y + 2z = -3
    // Solution: x=2, y=3, z=-1
    const A = [
      [2, 1, -1],
      [-3, -1, 2],
      [-2, 1, 2],
    ];
    const b = [8, -11, -3];
    const x = solve(A, b);
    expect(x[0]).toBeCloseTo(2, 10);
    expect(x[1]).toBeCloseTo(3, 10);
    expect(x[2]).toBeCloseTo(-1, 10);
  });

  it('handles zero diagonal via pivoting (matrix where naive elimination fails)', () => {
    // First row has zero in diagonal position => needs pivot swap
    // [0, 1; 1, 0] * [x; y] = [4; 7]
    // Solution: x=7, y=4
    const A = [[0, 1], [1, 0]];
    const b = [4, 7];
    const x = solve(A, b);
    expect(x[0]).toBeCloseTo(7, 10);
    expect(x[1]).toBeCloseTo(4, 10);
  });

  it('returns correct solution for pivoting-required case', () => {
    // Matrix that requires pivoting for numerical stability
    // [0, 2, 1; 1, 1, 1; 2, 1, 0] * x = [4, 6, 7]
    // Solution: x=[3, 1, 2]
    const A = [
      [0, 2, 1],
      [1, 1, 1],
      [2, 1, 0],
    ];
    const b = [4, 6, 7];
    const x = solve(A, b);
    expect(x[0]).toBeCloseTo(3, 8);
    expect(x[1]).toBeCloseTo(1, 8);
    expect(x[2]).toBeCloseTo(2, 8);
  });

  it('solves 1x1 system', () => {
    const A = [[5]];
    const b = [15];
    const x = solve(A, b);
    expect(x[0]).toBeCloseTo(3, 10);
  });
});

// ============================================================================
// Group 4: DC Analysis (SIM-05)
// ============================================================================

describe('DC Analysis (SIM-05)', () => {
  it('voltage divider: 10V source, R1=1k, R2=1k => mid-node = 5V', () => {
    // V1(10V) from node "in" to ground, R1(1k) from "in" to "mid", R2(1k) from "mid" to ground
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 10),
      resistor('R1', 'in', 'mid', 1000),
      resistor('R2', 'mid', '0', 1000),
    ];
    const result = dcAnalysis(components, '0');
    const midVoltage = result.nodeVoltages.find((nv) => nv.node === 'mid');
    expect(midVoltage).toBeDefined();
    expect(midVoltage!.voltage).toBeCloseTo(5.0, 10);
  });

  it('voltage divider: 12V source, R1=2k, R2=1k => mid-node = 4V', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 12),
      resistor('R1', 'in', 'mid', 2000),
      resistor('R2', 'mid', '0', 1000),
    ];
    const result = dcAnalysis(components, '0');
    const midVoltage = result.nodeVoltages.find((nv) => nv.node === 'mid');
    expect(midVoltage).toBeDefined();
    expect(midVoltage!.voltage).toBeCloseTo(4.0, 10);
  });

  it('two voltage sources in series', () => {
    // V1(5V) from "a" to ground, V2(3V) from "b" to "a"
    // Node "b" should be at 8V (5+3)
    const components: Component[] = [
      voltageSource('V1', 'a', '0', 5),
      voltageSource('V2', 'b', 'a', 3),
      resistor('R1', 'b', '0', 1000), // load resistor
    ];
    const result = dcAnalysis(components, '0');
    const aVoltage = result.nodeVoltages.find((nv) => nv.node === 'a');
    const bVoltage = result.nodeVoltages.find((nv) => nv.node === 'b');
    expect(aVoltage).toBeDefined();
    expect(bVoltage).toBeDefined();
    expect(aVoltage!.voltage).toBeCloseTo(5.0, 10);
    expect(bVoltage!.voltage).toBeCloseTo(8.0, 10);
  });

  it('current source with single resistor: I=1mA, R=1k => V=1V', () => {
    // I1(1mA) flowing into node "1" from ground, R1(1k) from "1" to ground
    // V = I * R = 0.001 * 1000 = 1V
    const components: Component[] = [
      currentSource('I1', '0', '1', 0.001),
      resistor('R1', '1', '0', 1000),
    ];
    const result = dcAnalysis(components, '0');
    const v1 = result.nodeVoltages.find((nv) => nv.node === '1');
    expect(v1).toBeDefined();
    expect(v1!.voltage).toBeCloseTo(1.0, 10);
  });

  it('returns both nodeVoltages and branchCurrents in MNASolution', () => {
    const components: Component[] = [
      voltageSource('V1', '1', '0', 10),
      resistor('R1', '1', '0', 1000),
    ];
    const result = dcAnalysis(components, '0');
    expect(result.nodeVoltages).toBeDefined();
    expect(Array.isArray(result.nodeVoltages)).toBe(true);
    expect(result.branchCurrents).toBeDefined();
    expect(Array.isArray(result.branchCurrents)).toBe(true);
    // V1 should deliver current: I = V/R = 10/1000 = 0.01A
    const v1Current = result.branchCurrents.find((bc) => bc.branch === 'V1');
    expect(v1Current).toBeDefined();
    expect(Math.abs(v1Current!.current)).toBeCloseTo(0.01, 8);
  });

  it('node "in" equals source voltage in voltage divider', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 10),
      resistor('R1', 'in', 'mid', 1000),
      resistor('R2', 'mid', '0', 1000),
    ];
    const result = dcAnalysis(components, '0');
    const inVoltage = result.nodeVoltages.find((nv) => nv.node === 'in');
    expect(inVoltage).toBeDefined();
    expect(inVoltage!.voltage).toBeCloseTo(10.0, 10);
  });
});

// ============================================================================
// Group 5: Stamp Log (SIM-08)
// ============================================================================

describe('Stamp Log (SIM-08)', () => {
  it('each stamp operation produces StampLogEntry with required fields', () => {
    const components: Component[] = [resistor('R1', '1', '0', 1000)];
    const result = buildMatrix(components, '0');
    expect(result.stampLog.length).toBeGreaterThan(0);
    for (const entry of result.stampLog) {
      expect(entry).toHaveProperty('component');
      expect(entry).toHaveProperty('row');
      expect(entry).toHaveProperty('col');
      expect(entry).toHaveProperty('value');
      expect(entry).toHaveProperty('explanation');
    }
  });

  it('resistor stamp produces 4 entries for non-ground nodes', () => {
    const components: Component[] = [resistor('R1', '1', '2', 1000)];
    const result = buildMatrix(components, '0');
    const r1Entries = result.stampLog.filter((e) => e.component === 'R1');
    // 4 stamps: G[i][i], G[j][j], G[i][j], G[j][i]
    expect(r1Entries).toHaveLength(4);
  });

  it('resistor stamp produces 1 entry when one node is ground', () => {
    const components: Component[] = [resistor('R1', '1', '0', 1000)];
    const result = buildMatrix(components, '0');
    const r1Entries = result.stampLog.filter((e) => e.component === 'R1');
    // Only G[0][0] (diagonal) since the other node is ground
    expect(r1Entries).toHaveLength(1);
  });

  it('voltage source stamp produces entries for B, C, and e', () => {
    const components: Component[] = [voltageSource('V1', '1', '0', 5)];
    const result = buildMatrix(components, '0');
    const v1Entries = result.stampLog.filter((e) => e.component === 'V1');
    // B[0][k], C[k][0], e[k] => at least 3 entries (only non-ground)
    expect(v1Entries.length).toBeGreaterThanOrEqual(3);
  });

  it('explanation strings are human-readable', () => {
    const components: Component[] = [resistor('R1', '1', '2', 1000)];
    const result = buildMatrix(components, '0');
    const r1Entries = result.stampLog.filter((e) => e.component === 'R1');
    for (const entry of r1Entries) {
      expect(entry.explanation).toBeTruthy();
      expect(typeof entry.explanation).toBe('string');
      // Should mention the component name
      expect(entry.explanation).toContain('R1');
    }
  });

  it('full stamp log for voltage divider contains entries for all components', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 10),
      resistor('R1', 'in', 'mid', 1000),
      resistor('R2', 'mid', '0', 1000),
    ];
    const result = buildMatrix(components, '0');
    // Should have entries for V1, R1, R2
    const componentNames = new Set(result.stampLog.map((e) => e.component));
    expect(componentNames.has('V1')).toBe(true);
    expect(componentNames.has('R1')).toBe(true);
    expect(componentNames.has('R2')).toBe(true);
  });

  it('capacitor DC stamp logs "open circuit" explanation', () => {
    const components: Component[] = [
      resistor('R1', '1', '0', 1000),
      capacitor('C1', '1', '0', 1e-6),
    ];
    const result = buildMatrix(components, '0');
    const c1Entries = result.stampLog.filter((e) => e.component === 'C1');
    expect(c1Entries.length).toBeGreaterThanOrEqual(1);
    const hasOpenCircuit = c1Entries.some((e) =>
      e.explanation.toLowerCase().includes('open circuit')
    );
    expect(hasOpenCircuit).toBe(true);
  });

  it('inductor DC stamp logs entries for its zero-volt VS behavior', () => {
    const components: Component[] = [
      resistor('R1', '1', '0', 1000),
      inductor('L1', '1', '2', 0.01),
    ];
    const result = buildMatrix(components, '0');
    const l1Entries = result.stampLog.filter((e) => e.component === 'L1');
    expect(l1Entries.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// Group 6: Diode Model / Newton-Raphson (SIM-03)
// ============================================================================

describe('Diode Model / Newton-Raphson (SIM-03)', () => {
  it('forward-biased diode (V > 0.6V) uses R_on ~10 Ohm equivalent', () => {
    // Simple circuit: 5V source, 1k resistor, diode to ground
    // The diode forward-biased should behave roughly as 10 Ohm
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 5),
      resistor('R1', 'in', 'out', 1000),
      diode('D1', 'out', '0'),
    ];
    const result = solveNonlinear(components, '0');
    expect(result.converged).toBe(true);
    // With R_on=10 Ohm, Vout ~= 5 * 10/(1000+10) + 0.6 threshold ~= 0.65V
    // Current ~= (5 - 0.65) / 1000 ~= 4.35mA
    const outNode = result.nodeVoltages.find((nv) => nv.node === 'out');
    expect(outNode).toBeDefined();
    // Diode drop should be roughly 0.6-0.7V
    expect(outNode!.voltage).toBeGreaterThan(0.5);
    expect(outNode!.voltage).toBeLessThan(1.0);
  });

  it('reverse-biased diode (V < 0.6V) uses R_off ~10M Ohm equivalent', () => {
    // Diode reverse-biased: cathode at higher potential than anode
    // 5V source, diode reversed, 1k load to ground
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 5),
      resistor('R1', 'in', 'out', 1000),
      diode('D1', '0', 'out'), // reversed: anode=ground, cathode=out
    ];
    const result = solveNonlinear(components, '0');
    expect(result.converged).toBe(true);
    // With R_off=10M Ohm, virtually no current flows
    // Vout should be very close to 5V (no load current)
    const outNode = result.nodeVoltages.find((nv) => nv.node === 'out');
    expect(outNode).toBeDefined();
    expect(outNode!.voltage).toBeGreaterThan(4.9);
  });

  it('simple diode circuit: 5V, 1k, diode -- diode drop ~0.6-0.7V, current ~4.35mA', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 5),
      resistor('R1', 'in', 'out', 1000),
      diode('D1', 'out', '0'),
    ];
    const result = solveNonlinear(components, '0');
    expect(result.converged).toBe(true);
    const outNode = result.nodeVoltages.find((nv) => nv.node === 'out');
    expect(outNode).toBeDefined();
    // Diode drop ~0.65V
    expect(outNode!.voltage).toBeCloseTo(0.65, 0);
    // Current through R1: (5 - Vout) / 1000
    const current = (5 - outNode!.voltage) / 1000;
    expect(current).toBeCloseTo(0.00435, 3);
  });

  it('Newton-Raphson converges within 50 iterations for forward-biased diode', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 5),
      resistor('R1', 'in', 'out', 1000),
      diode('D1', 'out', '0'),
    ];
    const result = solveNonlinear(components, '0', 50, 1e-6);
    expect(result.converged).toBe(true);
    expect(result.iterations).toBeLessThanOrEqual(50);
  });

  it('Newton-Raphson converges within 50 iterations for reverse-biased diode', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 5),
      resistor('R1', 'in', 'out', 1000),
      diode('D1', '0', 'out'), // reversed
    ];
    const result = solveNonlinear(components, '0', 50, 1e-6);
    expect(result.converged).toBe(true);
    expect(result.iterations).toBeLessThanOrEqual(50);
  });

  it('convergence tolerance is 1uV (1e-6 V) between iterations', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 5),
      resistor('R1', 'in', 'out', 1000),
      diode('D1', 'out', '0'),
    ];
    // With tight tolerance, result should be precise
    const result = solveNonlinear(components, '0', 50, 1e-6);
    expect(result.converged).toBe(true);
    // Run again with same tolerance, verify same answer
    const result2 = solveNonlinear(components, '0', 50, 1e-6);
    const v1 = result.nodeVoltages.find((nv) => nv.node === 'out')!.voltage;
    const v2 = result2.nodeVoltages.find((nv) => nv.node === 'out')!.voltage;
    expect(Math.abs(v1 - v2)).toBeLessThan(1e-6);
  });

  it('diode stamp log shows piecewise-linear region selection', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 5),
      resistor('R1', 'in', 'out', 1000),
      diode('D1', 'out', '0'),
    ];
    const result = solveNonlinear(components, '0');
    expect(result.converged).toBe(true);
    // The stamp log should mention forward-biased or reverse-biased
    const diodeEntries = result.stampLog.filter((e) => e.component === 'D1');
    expect(diodeEntries.length).toBeGreaterThan(0);
    const hasBiasInfo = diodeEntries.some(
      (e) => e.explanation.includes('forward') || e.explanation.includes('reverse')
    );
    expect(hasBiasInfo).toBe(true);
  });
});

// ============================================================================
// Group 7: AC Analysis (SIM-06)
// ============================================================================

describe('AC Analysis (SIM-06)', () => {
  it('RC low-pass filter at f_c (159.15Hz) has magnitude -3dB (0.707 of DC)', () => {
    // RC LPF: R=1k, C=1uF, f_c = 1/(2*pi*R*C) = 159.15 Hz
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 1),
      resistor('R1', 'in', 'out', 1000),
      capacitor('C1', 'out', '0', 1e-6),
    ];
    const fc = 1 / (2 * Math.PI * 1000 * 1e-6); // ~159.15 Hz
    const result = acAnalysis(components, fc * 0.99, fc * 1.01, 100, '0');
    expect(result.length).toBeGreaterThan(0);
    // Find the point closest to f_c
    const atFc = result.reduce((closest, point) =>
      Math.abs(point.frequency - fc) < Math.abs(closest.frequency - fc) ? point : closest
    );
    // Magnitude at f_c should be approximately -3dB
    const magOut = atFc.magnitudes['out'];
    expect(magOut).toBeDefined();
    expect(magOut).toBeCloseTo(-3, 0); // -3dB within 1dB
  });

  it('RC low-pass filter: magnitude approaches 0dB at f << f_c', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 1),
      resistor('R1', 'in', 'out', 1000),
      capacitor('C1', 'out', '0', 1e-6),
    ];
    // f << f_c: use 1 Hz (f_c ~= 159 Hz)
    const result = acAnalysis(components, 1, 2, 10, '0');
    expect(result.length).toBeGreaterThan(0);
    const magOut = result[0].magnitudes['out'];
    expect(magOut).toBeDefined();
    // Should be close to 0dB (full pass)
    expect(magOut).toBeCloseTo(0, 0); // 0dB within 1dB
  });

  it('RC low-pass filter: magnitude rolls off at -20dB/decade at f >> f_c', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 1),
      resistor('R1', 'in', 'out', 1000),
      capacitor('C1', 'out', '0', 1e-6),
    ];
    // f >> f_c: compare 10kHz and 100kHz (both well above f_c ~= 159 Hz)
    const result = acAnalysis(components, 10000, 100000, 10, '0');
    expect(result.length).toBeGreaterThanOrEqual(2);
    const at10k = result.reduce((closest, point) =>
      Math.abs(point.frequency - 10000) < Math.abs(closest.frequency - 10000) ? point : closest
    );
    const at100k = result.reduce((closest, point) =>
      Math.abs(point.frequency - 100000) < Math.abs(closest.frequency - 100000) ? point : closest
    );
    // Difference should be ~20dB per decade
    const magDiff = at10k.magnitudes['out'] - at100k.magnitudes['out'];
    expect(magDiff).toBeCloseTo(20, 1); // ~20dB per decade
  });

  it('RC high-pass filter: at f_c, magnitude is -3dB', () => {
    // RC HPF: C in series, R to ground
    // V1 -> C1 -> out -> R1 -> ground
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 1),
      capacitor('C1', 'in', 'out', 1e-6),
      resistor('R1', 'out', '0', 1000),
    ];
    const fc = 1 / (2 * Math.PI * 1000 * 1e-6); // ~159.15 Hz
    const result = acAnalysis(components, fc * 0.99, fc * 1.01, 100, '0');
    expect(result.length).toBeGreaterThan(0);
    const atFc = result.reduce((closest, point) =>
      Math.abs(point.frequency - fc) < Math.abs(closest.frequency - fc) ? point : closest
    );
    const magOut = atFc.magnitudes['out'];
    expect(magOut).toBeDefined();
    expect(magOut).toBeCloseTo(-3, 0); // -3dB within 1dB
  });

  it('AC analysis returns array of { frequency, magnitudes, phases } objects', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 1),
      resistor('R1', 'in', 'out', 1000),
      capacitor('C1', 'out', '0', 1e-6),
    ];
    const result = acAnalysis(components, 100, 1000, 10, '0');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    for (const point of result) {
      expect(point).toHaveProperty('frequency');
      expect(point).toHaveProperty('magnitudes');
      expect(point).toHaveProperty('phases');
      expect(typeof point.frequency).toBe('number');
      expect(typeof point.magnitudes).toBe('object');
      expect(typeof point.phases).toBe('object');
    }
  });

  it('phase at f_c of RC LPF is approximately -45 degrees', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 1),
      resistor('R1', 'in', 'out', 1000),
      capacitor('C1', 'out', '0', 1e-6),
    ];
    const fc = 1 / (2 * Math.PI * 1000 * 1e-6);
    const result = acAnalysis(components, fc * 0.99, fc * 1.01, 100, '0');
    const atFc = result.reduce((closest, point) =>
      Math.abs(point.frequency - fc) < Math.abs(closest.frequency - fc) ? point : closest
    );
    const phaseOut = atFc.phases['out'];
    expect(phaseOut).toBeDefined();
    expect(phaseOut).toBeCloseTo(-45, 0); // -45 degrees within 0.5 degrees
  });

  it('AC analysis with voltage source produces correct complex node voltages', () => {
    // Simple circuit: V1(1V) -> R1(1k) -> ground
    // At any frequency, node voltage at 'in' should be exactly 1V (0dB)
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 1),
      resistor('R1', 'in', '0', 1000),
    ];
    const result = acAnalysis(components, 100, 1000, 10, '0');
    expect(result.length).toBeGreaterThan(0);
    for (const point of result) {
      const magIn = point.magnitudes['in'];
      expect(magIn).toBeDefined();
      // Source node should always be at 0dB (1V magnitude)
      expect(magIn).toBeCloseTo(0, 1);
    }
  });

  it('AC analysis uses complex impedances: Z_C = 1/(j*2*pi*f*C), Z_L = j*2*pi*f*L', () => {
    // RL circuit: V1 -> R1(1k) -> L1(100mH) -> ground
    // At f_c = R/(2*pi*L) = 1000/(2*pi*0.1) = 1591.5 Hz, magnitude is -3dB
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 1),
      resistor('R1', 'in', 'out', 1000),
      inductor('L1', 'out', '0', 0.1),
    ];
    const fc = 1000 / (2 * Math.PI * 0.1); // ~1591.5 Hz
    const result = acAnalysis(components, fc * 0.99, fc * 1.01, 100, '0');
    expect(result.length).toBeGreaterThan(0);
    const atFc = result.reduce((closest, point) =>
      Math.abs(point.frequency - fc) < Math.abs(closest.frequency - fc) ? point : closest
    );
    const magOut = atFc.magnitudes['out'];
    expect(magOut).toBeDefined();
    // At f_c, RL divider magnitude should be -3dB
    expect(magOut).toBeCloseTo(-3, 0);
  });

  it('frequency sweep with logarithmic spacing (10 points per decade from 1Hz to 1MHz)', () => {
    const components: Component[] = [
      voltageSource('V1', 'in', '0', 1),
      resistor('R1', 'in', 'out', 1000),
      capacitor('C1', 'out', '0', 1e-6),
    ];
    // 1 Hz to 1 MHz = 6 decades, 10 points per decade = 60 points + endpoints
    const result = acAnalysis(components, 1, 1e6, 10, '0');
    // Should have approximately 61 points (6 decades * 10 + 1)
    expect(result.length).toBeGreaterThanOrEqual(55);
    expect(result.length).toBeLessThanOrEqual(70);
    // Frequencies should be logarithmically spaced
    expect(result[0].frequency).toBeCloseTo(1, 0);
    expect(result[result.length - 1].frequency).toBeCloseTo(1e6, -3);
    // Check log spacing: ratio between consecutive points should be roughly constant
    if (result.length >= 3) {
      const ratio1 = result[1].frequency / result[0].frequency;
      const ratio2 = result[2].frequency / result[1].frequency;
      expect(ratio1).toBeCloseTo(ratio2, 1);
    }
  });
});
