/**
 * Module 9: Data Conversion -- Test suite
 *
 * Validates all 5 data conversion labs backed by the DSP engine
 * (quantizeSignal, reconstructSignal, dspFFT). Labs simulate
 * ADC/DAC algorithms, aliasing, and sigma-delta concepts.
 *
 * Labs:
 *   1. R-2R DAC (m9-lab-01)
 *   2. SAR ADC (m9-lab-02)
 *   3. Aliasing Demo (m9-lab-03)
 *   4. Audio ADC/DAC Round-Trip (m9-lab-04)
 *   5. Sigma-Delta Concept (m9-lab-05)
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../modules/09-data-conversion/labs.js';

// ============================================================================
// Structural tests -- lab array shape and metadata
// ============================================================================

describe('Module 9: Data Conversion -- Structure', () => {
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
// Lab 1: R-2R DAC (m9-lab-01)
// ============================================================================

describe('Lab 1: R-2R DAC', () => {
  it('has id "m9-lab-01"', () => {
    expect(labs[0].id).toBe('m9-lab-01');
  });

  it('has title "R-2R DAC"', () => {
    expect(labs[0].title).toBe('R-2R DAC');
  });

  it('has at least 3 steps', () => {
    expect(labs[0].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- correct voltages for codes 0, 128, 255 with 8-bit 5V DAC', () => {
    expect(labs[0].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 2: SAR ADC (m9-lab-02)
// ============================================================================

describe('Lab 2: SAR ADC', () => {
  it('has id "m9-lab-02"', () => {
    expect(labs[1].id).toBe('m9-lab-02');
  });

  it('has title "SAR ADC"', () => {
    expect(labs[1].title).toBe('SAR ADC');
  });

  it('has at least 3 steps', () => {
    expect(labs[1].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- SAR converges on correct code for 3.3V input', () => {
    expect(labs[1].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 3: Aliasing Demo (m9-lab-03)
// ============================================================================

describe('Lab 3: Aliasing Demo', () => {
  it('has id "m9-lab-03"', () => {
    expect(labs[2].id).toBe('m9-lab-03');
  });

  it('has title "Aliasing Demo"', () => {
    expect(labs[2].title).toBe('Aliasing Demo');
  });

  it('has at least 3 steps', () => {
    expect(labs[2].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- proper sampling shows 1000 Hz, undersampled shows alias at 500 Hz', () => {
    expect(labs[2].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 4: Audio ADC/DAC Round-Trip (m9-lab-04)
// ============================================================================

describe('Lab 4: Audio ADC/DAC Round-Trip', () => {
  it('has id "m9-lab-04"', () => {
    expect(labs[3].id).toBe('m9-lab-04');
  });

  it('has title "Audio ADC/DAC Round-Trip"', () => {
    expect(labs[3].title).toBe('Audio ADC/DAC Round-Trip');
  });

  it('has at least 3 steps', () => {
    expect(labs[3].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- 440 Hz dominant in both 16-bit and 4-bit, 4-bit has higher noise floor', () => {
    expect(labs[3].verify()).toBe(true);
  });
});

// ============================================================================
// Lab 5: Sigma-Delta Concept (m9-lab-05)
// ============================================================================

describe('Lab 5: Sigma-Delta Concept', () => {
  it('has id "m9-lab-05"', () => {
    expect(labs[4].id).toBe('m9-lab-05');
  });

  it('has title "Sigma-Delta Concept"', () => {
    expect(labs[4].title).toBe('Sigma-Delta Concept');
  });

  it('has at least 3 steps', () => {
    expect(labs[4].steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- decimated 1-bit oversampled output recovers 100 Hz signal', () => {
    expect(labs[4].verify()).toBe(true);
  });
});

// ============================================================================
// All labs verify
// ============================================================================

describe('Module 9: All labs verify', () => {
  it('all 5 verify() calls return true', () => {
    for (const lab of labs) {
      expect(lab.verify()).toBe(true);
    }
  });
});
