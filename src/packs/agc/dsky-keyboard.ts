/**
 * AGC Block II DSKY keyboard model.
 *
 * Maps all 19 DSKY key presses to I/O channel values and interrupt requests.
 * Standard keys write their 5-bit key code to channel 15 (octal) and trigger
 * KEYRUPT1. The PRO key is special: it sets bit 14 of channel 32 (octal)
 * without triggering KEYRUPT1.
 *
 * All functions are pure (no mutation of input state).
 */

import { InterruptId } from './interrupts.js';

// ─── Key Definitions ─────────────────────────────────────────────────────────

/** All 19 DSKY keys. */
export enum DskyKeyId {
  ZERO = 0,
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
  SEVEN = 7,
  EIGHT = 8,
  NINE = 9,
  VERB = 10,
  NOUN = 11,
  PLUS = 12,
  MINUS = 13,
  CLR = 14,
  PRO = 15,
  KEY_REL = 16,
  ENTR = 17,
  RSET = 18,
}

// ─── Key Code Table ──────────────────────────────────────────────────────────

/**
 * 5-bit key codes for channel 15, matching real AGC DSKY encoding.
 * PRO key code is 0 (special routing via channel 32).
 */
export const DSKY_KEY_CODES: Readonly<Record<DskyKeyId, number>> = {
  [DskyKeyId.ZERO]: 0o20,    // 16
  [DskyKeyId.ONE]: 0o01,     // 1
  [DskyKeyId.TWO]: 0o02,     // 2
  [DskyKeyId.THREE]: 0o03,   // 3
  [DskyKeyId.FOUR]: 0o04,    // 4
  [DskyKeyId.FIVE]: 0o05,    // 5
  [DskyKeyId.SIX]: 0o06,     // 6
  [DskyKeyId.SEVEN]: 0o07,   // 7
  [DskyKeyId.EIGHT]: 0o10,   // 8
  [DskyKeyId.NINE]: 0o11,    // 9
  [DskyKeyId.VERB]: 0o21,    // 17
  [DskyKeyId.NOUN]: 0o37,    // 31
  [DskyKeyId.PLUS]: 0o32,    // 26
  [DskyKeyId.MINUS]: 0o33,   // 27
  [DskyKeyId.CLR]: 0o36,     // 30
  [DskyKeyId.PRO]: 0o00,     // 0 (special -- channel 32, not 15)
  [DskyKeyId.KEY_REL]: 0o31, // 25
  [DskyKeyId.ENTR]: 0o34,    // 28
  [DskyKeyId.RSET]: 0o22,    // 18
};

/** Reverse lookup: key code -> key ID (for debugging/display). */
export const KEY_CODE_MAP: ReadonlyMap<number, DskyKeyId> = (() => {
  const map = new Map<number, DskyKeyId>();
  for (const [keyStr, code] of Object.entries(DSKY_KEY_CODES)) {
    const keyId = Number(keyStr) as DskyKeyId;
    if (keyId === DskyKeyId.PRO) continue; // PRO code 0 conflicts
    map.set(code, keyId);
  }
  return map;
})();

// ─── Keyboard State ──────────────────────────────────────────────────────────

/** Immutable DSKY keyboard state. */
export interface DskyKeyboardState {
  readonly lastKeyCode: number | null;
  readonly keyDown: boolean;
}

/** Create initial keyboard state: no key pressed. */
export function createDskyKeyboardState(): DskyKeyboardState {
  return {
    lastKeyCode: null,
    keyDown: false,
  };
}

// ─── Key Press Result ────────────────────────────────────────────────────────

/** Result of pressing a DSKY key. */
export interface KeyPressResult {
  readonly keyboardState: DskyKeyboardState;
  readonly channelUpdate: { readonly channel: number; readonly value: number } | null;
  readonly interruptRequest: InterruptId | null;
}

/** Result of releasing a DSKY key. */
export interface KeyReleaseResult {
  readonly keyboardState: DskyKeyboardState;
  readonly channelUpdate: { readonly channel: number; readonly value: number } | null;
}

// ─── Channel Constants ───────────────────────────────────────────────────────

/** DSKY keyboard input channel (octal 15). */
const CHANNEL_15 = 0o15;

/** IMU/Discrete input channel where PRO bit lives (octal 32). */
const CHANNEL_32 = 0o32;

/** Bit position for PRO key in channel 32. */
const PRO_BIT = 14;

// ─── Key Press ───────────────────────────────────────────────────────────────

/**
 * Process a DSKY key press.
 *
 * Standard keys: write key code to channel 15, trigger KEYRUPT1.
 * PRO key: set bit 14 of channel 32, no KEYRUPT1.
 */
export function pressKey(state: DskyKeyboardState, keyId: DskyKeyId): KeyPressResult {
  const code = DSKY_KEY_CODES[keyId];

  // PRO key special handling: channel 32 bit 14, no interrupt
  if (keyId === DskyKeyId.PRO) {
    return {
      keyboardState: { lastKeyCode: code, keyDown: true },
      channelUpdate: { channel: CHANNEL_32, value: 1 << PRO_BIT },
      interruptRequest: null,
    };
  }

  // Standard key: channel 15, KEYRUPT1
  return {
    keyboardState: { lastKeyCode: code, keyDown: true },
    channelUpdate: { channel: CHANNEL_15, value: code },
    interruptRequest: InterruptId.KEYRUPT1,
  };
}

// ─── Key Release ─────────────────────────────────────────────────────────────

/**
 * Process a DSKY key release.
 *
 * Standard keys: clear keyDown, no channel update (AGC reads asynchronously).
 * PRO key: clear bit 14 of channel 32.
 */
export function releaseKey(
  state: DskyKeyboardState,
  keyId?: DskyKeyId,
): KeyReleaseResult {
  // PRO release: clear channel 32 bit 14
  if (keyId === DskyKeyId.PRO) {
    return {
      keyboardState: { lastKeyCode: state.lastKeyCode, keyDown: false },
      channelUpdate: { channel: CHANNEL_32, value: 0 },
    };
  }

  // Standard release: just clear keyDown
  return {
    keyboardState: { lastKeyCode: state.lastKeyCode, keyDown: false },
    channelUpdate: null,
  };
}
