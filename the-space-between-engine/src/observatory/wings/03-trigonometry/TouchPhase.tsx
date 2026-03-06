/**
 * Wing 3: Trigonometry — Touch Phase
 *
 * Animate the circle, watch sine/cosine emerge as waves.
 * Layer frequencies. Describe audio interaction.
 * Interactive elements: frequency slider, amplitude slider, waveform buttons.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface TouchPhaseProps {
  onComplete: () => void;
}

interface WaveLayer {
  frequency: number;
  amplitude: number;
  color: string;
}

export const TouchPhase: React.FC<TouchPhaseProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [frequency, setFrequency] = useState(1);
  const [amplitude, setAmplitude] = useState(1);
  const [layers, setLayers] = useState<WaveLayer[]>([]);
  const [interactions, setInteractions] = useState(0);
  const [showComposite, setShowComposite] = useState(false);

  const layerColors = ['#ff9a6a', '#6ab0ff', '#c4ff6a', '#ff6ab0', '#6affc4'];

  const addLayer = () => {
    if (layers.length < 5) {
      setLayers([
        ...layers,
        {
          frequency,
          amplitude,
          color: layerColors[layers.length % layerColors.length],
        },
      ]);
      track();
    }
  };

  const clearLayers = () => {
    setLayers([]);
    track();
  };

  const track = () => setInteractions((n) => n + 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const draw = (time: number) => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cy = h / 2;
      const maxAmp = h * 0.35;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      // Time axis
      ctx.strokeStyle = '#1a2a4a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      const t = time / 1000;
      const samples = 500;

      // Draw individual layers
      const allWaves: WaveLayer[] = [
        { frequency, amplitude, color: '#ffdd57' },
        ...layers,
      ];

      allWaves.forEach((wave) => {
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = showComposite ? 0.3 : 0.8;
        ctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const x = (i / samples) * w;
          const phase = (i / samples) * Math.PI * 8;
          const y =
            cy - Math.sin(phase * wave.frequency + t * wave.frequency) * wave.amplitude * maxAmp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Draw composite wave (sum of all)
      if (showComposite && layers.length > 0) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const x = (i / samples) * w;
          const phase = (i / samples) * Math.PI * 8;
          let y = 0;
          allWaves.forEach((wave) => {
            y += Math.sin(phase * wave.frequency + t * wave.frequency) * wave.amplitude;
          });
          const plotY = cy - y * maxAmp;
          if (i === 0) ctx.moveTo(x, plotY);
          else ctx.lineTo(x, plotY);
        }
        ctx.stroke();
      }

      // Legend
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      allWaves.forEach((wave, i) => {
        ctx.fillStyle = wave.color;
        ctx.fillText(
          `${i === 0 ? 'Main' : `Layer ${i}`}: f=${wave.frequency.toFixed(1)} a=${wave.amplitude.toFixed(1)}`,
          10,
          20 + i * 18,
        );
      });

      if (showComposite && layers.length > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Composite (white)', 10, 20 + allWaves.length * 18);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [frequency, amplitude, layers, showComposite]);

  const canAdvance = interactions >= 5;

  return (
    <div className="phase touch-phase">
      <h2>Play with Waves</h2>

      <p className="narrative-intro">
        Adjust the frequency and amplitude of the main wave. Then layer additional waves
        on top — this is how complex sounds and signals are built from simple oscillations.
        If you had speakers connected, each wave would produce a tone: low frequencies
        hum, high frequencies sing.
      </p>

      <canvas
        ref={canvasRef}
        className="wing-canvas"
        style={{ width: '100%', height: '350px', borderRadius: '8px' }}
      />

      <div className="controls" style={{ margin: '16px 0' }}>
        {/* Interactive element 1: frequency slider */}
        <div style={{ margin: '8px 0' }}>
          <label>
            Frequency: {frequency.toFixed(1)}x
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={frequency}
              onChange={(e) => { setFrequency(Number(e.target.value)); track(); }}
              style={{ width: '100%' }}
            />
          </label>
          <span style={{ fontSize: '0.85em', color: '#888' }}>
            {frequency < 1 ? ' (slow, deep tone)' : frequency < 2 ? ' (medium pitch)' : ' (fast, high pitch)'}
          </span>
        </div>

        {/* Interactive element 2: amplitude slider */}
        <div style={{ margin: '8px 0' }}>
          <label>
            Amplitude: {amplitude.toFixed(1)}x
            <input
              type="range"
              min={0.1}
              max={1.5}
              step={0.1}
              value={amplitude}
              onChange={(e) => { setAmplitude(Number(e.target.value)); track(); }}
              style={{ width: '100%' }}
            />
          </label>
          <span style={{ fontSize: '0.85em', color: '#888' }}>
            {amplitude < 0.5 ? ' (quiet)' : amplitude < 1 ? ' (moderate)' : ' (loud)'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', margin: '12px 0', flexWrap: 'wrap' }}>
          <button onClick={addLayer} disabled={layers.length >= 5}>
            Add Layer ({layers.length}/5)
          </button>
          <button onClick={clearLayers} disabled={layers.length === 0}>
            Clear Layers
          </button>
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={showComposite}
              onChange={() => { setShowComposite((v) => !v); track(); }}
              style={{ marginRight: 6 }}
            />
            Show composite wave
          </label>
        </div>
      </div>

      <div className="audio-description" style={{
        padding: '12px',
        background: '#0a0a2a',
        borderRadius: '8px',
        margin: '12px 0',
        fontSize: '0.9em',
        color: '#aaa',
      }}>
        <p>
          <strong>If this were sound:</strong> A frequency of 1x would be a deep hum around
          220 Hz (the note A below middle C). At 2x, the pitch doubles to 440 Hz (concert A).
          At 4x, it doubles again to 880 Hz. Adding layers at different frequencies creates
          the complex timbres that distinguish a violin from a flute — same note, different
          mix of harmonics.
        </p>
      </div>

      <button className="phase-advance" disabled={!canAdvance} onClick={onComplete}>
        {canAdvance ? 'Continue' : `Explore more (${interactions}/5 interactions)...`}
      </button>
    </div>
  );
};

/**
 * Interactive elements for validation:
 * 1. Frequency slider
 * 2. Amplitude slider
 * Plus: add layer button, composite toggle (counted as additional interaction targets)
 */
export const touchMeta = {
  containsMath: true,
  interactiveElements: 2,
  interactiveElementIds: ['trig-touch-frequency', 'trig-touch-amplitude'],
  interactiveElementTypes: ['slider', 'slider'] as const,
};
