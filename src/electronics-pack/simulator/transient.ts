/**
 * Transient Analysis Engine
 *
 * Backward Euler time-stepping for transient circuit simulation.
 * Implemented in Phase 263 Plan 03.
 *
 * At each time step, reactive components (capacitors and inductors) are
 * replaced by their Backward Euler companion models (equivalent resistor
 * + current source), and the resulting linear system is solved using the
 * MNA engine.
 */

import type { Component, TransientState } from './components';
import { stampComponent, type StampTarget } from './components';
import { solve, type StampLogEntry } from './mna-engine';

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

// ============================================================================
// Node and VS Collection (transient-specific: no inductor VS rows)
// ============================================================================

/**
 * Collect unique non-ground node names and voltage source IDs.
 *
 * Unlike DC analysis, inductors in transient mode are modeled as companion
 * resistor + current source (not as zero-volt voltage sources), so they
 * do NOT add VS rows to the matrix.
 */
function collectTransientNodes(
  components: Component[],
  groundNode: string,
): { nodeNames: string[]; vsNames: string[] } {
  const nodeSet = new Set<string>();
  const vsNames: string[] = [];

  for (const comp of components) {
    if ('nodes' in comp) {
      for (const node of (comp as { nodes: string[] }).nodes) {
        if (node !== groundNode) {
          nodeSet.add(node);
        }
      }
    }

    // Only actual voltage sources get VS rows in transient mode
    if (comp.type === 'voltage-source') {
      vsNames.push(comp.id);
    }
    // Inductors do NOT get VS rows in transient (they use companion model)
  }

  return {
    nodeNames: Array.from(nodeSet),
    vsNames,
  };
}

// ============================================================================
// Build Transient Matrix
// ============================================================================

/**
 * Build the MNA matrix for one transient time step.
 *
 * Similar to buildMatrix in mna-engine.ts but:
 * - Uses transient stamping for capacitors and inductors (companion models)
 * - Inductors do NOT add VS rows (they are companion resistors in transient)
 */
function buildTransientMatrix(
  components: Component[],
  groundNode: string,
  transientState: TransientState,
): {
  matrix: number[][];
  rhs: number[];
  stampLog: StampLogEntry[];
  nodeNames: string[];
  vsNames: string[];
} {
  const { nodeNames, vsNames } = collectTransientNodes(components, groundNode);
  const n = nodeNames.length;
  const m = vsNames.length;
  const size = n + m;

  // Create zero matrix and RHS
  const matrix: number[][] = [];
  for (let i = 0; i < size; i++) {
    matrix.push(new Array(size).fill(0));
  }
  const rhs = new Array(size).fill(0);
  const stampLog: StampLogEntry[] = [];

  // Build node-index and VS-index lookup functions
  const nodeMap = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    nodeMap.set(nodeNames[i], i);
  }
  const vsMap = new Map<string, number>();
  for (let i = 0; i < m; i++) {
    vsMap.set(vsNames[i], i);
  }

  const target: StampTarget = {
    matrix,
    rhs,
    stampLog,
    nodeIndex: (node: string) => {
      if (node === groundNode) return -1;
      return nodeMap.get(node) ?? -1;
    },
    vsIndex: (id: string) => vsMap.get(id) ?? -1,
    n,
  };

  // Stamp each component with transient companion models
  for (const comp of components) {
    stampComponent(target, comp, 'transient', transientState);
  }

  return { matrix, rhs, stampLog, nodeNames, vsNames };
}

// ============================================================================
// Transient Analysis
// ============================================================================

/**
 * Run Backward Euler transient analysis on a circuit.
 *
 * Steps through time from t=0 to stopTime. At each step:
 * 1. Build MNA matrix with companion models for reactive components
 * 2. Solve the linear system
 * 3. Extract node voltages and branch currents
 * 4. Update previous-step state for the next iteration
 *
 * @param components - Array of circuit components
 * @param config - Transient analysis configuration
 * @param groundNode - Name of the ground/reference node (default "0")
 * @returns TransientResult with time points, convergence status, and step count
 */
export function transientAnalysis(
  components: Component[],
  config: BackwardEulerConfig,
  groundNode: string = '0',
): TransientResult {
  const { timeStep, stopTime } = config;
  const totalSteps = Math.round(stopTime / timeStep);

  // Collect node names for initial state
  const { nodeNames, vsNames } = collectTransientNodes(components, groundNode);

  // Initialize previous-step state: all zeros
  const prevVoltages: Record<string, number> = {};
  for (const name of nodeNames) {
    prevVoltages[name] = 0;
  }
  const prevCurrents: Record<string, number> = {};
  for (const comp of components) {
    if (comp.type === 'inductor') {
      prevCurrents[comp.id] = 0;
    }
  }

  // Initial time point (t=0, all zeros)
  const initialNodeVoltages: Record<string, number> = {};
  for (const name of nodeNames) {
    initialNodeVoltages[name] = 0;
  }
  const initialBranchCurrents: Record<string, number> = {};
  for (const name of vsNames) {
    initialBranchCurrents[name] = 0;
  }
  for (const comp of components) {
    if (comp.type === 'inductor') {
      initialBranchCurrents[comp.id] = 0;
    }
  }

  const timePoints: TransientTimePoint[] = [
    {
      time: 0,
      nodeVoltages: { ...initialNodeVoltages },
      branchCurrents: { ...initialBranchCurrents },
    },
  ];

  let converged = true;

  // Time-stepping loop
  for (let step = 1; step <= totalSteps; step++) {
    const t = step * timeStep;

    const transientState: TransientState = {
      dt: timeStep,
      prevVoltages: { ...prevVoltages },
      prevCurrents: { ...prevCurrents },
    };

    // Build and solve the MNA system for this time step
    const built = buildTransientMatrix(components, groundNode, transientState);
    const solution = solve(built.matrix, built.rhs);

    const n = built.nodeNames.length;

    // Extract node voltages
    const nodeVoltages: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      nodeVoltages[built.nodeNames[i]] = solution[i];
    }

    // Extract branch currents (from voltage source equations)
    const branchCurrents: Record<string, number> = {};
    for (let i = 0; i < built.vsNames.length; i++) {
      branchCurrents[built.vsNames[i]] = solution[n + i];
    }

    // Compute inductor currents from companion model:
    // i_L = G_eq * (V_n0 - V_n1) + i_prev
    // where G_eq = dt / L
    for (const comp of components) {
      if (comp.type === 'inductor') {
        const vN0 = nodeVoltages[comp.nodes[0]] ?? 0;
        const vN1 = nodeVoltages[comp.nodes[1]] ?? 0;
        const g_eq = timeStep / comp.inductance;
        const i_prev = prevCurrents[comp.id] ?? 0;
        branchCurrents[comp.id] = g_eq * (vN0 - vN1) + i_prev;
      }
    }

    // Store time point
    timePoints.push({
      time: t,
      nodeVoltages,
      branchCurrents,
    });

    // Update previous-step state for next iteration
    for (const name of built.nodeNames) {
      prevVoltages[name] = nodeVoltages[name];
    }
    for (const comp of components) {
      if (comp.type === 'inductor') {
        prevCurrents[comp.id] = branchCurrents[comp.id];
      }
    }
  }

  return {
    config,
    timePoints,
    converged,
    totalSteps,
  };
}
