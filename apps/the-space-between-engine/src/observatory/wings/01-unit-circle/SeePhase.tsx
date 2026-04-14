/**
 * Wing 1: Unit Circle — See Phase
 *
 * Animated unit circle appearing from shadow movement.
 * Show the point traveling around the circle.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface SeePhaseProps {
  onComplete: () => void;
}

export const SeePhase: React.FC<SeePhaseProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [hasObserved, setHasObserved] = useState(false);
  const angleRef = useRef(0);

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
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.35;

      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      // Draw the unit circle
      ctx.strokeStyle = '#2a4a7a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw axes
      ctx.strokeStyle = '#1a2a4a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - radius - 20, cy);
      ctx.lineTo(cx + radius + 20, cy);
      ctx.moveTo(cx, cy - radius - 20);
      ctx.lineTo(cx, cy + radius + 20);
      ctx.stroke();

      // Animated point
      const theta = (time / 3000) * Math.PI * 2;
      angleRef.current = theta;
      const px = cx + Math.cos(theta) * radius;
      const py = cy - Math.sin(theta) * radius;

      // Shadow trail
      ctx.strokeStyle = 'rgba(100, 180, 255, 0.15)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let t = 0; t < Math.PI * 2; t += 0.02) {
        const tt = theta - t;
        const alpha = 1 - t / (Math.PI * 2);
        if (alpha <= 0) break;
        const tx = cx + Math.cos(tt) * radius;
        const ty = cy - Math.sin(tt) * radius;
        if (t === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.stroke();

      // Projection lines to axes
      ctx.strokeStyle = 'rgba(100, 180, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, cy);
      ctx.moveTo(px, py);
      ctx.lineTo(cx, py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cosine label on x-axis
      ctx.fillStyle = '#6ab0ff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('cos', px, cy + 18);

      // Sine label on y-axis
      ctx.fillStyle = '#ff9a6a';
      ctx.textAlign = 'right';
      ctx.fillText('sin', cx - 8, py + 5);

      // The moving point
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      // Glow
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, 20);
      gradient.addColorStop(0, 'rgba(100, 180, 255, 0.4)');
      gradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, 20, 0, Math.PI * 2);
      ctx.fill();

      // Mark one full rotation
      if (!hasObserved && theta > Math.PI * 2) {
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
      <h2>Seeing the Circle</h2>

      <p className="narrative-intro">
        Imagine the tip of that sundial shadow, speeded up. As the sun crosses the sky, the
        shadow traces a circle on the ground. Now shrink it down. One unit of radius. Center
        it at zero. Watch the point travel.
      </p>

      <canvas
        ref={canvasRef}
        className="wing-canvas"
        style={{ width: '100%', height: '400px', borderRadius: '8px' }}
      />

      <p className="observation-note">
        Watch the point glide around the circle. See how its horizontal position (cosine)
        and vertical position (sine) rise and fall like waves — two waves born from one
        rotation.
      </p>

      <button
        className="phase-advance"
        disabled={!hasObserved}
        onClick={onComplete}
      >
        {hasObserved ? 'I see it. Continue.' : 'Watch the point complete a full rotation...'}
      </button>
    </div>
  );
};

export const seeMeta = {
  containsMath: false,
  interactiveElements: 0,
  visualization: 'canvas-2d',
};
