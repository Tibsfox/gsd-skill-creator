// Nature Simulation Framework — The Space Between Engine
// Abstract base class for all 9 nature simulations and a registry to manage them.
// Each simulation maps a mathematical foundation to a physical/natural phenomenon.

import type { FoundationId, InteractiveParam } from '../../types/index';
import type { CanvasManager } from '../canvas';

// ─── Abstract Base Class ─────────────────────────────────

/**
 * Base class for all nature simulations. Each simulation:
 * - Maps to exactly one FoundationId
 * - Provides interactive parameters for the Canvas system
 * - Implements init/update/draw/cleanup lifecycle
 *
 * Subclasses must implement all abstract members.
 */
export abstract class NatureSimulation {
  /** Unique identifier for this simulation (e.g. 'tide-simulator'). */
  abstract readonly id: string;

  /** Human-readable name (e.g. 'Tide Simulator'). */
  abstract readonly name: string;

  /** The mathematical foundation this simulation demonstrates. */
  abstract readonly foundationId: FoundationId;

  /**
   * Initialize the simulation. Called once when the simulation is
   * mounted to a canvas renderer.
   */
  abstract init(canvas: CanvasManager, rendererId: string): void;

  /**
   * Update simulation state. Called every frame before draw.
   * @param deltaTime — Time since last frame in seconds.
   */
  abstract update(deltaTime: number): void;

  /**
   * Render the simulation to the canvas context.
   * Called every frame after update.
   */
  abstract draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void;

  /**
   * Return the interactive parameters this simulation exposes.
   * Used by the UI to build sliders, toggles, etc.
   */
  abstract getParams(): InteractiveParam[];

  /**
   * Update a single parameter value.
   * Called when the user adjusts a slider, toggle, etc.
   */
  abstract setParam(name: string, value: number | string | boolean): void;

  /**
   * Clean up resources. Called when the simulation is unmounted.
   */
  abstract cleanup(): void;
}

// ─── Simulation Manager ──────────────────────────────────

/**
 * Registry for nature simulations. Provides lookup by ID and by foundation.
 */
export class SimulationManager {
  private simulations: Map<string, NatureSimulation> = new Map();

  /**
   * Register a simulation. Overwrites any existing simulation with the same ID.
   */
  register(simulation: NatureSimulation): void {
    this.simulations.set(simulation.id, simulation);
  }

  /**
   * Get a simulation by its unique ID.
   */
  get(id: string): NatureSimulation | null {
    return this.simulations.get(id) ?? null;
  }

  /**
   * Get all simulations that demonstrate a given foundation.
   */
  getByFoundation(foundationId: FoundationId): NatureSimulation[] {
    const result: NatureSimulation[] = [];
    for (const sim of Array.from(this.simulations.values())) {
      if (sim.foundationId === foundationId) {
        result.push(sim);
      }
    }
    return result;
  }

  /**
   * Get all registered simulations.
   */
  getAll(): NatureSimulation[] {
    return Array.from(this.simulations.values());
  }

  /**
   * Remove a simulation by ID.
   */
  unregister(id: string): boolean {
    return this.simulations.delete(id);
  }

  /**
   * Number of registered simulations.
   */
  get count(): number {
    return this.simulations.size;
  }
}

// ─── Test Simulation ─────────────────────────────────────

/**
 * A minimal sine-wave simulation that proves the Canvas -> Simulation pipeline works.
 * Draws an animated sine wave with configurable frequency and amplitude.
 * Foundation: trigonometry (sine is the canonical trig function).
 */
export class TestWaveSimulation extends NatureSimulation {
  readonly id = 'test-wave';
  readonly name = 'Test Wave';
  readonly foundationId: FoundationId = 'trigonometry';

  private frequency = 1;
  private amplitude = 0.5;
  private phase = 0;

  private canvasManager: CanvasManager | null = null;
  private rendererId: string | null = null;

  init(canvas: CanvasManager, rendererId: string): void {
    this.canvasManager = canvas;
    this.rendererId = rendererId;
    this.phase = 0;
  }

  update(deltaTime: number): void {
    // Advance the phase so the wave animates over time
    this.phase += deltaTime * this.frequency * Math.PI * 2;

    // Keep phase bounded to avoid floating-point drift over long sessions
    if (this.phase > Math.PI * 200) {
      this.phase -= Math.PI * 200;
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw center line
    const centerY = height / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Draw sine wave
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const waveHeight = centerY * this.amplitude;
    const step = 2; // pixels per sample — smooth enough, fast enough

    for (let x = 0; x <= width; x += step) {
      const t = (x / width) * Math.PI * 2 * this.frequency * 3;
      const y = centerY + Math.sin(t + this.phase) * waveHeight;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw parameter labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px monospace';
    ctx.fillText(`freq: ${this.frequency.toFixed(1)}`, 10, 20);
    ctx.fillText(`amp: ${this.amplitude.toFixed(2)}`, 10, 36);
  }

  getParams(): InteractiveParam[] {
    return [
      {
        name: 'frequency',
        label: 'Frequency',
        type: 'slider',
        min: 0.5,
        max: 5,
        step: 0.1,
        default: 1,
        unit: 'Hz',
        description: 'Number of complete wave cycles visible',
      },
      {
        name: 'amplitude',
        label: 'Amplitude',
        type: 'slider',
        min: 0.1,
        max: 1,
        step: 0.05,
        default: 0.5,
        description: 'Height of the wave relative to canvas',
      },
    ];
  }

  setParam(name: string, value: number | string | boolean): void {
    if (name === 'frequency' && typeof value === 'number') {
      this.frequency = value;
    } else if (name === 'amplitude' && typeof value === 'number') {
      this.amplitude = value;
    }
  }

  cleanup(): void {
    this.canvasManager = null;
    this.rendererId = null;
    this.phase = 0;
  }
}
