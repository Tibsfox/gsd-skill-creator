/**
 * Oscilloscope & Spectrum Analyzer Test Suite (Phase 264 Plan 02)
 *
 * TDD tests for oscilloscope ASCII rendering (renderOscilloscope),
 * FFT engine (fft), window functions (applyWindow), and
 * spectrum analyzer (computeSpectrum).
 */

import { describe, it, expect } from 'vitest';
import {
  renderOscilloscope,
  computeSpectrum,
  fft,
  applyWindow,
} from '../simulator/instruments.js';
import type { TransientTimePoint } from '../simulator/transient.js';

// ============================================================================
// Helper: generate time-domain signals as TransientTimePoint arrays
// ============================================================================

/** Create DC signal at constant voltage for a given node */
function dcSignal(
  node: string,
  voltage: number,
  numPoints: number,
  dt: number,
): TransientTimePoint[] {
  const points: TransientTimePoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    points.push({
      time: i * dt,
      nodeVoltages: { [node]: voltage },
      branchCurrents: {},
    });
  }
  return points;
}

/** Create step response: 0V for first half, then stepVoltage for second half */
function stepSignal(
  node: string,
  stepVoltage: number,
  numPoints: number,
  dt: number,
): TransientTimePoint[] {
  const points: TransientTimePoint[] = [];
  const halfPoint = Math.floor(numPoints / 2);
  for (let i = 0; i < numPoints; i++) {
    points.push({
      time: i * dt,
      nodeVoltages: { [node]: i < halfPoint ? 0 : stepVoltage },
      branchCurrents: {},
    });
  }
  return points;
}

/** Create sine wave signal */
function sineSignal(
  node: string,
  amplitude: number,
  frequency: number,
  numPoints: number,
  sampleRate: number,
): TransientTimePoint[] {
  const dt = 1 / sampleRate;
  const points: TransientTimePoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i * dt;
    points.push({
      time: t,
      nodeVoltages: { [node]: amplitude * Math.sin(2 * Math.PI * frequency * t) },
      branchCurrents: {},
    });
  }
  return points;
}

/** Create multi-channel time-point data with multiple nodes */
function multiChannelSignal(
  channels: Array<{ node: string; voltage: number }>,
  numPoints: number,
  dt: number,
): TransientTimePoint[] {
  const points: TransientTimePoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    const nodeVoltages: Record<string, number> = {};
    for (const ch of channels) {
      nodeVoltages[ch.node] = ch.voltage;
    }
    points.push({
      time: i * dt,
      nodeVoltages,
      branchCurrents: {},
    });
  }
  return points;
}

// ============================================================================
// Oscilloscope Rendering Tests (SIM-12)
// ============================================================================

