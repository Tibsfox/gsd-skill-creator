// Wing 5 — See Phase: "Circles That Overlap"
// Pattern revelation: Venn diagrams form before the learner's eyes.
// Elements sort themselves into sets. Union, intersection, difference become visible.
// Completion: interact with visualization OR >= 90s.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';

interface SeePhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

interface AnimatedElement {
  id: number;
  label: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  inA: boolean;
  inB: boolean;
  arrived: boolean;
  delay: number;
}

export function SeePhase({
  onComplete,
}: SeePhaseProps): React.JSX.Element {
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [activeOp, setActiveOp] = useState<'none' | 'union' | 'intersection' | 'difference'>('none');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const elementsRef = useRef<AnimatedElement[]>([]);

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

  // Initialize elements
  useEffect(() => {
    const labels = ['apple', 'river', 'song', 'stone', 'dream', 'fire', 'cloud', 'memory', 'salt', 'shadow', 'breath', 'star'];
    const circleAx = 0.35;
    const circleAy = 0.45;
    const circleBx = 0.65;
    const circleBy = 0.45;
    const r = 0.2;

    const elements: AnimatedElement[] = labels.map((label, i) => {
      const region = i % 4;
      let targetX: number, targetY: number;
      let inA = false, inB = false;

      switch (region) {
        case 0: // A only
          targetX = circleAx - r * 0.3 + Math.random() * r * 0.35;
          targetY = circleAy + (Math.random() - 0.5) * r * 0.8;
          inA = true;
          break;
        case 1: // B only
          targetX = circleBx + r * 0.1 + Math.random() * r * 0.3;
          targetY = circleBy + (Math.random() - 0.5) * r * 0.8;
          inB = true;
          break;
        case 2: // A intersection B
          targetX = (circleAx + circleBx) / 2 + (Math.random() - 0.5) * r * 0.3;
          targetY = (circleAy + circleBy) / 2 + (Math.random() - 0.5) * r * 0.5;
          inA = true;
          inB = true;
          break;
        default: // outside
          targetX = 0.1 + Math.random() * 0.8;
          targetY = 0.82 + Math.random() * 0.1;
          break;
      }

      return {
        id: i,
        label,
        x: 0.5 + (Math.random() - 0.5) * 0.1,
        y: -0.05 - Math.random() * 0.15,
        targetX,
        targetY,
        inA,
        inB,
        arrived: false,
        delay: i * 800,
      };
    });

    elementsRef.current = elements;
  }, []);

  // Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = 0;

    const draw = (timestamp: number) => {
      if (startTime === 0) startTime = timestamp;
      const elapsed = timestamp - startTime;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      const circleAx = 0.35 * w;
      const circleAy = 0.45 * h;
      const circleBx = 0.65 * w;
      const circleBy = 0.45 * h;
      const r = 0.2 * Math.min(w, h);

      // Draw set circles
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#4fc3f7';
      ctx.beginPath();
      ctx.arc(circleAx, circleAy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f06292';
      ctx.beginPath();
      ctx.arc(circleBx, circleBy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;

      // Circle outlines
      ctx.strokeStyle = 'rgba(79, 195, 247, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(circleAx, circleAy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(240, 98, 146, 0.5)';
      ctx.beginPath();
      ctx.arc(circleBx, circleBy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Labels
      ctx.font = '14px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(79, 195, 247, 0.7)';
      ctx.fillText('things that endure', circleAx - r * 0.3, circleAy - r - 12);
      ctx.fillStyle = 'rgba(240, 98, 146, 0.7)';
      ctx.fillText('things that change', circleBx + r * 0.3, circleBy - r - 12);

      // Animate elements
      for (const elem of elementsRef.current) {
        if (elapsed < elem.delay) continue;

        const animTime = Math.min(1, (elapsed - elem.delay) / 2000);
        const ease = 1 - Math.pow(1 - animTime, 3);

        elem.x = elem.x + (elem.targetX - elem.x) * 0.03;
        elem.y = elem.y + (elem.targetY - elem.y) * 0.03;
        if (animTime > 0.95) elem.arrived = true;

        const ex = elem.x * w;
        const ey = elem.y * h;

        // Highlight based on active operation
        let highlighted = true;
        let alpha = 0.9;
        if (activeOp === 'union') {
          highlighted = elem.inA || elem.inB;
          alpha = highlighted ? 0.9 : 0.2;
        } else if (activeOp === 'intersection') {
          highlighted = elem.inA && elem.inB;
          alpha = highlighted ? 0.9 : 0.2;
        } else if (activeOp === 'difference') {
          highlighted = elem.inA && !elem.inB;
          alpha = highlighted ? 0.9 : 0.2;
        }

        // Color based on membership
        let color: string;
        if (elem.inA && elem.inB) color = '#ce93d8';
        else if (elem.inA) color = '#4fc3f7';
        else if (elem.inB) color = '#f06292';
        else color = '#666';

        ctx.globalAlpha = alpha * ease;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(ex, ey, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(elem.label, ex, ey + 20);
        ctx.globalAlpha = 1;
      }

      // Counts
      const aOnly = elementsRef.current.filter(e => e.inA && !e.inB && e.arrived).length;
      const bOnly = elementsRef.current.filter(e => !e.inA && e.inB && e.arrived).length;
      const both = elementsRef.current.filter(e => e.inA && e.inB && e.arrived).length;

      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(`Endure only: ${aOnly}`, 10, h - 50);
      ctx.fillText(`Change only: ${bOnly}`, 10, h - 34);
      ctx.fillText(`Both: ${both}`, 10, h - 18);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [activeOp]);

  const handleOpChange = useCallback((op: 'none' | 'union' | 'intersection' | 'difference') => {
    setActiveOp(op);
    setHasInteracted(true);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('see');
  }, [onComplete]);

  return (
    <div className="phase phase--see">
      <div className="see__intro">
        <h2 className="see__title">Circles That Overlap</h2>
        <p className="see__description">
          Watch as things find their places. Some things endure. Some things change.
          Some do both. The circles reveal what belongs where.
        </p>
      </div>

      <div className="see__visualization">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="see__canvas"
          aria-label="Venn diagram with elements sorting into sets of things that endure and things that change"
        />
        <div className="see__controls">
          <button
            className={`see__op-btn ${activeOp === 'none' ? 'see__op-btn--active' : ''}`}
            onClick={() => handleOpChange('none')}
          >All</button>
          <button
            className={`see__op-btn ${activeOp === 'union' ? 'see__op-btn--active' : ''}`}
            onClick={() => handleOpChange('union')}
          >Everything in either</button>
          <button
            className={`see__op-btn ${activeOp === 'intersection' ? 'see__op-btn--active' : ''}`}
            onClick={() => handleOpChange('intersection')}
          >Only what both share</button>
          <button
            className={`see__op-btn ${activeOp === 'difference' ? 'see__op-btn--active' : ''}`}
            onClick={() => handleOpChange('difference')}
          >Endures but does not change</button>
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
