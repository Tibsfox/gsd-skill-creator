// Wing 6 — Touch Phase: "Draw the Arrows"
// Two side-by-side worlds the learner defines. Drag arrows to connect.
// System shows whether mapping preserves relationships. Functor-building through felt connection.
// Every numeric readout: plain-language label FIRST, then notation in parentheses.
// Completion: >= 3 parameter changes OR >= 2min.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';

interface TouchPhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

interface MappingPair {
  sourceIdx: number;
  targetIdx: number;
}

interface DomainItem {
  label: string;
  x: number;
  y: number;
  color: string;
}

type DomainPreset = 'cooking-chemistry' | 'music-color' | 'seasons-emotions';

function getDomains(preset: DomainPreset): {
  sourceName: string;
  targetName: string;
  sourceItems: DomainItem[];
  targetItems: DomainItem[];
  sourceRelations: Array<{ from: number; to: number; label: string }>;
  targetRelations: Array<{ from: number; to: number; label: string }>;
  correctMap: MappingPair[];
} {
  switch (preset) {
    case 'cooking-chemistry':
      return {
        sourceName: 'Cooking',
        targetName: 'Chemistry',
        sourceItems: [
          { label: 'Mix', x: 0.15, y: 0.3, color: '#ffcc80' },
          { label: 'Heat', x: 0.15, y: 0.55, color: '#ef5350' },
          { label: 'Serve', x: 0.15, y: 0.8, color: '#81c784' },
        ],
        targetItems: [
          { label: 'Combine', x: 0.85, y: 0.3, color: '#4fc3f7' },
          { label: 'React', x: 0.85, y: 0.55, color: '#f06292' },
          { label: 'Product', x: 0.85, y: 0.8, color: '#ce93d8' },
        ],
        sourceRelations: [
          { from: 0, to: 1, label: 'then' },
          { from: 1, to: 2, label: 'then' },
        ],
        targetRelations: [
          { from: 0, to: 1, label: 'then' },
          { from: 1, to: 2, label: 'then' },
        ],
        correctMap: [
          { sourceIdx: 0, targetIdx: 0 },
          { sourceIdx: 1, targetIdx: 1 },
          { sourceIdx: 2, targetIdx: 2 },
        ],
      };
    case 'music-color':
      return {
        sourceName: 'Musical Keys',
        targetName: 'Colors',
        sourceItems: [
          { label: 'C major', x: 0.15, y: 0.3, color: '#4fc3f7' },
          { label: 'G major', x: 0.15, y: 0.55, color: '#81c784' },
          { label: 'D major', x: 0.15, y: 0.8, color: '#ffcc80' },
        ],
        targetItems: [
          { label: 'White', x: 0.85, y: 0.3, color: '#e0e0e0' },
          { label: 'Green', x: 0.85, y: 0.55, color: '#66bb6a' },
          { label: 'Gold', x: 0.85, y: 0.8, color: '#ffd54f' },
        ],
        sourceRelations: [
          { from: 0, to: 1, label: 'fifth up' },
          { from: 1, to: 2, label: 'fifth up' },
        ],
        targetRelations: [
          { from: 0, to: 1, label: 'warmer' },
          { from: 1, to: 2, label: 'warmer' },
        ],
        correctMap: [
          { sourceIdx: 0, targetIdx: 0 },
          { sourceIdx: 1, targetIdx: 1 },
          { sourceIdx: 2, targetIdx: 2 },
        ],
      };
    case 'seasons-emotions':
      return {
        sourceName: 'Seasons',
        targetName: 'Emotions',
        sourceItems: [
          { label: 'Spring', x: 0.15, y: 0.25, color: '#81c784' },
          { label: 'Summer', x: 0.15, y: 0.45, color: '#ffcc80' },
          { label: 'Autumn', x: 0.15, y: 0.65, color: '#ef5350' },
          { label: 'Winter', x: 0.15, y: 0.85, color: '#4fc3f7' },
        ],
        targetItems: [
          { label: 'Hope', x: 0.85, y: 0.25, color: '#81c784' },
          { label: 'Joy', x: 0.85, y: 0.45, color: '#ffcc80' },
          { label: 'Nostalgia', x: 0.85, y: 0.65, color: '#ef5350' },
          { label: 'Stillness', x: 0.85, y: 0.85, color: '#4fc3f7' },
        ],
        sourceRelations: [
          { from: 0, to: 1, label: 'follows' },
          { from: 1, to: 2, label: 'follows' },
          { from: 2, to: 3, label: 'follows' },
          { from: 3, to: 0, label: 'follows' },
        ],
        targetRelations: [
          { from: 0, to: 1, label: 'follows' },
          { from: 1, to: 2, label: 'follows' },
          { from: 2, to: 3, label: 'follows' },
          { from: 3, to: 0, label: 'follows' },
        ],
        correctMap: [
          { sourceIdx: 0, targetIdx: 0 },
          { sourceIdx: 1, targetIdx: 1 },
          { sourceIdx: 2, targetIdx: 2 },
          { sourceIdx: 3, targetIdx: 3 },
        ],
      };
  }
}

