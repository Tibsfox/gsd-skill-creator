// Wing 6 — See Phase: "Dots and Arrows"
// Pattern revelation: watch objects and morphisms form categories.
// Different categories appear — shapes/sides, colors/wavelengths, notes/ratios.
// The arrow patterns are the same even though the content differs.
// Completion: interact with visualization OR >= 90s.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';

interface SeePhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

type CategoryExample = 'shapes' | 'colors' | 'notes';

interface VisObject {
  label: string;
  x: number;
  y: number;
  color: string;
}

interface VisMorphism {
  fromIdx: number;
  toIdx: number;
  label: string;
}

function getCategoryData(example: CategoryExample): { name: string; objects: VisObject[]; morphisms: VisMorphism[] } {
  switch (example) {
    case 'shapes':
      return {
        name: 'Shapes',
        objects: [
          { label: 'Triangle', x: 0.2, y: 0.3, color: '#4fc3f7' },
          { label: 'Square', x: 0.2, y: 0.6, color: '#81c784' },
          { label: 'Circle', x: 0.2, y: 0.85, color: '#f06292' },
        ],
        morphisms: [
          { fromIdx: 0, toIdx: 1, label: 'add a side' },
          { fromIdx: 1, toIdx: 2, label: 'smooth the corners' },
          { fromIdx: 0, toIdx: 2, label: 'take the limit' },
        ],
      };
    case 'colors':
      return {
        name: 'Colors',
        objects: [
          { label: 'Red', x: 0.2, y: 0.3, color: '#ef5350' },
          { label: 'Blue', x: 0.2, y: 0.6, color: '#42a5f5' },
          { label: 'Yellow', x: 0.2, y: 0.85, color: '#ffee58' },
        ],
        morphisms: [
          { fromIdx: 0, toIdx: 1, label: 'complement' },
          { fromIdx: 1, toIdx: 2, label: 'complement' },
          { fromIdx: 2, toIdx: 0, label: 'complement' },
        ],
      };
    case 'notes':
      return {
        name: 'Notes',
        objects: [
          { label: 'C', x: 0.2, y: 0.25, color: '#4fc3f7' },
          { label: 'E', x: 0.2, y: 0.45, color: '#81c784' },
          { label: 'G', x: 0.2, y: 0.65, color: '#f06292' },
          { label: "C'", x: 0.2, y: 0.85, color: '#ffcc80' },
        ],
        morphisms: [
          { fromIdx: 0, toIdx: 1, label: 'major third' },
          { fromIdx: 1, toIdx: 2, label: 'minor third' },
          { fromIdx: 2, toIdx: 3, label: 'perfect fourth' },
          { fromIdx: 0, toIdx: 3, label: 'octave' },
        ],
      };
  }
}

export function SeePhase({
  onComplete,
}: SeePhaseProps): React.JSX.Element {
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [example, setExample] = useState<CategoryExample>('shapes');
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const draw = () => {
      time += 0.01;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      const data = getCategoryData(example);

      // Category box
      ctx.strokeStyle = 'rgba(79, 195, 247, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(w * 0.08, h * 0.12, w * 0.84, h * 0.78);

      ctx.font = '14px Georgia, serif';
      ctx.fillStyle = 'rgba(255, 200, 100, 0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(`Category: ${data.name}`, w / 2, h * 0.08);

      // Draw morphisms (arrows) first, behind objects
      for (const morph of data.morphisms) {
        const from = data.objects[morph.fromIdx]!;
        const to = data.objects[morph.toIdx]!;
        const fx = from.x * w;
        const fy = from.y * h;
        const tx = to.x * w;
        const ty = to.y * h;

        // Curved arrow
        const curveX = (fx + tx) / 2 + 60;
        const curveY = (fy + ty) / 2;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(fx + 25, fy);
        ctx.quadraticCurveTo(curveX, curveY, tx + 25, ty);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(ty - curveY, (tx + 25) - curveX);
        ctx.beginPath();
        ctx.moveTo(tx + 25, ty);
        ctx.lineTo(tx + 25 - Math.cos(angle - 0.3) * 8, ty - Math.sin(angle - 0.3) * 8);
        ctx.moveTo(tx + 25, ty);
        ctx.lineTo(tx + 25 - Math.cos(angle + 0.3) * 8, ty - Math.sin(angle + 0.3) * 8);
        ctx.stroke();

        // Morphism label
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.textAlign = 'left';
        ctx.fillText(morph.label, curveX + 8, curveY - 4);
      }

      // Draw objects (dots with labels)
      for (const obj of data.objects) {
        const ox = obj.x * w;
        const oy = obj.y * h;

        // Gentle pulse
        const pulse = 1 + Math.sin(time * 2 + obj.y * 10) * 0.1;

        ctx.fillStyle = obj.color;
        ctx.beginPath();
        ctx.arc(ox, oy, 18 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(obj.label, ox, oy + 4);
      }

      // Instructional text
      ctx.font = '11px Georgia, serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.textAlign = 'center';
      ctx.fillText('The dots are objects. The arrows are transformations. The pattern is the mathematics.', w / 2, h - 10);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [example]);

  const handleExampleChange = useCallback((ex: CategoryExample) => {
    setExample(ex);
    setHasInteracted(true);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('see');
  }, [onComplete]);

  return (
    <div className="phase phase--see">
      <div className="see__intro">
        <h2 className="see__title">Dots and Arrows</h2>
        <p className="see__description">
          Objects are dots. Transformations between them are arrows. Switch between
          different categories and notice: the arrow patterns look the same even when
          the dots are completely different things.
        </p>
      </div>

      <div className="see__visualization">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="see__canvas"
          aria-label="Category visualization — objects as dots with morphism arrows between them"
        />
        <div className="see__controls">
          {(['shapes', 'colors', 'notes'] as const).map((ex) => (
            <button
              key={ex}
              className={`see__op-btn ${example === ex ? 'see__op-btn--active' : ''}`}
              onClick={() => handleExampleChange(ex)}
            >
              {ex === 'shapes' ? 'Shapes' : ex === 'colors' ? 'Colors' : 'Musical Notes'}
            </button>
          ))}
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
