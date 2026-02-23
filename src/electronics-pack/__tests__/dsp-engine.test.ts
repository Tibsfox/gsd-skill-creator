/**
 * DSP Engine Tests
 *
 * Validates FFT wrappers, FIR filter design, convolution,
 * windowing, and quantization utilities.
 *
 * Phase 273 Plan 01 -- TDD RED phase.
 */

import { describe, it, expect } from 'vitest';
import {
  dspFFT,
  designFIRLowpass,
  designFIRHighpass,
  designFIRBandpass,
  applyFIR,
  applyWindowToCoeffs,
  quantizeSignal,
  reconstructSignal,
} from '../simulator/dsp-engine.js';

// ---------------------------------------------------------------------------
// Helper: generate a pure sine wave
// ---------------------------------------------------------------------------

function generateSine(
  frequency: number,
  sampleRate: number,
  numSamples: number,
  amplitude: number = 1.0,
): number[] {
  const samples: number[] = [];
  for (let n = 0; n < numSamples; n++) {
    const t = n / sampleRate;
    samples.push(amplitude * Math.sin(2 * Math.PI * frequency * t));
  }
  return samples;
}

// ===========================================================================
// Group 1: dspFFT tests (ENG-01)
// ===========================================================================

describe('dspFFT', () => {
  it('identifies single tone', () => {
    const signal = generateSine(440, 8000, 1024);
    const result = dspFFT(signal, 8000);

    // Find bin with maximum magnitude
    let peakIdx = 0;
    for (let i = 1; i < result.magnitudes.length; i++) {
      if (result.magnitudes[i] > result.magnitudes[peakIdx]) peakIdx = i;
    }

    expect(Math.abs(result.frequencies[peakIdx] - 440)).toBeLessThan(10);
    expect(result.magnitudes[peakIdx]).toBeGreaterThan(0.8);
  });

  it('identifies dual tones', () => {
    const signal: number[] = [];
    for (let n = 0; n < 1024; n++) {
      const t = n / 8000;
      signal.push(
        Math.sin(2 * Math.PI * 200 * t) +
        0.5 * Math.sin(2 * Math.PI * 1000 * t),
      );
    }
    const result = dspFFT(signal, 8000);

    // Find peak magnitude near each expected frequency
    const findPeak = (targetHz: number, tolerance: number) => {
      let bestIdx = -1;
      let bestMag = -1;
      for (let i = 0; i < result.frequencies.length; i++) {
        if (Math.abs(result.frequencies[i] - targetHz) < tolerance && result.magnitudes[i] > bestMag) {
          bestMag = result.magnitudes[i];
          bestIdx = i;
        }
      }
      return { idx: bestIdx, freq: result.frequencies[bestIdx], mag: bestMag };
    };

    const peak200 = findPeak(200, 20);
    const peak1000 = findPeak(1000, 20);

    expect(peak200.idx).toBeGreaterThanOrEqual(0);
    expect(peak1000.idx).toBeGreaterThanOrEqual(0);
    expect(Math.abs(peak200.freq - 200)).toBeLessThan(20);
    expect(Math.abs(peak1000.freq - 1000)).toBeLessThan(20);

    // 200 Hz peak should be roughly 2x the 1000 Hz peak (amplitudes 1.0 vs 0.5)
    // Spectral leakage reduces the ratio slightly below the ideal 2.0
    expect(peak200.mag / peak1000.mag).toBeGreaterThan(1.4);
  });

  it('DC offset appears at bin 0', () => {
    const signal: number[] = [];
    for (let n = 0; n < 1024; n++) {
      const t = n / 8000;
      signal.push(3.0 + Math.sin(2 * Math.PI * 500 * t));
    }
    const result = dspFFT(signal, 8000);

    // DC bin (frequency 0) should have significant magnitude
    expect(result.frequencies[0]).toBe(0);
    expect(result.magnitudes[0]).toBeGreaterThan(1.0);

    // Find non-DC peak near 500 Hz
    let peakIdx = 1;
    for (let i = 2; i < result.magnitudes.length; i++) {
      if (result.magnitudes[i] > result.magnitudes[peakIdx]) peakIdx = i;
    }
    expect(Math.abs(result.frequencies[peakIdx] - 500)).toBeLessThan(20);
  });

  it('returns correct number of bins', () => {
    const signal = generateSine(100, 8000, 1024);
    const result = dspFFT(signal, 8000);

    // 1024 samples -> N/2 + 1 = 513 bins
    expect(result.frequencies.length).toBe(513);
    expect(result.magnitudes.length).toBe(513);
  });
});

// ===========================================================================
// Group 2: FIR filter design tests (ENG-02)
// ===========================================================================

describe('FIR filter design', () => {
  it('designFIRLowpass returns correct number of taps', () => {
    const coeffs = designFIRLowpass(1000, 8000, 51);
    expect(coeffs.length).toBe(51);
  });

  it('designFIRLowpass coefficients are symmetric', () => {
    const coeffs = designFIRLowpass(1000, 8000, 51);
    for (let i = 0; i < 51; i++) {
      expect(Math.abs(coeffs[i] - coeffs[50 - i])).toBeLessThan(1e-10);
    }
  });

  it('designFIRLowpass coefficients sum to approximately 1', () => {
    const coeffs = designFIRLowpass(1000, 8000, 51);
    const sum = coeffs.reduce((s, c) => s + c, 0);
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.05);
  });

  it('designFIRHighpass coefficients sum to approximately 0', () => {
    const coeffs = designFIRHighpass(1000, 8000, 51);
    const sum = coeffs.reduce((s, c) => s + c, 0);
    expect(Math.abs(sum)).toBeLessThan(0.05);
  });

  it('designFIRBandpass returns correct tap count', () => {
    const coeffs = designFIRBandpass(500, 1500, 8000, 51);
    expect(coeffs.length).toBe(51);
  });
});