export function TouchPhase({
  onComplete,
}: TouchPhaseProps): React.JSX.Element {
  const [timeSpent, setTimeSpent] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [preset, setPreset] = useState<DomainPreset>('cooking-chemistry');
  const [mappings, setMappings] = useState<MappingPair[]>([]);
  const [draggingFrom, setDraggingFrom] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const domains = getDomains(preset);

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

  // Reset mappings when preset changes
  useEffect(() => {
    setMappings([]);
  }, [preset]);

  // Canvas rendering
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

      // Domain labels
      ctx.font = '13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 200, 100, 0.7)';
      ctx.fillText(domains.sourceName, w * 0.15, h * 0.08);
      ctx.fillText(domains.targetName, w * 0.85, h * 0.08);

      // Functor label
      ctx.fillStyle = 'rgba(255, 200, 100, 0.5)';
      ctx.fillText('Your mapping', w * 0.5, h * 0.08);

      // Draw source relations
      for (const rel of domains.sourceRelations) {
        const from = domains.sourceItems[rel.from]!;
        const to = domains.sourceItems[rel.to]!;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        const cx = from.x * w + 30;
        ctx.beginPath();
        ctx.moveTo(from.x * w + 20, from.y * h);
        ctx.quadraticCurveTo(cx, (from.y + to.y) / 2 * h, to.x * w + 20, to.y * h);
        ctx.stroke();
      }

      // Draw target relations
      for (const rel of domains.targetRelations) {
        const from = domains.targetItems[rel.from]!;
        const to = domains.targetItems[rel.to]!;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        const cx = from.x * w - 30;
        ctx.beginPath();
        ctx.moveTo(from.x * w - 20, from.y * h);
        ctx.quadraticCurveTo(cx, (from.y + to.y) / 2 * h, to.x * w - 20, to.y * h);
        ctx.stroke();
      }

      // Draw existing mappings
      for (const m of mappings) {
        const source = domains.sourceItems[m.sourceIdx]!;
        const target = domains.targetItems[m.targetIdx]!;
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = -time * 15;
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(source.x * w + 20, source.y * h);
        ctx.lineTo(target.x * w - 20, target.y * h);
        ctx.stroke();
        ctx.restore();
      }

      // Draw dragging line
      if (draggingFrom !== null) {
        const source = domains.sourceItems[draggingFrom]!;
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(source.x * w + 20, source.y * h);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
      }

      // Draw source objects
      for (const item of domains.sourceItems) {
        const ox = item.x * w;
        const oy = item.y * h;
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(ox, oy, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, ox, oy + 4);
      }

      // Draw target objects
      for (const item of domains.targetItems) {
        const ox = item.x * w;
        const oy = item.y * h;
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(ox, oy, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, ox, oy + 4);
      }

      // Check if mapping preserves structure
      const preserves = checkStructurePreservation();
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText(`Arrows mapped: ${mappings.length}  (|F|)`, 10, h - 20);
      if (mappings.length > 0) {
        ctx.fillStyle = preserves ? 'rgba(100, 200, 100, 0.7)' : 'rgba(255, 100, 100, 0.7)';
        ctx.fillText(
          preserves ? 'Structure preserved (functor)' : 'Structure broken (not a functor)',
          10, h - 4
        );
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [domains, mappings, draggingFrom, mousePos]);

  const checkStructurePreservation = useCallback((): boolean => {
    if (mappings.length === 0) return false;

    // Build mapping lookup: source -> target
    const mapLookup = new Map<number, number>();
    for (const m of mappings) {
      mapLookup.set(m.sourceIdx, m.targetIdx);
    }

    // Check: for each source relation, the corresponding target relation must exist
    for (const rel of domains.sourceRelations) {
      const mappedFrom = mapLookup.get(rel.from);
      const mappedTo = mapLookup.get(rel.to);
      if (mappedFrom === undefined || mappedTo === undefined) continue;

      const targetHasRelation = domains.targetRelations.some(
        tr => tr.from === mappedFrom && tr.to === mappedTo
      );
      if (!targetHasRelation) return false;
    }

    return true;
  }, [mappings, domains]);

  // Pointer handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;

      // Check if clicking a source object
      for (let i = 0; i < domains.sourceItems.length; i++) {
        const item = domains.sourceItems[i]!;
        const dist = Math.sqrt((nx - item.x) ** 2 + (ny - item.y) ** 2);
        if (dist < 0.05) {
          setDraggingFrom(i);
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          return;
        }
      }
    };

    const handleMove = (e: PointerEvent) => {
      if (draggingFrom === null) return;
      const rect = canvas.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleUp = (e: PointerEvent) => {
      if (draggingFrom === null) return;
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;

      // Check if releasing over a target object
      for (let i = 0; i < domains.targetItems.length; i++) {
        const item = domains.targetItems[i]!;
        const dist = Math.sqrt((nx - item.x) ** 2 + (ny - item.y) ** 2);
        if (dist < 0.05) {
          // Remove existing mapping for this source
          setMappings((prev) => {
            const filtered = prev.filter(m => m.sourceIdx !== draggingFrom);
            return [...filtered, { sourceIdx: draggingFrom!, targetIdx: i }];
          });
          setInteractionCount((prev) => prev + 1);
          break;
        }
      }

      setDraggingFrom(null);
    };

    canvas.addEventListener('pointerdown', handleDown);
    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('pointerup', handleUp);

    return () => {
      canvas.removeEventListener('pointerdown', handleDown);
      canvas.removeEventListener('pointermove', handleMove);
      canvas.removeEventListener('pointerup', handleUp);
    };
  }, [draggingFrom, domains]);

  const handleContinue = useCallback(() => {
    onComplete('touch');
  }, [onComplete]);

  return (
    <div className="phase phase--touch">
      <div className="touch__intro">
        <h2 className="touch__title">Draw the Arrows</h2>
        <p className="touch__description">
          Two worlds. Drag from a dot on the left to a dot on the right to create
          a mapping. If your mapping preserves the relationship arrows, you have
          built a functor — a faithful translation.
        </p>
      </div>

      <div className="touch__visualization">
        <canvas
          ref={canvasRef}
          width={600}
          height={450}
          className="touch__canvas"
          aria-label="Two side-by-side categories — drag from source objects to target objects to build a functor"
        />
        <div className="touch__controls">
          {(['cooking-chemistry', 'music-color', 'seasons-emotions'] as const).map((p) => (
            <button
              key={p}
              className={`touch__op-btn ${preset === p ? 'touch__op-btn--active' : ''}`}
              onClick={() => {
                setPreset(p);
                setInteractionCount((prev) => prev + 1);
              }}
            >
              {p === 'cooking-chemistry' ? 'Cooking / Chemistry' :
               p === 'music-color' ? 'Keys / Colors' :
               'Seasons / Emotions'}
            </button>
          ))}
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
