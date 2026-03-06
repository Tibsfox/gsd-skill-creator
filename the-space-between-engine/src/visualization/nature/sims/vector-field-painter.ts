// Vector Field Painter — Nature Simulation
// Paint vectors, particles follow the field. Multiple field modes.
// Foundation: vector-calculus
//
// Field modes:
//   radial: F(x,y) = (x, y) / ||(x,y)|| — points outward from origin
//   vortex: F(x,y) = (-y, x) / ||(x,y)|| — swirls counterclockwise
//   sink:   F(x,y) = -(x, y) / ||(x,y)|| — converges to origin
//   saddle: F(x,y) = (x, -y) — saddle point at origin
//   custom: user-painted vectors interpolated across the field

import type { InteractiveParam, FoundationId } from '../../../types/index';
import type { CanvasManager } from '../../canvas';
import { NatureSimulation } from '../framework';

interface Particle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

interface PaintedVector {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

type FieldMode = 'radial' | 'vortex' | 'sink' | 'saddle' | 'custom';

export class VectorFieldPainter extends NatureSimulation {
  readonly id = 'vector-field-painter';
  readonly name = 'Vector Field Painter';
  readonly foundationId: FoundationId = 'vector-calculus';

  private canvasManager: CanvasManager | null = null;
  private rendererId: string | null = null;

  // Parameters
  private fieldMode: FieldMode = 'vortex';
  private particleCount = 200;
  private showGradient = false;
  private showArrows = true;
  private fieldStrength = 1.0;

  // State
  private particles: Particle[] = [];
  private paintedVectors: PaintedVector[] = [];
  private painting = false;
  private lastPaintX = 0;
  private lastPaintY = 0;

  init(canvas: CanvasManager, rendererId: string): void {
    this.canvasManager = canvas;
    this.rendererId = rendererId;
    this.resetParticles();

    canvas.onPointerEvent(rendererId, (evt) => {
      if (this.fieldMode !== 'custom') return;

      if (evt.type === 'down') {
        this.painting = true;
        this.lastPaintX = evt.x;
        this.lastPaintY = evt.y;
      } else if (evt.type === 'move' && this.painting) {
        const dx = evt.x - this.lastPaintX;
        const dy = evt.y - this.lastPaintY;
        if (Math.abs(dx) > 0.005 || Math.abs(dy) > 0.005) {
          this.paintedVectors.push({
            x: this.lastPaintX,
            y: this.lastPaintY,
            dx: dx * 10,
            dy: dy * 10,
          });
          this.lastPaintX = evt.x;
          this.lastPaintY = evt.y;
        }
      } else if (evt.type === 'up') {
        this.painting = false;
      }
    });
  }

