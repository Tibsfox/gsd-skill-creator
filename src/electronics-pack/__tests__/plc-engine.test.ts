/**
 * PLC Engine Test Suite
 *
 * Validates ladder logic parser/evaluator, PID controller,
 * scan cycle model, and Modbus register abstraction.
 *
 * Phase 275 Plan 01 -- RED phase.
 */

import { describe, it, expect } from 'vitest';
import {
  parseLadder,
  evaluateLadder,
  createPLCState,
  scanCycle,
  pidCompute,
  createPIDState,
  createModbusRegisters,
  readCoil,
  writeCoil,
  readHoldingRegister,
  writeHoldingRegister,
} from '../../simulator/plc-engine';

// =========================================================================
// Group 1: Ladder Logic Parser (ENG-04)
// =========================================================================

describe('parseLadder', () => {
  it('parses simple series rung', () => {
    const rungs = parseLadder('|--[ X0 ]--[ X1 ]--( Y0 )|');
    expect(rungs).toHaveLength(1);
    expect(rungs[0].branches).toHaveLength(1);
    expect(rungs[0].branches[0]).toHaveLength(2);
    expect(rungs[0].branches[0][0]).toEqual({
      type: 'contact',
      contactType: 'NO',
      address: 'X0',
    });
    expect(rungs[0].branches[0][1]).toEqual({
      type: 'contact',
      contactType: 'NO',
      address: 'X1',
    });
    expect(rungs[0].coil).toEqual({
      type: 'coil',
      coilType: 'OUT',
      address: 'Y0',
    });
  });

  it('parses NC contact', () => {
    const rungs = parseLadder('|--[/X0 ]--( Y0 )|');
    expect(rungs).toHaveLength(1);
    expect(rungs[0].branches[0]).toHaveLength(1);
    expect(rungs[0].branches[0][0]).toEqual({
      type: 'contact',
      contactType: 'NC',
      address: 'X0',
    });
  });

  it('parses SET and RESET coils', () => {
    const text = [
      '|--[ X0 ]--(S Y0)|',
      '|--[ X1 ]--(R Y0)|',
    ].join('\n');
    const rungs = parseLadder(text);
    expect(rungs).toHaveLength(2);
    expect(rungs[0].coil.coilType).toBe('SET');
    expect(rungs[0].coil.address).toBe('Y0');
    expect(rungs[1].coil.coilType).toBe('RESET');
    expect(rungs[1].coil.address).toBe('Y0');
  });

  it('handles multiple rungs', () => {
    const text = [
      '|--[ X0 ]--( Y0 )|',
      '|--[ X1 ]--( Y1 )|',
      '|--[ X2 ]--( Y2 )|',
    ].join('\n');
    const rungs = parseLadder(text);
    expect(rungs).toHaveLength(3);
  });
});

// =========================================================================
// Group 2: Ladder Logic Evaluator (ENG-04)
// =========================================================================

