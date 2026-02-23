/**
 * Virtual Instruments
 *
 * Measurement instrument interfaces and functions for circuit analysis.
 * Voltmeter and ammeter implemented in Phase 264 Plan 01.
 * Oscilloscope, FFT, windowing, spectrum analyzer in Phase 264 Plan 02.
 */

import { dcAnalysis, type MNASolution } from './mna-engine.js';
import type { Component, VoltageSource } from './components.js';
import type { TransientTimePoint } from './transient.js';

/** Voltmeter — measures voltage between two nodes */
export interface Voltmeter {
  type: 'voltmeter';
  nodeA: string;
  nodeB: string;
  reading: number; // volts
}

/** Ammeter — measures current through a branch */
export interface Ammeter {
  type: 'ammeter';
  branch: string;
  reading: number; // amps
}

/** Oscilloscope channel configuration */
export interface OscilloscopeChannel {
  node: string;
  scale: number;    // volts per division
  offset: number;   // volts
  enabled: boolean;
}

/** Oscilloscope — time-domain waveform display (up to 4 channels) */
export interface Oscilloscope {
  type: 'oscilloscope';
  channels: OscilloscopeChannel[];
  timebase: number; // seconds per division
  triggerLevel: number;
  triggerChannel: number;
}

/** Spectrum analyzer — frequency-domain display */
export interface SpectrumAnalyzer {
  type: 'spectrum-analyzer';
  node: string;
  fftSize: number;
  window: 'rectangular' | 'hanning' | 'hamming';
  frequencyRange: [number, number]; // Hz
}

/** Union type of all instruments */
export type Instrument = Voltmeter | Ammeter | Oscilloscope | SpectrumAnalyzer;

// ============================================================================
// Measurement Functions
// ============================================================================

/**
 * Type guard: check if solution is an MNASolution (has nodeVoltages array)
 * vs a plain Record<string, number> from transient time-point data.
 */
function isMNASolution(
  solution: MNASolution | Record<string, number>,
): solution is MNASolution {
  return (
    typeof solution === 'object' &&
    solution !== null &&
    'nodeVoltages' in solution &&
    Array.isArray((solution as MNASolution).nodeVoltages)
  );
}

/**
 * Measure voltage between two nodes.
 *
 * Pure read from an existing solution -- does NOT modify the circuit.
 * Works with both MNASolution objects (from dcAnalysis) and plain
 * Record<string, number> snapshots (from transient time-point data).
 *
 * Ground node voltage is always 0V.
 *
 * @param nodeA - Positive probe node
 * @param nodeB - Negative probe node (reference)
 * @param solution - MNASolution or Record<string, number> of node voltages
 * @param groundNode - Name of the ground node (default "0")
 * @returns V(nodeA) - V(nodeB) in volts
 */
export function measureVoltage(
  nodeA: string,
  nodeB: string,
  solution: MNASolution | Record<string, number>,
  groundNode: string = '0',
): number {
  let voltageA: number;
  let voltageB: number;

  if (isMNASolution(solution)) {
    // Extract voltages from MNASolution nodeVoltages array
    const findVoltage = (node: string): number => {
      if (node === groundNode) return 0;
      const entry = solution.nodeVoltages.find((nv) => nv.node === node);
      return entry ? entry.voltage : 0;
    };
    voltageA = findVoltage(nodeA);
    voltageB = findVoltage(nodeB);
  } else {
    // Plain record: lookup directly, ground is 0
    voltageA = nodeA === groundNode ? 0 : (solution[nodeA] ?? 0);
    voltageB = nodeB === groundNode ? 0 : (solution[nodeB] ?? 0);
  }

  return voltageA - voltageB;
}

