/**
 * DSKY display model tests.
 *
 * Covers: relay word decoding, display registers (PROG/VERB/NOUN/R1/R2/R3),
 * annunciators (channel 11), COMP ACTY (channel 13), and channel 10 processing.
 */

import { describe, it, expect } from 'vitest';
import type { Word15 } from '../types.js';
import {
  createDskyDisplayState,
  processChannel10,
  processChannel11,
  processChannel13,
  decodeRelayWord,
  relayCodeToDigit,
  AnnunciatorId,
  ANNUNCIATOR_BITS,
  type DskyDisplayState,
  type RelayWord,
} from '../dsky-display.js';

// ─── Relay Code Table ────────────────────────────────────────────────────────

describe('relayCodeToDigit', () => {
  it('decodes relay code 21 (0b10101) to digit 0', () => {
    expect(relayCodeToDigit(21)).toBe(0);
  });

  it('decodes relay code 3 (0b00011) to digit 1', () => {
    expect(relayCodeToDigit(3)).toBe(1);
  });

  it('decodes relay code 25 (0b11001) to digit 2', () => {
    expect(relayCodeToDigit(25)).toBe(2);
  });

  it('decodes relay code 27 (0b11011) to digit 3', () => {
    expect(relayCodeToDigit(27)).toBe(3);
  });

  it('decodes relay code 15 (0b01111) to digit 4', () => {
    expect(relayCodeToDigit(15)).toBe(4);
  });

  it('decodes relay code 30 (0b11110) to digit 5', () => {
    expect(relayCodeToDigit(30)).toBe(5);
  });

  it('decodes relay code 28 (0b11100) to digit 6', () => {
    expect(relayCodeToDigit(28)).toBe(6);
  });

  it('decodes relay code 19 (0b10011) to digit 7', () => {
    expect(relayCodeToDigit(19)).toBe(7);
  });

  it('decodes relay code 29 (0b11101) to digit 8', () => {
    expect(relayCodeToDigit(29)).toBe(8);
  });

  it('decodes relay code 31 (0b11111) to digit 9', () => {
    expect(relayCodeToDigit(31)).toBe(9);
  });

  it('decodes relay code 0 (blank) to null', () => {
    expect(relayCodeToDigit(0)).toBeNull();
  });

  it('returns null for unknown relay codes', () => {
    expect(relayCodeToDigit(1)).toBeNull();
    expect(relayCodeToDigit(2)).toBeNull();
    expect(relayCodeToDigit(16)).toBeNull();
  });
});

// ─── Relay Word Decoding ─────────────────────────────────────────────────────

describe('decodeRelayWord', () => {
  it('extracts relay number from bits 14-11', () => {
    // Relay number 11 (0o13) = 0b1011, in bits 14-11 = 0b1011_00000_00000_0
    const value = (0b1011 << 11) as Word15;
    const rw = decodeRelayWord(value);
    expect(rw.relayNumber).toBe(11);
  });

  it('extracts high digit code from bits 10-6', () => {
    // High code = 21 (0b10101) in bits 10-6
    const value = (21 << 6) as Word15;
    const rw = decodeRelayWord(value);
    expect(rw.highCode).toBe(21);
  });

  it('extracts low digit code from bits 5-1', () => {
    // Low code = 3 (0b00011) in bits 5-1
    const value = (3 << 1) as Word15;
    const rw = decodeRelayWord(value);
    expect(rw.lowCode).toBe(3);
  });

  it('decodes a complete relay word for PROG "35"', () => {
    // Relay 11 (PROG), high=3 (relay 27), low=5 (relay 30)
    const value = ((11 << 11) | (27 << 6) | (30 << 1)) as Word15;
    const rw = decodeRelayWord(value);
    expect(rw.relayNumber).toBe(11);
    expect(relayCodeToDigit(rw.highCode)).toBe(3);
    expect(relayCodeToDigit(rw.lowCode)).toBe(5);
  });
});

// ─── Initial Display State ───────────────────────────────────────────────────

