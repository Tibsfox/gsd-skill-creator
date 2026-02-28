/**
 * DSKY VERB/NOUN command processor tests.
 *
 * Covers: input mode state machine, VERB/NOUN digit accumulation,
 * data entry (sign + 5 digits), CLR, RSET, KEY REL, ENTR submission,
 * error handling, and display feedback during input.
 */

import { describe, it, expect } from 'vitest';
import { DskyKeyId } from '../dsky-keyboard.js';
import {
  DskyInputMode,
  createDskyCommanderState,
  processKeyPress,
  type DskyCommanderState,
  type DskyCommand,
  type KeyPressProcessResult,
} from '../dsky-commander.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Press a sequence of keys, returning final state. */
function pressSequence(keys: DskyKeyId[]): DskyCommanderState {
  let state = createDskyCommanderState();
  for (const key of keys) {
    state = processKeyPress(state, key).commanderState;
  }
  return state;
}

/** Press a sequence and return the full result of the last press. */
function pressSequenceResult(keys: DskyKeyId[]): KeyPressProcessResult {
  let state = createDskyCommanderState();
  let result: KeyPressProcessResult = processKeyPress(state, keys[0]);
  for (let i = 1; i < keys.length; i++) {
    result = processKeyPress(result.commanderState, keys[i]);
  }
  return result;
}

// ─── Input Modes ─────────────────────────────────────────────────────────────

describe('DskyInputMode', () => {
  it('defines all expected input modes', () => {
    expect(DskyInputMode.IDLE).toBeDefined();
    expect(DskyInputMode.VERB_DIGIT_1).toBeDefined();
    expect(DskyInputMode.VERB_DIGIT_2).toBeDefined();
    expect(DskyInputMode.NOUN_DIGIT_1).toBeDefined();
    expect(DskyInputMode.NOUN_DIGIT_2).toBeDefined();
    expect(DskyInputMode.DATA_SIGN).toBeDefined();
    expect(DskyInputMode.DATA_DIGIT_1).toBeDefined();
    expect(DskyInputMode.DATA_DIGIT_2).toBeDefined();
    expect(DskyInputMode.DATA_DIGIT_3).toBeDefined();
    expect(DskyInputMode.DATA_DIGIT_4).toBeDefined();
    expect(DskyInputMode.DATA_DIGIT_5).toBeDefined();
  });
});

// ─── Initial State ───────────────────────────────────────────────────────────

describe('createDskyCommanderState', () => {
  it('creates state in IDLE mode', () => {
    const state = createDskyCommanderState();
    expect(state.mode).toBe(DskyInputMode.IDLE);
  });

  it('creates state with no verb/noun accumulated', () => {
    const state = createDskyCommanderState();
    expect(state.verbDigits).toEqual([null, null]);
    expect(state.nounDigits).toEqual([null, null]);
  });

  it('creates state with no data accumulated', () => {
    const state = createDskyCommanderState();
    expect(state.dataSign).toBeNull();
    expect(state.dataDigits).toEqual([]);
    expect(state.dataRegister).toBe(1);
  });

  it('creates state with no error', () => {
    const state = createDskyCommanderState();
    expect(state.error).toBe(false);
  });
});

// ─── VERB Key Sequence ───────────────────────────────────────────────────────

describe('VERB key sequence', () => {
  it('pressing VERB in IDLE transitions to VERB_DIGIT_1', () => {
    const state = createDskyCommanderState();
    const result = processKeyPress(state, DskyKeyId.VERB);
    expect(result.commanderState.mode).toBe(DskyInputMode.VERB_DIGIT_1);
  });

  it('pressing VERB sets verbFlashing=true', () => {
    const state = createDskyCommanderState();
    const result = processKeyPress(state, DskyKeyId.VERB);
    expect(result.commanderState.verbFlashing).toBe(true);
  });

  it('pressing digit 3 in VERB_DIGIT_1 stores verb digit 1 and transitions to VERB_DIGIT_2', () => {
    const state = pressSequence([DskyKeyId.VERB]);
    const result = processKeyPress(state, DskyKeyId.THREE);
    expect(result.commanderState.verbDigits[0]).toBe(3);
    expect(result.commanderState.mode).toBe(DskyInputMode.VERB_DIGIT_2);
  });

  it('pressing digit 5 in VERB_DIGIT_2 completes verb entry', () => {
    const state = pressSequence([DskyKeyId.VERB, DskyKeyId.THREE]);
    const result = processKeyPress(state, DskyKeyId.FIVE);
    expect(result.commanderState.verbDigits).toEqual([3, 5]);
    expect(result.commanderState.mode).toBe(DskyInputMode.IDLE);
    expect(result.commanderState.verbFlashing).toBe(false);
  });

  it('VERB-3-5 sequence produces verbDigits=[3,5]', () => {
    const state = pressSequence([DskyKeyId.VERB, DskyKeyId.THREE, DskyKeyId.FIVE]);
    expect(state.verbDigits).toEqual([3, 5]);
  });

  it('display updates show verb digits as they are typed', () => {
    const state = pressSequence([DskyKeyId.VERB]);
    const result = processKeyPress(state, DskyKeyId.THREE);
    expect(result.displayUpdates.verb).toBeDefined();
    expect(result.displayUpdates.verb!.d1).toBe(3);
  });
});

