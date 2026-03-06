// Magnetic Field — Nature Simulation
// Dipole magnetic field with "compass fox" navigating it.
// Foundation: vector-calculus
//
// Magnetic dipole field in 2D:
//   B_r = (mu_0 / 4*pi) * (2*m*cos(theta)) / r^3
//   B_theta = (mu_0 / 4*pi) * (m*sin(theta)) / r^3
// Simplified for visualization: unit magnetic moment, normalized coordinates.
//   Bx(x,y) = (3*x*y) / r^5  (for dipole at origin pointing +y)
//   By(x,y) = (3*y*y - r^2) / r^5
// with r = sqrt(x^2 + y^2), clamped to avoid singularity.

import type { InteractiveParam, FoundationId } from '../../../types/index';
import type { CanvasManager } from '../../canvas';
import { NatureSimulation } from '../framework';

const TWO_PI = Math.PI * 2;

export class MagneticField extends NatureSimulation {
  readonly id = 'magnetic-field';
  readonly name = 'Magnetic Field';
  readonly foundationId: FoundationId = 'vector-calculus';

  private canvasManager: CanvasManager | null = null;
  private rendererId: string | null = null;

  // Parameters
  private dipoleStrength = 1.0;
  private dipoleX = 0.5; // normalized position
  private dipoleY = 0.5;
  private showFieldLines = true;
  private showCompassFox = true;
  private foxSpeed = 0.3;

  // Fox state
  private foxX = 0.7;
  private foxY = 0.3;
  private foxAngle = 0; // radians, heading direction
  private foxTrail: Array<{ x: number; y: number }> = [];

  // Interaction
  private draggingDipole = false;

  init(canvas: CanvasManager, rendererId: string): void {
    this.canvasManager = canvas;
    this.rendererId = rendererId;
    this.foxTrail = [];

    canvas.onPointerEvent(rendererId, (evt) => {
      if (evt.type === 'down') {
        // Check if clicking near dipole
        const dist = Math.sqrt((evt.x - this.dipoleX) ** 2 + (evt.y - this.dipoleY) ** 2);
        if (dist < 0.05) {
          this.draggingDipole = true;
        }
      } else if (evt.type === 'move' && this.draggingDipole) {
        this.dipoleX = evt.x;
        this.dipoleY = evt.y;
      } else if (evt.type === 'up') {
        this.draggingDipole = false;
      }
    });
  }

  /**
   * Compute dipole magnetic field at position (px, py) given dipole at (dx, dy).
   * The dipole moment points in +y direction (vertical).
   * Returns [Bx, By] — the field components.
   */
  private computeField(px: number, py: number): [number, number] {
    const x = (px - this.dipoleX) * 4; // scale for visual spread
    const y = (py - this.dipoleY) * 4;
    const r2 = x * x + y * y;
    const r = Math.sqrt(r2);
    const minR = 0.15; // prevent singularity

    if (r < minR) {
      return [0, this.dipoleStrength];
    }

    const r5 = r2 * r2 * r;
    const m = this.dipoleStrength;

    // Dipole field (moment along y-axis):
    // Bx = 3*m*x*y / r^5
    // By = m*(3*y^2 - r^2) / r^5
    const Bx = (3 * m * x * y) / r5;
    const By = (m * (3 * y * y - r2)) / r5;

    return [Bx, By];
  }

  update(deltaTime: number): void {
    if (!this.showCompassFox) return;

    // Fox follows the magnetic field direction
    const [bx, by] = this.computeField(this.foxX, this.foxY);
    const bMag = Math.sqrt(bx * bx + by * by);

    if (bMag > 0.001) {
      // Fox heading aligns to field direction
      this.foxAngle = Math.atan2(-by, bx); // negative by because canvas y is flipped

      // Move fox along field lines
      const speed = this.foxSpeed * deltaTime * 0.1;
      this.foxX += (bx / bMag) * speed;
      this.foxY += (by / bMag) * speed;

      // Record trail
      this.foxTrail.push({ x: this.foxX, y: this.foxY });
      if (this.foxTrail.length > 200) {
        this.foxTrail.shift();
      }
    }

    // Wrap fox if it goes off-screen
    if (this.foxX < 0 || this.foxX > 1 || this.foxY < 0 || this.foxY > 1) {
      this.foxX = 0.5 + (Math.random() - 0.5) * 0.6;
      this.foxY = 0.5 + (Math.random() - 0.5) * 0.6;
      this.foxTrail = [];
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw iron-filing-style field visualization
    this.drawIronFilings(ctx, width, height);

    // Draw field lines
    if (this.showFieldLines) {
      this.drawFieldLines(ctx, width, height);
    }

    // Draw dipole
    const dpx = this.dipoleX * width;
    const dpy = this.dipoleY * height;

    // North pole (red)
    ctx.fillStyle = '#ef5350';
    ctx.beginPath();
    ctx.arc(dpx, dpy - 8, 6, 0, TWO_PI);
    ctx.fill();

    // South pole (blue)
    ctx.fillStyle = '#42a5f5';
    ctx.beginPath();
    ctx.arc(dpx, dpy + 8, 6, 0, TWO_PI);
    ctx.fill();

    // Bar
    ctx.fillStyle = '#888';
    ctx.fillRect(dpx - 3, dpy - 8, 6, 16);

    // Labels
    ctx.font = '10px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('N', dpx, dpy - 14);
    ctx.fillText('S', dpx, dpy + 22);

    // Draw compass fox
    if (this.showCompassFox) {
      this.drawFox(ctx, width, height);
    }

    // Readout
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`Dipole strength: ${this.dipoleStrength.toFixed(2)}`, 10, 18);
    ctx.fillText('Drag dipole to move', 10, 34);

    if (this.showCompassFox) {
      const [bx, by] = this.computeField(this.foxX, this.foxY);
      const bMag = Math.sqrt(bx * bx + by * by);
      ctx.fillStyle = 'rgba(255, 200, 100, 0.7)';
      ctx.fillText(`Fox |B|: ${bMag.toFixed(4)}`, 10, 52);
    }
  }

