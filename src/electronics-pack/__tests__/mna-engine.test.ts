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
} from '../simulator/mna-engine';
import {
  stampResistor,
  stampCapacitor,
  stampInductor,
  stampVoltageSource,
  stampCurrentSource,
  stampComponent,
} from '../simulator/components';
import type { StampLogEntry, MNASolution } from '../simulator/mna-engine';
import type {
  Resistor,
  Capacitor,
  Inductor,
  VoltageSource,
  CurrentSource,
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
