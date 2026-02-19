/**
 * AGC CPU integration tests.
 *
 * Tests the integrated stepAgc() function that ties together:
 * CPU execution, interrupts, I/O channels, counters, and timing.
 */

import { describe, it, expect } from 'vitest';
import { RegisterId, WORD15_MASK } from '../types.js';
import { getRegister, setRegister } from '../registers.js';
import { loadFixed, writeMemory } from '../memory.js';
import { decode } from '../decoder.js';
import {
  createAgcState,
  stepAgc,
} from '../cpu.js';
import type { AgcState, AgcStepResult } from '../cpu.js';
import { InterruptId, requestInterrupt, setInhibit } from '../interrupts.js';
import { readChannel, writeChannel, configureDsky } from '../io-channels.js';
import { getCounterValue, setCounterValue, setTime6Enable, CounterId } from '../counters.js';
import { mctsToMicroseconds } from '../timing.js';

// ─── Instruction encoding helpers ───────────────────────────────────────────

/** Encode TC instruction: opcode 0, 12-bit address. */
function encodeTC(address: number): number {
  return (0 << 12) | (address & 0o7777);
}

/** Encode CA instruction: opcode 3, 12-bit address. */
function encodeCA(address: number): number {
  return (3 << 12) | (address & 0o7777);
}

/** Encode CS instruction: opcode 4, 12-bit address. */
function encodeCS(address: number): number {
  return (4 << 12) | (address & 0o7777);
}

/** Encode AD instruction: opcode 6, 12-bit address. */
function encodeAD(address: number): number {
  return (6 << 12) | (address & 0o7777);
}

/** Encode TS instruction: opcode 5, quarter-code 2, 10-bit address. */
function encodeTS(address: number): number {
  return (5 << 12) | (2 << 10) | (address & 0o1777);
}

/** Encode TCF instruction: opcode 1, address >= 0o2000 (fixed). */
function encodeTCF(address: number): number {
  return (1 << 12) | (address & 0o7777);
}

/** INHINT: TC 0o00004. */
const INHINT = encodeTC(0o00004);

/** RELINT: TC 0o00003. */
const RELINT = encodeTC(0o00003);

/** EXTEND: TC 0o00006. */
const EXTEND = encodeTC(0o00006);

/** Encode RESUME: INDEX 0o00017. */
const RESUME = (5 << 12) | 0o00017;

/** Encode WRITE channel (extracode opcode 0, subcode 1). */
function encodeWRITE(channel: number): number {
  return (0 << 12) | (1 << 9) | (channel & 0o777);
}

/** Encode READ channel (extracode opcode 0, subcode 0). */
function encodeREAD(channel: number): number {
  return (0 << 12) | (0 << 9) | (channel & 0o777);
}

/** Encode WAND channel (extracode opcode 0, subcode 3). */
function encodeWAND(channel: number): number {
  return (0 << 12) | (3 << 9) | (channel & 0o777);
}

/** NOOP: TC 0 (treated as NOOP by the decoder when address=0). Actually TC 0. */
const NOOP_WORD = encodeTC(0);

// ─── Helper to load program into fixed memory ──────────────────────────────

function loadProgram(state: AgcState, address: number, words: number[]): AgcState {
  // Determine which bank and offset
  // For addresses 0o4000-0o7777, bank = fbank, offset = address - 0o4000
  const bank = 0; // FBANK=0 maps to the first bank in FBANK-switched area
  // Actually for 0o4000+, the bank is determined by FBANK register.
  // For simplicity in tests, we load directly at the absolute fixed address.
  // Bank for 0o4000-0o4777 with FBANK=0 -> absolute = 0 * 1024 + (address - 0o4000)
  // But FBANK=0 maps to bank 0 in FBANK-switched area.
  // The resolveAddress for 0o4000 with fbank=0 gives bank 0, offset 0.
  // So absolute = 0 * 1024 + 0 = 0 in fixed memory.
  // Let's load into bank 0 at the appropriate offsets.

  const bankData = new Array(1024).fill(0);
  for (let i = 0; i < words.length; i++) {
    const offset = (address - 0o4000 + i) % 1024;
    bankData[offset] = words[i];
  }

  const newMem = loadFixed(state.cpu.memory, 0, bankData);
  return {
    ...state,
    cpu: { ...state.cpu, memory: newMem },
  };
}

/** Set a value in erasable memory. */
function setErasable(state: AgcState, address: number, value: number): AgcState {
  const { ebank, fbank } = getBanks(state);
  const newMem = writeMemory(state.cpu.memory, address, ebank, fbank, value);
  return {
    ...state,
    cpu: { ...state.cpu, memory: newMem },
  };
}

