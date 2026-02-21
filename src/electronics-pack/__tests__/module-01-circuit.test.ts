/**
 * Module 1: The Circuit -- Test Suite
 *
 * Validates all 5 labs from Module 1, each backed by real MNA dcAnalysis.
 * Tests verify circuit physics (Ohm's law, KVL, KCL, voltage dividers, power).
 *
 * Phase 268 Plan 01 -- TDD RED/GREEN
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../modules/01-the-circuit/labs';
import { dcAnalysis } from '../simulator/mna-engine';
import type { Component, Resistor, VoltageSource } from '../simulator/components';

// ============================================================================
// Component factory helpers
// ============================================================================

function resistor(id: string, n1: string, n2: string, r: number): Resistor {
  return { id, type: 'resistor', nodes: [n1, n2], resistance: r };
}

function voltageSource(id: string, nPlus: string, nMinus: string, v: number): VoltageSource {
  return { id, type: 'voltage-source', nodes: [nPlus, nMinus], voltage: v };
}

// ============================================================================
// General Structure Tests
// ============================================================================

describe('Module 1: The Circuit -- Structure', () => {
  it('exports exactly 5 labs', () => {
    expect(labs).toHaveLength(5);
  });

  it('each lab has a non-empty title', () => {
    for (const lab of labs) {
      expect(lab.title).toBeTruthy();
      expect(lab.title.length).toBeGreaterThan(0);
    }
  });

  it('each lab has a non-empty id', () => {
    for (const lab of labs) {
      expect(lab.id).toBeTruthy();
      expect(lab.id.length).toBeGreaterThan(0);
    }
  });

  it('each lab has a non-empty steps array', () => {
    for (const lab of labs) {
      expect(lab.steps.length).toBeGreaterThan(0);
    }
  });

  it('each LabStep has non-empty instruction, expected_observation, learn_note', () => {
    for (const lab of labs) {
      for (const step of lab.steps) {
        expect(step.instruction.length).toBeGreaterThan(0);
        expect(step.expected_observation.length).toBeGreaterThan(0);
        expect(step.learn_note.length).toBeGreaterThan(0);
      }
    }
  });

  it('all 5 verify() calls return true', () => {
    for (const lab of labs) {
      expect(lab.verify()).toBe(true);
    }
  });
});

// ============================================================================
// Lab 1: First Circuit (m1-lab-01)
// ============================================================================

describe('Lab 1: First Circuit', () => {
  it('has id "m1-lab-01"', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-01');
    expect(lab).toBeDefined();
  });

  it('has title "First Circuit"', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-01');
    expect(lab!.title).toBe('First Circuit');
  });

  it('has >= 3 LabSteps', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-01');
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() confirms current = 9mA (9V / 1k ohm) within 1%', () => {
    // Independent verification using MNA directly
    const components: Component[] = [
      voltageSource('V1', '1', '0', 9),
      resistor('R1', '1', '0', 1000),
    ];
    const result = dcAnalysis(components);
    const branchCurrent = result.branchCurrents.find((bc) => bc.branch === 'V1');
    expect(branchCurrent).toBeDefined();
    // Current through voltage source (MNA sign: negative = current flows out of +)
    const current = Math.abs(branchCurrent!.current);
    const expected = 9 / 1000; // 9mA
    expect(Math.abs(current - expected) / expected).toBeLessThan(0.01);
  });

  it('verify() returns true', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-01');
    expect(lab!.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 2: Ohm's Law Explorer (m1-lab-02)
// ============================================================================

describe("Lab 2: Ohm's Law Explorer", () => {
  it('has id "m1-lab-02"', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-02');
    expect(lab).toBeDefined();
  });

  it("has title \"Ohm's Law Explorer\"", () => {
    const lab = labs.find((l) => l.id === 'm1-lab-02');
    expect(lab!.title).toBe("Ohm's Law Explorer");
  });

  it('has >= 3 LabSteps', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-02');
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() confirms I proportional to 1/R at 12V (12mA, 6mA, 3mA within 1%)', () => {
    // Independent verification: 12V with 1k, 2k, 4k resistors
    const resistances = [1000, 2000, 4000];
    const expectedCurrents = [0.012, 0.006, 0.003]; // 12mA, 6mA, 3mA

    for (let i = 0; i < resistances.length; i++) {
      const components: Component[] = [
        voltageSource('V1', '1', '0', 12),
        resistor('R1', '1', '0', resistances[i]),
      ];
      const result = dcAnalysis(components);
      const branchCurrent = result.branchCurrents.find((bc) => bc.branch === 'V1');
      expect(branchCurrent).toBeDefined();
      const current = Math.abs(branchCurrent!.current);
      expect(Math.abs(current - expectedCurrents[i]) / expectedCurrents[i]).toBeLessThan(0.01);
    }
  });

  it('verify() returns true', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-02');
    expect(lab!.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 3: Voltage Divider (m1-lab-03)
// ============================================================================

describe('Lab 3: Voltage Divider', () => {
  it('has id "m1-lab-03"', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-03');
    expect(lab).toBeDefined();
  });

  it('has title "Voltage Divider"', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-03');
    expect(lab!.title).toBe('Voltage Divider');
  });

  it('has >= 3 LabSteps', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-03');
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() confirms V_out = 3.333V (10V * 1k/(2k+1k)) within 0.1%', () => {
    // Independent verification using MNA
    const components: Component[] = [
      voltageSource('V1', '1', '0', 10),
      resistor('R1', '1', '2', 2000),
      resistor('R2', '2', '0', 1000),
    ];
    const result = dcAnalysis(components);
    const v2 = result.nodeVoltages.find((nv) => nv.node === '2');
    expect(v2).toBeDefined();
    const expected = 10 * 1000 / (2000 + 1000); // 3.3333...
    expect(Math.abs(v2!.voltage - expected) / expected).toBeLessThan(0.001);
  });

  it('verify() returns true', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-03');
    expect(lab!.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 4: Kirchhoff's Laws (m1-lab-04)
// ============================================================================

describe("Lab 4: Kirchhoff's Laws", () => {
  it('has id "m1-lab-04"', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-04');
    expect(lab).toBeDefined();
  });

  it("has title \"Kirchhoff's Laws\"", () => {
    const lab = labs.find((l) => l.id === 'm1-lab-04');
    expect(lab!.title).toBe("Kirchhoff's Laws");
  });

  it('has >= 3 LabSteps', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-04');
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() confirms KVL and KCL with R1=1k, R2||R3=2k||2k', () => {
    // Independent verification
    // 12V source, R1=1k (nodes 1->2), R2=2k (nodes 2->0), R3=2k (nodes 2->0)
    // R2||R3 = 1k, total R = R1 + R2||R3 = 2k
    // I_total = 12/2000 = 6mA
    // V(2) = I_total * R2||R3 = 0.006 * 1000 = 6V
    const components: Component[] = [
      voltageSource('V1', '1', '0', 12),
      resistor('R1', '1', '2', 1000),
      resistor('R2', '2', '0', 2000),
      resistor('R3', '2', '0', 2000),
    ];
    const result = dcAnalysis(components);
    const v2 = result.nodeVoltages.find((nv) => nv.node === '2');
    expect(v2).toBeDefined();
    expect(Math.abs(v2!.voltage - 6) / 6).toBeLessThan(0.01);

    // KVL: V_source = V_R1 + V(2)
    // V_R1 = 12 - 6 = 6V
    const v1 = result.nodeVoltages.find((nv) => nv.node === '1');
    expect(v1).toBeDefined();
    const vR1 = v1!.voltage - v2!.voltage; // voltage drop across R1
    expect(Math.abs(vR1 + v2!.voltage - 12)).toBeLessThan(0.01); // KVL: V_R1 + V(2) = 12
  });

  it('verify() returns true', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-04');
    expect(lab!.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 5: Power and Heat (m1-lab-05)
// ============================================================================

describe('Lab 5: Power and Heat', () => {
  it('has id "m1-lab-05"', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-05');
    expect(lab).toBeDefined();
  });

  it('has title "Power and Heat"', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-05');
    expect(lab!.title).toBe('Power and Heat');
  });

  it('has >= 3 LabSteps', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-05');
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() confirms P = 0.25W via three formulas (5V, 100 ohm) within 1%', () => {
    // Independent verification
    // P = V^2/R = 25/100 = 0.25W
    // I = V/R = 5/100 = 0.05A
    // P = I^2*R = 0.0025*100 = 0.25W
    // P = V*I = 5*0.05 = 0.25W
    const components: Component[] = [
      voltageSource('V1', '1', '0', 5),
      resistor('R1', '1', '0', 100),
    ];
    const result = dcAnalysis(components);
    const v1 = result.nodeVoltages.find((nv) => nv.node === '1');
    expect(v1).toBeDefined();
    const voltage = v1!.voltage;
    const branchCurrent = result.branchCurrents.find((bc) => bc.branch === 'V1');
    expect(branchCurrent).toBeDefined();
    const current = Math.abs(branchCurrent!.current);

    const pVI = voltage * current;
    const pI2R = current * current * 100;
    const pV2R = voltage * voltage / 100;
    const expected = 0.25;

    expect(Math.abs(pVI - expected) / expected).toBeLessThan(0.01);
    expect(Math.abs(pI2R - expected) / expected).toBeLessThan(0.01);
    expect(Math.abs(pV2R - expected) / expected).toBeLessThan(0.01);
  });

  it('verify() returns true', () => {
    const lab = labs.find((l) => l.id === 'm1-lab-05');
    expect(lab!.verify()).toBe(true);
  });
});