describe('Oscilloscope', () => {
  it('renders DC signal as a horizontal line in the display area', () => {
    const timePoints = dcSignal('out', 5, 100, 0.001);
    const result = renderOscilloscope(timePoints, {
      channels: [{ node: 'out', scale: 1, offset: 0, enabled: true }],
      timebase: 0.01, // 10ms per division
      numDivisions: 10,
      rows: 20,
      cols: 80,
    });

    expect(result.ascii).toBeDefined();
    const lines = result.ascii.split('\n');
    expect(lines.length).toBe(20);
    // DC signal should produce characters only on one row
    const rowsWithMarker = lines.filter((l) => l.includes('1'));
    expect(rowsWithMarker.length).toBe(1);
  });

  it('renders step response with visible transition', () => {
    const timePoints = stepSignal('out', 5, 100, 0.001);
    const result = renderOscilloscope(timePoints, {
      channels: [{ node: 'out', scale: 1, offset: 0, enabled: true }],
      timebase: 0.01,
      numDivisions: 10,
      rows: 20,
      cols: 80,
    });

    expect(result.ascii).toBeDefined();
    const lines = result.ascii.split('\n');
    expect(lines.length).toBe(20);
    // Step response should have characters on at least 2 different rows
    const rowsWithMarker = lines.filter((l) => l.includes('1'));
    expect(rowsWithMarker.length).toBeGreaterThanOrEqual(2);
  });

  it('supports up to 4 channels simultaneously', () => {
    const timePoints = multiChannelSignal(
      [
        { node: 'ch1', voltage: 1 },
        { node: 'ch2', voltage: 2 },
        { node: 'ch3', voltage: 3 },
        { node: 'ch4', voltage: 4 },
      ],
      100,
      0.001,
    );

    const result = renderOscilloscope(timePoints, {
      channels: [
        { node: 'ch1', scale: 1, offset: 0, enabled: true },
        { node: 'ch2', scale: 1, offset: 0, enabled: true },
        { node: 'ch3', scale: 1, offset: 0, enabled: true },
        { node: 'ch4', scale: 1, offset: 0, enabled: true },
      ],
      timebase: 0.01,
      numDivisions: 10,
      rows: 20,
      cols: 80,
    });

    // All 4 channels should have metadata
    expect(result.channels.length).toBe(4);
    // Each channel marker ('1','2','3','4') should appear in the ASCII
    expect(result.ascii).toContain('1');
    expect(result.ascii).toContain('2');
    expect(result.ascii).toContain('3');
    expect(result.ascii).toContain('4');
  });

  it('respects timebase: only renders points within time window', () => {
    // 200 points at 1ms each = 200ms total data
    // timebase = 0.01s/div * 10 div = 100ms window
    const timePoints = dcSignal('out', 5, 200, 0.001);
    const result = renderOscilloscope(timePoints, {
      channels: [{ node: 'out', scale: 1, offset: 0, enabled: true }],
      timebase: 0.01,
      numDivisions: 10,
      rows: 20,
      cols: 80,
    });

    // Should still render successfully with only first 100ms of data
    expect(result.ascii).toBeDefined();
    const lines = result.ascii.split('\n');
    expect(lines.length).toBe(20);
  });

  it('maps voltage to rows using channel scale: 1V/div with 20 rows', () => {
    // scale=1 V/div, rows=20, so range is -10V to +10V (20 rows / 2 * 1 V/div = 10V half-range)
    // 5V signal with offset=0 should map to upper quarter area
    const timePoints = dcSignal('out', 5, 100, 0.001);
    const result = renderOscilloscope(timePoints, {
      channels: [{ node: 'out', scale: 1, offset: 0, enabled: true }],
      timebase: 0.01,
      numDivisions: 10,
      rows: 20,
      cols: 80,
    });

    const lines = result.ascii.split('\n');
    // 5V in a -10V to +10V range maps to row index ~5 (upper quarter)
    const markerRow = lines.findIndex((l) => l.includes('1'));
    expect(markerRow).toBeGreaterThanOrEqual(0);
    expect(markerRow).toBeLessThan(10); // should be in upper half
  });

  it('applies channel offset to shift waveform vertically', () => {
    const timePoints = dcSignal('out', 0, 100, 0.001);
    // 0V signal with offset=5V should appear at same position as 5V with offset=0
    const resultWithOffset = renderOscilloscope(timePoints, {
      channels: [{ node: 'out', scale: 1, offset: 5, enabled: true }],
      timebase: 0.01,
      numDivisions: 10,
      rows: 20,
      cols: 80,
    });

    const timePoints5V = dcSignal('out', 5, 100, 0.001);
    const resultNoOffset = renderOscilloscope(timePoints5V, {
      channels: [{ node: 'out', scale: 1, offset: 0, enabled: true }],
      timebase: 0.01,
      numDivisions: 10,
      rows: 20,
      cols: 80,
    });

    // Both should have marker on the same row
    const rowOffset = resultWithOffset.ascii.split('\n').findIndex((l) => l.includes('1'));
    const rowNoOffset = resultNoOffset.ascii.split('\n').findIndex((l) => l.includes('1'));
    expect(rowOffset).toBe(rowNoOffset);
  });

  it('produces ASCII with correct dimensions: width=cols, height=rows', () => {
    const timePoints = dcSignal('out', 3, 50, 0.001);
    const result = renderOscilloscope(timePoints, {
      channels: [{ node: 'out', scale: 1, offset: 0, enabled: true }],
      timebase: 0.01,
      numDivisions: 10,
      rows: 15,
      cols: 60,
    });

    const lines = result.ascii.split('\n');
    expect(lines.length).toBe(15);
    for (const line of lines) {
      expect(line.length).toBe(60);
    }
  });

  it('does not render disabled channels', () => {
    const timePoints = multiChannelSignal(
      [
        { node: 'ch1', voltage: 3 },
        { node: 'ch2', voltage: 7 },
      ],
      100,
      0.001,
    );

    const result = renderOscilloscope(timePoints, {
      channels: [
        { node: 'ch1', scale: 1, offset: 0, enabled: true },
        { node: 'ch2', scale: 1, offset: 0, enabled: false },
      ],
      timebase: 0.01,
      numDivisions: 10,
      rows: 20,
      cols: 80,
    });

    // Channel 1 marker should appear, channel 2 marker should not
    expect(result.ascii).toContain('1');
    expect(result.ascii).not.toContain('2');
    // Only 1 channel metadata returned (enabled only)
    expect(result.channels.length).toBe(1);
  });

  it('returns channel metadata with node, min, max, and rms', () => {
    const timePoints = sineSignal('out', 5, 100, 256, 10000);
    const result = renderOscilloscope(timePoints, {
      channels: [{ node: 'out', scale: 2, offset: 0, enabled: true }],
      timebase: 0.005,
      numDivisions: 10,
      rows: 20,
      cols: 80,
    });

    expect(result.channels.length).toBe(1);
    const meta = result.channels[0];
    expect(meta.node).toBe('out');
    expect(meta.min).toBeLessThan(0);
    expect(meta.max).toBeGreaterThan(0);
    expect(meta.rms).toBeGreaterThan(0);
    // RMS of a sine wave = amplitude / sqrt(2) ~= 3.535
    expect(meta.rms).toBeCloseTo(5 / Math.sqrt(2), 0);
  });
});

