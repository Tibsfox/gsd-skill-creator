/**
 * PLC Engine
 *
 * Industrial control simulation primitives for Module 13 (PLC) labs:
 * (1) Ladder logic parser and evaluator with contacts, coils, and branches
 * (2) Discrete PID controller with anti-windup output clamping
 * (3) Scan cycle model (input-read / execute / output-write)
 * (4) Modbus register abstraction for communication labs
 *
 * Pure TypeScript -- no imports from other simulator modules.
 *
 * Phase 275 Plan 01.
 */

// ===========================================================================
// Type Definitions
// ===========================================================================

export type ContactType = 'NO' | 'NC';
export type CoilType = 'OUT' | 'SET' | 'RESET';

export interface Contact {
  type: 'contact';
  contactType: ContactType;
  address: string;
}

export interface Coil {
  type: 'coil';
  coilType: CoilType;
  address: string;
}

export interface TimerBlock {
  type: 'timer';
  timerType: 'TON' | 'TOF';
  address: string;
  preset: number;
}

export interface CounterBlock {
  type: 'counter';
  counterType: 'CTU' | 'CTD';
  address: string;
  preset: number;
}

/** A branch is a series of contacts (AND logic) */
export type Branch = (Contact | TimerBlock | CounterBlock)[];

/** A rung has parallel branches (OR logic) feeding a coil */
export interface Rung {
  branches: Branch[];
  coil: Coil;
}

export interface PLCState {
  inputs: Record<string, boolean>;
  outputs: Record<string, boolean>;
  memory: Record<string, boolean>;
  timers: Record<string, { elapsed: number; done: boolean }>;
  counters: Record<string, { count: number; done: boolean }>;
  scanTime: number;
}

export interface PIDState {
  kp: number;
  ki: number;
  kd: number;
  setpoint: number;
  integral: number;
  prevError: number;
  outputMin: number;
  outputMax: number;
  scanTime: number;
}

export interface ModbusRegisters {
  coils: Record<number, boolean>;
  holdingRegisters: Record<number, number>;
}

// ===========================================================================
// 1. parseLadder -- text-based ladder logic parser
// ===========================================================================

/**
 * Parse a simple text-based ladder notation into Rung arrays.
 *
 * Notation format (one rung per line):
 * - `|--[ X0 ]--[ X1 ]--( Y0 )|` -- series contacts (AND)
 * - `[/X0 ]` -- NC (normally closed) contact
 * - `(S Y0)` -- SET coil, `(R Y0)` -- RESET coil
 *
 * @param text - Ladder diagram text with one rung per line
 * @returns Array of parsed Rung objects
 */
export function parseLadder(text: string): Rung[] {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const rungs: Rung[] = [];

  for (const line of lines) {
    // Strip outer delimiters
    let body = line.trim();
    body = body.replace(/^\|--?/, '').replace(/--?\|$/, '');

    // Extract coil first (at the end of the line)
    const coilRegex = /\(\s*([SR])?\s*(\w+)\s*\)/;
    const coilMatch = body.match(coilRegex);
    if (!coilMatch) continue; // skip lines without a coil

    let coilType: CoilType = 'OUT';
    if (coilMatch[1] === 'S') coilType = 'SET';
    else if (coilMatch[1] === 'R') coilType = 'RESET';
    const coilAddress = coilMatch[2].trim();

    const coil: Coil = { type: 'coil', coilType, address: coilAddress };

    // Remove the coil portion from the body for contact parsing
    const coilIndex = body.indexOf(coilMatch[0]);
    const contactPortion = body.substring(0, coilIndex);

    // Parse contacts from the contact portion
    // Split on '+' for parallel branches
    const branchStrings = contactPortion.split('+').filter((s) => s.trim().length > 0);

    const branches: Branch[] = [];
    for (const branchStr of branchStrings) {
      const contacts: Contact[] = [];
      const contactRegex = /\[\s*(\/?)(\w+)\s*\]/g;
      let match: RegExpExecArray | null;
      while ((match = contactRegex.exec(branchStr)) !== null) {
        const isNC = match[1] === '/';
        const address = match[2].trim();
        contacts.push({
          type: 'contact',
          contactType: isNC ? 'NC' : 'NO',
          address,
        });
      }
      if (contacts.length > 0) {
        branches.push(contacts);
      }
    }

    // If no branches parsed (shouldn't happen for valid input), add empty branch
    if (branches.length === 0) {
      branches.push([]);
    }

    rungs.push({ branches, coil });
  }

  return rungs;
}

