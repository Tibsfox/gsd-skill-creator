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
 * Stamp a capacitor for transient analysis using Backward Euler companion model.
 *
 * The capacitor is replaced by:
 *   - Equivalent conductance G_eq = C / dt (stamped like a resistor)
 *   - Current source I_eq = C * v_prev / dt (stamped into RHS)
 *
 * where v_prev is the voltage across the capacitor at the previous time step
 * (nodes[0] - nodes[1]).
 *
 * @param target - MNA stamp target
 * @param cap - Capacitor component
 * @param dt - Time step (seconds)
 * @param v_prev - Voltage across capacitor at previous time step (volts)
 */
export function stampCapacitorTransient(
  target: StampTarget,
  cap: Capacitor,
  dt: number,
  v_prev: number,
): void {
  const g_eq = cap.capacitance / dt;
  const i_eq = cap.capacitance * v_prev / dt;
  const ni = target.nodeIndex(cap.nodes[0]);
  const nj = target.nodeIndex(cap.nodes[1]);

  // Stamp equivalent conductance (same pattern as resistor)
  if (ni >= 0 && nj >= 0) {
    target.matrix[ni][ni] += g_eq;
    target.matrix[nj][nj] += g_eq;
    target.matrix[ni][nj] -= g_eq;
    target.matrix[nj][ni] -= g_eq;
    target.stampLog.push({
      component: cap.id,
      row: ni, col: ni, value: g_eq,
      explanation: `${cap.id} (${cap.capacitance}F) BE companion: G_eq=${g_eq} S, R_eq=${dt / cap.capacitance} Ohm`,
    });
  } else if (ni >= 0) {
    target.matrix[ni][ni] += g_eq;
    target.stampLog.push({
      component: cap.id,
      row: ni, col: ni, value: g_eq,
      explanation: `${cap.id} (${cap.capacitance}F) BE companion: G_eq=${g_eq} S (other node is ground)`,
    });
  } else if (nj >= 0) {
    target.matrix[nj][nj] += g_eq;
    target.stampLog.push({
      component: cap.id,
      row: nj, col: nj, value: g_eq,
      explanation: `${cap.id} (${cap.capacitance}F) BE companion: G_eq=${g_eq} S (other node is ground)`,
    });
  }

  // Stamp current source I_eq (flows from nodes[1] to nodes[0], i.e., charging direction)
  // rhs[ni] += i_eq (current enters node 0), rhs[nj] -= i_eq (current leaves node 1)
  if (ni >= 0) {
    target.rhs[ni] += i_eq;
    target.stampLog.push({
      component: cap.id,
      row: ni, col: -1, value: i_eq,
      explanation: `${cap.id} (${cap.capacitance}F) BE companion: I_eq=${i_eq} A (v_prev=${v_prev}V)`,
    });
  }
  if (nj >= 0) {
    target.rhs[nj] -= i_eq;
    target.stampLog.push({
      component: cap.id,
      row: nj, col: -1, value: -i_eq,
      explanation: `${cap.id} (${cap.capacitance}F) BE companion: I_eq=-${i_eq} A (v_prev=${v_prev}V)`,
    });
  }
}

/**
 * Stamp an inductor for transient analysis using Backward Euler companion model.
 *
 * The inductor is replaced by:
 *   - Equivalent conductance G_eq = dt / L (stamped like a resistor)
 *   - Current source I_eq = i_prev (stamped into RHS)
 *
 * where i_prev is the inductor current at the previous time step
 * (flowing from nodes[0] to nodes[1]).
 *
 * @param target - MNA stamp target
 * @param ind - Inductor component
 * @param dt - Time step (seconds)
 * @param i_prev - Inductor current at previous time step (amps)
 */