// ============================================================================
// FFT Engine Tests (SIM-13)
// ============================================================================

describe('FFT', () => {
  it('computes FFT of pure DC signal: peak at bin 0', () => {
    const N = 256;
    const sampleRate = 1000;
    const samples = new Array(N).fill(1.0); // DC = 1V
    const result = fft(samples, sampleRate);

    // Bin 0 (DC) should have the highest magnitude
    expect(result.length).toBeGreaterThan(0);
    const dcBin = result[0];
    expect(dcBin.frequency).toBeCloseTo(0, 5);

    // All other bins should be much lower than DC bin
    for (let i = 1; i < result.length; i++) {
      expect(result[i].magnitudeDb).toBeLessThan(dcBin.magnitudeDb - 40);
    }
  });

  it('computes FFT of pure sine wave: peak at correct frequency bin', () => {
    const N = 1024;
    const sampleRate = 8000;
    const targetFreq = 1000; // 1kHz sine
    const samples: number[] = [];
    for (let i = 0; i < N; i++) {
      samples.push(Math.sin(2 * Math.PI * targetFreq * i / sampleRate));
    }

    const result = fft(samples, sampleRate);

    // Find bin with maximum magnitude
    let maxBin = result[0];
    for (const bin of result) {
      if (bin.magnitudeDb > maxBin.magnitudeDb) maxBin = bin;
    }

    // Peak should be within 1 bin of target frequency
    const freqResolution = sampleRate / N;
    expect(Math.abs(maxBin.frequency - targetFreq)).toBeLessThanOrEqual(freqResolution);
  });

  it('produces correct frequency resolution: fs/N', () => {
    const N = 256;
    const sampleRate = 44100;
    const samples = new Array(N).fill(0);
    samples[0] = 1; // impulse

    const result = fft(samples, sampleRate);

    // Frequency spacing between consecutive bins should be fs/N
    const expectedResolution = sampleRate / N;
    if (result.length >= 2) {
      const actualResolution = result[1].frequency - result[0].frequency;
      expect(actualResolution).toBeCloseTo(expectedResolution, 2);
    }
  });

  it('returns only positive frequencies: bins 0 to N/2', () => {
    const N = 512;
    const sampleRate = 1000;
    const samples = new Array(N).fill(0);
    samples[0] = 1;

    const result = fft(samples, sampleRate);

    // Should have N/2 + 1 bins (0 Hz to fs/2)
    expect(result.length).toBe(N / 2 + 1);

    // Max frequency should be fs/2
    const lastBin = result[result.length - 1];
    expect(lastBin.frequency).toBeCloseTo(sampleRate / 2, 2);
  });

  it('works with power-of-2 input sizes: 64, 128, 256, 512, 1024', () => {
    const sampleRate = 1000;
    for (const N of [64, 128, 256, 512, 1024]) {
      const samples = new Array(N).fill(0);
      samples[0] = 1; // impulse
      const result = fft(samples, sampleRate);
      expect(result.length).toBe(N / 2 + 1);
    }
  });

  it('zero-pads non-power-of-2 input to next power of 2', () => {
    const sampleRate = 1000;
    const samples = new Array(100).fill(0); // 100 is not power of 2
    samples[0] = 1;

    const result = fft(samples, sampleRate);

    // Next power of 2 from 100 is 128
    // Should return 128/2 + 1 = 65 bins
    expect(result.length).toBe(65);
  });
});

// ============================================================================
// Window Function Tests (SIM-13)
// ============================================================================

