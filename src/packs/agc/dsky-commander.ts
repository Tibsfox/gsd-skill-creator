/**
 * AGC Block II DSKY VERB/NOUN command processor.
 *
 * State machine that sequences raw DSKY key presses into structured
 * VERB/NOUN commands. Handles:
 * - VERB digit accumulation (2 digits)
 * - NOUN digit accumulation (2 digits)
 * - Data entry for R1/R2/R3 (sign + 5 digits) via V21/V22/V23
 * - CLR (clear current input), RSET (clear error), KEY REL (release keyboard)
 * - ENTR (submit command)
 * - Display feedback during input (verb/noun flashing, digit echo)
 *
 * All functions are pure (no mutation of input state).
 */

import { DskyKeyId } from './dsky-keyboard.js';
import type { DisplayRegister2, DisplayRegister5, DskySign } from './dsky-display.js';

// ─── Input Modes ─────────────────────────────────────────────────────────────

/** Command processor state machine modes. */
export enum DskyInputMode {
  IDLE = 0,
  VERB_DIGIT_1 = 1,
  VERB_DIGIT_2 = 2,
  NOUN_DIGIT_1 = 3,
  NOUN_DIGIT_2 = 4,
  DATA_SIGN = 5,
  DATA_DIGIT_1 = 6,
  DATA_DIGIT_2 = 7,
  DATA_DIGIT_3 = 8,
  DATA_DIGIT_4 = 9,
  DATA_DIGIT_5 = 10,
}

// ─── Command Types ───────────────────────────────────────────────────────────

/** A completed VERB/NOUN command. */
export interface DskyCommand {
  readonly verb: number;  // 0-99
  readonly noun: number;  // 0-99
}

// ─── Commander State ─────────────────────────────────────────────────────────

/** Immutable DSKY command processor state. */
export interface DskyCommanderState {
  readonly mode: DskyInputMode;
  readonly verbDigits: readonly [number | null, number | null];
  readonly nounDigits: readonly [number | null, number | null];
  readonly dataRegister: 1 | 2 | 3;
  readonly dataSign: DskySign;
  readonly dataDigits: readonly (number | null)[];
  readonly error: boolean;
  readonly verbFlashing: boolean;
  readonly nounFlashing: boolean;
}

/** Create initial commander state: IDLE, all null, no error. */
export function createDskyCommanderState(): DskyCommanderState {
  return {
    mode: DskyInputMode.IDLE,
    verbDigits: [null, null],
    nounDigits: [null, null],
    dataRegister: 1,
    dataSign: null,
    dataDigits: [],
    error: false,
    verbFlashing: false,
    nounFlashing: false,
  };
}

// ─── Display Updates ─────────────────────────────────────────────────────────

/** Partial display state representing what changed during this key press. */
export interface DisplayUpdates {
  readonly verb?: Partial<DisplayRegister2>;
  readonly noun?: Partial<DisplayRegister2>;
  readonly r1?: Partial<DisplayRegister5>;
  readonly r2?: Partial<DisplayRegister5>;
  readonly r3?: Partial<DisplayRegister5>;
}

// ─── Key Press Result ────────────────────────────────────────────────────────

