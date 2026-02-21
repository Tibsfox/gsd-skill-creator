/**
 * Virtual Instruments
 *
 * Measurement instrument interfaces for circuit analysis.
 * To be implemented in Phase 264.
 */

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
