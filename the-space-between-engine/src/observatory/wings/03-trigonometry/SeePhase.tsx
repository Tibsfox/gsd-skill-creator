/**
 * Wing 3: Trigonometry — See Phase
 *
 * Animated unit circle unrolling into a sine wave over time.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface SeePhaseProps {
  onComplete: () => void;
}

export const SeePhase: React.FC<SeePhaseProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [hasObserved, setHasObserved] = useState(false);
  const startTimeRef = useRef(0);

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
      if (startTimeRef.current === 0) startTimeRef.current = time;
      const elapsed = time - startTimeRef.current;

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      // Layout: circle on left, wave on right
      const circleRadius = Math.min(w * 0.2, h * 0.35);
      const circleCx = w * 0.2;
      const circleCy = h * 0.5;
      const waveStartX = w * 0.38;
      const waveEndX = w * 0.95;
      const waveWidth = waveEndX - waveStartX;
      const waveAmplitude = circleRadius;
      const waveCy = circleCy;

      // Current angle
      const theta = (time / 2500) * Math.PI * 2;
      const px = circleCx + Math.cos(theta) * circleRadius;
      const py = circleCy - Math.sin(theta) * circleRadius;

      // Draw circle
      ctx.strokeStyle = '#2a4a7a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(circleCx, circleCy, circleRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Circle axes
      ctx.strokeStyle = '#1a2a4a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(circleCx - circleRadius - 10, circleCy);
      ctx.lineTo(circleCx + circleRadius + 10, circleCy);
      ctx.moveTo(circleCx, circleCy - circleRadius - 10);
      ctx.lineTo(circleCx, circleCy + circleRadius + 10);
      ctx.stroke();

      // Point on circle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      // Connection line from circle to wave
      ctx.strokeStyle = 'rgba(255, 154, 106, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(waveStartX, py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Wave axis
      ctx.strokeStyle = '#1a2a4a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(waveStartX, waveCy);
      ctx.lineTo(waveEndX, waveCy);
      ctx.stroke();

      // Draw sine wave (trailing from current angle)
      ctx.strokeStyle = '#ff9a6a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const samples = 300;
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const angle = theta - t * Math.PI * 4; // show 2 full periods trailing
        const wx = waveStartX + t * waveWidth;
        const wy = waveCy - Math.sin(angle) * waveAmplitude;
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      // Draw cosine wave (lighter, optional contrast)
      ctx.strokeStyle = 'rgba(106, 176, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const angle = theta - t * Math.PI * 4;
        const wx = waveStartX + t * waveWidth;
        const wy = waveCy - Math.cos(angle) * waveAmplitude;
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      // Current point on wave
      ctx.fillStyle = '#ff9a6a';
      ctx.beginPath();
      ctx.arc(waveStartX, py, 5, 0, Math.PI * 2);
      ctx.fill();

      // Labels
      ctx.font = '13px monospace';
      ctx.fillStyle = '#ff9a6a';
      ctx.textAlign = 'left';
      ctx.fillText('sine', waveEndX + 5, waveCy - waveAmplitude * 0.7);

      ctx.fillStyle = 'rgba(106, 176, 255, 0.7)';
      ctx.fillText('cosine', waveEndX + 5, waveCy + waveAmplitude * 0.7);

      ctx.fillStyle = '#888';
      ctx.textAlign = 'center';
      ctx.fillText('The circle unrolls into waves', w / 2, h - 15);

      // Complete after 5 seconds of observation
      if (elapsed > 5000 && !hasObserved) {
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
      <h2>The Circle Becomes a Wave</h2>

      <p className="narrative-intro">
        Watch the point travel around the circle on the left. On the right, its vertical
        position traces out a wave — the sine function. Its horizontal position traces
        another wave — the cosine. Two waves, one rotation. This is where trigonometry
        lives.
      </p>

      <canvas
        ref={canvasRef}
        className="wing-canvas"
        style={{ width: '100%', height: '400px', borderRadius: '8px' }}
      />

      <p className="observation-note">
        The orange wave is sine — the vertical position of the circling point. The blue
        wave is cosine — its horizontal position. Every oscillation in nature is some
        combination of these two.
      </p>

      <button className="phase-advance" disabled={!hasObserved} onClick={onComplete}>
        {hasObserved ? 'I see the wave. Continue.' : 'Watch the circle unroll...'}
      </button>
    </div>
  );
};

export const seeMeta = {
  containsMath: false,
  interactiveElements: 0,
  visualization: 'canvas-2d',
};
