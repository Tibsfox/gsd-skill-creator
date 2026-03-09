/**
 * Spatial Awareness — Output Synthesis Layer
 * Paula Chipset Release 2
 *
 * Maps SensorStream sources to OutputDevice targets.
 * Supports audio synthesis, DMX-512, LED strips (WS2812B),
 * and ILDA laser output with safety interlocks.
 *
 * CF-19 (audio), CF-20 (DMX), CF-21 (LED), CF-22 (laser safety),
 * SC-LAS (laser interlock safety-critical).
 */

import type {
  OutputMapping,
  OutputTargetType,
  AmbientSignalType,
  FrogPhase,
  LaserInterlockStatus,
} from './types.js';
import { OutputMappingSchema, LaserInterlockStatusSchema } from './types.js';
import type { SensorStream } from './sensor-interface.js';
import type { OutputDevice } from './sensor-interface.js';

// ============================================================================
// Audio synthesis parameters
// ============================================================================

export interface AudioSynthParams {
  oscillatorFreq: number;    // Hz (20-20000)
  filterCutoff: number;      // Hz
  filterResonance: number;   // 0-1
  envelopeAttack: number;    // seconds
  envelopeDecay: number;     // seconds
  envelopeSustain: number;   // 0-1
  envelopeRelease: number;   // seconds
  gain: number;              // 0-1
}

export const DEFAULT_AUDIO_PARAMS: AudioSynthParams = {
  oscillatorFreq: 440,
  filterCutoff: 2000,
  filterResonance: 0.5,
  envelopeAttack: 0.01,
  envelopeDecay: 0.1,
  envelopeSustain: 0.7,
  envelopeRelease: 0.3,
  gain: 0.5,
};

// ============================================================================
// DMX-512 frame
// ============================================================================

export const DMX_CHANNELS = 512;
export const DMX_OUTPUT_RATE_HZ = 44;

export interface DmxFrame {
  channels: Uint8Array;  // 512 channels, 0-255 each
  timestamp: number;
  frameNumber: number;
}

export function createDmxFrame(frameNumber: number): DmxFrame {
  return {
    channels: new Uint8Array(DMX_CHANNELS),
    timestamp: Date.now(),
    frameNumber,
  };
}

// ============================================================================
// LED strip control (WS2812B)
// ============================================================================

export interface LedPixel {
  r: number;  // 0-255
  g: number;  // 0-255
  b: number;  // 0-255
  brightness: number;  // 0-1
}

export interface LedStripState {
  pixelCount: number;
  pixels: LedPixel[];
  globalBrightness: number;  // 0-1
}

export function createLedStrip(pixelCount: number): LedStripState {
  const pixels: LedPixel[] = Array.from({ length: pixelCount }, () => ({
    r: 0, g: 0, b: 0, brightness: 1,
  }));
  return { pixelCount, pixels, globalBrightness: 1 };
}

// ============================================================================
// ILDA laser point stream
// ============================================================================

export interface IldaPoint {
  x: number;       // -32768 to 32767
  y: number;       // -32768 to 32767
  r: number;       // 0-255
  g: number;       // 0-255
  b: number;       // 0-255
  blanking: boolean;
}

export interface LaserSafetyState {
  interlockStatus: LaserInterlockStatus;
  interlockConfirmed: boolean;
  lastCheckTimestamp: number;
  outputEnabled: boolean;
}

// ============================================================================
// Frog Protocol phase -> lighting sequences
// ============================================================================

export interface PhaseColorScheme {
  primary: [number, number, number];
  secondary: [number, number, number];
  intensity: number;  // 0-1
  pulseRate: number;  // Hz, 0 = static
}

export const FROG_PHASE_COLORS: Record<FrogPhase, PhaseColorScheme> = {
  BASELINE: { primary: [0, 128, 0], secondary: [0, 64, 0], intensity: 0.3, pulseRate: 0 },
  SILENCE:  { primary: [0, 0, 64], secondary: [0, 0, 32], intensity: 0.1, pulseRate: 0 },
  ASSESS:   { primary: [255, 165, 0], secondary: [128, 80, 0], intensity: 0.6, pulseRate: 1 },
  PROBE:    { primary: [255, 255, 0], secondary: [128, 128, 0], intensity: 0.8, pulseRate: 2 },
  CLASSIFY: { primary: [255, 0, 0], secondary: [128, 0, 0], intensity: 1.0, pulseRate: 4 },
  RESUME:   { primary: [0, 255, 128], secondary: [0, 128, 64], intensity: 0.5, pulseRate: 0.5 },
};

// ============================================================================
// Output Synthesis Engine
// ============================================================================

