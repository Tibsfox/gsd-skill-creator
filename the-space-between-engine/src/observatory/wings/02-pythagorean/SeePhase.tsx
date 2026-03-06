// Wing 2 — See Phase: "The Squares Assemble"
// Visual proof: squares on the sides of a right triangle, areas revealed.
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

  // Animated proof: two sides (a=3, b=4) building squares, c=5 square emerging
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const draw = () => {
      time += 0.005;
      const progress = Math.min(1, time); // 0 to 1 over the animation
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      // Triangle dimensions (3-4-5, scaled)
      const scale = Math.min(w, h) * 0.06;
      const a = 3 * scale;
      const b = 4 * scale;
      const c = 5 * scale;

      // Position the triangle
      const triX = w * 0.4;
      const triY = h * 0.6;

      // Draw the right triangle
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(triX, triY); // right angle corner
      ctx.lineTo(triX + a, triY); // horizontal leg
      ctx.lineTo(triX, triY - b); // hypotenuse to top
      ctx.closePath();
      ctx.stroke();

      // Right angle marker
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(triX + 10, triY);
      ctx.lineTo(triX + 10, triY - 10);
      ctx.lineTo(triX, triY - 10);
      ctx.stroke();

      // Square on side a (bottom, appears first)
      const aProgress = Math.min(1, progress * 3);
      if (aProgress > 0) {
        ctx.fillStyle = `rgba(79, 195, 247, ${aProgress * 0.3})`;
        ctx.strokeStyle = `rgba(79, 195, 247, ${aProgress * 0.8})`;
        ctx.lineWidth = 1.5;
        const aSize = a * aProgress;
        ctx.fillRect(triX, triY, aSize, aSize);
        ctx.strokeRect(triX, triY, aSize, aSize);

        if (aProgress > 0.8) {
          ctx.fillStyle = '#4fc3f7';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${9}`, triX + a / 2, triY + a / 2 + 5);
        }
      }

      // Square on side b (left, appears second)
      const bProgress = Math.min(1, Math.max(0, progress * 3 - 0.5));
      if (bProgress > 0) {
        ctx.fillStyle = `rgba(240, 98, 146, ${bProgress * 0.3})`;
        ctx.strokeStyle = `rgba(240, 98, 146, ${bProgress * 0.8})`;
        ctx.lineWidth = 1.5;
        const bSize = b * bProgress;
        ctx.fillRect(triX - bSize, triY - b, bSize, bSize);
        ctx.strokeRect(triX - bSize, triY - b, bSize, bSize);

        if (bProgress > 0.8) {
          ctx.fillStyle = '#f06292';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${16}`, triX - b / 2, triY - b / 2 + 5);
        }
      }

      // Square on hypotenuse c (appears last, with emphasis)
      const cProgress = Math.min(1, Math.max(0, progress * 3 - 1));
      if (cProgress > 0) {
        // The hypotenuse square is rotated
        const hx1 = triX + a;
        const hy1 = triY;
        const hx2 = triX;
        const hy2 = triY - b;
        const dx = hx2 - hx1;
        const dy = hy2 - hy1;

        ctx.save();
        ctx.fillStyle = `rgba(255, 200, 100, ${cProgress * 0.3})`;
        ctx.strokeStyle = `rgba(255, 200, 100, ${cProgress * 0.9})`;
        ctx.lineWidth = 2;

        const sx = hx1 + dy * cProgress;
        const sy = hy1 - dx * cProgress;
        const ex = hx2 + dy * cProgress;
        const ey = hy2 - dx * cProgress;

        ctx.beginPath();
        ctx.moveTo(hx1, hy1);
        ctx.lineTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.lineTo(hx2, hy2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        if (cProgress > 0.8) {
          ctx.fillStyle = '#ffcc80';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          const labelX = (hx1 + hx2 + sx + ex) / 4;
          const labelY = (hy1 + hy2 + sy + ey) / 4;
          ctx.fillText(`${25}`, labelX, labelY + 5);
        }
      }

      // Equation reveal
      if (progress > 0.9) {
        const eqAlpha = Math.min(1, (progress - 0.9) * 10);
        ctx.fillStyle = `rgba(255, 255, 255, ${eqAlpha * 0.8})`;
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('9 + 16 = 25', w / 2, h - 30);
      }

      // Labels on triangle sides
      if (progress > 0.1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('3', triX + a / 2, triY + 16);
        ctx.fillText('4', triX - 12, triY - b / 2);
        ctx.fillText('5', triX + a / 2 + 12, triY - b / 2 - 8);
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
    onComplete('see');
  }, [onComplete]);

  return (
    <div className="phase phase--see">
      <div className="see__intro">
        <h2>The Squares Assemble</h2>
        <p>
          Watch as squares grow on each side of a right triangle. The areas of
          the two smaller squares, combined, exactly equal the area of the
          large square. Every time. Without exception.
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="see__canvas"
        onClick={handleCanvasClick}
        aria-label="Animated visual proof of the Pythagorean theorem — squares grow on triangle sides"
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
