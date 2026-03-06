// Wing 8 — Touch Phase: "Write the Rules"
// L-system rule editor. Change axiom, rules, angle, iterations.
// Watch complexity emerge from simple rules.
// Every numeric readout: plain-language label FIRST, then notation in parentheses.
// Completion: >= 3 parameter changes OR >= 2min.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';

interface TouchPhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

type PresetName = 'fern' | 'koch' | 'sierpinski' | 'dragon' | 'bush';

interface Preset {
  name: string;
  axiom: string;
  rules: string;
  angle: number;
  iterations: number;
}

const PRESETS: Record<PresetName, Preset> = {
  fern: {
    name: 'Fractal Fern',
    axiom: 'X',
    rules: 'X=F+[[X]-X]-F[-FX]+X, F=FF',
    angle: 25,
    iterations: 5,
  },
  koch: {
    name: 'Koch Snowflake',
    axiom: 'F--F--F',
    rules: 'F=F+F--F+F',
    angle: 60,
    iterations: 3,
  },
  sierpinski: {
    name: 'Sierpinski',
    axiom: 'F-G-G',
    rules: 'F=F-G+F+G-F, G=GG',
    angle: 120,
    iterations: 5,
  },
  dragon: {
    name: 'Dragon Curve',
    axiom: 'F',
    rules: 'F=F+G, G=F-G',
    angle: 90,
    iterations: 10,
  },
  bush: {
    name: 'Bush',
    axiom: 'F',
    rules: 'F=FF+[+F-F-F]-[-F+F+F]',
    angle: 22,
    iterations: 4,
  },
};

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
    if (current.length > 500000) break;
  }
  return current;
}

interface TurtleState {
  x: number;
  y: number;
  angle: number;
}

export function TouchPhase({
  onComplete,
}: TouchPhaseProps): React.JSX.Element {
  const [timeSpent, setTimeSpent] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [axiom, setAxiom] = useState('X');
  const [rulesStr, setRulesStr] = useState('X=F+[[X]-X]-F[-FX]+X, F=FF');
  const [angle, setAngle] = useState(25);
  const [iterations, setIterations] = useState(5);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Render L-system
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
    const angleRad = (angle * Math.PI) / 180;

    // Compute bounds
    const bStack: TurtleState[] = [];
    let bState: TurtleState = { x: 0, y: 0, angle: -Math.PI / 2 };
    let minX = 0, minY = 0, maxX = 0, maxY = 0;

    for (const ch of lString) {
      switch (ch) {
        case 'F': case 'G':
          bState.x += Math.cos(bState.angle) * lineLen;
          bState.y += Math.sin(bState.angle) * lineLen;
          minX = Math.min(minX, bState.x);
          minY = Math.min(minY, bState.y);
          maxX = Math.max(maxX, bState.x);
          maxY = Math.max(maxY, bState.y);
          break;
        case '+': bState.angle += angleRad; break;
        case '-': bState.angle -= angleRad; break;
        case '[': bStack.push({ ...bState }); break;
        case ']': { const p = bStack.pop(); if (p) bState = p; break; }
      }
    }

    const bw = maxX - minX;
    const bh = maxY - minY;
    if (bw === 0 && bh === 0) return;

    const margin = 30;
    const availW = w - margin * 2;
    const availH = h - margin * 2;
    const scale = Math.min(availW / (bw || 1), availH / (bh || 1));
    const offsetX = margin + (availW - bw * scale) / 2 - minX * scale;
    const offsetY = margin + (availH - bh * scale) / 2 - minY * scale;

    // Draw
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
          const hue = (segIdx / (totalSeg || 1)) * 200 + 120;
          ctx.strokeStyle = `hsla(${hue % 360}, 55%, 50%, 0.8)`;
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

    // Readouts — plain language FIRST
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`Turn angle: ${angle} degrees  (\u03B4)`, 10, 18);
    ctx.fillText(`Growth steps: ${iterations}  (n)`, 10, 34);
    ctx.fillText(`Total segments: ${totalSeg}  (|F|)`, 10, 50);
    ctx.fillText(`String length: ${lString.length}`, 10, 66);
  }, [axiom, rulesStr, angle, iterations]);

  const loadPreset = useCallback((name: PresetName) => {
    const preset = PRESETS[name];
    setAxiom(preset.axiom);
    setRulesStr(preset.rules);
    setAngle(preset.angle);
    setIterations(preset.iterations);
    setInteractionCount((prev) => prev + 1);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('touch');
  }, [onComplete]);

  return (
    <div className="phase phase--touch">
      <div className="touch__intro">
        <h2 className="touch__title">Write the Rules</h2>
        <p className="touch__description">
          You control the seed (axiom), the growth rules, the branching angle, and
          how many times to apply the rules. Try the presets, then modify them.
          See what grows.
        </p>
      </div>

      <div className="touch__visualization">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="touch__canvas"
          aria-label="L-system visualization — change parameters to grow different fractal shapes"
        />
        <div className="touch__controls">
          <div className="touch__presets">
            {(Object.entries(PRESETS) as [PresetName, Preset][]).map(([key, preset]) => (
              <button
                key={key}
                className="touch__op-btn"
                onClick={() => loadPreset(key)}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <div className="touch__params">
            <label className="touch__control-label">
              Seed (axiom):
              <input
                type="text"
                value={axiom}
                onChange={(e) => {
                  setAxiom(e.target.value);
                  setInteractionCount((prev) => prev + 1);
                }}
                className="touch__text-input"
              />
            </label>
            <label className="touch__control-label">
              Rules:
              <input
                type="text"
                value={rulesStr}
                onChange={(e) => {
                  setRulesStr(e.target.value);
                  setInteractionCount((prev) => prev + 1);
                }}
                className="touch__text-input touch__text-input--wide"
              />
            </label>
            <label className="touch__control-label">
              Branch angle:
              <input
                type="range"
                min={5}
                max={120}
                step={1}
                value={angle}
                onChange={(e) => {
                  setAngle(parseInt(e.target.value, 10));
                  setInteractionCount((prev) => prev + 1);
                }}
              />
              <span>{angle} degrees</span>
            </label>
            <label className="touch__control-label">
              Iterations:
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={iterations}
                onChange={(e) => {
                  setIterations(parseInt(e.target.value, 10));
                  setInteractionCount((prev) => prev + 1);
                }}
              />
              <span>{iterations}</span>
            </label>
          </div>
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
