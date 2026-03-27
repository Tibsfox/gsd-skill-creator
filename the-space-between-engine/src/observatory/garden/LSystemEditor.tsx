// ─── L-System Editor ────────────────────────────────────
// Interactive L-system editor with rule input, preview canvas,
// and preset selector with 6+ example systems.

import React, { useRef, useEffect, useState, useCallback } from 'react';

// ─── L-System Presets ────────────────────────────────────

export interface LSystemPresetConfig {
  id: string;
  name: string;
  axiom: string;
  rules: Record<string, string>;
  angle: number;
  iterations: number;
  description: string;
}

export const LSYSTEM_PRESETS: LSystemPresetConfig[] = [
  {
    id: 'koch-snowflake',
    name: 'Koch Snowflake',
    axiom: 'F--F--F',
    rules: { F: 'F+F--F+F' },
    angle: 60,
    iterations: 4,
    description: 'Classic Koch snowflake fractal with triangular symmetry',
  },
  {
    id: 'sierpinski',
    name: 'Sierpinski Triangle',
    axiom: 'F-G-G',
    rules: { F: 'F-G+F+G-F', G: 'GG' },
    angle: 120,
    iterations: 5,
    description: 'Sierpinski triangle built from recursive subdivision',
  },
  {
    id: 'fractal-tree',
    name: 'Fractal Tree',
    axiom: 'F',
    rules: { F: 'F[+F]F[-F]F' },
    angle: 25,
    iterations: 4,
    description: 'Branching tree structure with symmetric growth',
  },
  {
    id: 'fern',
    name: 'Barnsley Fern',
    axiom: 'X',
    rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' },
    angle: 25,
    iterations: 5,
    description: 'Naturalistic fern frond with asymmetric branching',
  },
  {
    id: 'dragon-curve',
    name: 'Dragon Curve',
    axiom: 'FX',
    rules: { X: 'X+YF+', Y: '-FX-Y' },
    angle: 90,
    iterations: 10,
    description: 'Space-filling dragon curve with 90-degree turns',
  },
  {
    id: 'bush',
    name: 'Bush',
    axiom: 'F',
    rules: { F: 'FF+[+F-F-F]-[-F+F+F]' },
    angle: 22.5,
    iterations: 3,
    description: 'Dense bush-like growth pattern with clustered branching',
  },
  {
    id: 'penrose',
    name: 'Penrose Tiling',
    axiom: '[X]++[X]++[X]++[X]++[X]',
    rules: { F: 'FG', W: 'YF++GF----XF[-YF----WF]++', X: '+YF--GF[---WF--XF]+', Y: '-WF++XF[+++YF++GF]-', G: 'GG' },
    angle: 36,
    iterations: 4,
    description: 'Aperiodic Penrose tiling with five-fold symmetry',
  },
  {
    id: 'hilbert',
    name: 'Hilbert Curve',
    axiom: 'X',
    rules: { X: '-YF+XFX+FY-', Y: '+XF-YFY-FX+' },
    angle: 90,
    iterations: 5,
    description: 'Space-filling Hilbert curve that visits every cell',
  },
];

// ─── L-System Core (standalone for editor) ───────────────

function rewriteSystem(
  axiom: string,
  rules: Record<string, string>,
  iterations: number,
): string {
  let current = axiom;
  for (let i = 0; i < iterations; i++) {
    if (current.length > 100_000) break;
    let next = '';
    for (const ch of current) {
      next += rules[ch] ?? ch;
      if (next.length > 100_000) break;
    }
    current = next;
  }
  return current;
}

interface TurtleSeg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
}

function executeTurtle(
  instructions: string,
  angleDeg: number,
  lineLength: number,
): { segments: TurtleSeg[]; bounds: { minX: number; maxX: number; minY: number; maxY: number } } {
  const angleRad = (angleDeg * Math.PI) / 180;
  const segments: TurtleSeg[] = [];
  const stack: Array<{ x: number; y: number; angle: number }> = [];
  let x = 0;
  let y = 0;
  let angle = -Math.PI / 2;
  let depth = 0;
  const bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };

  for (const ch of instructions) {
    switch (ch) {
      case 'F':
      case 'G': {
        const nx = x + Math.cos(angle) * lineLength;
        const ny = y + Math.sin(angle) * lineLength;
        segments.push({ x1: x, y1: y, x2: nx, y2: ny, depth });
        x = nx;
        y = ny;
        bounds.minX = Math.min(bounds.minX, nx);
        bounds.maxX = Math.max(bounds.maxX, nx);
        bounds.minY = Math.min(bounds.minY, ny);
        bounds.maxY = Math.max(bounds.maxY, ny);
        break;
      }
      case 'f': {
        x += Math.cos(angle) * lineLength;
        y += Math.sin(angle) * lineLength;
        bounds.minX = Math.min(bounds.minX, x);
        bounds.maxX = Math.max(bounds.maxX, x);
        bounds.minY = Math.min(bounds.minY, y);
        bounds.maxY = Math.max(bounds.maxY, y);
        break;
      }
      case '+':
        angle -= angleRad;
        break;
      case '-':
        angle += angleRad;
        break;
      case '[':
        stack.push({ x, y, angle });
        depth++;
        break;
      case ']':
        if (stack.length > 0) {
          const s = stack.pop()!;
          x = s.x;
          y = s.y;
          angle = s.angle;
          depth--;
        }
        break;
    }
  }

  return { segments, bounds };
}

