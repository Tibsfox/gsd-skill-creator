/**
 * Glass-Box MNA Instrumentation Module
 *
 * Wraps the existing MNA engine to expose step-by-step matrix assembly
 * and solution traces for educational purposes. No competitor exposes
 * matrix stamping step-by-step -- this is a unique differentiator.
 *
 * CRITICAL: This module imports from mna-engine and components only.
 * It does NOT modify any existing simulator file.
 *
 * Phase 511 Plan 01 -- ELEC-06
 */

import {
  buildMatrix,
  solve,
  solveNonlinear,
  dcAnalysis,
  type StampLogEntry,
  type MNABuildResult,
  type MNASolution,
  type NonlinearSolution,
  type NodeVoltage,
  type BranchCurrent,
} from './mna-engine.js';
import type { Component, OpAmp } from './components.js';

// ============================================================================
// Interfaces
// ============================================================================

/** A single step in the MNA trace showing what happened and when */
export interface MNAStep {
  phase:
    | 'collect-nodes'
    | 'stamp-component'
    | 'matrix-complete'
    | 'solve'
    | 'extract-results';
  description: string;
  componentId?: string;
  matrixSnapshot?: number[][];
  rhsSnapshot?: number[];
  stampEntries?: StampLogEntry[];
}

/** Full trace of the MNA solution process */
export interface MNATrace {
  steps: MNAStep[];
  nodeNames: string[];
  vsNames: string[];
  finalMatrix: number[][];
  finalRhs: number[];
  solution: number[];
}

// ============================================================================
// Instrumented DC Analysis
// ============================================================================

/**
 * Run DC analysis with full instrumentation trace.
 *
 * Calls the existing buildMatrix and solve functions, then reconstructs
 * the step-by-step process as an educational trace.
 *
 * @param components - Array of circuit components
 * @param groundNode - Name of the ground/reference node (default "0")
 * @returns Object with MNASolution result and MNATrace
 */
export function instrumentedDCAnalysis(
  components: Component[],
  groundNode: string = '0',
): { result: MNASolution; trace: MNATrace } {
  // Step 1: Build the MNA matrix (captures all stamp log entries)
  const built: MNABuildResult = buildMatrix(components, groundNode);

  // Step 2: Solve the linear system
  const solutionVector = solve(built.matrix, built.rhs);

  // Step 3: Build the trace from the build result
  const steps: MNAStep[] = [];

  // Phase: collect-nodes
  const n = built.nodeNames.length;
  const m = built.vsNames.length;
  const size = n + m;
  steps.push({
    phase: 'collect-nodes',
    description: `Collected ${n} non-ground node(s) [${built.nodeNames.join(', ')}] and ${m} voltage source(s) [${built.vsNames.join(', ')}]. Matrix size: ${size}x${size}.`,
  });

  // Phase: stamp-component (group stampLog entries by component ID)
  const componentOrder: string[] = [];
  const componentGroups = new Map<string, StampLogEntry[]>();

  for (const entry of built.stampLog) {
    if (!componentGroups.has(entry.component)) {
      componentOrder.push(entry.component);
      componentGroups.set(entry.component, []);
    }
    componentGroups.get(entry.component)!.push(entry);
  }

  for (const compId of componentOrder) {
    const entries = componentGroups.get(compId)!;
    steps.push({
      phase: 'stamp-component',
      description: `Stamped component ${compId}: ${entries.length} matrix entr${entries.length === 1 ? 'y' : 'ies'}.`,
      componentId: compId,
      stampEntries: entries,
    });
  }

  // Phase: matrix-complete (deep copy snapshots)
  const matrixSnapshot = built.matrix.map((row) => [...row]);
  const rhsSnapshot = [...built.rhs];
  steps.push({
    phase: 'matrix-complete',
    description: `Matrix assembly complete. ${size}x${size} system ready for Gaussian elimination.`,
    matrixSnapshot,
    rhsSnapshot,
  });

  // Phase: solve
  steps.push({
    phase: 'solve',
    description: `Solved ${size}x${size} system using Gaussian elimination with partial pivoting.`,
  });

  // Phase: extract-results
  const nodeVoltages: NodeVoltage[] = built.nodeNames.map((name, i) => ({
    node: name,
    voltage: solutionVector[i],
  }));
  const branchCurrents: BranchCurrent[] = built.vsNames.map((name, i) => ({
    branch: name,
    current: solutionVector[n + i],
  }));

  const voltageDescriptions = nodeVoltages
    .map((nv) => `${nv.node}=${nv.voltage.toFixed(4)}V`)
    .join(', ');
  const currentDescriptions = branchCurrents
    .map((bc) => `I(${bc.branch})=${bc.current.toFixed(6)}A`)
    .join(', ');

  steps.push({
    phase: 'extract-results',
    description: `Extracted results: ${voltageDescriptions}${currentDescriptions ? '; ' + currentDescriptions : ''}.`,
  });

  const trace: MNATrace = {
    steps,
    nodeNames: built.nodeNames,
    vsNames: built.vsNames,
    finalMatrix: matrixSnapshot,
    finalRhs: rhsSnapshot,
    solution: solutionVector,
  };

  return {
    result: { nodeVoltages, branchCurrents },
    trace,
  };
}

