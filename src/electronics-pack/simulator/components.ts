/**
 * Circuit Component Models
 *
 * Type stubs for all simulatable electronic components.
 * Passive components implemented in Phase 263.
 * BJT model added in Phase 269.
 * MOSFET, op-amp, and regulator models added in Phase 270.
 */

/** Base component interface with type discriminator */
export interface BaseComponent {
  id: string;
  type: string;
  nodes: [string, string];
}

/** Resistor — Phase 263 */
export interface Resistor extends BaseComponent {
  type: 'resistor';
  resistance: number; // ohms
}

/** Capacitor — Phase 263 */
export interface Capacitor extends BaseComponent {
  type: 'capacitor';
  capacitance: number; // farads
}

/** Inductor — Phase 263 */
export interface Inductor extends BaseComponent {
  type: 'inductor';
  inductance: number; // henries
}

/** DC voltage source — Phase 263 */
export interface VoltageSource extends BaseComponent {
  type: 'voltage-source';
  voltage: number; // volts
}

/** DC current source — Phase 263 */
export interface CurrentSource extends BaseComponent {
  type: 'current-source';
  current: number; // amps
}

/** Diode — Phase 263 */
export interface Diode extends BaseComponent {
  type: 'diode';
  saturationCurrent: number; // amps (Is)
  thermalVoltage: number;    // volts (Vt)
}

/** BJT transistor — Phase 269 */
export interface BJT extends BaseComponent {
  type: 'bjt';
  polarity: 'NPN' | 'PNP';
  beta: number;          // current gain
  nodes: [string, string]; // collector, emitter (base is third)
  baseNode: string;
}

/** MOSFET — Phase 270 */
export interface MOSFET extends BaseComponent {
  type: 'mosfet';
  channel: 'N' | 'P';
  thresholdVoltage: number; // volts (Vth)
  onResistance: number;     // ohms (Rds_on)
  gateNode: string;
}

/** Op-amp — Phase 270 */
export interface OpAmp {
  id: string;
  type: 'op-amp';
  invertingInput: string;
  nonInvertingInput: string;
  output: string;
  openLoopGain: number;
  gbwProduct: number;  // Hz
  slewRate: number;    // V/us
  inputOffset: number; // volts
}

/** Voltage regulator — Phase 270 */
export interface Regulator extends BaseComponent {
  type: 'regulator';
  topology: 'linear' | 'buck' | 'boost' | 'buck-boost';
  outputVoltage: number;  // volts
  dropoutVoltage: number; // volts (linear only)
}

/** Union type of all circuit components */
export type Component =
  | Resistor
  | Capacitor
  | Inductor
  | VoltageSource
  | CurrentSource
  | Diode
  | BJT
  | MOSFET
  | Regulator;

// ============================================================================
// Stamp Target — interface for MNA matrix stamping
// ============================================================================

import type { StampLogEntry } from './mna-engine';

/** Target that stamping functions write into */
export interface StampTarget {
  matrix: number[][];          // (n+m) x (n+m) MNA matrix
  rhs: number[];               // right-hand side vector
  stampLog: StampLogEntry[];
  nodeIndex: (node: string) => number;  // maps node name to matrix index (-1 for ground)
  vsIndex: (id: string) => number;      // maps voltage source ID to its row offset
  n: number;                   // number of non-ground nodes (for VS offset calculation)
}

// ============================================================================
// Stamping Functions
// ============================================================================

/**
 * Stamp a resistor into the MNA matrix.
 *
 * For resistor R between nodes i and j:
 *   G[i][i] += 1/R, G[j][j] += 1/R
 *   G[i][j] -= 1/R, G[j][i] -= 1/R
 * Ground rows/cols are skipped (nodeIndex returns -1).
 */
