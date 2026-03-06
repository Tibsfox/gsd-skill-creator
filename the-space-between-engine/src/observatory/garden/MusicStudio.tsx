// ─── Music Studio ───────────────────────────────────────
// Algorithmic music concepts mapped to foundations.
// Shows wave visualization, frequency/amplitude controls,
// voice layering, and composition config export.
// Actual audio playback requires browser audio context (Tone.js).

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { FoundationId } from '../../types/index.js';

// ─── Types ──────────────────────────────────────────────

type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';

interface Voice {
  id: string;
  waveform: WaveformType;
  frequency: number;
  amplitude: number;
  label: string;
}

interface CompositionConfig {
  foundation: FoundationId;
  voices: Voice[];
  tempo: number;
}

// ─── Foundation-Mapped Defaults ──────────────────────────

const FOUNDATION_VOICES: Record<FoundationId, Voice[]> = {
  'unit-circle': [
    { id: 'uc-1', waveform: 'sine', frequency: 440, amplitude: 0.8, label: 'Pure Rotation' },
    { id: 'uc-2', waveform: 'sine', frequency: 880, amplitude: 0.3, label: 'Harmonic Echo' },
  ],
  'pythagorean': [
    { id: 'py-1', waveform: 'sine', frequency: 264, amplitude: 0.8, label: 'Root (C4)' },
    { id: 'py-2', waveform: 'sine', frequency: 396, amplitude: 0.6, label: 'Perfect Fifth (G4)' },
  ],
  'trigonometry': [
    { id: 'tr-1', waveform: 'sine', frequency: 220, amplitude: 0.7, label: 'Wave A' },
    { id: 'tr-2', waveform: 'sine', frequency: 330, amplitude: 0.5, label: 'Phase-shifted B' },
    { id: 'tr-3', waveform: 'triangle', frequency: 110, amplitude: 0.3, label: 'Deep Oscillation' },
  ],
  'vector-calculus': [
    { id: 'vc-1', waveform: 'sawtooth', frequency: 110, amplitude: 0.6, label: 'Gradient Field' },
    { id: 'vc-2', waveform: 'square', frequency: 220, amplitude: 0.3, label: 'Curl Component' },
  ],
  'set-theory': [
    { id: 'st-1', waveform: 'square', frequency: 330, amplitude: 0.5, label: 'Membership Pulse' },
    { id: 'st-2', waveform: 'sine', frequency: 440, amplitude: 0.4, label: 'Complement Tone' },
  ],
  'category-theory': [
    { id: 'ct-1', waveform: 'triangle', frequency: 262, amplitude: 0.6, label: 'Object Tone' },
    { id: 'ct-2', waveform: 'triangle', frequency: 392, amplitude: 0.4, label: 'Morphism Arrow' },
    { id: 'ct-3', waveform: 'sine', frequency: 523, amplitude: 0.3, label: 'Composition' },
  ],
  'information-theory': [
    { id: 'it-1', waveform: 'sawtooth', frequency: 200, amplitude: 0.5, label: 'Signal' },
    { id: 'it-2', waveform: 'square', frequency: 300, amplitude: 0.2, label: 'Noise Channel' },
  ],
  'l-systems': [
    { id: 'ls-1', waveform: 'sine', frequency: 261, amplitude: 0.7, label: 'Seed Tone' },
    { id: 'ls-2', waveform: 'sine', frequency: 329, amplitude: 0.5, label: 'Branch Harmonic' },
    { id: 'ls-3', waveform: 'triangle', frequency: 523, amplitude: 0.3, label: 'Leaf Rustle' },
  ],
};