// ─── NOUN Key Sequence ───────────────────────────────────────────────────────

describe('NOUN key sequence', () => {
  it('pressing NOUN from IDLE transitions to NOUN_DIGIT_1', () => {
    const state = createDskyCommanderState();
    const result = processKeyPress(state, DskyKeyId.NOUN);
    expect(result.commanderState.mode).toBe(DskyInputMode.NOUN_DIGIT_1);
    expect(result.commanderState.nounFlashing).toBe(true);
  });

  it('pressing digit 1 in NOUN_DIGIT_1 stores noun digit 1 and advances', () => {
    const state = pressSequence([DskyKeyId.NOUN]);
    const result = processKeyPress(state, DskyKeyId.ONE);
    expect(result.commanderState.nounDigits[0]).toBe(1);
    expect(result.commanderState.mode).toBe(DskyInputMode.NOUN_DIGIT_2);
  });

  it('pressing digit 6 in NOUN_DIGIT_2 completes noun entry', () => {
    const state = pressSequence([DskyKeyId.NOUN, DskyKeyId.ONE]);
    const result = processKeyPress(state, DskyKeyId.SIX);
    expect(result.commanderState.nounDigits).toEqual([1, 6]);
    expect(result.commanderState.mode).toBe(DskyInputMode.IDLE);
    expect(result.commanderState.nounFlashing).toBe(false);
  });

  it('NOUN-1-6 sequence produces nounDigits=[1,6]', () => {
    const state = pressSequence([DskyKeyId.NOUN, DskyKeyId.ONE, DskyKeyId.SIX]);
    expect(state.nounDigits).toEqual([1, 6]);
  });

  it('pressing NOUN from verb digit entry switches to NOUN_DIGIT_1', () => {
    const state = pressSequence([DskyKeyId.VERB, DskyKeyId.THREE]); // in VERB_DIGIT_2
    const result = processKeyPress(state, DskyKeyId.NOUN);
    expect(result.commanderState.mode).toBe(DskyInputMode.NOUN_DIGIT_1);
  });
});

// ─── Complete VERB/NOUN Command ──────────────────────────────────────────────

describe('complete VERB/NOUN command', () => {
  it('VERB-3-5-NOUN-1-6-ENTR produces command { verb: 35, noun: 16 }', () => {
    const result = pressSequenceResult([
      DskyKeyId.VERB, DskyKeyId.THREE, DskyKeyId.FIVE,
      DskyKeyId.NOUN, DskyKeyId.ONE, DskyKeyId.SIX,
      DskyKeyId.ENTR,
    ]);
    expect(result.command).toEqual({ verb: 35, noun: 16 });
  });

  it('VERB-0-6-ENTR with prior noun produces command', () => {
    // First set noun
    let state = pressSequence([
      DskyKeyId.NOUN, DskyKeyId.ONE, DskyKeyId.SIX,
    ]);
    // Then enter verb and submit
    let result = processKeyPress(state, DskyKeyId.VERB);
    result = processKeyPress(result.commanderState, DskyKeyId.ZERO);
    result = processKeyPress(result.commanderState, DskyKeyId.SIX);
    result = processKeyPress(result.commanderState, DskyKeyId.ENTR);
    expect(result.command).toEqual({ verb: 6, noun: 16 });
  });

  it('ENTR returns null command when verb is incomplete', () => {
    const state = pressSequence([DskyKeyId.VERB, DskyKeyId.THREE]); // only 1 verb digit
    const result = processKeyPress(state, DskyKeyId.ENTR);
    expect(result.command).toBeNull();
    expect(result.commanderState.error).toBe(true);
  });

  it('ENTR in IDLE with no verb/noun sets error', () => {
    const state = createDskyCommanderState();
    const result = processKeyPress(state, DskyKeyId.ENTR);
    expect(result.command).toBeNull();
    expect(result.commanderState.error).toBe(true);
  });
});

