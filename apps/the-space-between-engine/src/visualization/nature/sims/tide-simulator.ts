// ─── Tide Simulator ──────────────────────────────────────
// Cross-section ocean view with sinusoidal waves driven
// by moon position, time, and amplitude parameters.

import type { ParamValue } from '../../../types/index.js';
import { NatureSimulation } from '../framework.js';

export class TideSimulator extends NatureSimulation {
  constructor() {
    super('tide-simulator', {
      'moon-phase': 0,
      'time-speed': 1,
      'amplitude': 1,
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

    const moonPhase = this.getNumParam('moon-phase');
    const timeSpeed = this.getNumParam('time-speed');
    const amplitude = this.getNumParam('amplitude');

    const w = this.width;
    const h = this.height;
    const t = (time / 1000) * timeSpeed;

    // Moon phase affects wave amplitude and phase shift
    const moonRad = (moonPhase * Math.PI) / 180;
    const tidalAmplitude = amplitude * (0.6 + 0.4 * Math.cos(moonRad));
    const phaseShift = moonRad * 0.5;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    skyGrad.addColorStop(0, '#0a0a2e');
    skyGrad.addColorStop(1, '#1a1a4e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.5);

    // Draw moon
    const moonX = w * 0.7 + Math.cos(moonRad) * w * 0.15;
    const moonY = h * 0.12 + Math.sin(moonRad) * h * 0.05;
    const moonRadius = Math.min(w, h) * 0.04;

    ctx.fillStyle = '#ffffcc';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Moon shadow (crescent effect based on phase)
    const shadowOffset = moonRadius * 0.6 * Math.cos(moonRad);
    ctx.fillStyle = '#0a0a2e';
    ctx.beginPath();
    ctx.arc(moonX + shadowOffset, moonY, moonRadius * 0.9, 0, 2 * Math.PI);
    ctx.fill();

    // Stars
    ctx.fillStyle = '#ffffff';
    const starSeed = 42;
    for (let i = 0; i < 30; i++) {
      const sx = ((starSeed * (i + 1) * 7.3) % w);
      const sy = ((starSeed * (i + 1) * 3.7) % (h * 0.4));
      const sr = 0.5 + ((i * 3) % 3) * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Water baseline
    const waterY = h * 0.5;

    // Draw water surface with sinusoidal waves
    const waterGrad = ctx.createLinearGradient(0, waterY, 0, h);
    waterGrad.addColorStop(0, '#1a5276');
    waterGrad.addColorStop(0.4, '#154360');
    waterGrad.addColorStop(1, '#0a1a2e');

    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.moveTo(0, h);

    const wavePoints: Array<{ x: number; y: number }> = [];
    for (let x = 0; x <= w; x += 2) {
      const xNorm = x / w;
      // Composite wave: primary + harmonic + small ripple
      const wave1 = Math.sin(xNorm * 4 * Math.PI + t * 1.2 + phaseShift) * tidalAmplitude;
      const wave2 = Math.sin(xNorm * 8 * Math.PI + t * 2.5 + phaseShift * 1.5) * tidalAmplitude * 0.3;
      const wave3 = Math.sin(xNorm * 16 * Math.PI + t * 4.0) * tidalAmplitude * 0.1;

      const waveHeight = (wave1 + wave2 + wave3) * h * 0.06;
      const y = waterY + waveHeight;
      wavePoints.push({ x, y });
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Wave surface highlight
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < wavePoints.length; i++) {
      const { x, y } = wavePoints[i];
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Secondary deeper wave layer for depth effect
    ctx.fillStyle = 'rgba(20, 60, 90, 0.5)';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 2) {
      const xNorm = x / w;
      const deepWave =
        Math.sin(xNorm * 3 * Math.PI + t * 0.8 + phaseShift + 1) * tidalAmplitude * 0.5;
      const y = waterY + h * 0.08 + deepWave * h * 0.04;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Seabed
    ctx.fillStyle = '#2c1810';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 4) {
      const xNorm = x / w;
      const bedHeight = h * 0.92 + Math.sin(xNorm * 6 + 1.5) * h * 0.02;
      ctx.lineTo(x, bedHeight);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Info text
    ctx.fillStyle = '#8ab4d4';
    ctx.font = '12px monospace';
    ctx.fillText(`Moon Phase: ${moonPhase.toFixed(0)} deg`, 10, 20);
    ctx.fillText(`Tidal Force: ${tidalAmplitude.toFixed(2)}x`, 10, 36);
    ctx.fillText(`Speed: ${timeSpeed.toFixed(1)}x`, 10, 52);
  }
}
