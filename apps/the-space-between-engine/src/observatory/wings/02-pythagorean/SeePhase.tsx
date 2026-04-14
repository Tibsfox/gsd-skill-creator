/**
 * Wing 2: Pythagorean Theorem — See Phase
 *
 * Two independent lengths combining to create an emergent diagonal.
 * Visual proof: squares on each side.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface SeePhaseProps {
  onComplete: () => void;
}

export const SeePhase: React.FC<SeePhaseProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [hasObserved, setHasObserved] = useState(false);
  const timeRef = useRef(0);

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

    const draw = (time: number) => {
      timeRef.current = time;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      // Animated triangle
      const a = 120;
      const b = 160;
      const c = Math.sqrt(a * a + b * b); // 200

      // Position triangle in center-left
      const ox = w * 0.3;
      const oy = h * 0.6;

      // Animation progress (cycle every 6 seconds)
      const cycle = (time / 6000) % 1;
      const phase = cycle < 0.33 ? 0 : cycle < 0.66 ? 1 : 2;
      const phaseProgress = phase === 0
        ? cycle / 0.33
        : phase === 1
          ? (cycle - 0.33) / 0.33
          : (cycle - 0.66) / 0.34;

      // Triangle
      ctx.strokeStyle = '#4a6a9a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + a, oy);
      ctx.lineTo(ox + a, oy - b);
      ctx.lineTo(ox, oy);
      ctx.stroke();

      // Right angle marker
      const markerSize = 12;
      ctx.strokeStyle = '#4a6a9a';
      ctx.beginPath();
      ctx.moveTo(ox + a - markerSize, oy);
      ctx.lineTo(ox + a - markerSize, oy - markerSize);
      ctx.lineTo(ox + a, oy - markerSize);
      ctx.stroke();

      // Phase 0: Square on side a grows
      if (phase >= 0) {
        const alpha = phase === 0 ? phaseProgress : 1;
        ctx.fillStyle = `rgba(100, 180, 255, ${0.15 * alpha})`;
        ctx.strokeStyle = `rgba(100, 180, 255, ${0.6 * alpha})`;
        ctx.lineWidth = 1.5;
        const squareA = a * alpha;
        ctx.fillRect(ox, oy, squareA, squareA * (a > 0 ? 1 : -1));
        ctx.strokeRect(ox, oy, squareA, squareA);

        if (alpha > 0.5) {
          ctx.fillStyle = `rgba(100, 180, 255, ${alpha})`;
          ctx.font = '14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('a', ox + a / 2, oy + 16);
        }
      }

      // Phase 1: Square on side b grows
      if (phase >= 1) {
        const alpha = phase === 1 ? phaseProgress : 1;
        ctx.fillStyle = `rgba(255, 154, 106, ${0.15 * alpha})`;
        ctx.strokeStyle = `rgba(255, 154, 106, ${0.6 * alpha})`;
        ctx.lineWidth = 1.5;
        const squareB = b * alpha;
        ctx.fillRect(ox + a, oy, squareB * (b > 0 ? 1 : -1), -squareB);
        ctx.strokeRect(ox + a, oy, squareB, -squareB);

        if (alpha > 0.5) {
          ctx.fillStyle = `rgba(255, 154, 106, ${alpha})`;
          ctx.font = '14px monospace';
          ctx.textAlign = 'left';
          ctx.fillText('b', ox + a + 8, oy - b / 2);
        }
      }

      // Phase 2: Square on hypotenuse c appears
      if (phase >= 2) {
        const alpha = phaseProgress;

        // Calculate hypotenuse square vertices
        // The hypotenuse goes from (ox, oy) to (ox+a, oy-b)
        // The square is built outward from the hypotenuse
        const dx = (ox + a - ox) / c;
        const dy = (oy - b - oy) / c;
        // Perpendicular direction (outward)
        const px = dy;
        const py = -dx;

        const x0 = ox;
        const y0 = oy;
        const x1 = ox + a;
        const y1 = oy - b;
        const x2 = x1 + px * c * alpha;
        const y2 = y1 + py * c * alpha;
        const x3 = x0 + px * c * alpha;
        const y3 = y0 + py * c * alpha;

        ctx.fillStyle = `rgba(255, 221, 87, ${0.15 * alpha})`;
        ctx.strokeStyle = `rgba(255, 221, 87, ${0.6 * alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (alpha > 0.5) {
          ctx.fillStyle = `rgba(255, 221, 87, ${alpha})`;
          ctx.font = '14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('c', (x0 + x1) / 2 - 10, (y0 + y1) / 2 - 10);
        }

        if (alpha > 0.9) {
          setHasObserved(true);
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="phase see-phase">
      <h2>Seeing the Relationship</h2>

      <p className="narrative-intro">
        Watch two lengths — horizontal and vertical — each generate a square of area.
        Then watch the diagonal do the same. The area of the diagonal's square is exactly
        the sum of the other two. Every time. Without exception.
      </p>

      <canvas
        ref={canvasRef}
        className="wing-canvas"
        style={{ width: '100%', height: '400px', borderRadius: '8px' }}
      />

      <p className="observation-note">
        The blue square and the orange square together have exactly the same area as the
        yellow square on the diagonal. Two independent lengths. One emergent truth.
      </p>

      <button className="phase-advance" disabled={!hasObserved} onClick={onComplete}>
        {hasObserved ? 'I see the relationship. Continue.' : 'Watch the squares emerge...'}
      </button>
    </div>
  );
};

export const seeMeta = {
  containsMath: false,
  interactiveElements: 0,
  visualization: 'canvas-2d',
};
