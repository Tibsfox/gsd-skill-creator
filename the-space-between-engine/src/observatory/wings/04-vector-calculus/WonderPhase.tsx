// Wing 4 — Wonder Phase: "The Invisible Fields"
// ZERO math notation. Magnetic field visualization, compass fox, starling murmuration.
// "A fox tilts its head and feels the earth."
// Completion: scroll to end OR >= 60s OR interact with simulation.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';
import { getStory } from '@/narrative/index';

interface WonderPhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

export function WonderPhase({
  onComplete,
}: WonderPhaseProps): React.JSX.Element {
  const story = getStory('vector-calculus');
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
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
    if (timeSpent >= 60 || hasScrolledToEnd || hasInteracted) {
      setCompleted(true);
    }
  }, [timeSpent, hasScrolledToEnd, hasInteracted, completed]);

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      setHasScrolledToEnd(true);
    }
  }, []);

  // Magnetic field visualization with compass fox
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const foxX = { current: 0.7 };
    const foxY = { current: 0.3 };
    const foxAngle = { current: 0 };
    const trail: Array<{ x: number; y: number }> = [];

    // Dipole field
    const dipoleX = 0.4;
    const dipoleY = 0.5;

    const computeField = (px: number, py: number): [number, number] => {
      const x = (px - dipoleX) * 4;
      const y = (py - dipoleY) * 4;
      const r2 = x * x + y * y;
      const r = Math.sqrt(r2);
      if (r < 0.15) return [0, 1];
      const r5 = r2 * r2 * r;
      return [(3 * x * y) / r5, (3 * y * y - r2) / r5];
    };

    const draw = () => {
      time += 0.016;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background — snowy field
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#1a1a2e');
      bgGrad.addColorStop(1, '#0a0a1a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Iron filings (field visualization)
      const gridSize = 20;
      const filingLen = Math.min(w, h) / gridSize * 0.25;
      for (let gx = 0; gx < gridSize; gx++) {
        for (let gy = 0; gy < gridSize; gy++) {
          const nx = (gx + 0.5) / gridSize;
          const ny = (gy + 0.5) / gridSize;
          const [bx, by] = computeField(nx, ny);
          const mag = Math.sqrt(bx * bx + by * by);
          if (mag < 0.001) continue;
          const ndx = bx / mag;
          const ndy = by / mag;
          const alpha = Math.min(0.4, mag * 0.03);
          ctx.strokeStyle = `rgba(180, 180, 200, ${alpha})`;
          ctx.lineWidth = 1;
          const sx = nx * w;
          const sy = ny * h;
          ctx.beginPath();
          ctx.moveTo(sx - ndx * filingLen * 0.5, sy - ndy * filingLen * 0.5);
          ctx.lineTo(sx + ndx * filingLen * 0.5, sy + ndy * filingLen * 0.5);
          ctx.stroke();
        }
      }

      // Dipole marker
      ctx.fillStyle = '#ef5350';
      ctx.beginPath();
      ctx.arc(dipoleX * w, dipoleY * h - 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#42a5f5';
      ctx.beginPath();
      ctx.arc(dipoleX * w, dipoleY * h + 6, 4, 0, Math.PI * 2);
      ctx.fill();

      // Fox follows field
      const [bx, by] = computeField(foxX.current, foxY.current);
      const bMag = Math.sqrt(bx * bx + by * by);
      if (bMag > 0.001) {
        foxAngle.current = Math.atan2(-by, bx);
        const speed = 0.0008;
        foxX.current += (bx / bMag) * speed;
        foxY.current += (by / bMag) * speed;
        trail.push({ x: foxX.current, y: foxY.current });
        if (trail.length > 150) trail.shift();
      }

      // Wrap fox
      if (
        foxX.current < 0 || foxX.current > 1 ||
        foxY.current < 0 || foxY.current > 1
      ) {
        foxX.current = 0.5 + (Math.random() - 0.5) * 0.6;
        foxY.current = 0.5 + (Math.random() - 0.5) * 0.6;
        trail.length = 0;
      }

      // Fox trail
      if (trail.length > 1) {
        ctx.strokeStyle = 'rgba(255, 160, 50, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(trail[0]!.x * w, trail[0]!.y * h);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i]!.x * w, trail[i]!.y * h);
        }
        ctx.stroke();
      }

      // Fox
      const fx = foxX.current * w;
      const fy = foxY.current * h;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(-foxAngle.current);
      ctx.fillStyle = '#ff9800';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-5, -4);
      ctx.lineTo(-5, 4);
      ctx.closePath();
      ctx.fill();
      // Ears
      ctx.fillStyle = '#ffb74d';
      ctx.beginPath();
      ctx.moveTo(-2, -4);
      ctx.lineTo(-5, -8);
      ctx.lineTo(-5, -3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-2, 4);
      ctx.lineTo(-5, 8);
      ctx.lineTo(-5, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleCanvasClick = useCallback(() => {
    setHasInteracted(true);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('wonder');
  }, [onComplete]);

  const paragraphs = story.body.split('\n\n');

  return (
    <div className="phase phase--wonder">
      <div className="wonder__simulation">
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          className="wonder__canvas"
          onClick={handleCanvasClick}
          aria-label="A fox navigates an invisible magnetic field, aligning its body to lines of force"
        />
        <p className="wonder__simulation-caption">
          A fox tilts its head and feels the earth.
        </p>
      </div>

      <div
        className="wonder__story"
        ref={contentRef}
        onScroll={handleScroll}
      >
        <h2 className="wonder__title">{story.title}</h2>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="wonder__paragraph">
            {paragraph}
          </p>
        ))}
      </div>

      {completed && (
        <div className="wonder__continue">
          <button className="phase__continue-btn" onClick={handleContinue}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
