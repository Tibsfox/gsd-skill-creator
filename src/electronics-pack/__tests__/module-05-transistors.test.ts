/**
 * Module 5: Transistors -- Test Suite
 *
 * Validates all 8 transistor labs:
 *   Lab 1: BJT Switch (NPN saturation)
 *   Lab 2: Common-Emitter Amplifier (voltage divider bias)
 *   Lab 3: Emitter Follower (unity gain buffer)
 *   Lab 4: MOSFET Switch (resistor model for on-state)
 *   Lab 5: Current Mirror (matched BJT pair)
 *   Lab 6: Differential Amplifier (matched diff pair)
 *   Lab 7: JFET Characteristics (Shockley equation)
 *   Lab 8: FET Amplifier (common-source with source degeneration)
 *
 * Labs 1-3, 5-6 use solveNonlinear from MNA engine.
 * Lab 4 uses dcAnalysis (linear model, Phase 270 for full MOSFET).
 * Labs 7-8 use pure mathematical verification (no JFET component type).
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../modules/05-transistors/labs.js';
import type { Lab, LabStep } from '../modules/05-transistors/labs.js';

// ============================================================================
// Structure tests
// ============================================================================

describe('Module 5: Transistors -- structure', () => {
  it('exports exactly 8 labs', () => {
    expect(labs).toHaveLength(8);
  });

  it('each lab has non-empty id, title, and steps', () => {
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
// Lab 1: BJT Switch
// ============================================================================

describe('Lab 1: BJT Switch (m5-lab-01)', () => {
  it('has correct id and title', () => {
    const lab = labs[0];
    expect(lab.id).toBe('m5-lab-01');
    expect(lab.title).toBe('BJT Switch');
  });

  it('has at least 3 steps', () => {
    expect(labs[0].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- BJT saturates, V_collector near ground', () => {
    expect(labs[0].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 2: Common-Emitter Amplifier
// ============================================================================

describe('Lab 2: Common-Emitter Amplifier (m5-lab-02)', () => {
  it('has correct id and title', () => {
    const lab = labs[1];
    expect(lab.id).toBe('m5-lab-02');
    expect(lab.title).toBe('Common-Emitter Amplifier');
  });

  it('has at least 3 steps', () => {
    expect(labs[1].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- bias point is physically reasonable', () => {
    expect(labs[1].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 3: Emitter Follower
// ============================================================================

describe('Lab 3: Emitter Follower (m5-lab-03)', () => {
  it('has correct id and title', () => {
    const lab = labs[2];
    expect(lab.id).toBe('m5-lab-03');
    expect(lab.title).toBe('Emitter Follower');
  });

  it('has at least 3 steps', () => {
    expect(labs[2].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- V_emitter follows V_base minus ~0.6V', () => {
    expect(labs[2].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 4: MOSFET Switch
// ============================================================================

describe('Lab 4: MOSFET Switch (m5-lab-04)', () => {
  it('has correct id and title', () => {
    const lab = labs[3];
    expect(lab.id).toBe('m5-lab-04');
    expect(lab.title).toBe('MOSFET Switch');
  });

  it('has at least 3 steps', () => {
    expect(labs[3].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- MOSFET on, V_drain near 0V', () => {
    expect(labs[3].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 5: Current Mirror
// ============================================================================

describe('Lab 5: Current Mirror (m5-lab-05)', () => {
  it('has correct id and title', () => {
    const lab = labs[4];
    expect(lab.id).toBe('m5-lab-05');
    expect(lab.title).toBe('Current Mirror');
  });

  it('has at least 3 steps', () => {
    expect(labs[4].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- I_mirror matches I_ref within 10%', () => {
    expect(labs[4].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 6: Differential Amplifier
// ============================================================================

describe('Lab 6: Differential Amplifier (m5-lab-06)', () => {
  it('has correct id and title', () => {
    const lab = labs.find((l) => l.id === 'm5-lab-06')!;
    expect(lab).toBeDefined();
    expect(lab.id).toBe('m5-lab-06');
    expect(lab.title).toBe('Differential Amplifier');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm5-lab-06')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('learn_notes reference H&H 2.3 or Ch.2', () => {
    const lab = labs.find((l) => l.id === 'm5-lab-06')!;
    const hasHHRef = lab.steps.some(
      (s) => s.learn_note.includes('H&H 2.3') || s.learn_note.includes('H&H Ch.2'),
    );
    expect(hasHHRef).toBe(true);
  });

  it('verify() returns true -- differential gain > 10', () => {
    const lab = labs.find((l) => l.id === 'm5-lab-06')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 7: JFET Characteristics
// ============================================================================

describe('Lab 7: JFET Characteristics (m5-lab-07)', () => {
  it('has correct id and title', () => {
    const lab = labs.find((l) => l.id === 'm5-lab-07')!;
    expect(lab).toBeDefined();
    expect(lab.id).toBe('m5-lab-07');
    expect(lab.title).toBe('JFET Characteristics');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm5-lab-07')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('learn_notes reference H&H 3.1 or Ch.3', () => {
    const lab = labs.find((l) => l.id === 'm5-lab-07')!;
    const hasHHRef = lab.steps.some(
      (s) => s.learn_note.includes('H&H 3.1') || s.learn_note.includes('H&H Ch.3'),
    );
    expect(hasHHRef).toBe(true);
  });

  it('verify() returns true -- Shockley equation drain current and transconductance', () => {
    const lab = labs.find((l) => l.id === 'm5-lab-07')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 8: FET Amplifier
// ============================================================================

describe('Lab 8: FET Amplifier (m5-lab-08)', () => {
  it('has correct id and title', () => {
    const lab = labs.find((l) => l.id === 'm5-lab-08')!;
    expect(lab).toBeDefined();
    expect(lab.id).toBe('m5-lab-08');
    expect(lab.title).toBe('FET Amplifier');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm5-lab-08')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('learn_notes reference H&H 3.2 or Ch.3', () => {
    const lab = labs.find((l) => l.id === 'm5-lab-08')!;
    const hasHHRef = lab.steps.some(
      (s) => s.learn_note.includes('H&H 3.2') || s.learn_note.includes('H&H Ch.3'),
    );
    expect(hasHHRef).toBe(true);
  });

  it('verify() returns true -- common-source FET amplifier gain > 2', () => {
    const lab = labs.find((l) => l.id === 'm5-lab-08')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// All verify() calls pass
// ============================================================================

describe('Module 5: all labs verify', () => {
  it('all 8 verify() functions return true', () => {
    for (const lab of labs) {
      expect(lab.verify()).toBe(true);
    }
  });
});
