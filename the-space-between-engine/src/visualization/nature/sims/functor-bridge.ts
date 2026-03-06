// ─── Functor Bridge ─────────────────────────────────────
// Two categories with animated morphism arrows showing
// how a functor maps objects and preserves structure.

import type { ParamValue } from '../../../types/index.js';
import { NatureSimulation } from '../framework.js';

type CategoryType = 'shapes' | 'colors' | 'notes' | 'frequencies';

interface CategoryObject {
  label: string;
  x: number;
  y: number;
  color: string;
}

interface Morphism {
  from: number;
  to: number;
}

interface FunctorArrow {
  sourceIdx: number;
  targetIdx: number;
  progress: number; // 0-1 animation progress
}

/**
 * Build category objects for a given category type.
 */
function buildCategory(type: CategoryType): CategoryObject[] {
  switch (type) {
    case 'shapes':
      return [
        { label: 'Circle', x: 0, y: 0, color: '#66aaff' },
        { label: 'Square', x: 0, y: 0, color: '#66ccaa' },
        { label: 'Triangle', x: 0, y: 0, color: '#ffaa66' },
        { label: 'Pentagon', x: 0, y: 0, color: '#cc88dd' },
      ];
    case 'colors':
      return [
        { label: 'Red', x: 0, y: 0, color: '#ff4444' },
        { label: 'Blue', x: 0, y: 0, color: '#4488ff' },
        { label: 'Green', x: 0, y: 0, color: '#44cc44' },
        { label: 'Gold', x: 0, y: 0, color: '#ccaa22' },
      ];
    case 'notes':
      return [
        { label: 'C4', x: 0, y: 0, color: '#ff6688' },
        { label: 'E4', x: 0, y: 0, color: '#88cc44' },
        { label: 'G4', x: 0, y: 0, color: '#4488ff' },
        { label: 'B4', x: 0, y: 0, color: '#cc88ff' },
      ];
    case 'frequencies':
      return [
        { label: '261 Hz', x: 0, y: 0, color: '#ff6688' },
        { label: '329 Hz', x: 0, y: 0, color: '#88cc44' },
        { label: '392 Hz', x: 0, y: 0, color: '#4488ff' },
        { label: '494 Hz', x: 0, y: 0, color: '#cc88ff' },
      ];
  }
}

/**
 * Build internal morphisms (arrows within a category).
 * A simple chain: 0→1, 1→2, 2→3
 */
function buildMorphisms(count: number): Morphism[] {
  const morphisms: Morphism[] = [];
  for (let i = 0; i < count - 1; i++) {
    morphisms.push({ from: i, to: i + 1 });
  }
  return morphisms;
}

export class FunctorBridge extends NatureSimulation {
  private functorArrows: FunctorArrow[] = [];
  private lastSource: CategoryType = '' as CategoryType;
  private lastTarget: CategoryType = '' as CategoryType;
  private sourceObjects: CategoryObject[] = [];
  private targetObjects: CategoryObject[] = [];
  private sourceMorphisms: Morphism[] = [];
  private targetMorphisms: Morphism[] = [];

  constructor() {
    super('functor-bridge', {
      'source-category': 'shapes',
      'target-category': 'colors',
      'show-mapping': true,
    });
  }

  private rebuildIfNeeded(): void {
    const source = this.getStringParam('source-category') as CategoryType;
    const target = this.getStringParam('target-category') as CategoryType;

    if (source === this.lastSource && target === this.lastTarget) return;

    this.lastSource = source;
    this.lastTarget = target;

    this.sourceObjects = buildCategory(source);
    this.targetObjects = buildCategory(target);
    this.sourceMorphisms = buildMorphisms(this.sourceObjects.length);
    this.targetMorphisms = buildMorphisms(this.targetObjects.length);

    // Build functor arrows: F maps each source object to corresponding target object
    this.functorArrows = [];
    const count = Math.min(this.sourceObjects.length, this.targetObjects.length);
    for (let i = 0; i < count; i++) {
      this.functorArrows.push({
        sourceIdx: i,
        targetIdx: i,
        progress: 0,
      });
    }
  }

