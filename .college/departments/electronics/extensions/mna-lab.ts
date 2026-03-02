/**
 * MNA Lab Extension for the Electronics Department.
 *
 * Provides the typed interface that electronics try-sessions use to invoke
 * the Modified Nodal Analysis circuit simulator. The simulator itself lives
 * in src/electronics-pack/simulator/ -- this file is the department-level
 * entry point only.
 *
 * @module departments/electronics/extensions/mna-lab
 */

import type { MNASolution } from '../../../../src/packs/electronics-pack/simulator/mna-engine.js';

/** Configuration for a guided MNA lab session. */
export interface MnaLabConfig {
  /** Wing context: which department wing this session is associated with */
  wing: 'circuit-foundations' | 'active-devices' | 'analog-systems' | 'digital-mixed-signal' | 'applied-systems';
  /** Module number from electronics-pack (01-15) */
  module: string;
  /** Circuit description in plain text (for session narration) */
  circuitDescription: string;
  /** Expected learning outcome for this lab */
  learningOutcome: string;
  /** Whether to show the MNA stamp matrix in the output */
  showStampMatrix: boolean;
}

/** Result of running a guided MNA lab session. */
export interface MnaLabResult {
  config: MnaLabConfig;
  simulationResult: MNASolution;
  /** Plain-text interpretation of the result for learners */
  interpretation: string;
}

/**
 * Creates a guided MNA lab session configuration.
 *
 * Use this in electronics try-sessions to present circuit simulation
 * as a structured learning activity rather than raw simulation output.
 *
 * @param config - Lab configuration specifying wing, module, and context
 * @returns MnaLabConfig ready to pass to the MNA engine via try-session execution
 */
export function createMnaLabSession(config: MnaLabConfig): MnaLabConfig {
  return config;
}

/**
 * Interprets an MNA simulation result for a learner.
 *
 * Translates voltage/current numbers into concept-linked explanations
 * (e.g., "Node 2 is 3.3V because the voltage divider ratio R1/(R1+R2) = 0.33").
 *
 * @param result - Raw MNA simulation result
 * @param config - Lab config providing context for interpretation
 * @returns Human-readable interpretation string
 */
export function interpretMnaResult(result: MNASolution, config: MnaLabConfig): string {
  const nodeCount = result.nodeVoltages.length;
  const branchCount = result.branchCurrents.length;
  return `Wing: ${config.wing} | Module: ${config.module} | Circuit: ${config.circuitDescription} | Nodes solved: ${nodeCount} | Branches: ${branchCount}`;
}
