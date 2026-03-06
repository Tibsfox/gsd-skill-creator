// Wing 1 — Touch Phase: "Your Hand on the Circle"
// Draggable point on the unit circle with real-time readouts.
// Labels: plain-language FIRST, then notation in parentheses.
// Toggle radians/degrees. Completion: >= 3 parameter changes OR >= 2min.

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
  const [useRadians, setUseRadians] = useState(false);
  const [showTan, setShowTan] = useState(false);
  const [angle, setAngle] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const draggingRef = useRef(false);
  const angleRef = useRef(0);

  // Sync ref
  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Completion: 3 interactions OR 120s
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
      const a = angleRef.current;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      const radius = Math.min(w, h) * 0.32;
      const cx = w / 2;
      const cy = h / 2;
      const cosVal = Math.cos(a);
      const sinVal = Math.sin(a);
      const px = cx + cosVal * radius;
      const py = cy - sinVal * radius;

      // Axes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - radius - 20, cy);
      ctx.lineTo(cx + radius + 20, cy);
      ctx.moveTo(cx, cy - radius - 20);
      ctx.lineTo(cx, cy + radius + 20);
      ctx.stroke();

      // Circle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Angle arc
      ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.12, 0, -a, true);
      ctx.stroke();

      // Radius line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Cosine (horizontal)
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + cosVal * radius, cy);
      ctx.stroke();

      // Sine (vertical)
      ctx.strokeStyle = '#f06292';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + cosVal * radius, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Tangent line
      if (showTan && Math.abs(cosVal) > 0.01) {
        const tanVal = sinVal / cosVal;
        const tanEndY = Math.max(-radius * 2, Math.min(radius * 2, tanVal * radius));
        ctx.strokeStyle = '#a5d6a7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + radius, cy);
        ctx.lineTo(cx + radius, cy - tanEndY);
        ctx.stroke();
      }

      // Draggable point
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffcc80';
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();

      // Instruction hint
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Drag the point around the circle', cx, cy + radius + 35);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [showTan]);

  // Pointer events for dragging
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getAngleFromEvent = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left - canvas.width / 2;
      const y = -(clientY - rect.top - canvas.height / 2);
      let a = Math.atan2(y, x);
      if (a < 0) a += Math.PI * 2;
      return a;
    };

    const onDown = (e: PointerEvent) => {
      draggingRef.current = true;
      const a = getAngleFromEvent(e.clientX, e.clientY);
      setAngle(a);
      setInteractionCount((prev) => prev + 1);
    };

    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const a = getAngleFromEvent(e.clientX, e.clientY);
      setAngle(a);
    };

    const onUp = () => {
      draggingRef.current = false;
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const sinVal = Math.sin(angle);
  const cosVal = Math.cos(angle);
  const tanVal = Math.abs(cosVal) > 0.001 ? Math.tan(angle) : NaN;
  const angleDeg = (angle * 180) / Math.PI;

  const handleToggleUnits = useCallback(() => {
    setUseRadians((prev) => !prev);
    setInteractionCount((prev) => prev + 1);
  }, []);

  const handleToggleTan = useCallback(() => {
    setShowTan((prev) => !prev);
    setInteractionCount((prev) => prev + 1);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('touch');
  }, [onComplete]);

  return (
    <div className="phase phase--touch">
      <div className="touch__intro">
        <h2>Your Hand on the Circle</h2>
        <p>
          Drag the point. Watch the values change. You are controlling one thing
          — the angle — and producing three outputs.
        </p>
      </div>

      <div className="touch__workspace">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="touch__canvas"
          aria-label="Interactive unit circle — drag the point to change the angle"
        />

        <div className="touch__readout" aria-live="polite">
          <div className="touch__readout-item touch__readout-item--angle">
            <span className="touch__label">
              Angle: {useRadians ? angle.toFixed(3) + ' rad' : angleDeg.toFixed(1) + '\u00B0'}
            </span>
            <span className="touch__notation">(\u03B8)</span>
          </div>
          <div className="touch__readout-item touch__readout-item--height">
            <span className="touch__label">
              Height: {sinVal.toFixed(4)}
            </span>
            <span className="touch__notation">(sin \u03B8)</span>
          </div>
          <div className="touch__readout-item touch__readout-item--side">
            <span className="touch__label">
              Side position: {cosVal.toFixed(4)}
            </span>
            <span className="touch__notation">(cos \u03B8)</span>
          </div>
          {showTan && (
            <div className="touch__readout-item touch__readout-item--slope">
              <span className="touch__label">
                Slope: {isNaN(tanVal) ? 'undefined' : tanVal.toFixed(4)}
              </span>
              <span className="touch__notation">(tan \u03B8)</span>
            </div>
          )}
        </div>

        <div className="touch__controls">
          <button
            className="touch__toggle-btn"
            onClick={handleToggleUnits}
          >
            {useRadians ? 'Show degrees' : 'Show radians'}
          </button>
          <button
            className="touch__toggle-btn"
            onClick={handleToggleTan}
          >
            {showTan ? 'Hide slope (tan)' : 'Show slope (tan)'}
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
