// Wing 8 — Wonder Phase: "The Rule That Grows Itself"
// ZERO math notation. Story-driven only.
// Fern frond unfurling. Tree branching. Frost on glass.
// Birdsong completes its triple arc: bird songs are recursive grammars —
// syllables iterated by L-system-like rules. Same thrush that taught
// trigonometry (wave) and information theory (channel) now teaches growth.
// If the learner notices, this is the deepest unit-circle moment.
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
  const story = getStory('l-systems');
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

  // Fern growth animation — a plant unfurling from a single segment
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate L-system string for a fern
    const axiom = 'X';
    const rules: Record<string, string> = {
      X: 'F+[[X]-X]-F[-FX]+X',
      F: 'FF',
    };

    let lString = axiom;
    for (let i = 0; i < 5; i++) {
      let next = '';
      for (const ch of lString) {
        next += rules[ch] ?? ch;
      }
      lString = next;
      if (lString.length > 200000) break;
    }

    // Count total F characters for growth animation
    let totalF = 0;
    for (const ch of lString) {
      if (ch === 'F') totalF++;
    }

    let growthProgress = 0;

    const draw = () => {
      // Slow growth
      growthProgress = Math.min(1, growthProgress + 0.002);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background — deep forest
      ctx.fillStyle = '#0a1a0a';
      ctx.fillRect(0, 0, w, h);

      // Ground
      ctx.fillStyle = '#1a3a1a';
      ctx.fillRect(0, h * 0.9, w, h * 0.1);

      // Render fern using turtle graphics
      const startX = w * 0.45;
      const startY = h * 0.9;
      const angleRad = (25 * Math.PI) / 180;
      const baseLen = h * 0.012;

      interface TurtleState {
        x: number;
        y: number;
        angle: number;
        depth: number;
      }

      const stack: TurtleState[] = [];
      let state: TurtleState = { x: startX, y: startY, angle: -Math.PI / 2, depth: 0 };
      const maxDrawF = Math.floor(totalF * growthProgress);
      let fCount = 0;

      for (const ch of lString) {
        switch (ch) {
          case 'F': {
            fCount++;
            if (fCount > maxDrawF) break;

            const len = baseLen * Math.pow(0.85, state.depth * 0.3);
            const nx = state.x + Math.cos(state.angle) * len;
            const ny = state.y + Math.sin(state.angle) * len;

            const depthRatio = Math.min(1, state.depth / 15);

            // Color: stems are brown, tips are green
            if (depthRatio > 0.5) {
              const green = Math.round(100 + (1 - depthRatio) * 100);
              ctx.strokeStyle = `rgba(60, ${green}, 40, 0.8)`;
              ctx.lineWidth = Math.max(0.3, (1 - depthRatio) * 2);
            } else {
              ctx.strokeStyle = `rgba(80, 60, 30, 0.8)`;
              ctx.lineWidth = Math.max(0.5, (1 - depthRatio) * 3);
            }

            ctx.beginPath();
            ctx.moveTo(state.x, state.y);
            ctx.lineTo(nx, ny);
            ctx.stroke();

            // Tiny leaf dots at tips
            if (depthRatio > 0.7) {
              ctx.fillStyle = `rgba(80, ${150 + Math.round(Math.random() * 60)}, 60, 0.6)`;
              ctx.beginPath();
              ctx.arc(nx, ny, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }

            state.x = nx;
            state.y = ny;
            break;
          }
          case '+':
            state.angle += angleRad;
            break;
          case '-':
            state.angle -= angleRad;
            break;
          case '[':
            stack.push({ ...state });
            state = { ...state, depth: state.depth + 1 };
            break;
          case ']': {
            const popped = stack.pop();
            if (popped) state = popped;
            break;
          }
        }
        if (fCount > maxDrawF) break;
      }

      // Caption
      const phase = growthProgress < 0.3 ? 'The seed.' :
                    growthProgress < 0.7 ? 'The rule unfolds.' :
                    'One rule. One fern.';
      ctx.font = '11px Georgia, serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.textAlign = 'center';
      ctx.fillText(phase, w / 2, h - 8);

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
          height={400}
          className="wonder__canvas"
          onClick={handleCanvasClick}
          aria-label="A fern grows from a single point, unfurling according to one simple rule applied repeatedly"
        />
        <p className="wonder__simulation-caption">
          One rule. Applied again and again. A fern emerges.
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
