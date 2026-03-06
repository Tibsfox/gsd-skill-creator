/**
 * Wing 8: L-Systems — Create Phase
 * "Growth"
 *
 * "Grow Your Garden" — design an L-system plant, export as SVG art.
 * This is the final creation in the observatory.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { FoundationPhase } from '../../../types/index.js';
import { nowISO } from '../../../types/index.js';

export interface CreatePhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
  onSaveCreation?: (creation: {
    foundationId: 'l-systems';
    type: 'l-system';
    title: string;
    data: string;
    shared: boolean;
  }) => void;
}

// ─── L-System engine (shared with TouchPhase) ───────────

function expandLSystem(
  axiom: string,
  rules: Record<string, string>,
  iterations: number,
): string {
  let current = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = '';
    for (const ch of current) {
      next += rules[ch] ?? ch;
    }
    current = next;
    if (current.length > 15000) {
      current = current.slice(0, 15000);
      break;
    }
  }
  return current;
}

interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
}

function interpretToLines(expanded: string, angleDeg: number): LineSegment[] {
  const angleRad = (angleDeg * Math.PI) / 180;
  const segments: LineSegment[] = [];
  let x = 0;
  let y = 0;
  let dir = -Math.PI / 2;
  let depth = 0;
  const stack: { x: number; y: number; dir: number }[] = [];

  for (const ch of expanded) {
    switch (ch) {
      case 'F':
      case 'G': {
        const nx = x + Math.cos(dir) * 5;
        const ny = y + Math.sin(dir) * 5;
        segments.push({ x1: x, y1: y, x2: nx, y2: ny, depth });
        x = nx;
        y = ny;
        break;
      }
      case 'f':
        x += Math.cos(dir) * 5;
        y += Math.sin(dir) * 5;
        break;
      case '+':
        dir += angleRad;
        break;
      case '-':
        dir -= angleRad;
        break;
      case '[':
        stack.push({ x, y, dir });
        depth++;
        break;
      case ']':
        if (stack.length > 0) {
          const s = stack.pop()!;
          x = s.x; y = s.y; dir = s.dir;
          depth = Math.max(0, depth - 1);
        }
        break;
    }
  }

  return segments;
}

// ─── Plant presets ──────────────────────────────────────

const GARDEN_PRESETS: Record<string, { name: string; axiom: string; ruleF: string; ruleG: string; angle: number; iterations: number; palette: string }> = {
  wildflower: {
    name: 'Wildflower',
    axiom: 'F',
    ruleF: 'FF-[-F+F+F]+[+F-F-F]',
    ruleG: '',
    angle: 22.5,
    iterations: 3,
    palette: 'warm',
  },
  fern: {
    name: 'Fern',
    axiom: 'F',
    ruleF: 'F[+F]F[-F][F]',
    ruleG: '',
    angle: 25.7,
    iterations: 5,
    palette: 'green',
  },
  bush: {
    name: 'Bush',
    axiom: 'F',
    ruleF: 'F[+F]F[-F]F',
    ruleG: '',
    angle: 25.7,
    iterations: 4,
    palette: 'earth',
  },
  seaweed: {
    name: 'Seaweed',
    axiom: 'F',
    ruleF: 'F[+F][-F]FF',
    ruleG: '',
    angle: 20,
    iterations: 4,
    palette: 'ocean',
  },
  crystal: {
    name: 'Crystal',
    axiom: 'F+F+F+F',
    ruleF: 'FF+F++F+F',
    ruleG: '',
    angle: 90,
    iterations: 3,
    palette: 'ice',
  },
};

const PALETTE_COLORS: Record<string, { base: string; hueRange: [number, number]; saturation: number }> = {
  warm:  { base: '#2d1810', hueRange: [20, 80], saturation: 70 },
  green: { base: '#0a1a0a', hueRange: [80, 150], saturation: 60 },
  earth: { base: '#1a150a', hueRange: [30, 120], saturation: 50 },
  ocean: { base: '#0a0f1a', hueRange: [170, 220], saturation: 65 },
  ice:   { base: '#0a0a1a', hueRange: [190, 250], saturation: 40 },
};

export const CreatePhase: React.FC<CreatePhaseProps> = ({ phase, onComplete, onSaveCreation }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const [plantName, setPlantName] = useState('');
  const [axiom, setAxiom] = useState('F');
  const [ruleF, setRuleF] = useState('FF-[-F+F+F]+[+F-F-F]');
  const [ruleG, setRuleG] = useState('');
  const [angle, setAngle] = useState(22.5);
  const [iterations, setIterations] = useState(3);
  const [palette, setPalette] = useState('warm');
  const [saved, setSaved] = useState(false);

  const loadPreset = useCallback((key: string) => {
    const preset = GARDEN_PRESETS[key];
    if (!preset) return;
    setAxiom(preset.axiom);
    setRuleF(preset.ruleF);
    setRuleG(preset.ruleG);
    setAngle(preset.angle);
    setIterations(preset.iterations);
    setPalette(preset.palette);
    if (!plantName) setPlantName(preset.name);
  }, [plantName]);

  const rules: Record<string, string> = useMemo(() => {
    const r: Record<string, string> = {};
    if (ruleF) r['F'] = ruleF;
    if (ruleG) r['G'] = ruleG;
    return r;
  }, [ruleF, ruleG]);

  const expanded = useMemo(() => expandLSystem(axiom, rules, iterations), [axiom, rules, iterations]);
  const segments = useMemo(() => interpretToLines(expanded, angle), [expanded, angle]);

  const bounds = useMemo(() => {
    if (segments.length === 0) return { minX: -50, maxX: 50, minY: -100, maxY: 10 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const s of segments) {
      minX = Math.min(minX, s.x1, s.x2);
      maxX = Math.max(maxX, s.x1, s.x2);
      minY = Math.min(minY, s.y1, s.y2);
      maxY = Math.max(maxY, s.y1, s.y2);
    }
    const pad = 15;
    return { minX: minX - pad, maxX: maxX + pad, minY: minY - pad, maxY: maxY + pad };
  }, [segments]);

  const svgWidth = bounds.maxX - bounds.minX || 100;
  const svgHeight = bounds.maxY - bounds.minY || 100;

  const pal = PALETTE_COLORS[palette] || PALETTE_COLORS.warm;
  const maxDepth = segments.reduce((max, s) => Math.max(max, s.depth), 0) || 1;

  const exportSvg = useCallback(() => {
    if (!svgRef.current) return '';
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgRef.current);
  }, []);

  const canSave = plantName.trim().length > 0 && segments.length > 0;

  const handleSave = useCallback(() => {
    if (!canSave) return;

    const svgData = exportSvg();

    const creationData = JSON.stringify({
      plantName: plantName.trim(),
      lsystem: { axiom, rules, angle, iterations },
      palette,
      segmentCount: segments.length,
      svgData,
      createdAt: nowISO(),
    });

    onSaveCreation?.({
      foundationId: 'l-systems',
      type: 'l-system',
      title: `Garden: ${plantName.trim()}`,
      data: creationData,
      shared: false,
    });

    setSaved(true);
  }, [canSave, plantName, axiom, rules, angle, iterations, palette, segments, exportSvg, onSaveCreation]);

  return (
    <div className="wing-phase create-phase l-systems-create">
      <h2>{phase.title}</h2>

      <div className="create-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="create-workspace">
        <div className="creation-form">
          <h3>Grow Your Garden</h3>
          <p>
            Design a plant. Name it. Shape its rules. Watch it grow.
            When you are satisfied, save it as a creation — your plant,
            grown from your rules, a living thing made of mathematics.
          </p>

          <div className="form-field">
            <label htmlFor="plant-name">Name your plant:</label>
            <input
              id="plant-name"
              type="text"
              value={plantName}
              onChange={e => setPlantName(e.target.value)}
              placeholder="e.g., Winter Fern"
            />
          </div>

          <div className="preset-row">
            <label>Start from a preset:</label>
            <div className="preset-buttons">
              {Object.entries(GARDEN_PRESETS).map(([key, p]) => (
                <button key={key} className="preset-button" onClick={() => loadPreset(key)}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rule-inputs">
            <div className="form-field">
              <label htmlFor="garden-axiom">Axiom:</label>
              <input
                id="garden-axiom"
                type="text"
                value={axiom}
                onChange={e => setAxiom(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className="form-field">
              <label htmlFor="garden-rule-f">Rule F:</label>
              <input
                id="garden-rule-f"
                type="text"
                value={ruleF}
                onChange={e => setRuleF(e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="form-field">
              <label htmlFor="garden-rule-g">Rule G:</label>
              <input
                id="garden-rule-g"
                type="text"
                value={ruleG}
                onChange={e => setRuleG(e.target.value)}
                maxLength={50}
              />
            </div>
          </div>

          <div className="parameter-controls">
            <label>
              Angle: {angle.toFixed(1)} degrees
              <input type="range" min={1} max={180} step={0.5} value={angle}
                onChange={e => setAngle(Number(e.target.value))} />
            </label>
            <label>
              Iterations: {iterations}
              <input type="range" min={1} max={7} step={1} value={iterations}
                onChange={e => setIterations(Number(e.target.value))} />
            </label>
          </div>

          <div className="palette-selector">
            <label>Color palette:</label>
            <div className="palette-options">
              {Object.keys(PALETTE_COLORS).map(p => (
                <button
                  key={p}
                  className={`palette-button ${palette === p ? 'active' : ''}`}
                  onClick={() => setPalette(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Garden Visualization ──────────────────────────── */}
        <div className="garden-visualization">
          <svg
            ref={svgRef}
            viewBox={`${bounds.minX} ${bounds.minY} ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMidYMid meet"
            className="garden-svg"
            style={{ width: '100%', maxHeight: '600px', background: pal.base }}
            xmlns="http://www.w3.org/2000/svg"
          >
            {segments.map((seg, i) => {
              const t = maxDepth > 0 ? seg.depth / maxDepth : 0;
              const hue = pal.hueRange[0] + t * (pal.hueRange[1] - pal.hueRange[0]);
              const lightness = 35 + t * 25;
              return (
                <line
                  key={i}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={`hsl(${hue}, ${pal.saturation}%, ${lightness}%)`}
                  strokeWidth={Math.max(0.3, 2.5 - seg.depth * 0.4)}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          <div className="garden-stats">
            <span>{segments.length} line segments</span>
            <span>{expanded.length} symbols</span>
          </div>
        </div>

        {phase.content.mathNotation && (
          <div className="formal-reference">
            <h4>Formal Reference</h4>
            <pre className="math-display">{phase.content.mathNotation}</pre>
          </div>
        )}
      </div>

      <div className="create-actions">
        {!saved ? (
          <button
            className="save-creation"
            onClick={handleSave}
            disabled={!canSave}
          >
            Save My Garden
          </button>
        ) : (
          <div className="save-confirmation">
            <p>
              Your garden has been planted. From a single axiom, a world grew.
            </p>
            <p className="closing-words">
              You have traveled through eight wings of the observatory.
              You began with the circle and ended with growth — and growth
              uses the circle. The journey is complete, and it is just beginning.
            </p>
            <p className="begin-again">
              <em>Begin again.</em>
            </p>
            <button className="phase-continue" onClick={onComplete}>
              Return to the Observatory
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePhase;
