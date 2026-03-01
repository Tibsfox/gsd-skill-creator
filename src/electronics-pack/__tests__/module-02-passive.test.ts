/**
 * Module 2: Passive Components -- Test Suite
 *
 * Validates all 7 labs: capacitor charge/discharge, RC LPF, RC HPF,
 * RLC resonance, Thevenin equivalence, inductor current rise, and
 * transformer action. Each lab must have proper
 * structure (id, title, steps with instruction/observation/note) and
 * a verify() function that returns true using real MNA analysis.
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../modules/02-passive-components/labs.js';
import type { Lab, LabStep } from '../modules/02-passive-components/labs.js';

// ============================================================================
// General Structure Tests
// ============================================================================

describe('Module 2: Passive Components -- Structure', () => {
  it('exports exactly 7 labs', () => {
    expect(labs).toHaveLength(7);
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

  it('all 7 verify() calls return true', () => {
    for (const lab of labs) {
      expect(lab.verify()).toBe(true);
    }
  });
});

// ============================================================================
// Lab 1: Capacitor Charge/Discharge (m2-lab-01)
// ============================================================================

describe('Lab 1: Capacitor Charge/Discharge', () => {
  it('has id "m2-lab-01"', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-01');
    expect(lab).toBeDefined();
  });

  it('has title "Capacitor Charge/Discharge"', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-01');
    expect(lab!.title).toBe('Capacitor Charge/Discharge');
  });

  it('has >= 3 LabSteps', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-01');
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true (checks cap voltage at t=tau is ~3.16V)', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-01');
    expect(lab!.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 2: RC Low-Pass Filter (m2-lab-02)
// ============================================================================

describe('Lab 2: RC Low-Pass Filter', () => {
  it('has id "m2-lab-02"', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-02');
    expect(lab).toBeDefined();
  });

  it('has title "RC Low-Pass Filter"', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-02');
    expect(lab!.title).toBe('RC Low-Pass Filter');
  });

  it('has >= 3 LabSteps', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-02');
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true (checks gain at 100Hz ~0dB, 1kHz ~-3dB, 10kHz ~-20dB)', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-02');
    expect(lab!.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 3: RC High-Pass Filter (m2-lab-03)
// ============================================================================

describe('Lab 3: RC High-Pass Filter', () => {
  it('has id "m2-lab-03"', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-03');
    expect(lab).toBeDefined();
  });

  it('has title "RC High-Pass Filter"', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-03');
    expect(lab!.title).toBe('RC High-Pass Filter');
  });

  it('has >= 3 LabSteps', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-03');
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true (checks gain at 10kHz ~0dB, 1kHz ~-3dB, 100Hz ~-20dB)', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-03');
    expect(lab!.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 4: RLC Resonance (m2-lab-04)
// ============================================================================

describe('Lab 4: RLC Resonance', () => {
  it('has id "m2-lab-04"', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-04');
    expect(lab).toBeDefined();
  });

  it('has title "RLC Resonance"', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-04');
    expect(lab!.title).toBe('RLC Resonance');
  });

  it('has >= 3 LabSteps', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-04');
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true (resonance near 3.16kHz, Q ~2.0)', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-04');
    expect(lab!.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 5: Thevenin Equivalence (m2-lab-05)
// ============================================================================

describe('Lab 5: Thevenin Equivalence', () => {
  it('has id "m2-lab-05"', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-05');
    expect(lab).toBeDefined();
  });

  it('has title "Thevenin Equivalence"', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-05');
    expect(lab!.title).toBe('Thevenin Equivalence');
  });

  it('has >= 3 LabSteps', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-05');
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true (original and Thevenin circuit match within 0.1%)', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-05');
    expect(lab!.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 6: Inductor Current Rise (m2-lab-06)
// ============================================================================

describe('Lab 6: Inductor Current Rise', () => {
  it('has id "m2-lab-06"', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-06');
    expect(lab).toBeDefined();
  });
  it('has title "Inductor Current Rise"', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-06');
    expect(lab!.title).toBe('Inductor Current Rise');
  });
  it('has >= 3 LabSteps', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-06');
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });
  it('verify() returns true (RL transient: current rises with tau = L/R)', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-06');
    expect(lab!.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 7: Transformer Action (m2-lab-07)
// ============================================================================

describe('Lab 7: Transformer Action', () => {
  it('has id "m2-lab-07"', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-07');
    expect(lab).toBeDefined();
  });
  it('has title "Transformer Action"', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-07');
    expect(lab!.title).toBe('Transformer Action');
  });
  it('has >= 3 LabSteps', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-07');
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });
  it('verify() returns true (turns ratio, impedance reflection, power conservation)', () => {
    const lab = labs.find((l) => l.id === 'm2-lab-07');
    expect(lab!.verify()).toBe(true);
  });
});

// ============================================================================
// Safety Warden Routing for New Labs
// ============================================================================

describe('Safety warden routing for new labs', () => {
  it('lab06 (5V inductor) routes through safety warden as Annotate', async () => {
    const { checkSafety, SafetyMode } = await import('../safety/warden.js');
    const result = checkSafety('02-passive-components', 5);
    expect(result.allowed).toBe(true);
    expect(result.mode).toBe(SafetyMode.Annotate);
    expect(result.assessmentRequired).toBe(false);
  });
  it('lab07 (5V transformer primary) routes through safety warden as Annotate', async () => {
    const { checkSafety, SafetyMode } = await import('../safety/warden.js');
    const result = checkSafety('02-passive-components', 5);
    expect(result.allowed).toBe(true);
    expect(result.mode).toBe(SafetyMode.Annotate);
    expect(result.assessmentRequired).toBe(false);
  });
});