// ─── Data Entry Sequences ────────────────────────────────────────────────────

describe('data entry', () => {
  it('V21 ENTR transitions to DATA_SIGN mode targeting R1', () => {
    const result = pressSequenceResult([
      DskyKeyId.VERB, DskyKeyId.TWO, DskyKeyId.ONE,
      DskyKeyId.NOUN, DskyKeyId.ZERO, DskyKeyId.ONE,
      DskyKeyId.ENTR,
    ]);
    expect(result.commanderState.mode).toBe(DskyInputMode.DATA_SIGN);
    expect(result.commanderState.dataRegister).toBe(1);
  });

  it('V22 ENTR transitions to DATA_SIGN targeting R2', () => {
    const result = pressSequenceResult([
      DskyKeyId.VERB, DskyKeyId.TWO, DskyKeyId.TWO,
      DskyKeyId.NOUN, DskyKeyId.ZERO, DskyKeyId.ONE,
      DskyKeyId.ENTR,
    ]);
    expect(result.commanderState.mode).toBe(DskyInputMode.DATA_SIGN);
    expect(result.commanderState.dataRegister).toBe(2);
  });

  it('V23 ENTR transitions to DATA_SIGN targeting R3', () => {
    const result = pressSequenceResult([
      DskyKeyId.VERB, DskyKeyId.TWO, DskyKeyId.THREE,
      DskyKeyId.NOUN, DskyKeyId.ZERO, DskyKeyId.ONE,
      DskyKeyId.ENTR,
    ]);
    expect(result.commanderState.mode).toBe(DskyInputMode.DATA_SIGN);
    expect(result.commanderState.dataRegister).toBe(3);
  });

  it('PLUS in DATA_SIGN sets sign and transitions to DATA_DIGIT_1', () => {
    let state = pressSequence([
      DskyKeyId.VERB, DskyKeyId.TWO, DskyKeyId.ONE,
      DskyKeyId.NOUN, DskyKeyId.ZERO, DskyKeyId.ONE,
      DskyKeyId.ENTR,
    ]);
    const result = processKeyPress(state, DskyKeyId.PLUS);
    expect(result.commanderState.dataSign).toBe('+');
    expect(result.commanderState.mode).toBe(DskyInputMode.DATA_DIGIT_1);
  });

  it('MINUS in DATA_SIGN sets sign and transitions to DATA_DIGIT_1', () => {
    let state = pressSequence([
      DskyKeyId.VERB, DskyKeyId.TWO, DskyKeyId.ONE,
      DskyKeyId.NOUN, DskyKeyId.ZERO, DskyKeyId.ONE,
      DskyKeyId.ENTR,
    ]);
    const result = processKeyPress(state, DskyKeyId.MINUS);
    expect(result.commanderState.dataSign).toBe('-');
    expect(result.commanderState.mode).toBe(DskyInputMode.DATA_DIGIT_1);
  });

  it('full data entry +12345 stores sign and 5 digits', () => {
    const state = pressSequence([
      DskyKeyId.VERB, DskyKeyId.TWO, DskyKeyId.ONE,
      DskyKeyId.NOUN, DskyKeyId.ZERO, DskyKeyId.ONE,
      DskyKeyId.ENTR,
      DskyKeyId.PLUS, DskyKeyId.ONE, DskyKeyId.TWO, DskyKeyId.THREE, DskyKeyId.FOUR, DskyKeyId.FIVE,
    ]);
    expect(state.dataSign).toBe('+');
    expect(state.dataDigits).toEqual([1, 2, 3, 4, 5]);
    expect(state.mode).toBe(DskyInputMode.IDLE);
  });

  it('digits accumulate through DATA_DIGIT_1 to DATA_DIGIT_5', () => {
    let state = pressSequence([
      DskyKeyId.VERB, DskyKeyId.TWO, DskyKeyId.ONE,
      DskyKeyId.NOUN, DskyKeyId.ZERO, DskyKeyId.ONE,
      DskyKeyId.ENTR,
      DskyKeyId.PLUS,
    ]);
    expect(state.mode).toBe(DskyInputMode.DATA_DIGIT_1);

    let result = processKeyPress(state, DskyKeyId.ONE);
    expect(result.commanderState.mode).toBe(DskyInputMode.DATA_DIGIT_2);
    expect(result.commanderState.dataDigits).toEqual([1]);

    result = processKeyPress(result.commanderState, DskyKeyId.TWO);
    expect(result.commanderState.mode).toBe(DskyInputMode.DATA_DIGIT_3);
    expect(result.commanderState.dataDigits).toEqual([1, 2]);

    result = processKeyPress(result.commanderState, DskyKeyId.THREE);
    expect(result.commanderState.mode).toBe(DskyInputMode.DATA_DIGIT_4);
    expect(result.commanderState.dataDigits).toEqual([1, 2, 3]);

    result = processKeyPress(result.commanderState, DskyKeyId.FOUR);
    expect(result.commanderState.mode).toBe(DskyInputMode.DATA_DIGIT_5);
    expect(result.commanderState.dataDigits).toEqual([1, 2, 3, 4]);

    result = processKeyPress(result.commanderState, DskyKeyId.FIVE);
    expect(result.commanderState.mode).toBe(DskyInputMode.IDLE);
    expect(result.commanderState.dataDigits).toEqual([1, 2, 3, 4, 5]);
  });
});

