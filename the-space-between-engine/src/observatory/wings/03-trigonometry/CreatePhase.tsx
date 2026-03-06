/**
 * Wing 3: Trigonometry — Create Phase
 *
 * "Compose a Wave" — mix sine waves at different frequencies/amplitudes,
 * see and describe the result.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface CreatePhaseProps {
  onComplete: () => void;
  onSaveCreation?: (creation: { title: string; data: string }) => void;
}

interface WaveComponent {
  frequency: number;
  amplitude: number;
  phase: number;
}

export const CreatePhase: React.FC<CreatePhaseProps> = ({ onComplete, onSaveCreation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [components, setComponents] = useState<WaveComponent[]>([
    { frequency: 1, amplitude: 1, phase: 0 },
  ]);
  const [saved, setSaved] = useState(false);
  const [compositionName, setCompositionName] = useState('');

  const addComponent = () => {
    if (components.length < 8) {
      setComponents([
        ...components,
        { frequency: components.length + 1, amplitude: 0.5, phase: 0 },
      ]);
    }
  };

  const removeComponent = (index: number) => {
    if (components.length > 1) {
      setComponents(components.filter((_, i) => i !== index));
    }
  };

  const updateComponent = (index: number, field: keyof WaveComponent, value: number) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  const colors = ['#ff9a6a', '#6ab0ff', '#c4ff6a', '#ff6ab0', '#6affc4', '#ffdd57', '#b464ff', '#64ffb4'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;
    const cy = h / 2;
    const maxAmp = h * 0.35;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      // Axis
      ctx.strokeStyle = '#1a2a4a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      const t = time / 1000;
      const samples = 500;

      // Individual components (semi-transparent)
      components.forEach((comp, ci) => {
        ctx.strokeStyle = colors[ci % colors.length];
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const x = (i / samples) * w;
          const phase = (i / samples) * Math.PI * 8;
          const y = cy - Math.sin(phase * comp.frequency + t * comp.frequency + comp.phase) * comp.amplitude * maxAmp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Composite wave
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const x = (i / samples) * w;
        const phase = (i / samples) * Math.PI * 8;
        let y = 0;
        components.forEach((comp) => {
          y += Math.sin(phase * comp.frequency + t * comp.frequency + comp.phase) * comp.amplitude;
        });
        const plotY = cy - y * maxAmp;
        if (i === 0) ctx.moveTo(x, plotY);
        else ctx.lineTo(x, plotY);
      }
      ctx.stroke();

      // Describe the wave character
      const totalAmplitude = components.reduce((sum, c) => sum + c.amplitude, 0);
      const avgFrequency = components.reduce((sum, c) => sum + c.frequency * c.amplitude, 0) / totalAmplitude;
      ctx.fillStyle = '#888';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${components.length} component${components.length === 1 ? '' : 's'}, avg freq: ${avgFrequency.toFixed(1)}`,
        10, h - 10,
      );

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animRef.current);
  }, [components]);

  const handleSave = () => {
    const data = JSON.stringify({
      name: compositionName || 'Untitled Composition',
      components,
    });
    onSaveCreation?.({
      title: compositionName || 'Wave Composition',
      data,
    });
    setSaved(true);
  };

  return (
    <div className="phase create-phase">
      <h2>Compose a Wave</h2>

      <p className="narrative-intro">
        Build your own wave from scratch. Each component is a pure sine wave with its own
        frequency, amplitude, and phase. Together, they produce a composite wave — the
        white line — that can look like anything from a heartbeat to a birdsong. This is
        Fourier synthesis: building complexity from simplicity.
      </p>

      <canvas
        ref={canvasRef}
        className="wing-canvas"
        style={{ width: '100%', height: '300px', borderRadius: '8px' }}
      />

      <div className="wave-components" style={{ margin: '16px 0', maxHeight: '300px', overflowY: 'auto' }}>
        {components.map((comp, i) => (
          <div key={i} style={{
            padding: '8px',
            margin: '4px 0',
            background: '#0a0a2a',
            borderRadius: '6px',
            borderLeft: `3px solid ${colors[i % colors.length]}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: colors[i % colors.length] }}>Harmonic {i + 1}</strong>
              {components.length > 1 && (
                <button onClick={() => removeComponent(i)} style={{ fontSize: '0.8em' }}>Remove</button>
              )}
            </div>
            <label style={{ display: 'block', margin: '4px 0' }}>
              Freq: {comp.frequency.toFixed(1)}x
              <input type="range" min={0.1} max={8} step={0.1} value={comp.frequency}
                onChange={(e) => updateComponent(i, 'frequency', Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ display: 'block', margin: '4px 0' }}>
              Amp: {comp.amplitude.toFixed(2)}
              <input type="range" min={0} max={1} step={0.05} value={comp.amplitude}
                onChange={(e) => updateComponent(i, 'amplitude', Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ display: 'block', margin: '4px 0' }}>
              Phase: {comp.phase.toFixed(2)} rad
              <input type="range" min={0} max={6.28} step={0.1} value={comp.phase}
                onChange={(e) => updateComponent(i, 'phase', Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </label>
          </div>
        ))}

        <button onClick={addComponent} disabled={components.length >= 8} style={{ margin: '8px 0' }}>
          Add Harmonic ({components.length}/8)
        </button>
      </div>

      <div style={{ margin: '12px 0' }}>
        <input
          type="text"
          value={compositionName}
          onChange={(e) => setCompositionName(e.target.value)}
          placeholder="Name your composition..."
          style={{
            width: '100%',
            padding: '8px 12px',
            background: '#0a0a2a',
            color: '#ccc',
            border: '1px solid #2a4a7a',
            borderRadius: '6px',
          }}
        />
      </div>

      <button onClick={handleSave} disabled={saved} style={{ margin: '8px 0' }}>
        {saved ? 'Saved!' : 'Save composition'}
      </button>

      <button className="phase-advance" disabled={!saved} onClick={onComplete} style={{ margin: '8px 0' }}>
        {saved ? 'Complete Wing 3' : 'Save your composition first...'}
      </button>
    </div>
  );
};

export const createMeta = {
  containsMath: true,
  interactiveElements: 3,
  interactiveElementIds: ['trig-create-frequency', 'trig-create-amplitude', 'trig-create-phase'],
  creationType: 'visualization',
};
