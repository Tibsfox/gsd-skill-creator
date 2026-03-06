// Wing 4 — Touch Phase: "Paint a Field"
// Paint vector fields, drop particles, toggle gradient/divergence/curl overlays.
// Labels: plain-language FIRST, then notation.
// Completion: >= 3 parameter changes OR >= 2min.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';

interface TouchPhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

type FieldMode = 'radial' | 'vortex' | 'sink' | 'saddle' | 'custom';
type OverlayMode = 'none' | 'gradient' | 'divergence' | 'curl';

interface Particle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

interface PaintedVector {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export function TouchPhase({
  onComplete,
}: TouchPhaseProps): React.JSX.Element {
  const [timeSpent, setTimeSpent] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [fieldMode, setFieldMode] = useState<FieldMode>('vortex');
  const [overlay, setOverlay] = useState<OverlayMode>('none');
  const [particleCount, setParticleCount] = useState(200);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const paintedRef = useRef<PaintedVector[]>([]);
  const paintingRef = useRef(false);
  const lastPaintRef = useRef({ x: 0, y: 0 });
  const fieldModeRef = useRef<FieldMode>('vortex');
  const overlayRef = useRef<OverlayMode>('none');

  useEffect(() => { fieldModeRef.current = fieldMode; }, [fieldMode]);
  useEffect(() => { overlayRef.current = overlay; }, [overlay]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (completed) return;
    if (interactionCount >= 3 || timeSpent >= 120) {
      setCompleted(true);
    }
  }, [interactionCount, timeSpent, completed]);