  private drawIronFilings(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gridSize = 25;
    const filingLen = Math.min(width, height) / gridSize * 0.3;

    ctx.strokeStyle = 'rgba(180, 180, 200, 0.2)';
    ctx.lineWidth = 1;

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gy = 0; gy < gridSize; gy++) {
        const nx = (gx + 0.5) / gridSize;
        const ny = (gy + 0.5) / gridSize;
        const [bx, by] = this.computeField(nx, ny);
        const mag = Math.sqrt(bx * bx + by * by);

        if (mag < 0.001) continue;

        const ndx = bx / mag;
        const ndy = by / mag;
        // Opacity proportional to field strength
        const alpha = Math.min(0.6, mag * 0.05);
        ctx.strokeStyle = `rgba(180, 180, 200, ${alpha})`;

        const sx = nx * width;
        const sy = ny * height;

        ctx.beginPath();
        ctx.moveTo(sx - ndx * filingLen * 0.5, sy - ndy * filingLen * 0.5);
        ctx.lineTo(sx + ndx * filingLen * 0.5, sy + ndy * filingLen * 0.5);
        ctx.stroke();
      }
    }
  }

  private drawFieldLines(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const lineCount = 12;
    const stepsPerLine = 100;
    const stepSize = 0.005;

    ctx.lineWidth = 1;

    for (let i = 0; i < lineCount; i++) {
      const startAngle = (i / lineCount) * TWO_PI;
      const startR = 0.03;
      let x = this.dipoleX + Math.cos(startAngle) * startR;
      let y = this.dipoleY + Math.sin(startAngle) * startR;

      const hue = (i / lineCount) * 60 + 200; // blue-cyan range
      ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.3)`;
      ctx.beginPath();
      ctx.moveTo(x * width, y * height);

      for (let s = 0; s < stepsPerLine; s++) {
        const [bx, by] = this.computeField(x, y);
        const mag = Math.sqrt(bx * bx + by * by);
        if (mag < 0.0001) break;

        x += (bx / mag) * stepSize;
        y += (by / mag) * stepSize;

        if (x < 0 || x > 1 || y < 0 || y > 1) break;

        ctx.lineTo(x * width, y * height);
      }
      ctx.stroke();
    }
  }

  private drawFox(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const fx = this.foxX * width;
    const fy = this.foxY * height;

    // Draw trail
    if (this.foxTrail.length > 1) {
      ctx.strokeStyle = 'rgba(255, 160, 50, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.foxTrail[0]!.x * width, this.foxTrail[0]!.y * height);
      for (let i = 1; i < this.foxTrail.length; i++) {
        ctx.lineTo(this.foxTrail[i]!.x * width, this.foxTrail[i]!.y * height);
      }
      ctx.stroke();
    }

    // Draw fox as a simple triangle pointing in its heading direction
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(-this.foxAngle); // negative because canvas y is down

    // Fox body (orange triangle)
    ctx.fillStyle = '#ff9800';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.fill();

    // Fox ears
    ctx.fillStyle = '#ffb74d';
    ctx.beginPath();
    ctx.moveTo(-2, -5);
    ctx.lineTo(-6, -10);
    ctx.lineTo(-6, -4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2, 5);
    ctx.lineTo(-6, 10);
    ctx.lineTo(-6, 4);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(2, -2, 1.5, 0, TWO_PI);
    ctx.fill();

    ctx.restore();
  }

  getParams(): InteractiveParam[] {
    return [
      {
        name: 'dipoleStrength',
        label: 'Dipole Strength',
        type: 'slider',
        min: 0.1,
        max: 3.0,
        step: 0.1,
        default: 1.0,
        description: 'Magnetic dipole moment magnitude',
      },
      {
        name: 'showFieldLines',
        label: 'Show Field Lines',
        type: 'toggle',
        default: true,
        description: 'Display computed magnetic field lines',
      },
      {
        name: 'showCompassFox',
        label: 'Show Compass Fox',
        type: 'toggle',
        default: true,
        description: 'Show the compass fox navigating the field',
      },
      {
        name: 'foxSpeed',
        label: 'Fox Speed',
        type: 'slider',
        min: 0.05,
        max: 1.0,
        step: 0.05,
        default: 0.3,
        description: 'How quickly the compass fox follows field lines',
      },
    ];
  }

  setParam(name: string, value: number | string | boolean): void {
    switch (name) {
      case 'dipoleStrength':
        if (typeof value === 'number') this.dipoleStrength = value;
        break;
      case 'showFieldLines':
        if (typeof value === 'boolean') this.showFieldLines = value;
        break;
      case 'showCompassFox':
        if (typeof value === 'boolean') this.showCompassFox = value;
        break;
      case 'foxSpeed':
        if (typeof value === 'number') this.foxSpeed = value;
        break;
    }
  }

  cleanup(): void {
    this.canvasManager = null;
    this.rendererId = null;
    this.foxTrail = [];
    this.draggingDipole = false;
  }
}