/**
 * Measure current between two nodes by inserting a zero-volt voltage source.
 *
 * Standard ammeter technique for MNA: insert a zero-volt voltage source
 * between nodeA (positive) and nodeB (negative), re-solve the circuit,
 * and read the branch current through the inserted source.
 *
 * The ammeter should be placed at a measurement point where no existing
 * component directly connects nodeA and nodeB -- like a real ammeter
 * inserted in series at a break point in a wire. The zero-volt source
 * creates the wire and captures the current flowing through it.
 *
 * The input components array is NOT mutated.
 *
 * @param nodeA - Node where current enters the ammeter (positive terminal)
 * @param nodeB - Node where current exits the ammeter (negative terminal)
 * @param components - Original circuit components (not mutated)
 * @param groundNode - Name of the ground node (default "0")
 * @returns Current in amps (positive = conventional current from nodeA to nodeB)
 */
export function measureCurrent(
  nodeA: string,
  nodeB: string,
  components: Component[],
  groundNode: string = '0',
): number {
  // Clone the components array (shallow) to avoid mutating the original
  const modifiedComponents = [...components];

  // Create a unique ammeter ID
  const ammeterId = `__ammeter_${nodeA}_${nodeB}`;

  // Insert a zero-volt voltage source between nodeA (positive) and nodeB (negative)
  const ammeterSource: VoltageSource = {
    id: ammeterId,
    type: 'voltage-source',
    nodes: [nodeA, nodeB],
    voltage: 0,
  };
  modifiedComponents.push(ammeterSource);

  // Re-solve the circuit with the ammeter inserted
  const solution = dcAnalysis(modifiedComponents, groundNode);

  // Find the branch current through the ammeter source
  const branch = solution.branchCurrents.find((bc) => bc.branch === ammeterId);
  if (!branch) return 0;

  // MNA convention for voltage source V with nodes [+, -] = [nodeA, nodeB]:
  // The branch current j in the MNA solution represents current injected
  // by the source into the positive terminal (nodeA) from internal flow.
  // The source carries current from -(nodeB) to +(nodeA) internally,
  // which means external current flows from +(nodeA) to -(nodeB).
  // j > 0 means current flows from nodeA to nodeB externally, which is
  // exactly the conventional ammeter reading direction we want.
  return branch.current;
}

// ============================================================================
// Oscilloscope -- Time-Domain ASCII Waveform Display
// ============================================================================

/** Configuration for oscilloscope rendering */
export interface OscilloscopeConfig {
  channels: OscilloscopeChannel[];
  timebase: number;      // seconds per division
  numDivisions: number;  // horizontal divisions (default 10)
  rows: number;          // ASCII display height (default 20)
  cols: number;          // ASCII display width (default 80)
}

/** Result from oscilloscope rendering */
export interface OscilloscopeResult {
  ascii: string;
  channels: Array<{ node: string; min: number; max: number; rms: number }>;
}

/**
 * Render oscilloscope ASCII waveform display from transient time-domain data.
 *
 * Maps voltage time series to an ASCII grid, supporting up to 4 channels
 * with independent scale/offset. Each channel is drawn with a distinct
 * character marker ('1','2','3','4').
 *
 * @param timePoints - Array of transient time-point snapshots
 * @param config - Oscilloscope display configuration
 * @returns OscilloscopeResult with ASCII string and per-channel metadata
 */
