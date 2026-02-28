/**
 * AGC timing model tests.
 *
 * Covers: clock constants, instruction MCT table, timing state,
 * time conversion functions, real-time calculations.
 */

import { describe, it, expect } from 'vitest';
import {
  CLOCK_MHZ,
  MCT_PERIOD_US,
  INSTRUCTION_MCTS,
  getInstructionMCTs,
  createTimingState,
  advanceTiming,
  mctsToMicroseconds,
  mctsToMilliseconds,
  mctsToSeconds,
  secondsToMCTs,
} from '../timing.js';

describe('constants', () => {
  it('CLOCK_MHZ is 2.048', () => {
    expect(CLOCK_MHZ).toBe(2.048);
  });

  it('MCT_PERIOD_US is 11.72', () => {
    expect(MCT_PERIOD_US).toBe(11.72);
  });
});

describe('instruction timing table', () => {
  it('TC = 1 MCT', () => {
    expect(INSTRUCTION_MCTS['TC']).toBe(1);
  });

  it('CCS = 2 MCTs', () => {
    expect(INSTRUCTION_MCTS['CCS']).toBe(2);
  });

  it('TCF = 1 MCT', () => {
    expect(INSTRUCTION_MCTS['TCF']).toBe(1);
  });

  it('DAS = 3 MCTs', () => {
    expect(INSTRUCTION_MCTS['DAS']).toBe(3);
  });

  it('DV = 6 MCTs', () => {
    expect(INSTRUCTION_MCTS['DV']).toBe(6);
  });

  it('MP = 3 MCTs', () => {
    expect(INSTRUCTION_MCTS['MP']).toBe(3);
  });

  it('INHINT = 1 MCT', () => {
    expect(INSTRUCTION_MCTS['INHINT']).toBe(1);
  });

  it('RELINT = 1 MCT', () => {
    expect(INSTRUCTION_MCTS['RELINT']).toBe(1);
  });

  it('EXTEND = 1 MCT', () => {
    expect(INSTRUCTION_MCTS['EXTEND']).toBe(1);
  });

  it('RESUME = 2 MCTs', () => {
    expect(INSTRUCTION_MCTS['RESUME']).toBe(2);
  });

  it('all I/O instructions are 2 MCTs', () => {
    for (const io of ['READ', 'WRITE', 'RAND', 'WAND', 'ROR', 'WOR', 'RXOR']) {
      expect(INSTRUCTION_MCTS[io]).toBe(2);
    }
  });

  it('CA = 2, CS = 2, AD = 2, MASK = 2', () => {
    expect(INSTRUCTION_MCTS['CA']).toBe(2);
    expect(INSTRUCTION_MCTS['CS']).toBe(2);
    expect(INSTRUCTION_MCTS['AD']).toBe(2);
    expect(INSTRUCTION_MCTS['MASK']).toBe(2);
  });

  it('DXCH = 3, DCA = 3, DCS = 3', () => {
    expect(INSTRUCTION_MCTS['DXCH']).toBe(3);
    expect(INSTRUCTION_MCTS['DCA']).toBe(3);
    expect(INSTRUCTION_MCTS['DCS']).toBe(3);
  });

  it('getInstructionMCTs returns value from table', () => {
    expect(getInstructionMCTs('TC')).toBe(1);
    expect(getInstructionMCTs('DV')).toBe(6);
  });

  it('getInstructionMCTs returns 2 for unknown instructions', () => {
    expect(getInstructionMCTs('UNKNOWN')).toBe(2);
    expect(getInstructionMCTs('FAKE')).toBe(2);
  });
});

describe('timing state', () => {
  it('createTimingState returns totalMCTs=0', () => {
    const state = createTimingState();
    expect(state.totalMCTs).toBe(0);
  });

  it('advanceTiming adds MCTs consumed', () => {
    let state = createTimingState();
    state = advanceTiming(state, 10);
    expect(state.totalMCTs).toBe(10);
    state = advanceTiming(state, 5);
    expect(state.totalMCTs).toBe(15);
  });
});

describe('time conversion', () => {
  it('mctsToMicroseconds: mcts * MCT_PERIOD_US', () => {
    expect(mctsToMicroseconds(1)).toBeCloseTo(11.72, 2);
    expect(mctsToMicroseconds(100)).toBeCloseTo(1172, 1);
  });

  it('mctsToMilliseconds: mcts * MCT_PERIOD_US / 1000', () => {
    expect(mctsToMilliseconds(1000)).toBeCloseTo(11.72, 2);
  });

  it('mctsToSeconds: mcts * MCT_PERIOD_US / 1_000_000', () => {
    expect(mctsToSeconds(85324)).toBeCloseTo(1.0, 0);
  });

  it('secondsToMCTs: seconds * 1_000_000 / MCT_PERIOD_US', () => {
    expect(secondsToMCTs(1)).toBeCloseTo(85324, -1);
  });
});

describe('real-time calculations', () => {
  it('1 second of AGC time is approximately 85324 MCTs', () => {
    const mctsPerSecond = 1_000_000 / MCT_PERIOD_US;
    expect(mctsPerSecond).toBeCloseTo(85324, -1);
  });

  it('TC instruction (1 MCT) takes 11.72 us', () => {
    expect(mctsToMicroseconds(getInstructionMCTs('TC'))).toBeCloseTo(11.72, 2);
  });

  it('DV instruction (6 MCTs) takes 70.32 us', () => {
    expect(mctsToMicroseconds(getInstructionMCTs('DV'))).toBeCloseTo(70.32, 2);
  });

  it('1000 TC instructions = 11.72 ms of simulated time', () => {
    const totalMCTs = 1000 * getInstructionMCTs('TC');
    expect(mctsToMilliseconds(totalMCTs)).toBeCloseTo(11.72, 2);
  });
});
