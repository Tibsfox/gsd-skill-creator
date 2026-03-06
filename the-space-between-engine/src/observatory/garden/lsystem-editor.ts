// L-System Editor — Garden Workshop
// Dedicated editor for designing, iterating, and rendering L-systems.
// Turtle graphics rendering with export to SVG/PNG.

import type { LSystemPreset, Creation } from '../../types/index';

interface TurtleState {
  x: number;
  y: number;
  angle: number; // radians
}

interface LSystemConfig {
  axiom: string;
  rules: Record<string, string>;
  angle: number; // degrees
  iterations: number;
}

/**
 * L-System editor for designing and rendering L-systems.
 * Provides rule editing, iteration control, and export.
 *
 * L-system formalism:
 *   The editor manages a D0L-system (deterministic, context-free).
 *   Each iteration applies all production rules simultaneously.
 *   The resulting string is interpreted as turtle graphics.
 */
export class LSystemEditor {
  private axiom = 'F';
  private rules: Map<string, string> = new Map();
  private angle = 90; // degrees
  private iterations = 3;

  // Computed string and segments
  private generatedString = '';
  private dirty = true;

  // Canvas for rendering
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  /**
   * Attach to a canvas element for rendering.
   */
  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  /**
   * Set the axiom (initial string).
   */
  setAxiom(axiom: string): void {
    this.axiom = axiom;
    this.dirty = true;
  }

  /**
   * Add a production rule: from -> to.
   * The 'from' must be a single character.
   */
  addRule(from: string, to: string): void {
    if (from.length !== 1) {
      throw new Error(`L-system rule 'from' must be a single character, got: "${from}"`);
    }
    this.rules.set(from, to);
    this.dirty = true;
  }

  /**
   * Remove a production rule by its source character.
   */
  removeRule(from: string): void {
    this.rules.delete(from);
    this.dirty = true;
  }

  /**
   * Set the turning angle in degrees.
   */
  setAngle(degrees: number): void {
    this.angle = degrees;
    this.dirty = true;
  }

  /**
   * Set the number of iterations (production rule applications).
   */
  setIterations(n: number): void {
    this.iterations = Math.max(0, Math.min(10, n));
    this.dirty = true;
  }

  /**
   * Load a wing Create phase output as a starting point.
   * Parses the creation data to reconstruct the L-system config.
   */
  loadCreation(creation: Creation): void {
    try {
      const config = JSON.parse(creation.data) as LSystemConfig;

      if (config.axiom) this.axiom = config.axiom;
      if (config.angle) this.angle = config.angle;
      if (config.iterations) this.iterations = config.iterations;

      this.rules.clear();
      if (config.rules) {
        for (const [from, to] of Object.entries(config.rules)) {
          this.rules.set(from, to);
        }
      }

      this.dirty = true;
    } catch {
      // If parse fails, keep current state
    }
  }

  /**
   * Generate the L-system string by iterating production rules.
   * Uses parallel rewriting: all rules applied simultaneously per iteration.
   *
   * The generation is mathematically correct:
   * For each iteration i in [1..N]:
   *   For each character c in current string:
   *     If there exists a rule c -> replacement, output replacement
   *     Otherwise output c (identity production)
   */
  private generate(): void {
    if (!this.dirty) return;

    let current = this.axiom;

    for (let i = 0; i < this.iterations; i++) {
      let next = '';
      for (const ch of current) {
        const replacement = this.rules.get(ch);
        if (replacement !== undefined) {
          next += replacement;
        } else {
          next += ch;
        }
      }
      current = next;

      // Safety: limit string length
      if (current.length > 1000000) {
        break;
      }
    }

    this.generatedString = current;
    this.dirty = false;
  }

  /**
   * Get the generated L-system string (for debugging/display).
   */
  getString(): string {
    this.generate();
    return this.generatedString;
  }

