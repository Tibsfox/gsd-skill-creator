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

/**
 * Series circuit with ammeter-friendly topology:
 * V1 (10V) from "2" to "0", R1 (1k) from "2" to "1".
 * Node "1" is the measurement point -- no direct component from "1" to "0".
 * Current = 10V / 1k = 10mA flows from "2" through R1 to "1" to ground.
 */
function seriesCircuit(): Component[] {
  return [
    { id: 'V1', type: 'voltage-source', nodes: ['2', '0'], voltage: 10 } as VoltageSource,
    { id: 'R1', type: 'resistor', nodes: ['2', '1'], resistance: 1000 } as Resistor,
  ];
}

/**
 * Current source circuit with ammeter-friendly topology:
 * I1 (5mA) from "0" to "1", R1 (2k) from "1" to "2".
 * Measurement from "2" to "0" -- no direct component between "2" and ground.
 * All 5mA from I1 flows through R1 to node "2" and then to ground via ammeter.
 */
function currentSourceCircuit(): Component[] {
  return [
    { id: 'I1', type: 'current-source', nodes: ['0', '1'], current: 0.005 } as CurrentSource,
    { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 2000 } as Resistor,
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
    // seriesCircuit: V1(10V) from "2" to "0", R1(1k) from "2" to "1"
    // Node "1" has no direct component to ground -- ammeter goes from "1" to "0"
    // Current = 10V / 1k = 10mA flowing from "2" through R1 to "1" to "0"
    const components = seriesCircuit();
    const current = measureCurrent('1', '0', components);
    expect(current).toBeCloseTo(0.01, 10);
  });

  it('inserts a zero-volt source and returns branch current from re-solved circuit', () => {
    // 3-resistor divider: V1(12V)->"in", R1(1k) "in"->"A", R2(2k) "A"->"B", R3(1k) "B"->"0"
    // Current = 12V / 4k = 3mA through all resistors in series
    // Ammeter between "A" and "B" (already connected by R2, but let's use a different point)
    // Measure between "in" and "A": ammeter captures total current from V1 through R1
    // Actually: ammeter goes from "in" to "A" -- these are connected by R1. That creates
    // a 0V source in parallel with R1, which would short R1. Use ammeter at a point
    // without a direct component.
    //
    // Better: use the 3-resistor divider and measure between "B" and ground "0"
    // R3 connects "B" to "0", so ammeter would be parallel. Instead measure at a gap:
    // V1 from "in" to "0", R1 from "in" to "A", R2 from "A" to "B", R3 from "B" to "C"
    // Ammeter from "C" to "0" -- captures the 3mA flowing to ground
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['in', '0'], voltage: 12 } as VoltageSource,
      { id: 'R1', type: 'resistor', nodes: ['in', 'A'], resistance: 1000 } as Resistor,
      { id: 'R2', type: 'resistor', nodes: ['A', 'B'], resistance: 2000 } as Resistor,
      { id: 'R3', type: 'resistor', nodes: ['B', 'C'], resistance: 1000 } as Resistor,
    ];
    // Current = 12V / 4k = 3mA, all in series
    const current = measureCurrent('C', '0', components);
    expect(current).toBeCloseTo(0.003, 10);
  });

  it('does not perturb existing node voltages (zero perturbation)', () => {
    // seriesCircuit: V1(10V) from "2" to "0", R1(1k) from "2" to "1"
    const components = seriesCircuit();
    const solutionBefore = dcAnalysis(components);

    // Measure current (which inserts ammeter internally between "1" and "0")
    measureCurrent('1', '0', components);

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
    // seriesCircuit: V1(10V) from "2" to "0", R1(1k) from "2" to "1"
    // Current flows from "1" toward "0": positive direction
    const components = seriesCircuit();
    const current = measureCurrent('1', '0', components);
    expect(current).toBeGreaterThan(0);

    // Reversed: from "0" to "1" should be negative
    const reversed = measureCurrent('0', '1', components);
    expect(reversed).toBeLessThan(0);
    expect(reversed).toBeCloseTo(-current, 10);
  });

  it('measures current in only the specified branch (multi-branch circuit)', () => {
    // Two parallel branches with separate intermediate nodes:
    // V1(10V) from "1" to "0", R1(1k) from "1" to "a", R2(2k) from "1" to "b"
    // Ammeter from "a" to "0" measures only R1 branch current
    // Ammeter from "b" to "0" measures only R2 branch current
    const branchedCircuit: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 10 } as VoltageSource,
      { id: 'R1', type: 'resistor', nodes: ['1', 'a'], resistance: 1000 } as Resistor,
      { id: 'R2', type: 'resistor', nodes: ['1', 'b'], resistance: 2000 } as Resistor,
    ];
    // Current through R1 branch: ammeter from "a" to "0"
    // V(1) = 10V, V(a) = 0V (ammeter makes it so), I = 10V / 1k = 10mA
    const currentR1 = measureCurrent('a', '0', branchedCircuit);
    expect(currentR1).toBeCloseTo(0.01, 4);

    // Current through R2 branch: ammeter from "b" to "0"
    const currentR2 = measureCurrent('b', '0', branchedCircuit);
    expect(currentR2).toBeCloseTo(0.005, 4);
  });

  it('measures current with a current source: 5mA through 2k resistor', () => {
    // currentSourceCircuit: I1(5mA) from "0" to "1", R1(2k) from "1" to "2"
    // All 5mA flows through R1 from "1" to "2", then ammeter from "2" to "0"
    const components = currentSourceCircuit();
    const current = measureCurrent('2', '0', components);
    expect(current).toBeCloseTo(0.005, 10);
  });
});