describe('createDskyDisplayState', () => {
  it('creates state with all digits blank', () => {
    const state = createDskyDisplayState();
    expect(state.prog.d1).toBeNull();
    expect(state.prog.d2).toBeNull();
    expect(state.verb.d1).toBeNull();
    expect(state.verb.d2).toBeNull();
    expect(state.noun.d1).toBeNull();
    expect(state.noun.d2).toBeNull();
    expect(state.r1.d1).toBeNull();
    expect(state.r1.d2).toBeNull();
    expect(state.r1.d3).toBeNull();
    expect(state.r1.d4).toBeNull();
    expect(state.r1.d5).toBeNull();
    expect(state.r2.d1).toBeNull();
    expect(state.r3.d1).toBeNull();
  });

  it('creates state with all signs null', () => {
    const state = createDskyDisplayState();
    expect(state.r1.sign).toBeNull();
    expect(state.r2.sign).toBeNull();
    expect(state.r3.sign).toBeNull();
  });

  it('creates state with COMP ACTY off', () => {
    const state = createDskyDisplayState();
    expect(state.compActy).toBe(false);
  });

  it('creates state with all annunciators off', () => {
    const state = createDskyDisplayState();
    for (const id of Object.values(AnnunciatorId)) {
      if (typeof id === 'number') {
        expect(state.annunciators[id as AnnunciatorId]).toBe(false);
      }
    }
  });
});

// ─── Channel 10: Display Registers ──────────────────────────────────────────

describe('processChannel10', () => {
  /** Helper to build a channel 10 value from relay number + two relay codes. */
  function makeChannel10(relayNum: number, highCode: number, lowCode: number): Word15 {
    return ((relayNum << 11) | (highCode << 6) | (lowCode << 1)) as Word15;
  }

  /** Get relay code for a decimal digit using the known table. */
  const DIGIT_TO_RELAY: Record<number, number> = {
    0: 21, 1: 3, 2: 25, 3: 27, 4: 15, 5: 30, 6: 28, 7: 19, 8: 29, 9: 31,
  };

  it('writes PROG digits from relay word 11', () => {
    const state = createDskyDisplayState();
    const value = makeChannel10(11, DIGIT_TO_RELAY[3], DIGIT_TO_RELAY[5]);
    const next = processChannel10(state, value);
    expect(next.prog.d1).toBe(3);
    expect(next.prog.d2).toBe(5);
  });

  it('writes VERB digits from relay word 10', () => {
    const state = createDskyDisplayState();
    const value = makeChannel10(10, DIGIT_TO_RELAY[0], DIGIT_TO_RELAY[6]);
    const next = processChannel10(state, value);
    expect(next.verb.d1).toBe(0);
    expect(next.verb.d2).toBe(6);
  });

  it('writes NOUN digits from relay word 9', () => {
    const state = createDskyDisplayState();
    const value = makeChannel10(9, DIGIT_TO_RELAY[8], DIGIT_TO_RELAY[8]);
    const next = processChannel10(state, value);
    expect(next.noun.d1).toBe(8);
    expect(next.noun.d2).toBe(8);
  });

  it('writes R1 sign and digit 1 from relay word 7', () => {
    const state = createDskyDisplayState();
    // Sign codes: plus = 0b11011 (27), minus = 0b11100 (28)
    const value = makeChannel10(7, 27, DIGIT_TO_RELAY[1]);
    const next = processChannel10(state, value);
    expect(next.r1.sign).toBe('+');
    expect(next.r1.d1).toBe(1);
  });

  it('writes R1 digits 2,3 from relay word 6', () => {
    const state = createDskyDisplayState();
    const value = makeChannel10(6, DIGIT_TO_RELAY[2], DIGIT_TO_RELAY[3]);
    const next = processChannel10(state, value);
    expect(next.r1.d2).toBe(2);
    expect(next.r1.d3).toBe(3);
  });

  it('writes R1 digits 4,5 from relay word 5', () => {
    const state = createDskyDisplayState();
    const value = makeChannel10(5, DIGIT_TO_RELAY[4], DIGIT_TO_RELAY[5]);
    const next = processChannel10(state, value);
    expect(next.r1.d4).toBe(4);
    expect(next.r1.d5).toBe(5);
  });

  it('builds complete R1 = +12345 from three relay words', () => {
    let state = createDskyDisplayState();
    state = processChannel10(state, makeChannel10(7, 27, DIGIT_TO_RELAY[1])); // sign +, d1=1
    state = processChannel10(state, makeChannel10(6, DIGIT_TO_RELAY[2], DIGIT_TO_RELAY[3])); // d2=2, d3=3
    state = processChannel10(state, makeChannel10(5, DIGIT_TO_RELAY[4], DIGIT_TO_RELAY[5])); // d4=4, d5=5
    expect(state.r1).toEqual({ sign: '+', d1: 1, d2: 2, d3: 3, d4: 4, d5: 5 });
  });

  it('writes R2 sign and digit 1 from relay word 4', () => {
    const state = createDskyDisplayState();
    const value = makeChannel10(4, 28, DIGIT_TO_RELAY[9]); // minus sign, digit 9
    const next = processChannel10(state, value);
    expect(next.r2.sign).toBe('-');
    expect(next.r2.d1).toBe(9);
  });

  it('writes R2 digits 2,3 from relay word 3', () => {
    const state = createDskyDisplayState();
    const value = makeChannel10(3, DIGIT_TO_RELAY[8], DIGIT_TO_RELAY[7]);
    const next = processChannel10(state, value);
    expect(next.r2.d2).toBe(8);
    expect(next.r2.d3).toBe(7);
  });

  it('writes R2 digits 4,5 from relay word 2', () => {
    const state = createDskyDisplayState();
    const value = makeChannel10(2, DIGIT_TO_RELAY[6], DIGIT_TO_RELAY[5]);
    const next = processChannel10(state, value);
    expect(next.r2.d4).toBe(6);
    expect(next.r2.d5).toBe(5);
  });

  it('writes R3 sign and digit 1 from relay word 1', () => {
    const state = createDskyDisplayState();
    const value = makeChannel10(1, 27, DIGIT_TO_RELAY[0]); // plus sign, digit 0
    const next = processChannel10(state, value);
    expect(next.r3.sign).toBe('+');
    expect(next.r3.d1).toBe(0);
  });

  it('handles blank digits (relay code 0)', () => {
    const state = createDskyDisplayState();
    const value = makeChannel10(11, 0, 0); // blank both PROG digits
    const next = processChannel10(state, value);
    expect(next.prog.d1).toBeNull();
    expect(next.prog.d2).toBeNull();
  });

  it('handles blank sign (relay code 0 in sign position)', () => {
    const state = createDskyDisplayState();
    const value = makeChannel10(7, 0, DIGIT_TO_RELAY[5]); // blank sign, digit 5
    const next = processChannel10(state, value);
    expect(next.r1.sign).toBeNull();
    expect(next.r1.d1).toBe(5);
  });

  it('does not mutate input state', () => {
    const state = createDskyDisplayState();
    const value = makeChannel10(11, DIGIT_TO_RELAY[3], DIGIT_TO_RELAY[5]);
    const next = processChannel10(state, value);
    expect(state.prog.d1).toBeNull(); // original unchanged
    expect(next.prog.d1).toBe(3);     // new state updated
  });

  it('ignores relay word number 0 and 8 (unused)', () => {
    const state = createDskyDisplayState();
    const next0 = processChannel10(state, makeChannel10(0, DIGIT_TO_RELAY[1], DIGIT_TO_RELAY[2]));
    const next8 = processChannel10(state, makeChannel10(8, DIGIT_TO_RELAY[1], DIGIT_TO_RELAY[2]));
    expect(next0).toEqual(state);
    expect(next8).toEqual(state);
  });
});

