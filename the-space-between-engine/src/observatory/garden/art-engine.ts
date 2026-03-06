// Art Engine — Garden Workshop
// Generative art canvas with foundation-specific generators.
// Supports parametric curves (trig), Lissajous figures, polar plots, Mandelbrot (set theory).

import type { FoundationId, ArtPreset, Creation } from '../../types/index';

const TWO_PI = Math.PI * 2;

type ArtMode = 'parametric' | 'lissajous' | 'polar' | 'mandelbrot' | 'spirograph' | 'attractor';

interface ArtParams {
  mode: ArtMode;
  paramA: number;
  paramB: number;
  paramC: number;
  paramD: number;
  colorHue: number;
  lineWidth: number;
  resolution: number;
  iterations: number;
}

const DEFAULT_PARAMS: ArtParams = {
  mode: 'parametric',
  paramA: 3,
  paramB: 5,
  paramC: 1,
  paramD: 0.5,
  colorHue: 200,
  lineWidth: 1.5,
  resolution: 2000,
  iterations: 100,
};

/**
 * Generative art canvas driven by mathematical foundations.
 * Each foundation loads different generators and presets.
 */
export class ArtCanvas {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private foundation: FoundationId = 'trigonometry';
  private params: ArtParams = { ...DEFAULT_PARAMS };
  private width = 800;
  private height = 800;

