/**
 * Digital Logic Simulator
 *
 * Gate-level simulation for combinational and sequential logic.
 * Supports all 8 fundamental gate types with CMOS MOSFET-level internals,
 * step-based propagation, steady-state evaluation, and oscillation detection.
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

/** CMOS MOSFET-level gate construction details */
export interface GateInternals {
  gateType: GateType;
  mosfetCount: number;
  pullUpNetwork: string;
  pullDownNetwork: string;
  description: string;
}

// ---------------------------------------------------------------------------
// evaluateGate -- pure function for gate truth table evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate a logic gate given its type and boolean input values.
 * Returns the boolean output of the gate.
 *
 * @throws Error if inputs array is empty
 */
export function evaluateGate(type: GateType, inputs: boolean[]): boolean {
  if (inputs.length === 0) {
    throw new Error('Gate evaluation requires at least one input');
  }

  switch (type) {
    case GateType.AND:
      return inputs.every(Boolean);

    case GateType.OR:
      return inputs.some(Boolean);

    case GateType.NOT:
      return !inputs[0];

    case GateType.NAND:
      return !inputs.every(Boolean);

    case GateType.NOR:
      return !inputs.some(Boolean);

    case GateType.XOR:
      return inputs.reduce((acc: boolean, v: boolean) => acc !== v, false);

    case GateType.XNOR:
      return !inputs.reduce((acc: boolean, v: boolean) => acc !== v, false);

    case GateType.BUF:
      return inputs[0];

    default:
      throw new Error(`Unknown gate type: ${type}`);
  }
}

// ---------------------------------------------------------------------------
// getGateInternals -- CMOS MOSFET-level construction details
// ---------------------------------------------------------------------------

/** CMOS gate internals lookup for 2-input variants */
const GATE_INTERNALS: Record<GateType, GateInternals> = {
  [GateType.NOT]: {
    gateType: GateType.NOT,
    mosfetCount: 2,
    pullUpNetwork: '1 PMOS to Vdd',
    pullDownNetwork: '1 NMOS to Gnd',
    description:
      'CMOS inverter: single PMOS pull-up and NMOS pull-down. When input is high, ' +
      'NMOS conducts pulling output low; when input is low, PMOS conducts pulling output high.',
  },
  [GateType.NAND]: {
    gateType: GateType.NAND,
    mosfetCount: 4,
    pullUpNetwork: '2 PMOS in parallel',
    pullDownNetwork: '2 NMOS in series',
    description:
      'CMOS NAND: parallel PMOS pull-up network (either input low pulls output high) ' +
      'and series NMOS pull-down network (both inputs must be high to pull output low).',
  },
  [GateType.AND]: {
    gateType: GateType.AND,
    mosfetCount: 6,
    pullUpNetwork: 'NAND followed by inverter pull-up',
    pullDownNetwork: 'NAND followed by inverter pull-down',
    description:
      'CMOS AND: NAND gate (4 MOSFETs) followed by an inverter (2 MOSFETs). ' +
      'The NAND produces the complement, and the inverter restores true AND logic.',
  },
  [GateType.NOR]: {
    gateType: GateType.NOR,
    mosfetCount: 4,
    pullUpNetwork: '2 PMOS in series',
    pullDownNetwork: '2 NMOS in parallel',
    description:
      'CMOS NOR: series PMOS pull-up network (both inputs must be low to pull output high) ' +
      'and parallel NMOS pull-down network (either input high pulls output low).',
  },
  [GateType.OR]: {
    gateType: GateType.OR,
    mosfetCount: 6,
    pullUpNetwork: 'NOR followed by inverter pull-up',
    pullDownNetwork: 'NOR followed by inverter pull-down',
    description:
      'CMOS OR: NOR gate (4 MOSFETs) followed by an inverter (2 MOSFETs). ' +
      'The NOR produces the complement, and the inverter restores true OR logic.',
  },
  [GateType.XOR]: {
    gateType: GateType.XOR,
    mosfetCount: 12,
    pullUpNetwork: 'Transmission gate PMOS pairs with complementary control',
    pullDownNetwork: 'Transmission gate NMOS pairs with complementary control',
    description:
      'CMOS XOR: implemented using transmission gates. Two inverters (4 MOSFETs) generate ' +
      'complementary signals, and two transmission gates (8 MOSFETs) select between input ' +
      'and its complement based on the other input. Total: 12 MOSFETs.',
  },
  [GateType.XNOR]: {
    gateType: GateType.XNOR,
    mosfetCount: 12,
    pullUpNetwork: 'Transmission gate PMOS pairs with complementary control',
    pullDownNetwork: 'Transmission gate NMOS pairs with complementary control',
    description:
      'CMOS XNOR: complement of XOR, implemented using transmission gates. ' +
      'Two inverters (4 MOSFETs) generate complementary signals, and two transmission gates ' +
      '(8 MOSFETs) select output. Produces equivalence function. Total: 12 MOSFETs.',
  },
  [GateType.BUF]: {
    gateType: GateType.BUF,
    mosfetCount: 4,
    pullUpNetwork: 'Two cascaded inverter PMOS stages',
    pullDownNetwork: 'Two cascaded inverter NMOS stages',
    description:
      'CMOS buffer: two inverters in series (4 MOSFETs total). ' +
      'First inverter complements the input, second restores original logic level ' +
      'with increased drive strength.',
  },
};

