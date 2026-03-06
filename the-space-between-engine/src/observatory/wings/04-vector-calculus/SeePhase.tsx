/**
 * Wing 4: Vector Calculus — See Phase
 *
 * Invisible field becoming visible through particles and arrows.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface SeePhaseProps {
  onComplete: () => void;
}

interface Particle {
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

export const SeePhase: React.FC<SeePhaseProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [hasObserved, setHasObserved] = useState(false);
  const startTimeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

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
    window.addEventListener('resize', resize);

    // Initialize particles
    const initParticles = (w: number, h: number) => {
      const particles: Particle[] = [];
      for (let i = 0; i < 200; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          life: Math.random() * 100,
          maxLife: 80 + Math.random() * 40,
        });
      }
      particlesRef.current = particles;
    };

    // A sample vector field: a vortex with a source
    const fieldAt = (x: number, y: number, w: number, h: number): [number, number] => {
      const cx = w / 2;
      const cy = h / 2;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1;

      // Rotational component (curl)
      const rotStrength = 80 / dist;
      const vx = -dy * rotStrength / dist;
      const vy = dx * rotStrength / dist;

      // Add a gentle radial push
      const pushStrength = 20 / dist;
      const rx = dx * pushStrength / dist;
      const ry = dy * pushStrength / dist;

      return [vx + rx, vy + ry];
    };

    const draw = (time: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = time;
        const rect = canvas.getBoundingClientRect();
        initParticles(rect.width, rect.height);
      }
      const elapsed = time - startTimeRef.current;

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      // Fade trail effect
      ctx.fillStyle = 'rgba(10, 10, 26, 0.1)';
      ctx.fillRect(0, 0, w, h);

      const dt = 0.016;
      const particles = particlesRef.current;

      // Phase in: first show arrows, then particles start
      const arrowPhase = Math.min(1, elapsed / 3000);
      const particlePhase = Math.max(0, Math.min(1, (elapsed - 1000) / 2000));

      // Draw vector arrows (grid)
      if (arrowPhase > 0) {
        const gridSpacing = 40;
        for (let gx = gridSpacing / 2; gx < w; gx += gridSpacing) {
          for (let gy = gridSpacing / 2; gy < h; gy += gridSpacing) {
            const [fx, fy] = fieldAt(gx, gy, w, h);
            const mag = Math.sqrt(fx * fx + fy * fy);
            if (mag < 0.01) continue;

            const nx = fx / mag;
            const ny = fy / mag;
            const arrowLen = Math.min(mag * 0.3, gridSpacing * 0.4) * arrowPhase;

            ctx.strokeStyle = `rgba(42, 74, 122, ${0.5 * arrowPhase})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx + nx * arrowLen, gy + ny * arrowLen);
            ctx.stroke();

            // Arrow head
            const headLen = 4;
            const headAngle = Math.atan2(ny, nx);
            ctx.beginPath();
            ctx.moveTo(gx + nx * arrowLen, gy + ny * arrowLen);
            ctx.lineTo(
              gx + nx * arrowLen - Math.cos(headAngle - 0.5) * headLen,
              gy + ny * arrowLen - Math.sin(headAngle - 0.5) * headLen,
            );
            ctx.moveTo(gx + nx * arrowLen, gy + ny * arrowLen);
            ctx.lineTo(
              gx + nx * arrowLen - Math.cos(headAngle + 0.5) * headLen,
              gy + ny * arrowLen - Math.sin(headAngle + 0.5) * headLen,
            );
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      if (particlePhase > 0) {
        for (const p of particles) {
          const [fx, fy] = fieldAt(p.x, p.y, w, h);
          p.x += fx * dt * particlePhase;
          p.y += fy * dt * particlePhase;
          p.life += 1;

          // Wrap around or reset
          if (p.x < 0 || p.x > w || p.y < 0 || p.y > h || p.life > p.maxLife) {
            p.x = Math.random() * w;
            p.y = Math.random() * h;
            p.life = 0;
          }

          const alpha = Math.min(1, p.life / 10) * Math.max(0, 1 - p.life / p.maxLife);
          ctx.fillStyle = `rgba(100, 180, 255, ${alpha * 0.8 * particlePhase})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (elapsed > 6000 && !hasObserved) {
        setHasObserved(true);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [hasObserved]);

  return (
    <div className="phase see-phase">
      <h2>Seeing the Invisible</h2>

      <p className="narrative-intro">
        First, the arrows appear — each one showing the direction and strength of the
        field at that point. Then the particles arrive, carried by the field like leaves
        in the wind. Watch how they trace the invisible architecture, revealing a vortex
        that was there all along.
      </p>

      <canvas
        ref={canvasRef}
        className="wing-canvas"
        style={{ width: '100%', height: '400px', borderRadius: '8px', background: '#0a0a1a' }}
      />

      <p className="observation-note">
        Every arrow is a vector — a direction and a magnitude. Together, they define a
        vector field. The particles do not think. They simply follow the field wherever
        it points. The global pattern emerges from local instructions.
      </p>

      <button className="phase-advance" disabled={!hasObserved} onClick={onComplete}>
        {hasObserved ? 'I see the field. Continue.' : 'Watch the field reveal itself...'}
      </button>
    </div>
  );
};

export const seeMeta = {
  containsMath: false,
  interactiveElements: 0,
  visualization: 'canvas-2d',
};
