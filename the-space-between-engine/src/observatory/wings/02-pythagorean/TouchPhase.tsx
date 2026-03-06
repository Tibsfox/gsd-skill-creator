/**
 * Wing 2: Pythagorean Theorem — Touch Phase
 *
 * Two sliders for a and b. Watch c^2 emerge visually.
 * Show the squares on each side. Extend to 3D.
 * Interactive elements: slider a, slider b, 3D toggle.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface TouchPhaseProps {
  onComplete: () => void;
}

export const TouchPhase: React.FC<TouchPhaseProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(3);
  const [b, setB] = useState(4);
  const [show3D, setShow3D] = useState(false);
  const [depth, setDepth] = useState(5);
  const [interactions, setInteractions] = useState(0);

  const c2d = Math.sqrt(a * a + b * b);
  const c3d = Math.sqrt(a * a + b * b + depth * depth);

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

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    const scale = Math.min(w, h) / 20;
    const ox = w * 0.25;
    const oy = h * 0.7;

    const sa = a * scale;
    const sb = b * scale;

    // Draw right triangle
    ctx.strokeStyle = '#4a6a9a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + sa, oy);
    ctx.lineTo(ox + sa, oy - sb);
    ctx.lineTo(ox, oy);
    ctx.stroke();

    // Right angle marker
    const m = 8;
    ctx.beginPath();
    ctx.moveTo(ox + sa - m, oy);
    ctx.lineTo(ox + sa - m, oy - m);
    ctx.lineTo(ox + sa, oy - m);
    ctx.stroke();

    // Square on a
    ctx.fillStyle = 'rgba(100, 180, 255, 0.12)';
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.5)';
    ctx.fillRect(ox, oy, sa, sa);
    ctx.strokeRect(ox, oy, sa, sa);

    // Square on b
    ctx.fillStyle = 'rgba(255, 154, 106, 0.12)';
    ctx.strokeStyle = 'rgba(255, 154, 106, 0.5)';
    ctx.fillRect(ox + sa, oy, sb, -sb);
    ctx.strokeRect(ox + sa, oy, sb, -sb);

    // Square on c (hypotenuse)
    const sc = c2d * scale;
    const dx = sa / (c2d * scale);
    const dy = -sb / (c2d * scale);
    const px = -dy;
    const py = dx;
    const x0 = ox;
    const y0 = oy;
    const x1 = ox + sa;
    const y1 = oy - sb;
    const x2 = x1 + px * sc;
    const y2 = y1 + py * sc;
    const x3 = x0 + px * sc;
    const y3 = y0 + py * sc;

    ctx.fillStyle = 'rgba(255, 221, 87, 0.12)';
    ctx.strokeStyle = 'rgba(255, 221, 87, 0.5)';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Labels
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';

    ctx.fillStyle = '#6ab0ff';
    ctx.fillText(`a = ${a}`, ox + sa / 2, oy - 8);
    ctx.fillText(`a^2 = ${(a * a).toFixed(0)}`, ox + sa / 2, oy + sa / 2 + 5);

    ctx.fillStyle = '#ff9a6a';
    ctx.fillText(`b = ${b}`, ox + sa + sb / 2, oy - sb / 2);
    ctx.textAlign = 'left';
    ctx.fillText(`b^2 = ${(b * b).toFixed(0)}`, ox + sa + 8, oy - sb / 2 + 20);

    ctx.fillStyle = '#ffdd57';
    ctx.textAlign = 'center';
    ctx.fillText(`c = ${c2d.toFixed(2)}`, (x0 + x1) / 2 - 20, (y0 + y1) / 2 - 10);
    ctx.fillText(`c^2 = ${(c2d * c2d).toFixed(0)}`, (x0 + x2) / 2, (y0 + y2) / 2);

    // Equation at bottom
    ctx.fillStyle = '#ccc';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${(a * a).toFixed(0)} + ${(b * b).toFixed(0)} = ${(a * a + b * b).toFixed(0)}`,
      w / 2,
      h - 20,
    );

    // 3D extension
    if (show3D) {
      const sd = depth * scale;
      // Simple isometric projection of the depth axis
      const isoX = -sd * 0.5;
      const isoY = -sd * 0.3;

      ctx.strokeStyle = 'rgba(180, 100, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      // depth line from origin
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + isoX, oy + isoY);
      ctx.stroke();

      // 3D diagonal
      ctx.strokeStyle = 'rgba(180, 100, 255, 0.8)';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(ox + isoX, oy + isoY);
      ctx.lineTo(ox + sa, oy - sb);
      ctx.stroke();

      ctx.fillStyle = '#b464ff';
      ctx.font = '13px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`depth = ${depth}`, ox + isoX - 10, oy + isoY - 10);
      ctx.fillText(`3D diagonal = ${c3d.toFixed(2)}`, w * 0.6, h - 50);
      ctx.fillText(
        `${(a * a).toFixed(0)} + ${(b * b).toFixed(0)} + ${(depth * depth).toFixed(0)} = ${(c3d * c3d).toFixed(0)}`,
        w * 0.6,
        h - 30,
      );
    }
  }, [a, b, show3D, depth, c2d, c3d]);

  const canAdvance = interactions >= 5;

  const track = () => setInteractions((n) => n + 1);

  return (
    <div className="phase touch-phase">
      <h2>Touch the Relationship</h2>

      <p className="narrative-intro">
        Adjust the two sides of the right triangle. Watch how the hypotenuse and its square
        respond. The relationship never breaks.
      </p>

      <canvas
        ref={canvasRef}
        className="wing-canvas"
        style={{ width: '100%', height: '400px', borderRadius: '8px' }}
      />

      <div className="controls" style={{ margin: '16px 0' }}>
        {/* Interactive element 1: slider a */}
        <div style={{ margin: '8px 0' }}>
          <label>
            Side a: {a}
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={a}
              onChange={(e) => { setA(Number(e.target.value)); track(); }}
              style={{ width: '100%' }}
            />
          </label>
        </div>
        {/* Interactive element 2: slider b */}
        <div style={{ margin: '8px 0' }}>
          <label>
            Side b: {b}
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={b}
              onChange={(e) => { setB(Number(e.target.value)); track(); }}
              style={{ width: '100%' }}
            />
          </label>
        </div>

        {/* Interactive element 3: 3D toggle */}
        <div style={{ margin: '8px 0' }}>
          <label style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={show3D}
              onChange={() => { setShow3D((v) => !v); track(); }}
              style={{ marginRight: 8 }}
            />
            Extend to 3D
          </label>
        </div>

        {show3D && (
          <div style={{ margin: '8px 0' }}>
            <label>
              Depth: {depth}
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={depth}
                onChange={(e) => { setDepth(Number(e.target.value)); track(); }}
                style={{ width: '100%' }}
              />
            </label>
          </div>
        )}
      </div>

      <div className="values-display" style={{ fontFamily: 'monospace', margin: '12px 0' }}>
        <div style={{ color: '#6ab0ff' }}>a = {a}, a^2 = {(a * a).toFixed(1)}</div>
        <div style={{ color: '#ff9a6a' }}>b = {b}, b^2 = {(b * b).toFixed(1)}</div>
        <div style={{ color: '#ffdd57' }}>
          c = {c2d.toFixed(3)}, c^2 = {(c2d * c2d).toFixed(1)}
        </div>
        {show3D && (
          <div style={{ color: '#b464ff' }}>
            3D: d = {c3d.toFixed(3)}, d^2 = {(c3d * c3d).toFixed(1)}
          </div>
        )}
      </div>

      <button className="phase-advance" disabled={!canAdvance} onClick={onComplete}>
        {canAdvance ? 'Continue' : `Explore more (${interactions}/5 interactions)...`}
      </button>
    </div>
  );
};

/**
 * Interactive elements for validation:
 * 1. Slider for side a
 * 2. Slider for side b
 * 3. Toggle for 3D extension
 */
export const touchMeta = {
  containsMath: true,
  interactiveElements: 3,
  interactiveElementIds: ['pyth-touch-slider-a', 'pyth-touch-slider-b', 'pyth-touch-3d-toggle'],
  interactiveElementTypes: ['slider', 'slider', 'toggle'] as const,
};
