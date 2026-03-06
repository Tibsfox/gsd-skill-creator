// Fourier Decomposer — Nature Simulation
// Add N sine components and watch them sum. Tolerance +/-0.001.
// Foundation: trigonometry
//
// Mathematical model:
//   f(x) = sum_{k=1}^{N} A_k * sin(k * baseFreq * x + phi_k)
// Each component is a pure sine at integer multiples of the base frequency.
// The sum is computed exactly (no approximation), so the tolerance is inherently met.

import type { InteractiveParam, FoundationId } from '../../../types/index';
import type { CanvasManager } from '../../canvas';
import { NatureSimulation } from '../framework';

const TWO_PI = Math.PI * 2;

interface FourierComponent {
  /** Harmonic number (1 = fundamental, 2 = 2nd harmonic, etc.) */
  harmonic: number;
  /** Amplitude coefficient */
  amplitude: number;
  /** Phase offset in radians */
  phase: number;
}

export class FourierDecomposer extends NatureSimulation {
  readonly id = 'fourier-decomposer';
  readonly name = 'Fourier Decomposer';
  readonly foundationId: FoundationId = 'trigonometry';

  private canvasManager: CanvasManager | null = null;
  private rendererId: string | null = null;

  // Parameters
  private frequencyCount = 4;
  private baseFrequency = 1.0;
  private showComponents = true;
  private waveformType: 'custom' | 'square' | 'sawtooth' | 'triangle' = 'square';
  private animPhase = 0;

  // Computed Fourier components
  private components: FourierComponent[] = [];

  init(canvas: CanvasManager, rendererId: string): void {
    this.canvasManager = canvas;
    this.rendererId = rendererId;
    this.animPhase = 0;
    this.rebuildComponents();
  }

  /**
   * Rebuild the Fourier component list based on the current waveform type.
   * Uses exact Fourier series coefficients:
   *   Square wave: sum of (1/k)*sin(k*x) for odd k
   *   Sawtooth: sum of (-1)^(k+1) * (1/k) * sin(k*x)
   *   Triangle: sum of (-1)^((k-1)/2) * (1/k^2) * sin(k*x) for odd k
   */
  private rebuildComponents(): void {
    this.components = [];
    const n = this.frequencyCount;

    switch (this.waveformType) {
      case 'square': {
        // Square wave: (4/pi) * sum_{k=1,3,5,...} (1/k) * sin(k*x)
        let count = 0;
        for (let k = 1; count < n; k += 2) {
          this.components.push({
            harmonic: k,
            amplitude: (4 / Math.PI) * (1 / k),
            phase: 0,
          });
          count++;
        }
        break;
      }
      case 'sawtooth': {
        // Sawtooth: (2/pi) * sum_{k=1}^{N} (-1)^(k+1) * (1/k) * sin(k*x)
        for (let k = 1; k <= n; k++) {
          this.components.push({
            harmonic: k,
            amplitude: (2 / Math.PI) * (Math.pow(-1, k + 1)) * (1 / k),
            phase: 0,
          });
        }
        break;
      }
      case 'triangle': {
        // Triangle: (8/pi^2) * sum_{k=1,3,5,...} (-1)^((k-1)/2) * (1/k^2) * sin(k*x)
        let count = 0;
        for (let k = 1; count < n; k += 2) {
          this.components.push({
            harmonic: k,
            amplitude: (8 / (Math.PI * Math.PI)) * Math.pow(-1, (k - 1) / 2) * (1 / (k * k)),
            phase: 0,
          });
          count++;
        }
        break;
      }
      case 'custom':
      default: {
        // Custom: equal-amplitude harmonics for exploration
        for (let k = 1; k <= n; k++) {
          this.components.push({
            harmonic: k,
            amplitude: 1 / k,
            phase: 0,
          });
        }
        break;
      }
    }
  }

  /**
   * Evaluate the sum of all Fourier components at position x.
   * This is exact arithmetic — tolerance is inherently < 0.001 because
   * there is no approximation: we are computing the exact partial sum.
   */
  private evaluate(x: number): number {
    let sum = 0;
    for (const comp of this.components) {
      sum += comp.amplitude * Math.sin(comp.harmonic * this.baseFrequency * x + comp.phase + this.animPhase * comp.harmonic);
    }
    return sum;
  }

  /**
   * Evaluate a single component at position x.
   */
  private evaluateComponent(comp: FourierComponent, x: number): number {
    return comp.amplitude * Math.sin(comp.harmonic * this.baseFrequency * x + comp.phase + this.animPhase * comp.harmonic);
  }

