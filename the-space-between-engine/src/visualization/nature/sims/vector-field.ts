// ─── Vector Field Painter ────────────────────────────────
// 2D grid of arrows showing field direction with a particle
// system that follows field lines in real time.

import type { ParamValue } from '../../../types/index.js';
import { NatureSimulation } from '../framework.js';

type FieldType = 'radial' | 'vortex' | 'dipole';

interface Particle {
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

export class VectorFieldPainter extends NatureSimulation {
  private particles: Particle[] = [];
  private lastSpawnTime = 0;

  constructor() {
    super('vector-field', {
      'field-type': 'radial',
      'particle-count': 100,
      'show-gradient': true,
    });
  }

  /**
   * Compute the field vector (dx, dy) at a position (x, y)
   * where x,y are in [-1, 1] range centered on the viewport.
   */
  private computeField(x: number, y: number, fieldType: FieldType): { dx: number; dy: number } {
    switch (fieldType) {
      case 'radial': {
        const r = Math.sqrt(x * x + y * y) || 0.001;
        return { dx: x / r, dy: y / r };
      }
      case 'vortex': {
        const r = Math.sqrt(x * x + y * y) || 0.001;
        // Counterclockwise rotation with slight outward spiral
        return { dx: -y / r + x * 0.1 / r, dy: x / r + y * 0.1 / r };
      }
      case 'dipole': {
        // Two charges: positive at (-0.3, 0), negative at (0.3, 0)
        const px = -0.3, py = 0;
        const nx = 0.3, ny = 0;
        const dpx = x - px, dpy = y - py;
        const dnx = x - nx, dny = y - ny;
        const rp = Math.sqrt(dpx * dpx + dpy * dpy) || 0.001;
        const rn = Math.sqrt(dnx * dnx + dny * dny) || 0.001;
        const rp3 = rp * rp * rp;
        const rn3 = rn * rn * rn;
        return {
          dx: dpx / rp3 - dnx / rn3,
          dy: dpy / rp3 - dny / rn3,
        };
      }
    }
  }

  private spawnParticle(): Particle {
    return {
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      life: 0,
      maxLife: 100 + Math.random() * 200,
    };
  }

  private ensureParticles(count: number): void {
    while (this.particles.length < count) {
      this.particles.push(this.spawnParticle());
    }
    while (this.particles.length > count) {
      this.particles.pop();
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

    const fieldType = this.getStringParam('field-type') as FieldType;
    const particleCount = this.getNumParam('particle-count');
    const showGradient = this.getBoolParam('show-gradient');

    const w = this.width;
    const h = this.height;

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, w, h);

    // Draw gradient background if enabled
    if (showGradient) {
      this.drawGradient(ctx, w, h, fieldType);
    }

    // Draw arrow grid
    this.drawArrows(ctx, w, h, fieldType);

    // Update and draw particles
    this.ensureParticles(Math.floor(particleCount));
    this.updateParticles(fieldType);
    this.drawParticles(ctx, w, h);

    // Info
    ctx.fillStyle = '#aaa';
    ctx.font = '12px monospace';
    ctx.fillText(`Field: ${fieldType}`, 10, 20);
    ctx.fillText(`Particles: ${this.particles.length}`, 10, 36);

    this.lastSpawnTime = time;
  }

  private drawGradient(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    fieldType: FieldType,
  ): void {
    const step = 8;
    for (let py = 0; py < h; py += step) {
      for (let px = 0; px < w; px += step) {
        const x = (px / w) * 2 - 1;
        const y = (py / h) * 2 - 1;
        const { dx, dy } = this.computeField(x, y, fieldType);
        const mag = Math.sqrt(dx * dx + dy * dy);
        const intensity = Math.min(mag * 0.3, 1);
        ctx.fillStyle = `rgba(30, 60, 120, ${intensity * 0.3})`;
        ctx.fillRect(px, py, step, step);
      }
    }
  }

  private drawArrows(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    fieldType: FieldType,
  ): void {
    const gridSize = 20;
    const spacingX = w / gridSize;
    const spacingY = h / gridSize;

    ctx.lineWidth = 1;

    for (let gx = 1; gx < gridSize; gx++) {
      for (let gy = 1; gy < gridSize; gy++) {
        const px = gx * spacingX;
        const py = gy * spacingY;
        const x = (gx / gridSize) * 2 - 1;
        const y = (gy / gridSize) * 2 - 1;

        const { dx, dy } = this.computeField(x, y, fieldType);
        const mag = Math.sqrt(dx * dx + dy * dy) || 0.001;

        // Normalize and scale arrow
        const arrowLen = Math.min(spacingX * 0.4, mag * spacingX * 0.4);
        const ndx = (dx / mag) * arrowLen;
        const ndy = (dy / mag) * arrowLen;

        // Color based on magnitude
        const hue = 200 + Math.min(mag * 40, 60);
        const alpha = 0.3 + Math.min(mag * 0.3, 0.5);
        ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;

        // Draw arrow shaft
        ctx.beginPath();
        ctx.moveTo(px - ndx * 0.5, py - ndy * 0.5);
        ctx.lineTo(px + ndx * 0.5, py + ndy * 0.5);
        ctx.stroke();

        // Arrowhead
        const headLen = arrowLen * 0.3;
        const angle = Math.atan2(ndy, ndx);
        const tipX = px + ndx * 0.5;
        const tipY = py + ndy * 0.5;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(
          tipX - headLen * Math.cos(angle - 0.4),
          tipY - headLen * Math.sin(angle - 0.4),
        );
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(
          tipX - headLen * Math.cos(angle + 0.4),
          tipY - headLen * Math.sin(angle + 0.4),
        );
        ctx.stroke();
      }
    }
  }

  private updateParticles(fieldType: FieldType): void {
    const dt = 0.005;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life++;

      // Respawn if out of bounds or expired
      if (
        p.life > p.maxLife ||
        p.x < -1.1 || p.x > 1.1 ||
        p.y < -1.1 || p.y > 1.1
      ) {
        this.particles[i] = this.spawnParticle();
        continue;
      }

      const { dx, dy } = this.computeField(p.x, p.y, fieldType);
      const mag = Math.sqrt(dx * dx + dy * dy) || 0.001;
      // Normalize velocity so particles flow at consistent speed
      const speed = 0.8;
      p.x += (dx / mag) * speed * dt;
      p.y += (dy / mag) * speed * dt;
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    for (const p of this.particles) {
      const px = ((p.x + 1) / 2) * w;
      const py = ((p.y + 1) / 2) * h;

      // Fade in/out based on life
      const fadeIn = Math.min(p.life / 20, 1);
      const fadeOut = Math.min((p.maxLife - p.life) / 20, 1);
      const alpha = fadeIn * fadeOut * 0.8;

      ctx.fillStyle = `rgba(120, 200, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}