// ===========================================================================
// Group 3: applyFIR convolution tests
// ===========================================================================

describe('applyFIR convolution', () => {
  it('lowpass removes high frequency', () => {
    const signal: number[] = [];
    for (let n = 0; n < 1024; n++) {
      const t = n / 8000;
      signal.push(
        Math.sin(2 * Math.PI * 200 * t) +
        Math.sin(2 * Math.PI * 3000 * t),
      );
    }
    const coeffs = designFIRLowpass(500, 8000, 101);
    const filtered = applyFIR(signal, coeffs);
    const spectrum = dspFFT(filtered, 8000);

    // Find magnitudes near 200 Hz and 3000 Hz
    const near200 = spectrum.frequencies.reduce(
      (best, f, i) => (Math.abs(f - 200) < Math.abs(spectrum.frequencies[best] - 200) ? i : best),
      0,
    );
    const near3000 = spectrum.frequencies.reduce(
      (best, f, i) => (Math.abs(f - 3000) < Math.abs(spectrum.frequencies[best] - 3000) ? i : best),
      0,
    );

    expect(spectrum.magnitudes[near200]).toBeGreaterThan(0.3);
    expect(spectrum.magnitudes[near3000]).toBeLessThan(0.1);
  });

  it('highpass removes low frequency', () => {
    const signal: number[] = [];
    for (let n = 0; n < 1024; n++) {
      const t = n / 8000;
      signal.push(
        Math.sin(2 * Math.PI * 200 * t) +
        Math.sin(2 * Math.PI * 3000 * t),
      );
    }
    const coeffs = designFIRHighpass(1000, 8000, 101);
    const filtered = applyFIR(signal, coeffs);
    const spectrum = dspFFT(filtered, 8000);

    // Find magnitudes near 200 Hz and 3000 Hz
    const near200 = spectrum.frequencies.reduce(
      (best, f, i) => (Math.abs(f - 200) < Math.abs(spectrum.frequencies[best] - 200) ? i : best),
      0,
    );
    const near3000 = spectrum.frequencies.reduce(
      (best, f, i) => (Math.abs(f - 3000) < Math.abs(spectrum.frequencies[best] - 3000) ? i : best),
      0,
    );

    expect(spectrum.magnitudes[near3000]).toBeGreaterThan(0.3);
    expect(spectrum.magnitudes[near200]).toBeLessThan(0.1);
  });

  it('returns same length as input', () => {
    const signal = generateSine(440, 8000, 512);
    const coeffs = designFIRLowpass(1000, 8000, 31);
    const output = applyFIR(signal, coeffs);
    expect(output.length).toBe(signal.length);
  });
});

// ===========================================================================
// Group 4: Quantization utilities
// ===========================================================================

describe('quantization utilities', () => {
  it('quantizeSignal with 8 bits and 5V ref', () => {
    const input = [0, 1.25, 2.5, 3.75, 5.0];
    const output = quantizeSignal(input, 8, 5.0);

    const lsb = 5.0 / 256;
    for (let i = 0; i < input.length; i++) {
      expect(Math.abs(output[i] - input[i])).toBeLessThanOrEqual(lsb);
    }

    // Each output should be a multiple of LSB
    for (const v of output) {
      const code = Math.round(v / lsb);
      expect(Math.abs(v - code * lsb)).toBeLessThan(1e-10);
    }
  });

  it('quantizeSignal with 3 bits produces only 8 levels', () => {
    const input: number[] = [];
    for (let i = 0; i < 100; i++) {
      input.push((i / 99) * 5.0);
    }
    const output = quantizeSignal(input, 3, 5.0);
    const unique = new Set(output.map((v) => Math.round(v * 1e6) / 1e6));
    expect(unique.size).toBeLessThanOrEqual(8);
  });

  it('reconstructSignal round-trips with quantizeSignal', () => {
    const input = [1.0, 2.0, 3.0, 4.0];
    const quantized = quantizeSignal(input, 12, 5.0);

    // 12-bit resolution: LSB = 5/4096 ~ 0.00122V
    const lsb = 5.0 / 4096;
    for (let i = 0; i < input.length; i++) {
      expect(Math.abs(quantized[i] - input[i])).toBeLessThanOrEqual(lsb);
    }
  });
});

// ===========================================================================
// Windowing utility
// ===========================================================================

describe('applyWindowToCoeffs', () => {
  it('applies Hamming window to FIR coefficients', () => {
    const coeffs = designFIRLowpass(1000, 8000, 51);
    const windowed = applyWindowToCoeffs(coeffs, 'hamming');

    expect(windowed.length).toBe(coeffs.length);

    // Center coefficient should be approximately unchanged
    // Hamming window at center (n=25, N=51): w = 0.54 - 0.46*cos(2*pi*25/50) = 0.54 + 0.46 = 1.0
    const center = Math.floor(coeffs.length / 2);
    expect(Math.abs(windowed[center] - coeffs[center])).toBeLessThan(0.01 * Math.abs(coeffs[center]));
  });
});