export class OutputSynthesis {
  private _mappings = new Map<string, OutputMapping>();
  private _sources = new Map<string, SensorStream>();
  private _targets = new Map<string, OutputDevice>();
  private _audioParams: AudioSynthParams = { ...DEFAULT_AUDIO_PARAMS };
  private _dmxFrame: DmxFrame = createDmxFrame(0);
  private _ledStrip: LedStripState | null = null;
  private _laserSafety: LaserSafetyState = {
    interlockStatus: 'UNKNOWN',
    interlockConfirmed: false,
    lastCheckTimestamp: 0,
    outputEnabled: false,
  };
  private _currentPhase: FrogPhase = 'BASELINE';
  private _running = false;
  private _frameCount = 0;

  // --------------------------------------------------------------------------
  // Source/target registration
  // --------------------------------------------------------------------------

  registerSource(source: SensorStream): void {
    this._sources.set(source.id, source);
  }

  unregisterSource(id: string): void {
    this._sources.delete(id);
  }

  registerTarget(target: OutputDevice): void {
    this._targets.set(target.id, target);
  }

  unregisterTarget(id: string): void {
    this._targets.delete(id);
  }

  // --------------------------------------------------------------------------
  // Mapping configuration (hot-reloadable)
  // --------------------------------------------------------------------------

  addMapping(mapping: OutputMapping): void {
    const validated = OutputMappingSchema.parse(mapping);
    this._mappings.set(validated.id, validated);
  }

  removeMapping(id: string): void {
    this._mappings.delete(id);
  }

  getMappings(): OutputMapping[] {
    return [...this._mappings.values()];
  }

  /** Hot-reload: replace all mappings atomically. */
  reloadMappings(mappings: OutputMapping[]): void {
    this._mappings.clear();
    for (const m of mappings) {
      this.addMapping(m);
    }
  }

  // --------------------------------------------------------------------------
  // Audio synthesis (CF-19)
  // --------------------------------------------------------------------------

  setAudioParams(params: Partial<AudioSynthParams>): void {
    Object.assign(this._audioParams, params);
  }

  getAudioParams(): AudioSynthParams {
    return { ...this._audioParams };
  }

  /** Generate audio output value from mapped sensor. */
  synthesizeAudio(signalType: AmbientSignalType, value: number): AudioSynthParams {
    const mapping = this._findMapping(signalType, 'audio_oscillator');
    if (!mapping) return { ...this._audioParams };

    const normalized = this._normalizeValue(value, mapping.range);
    return {
      ...this._audioParams,
      oscillatorFreq: 20 + normalized * (20000 - 20),
    };
  }

  // --------------------------------------------------------------------------
  // DMX-512 (CF-20)
  // --------------------------------------------------------------------------

  /** Set a DMX channel value. */
  setDmxChannel(channel: number, value: number): void {
    if (channel < 0 || channel >= DMX_CHANNELS) return;
    this._dmxFrame.channels[channel] = Math.max(0, Math.min(255, Math.round(value)));
  }

  /** Generate a DMX frame from current state. */
  generateDmxFrame(): DmxFrame {
    this._frameCount++;
    this._dmxFrame.frameNumber = this._frameCount;
    this._dmxFrame.timestamp = Date.now();
    return {
      channels: new Uint8Array(this._dmxFrame.channels),
      timestamp: this._dmxFrame.timestamp,
      frameNumber: this._dmxFrame.frameNumber,
    };
  }

  /** Apply Frog phase colors to DMX channels. */
  applyPhaseToFrame(phase: FrogPhase, startChannel = 0): DmxFrame {
    const scheme = FROG_PHASE_COLORS[phase];
    const [r, g, b] = scheme.primary;
    const intensity = scheme.intensity;

    this.setDmxChannel(startChannel, r * intensity);
    this.setDmxChannel(startChannel + 1, g * intensity);
    this.setDmxChannel(startChannel + 2, b * intensity);
    this.setDmxChannel(startChannel + 3, intensity * 255);

    return this.generateDmxFrame();
  }

  getDmxFrame(): DmxFrame {
    return {
      channels: new Uint8Array(this._dmxFrame.channels),
      timestamp: this._dmxFrame.timestamp,
      frameNumber: this._dmxFrame.frameNumber,
    };
  }

  // --------------------------------------------------------------------------
  // LED strip control (CF-21)
  // --------------------------------------------------------------------------

  initLedStrip(pixelCount: number): void {
    this._ledStrip = createLedStrip(pixelCount);
  }

  setPixel(index: number, r: number, g: number, b: number, brightness = 1): void {
    if (!this._ledStrip || index < 0 || index >= this._ledStrip.pixelCount) return;
    this._ledStrip.pixels[index] = {
      r: Math.max(0, Math.min(255, r)),
      g: Math.max(0, Math.min(255, g)),
      b: Math.max(0, Math.min(255, b)),
      brightness: Math.max(0, Math.min(1, brightness)),
    };
  }

