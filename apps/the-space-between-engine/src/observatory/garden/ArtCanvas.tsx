// ─── Art Canvas ─────────────────────────────────────────
// Generative art engine using parametric curves.
// Per-foundation presets drive different mathematical art generators.

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { FoundationId } from '../../types/index.js';

// ─── Art Preset Definitions ──────────────────────────────

export interface ArtPresetConfig {
  id: string;
  name: string;
  foundationId: FoundationId;
  description: string;
  defaultParams: {
    scale: number;
    rotation: number;
    iterations: number;
    colorScheme: string;
  };
}

export const ART_PRESETS: ArtPresetConfig[] = [
  {
    id: 'polar-rose',
    name: 'Polar Rose',
    foundationId: 'unit-circle',
    description: 'Polar rose curves: r = cos(n * theta)',
    defaultParams: { scale: 1, rotation: 0, iterations: 360, colorScheme: 'ocean' },
  },
  {
    id: 'pythagorean-spiral',
    name: 'Pythagorean Spiral',
    foundationId: 'pythagorean',
    description: 'Spiral built from Pythagorean right triangles',
    defaultParams: { scale: 1, rotation: 0, iterations: 200, colorScheme: 'earth' },
  },
  {
    id: 'lissajous',
    name: 'Lissajous Figures',
    foundationId: 'trigonometry',
    description: 'Lissajous curves: x=sin(at+d), y=sin(bt)',
    defaultParams: { scale: 1, rotation: 0, iterations: 500, colorScheme: 'neon' },
  },
  {
    id: 'strange-attractor',
    name: 'Strange Attractor',
    foundationId: 'vector-calculus',
    description: 'Lorenz-like 2D projection of strange attractor',
    defaultParams: { scale: 1, rotation: 0, iterations: 5000, colorScheme: 'fire' },
  },
  {
    id: 'mandelbrot',
    name: 'Mandelbrot Explorer',
    foundationId: 'set-theory',
    description: 'Simplified Mandelbrot set visualization',
    defaultParams: { scale: 1, rotation: 0, iterations: 50, colorScheme: 'deep' },
  },
  {
    id: 'graph-pattern',
    name: 'Graph Pattern',
    foundationId: 'category-theory',
    description: 'Graph-based generative pattern with morphism arrows',
    defaultParams: { scale: 1, rotation: 0, iterations: 100, colorScheme: 'warm' },
  },
  {
    id: 'noise-to-signal',
    name: 'Noise to Signal',
    foundationId: 'information-theory',
    description: 'Random noise resolving into structured patterns',
    defaultParams: { scale: 1, rotation: 0, iterations: 200, colorScheme: 'mono' },
  },
  {
    id: 'lsystem-art',
    name: 'L-System Art',
    foundationId: 'l-systems',
    description: 'L-system growth patterns as generative art',
    defaultParams: { scale: 1, rotation: 0, iterations: 4, colorScheme: 'forest' },
  },
];

const COLOR_SCHEMES: Record<string, string[]> = {
  ocean: ['#1a5276', '#2980b9', '#5dade2', '#85c1e9', '#aed6f1'],
  earth: ['#6e2c00', '#a04000', '#d35400', '#e67e22', '#f5b041'],
  neon: ['#ff00ff', '#00ffff', '#ff0066', '#66ff00', '#ffff00'],
  fire: ['#ff0000', '#ff4400', '#ff8800', '#ffbb00', '#ffff44'],
  deep: ['#000033', '#000066', '#000099', '#0000cc', '#0000ff'],
  warm: ['#d35400', '#e74c3c', '#9b59b6', '#8e44ad', '#f39c12'],
  mono: ['#222', '#444', '#666', '#888', '#aaa'],
  forest: ['#1a4a1a', '#2d7a2d', '#44aa44', '#66cc66', '#88ee88'],
};

// ─── Render Functions ────────────────────────────────────

