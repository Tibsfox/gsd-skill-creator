// Wing 2 — Wonder Phase: "The Distance Between"
// ZERO math notation. Story-driven. Spider web tension, GPS triangulation.
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
  const story = getStory('pythagorean');
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

  // Spider web animation — strands under tension, distances visible
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nodes = [
      { x: 0.5, y: 0.2 },
      { x: 0.2, y: 0.5 },
      { x: 0.8, y: 0.5 },
      { x: 0.35, y: 0.8 },
      { x: 0.65, y: 0.8 },
      { x: 0.5, y: 0.5 },
    ];

    let time = 0;

    const draw = () => {
      time += 0.02;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      // Animate nodes slightly (like a web trembling)
      const animNodes = nodes.map((n, i) => ({
        x: n.x + Math.sin(time + i * 1.3) * 0.008,
        y: n.y + Math.cos(time + i * 0.9) * 0.008,
      }));

      // Draw web strands between all pairs
      for (let i = 0; i < animNodes.length; i++) {
        for (let j = i + 1; j < animNodes.length; j++) {
          const a = animNodes[i]!;
          const b = animNodes[j]!;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Strand opacity varies with tension (shorter = tighter = brighter)
          const alpha = Math.max(0.1, 1 - dist * 2);
          ctx.strokeStyle = `rgba(200, 200, 220, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x * w, a.y * h);
          ctx.lineTo(b.x * w, b.y * h);
          ctx.stroke();
        }
      }

      // Draw nodes
      for (const n of animNodes) {
        ctx.fillStyle = 'rgba(255, 230, 200, 0.6)';
        ctx.beginPath();
        ctx.arc(n.x * w, n.y * h, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Highlight one right triangle: center, right node, and a constructed point
      const center = animNodes[5]!;
      const right = animNodes[2]!;
      const corner = { x: right.x, y: center.y };

      // Horizontal leg
      ctx.strokeStyle = 'rgba(79, 195, 247, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(center.x * w, center.y * h);
      ctx.lineTo(corner.x * w, corner.y * h);
      ctx.stroke();

      // Vertical leg
      ctx.strokeStyle = 'rgba(240, 98, 146, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(corner.x * w, corner.y * h);
      ctx.lineTo(right.x * w, right.y * h);
      ctx.stroke();

      // Hypotenuse
      ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(center.x * w, center.y * h);
      ctx.lineTo(right.x * w, right.y * h);
      ctx.stroke();

      // Right angle marker
      const markerSize = 8;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(corner.x * w - markerSize, corner.y * h);
      ctx.lineTo(corner.x * w - markerSize, corner.y * h + (right.y > center.y ? markerSize : -markerSize));
      ctx.lineTo(corner.x * w, corner.y * h + (right.y > center.y ? markerSize : -markerSize));
      ctx.stroke();

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
          aria-label="A spider web trembles, revealing the triangles hidden in its structure"
        />
        <p className="wonder__simulation-caption">
          Every strand is a distance. Every junction is a triangle.
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