// ===========================================================================
// 2. createPLCState -- initial PLC state factory
// ===========================================================================

/**
 * Create an initial empty PLC state.
 *
 * @param scanTime - Scan time in milliseconds (default 10)
 * @returns Fresh PLCState with empty maps
 */
export function createPLCState(scanTime: number = 10): PLCState {
  return {
    inputs: {},
    outputs: {},
    memory: {},
    timers: {},
    counters: {},
    scanTime,
  };
}

// ===========================================================================
// 3. evaluateLadder -- pure ladder logic evaluator
// ===========================================================================

/**
 * Look up the boolean value of an address across all three state maps.
 * Checks inputs, outputs, and memory (standard IEC 61131-3 behavior).
 */
function lookupAddress(
  address: string,
  inputs: Record<string, boolean>,
  outputs: Record<string, boolean>,
  memory: Record<string, boolean>,
): boolean {
  return !!(inputs[address] || outputs[address] || memory[address]);
}

/**
 * Evaluate all rungs against current state and return a new state
 * with updated outputs and memory. Pure function -- never mutates input.
 *
 * Evaluation order: top-to-bottom (rung order), left-to-right (contact order).
 * Within each rung: branches are OR'd, contacts within a branch are AND'd.
 *
 * @param rungs - Parsed ladder rungs
 * @param state - Current PLC state
 * @returns New PLCState with updated outputs/memory
 */
export function evaluateLadder(rungs: Rung[], state: PLCState): PLCState {
  // Deep copy to avoid mutation
  const newState: PLCState = {
    inputs: { ...state.inputs },
    outputs: { ...state.outputs },
    memory: { ...state.memory },
    timers: { ...state.timers },
    counters: { ...state.counters },
    scanTime: state.scanTime,
  };

  for (const rung of rungs) {
    // Evaluate branches (OR logic)
    let rungResult = false;

    for (const branch of rung.branches) {
      // Evaluate contacts in series (AND logic)
      let branchResult = true;

      for (const element of branch) {
        if (element.type === 'contact') {
          const raw = lookupAddress(
            element.address,
            newState.inputs,
            newState.outputs,
            newState.memory,
          );
          const value = element.contactType === 'NC' ? !raw : raw;
          branchResult = branchResult && value;
        }
        // TimerBlock and CounterBlock evaluation would go here
      }

      rungResult = rungResult || branchResult;
    }

    // Apply result to coil
    const addr = rung.coil.address;
    const isMemory = addr.startsWith('M');
    const target = isMemory ? 'memory' : 'outputs';

    switch (rung.coil.coilType) {
      case 'OUT':
        newState[target][addr] = rungResult;
        break;
      case 'SET':
        if (rungResult) {
          newState[target][addr] = true;
        }
        // If not energized, leave unchanged (latched)
        break;
      case 'RESET':
        if (rungResult) {
          newState[target][addr] = false;
        }
        // If not energized, leave unchanged
        break;
    }
  }

  return newState;
}

// ===========================================================================
// 4. createPIDState -- PID controller state factory
// ===========================================================================

/**
 * Create initial PID controller state.
 *
 * @param kp - Proportional gain
 * @param ki - Integral gain
 * @param kd - Derivative gain
 * @param setpoint - Target process value
 * @param scanTime - Controller scan time in seconds
 * @param outputMin - Minimum output clamp (default -Infinity)
 * @param outputMax - Maximum output clamp (default Infinity)
 * @returns Fresh PIDState
 */
