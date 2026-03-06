// Set Visualizer — Nature Simulation
// Venn diagram with union/intersection/difference. Drag elements between sets.
// Foundation: set-theory
//
// Two sets A and B, displayed as overlapping circles (Venn diagram).
// Elements can be dragged between regions: A only, B only, A∩B, or outside.
// Highlights union, intersection, and difference operations.

import type { InteractiveParam, FoundationId } from '../../../types/index';
import type { CanvasManager } from '../../canvas';
import { NatureSimulation } from '../framework';

const TWO_PI = Math.PI * 2;

type SetOperation = 'union' | 'intersection' | 'difference' | 'symmetric-difference' | 'none';

interface SetElement {
  id: number;
  label: string;
  x: number; // normalized position
  y: number;
  inA: boolean;
  inB: boolean;
}

export class SetVisualizer extends NatureSimulation {
  readonly id = 'set-visualizer';
  readonly name = 'Set Visualizer';
  readonly foundationId: FoundationId = 'set-theory';

  private canvasManager: CanvasManager | null = null;
  private rendererId: string | null = null;

  // Parameters
  private highlightOp: SetOperation = 'none';
  private showLabels = true;
  private elementCount = 12;
  private overlap = 0.35; // how much the circles overlap (0-1)

  // State
  private elements: SetElement[] = [];
  private draggingElement: SetElement | null = null;
  private nextId = 0;

  // Circle geometry (in normalized coords)
  private circleAx = 0.38;
  private circleAy = 0.5;
  private circleBx = 0.62;
  private circleBy = 0.5;
  private circleR = 0.22;

  init(canvas: CanvasManager, rendererId: string): void {
    this.canvasManager = canvas;
    this.rendererId = rendererId;
    this.generateElements();

    canvas.onPointerEvent(rendererId, (evt) => {
      if (evt.type === 'down') {
        // Find element near click
        this.draggingElement = this.findNearestElement(evt.x, evt.y);
      } else if (evt.type === 'move' && this.draggingElement) {
        this.draggingElement.x = evt.x;
        this.draggingElement.y = evt.y;
        this.updateElementMembership(this.draggingElement);
      } else if (evt.type === 'up') {
        this.draggingElement = null;
      }
    });
  }

  private generateElements(): void {
    this.elements = [];
    const labels = [
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
      'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
    ];

    for (let i = 0; i < this.elementCount; i++) {
      const region = i % 4; // distribute among regions
      let x: number, y: number;

      switch (region) {
        case 0: // A only
          x = this.circleAx - this.circleR * 0.3 + Math.random() * this.circleR * 0.4;
          y = this.circleAy + (Math.random() - 0.5) * this.circleR * 0.8;
          break;
        case 1: // B only
          x = this.circleBx + this.circleR * 0.1 + Math.random() * this.circleR * 0.3;
          y = this.circleBy + (Math.random() - 0.5) * this.circleR * 0.8;
          break;
        case 2: // A ∩ B
          x = (this.circleAx + this.circleBx) / 2 + (Math.random() - 0.5) * this.circleR * 0.3;
          y = (this.circleAy + this.circleBy) / 2 + (Math.random() - 0.5) * this.circleR * 0.6;
          break;
        default: // Outside
          x = 0.1 + Math.random() * 0.8;
          y = 0.85 + Math.random() * 0.1;
          break;
      }

      const elem: SetElement = {
        id: this.nextId++,
        label: labels[i % labels.length]!,
        x,
        y,
        inA: false,
        inB: false,
      };

      this.updateElementMembership(elem);
      this.elements.push(elem);
    }
  }

  private updateElementMembership(elem: SetElement): void {
    const distA = Math.sqrt((elem.x - this.circleAx) ** 2 + (elem.y - this.circleAy) ** 2);
    const distB = Math.sqrt((elem.x - this.circleBx) ** 2 + (elem.y - this.circleBy) ** 2);
    elem.inA = distA <= this.circleR;
    elem.inB = distB <= this.circleR;
  }

  private findNearestElement(nx: number, ny: number): SetElement | null {
    let nearest: SetElement | null = null;
    let minDist = 0.04; // threshold

    for (const elem of this.elements) {
      const dist = Math.sqrt((elem.x - nx) ** 2 + (elem.y - ny) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = elem;
      }
    }

    return nearest;
  }

  private isHighlighted(elem: SetElement): boolean {
    switch (this.highlightOp) {
      case 'union': return elem.inA || elem.inB;
      case 'intersection': return elem.inA && elem.inB;
      case 'difference': return elem.inA && !elem.inB;
      case 'symmetric-difference': return (elem.inA && !elem.inB) || (!elem.inA && elem.inB);
      case 'none': return false;
    }
  }

  update(_deltaTime: number): void {
    // Update circle positions based on overlap parameter
    const separation = this.circleR * 2 * (1 - this.overlap);
    this.circleAx = 0.5 - separation / 2;
    this.circleBx = 0.5 + separation / 2;

    // Re-evaluate memberships
    for (const elem of this.elements) {
      if (elem !== this.draggingElement) {
        this.updateElementMembership(elem);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    const ax = this.circleAx * width;
    const ay = this.circleAy * height;
    const bx = this.circleBx * width;
    const by = this.circleBy * height;
    const r = this.circleR * Math.min(width, height);

    // Draw highlighted region first (behind circles)
    if (this.highlightOp !== 'none') {
      this.drawHighlightedRegion(ctx, ax, ay, bx, by, r, width, height);
    }

    // Draw circle A
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ax, ay, r, 0, TWO_PI);
    ctx.stroke();

    ctx.fillStyle = 'rgba(79, 195, 247, 0.08)';
    ctx.beginPath();
    ctx.arc(ax, ay, r, 0, TWO_PI);
    ctx.fill();

    // Draw circle B
    ctx.strokeStyle = '#f06292';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, TWO_PI);
    ctx.stroke();

    ctx.fillStyle = 'rgba(240, 98, 146, 0.08)';
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, TWO_PI);
    ctx.fill();

