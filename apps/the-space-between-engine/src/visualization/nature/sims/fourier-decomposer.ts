// ─── Fourier Decomposer ──────────────────────────────────
// Shows a composite wave that decomposes into its
// constituent sine wave components.

import type { ParamValue } from '../../../types/index.js';
import { NatureSimulation } from '../framework.js';

export class FourierDecomposer extends NatureSimulation {
  constructor() {
    super('fourier-decomposer', {
      'frequency-count': 5,
      'base-frequency': 1,
      'show-components': true,
    });
  }

  render(time: number, params: Map<string, ParamValue>): void {
    const ctx = this.ctx;
    if (!ctx) return;

    for (const [k, v] of params) {
      if (!this.simulationParams.has(k)) {
        this.simulationParams.set(k, v);
      }
    }

    const freqCount = Math.max(1, Math.min(20, Math.floor(this.getNumParam('frequency-count'))));
    const baseFreq = this.getNumParam('base-frequency');
    const showComponents = this.getBoolParam('show-components');

    const w = this.width;
    const h = this.height;
    const t = time / 1000;

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#08080e';
    ctx.fillRect(0, 0, w, h);

    // Define component amplitudes and frequencies
    // Using harmonic series: amplitude decreases as 1/n
    const components: Array<{ freq: number; amp: number; phase: number }> = [];
    for (let n = 1; n <= freqCount; n++) {
      components.push({
        freq: baseFreq * n,
        amp: 1 / n,
        phase: t * 0.5 * n, // slow animation
      });
    }

    // Compute composite wave
    const computeComposite = (x: number): number => {
      let sum = 0;
      for (const comp of components) {
        sum += comp.amp * Math.sin(2 * Math.PI * comp.freq * x + comp.phase);
      }
      return sum;
    };

    // Compute max amplitude for normalization
    const maxAmp = components.reduce((s, c) => s + c.amp, 0);

    if (showComponents) {
      // Split view: composite on top, components below
      const compositeHeight = h * 0.4;
      const componentAreaY = compositeHeight + 20;
      const componentAreaHeight = h - componentAreaY - 10;

      // Draw composite wave
      this.drawWaveSection(
        ctx,
        0,
        0,
        w,
        compositeHeight,
        computeComposite,
        maxAmp,
        '#ffffff',
        'Composite Wave',
      );

      // Separator line
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, compositeHeight + 10);
      ctx.lineTo(w, compositeHeight + 10);
      ctx.stroke();

      // Draw each component
      const perCompHeight = Math.min(
        componentAreaHeight / freqCount,
        60,
      );

      // Color palette for components
      const hueStep = 360 / Math.max(freqCount, 1);

      for (let i = 0; i < freqCount; i++) {
        const comp = components[i];
        const cy = componentAreaY + i * perCompHeight;
        const cHeight = perCompHeight - 4;

        if (cy + cHeight > h) break;

        const hue = (i * hueStep + 200) % 360;
        const color = `hsl(${hue}, 70%, 60%)`;

        const computeComponent = (x: number): number => {
          return comp.amp * Math.sin(2 * Math.PI * comp.freq * x + comp.phase);
        };

        this.drawWaveSection(
          ctx,
          0,
          cy,
          w,
          cHeight,
          computeComponent,
          maxAmp,
          color,
          `n=${i + 1}: f=${comp.freq.toFixed(1)}Hz, A=1/${i + 1}`,
        );
      }
    } else {
      // Full-height composite wave only
      this.drawWaveSection(
        ctx,
        0,
        0,
        w,
        h,
        computeComposite,
        maxAmp,
        '#ffffff',
        'Composite Wave',
      );
    }

    // Info
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`Harmonics: ${freqCount}  |  Base: ${baseFreq.toFixed(1)} Hz`, 10, h - 10);
  }

  private drawWaveSection(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    compute: (xNorm: number) => number,
    maxAmp: number,
    color: string,
    label: string,
  ): void {
    const midY = y + h / 2;
    const amplitude = (h / 2) * 0.8; // 80% of available height

    // Background
    ctx.fillStyle = 'rgba(20, 20, 30, 0.5)';
    ctx.fillRect(x, y, w, h);

    // Center line
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, midY);
    ctx.lineTo(x + w, midY);
    ctx.stroke();

    // Wave
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let first = true;

    for (let px = 0; px <= w; px += 2) {
      const xNorm = px / w * 4; // 4 full cycles visible
      const val = compute(xNorm);
      const py = midY - (val / maxAmp) * amplitude;

      if (first) {
        ctx.moveTo(x + px, py);
        first = false;
      } else {
        ctx.lineTo(x + px, py);
      }
    }
    ctx.stroke();

    // Label
    ctx.fillStyle = color;
    ctx.font = '10px monospace';
    ctx.fillText(label, x + 4, y + 12);
  }
}
