// Nature Simulations Index — The Space Between Engine
// Registers all 9 simulations with a SimulationManager and exports it.

import { SimulationManager } from '../framework';
import { UnitCircleExplorer } from './unit-circle-explorer';
import { TideSimulator } from './tide-simulator';
import { FourierDecomposer } from './fourier-decomposer';
import { VectorFieldPainter } from './vector-field-painter';
import { MagneticField } from './magnetic-field';
import { SetVisualizer } from './set-visualizer';
import { FunctorBridge } from './functor-bridge';
import { TreeGrowth } from './tree-growth';
import { LSystemRenderer } from './l-system-renderer';

// Re-export all simulation classes
export {
  UnitCircleExplorer,
  TideSimulator,
  FourierDecomposer,
  VectorFieldPainter,
  MagneticField,
  SetVisualizer,
  FunctorBridge,
  TreeGrowth,
  LSystemRenderer,
};

/**
 * Create and return a SimulationManager pre-loaded with all 9 nature simulations.
 *
 * Simulation to foundation mapping:
 *   unit-circle-explorer  -> unit-circle
 *   tide-simulator        -> trigonometry
 *   fourier-decomposer    -> trigonometry
 *   vector-field-painter  -> vector-calculus
 *   magnetic-field         -> vector-calculus
 *   set-visualizer        -> set-theory
 *   functor-bridge        -> category-theory
 *   tree-growth           -> l-systems
 *   l-system-renderer     -> l-systems
 */
export function createSimulationManager(): SimulationManager {
  const manager = new SimulationManager();

  manager.register(new UnitCircleExplorer());
  manager.register(new TideSimulator());
  manager.register(new FourierDecomposer());
  manager.register(new VectorFieldPainter());
  manager.register(new MagneticField());
  manager.register(new SetVisualizer());
  manager.register(new FunctorBridge());
  manager.register(new TreeGrowth());
  manager.register(new LSystemRenderer());

  return manager;
}

/** Default simulation manager instance. */
export const simulationManager = createSimulationManager();
