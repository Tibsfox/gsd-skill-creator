/**
 * DSP Engine
 *
 * Higher-level DSP primitives for Module 9 (Data Conversion) and
 * Module 10 (DSP) labs. Wraps the existing Cooley-Tukey FFT from
 * instruments.ts and adds FIR filter design, convolution, windowing,
 * and quantization utilities.
 *
 * Phase 273 Plan 01.
 */

import { fft, applyWindow } from './instruments.js';

// ===========================================================================
// 1. dspFFT -- higher-level FFT wrapper
// ===========================================================================

/**
 * Compute FFT and return parallel arrays of frequency (Hz) and
 * linear magnitude for positive frequencies only.
 *
 * Wraps the existing Cooley-Tukey FFT from instruments.ts, converting
 * the dB magnitudes back to linear scale for easier lab use.
 *
 * @param samples - Real-valued time-domain input
 * @param sampleRate - Sampling rate in Hz
 * @returns Parallel arrays of frequencies and linear magnitudes
 */
export function dspFFT(
  samples: number[],
  sampleRate: number,
): { frequencies: number[]; magnitudes: number[] } {
  const bins = fft(samples, sampleRate);

  const frequencies: number[] = [];
  const magnitudes: number[] = [];

  for (const bin of bins) {
    frequencies.push(bin.frequency);
    // Convert from dB back to linear: magnitude = 10^(dB/20)
    // Handle -Infinity dB as 0
    const linear = bin.magnitudeDb === -Infinity
      ? 0
      : Math.pow(10, bin.magnitudeDb / 20);
    magnitudes.push(linear);
  }

  return { frequencies, magnitudes };
}

// ===========================================================================
// 2. FIR filter coefficient design -- windowed-sinc method
// ===========================================================================

/**
 * Design a lowpass FIR filter using the windowed-sinc method with
 * a Hamming window. Coefficients are normalized so DC gain = 1.0.
 *
 * @param cutoffHz - Cutoff frequency in Hz
 * @param sampleRate - Sampling rate in Hz
 * @param numTaps - Number of filter taps (odd recommended for symmetry)
 * @returns Array of FIR coefficients
 */
export function designFIRLowpass(
  cutoffHz: number,
  sampleRate: number,
  numTaps: number,
): number[] {
  const fc = cutoffHz / sampleRate; // normalized cutoff
  const h = new Array(numTaps);

  for (let n = 0; n < numTaps; n++) {
    const m = n - (numTaps - 1) / 2;

    // Sinc function
    if (m === 0) {
      h[n] = 2 * fc;
    } else {
      h[n] = Math.sin(2 * Math.PI * fc * m) / (Math.PI * m);
    }

    // Hamming window
    const w = 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / (numTaps - 1));
    h[n] *= w;
  }

  // Normalize so coefficients sum to 1.0 (DC gain = unity)
  const sum = h.reduce((s: number, c: number) => s + c, 0);
  if (sum !== 0) {
    for (let n = 0; n < numTaps; n++) {
      h[n] /= sum;
    }
  }

  return h;
}

/**
 * Design a highpass FIR filter via spectral inversion of a lowpass filter.
 *
 * @param cutoffHz - Cutoff frequency in Hz
 * @param sampleRate - Sampling rate in Hz
 * @param numTaps - Number of filter taps (odd recommended)
 * @returns Array of FIR coefficients
 */
export function designFIRHighpass(
  cutoffHz: number,
  sampleRate: number,
  numTaps: number,
): number[] {
  const lp = designFIRLowpass(cutoffHz, sampleRate, numTaps);

  // Spectral inversion: negate all, add 1 to center tap
  const hp = lp.map((c) => -c);
  const center = Math.floor((numTaps - 1) / 2);
  hp[center] += 1.0;

  return hp;
}