function renderPolarRose(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  params: ArtPresetConfig['defaultParams'],
): void {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.35 * params.scale;
  const n = 5; // petals
  const colors = COLOR_SCHEMES[params.colorScheme] || COLOR_SCHEMES.ocean;

  ctx.lineWidth = 2;
  for (let layer = 0; layer < 3; layer++) {
    ctx.strokeStyle = colors[layer % colors.length];
    ctx.beginPath();
    for (let i = 0; i <= params.iterations; i++) {
      const theta = (i / params.iterations) * 2 * Math.PI + params.rotation;
      const rr = r * Math.cos((n + layer * 0.5) * theta);
      const x = cx + rr * Math.cos(theta);
      const y = cy + rr * Math.sin(theta);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function renderPythagoreanSpiral(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  params: ArtPresetConfig['defaultParams'],
): void {
  const cx = w / 2;
  const cy = h / 2;
  const colors = COLOR_SCHEMES[params.colorScheme] || COLOR_SCHEMES.earth;
  const scale = params.scale * 2;

  ctx.lineWidth = 1.5;
  let x = cx;
  let y = cy;
  let angle = params.rotation;
  let sideLength = 2;

  for (let i = 0; i < params.iterations; i++) {
    const hyp = Math.sqrt(sideLength * sideLength + 1) * scale;
    const nx = x + Math.cos(angle) * hyp;
    const ny = y + Math.sin(angle) * hyp;

    ctx.strokeStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.stroke();

    // Draw the right-angle square
    const perpAngle = angle + Math.PI / 2;
    const sx = x + Math.cos(perpAngle) * scale;
    const sy = y + Math.sin(perpAngle) * scale;
    ctx.strokeStyle = `${colors[i % colors.length]}66`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(sx, sy);
    ctx.stroke();

    x = nx;
    y = ny;
    angle += Math.atan2(1, sideLength);
    sideLength = hyp / scale;
  }
}

function renderLissajous(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  params: ArtPresetConfig['defaultParams'],
): void {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.35 * params.scale;
  const colors = COLOR_SCHEMES[params.colorScheme] || COLOR_SCHEMES.neon;
  const a = 3;
  const b = 4;
  const delta = params.rotation;

  ctx.lineWidth = 2;
  for (let layer = 0; layer < 3; layer++) {
    ctx.strokeStyle = colors[layer % colors.length];
    ctx.beginPath();
    for (let i = 0; i <= params.iterations; i++) {
      const t = (i / params.iterations) * 2 * Math.PI;
      const x = cx + r * Math.sin(a * t + delta + layer * 0.3);
      const y = cy + r * Math.sin(b * t);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function renderStrangeAttractor(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  params: ArtPresetConfig['defaultParams'],
): void {
  const colors = COLOR_SCHEMES[params.colorScheme] || COLOR_SCHEMES.fire;

  // Simplified Lorenz attractor projected to 2D
  const sigma = 10;
  const rho = 28;
  const beta = 8 / 3;
  const dt = 0.005;

  let x = 1;
  let y = 1;
  let z = 1;

  ctx.lineWidth = 0.5;

  for (let i = 0; i < params.iterations; i++) {
    const dx = sigma * (y - x) * dt;
    const dy = (x * (rho - z) - y) * dt;
    const dz = (x * y - beta * z) * dt;
    x += dx;
    y += dy;
    z += dz;

    // Project to 2D
    const px = w / 2 + x * params.scale * 8 + Math.cos(params.rotation) * 20;
    const py = h / 2 + z * params.scale * 5 - 200 + Math.sin(params.rotation) * 20;

    const progress = i / params.iterations;
    ctx.fillStyle = colors[Math.floor(progress * colors.length) % colors.length];
    ctx.fillRect(px, py, 1.5, 1.5);
  }
}

function renderMandelbrot(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  params: ArtPresetConfig['defaultParams'],
): void {
  const colors = COLOR_SCHEMES[params.colorScheme] || COLOR_SCHEMES.deep;
  const maxIter = params.iterations;
  const zoom = params.scale * 200;
  const offsetX = w / 2 - zoom * 0.7;
  const offsetY = h / 2;

  const step = 3; // pixel step for performance
  for (let px = 0; px < w; px += step) {
    for (let py = 0; py < h; py += step) {
      const x0 = (px - offsetX) / zoom;
      const y0 = (py - offsetY) / zoom;

      let x = 0;
      let y = 0;
      let iter = 0;

      while (x * x + y * y <= 4 && iter < maxIter) {
        const xTemp = x * x - y * y + x0;
        y = 2 * x * y + y0;
        x = xTemp;
        iter++;
      }

      if (iter < maxIter) {
        const colorIdx = Math.floor((iter / maxIter) * colors.length) % colors.length;
        ctx.fillStyle = colors[colorIdx];
        ctx.fillRect(px, py, step, step);
      }
    }
  }
}

function renderGraphPattern(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  params: ArtPresetConfig['defaultParams'],
): void {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.35 * params.scale;
  const colors = COLOR_SCHEMES[params.colorScheme] || COLOR_SCHEMES.warm;
  const nodeCount = Math.min(params.iterations, 20);

  // Place nodes in a circle
  const nodes: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * 2 * Math.PI + params.rotation;
    nodes.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }

  // Draw morphism arrows (connect each node to several others)
  ctx.lineWidth = 1;
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if ((i + j) % 3 === 0 || (i * j) % 5 === 0) {
        ctx.strokeStyle = `${colors[(i + j) % colors.length]}88`;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }

  // Draw nodes
  for (let i = 0; i < nodeCount; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(nodes[i].x, nodes[i].y, 6, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function renderNoiseToSignal(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  params: ArtPresetConfig['defaultParams'],
): void {
  const colors = COLOR_SCHEMES[params.colorScheme] || COLOR_SCHEMES.mono;
  const step = 4;

  // Seeded pseudo-random for deterministic output
  let seed = Math.floor(params.rotation * 1000 + 42);
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };

  for (let px = 0; px < w; px += step) {
    for (let py = 0; py < h; py += step) {
      const xNorm = px / w;
      const yNorm = py / h;

      // Signal: structured pattern (sine grid)
      const signal =
        Math.sin(xNorm * params.iterations * 0.3 * params.scale) *
        Math.cos(yNorm * params.iterations * 0.3 * params.scale);

      // Noise: random
      const noise = rand() * 2 - 1;

      // Blend based on position (left=noisy, right=signal)
      const blend = xNorm;
      const value = noise * (1 - blend) + signal * blend;

      const brightness = Math.floor(((value + 1) / 2) * 255);
      const colorIdx = Math.floor(((value + 1) / 2) * colors.length) % colors.length;
      ctx.fillStyle = colors[colorIdx] || `rgb(${brightness},${brightness},${brightness})`;
      ctx.fillRect(px, py, step, step);
    }
  }
}

function renderLSystemArt(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  params: ArtPresetConfig['defaultParams'],
): void {
  const colors = COLOR_SCHEMES[params.colorScheme] || COLOR_SCHEMES.forest;

  // Simple L-system: F=F[+F]F[-F]F
  let current = 'F';
  const iterations = Math.min(params.iterations, 5);
  for (let i = 0; i < iterations; i++) {
    let next = '';
    for (const ch of current) {
      if (ch === 'F') next += 'F[+F]F[-F]F';
      else next += ch;
      if (next.length > 50000) break;
    }
    current = next;
  }

  // Turtle render
  const angle = 25 * (Math.PI / 180);
  const lineLen = Math.min(w, h) * 0.008 * params.scale;
  let tx = w / 2;
  let ty = h * 0.85;
  let dir = -Math.PI / 2 + params.rotation;
  const stack: Array<{ x: number; y: number; angle: number }> = [];

  ctx.lineWidth = 1;
  let segIdx = 0;

  for (const ch of current) {
    switch (ch) {
      case 'F': {
        const nx = tx + Math.cos(dir) * lineLen;
        const ny = ty + Math.sin(dir) * lineLen;
        ctx.strokeStyle = colors[segIdx % colors.length];
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        tx = nx;
        ty = ny;
        segIdx++;
        break;
      }
      case '+':
        dir -= angle;
        break;
      case '-':
        dir += angle;
        break;
      case '[':
        stack.push({ x: tx, y: ty, angle: dir });
        break;
      case ']':
        if (stack.length > 0) {
          const s = stack.pop()!;
          tx = s.x;
          ty = s.y;
          dir = s.angle;
        }
        break;
    }
  }
}

const RENDER_MAP: Record<string, (ctx: CanvasRenderingContext2D, w: number, h: number, params: ArtPresetConfig['defaultParams']) => void> = {
  'polar-rose': renderPolarRose,
  'pythagorean-spiral': renderPythagoreanSpiral,
  'lissajous': renderLissajous,
  'strange-attractor': renderStrangeAttractor,
  'mandelbrot': renderMandelbrot,
  'graph-pattern': renderGraphPattern,
  'noise-to-signal': renderNoiseToSignal,
  'lsystem-art': renderLSystemArt,
};

// ─── Component ────────────────────────────────────────────

export interface ArtCanvasProps {
  foundation: FoundationId;
  onSave: (dataUrl: string, title: string) => void;
}

export function ArtCanvas({ foundation, onSave }: ArtCanvasProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>(() => {
    const match = ART_PRESETS.find((p) => p.foundationId === foundation);
    return match?.id ?? ART_PRESETS[0].id;
  });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [iterations, setIterations] = useState<number>(() => {
    const match = ART_PRESETS.find((p) => p.id === selectedPreset);
    return match?.defaultParams.iterations ?? 360;
  });
  const [colorScheme, setColorScheme] = useState<string>(() => {
    const match = ART_PRESETS.find((p) => p.id === selectedPreset);
    return match?.defaultParams.colorScheme ?? 'ocean';
  });

  // Re-render canvas when params change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, w, h);

    const renderFn = RENDER_MAP[selectedPreset];
    if (renderFn) {
      renderFn(ctx, w, h, { scale, rotation, iterations, colorScheme });
    }
  }, [selectedPreset, scale, rotation, iterations, colorScheme]);

  // Update preset when foundation changes
  useEffect(() => {
    const match = ART_PRESETS.find((p) => p.foundationId === foundation);
    if (match) {
      setSelectedPreset(match.id);
      setScale(match.defaultParams.scale);
      setRotation(match.defaultParams.rotation);
      setIterations(match.defaultParams.iterations);
      setColorScheme(match.defaultParams.colorScheme);
    }
  }, [foundation]);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const preset = ART_PRESETS.find((p) => p.id === selectedPreset);
    onSave(dataUrl, preset?.name ?? 'Generative Art');
  }, [selectedPreset, onSave]);

  const preset = ART_PRESETS.find((p) => p.id === selectedPreset);

  return (
    <div className="art-canvas" data-testid="art-canvas">
      <div className="art-controls" data-testid="art-controls">
        <label>
          Preset:
          <select
            value={selectedPreset}
            onChange={(e) => {
              const p = ART_PRESETS.find((pr) => pr.id === e.target.value);
              if (p) {
                setSelectedPreset(p.id);
                setScale(p.defaultParams.scale);
                setRotation(p.defaultParams.rotation);
                setIterations(p.defaultParams.iterations);
                setColorScheme(p.defaultParams.colorScheme);
              }
            }}
            data-testid="art-preset-select"
          >
            {ART_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.foundationId})
              </option>
            ))}
          </select>
        </label>

        <label>
          Color Scheme:
          <select
            value={colorScheme}
            onChange={(e) => setColorScheme(e.target.value)}
            data-testid="art-color-scheme"
          >
            {Object.keys(COLOR_SCHEMES).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label>
          Scale: {scale.toFixed(1)}
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
          />
        </label>

        <label>
          Rotation: {rotation.toFixed(2)}
          <input
            type="range"
            min="0"
            max={String(2 * Math.PI)}
            step="0.05"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
          />
        </label>

        <label>
          Iterations: {iterations}
          <input
            type="range"
            min="1"
            max="5000"
            step="1"
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
          />
        </label>

        <button onClick={handleExport} data-testid="art-export">
          Export PNG
        </button>
      </div>

      {preset && (
        <p className="art-description" data-testid="art-description">
          {preset.description}
        </p>
      )}

      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="art-render-canvas"
        data-testid="art-render-canvas"
      />
    </div>
  );
}
