/**
 * Module 7: Power Supplies -- Test suite
 *
 * Validates all 5 power supply labs run in the MNA simulator
 * and produce correct results via verify() functions.
 *
 * Labs:
 *   1. 7805 Linear Regulator (m7-lab-01)
 *   2. Buck Converter (m7-lab-02)
 *   3. Boost Converter (m7-lab-03)
 *   4. Load Regulation (m7-lab-04)
 *   5. CC/CV Battery Charger (m7-lab-05)
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../modules/07-power-supplies/labs';

// ============================================================================
// Structural tests -- lab array shape and metadata
// ============================================================================

describe('Module 7: Power Supplies -- Structure', () => {
  it('exports exactly 5 labs', () => {
    expect(labs).toHaveLength(5);
  });

  it('each lab has a non-empty id', () => {
    for (const lab of labs) {
      expect(lab.id).toBeTruthy();
      expect(typeof lab.id).toBe('string');
      expect(lab.id.length).toBeGreaterThan(0);
    }
  });

  it('each lab has a non-empty title', () => {
    for (const lab of labs) {
      expect(lab.title).toBeTruthy();
      expect(typeof lab.title).toBe('string');
      expect(lab.title.length).toBeGreaterThan(0);
    }
  });

  it('each lab has a non-empty steps array', () => {
    for (const lab of labs) {
      expect(Array.isArray(lab.steps)).toBe(true);
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

  it('each lab has a verify function', () => {
    for (const lab of labs) {
      expect(typeof lab.verify).toBe('function');
    }
  });
});

// ============================================================================
// Lab 1: 7805 Linear Regulator (m7-lab-01)
// ============================================================================

describe('Lab 1: 7805 Linear Regulator', () => {
  it('has id "m7-lab-01"', () => {
    expect(labs[0].id).toBe('m7-lab-01');
  });

  it('has title "7805 Linear Regulator"', () => {
    expect(labs[0].title).toBe('7805 Linear Regulator');
  });

  it('has at least 3 steps', () => {
    expect(labs[0].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- V_out = 5.0V from 12V input', () => {
    expect(labs[0].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 2: Buck Converter (m7-lab-02)
// ============================================================================

describe('Lab 2: Buck Converter', () => {
  it('has id "m7-lab-02"', () => {
    expect(labs[1].id).toBe('m7-lab-02');
  });

  it('has title "Buck Converter"', () => {
    expect(labs[1].title).toBe('Buck Converter');
  });

  it('has at least 3 steps', () => {
    expect(labs[1].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- V_out = 3.3V from 12V input', () => {
    expect(labs[1].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 3: Boost Converter (m7-lab-03)
// ============================================================================

describe('Lab 3: Boost Converter', () => {
  it('has id "m7-lab-03"', () => {
    expect(labs[2].id).toBe('m7-lab-03');
  });

  it('has title "Boost Converter"', () => {
    expect(labs[2].title).toBe('Boost Converter');
  });

  it('has at least 3 steps', () => {
    expect(labs[2].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- V_out = 5.0V from 3.3V input', () => {
    expect(labs[2].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 4: Load Regulation (m7-lab-04)
// ============================================================================

describe('Lab 4: Load Regulation', () => {
  it('has id "m7-lab-04"', () => {
    expect(labs[3].id).toBe('m7-lab-04');
  });

  it('has title "Load Regulation"', () => {
    expect(labs[3].title).toBe('Load Regulation');
  });

  it('has at least 3 steps', () => {
    expect(labs[3].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- V_out = 5.0V at both light and heavy load', () => {
    expect(labs[3].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 5: CC/CV Battery Charger (m7-lab-05)
// ============================================================================

describe('Lab 5: CC/CV Battery Charger', () => {
  it('has id "m7-lab-05"', () => {
    expect(labs[4].id).toBe('m7-lab-05');
  });

  it('has title "CC/CV Battery Charger"', () => {
    expect(labs[4].title).toBe('CC/CV Battery Charger');
  });

  it('has at least 3 steps', () => {
    expect(labs[4].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- CC phase current ~ 20mA', () => {
    expect(labs[4].verify()).toBe(true);
  });
});

// ============================================================================
// All labs verify
// ============================================================================

describe('Module 7: All labs verify', () => {
  it('all 5 verify() calls return true', () => {
    for (const lab of labs) {
      expect(lab.verify()).toBe(true);
    }
  });
});
