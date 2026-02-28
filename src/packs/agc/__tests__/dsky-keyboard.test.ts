/**
 * DSKY keyboard model tests.
 *
 * Covers: all 19 key definitions, key code table, channel 15 injection,
 * KEYRUPT1 interrupt generation, PRO key special handling, key release.
 */

import { describe, it, expect } from 'vitest';
import { InterruptId } from '../interrupts.js';
import {
  DskyKeyId,
  DSKY_KEY_CODES,
  KEY_CODE_MAP,
  createDskyKeyboardState,
  pressKey,
  releaseKey,
  type DskyKeyboardState,
  type KeyPressResult,
  type KeyReleaseResult,
} from '../dsky-keyboard.js';

// ─── Key Definitions ─────────────────────────────────────────────────────────

describe('DskyKeyId', () => {
  it('defines all 19 DSKY keys', () => {
    const keys = Object.values(DskyKeyId).filter(v => typeof v === 'number');
    expect(keys.length).toBe(19);
  });

  it('includes all 10 numeric keys', () => {
    expect(DskyKeyId.ZERO).toBeDefined();
    expect(DskyKeyId.ONE).toBeDefined();
    expect(DskyKeyId.TWO).toBeDefined();
    expect(DskyKeyId.THREE).toBeDefined();
    expect(DskyKeyId.FOUR).toBeDefined();
    expect(DskyKeyId.FIVE).toBeDefined();
    expect(DskyKeyId.SIX).toBeDefined();
    expect(DskyKeyId.SEVEN).toBeDefined();
    expect(DskyKeyId.EIGHT).toBeDefined();
    expect(DskyKeyId.NINE).toBeDefined();
  });

  it('includes all 9 function keys', () => {
    expect(DskyKeyId.VERB).toBeDefined();
    expect(DskyKeyId.NOUN).toBeDefined();
    expect(DskyKeyId.PLUS).toBeDefined();
    expect(DskyKeyId.MINUS).toBeDefined();
    expect(DskyKeyId.CLR).toBeDefined();
    expect(DskyKeyId.PRO).toBeDefined();
    expect(DskyKeyId.KEY_REL).toBeDefined();
    expect(DskyKeyId.ENTR).toBeDefined();
    expect(DskyKeyId.RSET).toBeDefined();
  });
});

// ─── Key Code Table ──────────────────────────────────────────────────────────

describe('DSKY_KEY_CODES', () => {
  it('maps ZERO to 0o20 (16)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.ZERO]).toBe(0o20);
  });

  it('maps ONE to 0o01 (1)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.ONE]).toBe(0o01);
  });

  it('maps TWO to 0o02 (2)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.TWO]).toBe(0o02);
  });

  it('maps THREE to 0o03 (3)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.THREE]).toBe(0o03);
  });

  it('maps FOUR to 0o04 (4)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.FOUR]).toBe(0o04);
  });

  it('maps FIVE to 0o05 (5)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.FIVE]).toBe(0o05);
  });

  it('maps SIX to 0o06 (6)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.SIX]).toBe(0o06);
  });

  it('maps SEVEN to 0o07 (7)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.SEVEN]).toBe(0o07);
  });

  it('maps EIGHT to 0o10 (8)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.EIGHT]).toBe(0o10);
  });

  it('maps NINE to 0o11 (9)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.NINE]).toBe(0o11);
  });

  it('maps VERB to 0o21 (17)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.VERB]).toBe(0o21);
  });

  it('maps NOUN to 0o37 (31)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.NOUN]).toBe(0o37);
  });

  it('maps PLUS to 0o32 (26)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.PLUS]).toBe(0o32);
  });

  it('maps MINUS to 0o33 (27)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.MINUS]).toBe(0o33);
  });

  it('maps CLR to 0o36 (30)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.CLR]).toBe(0o36);
  });

  it('maps PRO to 0o00 (special)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.PRO]).toBe(0o00);
  });

  it('maps KEY_REL to 0o31 (25)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.KEY_REL]).toBe(0o31);
  });

  it('maps ENTR to 0o34 (28)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.ENTR]).toBe(0o34);
  });

  it('maps RSET to 0o22 (18)', () => {
    expect(DSKY_KEY_CODES[DskyKeyId.RSET]).toBe(0o22);
  });

  it('has all 19 unique key codes (excluding PRO)', () => {
    const nonProCodes = Object.entries(DSKY_KEY_CODES)
      .filter(([key]) => Number(key) !== DskyKeyId.PRO)
      .map(([, code]) => code);
    const unique = new Set(nonProCodes);
    expect(unique.size).toBe(18); // 18 non-PRO keys have distinct codes
  });
});

// ─── Reverse Lookup ──────────────────────────────────────────────────────────

