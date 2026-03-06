/**
 * Wing 4: Vector Calculus — Touch Phase
 *
 * Paint vector fields. Drop particles.
 * Toggle gradient/divergence/curl overlays.
 * Interactive elements: canvas paint, particle dropper, overlay toggle.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface TouchPhaseProps {
  onComplete: () => void;
}

type Overlay = 'none' | 'divergence' | 'curl';

interface FieldVector {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  life: number;
}

export const TouchPhase: React.FC<TouchPhaseProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [overlay, setOverlay] = useState<Overlay>('none');
  const [tool, setTool] = useState<'paint' | 'particle'>('paint');
  const [interactions, setInteractions] = useState(0);
  const fieldRef = useRef<FieldVector[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const isPaintingRef = useRef(false);

  const gridSize = 20;

  const track = () => setInteractions((n) => n + 1);

  // Initialize field grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cols = Math.ceil(rect.width / gridSize);
    const rows = Math.ceil(rect.height / gridSize);
    const field: FieldVector[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        field.push({
          x: c * gridSize + gridSize / 2,
          y: r * gridSize + gridSize / 2,
          vx: 0,
          vy: 0,
        });
      }
    }
    fieldRef.current = field;
  }, []);

  const getFieldIndex = useCallback(
    (x: number, y: number, w: number): number => {
      const col = Math.floor(x / gridSize);
      const cols = Math.ceil(w / gridSize);
      const row = Math.floor(y / gridSize);
      return row * cols + col;
    },
    [],
  );

  const paintAt = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const cols = Math.ceil(rect.width / gridSize);

      // Paint field vectors in a radius around the mouse
      const radius = 60;
      const field = fieldRef.current;
      for (const v of field) {
        const dx = v.x - x;
        const dy = v.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius && dist > 1) {
          // Create a swirling pattern
          const strength = (1 - dist / radius) * 2;
          v.vx += (-dy / dist) * strength;
          v.vy += (dx / dist) * strength;
          // Clamp
          const mag = Math.sqrt(v.vx * v.vx + v.vy * v.vy);
          if (mag > 5) {
            v.vx = (v.vx / mag) * 5;
            v.vy = (v.vy / mag) * 5;
          }
        }
      }
      track();
    },
    [],
  );

  const dropParticle = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      // Drop several particles in a cluster
      for (let i = 0; i < 10; i++) {
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          life: 0,
        });
      }
      track();
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      isPaintingRef.current = true;
      if (tool === 'paint') paintAt(e.clientX, e.clientY);
      else dropParticle(e.clientX, e.clientY);
    },
    [tool, paintAt, dropParticle],
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isPaintingRef.current) return;
      if (tool === 'paint') paintAt(e.clientX, e.clientY);
      else dropParticle(e.clientX, e.clientY);
    },
    [tool, paintAt, dropParticle],
  );

  const handlePointerUp = useCallback(() => {
    isPaintingRef.current = false;
  }, []);

  // Animation loop
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
    const cols = Math.ceil(w / gridSize);

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 26, 0.3)';
      ctx.fillRect(0, 0, w, h);

      const field = fieldRef.current;

      // Draw overlay
      if (overlay !== 'none') {
        for (let i = 0; i < field.length; i++) {
          const v = field[i];
          const col = i % cols;
          const row = Math.floor(i / cols);

          if (overlay === 'divergence') {
            // Approximate divergence: dvx/dx + dvy/dy
            const right = col < cols - 1 ? field[i + 1] : v;
            const below = i + cols < field.length ? field[i + cols] : v;
            const div = (right.vx - v.vx) / gridSize + (below.vy - v.vy) / gridSize;
            const intensity = Math.abs(div) * 50;
            ctx.fillStyle =
              div > 0
                ? `rgba(100, 255, 100, ${Math.min(intensity, 0.4)})`
                : `rgba(255, 100, 100, ${Math.min(intensity, 0.4)})`;
            ctx.fillRect(v.x - gridSize / 2, v.y - gridSize / 2, gridSize, gridSize);
          } else if (overlay === 'curl') {
            // Approximate curl (2D): dvy/dx - dvx/dy
            const right = col < cols - 1 ? field[i + 1] : v;
            const below = i + cols < field.length ? field[i + cols] : v;
            const curl = (right.vy - v.vy) / gridSize - (below.vx - v.vx) / gridSize;
            const intensity = Math.abs(curl) * 50;
            ctx.fillStyle =
              curl > 0
                ? `rgba(100, 100, 255, ${Math.min(intensity, 0.4)})`
                : `rgba(255, 200, 100, ${Math.min(intensity, 0.4)})`;
            ctx.fillRect(v.x - gridSize / 2, v.y - gridSize / 2, gridSize, gridSize);
          }
        }
      }

      // Draw field arrows
      for (const v of field) {
        const mag = Math.sqrt(v.vx * v.vx + v.vy * v.vy);
        if (mag < 0.05) continue;

        const nx = v.vx / mag;
        const ny = v.vy / mag;
        const arrowLen = Math.min(mag * 3, gridSize * 0.8);

        ctx.strokeStyle = `rgba(100, 180, 255, ${Math.min(mag * 0.4, 0.8)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(v.x, v.y);
        ctx.lineTo(v.x + nx * arrowLen, v.y + ny * arrowLen);
        ctx.stroke();
      }

      // Update and draw particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;

        // Interpolate field at particle position
        const idx = getFieldIndex(p.x, p.y, w);
        if (idx >= 0 && idx < field.length) {
          p.x += field[idx].vx * 0.5;
          p.y += field[idx].vy * 0.5;
        }

        // Remove dead or out-of-bounds particles
        if (p.life > 200 || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = Math.min(1, p.life / 5) * Math.max(0, 1 - p.life / 200);
        ctx.fillStyle = `rgba(255, 221, 87, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Decay field slightly
      for (const v of field) {
        v.vx *= 0.998;
        v.vy *= 0.998;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animRef.current);
  }, [overlay, getFieldIndex]);

  const canAdvance = interactions >= 10;

  return (
    <div className="phase touch-phase">
      <h2>Paint a Field</h2>

      <p className="narrative-intro">
        Use the paint tool to create vector fields — drag across the canvas to set
        directions. Switch to the particle tool to drop test particles and watch them
        follow your field. Toggle the divergence and curl overlays to see the hidden
        structure of what you have created.
      </p>

      <canvas
        ref={canvasRef}
        className="wing-canvas"
        style={{
          width: '100%',
          height: '400px',
          borderRadius: '8px',
          background: '#0a0a1a',
          cursor: tool === 'paint' ? 'crosshair' : 'pointer',
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
      />

      <div className="controls" style={{ margin: '16px 0' }}>
        {/* Interactive element 1: tool selection (paint/particle) */}
        <div style={{ display: 'flex', gap: '8px', margin: '8px 0', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setTool('paint'); track(); }}
            style={{
              background: tool === 'paint' ? '#2a4a7a' : '#1a1a3a',
              color: '#ccc',
              border: `1px solid ${tool === 'paint' ? '#6ab0ff' : '#2a4a7a'}`,
              padding: '6px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Paint Field
          </button>
          <button
            onClick={() => { setTool('particle'); track(); }}
            style={{
              background: tool === 'particle' ? '#2a4a7a' : '#1a1a3a',
              color: '#ccc',
              border: `1px solid ${tool === 'particle' ? '#ffdd57' : '#2a4a7a'}`,
              padding: '6px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Drop Particles
          </button>
        </div>

        {/* Interactive element 2: overlay toggle */}
        <div style={{ display: 'flex', gap: '8px', margin: '8px 0', flexWrap: 'wrap' }}>
          <span style={{ color: '#888', marginRight: '4px' }}>Overlay:</span>
          {(['none', 'divergence', 'curl'] as Overlay[]).map((ov) => (
            <button
              key={ov}
              onClick={() => { setOverlay(ov); track(); }}
              style={{
                background: overlay === ov ? '#2a4a7a' : '#1a1a3a',
                color: '#ccc',
                border: `1px solid ${overlay === ov ? '#6ab0ff' : '#2a4a7a'}`,
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9em',
              }}
            >
              {ov === 'none' ? 'None' : ov.charAt(0).toUpperCase() + ov.slice(1)}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            fieldRef.current.forEach((v) => { v.vx = 0; v.vy = 0; });
            particlesRef.current = [];
            track();
          }}
          style={{ margin: '8px 0' }}
        >
          Clear Field
        </button>
      </div>

      <div className="overlay-legend" style={{
        fontFamily: 'monospace',
        fontSize: '0.85em',
        color: '#888',
        margin: '8px 0',
      }}>
        {overlay === 'divergence' && (
          <p>
            <span style={{ color: '#64ff64' }}>Green</span> = positive divergence (source, field spreads out).{' '}
            <span style={{ color: '#ff6464' }}>Red</span> = negative divergence (sink, field converges).
          </p>
        )}
        {overlay === 'curl' && (
          <p>
            <span style={{ color: '#6464ff' }}>Blue</span> = positive curl (counterclockwise rotation).{' '}
            <span style={{ color: '#ffc864' }}>Orange</span> = negative curl (clockwise rotation).
          </p>
        )}
      </div>

      <button className="phase-advance" disabled={!canAdvance} onClick={onComplete}>
        {canAdvance ? 'Continue' : `Explore more (${interactions}/10 interactions)...`}
      </button>
    </div>
  );
};

/**
 * Interactive elements for validation:
 * 1. Canvas paint tool (paint field vectors by dragging)
 * 2. Overlay toggle (none/divergence/curl)
 * Plus: particle dropper, clear button
 */
export const touchMeta = {
  containsMath: true,
  interactiveElements: 2,
  interactiveElementIds: ['vc-touch-paint', 'vc-touch-overlay'],
  interactiveElementTypes: ['canvas-paint', 'toggle'] as const,
};