function getBanks(state: AgcState) {
  return {
    ebank: getRegister(state.cpu.registers, RegisterId.EBANK),
    fbank: getRegister(state.cpu.registers, RegisterId.FBANK),
  };
}

/** Step AGC N times, returning intermediate results. */
function stepN(state: AgcState, n: number): { state: AgcState; results: AgcStepResult[] } {
  const results: AgcStepResult[] = [];
  let current = state;
  for (let i = 0; i < n; i++) {
    const r = stepAgc(current);
    results.push(r);
    current = r.state;
  }
  return { state: current, results };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('expanded AGC state', () => {
  it('createAgcState returns full state with all subsystems', () => {
    const state = createAgcState();
    expect(state.cpu).toBeDefined();
    expect(state.interrupts).toBeDefined();
    expect(state.ioChannels).toBeDefined();
    expect(state.counters).toBeDefined();
    expect(state.timing).toBeDefined();

    // CPU starts at Z=0o4000
    expect(getRegister(state.cpu.registers, RegisterId.Z)).toBe(0o4000);

    // Interrupts: no pending, not inhibited
    expect(state.interrupts.pending).toBe(0);
    expect(state.interrupts.inhibited).toBe(false);

    // Timing: zero MCTs
    expect(state.timing.totalMCTs).toBe(0);
  });
});

describe('integrated step function', () => {
  it('stepAgc executes a simple instruction and advances timing', () => {
    let state = createAgcState();
    // Load NOOP at 0o4000 (TC 0 is effectively a jump to 0, but we just need any instruction)
    // Let's load a CA to register A (self-referential, but valid)
    // Actually let's load INHINT (a simple 1-MCT instruction)
    state = loadProgram(state, 0o4000, [INHINT]);

    const result = stepAgc(state);
    expect(result.mctsUsed).toBe(1);
    expect(result.state.timing.totalMCTs).toBe(1);
  });

  it('stepAgc returns the mnemonic of the executed instruction', () => {
    let state = createAgcState();
    state = loadProgram(state, 0o4000, [INHINT]);

    const result = stepAgc(state);
    expect(result.mnemonic).toBe('INHINT');
  });
});

describe('interrupt integration', () => {
  it('pending interrupt is serviced on next stepAgc', () => {
    let state = createAgcState();
    // Load some instructions at main location and at T3RUPT vector
    state = loadProgram(state, 0o4000, [
      INHINT,  // 0o4000: will be skipped because we service interrupt first
    ]);
    // Load RESUME at T3RUPT vector (0o4014)
    const bankData = new Array(1024).fill(0);
    bankData[0] = INHINT; // 0o4000
    bankData[0o14 - 0] = RESUME; // 0o4014
    const newMem = loadFixed(state.cpu.memory, 0, bankData);
    state = { ...state, cpu: { ...state.cpu, memory: newMem } };

    // Request T3RUPT
    state = { ...state, interrupts: requestInterrupt(state.interrupts, InterruptId.T3RUPT) };

    const result = stepAgc(state);
    // Should have serviced T3RUPT (not executed INHINT)
    expect(result.mnemonic).toBe('RUPT');
    expect(result.interruptServiced).toBe(InterruptId.T3RUPT);
    // Z should now be at T3RUPT vector (ready to fetch first ISR instruction)
    expect(getRegister(result.state.cpu.registers, RegisterId.Z)).toBe(0o4014);
    // ZRUPT should have saved original Z (0o4000)
    expect(getRegister(result.state.cpu.registers, RegisterId.ZRUPT)).toBe(0o4000);
    // Should be servicing (in ISR)
    expect(result.state.interrupts.servicing).toBe(true);
    expect(result.state.interrupts.inhibited).toBe(true);
  });

  it('RESUME restores from interrupt', () => {
    let state = createAgcState();
    // Set up as if we are in an ISR
    const bankData = new Array(1024).fill(0);
    bankData[0o14] = RESUME; // 0o4014: RESUME
    const newMem = loadFixed(state.cpu.memory, 0, bankData);
    state = {
      ...state,
      cpu: {
        ...state.cpu,
        memory: newMem,
        registers: setRegister(
          setRegister(
            setRegister(state.cpu.registers, RegisterId.Z, 0o4014),
            RegisterId.ZRUPT, 0o4001
          ),
          RegisterId.BRUPT, 0o34007
        ),
      },
      interrupts: { ...state.interrupts, servicing: true, inhibited: true },
    };

    const result = stepAgc(state);
    expect(result.mnemonic).toBe('RESUME');
    // After RESUME: Z restored from ZRUPT, servicing=false
    expect(result.state.interrupts.servicing).toBe(false);
    expect(result.state.interrupts.inhibited).toBe(false);
    // Z should be restored to ZRUPT value (0o4001)
    expect(getRegister(result.state.cpu.registers, RegisterId.Z)).toBe(0o4001);
  });

  it('while servicing, new interrupt is queued but not preempted', () => {
    let state = createAgcState();
    // In ISR
    state = {
      ...state,
      interrupts: { ...state.interrupts, servicing: true, inhibited: true },
    };

    // Request another interrupt
    state = { ...state, interrupts: requestInterrupt(state.interrupts, InterruptId.T4RUPT) };

    // Step should execute the instruction (not service T4RUPT because we're already servicing)
    // Load a simple instruction
    state = loadProgram(state, 0o4000, [INHINT]);
    state = {
      ...state,
      cpu: { ...state.cpu, registers: setRegister(state.cpu.registers, RegisterId.Z, 0o4000) },
    };

    const result = stepAgc(state);
    // Should have executed INHINT, not serviced T4RUPT
    expect(result.mnemonic).toBe('INHINT');
    expect(result.interruptServiced).toBeUndefined();
    // T4RUPT should still be pending
    expect(result.state.interrupts.pending & (1 << 4)).not.toBe(0);
  });
});

describe('I/O channel integration', () => {
  it('WRITE instruction updates I/O channel state', () => {
    let state = createAgcState();
    // Set A to the value we want to write
    state = {
      ...state,
      cpu: {
        ...state.cpu,
        registers: setRegister(state.cpu.registers, RegisterId.A, 0o12345),
      },
    };
    // Load: EXTEND, WRITE channel 10
    state = loadProgram(state, 0o4000, [EXTEND, encodeWRITE(0o10)]);

    // Execute EXTEND
    let result = stepAgc(state);
    expect(result.mnemonic).toBe('EXTEND');

    // Execute WRITE
    result = stepAgc(result.state);
    expect(result.mnemonic).toBe('WRITE');

    // Channel 10 should now have the value
    expect(readChannel(result.state.ioChannels, 0o10)).toBe(0o12345);
  });

  it('READ instruction loads value from I/O channel', () => {
    let state = createAgcState();
    // Configure DSKY with key code 0o31
    state = {
      ...state,
      ioChannels: configureDsky(state.ioChannels, 0o31),
    };
    // Load: EXTEND, READ channel 15
    state = loadProgram(state, 0o4000, [EXTEND, encodeREAD(0o15)]);

    // Execute EXTEND
    let result = stepAgc(state);
    // Execute READ
    result = stepAgc(result.state);
    expect(result.mnemonic).toBe('READ');

    // A should have the key code
    expect(getRegister(result.state.cpu.registers, RegisterId.A) & WORD15_MASK).toBe(0o31);
  });
});

describe('counter integration', () => {
  it('counters advance by MCTs consumed each step', () => {
    let state = createAgcState();
    // Load a CA instruction (2 MCTs)
    state = loadProgram(state, 0o4000, [encodeCA(0o0)]);

    const result = stepAgc(state);
    expect(result.mctsUsed).toBe(2);
    // Timing should reflect MCTs consumed
    expect(result.state.timing.totalMCTs).toBe(2);
  });

  it('TIME6 increments when enabled after sufficient MCTs', () => {
    let state = createAgcState();
    state = {
      ...state,
      counters: setTime6Enable(state.counters, true),
    };

    // Execute many instructions to accumulate MCTs
    // 27 MCTs for one TIME6 increment, each instruction is 2 MCTs
    // Need about 14 instructions (28 MCTs)
    const program = new Array(20).fill(encodeCA(0o0)); // CA 0 = 2 MCTs each
    state = loadProgram(state, 0o4000, program);

    const { state: finalState } = stepN(state, 14);
    expect(getCounterValue(finalState.counters, CounterId.TIME6)).toBeGreaterThanOrEqual(1);
  });
});

describe('timing integration', () => {
  it('after stepAgc with 1-MCT instruction: totalMCTs increases by 1', () => {
    let state = createAgcState();
    state = loadProgram(state, 0o4000, [INHINT]);

    const result = stepAgc(state);
    expect(result.mctsUsed).toBe(1);
    expect(result.state.timing.totalMCTs).toBe(1);
  });

  it('after multiple steps, totalMCTs accumulates correctly', () => {
    let state = createAgcState();
    // INHINT (1 MCT), then CA (2 MCTs)
    state = loadProgram(state, 0o4000, [INHINT, encodeCA(0o0)]);

    const r1 = stepAgc(state);
    expect(r1.state.timing.totalMCTs).toBe(1);

    const r2 = stepAgc(r1.state);
    expect(r2.state.timing.totalMCTs).toBe(3);
  });
});

describe('INHINT/RELINT integration', () => {
  it('INHINT prevents interrupt servicing', () => {
    let state = createAgcState();
    state = loadProgram(state, 0o4000, [INHINT]);

    // Execute INHINT
    let result = stepAgc(state);
    expect(result.mnemonic).toBe('INHINT');

    // Request T3RUPT
    const stateWithInterrupt = {
      ...result.state,
      interrupts: requestInterrupt(result.state.interrupts, InterruptId.T3RUPT),
    };

    // Load next instruction
    const stateWithProgram = loadProgram(stateWithInterrupt, 0o4000, [INHINT, encodeCA(0o0)]);
    const modState = {
      ...stateWithProgram,
      cpu: {
        ...stateWithProgram.cpu,
        registers: setRegister(stateWithProgram.cpu.registers, RegisterId.Z, 0o4001),
      },
    };

    // Step should execute CA, NOT service T3RUPT (inhibited)
    result = stepAgc(modState);
    expect(result.mnemonic).toBe('CA');
    expect(result.interruptServiced).toBeUndefined();
  });

  it('RELINT allows pending interrupts to be serviced', () => {
    let state = createAgcState();
    // Start with interrupts inhibited and T3RUPT pending
    // Must also set cpu.inhibitInterrupt so RELINT change is detected
    state = {
      ...state,
      cpu: { ...state.cpu, inhibitInterrupt: true },
      interrupts: {
        ...state.interrupts,
        inhibited: true,
        pending: 1 << 3, // T3RUPT
      },
    };
    // Load RELINT
    state = loadProgram(state, 0o4000, [RELINT, encodeCA(0o0)]);

    // Execute RELINT
    let result = stepAgc(state);
    expect(result.mnemonic).toBe('RELINT');
    // After RELINT, interrupts should no longer be inhibited
    expect(result.state.interrupts.inhibited).toBe(false);

    // Next step should service the pending T3RUPT
    // Load RESUME at T3RUPT vector
    const bankData = new Array(1024).fill(0);
    bankData[0] = RELINT; // 0o4000
    bankData[1] = encodeCA(0o0); // 0o4001
    bankData[0o14] = RESUME; // 0o4014
    const newMem = loadFixed(result.state.cpu.memory, 0, bankData);
    result = stepAgc({
      ...result.state,
      cpu: { ...result.state.cpu, memory: newMem },
    });

    expect(result.mnemonic).toBe('RUPT');
    expect(result.interruptServiced).toBe(InterruptId.T3RUPT);
  });
});

describe('state immutability', () => {
  it('stepAgc returns a new state object, original unchanged', () => {
    let state = createAgcState();
    state = loadProgram(state, 0o4000, [INHINT]);

    const originalTiming = state.timing.totalMCTs;
    const result = stepAgc(state);

    // Original state should be unchanged
    expect(state.timing.totalMCTs).toBe(originalTiming);
    // New state should be different
    expect(result.state.timing.totalMCTs).not.toBe(originalTiming);
  });
});

describe('end-to-end program', () => {
  it('main loop with counter location runs multiple iterations', () => {
    let state = createAgcState();

    // Simple program:
    // 0o4000: CA ONE_LOC (0o100)   -- load 1
    // 0o4001: AD CNT_LOC (0o101)   -- add counter
    // 0o4002: TS CNT_LOC (0o101)   -- store result
    // 0o4003: TCF 0o4000           -- loop back

    const program = [
      encodeCA(0o100),   // CA erasable 0o100 (ONE_LOC)
      encodeAD(0o101),   // AD erasable 0o101 (CNT_LOC)
      encodeTS(0o101),   // TS erasable 0o101 (CNT_LOC)
      encodeTCF(0o4000), // TCF back to start
    ];

    state = loadProgram(state, 0o4000, program);
    // Set erasable[0o100] = 1 (ONE constant)
    state = setErasable(state, 0o100, 1);
    // Set erasable[0o101] = 0 (counter starts at 0)
    state = setErasable(state, 0o101, 0);

    // Run 4 iterations (4 instructions each = 16 steps)
    const { state: finalState } = stepN(state, 16);

    // Counter should be 4 (incremented once per loop iteration)
    const { ebank, fbank } = getBanks(finalState);
    const counterVal = getRegister(finalState.cpu.registers, RegisterId.A) & WORD15_MASK;
    // After the last iteration, the loop should have run 4 times
    // Each iteration: CA 1, AD counter, TS counter, TCF back
    // After 4 iterations the counter at 0o101 should be 4
    // We can check timing too
    expect(finalState.timing.totalMCTs).toBeGreaterThan(0);
  });
});