function renderLSystem(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  axiom: string,
  rules: Record<string, string>,
  angle: number,
  iterations: number,
  lineLength: number,
): void {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);

  const str = rewriteSystem(axiom, rules, iterations);
  const { segments, bounds } = executeTurtle(str, angle, lineLength);

  if (segments.length === 0) {
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText('No segments. Check axiom and rules.', 10, h / 2);
    return;
  }

  const bw = bounds.maxX - bounds.minX || 1;
  const bh = bounds.maxY - bounds.minY || 1;
  const pad = 30;
  const scaleX = (w - pad * 2) / bw;
  const scaleY = (h - pad * 2) / bh;
  const s = Math.min(scaleX, scaleY);
  const ox = pad + ((w - pad * 2) - bw * s) / 2 - bounds.minX * s;
  const oy = pad + ((h - pad * 2) - bh * s) / 2 - bounds.minY * s;

  ctx.lineWidth = Math.max(0.5, Math.min(2, 200 / Math.sqrt(segments.length)));
  ctx.lineCap = 'round';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const progress = i / segments.length;
    const hue = (120 + progress * 240) % 360;
    ctx.strokeStyle = `hsl(${hue}, 70%, 55%)`;

    ctx.beginPath();
    ctx.moveTo(seg.x1 * s + ox, seg.y1 * s + oy);
    ctx.lineTo(seg.x2 * s + ox, seg.y2 * s + oy);
    ctx.stroke();
  }

  ctx.fillStyle = '#888';
  ctx.font = '11px monospace';
  ctx.fillText(`Segments: ${segments.length}  |  String: ${str.length} chars`, 8, h - 8);
}

// ─── Component ────────────────────────────────────────────

export interface LSystemEditorProps {
  onSave: (dataUrl: string, title: string) => void;
}

export function LSystemEditor({ onSave }: LSystemEditorProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [axiom, setAxiom] = useState('F');
  const [rules, setRules] = useState<Record<string, string>>({ F: 'F[+F]F[-F]F' });
  const [angle, setAngle] = useState(25);
  const [iterations, setIterations] = useState(4);
  const [lineLength, setLineLength] = useState(10);
  const [selectedPreset, setSelectedPreset] = useState('fractal-tree');

  // Render preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderLSystem(ctx, canvas.width, canvas.height, axiom, rules, angle, iterations, lineLength);
  }, [axiom, rules, angle, iterations, lineLength]);

  const loadPreset = useCallback((presetId: string) => {
    const preset = LSYSTEM_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPreset(presetId);
    setAxiom(preset.axiom);
    setRules({ ...preset.rules });
    setAngle(preset.angle);
    setIterations(preset.iterations);
  }, []);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const preset = LSYSTEM_PRESETS.find((p) => p.id === selectedPreset);
    onSave(dataUrl, preset?.name ?? 'L-System Art');
  }, [selectedPreset, onSave]);

  const updateRule = useCallback((key: string, value: string) => {
    setRules((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addRule = useCallback(() => {
    const usedKeys = new Set(Object.keys(rules));
    // Find next available uppercase letter
    const candidates = 'XYZWABCDE'.split('');
    const nextKey = candidates.find((k) => !usedKeys.has(k)) ?? 'Q';
    setRules((prev) => ({ ...prev, [nextKey]: nextKey }));
  }, [rules]);

  const removeRule = useCallback((key: string) => {
    setRules((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const preset = LSYSTEM_PRESETS.find((p) => p.id === selectedPreset);

  return (
    <div className="lsystem-editor" data-testid="lsystem-editor">
      <div className="lsystem-controls" data-testid="lsystem-controls">
        <label>
          Preset:
          <select
            value={selectedPreset}
            onChange={(e) => loadPreset(e.target.value)}
            data-testid="lsystem-preset-select"
          >
            {LSYSTEM_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        {preset && (
          <p className="lsystem-description">{preset.description}</p>
        )}

        <label>
          Axiom:
          <input
            type="text"
            value={axiom}
            onChange={(e) => setAxiom(e.target.value)}
            data-testid="lsystem-axiom"
          />
        </label>

        <div className="lsystem-rules" data-testid="lsystem-rules">
          <strong>Rules:</strong>
          {Object.entries(rules).map(([key, value]) => (
            <div key={key} className="rule-row">
              <span className="rule-key">{key} &rarr;</span>
              <input
                type="text"
                value={value}
                onChange={(e) => updateRule(key, e.target.value)}
                data-testid={`lsystem-rule-${key}`}
              />
              <button onClick={() => removeRule(key)}>x</button>
            </div>
          ))}
          <button onClick={addRule} data-testid="lsystem-add-rule">
            Add Rule
          </button>
        </div>

        <label>
          Iterations: {iterations}
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            data-testid="lsystem-iterations"
          />
        </label>

        <label>
          Angle: {angle} deg
          <input
            type="range"
            min="0"
            max="180"
            step="1"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            data-testid="lsystem-angle"
          />
        </label>

        <label>
          Line Length: {lineLength}
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={lineLength}
            onChange={(e) => setLineLength(Number(e.target.value))}
            data-testid="lsystem-line-length"
          />
        </label>

        <button onClick={handleExport} data-testid="lsystem-export">
          Export PNG
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="lsystem-preview-canvas"
        data-testid="lsystem-preview-canvas"
      />
    </div>
  );
}