/**
 * Get CMOS MOSFET-level construction details for a gate type.
 * Returns transistor counts, pull-up/pull-down network descriptions,
 * and a human-readable explanation of the CMOS implementation.
 */
export function getGateInternals(type: GateType): GateInternals {
  const internals = GATE_INTERNALS[type];
  if (!internals) {
    throw new Error(`Unknown gate type: ${type}`);
  }
  return { ...internals };
}

// ---------------------------------------------------------------------------
// LogicSimulator -- gate-level simulation engine
// ---------------------------------------------------------------------------

/** Maximum iterations for evaluate() before declaring oscillation */
const MAX_EVALUATE_ITERATIONS = 1000;

/**
 * Gate-level logic simulator with step-based propagation and
 * steady-state evaluation with oscillation detection.
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

  /** Set an input signal value */
  setSignal(name: string, value: boolean): void {
    this.state.signals[name] = value;
  }

  /** Get a signal value (false if undefined) */
  getSignal(name: string): boolean {
    return this.state.signals[name] ?? false;
  }

  /** Get a copy of the current simulation state */
  getState(): LogicState {
    return {
      signals: { ...this.state.signals },
      time: this.state.time,
    };
  }

  /** Reset all signals and time to initial state */
  reset(): void {
    this.state = { signals: {}, time: 0 };
  }

  /**
   * Advance simulation by one propagation delay unit.
   * Evaluates all gates using current signal values and writes outputs.
   * Increments time by the minimum propagation delay among all gates.
   *
   * @returns New LogicState after evaluation
   */
  step(): LogicState {
    // Clone current signals so inputs are preserved
    const newSignals: Record<string, boolean> = { ...this.state.signals };

    // Evaluate all gates against current input values
    for (const gate of this.gates) {
      const inputValues = gate.inputs.map(
        (name) => this.state.signals[name] ?? false,
      );
      newSignals[gate.output] = evaluateGate(gate.type, inputValues);
    }

    // Find minimum propagation delay (default 10ns if no gates)
    const minDelay =
      this.gates.length > 0
        ? Math.min(...this.gates.map((g) => g.propagationDelay))
        : 10;

    this.state = {
      signals: newSignals,
      time: this.state.time + minDelay,
    };

    return this.getState();
  }

  /**
   * Evaluate the circuit until steady state is reached.
   * Detects oscillation if signals cycle without settling.
   *
   * @returns Settled LogicState with all gate outputs correct
   * @throws Error if oscillation is detected
   */
  evaluate(): LogicState {
    if (this.gates.length === 0) {
      return this.getState();
    }

    // Track signal history for oscillation detection
    const history: string[] = [];

    for (let i = 0; i < MAX_EVALUATE_ITERATIONS; i++) {
      const prevSignals = { ...this.state.signals };
      const prevSignalKey = JSON.stringify(
        Object.entries(prevSignals).sort(([a], [b]) => a.localeCompare(b)),
      );
      history.push(prevSignalKey);

      this.step();

      const currentSignalKey = JSON.stringify(
        Object.entries(this.state.signals).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      );

      // Steady state: no signal changes
      if (currentSignalKey === prevSignalKey) {
        return this.getState();
      }

      // Oscillation detection: check if current state has been seen before
      // (look back at least 2 steps to catch 2-cycle oscillations)
      if (i >= 2) {
        for (let j = 0; j < history.length - 1; j++) {
          if (history[j] === currentSignalKey) {
            throw new Error(
              'Oscillation detected: circuit does not reach steady state',
            );
          }
        }
      }
    }

    throw new Error(
      'Oscillation detected: circuit does not reach steady state',
    );
  }
}