/**
 * Design a bandpass FIR filter as the difference of two lowpass filters.
 *
 * @param lowCutoff - Lower cutoff frequency in Hz
 * @param highCutoff - Upper cutoff frequency in Hz
 * @param sampleRate - Sampling rate in Hz
 * @param numTaps - Number of filter taps (odd recommended)
 * @returns Array of FIR coefficients
 */
export function designFIRBandpass(
  lowCutoff: number,
  highCutoff: number,
  sampleRate: number,
  numTaps: number,
): number[] {
  const lpHigh = designFIRLowpass(highCutoff, sampleRate, numTaps);
  const lpLow = designFIRLowpass(lowCutoff, sampleRate, numTaps);

  // Bandpass = LP(highCutoff) - LP(lowCutoff)
  const bp = new Array(numTaps);
  for (let n = 0; n < numTaps; n++) {
    bp[n] = lpHigh[n] - lpLow[n];
  }

  return bp;
}

// ===========================================================================
// 3. applyFIR -- time-domain convolution
// ===========================================================================

/**
 * Apply FIR filter via direct-form convolution.
 *
 * Output length equals input signal length. Samples before the start
 * of the signal are treated as zero (zero-padding at the beginning).
 *
 * @param signal - Input signal array
 * @param coefficients - FIR filter coefficients
 * @returns Filtered output signal (same length as input)
 */
export function applyFIR(
  signal: number[],
  coefficients: number[],
): number[] {
  const output = new Array(signal.length);

  for (let n = 0; n < signal.length; n++) {
    let sum = 0;
    for (let k = 0; k < coefficients.length; k++) {
      const idx = n - k;
      if (idx >= 0) {
        sum += coefficients[k] * signal[idx];
      }
      // idx < 0 treated as zero (zero-padding)
    }
    output[n] = sum;
  }

  return output;
}

// ===========================================================================
// 4. applyWindowToCoeffs -- window function application
// ===========================================================================

/**
 * Apply a window function to an existing coefficient array.
 *
 * Does NOT normalize afterward (caller decides).
 *
 * @param coefficients - Input coefficient array
 * @param windowType - Window function to apply
 * @returns New array with element-wise window multiplication
 */
export function applyWindowToCoeffs(
  coefficients: number[],
  windowType: 'rectangular' | 'hanning' | 'hamming',
): number[] {
  // Re-use the applyWindow function from instruments.ts
  return applyWindow(coefficients, windowType);
}

// ===========================================================================
// 5. Quantization utilities
// ===========================================================================

/**
 * Quantize a signal to a given bit resolution with a reference voltage.
 *
 * Each sample is clamped to [0, vRef], quantized to `bits`-bit resolution,
 * and returned as the reconstructed voltage level (code * LSB).
 *
 * @param samples - Input voltage samples
 * @param bits - ADC resolution in bits
 * @param vRef - Reference voltage
 * @returns Array of quantized voltage levels
 */
export function quantizeSignal(
  samples: number[],
  bits: number,
  vRef: number,
): number[] {
  const levels = Math.pow(2, bits);
  const lsb = vRef / levels;

  return samples.map((sample) => {
    // Clamp to [0, vRef]
    const clamped = Math.max(0, Math.min(vRef, sample));
    // Quantize
    let code = Math.round(clamped / lsb);
    // Clamp code to valid range
    code = Math.max(0, Math.min(levels - 1, code));
    return code * lsb;
  });
}

/**
 * Reconstruct an analog signal from quantization codes.
 *
 * Converts integer codes (or quantized voltage levels) back to
 * analog voltage levels for DAC simulation.
 *
 * @param codes - Integer codes or quantized voltage array
 * @param bits - DAC resolution in bits
 * @param vRef - Reference voltage
 * @returns Array of reconstructed voltage levels
 */
export function reconstructSignal(
  codes: number[],
  bits: number,
  vRef: number,
): number[] {
  const lsb = vRef / Math.pow(2, bits);

  return codes.map((code) => code * lsb);
}