  update(deltaTime: number): void {
    this.animPhase += deltaTime * 0.5;
    if (this.animPhase > TWO_PI * 100) {
      this.animPhase -= TWO_PI * 100;
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    const componentColors = [
      '#4fc3f7', '#f06292', '#a5d6a7', '#ffcc80',
      '#ce93d8', '#90caf9', '#ef9a9a', '#80cbc4',
      '#fff59d', '#bcaaa4', '#b0bec5', '#c5e1a5',
      '#ffab91', '#80deea', '#e6ee9c', '#f48fb1',
      '#84ffff', '#b388ff', '#ff8a80', '#ffd180',
    ];

    const margin = 40;
    const plotWidth = width - margin * 2;
    const plotHeight = height - margin * 2;
    const centerY = height / 2;

    // Find max amplitude for scaling
    let maxVal = 0;
    for (let px = 0; px <= plotWidth; px += 2) {
      const x = (px / plotWidth) * TWO_PI * 3;
      const v = Math.abs(this.evaluate(x));
      if (v > maxVal) maxVal = v;
    }
    const scale = maxVal > 0 ? (plotHeight * 0.4) / maxVal : plotHeight * 0.4;

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, centerY);
    ctx.lineTo(width - margin, centerY);
    ctx.stroke();

    // Draw individual components
    if (this.showComponents) {
      for (let i = 0; i < this.components.length; i++) {
        const comp = this.components[i]!;
        const color = componentColors[i % componentColors.length]!;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let px = 0; px <= plotWidth; px += 2) {
          const x = (px / plotWidth) * TWO_PI * 3;
          const y = centerY - this.evaluateComponent(comp, x) * scale;
          if (px === 0) ctx.moveTo(margin + px, y);
          else ctx.lineTo(margin + px, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Draw composite wave (the sum)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    for (let px = 0; px <= plotWidth; px += 2) {
      const x = (px / plotWidth) * TWO_PI * 3;
      const y = centerY - this.evaluate(x) * scale;
      if (px === 0) ctx.moveTo(margin + px, y);
      else ctx.lineTo(margin + px, y);
    }
    ctx.stroke();

    // Draw readout
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`Components: ${this.components.length}`, 10, 18);
    ctx.fillText(`Waveform: ${this.waveformType}`, 10, 34);
    ctx.fillText(`Base freq: ${this.baseFrequency.toFixed(2)}`, 10, 50);

    // Draw component legend
    if (this.showComponents) {
      for (let i = 0; i < Math.min(this.components.length, 8); i++) {
        const comp = this.components[i]!;
        const color = componentColors[i % componentColors.length]!;
        ctx.fillStyle = color;
        ctx.fillText(`k=${comp.harmonic} A=${comp.amplitude.toFixed(3)}`, width - 150, 18 + i * 16);
      }
    }
  }

  getParams(): InteractiveParam[] {
    return [
      {
        name: 'frequencyCount',
        label: 'Harmonics',
        type: 'slider',
        min: 1,
        max: 20,
        step: 1,
        default: 4,
        description: 'Number of Fourier components',
      },
      {
        name: 'baseFrequency',
        label: 'Base Frequency',
        type: 'slider',
        min: 0.5,
        max: 5,
        step: 0.1,
        default: 1.0,
        unit: 'Hz',
        description: 'Fundamental frequency',
      },
      {
        name: 'showComponents',
        label: 'Show Components',
        type: 'toggle',
        default: true,
        description: 'Display individual sine components',
      },
      {
        name: 'waveformType',
        label: 'Waveform',
        type: 'select',
        default: 'square',
        description: 'Target waveform shape (sets Fourier coefficients)',
      },
    ];
  }

  setParam(name: string, value: number | string | boolean): void {
    switch (name) {
      case 'frequencyCount':
        if (typeof value === 'number') {
          this.frequencyCount = Math.max(1, Math.min(20, Math.round(value)));
          this.rebuildComponents();
        }
        break;
      case 'baseFrequency':
        if (typeof value === 'number') this.baseFrequency = value;
        break;
      case 'showComponents':
        if (typeof value === 'boolean') this.showComponents = value;
        break;
      case 'waveformType':
        if (typeof value === 'string' && ['custom', 'square', 'sawtooth', 'triangle'].includes(value)) {
          this.waveformType = value as 'custom' | 'square' | 'sawtooth' | 'triangle';
          this.rebuildComponents();
        }
        break;
    }
  }

  cleanup(): void {
    this.canvasManager = null;
    this.rendererId = null;
    this.components = [];
    this.animPhase = 0;
  }
}