  setGlobalBrightness(brightness: number): void {
    if (!this._ledStrip) return;
    this._ledStrip.globalBrightness = Math.max(0, Math.min(1, brightness));
  }

  getLedStrip(): LedStripState | null {
    if (!this._ledStrip) return null;
    return {
      pixelCount: this._ledStrip.pixelCount,
      pixels: this._ledStrip.pixels.map(p => ({ ...p })),
      globalBrightness: this._ledStrip.globalBrightness,
    };
  }

  /** Apply Frog phase colors to LED strip. */
  applyPhaseToStrip(phase: FrogPhase): void {
    if (!this._ledStrip) return;
    const scheme = FROG_PHASE_COLORS[phase];
    const [r, g, b] = scheme.primary;
    for (let i = 0; i < this._ledStrip.pixelCount; i++) {
      this.setPixel(i, r, g, b, scheme.intensity);
    }
  }

  // --------------------------------------------------------------------------
  // ILDA laser output (CF-22, SC-LAS)
  // --------------------------------------------------------------------------

  /**
   * SC-LAS / CF-22: REFUSES to drive laser without confirmed interlock.
   * This is a safety-critical check.
   */
  setLaserInterlock(status: LaserInterlockStatus, confirmed: boolean): void {
    this._laserSafety = {
      interlockStatus: status,
      interlockConfirmed: confirmed,
      lastCheckTimestamp: Date.now(),
      outputEnabled: status === 'ENGAGED' && confirmed,
    };
  }

  getLaserSafety(): LaserSafetyState {
    return { ...this._laserSafety };
  }

  /**
   * Generate an ILDA laser point.
   * REFUSES output if interlock is not ENGAGED + confirmed.
   */
  generateLaserPoint(x: number, y: number, r: number, g: number, b: number): IldaPoint | null {
    // SC-LAS: Safety-critical interlock check
    if (!this._laserSafety.outputEnabled ||
        this._laserSafety.interlockStatus !== 'ENGAGED' ||
        !this._laserSafety.interlockConfirmed) {
      return null;  // REFUSE output — no interlock
    }

    return {
      x: Math.max(-32768, Math.min(32767, Math.round(x))),
      y: Math.max(-32768, Math.min(32767, Math.round(y))),
      r: Math.max(0, Math.min(255, Math.round(r))),
      g: Math.max(0, Math.min(255, Math.round(g))),
      b: Math.max(0, Math.min(255, Math.round(b))),
      blanking: false,
    };
  }

  /**
   * Generate a blanking point (beam off, repositioning).
   * Still requires interlock.
   */
  generateBlankingPoint(x: number, y: number): IldaPoint | null {
    if (!this._laserSafety.outputEnabled) return null;

    return {
      x: Math.max(-32768, Math.min(32767, Math.round(x))),
      y: Math.max(-32768, Math.min(32767, Math.round(y))),
      r: 0, g: 0, b: 0,
      blanking: true,
    };
  }

  // --------------------------------------------------------------------------
  // Phase management
  // --------------------------------------------------------------------------

  setPhase(phase: FrogPhase): void {
    this._currentPhase = phase;
  }

  getPhase(): FrogPhase {
    return this._currentPhase;
  }

  /** Get the color scheme for a Frog phase. */
  getPhaseColorScheme(phase: FrogPhase): PhaseColorScheme {
    return { ...FROG_PHASE_COLORS[phase] };
  }

  // --------------------------------------------------------------------------
  // Engine lifecycle
  // --------------------------------------------------------------------------

  start(): void { this._running = true; }
  stop(): void { this._running = false; }
  get running(): boolean { return this._running; }

  reset(): void {
    this._mappings.clear();
    this._sources.clear();
    this._targets.clear();
    this._audioParams = { ...DEFAULT_AUDIO_PARAMS };
    this._dmxFrame = createDmxFrame(0);
    this._ledStrip = null;
    this._laserSafety = {
      interlockStatus: 'UNKNOWN',
      interlockConfirmed: false,
      lastCheckTimestamp: 0,
      outputEnabled: false,
    };
    this._currentPhase = 'BASELINE';
    this._running = false;
    this._frameCount = 0;
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  private _findMapping(source: AmbientSignalType, target: OutputTargetType): OutputMapping | undefined {
    for (const m of this._mappings.values()) {
      if (m.source === source && m.target === target && m.enabled) return m;
    }
    return undefined;
  }

  private _normalizeValue(value: number, range: [number, number]): number {
    const [min, max] = range;
    if (max === min) return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createOutputSynthesis(): OutputSynthesis {
  return new OutputSynthesis();
}
