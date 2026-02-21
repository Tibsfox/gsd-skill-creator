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
import {
  stampComponent,
  stampDiode,
  stampBJT,
  stampComponentAC,
  cAbs,
  cAngle,
  cDiv,
  cSub,
  type StampTarget,
  type ACStampTarget,
  type Complex,
} from './components';

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

    // Collect BJT base node (third terminal)
    if ('baseNode' in comp && typeof comp.baseNode === 'string' && comp.baseNode !== groundNode) {
      nodeSet.add(comp.baseNode);
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
// Nonlinear Solver (Newton-Raphson)
// ============================================================================

/**
 * Collect nodes for nonlinear analysis.
 * Unlike DC, diodes do NOT create extra VS rows -- they stamp as resistors.
 * Only explicit voltage sources get VS rows.
 */
function collectNodesNonlinear(
  components: Component[],
  groundNode: string,
): { nodeNames: string[]; vsNames: string[] } {
  const nodeSet = new Set<string>();
  const vsNames: string[] = [];

  for (const comp of components) {
    if ('nodes' in comp) {
      for (const node of comp.nodes) {
        if (node !== groundNode) {
          nodeSet.add(node);
        }
      }
    }

    // Collect BJT base node (third terminal)
    if ('baseNode' in comp && typeof comp.baseNode === 'string' && comp.baseNode !== groundNode) {
      nodeSet.add(comp.baseNode);
    }

    // Only voltage sources get extra rows (not inductors in nonlinear mode,
    // but we keep inductors as VS for DC compatibility)
    if (comp.type === 'voltage-source') {
      vsNames.push(comp.id);
    } else if (comp.type === 'inductor') {
      vsNames.push(comp.id);
    }
  }

  return { nodeNames: Array.from(nodeSet), vsNames };
}

/**
 * Build the MNA matrix for nonlinear analysis with current voltage estimates.
 * Diodes are stamped using piecewise-linear model based on nodeVoltages.
 */
function buildMatrixNonlinear(
  components: Component[],
  groundNode: string,
  nodeNames: string[],
  vsNames: string[],
  nodeVoltages: Record<string, number>,
): { matrix: number[][]; rhs: number[]; stampLog: StampLogEntry[] } {
  const n = nodeNames.length;
  const m = vsNames.length;
  const size = n + m;

  const matrix: number[][] = [];
  for (let i = 0; i < size; i++) {
    matrix.push(new Array(size).fill(0));
  }
  const rhs = new Array(size).fill(0);
  const stampLog: StampLogEntry[] = [];

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

  for (const comp of components) {
    if (comp.type === 'diode') {
      stampDiode(target, comp, nodeVoltages);
    } else if (comp.type === 'bjt') {
      stampBJT(target, comp, nodeVoltages);
    } else {
      stampComponent(target, comp, 'dc');
    }
  }

  return { matrix, rhs, stampLog };
}

/**
 * Solve a nonlinear circuit using Newton-Raphson iteration.
 *
 * Uses piecewise-linear diode model and iterates until convergence:
 * 1. Initial guess: all node voltages = 0
 * 2. Each iteration: rebuild matrix with current estimates, solve, check convergence
 * 3. Convergence: max |v_new - v_old| < tolerance
 *
 * @param components - Array of circuit components (may include diodes)
 * @param groundNode - Ground node name
 * @param maxIter - Maximum Newton-Raphson iterations (default 50)
 * @param tolerance - Convergence tolerance in volts (default 1e-6)
 * @returns NonlinearSolution with convergence info
 */
export function solveNonlinear(
  components: Component[],
  groundNode: string = '0',
  maxIter: number = 50,
  tolerance: number = 1e-6,
): NonlinearSolution {
  const { nodeNames, vsNames } = collectNodesNonlinear(components, groundNode);
  const n = nodeNames.length;

  // Initial guess: all node voltages = 0
  let voltageEstimates: Record<string, number> = {};
  for (const name of nodeNames) {
    voltageEstimates[name] = 0;
  }

  let lastSolution: number[] = new Array(n + vsNames.length).fill(0);
  let allStampLog: StampLogEntry[] = [];
  let converged = false;
  let iterations = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    iterations = iter + 1;

    // Build matrix with current voltage estimates
    const { matrix, rhs, stampLog } = buildMatrixNonlinear(
      components, groundNode, nodeNames, vsNames, voltageEstimates,
    );
    allStampLog = stampLog;

    // Solve the linear system
    const solution = solve(matrix, rhs);

    // Check convergence: max |v_new - v_old| < tolerance
    let maxDiff = 0;
    for (let i = 0; i < n; i++) {
      const diff = Math.abs(solution[i] - lastSolution[i]);
      if (diff > maxDiff) maxDiff = diff;
    }

    // Update voltage estimates
    for (let i = 0; i < n; i++) {
      voltageEstimates[nodeNames[i]] = solution[i];
    }
    lastSolution = solution;

    if (maxDiff < tolerance && iter > 0) {
      converged = true;
      break;
    }
  }

  // Map solution to named results
  const nodeVoltageResults: NodeVoltage[] = nodeNames.map((name, i) => ({
    node: name,
    voltage: lastSolution[i],
  }));

  const branchCurrents: BranchCurrent[] = vsNames.map((name, i) => ({
    branch: name,
    current: lastSolution[n + i],
  }));

  return {
    nodeVoltages: nodeVoltageResults,
    branchCurrents,
    converged,
    iterations,
    stampLog: allStampLog,
  };
}

