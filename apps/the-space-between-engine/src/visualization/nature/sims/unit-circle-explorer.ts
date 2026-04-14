// ─── Unit Circle Explorer ────────────────────────────────
// Interactive unit circle with draggable point showing
// sin, cos, and tan projections in real time.

import type { ParamValue } from '../../../types/index.js';
import { NatureSimulation } from '../framework.js';

export class UnitCircleExplorer extends NatureSimulation {
  private isDragging = false;

  constructor() {
    super('unit-circle-explorer', {
      'angle-theta': 0.7854, // PI/4
      'show-sin': true,
      'show-cos': true,
      'show-tan': true,
    });
  }

  onPointerDown(x: number, y: number): void {
    this.isDragging = true;
    this.updateAngleFromPointer(x, y);
  }

  onPointerMove(x: number, y: number): void {
    if (this.isDragging) {
      this.updateAngleFromPointer(x, y);
    }
  }

  onPointerUp(): void {
    this.isDragging = false;
  }

  private updateAngleFromPointer(normX: number, normY: number): void {
    // Convert normalized coords (0..1) to canvas-centered coords
    const cx = this.width / 2;
    const cy = this.height / 2;
    const px = normX * this.width - cx;
    const py = normY * this.height - cy;
    let theta = Math.atan2(-py, px); // negate y because canvas y is inverted
    if (theta < 0) theta += 2 * Math.PI;
    this.simulationParams.set('angle-theta', theta);
  }

  render(_time: number, params: Map<string, ParamValue>): void {
    const ctx = this.ctx;
    if (!ctx) return;

    // Read params (prefer live simulation params merged with manager params)
    for (const [k, v] of params) {
      if (!this.simulationParams.has(k)) {
        this.simulationParams.set(k, v);
      }
    }

    const theta = this.getNumParam('angle-theta');
    const showSin = this.getBoolParam('show-sin');
    const showCos = this.getBoolParam('show-cos');
    const showTan = this.getBoolParam('show-tan');

    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.35;

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();

    // Unit circle
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Point on circle
    const px = cx + radius * Math.cos(theta);
    const py = cy - radius * Math.sin(theta); // canvas y inverted

    // Radius line from origin to point
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Sin line (vertical, red)
    if (showSin) {
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ff4444';
      ctx.font = '12px monospace';
      ctx.fillText(`sin = ${Math.sin(theta).toFixed(3)}`, px + 8, (cy + py) / 2);
    }

    // Cos line (horizontal, blue)
    if (showCos) {
      ctx.strokeStyle = '#4488ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, py);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#4488ff';
      ctx.font = '12px monospace';
      ctx.fillText(`cos = ${Math.cos(theta).toFixed(3)}`, (cx + px) / 2, py - 8);
    }

    // Tan line (green) -- tangent line at the point where circle crosses x-axis
    if (showTan) {
      const cosTheta = Math.cos(theta);
      if (Math.abs(cosTheta) > 0.01) {
        const tanVal = Math.tan(theta);
        const tanEndY = cy - radius * tanVal;

        // Draw from (cx + radius, cy) to (cx + radius, tanEndY)
        ctx.strokeStyle = '#44cc44';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + radius, cy);
        ctx.lineTo(cx + radius, tanEndY);
        ctx.stroke();

        // Dashed line from point to tangent endpoint
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#44cc44';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(cx + radius, tanEndY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = '#44cc44';
        ctx.font = '12px monospace';
        ctx.fillText(
          `tan = ${tanVal.toFixed(3)}`,
          cx + radius + 8,
          (cy + tanEndY) / 2,
        );
      }
    }

    // Point dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Angle arc
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.15, 0, -theta, true);
    ctx.stroke();

    // Theta label
    ctx.fillStyle = '#ccc';
    ctx.font = '14px monospace';
    ctx.fillText(
      `theta = ${theta.toFixed(3)} rad (${((theta * 180) / Math.PI).toFixed(1)} deg)`,
      10,
      20,
    );
  }
}
