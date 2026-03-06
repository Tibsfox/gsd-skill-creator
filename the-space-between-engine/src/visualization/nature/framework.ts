// ─── Nature Simulation Framework ─────────────────────────
// Base class for nature simulations. Extends BaseCanvasRenderer
// with a typed parameter system for simulation state.

import type { ParamValue } from '../../types/index.js';
import { BaseCanvasRenderer } from '../canvas.js';

export abstract class NatureSimulation extends BaseCanvasRenderer {
  protected simulationParams: Map<string, ParamValue>;

  constructor(id: string, defaultParams: Record<string, ParamValue>) {
    super(id, 'canvas-2d');
    this.simulationParams = new Map(Object.entries(defaultParams));
  }

  protected override onInit(params: Map<string, ParamValue>): void {
    // Merge incoming params over defaults
    for (const [key, value] of params) {
      this.simulationParams.set(key, value);
    }
  }

  onParamChange(name: string, value: ParamValue): void {
    this.simulationParams.set(name, value);
  }

  protected getParam(name: string): ParamValue {
    return this.simulationParams.get(name)!;
  }

  protected getNumParam(name: string): number {
    const v = this.simulationParams.get(name);
    return v !== undefined ? Number(v) : 0;
  }

  protected getBoolParam(name: string): boolean {
    return Boolean(this.simulationParams.get(name));
  }

  protected getStringParam(name: string): string {
    return String(this.simulationParams.get(name) ?? '');
  }
}
