/**
 * AGC Block II DSKY display model.
 *
 * Logical model of the DSKY electroluminescent display. Decodes AGC I/O
 * channel writes into display register state:
 * - Channel 10 (octal): relay-encoded digit data for PROG/VERB/NOUN/R1/R2/R3
 * - Channel 11 (octal): 11 annunciator status lights
 * - Channel 13 (octal): COMP ACTY indicator and display test/reset
 *
 * All functions are pure (no mutation of input state).
 */

import type { Word15 } from './types.js';

// ─── Digit Types ─────────────────────────────────────────────────────────────

/** A single DSKY digit: 0-9 or null (blank/off). */
export type DskyDigit = number | null;

/** A sign indicator: +, -, or null (no sign shown). */
export type DskySign = '+' | '-' | null;

// ─── Display Register Types ─────────────────────────────────────────────────

/** 2-digit display register (PROG, VERB, NOUN). */
export interface DisplayRegister2 {
  readonly d1: DskyDigit;
  readonly d2: DskyDigit;
}

/** 5-digit signed display register (R1, R2, R3). */
export interface DisplayRegister5 {
  readonly sign: DskySign;
  readonly d1: DskyDigit;
  readonly d2: DskyDigit;
  readonly d3: DskyDigit;
  readonly d4: DskyDigit;
  readonly d5: DskyDigit;
}

// ─── Annunciators ────────────────────────────────────────────────────────────

/** All 11 DSKY status annunciator lights. */
export enum AnnunciatorId {
  UPLINK_ACTY = 0,
  TEMP = 1,
  GIMBAL_LOCK = 2,
  PROG = 3,
  RESTART = 4,
  TRACKER = 5,
  ALT = 6,
  VEL = 7,
  NO_ATT = 8,
  STBY = 9,
  OPR_ERR = 10,
}

/** Bit position in channel 11 for each annunciator. */
export const ANNUNCIATOR_BITS: Readonly<Record<AnnunciatorId, number>> = {
  [AnnunciatorId.UPLINK_ACTY]: 1,
  [AnnunciatorId.TEMP]: 2,
  [AnnunciatorId.GIMBAL_LOCK]: 3,
  [AnnunciatorId.PROG]: 4,
  [AnnunciatorId.RESTART]: 5,
  [AnnunciatorId.TRACKER]: 6,
  [AnnunciatorId.ALT]: 7,
  [AnnunciatorId.VEL]: 8,
  [AnnunciatorId.NO_ATT]: 9,
  [AnnunciatorId.STBY]: 10,
  [AnnunciatorId.OPR_ERR]: 11,
};

// ─── Display State ───────────────────────────────────────────────────────────

/** Immutable DSKY display state. */
export interface DskyDisplayState {
  readonly prog: DisplayRegister2;
  readonly verb: DisplayRegister2;
  readonly noun: DisplayRegister2;
  readonly r1: DisplayRegister5;
  readonly r2: DisplayRegister5;
  readonly r3: DisplayRegister5;
  readonly compActy: boolean;
  readonly annunciators: Readonly<Record<AnnunciatorId, boolean>>;
}

/** Create initial DSKY display state: all digits blank, all indicators off. */
export function createDskyDisplayState(): DskyDisplayState {
  const blank2: DisplayRegister2 = { d1: null, d2: null };
  const blank5: DisplayRegister5 = { sign: null, d1: null, d2: null, d3: null, d4: null, d5: null };
  return {
    prog: blank2,
    verb: { ...blank2 },
    noun: { ...blank2 },
    r1: blank5,
    r2: { ...blank5 },
    r3: { ...blank5 },
    compActy: false,
    annunciators: {
      [AnnunciatorId.UPLINK_ACTY]: false,
      [AnnunciatorId.TEMP]: false,
      [AnnunciatorId.GIMBAL_LOCK]: false,
      [AnnunciatorId.PROG]: false,
      [AnnunciatorId.RESTART]: false,
      [AnnunciatorId.TRACKER]: false,
      [AnnunciatorId.ALT]: false,
      [AnnunciatorId.VEL]: false,
      [AnnunciatorId.NO_ATT]: false,
      [AnnunciatorId.STBY]: false,
      [AnnunciatorId.OPR_ERR]: false,
    },
  };
}

// ─── Relay Code Table ────────────────────────────────────────────────────────

/**
 * 5-bit relay code to decimal digit mapping.
 * Based on the AGC electroluminescent display segment encoding:
 *   Bit 4=b, Bit 3=d, Bit 2=e, Bit 1=a+f, Bit 0=c+g
 */
export const RELAY_CODE_TABLE: ReadonlyMap<number, number> = new Map([
  [21, 0],  // 0b10101
  [3, 1],   // 0b00011
  [25, 2],  // 0b11001
  [27, 3],  // 0b11011
  [15, 4],  // 0b01111
  [30, 5],  // 0b11110
  [28, 6],  // 0b11100
  [19, 7],  // 0b10011
  [29, 8],  // 0b11101
  [31, 9],  // 0b11111
]);

