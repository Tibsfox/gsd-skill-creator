/**
 * Module 6: Op-Amps -- Test suite
 *
 * Validates all 5 op-amp labs: golden rules, non-inverting amplifier,
 * active LPF (Sallen-Key), integrator, and comparator.
 * Each lab must have a verify() function backed by solveNonlinear with opamps.
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../modules/06-op-amps/labs.js';
import type { Lab, LabStep } from '../modules/06-op-amps/labs.js';

// ============================================================================
// Structural Tests
// ============================================================================

describe('Module 6: Op-Amps — Structural', () => {
  it('exports exactly 8 labs', () => {
    expect(labs).toHaveLength(8);
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

  it('each lab has a verify function', () => {
    for (const lab of labs) {
      expect(typeof lab.verify).toBe('function');
    }
  });
});

// ============================================================================
// Lab 1: Op-Amp Golden Rules (m6-lab-01)
// ============================================================================

describe('Module 6 Lab 1: Op-Amp Golden Rules', () => {
  it('has id m6-lab-01', () => {
    expect(labs[0].id).toBe('m6-lab-01');
  });

  it('has title "Op-Amp Golden Rules"', () => {
    expect(labs[0].title).toBe('Op-Amp Golden Rules');
  });

  it('has >= 3 lab steps', () => {
    expect(labs[0].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- voltage follower V_out ~ 3.3V', () => {
    expect(labs[0].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 2: Non-Inverting Amplifier (m6-lab-02)
// ============================================================================

describe('Module 6 Lab 2: Non-Inverting Amplifier', () => {
  it('has id m6-lab-02', () => {
    expect(labs[1].id).toBe('m6-lab-02');
  });

  it('has title "Non-Inverting Amplifier"', () => {
    expect(labs[1].title).toBe('Non-Inverting Amplifier');
  });

  it('has >= 3 lab steps', () => {
    expect(labs[1].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- gain of 10, V_out ~ 10V', () => {
    expect(labs[1].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 3: Active Low-Pass Filter Sallen-Key (m6-lab-03)
// ============================================================================

describe('Module 6 Lab 3: Active Low-Pass Filter (Sallen-Key)', () => {
  it('has id m6-lab-03', () => {
    expect(labs[2].id).toBe('m6-lab-03');
  });

  it('has title "Active Low-Pass Filter (Sallen-Key)"', () => {
    expect(labs[2].title).toBe('Active Low-Pass Filter (Sallen-Key)');
  });

  it('has >= 3 lab steps', () => {
    expect(labs[2].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- DC passband V_out ~ 1V', () => {
    expect(labs[2].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 4: Integrator (m6-lab-04)
// ============================================================================

describe('Module 6 Lab 4: Integrator', () => {
  it('has id m6-lab-04', () => {
    expect(labs[3].id).toBe('m6-lab-04');
  });

  it('has title "Integrator"', () => {
    expect(labs[3].title).toBe('Integrator');
  });

  it('has >= 3 lab steps', () => {
    expect(labs[3].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- DC gain -100, V_out ~ -10V', () => {
    expect(labs[3].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 5: Comparator (m6-lab-05)
// ============================================================================

describe('Module 6 Lab 5: Comparator', () => {
  it('has id m6-lab-05', () => {
    expect(labs[4].id).toBe('m6-lab-05');
  });

  it('has title "Comparator"', () => {
    expect(labs[4].title).toBe('Comparator');
  });

  it('has >= 3 lab steps', () => {
    expect(labs[4].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- V_out > 100V when V+ > V-', () => {
    expect(labs[4].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 6: Summing Amplifier (m6-lab-06)
// ============================================================================

describe('Module 6 Lab 6: Summing Amplifier', () => {
  it('has id m6-lab-06', () => {
    expect(labs[5].id).toBe('m6-lab-06');
  });

  it('has title "Summing Amplifier"', () => {
    expect(labs[5].title).toBe('Summing Amplifier');
  });

  it('has >= 3 lab steps', () => {
    expect(labs[5].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- V_out ~ -6V (unity-gain summing of 1+2+3)', () => {
    expect(labs[5].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 7: Differentiator (m6-lab-07)
// ============================================================================

describe('Module 6 Lab 7: Differentiator', () => {
  it('has id m6-lab-07', () => {
    expect(labs[6].id).toBe('m6-lab-07');
  });

  it('has title "Differentiator"', () => {
    expect(labs[6].title).toBe('Differentiator');
  });

  it('has >= 3 lab steps', () => {
    expect(labs[6].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- DC V_out ~ 0V, tau = 1ms', () => {
    expect(labs[6].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 8: Op-Amp Non-Idealities (m6-lab-08)
// ============================================================================

describe('Module 6 Lab 8: Op-Amp Non-Idealities', () => {
  it('has id m6-lab-08', () => {
    expect(labs[7].id).toBe('m6-lab-08');
  });

  it('has title "Op-Amp Non-Idealities"', () => {
    expect(labs[7].title).toBe('Op-Amp Non-Idealities');
  });

  it('has >= 3 lab steps', () => {
    expect(labs[7].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- GBW/offset/slew math verified', () => {
    expect(labs[7].verify()).toBe(true);
  });
});

// ============================================================================
// All Labs Verify
// ============================================================================

describe('Module 6: All labs verify', () => {
  it('all 8 verify() calls return true', () => {
    for (const lab of labs) {
      expect(lab.verify()).toBe(true);
    }
  });
});
