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

/** Flip-flop output state */
export interface FlipFlopState {
  Q: boolean;
  Qbar: boolean;
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
// detectClockEdge -- rising/falling/none detection
// ---------------------------------------------------------------------------

/**
 * Detect clock edge transition between two consecutive clock samples.
 *
 * @param prevClock - Clock value at previous time step
 * @param currClock - Clock value at current time step
 * @returns 'rising' if 0->1, 'falling' if 1->0, 'none' if unchanged
 */
export function detectClockEdge(
  prevClock: boolean,
  currClock: boolean,
): 'rising' | 'falling' | 'none' {
  if (!prevClock && currClock) return 'rising';
  if (prevClock && !currClock) return 'falling';
  return 'none';
}

// ---------------------------------------------------------------------------
// evaluateFlipFlop -- pure function for clocked sequential element evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate a flip-flop given its type, current inputs, previous output state,
 * and the clock edge. All flip-flops are positive-edge-triggered: they only
 * update on a rising clock edge; otherwise they hold their previous state.
 *
 * @param type - SR, D, JK, or T
 * @param inputs - Named inputs (e.g. { S, R } for SR, { D } for D)
 * @param prevState - Previous Q and Qbar values
 * @param clockEdge - 'rising', 'falling', or 'none'
 * @returns New FlipFlopState
 */
export function evaluateFlipFlop(
  type: FlipFlopType,
  inputs: Record<string, boolean>,
  prevState: FlipFlopState,
  clockEdge: 'rising' | 'falling' | 'none',
): FlipFlopState {
  // Only update on rising edge; otherwise hold
  if (clockEdge !== 'rising') {
    return { ...prevState };
  }

  switch (type) {
    case FlipFlopType.SR: {
      const S = inputs.S ?? false;
      const R = inputs.R ?? false;
      if (S && !R) return { Q: true, Qbar: false };
      if (!S && R) return { Q: false, Qbar: true };
      if (S && R) return { Q: true, Qbar: true }; // NAND-based: both high
      return { ...prevState }; // S=0, R=0: hold
    }

    case FlipFlopType.D: {
      const D = inputs.D ?? false;
      return { Q: D, Qbar: !D };
    }

    case FlipFlopType.JK: {
      const J = inputs.J ?? false;
      const K = inputs.K ?? false;
      if (J && !K) return { Q: true, Qbar: false };
      if (!J && K) return { Q: false, Qbar: true };
      if (J && K) return { Q: !prevState.Q, Qbar: prevState.Q }; // toggle
      return { ...prevState }; // J=0, K=0: hold
    }

    case FlipFlopType.T: {
      const T = inputs.T ?? false;
      if (T) return { Q: !prevState.Q, Qbar: prevState.Q }; // toggle
      return { ...prevState }; // hold
    }

    default:
      throw new Error(`Unknown flip-flop type: ${type}`);
  }
}

// ---------------------------------------------------------------------------
// buildRippleCarryAdder -- 4-bit adder from gates
// ---------------------------------------------------------------------------

/**
 * Build a 4-bit ripple-carry adder inside the given LogicSimulator.
 * Creates 20 gates (5 per bit: 2 XOR, 2 AND, 1 OR) implementing
 * four cascaded full adders.
 *
 * Carry-in (C0) is set to false (ground).
 *
 * @returns Signal names for inputs, outputs, and carry-out
 */
export function buildRippleCarryAdder(sim: LogicSimulator): {
  inputA: string[];
  inputB: string[];
  sum: string[];
  carryOut: string;
} {
  const inputA = ['A0', 'A1', 'A2', 'A3'];
  const inputB = ['B0', 'B1', 'B2', 'B3'];
  const sum = ['S0', 'S1', 'S2', 'S3'];

  // Ground carry-in
  sim.setSignal('C0', false);

  for (let i = 0; i < 4; i++) {
    const carry = `C${i}`;
    const carryNext = `C${i + 1}`;
    const prefix = `FA${i}`;

    // Half adder 1: A[i] XOR B[i] -> P[i] (partial sum)
    sim.addGate({
      id: `${prefix}_XOR1`,
      type: GateType.XOR,
      inputs: [inputA[i], inputB[i]],
      output: `${prefix}_P`,
      propagationDelay: 10,
    });

    // Full sum: P[i] XOR C[i] -> S[i]
    sim.addGate({
      id: `${prefix}_XOR2`,
      type: GateType.XOR,
      inputs: [`${prefix}_P`, carry],
      output: sum[i],
      propagationDelay: 10,
    });

    // Generate: A[i] AND B[i] -> G[i]
    sim.addGate({
      id: `${prefix}_AND1`,
      type: GateType.AND,
      inputs: [inputA[i], inputB[i]],
      output: `${prefix}_G`,
      propagationDelay: 10,
    });

    // Propagate-carry: P[i] AND C[i] -> PC[i]
    sim.addGate({
      id: `${prefix}_AND2`,
      type: GateType.AND,
      inputs: [`${prefix}_P`, carry],
      output: `${prefix}_PC`,
      propagationDelay: 10,
    });

    // Carry out: G[i] OR PC[i] -> C[i+1]
    sim.addGate({
      id: `${prefix}_OR`,
      type: GateType.OR,
      inputs: [`${prefix}_G`, `${prefix}_PC`],
      output: carryNext,
      propagationDelay: 10,
    });
  }

  return { inputA, inputB, sum, carryOut: 'C4' };
}

/**
 * Convenience function: add two 4-bit numbers using a gate-level
 * ripple-carry adder simulation.
 *
 * @param a - First operand (0..15)
 * @param b - Second operand (0..15)
 * @returns 4-bit sum and carry-out flag
 */
export function rippleCarryAdd(
  a: number,
  b: number,
): { sum: number; carry: boolean } {
  const sim = new LogicSimulator();
  const adder = buildRippleCarryAdder(sim);

  // Set input bits from binary decomposition
  for (let i = 0; i < 4; i++) {
    sim.setSignal(adder.inputA[i], ((a >> i) & 1) === 1);
    sim.setSignal(adder.inputB[i], ((b >> i) & 1) === 1);
  }

  // Evaluate to steady state
  sim.evaluate();

  // Read back 4-bit sum
  let sumValue = 0;
  for (let i = 0; i < 4; i++) {
    if (sim.getSignal(adder.sum[i])) {
      sumValue |= 1 << i;
    }
  }

  return {
    sum: sumValue,
    carry: sim.getSignal(adder.carryOut),
  };
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

// ---------------------------------------------------------------------------
// Truth Table -- combinational circuit analysis
// ---------------------------------------------------------------------------

/** Single row in a truth table */
export interface TruthTableRow {
  inputs: boolean[];
  outputs: boolean[];
}

/** Truth table for a combinational circuit */
export interface TruthTable {
  inputs: string[];
  outputs: string[];
  rows: TruthTableRow[];
  render(): string;
}

/**
 * Generate a truth table for a combinational circuit.
 * Enumerates all 2^N input combinations in binary counting order,
 * evaluates the circuit for each, and records the output values.
 *
 * @param sim - LogicSimulator with gates already added
 * @param inputNames - input signal names (order determines binary counting)
 * @param outputNames - output signal names to read after evaluation
 * @returns TruthTable with rows in binary counting order and ASCII render()
 */
export function generateTruthTable(
  sim: LogicSimulator,
  inputNames: string[],
  outputNames: string[],
): TruthTable {
  const totalRows = 1 << inputNames.length; // 2^N
  const rows: TruthTableRow[] = [];

  for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
    sim.reset();

    // Convert row index to binary -> boolean array for inputs
    // MSB first: bit (inputNames.length - 1) down to bit 0
    const inputValues: boolean[] = [];
    for (let bit = inputNames.length - 1; bit >= 0; bit--) {
      inputValues.push(((rowIdx >> bit) & 1) === 1);
    }

    // Set input signals on the simulator
    for (let i = 0; i < inputNames.length; i++) {
      sim.setSignal(inputNames[i], inputValues[i]);
    }

    // Evaluate circuit to steady state
    sim.evaluate();

    // Read output signals
    const outputValues: boolean[] = outputNames.map((name) =>
      sim.getSignal(name),
    );

    rows.push({ inputs: inputValues, outputs: outputValues });
  }

  return {
    inputs: [...inputNames],
    outputs: [...outputNames],
    rows,
    render(): string {
      const allNames = [...inputNames, ...outputNames];

      // Calculate column widths (minimum width = name length, at least 1)
      const colWidths = allNames.map((name) => Math.max(name.length, 1));

      // Helper to pad a value centered in a column
      const padCenter = (val: string, width: number): string => {
        const padding = width - val.length;
        const left = Math.floor(padding / 2);
        const right = padding - left;
        return ' '.repeat(left) + val + ' '.repeat(right);
      };

      // Header row
      const header =
        '| ' +
        allNames.map((name, i) => padCenter(name, colWidths[i])).join(' | ') +
        ' |';

      // Separator row
      const separator =
        '|' +
        colWidths.map((w) => '-'.repeat(w + 2)).join('|') +
        '|';

      // Data rows
      const dataLines = rows.map((row) => {
        const allValues = [...row.inputs, ...row.outputs];
        return (
          '| ' +
          allValues
            .map((v, i) => padCenter(v ? '1' : '0', colWidths[i]))
            .join(' | ') +
          ' |'
        );
      });

      return [header, separator, ...dataLines].join('\n');
    },
  };
}

// ---------------------------------------------------------------------------
// Timing Diagram -- ASCII waveform visualization
// ---------------------------------------------------------------------------

/** Timing diagram for signal waveform visualization */
export interface TimingDiagram {
  signals: string[];
  waveforms: Record<string, boolean[]>;
  timeSteps: number;
  render(): string;
}

/** Options for timing diagram generation */
export interface TimingDiagramOptions {
  stepsPerUnit?: number; // default 1
  maxTime?: number; // default 100
}

/**
 * Generate a timing diagram showing signal values over time.
 * Models propagation delay: at each time step, inputs are set first,
 * then the current signal values (before gate evaluation) are recorded,
 * then sim.step() advances gate outputs for the next time step.
 *
 * This produces a 1-step delay between input changes and output responses,
 * accurately modeling real propagation delay behavior.
 *
 * @param sim - LogicSimulator with gates already added
 * @param inputSequence - array of input signal values for each time step
 * @param signalNames - names of all signals to record (inputs + outputs)
 * @param options - optional timing parameters
 * @returns TimingDiagram with waveforms and ASCII render()
 */
export function generateTimingDiagram(
  sim: LogicSimulator,
  inputSequence: Record<string, boolean>[],
  signalNames: string[],
  options?: TimingDiagramOptions,
): TimingDiagram {
  const _maxTime = options?.maxTime ?? 100;
  const _stepsPerUnit = options?.stepsPerUnit ?? 1;

  // Initialize waveforms
  const waveforms: Record<string, boolean[]> = {};
  for (const name of signalNames) {
    waveforms[name] = [];
  }

  // Reset simulator to clean state
  sim.reset();

  // Process each time step
  for (let t = 0; t < inputSequence.length; t++) {
    const inputs = inputSequence[t];

    // Set input signals for this time step
    for (const [name, value] of Object.entries(inputs)) {
      sim.setSignal(name, value);
    }

    // Record current signal values BEFORE stepping
    // (outputs still reflect previous evaluation, showing propagation delay)
    for (const name of signalNames) {
      waveforms[name].push(sim.getSignal(name));
    }

    // Step the simulator -- gate outputs now update for next time step
    sim.step();
  }

  const timeSteps = inputSequence.length;

  return {
    signals: [...signalNames],
    waveforms,
    timeSteps,
    render(): string {
      if (timeSteps === 0) {
        return '';
      }

      // Find the longest signal name for left-padding
      const maxNameLen = Math.max(...signalNames.map((n) => n.length));

      const lines: string[] = [];

      for (const name of signalNames) {
        const wave = waveforms[name];
        const waveStr = wave.map((v) => (v ? '^' : '_')).join('');
        const paddedName = name.padStart(maxNameLen);
        lines.push(`${paddedName}: ${waveStr}`);
      }

      return lines.join('\n');
    },
  };
}
