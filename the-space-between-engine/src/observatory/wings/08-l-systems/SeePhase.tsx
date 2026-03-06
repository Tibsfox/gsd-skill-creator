// Wing 8 — See Phase: "Watch It Grow"
// A single line. One rule. Watch what happens after several iterations.
// The tree was not drawn — it was grown.
// Completion: interact with visualization OR >= 90s.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';

interface SeePhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

function generateLSystem(axiom: string, rules: Record<string, string>, iterations: number): string {
  let current = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = '';
    for (const ch of current) {
      next += rules[ch] ?? ch;
    }
    current = next;
    if (current.length > 500000) break;
  }
  return current;
}

interface TurtleState {
  x: number;
  y: number;
  angle: number;
}

function computeBounds(
  lString: string, angle: number, lineLen: number,
): { minX: number; minY: number; maxX: number; maxY: number } {
  const angleRad = (angle * Math.PI) / 180;
  const stack: TurtleState[] = [];
  let state: TurtleState = { x: 0, y: 0, angle: -Math.PI / 2 };
  let minX = 0, minY = 0, maxX = 0, maxY = 0;

  for (const ch of lString) {
    switch (ch) {
      case 'F':
      case 'G':
        state.x += Math.cos(state.angle) * lineLen;
        state.y += Math.sin(state.angle) * lineLen;
        minX = Math.min(minX, state.x);
        minY = Math.min(minY, state.y);
        maxX = Math.max(maxX, state.x);
        maxY = Math.max(maxY, state.y);
        break;
      case '+': state.angle += angleRad; break;
      case '-': state.angle -= angleRad; break;
      case '[': stack.push({ ...state }); break;
      case ']': {
        const p = stack.pop();
        if (p) state = p;
        break;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

export function SeePhase({
  onComplete,
}: SeePhaseProps): React.JSX.Element {
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [iteration, setIteration] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Render L-system at current iteration
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    const lString = generateLSystem('F', { F: 'FF+[+F-F-F]-[-F+F+F]' }, iteration);
    const angle = 25;
    const lineLen = 5;
    const bounds = computeBounds(lString, angle, lineLen);

    const bw = bounds.maxX - bounds.minX;
    const bh = bounds.maxY - bounds.minY;
    if (bw === 0 && bh === 0) return;

    const margin = 40;
    const availW = w - margin * 2;
    const availH = h - margin * 2;
    const scale = Math.min(availW / (bw || 1), availH / (bh || 1));
    const offsetX = margin + (availW - bw * scale) / 2 - bounds.minX * scale;
    const offsetY = margin + (availH - bh * scale) / 2 - bounds.minY * scale;

    const angleRad = (angle * Math.PI) / 180;
    const stack: TurtleState[] = [];
    let state: TurtleState = { x: 0, y: 0, angle: -Math.PI / 2 };

    let totalSegments = 0;
    for (const ch of lString) {
      if (ch === 'F') totalSegments++;
    }

    let segIdx = 0;
    ctx.lineWidth = Math.max(0.5, 3 - iteration * 0.4);

    for (const ch of lString) {
      switch (ch) {
        case 'F': {
          const nx = state.x + Math.cos(state.angle) * lineLen;
          const ny = state.y + Math.sin(state.angle) * lineLen;
          const hue = (segIdx / (totalSegments || 1)) * 120 + 100;
          ctx.strokeStyle = `hsla(${hue}, 50%, 45%, 0.8)`;
          ctx.beginPath();
          ctx.moveTo(state.x * scale + offsetX, state.y * scale + offsetY);
          ctx.lineTo(nx * scale + offsetX, ny * scale + offsetY);
          ctx.stroke();
          state.x = nx;
          state.y = ny;
          segIdx++;
          break;
        }
        case '+': state.angle += angleRad; break;
        case '-': state.angle -= angleRad; break;
        case '[': stack.push({ ...state }); break;
        case ']': {
          const p = stack.pop();
          if (p) state = p;
          break;
        }
      }
    }

    // Info
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`Iteration: ${iteration}`, 10, 20);
    ctx.fillText(`Segments: ${totalSegments}`, 10, 36);
    ctx.fillText(`String length: ${lString.length}`, 10, 52);

    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillText(
      iteration === 1 ? 'One segment. One rule. Press "Iterate" to apply the rule.' :
      iteration <= 3 ? 'The rule is eating its own output. Complexity is emerging.' :
      'The tree was not drawn. It was grown. From one rule.',
      w / 2, h - 10
    );
  }, [iteration]);

  const handleIterate = useCallback(() => {
    if (iteration < 6) {
      setIteration((prev) => prev + 1);
      setHasInteracted(true);
    }
  }, [iteration]);

  const handleReset = useCallback(() => {
    setIteration(1);
    setHasInteracted(true);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('see');
  }, [onComplete]);

  return (
    <div className="phase phase--see">
      <div className="see__intro">
        <h2 className="see__title">Watch It Grow</h2>
        <p className="see__description">
          Start with a single line segment. Apply one rule: replace each segment
          with a branching pattern. Press &ldquo;Iterate&rdquo; and watch complexity emerge
          from simplicity.
        </p>
      </div>

      <div className="see__visualization">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="see__canvas"
          aria-label="L-system tree growing iteration by iteration from a single segment"
        />
        <div className="see__controls">
          <button
            className="see__op-btn"
            onClick={handleIterate}
            disabled={iteration >= 6}
          >
            Iterate ({iteration}/6)
          </button>
          <button
            className="see__op-btn"
            onClick={handleReset}
          >
            Reset to seed
          </button>
        </div>
      </div>

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