    // Labels
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4fc3f7';
    ctx.fillText('A', ax - r * 0.5, ay - r - 10);
    ctx.fillStyle = '#f06292';
    ctx.fillText('B', bx + r * 0.5, by - r - 10);

    // Draw elements
    for (const elem of this.elements) {
      const ex = elem.x * width;
      const ey = elem.y * height;
      const highlighted = this.isHighlighted(elem);
      const isDragging = elem === this.draggingElement;

      // Element circle
      let color: string;
      if (elem.inA && elem.inB) {
        color = '#ce93d8'; // purple for intersection
      } else if (elem.inA) {
        color = '#4fc3f7'; // blue for A
      } else if (elem.inB) {
        color = '#f06292'; // pink for B
      } else {
        color = '#666'; // grey for outside
      }

      const radius = isDragging ? 14 : (highlighted ? 12 : 10);
      const alpha = highlighted || this.highlightOp === 'none' ? 1.0 : 0.3;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(ex, ey, radius, 0, TWO_PI);
      ctx.fill();

      if (isDragging) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ex, ey, radius + 2, 0, TWO_PI);
        ctx.stroke();
      }

      // Label
      if (this.showLabels) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(elem.label, ex, ey + 4);
      }

      ctx.globalAlpha = 1;
    }

    // Compute set sizes for readout
    const aOnly = this.elements.filter(e => e.inA && !e.inB).length;
    const bOnly = this.elements.filter(e => !e.inA && e.inB).length;
    const both = this.elements.filter(e => e.inA && e.inB).length;
    const neither = this.elements.filter(e => !e.inA && !e.inB).length;

    // Readout
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`|A| = ${aOnly + both}`, 10, 18);
    ctx.fillText(`|B| = ${bOnly + both}`, 10, 34);
    ctx.fillText(`|A \u2229 B| = ${both}`, 10, 50);
    ctx.fillText(`|A \u222A B| = ${aOnly + bOnly + both}`, 10, 66);
    ctx.fillText(`|A \\ B| = ${aOnly}`, 10, 82);
    ctx.fillText(`|Outside| = ${neither}`, 10, 98);

    ctx.fillStyle = 'rgba(255, 200, 100, 0.5)';
    if (this.highlightOp !== 'none') {
      ctx.fillText(`Showing: ${this.highlightOp}`, 10, height - 12);
    } else {
      ctx.fillText('Drag elements between sets', 10, height - 12);
    }
  }

  private drawHighlightedRegion(
    ctx: CanvasRenderingContext2D,
    ax: number, ay: number,
    bx: number, by: number,
    r: number,
    _width: number, _height: number,
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.15;

    switch (this.highlightOp) {
      case 'union':
        // Draw both circles filled
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ax, ay, r, 0, TWO_PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, TWO_PI);
        ctx.fill();
        break;

      case 'intersection':
        // Clip to A, then fill B
        ctx.beginPath();
        ctx.arc(ax, ay, r, 0, TWO_PI);
        ctx.clip();
        ctx.fillStyle = '#ce93d8';
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, TWO_PI);
        ctx.fill();
        break;

      case 'difference':
        // Fill A, then clear B area
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.arc(ax, ay, r, 0, TWO_PI);
        ctx.fill();
        // Erase intersection
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, TWO_PI);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        break;

      case 'symmetric-difference':
        // A ∪ B minus A ∩ B
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ax, ay, r, 0, TWO_PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, TWO_PI);
        ctx.fill();
        // Erase intersection
        ctx.save();
        ctx.beginPath();
        ctx.arc(ax, ay, r, 0, TWO_PI);
        ctx.clip();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, TWO_PI);
        ctx.fill();
        ctx.restore();
        break;
    }

    ctx.restore();
  }

  getParams(): InteractiveParam[] {
    return [
      {
        name: 'highlightOp',
        label: 'Highlight Operation',
        type: 'select',
        default: 'none',
        description: 'Which set operation to highlight: union, intersection, difference, symmetric-difference',
      },
      {
        name: 'overlap',
        label: 'Overlap',
        type: 'slider',
        min: 0,
        max: 0.8,
        step: 0.05,
        default: 0.35,
        description: 'How much the two circles overlap',
      },
      {
        name: 'showLabels',
        label: 'Show Labels',
        type: 'toggle',
        default: true,
        description: 'Display element labels',
      },
      {
        name: 'elementCount',
        label: 'Element Count',
        type: 'slider',
        min: 4,
        max: 20,
        step: 1,
        default: 12,
        description: 'Number of set elements',
      },
    ];
  }

  setParam(name: string, value: number | string | boolean): void {
    switch (name) {
      case 'highlightOp':
        if (typeof value === 'string' && ['union', 'intersection', 'difference', 'symmetric-difference', 'none'].includes(value)) {
          this.highlightOp = value as SetOperation;
        }
        break;
      case 'overlap':
        if (typeof value === 'number') this.overlap = value;
        break;
      case 'showLabels':
        if (typeof value === 'boolean') this.showLabels = value;
        break;
      case 'elementCount':
        if (typeof value === 'number') {
          this.elementCount = Math.round(value);
          this.generateElements();
        }
        break;
    }
  }

  cleanup(): void {
    this.canvasManager = null;
    this.rendererId = null;
    this.elements = [];
    this.draggingElement = null;
  }
}