  /**
   * Render the L-system using turtle graphics onto the attached canvas.
   */
  render(): void {
    this.generate();

    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    if (this.generatedString.length === 0) return;

    // Compute bounding box
    const bounds = this.computeBounds();
    if (!bounds) return;

    const { minX, minY, maxX, maxY } = bounds;
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
    const angleRad = (this.angle * Math.PI) / 180;
    const stack: TurtleState[] = [];
    let state: TurtleState = { x: 0, y: 0, angle: -Math.PI / 2 };
    const stepLen = 5;

    const totalSegs = this.countDrawable();
    let segIdx = 0;

    ctx.lineWidth = Math.max(0.5, 2 - this.iterations * 0.15);

    for (const ch of this.generatedString) {
      switch (ch) {
        case 'F':
        case 'G': {
          const nx = state.x + Math.cos(state.angle) * stepLen;
          const ny = state.y + Math.sin(state.angle) * stepLen;

          const hue = (segIdx / (totalSegs || 1)) * 270 + 160;
          ctx.strokeStyle = `hsla(${hue % 360}, 70%, 60%, 0.8)`;

          ctx.beginPath();
          ctx.moveTo(state.x * scale + offsetX, state.y * scale + offsetY);
          ctx.lineTo(nx * scale + offsetX, ny * scale + offsetY);
          ctx.stroke();

          state.x = nx;
          state.y = ny;
          segIdx++;
          break;
        }
        case 'f':
          state.x += Math.cos(state.angle) * stepLen;
          state.y += Math.sin(state.angle) * stepLen;
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
  }

  /**
   * Export the current rendering as a Blob.
   */
  export(format: 'svg' | 'png'): Blob {
    if (format === 'svg') {
      return this.exportSvg();
    }
    return this.exportPng();
  }

  /**
   * Get a list of well-known L-system example presets.
   */
  getExampleSystems(): LSystemPreset[] {
    return [
      {
        id: 'koch-snowflake',
        name: 'Koch Snowflake',
        axiom: 'F--F--F',
        rules: { F: 'F+F--F+F' },
        angle: 60,
        iterations: 4,
        description: 'Classic Koch snowflake fractal',
      },
      {
        id: 'sierpinski-triangle',
        name: 'Sierpinski Triangle',
        axiom: 'F-G-G',
        rules: { F: 'F-G+F+G-F', G: 'GG' },
        angle: 120,
        iterations: 5,
        description: 'Sierpinski triangle via L-system',
      },
      {
        id: 'dragon-curve',
        name: 'Dragon Curve',
        axiom: 'F',
        rules: { F: 'F+G', G: 'F-G' },
        angle: 90,
        iterations: 10,
        description: 'Heighway dragon curve',
      },
      {
        id: 'fractal-plant',
        name: 'Fractal Plant',
        axiom: 'X',
        rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' },
        angle: 25,
        iterations: 5,
        description: 'Realistic branching plant',
      },
      {
        id: 'hilbert-curve',
        name: 'Hilbert Curve',
        axiom: 'A',
        rules: { A: '-BF+AFA+FB-', B: '+AF-BFB-FA+' },
        angle: 90,
        iterations: 5,
        description: 'Space-filling Hilbert curve',
      },
      {
        id: 'gosper-curve',
        name: 'Gosper Curve',
        axiom: 'F',
        rules: { F: 'F-G--G+F++FF+G-', G: '+F-GG--G-F++F+G' },
        angle: 60,
        iterations: 3,
        description: 'Gosper island (flowsnake)',
      },
      {
        id: 'penrose-tiling',
        name: 'Penrose Tiling',
        axiom: '[X]++[X]++[X]++[X]++[X]',
        rules: { F: '', X: '+YF--ZF[---WF--XF]+', Y: '-WF++XF[+++YF++ZF]-', Z: '--YF++++WF[+ZF++++XF]--XF', W: '++ZF----XF[---WF----YF]++YF' },
        angle: 36,
        iterations: 4,
        description: 'Penrose tiling P3 (kite and dart)',
      },
    ];
  }

  /**
   * Load an example preset into the editor.
   */
  loadPreset(preset: LSystemPreset): void {
    this.axiom = preset.axiom;
    this.angle = preset.angle;
    this.iterations = preset.iterations;

    this.rules.clear();
    for (const [from, to] of Object.entries(preset.rules)) {
      this.rules.set(from, to);
    }

    this.dirty = true;
  }

  /**
   * Get current configuration as JSON (for serialization).
   */
  getConfig(): LSystemConfig {
    const rules: Record<string, string> = {};
    for (const [from, to] of Array.from(this.rules.entries())) {
      rules[from] = to;
    }

    return {
      axiom: this.axiom,
      rules,
      angle: this.angle,
      iterations: this.iterations,
    };
  }

  // ── Private helpers ─────────────────────────────────────

  private computeBounds(): { minX: number; minY: number; maxX: number; maxY: number } | null {
    const angleRad = (this.angle * Math.PI) / 180;
    const stack: TurtleState[] = [];
    let state: TurtleState = { x: 0, y: 0, angle: -Math.PI / 2 };
    const stepLen = 5;

    let minX = 0, minY = 0, maxX = 0, maxY = 0;

    for (const ch of this.generatedString) {
      switch (ch) {
        case 'F':
        case 'G':
        case 'f':
          state.x += Math.cos(state.angle) * stepLen;
          state.y += Math.sin(state.angle) * stepLen;
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

  private countDrawable(): number {
    let count = 0;
    for (const ch of this.generatedString) {
      if (ch === 'F' || ch === 'G') count++;
    }
    return count;
  }

  private exportPng(): Blob {
    if (!this.canvas) {
      return new Blob([], { type: 'image/png' });
    }

    const dataUrl = this.canvas.toDataURL('image/png');
    const binary = atob(dataUrl.split(',')[1] ?? '');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'image/png' });
  }

  private exportSvg(): Blob {
    this.generate();

    const w = this.canvas?.width ?? 800;
    const h = this.canvas?.height ?? 800;

    const bounds = this.computeBounds();
    if (!bounds) {
      return new Blob(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], { type: 'image/svg+xml' });
    }

    const { minX, minY, maxX, maxY } = bounds;
    const bw = maxX - minX;
    const bh = maxY - minY;
    const margin = 20;
    const availW = w - margin * 2;
    const availH = h - margin * 2;
    const scale = Math.min(availW / (bw || 1), availH / (bh || 1));
    const offsetX = margin + (availW - bw * scale) / 2 - minX * scale;
    const offsetY = margin + (availH - bh * scale) / 2 - minY * scale;

    const angleRad = (this.angle * Math.PI) / 180;
    const stack: TurtleState[] = [];
    let state: TurtleState = { x: 0, y: 0, angle: -Math.PI / 2 };
    const stepLen = 5;

    const lines: string[] = [];
    lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`);
    lines.push(`<rect width="100%" height="100%" fill="#0a0a1a"/>`);

    for (const ch of this.generatedString) {
      switch (ch) {
        case 'F':
        case 'G': {
          const nx = state.x + Math.cos(state.angle) * stepLen;
          const ny = state.y + Math.sin(state.angle) * stepLen;

          const x1 = state.x * scale + offsetX;
          const y1 = state.y * scale + offsetY;
          const x2 = nx * scale + offsetX;
          const y2 = ny * scale + offsetY;

          lines.push(`<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="#4fc3f7" stroke-width="1"/>`);

          state.x = nx;
          state.y = ny;
          break;
        }
        case 'f':
          state.x += Math.cos(state.angle) * stepLen;
          state.y += Math.sin(state.angle) * stepLen;
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

    lines.push('</svg>');
    return new Blob([lines.join('\n')], { type: 'image/svg+xml' });
  }
}
