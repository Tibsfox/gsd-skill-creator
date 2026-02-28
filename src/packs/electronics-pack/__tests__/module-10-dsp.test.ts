/**
 * Module 10: Digital Signal Processing -- Test Suite
 *
 * Validates all 5 DSP labs: moving average, FIR designer, FFT spectrum
 * analyzer, windowing effects, and real-time audio EQ.
 *
 * TDD RED phase: tests written before lab implementation.
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../modules/10-dsp/labs.js';
import { dspFFT } from '../simulator/dsp-engine.js';

// ============================================================================
// Helper: generate a sine wave
// ============================================================================

function generateSine(
  freq: number,
  sampleRate: number,
  numSamples: number,
  amplitude: number = 1.0,
): number[] {
  const samples: number[] = [];
  for (let n = 0; n < numSamples; n++) {
    samples.push(amplitude * Math.sin(2 * Math.PI * freq * n / sampleRate));
  }
  return samples;
}

// ============================================================================
// General structure tests
// ============================================================================

describe('Module 10: DSP -- Lab structure', () => {
  it('has exactly 5 labs', () => {
    expect(labs).toHaveLength(5);
  });

  it('each lab has non-empty id, title, and steps', () => {
    for (const lab of labs) {
      expect(lab.id).toBeTruthy();
      expect(lab.title).toBeTruthy();
      expect(lab.steps.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('each LabStep has instruction, expected_observation, and learn_note', () => {
    for (const lab of labs) {
      for (const step of lab.steps) {
        expect(step.instruction).toBeTruthy();
        expect(step.expected_observation).toBeTruthy();
        expect(step.learn_note).toBeTruthy();
      }
    }
  });

  it('lab IDs follow m10-lab-NN pattern', () => {
    const expectedIds = [
      'm10-lab-01',
      'm10-lab-02',
      'm10-lab-03',
      'm10-lab-04',
      'm10-lab-05',
    ];
    for (let i = 0; i < labs.length; i++) {
      expect(labs[i].id).toBe(expectedIds[i]);
    }
  });
});

// ============================================================================
// Lab 1: Moving Average Filter
// ============================================================================

describe('Module 10: Lab 1 -- Moving Average Filter', () => {
  it('has id m10-lab-01 and title "Moving Average Filter"', () => {
    const lab = labs.find((l) => l.id === 'm10-lab-01');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('Moving Average Filter');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm10-lab-01')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- filtered signal preserves 200 Hz and reduces noise', () => {
    const lab = labs.find((l) => l.id === 'm10-lab-01')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 2: FIR Filter Designer
// ============================================================================

describe('Module 10: Lab 2 -- FIR Filter Designer', () => {
  it('has id m10-lab-02 and title "FIR Filter Designer"', () => {
    const lab = labs.find((l) => l.id === 'm10-lab-02');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('FIR Filter Designer');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm10-lab-02')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- 200 Hz passes, 2000 Hz attenuated, symmetric coefficients', () => {
    const lab = labs.find((l) => l.id === 'm10-lab-02')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 3: FFT Spectrum Analyzer
// ============================================================================

describe('Module 10: Lab 3 -- FFT Spectrum Analyzer', () => {
  it('has id m10-lab-03 and title "FFT Spectrum Analyzer"', () => {
    const lab = labs.find((l) => l.id === 'm10-lab-03');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('FFT Spectrum Analyzer');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm10-lab-03')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- identifies 250/750/1500 Hz peaks with correct magnitudes', () => {
    const lab = labs.find((l) => l.id === 'm10-lab-03')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 4: Windowing Effects
// ============================================================================

describe('Module 10: Lab 4 -- Windowing Effects', () => {
  it('has id m10-lab-04 and title "Windowing Effects"', () => {
    const lab = labs.find((l) => l.id === 'm10-lab-04');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('Windowing Effects');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm10-lab-04')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- windowed FFT has fewer leakage bins than rectangular', () => {
    const lab = labs.find((l) => l.id === 'm10-lab-04')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 5: Real-Time Audio EQ
// ============================================================================

describe('Module 10: Lab 5 -- Real-Time Audio EQ', () => {
  it('has id m10-lab-05 and title "Real-Time Audio EQ"', () => {
    const lab = labs.find((l) => l.id === 'm10-lab-05');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('Real-Time Audio EQ');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm10-lab-05')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- EQ extracts bass/mid/treble bands correctly', () => {
    const lab = labs.find((l) => l.id === 'm10-lab-05')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// All labs verify
// ============================================================================

describe('Module 10: All labs verify', () => {
  it('all 5 verify() calls return true', () => {
    for (const lab of labs) {
      expect(lab.verify()).toBe(true);
    }
  });
});
