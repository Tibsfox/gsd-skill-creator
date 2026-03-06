// Wing 6 — Wonder Phase: "The Art of Translation"
// ZERO math notation. Story-driven only.
// Metamorphosis animation: caterpillar -> butterfly (structure changes, DNA persists).
// A story retold three times — words change, something survives.
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
  const story = getStory('category-theory');
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

  // Metamorphosis animation — caterpillar shape morphing toward butterfly
  // Structure changes completely but something (the DNA helix) persists through
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const draw = () => {
      time += 0.006;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      // Morph factor: 0 = caterpillar, 1 = butterfly, oscillates
      const morphT = (Math.sin(time * 0.8) + 1) / 2;
      const cx = w / 2;
      const cy = h / 2;

      // Draw the morphing creature
      // Caterpillar: series of connected circles (segments)
      // Butterfly: two wing shapes with a thin body
      const segmentCount = 8;

      if (morphT < 0.4) {
        // Mostly caterpillar
        const catAlpha = 1 - morphT * 2.5;
        ctx.globalAlpha = catAlpha;

        for (let i = 0; i < segmentCount; i++) {
          const segX = cx - 80 + i * 22;
          const segY = cy + Math.sin(time * 3 + i * 0.8) * 8;
          const segR = 10 - Math.abs(i - segmentCount / 2) * 0.8;

          const hue = 100 + i * 8;
          ctx.fillStyle = `hsla(${hue}, 60%, 45%, ${catAlpha})`;
          ctx.beginPath();
          ctx.arc(segX, segY, segR, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else if (morphT > 0.6) {
        // Mostly butterfly
        const buttAlpha = (morphT - 0.6) * 2.5;
        ctx.globalAlpha = buttAlpha;

        // Wings
        const wingSpread = 40 + Math.sin(time * 2) * 8;
        const wingH = 30;

        // Left wing
        ctx.fillStyle = `rgba(200, 100, 50, ${buttAlpha * 0.6})`;
        ctx.beginPath();
        ctx.ellipse(cx - wingSpread, cy, wingSpread * 0.7, wingH, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 150, 80, ${buttAlpha * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Right wing
        ctx.fillStyle = `rgba(200, 100, 50, ${buttAlpha * 0.6})`;
        ctx.beginPath();
        ctx.ellipse(cx + wingSpread, cy, wingSpread * 0.7, wingH, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 150, 80, ${buttAlpha * 0.4})`;
        ctx.stroke();

        // Body
        ctx.fillStyle = `rgba(80, 50, 30, ${buttAlpha})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 4, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Antennae
        ctx.strokeStyle = `rgba(80, 50, 30, ${buttAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 2, cy - 18);
        ctx.quadraticCurveTo(cx - 15, cy - 40, cx - 20, cy - 42);
        ctx.moveTo(cx + 2, cy - 18);
        ctx.quadraticCurveTo(cx + 15, cy - 40, cx + 20, cy - 42);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        // Chrysalis phase — dissolution
        const dissolveT = (morphT - 0.4) / 0.2;
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2;
          const r = 20 + dissolveT * 30 * Math.sin(time * 4 + i);
          const px = cx + Math.cos(angle + time) * r;
          const py = cy + Math.sin(angle + time * 0.7) * r * 0.7;

          const hue = 30 + i * 4;
          ctx.fillStyle = `hsla(${hue}, 50%, 50%, 0.5)`;
          ctx.beginPath();
          ctx.arc(px, py, 3 + Math.sin(time + i) * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // The DNA helix — the thing that persists through the metamorphosis
      // Always visible, gentle, central
      const helixY = h - 40;
      ctx.globalAlpha = 0.4;
      for (let x = 50; x < w - 50; x += 3) {
        const t = (x - 50) / (w - 100);
        const y1 = helixY + Math.sin(t * Math.PI * 6 + time * 2) * 8;
        const y2 = helixY - Math.sin(t * Math.PI * 6 + time * 2) * 8;

        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.arc(x, y1, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f06292';
        ctx.beginPath();
        ctx.arc(x, y2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Rungs
        if (x % 15 < 3) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x, y1);
          ctx.lineTo(x, y2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // Caption
      const phase = morphT < 0.35 ? 'The caterpillar.' :
                    morphT < 0.65 ? 'The dissolution.' : 'The butterfly.';
      ctx.font = '11px Georgia, serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.textAlign = 'center';
      ctx.fillText(`${phase} The DNA persists.`, cx, h - 8);

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
          aria-label="Metamorphosis animation — a caterpillar dissolves and becomes a butterfly, while a DNA helix persists unchanged beneath"
        />
        <p className="wonder__simulation-caption">
          The form changes completely. Something survives the crossing.
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
