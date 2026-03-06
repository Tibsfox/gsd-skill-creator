// Wing 3 — See Phase: "The Circle Unrolls"
// Animate unit circle → watch sine wave emerge.
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

  // Animated: circle on left, sine wave unrolling to the right
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    const history: number[] = [];

    const draw = () => {
      angle += 0.02;
      if (angle > Math.PI * 20) {
        angle -= Math.PI * 20;
        history.length = 0;
      }

      const sinVal = Math.sin(angle);
      history.push(sinVal);
      if (history.length > 400) history.shift();

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      // Circle
      const circRadius = h * 0.3;
      const circCx = w * 0.18;
      const circCy = h * 0.5;

      // Circle outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(circCx, circCy, circRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating radius
      const px = circCx + Math.cos(angle) * circRadius;
      const py = circCy - sinVal * circRadius;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(circCx, circCy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Point on circle
      ctx.fillStyle = '#f06292';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal reference line from point to wave
      const waveStartX = w * 0.32;
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(240, 98, 146, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(waveStartX, py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Sine wave
      const waveWidth = w * 0.62;
      const waveAmp = circRadius;
      const waveCy = circCy;

      // Wave center line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(waveStartX, waveCy);
      ctx.lineTo(waveStartX + waveWidth, waveCy);
      ctx.stroke();

      // The wave itself
      ctx.strokeStyle = '#f06292';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = waveStartX + (i / 400) * waveWidth;
        const y = waveCy - history[i]! * waveAmp;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Current wave point
      if (history.length > 0) {
        const lastX = waveStartX + ((history.length - 1) / 400) * waveWidth;
        const lastY = waveCy - history[history.length - 1]! * waveAmp;
        ctx.fillStyle = '#f06292';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('The circle rotates...', circCx, h - 15);
      ctx.fillText('...and the wave emerges.', waveStartX + waveWidth / 2, h - 15);

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
        <h2>The Circle Unrolls</h2>
        <p>
          Watch the point travel around the circle. As it moves, trace its
          height over time. The circle becomes a wave. Every oscillation you
          have ever felt is a circle seen from the side.
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="see__canvas"
        onClick={handleCanvasClick}
        aria-label="A point moves around a circle on the left. A sine wave emerges on the right."
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
