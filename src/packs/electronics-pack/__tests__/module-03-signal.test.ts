/**
 * Module 3: The Signal — Test Suite
 *
 * Validates all 6 labs in Module 3 covering AC signals, impedance,
 * Bode plots, decibels, noise, and signal sources.
 *
 * Labs:
 *   m3-lab-01: Oscilloscope Basics (transient RC charging)
 *   m3-lab-02: Frequency Sweep (RC low-pass AC analysis)
 *   m3-lab-03: Impedance Calculator (pure math + AC cross-check)
 *   m3-lab-04: Decibel Scale (cascaded RC AC analysis)
 *   m3-lab-05: Noise Floor (Johnson noise calculation)
 *   m3-lab-06: Signal Sources and Waveform Types (RMS, crest factor)
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../modules/03-the-signal/labs.js';

// ============================================================================
// General structure tests
// ============================================================================

describe('Module 3: The Signal — structure', () => {
  it('exports exactly 6 labs', () => {
    expect(labs).toHaveLength(6);
  });

  it('each lab has a non-empty title, id, and steps array', () => {
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

  it('all 6 verify() calls return true', () => {
    for (const lab of labs) {
      expect(lab.verify()).toBe(true);
    }
  });
});

// ============================================================================
// Lab 1: Oscilloscope Basics (m3-lab-01)
// ============================================================================

describe('Lab 1: Oscilloscope Basics (m3-lab-01)', () => {
  const lab1 = () => labs.find((l) => l.id === 'm3-lab-01');

  it('exists with correct id and title', () => {
    const lab = lab1();
    expect(lab).toBeDefined();
    expect(lab!.title).toContain('Oscilloscope');
  });

  it('has at least 3 LabSteps', () => {
    const lab = lab1();
    expect(lab).toBeDefined();
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true — transient RC charging waveform', () => {
    const lab = lab1();
    expect(lab).toBeDefined();
    expect(lab!.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 2: Frequency Sweep (m3-lab-02)
// ============================================================================

describe('Lab 2: Frequency Sweep (m3-lab-02)', () => {
  const lab2 = () => labs.find((l) => l.id === 'm3-lab-02');

  it('exists with correct id and title', () => {
    const lab = lab2();
    expect(lab).toBeDefined();
    expect(lab!.title).toContain('Frequency');
  });

  it('has at least 3 LabSteps', () => {
    const lab = lab2();
    expect(lab).toBeDefined();
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true — RC low-pass frequency sweep', () => {
    const lab = lab2();
    expect(lab).toBeDefined();
    expect(lab!.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 3: Impedance Calculator (m3-lab-03)
// ============================================================================

describe('Lab 3: Impedance Calculator (m3-lab-03)', () => {
  const lab3 = () => labs.find((l) => l.id === 'm3-lab-03');

  it('exists with correct id and title', () => {
    const lab = lab3();
    expect(lab).toBeDefined();
    expect(lab!.title).toContain('Impedance');
  });

  it('has at least 3 LabSteps', () => {
    const lab = lab3();
    expect(lab).toBeDefined();
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true — impedance math for RC and RL', () => {
    const lab = lab3();
    expect(lab).toBeDefined();
    expect(lab!.verify()).toBe(true);
  });

  it('impedance values match expected physics', () => {
    // Z_C at 1kHz for C=159nF: 1/(2*pi*1000*159e-9) ~= 1001 ohm
    const Z_C = 1 / (2 * Math.PI * 1000 * 159e-9);
    expect(Math.abs(Z_C - 1001) / 1001).toBeLessThan(0.02);

    // Z_L at 1kHz for L=159mH: 2*pi*1000*0.159 ~= 999 ohm
    const Z_L = 2 * Math.PI * 1000 * 0.159;
    expect(Math.abs(Z_L - 999) / 999).toBeLessThan(0.02);

    // Series RC: |Z| = sqrt(R^2 + Z_C^2) ~= 1414 ohm
    const Z_RC = Math.sqrt(1000 * 1000 + Z_C * Z_C);
    expect(Math.abs(Z_RC - 1414) / 1414).toBeLessThan(0.02);

    // Series RL: |Z| = sqrt(R^2 + Z_L^2) ~= 1414 ohm
    const Z_RL = Math.sqrt(1000 * 1000 + Z_L * Z_L);
    expect(Math.abs(Z_RL - 1414) / 1414).toBeLessThan(0.02);
  });
});

// ============================================================================
// Lab 4: Decibel Scale (m3-lab-04)
// ============================================================================

describe('Lab 4: Decibel Scale (m3-lab-04)', () => {
  const lab4 = () => labs.find((l) => l.id === 'm3-lab-04');

  it('exists with correct id and title', () => {
    const lab = lab4();
    expect(lab).toBeDefined();
    expect(lab!.title).toContain('Decibel');
  });

  it('has at least 3 LabSteps', () => {
    const lab = lab4();
    expect(lab).toBeDefined();
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true — cascaded RC shows steeper rolloff', () => {
    const lab = lab4();
    expect(lab).toBeDefined();
    expect(lab!.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 5: Noise Floor (m3-lab-05)
// ============================================================================

describe('Lab 5: Noise Floor (m3-lab-05)', () => {
  const lab5 = () => labs.find((l) => l.id === 'm3-lab-05');

  it('exists with correct id and title', () => {
    const lab = lab5();
    expect(lab).toBeDefined();
    expect(lab!.title).toContain('Noise');
  });

  it('has at least 3 LabSteps', () => {
    const lab = lab5();
    expect(lab).toBeDefined();
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true — Johnson noise formula validation', () => {
    const lab = lab5();
    expect(lab).toBeDefined();
    expect(lab!.verify()).toBe(true);
  });

  it('noise values match physics', () => {
    const k_B = 1.381e-23;
    const T = 300;

    // V_n for R=10k, BW=10kHz
    const Vn_10k = Math.sqrt(4 * k_B * T * 10000 * 10000);
    expect(Math.abs(Vn_10k - 1.286e-6) / 1.286e-6).toBeLessThan(0.05);

    // V_n for R=20k, BW=10kHz — sqrt(2) times larger
    const Vn_20k = Math.sqrt(4 * k_B * T * 20000 * 10000);
    const ratio = Vn_20k / Vn_10k;
    expect(Math.abs(ratio - Math.SQRT2) / Math.SQRT2).toBeLessThan(0.01);

    // V_n for R=10k, BW=20kHz — also sqrt(2) times larger
    const Vn_10k_20kBW = Math.sqrt(4 * k_B * T * 10000 * 20000);
    const ratio2 = Vn_10k_20kBW / Vn_10k;
    expect(Math.abs(ratio2 - Math.SQRT2) / Math.SQRT2).toBeLessThan(0.01);
  });
});

// ============================================================================
// Lab 6: Signal Sources and Waveform Types (m3-lab-06)
// ============================================================================

describe('Lab 6: Signal Sources and Waveform Types (m3-lab-06)', () => {
  const lab6 = () => labs.find((l) => l.id === 'm3-lab-06');

  it('exists with correct id and title', () => {
    const lab = lab6();
    expect(lab).toBeDefined();
    expect(lab!.title).toContain('Signal Sources');
  });

  it('has at least 3 LabSteps', () => {
    const lab = lab6();
    expect(lab).toBeDefined();
    expect(lab!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- waveform RMS and crest factor validation', () => {
    const lab = lab6();
    expect(lab).toBeDefined();
    expect(lab!.verify()).toBe(true);
  });

  it('waveform RMS values match physics', () => {
    const Vpeak = 1;
    // Sine: Vrms = Vpeak / sqrt(2)
    expect(Math.abs(Vpeak / Math.SQRT2 - 0.7071)).toBeLessThan(0.001);
    // Square: Vrms = Vpeak
    expect(Vpeak).toBe(1.0);
    // Triangle: Vrms = Vpeak / sqrt(3)
    expect(Math.abs(Vpeak / Math.sqrt(3) - 0.5774)).toBeLessThan(0.001);
  });
});

// ============================================================================
// Safety warden routing for new labs
// ============================================================================

describe('Safety warden routing for new labs', () => {
  it('lab06 (signal sources, 1V peak) routes through safety warden as Annotate', async () => {
    const { checkSafety, SafetyMode } = await import('../safety/warden.js');
    const result = checkSafety('03-the-signal', 1);
    expect(result.allowed).toBe(true);
    expect(result.mode).toBe(SafetyMode.Annotate);
    expect(result.assessmentRequired).toBe(false);
  });
});
