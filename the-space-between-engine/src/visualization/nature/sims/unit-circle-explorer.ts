// Unit Circle Explorer — Nature Simulation
// Draggable point on the unit circle with sin/cos/tan readout.
// Foundation: unit-circle

import type { InteractiveParam, FoundationId } from '../../../types/index';
import type { CanvasManager } from '../../canvas';
import { NatureSimulation } from '../framework';

export class UnitCircleExplorer extends NatureSimulation {
  readonly id = 'unit-circle-explorer';
  readonly name = 'Unit Circle Explorer';
  readonly foundationId: FoundationId = 'unit-circle';

  private canvasManager: CanvasManager | null = null;
  private rendererId: string | null = null;

  // Parameters
  private angle = 0; // radians
  private showSin = true;
  private showCos = true;
  private showTan = false;
  private animating = false;
  private animSpeed = 1; // radians per second

  // Interaction state
  private dragging = false;

  init(canvas: CanvasManager, rendererId: string): void {
    this.canvasManager = canvas;
    this.rendererId = rendererId;

    canvas.onPointerEvent(rendererId, (evt) => {
      if (evt.type === 'down') {
        this.dragging = true;
        this.updateAngleFromPointer(evt.x, evt.y);
      } else if (evt.type === 'move' && this.dragging) {
        this.updateAngleFromPointer(evt.x, evt.y);
      } else if (evt.type === 'up') {
        this.dragging = false;
      }
    });
  }

  private updateAngleFromPointer(nx: number, ny: number): void {
    // Convert normalized coords to centered coords
    const cx = nx - 0.5;
    const cy = -(ny - 0.5); // flip Y so up is positive
    this.angle = Math.atan2(cy, cx);
    if (this.angle < 0) this.angle += Math.PI * 2;
  }

  update(deltaTime: number): void {
    if (this.animating && !this.dragging) {
      this.angle += deltaTime * this.animSpeed;
      if (this.angle > Math.PI * 2) {
        this.angle -= Math.PI * 2;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    const size = Math.min(width, height);
    const radius = size * 0.32;
    const cx = width / 2;
    const cy = height / 2;

    const pointX = Math.cos(this.angle);
    const pointY = Math.sin(this.angle);

    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - radius - 20, cy);
    ctx.lineTo(cx + radius + 20, cy);
    ctx.moveTo(cx, cy - radius - 20);
    ctx.lineTo(cx, cy + radius + 20);
    ctx.stroke();

    // Draw unit circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw angle arc
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.15, 0, -this.angle, true);
    ctx.stroke();

    // Draw radius line to point
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + pointX * radius, cy - pointY * radius);
    ctx.stroke();

    // Draw cos projection (horizontal)
    if (this.showCos) {
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + pointX * radius, cy);
      ctx.stroke();

      // Dashed drop line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(79, 195, 247, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + pointX * radius, cy);
      ctx.lineTo(cx + pointX * radius, cy - pointY * radius);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw sin projection (vertical)
    if (this.showSin) {
      ctx.strokeStyle = '#f06292';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + pointX * radius, cy);
      ctx.lineTo(cx + pointX * radius, cy - pointY * radius);
      ctx.stroke();

      // Dashed drop line from origin
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(240, 98, 146, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - pointY * radius);
      ctx.lineTo(cx + pointX * radius, cy - pointY * radius);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw tan line
    if (this.showTan && Math.abs(pointX) > 0.01) {
      const tanValue = pointY / pointX;
      // Tan line extends from the point (1,0) on the circle vertically
      const tanEndY = tanValue * radius;
      // Clamp for display
      const clampedTanY = Math.max(-radius * 2, Math.min(radius * 2, tanEndY));

      ctx.strokeStyle = '#a5d6a7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + radius, cy);
      ctx.lineTo(cx + radius, cy - clampedTanY);
      ctx.stroke();

      // Line from origin through point to tangent line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(165, 214, 167, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius, cy - clampedTanY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw the point
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + pointX * radius, cy - pointY * radius, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(cx + pointX * radius, cy - pointY * radius, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw readout
    const angleDeg = (this.angle * 180 / Math.PI);
    const sinVal = Math.sin(this.angle);
    const cosVal = Math.cos(this.angle);
    const tanVal = Math.abs(cosVal) > 0.001 ? Math.tan(this.angle) : NaN;

    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    const readoutX = 12;
    let readoutY = 22;

    ctx.fillStyle = 'rgba(255, 200, 100, 0.9)';
    ctx.fillText(`\u03B8: ${angleDeg.toFixed(1)}\u00B0 (${this.angle.toFixed(3)} rad)`, readoutX, readoutY);
    readoutY += 18;

    if (this.showCos) {
      ctx.fillStyle = '#4fc3f7';
      ctx.fillText(`cos(\u03B8): ${cosVal.toFixed(4)}`, readoutX, readoutY);
      readoutY += 18;
    }

    if (this.showSin) {
      ctx.fillStyle = '#f06292';
      ctx.fillText(`sin(\u03B8): ${sinVal.toFixed(4)}`, readoutX, readoutY);
      readoutY += 18;
    }

    if (this.showTan) {
      ctx.fillStyle = '#a5d6a7';
      const tanStr = isNaN(tanVal) ? 'undefined' : tanVal.toFixed(4);
      ctx.fillText(`tan(\u03B8): ${tanStr}`, readoutX, readoutY);
    }
  }

  getParams(): InteractiveParam[] {
    return [
      {
        name: 'angle',
        label: 'Angle \u03B8',
        type: 'slider',
        min: 0,
        max: 6.283,
        step: 0.01,
        default: 0,
        unit: 'rad',
        description: 'Angle in radians (also drag the point on the circle)',
      },
      {
        name: 'showSin',
        label: 'Show Sin',
        type: 'toggle',
        default: true,
        description: 'Show the sine projection (vertical)',
      },
      {
        name: 'showCos',
        label: 'Show Cos',
        type: 'toggle',
        default: true,
        description: 'Show the cosine projection (horizontal)',
      },
      {
        name: 'showTan',
        label: 'Show Tan',
        type: 'toggle',
        default: false,
        description: 'Show the tangent line',
      },
      {
        name: 'animating',
        label: 'Animate',
        type: 'toggle',
        default: false,
        description: 'Continuously rotate the point around the circle',
      },
      {
        name: 'animSpeed',
        label: 'Animation Speed',
        type: 'slider',
        min: 0.1,
        max: 5,
        step: 0.1,
        default: 1,
        unit: 'rad/s',
        description: 'Speed of rotation when animating',
      },
    ];
  }

  setParam(name: string, value: number | string | boolean): void {
    switch (name) {
      case 'angle':
        if (typeof value === 'number') this.angle = value;
        break;
      case 'showSin':
        if (typeof value === 'boolean') this.showSin = value;
        break;
      case 'showCos':
        if (typeof value === 'boolean') this.showCos = value;
        break;
      case 'showTan':
        if (typeof value === 'boolean') this.showTan = value;
        break;
      case 'animating':
        if (typeof value === 'boolean') this.animating = value;
        break;
      case 'animSpeed':
        if (typeof value === 'number') this.animSpeed = value;
        break;
    }
  }

  cleanup(): void {
    this.canvasManager = null;
    this.rendererId = null;
    this.angle = 0;
    this.dragging = false;
  }
}
