/**
 * AGC Block II timing model.
 *
 * The AGC runs at 2.048 MHz, producing a Memory Cycle Time (MCT) of 11.72
 * microseconds. Different instruction classes consume different numbers of
 * MCTs (TC=1, CA=2, DV=6). The timing model provides cycle-accurate
 * simulation by tracking total MCTs elapsed and converting to real-time.
 *
 * All functions are pure (no side effects).
 */

// ─── Constants ──────────────────────────────────────────────────────────────

/** AGC master oscillator frequency in MHz. */
export const CLOCK_MHZ = 2.048;

/** Memory Cycle Time in microseconds (one machine cycle). */
export const MCT_PERIOD_US = 11.72;

// ─── Instruction Timing ─────────────────────────────────────────────────────

/**
 * MCT counts per instruction mnemonic.
 * Sources: AGC Block II documentation, simulation-architecture.yaml.
 */
export const INSTRUCTION_MCTS: Readonly<Record<string, number>> = {
  // Basic instructions
  TC: 1,
  CCS: 2,
  TCF: 1,
  DAS: 3,
  LXCH: 2,
  INCR: 2,
  ADS: 2,
  CA: 2,
  CS: 2,
  INDEX: 2,
  DXCH: 3,
  TS: 2,
  XCH: 2,
  AD: 2,
  MASK: 2,

  // Special instructions
  EXTEND: 1,
  INHINT: 1,
  RELINT: 1,
  RESUME: 2,
  NOOP: 1,

  // Extracode I/O instructions
  READ: 2,
  WRITE: 2,
  RAND: 2,
  WAND: 2,
  ROR: 2,
  WOR: 2,
  RXOR: 2,

  // Extracode arithmetic/control
  DV: 6,
  BZF: 1,
  MSU: 2,
  QXCH: 2,
  AUG: 2,
  DIM: 2,
  DCA: 3,
  DCS: 3,
  SU: 2,
  BZMF: 1,
  MP: 3,
};

/**
 * Get the MCT count for an instruction mnemonic.
 * Returns 2 for unknown instructions (most instructions are 2 MCTs).
 */
export function getInstructionMCTs(mnemonic: string): number {
  return INSTRUCTION_MCTS[mnemonic] ?? 2;
}

// ─── Timing State ───────────────────────────────────────────────────────────

/** Immutable timing state. */
export interface TimingState {
  /** Total MCTs elapsed since simulation start. */
  readonly totalMCTs: number;
}

/** Create initial timing state with zero elapsed MCTs. */
export function createTimingState(): TimingState {
  return { totalMCTs: 0 };
}

/**
 * Advance the timing state by the given number of MCTs consumed.
 */
export function advanceTiming(state: TimingState, mctsConsumed: number): TimingState {
  return { totalMCTs: state.totalMCTs + mctsConsumed };
}

// ─── Time Conversion ────────────────────────────────────────────────────────

/** Convert MCTs to microseconds. */
export function mctsToMicroseconds(mcts: number): number {
  return mcts * MCT_PERIOD_US;
}

/** Convert MCTs to milliseconds. */
export function mctsToMilliseconds(mcts: number): number {
  return mcts * MCT_PERIOD_US / 1000;
}

/** Convert MCTs to seconds. */
export function mctsToSeconds(mcts: number): number {
  return mcts * MCT_PERIOD_US / 1_000_000;
}

/** Convert seconds to MCTs. */
export function secondsToMCTs(seconds: number): number {
  return seconds * 1_000_000 / MCT_PERIOD_US;
}
