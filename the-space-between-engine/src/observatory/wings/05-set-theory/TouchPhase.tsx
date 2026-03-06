// Wing 5 — Touch Phase: "Sort and Classify"
// Define membership functions. Drag elements between sets. Watch Venn operations.
// Every numeric readout has plain-language label FIRST, then notation in parentheses.
// Completion: >= 3 parameter changes OR >= 2min.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';

interface TouchPhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

interface DraggableElement {
  id: number;
  label: string;
  x: number;
  y: number;
  inA: boolean;
  inB: boolean;
}

export function TouchPhase({
  onComplete,
}: TouchPhaseProps): React.JSX.Element {
  const [timeSpent, setTimeSpent] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [overlap, setOverlap] = useState(0.35);
  const [highlightOp, setHighlightOp] = useState<'none' | 'union' | 'intersection' | 'difference' | 'symmetric-difference'>('none');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const elementsRef = useRef<DraggableElement[]>([]);
  const draggingRef = useRef<DraggableElement | null>(null);

  // Circle geometry constants (normalized)
  const circleAy = 0.45;
  const circleBy = 0.45;
  const circleR = 0.18;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (completed) return;
    if (interactionCount >= 3 || timeSpent >= 120) {
      setCompleted(true);
    }
  }, [interactionCount, timeSpent, completed]);

  // Initialize elements
  useEffect(() => {
    const labels = ['you', 'memory', 'breath', 'name', 'fear', 'love', 'skin', 'dream',
                    'voice', 'scar', 'hope', 'hunger', 'story', 'silence', 'shadow'];

    const getCirclePositions = () => {
      const separation = circleR * 2 * (1 - overlap);
      return {
        circleAx: 0.5 - separation / 2,
        circleBx: 0.5 + separation / 2,
      };
    };

    const { circleAx, circleBx } = getCirclePositions();

    const elements: DraggableElement[] = labels.map((label, i) => {
      const region = i % 5;
      let x: number, y: number;

      switch (region) {
        case 0:
          x = circleAx - circleR * 0.3 + Math.random() * circleR * 0.3;
          y = circleAy + (Math.random() - 0.5) * circleR * 0.7;
          break;
        case 1:
          x = circleBx + circleR * 0.1 + Math.random() * circleR * 0.3;
          y = circleBy + (Math.random() - 0.5) * circleR * 0.7;
          break;
        case 2:
          x = (circleAx + circleBx) / 2 + (Math.random() - 0.5) * circleR * 0.2;
          y = (circleAy + circleBy) / 2 + (Math.random() - 0.5) * circleR * 0.5;
          break;
        default:
          x = 0.1 + Math.random() * 0.8;
          y = 0.82 + Math.random() * 0.08;
          break;
      }

      return { id: i, label, x, y, inA: false, inB: false };
    });

    elementsRef.current = elements;
  }, [overlap]);

  const updateMembership = useCallback((elem: DraggableElement) => {
    const separation = circleR * 2 * (1 - overlap);
    const circleAx = 0.5 - separation / 2;
    const circleBx = 0.5 + separation / 2;

    const distA = Math.sqrt((elem.x - circleAx) ** 2 + (elem.y - circleAy) ** 2);
    const distB = Math.sqrt((elem.x - circleBx) ** 2 + (elem.y - circleBy) ** 2);
    elem.inA = distA <= circleR;
    elem.inB = distB <= circleR;
  }, [overlap]);

  // Canvas rendering and interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;

      let nearest: DraggableElement | null = null;
      let minDist = 0.04;
      for (const elem of elementsRef.current) {
        const dist = Math.sqrt((elem.x - nx) ** 2 + (elem.y - ny) ** 2);
        if (dist < minDist) {
          minDist = dist;
          nearest = elem;
        }
      }
      draggingRef.current = nearest;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const rect = canvas.getBoundingClientRect();
      draggingRef.current.x = (e.clientX - rect.left) / rect.width;
      draggingRef.current.y = (e.clientY - rect.top) / rect.height;
      updateMembership(draggingRef.current);
    };

    const handlePointerUp = () => {
      if (draggingRef.current) {
        setInteractionCount((prev) => prev + 1);
        draggingRef.current = null;
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      const separation = circleR * 2 * (1 - overlap);
      const ax = (0.5 - separation / 2) * w;
      const ay = circleAy * h;
      const bx = (0.5 + separation / 2) * w;
      const by = circleBy * h;
      const r = circleR * Math.min(w, h);

      // Set circles
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#4fc3f7';
      ctx.beginPath();
      ctx.arc(ax, ay, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f06292';
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = 'rgba(79, 195, 247, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ax, ay, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(240, 98, 146, 0.5)';
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.stroke();

      // Set labels
      ctx.font = '13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(79, 195, 247, 0.7)';
      ctx.fillText('body', ax - r * 0.5, ay - r - 8);
      ctx.fillStyle = 'rgba(240, 98, 146, 0.7)';
      ctx.fillText('mind', bx + r * 0.5, by - r - 8);

      // Update all memberships and draw elements
      for (const elem of elementsRef.current) {
        if (elem !== draggingRef.current) {
          updateMembership(elem);
        }

        const ex = elem.x * w;
        const ey = elem.y * h;
        const isDragging = elem === draggingRef.current;

        // Highlight based on operation
        let show = true;
        if (highlightOp === 'union') show = elem.inA || elem.inB;
        else if (highlightOp === 'intersection') show = elem.inA && elem.inB;
        else if (highlightOp === 'difference') show = elem.inA && !elem.inB;
        else if (highlightOp === 'symmetric-difference') show = (elem.inA && !elem.inB) || (!elem.inA && elem.inB);

        let color: string;
        if (elem.inA && elem.inB) color = '#ce93d8';
        else if (elem.inA) color = '#4fc3f7';
        else if (elem.inB) color = '#f06292';
        else color = '#555';

        const alpha = (highlightOp === 'none' || show) ? 1.0 : 0.15;
        const radius = isDragging ? 12 : 8;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(ex, ey, radius, 0, Math.PI * 2);
        ctx.fill();

        if (isDragging) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ex, ey, radius + 2, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = '#fff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(elem.label, ex, ey + radius + 12);
        ctx.globalAlpha = 1;
      }

      // Readouts — plain language FIRST, notation in parentheses
      const aOnly = elementsRef.current.filter(e => e.inA && !e.inB).length;
      const bOnly = elementsRef.current.filter(e => !e.inA && e.inB).length;
      const both = elementsRef.current.filter(e => e.inA && e.inB).length;
      const neither = elementsRef.current.filter(e => !e.inA && !e.inB).length;
      const total = aOnly + both;
      const totalB = bOnly + both;

      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(`Body has: ${total}  (|A| = ${total})`, 10, h - 68);
      ctx.fillText(`Mind has: ${totalB}  (|B| = ${totalB})`, 10, h - 52);
      ctx.fillText(`Shared: ${both}  (|A \u2229 B| = ${both})`, 10, h - 36);
      ctx.fillText(`Unclaimed: ${neither}`, 10, h - 20);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
    };
  }, [overlap, highlightOp, updateMembership]);

  const handleContinue = useCallback(() => {
    onComplete('touch');
  }, [onComplete]);

  return (
    <div className="phase phase--touch">
      <div className="touch__intro">
        <h2 className="touch__title">Sort and Classify</h2>
        <p className="touch__description">
          Drag each word to where it belongs. Does &ldquo;breath&rdquo; belong to the body,
          the mind, or both? Where does &ldquo;you&rdquo; go?
        </p>
      </div>

      <div className="touch__visualization">
        <canvas
          ref={canvasRef}
          width={600}
          height={450}
          className="touch__canvas"
          aria-label="Interactive Venn diagram — drag elements between body and mind sets"
        />
        <div className="touch__controls">
          <label className="touch__control-label">
            Overlap:
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={overlap}
              onChange={(e) => {
                setOverlap(parseFloat(e.target.value));
                setInteractionCount((prev) => prev + 1);
              }}
            />
          </label>
          <div className="touch__op-buttons">
            {(['none', 'union', 'intersection', 'difference', 'symmetric-difference'] as const).map((op) => (
              <button
                key={op}
                className={`touch__op-btn ${highlightOp === op ? 'touch__op-btn--active' : ''}`}
                onClick={() => {
                  setHighlightOp(op);
                  setInteractionCount((prev) => prev + 1);
                }}
              >
                {op === 'none' ? 'Show all' :
                 op === 'union' ? 'Everything in either' :
                 op === 'intersection' ? 'Shared by both' :
                 op === 'difference' ? 'Body only' :
                 'One but not both'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {completed && (
        <div className="touch__continue">
          <button className="phase__continue-btn" onClick={handleContinue}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