describe('evaluateLadder', () => {
  it('simple AND logic', () => {
    const rungs = parseLadder('|--[ X0 ]--[ X1 ]--( Y0 )|');

    // Both true -> Y0 = true
    const s1 = createPLCState();
    s1.inputs.X0 = true;
    s1.inputs.X1 = true;
    const r1 = evaluateLadder(rungs, s1);
    expect(r1.outputs.Y0).toBe(true);

    // One false -> Y0 = false
    const s2 = createPLCState();
    s2.inputs.X0 = true;
    s2.inputs.X1 = false;
    const r2 = evaluateLadder(rungs, s2);
    expect(r2.outputs.Y0).toBe(false);
  });

  it('NC contact inverts', () => {
    const rungs = parseLadder('|--[/X0 ]--( Y0 )|');

    // X0 = false -> NC closed -> Y0 = true
    const s1 = createPLCState();
    s1.inputs.X0 = false;
    const r1 = evaluateLadder(rungs, s1);
    expect(r1.outputs.Y0).toBe(true);

    // X0 = true -> NC open -> Y0 = false
    const s2 = createPLCState();
    s2.inputs.X0 = true;
    const r2 = evaluateLadder(rungs, s2);
    expect(r2.outputs.Y0).toBe(false);
  });

  it('parallel OR logic', () => {
    // Two branches: branch 1 has X0, branch 2 has X1, coil Y0
    const rung = {
      branches: [
        [{ type: 'contact' as const, contactType: 'NO' as const, address: 'X0' }],
        [{ type: 'contact' as const, contactType: 'NO' as const, address: 'X1' }],
      ],
      coil: { type: 'coil' as const, coilType: 'OUT' as const, address: 'Y0' },
    };

    // X0=true, X1=false -> Y0=true (branch 1 energized)
    const s1 = createPLCState();
    s1.inputs.X0 = true;
    s1.inputs.X1 = false;
    const r1 = evaluateLadder([rung], s1);
    expect(r1.outputs.Y0).toBe(true);

    // X0=false, X1=true -> Y0=true (branch 2 energized)
    const s2 = createPLCState();
    s2.inputs.X0 = false;
    s2.inputs.X1 = true;
    const r2 = evaluateLadder([rung], s2);
    expect(r2.outputs.Y0).toBe(true);

    // X0=false, X1=false -> Y0=false (neither branch)
    const s3 = createPLCState();
    s3.inputs.X0 = false;
    s3.inputs.X1 = false;
    const r3 = evaluateLadder([rung], s3);
    expect(r3.outputs.Y0).toBe(false);
  });

  it('SET/RESET latching', () => {
    const text = [
      '|--[ X0 ]--(S Y0)|',
      '|--[ X1 ]--(R Y0)|',
    ].join('\n');
    const rungs = parseLadder(text);

    // Set X0=true, X1=false -> Y0=true
    const s1 = createPLCState();
    s1.inputs.X0 = true;
    s1.inputs.X1 = false;
    const r1 = evaluateLadder(rungs, s1);
    expect(r1.outputs.Y0).toBe(true);

    // X0=false, X1=false -> Y0 stays true (latched)
    const s2 = { ...r1, inputs: { ...r1.inputs, X0: false, X1: false } };
    const r2 = evaluateLadder(rungs, s2);
    expect(r2.outputs.Y0).toBe(true);

    // X1=true -> Y0=false (reset)
    const s3 = { ...r2, inputs: { ...r2.inputs, X1: true } };
    const r3 = evaluateLadder(rungs, s3);
    expect(r3.outputs.Y0).toBe(false);
  });

  it('is pure -- does not mutate input state', () => {
    const rungs = parseLadder('|--[ X0 ]--( Y0 )|');
    const state = createPLCState();
    state.inputs.X0 = true;
    const original = JSON.stringify(state);

    evaluateLadder(rungs, state);

    expect(JSON.stringify(state)).toBe(original);
  });

  it('internal memory coils (M addresses)', () => {
    const text = [
      '|--[ X0 ]--( M0 )|',
      '|--[ M0 ]--( Y0 )|',
    ].join('\n');
    const rungs = parseLadder(text);

    const state = createPLCState();
    state.inputs.X0 = true;
    const result = evaluateLadder(rungs, state);

    expect(result.memory.M0).toBe(true);
    expect(result.outputs.Y0).toBe(true);
  });
});

// =========================================================================
// Group 3: PID Controller (ENG-05)
// =========================================================================

