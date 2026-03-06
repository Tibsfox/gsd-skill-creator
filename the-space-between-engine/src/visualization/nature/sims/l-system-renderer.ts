// L-System Renderer — Nature Simulation
// General L-system: axiom, rules, angle, iterations -> turtle graphics.
// Foundation: l-systems
//
// L-system formalism:
//   G = (V, omega, P) where
//     V = alphabet (set of symbols)
//     omega = axiom (initial string)
//     P = production rules (symbol -> replacement string)
//
// After N iterations, the axiom is expanded by applying all production rules
// simultaneously (parallel rewriting). The resulting string is then interpreted
// as turtle graphics commands:
//   F, G = draw forward
//   f    = move forward without drawing
//   +    = turn right by angle
//   -    = turn left by angle
//   [    = push state
//   ]    = pop state

import type { InteractiveParam, FoundationId } from '../../../types/index';
import type { CanvasManager } from '../../canvas';
import { NatureSimulation } from '../framework';

interface TurtleState {
  x: number;
  y: number;
  angle: number;
}

interface LSystemRule {
  from: string;
  to: string;
}

export class LSystemRenderer extends NatureSimulation {
  readonly id = 'l-system-renderer';
  readonly name = 'L-System Renderer';
  readonly foundationId: FoundationId = 'l-systems';

  private canvasManager: CanvasManager | null = null;
  private rendererId: string | null = null;

  // Parameters
  private axiom = 'F';
  private rules: LSystemRule[] = [{ from: 'F', to: 'F+F-F-F+F' }];
  private angle = 90; // degrees
  private iterations = 3;
  private lineLength = 5;
  private activePreset = 'koch-curve';

  // Computed
  private generatedString = '';

  // Presets (well-known L-systems)
  private readonly presets: Record<string, { axiom: string; rules: LSystemRule[]; angle: number; iterations: number; name: string }> = {
    'koch-curve': {
      name: 'Koch Curve',
      axiom: 'F',
      rules: [{ from: 'F', to: 'F+F-F-F+F' }],
      angle: 90,
      iterations: 3,
    },
    'koch-snowflake': {
      name: 'Koch Snowflake',
      axiom: 'F--F--F',
      rules: [{ from: 'F', to: 'F+F--F+F' }],
      angle: 60,
      iterations: 3,
    },
    'sierpinski-triangle': {
      name: 'Sierpinski Triangle',
      axiom: 'F-G-G',
      rules: [
        { from: 'F', to: 'F-G+F+G-F' },
        { from: 'G', to: 'GG' },
      ],
      angle: 120,
      iterations: 5,
    },
    'dragon-curve': {
      name: 'Dragon Curve',
      axiom: 'F',
      rules: [
        { from: 'F', to: 'F+G' },
        { from: 'G', to: 'F-G' },
      ],
      angle: 90,
      iterations: 10,
    },
    'plant': {
      name: 'Fractal Plant',
      axiom: 'X',
      rules: [
        { from: 'X', to: 'F+[[X]-X]-F[-FX]+X' },
        { from: 'F', to: 'FF' },
      ],
      angle: 25,
      iterations: 5,
    },
    'hilbert-curve': {
      name: 'Hilbert Curve',
      axiom: 'A',
      rules: [
        { from: 'A', to: '-BF+AFA+FB-' },
        { from: 'B', to: '+AF-BFB-FA+' },
      ],
      angle: 90,
      iterations: 4,
    },
    'penrose-tiling': {
      name: 'Penrose (Gosper)',
      axiom: 'F',
      rules: [
        { from: 'F', to: 'F-G--G+F++FF+G-' },
        { from: 'G', to: '+F-GG--G-F++F+G' },
      ],
      angle: 60,
      iterations: 3,
    },
  };

  init(canvas: CanvasManager, rendererId: string): void {
    this.canvasManager = canvas;
    this.rendererId = rendererId;
    this.loadPreset(this.activePreset);
  }

  /**
   * Apply L-system production rules to generate the string after N iterations.
   *
   * This is mathematically correct parallel rewriting: all rules are applied
   * simultaneously in each iteration. Symbols not matching any rule are
   * passed through unchanged (identity production).
   */
  private generate(): void {
    let current = this.axiom;

    for (let i = 0; i < this.iterations; i++) {
      let next = '';
      for (const ch of current) {
        const rule = this.rules.find(r => r.from === ch);
        if (rule) {
          next += rule.to;
        } else {
          next += ch;
        }
      }
      current = next;

      // Safety limit
      if (current.length > 1000000) {
        break;
      }
    }

    this.generatedString = current;
  }

  private loadPreset(presetId: string): void {
    const preset = this.presets[presetId];
    if (!preset) return;

    this.axiom = preset.axiom;
    this.rules = preset.rules.map(r => ({ ...r }));
    this.angle = preset.angle;
    this.iterations = preset.iterations;
    this.activePreset = presetId;
    this.generate();
  }

