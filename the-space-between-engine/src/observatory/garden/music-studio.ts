// Music Studio — Garden Workshop
// Algorithmic music synthesis using Tone.js.
// Foundation-mapped instruments: sine for trig, harmonics for info theory.

import type { FoundationId, Creation } from '../../types/index';
import * as Tone from 'tone';

type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';

interface Voice {
  id: string;
  waveform: WaveformType;
  frequency: number;
  amplitude: number;
  oscillator: Tone.Oscillator;
  gain: Tone.Gain;
}

interface StudioConfig {
  voices: Array<{
    id: string;
    waveform: WaveformType;
    frequency: number;
    amplitude: number;
  }>;
  tempo: number;
  foundation: FoundationId;
}

/**
 * Algorithmic music studio using Tone.js for synthesis.
 * Mathematical relationships become sound:
 *   - Trigonometry: sine wave compositions
 *   - Information theory: harmonic series, entropy-based patterns
 *   - L-systems: rhythmic patterns from recursive grammar
 */
export class MusicStudio {
  private voices: Map<string, Voice> = new Map();
  private tempo = 120;
  private foundation: FoundationId = 'trigonometry';
  private nextVoiceId = 0;
  private isPlaying = false;

  /**
   * Set the active foundation, which determines default instruments
   * and synthesis behavior.
   */
  setFoundation(id: FoundationId): void {
    this.foundation = id;
  }

  /**
   * Load a wing Create phase output as a starting point.
   * Parses the creation data to reconstruct a composition.
   */
  loadCreation(creation: Creation): void {
    this.foundation = creation.foundationId;

    try {
      const config = JSON.parse(creation.data) as StudioConfig;

      // Stop and remove existing voices
      this.stop();
      for (const [id] of Array.from(this.voices.entries())) {
        this.removeVoice(id);
      }

      // Recreate voices from config
      if (config.voices) {
        for (const v of config.voices) {
          this.addVoice(v.waveform, v.frequency, v.amplitude);
        }
      }

      if (config.tempo) {
        this.setTempo(config.tempo);
      }
    } catch {
      // If parse fails, set up foundation defaults
      this.setFoundation(creation.foundationId);
    }
  }

  /**
   * Add a voice (oscillator) to the composition.
   * Returns the voice ID for later modification or removal.
   */
  addVoice(waveform: WaveformType, frequency: number, amplitude: number): string {
    const id = `voice-${this.nextVoiceId++}`;

    const gain = new Tone.Gain(amplitude).toDestination();
    const oscillator = new Tone.Oscillator({
      type: waveform,
      frequency: frequency,
    }).connect(gain);

    const voice: Voice = {
      id,
      waveform,
      frequency,
      amplitude,
      oscillator,
      gain,
    };

    this.voices.set(id, voice);

    // Start the oscillator if the studio is playing
    if (this.isPlaying) {
      oscillator.start();
    }

    return id;
  }

  /**
   * Remove a voice by ID. Stops the oscillator and disconnects.
   */
  removeVoice(id: string): void {
    const voice = this.voices.get(id);
    if (!voice) return;

    voice.oscillator.stop();
    voice.oscillator.disconnect();
    voice.gain.disconnect();
    voice.oscillator.dispose();
    voice.gain.dispose();

    this.voices.delete(id);
  }

  /**
   * Set the global tempo in BPM.
   * Affects Tone.js transport if using sequenced patterns.
   */
  setTempo(bpm: number): void {
    this.tempo = Math.max(20, Math.min(300, bpm));
    Tone.getTransport().bpm.value = this.tempo;
  }

  /**
   * Start all voices playing.
   */
  async play(): Promise<void> {
    // Ensure audio context is started (required by browser autoplay policies)
    await Tone.start();

    this.isPlaying = true;

    for (const voice of Array.from(this.voices.values())) {
      if (voice.oscillator.state !== 'started') {
        voice.oscillator.start();
      }
    }
  }

  /**
   * Stop all voices.
   */
  stop(): void {
    this.isPlaying = false;

    for (const voice of Array.from(this.voices.values())) {
      if (voice.oscillator.state === 'started') {
        voice.oscillator.stop();
      }
    }
  }

