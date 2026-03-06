// Wing 8 — Create Phase: "Grow Your Garden"
// Design an L-system plant. Name it. Export as SVG art.
// The learner becomes the gardener. The rule they write IS the seed.
// Completion: save a Creation with type 'l-system'.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState, Creation } from '@/types/index';

interface CreatePhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onCreationSave: (creation: Creation) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

interface TurtleState {
  x: number;
  y: number;
  angle: number;
}

function parseRules(input: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = input.split(',');
  for (const part of parts) {
    const [key, value] = part.split('=').map(s => s.trim());
    if (key && value) {
      result[key] = value;
    }
  }
  return result;
}

function generateLSystem(axiom: string, rules: Record<string, string>, iterations: number): string {
  let current = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = '';
    for (const ch of current) {
      next += rules[ch] ?? ch;
    }
    current = next;
    if (current.length > 300000) break;
  }
  return current;
}

interface BoundsResult {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function computeBounds(
  lString: string, angleDeg: number, lineLen: number,
): BoundsResult {
  const angleRad = (angleDeg * Math.PI) / 180;
  const stack: TurtleState[] = [];
  let state: TurtleState = { x: 0, y: 0, angle: -Math.PI / 2 };
  let minX = 0, minY = 0, maxX = 0, maxY = 0;

  for (const ch of lString) {
    switch (ch) {
      case 'F': case 'G':
        state.x += Math.cos(state.angle) * lineLen;
        state.y += Math.sin(state.angle) * lineLen;
        minX = Math.min(minX, state.x);
        minY = Math.min(minY, state.y);
        maxX = Math.max(maxX, state.x);
        maxY = Math.max(maxY, state.y);
        break;
      case '+': state.angle += angleRad; break;
      case '-': state.angle -= angleRad; break;
      case '[': stack.push({ ...state }); break;
      case ']': { const p = stack.pop(); if (p) state = p; break; }
    }
  }
  return { minX, minY, maxX, maxY };
}

interface PlantTemplate {
  name: string;
  axiom: string;
  rules: string;
  angle: number;
  iterations: number;
}

const PLANT_TEMPLATES: PlantTemplate[] = [
  { name: 'Sapling', axiom: 'F', rules: 'F=F[+F]F[-F]F', angle: 25, iterations: 4 },
  { name: 'Willow', axiom: 'X', rules: 'X=F[+X][-X]FX, F=FF', angle: 20, iterations: 5 },
  { name: 'Fern', axiom: 'X', rules: 'X=F+[[X]-X]-F[-FX]+X, F=FF', angle: 25, iterations: 5 },
  { name: 'Blank seed', axiom: 'F', rules: 'F=FF', angle: 30, iterations: 3 },
];

export function CreatePhase({
  foundationId,
  onComplete,
  onCreationSave,
}: CreatePhaseProps): React.JSX.Element {
  const [plantName, setPlantName] = useState('');
  const [axiom, setAxiom] = useState('X');
  const [rulesStr, setRulesStr] = useState('X=F+[[X]-X]-F[-FX]+X, F=FF');
  const [angle, setAngle] = useState(25);
  const [iterations, setIterations] = useState(5);
  const [colorHueStart, setColorHueStart] = useState(100);
  const [colorHueEnd, setColorHueEnd] = useState(160);
  const [saved, setSaved] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render the plant
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    const rules = parseRules(rulesStr);
    const lString = generateLSystem(axiom, rules, iterations);
    const lineLen = 5;
    const bounds = computeBounds(lString, angle, lineLen);

    const bw = bounds.maxX - bounds.minX;
    const bh = bounds.maxY - bounds.minY;
    if (bw === 0 && bh === 0) {
      ctx.font = '14px Georgia, serif';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('Write a rule to plant your seed.', w / 2, h / 2);
      return;
    }

    const margin = 30;
    const availW = w - margin * 2;
    const availH = h - margin * 2;
    const scale = Math.min(availW / (bw || 1), availH / (bh || 1));
    const offsetX = margin + (availW - bw * scale) / 2 - bounds.minX * scale;
    const offsetY = margin + (availH - bh * scale) / 2 - bounds.minY * scale;

    const angleRad = (angle * Math.PI) / 180;
    const stack: TurtleState[] = [];
    let state: TurtleState = { x: 0, y: 0, angle: -Math.PI / 2 };

    let totalSeg = 0;
    for (const ch of lString) if (ch === 'F' || ch === 'G') totalSeg++;

    let segIdx = 0;
    ctx.lineWidth = Math.max(0.5, 2 - iterations * 0.2);

    for (const ch of lString) {
      switch (ch) {
        case 'F': case 'G': {
          const nx = state.x + Math.cos(state.angle) * lineLen;
          const ny = state.y + Math.sin(state.angle) * lineLen;
          const t = segIdx / (totalSeg || 1);
          const hue = colorHueStart + t * (colorHueEnd - colorHueStart);
          ctx.strokeStyle = `hsla(${hue % 360}, 55%, 48%, 0.85)`;
          ctx.beginPath();
          ctx.moveTo(state.x * scale + offsetX, state.y * scale + offsetY);
          ctx.lineTo(nx * scale + offsetX, ny * scale + offsetY);
          ctx.stroke();
          state.x = nx; state.y = ny;
          segIdx++;
          break;
        }
        case '+': state.angle += angleRad; break;
        case '-': state.angle -= angleRad; break;
        case '[': stack.push({ ...state }); break;
        case ']': { const p = stack.pop(); if (p) state = p; break; }
      }
    }

    // Plant name label
    if (plantName) {
      ctx.font = '13px Georgia, serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'center';
      ctx.fillText(plantName, w / 2, h - 10);
    }
  }, [axiom, rulesStr, angle, iterations, colorHueStart, colorHueEnd, plantName]);

  const loadTemplate = useCallback((template: PlantTemplate) => {
    setAxiom(template.axiom);
    setRulesStr(template.rules);
    setAngle(template.angle);
    setIterations(template.iterations);
  }, []);

  const generateSVG = useCallback((): string => {
    const rules = parseRules(rulesStr);
    const lString = generateLSystem(axiom, rules, iterations);
    const lineLen = 5;
    const bounds = computeBounds(lString, angle, lineLen);

    const bw = bounds.maxX - bounds.minX;
    const bh = bounds.maxY - bounds.minY;
    const padding = 20;
    const svgW = Math.max(100, Math.round(bw + padding * 2));
    const svgH = Math.max(100, Math.round(bh + padding * 2));
    const offX = padding - bounds.minX;
    const offY = padding - bounds.minY;

    const angleRad = (angle * Math.PI) / 180;
    const stack: TurtleState[] = [];
    let state: TurtleState = { x: 0, y: 0, angle: -Math.PI / 2 };

    let totalSeg = 0;
    for (const ch of lString) if (ch === 'F' || ch === 'G') totalSeg++;

    let segIdx = 0;
    const lines: string[] = [];

    for (const ch of lString) {
      switch (ch) {
        case 'F': case 'G': {
          const nx = state.x + Math.cos(state.angle) * lineLen;
          const ny = state.y + Math.sin(state.angle) * lineLen;
          const t = segIdx / (totalSeg || 1);
          const hue = colorHueStart + t * (colorHueEnd - colorHueStart);
          lines.push(
            `<line x1="${(state.x + offX).toFixed(2)}" y1="${(state.y + offY).toFixed(2)}" ` +
            `x2="${(nx + offX).toFixed(2)}" y2="${(ny + offY).toFixed(2)}" ` +
            `stroke="hsl(${Math.round(hue % 360)}, 55%, 48%)" stroke-width="1" stroke-opacity="0.85"/>`
          );
          state.x = nx; state.y = ny;
          segIdx++;
          break;
        }
        case '+': state.angle += angleRad; break;
        case '-': state.angle -= angleRad; break;
        case '[': stack.push({ ...state }); break;
        case ']': { const p = stack.pop(); if (p) state = p; break; }
      }
    }

    const title = plantName || 'L-System Plant';
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}">`,
      `  <title>${title}</title>`,
      `  <rect width="100%" height="100%" fill="#0a0a1a"/>`,
      ...lines.map(l => `  ${l}`),
      `</svg>`,
    ].join('\n');
  }, [axiom, rulesStr, angle, iterations, colorHueStart, colorHueEnd, plantName]);

  const handleSave = useCallback(() => {
    const svg = generateSVG();
    const creation: Creation = {
      id: `creation-lsys-${Date.now()}`,
      foundationId,
      type: 'l-system',
      title: plantName || 'Untitled Plant',
      data: JSON.stringify({
        axiom,
        rules: rulesStr,
        angle,
        iterations,
        colorHueStart,
        colorHueEnd,
        svg,
      }),
      createdAt: new Date().toISOString(),
      shared: false,
    };
    onCreationSave(creation);
    setSaved(true);
  }, [foundationId, plantName, axiom, rulesStr, angle, iterations, colorHueStart, colorHueEnd, generateSVG, onCreationSave]);

  const handleContinue = useCallback(() => {
    onComplete('create');
  }, [onComplete]);

  return (
    <div className="phase phase--create">
      <div className="create__intro">
        <h2 className="create__title">Grow Your Garden</h2>
        <p className="create__description">
          Design a plant. Write the seed (axiom), the growth rule, and the
          branching angle. Name it. The rule you write IS the seed — everything
          the plant will become is already in that one line. When you are
          satisfied, save your plant as art.
        </p>
      </div>

      <div className="create__workspace">
        <canvas
          ref={canvasRef}
          width={600}
          height={450}
          className="create__canvas"
          aria-label="Your L-system plant grows here as you design it"
        />

        <div className="create__controls">
          <div className="create__templates">
            <span className="create__label">Start from:</span>
            {PLANT_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                className="create__template-btn"
                onClick={() => loadTemplate(tmpl)}
              >
                {tmpl.name}
              </button>
            ))}
          </div>

          <label className="create__control-label">
            Plant name:
            <input
              type="text"
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              placeholder="Name your creation"
              className="create__text-input"
            />
          </label>

          <label className="create__control-label">
            Seed (axiom):
            <input
              type="text"
              value={axiom}
              onChange={(e) => setAxiom(e.target.value)}
              className="create__text-input"
            />
          </label>

          <label className="create__control-label">
            Growth rules:
            <input
              type="text"
              value={rulesStr}
              onChange={(e) => setRulesStr(e.target.value)}
              className="create__text-input create__text-input--wide"
            />
          </label>

          <label className="create__control-label">
            Branch angle:
            <input
              type="range"
              min={5}
              max={120}
              step={1}
              value={angle}
              onChange={(e) => setAngle(parseInt(e.target.value, 10))}
            />
            <span>{angle} degrees</span>
          </label>

          <label className="create__control-label">
            Growth steps:
            <input
              type="range"
              min={1}
              max={7}
              step={1}
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value, 10))}
            />
            <span>{iterations}</span>
          </label>

          <label className="create__control-label">
            Color — stem hue:
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={colorHueStart}
              onChange={(e) => setColorHueStart(parseInt(e.target.value, 10))}
            />
            <span>{colorHueStart}</span>
          </label>

          <label className="create__control-label">
            Color — tip hue:
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={colorHueEnd}
              onChange={(e) => setColorHueEnd(parseInt(e.target.value, 10))}
            />
            <span>{colorHueEnd}</span>
          </label>
        </div>
      </div>

      <div className="create__actions">
        <button
          className="create__save-btn"
          onClick={handleSave}
        >
          {saved ? 'Saved — save again?' : 'Save your plant'}
        </button>
      </div>

      {saved && (
        <div className="create__reflection">
          <p className="create__reflection-text">
            You wrote a rule. The rule grew a plant. The plant is more complex than
            the rule — but everything it is was already in the seed. One axiom. One
            set of replacements. Repeated. The fern on the screen and the fern in
            the forest grow by the same principle. You did not draw a plant. You
            grew one.
          </p>
          <button className="phase__continue-btn" onClick={handleContinue}>
            Complete Wing 8
          </button>
        </div>
      )}
    </div>
  );
}