  /**
   * Attach to a canvas element for rendering.
   */
  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
  }

  /**
   * Set the active foundation, which determines which generators and presets
   * are available. Resets params to foundation defaults.
   */
  setFoundation(id: FoundationId): void {
    this.foundation = id;

    // Set default mode for this foundation
    switch (id) {
      case 'unit-circle':
      case 'pythagorean':
        this.params.mode = 'parametric';
        break;
      case 'trigonometry':
        this.params.mode = 'lissajous';
        break;
      case 'vector-calculus':
        this.params.mode = 'attractor';
        break;
      case 'set-theory':
        this.params.mode = 'mandelbrot';
        break;
      case 'category-theory':
      case 'information-theory':
        this.params.mode = 'spirograph';
        break;
      case 'l-systems':
        this.params.mode = 'polar';
        break;
    }
  }

  /**
   * Update generation parameters.
   */
  setParams(params: Partial<ArtParams>): void {
    Object.assign(this.params, params);
  }

  /**
   * Load a wing Create phase output as a starting point.
   * Parses the creation data and sets parameters accordingly.
   */
  loadCreation(creation: Creation): void {
    this.foundation = creation.foundationId;
    try {
      const data = JSON.parse(creation.data) as Partial<ArtParams>;
      this.setParams(data);
    } catch {
      // If parse fails, just use current params with the creation's foundation
      this.setFoundation(creation.foundationId);
    }
  }

  /**
   * Render the generative art to the canvas.
   */
  render(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    switch (this.params.mode) {
      case 'parametric':
        this.renderParametric(ctx, w, h);
        break;
      case 'lissajous':
        this.renderLissajous(ctx, w, h);
        break;
      case 'polar':
        this.renderPolar(ctx, w, h);
        break;
      case 'mandelbrot':
        this.renderMandelbrot(ctx, w, h);
        break;
      case 'spirograph':
        this.renderSpirograph(ctx, w, h);
        break;
      case 'attractor':
        this.renderAttractor(ctx, w, h);
        break;
    }
  }

  /**
   * Export the current canvas as a Blob in the specified format.
   */
  export(format: 'png' | 'svg'): Blob {
    if (format === 'svg') {
      return this.exportSvg();
    }
    return this.exportPng();
  }

  /**
   * Get foundation-specific presets.
   */
  getPresets(): ArtPreset[] {
    const presets: ArtPreset[] = [];

    switch (this.foundation) {
      case 'unit-circle':
      case 'pythagorean':
        presets.push(
          { id: 'circle-wave', name: 'Circle Wave', foundationId: this.foundation, params: { paramA: 1, paramB: 1, paramC: 0, paramD: 1 }, description: 'Simple circular path' },
          { id: 'figure-eight', name: 'Figure Eight', foundationId: this.foundation, params: { paramA: 1, paramB: 2, paramC: 0, paramD: 1 }, description: 'Lemniscate pattern' },
          { id: 'cardioid', name: 'Cardioid', foundationId: this.foundation, params: { paramA: 1, paramB: 1, paramC: 1, paramD: 0.5 }, description: 'Heart-shaped curve' },
        );
        break;
      case 'trigonometry':
        presets.push(
          { id: 'lissajous-3-2', name: 'Lissajous 3:2', foundationId: 'trigonometry', params: { paramA: 3, paramB: 2, paramC: 0, paramD: 0 }, description: 'Classic 3:2 Lissajous figure' },
          { id: 'lissajous-5-4', name: 'Lissajous 5:4', foundationId: 'trigonometry', params: { paramA: 5, paramB: 4, paramC: 0.5, paramD: 0 }, description: 'Complex Lissajous with phase' },
          { id: 'lissajous-7-3', name: 'Lissajous 7:3', foundationId: 'trigonometry', params: { paramA: 7, paramB: 3, paramC: 0.25, paramD: 0 }, description: 'High-ratio Lissajous figure' },
        );
        break;
      case 'set-theory':
        presets.push(
          { id: 'mandelbrot-full', name: 'Mandelbrot Set', foundationId: 'set-theory', params: { paramA: -0.5, paramB: 0, paramC: 2, paramD: 100 }, description: 'Full Mandelbrot set view' },
          { id: 'mandelbrot-seahorse', name: 'Seahorse Valley', foundationId: 'set-theory', params: { paramA: -0.75, paramB: 0.1, paramC: 0.3, paramD: 200 }, description: 'Seahorse Valley zoom' },
          { id: 'mandelbrot-spiral', name: 'Spiral Arm', foundationId: 'set-theory', params: { paramA: -0.16, paramB: 1.0405, paramC: 0.02, paramD: 300 }, description: 'Deep spiral zoom' },
        );
        break;
      case 'vector-calculus':
        presets.push(
          { id: 'lorenz', name: 'Lorenz Attractor', foundationId: 'vector-calculus', params: { paramA: 10, paramB: 28, paramC: 2.667, paramD: 0.005 }, description: 'Classic Lorenz strange attractor' },
          { id: 'rossler', name: 'R\u00F6ssler Attractor', foundationId: 'vector-calculus', params: { paramA: 0.2, paramB: 0.2, paramC: 5.7, paramD: 0.01 }, description: 'R\u00F6ssler band attractor' },
        );
        break;
      default:
        presets.push(
          { id: 'spirograph-1', name: 'Spirograph Classic', foundationId: this.foundation, params: { paramA: 5, paramB: 3, paramC: 0.8, paramD: 0 }, description: 'Classic spirograph pattern' },
          { id: 'spirograph-2', name: 'Spirograph Dense', foundationId: this.foundation, params: { paramA: 7, paramB: 2, paramC: 0.6, paramD: 0 }, description: 'Dense spirograph pattern' },
        );
        break;
    }

    return presets;
  }

  // ── Renderers ──────────────────────────────────────────

  /**
   * Parametric curve: x(t) = A*cos(a*t), y(t) = B*sin(b*t + phi)
   */
  private renderParametric(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) * 0.35;
    const { paramA, paramB, paramC, resolution, colorHue, lineWidth } = this.params;

    ctx.lineWidth = lineWidth;

    for (let i = 0; i <= resolution; i++) {
      const t = (i / resolution) * TWO_PI * paramA;
      const x = cx + Math.cos(paramA * t) * scale;
      const y = cy + Math.sin(paramB * t + paramC) * scale;

      const hue = (colorHue + (i / resolution) * 120) % 360;
      ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.7)`;

      if (i === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  /**
   * Lissajous figure: x(t) = sin(a*t + delta), y(t) = sin(b*t)
   */
  private renderLissajous(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) * 0.38;
    const { paramA, paramB, paramC, resolution, colorHue, lineWidth } = this.params;

    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    for (let i = 0; i <= resolution; i++) {
      const t = (i / resolution) * TWO_PI;
      const x = cx + Math.sin(paramA * t + paramC * Math.PI) * scale;
      const y = cy + Math.sin(paramB * t) * scale;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, `hsla(${colorHue}, 70%, 60%, 0.8)`);
    grad.addColorStop(0.5, `hsla(${(colorHue + 60) % 360}, 70%, 60%, 0.8)`);
    grad.addColorStop(1, `hsla(${(colorHue + 120) % 360}, 70%, 60%, 0.8)`);
    ctx.strokeStyle = grad;
    ctx.stroke();
  }

  /**
   * Polar plot: r(theta) = A + B*cos(C*theta)
   * Rose curves, cardioids, limacons.
   */
  private renderPolar(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) * 0.18;
    const { paramA, paramB, paramC, resolution, colorHue, lineWidth } = this.params;

    ctx.lineWidth = lineWidth;

    const petals = Math.max(1, Math.round(paramC));
    const loops = petals % 2 === 0 ? 1 : 2; // need 2*pi for odd petals, pi for even

    for (let i = 0; i <= resolution; i++) {
      const theta = (i / resolution) * TWO_PI * loops;
      const r = (paramA + paramB * Math.cos(petals * theta)) * scale;
      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta);

      const hue = (colorHue + (i / resolution) * 180) % 360;
      ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.7)`;

      if (i === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  /**
   * Mandelbrot set: z_{n+1} = z_n^2 + c
   * Member if |z| stays bounded after iterations.
   */
  private renderMandelbrot(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const { paramA: centerX, paramB: centerY, paramC: zoom, paramD: maxIterD, colorHue } = this.params;
    const maxIter = Math.max(20, Math.round(maxIterD));

    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        // Map pixel to complex plane
        const cr = centerX + (px - w / 2) / (w / 2) * zoom;
        const ci = centerY + (py - h / 2) / (h / 2) * zoom;

        let zr = 0;
        let zi = 0;
        let iter = 0;

        while (zr * zr + zi * zi <= 4 && iter < maxIter) {
          const tr = zr * zr - zi * zi + cr;
          zi = 2 * zr * zi + ci;
          zr = tr;
          iter++;
        }

        const idx = (py * w + px) * 4;

        if (iter === maxIter) {
          // Inside the set: black
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
        } else {
          // Outside: color based on escape iteration
          const t = iter / maxIter;
          const hue = (colorHue + t * 360) % 360;
          const [r, g, b] = this.hslToRgb(hue / 360, 0.7, 0.3 + t * 0.4);
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
        }
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Spirograph: hypotrochoid or epitrochoid.
   * x(t) = (R-r)*cos(t) + d*cos((R-r)/r * t)
   * y(t) = (R-r)*sin(t) - d*sin((R-r)/r * t)
   */
  private renderSpirograph(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) * 0.15;
    const { paramA, paramB, paramC, resolution, colorHue, lineWidth } = this.params;

    const R = paramA;
    const r = paramB;
    const d = paramC * r;
    const ratio = (R - r) / r;

    // Compute number of revolutions for a closed figure: lcm(R, r) / R
    const revolutions = Math.max(1, Math.round(r / this.gcd(R, r)));
    const totalT = TWO_PI * revolutions;

    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    for (let i = 0; i <= resolution; i++) {
      const t = (i / resolution) * totalT;
      const x = cx + ((R - r) * Math.cos(t) + d * Math.cos(ratio * t)) * scale;
      const y = cy + ((R - r) * Math.sin(t) - d * Math.sin(ratio * t)) * scale;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, `hsla(${colorHue}, 80%, 60%, 0.8)`);
    grad.addColorStop(1, `hsla(${(colorHue + 180) % 360}, 80%, 60%, 0.8)`);
    ctx.strokeStyle = grad;
    ctx.stroke();
  }

  /**
   * Strange attractor (Lorenz-like):
   * dx/dt = sigma * (y - x)
   * dy/dt = x * (rho - z) - y
   * dz/dt = x * y - beta * z
   * Projected onto 2D (x, y) plane.
   */
  private renderAttractor(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;
    const { paramA: sigma, paramB: rho, paramC: beta, paramD: dt, iterations, colorHue, lineWidth } = this.params;

    const steps = Math.max(1000, iterations * 100);
    const actualDt = Math.max(0.001, dt);

    let x = 0.1;
    let y = 0;
    let z = 0;

    const scale = Math.min(w, h) * 0.01;

    ctx.lineWidth = lineWidth;

    let prevScreenX = cx + x * scale;
    let prevScreenY = cy - y * scale;

    for (let i = 0; i < steps; i++) {
      const dx = sigma * (y - x);
      const dy = x * (rho - z) - y;
      const dz = x * y - beta * z;

      x += dx * actualDt;
      y += dy * actualDt;
      z += dz * actualDt;

      const screenX = cx + x * scale;
      const screenY = cy - z * scale; // project xz plane

      const hue = (colorHue + (i / steps) * 240) % 360;
      ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.3)`;
      ctx.beginPath();
      ctx.moveTo(prevScreenX, prevScreenY);
      ctx.lineTo(screenX, screenY);
      ctx.stroke();

      prevScreenX = screenX;
      prevScreenY = screenY;
    }
  }

  // ── Export helpers ──────────────────────────────────────

  private exportPng(): Blob {
    if (!this.canvas) {
      return new Blob([], { type: 'image/png' });
    }

    // Canvas toBlob is async, but we need sync. Use toDataURL instead.
    const dataUrl = this.canvas.toDataURL('image/png');
    const binary = atob(dataUrl.split(',')[1] ?? '');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'image/png' });
  }

  private exportSvg(): Blob {
    // Generate SVG from current params
    const svgParts: string[] = [];
    svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}">`);
    svgParts.push(`<rect width="100%" height="100%" fill="#0a0a1a"/>`);

    // Re-compute the path for SVG
    if (this.params.mode === 'lissajous') {
      const cx = this.width / 2;
      const cy = this.height / 2;
      const scale = Math.min(this.width, this.height) * 0.38;
      const { paramA, paramB, paramC, resolution } = this.params;
      let d = '';

      for (let i = 0; i <= resolution; i++) {
        const t = (i / resolution) * TWO_PI;
        const x = cx + Math.sin(paramA * t + paramC * Math.PI) * scale;
        const y = cy + Math.sin(paramB * t) * scale;
        d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }

      svgParts.push(`<path d="${d}" stroke="hsl(${this.params.colorHue}, 70%, 60%)" fill="none" stroke-width="${this.params.lineWidth}"/>`);
    }

    svgParts.push('</svg>');
    return new Blob([svgParts.join('\n')], { type: 'image/svg+xml' });
  }

  // ── Utility ────────────────────────────────────────────

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = this.hueToRgb(p, q, h + 1 / 3);
      g = this.hueToRgb(p, q, h);
      b = this.hueToRgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  private hueToRgb(p: number, q: number, t: number): number {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  }

  private gcd(a: number, b: number): number {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b > 0) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }
}
