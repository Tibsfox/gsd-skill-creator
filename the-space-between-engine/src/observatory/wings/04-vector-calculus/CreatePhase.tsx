// Wing 4 — Create Phase: "Design a Field"
// Create a vector field that guides particles to form a pattern.
// Produces a saveable Creation. Completion: produce creation OR skip.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState, Creation } from '@/types/index';

interface CreatePhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onCreationSave: (creation: Creation) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

interface Attractor {
  x: number;
  y: number;
  type: 'attract' | 'repel' | 'vortex';
  strength: number;
}

interface Particle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

export function CreatePhase({
  onComplete,
  onCreationSave,
}: CreatePhaseProps): React.JSX.Element {
  const [attractors, setAttractors] = useState<Attractor[]>([
    { x: 0.3, y: 0.5, type: 'attract', strength: 1 },
    { x: 0.7, y: 0.5, type: 'vortex', strength: 1 },
  ]);
  const [placementType, setPlacementType] = useState<Attractor['type']>('attract');
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const attractorsRef = useRef(attractors);

  useEffect(() => {
    attractorsRef.current = attractors;
  }, [attractors]);

  // Initialize particles
  useEffect(() => {
    particlesRef.current = [];
    for (let i = 0; i < 400; i++) {
      particlesRef.current.push({
        x: Math.random(), y: Math.random(),
        age: 0, maxAge: 3 + Math.random() * 5,
      });
    }
  }, []);

  const evaluateField = useCallback(
    (nx: number, ny: number): [number, number] => {
      let fx = 0;
      let fy = 0;
      for (const a of attractorsRef.current) {
        const dx = a.x - nx;
        const dy = a.y - ny;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const safeDist = Math.max(dist, 0.02);
        const force = a.strength / (safeDist * safeDist * 10);

        switch (a.type) {
          case 'attract':
            fx += (dx / safeDist) * force;
            fy += (dy / safeDist) * force;
            break;
          case 'repel':
            fx -= (dx / safeDist) * force;
            fy -= (dy / safeDist) * force;
            break;
          case 'vortex':
            fx += (-dy / safeDist) * force;
            fy += (dx / safeDist) * force;
            break;
        }
      }
      return [fx, fy];
    },
    []
  );

  // Canvas + animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Fade
      ctx.fillStyle = 'rgba(10, 10, 26, 0.08)';
      ctx.fillRect(0, 0, w, h);

      // Field arrows (subtle)
      const arrowGrid = 15;
      const arrowLen = Math.min(w, h) / arrowGrid * 0.25;
      ctx.lineWidth = 1;
      for (let gx = 0; gx < arrowGrid; gx++) {
        for (let gy = 0; gy < arrowGrid; gy++) {
          const nx = (gx + 0.5) / arrowGrid;
          const ny = (gy + 0.5) / arrowGrid;
          const [fdx, fdy] = evaluateField(nx, ny);
          const mag = Math.sqrt(fdx * fdx + fdy * fdy);
          if (mag < 0.001) continue;
          const ndx = fdx / mag;
          const ndy = fdy / mag;
          const alpha = Math.min(0.15, mag * 0.05);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          const sx = nx * w;
          const sy = ny * h;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + ndx * arrowLen, sy + ndy * arrowLen);
          ctx.stroke();
        }
      }

      // Particles
      const dt = 0.016 * 0.25;
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i]!;
        p.age += 0.016;
        if (p.age > p.maxAge || p.x < -0.15 || p.x > 1.15 || p.y < -0.15 || p.y > 1.15) {
          particlesRef.current[i] = {
            x: Math.random(), y: Math.random(),
            age: 0, maxAge: 3 + Math.random() * 5,
          };
          continue;
        }
        const [fdx, fdy] = evaluateField(p.x, p.y);
        p.x += fdx * dt;
        p.y += fdy * dt;

        const alpha = Math.min(1, (1 - p.age / p.maxAge) * 1.5);
        ctx.fillStyle = `rgba(79, 195, 247, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Attractor markers
      for (const a of attractorsRef.current) {
        const ax = a.x * w;
        const ay = a.y * h;
        const colors = {
          attract: '#4fc3f7',
          repel: '#ef5350',
          vortex: '#a5d6a7',
        };
        ctx.fillStyle = colors[a.type];
        ctx.beginPath();
        ctx.arc(ax, ay, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = colors[a.type] + '66';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ax, ay, 15, 0, Math.PI * 2);
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(a.type, ax, ay - 20);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [evaluateField]);

  // Click to place attractors
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      setAttractors((prev) => [
        ...prev,
        { x: nx, y: ny, type: placementType, strength: 1 },
      ]);
    };

    canvas.addEventListener('click', onClick);
    return () => canvas.removeEventListener('click', onClick);
  }, [placementType]);

  const handleClearAttractors = useCallback(() => {
    setAttractors([]);
  }, []);

  const handleSave = useCallback(() => {
    const creation: Creation = {
      id: `vc-create-${Date.now()}`,
      foundationId: 'vector-calculus',
      type: 'visualization',
      title: title || `Field Design (${attractors.length} sources)`,
      data: JSON.stringify({
        attractors: attractors.map((a) => ({
          x: a.x,
          y: a.y,
          type: a.type,
          strength: a.strength,
        })),
      }),
      createdAt: new Date().toISOString(),
      shared: false,
    };
    onCreationSave(creation);
    setSaved(true);
  }, [title, attractors, onCreationSave]);

  const handleSkip = useCallback(() => {
    onComplete('create');
  }, [onComplete]);

  const handleContinue = useCallback(() => {
    onComplete('create');
  }, [onComplete]);

  return (
    <div className="phase phase--create">
      <div className="create__intro">
        <h2>Design a Field</h2>
        <p>
          Click on the canvas to place field sources — attractors that pull
          particles in, repellers that push them away, and vortices that make
          them spin. Create a pattern. Guide the particles to form something
          meaningful.
        </p>
      </div>

      <div className="create__workspace">
        <canvas
          ref={canvasRef}
          width={550}
          height={550}
          className="create__canvas"
          aria-label="Design your own vector field — click to place attractors, repellers, and vortices"
        />

        <div className="create__controls">
          <div className="create__placement-type">
            <span className="create__control-label">Place:</span>
            {(['attract', 'repel', 'vortex'] as Attractor['type'][]).map(
              (type) => (
                <button
                  key={type}
                  className={[
                    'create__type-btn',
                    placementType === type ? 'create__type-btn--active' : '',
                  ].join(' ')}
                  onClick={() => setPlacementType(type)}
                >
                  {type}
                </button>
              )
            )}
          </div>

          <button className="create__clear-btn" onClick={handleClearAttractors}>
            Clear all
          </button>

          <p className="create__source-count">
            Sources: {attractors.length}
          </p>

          <label className="create__control">
            <span className="create__control-label">Name your field</span>
            <input
              type="text"
              className="create__title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Galaxy Formation"
            />
          </label>

          <div className="create__actions">
            <button
              className="create__save-btn"
              onClick={handleSave}
              disabled={saved}
            >
              {saved ? 'Saved' : 'Save field'}
            </button>
          </div>
        </div>
      </div>

      <div className="create__continue">
        {saved ? (
          <button className="phase__continue-btn" onClick={handleContinue}>
            Complete Wing
          </button>
        ) : (
          <button className="phase__skip-btn" onClick={handleSkip}>
            Skip creation
          </button>
        )}
      </div>
    </div>
  );
}
