// Functor Bridge — Nature Simulation
// Two side-by-side categories with structure-preserving mapping (functor).
// Foundation: category-theory
//
// A functor F: C -> D maps:
//   - Objects in C to objects in D
//   - Morphisms in C to morphisms in D
//   - Preserving identity: F(id_A) = id_{F(A)}
//   - Preserving composition: F(g . f) = F(g) . F(f)
//
// Source categories: shapes, colors, notes
// The functor maps objects and morphisms while preserving structure.

import type { InteractiveParam, FoundationId } from '../../../types/index';
import type { CanvasManager } from '../../canvas';
import { NatureSimulation } from '../framework';

const TWO_PI = Math.PI * 2;

interface CategoryObject {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
}

interface Morphism {
  from: string;
  to: string;
  label: string;
}

interface Category {
  name: string;
  objects: CategoryObject[];
  morphisms: Morphism[];
}

type SourceCategoryType = 'shapes' | 'colors' | 'notes';

export class FunctorBridge extends NatureSimulation {
  readonly id = 'functor-bridge';
  readonly name = 'Functor Bridge';
  readonly foundationId: FoundationId = 'category-theory';

  private canvasManager: CanvasManager | null = null;
  private rendererId: string | null = null;

  // Parameters
  private sourceType: SourceCategoryType = 'shapes';
  private mappingVisible = true;
  private animateMapping = true;
  private animPhase = 0;

  // Categories
  private source: Category = { name: '', objects: [], morphisms: [] };
  private target: Category = { name: '', objects: [], morphisms: [] };

  // Functor mapping: source object id -> target object id
  private objectMap: Map<string, string> = new Map();

  init(canvas: CanvasManager, rendererId: string): void {
    this.canvasManager = canvas;
    this.rendererId = rendererId;
    this.animPhase = 0;
    this.buildCategories();
  }

  private buildCategories(): void {
    switch (this.sourceType) {
      case 'shapes':
        this.buildShapeCategories();
        break;
      case 'colors':
        this.buildColorCategories();
        break;
      case 'notes':
        this.buildNoteCategories();
        break;
    }
  }

  private buildShapeCategories(): void {
    // Source: geometric shapes with area-preserving morphisms
    this.source = {
      name: 'Shapes',
      objects: [
        { id: 's1', label: 'Triangle', x: 0.15, y: 0.25, color: '#4fc3f7' },
        { id: 's2', label: 'Square', x: 0.15, y: 0.5, color: '#81c784' },
        { id: 's3', label: 'Circle', x: 0.15, y: 0.75, color: '#f06292' },
      ],
      morphisms: [
        { from: 's1', to: 's2', label: 'add side' },
        { from: 's2', to: 's3', label: 'smooth' },
        { from: 's1', to: 's3', label: 'limit' },
      ],
    };

    // Target: numbers with arithmetic morphisms
    this.target = {
      name: 'Sides',
      objects: [
        { id: 't1', label: '3', x: 0.85, y: 0.25, color: '#4fc3f7' },
        { id: 't2', label: '4', x: 0.85, y: 0.5, color: '#81c784' },
        { id: 't3', label: '\u221E', x: 0.85, y: 0.75, color: '#f06292' },
      ],
      morphisms: [
        { from: 't1', to: 't2', label: '+1' },
        { from: 't2', to: 't3', label: 'lim' },
        { from: 't1', to: 't3', label: 'lim' },
      ],
    };

    // Functor: F(shape) = number of sides
    this.objectMap = new Map([
      ['s1', 't1'],
      ['s2', 't2'],
      ['s3', 't3'],
    ]);
  }

  private buildColorCategories(): void {
    // Source: primary colors with mixing morphisms
    this.source = {
      name: 'Colors',
      objects: [
        { id: 'c1', label: 'Red', x: 0.15, y: 0.25, color: '#ef5350' },
        { id: 'c2', label: 'Blue', x: 0.15, y: 0.5, color: '#42a5f5' },
        { id: 'c3', label: 'Yellow', x: 0.15, y: 0.75, color: '#ffee58' },
      ],
      morphisms: [
        { from: 'c1', to: 'c2', label: 'complement' },
        { from: 'c2', to: 'c3', label: 'complement' },
        { from: 'c3', to: 'c1', label: 'complement' },
      ],
    };

    // Target: wavelengths
    this.target = {
      name: 'Wavelength',
      objects: [
        { id: 'w1', label: '700nm', x: 0.85, y: 0.25, color: '#ef5350' },
        { id: 'w2', label: '470nm', x: 0.85, y: 0.5, color: '#42a5f5' },
        { id: 'w3', label: '580nm', x: 0.85, y: 0.75, color: '#ffee58' },
      ],
      morphisms: [
        { from: 'w1', to: 'w2', label: '-230nm' },
        { from: 'w2', to: 'w3', label: '+110nm' },
        { from: 'w3', to: 'w1', label: '+120nm' },
      ],
    };

    this.objectMap = new Map([
      ['c1', 'w1'],
      ['c2', 'w2'],
      ['c3', 'w3'],
    ]);
  }