export function stampInductorTransient(
  target: StampTarget,
  ind: Inductor,
  dt: number,
  i_prev: number,
): void {
  const g_eq = dt / ind.inductance;
  const ni = target.nodeIndex(ind.nodes[0]);
  const nj = target.nodeIndex(ind.nodes[1]);

  // Stamp equivalent conductance (same pattern as resistor)
  if (ni >= 0 && nj >= 0) {
    target.matrix[ni][ni] += g_eq;
    target.matrix[nj][nj] += g_eq;
    target.matrix[ni][nj] -= g_eq;
    target.matrix[nj][ni] -= g_eq;
    target.stampLog.push({
      component: ind.id,
      row: ni, col: ni, value: g_eq,
      explanation: `${ind.id} (${ind.inductance}H) BE companion: G_eq=${g_eq} S, R_eq=${ind.inductance / dt} Ohm`,
    });
  } else if (ni >= 0) {
    target.matrix[ni][ni] += g_eq;
    target.stampLog.push({
      component: ind.id,
      row: ni, col: ni, value: g_eq,
      explanation: `${ind.id} (${ind.inductance}H) BE companion: G_eq=${g_eq} S (other node is ground)`,
    });
  } else if (nj >= 0) {
    target.matrix[nj][nj] += g_eq;
    target.stampLog.push({
      component: ind.id,
      row: nj, col: nj, value: g_eq,
      explanation: `${ind.id} (${ind.inductance}H) BE companion: G_eq=${g_eq} S (other node is ground)`,
    });
  }

  // Stamp current source I_eq = i_prev (flows from nodes[0] to nodes[1])
  // rhs[ni] -= i_prev (current leaves node 0), rhs[nj] += i_prev (current enters node 1)
  if (ni >= 0) {
    target.rhs[ni] -= i_prev;
    target.stampLog.push({
      component: ind.id,
      row: ni, col: -1, value: -i_prev,
      explanation: `${ind.id} (${ind.inductance}H) BE companion: I_eq=${i_prev} A (i_prev=${i_prev}A)`,
    });
  }
  if (nj >= 0) {
    target.rhs[nj] += i_prev;
    target.stampLog.push({
      component: ind.id,
      row: nj, col: -1, value: i_prev,
      explanation: `${ind.id} (${ind.inductance}H) BE companion: I_eq=${i_prev} A (i_prev=${i_prev}A)`,
    });
  }
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

// ============================================================================
// Complex number helpers for AC analysis
// ============================================================================

/** Complex number representation for AC analysis */
export interface Complex {
  re: number;
  im: number;
}

export function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function cSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function cMul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

export function cDiv(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / denom, im: (a.im * b.re - a.re * b.im) / denom };
}

export function cAbs(a: Complex): number {
  return Math.sqrt(a.re * a.re + a.im * a.im);
}

export function cAngle(a: Complex): number {
  return Math.atan2(a.im, a.re);
}

// ============================================================================
// AC Stamp Target — complex-valued matrices
// ============================================================================

/** Target for AC stamping with complex-valued matrix entries */
export interface ACStampTarget {
  matrix: Complex[][];
  rhs: Complex[];
  nodeIndex: (node: string) => number;
  vsIndex: (id: string) => number;
  n: number;
}

// ============================================================================
// Diode Stamp (Piecewise-Linear Model)
// ============================================================================

/** Diode piecewise-linear model parameters */
const DIODE_V_THRESHOLD = 0.6;  // Forward voltage threshold
const DIODE_R_ON = 10;          // Forward resistance (ohms)
const DIODE_R_OFF = 10e6;       // Reverse resistance (ohms)

/**
 * Stamp a diode into the MNA matrix using piecewise-linear model.
 *
 * If voltage across diode (V_anode - V_cathode) >= 0.6V:
 *   Forward-biased: stamp as R_on (10 Ohm) + compensating current source
 *   for the threshold offset.
 * Else:
 *   Reverse-biased: stamp as R_off (10M Ohm).
 *
 * @param target - MNA stamp target
 * @param diode - Diode component (nodes[0] = anode, nodes[1] = cathode)
 * @param nodeVoltages - Current voltage estimates (for region selection)
 */