/** Result of processing a key press through the command processor. */
export interface KeyPressProcessResult {
  readonly commanderState: DskyCommanderState;
  readonly displayUpdates: DisplayUpdates;
  readonly command: DskyCommand | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map a DskyKeyId to a digit (0-9), or null if not a digit key. */
function keyIdToDigit(keyId: DskyKeyId): number | null {
  switch (keyId) {
    case DskyKeyId.ZERO: return 0;
    case DskyKeyId.ONE: return 1;
    case DskyKeyId.TWO: return 2;
    case DskyKeyId.THREE: return 3;
    case DskyKeyId.FOUR: return 4;
    case DskyKeyId.FIVE: return 5;
    case DskyKeyId.SIX: return 6;
    case DskyKeyId.SEVEN: return 7;
    case DskyKeyId.EIGHT: return 8;
    case DskyKeyId.NINE: return 9;
    default: return null;
  }
}

/** Check if a verb number is a data-entry verb (V21, V22, V23). */
export function isDataEntryVerb(verb: number): boolean {
  return verb === 21 || verb === 22 || verb === 23;
}

/** Map data-entry verb to target register. V21->R1, V22->R2, V23->R3. */
export function getDataRegister(verb: number): 1 | 2 | 3 {
  if (verb === 22) return 2;
  if (verb === 23) return 3;
  return 1;
}

/** Construct a 2-digit number from digit pair, defaulting null to 0. */
function digitsToNumber(d1: number | null, d2: number | null): number {
  return ((d1 ?? 0) * 10) + (d2 ?? 0);
}

/** Check if verb digits are complete (both non-null). */
function verbComplete(digits: readonly [number | null, number | null]): boolean {
  return digits[0] !== null && digits[1] !== null;
}

/** Check if noun digits are complete (both non-null). */
function nounComplete(digits: readonly [number | null, number | null]): boolean {
  return digits[0] !== null && digits[1] !== null;
}

// ─── Result Builders ─────────────────────────────────────────────────────────

function result(
  state: DskyCommanderState,
  display: DisplayUpdates = {},
  command: DskyCommand | null = null,
): KeyPressProcessResult {
  return { commanderState: state, displayUpdates: display, command };
}

// ─── State Machine ───────────────────────────────────────────────────────────

/**
 * Process a DSKY key press through the VERB/NOUN command state machine.
 *
 * Returns new commander state, display updates, and optionally a completed command.
 */
export function processKeyPress(
  state: DskyCommanderState,
  keyId: DskyKeyId,
): KeyPressProcessResult {
  // ── Global overrides (any mode) ──

  // RSET: clear error, clear input, return to IDLE
  if (keyId === DskyKeyId.RSET) {
    return result({
      ...state,
      mode: DskyInputMode.IDLE,
      error: false,
      verbFlashing: false,
      nounFlashing: false,
    });
  }

  // KEY_REL: release keyboard, return to IDLE
  if (keyId === DskyKeyId.KEY_REL) {
    return result({
      ...state,
      mode: DskyInputMode.IDLE,
      verbFlashing: false,
      nounFlashing: false,
    });
  }

  // PRO key: handled at keyboard level, not here. No-op for commander.
  if (keyId === DskyKeyId.PRO) {
    return result(state);
  }

  // ── Mode-specific handling ──

  switch (state.mode) {
    case DskyInputMode.IDLE:
      return handleIdle(state, keyId);

    case DskyInputMode.VERB_DIGIT_1:
    case DskyInputMode.VERB_DIGIT_2:
      return handleVerbDigit(state, keyId);

    case DskyInputMode.NOUN_DIGIT_1:
    case DskyInputMode.NOUN_DIGIT_2:
      return handleNounDigit(state, keyId);

    case DskyInputMode.DATA_SIGN:
      return handleDataSign(state, keyId);

    case DskyInputMode.DATA_DIGIT_1:
    case DskyInputMode.DATA_DIGIT_2:
    case DskyInputMode.DATA_DIGIT_3:
    case DskyInputMode.DATA_DIGIT_4:
    case DskyInputMode.DATA_DIGIT_5:
      return handleDataDigit(state, keyId);

    default:
      return result(state);
  }
}

// ─── IDLE Mode ───────────────────────────────────────────────────────────────

function handleIdle(state: DskyCommanderState, keyId: DskyKeyId): KeyPressProcessResult {
  if (keyId === DskyKeyId.VERB) {
    return result({
      ...state,
      mode: DskyInputMode.VERB_DIGIT_1,
      verbDigits: [null, null],
      verbFlashing: true,
    });
  }

  if (keyId === DskyKeyId.NOUN) {
    return result({
      ...state,
      mode: DskyInputMode.NOUN_DIGIT_1,
      nounDigits: [null, null],
      nounFlashing: true,
    });
  }

  if (keyId === DskyKeyId.ENTR) {
    return handleEntr(state);
  }

  if (keyId === DskyKeyId.CLR) {
    return result(state); // no-op in IDLE
  }

  // Digit in IDLE = error (OPR ERR)
  const digit = keyIdToDigit(keyId);
  if (digit !== null) {
    return result({ ...state, error: true });
  }

  // PLUS/MINUS in IDLE: error
  if (keyId === DskyKeyId.PLUS || keyId === DskyKeyId.MINUS) {
    return result({ ...state, error: true });
  }

  return result(state);
}

// ─── ENTR Handling ───────────────────────────────────────────────────────────

function handleEntr(state: DskyCommanderState): KeyPressProcessResult {
  // Need complete verb to submit
  if (!verbComplete(state.verbDigits)) {
    return result({ ...state, error: true });
  }

  const verb = digitsToNumber(state.verbDigits[0], state.verbDigits[1]);
  const noun = digitsToNumber(state.nounDigits[0], state.nounDigits[1]);

  // Data entry verbs (V21/V22/V23) transition to data entry mode
  if (isDataEntryVerb(verb)) {
    const register = getDataRegister(verb);
    return result(
      {
        ...state,
        mode: DskyInputMode.DATA_SIGN,
        dataRegister: register,
        dataSign: null,
        dataDigits: [],
      },
      {},
      { verb, noun }, // still emit the command
    );
  }

  // Standard command: emit and return to IDLE
  return result(
    { ...state, mode: DskyInputMode.IDLE },
    {},
    { verb, noun },
  );
}

// ─── VERB Digit Handling ─────────────────────────────────────────────────────

function handleVerbDigit(state: DskyCommanderState, keyId: DskyKeyId): KeyPressProcessResult {
  // VERB key restarts verb entry
  if (keyId === DskyKeyId.VERB) {
    return result({
      ...state,
      mode: DskyInputMode.VERB_DIGIT_1,
      verbDigits: [null, null],
      verbFlashing: true,
    });
  }

  // NOUN key switches to noun entry (accept partial verb)
  if (keyId === DskyKeyId.NOUN) {
    return result({
      ...state,
      mode: DskyInputMode.NOUN_DIGIT_1,
      nounDigits: [null, null],
      verbFlashing: false,
      nounFlashing: true,
    });
  }

  // CLR clears verb digits, restarts
  if (keyId === DskyKeyId.CLR) {
    return result({
      ...state,
      mode: DskyInputMode.VERB_DIGIT_1,
      verbDigits: [null, null],
    });
  }

  // ENTR during verb entry: error (incomplete)
  if (keyId === DskyKeyId.ENTR) {
    return result({ ...state, error: true });
  }

  const digit = keyIdToDigit(keyId);
  if (digit === null) {
    return result(state); // ignore non-digit keys
  }

  if (state.mode === DskyInputMode.VERB_DIGIT_1) {
    const newState: DskyCommanderState = {
      ...state,
      mode: DskyInputMode.VERB_DIGIT_2,
      verbDigits: [digit, state.verbDigits[1]],
    };
    return result(newState, { verb: { d1: digit } });
  }

  // VERB_DIGIT_2
  const newState: DskyCommanderState = {
    ...state,
    mode: DskyInputMode.IDLE,
    verbDigits: [state.verbDigits[0], digit],
    verbFlashing: false,
  };
  return result(newState, { verb: { d2: digit } });
}

// ─── NOUN Digit Handling ─────────────────────────────────────────────────────

function handleNounDigit(state: DskyCommanderState, keyId: DskyKeyId): KeyPressProcessResult {
  // NOUN key restarts noun entry
  if (keyId === DskyKeyId.NOUN) {
    return result({
      ...state,
      mode: DskyInputMode.NOUN_DIGIT_1,
      nounDigits: [null, null],
      nounFlashing: true,
    });
  }

  // VERB key switches to verb entry (accept partial noun)
  if (keyId === DskyKeyId.VERB) {
    return result({
      ...state,
      mode: DskyInputMode.VERB_DIGIT_1,
      verbDigits: [null, null],
      nounFlashing: false,
      verbFlashing: true,
    });
  }

  // CLR clears noun digits, restarts
  if (keyId === DskyKeyId.CLR) {
    return result({
      ...state,
      mode: DskyInputMode.NOUN_DIGIT_1,
      nounDigits: [null, null],
    });
  }

  // ENTR during noun entry: error (incomplete)
  if (keyId === DskyKeyId.ENTR) {
    return result({ ...state, error: true });
  }

  const digit = keyIdToDigit(keyId);
  if (digit === null) {
    return result(state); // ignore non-digit keys
  }

  if (state.mode === DskyInputMode.NOUN_DIGIT_1) {
    const newState: DskyCommanderState = {
      ...state,
      mode: DskyInputMode.NOUN_DIGIT_2,
      nounDigits: [digit, state.nounDigits[1]],
    };
    return result(newState, { noun: { d1: digit } });
  }

  // NOUN_DIGIT_2
  const newState: DskyCommanderState = {
    ...state,
    mode: DskyInputMode.IDLE,
    nounDigits: [state.nounDigits[0], digit],
    nounFlashing: false,
  };
  return result(newState, { noun: { d2: digit } });
}

// ─── Data Sign Handling ──────────────────────────────────────────────────────

function handleDataSign(state: DskyCommanderState, keyId: DskyKeyId): KeyPressProcessResult {
  if (keyId === DskyKeyId.PLUS) {
    return result({
      ...state,
      mode: DskyInputMode.DATA_DIGIT_1,
      dataSign: '+',
      dataDigits: [],
    });
  }

  if (keyId === DskyKeyId.MINUS) {
    return result({
      ...state,
      mode: DskyInputMode.DATA_DIGIT_1,
      dataSign: '-',
      dataDigits: [],
    });
  }

  // CLR clears data entry and restarts at DATA_SIGN
  if (keyId === DskyKeyId.CLR) {
    return result({
      ...state,
      mode: DskyInputMode.DATA_SIGN,
      dataSign: null,
      dataDigits: [],
    });
  }

  // VERB/NOUN switch away from data entry
  if (keyId === DskyKeyId.VERB) {
    return result({
      ...state,
      mode: DskyInputMode.VERB_DIGIT_1,
      verbDigits: [null, null],
      verbFlashing: true,
    });
  }

  if (keyId === DskyKeyId.NOUN) {
    return result({
      ...state,
      mode: DskyInputMode.NOUN_DIGIT_1,
      nounDigits: [null, null],
      nounFlashing: true,
    });
  }

  // Digits without sign: error
  const digit = keyIdToDigit(keyId);
  if (digit !== null) {
    return result({ ...state, error: true });
  }

  return result(state);
}

// ─── Data Digit Handling ─────────────────────────────────────────────────────

/** Map data mode to expected digit index (0-4). */
function dataDigitIndex(mode: DskyInputMode): number {
  return mode - DskyInputMode.DATA_DIGIT_1;
}

/** Map data mode to next mode (or IDLE if complete). */
function nextDataMode(mode: DskyInputMode): DskyInputMode {
  if (mode === DskyInputMode.DATA_DIGIT_5) return DskyInputMode.IDLE;
  return mode + 1;
}

function handleDataDigit(state: DskyCommanderState, keyId: DskyKeyId): KeyPressProcessResult {
  // CLR clears data and returns to DATA_SIGN
  if (keyId === DskyKeyId.CLR) {
    return result({
      ...state,
      mode: DskyInputMode.DATA_SIGN,
      dataSign: null,
      dataDigits: [],
    });
  }

  // VERB/NOUN switch away from data entry
  if (keyId === DskyKeyId.VERB) {
    return result({
      ...state,
      mode: DskyInputMode.VERB_DIGIT_1,
      verbDigits: [null, null],
      verbFlashing: true,
    });
  }

  if (keyId === DskyKeyId.NOUN) {
    return result({
      ...state,
      mode: DskyInputMode.NOUN_DIGIT_1,
      nounDigits: [null, null],
      nounFlashing: true,
    });
  }

  const digit = keyIdToDigit(keyId);
  if (digit === null) {
    return result(state); // ignore non-digit keys
  }

  const newDigits = [...state.dataDigits, digit];
  const nextMode = nextDataMode(state.mode);

  const newState: DskyCommanderState = {
    ...state,
    mode: nextMode,
    dataDigits: newDigits,
  };

  // Build display update for the target register
  const display = buildDataDisplayUpdate(state.dataRegister, newDigits, state.dataSign);

  return result(newState, display);
}

/** Build display updates for data entry digits targeting a specific register. */
function buildDataDisplayUpdate(
  register: 1 | 2 | 3,
  digits: readonly (number | null)[],
  sign: DskySign,
): DisplayUpdates {
  const partial: Partial<DisplayRegister5> = { sign };

  if (digits.length >= 1) (partial as Record<string, unknown>).d1 = digits[0];
  if (digits.length >= 2) (partial as Record<string, unknown>).d2 = digits[1];
  if (digits.length >= 3) (partial as Record<string, unknown>).d3 = digits[2];
  if (digits.length >= 4) (partial as Record<string, unknown>).d4 = digits[3];
  if (digits.length >= 5) (partial as Record<string, unknown>).d5 = digits[4];

  switch (register) {
    case 1: return { r1: partial };
    case 2: return { r2: partial };
    case 3: return { r3: partial };
  }
}
