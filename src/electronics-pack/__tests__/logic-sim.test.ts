/**
 * LogicSimulator core test suite
 *
 * TDD RED phase: Tests gate evaluation (all 8 types), step/evaluate cycle,
 * oscillation detection, multi-level propagation, and MOSFET-level gate internals.
 *
 * Requirements: LOGIC-01, LOGIC-04, LOGIC-05
 */

import { describe, it, expect } from 'vitest';
import {
  LogicSimulator,
  GateType,
  LogicGate,
  evaluateGate,
  getGateInternals,
} from '../simulator/logic-sim.js';

// ---------------------------------------------------------------------------
// 1. Gate evaluation -- all 8 types (LOGIC-01)
// ---------------------------------------------------------------------------

describe('evaluateGate', () => {
  describe('AND gate', () => {
    it('returns false for (0,0)', () => {
      expect(evaluateGate(GateType.AND, [false, false])).toBe(false);
    });
    it('returns false for (0,1)', () => {
      expect(evaluateGate(GateType.AND, [false, true])).toBe(false);
    });
    it('returns false for (1,0)', () => {
      expect(evaluateGate(GateType.AND, [true, false])).toBe(false);
    });
    it('returns true for (1,1)', () => {
      expect(evaluateGate(GateType.AND, [true, true])).toBe(true);
    });
    it('returns false for 3-input (1,1,0)', () => {
      expect(evaluateGate(GateType.AND, [true, true, false])).toBe(false);
    });
    it('returns true for 3-input (1,1,1)', () => {
      expect(evaluateGate(GateType.AND, [true, true, true])).toBe(true);
    });
  });

  describe('OR gate', () => {
    it('returns false for (0,0)', () => {
      expect(evaluateGate(GateType.OR, [false, false])).toBe(false);
    });
    it('returns true for (0,1)', () => {
      expect(evaluateGate(GateType.OR, [false, true])).toBe(true);
    });
    it('returns true for (1,0)', () => {
      expect(evaluateGate(GateType.OR, [true, false])).toBe(true);
    });
    it('returns true for (1,1)', () => {
      expect(evaluateGate(GateType.OR, [true, true])).toBe(true);
    });
    it('returns true for 3-input (0,0,1)', () => {
      expect(evaluateGate(GateType.OR, [false, false, true])).toBe(true);
    });
  });

  describe('NOT gate', () => {
    it('returns true for (0)', () => {
      expect(evaluateGate(GateType.NOT, [false])).toBe(true);
    });
    it('returns false for (1)', () => {
      expect(evaluateGate(GateType.NOT, [true])).toBe(false);
    });
  });

  describe('NAND gate', () => {
    it('returns true for (0,0)', () => {
      expect(evaluateGate(GateType.NAND, [false, false])).toBe(true);
    });
    it('returns true for (0,1)', () => {
      expect(evaluateGate(GateType.NAND, [false, true])).toBe(true);
    });
    it('returns true for (1,0)', () => {
      expect(evaluateGate(GateType.NAND, [true, false])).toBe(true);
    });
    it('returns false for (1,1)', () => {
      expect(evaluateGate(GateType.NAND, [true, true])).toBe(false);
    });
  });

  describe('NOR gate', () => {
    it('returns true for (0,0)', () => {
      expect(evaluateGate(GateType.NOR, [false, false])).toBe(true);
    });
    it('returns false for (0,1)', () => {
      expect(evaluateGate(GateType.NOR, [false, true])).toBe(false);
    });
    it('returns false for (1,0)', () => {
      expect(evaluateGate(GateType.NOR, [true, false])).toBe(false);
    });
    it('returns false for (1,1)', () => {
      expect(evaluateGate(GateType.NOR, [true, true])).toBe(false);
    });
  });

  describe('XOR gate', () => {
    it('returns false for (0,0)', () => {
      expect(evaluateGate(GateType.XOR, [false, false])).toBe(false);
    });
    it('returns true for (0,1)', () => {
      expect(evaluateGate(GateType.XOR, [false, true])).toBe(true);
    });
    it('returns true for (1,0)', () => {
      expect(evaluateGate(GateType.XOR, [true, false])).toBe(true);
    });
    it('returns false for (1,1)', () => {
      expect(evaluateGate(GateType.XOR, [true, true])).toBe(false);
    });
    it('returns true for 3-input (1,1,1) -- odd parity', () => {
      expect(evaluateGate(GateType.XOR, [true, true, true])).toBe(true);
    });
  });

  describe('XNOR gate', () => {
    it('returns true for (0,0)', () => {
      expect(evaluateGate(GateType.XNOR, [false, false])).toBe(true);
    });
    it('returns false for (0,1)', () => {
      expect(evaluateGate(GateType.XNOR, [false, true])).toBe(false);
    });
    it('returns false for (1,0)', () => {
      expect(evaluateGate(GateType.XNOR, [true, false])).toBe(false);
    });
    it('returns true for (1,1)', () => {
      expect(evaluateGate(GateType.XNOR, [true, true])).toBe(true);
    });
    it('returns false for 3-input (1,1,1) -- even parity', () => {
      expect(evaluateGate(GateType.XNOR, [true, true, true])).toBe(false);
    });
  });

  describe('BUF gate', () => {
    it('returns false for (0)', () => {
      expect(evaluateGate(GateType.BUF, [false])).toBe(false);
    });
    it('returns true for (1)', () => {
      expect(evaluateGate(GateType.BUF, [true])).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('throws on empty inputs', () => {
      expect(() => evaluateGate(GateType.AND, [])).toThrow();
    });
  });
});

// ---------------------------------------------------------------------------
// 2. LogicSimulator.step() (LOGIC-05)
// ---------------------------------------------------------------------------

describe('LogicSimulator.step()', () => {
  it('evaluates first-level gate outputs after one step', () => {
    const sim = new LogicSimulator();
    // NOT gate: input A -> output notA
    sim.addGate({
      id: 'not1',
      type: GateType.NOT,
      inputs: ['A'],
      output: 'notA',
      propagationDelay: 10,
    });
    // AND gate: notA, B -> output Y
    sim.addGate({
      id: 'and1',
      type: GateType.AND,
      inputs: ['notA', 'B'],
      output: 'Y',
      propagationDelay: 10,
    });

    sim.setSignal('A', false);
    sim.setSignal('B', true);

    const s1 = sim.step();
    // After one step, NOT gate evaluates: notA = true
    // AND gate also evaluates with current notA (now true) and B (true) -> Y = true
    expect(s1.signals['notA']).toBe(true);
  });

  it('advances state.time by propagation delay', () => {
    const sim = new LogicSimulator();
    sim.addGate({
      id: 'buf1',
      type: GateType.BUF,
      inputs: ['A'],
      output: 'Y',
      propagationDelay: 10,
    });
    sim.setSignal('A', true);

    const s0 = sim.getState();
    expect(s0.time).toBe(0);

    const s1 = sim.step();
    expect(s1.time).toBe(10);
  });

  it('returns new LogicState with updated signals', () => {
    const sim = new LogicSimulator();
    sim.addGate({
      id: 'not1',
      type: GateType.NOT,
      inputs: ['A'],
      output: 'Y',
      propagationDelay: 10,
    });
    sim.setSignal('A', false);

    const result = sim.step();
    expect(result.signals['Y']).toBe(true);
    expect(result.signals['A']).toBe(false); // input unchanged
  });

  it('does not modify input signals', () => {
    const sim = new LogicSimulator();
    sim.addGate({
      id: 'and1',
      type: GateType.AND,
      inputs: ['A', 'B'],
      output: 'Y',
      propagationDelay: 10,
    });
    sim.setSignal('A', true);
    sim.setSignal('B', false);

    sim.step();
    const state = sim.getState();
    expect(state.signals['A']).toBe(true);
    expect(state.signals['B']).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. LogicSimulator.evaluate() (LOGIC-05)
// ---------------------------------------------------------------------------

describe('LogicSimulator.evaluate()', () => {
  it('settles a 3-gate cascade: NOT -> AND -> OR', () => {
    const sim = new LogicSimulator();
    // NOT: A -> notA
    sim.addGate({
      id: 'not1',
      type: GateType.NOT,
      inputs: ['A'],
      output: 'notA',
      propagationDelay: 10,
    });
    // AND: notA, B -> andOut
    sim.addGate({
      id: 'and1',
      type: GateType.AND,
      inputs: ['notA', 'B'],
      output: 'andOut',
      propagationDelay: 10,
    });
    // OR: andOut, C -> Y
    sim.addGate({
      id: 'or1',
      type: GateType.OR,
      inputs: ['andOut', 'C'],
      output: 'Y',
      propagationDelay: 10,
    });

    // A=0 -> notA=1, B=1 -> andOut=1, C=0 -> Y=1
    sim.setSignal('A', false);
    sim.setSignal('B', true);
    sim.setSignal('C', false);

    const result = sim.evaluate();
    expect(result.signals['notA']).toBe(true);
    expect(result.signals['andOut']).toBe(true);
    expect(result.signals['Y']).toBe(true);
  });

  it('returns input state unchanged with no gates', () => {
    const sim = new LogicSimulator();
    sim.setSignal('A', true);
    sim.setSignal('B', false);

    const result = sim.evaluate();
    expect(result.signals['A']).toBe(true);
    expect(result.signals['B']).toBe(false);
  });

  it('detects oscillation in a NOT -> NOT feedback loop', () => {
    const sim = new LogicSimulator();
    // NOT1: X -> Y
    sim.addGate({
      id: 'not1',
      type: GateType.NOT,
      inputs: ['X'],
      output: 'Y',
      propagationDelay: 10,
    });
    // NOT2: Y -> X  (feedback loop)
    sim.addGate({
      id: 'not2',
      type: GateType.NOT,
      inputs: ['Y'],
      output: 'X',
      propagationDelay: 10,
    });

    sim.setSignal('X', false);

    expect(() => sim.evaluate()).toThrow(/[Oo]scillation/);
  });
});

// ---------------------------------------------------------------------------
// 4. Multi-level propagation
// ---------------------------------------------------------------------------

describe('Multi-level propagation', () => {
  it('evaluates a 4-bit AND tree correctly (all true)', () => {
    const sim = new LogicSimulator();
    // Level 1: AND(A,B) -> ab, AND(C,D) -> cd
    sim.addGate({
      id: 'and_ab',
      type: GateType.AND,
      inputs: ['A', 'B'],
      output: 'ab',
      propagationDelay: 10,
    });
    sim.addGate({
      id: 'and_cd',
      type: GateType.AND,
      inputs: ['C', 'D'],
      output: 'cd',
      propagationDelay: 10,
    });
    // Level 2: AND(ab, cd) -> Y
    sim.addGate({
      id: 'and_final',
      type: GateType.AND,
      inputs: ['ab', 'cd'],
      output: 'Y',
      propagationDelay: 10,
    });

    sim.setSignal('A', true);
    sim.setSignal('B', true);
    sim.setSignal('C', true);
    sim.setSignal('D', true);

    const result = sim.evaluate();
    expect(result.signals['Y']).toBe(true);
  });

  it('evaluates a 4-bit AND tree correctly (one false)', () => {
    const sim = new LogicSimulator();
    sim.addGate({
      id: 'and_ab',
      type: GateType.AND,
      inputs: ['A', 'B'],
      output: 'ab',
      propagationDelay: 10,
    });
    sim.addGate({
      id: 'and_cd',
      type: GateType.AND,
      inputs: ['C', 'D'],
      output: 'cd',
      propagationDelay: 10,
    });
    sim.addGate({
      id: 'and_final',
      type: GateType.AND,
      inputs: ['ab', 'cd'],
      output: 'Y',
      propagationDelay: 10,
    });

    sim.setSignal('A', true);
    sim.setSignal('B', true);
    sim.setSignal('C', false); // one false
    sim.setSignal('D', true);

    const result = sim.evaluate();
    expect(result.signals['Y']).toBe(false);
  });

  it('builds XOR from 4 NAND gates and verifies truth table', () => {
    // XOR(A,B) = NAND(NAND(A, NAND(A,B)), NAND(B, NAND(A,B)))
    const sim = new LogicSimulator();

    // NAND1: A,B -> nab
    sim.addGate({
      id: 'nand1',
      type: GateType.NAND,
      inputs: ['A', 'B'],
      output: 'nab',
      propagationDelay: 10,
    });
    // NAND2: A, nab -> n2
    sim.addGate({
      id: 'nand2',
      type: GateType.NAND,
      inputs: ['A', 'nab'],
      output: 'n2',
      propagationDelay: 10,
    });
    // NAND3: B, nab -> n3
    sim.addGate({
      id: 'nand3',
      type: GateType.NAND,
      inputs: ['B', 'nab'],
      output: 'n3',
      propagationDelay: 10,
    });
    // NAND4: n2, n3 -> Y
    sim.addGate({
      id: 'nand4',
      type: GateType.NAND,
      inputs: ['n2', 'n3'],
      output: 'Y',
      propagationDelay: 10,
    });

    // Test all 4 input combos
    const truthTable: [boolean, boolean, boolean][] = [
      [false, false, false],
      [false, true, true],
      [true, false, true],
      [true, true, false],
    ];

    for (const [a, b, expected] of truthTable) {
      sim.reset();
      sim.setSignal('A', a);
      sim.setSignal('B', b);
      const result = sim.evaluate();
      expect(result.signals['Y']).toBe(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Gate internals -- MOSFET descriptions (LOGIC-04)
// ---------------------------------------------------------------------------

describe('getGateInternals', () => {
  it('returns correct MOSFET count for NOT (2)', () => {
    const info = getGateInternals(GateType.NOT);
    expect(info.mosfetCount).toBe(2);
  });

  it('returns correct MOSFET count for NAND (4)', () => {
    const info = getGateInternals(GateType.NAND);
    expect(info.mosfetCount).toBe(4);
  });

  it('returns correct MOSFET count for AND (6)', () => {
    const info = getGateInternals(GateType.AND);
    expect(info.mosfetCount).toBe(6);
  });

  it('returns correct MOSFET count for NOR (4)', () => {
    const info = getGateInternals(GateType.NOR);
    expect(info.mosfetCount).toBe(4);
  });

  it('returns correct MOSFET count for OR (6)', () => {
    const info = getGateInternals(GateType.OR);
    expect(info.mosfetCount).toBe(6);
  });

  it('returns correct MOSFET count for XOR (12)', () => {
    const info = getGateInternals(GateType.XOR);
    expect(info.mosfetCount).toBe(12);
  });

  it('returns correct MOSFET count for XNOR (12)', () => {
    const info = getGateInternals(GateType.XNOR);
    expect(info.mosfetCount).toBe(12);
  });

  it('returns correct MOSFET count for BUF (4)', () => {
    const info = getGateInternals(GateType.BUF);
    expect(info.mosfetCount).toBe(4);
  });

  it('returns pullUpNetwork and pullDownNetwork for NAND', () => {
    const info = getGateInternals(GateType.NAND);
    expect(info.pullUpNetwork).toMatch(/parallel/i);
    expect(info.pullDownNetwork).toMatch(/series/i);
  });

  it('returns pullUpNetwork and pullDownNetwork for NOR', () => {
    const info = getGateInternals(GateType.NOR);
    expect(info.pullUpNetwork).toMatch(/series/i);
    expect(info.pullDownNetwork).toMatch(/parallel/i);
  });

  it('returns non-empty description for all 8 gate types', () => {
    const allTypes = [
      GateType.AND,
      GateType.OR,
      GateType.NOT,
      GateType.NAND,
      GateType.NOR,
      GateType.XOR,
      GateType.XNOR,
      GateType.BUF,
    ];
    for (const t of allTypes) {
      const info = getGateInternals(t);
      expect(info).toBeDefined();
      expect(info.gateType).toBe(t);
      expect(info.description).toBeTruthy();
      expect(info.pullUpNetwork).toBeTruthy();
      expect(info.pullDownNetwork).toBeTruthy();
    }
  });
});
