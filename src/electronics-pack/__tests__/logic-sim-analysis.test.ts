/**
 * Truth table generation and timing diagram test suite
 *
 * TDD RED phase: Tests generateTruthTable() and generateTimingDiagram()
 * for combinational circuit analysis and ASCII waveform rendering.
 *
 * Requirements: LOGIC-02, LOGIC-03
 */

import { describe, it, expect } from 'vitest';
import {
  LogicSimulator,
  GateType,
  generateTruthTable,
  generateTimingDiagram,
} from '../simulator/logic-sim.js';
import type { TruthTable, TimingDiagram } from '../simulator/logic-sim.js';

// ---------------------------------------------------------------------------
// Helper: build a fresh simulator with specified gates
// ---------------------------------------------------------------------------

function createNotGateSim(): LogicSimulator {
  const sim = new LogicSimulator();
  sim.addGate({
    id: 'not1',
    type: GateType.NOT,
    inputs: ['A'],
    output: 'Y',
    propagationDelay: 10,
  });
  return sim;
}

function createAndGateSim(): LogicSimulator {
  const sim = new LogicSimulator();
  sim.addGate({
    id: 'and1',
    type: GateType.AND,
    inputs: ['A', 'B'],
    output: 'Y',
    propagationDelay: 10,
  });
  return sim;
}

function createOrGateSim(): LogicSimulator {
  const sim = new LogicSimulator();
  sim.addGate({
    id: 'or1',
    type: GateType.OR,
    inputs: ['A', 'B'],
    output: 'Y',
    propagationDelay: 10,
  });
  return sim;
}

function create3InputNandSim(): LogicSimulator {
  const sim = new LogicSimulator();
  sim.addGate({
    id: 'nand1',
    type: GateType.NAND,
    inputs: ['A', 'B', 'C'],
    output: 'Y',
    propagationDelay: 10,
  });
  return sim;
}

function createHalfAdderSim(): LogicSimulator {
  const sim = new LogicSimulator();
  sim.addGate({
    id: 'xor1',
    type: GateType.XOR,
    inputs: ['A', 'B'],
    output: 'Sum',
    propagationDelay: 10,
  });
  sim.addGate({
    id: 'and1',
    type: GateType.AND,
    inputs: ['A', 'B'],
    output: 'Carry',
    propagationDelay: 10,
  });
  return sim;
}

function create5InputAndSim(): LogicSimulator {
  const sim = new LogicSimulator();
  sim.addGate({
    id: 'and5',
    type: GateType.AND,
    inputs: ['A', 'B', 'C', 'D', 'E'],
    output: 'Y',
    propagationDelay: 10,
  });
  return sim;
}

// ---------------------------------------------------------------------------
// 1. Truth table generation (LOGIC-02)
// ---------------------------------------------------------------------------

