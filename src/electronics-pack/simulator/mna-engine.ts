/**
 * MNA Circuit Simulator Engine
 *
 * Modified Nodal Analysis for DC, AC, and transient circuit simulation.
 * Core engine implemented in Phase 263 Plan 01.
 *
 * The MNA formulation augments the standard nodal analysis (KCL at every
 * non-ground node) with extra equations for voltage sources and inductors
 * (in DC), producing the system:
 *
 *   [ G  B ] [ v ]   [ i ]
 *   [ C  D ] [ j ] = [ e ]
 *
 * where v = node voltages, j = branch currents through voltage sources,
 * i = known current injections, e = known source voltages.
 */

import type { Component } from './components';
import { stampComponent, type StampTarget } from './components';

// ============================================================================
// Interfaces (preserved from stub — used by other phases)
// ============================================================================

/** Node voltage result from MNA solution */
export interface NodeVoltage {
  node: string;
  voltage: number;
}

/** Branch current result */
export interface BranchCurrent {
  branch: string;
  current: number;
}

/** MNA solution result */
export interface MNASolution {
  nodeVoltages: NodeVoltage[];
  branchCurrents: BranchCurrent[];
}

/** Stamp log entry for matrix visibility */
export interface StampLogEntry {
  component: string;
  row: number;
  col: number;
  value: number;
  explanation: string;
}

// ============================================================================
// Build Result
// ============================================================================

/** Result from buildMatrix: the assembled MNA system before solving */
export interface MNABuildResult {
  matrix: number[][];
  rhs: number[];
  stampLog: StampLogEntry[];
  nodeNames: string[];
  vsNames: string[];
}

// ============================================================================
// Matrix Construction
// ============================================================================

/**
 * Collect all unique non-ground node names from components.
 * Also collect voltage source IDs (and inductors acting as VS in DC).
 */
function collectNodes(
  components: Component[],
  groundNode: string,
): { nodeNames: string[]; vsNames: string[] } {
  const nodeSet = new Set<string>();
  const vsNames: string[] = [];

  for (const comp of components) {
    // Collect nodes from the component's two-terminal nodes array
    if ('nodes' in comp) {
      for (const node of comp.nodes) {
        if (node !== groundNode) {
          nodeSet.add(node);
        }
      }
    }

    // Track voltage sources (explicit and inductor-as-DC-short)
    if (comp.type === 'voltage-source') {
      vsNames.push(comp.id);
    } else if (comp.type === 'inductor') {
      // Inductor stamps as zero-volt VS in DC
      vsNames.push(comp.id);
    }
  }

  return {
    nodeNames: Array.from(nodeSet),
    vsNames,
  };
}

/**
 * Build the MNA matrix from a list of components.
 *
 * Creates an (n+m) x (n+m) zero matrix and RHS vector, where:
 *   n = number of non-ground nodes
 *   m = number of voltage sources (including inductors in DC)
 *
 * Then stamps each component into the matrix.
 *
 * @param components - Array of circuit components
 * @param groundNode - Name of the ground/reference node (default "0")
 * @returns The assembled MNA system with matrix, rhs, stampLog, nodeNames, vsNames
 */
export function buildMatrix(
  components: Component[],
  groundNode: string = '0',
): MNABuildResult {
  const { nodeNames, vsNames } = collectNodes(components, groundNode);
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

  // Stamp each component (DC analysis by default)
  for (const comp of components) {
    stampComponent(target, comp, 'dc');
  }

  return { matrix, rhs, stampLog, nodeNames, vsNames };
}

// ============================================================================
// Gaussian Elimination with Partial Pivoting
// ============================================================================

/**
 * Solve the linear system Ax = b using Gaussian elimination with partial
 * pivoting.
 *
 * The algorithm:
 * 1. Forward elimination with row swapping for numerical stability
 * 2. Back-substitution to recover the solution vector
 *
 * Input matrices are cloned to avoid mutation.
 *
 * @param A - Coefficient matrix (n x n)
 * @param b - Right-hand side vector (length n)
 * @returns Solution vector x (length n)
 */