describe('KEY_CODE_MAP', () => {
  it('reverse-maps key codes to key IDs for all non-PRO keys', () => {
    for (const [keyStr, code] of Object.entries(DSKY_KEY_CODES)) {
      const keyId = Number(keyStr) as DskyKeyId;
      if (keyId === DskyKeyId.PRO) continue; // PRO code 0 may collide
      expect(KEY_CODE_MAP.get(code)).toBe(keyId);
    }
  });
});

// ─── Keyboard State ──────────────────────────────────────────────────────────

describe('createDskyKeyboardState', () => {
  it('creates state with no key pressed', () => {
    const state = createDskyKeyboardState();
    expect(state.lastKeyCode).toBeNull();
    expect(state.keyDown).toBe(false);
  });
});

// ─── Key Press Processing ────────────────────────────────────────────────────

describe('pressKey', () => {
  it('pressing FIVE: channel 0o15, value 0o05, KEYRUPT1', () => {
    const state = createDskyKeyboardState();
    const result = pressKey(state, DskyKeyId.FIVE);
    expect(result.channelUpdate).toEqual({ channel: 0o15, value: 0o05 });
    expect(result.interruptRequest).toBe(InterruptId.KEYRUPT1);
    expect(result.keyboardState.lastKeyCode).toBe(0o05);
    expect(result.keyboardState.keyDown).toBe(true);
  });

  it('pressing ZERO: channel 0o15, value 0o20, KEYRUPT1', () => {
    const state = createDskyKeyboardState();
    const result = pressKey(state, DskyKeyId.ZERO);
    expect(result.channelUpdate).toEqual({ channel: 0o15, value: 0o20 });
    expect(result.interruptRequest).toBe(InterruptId.KEYRUPT1);
  });

  it('pressing VERB: channel 0o15, value 0o21, KEYRUPT1', () => {
    const state = createDskyKeyboardState();
    const result = pressKey(state, DskyKeyId.VERB);
    expect(result.channelUpdate).toEqual({ channel: 0o15, value: 0o21 });
    expect(result.interruptRequest).toBe(InterruptId.KEYRUPT1);
  });

  it('pressing NOUN: channel 0o15, value 0o37, KEYRUPT1', () => {
    const state = createDskyKeyboardState();
    const result = pressKey(state, DskyKeyId.NOUN);
    expect(result.channelUpdate).toEqual({ channel: 0o15, value: 0o37 });
    expect(result.interruptRequest).toBe(InterruptId.KEYRUPT1);
  });

  it('pressing ENTR: channel 0o15, value 0o34, KEYRUPT1', () => {
    const state = createDskyKeyboardState();
    const result = pressKey(state, DskyKeyId.ENTR);
    expect(result.channelUpdate).toEqual({ channel: 0o15, value: 0o34 });
    expect(result.interruptRequest).toBe(InterruptId.KEYRUPT1);
  });

  it('pressing CLR: channel 0o15, value 0o36, KEYRUPT1', () => {
    const state = createDskyKeyboardState();
    const result = pressKey(state, DskyKeyId.CLR);
    expect(result.channelUpdate).toEqual({ channel: 0o15, value: 0o36 });
    expect(result.interruptRequest).toBe(InterruptId.KEYRUPT1);
  });

  it('pressing PLUS: channel 0o15, value 0o32, KEYRUPT1', () => {
    const state = createDskyKeyboardState();
    const result = pressKey(state, DskyKeyId.PLUS);
    expect(result.channelUpdate).toEqual({ channel: 0o15, value: 0o32 });
    expect(result.interruptRequest).toBe(InterruptId.KEYRUPT1);
  });

  it('pressing MINUS: channel 0o15, value 0o33, KEYRUPT1', () => {
    const state = createDskyKeyboardState();
    const result = pressKey(state, DskyKeyId.MINUS);
    expect(result.channelUpdate).toEqual({ channel: 0o15, value: 0o33 });
    expect(result.interruptRequest).toBe(InterruptId.KEYRUPT1);
  });

  it('pressing KEY_REL: channel 0o15, value 0o31, KEYRUPT1', () => {
    const state = createDskyKeyboardState();
    const result = pressKey(state, DskyKeyId.KEY_REL);
    expect(result.channelUpdate).toEqual({ channel: 0o15, value: 0o31 });
    expect(result.interruptRequest).toBe(InterruptId.KEYRUPT1);
  });

  it('pressing RSET: channel 0o15, value 0o22, KEYRUPT1', () => {
    const state = createDskyKeyboardState();
    const result = pressKey(state, DskyKeyId.RSET);
    expect(result.channelUpdate).toEqual({ channel: 0o15, value: 0o22 });
    expect(result.interruptRequest).toBe(InterruptId.KEYRUPT1);
  });
});

