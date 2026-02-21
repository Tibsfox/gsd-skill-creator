/**
 * Module 15: PCB Design -- Test suite
 *
 * Validates all 5 PCB design labs backed by the PCB layout tool engine
 * (pcb-layout.ts). Labs demonstrate schematic-to-PCB workflow, trace width
 * calculation, ground plane design, EMI assessment, and DFM review.
 *
 * Labs:
 *   1. Schematic to PCB (m15-lab-01)
 *   2. Trace Width Calculator (m15-lab-02)
 *   3. Ground Plane Design (m15-lab-03)
 *   4. EMI Assessment (m15-lab-04)
 *   5. DFM Review (m15-lab-05)
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../modules/15-pcb-design/labs';

// ============================================================================
// Structural tests -- lab array shape and metadata
// ============================================================================

describe('Module 15: PCB Design -- Structure', () => {
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
// Lab 1: Schematic to PCB (m15-lab-01)
// ============================================================================

describe('Lab 1: Schematic to PCB', () => {
  it('has id "m15-lab-01"', () => {
    expect(labs[0].id).toBe('m15-lab-01');
  });

  it('has title "Schematic to PCB"', () => {
    expect(labs[0].title).toBe('Schematic to PCB');
  });

  it('has at least 3 steps', () => {
    expect(labs[0].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- board has 3 components, 2+ traces, no DRC violations', () => {
    expect(labs[0].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 2: Trace Width Calculator (m15-lab-02)
// ============================================================================

describe('Lab 2: Trace Width Calculator', () => {
  it('has id "m15-lab-02"', () => {
    expect(labs[1].id).toBe('m15-lab-02');
  });

  it('has title "Trace Width Calculator"', () => {
    expect(labs[1].title).toBe('Trace Width Calculator');
  });

  it('has at least 3 steps', () => {
    expect(labs[1].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- power trace wider than signal, internal wider than external, all positive', () => {
    expect(labs[1].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 3: Ground Plane Design (m15-lab-03)
// ============================================================================

describe('Lab 3: Ground Plane Design', () => {
  it('has id "m15-lab-03"', () => {
    expect(labs[2].id).toBe('m15-lab-03');
  });

  it('has title "Ground Plane Design"', () => {
    expect(labs[2].title).toBe('Ground Plane Design');
  });

  it('has at least 3 steps', () => {
    expect(labs[2].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- crosstalk decreases with spacing, impedance 20-150 ohms, 3x rule < 0.10', () => {
    expect(labs[2].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 4: EMI Assessment (m15-lab-04)
// ============================================================================

describe('Lab 4: EMI Assessment', () => {
  it('has id "m15-lab-04"', () => {
    expect(labs[3].id).toBe('m15-lab-04');
  });

  it('has title "EMI Assessment"', () => {
    expect(labs[3].title).toBe('EMI Assessment');
  });

  it('has at least 3 steps', () => {
    expect(labs[3].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- risk low/moderate/high, skin depth decreases with frequency, 1GHz < 3um', () => {
    expect(labs[3].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 5: DFM Review (m15-lab-05)
// ============================================================================

describe('Lab 5: DFM Review', () => {
  it('has id "m15-lab-05"', () => {
    expect(labs[4].id).toBe('m15-lab-05');
  });

  it('has title "DFM Review"', () => {
    expect(labs[4].title).toBe('DFM Review');
  });

  it('has at least 3 steps', () => {
    expect(labs[4].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- 3+ DRC violations, Gerber has inner layers, 9+ total layers', () => {
    expect(labs[4].verify()).toBe(true);
  });
});

// ============================================================================
// All labs verify
// ============================================================================

describe('Module 15: All labs verify', () => {
  it('all 5 verify() calls return true', () => {
    for (const lab of labs) {
      expect(lab.verify()).toBe(true);
    }
  });
});