export function solve(A: number[][], b: number[]): number[] {
  const n = A.length;
  if (n === 0) return [];

  // Deep clone to avoid mutating inputs
  const M = A.map((row) => [...row]);
  const rhs = [...b];

  // Forward elimination with partial pivoting
  for (let k = 0; k < n; k++) {
    // Find pivot: row with maximum |M[row][k]| for row >= k
    let maxVal = Math.abs(M[k][k]);
    let pivotRow = k;
    for (let row = k + 1; row < n; row++) {
      const absVal = Math.abs(M[row][k]);
      if (absVal > maxVal) {
        maxVal = absVal;
        pivotRow = row;
      }
    }

    // Swap rows k and pivotRow in both M and rhs
    if (pivotRow !== k) {
      [M[k], M[pivotRow]] = [M[pivotRow], M[k]];
      [rhs[k], rhs[pivotRow]] = [rhs[pivotRow], rhs[k]];
    }

    // Eliminate column k for all rows below k
    const pivot = M[k][k];
    for (let i = k + 1; i < n; i++) {
      const factor = M[i][k] / pivot;
      for (let j = k; j < n; j++) {
        M[i][j] -= factor * M[k][j];
      }
      rhs[i] -= factor * rhs[k];
    }
  }

  // Back-substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = rhs[i];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = sum / M[i][i];
  }

  return x;
}

// ============================================================================
// DC Analysis
// ============================================================================

/**
 * Run DC analysis on a circuit.
 *
 * Builds the MNA matrix, solves the linear system, and maps the solution
 * vector back to named node voltages and branch currents.
 *
 * @param components - Array of circuit components
 * @param groundNode - Name of the ground/reference node (default "0")
 * @returns MNASolution with nodeVoltages and branchCurrents
 */
export function dcAnalysis(
  components: Component[],
  groundNode: string = '0',
): MNASolution {
  const built = buildMatrix(components, groundNode);
  const solution = solve(built.matrix, built.rhs);

  const n = built.nodeNames.length;

  // First n entries are node voltages
  const nodeVoltages: NodeVoltage[] = built.nodeNames.map((name, i) => ({
    node: name,
    voltage: solution[i],
  }));

  // Remaining m entries are branch currents through voltage sources
  const branchCurrents: BranchCurrent[] = built.vsNames.map((name, i) => ({
    branch: name,
    current: solution[n + i],
  }));

  return { nodeVoltages, branchCurrents };
}

// ============================================================================
// Nonlinear Solution Result
// ============================================================================

/** Result from nonlinear solver (Newton-Raphson) */
export interface NonlinearSolution extends MNASolution {
  converged: boolean;
  iterations: number;
  stampLog: StampLogEntry[];
}

/** AC analysis point: one frequency sweep result */
export interface ACAnalysisPoint {
  frequency: number;
  magnitudes: Record<string, number>;  // node name -> magnitude in dB
  phases: Record<string, number>;      // node name -> phase in degrees
}

// ============================================================================
// Nonlinear Solver (Newton-Raphson) — Stub (Plan 263-02)
// ============================================================================

/**
 * Solve a nonlinear circuit using Newton-Raphson iteration.
 * Stub — to be implemented in Plan 263-02 GREEN phase.
 */
export function solveNonlinear(
  _components: Component[],
  _groundNode: string = '0',
  _maxIter: number = 50,
  _tolerance: number = 1e-6,
): NonlinearSolution {
  throw new Error('solveNonlinear not yet implemented');
}

// ============================================================================
// AC Analysis — Stub (Plan 263-02)
// ============================================================================

/**
 * Run AC frequency-sweep analysis on a circuit.
 * Stub — to be implemented in Plan 263-02 GREEN phase.
 */
export function acAnalysis(
  _components: Component[],
  _freqStart: number,
  _freqStop: number,
  _pointsPerDecade: number,
  _groundNode: string = '0',
): ACAnalysisPoint[] {
  throw new Error('acAnalysis not yet implemented');
}

// ============================================================================
// MNAEngine class (convenience wrapper)
// ============================================================================

/**
 * MNA Engine class providing an OOP interface to the functional API.
 */
export class MNAEngine {
  private groundNode: string;

  constructor(groundNode: string = '0') {
    this.groundNode = groundNode;
  }

  buildMatrix(components: Component[]): MNABuildResult {
    return buildMatrix(components, this.groundNode);
  }

  solve(matrix: number[][], rhs: number[]): number[] {
    return solve(matrix, rhs);
  }

  dcAnalysis(components: Component[]): MNASolution {
    return dcAnalysis(components, this.groundNode);
  }
}
