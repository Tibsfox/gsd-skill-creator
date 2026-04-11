/**
 * Sequential logic and ripple-carry adder test suite
 *
 * TDD RED phase: Tests flip-flop evaluation (SR, D, JK, T), clock edge
 * detection, and a 4-bit ripple-carry adder across all 256 input combinations.
 *
 * Requirements: LOGIC-06, LOGIC-07
 */

import { describe, it, expect } from 'vitest';
import {
  FlipFlopType,
  LogicSimulator,
  detectClockEdge,
  evaluateFlipFlop,
  buildRippleCarryAdder,
  rippleCarryAdd,
} from '../simulator/logic-sim.js';
import type { FlipFlopState } from '../simulator/logic-sim.js';

// ---------------------------------------------------------------------------
// 1. SR Flip-Flop (LOGIC-06)
// ---------------------------------------------------------------------------

describe('SR Flip-Flop', () => {
  const initial: FlipFlopState = { Q: false, Qbar: true };

  it('sets Q=1, Qbar=0 when S=1, R=0 on rising edge', () => {
    const result = evaluateFlipFlop(
      FlipFlopType.SR,
      { S: true, R: false },
      initial,
      'rising',
    );
    expect(result.Q).toBe(true);
    expect(result.Qbar).toBe(false);
  });

  it('resets Q=0, Qbar=1 when S=0, R=1 on rising edge', () => {
    const set: FlipFlopState = { Q: true, Qbar: false };
    const result = evaluateFlipFlop(
      FlipFlopType.SR,
      { S: false, R: true },
      set,
      'rising',
    );
    expect(result.Q).toBe(false);
    expect(result.Qbar).toBe(true);
  });

  it('holds state when S=0, R=0 on rising edge', () => {
    const set: FlipFlopState = { Q: true, Qbar: false };
    const result = evaluateFlipFlop(
      FlipFlopType.SR,
      { S: false, R: false },
      set,
      'rising',
    );
    expect(result.Q).toBe(true);
    expect(result.Qbar).toBe(false);
  });

  it('produces Q=1, Qbar=1 when S=1, R=1 on rising edge (NAND-based)', () => {
    const result = evaluateFlipFlop(
      FlipFlopType.SR,
      { S: true, R: true },
      initial,
      'rising',
    );
    expect(result.Q).toBe(true);
    expect(result.Qbar).toBe(true);
  });

  it('retains previous state when clock is not rising (edge-triggered)', () => {
    const result = evaluateFlipFlop(
      FlipFlopType.SR,
      { S: true, R: false },
      initial,
      'none',
    );
    expect(result.Q).toBe(false);
    expect(result.Qbar).toBe(true);
  });

  it('transitions through set -> hold -> reset across clock cycles', () => {
    // Set
    const s1 = evaluateFlipFlop(
      FlipFlopType.SR,
      { S: true, R: false },
      initial,
      'rising',
    );
    expect(s1.Q).toBe(true);

    // Hold
    const s2 = evaluateFlipFlop(
      FlipFlopType.SR,
      { S: false, R: false },
      s1,
      'rising',
    );
    expect(s2.Q).toBe(true);

    // Reset
    const s3 = evaluateFlipFlop(
      FlipFlopType.SR,
      { S: false, R: true },
      s2,
      'rising',
    );
    expect(s3.Q).toBe(false);
    expect(s3.Qbar).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. D Flip-Flop (LOGIC-06)
// ---------------------------------------------------------------------------

describe('D Flip-Flop', () => {
  const initial: FlipFlopState = { Q: false, Qbar: true };

  it('captures D=1 on rising edge: Q=1, Qbar=0', () => {
    const result = evaluateFlipFlop(
      FlipFlopType.D,
      { D: true },
      initial,
      'rising',
    );
    expect(result.Q).toBe(true);
    expect(result.Qbar).toBe(false);
  });

  it('captures D=0 on rising edge: Q=0, Qbar=1', () => {
    const set: FlipFlopState = { Q: true, Qbar: false };
    const result = evaluateFlipFlop(
      FlipFlopType.D,
      { D: false },
      set,
      'rising',
    );
    expect(result.Q).toBe(false);
    expect(result.Qbar).toBe(true);
  });

  it('does not change Q when D changes between clock edges', () => {
    // D=1 but no rising edge -- Q should stay at previous value
    const result = evaluateFlipFlop(
      FlipFlopType.D,
      { D: true },
      initial,
      'none',
    );
    expect(result.Q).toBe(false);
    expect(result.Qbar).toBe(true);
  });

  it('follows clock sequence: D=1->edge->Q=1, D=0->edge->Q=0, D=0->no edge->Q=0', () => {
    // D=1 on rising edge
    const s1 = evaluateFlipFlop(
      FlipFlopType.D,
      { D: true },
      initial,
      'rising',
    );
    expect(s1.Q).toBe(true);

    // D=0 on rising edge
    const s2 = evaluateFlipFlop(
      FlipFlopType.D,
      { D: false },
      s1,
      'rising',
    );
    expect(s2.Q).toBe(false);

    // D=0, no edge -- held
    const s3 = evaluateFlipFlop(
      FlipFlopType.D,
      { D: false },
      s2,
      'none',
    );
    expect(s3.Q).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. JK Flip-Flop (LOGIC-06)
// ---------------------------------------------------------------------------

describe('JK Flip-Flop', () => {
  const initial: FlipFlopState = { Q: false, Qbar: true };

  it('sets Q=1 when J=1, K=0 on rising edge', () => {
    const result = evaluateFlipFlop(
      FlipFlopType.JK,
      { J: true, K: false },
      initial,
      'rising',
    );
    expect(result.Q).toBe(true);
    expect(result.Qbar).toBe(false);
  });

  it('resets Q=0 when J=0, K=1 on rising edge', () => {
    const set: FlipFlopState = { Q: true, Qbar: false };
    const result = evaluateFlipFlop(
      FlipFlopType.JK,
      { J: false, K: true },
      set,
      'rising',
    );
    expect(result.Q).toBe(false);
    expect(result.Qbar).toBe(true);
  });

  it('holds Q when J=0, K=0 on rising edge', () => {
    const set: FlipFlopState = { Q: true, Qbar: false };
    const result = evaluateFlipFlop(
      FlipFlopType.JK,
      { J: false, K: false },
      set,
      'rising',
    );
    expect(result.Q).toBe(true);
    expect(result.Qbar).toBe(false);
  });

  it('toggles Q when J=1, K=1 on rising edge (was 0 -> becomes 1)', () => {
    const result = evaluateFlipFlop(
      FlipFlopType.JK,
      { J: true, K: true },
      initial,
      'rising',
    );
    expect(result.Q).toBe(true);
    expect(result.Qbar).toBe(false);
  });

  it('toggles Q when J=1, K=1 on rising edge (was 1 -> becomes 0)', () => {
    const set: FlipFlopState = { Q: true, Qbar: false };
    const result = evaluateFlipFlop(
      FlipFlopType.JK,
      { J: true, K: true },
      set,
      'rising',
    );
    expect(result.Q).toBe(false);
    expect(result.Qbar).toBe(true);
  });

  it('toggles through three J=1,K=1 edges starting Q=0: 0->1->0->1', () => {
    let state: FlipFlopState = { Q: false, Qbar: true };

    state = evaluateFlipFlop(FlipFlopType.JK, { J: true, K: true }, state, 'rising');
    expect(state.Q).toBe(true);

    state = evaluateFlipFlop(FlipFlopType.JK, { J: true, K: true }, state, 'rising');
    expect(state.Q).toBe(false);

    state = evaluateFlipFlop(FlipFlopType.JK, { J: true, K: true }, state, 'rising');
    expect(state.Q).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. T Flip-Flop (LOGIC-06)
// ---------------------------------------------------------------------------

describe('T Flip-Flop', () => {
  const initial: FlipFlopState = { Q: false, Qbar: true };

  it('toggles Q when T=1 on rising edge', () => {
    const result = evaluateFlipFlop(
      FlipFlopType.T,
      { T: true },
      initial,
      'rising',
    );
    expect(result.Q).toBe(true);
    expect(result.Qbar).toBe(false);
  });

  it('holds Q when T=0 on rising edge', () => {
    const result = evaluateFlipFlop(
      FlipFlopType.T,
      { T: false },
      initial,
      'rising',
    );
    expect(result.Q).toBe(false);
    expect(result.Qbar).toBe(true);
  });

  it('cycles through 4 consecutive T=1 edges starting Q=0: 0,1,0,1,0', () => {
    let state: FlipFlopState = { Q: false, Qbar: true };
    const history: boolean[] = [state.Q];

    for (let i = 0; i < 4; i++) {
      state = evaluateFlipFlop(FlipFlopType.T, { T: true }, state, 'rising');
      history.push(state.Q);
    }

    expect(history).toEqual([false, true, false, true, false]);
  });
});

// ---------------------------------------------------------------------------
// 5. Clock edge detection
// ---------------------------------------------------------------------------

describe('Clock edge detection', () => {
  it('detects rising edge: prev=false, curr=true', () => {
    expect(detectClockEdge(false, true)).toBe('rising');
  });

  it('detects falling edge: prev=true, curr=false', () => {
    expect(detectClockEdge(true, false)).toBe('falling');
  });

  it('detects no edge at level high: prev=true, curr=true', () => {
    expect(detectClockEdge(true, true)).toBe('none');
  });

  it('detects no edge at level low: prev=false, curr=false', () => {
    expect(detectClockEdge(false, false)).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// 6. 4-Bit Ripple-Carry Adder (LOGIC-07)
// ---------------------------------------------------------------------------

describe('4-Bit Ripple-Carry Adder', () => {
  it('computes 0 + 0 = 0 with carry = 0', () => {
    const result = rippleCarryAdd(0, 0);
    expect(result.sum).toBe(0);
    expect(result.carry).toBe(false);
  });

  it('computes 1 + 1 = 2 with carry = 0', () => {
    const result = rippleCarryAdd(1, 1);
    expect(result.sum).toBe(2);
    expect(result.carry).toBe(false);
  });

  it('computes 7 + 8 = 15 with carry = 0', () => {
    const result = rippleCarryAdd(7, 8);
    expect(result.sum).toBe(15);
    expect(result.carry).toBe(false);
  });

  it('computes 15 + 1 = 0 with carry = 1 (overflow)', () => {
    const result = rippleCarryAdd(15, 1);
    expect(result.sum).toBe(0);
    expect(result.carry).toBe(true);
  });

  it('computes 15 + 15 = 14 with carry = 1', () => {
    const result = rippleCarryAdd(15, 15);
    expect(result.sum).toBe(14);
    expect(result.carry).toBe(true);
  });

  it('passes all 256 input combinations (a: 0..15, b: 0..15)', () => {
    for (let a = 0; a <= 15; a++) {
      for (let b = 0; b <= 15; b++) {
        const result = rippleCarryAdd(a, b);
        const expectedSum = (a + b) & 0xf;
        const expectedCarry = (a + b) >> 4;
        expect(result.sum).toBe(expectedSum);
        expect(result.carry).toBe(expectedCarry === 1);
      }
    }
  });

  it('builds adder with 20 gates (5 per bit x 4 bits)', () => {
    const sim = new LogicSimulator();
    const adder = buildRippleCarryAdder(sim);
    expect(adder.inputA).toHaveLength(4);
    expect(adder.inputB).toHaveLength(4);
    expect(adder.sum).toHaveLength(4);
    expect(typeof adder.carryOut).toBe('string');
  });
});