  update(_deltaTime: number): void {
    // Static rendering — no per-frame updates needed
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    if (this.generatedString.length === 0) {
      this.generate();
    }

    // First pass: compute bounding box to auto-scale and center
    const bounds = this.computeBounds();
    if (!bounds) return;

    const { minX, minY, maxX, maxY } = bounds;
    const bw = maxX - minX;
    const bh = maxY - minY;

    if (bw === 0 && bh === 0) return;

    const margin = 40;
    const availW = width - margin * 2;
    const availH = height - margin * 2;
    const scale = Math.min(availW / (bw || 1), availH / (bh || 1));
    const offsetX = margin + (availW - bw * scale) / 2 - minX * scale;
    const offsetY = margin + (availH - bh * scale) / 2 - minY * scale;

    // Second pass: draw
    const angleRad = (this.angle * Math.PI) / 180;
    const stack: TurtleState[] = [];
    let state: TurtleState = { x: 0, y: 0, angle: -Math.PI / 2 };

    const totalSegments = this.countDrawSegments();
    let segmentIndex = 0;

    ctx.lineWidth = Math.max(0.5, 2 - this.iterations * 0.2);

    for (const ch of this.generatedString) {
      switch (ch) {
        case 'F':
        case 'G': {
          const nx = state.x + Math.cos(state.angle) * this.lineLength;
          const ny = state.y + Math.sin(state.angle) * this.lineLength;

          // Color based on position in string
          const hue = (segmentIndex / (totalSegments || 1)) * 240 + 180;
          ctx.strokeStyle = `hsla(${hue % 360}, 70%, 60%, 0.8)`;

          ctx.beginPath();
          ctx.moveTo(state.x * scale + offsetX, state.y * scale + offsetY);
          ctx.lineTo(nx * scale + offsetX, ny * scale + offsetY);
          ctx.stroke();

          state.x = nx;
          state.y = ny;
          segmentIndex++;
          break;
        }
        case 'f': {
          // Move without drawing
          state.x += Math.cos(state.angle) * this.lineLength;
          state.y += Math.sin(state.angle) * this.lineLength;
          break;
        }
        case '+':
          state.angle += angleRad;
          break;
        case '-':
          state.angle -= angleRad;
          break;
        case '[':
          stack.push({ ...state });
          break;
        case ']': {
          const popped = stack.pop();
          if (popped) state = popped;
          break;
        }
      }
    }

    // Readout
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

    const presetName = this.presets[this.activePreset]?.name ?? 'Custom';
    ctx.fillText(`Preset: ${presetName}`, 10, 18);
    ctx.fillText(`Axiom: ${this.axiom}`, 10, 34);
    ctx.fillText(`Iterations: ${this.iterations}`, 10, 50);
    ctx.fillText(`Angle: ${this.angle}\u00B0`, 10, 66);
    ctx.fillText(`String length: ${this.generatedString.length}`, 10, 82);

    // Rules
    for (let i = 0; i < Math.min(this.rules.length, 4); i++) {
      const r = this.rules[i]!;
      ctx.fillText(`Rule: ${r.from} \u2192 ${r.to.substring(0, 20)}${r.to.length > 20 ? '...' : ''}`, 10, 98 + i * 16);
    }
  }

  /**
   * Compute the bounding box of the turtle's path without drawing.
   */
  private computeBounds(): { minX: number; minY: number; maxX: number; maxY: number } | null {
    const angleRad = (this.angle * Math.PI) / 180;
    const stack: TurtleState[] = [];
    let state: TurtleState = { x: 0, y: 0, angle: -Math.PI / 2 };

    let minX = 0, minY = 0, maxX = 0, maxY = 0;

    for (const ch of this.generatedString) {
      switch (ch) {
        case 'F':
        case 'G':
        case 'f':
          state.x += Math.cos(state.angle) * this.lineLength;
          state.y += Math.sin(state.angle) * this.lineLength;
          minX = Math.min(minX, state.x);
          minY = Math.min(minY, state.y);
          maxX = Math.max(maxX, state.x);
          maxY = Math.max(maxY, state.y);
          break;
        case '+':
          state.angle += angleRad;
          break;
        case '-':
          state.angle -= angleRad;
          break;
        case '[':
          stack.push({ ...state });
          break;
        case ']': {
          const popped = stack.pop();
          if (popped) state = popped;
          break;
        }
      }
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Count drawable segments for color mapping.
   */
  private countDrawSegments(): number {
    let count = 0;
    for (const ch of this.generatedString) {
      if (ch === 'F' || ch === 'G') count++;
    }
    return count;
  }

  getParams(): InteractiveParam[] {
    return [
      {
        name: 'activePreset',
        label: 'Preset',
        type: 'select',
        default: 'koch-curve',
        description: 'Choose a well-known L-system preset',
      },
      {
        name: 'angle',
        label: 'Angle',
        type: 'slider',
        min: 1,
        max: 180,
        step: 1,
        default: 90,
        unit: '\u00B0',
        description: 'Turn angle for + and - commands',
      },
      {
        name: 'iterations',
        label: 'Iterations',
        type: 'slider',
        min: 1,
        max: 8,
        step: 1,
        default: 3,
        description: 'Number of production rule applications',
      },
      {
        name: 'lineLength',
        label: 'Line Length',
        type: 'slider',
        min: 1,
        max: 20,
        step: 1,
        default: 5,
        unit: 'px',
        description: 'Length of each forward step in pixels',
      },
    ];
  }

  setParam(name: string, value: number | string | boolean): void {
    switch (name) {
      case 'activePreset':
        if (typeof value === 'string' && value in this.presets) {
          this.loadPreset(value);
        }
        break;
      case 'angle':
        if (typeof value === 'number') {
          this.angle = value;
          this.generate();
        }
        break;
      case 'iterations':
        if (typeof value === 'number') {
          this.iterations = Math.max(1, Math.min(8, Math.round(value)));
          this.generate();
        }
        break;
      case 'lineLength':
        if (typeof value === 'number') this.lineLength = value;
        break;
    }
  }

  cleanup(): void {
    this.canvasManager = null;
    this.rendererId = null;
    this.generatedString = '';
  }
}