// ─── Wave Visualization ─────────────────────────────────

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  voices: Voice[],
): void {
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, w, h);

  // Center line
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  const hueStep = 360 / Math.max(voices.length, 1);

  // Draw each voice
  for (let vi = 0; vi < voices.length; vi++) {
    const voice = voices[vi];
    const hue = (vi * hueStep + 180) % 360;
    ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let px = 0; px < w; px++) {
      const t = (px / w) * 4; // 4 periods visible
      let val = 0;

      const phase = 2 * Math.PI * (voice.frequency / 440) * t;
      switch (voice.waveform) {
        case 'sine':
          val = Math.sin(phase);
          break;
        case 'square':
          val = Math.sin(phase) >= 0 ? 1 : -1;
          break;
        case 'triangle':
          val = (2 / Math.PI) * Math.asin(Math.sin(phase));
          break;
        case 'sawtooth':
          val = 2 * ((voice.frequency / 440) * t - Math.floor((voice.frequency / 440) * t + 0.5));
          break;
      }

      const py = h / 2 - val * voice.amplitude * h * 0.35;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Composite wave
  if (voices.length > 1) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let px = 0; px < w; px++) {
      const t = (px / w) * 4;
      let val = 0;

      for (const voice of voices) {
        const phase = 2 * Math.PI * (voice.frequency / 440) * t;
        let v = 0;
        switch (voice.waveform) {
          case 'sine':
            v = Math.sin(phase);
            break;
          case 'square':
            v = Math.sin(phase) >= 0 ? 1 : -1;
            break;
          case 'triangle':
            v = (2 / Math.PI) * Math.asin(Math.sin(phase));
            break;
          case 'sawtooth':
            v = 2 * ((voice.frequency / 440) * t - Math.floor((voice.frequency / 440) * t + 0.5));
            break;
        }
        val += v * voice.amplitude;
      }

      // Normalize
      val /= voices.length || 1;
      const py = h / 2 - val * h * 0.35;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Labels
  ctx.fillStyle = '#666';
  ctx.font = '10px monospace';
  for (let vi = 0; vi < voices.length; vi++) {
    const hue = (vi * hueStep + 180) % 360;
    ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
    ctx.fillText(voices[vi].label, 6, 14 + vi * 14);
  }
}

// ─── Component ────────────────────────────────────────────

export interface MusicStudioProps {
  foundation: FoundationId;
  onSave: (config: string, title: string) => void;
}

export function MusicStudio({ foundation, onSave }: MusicStudioProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [voices, setVoices] = useState<Voice[]>(() => {
    return [...(FOUNDATION_VOICES[foundation] || FOUNDATION_VOICES['unit-circle'])];
  });
  const [tempo, setTempo] = useState(120);

  // Update voices when foundation changes
  useEffect(() => {
    setVoices([...(FOUNDATION_VOICES[foundation] || FOUNDATION_VOICES['unit-circle'])]);
  }, [foundation]);

  // Render waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawWaveform(ctx, canvas.width, canvas.height, voices);
  }, [voices]);

  const updateVoice = useCallback((id: string, updates: Partial<Voice>) => {
    setVoices((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    );
  }, []);

  const addVoice = useCallback(() => {
    const id = `custom-${Date.now()}`;
    setVoices((prev) => [
      ...prev,
      {
        id,
        waveform: 'sine',
        frequency: 440,
        amplitude: 0.5,
        label: `Voice ${prev.length + 1}`,
      },
    ]);
  }, []);

  const removeVoice = useCallback((id: string) => {
    setVoices((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const handleSave = useCallback(() => {
    const config: CompositionConfig = {
      foundation,
      voices,
      tempo,
    };
    onSave(JSON.stringify(config, null, 2), `${foundation} Composition`);
  }, [foundation, voices, tempo, onSave]);

  return (
    <div className="music-studio" data-testid="music-studio">
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="music-wave-canvas"
        data-testid="music-wave-canvas"
      />

      <div className="music-controls" data-testid="music-controls">
        <label>
          Tempo: {tempo} BPM
          <input
            type="range"
            min="40"
            max="240"
            step="1"
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
          />
        </label>

        <div className="music-voices" data-testid="music-voices">
          {voices.map((voice) => (
            <div key={voice.id} className="voice-row" data-testid={`voice-${voice.id}`}>
              <span className="voice-label">{voice.label}</span>

              <select
                value={voice.waveform}
                onChange={(e) => updateVoice(voice.id, { waveform: e.target.value as WaveformType })}
              >
                <option value="sine">Sine</option>
                <option value="square">Square</option>
                <option value="triangle">Triangle</option>
                <option value="sawtooth">Sawtooth</option>
              </select>

              <label>
                {voice.frequency} Hz
                <input
                  type="range"
                  min="20"
                  max="2000"
                  step="1"
                  value={voice.frequency}
                  onChange={(e) => updateVoice(voice.id, { frequency: Number(e.target.value) })}
                />
              </label>

              <label>
                A: {voice.amplitude.toFixed(2)}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={voice.amplitude}
                  onChange={(e) => updateVoice(voice.id, { amplitude: Number(e.target.value) })}
                />
              </label>

              <button onClick={() => removeVoice(voice.id)}>Remove</button>
            </div>
          ))}
        </div>

        <div className="music-actions">
          <button onClick={addVoice} data-testid="music-add-voice">
            Add Voice
          </button>
          <button data-testid="music-play">
            Play
          </button>
          <button onClick={handleSave} data-testid="music-save">
            Save Composition
          </button>
        </div>
      </div>
    </div>
  );
}