export function renderOscilloscope(
  timePoints: TransientTimePoint[],
  config: OscilloscopeConfig,
): OscilloscopeResult {
  const { channels, timebase, numDivisions, rows, cols } = config;
  const tMax = timebase * numDivisions;

  // Filter time points to the display window [0, tMax]
  const filtered = timePoints.filter((tp) => tp.time >= 0 && tp.time <= tMax);

  // Initialize grid with spaces
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    grid.push(new Array(cols).fill(' '));
  }

  const channelMeta: Array<{ node: string; min: number; max: number; rms: number }> = [];
  const markers = ['1', '2', '3', '4'];

  for (let chIdx = 0; chIdx < channels.length; chIdx++) {
    const ch = channels[chIdx];
    if (!ch.enabled) continue;

    // Extract voltage values for this channel's node
    const voltages: Array<{ time: number; voltage: number }> = [];
    for (const tp of filtered) {
      const v = tp.nodeVoltages[ch.node] ?? 0;
      voltages.push({ time: tp.time, voltage: v });
    }

    if (voltages.length === 0) {
      channelMeta.push({ node: ch.node, min: 0, max: 0, rms: 0 });
      continue;
    }

    // Compute statistics
    let min = Infinity;
    let max = -Infinity;
    let sumSq = 0;
    for (const v of voltages) {
      if (v.voltage < min) min = v.voltage;
      if (v.voltage > max) max = v.voltage;
      sumSq += v.voltage * v.voltage;
    }
    const rms = Math.sqrt(sumSq / voltages.length);

    channelMeta.push({ node: ch.node, min, max, rms });

    // Voltage-to-row mapping using scale and offset
    // Scale defines the voltage range: halfRange = scale * (rows/2)
    // Offset shifts the signal vertically (positive offset = trace moves up)
    const halfRange = ch.scale * (rows / 2);
    const vMin = -halfRange;
    const vMax = halfRange;

    const marker = markers[chIdx % markers.length];

    for (const v of voltages) {
      // Map time to column
      const col = Math.round((v.time / tMax) * (cols - 1));
      if (col < 0 || col >= cols) continue;

      // Apply offset to voltage (shifts trace up/down on display)
      const vShifted = v.voltage + ch.offset;

      // Map voltage to row (top = vMax, bottom = vMin)
      let row: number;
      if (vMax === vMin) {
        row = Math.floor(rows / 2);
      } else {
        row = rows - 1 - Math.round(((vShifted - vMin) / (vMax - vMin)) * (rows - 1));
      }

      // Clamp to display bounds
      if (row < 0) row = 0;
      if (row >= rows) row = rows - 1;

      grid[row][col] = marker;
    }
  }

  // Build ASCII output
  const ascii = grid.map((row) => row.join('')).join('\n');

  return { ascii, channels: channelMeta };
}

// ============================================================================
// FFT -- Cooley-Tukey Radix-2 DIT
// ============================================================================

/** Single FFT frequency bin */
export interface FFTBin {
  frequency: number;
  magnitudeDb: number;
}

/**
 * Find the next power of 2 >= n.
 */
function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Bit-reversal permutation index for Cooley-Tukey FFT.
 */
function bitReverse(x: number, bits: number): number {
  let result = 0;
  for (let i = 0; i < bits; i++) {
    result = (result << 1) | (x & 1);
    x >>= 1;
  }
  return result;
}

/**
 * Compute the FFT of a real-valued input signal using Cooley-Tukey radix-2 DIT.
 *
 * Returns positive-frequency bins (0 to N/2) with magnitude in dB
 * relative to full-scale (normalized by N/2).
 *
 * Non-power-of-2 inputs are zero-padded to the next power of 2.
 *
 * @param samples - Real-valued time-domain input array
 * @param sampleRate - Sampling rate in Hz
 * @returns Array of FFTBin with frequency and magnitudeDb
 */
