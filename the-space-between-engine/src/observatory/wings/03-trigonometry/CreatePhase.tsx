// Wing 3 — Create Phase: "Compose a Wave"
// Mix sine waves, hear and see the result. Produces a saveable Creation.
// Completion: produce creation OR skip.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import type { FoundationId, PhaseType, LearnerState, Creation } from '@/types/index';

interface CreatePhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onCreationSave: (creation: Creation) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

interface WaveComponent {
  frequency: number;
  amplitude: number;
  phase: number;
}

export function CreatePhase({
  onComplete,
  onCreationSave,
}: CreatePhaseProps): React.JSX.Element {
  const [waves, setWaves] = useState<WaveComponent[]>([
    { frequency: 1, amplitude: 0.8, phase: 0 },
  ]);
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(false);
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const oscsRef = useRef<Tone.Oscillator[]>([]);
  const gainsRef = useRef<Tone.Gain[]>([]);

  // Canvas rendering — combined waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const draw = () => {
      time += 0.02;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      const centerY = h * 0.5;
      const waveAmp = h * 0.3;

      // Center line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();

      // Individual waves (faint)
      const colors = ['#f06292', '#4fc3f7', '#a5d6a7', '#ffcc80', '#ce93d8'];
      for (let wi = 0; wi < waves.length; wi++) {
        const wave = waves[wi]!;
        ctx.strokeStyle = (colors[wi % colors.length] ?? '#ffffff') + '44';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const t = (x / w) * Math.PI * 2 * 4;
          const y =
            centerY -
            Math.sin(t * wave.frequency + wave.phase + time * wave.frequency) *
              waveAmp *
              wave.amplitude;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Combined wave (bright)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const t = (x / w) * Math.PI * 2 * 4;
        let total = 0;
        for (const wave of waves) {
          total +=
            Math.sin(t * wave.frequency + wave.phase + time * wave.frequency) *
            wave.amplitude;
        }
        // Normalize
        const maxPossible = waves.reduce((s, wv) => s + wv.amplitude, 0);
        const normalized = maxPossible > 0 ? total / maxPossible : 0;
        const y = centerY - normalized * waveAmp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [waves]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      for (const o of oscsRef.current) {
        o.stop();
        o.dispose();
      }
      for (const g of gainsRef.current) {
        g.dispose();
      }
    };
  }, []);

  const handlePlay = useCallback(async () => {
    await Tone.start();
    // Stop any existing
    for (const o of oscsRef.current) {
      o.stop();
      o.dispose();
    }
    for (const g of gainsRef.current) {
      g.dispose();
    }
    oscsRef.current = [];
    gainsRef.current = [];

    const maxAmp = waves.reduce((s, w) => s + w.amplitude, 0);
    for (const wave of waves) {
      const gainVal = maxAmp > 0 ? (wave.amplitude / maxAmp) * 0.12 : 0;
      const gain = new Tone.Gain(gainVal).toDestination();
      const osc = new Tone.Oscillator(wave.frequency * 220, 'sine').connect(gain);
      osc.start();
      oscsRef.current.push(osc);
      gainsRef.current.push(gain);
    }
    setPlaying(true);
  }, [waves]);

  const handleStop = useCallback(() => {
    for (const o of oscsRef.current) {
      o.stop();
      o.dispose();
    }
    for (const g of gainsRef.current) {
      g.dispose();
    }
    oscsRef.current = [];
    gainsRef.current = [];
    setPlaying(false);
  }, []);

  const handleAddWave = useCallback(() => {
    setWaves((prev) => [
      ...prev,
      { frequency: prev.length + 1, amplitude: 0.5, phase: 0 },
    ]);
  }, []);

  const handleRemoveWave = useCallback((index: number) => {
    setWaves((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateWave = useCallback(
    (index: number, field: keyof WaveComponent, value: number) => {
      setWaves((prev) =>
        prev.map((w, i) => (i === index ? { ...w, [field]: value } : w))
      );
    },
    []
  );

  const handleSave = useCallback(() => {
    handleStop();
    const creation: Creation = {
      id: `tr-create-${Date.now()}`,
      foundationId: 'trigonometry',
      type: 'algorithmic-music',
      title: title || `Wave Composition (${waves.length} harmonics)`,
      data: JSON.stringify({
        waves: waves.map((w) => ({
          frequency: w.frequency,
          amplitude: w.amplitude,
          phase: w.phase,
        })),
      }),
      createdAt: new Date().toISOString(),
      shared: false,
    };
    onCreationSave(creation);
    setSaved(true);
  }, [title, waves, onCreationSave, handleStop]);

  const handleSkip = useCallback(() => {
    handleStop();
    onComplete('create');
  }, [onComplete, handleStop]);

  const handleContinue = useCallback(() => {
    handleStop();
    onComplete('create');
  }, [onComplete, handleStop]);

  const colors = ['#f06292', '#4fc3f7', '#a5d6a7', '#ffcc80', '#ce93d8'];

  return (
    <div className="phase phase--create">
      <div className="create__intro">
        <h2>Compose a Wave</h2>
        <p>
          Add sine waves. Set their frequencies, heights, and shifts. Watch them
          combine into a single shape. Listen to the result. You are doing what
          Fourier proved: any shape can be built from sine waves.
        </p>
      </div>

      <div className="create__workspace">
        <canvas
          ref={canvasRef}
          width={700}
          height={250}
          className="create__canvas"
          aria-label="Combined waveform visualization — shows individual and summed sine waves"
        />

        <div className="create__wave-list">
          {waves.map((wave, index) => (
            <div
              key={index}
              className="create__wave-item"
              style={{ borderLeft: `3px solid ${colors[index % colors.length]}` }}
            >
              <span className="create__wave-label">Wave {index + 1}</span>
              <label>
                Frequency
                <input
                  type="range"
                  min={0.5}
                  max={8}
                  step={0.1}
                  value={wave.frequency}
                  onChange={(e) =>
                    handleUpdateWave(index, 'frequency', Number(e.target.value))
                  }
                />
                <span>{wave.frequency.toFixed(1)}</span>
              </label>
              <label>
                Amplitude
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={wave.amplitude}
                  onChange={(e) =>
                    handleUpdateWave(index, 'amplitude', Number(e.target.value))
                  }
                />
                <span>{wave.amplitude.toFixed(2)}</span>
              </label>
              <label>
                Phase
                <input
                  type="range"
                  min={0}
                  max={6.283}
                  step={0.05}
                  value={wave.phase}
                  onChange={(e) =>
                    handleUpdateWave(index, 'phase', Number(e.target.value))
                  }
                />
                <span>{wave.phase.toFixed(2)}</span>
              </label>
              {waves.length > 1 && (
                <button
                  className="create__wave-remove"
                  onClick={() => handleRemoveWave(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button className="create__add-wave-btn" onClick={handleAddWave}>
            + Add wave
          </button>
        </div>

        <div className="create__audio-controls">
          {!playing ? (
            <button className="create__play-btn" onClick={handlePlay}>
              Play
            </button>
          ) : (
            <button className="create__stop-btn" onClick={handleStop}>
              Stop
            </button>
          )}
        </div>

        <div className="create__naming">
          <label className="create__control">
            <span className="create__control-label">Name your composition</span>
            <input
              type="text"
              className="create__title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning Harmonic"
            />
          </label>
        </div>

        <div className="create__actions">
          <button
            className="create__save-btn"
            onClick={handleSave}
            disabled={saved}
          >
            {saved ? 'Saved' : 'Save composition'}
          </button>
        </div>
      </div>

      <div className="create__continue">
        {saved ? (
          <button className="phase__continue-btn" onClick={handleContinue}>
            Complete Wing
          </button>
        ) : (
          <button className="phase__skip-btn" onClick={handleSkip}>
            Skip creation
          </button>
        )}
      </div>
    </div>
  );
}
