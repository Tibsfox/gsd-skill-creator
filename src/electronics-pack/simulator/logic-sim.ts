/**
 * Digital Logic Simulator
 *
 * Gate-level simulation for combinational and sequential logic.
 * To be implemented in Phase 265.
 */

/** Supported logic gate types */
export enum GateType {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  NAND = 'NAND',
  NOR = 'NOR',
  XOR = 'XOR',
  XNOR = 'XNOR',
  BUF = 'BUF',
}

/** Logic gate definition */
export interface LogicGate {
  id: string;
  type: GateType;
  inputs: string[];
  output: string;
  propagationDelay: number; // nanoseconds
}

/** Flip-flop types */
export enum FlipFlopType {
  SR = 'SR',
  D = 'D',
  JK = 'JK',
  T = 'T',
}

/** Flip-flop definition */
export interface FlipFlop {
  id: string;
  type: FlipFlopType;
  clock: string;
  inputs: Record<string, string>;
  output: string;
  outputInverted: string;
}

/** Logic simulation state */
export interface LogicState {
  signals: Record<string, boolean>;
  time: number; // nanoseconds
}

/**
 * Placeholder logic simulator class.
 * Full implementation in Phase 265.
 */
export class LogicSimulator {
  private gates: LogicGate[] = [];
  private flipFlops: FlipFlop[] = [];
  private state: LogicState = { signals: {}, time: 0 };

  /** Add a gate to the simulation */
  addGate(gate: LogicGate): void {
    this.gates.push(gate);
  }

  /** Add a flip-flop to the simulation */
  addFlipFlop(ff: FlipFlop): void {
    this.flipFlops.push(ff);
  }

  /** Advance simulation by one delay unit — stub */
  step(): LogicState {
    return this.state;
  }

  /** Evaluate until steady state — stub */
  evaluate(): LogicState {
    return this.state;
  }
}