export function fft(samples: number[], sampleRate: number): FFTBin[] {
  const N = nextPow2(samples.length);
  const bits = Math.log2(N);

  // Zero-pad input to N and create complex arrays (real/imaginary)
  const re = new Array(N).fill(0);
  const im = new Array(N).fill(0);
  for (let i = 0; i < samples.length; i++) {
    re[i] = samples[i];
  }

  // Bit-reversal permutation
  for (let i = 0; i < N; i++) {
    const j = bitReverse(i, bits);
    if (j > i) {
      // Swap real
      const tmpRe = re[i];
      re[i] = re[j];
      re[j] = tmpRe;
      // Swap imaginary
      const tmpIm = im[i];
      im[i] = im[j];
      im[j] = tmpIm;
    }
  }

  // Butterfly operations
  for (let size = 2; size <= N; size *= 2) {
    const halfSize = size / 2;
    for (let i = 0; i < N; i += size) {
      for (let j = 0; j < halfSize; j++) {
        const angle = (-2 * Math.PI * j) / size;
        const twRe = Math.cos(angle);
        const twIm = Math.sin(angle);

        const evenIdx = i + j;
        const oddIdx = i + j + halfSize;

        // Complex multiply: twiddle * odd
        const oddRe = re[oddIdx] * twRe - im[oddIdx] * twIm;
        const oddIm = re[oddIdx] * twIm + im[oddIdx] * twRe;

        // Butterfly: even +/- odd
        const eRe = re[evenIdx];
        const eIm = im[evenIdx];

        re[evenIdx] = eRe + oddRe;
        im[evenIdx] = eIm + oddIm;
        re[oddIdx] = eRe - oddRe;
        im[oddIdx] = eIm - oddIm;
      }
    }
  }

  // Extract positive-frequency bins (0 to N/2 inclusive)
  const bins: FFTBin[] = [];
  const normFactor = N / 2;

  for (let k = 0; k <= N / 2; k++) {
    const magnitude = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    // Normalize and convert to dB (avoid log(0))
    const normalizedMag = magnitude / normFactor;
    const magnitudeDb = normalizedMag > 0
      ? 20 * Math.log10(normalizedMag)
      : -Infinity;

    bins.push({
      frequency: (k * sampleRate) / N,
      magnitudeDb,
    });
  }

  return bins;
}

// ============================================================================
// Window Functions
// ============================================================================

/**
 * Apply a window function to a sample array.
 *
 * Supported windows:
 * - 'rectangular': no modification (multiply by 1)
 * - 'hanning': w[n] = 0.5 * (1 - cos(2*pi*n / (N-1)))
 * - 'hamming': w[n] = 0.54 - 0.46 * cos(2*pi*n / (N-1))
 *
 * Returns a new array (does not mutate input).
 *
 * @param samples - Input sample array
 * @param windowType - Window function to apply
 * @returns New array with window applied
 */
export function applyWindow(
  samples: number[],
  windowType: 'rectangular' | 'hanning' | 'hamming',
): number[] {
  const N = samples.length;

  if (windowType === 'rectangular') {
    return [...samples];
  }

  const result = new Array(N);

  for (let n = 0; n < N; n++) {
    let w: number;
    if (windowType === 'hanning') {
      w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
    } else {
      // hamming
      w = 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / (N - 1));
    }
    result[n] = samples[n] * w;
  }

  return result;
}

// ============================================================================
// Spectrum Analyzer
// ============================================================================

/** Single spectrum analysis frequency point */
export interface SpectrumPoint {
  frequency: number;
  magnitudeDb: number;
}

/**
 * Compute the frequency spectrum of a time-domain signal.
 *
 * Combines windowing + FFT + optional frequency range filtering.
 *
 * @param samples - Time-domain sample array
 * @param sampleRate - Sampling rate in Hz
 * @param fftSize - Number of samples to use for FFT (zero-padded if fewer)
 * @param windowType - Window function to apply before FFT
 * @param frequencyRange - Optional [fMin, fMax] Hz filter for output bins
 * @returns Array of SpectrumPoint covering the requested frequency range
 */
export function computeSpectrum(
  samples: number[],
  sampleRate: number,
  fftSize: number,
  windowType: 'rectangular' | 'hanning' | 'hamming',
  frequencyRange?: [number, number],
): SpectrumPoint[] {
  // Take first fftSize samples, or zero-pad if fewer
  const truncated = new Array(fftSize).fill(0);
  for (let i = 0; i < Math.min(samples.length, fftSize); i++) {
    truncated[i] = samples[i];
  }

  // Apply window function
  const windowed = applyWindow(truncated, windowType);

  // Run FFT
  const bins = fft(windowed, sampleRate);

  // Map to SpectrumPoint format
  let points: SpectrumPoint[] = bins.map((bin) => ({
    frequency: bin.frequency,
    magnitudeDb: bin.magnitudeDb,
  }));

  // Filter to frequency range if provided
  if (frequencyRange) {
    const [fMin, fMax] = frequencyRange;
    points = points.filter((pt) => pt.frequency >= fMin && pt.frequency <= fMax);
  }

  return points;
}