// ============================================================================
// Complex Gaussian Elimination
// ============================================================================

/**
 * Solve a complex-valued linear system Ax = b using Gaussian elimination
 * with partial pivoting.
 *
 * @param A - Complex coefficient matrix (n x n)
 * @param b - Complex right-hand side vector (length n)
 * @returns Complex solution vector x (length n)
 */
function solveComplex(A: Complex[][], b: Complex[]): Complex[] {
  const n = A.length;
  if (n === 0) return [];

  // Deep clone
  const M: Complex[][] = A.map((row) => row.map((c) => ({ re: c.re, im: c.im })));
  const rhs: Complex[] = b.map((c) => ({ re: c.re, im: c.im }));

  // Forward elimination with partial pivoting
  for (let k = 0; k < n; k++) {
    // Find pivot: row with maximum |M[row][k]| for row >= k
    let maxVal = cAbs(M[k][k]);
    let pivotRow = k;
    for (let row = k + 1; row < n; row++) {
      const absVal = cAbs(M[row][k]);
      if (absVal > maxVal) {
        maxVal = absVal;
        pivotRow = row;
      }
    }

    // Swap rows
    if (pivotRow !== k) {
      [M[k], M[pivotRow]] = [M[pivotRow], M[k]];
      [rhs[k], rhs[pivotRow]] = [rhs[pivotRow], rhs[k]];
    }

    // Eliminate column k for all rows below k
    const pivot = M[k][k];
    for (let i = k + 1; i < n; i++) {
      const factor = cDiv(M[i][k], pivot);
      for (let j = k; j < n; j++) {
        M[i][j] = cSub(M[i][j], { re: factor.re * M[k][j].re - factor.im * M[k][j].im, im: factor.re * M[k][j].im + factor.im * M[k][j].re });
      }
      rhs[i] = cSub(rhs[i], { re: factor.re * rhs[k].re - factor.im * rhs[k].im, im: factor.re * rhs[k].im + factor.im * rhs[k].re });
    }
  }

  // Back-substitution
  const x: Complex[] = new Array(n).fill(null).map(() => ({ re: 0, im: 0 }));
  for (let i = n - 1; i >= 0; i--) {
    let sum: Complex = { re: rhs[i].re, im: rhs[i].im };
    for (let j = i + 1; j < n; j++) {
      sum = cSub(sum, { re: M[i][j].re * x[j].re - M[i][j].im * x[j].im, im: M[i][j].re * x[j].im + M[i][j].im * x[j].re });
    }
    x[i] = cDiv(sum, M[i][i]);
  }

  return x;
}

// ============================================================================
// AC Analysis
// ============================================================================

/**
 * Collect nodes for AC analysis.
 * Voltage sources get extra VS rows. Inductors are treated as admittances
 * (not as VS rows like in DC) so they do NOT add extra rows.
 */
function collectNodesAC(
  components: Component[],
  groundNode: string,
): { nodeNames: string[]; vsNames: string[] } {
  const nodeSet = new Set<string>();
  const vsNames: string[] = [];

  for (const comp of components) {
    if ('nodes' in comp) {
      for (const node of comp.nodes) {
        if (node !== groundNode) {
          nodeSet.add(node);
        }
      }
    }

    // Collect BJT base node (third terminal)
    if ('baseNode' in comp && typeof comp.baseNode === 'string' && comp.baseNode !== groundNode) {
      nodeSet.add(comp.baseNode);
    }

    // In AC, only voltage sources get extra rows
    // Inductors are stamped as admittances Y = 1/(j*omega*L)
    if (comp.type === 'voltage-source') {
      vsNames.push(comp.id);
    }
  }

  return { nodeNames: Array.from(nodeSet), vsNames };
}

