/**
 * Module 4: Diodes -- Test Suite
 *
 * Tests all 5 diode labs for correct MNA nonlinear simulation results.
 * Each lab uses solveNonlinear (Newton-Raphson) because diodes are
 * nonlinear devices requiring iterative solution.
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../modules/04-diodes/labs';
import type { Lab, LabStep } from '../modules/04-diodes/labs';

// ============================================================================
// General structure tests
// ============================================================================

describe('Module 4: Diodes -- Structure', () => {
  it('exports exactly 5 labs', () => {
    expect(labs).toHaveLength(5);
  });

  it('each lab has a non-empty id, title, and steps array', () => {
    for (const lab of labs) {
      expect(lab.id).toBeTruthy();
      expect(lab.title).toBeTruthy();
      expect(lab.steps.length).toBeGreaterThan(0);
    }
  });

  it('each LabStep has non-empty instruction, expected_observation, learn_note', () => {
    for (const lab of labs) {
      for (const step of lab.steps) {
        expect(step.instruction).toBeTruthy();
        expect(step.expected_observation).toBeTruthy();
        expect(step.learn_note).toBeTruthy();
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
// Lab 1: Diode I-V Curve (m4-lab-01)
// ============================================================================

describe('Lab 1: Diode I-V Curve (m4-lab-01)', () => {
  const lab = () => labs.find((l) => l.id === 'm4-lab-01')!;

  it('exists with correct id and title', () => {
    const l = lab();
    expect(l).toBeDefined();
    expect(l.id).toBe('m4-lab-01');
    expect(l.title).toBe('Diode I-V Curve');
  });

  it('has at least 3 LabSteps', () => {
    expect(lab().steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- forward-biased diode with V_drop ~ 0.6V, I ~ 4.4mA', () => {
    expect(lab().verify()).toBe(true);
  });
});

// ============================================================================
// Lab 2: Half-Wave Rectifier (m4-lab-02)
// ============================================================================

describe('Lab 2: Half-Wave Rectifier (m4-lab-02)', () => {
  const lab = () => labs.find((l) => l.id === 'm4-lab-02')!;

  it('exists with correct id and title', () => {
    const l = lab();
    expect(l).toBeDefined();
    expect(l.id).toBe('m4-lab-02');
    expect(l.title).toBe('Half-Wave Rectifier');
  });

  it('has at least 3 LabSteps', () => {
    expect(lab().steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- V_load ~ 9.4V for positive half-cycle', () => {
    expect(lab().verify()).toBe(true);
  });
});

// ============================================================================
// Lab 3: Full-Wave Bridge Rectifier (m4-lab-03)
// ============================================================================

describe('Lab 3: Full-Wave Bridge Rectifier (m4-lab-03)', () => {
  const lab = () => labs.find((l) => l.id === 'm4-lab-03')!;

  it('exists with correct id and title', () => {
    const l = lab();
    expect(l).toBeDefined();
    expect(l.id).toBe('m4-lab-03');
    expect(l.title).toBe('Full-Wave Bridge Rectifier');
  });

  it('has at least 3 LabSteps', () => {
    expect(lab().steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- V_load ~ 10.8V (two diode drops from 12V)', () => {
    expect(lab().verify()).toBe(true);
  });
});

// ============================================================================
// Lab 4: Zener Voltage Regulator (m4-lab-04)
// ============================================================================

describe('Lab 4: Zener Voltage Regulator (m4-lab-04)', () => {
  const lab = () => labs.find((l) => l.id === 'm4-lab-04')!;

  it('exists with correct id and title', () => {
    const l = lab();
    expect(l).toBeDefined();
    expect(l.id).toBe('m4-lab-04');
    expect(l.title).toBe('Zener Voltage Regulator');
  });

  it('has at least 3 LabSteps', () => {
    expect(lab().steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- regulated output ~ 5.1V', () => {
    expect(lab().verify()).toBe(true);
  });
});

// ============================================================================
// Lab 5: LED Driver (m4-lab-05)
// ============================================================================

describe('Lab 5: LED Driver (m4-lab-05)', () => {
  const lab = () => labs.find((l) => l.id === 'm4-lab-05')!;

  it('exists with correct id and title', () => {
    const l = lab();
    expect(l).toBeDefined();
    expect(l.id).toBe('m4-lab-05');
    expect(l.title).toBe('LED Driver');
  });

  it('has at least 3 LabSteps', () => {
    expect(lab().steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- LED current within 10% of target', () => {
    expect(lab().verify()).toBe(true);
  });
});