// ─── Channel 11: Annunciators ────────────────────────────────────────────────

describe('processChannel11', () => {
  it('turns on UPLINK_ACTY from bit 1', () => {
    const state = createDskyDisplayState();
    const next = processChannel11(state, (1 << 1) as Word15);
    expect(next.annunciators[AnnunciatorId.UPLINK_ACTY]).toBe(true);
  });

  it('turns on TEMP from bit 2', () => {
    const state = createDskyDisplayState();
    const next = processChannel11(state, (1 << 2) as Word15);
    expect(next.annunciators[AnnunciatorId.TEMP]).toBe(true);
  });

  it('turns on GIMBAL_LOCK from bit 3', () => {
    const state = createDskyDisplayState();
    const next = processChannel11(state, (1 << 3) as Word15);
    expect(next.annunciators[AnnunciatorId.GIMBAL_LOCK]).toBe(true);
  });

  it('turns on PROG from bit 4', () => {
    const state = createDskyDisplayState();
    const next = processChannel11(state, (1 << 4) as Word15);
    expect(next.annunciators[AnnunciatorId.PROG]).toBe(true);
  });

  it('turns on RESTART from bit 5', () => {
    const state = createDskyDisplayState();
    const next = processChannel11(state, (1 << 5) as Word15);
    expect(next.annunciators[AnnunciatorId.RESTART]).toBe(true);
  });

  it('turns on TRACKER from bit 6', () => {
    const state = createDskyDisplayState();
    const next = processChannel11(state, (1 << 6) as Word15);
    expect(next.annunciators[AnnunciatorId.TRACKER]).toBe(true);
  });

  it('turns on ALT from bit 7', () => {
    const state = createDskyDisplayState();
    const next = processChannel11(state, (1 << 7) as Word15);
    expect(next.annunciators[AnnunciatorId.ALT]).toBe(true);
  });

  it('turns on VEL from bit 8', () => {
    const state = createDskyDisplayState();
    const next = processChannel11(state, (1 << 8) as Word15);
    expect(next.annunciators[AnnunciatorId.VEL]).toBe(true);
  });

  it('turns on NO_ATT from bit 9', () => {
    const state = createDskyDisplayState();
    const next = processChannel11(state, (1 << 9) as Word15);
    expect(next.annunciators[AnnunciatorId.NO_ATT]).toBe(true);
  });

  it('turns on STBY from bit 10', () => {
    const state = createDskyDisplayState();
    const next = processChannel11(state, (1 << 10) as Word15);
    expect(next.annunciators[AnnunciatorId.STBY]).toBe(true);
  });

  it('turns on OPR_ERR from bit 11', () => {
    const state = createDskyDisplayState();
    const next = processChannel11(state, (1 << 11) as Word15);
    expect(next.annunciators[AnnunciatorId.OPR_ERR]).toBe(true);
  });

  it('turns on UPLINK_ACTY and GIMBAL_LOCK together', () => {
    const state = createDskyDisplayState();
    const value = ((1 << 1) | (1 << 3)) as Word15; // bits 1 and 3
    const next = processChannel11(state, value);
    expect(next.annunciators[AnnunciatorId.UPLINK_ACTY]).toBe(true);
    expect(next.annunciators[AnnunciatorId.GIMBAL_LOCK]).toBe(true);
    expect(next.annunciators[AnnunciatorId.TEMP]).toBe(false);
  });

  it('turns all annunciators off with value 0', () => {
    let state = createDskyDisplayState();
    // First turn some on
    state = processChannel11(state, 0b111111111110 as Word15);
    // Then turn all off
    const next = processChannel11(state, 0 as Word15);
    for (const id of Object.values(AnnunciatorId)) {
      if (typeof id === 'number') {
        expect(next.annunciators[id as AnnunciatorId]).toBe(false);
      }
    }
  });

  it('replaces full annunciator state (not incremental)', () => {
    let state = createDskyDisplayState();
    state = processChannel11(state, ((1 << 1) | (1 << 2)) as Word15); // UPLINK + TEMP
    // Now write only GIMBAL_LOCK
    const next = processChannel11(state, (1 << 3) as Word15);
    expect(next.annunciators[AnnunciatorId.UPLINK_ACTY]).toBe(false); // cleared
    expect(next.annunciators[AnnunciatorId.TEMP]).toBe(false);         // cleared
    expect(next.annunciators[AnnunciatorId.GIMBAL_LOCK]).toBe(true);   // set
  });

  it('does not mutate input state', () => {
    const state = createDskyDisplayState();
    const next = processChannel11(state, (1 << 1) as Word15);
    expect(state.annunciators[AnnunciatorId.UPLINK_ACTY]).toBe(false);
    expect(next.annunciators[AnnunciatorId.UPLINK_ACTY]).toBe(true);
  });
});

