/**
 * Wing 8: L-Systems — Touch Phase
 * "Growth"
 *
 * L-system rule editor. Change axiom, rules, angle, iterations.
 * Watch complexity emerge from simplicity.
 * At least 2 interactive elements.
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface TouchPhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

// ─── L-System engine ────────────────────────────────────

interface LSystemConfig {
  axiom: string;
  rules: Record<string, string>;
  angle: number;
  iterations: number;
}

function expandLSystem(config: LSystemConfig): string {
  let current = config.axiom;
  for (let i = 0; i < config.iterations; i++) {
    let next = '';
    for (const ch of current) {
      next += config.rules[ch] ?? ch;
    }
    current = next;
    // Safety: cap at 10000 chars to prevent browser freeze
    if (current.length > 10000) {
      current = current.slice(0, 10000);
      break;
    }
  }
  return current;
}

interface TurtlePoint {
  x: number;
  y: number;
}

interface TurtleLine {
  from: TurtlePoint;
  to: TurtlePoint;
  depth: number;
}

function interpretLSystem(expanded: string, angleDeg: number): TurtleLine[] {
  const angleRad = (angleDeg * Math.PI) / 180;
  const lines: TurtleLine[] = [];
  let x = 0;
  let y = 0;
  let dir = -Math.PI / 2; // start pointing up
  let depth = 0;
  const stack: { x: number; y: number; dir: number }[] = [];

  for (const ch of expanded) {
    switch (ch) {
      case 'F':
      case 'G': {
        const nx = x + Math.cos(dir) * 5;
        const ny = y + Math.sin(dir) * 5;
        lines.push({
          from: { x, y },
          to: { x: nx, y: ny },
          depth,
        });
        x = nx;
        y = ny;
        break;
      }
      case 'f': {
        // Move without drawing
        x += Math.cos(dir) * 5;
        y += Math.sin(dir) * 5;
        break;
      }
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
          const state = stack.pop()!;
          x = state.x;
          y = state.y;
          dir = state.dir;
          depth = Math.max(0, depth - 1);
        }
        break;
    }
  }

  return lines;
}

// ─── Preset L-systems ───────────────────────────────────

const PRESETS: Record<string, { name: string; config: LSystemConfig }> = {
  'koch': {
    name: 'Koch Snowflake',
    config: {
      axiom: 'F--F--F',
      rules: { 'F': 'F+F--F+F' },
      angle: 60,
      iterations: 3,
    },
  },
  'plant': {
    name: 'Simple Plant',
    config: {
      axiom: 'F',
      rules: { 'F': 'F[+F]F[-F]F' },
      angle: 25.7,
      iterations: 4,
    },
  },
  'dragon': {
    name: 'Dragon Curve',
    config: {
      axiom: 'F',
      rules: { 'F': 'F+G', 'G': 'F-G' },
      angle: 90,
      iterations: 10,
    },
  },
  'sierpinski': {
    name: 'Sierpinski Triangle',
    config: {
      axiom: 'F-G-G',
      rules: { 'F': 'F-G+F+G-F', 'G': 'GG' },
      angle: 120,
      iterations: 5,
    },
  },
  'tree': {
    name: 'Binary Tree',
    config: {
      axiom: 'F',
      rules: { 'F': 'FF+[+F-F-F]-[-F+F+F]' },
      angle: 22.5,
      iterations: 3,
    },
  },
};

export const TouchPhase: React.FC<TouchPhaseProps> = ({ phase, onComplete }) => {
  // ─── Interactive Element 1: Preset selector + rule editor ──
  const [axiom, setAxiom] = useState('F');
  const [ruleF, setRuleF] = useState('F[+F]F[-F]F');
  const [ruleG, setRuleG] = useState('');

  // ─── Interactive Element 2: Angle + iteration controls ─────
  const [angle, setAngle] = useState(25.7);
  const [iterations, setIterations] = useState(4);

  const [interactionCount, setInteractionCount] = useState(0);

  const handleInteraction = useCallback(() => {
    setInteractionCount(prev => prev + 1);
  }, []);

  const loadPreset = useCallback((key: string) => {
    const preset = PRESETS[key];
    if (!preset) return;
    setAxiom(preset.config.axiom);
    setRuleF(preset.config.rules['F'] || '');
    setRuleG(preset.config.rules['G'] || '');
    setAngle(preset.config.angle);
    setIterations(preset.config.iterations);
    handleInteraction();
  }, [handleInteraction]);

  const config: LSystemConfig = useMemo(() => {
    const rules: Record<string, string> = {};
    if (ruleF) rules['F'] = ruleF;
    if (ruleG) rules['G'] = ruleG;
    return { axiom, rules, angle, iterations };
  }, [axiom, ruleF, ruleG, angle, iterations]);

  const expanded = useMemo(() => expandLSystem(config), [config]);
  const lines = useMemo(() => interpretLSystem(expanded, angle), [expanded, angle]);

  // Compute bounding box for SVG viewport
  const bounds = useMemo(() => {
    if (lines.length === 0) return { minX: -50, maxX: 50, minY: -50, maxY: 50 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const line of lines) {
      minX = Math.min(minX, line.from.x, line.to.x);
      maxX = Math.max(maxX, line.from.x, line.to.x);
      minY = Math.min(minY, line.from.y, line.to.y);
      maxY = Math.max(maxY, line.from.y, line.to.y);
    }
    const padding = 10;
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding,
    };
  }, [lines]);

  const svgWidth = bounds.maxX - bounds.minX || 100;
  const svgHeight = bounds.maxY - bounds.minY || 100;

  return (
    <div className="wing-phase touch-phase l-systems-touch">
      <h2>{phase.title}</h2>

      <div className="touch-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="touch-interactive-area">
        {/* ─── Interactive Element 1: Rule Editor ────────────── */}
        <div className="interactive-element rule-editor" data-interactive="rule-editor">
          <h3>Design Your Rules</h3>

          <div className="preset-buttons">
            <label>Presets:</label>
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                className="preset-button"
                onClick={() => loadPreset(key)}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="rule-inputs">
            <div className="form-field">
              <label htmlFor="ls-axiom">Axiom (starting symbol):</label>
              <input
                id="ls-axiom"
                type="text"
                value={axiom}
                onChange={e => { setAxiom(e.target.value); handleInteraction(); }}
                placeholder="F"
                maxLength={20}
              />
            </div>
            <div className="form-field">
              <label htmlFor="ls-rule-f">Rule for F:</label>
              <input
                id="ls-rule-f"
                type="text"
                value={ruleF}
                onChange={e => { setRuleF(e.target.value); handleInteraction(); }}
                placeholder="F[+F]F[-F]F"
                maxLength={50}
              />
            </div>
            <div className="form-field">
              <label htmlFor="ls-rule-g">Rule for G (optional):</label>
              <input
                id="ls-rule-g"
                type="text"
                value={ruleG}
                onChange={e => { setRuleG(e.target.value); handleInteraction(); }}
                placeholder="GG"
                maxLength={50}
              />
            </div>
          </div>

          <div className="symbol-guide">
            <p>
              <strong>Symbols:</strong> F/G = draw forward, f = move without drawing,
              + = turn left, - = turn right, [ = save position, ] = restore position
            </p>
          </div>
        </div>

        {/* ─── Interactive Element 2: Angle + Iterations ─────── */}
        <div className="interactive-element growth-controls" data-interactive="growth-controls">
          <h3>Growth Parameters</h3>

          <div className="control-row">
            <label>
              Angle: {angle.toFixed(1)} degrees
              <input
                type="range"
                min={1}
                max={180}
                step={0.5}
                value={angle}
                onChange={e => { setAngle(Number(e.target.value)); handleInteraction(); }}
              />
            </label>
          </div>

          <div className="control-row">
            <label>
              Iterations: {iterations}
              <input
                type="range"
                min={1}
                max={7}
                step={1}
                value={iterations}
                onChange={e => { setIterations(Number(e.target.value)); handleInteraction(); }}
              />
            </label>
          </div>

          <div className="growth-stats">
            <span>String length: {expanded.length}</span>
            <span>Line segments: {lines.length}</span>
          </div>
        </div>

        {/* ─── Visualization ─────────────────────────────────── */}
        <div className="lsystem-visualization">
          <svg
            viewBox={`${bounds.minX} ${bounds.minY} ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMidYMid meet"
            className="lsystem-svg"
            style={{ width: '100%', maxHeight: '500px', background: '#0a0a0a' }}
          >
            {lines.map((line, i) => {
              const hue = 90 + line.depth * 30; // green to yellow to orange
              const lightness = 40 + line.depth * 5;
              return (
                <line
                  key={i}
                  x1={line.from.x}
                  y1={line.from.y}
                  x2={line.to.x}
                  y2={line.to.y}
                  stroke={`hsl(${hue}, 70%, ${lightness}%)`}
                  strokeWidth={Math.max(0.5, 2 - line.depth * 0.3)}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        </div>
      </div>

      <div className="touch-content">
        <p>{phase.content.text}</p>
      </div>

      <div className="interaction-progress">
        <p>Interactions: {interactionCount}</p>
      </div>

      <button
        className="phase-continue"
        onClick={onComplete}
        disabled={interactionCount < 3}
      >
        I have grown something from nothing...
      </button>
    </div>
  );
};

export default TouchPhase;