  /**
   * Position objects vertically within their column.
   */
  private layoutObjects(
    objects: CategoryObject[],
    centerX: number,
    startY: number,
    spacing: number,
  ): void {
    for (let i = 0; i < objects.length; i++) {
      objects[i].x = centerX;
      objects[i].y = startY + i * spacing;
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

    this.rebuildIfNeeded();

    const showMapping = this.getBoolParam('show-mapping');
    const w = this.width;
    const h = this.height;
    const t = time / 1000;

    // Layout
    const sourceX = w * 0.25;
    const targetX = w * 0.75;
    const startY = h * 0.2;
    const spacing = h * 0.15;

    this.layoutObjects(this.sourceObjects, sourceX, startY, spacing);
    this.layoutObjects(this.targetObjects, targetX, startY, spacing);

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, w, h);

    // Category boxes
    const boxPad = 30;
    const boxWidth = w * 0.3;
    const boxHeight = (this.sourceObjects.length - 1) * spacing + boxPad * 2;

    // Source category box
    ctx.strokeStyle = '#335588';
    ctx.lineWidth = 2;
    ctx.strokeRect(sourceX - boxWidth / 2, startY - boxPad, boxWidth, boxHeight);
    ctx.fillStyle = '#335588';
    ctx.font = '14px monospace';
    ctx.fillText(
      `Source: ${this.getStringParam('source-category')}`,
      sourceX - boxWidth / 2 + 8,
      startY - boxPad - 8,
    );

    // Target category box
    ctx.strokeStyle = '#885533';
    ctx.lineWidth = 2;
    ctx.strokeRect(targetX - boxWidth / 2, startY - boxPad, boxWidth, boxHeight);
    ctx.fillStyle = '#885533';
    ctx.fillText(
      `Target: ${this.getStringParam('target-category')}`,
      targetX - boxWidth / 2 + 8,
      startY - boxPad - 8,
    );

    // Draw source morphisms (arrows within source category)
    ctx.lineWidth = 1.5;
    for (const m of this.sourceMorphisms) {
      const from = this.sourceObjects[m.from];
      const to = this.sourceObjects[m.to];
      this.drawCurvedArrow(ctx, from.x + 30, from.y, to.x + 30, to.y, '#4466aa', 20);
    }

    // Draw target morphisms (arrows within target category)
    for (const m of this.targetMorphisms) {
      const from = this.targetObjects[m.from];
      const to = this.targetObjects[m.to];
      this.drawCurvedArrow(ctx, from.x + 30, from.y, to.x + 30, to.y, '#aa6644', 20);
    }

    // Draw functor arrows (source → target)
    if (showMapping) {
      for (const fa of this.functorArrows) {
        // Animate progress
        fa.progress = (Math.sin(t * 0.8 + fa.sourceIdx * 0.5) + 1) / 2;

        const src = this.sourceObjects[fa.sourceIdx];
        const tgt = this.targetObjects[fa.targetIdx];

        // Dashed arrow from source to target
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = `rgba(200, 200, 100, ${0.4 + fa.progress * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(src.x + 40, src.y);
        ctx.lineTo(tgt.x - 40, tgt.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated dot traveling along the arrow
        const dotX = src.x + 40 + (tgt.x - 40 - src.x - 40) * fa.progress;
        const dotY = src.y + (tgt.y - src.y) * fa.progress;
        ctx.fillStyle = '#ffff88';
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, 2 * Math.PI);
        ctx.fill();

        // Arrowhead at target
        this.drawArrowhead(ctx, tgt.x - 40, tgt.y, 0, '#cccc66');
      }
    }

    // Draw source objects
    for (const obj of this.sourceObjects) {
      this.drawObject(ctx, obj);
    }

    // Draw target objects
    for (const obj of this.targetObjects) {
      this.drawObject(ctx, obj);
    }

    // Functor label
    ctx.fillStyle = '#cccc88';
    ctx.font = '16px monospace';
    ctx.fillText('F', w / 2 - 5, h * 0.08);
    ctx.font = '12px monospace';
    ctx.fillText('functor', w / 2 - 20, h * 0.08 + 16);

    // Structure preservation note
    ctx.fillStyle = '#666';
    ctx.font = '11px monospace';
    ctx.fillText('If A → B in source, then F(A) → F(B) in target', 10, h - 10);
  }

  private drawObject(ctx: CanvasRenderingContext2D, obj: CategoryObject): void {
    // Circle node
    ctx.fillStyle = obj.color;
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, 12, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, 12, 0, 2 * Math.PI);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#ddd';
    ctx.font = '11px monospace';
    ctx.fillText(obj.label, obj.x - 25, obj.y + 24);
  }

  private drawCurvedArrow(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    curve: number,
  ): void {
    const mx = (x1 + x2) / 2 + curve;
    const my = (y1 + y2) / 2;

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(y2 - my, x2 - mx);
    this.drawArrowhead(ctx, x2, y2, angle, color);
  }

  private drawArrowhead(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    color: string,
  ): void {
    const headLen = 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x - headLen * Math.cos(angle - 0.4),
      y - headLen * Math.sin(angle - 0.4),
    );
    ctx.lineTo(
      x - headLen * Math.cos(angle + 0.4),
      y - headLen * Math.sin(angle + 0.4),
    );
    ctx.closePath();
    ctx.fill();
  }
}
