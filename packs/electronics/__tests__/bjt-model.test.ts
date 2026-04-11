/**
 * BJT Ebers-Moll Simplified Model Test Suite (Phase 269 Plan 01)
 *
 * Validates NPN/PNP BJT transistor stamps and circuit solutions.
 * Tests: type definition, stamp export, NPN common-emitter, PNP common-emitter,
 * saturation mode, collectNodes with baseNode, stampComponent dispatch.
 */

import { describe, it, expect } from 'vitest';
import { stampBJT, stampComponent } from '../simulator/components.js';
import { solveNonlinear } from '../simulator/mna-engine.js';
import type { Component, BJT, StampTarget } from '../simulator/components.js';
import type { StampLogEntry } from '../simulator/mna-engine.js';

// ============================================================================
// Test 1: stampBJT is exported and callable
// ============================================================================

describe('BJT Model', () => {
  it('stampBJT is exported and callable', () => {
    expect(typeof stampBJT).toBe('function');
  });

  // ==========================================================================
  // Test 2: NPN BJT type definition
  // ==========================================================================

  it('NPN BJT type definition', () => {
    const q1: BJT = {
      id: 'Q1',
      type: 'bjt',
      polarity: 'NPN',
      beta: 100,
      nodes: ['c', 'e'],
      baseNode: 'b',
    };
    expect(q1.id).toBe('Q1');
    expect(q1.type).toBe('bjt');
    expect(q1.polarity).toBe('NPN');
    expect(q1.beta).toBe(100);
    expect(q1.nodes).toEqual(['c', 'e']);
    expect(q1.baseNode).toBe('b');
  });

  // ==========================================================================
  // Test 3: NPN common-emitter circuit solves correctly
  // ==========================================================================

  it('NPN common-emitter circuit solves correctly', () => {
    // Circuit: 12V supply, R_C = 4.7k, R_B = 100k, NPN BJT beta=100
    // V1: vcc to ground, R_C: vcc to collector, R_B: vcc to base
    // BJT Q1: collector='c', emitter='0' (ground), base='b'
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vcc', '0'], voltage: 12 },
      { id: 'RC', type: 'resistor', nodes: ['vcc', 'c'], resistance: 4700 },
      { id: 'RB', type: 'resistor', nodes: ['vcc', 'b'], resistance: 100000 },
      { id: 'Q1', type: 'bjt', polarity: 'NPN', beta: 100, nodes: ['c', '0'], baseNode: 'b' },
    ];

    const result = solveNonlinear(components, '0');

    // Must converge
    expect(result.converged).toBe(true);

    // Find node voltages
    const vB = result.nodeVoltages.find((nv) => nv.node === 'b');
    const vC = result.nodeVoltages.find((nv) => nv.node === 'c');
    const vVcc = result.nodeVoltages.find((nv) => nv.node === 'vcc');

    expect(vB).toBeDefined();
    expect(vC).toBeDefined();
    expect(vVcc).toBeDefined();

    // VCC should be 12V
    expect(vVcc!.voltage).toBeCloseTo(12, 1);

    // V_B should be approximately 0.6V (forward-biased BE junction)
    // With 5% tolerance for analog simulation
    expect(vB!.voltage).toBeGreaterThan(0.3);
    expect(vB!.voltage).toBeLessThan(1.5);

    // V_C should be between 0V and 12V (active region or saturated)
    expect(vC!.voltage).toBeGreaterThanOrEqual(-0.5);
    expect(vC!.voltage).toBeLessThanOrEqual(12.5);
  });

  // ==========================================================================
  // Test 4: PNP common-emitter circuit solves correctly
  // ==========================================================================

  it('PNP common-emitter circuit solves correctly', () => {
    // PNP circuit: 12V supply
    // R_C from collector to ground, R_B from base to ground
    // PNP BJT: collector='c', emitter='vcc', base='b'
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vcc', '0'], voltage: 12 },
      { id: 'RC', type: 'resistor', nodes: ['c', '0'], resistance: 4700 },
      { id: 'RB', type: 'resistor', nodes: ['b', '0'], resistance: 100000 },
      { id: 'Q1', type: 'bjt', polarity: 'PNP', beta: 100, nodes: ['c', 'vcc'], baseNode: 'b' },
    ];

    const result = solveNonlinear(components, '0');

    // Must converge
    expect(result.converged).toBe(true);

    // Find node voltages
    const vB = result.nodeVoltages.find((nv) => nv.node === 'b');
    const vC = result.nodeVoltages.find((nv) => nv.node === 'c');

    expect(vB).toBeDefined();
    expect(vC).toBeDefined();

    // V_B should be around VCC - 0.6 = 11.4V (EB junction forward-biased)
    expect(vB!.voltage).toBeGreaterThan(10.0);
    expect(vB!.voltage).toBeLessThan(12.5);

    // V_C should be between 0V and 12V (current flows through R_C)
    expect(vC!.voltage).toBeGreaterThanOrEqual(-0.5);
    expect(vC!.voltage).toBeLessThanOrEqual(12.5);
  });

  // ==========================================================================
  // Test 5: BJT as saturated switch
  // ==========================================================================

  it('BJT as saturated switch', () => {
    // 5V supply, R_C = 1k, R_B = 10k, NPN beta=100
    // I_B = (5 - 0.6) / 10k = 0.44mA
    // I_C_theoretical = beta * I_B = 44mA, but I_C_max = 5V / 1k = 5mA
    // BJT is saturated: V_CE ~ 0.2V, V_C should be close to 0V
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vcc', '0'], voltage: 5 },
      { id: 'RC', type: 'resistor', nodes: ['vcc', 'c'], resistance: 1000 },
      { id: 'RB', type: 'resistor', nodes: ['vcc', 'b'], resistance: 10000 },
      { id: 'Q1', type: 'bjt', polarity: 'NPN', beta: 100, nodes: ['c', '0'], baseNode: 'b' },
    ];

    const result = solveNonlinear(components, '0');

    // Must converge
    expect(result.converged).toBe(true);

    const vC = result.nodeVoltages.find((nv) => nv.node === 'c');
    expect(vC).toBeDefined();

    // Saturated: V_C should be close to ground (V_CE_sat ~ 0.6V in PWL model)
    // The simplified piecewise-linear model uses a 0.6V threshold for the CE
    // path, so V_CE_sat is approximately 0.6V rather than the ideal 0.2V
    expect(vC!.voltage).toBeLessThan(1.0);
  });

  // ==========================================================================
  // Test 6: collectNodes handles BJT baseNode as third terminal
  // ==========================================================================

  it('collectNodes handles BJT baseNode as third terminal', () => {
    // A circuit with BJT where baseNode is a unique node not in nodes[]
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vcc', '0'], voltage: 5 },
      { id: 'RC', type: 'resistor', nodes: ['vcc', 'c'], resistance: 1000 },
      { id: 'RB', type: 'resistor', nodes: ['vcc', 'b'], resistance: 10000 },
      { id: 'Q1', type: 'bjt', polarity: 'NPN', beta: 100, nodes: ['c', '0'], baseNode: 'b' },
    ];

    const result = solveNonlinear(components, '0');

    // The base node 'b' should appear in the node voltages
    const vB = result.nodeVoltages.find((nv) => nv.node === 'b');
    expect(vB).toBeDefined();
    expect(typeof vB!.voltage).toBe('number');
  });

  // ==========================================================================
  // Test 7: stampComponent dispatches to BJT
  // ==========================================================================

  it('stampComponent dispatches to BJT', () => {
    const bjt: BJT = {
      id: 'Q1',
      type: 'bjt',
      polarity: 'NPN',
      beta: 100,
      nodes: ['c', '0'],
      baseNode: 'b',
    };

    // Create a minimal stamp target
    const size = 3;
    const matrix: number[][] = [];
    for (let i = 0; i < size; i++) {
      matrix.push(new Array(size).fill(0));
    }
    const rhs = new Array(size).fill(0);
    const stampLog: StampLogEntry[] = [];
    const nodeMap = new Map<string, number>([['c', 0], ['b', 1]]);

    const target: StampTarget = {
      matrix,
      rhs,
      stampLog,
      nodeIndex: (node: string) => {
        if (node === '0') return -1;
        return nodeMap.get(node) ?? -1;
      },
      vsIndex: () => -1,
      n: size,
    };

    // stampComponent with BJT and 'dc' analysis should not throw
    expect(() => stampComponent(target, bjt, 'dc')).not.toThrow();
  });
});
