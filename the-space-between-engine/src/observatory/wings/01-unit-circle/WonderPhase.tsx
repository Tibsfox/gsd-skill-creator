// Wing 1 — Wonder Phase: "One Circle, Everything"
// ZERO math notation. Story-driven only. Passive simulation of Earth rotation / shadow.
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
  foundationId,
  onComplete,
}: WonderPhaseProps): React.JSX.Element {
  const story = getStory('unit-circle');
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Timer: track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Completion check: 60s OR scrolled to end OR interacted
  useEffect(() => {
    if (completed) return;
    if (timeSpent >= 60 || hasScrolledToEnd || hasInteracted) {
      setCompleted(true);
    }
  }, [timeSpent, hasScrolledToEnd, hasInteracted, completed]);

  // Scroll detection
  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    if (nearBottom) {
      setHasScrolledToEnd(true);
    }
  }, []);

  // Earth rotation / shadow animation — passive, no math notation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const draw = () => {
      time += 0.008;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Sky gradient — transitions from dawn to day to dusk to night
      const dayPhase = (Math.sin(time) + 1) / 2; // 0=night, 1=noon
      const skyR = Math.round(10 + dayPhase * 100);
      const skyG = Math.round(10 + dayPhase * 140);
      const skyB = Math.round(40 + dayPhase * 180);
      ctx.fillStyle = `rgb(${skyR}, ${skyG}, ${skyB})`;
      ctx.fillRect(0, 0, w, h);

      // Ground
      ctx.fillStyle = '#3a3020';
      ctx.fillRect(0, h * 0.7, w, h * 0.3);

      // Sun position — traces a circle
      const sunAngle = time;
      const sunCx = w / 2;
      const sunCy = h * 0.7;
      const sunRadius = h * 0.35;
      const sunX = sunCx + Math.cos(sunAngle) * sunRadius;
      const sunY = sunCy - Math.sin(sunAngle) * sunRadius;
      const sunAboveHorizon = sunY < h * 0.7;

      if (sunAboveHorizon) {
        // Sun glow
        const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 30);
        glow.addColorStop(0, 'rgba(255, 230, 100, 0.9)');
        glow.addColorStop(1, 'rgba(255, 200, 50, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
        ctx.fill();

        // Sun body
        ctx.fillStyle = '#ffe866';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stick (gnomon)
      const stickBaseX = w / 2;
      const stickBaseY = h * 0.7;
      const stickHeight = 50;
      ctx.strokeStyle = '#8a7a60';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(stickBaseX, stickBaseY);
      ctx.lineTo(stickBaseX, stickBaseY - stickHeight);
      ctx.stroke();

      // Shadow — direction determined by sun position
      if (sunAboveHorizon) {
        const shadowDir = Math.atan2(stickBaseY - sunY, stickBaseX - sunX);
        const elevation = Math.asin(
          Math.max(0, (h * 0.7 - sunY) / sunRadius)
        );
        const shadowLen = stickHeight / Math.max(Math.tan(elevation), 0.1);
        const clampedLen = Math.min(shadowLen, 200);
        const shadowEndX = stickBaseX + Math.cos(shadowDir) * clampedLen;
        const shadowEndY = stickBaseY;

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(stickBaseX, stickBaseY);
        ctx.lineTo(shadowEndX, shadowEndY);
        ctx.stroke();

        // Shadow tip marker
        ctx.fillStyle = 'rgba(255, 200, 100, 0.6)';
        ctx.beginPath();
        ctx.arc(shadowEndX, shadowEndY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

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

  // Split story body into paragraphs
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
          aria-label="Earth rotation and shadow animation — a stick casts a shadow that sweeps as the sun moves"
        />
        <p className="wonder__simulation-caption">
          A stick in the ground. A shadow that moves. One rotation.
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
          <button
            className="phase__continue-btn"
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