// ─── CLR Key ─────────────────────────────────────────────────────────────────

describe('CLR key', () => {
  it('CLR in IDLE is a no-op', () => {
    const state = createDskyCommanderState();
    const result = processKeyPress(state, DskyKeyId.CLR);
    expect(result.commanderState.mode).toBe(DskyInputMode.IDLE);
  });

  it('CLR during verb digit entry clears verbDigits and restarts', () => {
    const state = pressSequence([DskyKeyId.VERB, DskyKeyId.THREE]); // VERB_DIGIT_2
    const result = processKeyPress(state, DskyKeyId.CLR);
    expect(result.commanderState.verbDigits).toEqual([null, null]);
    expect(result.commanderState.mode).toBe(DskyInputMode.VERB_DIGIT_1);
  });

  it('CLR during noun digit entry clears nounDigits and restarts', () => {
    const state = pressSequence([DskyKeyId.NOUN, DskyKeyId.ONE]); // NOUN_DIGIT_2
    const result = processKeyPress(state, DskyKeyId.CLR);
    expect(result.commanderState.nounDigits).toEqual([null, null]);
    expect(result.commanderState.mode).toBe(DskyInputMode.NOUN_DIGIT_1);
  });

  it('CLR during data entry clears data and returns to DATA_SIGN', () => {
    const state = pressSequence([
      DskyKeyId.VERB, DskyKeyId.TWO, DskyKeyId.ONE,
      DskyKeyId.NOUN, DskyKeyId.ZERO, DskyKeyId.ONE,
      DskyKeyId.ENTR,
      DskyKeyId.PLUS, DskyKeyId.ONE, DskyKeyId.TWO,
    ]);
    const result = processKeyPress(state, DskyKeyId.CLR);
    expect(result.commanderState.dataSign).toBeNull();
    expect(result.commanderState.dataDigits).toEqual([]);
    expect(result.commanderState.mode).toBe(DskyInputMode.DATA_SIGN);
  });
});

// ─── RSET Key ────────────────────────────────────────────────────────────────

describe('RSET key', () => {
  it('RSET clears error flag and returns to IDLE', () => {
    // First cause an error
    const state = createDskyCommanderState();
    let result = processKeyPress(state, DskyKeyId.THREE); // digit in IDLE = error
    expect(result.commanderState.error).toBe(true);
    result = processKeyPress(result.commanderState, DskyKeyId.RSET);
    expect(result.commanderState.error).toBe(false);
    expect(result.commanderState.mode).toBe(DskyInputMode.IDLE);
  });

  it('RSET from any mode returns to IDLE', () => {
    const state = pressSequence([DskyKeyId.VERB, DskyKeyId.THREE]); // VERB_DIGIT_2
    const result = processKeyPress(state, DskyKeyId.RSET);
    expect(result.commanderState.mode).toBe(DskyInputMode.IDLE);
    expect(result.commanderState.error).toBe(false);
  });
});

// ─── KEY_REL Key ─────────────────────────────────────────────────────────────

describe('KEY_REL key', () => {
  it('KEY_REL clears input and returns to IDLE', () => {
    const state = pressSequence([DskyKeyId.VERB, DskyKeyId.THREE]); // VERB_DIGIT_2
    const result = processKeyPress(state, DskyKeyId.KEY_REL);
    expect(result.commanderState.mode).toBe(DskyInputMode.IDLE);
  });

  it('KEY_REL in IDLE is a no-op', () => {
    const state = createDskyCommanderState();
    const result = processKeyPress(state, DskyKeyId.KEY_REL);
    expect(result.commanderState.mode).toBe(DskyInputMode.IDLE);
  });
});

// ─── Error Handling ──────────────────────────────────────────────────────────