export function stampDiode(
  target: StampTarget,
  diode: Diode,
  nodeVoltages?: Record<string, number>,
): void {
  const ni = target.nodeIndex(diode.nodes[0]); // anode
  const nj = target.nodeIndex(diode.nodes[1]); // cathode

  // Determine voltage across diode from current estimates
  const vAnode = nodeVoltages?.[diode.nodes[0]] ?? 0;
  const vCathode = nodeVoltages?.[diode.nodes[1]] ?? 0;
  const vDiode = vAnode - vCathode;

  const isForward = vDiode >= DIODE_V_THRESHOLD;
  const R = isForward ? DIODE_R_ON : DIODE_R_OFF;
  const g = 1 / R;
  const region = isForward ? 'forward-biased' : 'reverse-biased';
  const rLabel = isForward ? `R_on=${DIODE_R_ON}` : `R_off=${DIODE_R_OFF}`;

  target.stampLog.push({
    component: diode.id,
    row: -1, col: -1, value: 0,
    explanation: `${diode.id}: ${region} (${rLabel} Ohm, Vd=${vDiode.toFixed(4)}V)`,
  });

  // Stamp the resistor component (same pattern as stampResistor)
  if (ni >= 0 && nj >= 0) {
    target.matrix[ni][ni] += g;
    target.matrix[nj][nj] += g;
    target.matrix[ni][nj] -= g;
    target.matrix[nj][ni] -= g;
    target.stampLog.push({
      component: diode.id,
      row: ni, col: ni, value: g,
      explanation: `${diode.id} (${region}): G += ${g} S between nodes`,
    });
  } else if (ni >= 0) {
    target.matrix[ni][ni] += g;
    target.stampLog.push({
      component: diode.id,
      row: ni, col: ni, value: g,
      explanation: `${diode.id} (${region}): G[${ni}][${ni}] += ${g} S (cathode is ground)`,
    });
  } else if (nj >= 0) {
    target.matrix[nj][nj] += g;
    target.stampLog.push({
      component: diode.id,
      row: nj, col: nj, value: g,
      explanation: `${diode.id} (${region}): G[${nj}][${nj}] += ${g} S (anode is ground)`,
    });
  }

  // For forward-biased: add current source to model the 0.6V threshold
  // The diode current is I = G*(Va - Vc - Vth), so the -G*Vth constant
  // moves to the RHS: rhs[anode] += G*Vth, rhs[cathode] -= G*Vth
  if (isForward) {
    const iOffset = DIODE_V_THRESHOLD * g;
    if (ni >= 0) {
      target.rhs[ni] += iOffset;
    }
    if (nj >= 0) {
      target.rhs[nj] -= iOffset;
    }
    target.stampLog.push({
      component: diode.id,
      row: -1, col: -1, value: iOffset,
      explanation: `${diode.id} (forward): threshold offset current ${iOffset.toFixed(6)} A`,
    });
  }
}

// ============================================================================
// AC Stamp Functions
// ============================================================================

/**
 * Stamp a resistor into the complex AC MNA matrix.
 * Same as DC but into complex-valued matrix (purely real admittance).
 */
export function stampResistorAC(target: ACStampTarget, r: Resistor): void {
  const g = 1 / r.resistance;
  const ni = target.nodeIndex(r.nodes[0]);
  const nj = target.nodeIndex(r.nodes[1]);

  if (ni >= 0 && nj >= 0) {
    target.matrix[ni][ni].re += g;
    target.matrix[nj][nj].re += g;
    target.matrix[ni][nj].re -= g;
    target.matrix[nj][ni].re -= g;
  } else if (ni >= 0) {
    target.matrix[ni][ni].re += g;
  } else if (nj >= 0) {
    target.matrix[nj][nj].re += g;
  }
}

/**
 * Stamp a capacitor into the complex AC MNA matrix.
 * Admittance Y = j * omega * C
 */
export function stampCapacitorAC(target: ACStampTarget, cap: Capacitor, omega: number): void {
  const y: Complex = { re: 0, im: omega * cap.capacitance }; // j*omega*C
  const ni = target.nodeIndex(cap.nodes[0]);
  const nj = target.nodeIndex(cap.nodes[1]);

  if (ni >= 0 && nj >= 0) {
    target.matrix[ni][ni] = cAdd(target.matrix[ni][ni], y);
    target.matrix[nj][nj] = cAdd(target.matrix[nj][nj], y);
    target.matrix[ni][nj] = cSub(target.matrix[ni][nj], y);
    target.matrix[nj][ni] = cSub(target.matrix[nj][ni], y);
  } else if (ni >= 0) {
    target.matrix[ni][ni] = cAdd(target.matrix[ni][ni], y);
  } else if (nj >= 0) {
    target.matrix[nj][nj] = cAdd(target.matrix[nj][nj], y);
  }
}

/**
 * Stamp an inductor into the complex AC MNA matrix.
 * Admittance Y = 1 / (j * omega * L) = -j / (omega * L)
 */
