// Wing 2 — Touch Phase: "Change the Sides, Watch the Distance"
// Two sliders (a, b), watch c emerge. Extend to 3D then n-D.
// Labels: plain-language FIRST, then notation in parentheses.
// Completion: >= 3 parameter changes OR >= 2min.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';

interface TouchPhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

export function TouchPhase({
  onComplete,
}: TouchPhaseProps): React.JSX.Element {
  const [timeSpent, setTimeSpent] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [sideA, setSideA] = useState(3);
  const [sideB, setSideB] = useState(4);
  const [dimensions, setDimensions] = useState(2);
  const [sideZ, setSideZ] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const sideC = dimensions === 2
    ? Math.sqrt(sideA * sideA + sideB * sideB)
    : Math.sqrt(sideA * sideA + sideB * sideB + sideZ * sideZ);

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

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      const maxSide = 12;
      const scale = Math.min(w, h) * 0.6 / maxSide;
      const ox = w * 0.25;
      const oy = h * 0.75;

      if (dimensions === 2) {
        // Right triangle
        const ax = ox + sideA * scale;
        const by = oy - sideB * scale;

        // Side a (horizontal)
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ax, oy);
        ctx.stroke();

        // Side b (vertical)
        ctx.strokeStyle = '#f06292';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ax, oy);
        ctx.lineTo(ax, by);
        ctx.stroke();

        // Hypotenuse c
        ctx.strokeStyle = '#ffcc80';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ax, by);
        ctx.stroke();

        // Right angle marker
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax - 10, oy);
        ctx.lineTo(ax - 10, oy - 10);
        ctx.lineTo(ax, oy - 10);
        ctx.stroke();

        // Vertex dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ox, oy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ax, oy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ax, by, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 3D wireframe — simple isometric projection
        const isoX = (x: number, y: number, _z: number) => ox + (x - y) * scale * 0.7;
        const isoY = (x: number, y: number, z: number) => oy - z * scale - (x + y) * scale * 0.35;

        // Edges from origin
        // Side a along x
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(isoX(0, 0, 0), isoY(0, 0, 0));
        ctx.lineTo(isoX(sideA, 0, 0), isoY(sideA, 0, 0));
        ctx.stroke();

        // Side b along y
        ctx.strokeStyle = '#f06292';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(isoX(sideA, 0, 0), isoY(sideA, 0, 0));
        ctx.lineTo(isoX(sideA, sideB, 0), isoY(sideA, sideB, 0));
        ctx.stroke();

        // Side z upward
        ctx.strokeStyle = '#a5d6a7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(isoX(sideA, sideB, 0), isoY(sideA, sideB, 0));
        ctx.lineTo(isoX(sideA, sideB, sideZ), isoY(sideA, sideB, sideZ));
        ctx.stroke();

        // Space diagonal
        ctx.strokeStyle = '#ffcc80';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(isoX(0, 0, 0), isoY(0, 0, 0));
        ctx.lineTo(isoX(sideA, sideB, sideZ), isoY(sideA, sideB, sideZ));
        ctx.stroke();

        // Faint guide lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        // xy plane diagonal
        ctx.beginPath();
        ctx.moveTo(isoX(sideA, 0, 0), isoY(sideA, 0, 0));
        ctx.lineTo(isoX(sideA, sideB, 0), isoY(sideA, sideB, 0));
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [sideA, sideB, sideZ, dimensions]);

  const handleChangeA = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSideA(Number(e.target.value));
    setInteractionCount((prev) => prev + 1);
  }, []);

  const handleChangeB = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSideB(Number(e.target.value));
    setInteractionCount((prev) => prev + 1);
  }, []);

  const handleChangeZ = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSideZ(Number(e.target.value));
    setInteractionCount((prev) => prev + 1);
  }, []);

  const handleToggleDimensions = useCallback(() => {
    setDimensions((prev) => (prev === 2 ? 3 : 2));
    setInteractionCount((prev) => prev + 1);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('touch');
  }, [onComplete]);

  return (
    <div className="phase phase--touch">
      <div className="touch__intro">
        <h2>Change the Sides, Watch the Distance</h2>
        <p>
          Move the sliders. The straight-line distance — the path a bird would
          fly — adjusts itself. It never negotiates. It is always exactly
          right.
        </p>
      </div>

      <div className="touch__workspace">
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          className="touch__canvas"
          aria-label="Interactive right triangle — adjust sides a and b, watch c change"
        />

        <div className="touch__readout" aria-live="polite">
          <div className="touch__readout-item">
            <span className="touch__label">
              Horizontal side: {sideA.toFixed(1)}
            </span>
            <span className="touch__notation">(a)</span>
          </div>
          <div className="touch__readout-item">
            <span className="touch__label">
              Vertical side: {sideB.toFixed(1)}
            </span>
            <span className="touch__notation">(b)</span>
          </div>
          {dimensions === 3 && (
            <div className="touch__readout-item">
              <span className="touch__label">
                Depth: {sideZ.toFixed(1)}
              </span>
              <span className="touch__notation">(z)</span>
            </div>
          )}
          <div className="touch__readout-item touch__readout-item--result">
            <span className="touch__label">
              Straight-line distance: {sideC.toFixed(4)}
            </span>
            <span className="touch__notation">(c)</span>
          </div>
          <div className="touch__readout-item touch__readout-item--check">
            <span className="touch__label">
              Sum of squared sides:{' '}
              {dimensions === 2
                ? (sideA * sideA + sideB * sideB).toFixed(2)
                : (sideA * sideA + sideB * sideB + sideZ * sideZ).toFixed(2)}
            </span>
            <span className="touch__notation">
              ({dimensions === 2 ? 'a\u00B2 + b\u00B2' : 'a\u00B2 + b\u00B2 + z\u00B2'})
            </span>
          </div>
          <div className="touch__readout-item touch__readout-item--check">
            <span className="touch__label">
              Squared distance: {(sideC * sideC).toFixed(2)}
            </span>
            <span className="touch__notation">(c\u00B2)</span>
          </div>
        </div>

        <div className="touch__controls">
          <label className="touch__slider">
            <span>Side a</span>
            <input
              type="range"
              min={0.5}
              max={10}
              step={0.1}
              value={sideA}
              onChange={handleChangeA}
            />
          </label>
          <label className="touch__slider">
            <span>Side b</span>
            <input
              type="range"
              min={0.5}
              max={10}
              step={0.1}
              value={sideB}
              onChange={handleChangeB}
            />
          </label>
          {dimensions === 3 && (
            <label className="touch__slider">
              <span>Side z</span>
              <input
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={sideZ}
                onChange={handleChangeZ}
              />
            </label>
          )}
          <button
            className="touch__toggle-btn"
            onClick={handleToggleDimensions}
          >
            {dimensions === 2 ? 'Extend to 3D' : 'Back to 2D'}
          </button>
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