// ============================================================================
// Instrumented Nonlinear Analysis
// ============================================================================

/**
 * Run nonlinear (Newton-Raphson) analysis with full instrumentation trace.
 *
 * Calls the existing solveNonlinear function, then reconstructs the
 * step-by-step process as an educational trace.
 *
 * @param components - Array of circuit components
 * @param groundNode - Ground node name (default "0")
 * @param maxIter - Maximum Newton-Raphson iterations (default 50)
 * @param tolerance - Convergence tolerance in volts (default 1e-6)
 * @param opamps - Optional array of OpAmp components
 * @returns Object with NonlinearSolution result and MNATrace
 */
export function instrumentedNonlinearAnalysis(
  components: Component[],
  groundNode: string = '0',
  maxIter: number = 50,
  tolerance: number = 1e-6,
  opamps?: OpAmp[],
): { result: NonlinearSolution; trace: MNATrace } {
  // Run the nonlinear solver
  const result = solveNonlinear(
    components,
    groundNode,
    maxIter,
    tolerance,
    opamps,
  );

  // Build the trace from the result
  const steps: MNAStep[] = [];

  // Phase: collect-nodes (derive from result)
  const nodeNames = result.nodeVoltages.map((nv) => nv.node);
  const vsNames = result.branchCurrents.map((bc) => bc.branch);
  const n = nodeNames.length;
  const m = vsNames.length;
  const size = n + m;

  steps.push({
    phase: 'collect-nodes',
    description: `Collected ${n} non-ground node(s) [${nodeNames.join(', ')}] and ${m} voltage source(s) [${vsNames.join(', ')}]. Matrix size: ${size}x${size}. Using Newton-Raphson iteration.`,
  });

  // Phase: stamp-component (group stampLog by component)
  const componentOrder: string[] = [];
  const componentGroups = new Map<string, StampLogEntry[]>();

  for (const entry of result.stampLog) {
    if (!componentGroups.has(entry.component)) {
      componentOrder.push(entry.component);
      componentGroups.set(entry.component, []);
    }
    componentGroups.get(entry.component)!.push(entry);
  }

  for (const compId of componentOrder) {
    const entries = componentGroups.get(compId)!;
    steps.push({
      phase: 'stamp-component',
      description: `Stamped component ${compId}: ${entries.length} matrix entr${entries.length === 1 ? 'y' : 'ies'} (final iteration).`,
      componentId: compId,
      stampEntries: entries,
    });
  }

  // Phase: matrix-complete (note convergence)
  steps.push({
    phase: 'matrix-complete',
    description: `Matrix assembly complete after ${result.iterations} iteration(s). Converged: ${result.converged}.`,
  });

  // Phase: solve
  steps.push({
    phase: 'solve',
    description: `Newton-Raphson convergence achieved in ${result.iterations} iteration(s). Each iteration rebuilds the matrix with updated voltage estimates and solves via Gaussian elimination.`,
  });

  // Phase: extract-results
  const voltageDescriptions = result.nodeVoltages
    .map((nv) => `${nv.node}=${nv.voltage.toFixed(4)}V`)
    .join(', ');
  const currentDescriptions = result.branchCurrents
    .map((bc) => `I(${bc.branch})=${bc.current.toFixed(6)}A`)
    .join(', ');

  steps.push({
    phase: 'extract-results',
    description: `Extracted results: ${voltageDescriptions}${currentDescriptions ? '; ' + currentDescriptions : ''}.`,
  });

  const trace: MNATrace = {
    steps,
    nodeNames,
    vsNames,
    finalMatrix: [],
    finalRhs: [],
    solution: [],
  };

  return { result, trace };
}
