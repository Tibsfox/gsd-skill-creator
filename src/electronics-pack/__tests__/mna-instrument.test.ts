/**
 * MNA Instrumentation Module Tests
 *
 * Tests for glass-box MNA instrumentation that exposes step-by-step
 * matrix assembly and solution process.
 *
 * Phase 511 Plan 01 -- ELEC-06
 */

import { describe, it, expect } from 'vitest';
import {
  instrumentedDCAnalysis,
  instrumentedNonlinearAnalysis,
  type MNAStep,
  type MNATrace,
} from '../simulator/mna-instrument.js';
import { dcAnalysis } from '../simulator/mna-engine.js';
import type { Component } from '../simulator/components.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** 10 V source + 2 k / 1 k resistor divider (output ~3.333 V at node 'mid') */
const voltageDivider: Component[] = [
  { id: 'V1', type: 'voltage-source', nodes: ['in', '0'], voltage: 10 },
  { id: 'R1', type: 'resistor', nodes: ['in', 'mid'], resistance: 2000 },
  { id: 'R2', type: 'resistor', nodes: ['mid', '0'], resistance: 1000 },
];

/** Forward-biased diode circuit: 5 V source + 1 k resistor + diode to ground */
const diodeCircuit: Component[] = [
  { id: 'V1', type: 'voltage-source', nodes: ['vcc', '0'], voltage: 5 },
  { id: 'R1', type: 'resistor', nodes: ['vcc', 'anode'], resistance: 1000 },
  {
    id: 'D1',
    type: 'diode',
    nodes: ['anode', '0'],
    saturationCurrent: 1e-12,
    thermalVoltage: 0.026,
  },
];

/** Minimal circuit: single voltage source + single resistor */
const minimalCircuit: Component[] = [
  { id: 'V1', type: 'voltage-source', nodes: ['n1', '0'], voltage: 5 },
  { id: 'R1', type: 'resistor', nodes: ['n1', '0'], resistance: 1000 },
];

// ---------------------------------------------------------------------------
// instrumentedDCAnalysis
// ---------------------------------------------------------------------------