  private resetParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.spawnParticle());
    }
  }

  private spawnParticle(): Particle {
    return {
      x: Math.random(),
      y: Math.random(),
      age: 0,
      maxAge: 2 + Math.random() * 4,
    };
  }

  /**
   * Evaluate the vector field at normalized position (x, y).
   * Returns [dx, dy] — the field direction and magnitude.
   */
  private evaluateField(nx: number, ny: number): [number, number] {
    // Convert to centered coordinates (-1 to 1)
    const x = (nx - 0.5) * 2;
    const y = (ny - 0.5) * 2;
    const r = Math.sqrt(x * x + y * y);
    const safeR = Math.max(r, 0.01);

    switch (this.fieldMode) {
      case 'radial':
        return [x / safeR * this.fieldStrength, y / safeR * this.fieldStrength];

      case 'vortex':
        return [-y / safeR * this.fieldStrength, x / safeR * this.fieldStrength];

      case 'sink':
        return [-x / safeR * this.fieldStrength, -y / safeR * this.fieldStrength];

      case 'saddle':
        return [x * this.fieldStrength, -y * this.fieldStrength];

      case 'custom':
        return this.evaluateCustomField(nx, ny);

      default:
        return [0, 0];
    }
  }

  /**
   * Interpolate custom painted vectors at position (nx, ny) using
   * inverse-distance weighting.
   */
  private evaluateCustomField(nx: number, ny: number): [number, number] {
    if (this.paintedVectors.length === 0) return [0, 0];

    let sumDx = 0;
    let sumDy = 0;
    let sumWeight = 0;

    for (const pv of this.paintedVectors) {
      const dist = Math.sqrt((nx - pv.x) ** 2 + (ny - pv.y) ** 2);
      const w = 1 / (dist * dist + 0.001);
      sumDx += pv.dx * w;
      sumDy += pv.dy * w;
      sumWeight += w;
    }

    if (sumWeight > 0) {
      return [(sumDx / sumWeight) * this.fieldStrength, (sumDy / sumWeight) * this.fieldStrength];
    }
    return [0, 0];
  }

  update(deltaTime: number): void {
    const dt = deltaTime * 0.3;

    // Ensure correct particle count
    while (this.particles.length < this.particleCount) {
      this.particles.push(this.spawnParticle());
    }
    while (this.particles.length > this.particleCount) {
      this.particles.pop();
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]!;
      p.age += deltaTime;

      if (p.age > p.maxAge || p.x < -0.1 || p.x > 1.1 || p.y < -0.1 || p.y > 1.1) {
        this.particles[i] = this.spawnParticle();
        continue;
      }

      const [dx, dy] = this.evaluateField(p.x, p.y);
      p.x += dx * dt;
      p.y += dy * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Semi-transparent overlay for trail effect
    ctx.fillStyle = 'rgba(10, 10, 26, 0.15)';
    ctx.fillRect(0, 0, width, height);

    // Draw gradient background if enabled
    if (this.showGradient) {
      this.drawGradient(ctx, width, height);
    }

    // Draw field arrows
    if (this.showArrows) {
      this.drawFieldArrows(ctx, width, height);
    }

    // Draw particles
    for (const p of this.particles) {
      const alpha = Math.min(1, (1 - p.age / p.maxAge) * 1.5);
      const px = p.x * width;
      const py = p.y * height;

      ctx.fillStyle = `rgba(79, 195, 247, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw painted vectors in custom mode
    if (this.fieldMode === 'custom') {
      ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)';
      ctx.lineWidth = 1;
      for (const pv of this.paintedVectors) {
        const sx = pv.x * width;
        const sy = pv.y * height;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + pv.dx * width * 0.05, sy + pv.dy * height * 0.05);
        ctx.stroke();
      }
    }

    // Readout
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'left';
    ctx.fillText(`Field: ${this.fieldMode}`, 10, 18);
    ctx.fillText(`Particles: ${this.particleCount}`, 10, 34);

    if (this.fieldMode === 'custom') {
      ctx.fillStyle = 'rgba(255, 200, 100, 0.6)';
      ctx.fillText('Draw vectors on canvas', 10, 52);
    }
  }

  private drawFieldArrows(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gridSize = 15;
    const arrowLen = Math.min(width, height) / gridSize * 0.35;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gy = 0; gy < gridSize; gy++) {
        const nx = (gx + 0.5) / gridSize;
        const ny = (gy + 0.5) / gridSize;
        const [dx, dy] = this.evaluateField(nx, ny);

        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag < 0.001) continue;

        const ndx = dx / mag;
        const ndy = dy / mag;
        const len = Math.min(arrowLen, arrowLen * mag);

        const sx = nx * width;
        const sy = ny * height;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + ndx * len, sy + ndy * len);
        ctx.stroke();

        // Arrowhead
        const headLen = len * 0.3;
        const angle = Math.atan2(ndy, ndx);
        ctx.beginPath();
        ctx.moveTo(sx + ndx * len, sy + ndy * len);
        ctx.lineTo(
          sx + ndx * len - Math.cos(angle - 0.4) * headLen,
          sy + ndy * len - Math.sin(angle - 0.4) * headLen,
        );
        ctx.moveTo(sx + ndx * len, sy + ndy * len);
        ctx.lineTo(
          sx + ndx * len - Math.cos(angle + 0.4) * headLen,
          sy + ndy * len - Math.sin(angle + 0.4) * headLen,
        );
        ctx.stroke();
      }
    }
  }

  private drawGradient(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gridSize = 30;
    const cellW = width / gridSize;
    const cellH = height / gridSize;

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gy = 0; gy < gridSize; gy++) {
        const nx = (gx + 0.5) / gridSize;
        const ny = (gy + 0.5) / gridSize;
        const [dx, dy] = this.evaluateField(nx, ny);
        const mag = Math.sqrt(dx * dx + dy * dy);
        const intensity = Math.min(1, mag * 0.5);

        ctx.fillStyle = `rgba(30, 80, 150, ${intensity * 0.3})`;
        ctx.fillRect(gx * cellW, gy * cellH, cellW, cellH);
      }
    }
  }

  getParams(): InteractiveParam[] {
    return [
      {
        name: 'fieldMode',
        label: 'Field Mode',
        type: 'select',
        default: 'vortex',
        description: 'Vector field type: radial, vortex, sink, saddle, or custom (paint)',
      },
      {
        name: 'particleCount',
        label: 'Particles',
        type: 'slider',
        min: 10,
        max: 500,
        step: 10,
        default: 200,
        description: 'Number of particles flowing through the field',
      },
      {
        name: 'fieldStrength',
        label: 'Field Strength',
        type: 'slider',
        min: 0.1,
        max: 3.0,
        step: 0.1,
        default: 1.0,
        description: 'Magnitude multiplier for the vector field',
      },
      {
        name: 'showGradient',
        label: 'Show Gradient',
        type: 'toggle',
        default: false,
        description: 'Display field magnitude as background gradient',
      },
      {
        name: 'showArrows',
        label: 'Show Arrows',
        type: 'toggle',
        default: true,
        description: 'Display field direction arrows on a grid',
      },
    ];
  }

  setParam(name: string, value: number | string | boolean): void {
    switch (name) {
      case 'fieldMode':
        if (typeof value === 'string' && ['radial', 'vortex', 'sink', 'saddle', 'custom'].includes(value)) {
          this.fieldMode = value as FieldMode;
          if (value !== 'custom') {
            this.paintedVectors = [];
          }
        }
        break;
      case 'particleCount':
        if (typeof value === 'number') this.particleCount = Math.round(value);
        break;
      case 'fieldStrength':
        if (typeof value === 'number') this.fieldStrength = value;
        break;
      case 'showGradient':
        if (typeof value === 'boolean') this.showGradient = value;
        break;
      case 'showArrows':
        if (typeof value === 'boolean') this.showArrows = value;
        break;
    }
  }

  cleanup(): void {
    this.canvasManager = null;
    this.rendererId = null;
    this.particles = [];
    this.paintedVectors = [];
    this.painting = false;
  }
}