export function stampInductorAC(target: ACStampTarget, ind: Inductor, omega: number): void {
  const y: Complex = { re: 0, im: -1 / (omega * ind.inductance) };
  const ni = target.nodeIndex(ind.nodes[0]);
  const nj = target.nodeIndex(ind.nodes[1]);

  if (ni >= 0 && nj >= 0) {
    target.matrix[ni][ni] = cAdd(target.matrix[ni][ni], y);
    target.matrix[nj][nj] = cAdd(target.matrix[nj][nj], y);
    target.matrix[ni][nj] = cSub(target.matrix[ni][nj], y);
    target.matrix[nj][ni] = cSub(target.matrix[nj][ni], y);
  } else if (ni >= 0) {
    target.matrix[ni][ni] = cAdd(target.matrix[ni][ni], y);
  } else if (nj >= 0) {
    target.matrix[nj][nj] = cAdd(target.matrix[nj][nj], y);
  }
}

/**
 * Stamp a voltage source into the complex AC MNA matrix.
 * Same structure as DC but with complex entries (purely real 1/-1 values).
 */
export function stampVoltageSourceAC(target: ACStampTarget, vs: VoltageSource): void {
  const ni = target.nodeIndex(vs.nodes[0]);
  const nj = target.nodeIndex(vs.nodes[1]);
  const k = target.vsIndex(vs.id);
  const row = target.n + k;

  if (ni >= 0) {
    target.matrix[ni][row].re += 1;
    target.matrix[row][ni].re += 1;
  }
  if (nj >= 0) {
    target.matrix[nj][row].re -= 1;
    target.matrix[row][nj].re -= 1;
  }

  // RHS: voltage source value (AC amplitude = DC voltage)
  target.rhs[row] = { re: vs.voltage, im: 0 };
}

/**
 * Dispatch AC stamping to correct function based on component type.
 */
export function stampComponentAC(
  target: ACStampTarget,
  component: Component,
  omega: number,
): void {
  switch (component.type) {
    case 'resistor':
      stampResistorAC(target, component);
      break;
    case 'voltage-source':
      stampVoltageSourceAC(target, component);
      break;
    case 'current-source':
      {
        const ni = target.nodeIndex(component.nodes[0]);
        const nj = target.nodeIndex(component.nodes[1]);
        if (ni >= 0) target.rhs[ni] = cSub(target.rhs[ni], { re: component.current, im: 0 });
        if (nj >= 0) target.rhs[nj] = cAdd(target.rhs[nj], { re: component.current, im: 0 });
      }
      break;
    case 'capacitor':
      stampCapacitorAC(target, component, omega);
      break;
    case 'inductor':
      stampInductorAC(target, component, omega);
      break;
    default:
      break;
  }
}

/** Transient state passed to stampComponent for time-domain analysis */
export interface TransientState {
  dt: number;
  prevVoltages: Record<string, number>;
  prevCurrents: Record<string, number>;
}

/**
 * Dispatch stamping to the correct function based on component type.
 * Analysis type determines how reactive components (C, L) are treated.
 *
 * When analysisType is 'transient', transientState must be provided with
 * dt, prevVoltages, and prevCurrents for companion model stamping.
 */
export function stampComponent(
  target: StampTarget,
  component: Component,
  analysisType: 'dc' | 'ac' | 'transient' = 'dc',
  transientState?: TransientState,
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
      } else if (analysisType === 'transient' && transientState) {
        // Compute voltage across capacitor from previous time step
        const vN0 = transientState.prevVoltages[component.nodes[0]] ?? 0;
        const vN1 = transientState.prevVoltages[component.nodes[1]] ?? 0;
        const v_prev = vN0 - vN1;
        stampCapacitorTransient(target, component, transientState.dt, v_prev);
      }
      // AC stamping will be added in later plans
      break;
    case 'inductor':
      if (analysisType === 'dc') {
        stampInductor(target, component);
      } else if (analysisType === 'transient' && transientState) {
        const i_prev = transientState.prevCurrents[component.id] ?? 0;
        stampInductorTransient(target, component, transientState.dt, i_prev);
      }
      // AC stamping will be added in later plans
      break;
    default:
      // Diode, BJT, MOSFET, Regulator — to be implemented in later phases
      break;
  }
}
