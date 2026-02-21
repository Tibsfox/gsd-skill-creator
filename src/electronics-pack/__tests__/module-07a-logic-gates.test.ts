/**
 * Module 7A: Logic Gates -- Test suite
 *
 * Validates all 7 logic gate labs run in the LogicSimulator
 * and produce correct results via verify() functions.
 *
 * Labs:
 *   1. Gates from Transistors (m7a-lab-01)
 *   2. Boolean Simplification (m7a-lab-02)
 *   3. De Morgan's Theorem (m7a-lab-03)
 *   4. 4-Bit Adder (m7a-lab-04)
 *   5. Multiplexer (m7a-lab-05)
 *   6. Decoder (m7a-lab-06)
 *   7. Propagation Delay (m7a-lab-07)
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../modules/07a-logic-gates/labs';

// ============================================================================
// Structural tests -- lab array shape and metadata
// ============================================================================

describe('Module 7A: Logic Gates -- Structure', () => {
  it('exports exactly 7 labs', () => {
    expect(labs).toHaveLength(7);
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
// Lab 1: Gates from Transistors (m7a-lab-01)
// ============================================================================

describe('Lab 1: Gates from Transistors', () => {
  it('has id "m7a-lab-01"', () => {
    expect(labs[0].id).toBe('m7a-lab-01');
  });

  it('has title "Gates from Transistors"', () => {
    expect(labs[0].title).toBe('Gates from Transistors');
  });

  it('has at least 3 steps', () => {
    expect(labs[0].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- NAND gate truth table from CMOS transistors', () => {
    expect(labs[0].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 2: Boolean Simplification (m7a-lab-02)
// ============================================================================

describe('Lab 2: Boolean Simplification', () => {
  it('has id "m7a-lab-02"', () => {
    expect(labs[1].id).toBe('m7a-lab-02');
  });

  it('has title "Boolean Simplification"', () => {
    expect(labs[1].title).toBe('Boolean Simplification');
  });

  it('has at least 3 steps', () => {
    expect(labs[1].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- simplified and unsimplified expressions match', () => {
    expect(labs[1].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 3: De Morgan's Theorem (m7a-lab-03)
// ============================================================================

describe("Lab 3: De Morgan's Theorem", () => {
  it('has id "m7a-lab-03"', () => {
    expect(labs[2].id).toBe('m7a-lab-03');
  });

  it("has title \"De Morgan's Theorem\"", () => {
    expect(labs[2].title).toBe("De Morgan's Theorem");
  });

  it('has at least 3 steps', () => {
    expect(labs[2].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- NOT(A AND B) equals NOT(A) OR NOT(B)', () => {
    expect(labs[2].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 4: 4-Bit Adder (m7a-lab-04)
// ============================================================================

describe('Lab 4: 4-Bit Adder', () => {
  it('has id "m7a-lab-04"', () => {
    expect(labs[3].id).toBe('m7a-lab-04');
  });

  it('has title "4-Bit Adder"', () => {
    expect(labs[3].title).toBe('4-Bit Adder');
  });

  it('has at least 3 steps', () => {
    expect(labs[3].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- all 256 input combinations correct', () => {
    expect(labs[3].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 5: Multiplexer (m7a-lab-05)
// ============================================================================

describe('Lab 5: Multiplexer', () => {
  it('has id "m7a-lab-05"', () => {
    expect(labs[4].id).toBe('m7a-lab-05');
  });

  it('has title "Multiplexer"', () => {
    expect(labs[4].title).toBe('Multiplexer');
  });

  it('has at least 3 steps', () => {
    expect(labs[4].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- 4-to-1 MUX routes correct input to output', () => {
    expect(labs[4].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 6: Decoder (m7a-lab-06)
// ============================================================================

describe('Lab 6: Decoder', () => {
  it('has id "m7a-lab-06"', () => {
    expect(labs[5].id).toBe('m7a-lab-06');
  });

  it('has title "Decoder"', () => {
    expect(labs[5].title).toBe('Decoder');
  });

  it('has at least 3 steps', () => {
    expect(labs[5].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- 2-to-4 decoder activates exactly one output', () => {
    expect(labs[5].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 7: Propagation Delay (m7a-lab-07)
// ============================================================================

describe('Lab 7: Propagation Delay', () => {
  it('has id "m7a-lab-07"', () => {
    expect(labs[6].id).toBe('m7a-lab-07');
  });

  it('has title "Propagation Delay"', () => {
    expect(labs[6].title).toBe('Propagation Delay');
  });

  it('has at least 3 steps', () => {
    expect(labs[6].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- inverter chain shows delay accumulation', () => {
    expect(labs[6].verify()).toBe(true);
  });
});

// ============================================================================
// All labs verify
// ============================================================================

describe('Module 7A: All labs verify', () => {
  it('all 7 verify() calls return true', () => {
    for (const lab of labs) {
      expect(lab.verify()).toBe(true);
    }
  });
});