  /**
   * Export the current composition as a JSON configuration string.
   * This config can be used to recreate the composition later.
   */
  exportConfig(): string {
    const config: StudioConfig = {
      voices: Array.from(this.voices.values()).map(v => ({
        id: v.id,
        waveform: v.waveform,
        frequency: v.frequency,
        amplitude: v.amplitude,
      })),
      tempo: this.tempo,
      foundation: this.foundation,
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Get foundation-mapped default instruments.
   * Returns suggested voice configurations for the active foundation.
   */
  getFoundationDefaults(): Array<{ waveform: WaveformType; frequency: number; amplitude: number; label: string }> {
    switch (this.foundation) {
      case 'unit-circle':
        return [
          { waveform: 'sine', frequency: 261.63, amplitude: 0.4, label: 'C4 (unity)' },
          { waveform: 'sine', frequency: 523.25, amplitude: 0.2, label: 'C5 (octave)' },
        ];

      case 'trigonometry':
        return [
          { waveform: 'sine', frequency: 440, amplitude: 0.3, label: 'A4 sine' },
          { waveform: 'sine', frequency: 554.37, amplitude: 0.2, label: 'C#5 (major third)' },
          { waveform: 'sine', frequency: 659.25, amplitude: 0.15, label: 'E5 (perfect fifth)' },
        ];

      case 'pythagorean':
        return [
          { waveform: 'sine', frequency: 220, amplitude: 0.3, label: 'A3 (root)' },
          { waveform: 'sine', frequency: 330, amplitude: 0.25, label: 'E4 (3:2 ratio)' },
          { waveform: 'sine', frequency: 440, amplitude: 0.2, label: 'A4 (2:1 ratio)' },
        ];

      case 'information-theory':
        // Harmonic series — the natural spectrum of information
        return [
          { waveform: 'sine', frequency: 220, amplitude: 0.3, label: 'Fundamental' },
          { waveform: 'sine', frequency: 440, amplitude: 0.15, label: '2nd harmonic' },
          { waveform: 'sine', frequency: 660, amplitude: 0.1, label: '3rd harmonic' },
          { waveform: 'sine', frequency: 880, amplitude: 0.075, label: '4th harmonic' },
          { waveform: 'sine', frequency: 1100, amplitude: 0.06, label: '5th harmonic' },
        ];

      case 'vector-calculus':
        return [
          { waveform: 'sawtooth', frequency: 110, amplitude: 0.15, label: 'Gradient sweep' },
          { waveform: 'triangle', frequency: 220, amplitude: 0.2, label: 'Field oscillation' },
        ];

      case 'category-theory':
        return [
          { waveform: 'sine', frequency: 261.63, amplitude: 0.25, label: 'Source (C)' },
          { waveform: 'sine', frequency: 329.63, amplitude: 0.25, label: 'Target (E)' },
          { waveform: 'triangle', frequency: 392, amplitude: 0.15, label: 'Morphism (G)' },
        ];

      case 'set-theory':
        return [
          { waveform: 'square', frequency: 261.63, amplitude: 0.15, label: 'Set A' },
          { waveform: 'square', frequency: 329.63, amplitude: 0.15, label: 'Set B' },
        ];

      case 'l-systems':
        return [
          { waveform: 'triangle', frequency: 440, amplitude: 0.2, label: 'Branch tone' },
          { waveform: 'sine', frequency: 880, amplitude: 0.1, label: 'Leaf resonance' },
          { waveform: 'sawtooth', frequency: 55, amplitude: 0.1, label: 'Growth bass' },
        ];

      default:
        return [
          { waveform: 'sine', frequency: 440, amplitude: 0.3, label: 'Default A4' },
        ];
    }
  }

  /**
   * Get the current number of active voices.
   */
  get voiceCount(): number {
    return this.voices.size;
  }

  /**
   * Check if the studio is currently playing.
   */
  get playing(): boolean {
    return this.isPlaying;
  }

  /**
   * Dispose all voices and clean up Tone.js resources.
   */
  dispose(): void {
    this.stop();
    for (const [id] of Array.from(this.voices.entries())) {
      this.removeVoice(id);
    }
    this.voices.clear();
  }
}