/** Decode a 5-bit relay code to a decimal digit (0-9) or null for blank/unknown. */
export function relayCodeToDigit(code: number): DskyDigit {
  if (code === 0) return null; // blank
  return RELAY_CODE_TABLE.get(code) ?? null;
}

// ─── Relay Word Decoding ─────────────────────────────────────────────────────

/** Decoded relay word from channel 10. */
export interface RelayWord {
  readonly relayNumber: number;
  readonly highCode: number;
  readonly lowCode: number;
}

/**
 * Decode a channel 10 relay word.
 * - Bits 14-11 (4 bits): relay word number
 * - Bits 10-6 (5 bits): high digit relay code
 * - Bits 5-1 (5 bits): low digit relay code
 * - Bit 0: unused
 */
export function decodeRelayWord(value: Word15): RelayWord {
  return {
    relayNumber: (value >> 11) & 0xF,
    highCode: (value >> 6) & 0x1F,
    lowCode: (value >> 1) & 0x1F,
  };
}

// ─── Sign Decoding ───────────────────────────────────────────────────────────

/** Sign relay codes used in R1/R2/R3 sign positions. */
const SIGN_PLUS = 27;  // 0b11011 (same pattern as digit 3)
const SIGN_MINUS = 28; // 0b11100 (same pattern as digit 6)

/** Decode a relay code in a sign position to +, -, or null (blank). */
function decodeSign(code: number): DskySign {
  if (code === SIGN_PLUS) return '+';
  if (code === SIGN_MINUS) return '-';
  if (code === 0) return null;
  // Non-standard codes treated as blank
  return null;
}

// ─── Channel 10: Display Data ────────────────────────────────────────────────

/**
 * Process a write to channel 10 (display relay word).
 * Decodes the relay word and updates the appropriate display register.
 */
export function processChannel10(state: DskyDisplayState, value: Word15): DskyDisplayState {
  const rw = decodeRelayWord(value);

  switch (rw.relayNumber) {
    case 11: // PROG digits 1,2
      return {
        ...state,
        prog: { d1: relayCodeToDigit(rw.highCode), d2: relayCodeToDigit(rw.lowCode) },
      };

    case 10: // VERB digits 1,2
      return {
        ...state,
        verb: { d1: relayCodeToDigit(rw.highCode), d2: relayCodeToDigit(rw.lowCode) },
      };

    case 9: // NOUN digits 1,2
      return {
        ...state,
        noun: { d1: relayCodeToDigit(rw.highCode), d2: relayCodeToDigit(rw.lowCode) },
      };

    case 7: // R1 sign + digit 1
      return {
        ...state,
        r1: { ...state.r1, sign: decodeSign(rw.highCode), d1: relayCodeToDigit(rw.lowCode) },
      };

    case 6: // R1 digits 2,3
      return {
        ...state,
        r1: { ...state.r1, d2: relayCodeToDigit(rw.highCode), d3: relayCodeToDigit(rw.lowCode) },
      };

    case 5: // R1 digits 4,5
      return {
        ...state,
        r1: { ...state.r1, d4: relayCodeToDigit(rw.highCode), d5: relayCodeToDigit(rw.lowCode) },
      };

    case 4: // R2 sign + digit 1
      return {
        ...state,
        r2: { ...state.r2, sign: decodeSign(rw.highCode), d1: relayCodeToDigit(rw.lowCode) },
      };

    case 3: // R2 digits 2,3
      return {
        ...state,
        r2: { ...state.r2, d2: relayCodeToDigit(rw.highCode), d3: relayCodeToDigit(rw.lowCode) },
      };

    case 2: // R2 digits 4,5
      return {
        ...state,
        r2: { ...state.r2, d4: relayCodeToDigit(rw.highCode), d5: relayCodeToDigit(rw.lowCode) },
      };

    case 1: // R3 sign + digit 1
      return {
        ...state,
        r3: { ...state.r3, sign: decodeSign(rw.highCode), d1: relayCodeToDigit(rw.lowCode) },
      };

    default:
      // Relay words 0 and 8 are unused -- return state unchanged
      return state;
  }
}

// ─── Channel 11: Annunciators ────────────────────────────────────────────────

/**
 * Process a write to channel 11 (annunciator control).
 * Replaces the full annunciator state from the bit pattern.
 */
export function processChannel11(state: DskyDisplayState, value: Word15): DskyDisplayState {
  const annunciators = {} as Record<AnnunciatorId, boolean>;

  for (const idStr of Object.keys(ANNUNCIATOR_BITS)) {
    const id = Number(idStr) as AnnunciatorId;
    const bit = ANNUNCIATOR_BITS[id];
    annunciators[id] = (value & (1 << bit)) !== 0;
  }

  return { ...state, annunciators };
}

// ─── Channel 13: COMP ACTY ──────────────────────────────────────────────────

/**
 * Process a write to channel 13 (COMP ACTY and display control).
 * Bit 11: COMP ACTY indicator (1 = on, 0 = off).
 */
export function processChannel13(state: DskyDisplayState, value: Word15): DskyDisplayState {
  const compActy = (value & (1 << 11)) !== 0;
  if (compActy === state.compActy) return state;
  return { ...state, compActy };
}
