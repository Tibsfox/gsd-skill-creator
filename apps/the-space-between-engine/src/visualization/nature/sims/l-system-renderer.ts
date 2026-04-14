// ─── L-System Renderer ───────────────────────────────────
// L-system string rewriting with turtle graphics rendering.
// Supports standard L-system symbols: F, +, -, [, ]

import type { ParamValue } from '../../../types/index.js';
import { NatureSimulation } from '../framework.js';

// ─── L-System Core Logic (exported for testing) ──────────

export interface LSystemRule {
  from: string;
  to: string;
}

/**
 * Parse a rule string like "F→F[+F]F[-F]F" or "F=F[+F]F[-F]F"
 * into a structured rule. Supports arrow, equals, or colon delimiters.
 */
export function parseRule(ruleStr: string): LSystemRule | null {
  // Try common delimiters
  for (const delim of ['→', '->', '=>', '=', ':']) {
    const idx = ruleStr.indexOf(delim);
    if (idx >= 0) {
      const from = ruleStr.slice(0, idx).trim();
      const to = ruleStr.slice(idx + delim.length).trim();
      if (from.length === 1 && to.length > 0) {
        return { from, to };
      }
    }
  }
  return null;
}

/**
 * Apply L-system string rewriting for a given number of iterations.
 */
export function rewrite(axiom: string, rules: LSystemRule[], iterations: number): string {
  let current = axiom;
  for (let i = 0; i < iterations; i++) {
    // Safety: don't let strings explode beyond reasonable size
    if (current.length > 100_000) {
      break;
    }
    let next = '';
    for (const ch of current) {
      const rule = rules.find((r) => r.from === ch);
      next += rule ? rule.to : ch;
      // Also cap during construction
      if (next.length > 100_000) {
        break;
      }
    }
    current = next;
  }
  return current;
}

// ─── Turtle State ────────────────────────────────────────

interface TurtleState {
  x: number;
  y: number;
  angle: number;
}

interface TurtleBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Execute turtle graphics from an L-system string.
 * Returns an array of line segments for rendering.
 */
export function executeTurtle(
  instructions: string,
  angleDeg: number,
  lineLength: number,
): { segments: Array<{ x1: number; y1: number; x2: number; y2: number }>; bounds: TurtleBounds } {
  const angleRad = (angleDeg * Math.PI) / 180;
  const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const stack: TurtleState[] = [];

  let state: TurtleState = { x: 0, y: 0, angle: -Math.PI / 2 }; // start pointing up
  const bounds: TurtleBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };

  for (const ch of instructions) {
    switch (ch) {
      case 'F':
      case 'G': {
        // Move forward drawing a line
        const nx = state.x + Math.cos(state.angle) * lineLength;
        const ny = state.y + Math.sin(state.angle) * lineLength;
        segments.push({ x1: state.x, y1: state.y, x2: nx, y2: ny });
        state.x = nx;
        state.y = ny;
        bounds.minX = Math.min(bounds.minX, nx);
        bounds.maxX = Math.max(bounds.maxX, nx);
        bounds.minY = Math.min(bounds.minY, ny);
        bounds.maxY = Math.max(bounds.maxY, ny);
        break;
      }
      case 'f': {
        // Move forward without drawing
        state.x += Math.cos(state.angle) * lineLength;
        state.y += Math.sin(state.angle) * lineLength;
        bounds.minX = Math.min(bounds.minX, state.x);
        bounds.maxX = Math.max(bounds.maxX, state.x);
        bounds.minY = Math.min(bounds.minY, state.y);
        bounds.maxY = Math.max(bounds.maxY, state.y);
        break;
      }
      case '+':
        // Turn left
        state.angle -= angleRad;
        break;
      case '-':
        // Turn right
        state.angle += angleRad;
        break;
      case '[':
        stack.push({ ...state });
        break;
      case ']':
        if (stack.length > 0) {
          state = stack.pop()!;
        }
        break;
      // Other characters are no-ops (structural placeholders)
    }
  }

  return { segments, bounds };
}