  private buildNoteCategories(): void {
    // Source: musical notes
    this.source = {
      name: 'Notes',
      objects: [
        { id: 'n1', label: 'C', x: 0.15, y: 0.2, color: '#4fc3f7' },
        { id: 'n2', label: 'E', x: 0.15, y: 0.4, color: '#81c784' },
        { id: 'n3', label: 'G', x: 0.15, y: 0.6, color: '#f06292' },
        { id: 'n4', label: "C'", x: 0.15, y: 0.8, color: '#ffcc80' },
      ],
      morphisms: [
        { from: 'n1', to: 'n2', label: 'maj 3rd' },
        { from: 'n2', to: 'n3', label: 'min 3rd' },
        { from: 'n3', to: 'n4', label: 'perf 4th' },
        { from: 'n1', to: 'n4', label: 'octave' },
      ],
    };

    // Target: frequency ratios
    this.target = {
      name: 'Ratios',
      objects: [
        { id: 'r1', label: '1:1', x: 0.85, y: 0.2, color: '#4fc3f7' },
        { id: 'r2', label: '5:4', x: 0.85, y: 0.4, color: '#81c784' },
        { id: 'r3', label: '3:2', x: 0.85, y: 0.6, color: '#f06292' },
        { id: 'r4', label: '2:1', x: 0.85, y: 0.8, color: '#ffcc80' },
      ],
      morphisms: [
        { from: 'r1', to: 'r2', label: '\u00D75/4' },
        { from: 'r2', to: 'r3', label: '\u00D76/5' },
        { from: 'r3', to: 'r4', label: '\u00D74/3' },
        { from: 'r1', to: 'r4', label: '\u00D72' },
      ],
    };

    this.objectMap = new Map([
      ['n1', 'r1'],
      ['n2', 'r2'],
      ['n3', 'r3'],
      ['n4', 'r4'],
    ]);
  }