describe('pidCompute', () => {
  it('proportional only (ki=0, kd=0)', () => {
    const state = createPIDState(2.0, 0, 0, 100, 0.1);

    // error=20, P=40.0
    const { output: out1 } = pidCompute(state, 80);
    expect(out1).toBeCloseTo(40.0, 5);

    // error=0, P=0.0
    const { output: out2 } = pidCompute(state, 100);
    expect(out2).toBeCloseTo(0.0, 5);
  });

  it('integral accumulates over iterations', () => {
    // kp=0, ki=1.0, kd=0, scanTime=0.1s, setpoint=100
    let state = createPIDState(0, 1.0, 0, 100, 0.1);

    // Iteration 1: error=20, integral=20, I=1.0*0.1*20=2.0
    const r1 = pidCompute(state, 80);
    expect(r1.output).toBeCloseTo(2.0, 5);
    state = r1.newState;

    // Iteration 2: error=20, integral=40, I=1.0*0.1*40=4.0
    const r2 = pidCompute(state, 80);
    expect(r2.output).toBeCloseTo(4.0, 5);
    state = r2.newState;

    // Iteration 3: error=20, integral=60, I=1.0*0.1*60=6.0
    const r3 = pidCompute(state, 80);
    expect(r3.output).toBeCloseTo(6.0, 5);
  });

  it('derivative responds to error change', () => {
    // kp=0, ki=0, kd=1.0, scanTime=0.1s, setpoint=100
    let state = createPIDState(0, 0, 1.0, 100, 0.1);

    // Iteration 1: error=20, prevError=0, D=1.0*(20-0)/0.1=200.0
    const r1 = pidCompute(state, 80);
    expect(r1.output).toBeCloseTo(200.0, 5);
    state = r1.newState;

    // Iteration 2: error=10, prevError=20, D=1.0*(10-20)/0.1=-100.0
    const r2 = pidCompute(state, 90);
    expect(r2.output).toBeCloseTo(-100.0, 5);
  });

  it('anti-windup clamps output', () => {
    // Positive clamp: kp=10, setpoint=100, pv=0, outputMin=0, outputMax=100
    const state1 = createPIDState(10, 0, 0, 100, 0.1, 0, 100);
    const { output: out1 } = pidCompute(state1, 0);
    // error=100, P=1000 -> clamped to 100
    expect(out1).toBe(100);

    // Negative clamp: kp=10, setpoint=0, pv=100, outputMin=0, outputMax=100
    const state2 = createPIDState(10, 0, 0, 0, 0.1, 0, 100);
    const { output: out2 } = pidCompute(state2, 100);
    // error=-100, P=-1000 -> clamped to 0
    expect(out2).toBe(0);
  });

  it('full PID with all three terms', () => {
    // kp=1.0, ki=0.5, kd=0.1, scanTime=0.1, setpoint=50, min=-100, max=100
    const state = createPIDState(1.0, 0.5, 0.1, 50, 0.1, -100, 100);

    // pv=30, error=20
    // P = 1.0 * 20 = 20
    // integral = 0 + 20 = 20, I = 0.5 * 0.1 * 20 = 1.0
    // D = 0.1 * (20 - 0) / 0.1 = 20
    // output = 20 + 1.0 + 20 = 41.0
    const { output } = pidCompute(state, 30);
    expect(output).toBeCloseTo(41.0, 3);
  });
});

// =========================================================================
// Group 4: Scan Cycle and Modbus
// =========================================================================

describe('scanCycle', () => {
  it('reads inputs and evaluates ladder', () => {
    const rungs = parseLadder('|--[ X0 ]--( Y0 )|');
    const state = createPLCState();

    const r1 = scanCycle(rungs, state, { X0: true });
    expect(r1.outputs.Y0).toBe(true);

    const r2 = scanCycle(rungs, state, { X0: false });
    expect(r2.outputs.Y0).toBe(false);
  });

  it('preserves memory across cycles', () => {
    const text = [
      '|--[ X0 ]--(S M0)|',
      '|--[ M0 ]--( Y0 )|',
    ].join('\n');
    const rungs = parseLadder(text);
    const state = createPLCState();

    // Cycle 1: X0=true -> SET M0, M0 -> Y0
    const r1 = scanCycle(rungs, state, { X0: true });
    expect(r1.memory.M0).toBe(true);
    expect(r1.outputs.Y0).toBe(true);

    // Cycle 2: X0=false -> M0 still latched, Y0 still true
    const r2 = scanCycle(rungs, r1, { X0: false });
    expect(r2.memory.M0).toBe(true);
    expect(r2.outputs.Y0).toBe(true);
  });
});

describe('Modbus registers', () => {
  it('read/write coils', () => {
    const regs = createModbusRegisters();

    const regs2 = writeCoil(regs, 0, true);
    expect(readCoil(regs2, 0)).toBe(true);

    // Unwritten coil defaults to false
    expect(readCoil(regs2, 1)).toBe(false);
  });

  it('read/write holding registers', () => {
    let regs = createModbusRegisters();

    regs = writeHoldingRegister(regs, 40001, 1234);
    regs = writeHoldingRegister(regs, 40002, 5678);
    expect(readHoldingRegister(regs, 40001)).toBe(1234);
    expect(readHoldingRegister(regs, 40002)).toBe(5678);

    // Unwritten register defaults to 0
    expect(readHoldingRegister(regs, 40003)).toBe(0);
  });

  it('registers are immutable (write returns new object)', () => {
    const regs1 = createModbusRegisters();
    const regs2 = writeCoil(regs1, 0, true);

    // Original unchanged
    expect(readCoil(regs1, 0)).toBe(false);
    // New object has the write
    expect(readCoil(regs2, 0)).toBe(true);
    // Different references
    expect(regs1).not.toBe(regs2);
  });
});