  // Initialize particles
  useEffect(() => {
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: Math.random(), y: Math.random(),
        age: 0, maxAge: 2 + Math.random() * 4,
      });
    }
  }, [particleCount]);

  const evaluateField = useCallback((nx: number, ny: number): [number, number] => {
    const x = (nx - 0.5) * 2;
    const y = (ny - 0.5) * 2;
    const r = Math.sqrt(x * x + y * y);
    const safeR = Math.max(r, 0.01);

    switch (fieldModeRef.current) {
      case 'radial': return [x / safeR, y / safeR];
      case 'vortex': return [-y / safeR, x / safeR];
      case 'sink': return [-x / safeR, -y / safeR];
      case 'saddle': return [x, -y];
      case 'custom': {
        if (paintedRef.current.length === 0) return [0, 0];
        let sumDx = 0, sumDy = 0, sumW = 0;
        for (const pv of paintedRef.current) {
          const d = Math.sqrt((nx - pv.x) ** 2 + (ny - pv.y) ** 2);
          const w = 1 / (d * d + 0.001);
          sumDx += pv.dx * w;
          sumDy += pv.dy * w;
          sumW += w;
        }
        return sumW > 0 ? [sumDx / sumW, sumDy / sumW] : [0, 0];
      }
      default: return [0, 0];
    }
  }, []);

  // Canvas + animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Fade
      ctx.fillStyle = 'rgba(10, 10, 26, 0.12)';
      ctx.fillRect(0, 0, w, h);

      // Overlay
      if (overlayRef.current !== 'none') {
        const gridSize = 25;
        const cellW = w / gridSize;
        const cellH = h / gridSize;
        for (let gx = 0; gx < gridSize; gx++) {
          for (let gy = 0; gy < gridSize; gy++) {
            const nx = (gx + 0.5) / gridSize;
            const ny = (gy + 0.5) / gridSize;
            const [dx, dy] = evaluateField(nx, ny);
            let value = 0;
            if (overlayRef.current === 'gradient') {
              value = Math.sqrt(dx * dx + dy * dy);
            } else if (overlayRef.current === 'divergence') {
              // Approximate divergence: dFx/dx + dFy/dy
              const eps = 0.01;
              const [dxp] = evaluateField(nx + eps, ny);
              const [dxm] = evaluateField(nx - eps, ny);
              const [, dyp] = evaluateField(nx, ny + eps);
              const [, dym] = evaluateField(nx, ny - eps);
              value = ((dxp - dxm) / (2 * eps) + (dyp - dym) / (2 * eps));
            } else if (overlayRef.current === 'curl') {
              // Approximate curl (2D): dFy/dx - dFx/dy
              const eps = 0.01;
              const [, fyp] = evaluateField(nx + eps, ny);
              const [, fym] = evaluateField(nx - eps, ny);
              const [fxp] = evaluateField(nx, ny + eps);
              const [fxm] = evaluateField(nx, ny - eps);
              value = (fyp - fym) / (2 * eps) - (fxp - fxm) / (2 * eps);
            }

            const intensity = Math.min(1, Math.abs(value) * 0.3);
            const hue = value > 0 ? 200 : 0;
            ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${intensity * 0.25})`;
            ctx.fillRect(gx * cellW, gy * cellH, cellW, cellH);
          }
        }
      }

      // Arrows
      const arrowGrid = 12;
      const arrowLen = Math.min(w, h) / arrowGrid * 0.3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < arrowGrid; gx++) {
        for (let gy = 0; gy < arrowGrid; gy++) {
          const nx = (gx + 0.5) / arrowGrid;
          const ny = (gy + 0.5) / arrowGrid;
          const [dx, dy] = evaluateField(nx, ny);
          const mag = Math.sqrt(dx * dx + dy * dy);
          if (mag < 0.001) continue;
          const ndx = dx / mag;
          const ndy = dy / mag;
          const sx = nx * w;
          const sy = ny * h;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + ndx * arrowLen, sy + ndy * arrowLen);
          ctx.stroke();
        }
      }

      // Particles
      const dt = 0.016 * 0.3;
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i]!;
        p.age += 0.016;
        if (p.age > p.maxAge || p.x < -0.1 || p.x > 1.1 || p.y < -0.1 || p.y > 1.1) {
          particlesRef.current[i] = {
            x: Math.random(), y: Math.random(),
            age: 0, maxAge: 2 + Math.random() * 4,
          };
          continue;
        }
        const [dx, dy] = evaluateField(p.x, p.y);
        p.x += dx * dt;
        p.y += dy * dt;

        const alpha = Math.min(1, (1 - p.age / p.maxAge) * 1.5);
        ctx.fillStyle = `rgba(79, 195, 247, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [evaluateField]);

  // Painting
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDown = (e: PointerEvent) => {
      if (fieldModeRef.current !== 'custom') return;
      const rect = canvas.getBoundingClientRect();
      paintingRef.current = true;
      lastPaintRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    const onMove = (e: PointerEvent) => {
      if (!paintingRef.current || fieldModeRef.current !== 'custom') return;
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const dx = nx - lastPaintRef.current.x;
      const dy = ny - lastPaintRef.current.y;
      if (Math.abs(dx) > 0.005 || Math.abs(dy) > 0.005) {
        paintedRef.current.push({
          x: lastPaintRef.current.x,
          y: lastPaintRef.current.y,
          dx: dx * 10, dy: dy * 10,
        });
        lastPaintRef.current = { x: nx, y: ny };
      }
    };

    const onUp = () => { paintingRef.current = false; };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const handleFieldChange = useCallback((mode: FieldMode) => {
    setFieldMode(mode);
    if (mode !== 'custom') paintedRef.current = [];
    setInteractionCount((prev) => prev + 1);
  }, []);

  const handleOverlayChange = useCallback((mode: OverlayMode) => {
    setOverlay(mode);
    setInteractionCount((prev) => prev + 1);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('touch');
  }, [onComplete]);

  return (
    <div className="phase phase--touch">
      <div className="touch__intro">
        <h2>Paint a Field</h2>
        <p>
          Choose a field type — or switch to "custom" and paint your own vectors.
          Drop particles and watch them follow the field. Toggle overlays to see
          the field's hidden properties.
        </p>
      </div>

      <div className="touch__workspace">
        <canvas
          ref={canvasRef}
          width={550}
          height={550}
          className="touch__canvas"
          aria-label="Interactive vector field — choose field type, paint custom vectors, drop particles"
        />

        <div className="touch__readout" aria-live="polite">
          <div className="touch__readout-item">
            <span className="touch__label">
              Field type: {fieldMode}
            </span>
            <span className="touch__notation">
              (F: R\u00B2 \u2192 R\u00B2)
            </span>
          </div>
          <div className="touch__readout-item">
            <span className="touch__label">
              Overlay: {overlay === 'none' ? 'off' : overlay}
            </span>
            <span className="touch__notation">
              {overlay === 'gradient' && '(|F|)'}
              {overlay === 'divergence' && '(\u2207 \u00B7 F)'}
              {overlay === 'curl' && '(\u2207 \u00D7 F)'}
            </span>
          </div>
          <div className="touch__readout-item">
            <span className="touch__label">
              Particles: {particleCount}
            </span>
          </div>
        </div>

        <div className="touch__controls">
          <div className="touch__control-group">
            <span className="touch__group-label">Field</span>
            {(['vortex', 'radial', 'sink', 'saddle', 'custom'] as FieldMode[]).map(
              (mode) => (
                <button
                  key={mode}
                  className={[
                    'touch__toggle-btn',
                    fieldMode === mode ? 'touch__toggle-btn--active' : '',
                  ].join(' ')}
                  onClick={() => handleFieldChange(mode)}
                >
                  {mode}
                </button>
              )
            )}
          </div>

          <div className="touch__control-group">
            <span className="touch__group-label">Overlay</span>
            {(['none', 'gradient', 'divergence', 'curl'] as OverlayMode[]).map(
              (mode) => (
                <button
                  key={mode}
                  className={[
                    'touch__toggle-btn',
                    overlay === mode ? 'touch__toggle-btn--active' : '',
                  ].join(' ')}
                  onClick={() => handleOverlayChange(mode)}
                >
                  {mode === 'none' ? 'off' : mode}
                </button>
              )
            )}
          </div>

          <label className="touch__slider">
            <span>Particles</span>
            <input
              type="range"
              min={50}
              max={500}
              step={10}
              value={particleCount}
              onChange={(e) => {
                setParticleCount(Number(e.target.value));
                setInteractionCount((prev) => prev + 1);
              }}
            />
          </label>
        </div>
      </div>

      {completed && (
        <div className="touch__continue">
          <button className="phase__continue-btn" onClick={handleContinue}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
