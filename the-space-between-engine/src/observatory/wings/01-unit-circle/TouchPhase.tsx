/**
 * Wing 1: Unit Circle — Touch Phase
 *
 * Draggable point on unit circle. Real-time sin/cos/tan values.
 * Toggle radians/degrees. Interactive elements: drag point + mode toggle.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface TouchPhaseProps {
  onComplete: () => void;
}

type AngleMode = 'radians' | 'degrees';

export const TouchPhase: React.FC<TouchPhaseProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [theta, setTheta] = useState(Math.PI / 4);
  const [angleMode, setAngleMode] = useState<AngleMode>('radians');
  const [isDragging, setIsDragging] = useState(false);
  const [dragCount, setDragCount] = useState(0);
  const [fullRotation, setFullRotation] = useState(false);
  const thetaHistoryRef = useRef<number[]>([]);

  const sinVal = Math.sin(theta);
  const cosVal = Math.cos(theta);
  const tanVal = Math.cos(theta) !== 0 ? Math.tan(theta) : Infinity;

  const formatAngle = useCallback(
    (rad: number) => {
      if (angleMode === 'degrees') {
        return `${((rad * 180) / Math.PI).toFixed(1)}deg`;
      }
      return `${rad.toFixed(3)} rad`;
    },
    [angleMode],
  );

  // Track cumulative angle for full rotation detection
  useEffect(() => {
    thetaHistoryRef.current.push(theta);
    const history = thetaHistoryRef.current;
    if (history.length > 2) {
      let totalArc = 0;
      for (let i = 1; i < history.length; i++) {
        let delta = history[i] - history[i - 1];
        // Handle wrap-around
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        totalArc += Math.abs(delta);
      }
      if (totalArc >= Math.PI * 2) {
        setFullRotation(true);
      }
    }
  }, [theta]);

  const handleCanvasPointer = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ('touches' in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = clientX - rect.left - rect.width / 2;
      const y = -(clientY - rect.top - rect.height / 2);
      const angle = Math.atan2(y, x);
      setTheta(angle < 0 ? angle + Math.PI * 2 : angle);
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.35;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    // Axes
    ctx.strokeStyle = '#1a2a4a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();

    // Unit circle
    ctx.strokeStyle = '#2a4a7a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Point position
    const px = cx + cosVal * radius;
    const py = cy - sinVal * radius;

    // Triangle from origin to point
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, cy); // cosine leg
    ctx.lineTo(px, py); // sine leg
    ctx.lineTo(cx, cy); // hypotenuse
    ctx.stroke();

    // Cosine leg highlight
    ctx.strokeStyle = '#6ab0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, cy);
    ctx.stroke();

    // Sine leg highlight
    ctx.strokeStyle = '#ff9a6a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, cy);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Arc showing angle
    ctx.strokeStyle = '#ffdd57';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.15, 0, -theta, true);
    ctx.stroke();

    // Draggable point
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#6ab0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Labels
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6ab0ff';
    ctx.fillText(`cos = ${cosVal.toFixed(3)}`, (cx + px) / 2, cy + 20);

    ctx.fillStyle = '#ff9a6a';
    ctx.textAlign = 'right';
    ctx.fillText(`sin = ${sinVal.toFixed(3)}`, px - 12, (cy + py) / 2);

    ctx.fillStyle = '#ffdd57';
    ctx.textAlign = 'left';
    ctx.fillText(formatAngle(theta), cx + radius * 0.18, cy - 8);
  }, [theta, cosVal, sinVal, formatAngle]);

  const canAdvance = dragCount >= 5 && fullRotation;

  return (
    <div className="phase touch-phase">
      <h2>Touch the Circle</h2>

      <p className="narrative-intro">
        Now it is your turn. Drag the point around the circle and feel how angle determines
        everything. Watch the sine and cosine values change in real time.
      </p>

      <canvas
        ref={canvasRef}
        className="wing-canvas"
        style={{ width: '100%', height: '400px', borderRadius: '8px', cursor: 'grab' }}
        onMouseDown={(e) => {
          setIsDragging(true);
          setDragCount((c) => c + 1);
          handleCanvasPointer(e);
        }}
        onMouseMove={(e) => {
          if (isDragging) handleCanvasPointer(e);
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={(e) => {
          e.preventDefault();
          setIsDragging(true);
          setDragCount((c) => c + 1);
          handleCanvasPointer(e);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          if (isDragging) handleCanvasPointer(e);
        }}
        onTouchEnd={() => setIsDragging(false)}
      />

      <div className="values-display" style={{ fontFamily: 'monospace', margin: '16px 0' }}>
        <div>Angle: {formatAngle(theta)}</div>
        <div style={{ color: '#6ab0ff' }}>cos({formatAngle(theta)}) = {cosVal.toFixed(4)}</div>
        <div style={{ color: '#ff9a6a' }}>sin({formatAngle(theta)}) = {sinVal.toFixed(4)}</div>
        <div style={{ color: '#c4ff6a' }}>
          tan({formatAngle(theta)}) ={' '}
          {Math.abs(tanVal) > 1e6 ? 'undefined' : tanVal.toFixed(4)}
        </div>
      </div>

      {/* Interactive element 2: angle mode toggle */}
      <div className="controls" style={{ margin: '12px 0' }}>
        <label style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={angleMode === 'degrees'}
            onChange={() =>
              setAngleMode((m) => (m === 'radians' ? 'degrees' : 'radians'))
            }
            style={{ marginRight: 8 }}
          />
          Show angles in {angleMode === 'radians' ? 'degrees' : 'radians'}
        </label>
      </div>

      <div className="progress-hints" style={{ fontSize: '0.85em', color: '#888' }}>
        <div>Drags: {dragCount}/5 {dragCount >= 5 ? '(done)' : ''}</div>
        <div>Full rotation: {fullRotation ? 'yes' : 'not yet'}</div>
      </div>

      <button className="phase-advance" disabled={!canAdvance} onClick={onComplete}>
        {canAdvance ? 'Continue' : 'Drag the point around the full circle...'}
      </button>
    </div>
  );
};

/**
 * Interactive elements for validation:
 * 1. Draggable point on unit circle
 * 2. Radians/degrees toggle
 */
export const touchMeta = {
  containsMath: true,
  interactiveElements: 2,
  interactiveElementIds: ['uc-touch-drag', 'uc-touch-angle-mode'],
  interactiveElementTypes: ['draggable-point', 'toggle'] as const,
};
