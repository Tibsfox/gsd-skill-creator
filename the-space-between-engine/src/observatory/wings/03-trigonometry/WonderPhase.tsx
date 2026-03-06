// Wing 3 — Wonder Phase: "The Breathing of the World"
// ZERO math notation. Tide simulation, moon pulling water, seasonal daylight.
// Uses the TideSimulator from nature sims as passive backdrop.
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
  const story = getStory('trigonometry');
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

  // Passive tide simulation — no math notation, just water rising and falling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let simTime = 0;

    const draw = () => {
      simTime += 0.02;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
      skyGrad.addColorStop(0, '#0a0a2e');
      skyGrad.addColorStop(1, '#1a1a3e');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.5);

      // Moon
      const moonX = w * 0.5 + Math.cos(simTime * 0.3) * w * 0.2;
      const moonY = h * 0.15;
      ctx.fillStyle = '#e8e8cc';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 14, 0, Math.PI * 2);
      ctx.fill();

      // Gravitational pull indicator (subtle line from moon to water)
      ctx.strokeStyle = 'rgba(255, 255, 200, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(moonX, moonY + 14);
      ctx.lineTo(moonX, h * 0.55);
      ctx.stroke();

      // Water baseline
      const waterBase = h * 0.6;
      const tideAmp = h * 0.08;
      const tideHeight = Math.sin(simTime * 0.5) * tideAmp;

      // Water surface
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 2) {
        const ripple =
          Math.sin(x * 0.02 + simTime * 2) * 2 +
          Math.sin(x * 0.035 + simTime * 3) * 1.5;
        const y = waterBase - tideHeight + ripple;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();

      const waterGrad = ctx.createLinearGradient(0, waterBase - tideAmp, 0, h);
      waterGrad.addColorStop(0, 'rgba(30, 100, 180, 0.85)');
      waterGrad.addColorStop(0.5, 'rgba(15, 60, 120, 0.9)');
      waterGrad.addColorStop(1, 'rgba(5, 20, 40, 0.95)');
      ctx.fillStyle = waterGrad;
      ctx.fill();

      // Beach/shore
      ctx.fillStyle = '#3a3020';
      ctx.fillRect(0, h * 0.85, w, h * 0.15);

      // Caption
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('The tide breathes in and out. One wave. One moon. One rotation.', w / 2, h - 8);

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
          height={250}
          className="wonder__canvas"
          onClick={handleCanvasClick}
          aria-label="Tide rising and falling under the pull of the moon — a breathing ocean"
        />
        <p className="wonder__simulation-caption">
          The moon pulls. The water answers. Six hours in, six hours out.
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