describe('instrumentedDCAnalysis', () => {
  it('returns trace with 5 phase types for voltage divider', () => {
    const { trace } = instrumentedDCAnalysis(voltageDivider);
    const phases = trace.steps.map((s: MNAStep) => s.phase);

    expect(phases).toContain('collect-nodes');
    expect(phases).toContain('stamp-component');
    expect(phases).toContain('matrix-complete');
    expect(phases).toContain('solve');
    expect(phases).toContain('extract-results');
  });

  it('groups stamp entries by component ID', () => {
    const { trace } = instrumentedDCAnalysis(voltageDivider);
    const stampSteps = trace.steps.filter(
      (s: MNAStep) => s.phase === 'stamp-component',
    );

    // Should have one step per unique component
    const componentIds = stampSteps.map((s: MNAStep) => s.componentId);
    expect(componentIds).toContain('V1');
    expect(componentIds).toContain('R1');
    expect(componentIds).toContain('R2');

    // Each stamp step should have stampEntries
    for (const step of stampSteps) {
      expect(step.stampEntries).toBeDefined();
      expect(step.stampEntries!.length).toBeGreaterThan(0);
    }
  });

  it('matrix-complete step contains matrixSnapshot and rhsSnapshot', () => {
    const { trace } = instrumentedDCAnalysis(voltageDivider);
    const matrixStep = trace.steps.find(
      (s: MNAStep) => s.phase === 'matrix-complete',
    );

    expect(matrixStep).toBeDefined();
    expect(matrixStep!.matrixSnapshot).toBeDefined();
    expect(Array.isArray(matrixStep!.matrixSnapshot)).toBe(true);
    expect(matrixStep!.rhsSnapshot).toBeDefined();
    expect(Array.isArray(matrixStep!.rhsSnapshot)).toBe(true);
  });

  it('extract-results step contains formatted node voltages', () => {
    const { trace } = instrumentedDCAnalysis(voltageDivider);
    const extractStep = trace.steps.find(
      (s: MNAStep) => s.phase === 'extract-results',
    );

    expect(extractStep).toBeDefined();
    // Should contain node voltage values formatted as name=value.xxxxV
    expect(extractStep!.description).toMatch(/\d+\.\d{4}V/);
  });

  it('result matches dcAnalysis output for the same circuit', () => {
    const { result } = instrumentedDCAnalysis(voltageDivider);
    const reference = dcAnalysis(voltageDivider);

    expect(result.nodeVoltages.length).toBe(reference.nodeVoltages.length);
    for (let i = 0; i < result.nodeVoltages.length; i++) {
      expect(result.nodeVoltages[i].node).toBe(reference.nodeVoltages[i].node);
      expect(result.nodeVoltages[i].voltage).toBeCloseTo(
        reference.nodeVoltages[i].voltage,
        6,
      );
    }

    expect(result.branchCurrents.length).toBe(
      reference.branchCurrents.length,
    );
    for (let i = 0; i < result.branchCurrents.length; i++) {
      expect(result.branchCurrents[i].branch).toBe(
        reference.branchCurrents[i].branch,
      );
      expect(result.branchCurrents[i].current).toBeCloseTo(
        reference.branchCurrents[i].current,
        6,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// instrumentedNonlinearAnalysis
// ---------------------------------------------------------------------------

describe('instrumentedNonlinearAnalysis', () => {
  it('returns converged=true for forward-biased diode circuit', () => {
    const { result } = instrumentedNonlinearAnalysis(diodeCircuit);
    expect(result.converged).toBe(true);
  });

  it('trace contains stamp-component phases', () => {
    const { trace } = instrumentedNonlinearAnalysis(diodeCircuit);
    const stampSteps = trace.steps.filter(
      (s: MNAStep) => s.phase === 'stamp-component',
    );
    expect(stampSteps.length).toBeGreaterThan(0);
  });

  it('trace includes iteration information in step descriptions', () => {
    const { trace } = instrumentedNonlinearAnalysis(diodeCircuit);
    const solveStep = trace.steps.find((s: MNAStep) => s.phase === 'solve');
    expect(solveStep).toBeDefined();
    expect(solveStep!.description).toMatch(/iteration/i);
  });

  it('nodeVoltages are reasonable for forward-biased diode', () => {
    const { result } = instrumentedNonlinearAnalysis(diodeCircuit);
    // The anode voltage should be around 0.6V (diode forward voltage)
    const anodeVoltage = result.nodeVoltages.find((nv) => nv.node === 'anode');
    expect(anodeVoltage).toBeDefined();
    // With piecewise-linear model: V_anode should be between 0.3 and 1.5V
    expect(anodeVoltage!.voltage).toBeGreaterThan(0.3);
    expect(anodeVoltage!.voltage).toBeLessThan(1.5);
  });
});

// ---------------------------------------------------------------------------
// Edge case: minimal circuit
// ---------------------------------------------------------------------------

describe('instrumentedDCAnalysis edge case', () => {
  it('produces minimal trace for single VS + resistor', () => {
    const { trace, result } = instrumentedDCAnalysis(minimalCircuit);

    // Should still have all 5 phase types
    const phases = new Set(trace.steps.map((s: MNAStep) => s.phase));
    expect(phases.has('collect-nodes')).toBe(true);
    expect(phases.has('stamp-component')).toBe(true);
    expect(phases.has('matrix-complete')).toBe(true);
    expect(phases.has('solve')).toBe(true);
    expect(phases.has('extract-results')).toBe(true);

    // stamp-component steps: one per component (V1, R1)
    const stampSteps = trace.steps.filter(
      (s: MNAStep) => s.phase === 'stamp-component',
    );
    expect(stampSteps.length).toBe(2);

    // Result should have correct voltage: 5V at n1
    const n1 = result.nodeVoltages.find((nv) => nv.node === 'n1');
    expect(n1).toBeDefined();
    expect(n1!.voltage).toBeCloseTo(5, 4);
  });
});