export function stampResistor(target: StampTarget, r: Resistor): void {
  const g = 1 / r.resistance;
  const ni = target.nodeIndex(r.nodes[0]);
  const nj = target.nodeIndex(r.nodes[1]);

  if (ni >= 0 && nj >= 0) {
    // Both nodes are non-ground: 4 stamps
    target.matrix[ni][ni] += g;
    target.stampLog.push({
      component: r.id,
      row: ni, col: ni, value: g,
      explanation: `${r.id} (${r.resistance} Ohm): G[${ni}][${ni}] += ${g} S`,
    });

    target.matrix[nj][nj] += g;
    target.stampLog.push({
      component: r.id,
      row: nj, col: nj, value: g,
      explanation: `${r.id} (${r.resistance} Ohm): G[${nj}][${nj}] += ${g} S`,
    });

    target.matrix[ni][nj] -= g;
    target.stampLog.push({
      component: r.id,
      row: ni, col: nj, value: -g,
      explanation: `${r.id} (${r.resistance} Ohm): G[${ni}][${nj}] -= ${g} S`,
    });

    target.matrix[nj][ni] -= g;
    target.stampLog.push({
      component: r.id,
      row: nj, col: ni, value: -g,
      explanation: `${r.id} (${r.resistance} Ohm): G[${nj}][${ni}] -= ${g} S`,
    });
  } else if (ni >= 0) {
    // Only node i is non-ground: 1 diagonal stamp
    target.matrix[ni][ni] += g;
    target.stampLog.push({
      component: r.id,
      row: ni, col: ni, value: g,
      explanation: `${r.id} (${r.resistance} Ohm): G[${ni}][${ni}] += ${g} S (other node is ground)`,
    });
  } else if (nj >= 0) {
    // Only node j is non-ground: 1 diagonal stamp
    target.matrix[nj][nj] += g;
    target.stampLog.push({
      component: r.id,
      row: nj, col: nj, value: g,
      explanation: `${r.id} (${r.resistance} Ohm): G[${nj}][${nj}] += ${g} S (other node is ground)`,
    });
  }
  // Both ground: no stamps needed
}

/**
 * Stamp a voltage source into the MNA matrix.
 *
 * For voltage source V from node+(i) to node-(j), with VS index k:
 *   B[i][k] += 1, B[j][k] -= 1
 *   C[k][i] += 1, C[k][j] -= 1
 *   e[k] = V
 * In the (n+m)x(n+m) matrix, VS rows start at offset n.
 */
export function stampVoltageSource(target: StampTarget, vs: VoltageSource): void {
  const ni = target.nodeIndex(vs.nodes[0]); // positive terminal
  const nj = target.nodeIndex(vs.nodes[1]); // negative terminal
  const k = target.vsIndex(vs.id);          // VS equation index
  const row = target.n + k;                 // matrix row for this VS

  // B submatrix stamps (node rows, VS column)
  if (ni >= 0) {
    target.matrix[ni][row] += 1;
    target.stampLog.push({
      component: vs.id,
      row: ni, col: row, value: 1,
      explanation: `${vs.id} (${vs.voltage}V): B[${ni}][${k}] += 1 (positive terminal)`,
    });
  }
  if (nj >= 0) {
    target.matrix[nj][row] -= 1;
    target.stampLog.push({
      component: vs.id,
      row: nj, col: row, value: -1,
      explanation: `${vs.id} (${vs.voltage}V): B[${nj}][${k}] -= 1 (negative terminal)`,
    });
  }

  // C submatrix stamps (VS row, node columns)
  if (ni >= 0) {
    target.matrix[row][ni] += 1;
    target.stampLog.push({
      component: vs.id,
      row: row, col: ni, value: 1,
      explanation: `${vs.id} (${vs.voltage}V): C[${k}][${ni}] += 1 (positive terminal)`,
    });
  }
  if (nj >= 0) {
    target.matrix[row][nj] -= 1;
    target.stampLog.push({
      component: vs.id,
      row: row, col: nj, value: -1,
      explanation: `${vs.id} (${vs.voltage}V): C[${k}][${nj}] -= 1 (negative terminal)`,
    });
  }

  // e vector (RHS for VS equation)
  target.rhs[row] = vs.voltage;
  target.stampLog.push({
    component: vs.id,
    row: row, col: -1, value: vs.voltage,
    explanation: `${vs.id} (${vs.voltage}V): e[${k}] = ${vs.voltage} V`,
  });
}

