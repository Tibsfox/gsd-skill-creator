// ─── Set Visualizer ──────────────────────────────────────
// Animated Venn diagram with elements flowing between regions
// based on set membership and operations (union, intersection, complement).

import type { ParamValue } from '../../../types/index.js';
import { NatureSimulation } from '../framework.js';

interface SetElement {
  x: number;
  y: number;
  vx: number;
  vy: number;
  membership: 'a' | 'b' | 'both' | 'neither';
  targetX: number;
  targetY: number;
  hue: number;
}

export class SetVisualizer extends NatureSimulation {
  private elements: SetElement[] = [];
  private lastSizeA = 0;
  private lastSizeB = 0;

  constructor() {
    super('set-visualizer', {
      'set-a-size': 20,
      'set-b-size': 20,
      'show-union': true,
      'show-intersection': true,
      'show-complement': false,
    });
  }

  /**
   * Determine the region center for a given membership type.
   */
  private getRegionCenter(
    membership: SetElement['membership'],
    cx: number,
    cy: number,
    radius: number,
    separation: number,
  ): { x: number; y: number } {
    const leftCx = cx - separation;
    const rightCx = cx + separation;

    switch (membership) {
      case 'a':
        return { x: leftCx - radius * 0.3, y: cy };
      case 'b':
        return { x: rightCx + radius * 0.3, y: cy };
      case 'both':
        return { x: cx, y: cy };
      case 'neither':
        return {
          x: cx + (Math.random() - 0.5) * radius * 3,
          y: cy + (Math.random() - 0.5) * radius * 3,
        };
    }
  }

  private rebuildElements(): void {
    const sizeA = Math.floor(this.getNumParam('set-a-size'));
    const sizeB = Math.floor(this.getNumParam('set-b-size'));

    if (sizeA === this.lastSizeA && sizeB === this.lastSizeB && this.elements.length > 0) {
      return;
    }

    this.lastSizeA = sizeA;
    this.lastSizeB = sizeB;

    const w = this.width || 800;
    const h = this.height || 600;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.25;
    const separation = radius * 0.5;

    this.elements = [];

    // Compute overlap count: a portion of smaller set is in both
    const overlapCount = Math.floor(Math.min(sizeA, sizeB) * 0.3);
    const onlyA = sizeA - overlapCount;
    const onlyB = sizeB - overlapCount;

    const createEl = (membership: SetElement['membership'], hue: number): SetElement => {
      const center = this.getRegionCenter(membership, cx, cy, radius, separation);
      const scatter = radius * 0.35;
      return {
        x: center.x + (Math.random() - 0.5) * scatter,
        y: center.y + (Math.random() - 0.5) * scatter,
        vx: 0,
        vy: 0,
        membership,
        targetX: center.x + (Math.random() - 0.5) * scatter,
        targetY: center.y + (Math.random() - 0.5) * scatter,
        hue,
      };
    };

    for (let i = 0; i < onlyA; i++) {
      this.elements.push(createEl('a', 210));
    }
    for (let i = 0; i < onlyB; i++) {
      this.elements.push(createEl('b', 30));
    }
    for (let i = 0; i < overlapCount; i++) {
      this.elements.push(createEl('both', 140));
    }
    // A few external elements
    for (let i = 0; i < 5; i++) {
      this.elements.push(createEl('neither', 0));
    }
  }

  render(time: number, params: Map<string, ParamValue>): void {
    const ctx = this.ctx;
    if (!ctx) return;

    for (const [k, v] of params) {
      if (!this.simulationParams.has(k)) {
        this.simulationParams.set(k, v);
      }
    }

    this.rebuildElements();

    const showUnion = this.getBoolParam('show-union');
    const showIntersection = this.getBoolParam('show-intersection');
    const showComplement = this.getBoolParam('show-complement');

    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.25;
    const separation = radius * 0.5;
    const leftCx = cx - separation;
    const rightCx = cx + separation;

    const t = time / 1000;

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, w, h);

    // Draw set circle outlines
    ctx.lineWidth = 2;

    // Highlight regions based on active operations
    if (showUnion) {
      // Fill both circles with semi-transparent union color
      ctx.fillStyle = 'rgba(60, 120, 200, 0.12)';
      ctx.beginPath();
      ctx.arc(leftCx, cy, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightCx, cy, radius, 0, 2 * Math.PI);
      ctx.fill();
    }

    if (showIntersection) {
      // Draw the intersection region brighter
      ctx.fillStyle = 'rgba(100, 220, 140, 0.15)';
      ctx.save();
      ctx.beginPath();
      ctx.arc(leftCx, cy, radius, 0, 2 * Math.PI);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(rightCx, cy, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    if (showComplement) {
      // Highlight the exterior area
      ctx.fillStyle = 'rgba(200, 80, 80, 0.08)';
      ctx.fillRect(0, 0, w, h);
      // Cut out the circles by drawing them with the background
      ctx.fillStyle = '#0a0a14';
      ctx.beginPath();
      ctx.arc(leftCx, cy, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightCx, cy, radius, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Circle outlines
    ctx.strokeStyle = '#4488cc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(leftCx, cy, radius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.strokeStyle = '#cc8844';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rightCx, cy, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Labels
    ctx.font = '16px monospace';
    ctx.fillStyle = '#4488cc';
    ctx.fillText('A', leftCx - radius * 0.6, cy - radius - 8);
    ctx.fillStyle = '#cc8844';
    ctx.fillText('B', rightCx + radius * 0.4, cy - radius - 8);

    // Animate and draw elements
    for (const el of this.elements) {
      // Gentle floating motion
      const drift = Math.sin(t * 0.5 + el.hue * 0.1) * 0.3;
      el.vx += (el.targetX - el.x) * 0.02 + drift * 0.1;
      el.vy += (el.targetY - el.y) * 0.02 + Math.cos(t * 0.7 + el.x * 0.01) * 0.1;
      el.vx *= 0.92;
      el.vy *= 0.92;
      el.x += el.vx;
      el.y += el.vy;

      // Determine visibility and brightness based on active operations
      let alpha = 0.6;
      let drawRadius = 3;

      if (showIntersection && el.membership === 'both') {
        alpha = 1.0;
        drawRadius = 5;
      }
      if (showUnion && (el.membership === 'a' || el.membership === 'b' || el.membership === 'both')) {
        alpha = Math.max(alpha, 0.8);
        drawRadius = Math.max(drawRadius, 4);
      }
      if (showComplement && el.membership === 'neither') {
        alpha = 1.0;
        drawRadius = 5;
      }

      ctx.fillStyle = `hsla(${el.hue}, 70%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(el.x, el.y, drawRadius, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Info text
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    const countA = this.elements.filter(e => e.membership === 'a' || e.membership === 'both').length;
    const countB = this.elements.filter(e => e.membership === 'b' || e.membership === 'both').length;
    const countIntersection = this.elements.filter(e => e.membership === 'both').length;
    ctx.fillText(`|A| = ${countA}  |B| = ${countB}  |A ∩ B| = ${countIntersection}`, 10, 20);

    const ops: string[] = [];
    if (showUnion) ops.push('A ∪ B');
    if (showIntersection) ops.push('A ∩ B');
    if (showComplement) ops.push("(A ∪ B)'");
    if (ops.length > 0) {
      ctx.fillText(`Showing: ${ops.join(', ')}`, 10, 36);
    }
  }
}
