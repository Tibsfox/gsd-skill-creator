// Wing 4 — See Phase: "Seeing the Invisible"
// Multiple field types revealed: vortex, radial, sink.
// Particles flow through fields, making the invisible visible.
// Completion: interact with visualization OR >= 90s.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';

interface SeePhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

interface Particle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

type FieldType = 'vortex' | 'radial' | 'sink';

export function SeePhase({
  onComplete,
}: SeePhaseProps): React.JSX.Element {
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [fieldType, setFieldType] = useState<FieldType>('vortex');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const fieldTypeRef = useRef<FieldType>('vortex');

  useEffect(() => {
    fieldTypeRef.current = fieldType;
  }, [fieldType]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (completed) return;
    if (timeSpent >= 90 || hasInteracted) {
      setCompleted(true);
    }
  }, [timeSpent, hasInteracted, completed]);

  // Initialize particles
  useEffect(() => {
    particlesRef.current = [];
    for (let i = 0; i < 300; i++) {
      particlesRef.current.push({
        x: Math.random(),
        y: Math.random(),
        age: 0,
        maxAge: 2 + Math.random() * 3,
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const evaluateField = (nx: number, ny: number): [number, number] => {
      const x = (nx - 0.5) * 2;
      const y = (ny - 0.5) * 2;
      const r = Math.sqrt(x * x + y * y);
      const safeR = Math.max(r, 0.01);

      switch (fieldTypeRef.current) {
        case 'vortex':
          return [-y / safeR, x / safeR];
        case 'radial':
          return [x / safeR, y / safeR];
        case 'sink':
          return [-x / safeR, -y / safeR];
        default:
          return [0, 0];
      }
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Fade trail
      ctx.fillStyle = 'rgba(10, 10, 26, 0.08)';
      ctx.fillRect(0, 0, w, h);

      // Draw arrows
      const gridSize = 12;
      const arrowLen = Math.min(w, h) / gridSize * 0.3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;

      for (let gx = 0; gx < gridSize; gx++) {
        for (let gy = 0; gy < gridSize; gy++) {
          const nx = (gx + 0.5) / gridSize;
          const ny = (gy + 0.5) / gridSize;
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

      // Update and draw particles
      const dt = 0.016 * 0.3;
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i]!;
        p.age += 0.016;
        if (p.age > p.maxAge || p.x < -0.1 || p.x > 1.1 || p.y < -0.1 || p.y > 1.1) {
          particlesRef.current[i] = {
            x: Math.random(),
            y: Math.random(),
            age: 0,
            maxAge: 2 + Math.random() * 3,
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

      // Field label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      const fieldLabels: Record<FieldType, string> = {
        vortex: 'Vortex — things swirl',
        radial: 'Radial — things spread outward',
        sink: 'Sink — things converge',
      };
      ctx.fillText(fieldLabels[fieldTypeRef.current], 12, 22);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleFieldChange = useCallback((type: FieldType) => {
    setFieldType(type);
    setHasInteracted(true);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('see');
  }, [onComplete]);

  return (
    <div className="phase phase--see">
      <div className="see__intro">
        <h2>Seeing the Invisible</h2>
        <p>
          A field is a question asked of every point in space: <em>which way,
          and how strongly?</em> The particles make the invisible visible.
          Switch between field types and watch how the same particles behave
          completely differently — the field determines everything.
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={500}
        className="see__canvas"
        aria-label="Particles flowing through different vector fields — vortex, radial, sink"
      />

      <div className="see__field-selector">
        {(['vortex', 'radial', 'sink'] as FieldType[]).map((type) => (
          <button
            key={type}
            className={[
              'see__field-btn',
              fieldType === type ? 'see__field-btn--active' : '',
            ].join(' ')}
            onClick={() => handleFieldChange(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {completed && (
        <div className="see__continue">
          <button className="phase__continue-btn" onClick={handleContinue}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
