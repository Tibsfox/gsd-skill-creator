/**
 * Module 8: Sequential Logic -- Test suite
 *
 * Validates all 5 sequential logic labs run in the LogicSimulator
 * and produce correct results via verify() functions.
 *
 * Labs:
 *   1. D Flip-Flop from NAND Gates (m8-lab-01)
 *   2. 4-Bit Binary Counter (m8-lab-02)
 *   3. Traffic Light Controller (m8-lab-03)
 *   4. 4-Bit Shift Register (m8-lab-04)
 *   5. SRAM Cell (m8-lab-05)
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../modules/08-sequential-logic/labs.js';

// ============================================================================
// Structural tests -- lab array shape and metadata
// ============================================================================

describe('Module 8: Sequential Logic -- Structure', () => {
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
// Lab 1: D Flip-Flop from NAND Gates (m8-lab-01)
// ============================================================================

describe('Lab 1: D Flip-Flop from NAND Gates', () => {
  it('has id "m8-lab-01"', () => {
    expect(labs[0].id).toBe('m8-lab-01');
  });

  it('has title "D Flip-Flop from NAND Gates"', () => {
    expect(labs[0].title).toBe('D Flip-Flop from NAND Gates');
  });

  it('has at least 3 steps', () => {
    expect(labs[0].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- D=0 on rising edge gives Q=0, D=1 gives Q=1', () => {
    expect(labs[0].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 2: 4-Bit Binary Counter (m8-lab-02)
// ============================================================================

describe('Lab 2: 4-Bit Binary Counter', () => {
  it('has id "m8-lab-02"', () => {
    expect(labs[1].id).toBe('m8-lab-02');
  });

  it('has title "4-Bit Binary Counter"', () => {
    expect(labs[1].title).toBe('4-Bit Binary Counter');
  });

  it('has at least 3 steps', () => {
    expect(labs[1].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- counts 0-15 and wraps to 0', () => {
    expect(labs[1].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 3: Traffic Light Controller (m8-lab-03)
// ============================================================================

describe('Lab 3: Traffic Light Controller', () => {
  it('has id "m8-lab-03"', () => {
    expect(labs[2].id).toBe('m8-lab-03');
  });

  it('has title "Traffic Light Controller"', () => {
    expect(labs[2].title).toBe('Traffic Light Controller');
  });

  it('has at least 3 steps', () => {
    expect(labs[2].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- cycles GREEN->YELLOW->RED->GREEN', () => {
    expect(labs[2].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 4: 4-Bit Shift Register (m8-lab-04)
// ============================================================================

describe('Lab 4: 4-Bit Shift Register', () => {
  it('has id "m8-lab-04"', () => {
    expect(labs[3].id).toBe('m8-lab-04');
  });

  it('has title "4-Bit Shift Register"', () => {
    expect(labs[3].title).toBe('4-Bit Shift Register');
  });

  it('has at least 3 steps', () => {
    expect(labs[3].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- serial input [1,0,1,1] shifts through 4 stages', () => {
    expect(labs[3].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 5: SRAM Cell (m8-lab-05)
// ============================================================================

describe('Lab 5: SRAM Cell', () => {
  it('has id "m8-lab-05"', () => {
    expect(labs[4].id).toBe('m8-lab-05');
  });

  it('has title "SRAM Cell"', () => {
    expect(labs[4].title).toBe('SRAM Cell');
  });

  it('has at least 3 steps', () => {
    expect(labs[4].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- write 1, hold, write 0, hold', () => {
    expect(labs[4].verify()).toBe(true);
  });
});

// ============================================================================
// All labs verify
// ============================================================================

describe('Module 8: All labs verify', () => {
  it('all 5 verify() calls return true', () => {
    for (const lab of labs) {
      expect(lab.verify()).toBe(true);
    }
  });
});
