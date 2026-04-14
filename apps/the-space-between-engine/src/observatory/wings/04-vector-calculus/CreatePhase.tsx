/**
 * Wing 4: Vector Calculus — Create Phase
 *
 * "Design a Field" — create a vector field that guides particles into a pattern.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface CreatePhaseProps {
  onComplete: () => void;
  onSaveCreation?: (creation: { title: string; data: string }) => void;
}

type FieldPreset = 'vortex' | 'source' | 'sink' | 'dipole' | 'saddle' | 'custom';

interface FieldParams {
  preset: FieldPreset;
  strength: number;
  rotation: number;
}

export const CreatePhase: React.FC<CreatePhaseProps> = ({ onComplete, onSaveCreation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [params, setParams] = useState<FieldParams>({
    preset: 'vortex',
    strength: 1,
    rotation: 0,
  });
  const [saved, setSaved] = useState(false);
  const [designName, setDesignName] = useState('');
  const particlesRef = useRef<Array<{ x: number; y: number; life: number }>>([]);

  const fieldFunction = useCallback(
    (x: number, y: number, w: number, h: number): [number, number] => {
      const cx = w / 2;
      const cy = h / 2;
      let dx = x - cx;
      let dy = y - cy;

      // Apply rotation
      if (params.rotation !== 0) {
        const cos = Math.cos(params.rotation);
        const sin = Math.sin(params.rotation);
        const rdx = dx * cos - dy * sin;
        const rdy = dx * sin + dy * cos;
        dx = rdx;
        dy = rdy;
      }

      const dist = Math.sqrt(dx * dx + dy * dy) + 1;
      const s = params.strength;
      let vx = 0;
      let vy = 0;

      switch (params.preset) {
        case 'vortex':
          vx = (-dy / dist) * s * 80 / dist;
          vy = (dx / dist) * s * 80 / dist;
          break;
        case 'source':
          vx = (dx / dist) * s * 60 / dist;
          vy = (dy / dist) * s * 60 / dist;
          break;
        case 'sink':
          vx = (-dx / dist) * s * 60 / dist;
          vy = (-dy / dist) * s * 60 / dist;
          break;
        case 'dipole':
          // Two sources/sinks
          const d1x = x - cx + 80;
          const d1y = y - cy;
          const d1 = Math.sqrt(d1x * d1x + d1y * d1y) + 1;
          const d2x = x - cx - 80;
          const d2y = y - cy;
          const d2 = Math.sqrt(d2x * d2x + d2y * d2y) + 1;
          vx = (d1x / d1 / d1 - d2x / d2 / d2) * s * 3000;
          vy = (d1y / d1 / d1 - d2y / d2 / d2) * s * 3000;
          break;
        case 'saddle':
          vx = dx * s * 0.3;
          vy = -dy * s * 0.3;
          break;
        case 'custom':
          // Spiral: vortex + source
          vx = (-dy / dist + dx / dist * 0.3) * s * 60 / dist;
          vy = (dx / dist + dy / dist * 0.3) * s * 60 / dist;
          break;
      }

      return [vx, vy];
    },
    [params],
  );

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

    // Seed particles
    if (particlesRef.current.length < 150) {
      for (let i = particlesRef.current.length; i < 150; i++) {
        particlesRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          life: Math.random() * 150,
        });
      }
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 26, 0.15)';
      ctx.fillRect(0, 0, w, h);

      // Draw arrows
      const gridSpacing = 35;
      for (let gx = gridSpacing / 2; gx < w; gx += gridSpacing) {
        for (let gy = gridSpacing / 2; gy < h; gy += gridSpacing) {
          const [fx, fy] = fieldFunction(gx, gy, w, h);
          const mag = Math.sqrt(fx * fx + fy * fy);
          if (mag < 0.05) continue;

          const nx = fx / mag;
          const ny = fy / mag;
          const arrowLen = Math.min(mag * 0.4, gridSpacing * 0.6);

          ctx.strokeStyle = `rgba(42, 74, 122, ${Math.min(mag * 0.3, 0.5)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx + nx * arrowLen, gy + ny * arrowLen);
          ctx.stroke();
        }
      }

      // Update particles
      const particles = particlesRef.current;
      for (const p of particles) {
        const [fx, fy] = fieldFunction(p.x, p.y, w, h);
        p.x += fx * 0.016;
        p.y += fy * 0.016;
        p.life += 1;

        if (p.x < 0 || p.x > w || p.y < 0 || p.y > h || p.life > 200) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.life = 0;
        }

        const alpha = Math.min(1, p.life / 8) * Math.max(0, 1 - p.life / 200);
        ctx.fillStyle = `rgba(255, 221, 87, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [fieldFunction]);

  const handleSave = () => {
    const data = JSON.stringify({
      name: designName || 'Untitled Field',
      preset: params.preset,
      strength: params.strength,
      rotation: params.rotation,
    });
    onSaveCreation?.({
      title: designName || `${params.preset} Field Design`,
      data,
    });
    setSaved(true);
  };

  return (
    <div className="phase create-phase">
      <h2>Design a Field</h2>

      <p className="narrative-intro">
        Choose a field type, adjust its strength and rotation, and watch particles trace
        the pattern. Each preset demonstrates a different fundamental field behavior —
        vortices spin, sources spread, sinks collect, dipoles push and pull, saddle points
        stretch and compress.
      </p>

      <canvas
        ref={canvasRef}
        className="wing-canvas"
        style={{ width: '100%', height: '350px', borderRadius: '8px', background: '#0a0a1a' }}
      />

      <div className="field-controls" style={{ margin: '16px 0' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '8px 0' }}>
          {(['vortex', 'source', 'sink', 'dipole', 'saddle', 'custom'] as FieldPreset[]).map(
            (preset) => (
              <button
                key={preset}
                onClick={() => {
                  setParams((p) => ({ ...p, preset }));
                  particlesRef.current = [];
                }}
                style={{
                  background: params.preset === preset ? '#2a4a7a' : '#1a1a3a',
                  color: '#ccc',
                  border: `1px solid ${params.preset === preset ? '#6ab0ff' : '#2a4a7a'}`,
                  padding: '4px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {preset.charAt(0).toUpperCase() + preset.slice(1)}
              </button>
            ),
          )}
        </div>

        <div style={{ margin: '8px 0' }}>
          <label>
            Strength: {params.strength.toFixed(1)}
            <input
              type="range"
              min={0.1}
              max={3}
              step={0.1}
              value={params.strength}
              onChange={(e) => setParams((p) => ({ ...p, strength: Number(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </label>
        </div>

        <div style={{ margin: '8px 0' }}>
          <label>
            Rotation: {((params.rotation * 180) / Math.PI).toFixed(0)} degrees
            <input
              type="range"
              min={0}
              max={6.28}
              step={0.1}
              value={params.rotation}
              onChange={(e) => setParams((p) => ({ ...p, rotation: Number(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </label>
        </div>
      </div>

      <div style={{ margin: '12px 0' }}>
        <input
          type="text"
          value={designName}
          onChange={(e) => setDesignName(e.target.value)}
          placeholder="Name your field design..."
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
        {saved ? 'Saved!' : 'Save field design'}
      </button>

      <button className="phase-advance" disabled={!saved} onClick={onComplete} style={{ margin: '8px 0' }}>
        {saved ? 'Complete Wing 4' : 'Save your creation first...'}
      </button>
    </div>
  );
};

export const createMeta = {
  containsMath: true,
  interactiveElements: 3,
  interactiveElementIds: ['vc-create-preset', 'vc-create-strength', 'vc-create-rotation'],
  creationType: 'visualization',
};