// ─── L-System Renderer ──────────────────────────────────

export class LSystemRenderer extends NatureSimulation {
  private cachedString = '';
  private cachedSegments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  private cachedBounds: TurtleBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  private lastAxiom = '';
  private lastRule = '';
  private lastIterations = 0;
  private lastAngle = 0;
  private lastLineLength = 0;

  constructor() {
    super('l-system-renderer', {
      axiom: 'F',
      rule: 'F=F[+F]F[-F]F',
      iterations: 3,
      angle: 25,
      'line-length': 10,
    });
  }

  private rebuildIfNeeded(): void {
    const axiom = this.getStringParam('axiom');
    const ruleStr = this.getStringParam('rule');
    const iterations = Math.min(this.getNumParam('iterations'), 8);
    const angle = this.getNumParam('angle');
    const lineLength = this.getNumParam('line-length');

    if (
      axiom === this.lastAxiom &&
      ruleStr === this.lastRule &&
      iterations === this.lastIterations &&
      angle === this.lastAngle &&
      lineLength === this.lastLineLength
    ) {
      return; // No change
    }

    this.lastAxiom = axiom;
    this.lastRule = ruleStr;
    this.lastIterations = iterations;
    this.lastAngle = angle;
    this.lastLineLength = lineLength;

    // Parse rules (support multiple rules separated by semicolons)
    const rules: LSystemRule[] = [];
    for (const part of ruleStr.split(';')) {
      const rule = parseRule(part.trim());
      if (rule) rules.push(rule);
    }

    // Rewrite
    this.cachedString = rewrite(axiom, rules, iterations);

    // Execute turtle
    const result = executeTurtle(this.cachedString, angle, lineLength);
    this.cachedSegments = result.segments;
    this.cachedBounds = result.bounds;
  }

  render(_time: number, params: Map<string, ParamValue>): void {
    const ctx = this.ctx;
    if (!ctx) return;

    for (const [k, v] of params) {
      if (!this.simulationParams.has(k)) {
        this.simulationParams.set(k, v);
      }
    }

    this.rebuildIfNeeded();

    const w = this.width;
    const h = this.height;

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    if (this.cachedSegments.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '14px monospace';
      ctx.fillText('No segments to render. Check axiom and rules.', 10, h / 2);
      return;
    }

    // Compute transform to fit within canvas with padding
    const bounds = this.cachedBounds;
    const bw = bounds.maxX - bounds.minX || 1;
    const bh = bounds.maxY - bounds.minY || 1;
    const padding = 40;
    const scaleX = (w - padding * 2) / bw;
    const scaleY = (h - padding * 2) / bh;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = padding + ((w - padding * 2) - bw * scale) / 2 - bounds.minX * scale;
    const offsetY = padding + ((h - padding * 2) - bh * scale) / 2 - bounds.minY * scale;

    // Draw segments with depth coloring
    const totalSegments = this.cachedSegments.length;
    ctx.lineWidth = Math.max(1, Math.min(2, 200 / Math.sqrt(totalSegments)));
    ctx.lineCap = 'round';

    for (let i = 0; i < totalSegments; i++) {
      const seg = this.cachedSegments[i];
      const progress = i / totalSegments;

      // Color gradient from green to brown (tree-like)
      const r = Math.floor(40 + progress * 100);
      const g = Math.floor(180 - progress * 80);
      const b = Math.floor(40 + progress * 20);
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;

      ctx.beginPath();
      ctx.moveTo(seg.x1 * scale + offsetX, seg.y1 * scale + offsetY);
      ctx.lineTo(seg.x2 * scale + offsetX, seg.y2 * scale + offsetY);
      ctx.stroke();
    }

    // Info text
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`L-System: ${this.getStringParam('axiom')} (${this.getNumParam('iterations')} iter)`, 10, 20);
    ctx.fillText(`Segments: ${totalSegments}`, 10, 36);
    ctx.fillText(`String length: ${this.cachedString.length}`, 10, 52);
  }
}