describe('Truth Table Generation', () => {
  describe('NOT gate', () => {
    it('produces 2 rows for 1-input gate', () => {
      const sim = createNotGateSim();
      const table = generateTruthTable(sim, ['A'], ['Y']);
      expect(table.rows).toHaveLength(2);
    });

    it('has correct input and output names', () => {
      const sim = createNotGateSim();
      const table = generateTruthTable(sim, ['A'], ['Y']);
      expect(table.inputs).toEqual(['A']);
      expect(table.outputs).toEqual(['Y']);
    });

    it('row 0: A=false -> Y=true', () => {
      const sim = createNotGateSim();
      const table = generateTruthTable(sim, ['A'], ['Y']);
      expect(table.rows[0].inputs).toEqual([false]);
      expect(table.rows[0].outputs).toEqual([true]);
    });

    it('row 1: A=true -> Y=false', () => {
      const sim = createNotGateSim();
      const table = generateTruthTable(sim, ['A'], ['Y']);
      expect(table.rows[1].inputs).toEqual([true]);
      expect(table.rows[1].outputs).toEqual([false]);
    });
  });

  describe('2-input AND gate', () => {
    it('produces 4 rows for 2-input gate', () => {
      const sim = createAndGateSim();
      const table = generateTruthTable(sim, ['A', 'B'], ['Y']);
      expect(table.rows).toHaveLength(4);
    });

    it('rows are in binary counting order', () => {
      const sim = createAndGateSim();
      const table = generateTruthTable(sim, ['A', 'B'], ['Y']);
      // Row 0: 00, Row 1: 01, Row 2: 10, Row 3: 11
      expect(table.rows[0].inputs).toEqual([false, false]);
      expect(table.rows[1].inputs).toEqual([false, true]);
      expect(table.rows[2].inputs).toEqual([true, false]);
      expect(table.rows[3].inputs).toEqual([true, true]);
    });

    it('outputs correct AND results', () => {
      const sim = createAndGateSim();
      const table = generateTruthTable(sim, ['A', 'B'], ['Y']);
      expect(table.rows[0].outputs).toEqual([false]); // 0 AND 0 = 0
      expect(table.rows[1].outputs).toEqual([false]); // 0 AND 1 = 0
      expect(table.rows[2].outputs).toEqual([false]); // 1 AND 0 = 0
      expect(table.rows[3].outputs).toEqual([true]);  // 1 AND 1 = 1
    });
  });

  describe('2-input OR gate', () => {
    it('produces 4 rows with correct OR results', () => {
      const sim = createOrGateSim();
      const table = generateTruthTable(sim, ['A', 'B'], ['Y']);
      expect(table.rows).toHaveLength(4);
      expect(table.rows[0].outputs).toEqual([false]); // 0 OR 0 = 0
      expect(table.rows[1].outputs).toEqual([true]);  // 0 OR 1 = 1
      expect(table.rows[2].outputs).toEqual([true]);  // 1 OR 0 = 1
      expect(table.rows[3].outputs).toEqual([true]);  // 1 OR 1 = 1
    });
  });

  describe('3-input NAND gate', () => {
    it('produces 8 rows for 3-input gate', () => {
      const sim = create3InputNandSim();
      const table = generateTruthTable(sim, ['A', 'B', 'C'], ['Y']);
      expect(table.rows).toHaveLength(8);
    });

    it('only row (1,1,1) produces false', () => {
      const sim = create3InputNandSim();
      const table = generateTruthTable(sim, ['A', 'B', 'C'], ['Y']);
      // NAND is true for all except all-true
      for (let i = 0; i < 7; i++) {
        expect(table.rows[i].outputs).toEqual([true]);
      }
      expect(table.rows[7].outputs).toEqual([false]); // (1,1,1) -> 0
    });
  });

  describe('Half adder (XOR + AND)', () => {
    it('produces 4 rows with Sum and Carry columns', () => {
      const sim = createHalfAdderSim();
      const table = generateTruthTable(sim, ['A', 'B'], ['Sum', 'Carry']);
      expect(table.rows).toHaveLength(4);
      expect(table.outputs).toEqual(['Sum', 'Carry']);
    });

    it('(0,0) -> Sum=0, Carry=0', () => {
      const sim = createHalfAdderSim();
      const table = generateTruthTable(sim, ['A', 'B'], ['Sum', 'Carry']);
      expect(table.rows[0].outputs).toEqual([false, false]);
    });

    it('(0,1) -> Sum=1, Carry=0', () => {
      const sim = createHalfAdderSim();
      const table = generateTruthTable(sim, ['A', 'B'], ['Sum', 'Carry']);
      expect(table.rows[1].outputs).toEqual([true, false]);
    });

    it('(1,0) -> Sum=1, Carry=0', () => {
      const sim = createHalfAdderSim();
      const table = generateTruthTable(sim, ['A', 'B'], ['Sum', 'Carry']);
      expect(table.rows[2].outputs).toEqual([true, false]);
    });

    it('(1,1) -> Sum=0, Carry=1', () => {
      const sim = createHalfAdderSim();
      const table = generateTruthTable(sim, ['A', 'B'], ['Sum', 'Carry']);
      expect(table.rows[3].outputs).toEqual([false, true]);
    });
  });

  describe('render()', () => {
    it('produces ASCII table with header row', () => {
      const sim = createAndGateSim();
      const table = generateTruthTable(sim, ['A', 'B'], ['Y']);
      const rendered = table.render();
      expect(rendered).toContain('A');
      expect(rendered).toContain('B');
      expect(rendered).toContain('Y');
    });

    it('produces separator row with dashes', () => {
      const sim = createAndGateSim();
      const table = generateTruthTable(sim, ['A', 'B'], ['Y']);
      const rendered = table.render();
      expect(rendered).toContain('---');
    });

    it('renders half adder truth table with aligned columns', () => {
      const sim = createHalfAdderSim();
      const table = generateTruthTable(sim, ['A', 'B'], ['Sum', 'Carry']);
      const rendered = table.render();
      const lines = rendered.trim().split('\n');
      // Header + separator + 4 data rows = 6 lines
      expect(lines.length).toBe(6);
      // All lines should contain pipe separators
      for (const line of lines) {
        expect(line).toContain('|');
      }
    });

    it('uses 0 and 1 to represent boolean values', () => {
      const sim = createNotGateSim();
      const table = generateTruthTable(sim, ['A'], ['Y']);
      const rendered = table.render();
      expect(rendered).toMatch(/\b0\b/);
      expect(rendered).toMatch(/\b1\b/);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Timing diagram generation (LOGIC-03)
// ---------------------------------------------------------------------------

describe('Timing Diagram Generation', () => {
  describe('NOT gate with propagation delay', () => {
    it('records waveform for all specified signals', () => {
      const sim = createNotGateSim();
      const inputSeq: Record<string, boolean>[] = [
        { A: false },
        { A: false },
        { A: true },
        { A: true },
        { A: false },
      ];
      const diagram = generateTimingDiagram(sim, inputSeq, ['A', 'Y']);
      expect(diagram.signals).toEqual(['A', 'Y']);
      expect(diagram.waveforms['A']).toBeDefined();
      expect(diagram.waveforms['Y']).toBeDefined();
    });

    it('records correct number of time steps', () => {
      const sim = createNotGateSim();
      const inputSeq: Record<string, boolean>[] = [
        { A: false },
        { A: false },
        { A: true },
        { A: true },
        { A: false },
      ];
      const diagram = generateTimingDiagram(sim, inputSeq, ['A', 'Y']);
      expect(diagram.timeSteps).toBe(5);
      expect(diagram.waveforms['A']).toHaveLength(5);
      expect(diagram.waveforms['Y']).toHaveLength(5);
    });

    it('input waveform matches input sequence', () => {
      const sim = createNotGateSim();
      const inputSeq: Record<string, boolean>[] = [
        { A: false },
        { A: true },
        { A: true },
        { A: false },
      ];
      const diagram = generateTimingDiagram(sim, inputSeq, ['A', 'Y']);
      expect(diagram.waveforms['A']).toEqual([false, true, true, false]);
    });

    it('output shows propagation delay (Y lags A by 1 step)', () => {
      const sim = createNotGateSim();
      const inputSeq: Record<string, boolean>[] = [
        { A: false },
        { A: true },
        { A: true },
        { A: false },
      ];
      const diagram = generateTimingDiagram(sim, inputSeq, ['A', 'Y']);
      // At t=0, Y reflects initial state (not yet evaluated) => false
      // At t=1, Y reflects NOT(A@t=0) = NOT(false) = true
      // At t=2, Y reflects NOT(A@t=1) = NOT(true) = false
      // At t=3, Y reflects NOT(A@t=2) = NOT(true) = false
      expect(diagram.waveforms['Y'][0]).toBe(false);
      expect(diagram.waveforms['Y'][1]).toBe(true);
      expect(diagram.waveforms['Y'][2]).toBe(false);
      expect(diagram.waveforms['Y'][3]).toBe(false);
    });
  });

  describe('AND gate timing', () => {
    it('output responds to input changes after delay', () => {
      const sim = createAndGateSim();
      const inputSeq: Record<string, boolean>[] = [
        { A: false, B: false },
        { A: true, B: false },
        { A: true, B: true },
        { A: true, B: true },
      ];
      const diagram = generateTimingDiagram(sim, inputSeq, ['A', 'B', 'Y']);
      // At t=0: A=0, B=0, Y starts false
      // At t=1: inputs set A=1,B=0, then step -> Y=AND(A@t=0,B@t=0)=0
      // At t=2: inputs set A=1,B=1, then step -> Y=AND(A@t=1,B@t=1)=0
      // At t=3: inputs set A=1,B=1, then step -> Y=AND(A@t=2,B@t=2)=1
      expect(diagram.waveforms['Y'][0]).toBe(false);
      expect(diagram.waveforms['Y'][1]).toBe(false);
      expect(diagram.waveforms['Y'][2]).toBe(false);
      expect(diagram.waveforms['Y'][3]).toBe(true);
    });
  });

  describe('render()', () => {
    it('produces ASCII waveform with signal labels', () => {
      const sim = createNotGateSim();
      const inputSeq: Record<string, boolean>[] = [
        { A: false },
        { A: true },
        { A: false },
      ];
      const diagram = generateTimingDiagram(sim, inputSeq, ['A', 'Y']);
      const rendered = diagram.render();
      expect(rendered).toContain('A');
      expect(rendered).toContain('Y');
    });

    it('uses _ for low and ^ for high', () => {
      const sim = createNotGateSim();
      const inputSeq: Record<string, boolean>[] = [
        { A: false },
        { A: true },
        { A: false },
      ];
      const diagram = generateTimingDiagram(sim, inputSeq, ['A', 'Y']);
      const rendered = diagram.render();
      expect(rendered).toContain('_');
      expect(rendered).toContain('^');
    });

    it('each signal is on its own line', () => {
      const sim = createAndGateSim();
      const inputSeq: Record<string, boolean>[] = [
        { A: false, B: true },
        { A: true, B: true },
      ];
      const diagram = generateTimingDiagram(sim, inputSeq, ['A', 'B', 'Y']);
      const rendered = diagram.render();
      const lines = rendered.trim().split('\n');
      // At least one line per signal
      expect(lines.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('cascaded gates', () => {
    it('shows cumulative delay through 2 gates', () => {
      const sim = new LogicSimulator();
      // NOT: A -> notA
      sim.addGate({
        id: 'not1',
        type: GateType.NOT,
        inputs: ['A'],
        output: 'notA',
        propagationDelay: 10,
      });
      // AND: notA, B -> Y
      sim.addGate({
        id: 'and1',
        type: GateType.AND,
        inputs: ['notA', 'B'],
        output: 'Y',
        propagationDelay: 10,
      });

      const inputSeq: Record<string, boolean>[] = [
        { A: false, B: true },
        { A: false, B: true },
        { A: false, B: true },
        { A: true, B: true },
        { A: true, B: true },
        { A: true, B: true },
      ];
      const diagram = generateTimingDiagram(sim, inputSeq, ['A', 'notA', 'Y']);
      // notA should reflect NOT(A) with 1-step delay
      // Y should reflect AND(notA, B) with another 1-step delay (2 total from A change)
      expect(diagram.waveforms['notA']).toBeDefined();
      expect(diagram.waveforms['Y']).toBeDefined();
      expect(diagram.timeSteps).toBe(6);
    });
  });

  describe('input sequence format', () => {
    it('accepts Record<string, boolean>[] for multi-input circuits', () => {
      const sim = createAndGateSim();
      const inputSeq: Record<string, boolean>[] = [
        { A: false, B: false },
        { A: true, B: false },
        { A: true, B: true },
      ];
      const diagram = generateTimingDiagram(sim, inputSeq, ['A', 'B', 'Y']);
      expect(diagram.timeSteps).toBe(3);
    });
  });

  describe('options', () => {
    it('respects maxTime option', () => {
      const sim = createNotGateSim();
      const inputSeq: Record<string, boolean>[] = [
        { A: false },
        { A: true },
      ];
      const diagram = generateTimingDiagram(sim, inputSeq, ['A', 'Y'], {
        maxTime: 50,
      });
      expect(diagram.timeSteps).toBe(2);
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Edge cases
// ---------------------------------------------------------------------------

describe('Edge Cases', () => {
  it('truth table with no gates returns identity mapping', () => {
    const sim = new LogicSimulator();
    // No gates, input A maps to output A directly
    const table = generateTruthTable(sim, ['A'], ['A']);
    expect(table.rows).toHaveLength(2);
    // With no gates, output = signal value (identity)
    expect(table.rows[0].outputs).toEqual([false]);
    expect(table.rows[1].outputs).toEqual([true]);
  });

  it('timing diagram with zero-length input sequence returns empty waveform', () => {
    const sim = createNotGateSim();
    const diagram = generateTimingDiagram(sim, [], ['A', 'Y']);
    expect(diagram.timeSteps).toBe(0);
    expect(diagram.waveforms['A']).toHaveLength(0);
    expect(diagram.waveforms['Y']).toHaveLength(0);
  });

  it('truth table with 5 inputs produces 32 rows', () => {
    const sim = create5InputAndSim();
    const table = generateTruthTable(
      sim,
      ['A', 'B', 'C', 'D', 'E'],
      ['Y'],
    );
    expect(table.rows).toHaveLength(32);
    // Only the last row (all true) should output true for AND
    for (let i = 0; i < 31; i++) {
      expect(table.rows[i].outputs).toEqual([false]);
    }
    expect(table.rows[31].outputs).toEqual([true]);
  });
});