describe('Window Functions', () => {
  it('rectangular window returns input unchanged', () => {
    const input = [1, 2, 3, 4, 5];
    const result = applyWindow(input, 'rectangular');
    expect(result).toEqual(input);
    // Should not mutate original
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it('hanning window: endpoints are 0, midpoint is 1', () => {
    const N = 64;
    const input = new Array(N).fill(1.0);
    const result = applyWindow(input, 'hanning');

    // Endpoints should be 0 (or very close)
    expect(result[0]).toBeCloseTo(0, 10);
    expect(result[N - 1]).toBeCloseTo(0, 10);

    // Midpoint should be close to 1
    const mid = Math.floor((N - 1) / 2);
    expect(result[mid]).toBeCloseTo(1, 1);
  });

  it('hamming window: endpoints are 0.08, midpoint is 1', () => {
    const N = 64;
    const input = new Array(N).fill(1.0);
    const result = applyWindow(input, 'hamming');

    // Endpoints should be 0.08
    expect(result[0]).toBeCloseTo(0.08, 2);
    expect(result[N - 1]).toBeCloseTo(0.08, 2);

    // Midpoint should be close to 1
    const mid = Math.floor((N - 1) / 2);
    expect(result[mid]).toBeCloseTo(1, 1);
  });

  it('hanning coefficients match formula: 0.5*(1-cos(2*pi*n/(N-1)))', () => {
    const N = 16;
    const input = new Array(N).fill(1.0);
    const result = applyWindow(input, 'hanning');

    for (let n = 0; n < N; n++) {
      const expected = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
      expect(result[n]).toBeCloseTo(expected, 10);
    }
  });

  it('hamming coefficients match formula: 0.54-0.46*cos(2*pi*n/(N-1))', () => {
    const N = 16;
    const input = new Array(N).fill(1.0);
    const result = applyWindow(input, 'hamming');

    for (let n = 0; n < N; n++) {
      const expected = 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / (N - 1));
      expect(result[n]).toBeCloseTo(expected, 10);
    }
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const copy = [...input];
    applyWindow(input, 'hanning');
    expect(input).toEqual(copy);
  });
});

// ============================================================================
// Spectrum Analyzer Tests (SIM-13)
// ============================================================================

describe('Spectrum Analyzer', () => {
  it('computes spectrum of 1kHz sine at 44.1kHz sample rate: peak at 1kHz', () => {
    const sampleRate = 44100;
    const freq = 1000;
    const N = 4096;
    const samples: number[] = [];
    for (let i = 0; i < N; i++) {
      samples.push(Math.sin(2 * Math.PI * freq * i / sampleRate));
    }

    const spectrum = computeSpectrum(samples, sampleRate, N, 'rectangular');

    // Find peak
    let peak = spectrum[0];
    for (const pt of spectrum) {
      if (pt.magnitudeDb > peak.magnitudeDb) peak = pt;
    }

    // Peak should be at ~1000 Hz
    const freqRes = sampleRate / N;
    expect(Math.abs(peak.frequency - freq)).toBeLessThanOrEqual(freqRes);
  });

  it('returns frequency-magnitude pairs covering 0 to fs/2', () => {
    const sampleRate = 8000;
    const N = 256;
    const samples = new Array(N).fill(0);
    samples[0] = 1;

    const spectrum = computeSpectrum(samples, sampleRate, N, 'rectangular');

    expect(spectrum.length).toBeGreaterThan(0);
    expect(spectrum[0].frequency).toBeCloseTo(0, 5);
    expect(spectrum[spectrum.length - 1].frequency).toBeCloseTo(sampleRate / 2, 2);
  });

  it('respects frequencyRange filter: only returns bins within [fMin, fMax]', () => {
    const sampleRate = 8000;
    const N = 256;
    const samples: number[] = [];
    for (let i = 0; i < N; i++) {
      samples.push(Math.sin(2 * Math.PI * 1000 * i / sampleRate));
    }

    const spectrum = computeSpectrum(samples, sampleRate, N, 'rectangular', [500, 1500]);

    // All frequencies should be within range
    for (const pt of spectrum) {
      expect(pt.frequency).toBeGreaterThanOrEqual(500);
      expect(pt.frequency).toBeLessThanOrEqual(1500);
    }

    // Should have fewer bins than full spectrum
    const fullSpectrum = computeSpectrum(samples, sampleRate, N, 'rectangular');
    expect(spectrum.length).toBeLessThan(fullSpectrum.length);
  });

  it('applies window function before FFT', () => {
    const sampleRate = 8000;
    const N = 512;
    // Non-integer-period sine to benefit from windowing
    const freq = 137; // not a multiple of fs/N
    const samples: number[] = [];
    for (let i = 0; i < N; i++) {
      samples.push(Math.sin(2 * Math.PI * freq * i / sampleRate));
    }

    const rectSpectrum = computeSpectrum(samples, sampleRate, N, 'rectangular');
    const hannSpectrum = computeSpectrum(samples, sampleRate, N, 'hanning');

    // Both should have peaks near the same frequency
    let rectPeak = rectSpectrum[0];
    for (const pt of rectSpectrum) {
      if (pt.magnitudeDb > rectPeak.magnitudeDb) rectPeak = pt;
    }
    let hannPeak = hannSpectrum[0];
    for (const pt of hannSpectrum) {
      if (pt.magnitudeDb > hannPeak.magnitudeDb) hannPeak = pt;
    }

    // Peak frequencies should be close
    expect(Math.abs(rectPeak.frequency - hannPeak.frequency)).toBeLessThan(sampleRate / N * 2);
  });
});
