/**
 * Instruments Test Suite (Phase 264 Plan 01)
 *
 * TDD tests for voltmeter (measureVoltage) and ammeter (measureCurrent)
 * virtual instruments that measure circuit quantities from MNA solutions.
 */

import { describe, it, expect } from 'vitest';
import { measureVoltage, measureCurrent } from '../simulator/instruments';
import { dcAnalysis, type MNASolution } from '../simulator/mna-engine';
import type {
  Component,
  Resistor,
  VoltageSource,
  CurrentSource,
} from '../simulator/components';

// ============================================================================
// Helper: build common test circuits
// ============================================================================

/** Voltage divider: V1 (10V) -> R1 (1k) -> node "1" -> R2 (1k) -> ground "0" */
function voltageDivider2R(): Component[] {
  return [
    { id: 'V1', type: 'voltage-source', nodes: ['2', '0'], voltage: 10 } as VoltageSource,
    { id: 'R1', type: 'resistor', nodes: ['2', '1'], resistance: 1000 } as Resistor,
    { id: 'R2', type: 'resistor', nodes: ['1', '0'], resistance: 1000 } as Resistor,
  ];
}

/** Three-resistor divider: V1 (12V) -> R1 (1k) -> node "A" -> R2 (2k) -> node "B" -> R3 (1k) -> GND */
function voltageDivider3R(): Component[] {
  return [
    { id: 'V1', type: 'voltage-source', nodes: ['in', '0'], voltage: 12 } as VoltageSource,
    { id: 'R1', type: 'resistor', nodes: ['in', 'A'], resistance: 1000 } as Resistor,
    { id: 'R2', type: 'resistor', nodes: ['A', 'B'], resistance: 2000 } as Resistor,
    { id: 'R3', type: 'resistor', nodes: ['B', '0'], resistance: 1000 } as Resistor,
  ];
}

/** Simple series circuit: V1 (10V) -> R1 (1k) -> ground */
function seriesCircuit(): Component[] {
  return [
    { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 10 } as VoltageSource,
    { id: 'R1', type: 'resistor', nodes: ['1', '0'], resistance: 1000 } as Resistor,
  ];
}

/** Parallel branches: V1 (10V) -> node "1" -> R1 (1k) -> GND and node "1" -> R2 (2k) -> GND */
function parallelBranches(): Component[] {
  return [
    { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 10 } as VoltageSource,
    { id: 'R1', type: 'resistor', nodes: ['1', '0'], resistance: 1000 } as Resistor,
    { id: 'R2', type: 'resistor', nodes: ['1', '0'], resistance: 2000 } as Resistor,
  ];
}

/** Current source circuit: I1 (5mA) from GND to node "1", R1 (2k) from "1" to GND */
function currentSourceCircuit(): Component[] {
  return [
    { id: 'I1', type: 'current-source', nodes: ['0', '1'], current: 0.005 } as CurrentSource,
    { id: 'R1', type: 'resistor', nodes: ['1', '0'], resistance: 2000 } as Resistor,
  ];
}

// ============================================================================
// Voltmeter Tests (SIM-10)
// ============================================================================

describe('Voltmeter', () => {
  it('reads voltage across a voltage divider: 10V/1k/1k midpoint is 5V', () => {
    const components = voltageDivider2R();
    const solution = dcAnalysis(components);
    // Node "1" is the midpoint between two equal resistors: V("1","0") = 5V
    const voltage = measureVoltage('1', '0', solution);
    expect(voltage).toBeCloseTo(5.0, 10);
  });

  it('reads voltage between two non-ground nodes in 3-resistor divider', () => {
    // 12V across 1k + 2k + 1k = 4k total. Current = 3mA.
    // V(A) = 12 - 3mA * 1k = 9V, V(B) = 3mA * 1k = 3V
    // V(A, B) = 9 - 3 = 6V
    const components = voltageDivider3R();
    const solution = dcAnalysis(components);
    const voltage = measureVoltage('A', 'B', solution);
    expect(voltage).toBeCloseTo(6.0, 10);
  });

  it('reads absolute node voltage when nodeB is ground', () => {
    const components = voltageDivider3R();
    const solution = dcAnalysis(components);
    // V(B, "0") = 3V (1k out of 4k total, 12V source)
    const voltage = measureVoltage('B', '0', solution);
    expect(voltage).toBeCloseTo(3.0, 10);
  });

  it('returns 0V when both nodes are at the same potential (same node)', () => {
    const components = voltageDivider2R();
    const solution = dcAnalysis(components);
    const voltage = measureVoltage('1', '1', solution);
    expect(voltage).toBeCloseTo(0.0, 10);
  });

  it('returns negative value when nodeA is at lower potential than nodeB', () => {
    const components = voltageDivider3R();
    const solution = dcAnalysis(components);
    // V(B, A) = 3 - 9 = -6V
    const voltage = measureVoltage('B', 'A', solution);
    expect(voltage).toBeCloseTo(-6.0, 10);
  });

  it('does NOT modify the circuit components array (no side effects)', () => {
    const components = voltageDivider2R();
    const originalLength = components.length;
    const originalJSON = JSON.stringify(components);
    const solution = dcAnalysis(components);
    measureVoltage('1', '0', solution);
    expect(components.length).toBe(originalLength);
    expect(JSON.stringify(components)).toBe(originalJSON);
  });

  it('works with transient time-point data (Record<string, number>)', () => {
    // Simulate a transient snapshot: node voltages as a simple record
    const timePointVoltages: Record<string, number> = {
      '1': 7.5,
      '2': 3.2,
      '0': 0,
    };
    const voltage = measureVoltage('1', '2', timePointVoltages);
    expect(voltage).toBeCloseTo(4.3, 10);
  });
});