describe('error handling', () => {
  it('pressing digit in IDLE mode sets error=true (OPR ERR)', () => {
    const state = createDskyCommanderState();
    const result = processKeyPress(state, DskyKeyId.THREE);
    expect(result.commanderState.error).toBe(true);
  });

  it('pressing ENTR with incomplete verb sets error', () => {
    const state = pressSequence([DskyKeyId.VERB, DskyKeyId.THREE]); // only 1 digit
    const result = processKeyPress(state, DskyKeyId.ENTR);
    expect(result.commanderState.error).toBe(true);
    expect(result.command).toBeNull();
  });

  it('invalid sequences produce error state but do not crash', () => {
    const state = createDskyCommanderState();
    // Press multiple random keys
    let result = processKeyPress(state, DskyKeyId.FIVE);
    result = processKeyPress(result.commanderState, DskyKeyId.ENTR);
    result = processKeyPress(result.commanderState, DskyKeyId.MINUS);
    // Should not throw, state should still be consistent
    expect(result.commanderState).toBeDefined();
    expect(result.commanderState.mode).toBeDefined();
  });
});

// ─── Display Feedback ────────────────────────────────────────────────────────

describe('display feedback during input', () => {
  it('pressing VERB flashes verb register', () => {
    const state = createDskyCommanderState();
    const result = processKeyPress(state, DskyKeyId.VERB);
    expect(result.commanderState.verbFlashing).toBe(true);
  });

  it('verb digits appear in display as typed', () => {
    let state = pressSequence([DskyKeyId.VERB]);
    let result = processKeyPress(state, DskyKeyId.THREE);
    expect(result.displayUpdates.verb).toBeDefined();
    expect(result.displayUpdates.verb!.d1).toBe(3);

    result = processKeyPress(result.commanderState, DskyKeyId.FIVE);
    expect(result.displayUpdates.verb).toBeDefined();
    expect(result.displayUpdates.verb!.d2).toBe(5);
  });

  it('noun digits appear in display as typed', () => {
    let state = pressSequence([DskyKeyId.NOUN]);
    let result = processKeyPress(state, DskyKeyId.ONE);
    expect(result.displayUpdates.noun).toBeDefined();
    expect(result.displayUpdates.noun!.d1).toBe(1);

    result = processKeyPress(result.commanderState, DskyKeyId.SIX);
    expect(result.displayUpdates.noun).toBeDefined();
    expect(result.displayUpdates.noun!.d2).toBe(6);
  });

  it('data entry digits appear in display for target register', () => {
    let state = pressSequence([
      DskyKeyId.VERB, DskyKeyId.TWO, DskyKeyId.ONE,
      DskyKeyId.NOUN, DskyKeyId.ZERO, DskyKeyId.ONE,
      DskyKeyId.ENTR,
      DskyKeyId.PLUS,
    ]);
    const result = processKeyPress(state, DskyKeyId.ONE);
    // Should update R1 since V21 targets R1
    expect(result.displayUpdates.r1).toBeDefined();
  });
});

// ─── Immutability ────────────────────────────────────────────────────────────

describe('immutability', () => {
  it('processKeyPress does not mutate input state', () => {
    const state = createDskyCommanderState();
    const result = processKeyPress(state, DskyKeyId.VERB);
    expect(state.mode).toBe(DskyInputMode.IDLE);
    expect(result.commanderState.mode).toBe(DskyInputMode.VERB_DIGIT_1);
  });
});

// ─── Mode Transitions ────────────────────────────────────────────────────────

describe('mode transitions', () => {
  it('VERB during VERB digit entry restarts verb entry', () => {
    const state = pressSequence([DskyKeyId.VERB, DskyKeyId.THREE]); // VERB_DIGIT_2
    const result = processKeyPress(state, DskyKeyId.VERB);
    expect(result.commanderState.mode).toBe(DskyInputMode.VERB_DIGIT_1);
    expect(result.commanderState.verbDigits).toEqual([null, null]);
  });

  it('NOUN during NOUN digit entry restarts noun entry', () => {
    const state = pressSequence([DskyKeyId.NOUN, DskyKeyId.ONE]); // NOUN_DIGIT_2
    const result = processKeyPress(state, DskyKeyId.NOUN);
    expect(result.commanderState.mode).toBe(DskyInputMode.NOUN_DIGIT_1);
    expect(result.commanderState.nounDigits).toEqual([null, null]);
  });

  it('VERB during NOUN digit entry switches to verb entry', () => {
    const state = pressSequence([DskyKeyId.NOUN, DskyKeyId.ONE]); // NOUN_DIGIT_2
    const result = processKeyPress(state, DskyKeyId.VERB);
    expect(result.commanderState.mode).toBe(DskyInputMode.VERB_DIGIT_1);
  });
});