// ─── Channel 13: COMP ACTY ──────────────────────────────────────────────────

describe('processChannel13', () => {
  it('turns COMP ACTY on when bit 11 is set', () => {
    const state = createDskyDisplayState();
    const next = processChannel13(state, (1 << 11) as Word15);
    expect(next.compActy).toBe(true);
  });

  it('turns COMP ACTY off when bit 11 is clear', () => {
    let state = createDskyDisplayState();
    state = processChannel13(state, (1 << 11) as Word15);
    expect(state.compActy).toBe(true);
    const next = processChannel13(state, 0 as Word15);
    expect(next.compActy).toBe(false);
  });

  it('ignores other bits for COMP ACTY', () => {
    const state = createDskyDisplayState();
    const next = processChannel13(state, 0b000_0000_0001 as Word15); // bit 0 only
    expect(next.compActy).toBe(false);
  });

  it('does not mutate input state', () => {
    const state = createDskyDisplayState();
    const next = processChannel13(state, (1 << 11) as Word15);
    expect(state.compActy).toBe(false);
    expect(next.compActy).toBe(true);
  });
});

// ─── Annunciator Bit Map ────────────────────────────────────────────────────

describe('ANNUNCIATOR_BITS', () => {
  it('maps all 11 annunciators to distinct bit positions', () => {
    const positions = new Set(Object.values(ANNUNCIATOR_BITS));
    expect(positions.size).toBe(11);
  });

  it('maps UPLINK_ACTY to bit 1', () => {
    expect(ANNUNCIATOR_BITS[AnnunciatorId.UPLINK_ACTY]).toBe(1);
  });

  it('maps OPR_ERR to bit 11', () => {
    expect(ANNUNCIATOR_BITS[AnnunciatorId.OPR_ERR]).toBe(11);
  });
});