  update(deltaTime: number): void {
    if (this.animateMapping) {
      this.animPhase += deltaTime * 0.8;
      if (this.animPhase > TWO_PI * 100) {
        this.animPhase -= TWO_PI * 100;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    // Category containers
    const leftX = width * 0.05;
    const rightX = width * 0.55;
    const catW = width * 0.35;
    const catH = height * 0.85;
    const catY = height * 0.08;

    // Source category box
    ctx.strokeStyle = 'rgba(79, 195, 247, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(leftX, catY, catW, catH);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#4fc3f7';
    ctx.textAlign = 'center';
    ctx.fillText(`Category: ${this.source.name}`, leftX + catW / 2, catY - 4);

    // Target category box
    ctx.strokeStyle = 'rgba(240, 98, 146, 0.3)';
    ctx.strokeRect(rightX, catY, catW, catH);

    ctx.fillStyle = '#f06292';
    ctx.fillText(`Category: ${this.target.name}`, rightX + catW / 2, catY - 4);

    // Draw morphisms in source
    this.drawMorphisms(ctx, this.source, width, height, 'rgba(79, 195, 247, 0.25)');

    // Draw morphisms in target
    this.drawMorphisms(ctx, this.target, width, height, 'rgba(240, 98, 146, 0.25)');

    // Draw functor mappings (the bridge)
    if (this.mappingVisible) {
      this.drawFunctorMappings(ctx, width, height);
    }

    // Draw objects in source
    this.drawObjects(ctx, this.source, width, height);

    // Draw objects in target
    this.drawObjects(ctx, this.target, width, height);

    // Functor label
    ctx.font = '16px monospace';
    ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('F', width * 0.5, height * 0.06);

    // Arrow
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.42, height * 0.04);
    ctx.lineTo(width * 0.58, height * 0.04);
    ctx.stroke();
    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(width * 0.58, height * 0.04);
    ctx.lineTo(width * 0.56, height * 0.025);
    ctx.moveTo(width * 0.58, height * 0.04);
    ctx.lineTo(width * 0.56, height * 0.055);
    ctx.stroke();

    // Readout
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('Functor preserves:', 10, height - 36);
    ctx.fillText('  F(id_A) = id_{F(A)}', 10, height - 22);
    ctx.fillText('  F(g\u2218f) = F(g)\u2218F(f)', 10, height - 8);
  }

  private drawObjects(ctx: CanvasRenderingContext2D, cat: Category, width: number, height: number): void {
    for (const obj of cat.objects) {
      const ox = obj.x * width;
      const oy = obj.y * height;

      // Object circle
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.arc(ox, oy, 18, 0, TWO_PI);
      ctx.fill();

      // Label
      ctx.fillStyle = '#000000';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(obj.label, ox, oy + 4);
    }
  }

  private drawMorphisms(ctx: CanvasRenderingContext2D, cat: Category, width: number, height: number, color: string): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    for (const morph of cat.morphisms) {
      const fromObj = cat.objects.find(o => o.id === morph.from);
      const toObj = cat.objects.find(o => o.id === morph.to);
      if (!fromObj || !toObj) continue;

      const fx = fromObj.x * width;
      const fy = fromObj.y * height;
      const tx = toObj.x * width;
      const ty = toObj.y * height;

      // Draw curved arrow
      const midX = (fx + tx) / 2 + 30;
      const midY = (fy + ty) / 2;

      ctx.beginPath();
      ctx.moveTo(fx + 18, fy);
      ctx.quadraticCurveTo(midX, midY, tx + 18, ty);
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(ty - midY, (tx + 18) - midX);
      ctx.beginPath();
      ctx.moveTo(tx + 18, ty);
      ctx.lineTo(tx + 18 - Math.cos(angle - 0.3) * 8, ty - Math.sin(angle - 0.3) * 8);
      ctx.moveTo(tx + 18, ty);
      ctx.lineTo(tx + 18 - Math.cos(angle + 0.3) * 8, ty - Math.sin(angle + 0.3) * 8);
      ctx.stroke();

      // Label
      ctx.font = '10px monospace';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(morph.label, midX + 5, midY - 5);
    }
  }

  private drawFunctorMappings(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const dashOffset = this.animateMapping ? this.animPhase * 10 : 0;

    for (const [sourceId, targetId] of Array.from(this.objectMap.entries())) {
      const sourceObj = this.source.objects.find(o => o.id === sourceId);
      const targetObj = this.target.objects.find(o => o.id === targetId);
      if (!sourceObj || !targetObj) continue;

      const sx = sourceObj.x * width + 20;
      const sy = sourceObj.y * height;
      const tx = targetObj.x * width - 20;
      const ty = targetObj.y * height;

      // Animated dashed line
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -dashOffset;
      ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();

      // Small arrow at target end
      const angle = Math.atan2(ty - sy, tx - sx);
      ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - Math.cos(angle - 0.4) * 8, ty - Math.sin(angle - 0.4) * 8);
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - Math.cos(angle + 0.4) * 8, ty - Math.sin(angle + 0.4) * 8);
      ctx.stroke();
    }
  }

  getParams(): InteractiveParam[] {
    return [
      {
        name: 'sourceType',
        label: 'Source Category',
        type: 'select',
        default: 'shapes',
        description: 'Choose source category: shapes, colors, or notes',
      },
      {
        name: 'mappingVisible',
        label: 'Show Mapping',
        type: 'toggle',
        default: true,
        description: 'Display the functor mapping between categories',
      },
      {
        name: 'animateMapping',
        label: 'Animate',
        type: 'toggle',
        default: true,
        description: 'Animate the functor mapping arrows',
      },
    ];
  }

  setParam(name: string, value: number | string | boolean): void {
    switch (name) {
      case 'sourceType':
        if (typeof value === 'string' && ['shapes', 'colors', 'notes'].includes(value)) {
          this.sourceType = value as SourceCategoryType;
          this.buildCategories();
        }
        break;
      case 'mappingVisible':
        if (typeof value === 'boolean') this.mappingVisible = value;
        break;
      case 'animateMapping':
        if (typeof value === 'boolean') this.animateMapping = value;
        break;
    }
  }

  cleanup(): void {
    this.canvasManager = null;
    this.rendererId = null;
    this.source = { name: '', objects: [], morphisms: [] };
    this.target = { name: '', objects: [], morphisms: [] };
    this.objectMap.clear();
  }
}
