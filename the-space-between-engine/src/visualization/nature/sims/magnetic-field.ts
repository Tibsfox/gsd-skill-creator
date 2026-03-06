// ─── Magnetic Field ─────────────────────────────────────
// Iron-filing style magnetic field visualization with
// a "compass fox" navigator that aligns with local field direction.

import type { ParamValue } from '../../../types/index.js';
import { NatureSimulation } from '../framework.js';

export class MagneticField extends NatureSimulation {
  private foxX = 0.5;
  private foxY = 0.5;
  private isDraggingFox = false;

  constructor() {
    super('magnetic-field', {
      'dipole-strength': 1.5,
      'dipole-x': 0.5,
      'dipole-y': 0.5,
      'show-field-lines': true,
    });
  }

  /**
   * Compute magnetic field vector (Bx, By) at position (px, py)
   * from a magnetic dipole at (dx, dy) with given strength.
   * The dipole is oriented horizontally (N to the right, S to the left).
   */
  private computeField(
    px: number,
    py: number,
    dx: number,
    dy: number,
    strength: number,
  ): { bx: number; by: number } {
    // Offset from dipole center, with two poles separated slightly
    const sep = 0.08;
    // North pole at (dx + sep, dy), South pole at (dx - sep, dy)
    const npx = dx + sep;
    const spx = dx - sep;

    // Field from north pole (outward)
    const rnx = px - npx;
    const rny = py - dy;
    const rn = Math.sqrt(rnx * rnx + rny * rny) || 0.001;
    const rn3 = rn * rn * rn;

    // Field from south pole (inward)
    const rsx = px - spx;
    const rsy = py - dy;
    const rs = Math.sqrt(rsx * rsx + rsy * rsy) || 0.001;
    const rs3 = rs * rs * rs;

    return {
      bx: strength * (rnx / rn3 - rsx / rs3),
      by: strength * (rny / rn3 - rsy / rs3),
    };
  }

  onPointerDown(x: number, y: number): void {
    // Check if click is near the fox
    const dist = Math.sqrt((x - this.foxX) ** 2 + (y - this.foxY) ** 2);
    if (dist < 0.05) {
      this.isDraggingFox = true;
    }
  }

  onPointerMove(x: number, y: number): void {
    if (this.isDraggingFox) {
      this.foxX = Math.max(0.05, Math.min(0.95, x));
      this.foxY = Math.max(0.05, Math.min(0.95, y));
    }
  }

  onPointerUp(): void {
    this.isDraggingFox = false;
  }

