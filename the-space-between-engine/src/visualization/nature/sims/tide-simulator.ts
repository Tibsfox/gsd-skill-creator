// Tide Simulator — Nature Simulation
// M2 tidal constituent: h(t) = A * cos(2*pi/T * t + phi) where T = 12.42 hours.
// Moon phase affects the wave. Foundation: trigonometry
//
// Mathematical model:
//   Primary (M2): h_m2(t) = A * cos(2*pi / 12.42 * t + phi)
//   Secondary (S2): h_s2(t) = A2 * cos(2*pi / 12.00 * t + phi2)
//   Combined: h(t) = h_m2(t) + h_s2(t)  (when S2 is enabled)
//   Tolerance: |h(t) - A*cos(2*pi/12.42*t+phi)| < 0.001 for M2 alone

import type { InteractiveParam, FoundationId } from '../../../types/index';
import type { CanvasManager } from '../../canvas';
import { NatureSimulation } from '../framework';

const M2_PERIOD = 12.42; // hours — principal lunar semidiurnal constituent
const S2_PERIOD = 12.00; // hours — principal solar semidiurnal constituent
const TWO_PI = Math.PI * 2;

export class TideSimulator extends NatureSimulation {
  readonly id = 'tide-simulator';
  readonly name = 'Tide Simulator';
  readonly foundationId: FoundationId = 'trigonometry';

  private canvasManager: CanvasManager | null = null;
  private rendererId: string | null = null;

  // Parameters
  private amplitude = 1.0;
  private moonPhase = 0; // degrees 0-360
  private timeSpeed = 1.0; // simulation speed multiplier
  private showS2 = false; // show solar constituent
  private s2Amplitude = 0.46; // S2 amplitude relative to M2

  // Simulation state
  private simulationTime = 0; // hours
  private waterParticles: Array<{ x: number; phase: number }> = [];

  init(canvas: CanvasManager, rendererId: string): void {
    this.canvasManager = canvas;
    this.rendererId = rendererId;
    this.simulationTime = 0;

    // Initialize water surface particles for smooth rendering
    this.waterParticles = [];
    for (let i = 0; i < 100; i++) {
      this.waterParticles.push({
        x: i / 100,
        phase: Math.random() * TWO_PI,
      });
    }
  }

  /**
   * Compute M2 tidal height at time t.
   * h(t) = A * cos(2*pi/T * t + phi)
   * This is mathematically exact — the tolerance requirement is satisfied
   * because this IS the formula, not an approximation of it.
   */
  private computeM2(t: number): number {
    const phi = (this.moonPhase * Math.PI) / 180;
    return this.amplitude * Math.cos((TWO_PI / M2_PERIOD) * t + phi);
  }

  /**
   * Compute S2 (solar) tidal height at time t.
   */
  private computeS2(t: number): number {
    return this.s2Amplitude * this.amplitude * Math.cos((TWO_PI / S2_PERIOD) * t);
  }

  /**
   * Combined tide height at time t.
   */
  private computeTide(t: number): number {
    let h = this.computeM2(t);
    if (this.showS2) {
      h += this.computeS2(t);
    }
    return h;
  }

  update(deltaTime: number): void {
    // Advance simulation time (deltaTime is seconds, convert to hours for tidal model)
    this.simulationTime += deltaTime * this.timeSpeed * 0.5; // 0.5 hours per real second at 1x

    // Keep bounded to prevent float drift
    if (this.simulationTime > M2_PERIOD * 100) {
      this.simulationTime -= M2_PERIOD * 100;
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.5);
    skyGrad.addColorStop(0, '#0a0a2e');
    skyGrad.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height * 0.5);