/**
 * Generate logarithmically-spaced frequencies.
 *
 * @param freqStart - Start frequency (Hz)
 * @param freqStop - Stop frequency (Hz)
 * @param pointsPerDecade - Number of points per decade
 * @returns Array of frequencies
 */
function generateLogFrequencies(
  freqStart: number,
  freqStop: number,
  pointsPerDecade: number,
): number[] {
  const logStart = Math.log10(freqStart);
  const logStop = Math.log10(freqStop);
  const numDecades = logStop - logStart;
  const totalPoints = Math.round(numDecades * pointsPerDecade) + 1;

  const frequencies: number[] = [];
  for (let i = 0; i < totalPoints; i++) {
    const logF = logStart + (i / (totalPoints - 1)) * (logStop - logStart);
    frequencies.push(Math.pow(10, logF));
  }

  return frequencies;
}

/**
 * Run AC frequency-sweep analysis on a circuit.
 *
 * For each frequency point:
 * 1. Build complex MNA matrix using AC stamp functions
 * 2. Solve complex linear system
 * 3. Extract magnitude (dB) and phase (degrees) for each node
 *
 * Magnitudes are relative to the source voltage (assumed to be 1V for transfer
 * function measurements, or normalized to the actual source voltage).
 *
 * @param components - Array of circuit components
 * @param freqStart - Start frequency in Hz
 * @param freqStop - Stop frequency in Hz
 * @param pointsPerDecade - Points per frequency decade
 * @param groundNode - Ground node name
 * @returns Array of ACAnalysisPoint with frequency, magnitudes (dB), phases (degrees)
 */
export function acAnalysis(
  components: Component[],
  freqStart: number,
  freqStop: number,
  pointsPerDecade: number,
  groundNode: string = '0',
): ACAnalysisPoint[] {
  const { nodeNames, vsNames } = collectNodesAC(components, groundNode);
  const n = nodeNames.length;
  const m = vsNames.length;
  const size = n + m;

  // Build lookup maps
  const nodeMap = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    nodeMap.set(nodeNames[i], i);
  }
  const vsMap = new Map<string, number>();
  for (let i = 0; i < m; i++) {
    vsMap.set(vsNames[i], i);
  }

  // Find the source voltage for normalization
  // Use the first voltage source's magnitude as reference
  let vRef = 1;
  for (const comp of components) {
    if (comp.type === 'voltage-source') {
      vRef = Math.abs(comp.voltage);
      break;
    }
  }

  const frequencies = generateLogFrequencies(freqStart, freqStop, pointsPerDecade);
  const results: ACAnalysisPoint[] = [];

  for (const freq of frequencies) {
    const omega = 2 * Math.PI * freq;

    // Create complex zero matrix and RHS
    const matrix: Complex[][] = [];
    for (let i = 0; i < size; i++) {
      matrix.push(new Array(size).fill(null).map(() => ({ re: 0, im: 0 })));
    }
    const rhs: Complex[] = new Array(size).fill(null).map(() => ({ re: 0, im: 0 }));

    const acTarget: ACStampTarget = {
      matrix,
      rhs,
      nodeIndex: (node: string) => {
        if (node === groundNode) return -1;
        return nodeMap.get(node) ?? -1;
      },
      vsIndex: (id: string) => vsMap.get(id) ?? -1,
      n,
    };

    // Stamp each component using AC stamp functions
    for (const comp of components) {
      stampComponentAC(acTarget, comp, omega);
    }

    // Solve the complex system
    const solution = solveComplex(matrix, rhs);

    // Extract magnitudes and phases for each node
    const magnitudes: Record<string, number> = {};
    const phases: Record<string, number> = {};

    for (let i = 0; i < n; i++) {
      const nodeName = nodeNames[i];
      const nodeValue = solution[i];
      const mag = cAbs(nodeValue);
      // Magnitude in dB relative to source voltage
      magnitudes[nodeName] = 20 * Math.log10(mag / vRef);
      // Phase in degrees
      phases[nodeName] = cAngle(nodeValue) * (180 / Math.PI);
    }

    results.push({ frequency: freq, magnitudes, phases });
  }

  return results;
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