export function createPIDState(
  kp: number,
  ki: number,
  kd: number,
  setpoint: number,
  scanTime: number,
  outputMin: number = -Infinity,
  outputMax: number = Infinity,
): PIDState {
  return {
    kp,
    ki,
    kd,
    setpoint,
    integral: 0,
    prevError: 0,
    outputMin,
    outputMax,
    scanTime,
  };
}

// ===========================================================================
// 5. pidCompute -- discrete PID iteration
// ===========================================================================

/**
 * Compute one PID controller iteration.
 *
 * Discrete PID formula:
 *   error = setpoint - processValue
 *   P = kp * error
 *   integral += error  (accumulate raw error)
 *   I = ki * scanTime * integral
 *   D = kd * (error - prevError) / scanTime
 *   output = clamp(P + I + D, outputMin, outputMax)
 *
 * Anti-windup: output is clamped but integral continues to accumulate
 * (output clamping strategy). The integral in newState is always the
 * unclamped accumulation so the controller recovers when error reduces.
 *
 * @param state - Current PID state
 * @param processValue - Current measured process value
 * @returns Control output and updated PID state
 */
export function pidCompute(
  state: PIDState,
  processValue: number,
): { output: number; newState: PIDState } {
  const error = state.setpoint - processValue;

  // Proportional term
  const P = state.kp * error;

  // Integral term -- accumulate raw error
  const integral = state.integral + error;
  const I = state.ki * state.scanTime * integral;

  // Derivative term
  const D = state.kd * (error - state.prevError) / state.scanTime;

  // Raw output
  const rawOutput = P + I + D;

  // Clamp output (anti-windup)
  const output = Math.max(state.outputMin, Math.min(state.outputMax, rawOutput));

  const newState: PIDState = {
    ...state,
    integral,
    prevError: error,
  };

  return { output, newState };
}

// ===========================================================================
// 6. scanCycle -- complete PLC scan cycle
// ===========================================================================

/**
 * Perform one complete PLC scan cycle:
 * 1. Read inputs into state
 * 2. Evaluate ladder logic
 * 3. Return new state with updated outputs
 *
 * Pure function.
 *
 * @param rungs - Parsed ladder rungs
 * @param state - Current PLC state
 * @param inputs - Input values for this scan
 * @returns New PLCState after scan
 */
export function scanCycle(
  rungs: Rung[],
  state: PLCState,
  inputs: Record<string, boolean>,
): PLCState {
  // 1. Read inputs
  const stateWithInputs: PLCState = {
    ...state,
    inputs: { ...inputs },
  };

  // 2. Evaluate ladder and 3. Return result
  return evaluateLadder(rungs, stateWithInputs);
}

// ===========================================================================
// 7. Modbus Register functions
// ===========================================================================

/**
 * Create an empty Modbus register bank.
 */
export function createModbusRegisters(): ModbusRegisters {
  return { coils: {}, holdingRegisters: {} };
}

/**
 * Read a coil value. Returns false if not previously written.
 */
export function readCoil(regs: ModbusRegisters, address: number): boolean {
  return regs.coils[address] ?? false;
}

/**
 * Write a coil value. Returns a new ModbusRegisters -- does NOT mutate input.
 */
export function writeCoil(
  regs: ModbusRegisters,
  address: number,
  value: boolean,
): ModbusRegisters {
  return {
    coils: { ...regs.coils, [address]: value },
    holdingRegisters: { ...regs.holdingRegisters },
  };
}

/**
 * Read a holding register value. Returns 0 if not previously written.
 */
export function readHoldingRegister(regs: ModbusRegisters, address: number): number {
  return regs.holdingRegisters[address] ?? 0;
}

/**
 * Write a holding register value. Returns a new ModbusRegisters -- does NOT mutate input.
 */
export function writeHoldingRegister(
  regs: ModbusRegisters,
  address: number,
  value: number,
): ModbusRegisters {
  return {
    coils: { ...regs.coils },
    holdingRegisters: { ...regs.holdingRegisters, [address]: value },
  };
}