// ─── PRO Key Special Handling ────────────────────────────────────────────────

describe('PRO key', () => {
  it('pressing PRO: routes to channel 0o32 with bit 14 set', () => {
    const state = createDskyKeyboardState();
    const result = pressKey(state, DskyKeyId.PRO);
    expect(result.channelUpdate).toEqual({ channel: 0o32, value: 1 << 14 });
  });

  it('pressing PRO: does NOT trigger KEYRUPT1', () => {
    const state = createDskyKeyboardState();
    const result = pressKey(state, DskyKeyId.PRO);
    expect(result.interruptRequest).toBeNull();
  });

  it('pressing PRO: does NOT write to channel 15', () => {
    const state = createDskyKeyboardState();
    const result = pressKey(state, DskyKeyId.PRO);
    expect(result.channelUpdate!.channel).not.toBe(0o15);
  });

  it('releasing PRO: clears bit 14 of channel 0o32', () => {
    let state = createDskyKeyboardState();
    const pressResult = pressKey(state, DskyKeyId.PRO);
    const relResult = releaseKey(pressResult.keyboardState, DskyKeyId.PRO);
    expect(relResult.channelUpdate).toEqual({ channel: 0o32, value: 0 });
  });
});

// ─── Key Release ─────────────────────────────────────────────────────────────

describe('releaseKey', () => {
  it('clears keyDown flag but preserves lastKeyCode', () => {
    const state = createDskyKeyboardState();
    const pressResult = pressKey(state, DskyKeyId.FIVE);
    const relResult = releaseKey(pressResult.keyboardState);
    expect(relResult.keyboardState.keyDown).toBe(false);
    expect(relResult.keyboardState.lastKeyCode).toBe(0o05);
  });

  it('non-PRO release has no channel update', () => {
    const state = createDskyKeyboardState();
    const pressResult = pressKey(state, DskyKeyId.FIVE);
    const relResult = releaseKey(pressResult.keyboardState);
    expect(relResult.channelUpdate).toBeNull();
  });
});

// ─── Numeric Key Range Validation ────────────────────────────────────────────

describe('numeric key codes', () => {
  it('all digit keys (0-9) produce codes in range 0o01-0o20', () => {
    const digitKeys = [
      DskyKeyId.ZERO, DskyKeyId.ONE, DskyKeyId.TWO, DskyKeyId.THREE,
      DskyKeyId.FOUR, DskyKeyId.FIVE, DskyKeyId.SIX, DskyKeyId.SEVEN,
      DskyKeyId.EIGHT, DskyKeyId.NINE,
    ];
    for (const key of digitKeys) {
      const code = DSKY_KEY_CODES[key];
      expect(code).toBeGreaterThanOrEqual(0o01);
      expect(code).toBeLessThanOrEqual(0o20);
    }
  });

  it('all function keys (non-digit, non-PRO) produce codes in range 0o21-0o37', () => {
    const funcKeys = [
      DskyKeyId.VERB, DskyKeyId.NOUN, DskyKeyId.PLUS, DskyKeyId.MINUS,
      DskyKeyId.CLR, DskyKeyId.KEY_REL, DskyKeyId.ENTR, DskyKeyId.RSET,
    ];
    for (const key of funcKeys) {
      const code = DSKY_KEY_CODES[key];
      expect(code).toBeGreaterThanOrEqual(0o21);
      expect(code).toBeLessThanOrEqual(0o37);
    }
  });

  it('all key codes fit in 5 bits (0-31)', () => {
    for (const code of Object.values(DSKY_KEY_CODES)) {
      expect(code).toBeGreaterThanOrEqual(0);
      expect(code).toBeLessThanOrEqual(31);
    }
  });
});

// ─── Edge Cases ──────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('pressing key while another is held replaces state (last-write-wins)', () => {
    const state = createDskyKeyboardState();
    const r1 = pressKey(state, DskyKeyId.FIVE);
    const r2 = pressKey(r1.keyboardState, DskyKeyId.THREE);
    expect(r2.keyboardState.lastKeyCode).toBe(0o03);
    expect(r2.channelUpdate).toEqual({ channel: 0o15, value: 0o03 });
    expect(r2.interruptRequest).toBe(InterruptId.KEYRUPT1);
  });

  it('multiple rapid presses each trigger KEYRUPT1', () => {
    let state = createDskyKeyboardState();
    const keys = [DskyKeyId.ONE, DskyKeyId.TWO, DskyKeyId.THREE];
    for (const key of keys) {
      const result = pressKey(state, key);
      expect(result.interruptRequest).toBe(InterruptId.KEYRUPT1);
      state = result.keyboardState;
    }
  });
});
