// Wing 1 — See Phase: "Watching the Point Move"
// Pattern revelation: a point moves on the circle and its sine/cosine shadows emerge.
// Completion: interact with visualization OR >= 90s.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';

interface SeePhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

export function SeePhase({
  onComplete,
}: SeePhaseProps): React.JSX.Element {
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const angleRef = useRef(0);
  const trailRef = useRef<Array<{ angle: number; sin: number; cos: number }>>([]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Completion check
  useEffect(() => {
    if (completed) return;
    if (timeSpent >= 90 || hasInteracted) {
      setCompleted(true);
    }
  }, [timeSpent, hasInteracted, completed]);

  // Animated point moving around circle, casting sin and cos shadows
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      angleRef.current += 0.015;
      if (angleRef.current > Math.PI * 2) {
        angleRef.current -= Math.PI * 2;
        trailRef.current = [];
      }

      const angle = angleRef.current;
      const sinVal = Math.sin(angle);
      const cosVal = Math.cos(angle);

      trailRef.current.push({ angle, sin: sinVal, cos: cosVal });
      if (trailRef.current.length > 400) {
        trailRef.current.shift();
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      const circleRadius = Math.min(w, h) * 0.22;
      const circleCx = w * 0.3;
      const circleCy = h * 0.5;

      // Axes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(circleCx - circleRadius - 15, circleCy);
      ctx.lineTo(circleCx + circleRadius + 15, circleCy);
      ctx.moveTo(circleCx, circleCy - circleRadius - 15);
      ctx.lineTo(circleCx, circleCy + circleRadius + 15);
      ctx.stroke();

      // Circle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(circleCx, circleCy, circleRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Point on circle
      const px = circleCx + cosVal * circleRadius;
      const py = circleCy - sinVal * circleRadius;

      // Cosine projection (horizontal shadow)
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(circleCx, circleCy);
      ctx.lineTo(px, circleCy);
      ctx.stroke();

      // Sine projection (vertical shadow)
      ctx.strokeStyle = '#f06292';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, circleCy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Point
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      // Sine wave trail (right side of canvas)
      const waveStartX = w * 0.55;
      const waveWidth = w * 0.4;
      const waveCenter = h * 0.3;
      const waveAmp = h * 0.15;

      // Label
      ctx.fillStyle = '#f06292';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Height (shadow on the wall)', waveStartX, waveCenter - waveAmp - 10);

      ctx.strokeStyle = '#f06292';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const trail = trailRef.current;
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i]!;
        const tx = waveStartX + (i / 400) * waveWidth;
        const ty = waveCenter - t.sin * waveAmp;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.stroke();

      // Cosine wave trail
      const cosWaveCenter = h * 0.7;

      ctx.fillStyle = '#4fc3f7';
      ctx.fillText('Side position (shadow on the floor)', waveStartX, cosWaveCenter - waveAmp - 10);

      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i]!;
        const tx = waveStartX + (i / 400) * waveWidth;
        const ty = cosWaveCenter - t.cos * waveAmp;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.stroke();

      // Connecting dashes from point to waves
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(240, 98, 146, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(waveStartX + (trail.length / 400) * waveWidth, waveCenter - sinVal * waveAmp);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(79, 195, 247, 0.3)';
      ctx.beginPath();
      ctx.moveTo(px, circleCy);
      ctx.lineTo(waveStartX + (trail.length / 400) * waveWidth, cosWaveCenter - cosVal * waveAmp);
      ctx.stroke();
      ctx.setLineDash([]);

      // Narrative text overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Two waves. One circle. The same point makes both.', w * 0.5, h - 15);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleCanvasClick = useCallback(() => {
    setHasInteracted(true);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('see');
  }, [onComplete]);

  return (
    <div className="phase phase--see">
      <div className="see__intro">
        <h2>Watching the Point Move</h2>
        <p>
          A single point moves along a circle. As it moves, two shadows appear —
          one showing the height, one showing the side position. Watch them
          emerge.
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="see__canvas"
        onClick={handleCanvasClick}
        aria-label="A point moves around a unit circle. Two sine and cosine waves emerge from its shadows."
      />

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