// ============================================================================
// Ammeter Tests (SIM-11)
// ============================================================================

describe('Ammeter', () => {
  it('measures current through a series resistor: 10V/1k = 10mA', () => {
    const components = seriesCircuit();
    // Current flows from node "1" through R1 to ground "0": I = 10V / 1k = 10mA
    const current = measureCurrent('1', '0', components);
    expect(current).toBeCloseTo(0.01, 10);
  });

  it('inserts a zero-volt source and returns branch current from re-solved circuit', () => {
    const components = voltageDivider2R();
    // Current from node "2" to node "1" through R1: I = (10V - 5V) / 1k = 5mA
    const current = measureCurrent('2', '1', components);
    expect(current).toBeCloseTo(0.005, 10);
  });

  it('does not perturb existing node voltages (zero perturbation)', () => {
    const components = voltageDivider2R();
    const solutionBefore = dcAnalysis(components);

    // Measure current (which inserts ammeter internally)
    measureCurrent('2', '1', components);

    // Original circuit should be unmodified -- re-solve to verify
    const solutionAfter = dcAnalysis(components);

    // All node voltages must match within 1e-10
    for (let i = 0; i < solutionBefore.nodeVoltages.length; i++) {
      expect(solutionAfter.nodeVoltages[i].voltage).toBeCloseTo(
        solutionBefore.nodeVoltages[i].voltage, 10,
      );
    }
  });

  it('returns correct sign: positive for conventional current from nodeA to nodeB', () => {
    const components = seriesCircuit();
    // Current flows from "1" (10V) to "0" (GND): positive direction
    const current = measureCurrent('1', '0', components);
    expect(current).toBeGreaterThan(0);

    // Reversed: from "0" to "1" should be negative
    const reversed = measureCurrent('0', '1', components);
    expect(reversed).toBeLessThan(0);
    expect(reversed).toBeCloseTo(-current, 10);
  });

  it('measures current in only the specified branch (multi-branch circuit)', () => {
    const components = parallelBranches();
    // V1 = 10V, R1 = 1k (10mA), R2 = 2k (5mA)
    // Total from source = 15mA, but ammeter between "1" and "0" should read total
    // To measure only R1 branch, we need to put ammeter in series with R1
    // Actually, ammeter between "1" and "0" measures total current through that path
    // Let's restructure: R1 from "1" to "a", R2 from "1" to "b", both "a" and "b" to ground
    const branchedCircuit: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 10 } as VoltageSource,
      { id: 'R1', type: 'resistor', nodes: ['1', 'a'], resistance: 1000 } as Resistor,
      { id: 'R2', type: 'resistor', nodes: ['1', 'b'], resistance: 2000 } as Resistor,
      { id: 'R3', type: 'resistor', nodes: ['a', '0'], resistance: 0.001 } as Resistor, // near-short to ground
      { id: 'R4', type: 'resistor', nodes: ['b', '0'], resistance: 0.001 } as Resistor, // near-short to ground
    ];
    // Current through R1 branch (from "1" to "a"): ~10V / 1k = 10mA
    const currentR1 = measureCurrent('1', 'a', branchedCircuit);
    expect(currentR1).toBeCloseTo(0.01, 4); // 10mA within reasonable tolerance

    // Current through R2 branch (from "1" to "b"): ~10V / 2k = 5mA
    const currentR2 = measureCurrent('1', 'b', branchedCircuit);
    expect(currentR2).toBeCloseTo(0.005, 4); // 5mA within reasonable tolerance
  });

  it('measures current with a current source: 5mA through 2k resistor', () => {
    const components = currentSourceCircuit();
    // I1 = 5mA into node "1", R1 = 2k to ground. All 5mA flows through R1.
    const current = measureCurrent('1', '0', components);
    expect(current).toBeCloseTo(0.005, 10);
  });
});