/**
 * Stamp a current source into the MNA RHS vector.
 *
 * Current source I flowing from node i to node j:
 *   rhs[i] -= I (current leaves node i)
 *   rhs[j] += I (current enters node j)
 */
export function stampCurrentSource(target: StampTarget, cs: CurrentSource): void {
  const ni = target.nodeIndex(cs.nodes[0]); // from node
  const nj = target.nodeIndex(cs.nodes[1]); // to node

  if (ni >= 0) {
    target.rhs[ni] -= cs.current;
    target.stampLog.push({
      component: cs.id,
      row: ni, col: -1, value: -cs.current,
      explanation: `${cs.id} (${cs.current}A): rhs[${ni}] -= ${cs.current} A (current leaves)`,
    });
  }

  if (nj >= 0) {
    target.rhs[nj] += cs.current;
    target.stampLog.push({
      component: cs.id,
      row: nj, col: -1, value: cs.current,
      explanation: `${cs.id} (${cs.current}A): rhs[${nj}] += ${cs.current} A (current enters)`,
    });
  }
}

/**
 * Stamp a capacitor for DC analysis (open circuit — no contribution).
 */
export function stampCapacitor(target: StampTarget, cap: Capacitor): void {
  target.stampLog.push({
    component: cap.id,
    row: -1, col: -1, value: 0,
    explanation: `${cap.id} (${cap.capacitance}F): open circuit in DC — no stamp`,
  });
}

/**
 * Stamp an inductor for DC analysis (short circuit — zero-volt voltage source).
 *
 * In DC steady state, an inductor has zero impedance, modeled as a
 * zero-volt voltage source between its terminals.
 */
export function stampInductor(target: StampTarget, ind: Inductor): void {
  // Create a virtual voltage source with V=0
  const virtualVS: VoltageSource = {
    id: ind.id,
    type: 'voltage-source',
    nodes: ind.nodes,
    voltage: 0,
  };
  stampVoltageSource(target, virtualVS);

  // Override the last few log entries to attribute to the inductor
  // and add an explanatory entry
  for (let i = target.stampLog.length - 1; i >= 0; i--) {
    if (target.stampLog[i].component === ind.id) {
      const entry = target.stampLog[i];
      entry.explanation = entry.explanation.replace(
        /\(0V\)/,
        `(${ind.inductance}H, short circuit in DC)`
      );
    }
  }
}

/**
 * Stamp a diode into the MNA matrix using piecewise-linear model.
 * Stub — to be implemented in Plan 263-02 GREEN phase.
 */
export function stampDiode(
  _target: StampTarget,
  _diode: Diode,
  _nodeVoltages?: Record<string, number>,
): void {
  throw new Error('stampDiode not yet implemented');
}

/**
 * Dispatch stamping to the correct function based on component type.
 * Analysis type determines how reactive components (C, L) are treated.
 */
export function stampComponent(
  target: StampTarget,
  component: Component,
  analysisType: 'dc' | 'ac' | 'transient' = 'dc',
): void {
  switch (component.type) {
    case 'resistor':
      stampResistor(target, component);
      break;
    case 'voltage-source':
      stampVoltageSource(target, component);
      break;
    case 'current-source':
      stampCurrentSource(target, component);
      break;
    case 'capacitor':
      if (analysisType === 'dc') {
        stampCapacitor(target, component);
      }
      // AC and transient stamping will be added in later plans
      break;
    case 'inductor':
      if (analysisType === 'dc') {
        stampInductor(target, component);
      }
      // AC and transient stamping will be added in later plans
      break;
    default:
      // Diode, BJT, MOSFET, Regulator — to be implemented in later phases
      break;
  }
}
