/**
 * Transient Analysis Engine
 *
 * Backward Euler time-stepping for transient circuit simulation.
 * To be implemented in Phase 263.
 */

/** Configuration for Backward Euler transient analysis */
export interface BackwardEulerConfig {
  timeStep: number;    // seconds
  stopTime: number;    // seconds
  maxIterations: number;
  tolerance: number;   // convergence tolerance (volts)
}

/** Single time-step result */
export interface TransientTimePoint {
  time: number;
  nodeVoltages: Record<string, number>;
  branchCurrents: Record<string, number>;
}

/** Complete transient analysis result */
export interface TransientResult {
  config: BackwardEulerConfig;
  timePoints: TransientTimePoint[];
  converged: boolean;
  totalSteps: number;
}