    // Water area
    const waterGrad = ctx.createLinearGradient(0, height * 0.4, 0, height);
    waterGrad.addColorStop(0, '#0d3b66');
    waterGrad.addColorStop(1, '#051428');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, height * 0.4, width, height * 0.6);

    const waterlineBase = height * 0.55;
    const maxWaveHeight = height * 0.15;

    // Draw moon
    const moonAngleRad = (this.moonPhase * Math.PI) / 180;
    const moonX = width * 0.5 + Math.cos(moonAngleRad - Math.PI / 2) * width * 0.25;
    const moonY = height * 0.15 + Math.sin(moonAngleRad - Math.PI / 2) * height * 0.08;
    const moonRadius = 18;

    ctx.fillStyle = '#e8e8cc';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, TWO_PI);
    ctx.fill();

    // Moon phase shadow (simple crescent)
    const shadowPhase = (this.moonPhase % 360) / 360;
    if (shadowPhase > 0.01) {
      ctx.fillStyle = '#0a0a2e';
      ctx.beginPath();
      ctx.arc(moonX + moonRadius * Math.cos(shadowPhase * Math.PI) * 0.8, moonY,
        moonRadius * 0.95, 0, TWO_PI);
      ctx.fill();
    }

    // Draw water surface with tidal model
    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let px = 0; px <= width; px += 2) {
      const fraction = px / width;
      // Primary tide: use the exact M2 formula
      const tideH = this.computeTide(this.simulationTime);
      // Add small surface ripples for visual interest (these don't affect the tidal model)
      const ripple = Math.sin(fraction * TWO_PI * 8 + this.simulationTime * 3) * 2
        + Math.sin(fraction * TWO_PI * 13 + this.simulationTime * 5) * 1;
      const y = waterlineBase - tideH * maxWaveHeight + ripple;
      ctx.lineTo(px, y);
    }

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    const waveGrad = ctx.createLinearGradient(0, waterlineBase - maxWaveHeight, 0, height);
    waveGrad.addColorStop(0, 'rgba(30, 100, 180, 0.85)');
    waveGrad.addColorStop(0.4, 'rgba(15, 60, 120, 0.9)');
    waveGrad.addColorStop(1, 'rgba(5, 20, 40, 0.95)');
    ctx.fillStyle = waveGrad;
    ctx.fill();

    // Draw the S2 component separately if enabled (as a faint overlay)
    if (this.showS2) {
      ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let px = 0; px <= width; px += 3) {
        const tOffset = (px / width) * M2_PERIOD * 2; // show 2 full periods across
        const s2H = this.computeS2(this.simulationTime + tOffset);
        const y = waterlineBase - s2H * maxWaveHeight;
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();
    }

    // Draw tide level indicator
    const currentTide = this.computeTide(this.simulationTime);
    const tideY = waterlineBase - currentTide * maxWaveHeight;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, tideY);
    ctx.lineTo(width * 0.15, tideY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw readout
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`h(t) = ${currentTide.toFixed(4)}`, 10, 20);
    ctx.fillText(`t = ${this.simulationTime.toFixed(2)}h`, 10, 36);
    ctx.fillText(`M2 period: ${M2_PERIOD}h`, 10, 52);
    ctx.fillText(`Moon phase: ${this.moonPhase.toFixed(0)}\u00B0`, 10, 68);

    if (this.showS2) {
      ctx.fillStyle = 'rgba(255, 200, 100, 0.7)';
      ctx.fillText(`S2 period: ${S2_PERIOD}h`, 10, 84);
    }

    // Formula display
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '11px monospace';
    const formula = this.showS2
      ? `h(t) = A\u00B7cos(2\u03C0/${M2_PERIOD}\u00B7t+\u03C6) + A\u2082\u00B7cos(2\u03C0/${S2_PERIOD}\u00B7t)`
      : `h(t) = A\u00B7cos(2\u03C0/${M2_PERIOD}\u00B7t+\u03C6)`;
    ctx.fillText(formula, 10, height - 12);
  }

  getParams(): InteractiveParam[] {
    return [
      {
        name: 'amplitude',
        label: 'Amplitude (A)',
        type: 'slider',
        min: 0.1,
        max: 3.0,
        step: 0.1,
        default: 1.0,
        unit: 'm',
        description: 'Tidal amplitude in meters',
      },
      {
        name: 'moonPhase',
        label: 'Moon Phase',
        type: 'slider',
        min: 0,
        max: 360,
        step: 1,
        default: 0,
        unit: '\u00B0',
        description: 'Lunar phase angle affecting tide phase offset',
      },
      {
        name: 'timeSpeed',
        label: 'Time Speed',
        type: 'slider',
        min: 0.1,
        max: 10,
        step: 0.1,
        default: 1.0,
        description: 'Simulation speed multiplier',
      },
      {
        name: 'showS2',
        label: 'Show Solar (S2)',
        type: 'toggle',
        default: false,
        description: 'Add the S2 solar constituent for spring/neap tides',
      },
      {
        name: 's2Amplitude',
        label: 'S2 Amplitude',
        type: 'slider',
        min: 0.1,
        max: 1.0,
        step: 0.01,
        default: 0.46,
        description: 'S2 amplitude relative to M2',
      },
    ];
  }

  setParam(name: string, value: number | string | boolean): void {
    switch (name) {
      case 'amplitude':
        if (typeof value === 'number') this.amplitude = value;
        break;
      case 'moonPhase':
        if (typeof value === 'number') this.moonPhase = value;
        break;
      case 'timeSpeed':
        if (typeof value === 'number') this.timeSpeed = value;
        break;
      case 'showS2':
        if (typeof value === 'boolean') this.showS2 = value;
        break;
      case 's2Amplitude':
        if (typeof value === 'number') this.s2Amplitude = value;
        break;
    }
  }

  cleanup(): void {
    this.canvasManager = null;
    this.rendererId = null;
    this.simulationTime = 0;
    this.waterParticles = [];
  }
}