  render(time: number, params: Map<string, ParamValue>): void {
    const ctx = this.ctx;
    if (!ctx) return;

    for (const [k, v] of params) {
      if (!this.simulationParams.has(k)) {
        this.simulationParams.set(k, v);
      }
    }

    const strength = this.getNumParam('dipole-strength');
    const dipoleX = this.getNumParam('dipole-x');
    const dipoleY = this.getNumParam('dipole-y');
    const showFieldLines = this.getBoolParam('show-field-lines');

    const w = this.width;
    const h = this.height;
    const t = time / 1000;

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#08080e';
    ctx.fillRect(0, 0, w, h);

    // Draw iron filings (grid of small lines aligned with field)
    const gridCols = 30;
    const gridRows = 22;

    for (let gx = 1; gx < gridCols; gx++) {
      for (let gy = 1; gy < gridRows; gy++) {
        const px = gx / gridCols;
        const py = gy / gridRows;

        const { bx, by } = this.computeField(px, py, dipoleX, dipoleY, strength);
        const mag = Math.sqrt(bx * bx + by * by);
        if (mag < 0.001) continue;

        // Normalize
        const nx = bx / mag;
        const ny = by / mag;

        // Filing length proportional to field strength (capped)
        const filingLen = Math.min(8, mag * 2 + 2);

        const screenX = px * w;
        const screenY = py * h;

        // Color by field magnitude
        const intensity = Math.min(1, mag * 0.5);
        const r = Math.floor(100 + intensity * 155);
        const g = Math.floor(100 + intensity * 100);
        const b = Math.floor(140 + intensity * 80);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.5})`;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(screenX - nx * filingLen, screenY - ny * filingLen);
        ctx.lineTo(screenX + nx * filingLen, screenY + ny * filingLen);
        ctx.stroke();
      }
    }

    // Draw field lines if enabled
    if (showFieldLines) {
      this.drawFieldLines(ctx, w, h, dipoleX, dipoleY, strength);
    }

    // Draw dipole (N and S poles)
    const sep = 0.08;
    const npScreenX = (dipoleX + sep) * w;
    const spScreenX = (dipoleX - sep) * w;
    const poleScreenY = dipoleY * h;

    // North pole (red)
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(npScreenX, poleScreenY, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText('N', npScreenX - 3, poleScreenY + 4);

    // South pole (blue)
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.arc(spScreenX, poleScreenY, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('S', spScreenX - 3, poleScreenY + 4);

    // Bar connecting poles
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(spScreenX + 8, poleScreenY);
    ctx.lineTo(npScreenX - 8, poleScreenY);
    ctx.stroke();

    // Draw compass fox
    this.drawCompassFox(ctx, w, h, dipoleX, dipoleY, strength, t);

    // Info
    ctx.fillStyle = '#aaa';
    ctx.font = '12px monospace';
    ctx.fillText(`Dipole Strength: ${strength.toFixed(1)}`, 10, 20);
    ctx.fillText(`Field Lines: ${showFieldLines ? 'ON' : 'OFF'}`, 10, 36);
    ctx.fillText('Drag the fox to explore the field', 10, h - 10);
  }

  /**
   * Trace field lines from north to south pole.
   */
  private drawFieldLines(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dx: number,
    dy: number,
    strength: number,
  ): void {
    const sep = 0.08;
    const npx = dx + sep;

    // Start field lines at various angles around north pole
    const lineCount = 12;
    ctx.lineWidth = 1;

    for (let i = 0; i < lineCount; i++) {
      const startAngle = (i / lineCount) * 2 * Math.PI;
      let px = npx + 0.02 * Math.cos(startAngle);
      let py = dy + 0.02 * Math.sin(startAngle);

      ctx.strokeStyle = `rgba(255, 200, 100, 0.25)`;
      ctx.beginPath();
      ctx.moveTo(px * w, py * h);

      const steps = 200;
      const stepSize = 0.005;
      let valid = true;

      for (let s = 0; s < steps && valid; s++) {
        const { bx, by } = this.computeField(px, py, dx, dy, strength);
        const mag = Math.sqrt(bx * bx + by * by);
        if (mag < 0.0001) break;

        px += (bx / mag) * stepSize;
        py += (by / mag) * stepSize;

        // Bail if out of bounds
        if (px < -0.1 || px > 1.1 || py < -0.1 || py > 1.1) {
          valid = false;
        }

        ctx.lineTo(px * w, py * h);
      }

      ctx.stroke();
    }
  }

  /**
   * Draw the compass fox -- a small fox icon that aligns with the local field.
   */
  private drawCompassFox(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dx: number,
    dy: number,
    strength: number,
    _t: number,
  ): void {
    const { bx, by } = this.computeField(this.foxX, this.foxY, dx, dy, strength);
    const angle = Math.atan2(by, bx);

    const screenX = this.foxX * w;
    const screenY = this.foxY * h;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(angle);

    // Fox body (oval)
    ctx.fillStyle = '#dd8833';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 8, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Fox head (circle at front)
    ctx.fillStyle = '#ee9944';
    ctx.beginPath();
    ctx.arc(12, 0, 7, 0, 2 * Math.PI);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#dd8833';
    ctx.beginPath();
    ctx.moveTo(14, -6);
    ctx.lineTo(20, -12);
    ctx.lineTo(18, -5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(14, 6);
    ctx.lineTo(20, 12);
    ctx.lineTo(18, 5);
    ctx.closePath();
    ctx.fill();

    // Nose
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(18, 0, 2, 0, 2 * Math.PI);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(14, -3, 1.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(14, 3, 1.5, 0, 2 * Math.PI);
    ctx.fill();

    // Tail
    ctx.strokeStyle = '#cc7722';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.quadraticCurveTo(-20, -8, -22, 0);
    ctx.stroke();

    // White tail tip
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, -4);
    ctx.quadraticCurveTo(-22, -2, -22, 0);
    ctx.stroke();

    ctx.restore();

    // Compass ring around fox
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 22, 0, 2 * Math.PI);
    ctx.stroke();

    // Direction indicator
    ctx.fillStyle = '#ffcc66';
    ctx.beginPath();
    ctx.arc(
      screenX + Math.cos(angle) * 22,
      screenY + Math.sin(angle) * 22,
      3,
      0,
      2 * Math.PI,
    );
    ctx.fill();
  }
}
